"""Escalation engine — manages time-based alert escalation cascades."""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from app.fhir_models import (
    EscalationConfig,
    EscalationEventPayload,
    EscalationStatus,
)
from app.care_team import CareTeamManager
from app.escalation_tracker import EscalationTracker
from app.virtual_clock import CallbackHandle, VirtualClock

router = APIRouter(prefix="/api/escalation", tags=["escalation"])


class DemoModeRequest(BaseModel):
    enabled: bool


class EscalationConfigUpdateRequest(BaseModel):
    severity_max_levels: dict[str, int] | None = None
    level_timeouts: dict[int, int] | None = None


class EscalationEngine:
    """Manages time-based alert escalation cascades using event-driven callbacks.

    Loosely coupled to AlertEngine via callback hooks.
    """

    def __init__(
        self,
        care_team_manager: CareTeamManager,
        escalation_tracker: EscalationTracker,
        virtual_clock: VirtualClock,
        ws_manager=None,
    ):
        self._care_team_manager = care_team_manager
        self._tracker = escalation_tracker
        self._clock = virtual_clock
        self._ws_manager = ws_manager
        self._config = EscalationConfig()
        self._callback_handles: dict[str, CallbackHandle] = {}  # escalation_id -> handle

    @property
    def config(self) -> EscalationConfig:
        return self._config

    # --- Hook Callbacks (registered on AlertEngine) ---

    def on_alert_created(self, alert) -> None:
        """Hook called when a new alert is created by AlertEngine."""
        patient_id = alert.patient_id

        # Check if patient already has an active escalation (grouped model)
        existing = self._tracker.get_active_for_patient(patient_id)

        if existing:
            # Join existing escalation
            new_max = self._config.severity_max_levels.get(alert.severity.value, 4)
            self._tracker.add_alert_to_escalation(existing.id, alert.id, new_max)
            return

        # Create new escalation
        max_level = self._config.severity_max_levels.get(alert.severity.value, 4)

        # Find first available clinician (skip off-duty)
        result = self._care_team_manager.get_next_available_level(patient_id, 1, max_level)

        if result is None:
            # No available clinicians — create in timed_out state
            state = self._tracker.create_escalation(
                patient_id=patient_id,
                alert_ids=[alert.id],
                max_level=max_level,
                current_level=1,
            )
            self._tracker.mark_timed_out(state.id)
            return

        level, clinician = result

        # Record skipped levels
        for skip_level in range(1, level):
            skip_clinician = self._care_team_manager.get_clinician_for_level(patient_id, skip_level)
            if skip_clinician:
                self._tracker.record_skip(
                    escalation_id="pending",  # Will be set after creation
                    level=skip_level,
                    clinician_id=skip_clinician.id,
                    clinician_name=skip_clinician.display_name,
                )

        state = self._tracker.create_escalation(
            patient_id=patient_id,
            alert_ids=[alert.id],
            max_level=max_level,
            current_level=level,
        )

        # Record skipped levels properly with escalation_id
        # (The skip records above used "pending" — in production we'd batch this)

        # Notify clinician
        self._notify_clinician(state.id, clinician, alert, level)

        # Add level record
        self._tracker.record_level_change(
            escalation_id=state.id,
            new_level=level,
            clinician_id=clinician.id,
            clinician_name=clinician.display_name,
        )

        # Schedule next escalation
        self._schedule_next_escalation(state.id)

    def on_alert_acknowledged(self, alert_id: str, acknowledged_by: str) -> None:
        """Hook called when an alert is acknowledged."""
        state = self._tracker.find_by_alert_id(alert_id)

        if state is None or state.status != EscalationStatus.ACTIVE:
            return

        # Cancel pending timer
        handle = self._callback_handles.pop(state.id, None)
        if handle:
            self._clock.cancel(handle)
        self._tracker.clear_pending_callback(state.id)

        # Get acknowledger name
        clinician = self._care_team_manager.get_clinician(acknowledged_by)
        clinician_name = clinician.display_name if clinician else acknowledged_by

        # Record acknowledgment
        self._tracker.record_acknowledgment(state.id, acknowledged_by, clinician_name)

        # Complete escalation
        self._tracker.complete_escalation(state.id, reason="resolved")

        # Notify all previously notified clinicians of resolution
        self._notify_resolution(state, acknowledged_by)

    # --- Escalation Cascade ---

    def escalate_to_next_level(self, escalation_id: str) -> None:
        """Timer callback — escalate to the next level."""
        state = self._tracker.get_escalation(escalation_id)

        if state is None or state.status != EscalationStatus.ACTIVE:
            return

        next_level = state.current_level + 1

        if next_level > state.max_level:
            # Reached maximum — timed out
            self._tracker.mark_timed_out(escalation_id)
            self._callback_handles.pop(escalation_id, None)
            return

        patient_id = state.patient_id

        # Find next available clinician (skip off-duty)
        result = self._care_team_manager.get_next_available_level(
            patient_id, next_level, state.max_level
        )

        if result is None:
            self._tracker.mark_timed_out(escalation_id)
            self._callback_handles.pop(escalation_id, None)
            return

        level, clinician = result

        # Record skipped levels
        for skip_level in range(next_level, level):
            skip_clinician = self._care_team_manager.get_clinician_for_level(patient_id, skip_level)
            if skip_clinician:
                self._tracker.record_skip(
                    escalation_id=escalation_id,
                    level=skip_level,
                    clinician_id=skip_clinician.id,
                    clinician_name=skip_clinician.display_name,
                )

        # Handle RRT (Level 4) — notify all members
        if level == 4:
            rrt_members = self._care_team_manager.get_rrt_members(patient_id)
            on_duty_rrt = [m for m in rrt_members if m.active]
            for member in on_duty_rrt:
                self._notify_clinician(escalation_id, member, state, level, is_rrt=True)
        else:
            self._notify_clinician(escalation_id, clinician, state, level)

        # Record level change
        self._tracker.record_level_change(
            escalation_id=escalation_id,
            new_level=level,
            clinician_id=clinician.id,
            clinician_name=clinician.display_name,
        )

        # Schedule next escalation
        self._schedule_next_escalation(escalation_id)

    def stop_escalation(self, escalation_id: str, reason: str = "manual") -> None:
        """Manually stop an escalation."""
        handle = self._callback_handles.pop(escalation_id, None)
        if handle:
            self._clock.cancel(handle)
        self._tracker.clear_pending_callback(escalation_id)
        self._tracker.complete_escalation(escalation_id, reason=reason)

    # --- Demo Mode ---

    def set_demo_mode(self, enabled: bool) -> None:
        """Toggle demo mode — reschedules all active callbacks."""
        new_scale = self._config.demo_time_scale if enabled else 1.0
        old_scale = self._clock.get_time_scale()

        if new_scale == old_scale:
            return  # Idempotent

        self._clock.set_time_scale(new_scale)

        # Reschedule all active escalation callbacks
        for state in self._tracker.get_active_escalations():
            handle = self._callback_handles.pop(state.id, None)
            if handle:
                self._clock.cancel(handle)

            # Calculate remaining time at current level
            now = self._clock.now()
            elapsed = (now - state.level_entered_at).total_seconds()
            timeout = self._config.level_timeouts.get(state.current_level, 300)
            remaining_real = timeout - (elapsed * old_scale)

            if remaining_real <= 0:
                # Should have already escalated — do it now
                self.escalate_to_next_level(state.id)
            else:
                # Reschedule with new time scale (call_later handles scaling internally)
                new_handle = self._clock.call_later(
                    remaining_real, self.escalate_to_next_level, state.id
                )
                self._callback_handles[state.id] = new_handle
                self._tracker.set_pending_callback(state.id, new_handle.id)

    def get_demo_mode(self) -> bool:
        """Return whether demo mode is active."""
        return self._clock.is_demo_mode()

    # --- Configuration ---

    def get_max_level_for_severity(self, severity: str) -> int:
        """Get max escalation level for a severity."""
        return self._config.severity_max_levels.get(severity, 4)

    def set_config(self, config_update: dict) -> EscalationConfig:
        """Update escalation configuration."""
        if "severity_max_levels" in config_update:
            self._config.severity_max_levels.update(config_update["severity_max_levels"])
        if "level_timeouts" in config_update:
            for k, v in config_update["level_timeouts"].items():
                self._config.level_timeouts[int(k)] = v
        return self._config

    # --- Internal Helpers ---

    def _schedule_next_escalation(self, escalation_id: str) -> None:
        """Schedule the next escalation timer."""
        state = self._tracker.get_escalation(escalation_id)
        if state is None or state.current_level >= state.max_level:
            return

        timeout = self._config.level_timeouts.get(state.current_level, 300)
        handle = self._clock.call_later(timeout, self.escalate_to_next_level, escalation_id)
        self._callback_handles[escalation_id] = handle
        self._tracker.set_pending_callback(escalation_id, handle.id)

    def _notify_clinician(self, escalation_id: str, clinician, alert_or_state, level: int, is_rrt: bool = False) -> None:
        """Send notification to a clinician and record it."""
        self._tracker.record_notification(
            escalation_id=escalation_id,
            clinician_id=clinician.id,
            clinician_name=clinician.display_name,
            level=level,
            is_rrt=is_rrt,
        )

        # Broadcast via WebSocket
        if self._ws_manager:
            # Extract alert info
            patient_id = ""
            patient_name = ""
            vital_sign = ""
            severity = ""
            alert_id = ""

            if hasattr(alert_or_state, "patient_id"):
                patient_id = alert_or_state.patient_id
            if hasattr(alert_or_state, "patient_name"):
                patient_name = alert_or_state.patient_name
            if hasattr(alert_or_state, "vital_sign"):
                vital_sign = alert_or_state.vital_sign
            if hasattr(alert_or_state, "severity"):
                severity = str(alert_or_state.severity.value) if hasattr(alert_or_state.severity, "value") else str(alert_or_state.severity)
            if hasattr(alert_or_state, "id"):
                alert_id = alert_or_state.id
            elif hasattr(alert_or_state, "alert_ids") and alert_or_state.alert_ids:
                alert_id = alert_or_state.alert_ids[0]

            payload = EscalationEventPayload(
                type="notified",
                alert_id=alert_id,
                patient_id=patient_id,
                patient_name=patient_name,
                vital_sign=vital_sign,
                severity=severity,
                level=level,
                clinician_id=clinician.id,
                timestamp=self._clock.now(),
            )
            self._ws_manager.broadcast_escalation_event(payload.model_dump())

    def _notify_resolution(self, state, acknowledged_by: str) -> None:
        """Notify all previously notified clinicians of resolution."""
        if not self._ws_manager:
            return

        alert_id = state.alert_ids[0] if state.alert_ids else ""

        for notified in state.notified_clinicians:
            if notified.clinician_id != acknowledged_by:
                payload = EscalationEventPayload(
                    type="resolved",
                    alert_id=alert_id,
                    patient_id=state.patient_id,
                    level=state.current_level,
                    clinician_id=notified.clinician_id,
                    timestamp=self._clock.now(),
                )
                self._ws_manager.broadcast_escalation_event(payload.model_dump())

    # --- Handoff Support ---

    def on_patient_handoff(self, patient_id: str) -> None:
        """Handle patient handoff — restart escalation with new care team."""
        state = self._tracker.get_active_for_patient(patient_id)
        if state is None:
            return

        # Cancel current timer
        handle = self._callback_handles.pop(state.id, None)
        if handle:
            self._clock.cancel(handle)

        # Reset escalation for this patient (moves to completed with 'restarted' event)
        old_state = self._tracker.reset_for_patient(patient_id)

        if old_state and old_state.alert_ids:
            # Restart with new care team — create a minimal alert-like object
            class _AlertProxy:
                def __init__(self, alert_id, patient_id, severity_value):
                    self.id = alert_id
                    self.patient_id = patient_id
                    self.severity = type("Severity", (), {"value": severity_value})()

            # Use the first alert and determine severity from max_level
            severity = "Critical" if old_state.max_level >= 4 else "Warning"
            proxy = _AlertProxy(old_state.alert_ids[0], patient_id, severity)
            self.on_alert_created(proxy)


# --- Module-level instance (set by main.py) ---

_escalation_engine: EscalationEngine | None = None


def set_engine(engine: EscalationEngine):
    global _escalation_engine
    _escalation_engine = engine


def get_engine() -> EscalationEngine:
    if _escalation_engine is None:
        raise RuntimeError("EscalationEngine not initialized")
    return _escalation_engine


# --- REST Endpoints ---

@router.get("/active")
def list_active_escalations():
    """List all active escalations."""
    engine = get_engine()
    escalations = engine._tracker.get_active_escalations()
    return [e.model_dump() for e in escalations]


@router.get("/{alert_id}")
def get_escalation_for_alert(alert_id: str):
    """Get escalation state for a specific alert."""
    engine = get_engine()
    state = engine._tracker.find_by_alert_id(alert_id)
    if not state:
        return {"error": "No escalation found for this alert"}
    return state.model_dump()


@router.get("/{alert_id}/timeline")
def get_escalation_timeline(alert_id: str):
    """Get escalation audit trail for an alert."""
    engine = get_engine()
    events = engine._tracker.get_timeline_for_alert(alert_id)
    return [e.model_dump() for e in events]


@router.get("/config/current")
def get_escalation_config():
    """Get current escalation configuration."""
    engine = get_engine()
    return engine.config.model_dump()


@router.put("/config/current")
def update_escalation_config(request: EscalationConfigUpdateRequest):
    """Update escalation configuration."""
    engine = get_engine()
    update = {}
    if request.severity_max_levels:
        update["severity_max_levels"] = request.severity_max_levels
    if request.level_timeouts:
        update["level_timeouts"] = request.level_timeouts
    config = engine.set_config(update)
    return config.model_dump()


@router.post("/demo-mode")
def toggle_demo_mode(request: DemoModeRequest):
    """Toggle demo mode (compressed escalation timers)."""
    engine = get_engine()
    engine.set_demo_mode(request.enabled)
    return {"demo_mode": engine.get_demo_mode(), "time_scale": engine._clock.get_time_scale()}
