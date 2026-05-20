"""Escalation state tracker — manages all active escalation states and audit trail."""

import uuid
from datetime import datetime, timezone

from app.fhir_models import (
    EscalationEvent,
    EscalationEventType,
    EscalationLevelRecord,
    EscalationState,
    EscalationStatus,
    NotifiedClinician,
)


class EscalationTracker:
    """Manages all active and completed escalation states.

    Provides query methods, state transitions, and audit trail recording.
    Uses grouped model: one EscalationState per patient.
    """

    def __init__(self):
        self._active: dict[str, EscalationState] = {}  # escalation_id -> state
        self._completed: list[EscalationState] = []
        self._events: list[EscalationEvent] = []
        self._patient_index: dict[str, str] = {}  # patient_id -> escalation_id
        self._alert_index: dict[str, str] = {}  # alert_id -> escalation_id

    def create_escalation(
        self,
        patient_id: str,
        alert_ids: list[str],
        max_level: int,
        current_level: int = 1,
        started_at: datetime | None = None,
    ) -> EscalationState:
        """Create a new escalation state for a patient."""
        now = started_at or datetime.now(timezone.utc)
        escalation_id = str(uuid.uuid4())

        state = EscalationState(
            id=escalation_id,
            patient_id=patient_id,
            alert_ids=alert_ids,
            current_level=current_level,
            max_level=max_level,
            status=EscalationStatus.ACTIVE,
            started_at=now,
            level_entered_at=now,
        )

        self._active[escalation_id] = state
        self._patient_index[patient_id] = escalation_id
        for alert_id in alert_ids:
            self._alert_index[alert_id] = escalation_id

        # Record start event
        self._record_event(
            escalation_id=escalation_id,
            alert_id=alert_ids[0] if alert_ids else "",
            event_type=EscalationEventType.STARTED,
            level=current_level,
            timestamp=now,
        )

        return state

    def get_escalation(self, escalation_id: str) -> EscalationState | None:
        """Get escalation state by ID."""
        return self._active.get(escalation_id)

    def get_active_for_patient(self, patient_id: str) -> EscalationState | None:
        """Get active escalation for a patient (grouped model)."""
        escalation_id = self._patient_index.get(patient_id)
        if escalation_id:
            return self._active.get(escalation_id)
        return None

    def find_by_alert_id(self, alert_id: str) -> EscalationState | None:
        """Find escalation containing a specific alert."""
        escalation_id = self._alert_index.get(alert_id)
        if escalation_id:
            state = self._active.get(escalation_id)
            if state:
                return state
            # Check completed
            for s in self._completed:
                if s.id == escalation_id:
                    return s
        return None

    def get_active_escalations(self) -> list[EscalationState]:
        """Return all active escalations."""
        return list(self._active.values())

    def get_escalations_for_patient(self, patient_id: str) -> list[EscalationState]:
        """Return all escalations (active + completed) for a patient."""
        results = []
        # Active
        active = self.get_active_for_patient(patient_id)
        if active:
            results.append(active)
        # Completed
        results.extend(s for s in self._completed if s.patient_id == patient_id)
        return results

    def get_escalations_for_clinician(self, clinician_id: str) -> list[EscalationState]:
        """Return all escalations where a clinician was notified."""
        results = []
        all_states = list(self._active.values()) + self._completed
        for state in all_states:
            if any(nc.clinician_id == clinician_id for nc in state.notified_clinicians):
                results.append(state)
        return results

    def add_alert_to_escalation(self, escalation_id: str, alert_id: str, new_max_level: int | None = None) -> None:
        """Add an alert to an existing grouped escalation."""
        state = self._active.get(escalation_id)
        if state is None:
            return

        if alert_id not in state.alert_ids:
            state.alert_ids.append(alert_id)
            self._alert_index[alert_id] = escalation_id

        if new_max_level and new_max_level > state.max_level:
            state.max_level = new_max_level

        self._record_event(
            escalation_id=escalation_id,
            alert_id=alert_id,
            event_type=EscalationEventType.ALERT_JOINED,
            level=state.current_level,
            timestamp=datetime.now(timezone.utc),
        )

    def record_level_change(
        self,
        escalation_id: str,
        new_level: int,
        clinician_id: str,
        clinician_name: str,
        timestamp: datetime | None = None,
    ) -> None:
        """Record a level transition."""
        state = self._active.get(escalation_id)
        if state is None:
            return

        now = timestamp or datetime.now(timezone.utc)

        # Close current level record
        if state.level_history:
            current_record = state.level_history[-1]
            if current_record.exited_at is None:
                current_record.exited_at = now
                current_record.response_time_seconds = (
                    now - current_record.entered_at
                ).total_seconds()

        # Add new level record
        state.level_history.append(
            EscalationLevelRecord(
                level=new_level,
                clinician_id=clinician_id,
                clinician_name=clinician_name,
                entered_at=now,
            )
        )

        state.current_level = new_level
        state.level_entered_at = now

        self._record_event(
            escalation_id=escalation_id,
            alert_id=state.alert_ids[0] if state.alert_ids else "",
            event_type=EscalationEventType.ESCALATED,
            level=new_level,
            clinician_id=clinician_id,
            clinician_name=clinician_name,
            timestamp=now,
        )

    def record_notification(
        self,
        escalation_id: str,
        clinician_id: str,
        clinician_name: str,
        level: int,
        is_rrt: bool = False,
        timestamp: datetime | None = None,
    ) -> None:
        """Record that a clinician was notified."""
        state = self._active.get(escalation_id)
        if state is None:
            return

        now = timestamp or datetime.now(timezone.utc)

        state.notified_clinicians.append(
            NotifiedClinician(
                clinician_id=clinician_id,
                clinician_name=clinician_name,
                level=level,
                notified_at=now,
                is_rrt_member=is_rrt,
            )
        )

        self._record_event(
            escalation_id=escalation_id,
            alert_id=state.alert_ids[0] if state.alert_ids else "",
            event_type=EscalationEventType.NOTIFIED,
            level=level,
            clinician_id=clinician_id,
            clinician_name=clinician_name,
            timestamp=now,
        )

    def record_skip(
        self,
        escalation_id: str,
        level: int,
        clinician_id: str,
        clinician_name: str,
        timestamp: datetime | None = None,
    ) -> None:
        """Record that a level was skipped (clinician off-duty)."""
        state = self._active.get(escalation_id)
        if state is None:
            return

        now = timestamp or datetime.now(timezone.utc)

        state.level_history.append(
            EscalationLevelRecord(
                level=level,
                clinician_id=clinician_id,
                clinician_name=clinician_name,
                entered_at=now,
                exited_at=now,
                response_time_seconds=0.0,
                skipped=True,
            )
        )

        self._record_event(
            escalation_id=escalation_id,
            alert_id=state.alert_ids[0] if state.alert_ids else "",
            event_type=EscalationEventType.SKIPPED,
            level=level,
            clinician_id=clinician_id,
            clinician_name=clinician_name,
            timestamp=now,
        )

    def record_acknowledgment(
        self,
        escalation_id: str,
        clinician_id: str,
        clinician_name: str = "",
        timestamp: datetime | None = None,
    ) -> None:
        """Record that an escalation was acknowledged."""
        state = self._active.get(escalation_id)
        if state is None:
            return

        now = timestamp or datetime.now(timezone.utc)

        # Close current level record
        if state.level_history:
            current_record = state.level_history[-1]
            if current_record.exited_at is None:
                current_record.exited_at = now
                current_record.response_time_seconds = (
                    now - current_record.entered_at
                ).total_seconds()

        state.status = EscalationStatus.RESOLVED
        state.resolved_by = clinician_id
        state.resolved_at = now

        self._record_event(
            escalation_id=escalation_id,
            alert_id=state.alert_ids[0] if state.alert_ids else "",
            event_type=EscalationEventType.ACKNOWLEDGED,
            level=state.current_level,
            clinician_id=clinician_id,
            clinician_name=clinician_name,
            timestamp=now,
        )

    def complete_escalation(self, escalation_id: str, reason: str = "resolved") -> None:
        """Move escalation from active to completed."""
        state = self._active.pop(escalation_id, None)
        if state is None:
            return

        # Remove from patient index
        if self._patient_index.get(state.patient_id) == escalation_id:
            del self._patient_index[state.patient_id]

        self._completed.append(state)

        if reason == "resolved":
            self._record_event(
                escalation_id=escalation_id,
                alert_id=state.alert_ids[0] if state.alert_ids else "",
                event_type=EscalationEventType.RESOLVED,
                level=state.current_level,
                timestamp=datetime.now(timezone.utc),
            )

    def mark_timed_out(self, escalation_id: str) -> None:
        """Mark an escalation as timed out (reached max level with no response)."""
        state = self._active.get(escalation_id)
        if state:
            state.status = EscalationStatus.TIMED_OUT
            self.complete_escalation(escalation_id, reason="timed_out")

    def set_pending_callback(self, escalation_id: str, handle_id: str) -> None:
        """Store the callback handle ID for an escalation."""
        state = self._active.get(escalation_id)
        if state:
            state.pending_callback_handle = handle_id

    def get_pending_callback(self, escalation_id: str) -> str | None:
        """Get the pending callback handle ID."""
        state = self._active.get(escalation_id)
        if state:
            return state.pending_callback_handle
        return None

    def clear_pending_callback(self, escalation_id: str) -> None:
        """Clear the pending callback handle."""
        state = self._active.get(escalation_id)
        if state:
            state.pending_callback_handle = None

    def get_escalation_timeline(self, escalation_id: str) -> list[EscalationEvent]:
        """Get all events for an escalation (audit trail)."""
        return [e for e in self._events if e.escalation_id == escalation_id]

    def get_timeline_for_alert(self, alert_id: str) -> list[EscalationEvent]:
        """Get all events related to a specific alert."""
        escalation_id = self._alert_index.get(alert_id)
        if escalation_id:
            return self.get_escalation_timeline(escalation_id)
        return []

    def get_response_times(self, escalation_id: str) -> dict[int, float]:
        """Get response time per level for an escalation."""
        state = self._active.get(escalation_id) or next(
            (s for s in self._completed if s.id == escalation_id), None
        )
        if state is None:
            return {}

        return {
            record.level: record.response_time_seconds
            for record in state.level_history
            if record.response_time_seconds is not None and not record.skipped
        }

    def reset_for_patient(self, patient_id: str) -> EscalationState | None:
        """Remove active escalation for a patient (used during handoff restart)."""
        escalation_id = self._patient_index.get(patient_id)
        if escalation_id:
            state = self._active.get(escalation_id)
            if state:
                self._record_event(
                    escalation_id=escalation_id,
                    alert_id=state.alert_ids[0] if state.alert_ids else "",
                    event_type=EscalationEventType.RESTARTED,
                    level=state.current_level,
                    timestamp=datetime.now(timezone.utc),
                    context={"reason": "handoff"},
                )
                # Move to completed (preserves history)
                self._active.pop(escalation_id, None)
                del self._patient_index[patient_id]
                self._completed.append(state)
                return state
        return None

    def _record_event(
        self,
        escalation_id: str,
        alert_id: str,
        event_type: EscalationEventType,
        level: int,
        clinician_id: str | None = None,
        clinician_name: str | None = None,
        timestamp: datetime | None = None,
        context: dict | None = None,
    ) -> EscalationEvent:
        """Record an audit trail event."""
        event = EscalationEvent(
            id=str(uuid.uuid4()),
            escalation_id=escalation_id,
            alert_id=alert_id,
            event_type=event_type,
            level=level,
            clinician_id=clinician_id,
            clinician_name=clinician_name,
            timestamp=timestamp or datetime.now(timezone.utc),
            context=context or {},
        )
        self._events.append(event)
        return event
