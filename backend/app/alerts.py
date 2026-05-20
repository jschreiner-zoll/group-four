"""Alert engine with threshold evaluation and escalation logic."""

import uuid
from datetime import datetime, timezone

from app.config import ESCALATION_READINGS, THRESHOLDS
from app.models import (
    Acknowledgment,
    Alert,
    AlertSeverity,
    AlertStatus,
    PatientStatus,
    VitalReading,
)


class AlertEngine:
    """Evaluates vital signs against thresholds and manages alert lifecycle."""

    def __init__(self):
        self.active_alerts: list[Alert] = []
        self.acknowledged_alerts: list[Alert] = []
        self.breach_counts: dict[tuple[str, str], int] = {}
        self._patient_names: dict[str, str] = {}
        # Cooldown tracking: (patient_id, vital_sign) -> {"acknowledged_at": datetime, "returned_to_normal": bool}
        self._cooldowns: dict[tuple[str, str], dict] = {}
        self._cooldown_seconds = 60
        # Hook callbacks for escalation integration (loosely coupled)
        self._on_created_hooks: list = []
        self._on_acknowledged_hooks: list = []

    def register_hook(self, event: str, callback) -> None:
        """Register a callback hook for alert lifecycle events.

        Args:
            event: 'on_created' or 'on_acknowledged'
            callback: Function to call when event occurs
        """
        if event == "on_created":
            self._on_created_hooks.append(callback)
        elif event == "on_acknowledged":
            self._on_acknowledged_hooks.append(callback)

    def _fire_hooks(self, event: str, *args, **kwargs) -> None:
        """Fire all registered hooks for an event."""
        hooks = []
        if event == "on_created":
            hooks = self._on_created_hooks
        elif event == "on_acknowledged":
            hooks = self._on_acknowledged_hooks
        for hook in hooks:
            try:
                hook(*args, **kwargs)
            except Exception:
                pass  # Don't let hook failures break alert engine

    def set_patient_names(self, patient_map: dict[str, str]):
        """Set patient ID to name mapping for alert display."""
        self._patient_names = patient_map

    def evaluate_vitals(self, patient_id: str, vitals: VitalReading, skip_vitals: set = None) -> list[Alert]:
        """Evaluate all vital signs against thresholds. Returns new alerts."""
        if skip_vitals is None:
            skip_vitals = set()
        new_alerts = []
        vitals_dict = {
            "heart_rate": vitals.heart_rate,
            "blood_pressure_systolic": vitals.blood_pressure_systolic,
            "blood_pressure_diastolic": vitals.blood_pressure_diastolic,
            "spo2": vitals.spo2,
            "temperature": vitals.temperature,
            "respiratory_rate": vitals.respiratory_rate,
            "blood_glucose": vitals.blood_glucose,
        }

        for vital_sign, value in vitals_dict.items():
            # Skip threshold evaluation for vitals in recovery
            if vital_sign in skip_vitals:
                self._clear_breach_count(patient_id, vital_sign)
                continue

            threshold_config = THRESHOLDS.get(vital_sign)
            if not threshold_config:
                continue

            breach = self._check_threshold(value, threshold_config)

            if breach is None:
                # Value is normal — reset breach count and mark cooldown as returned to normal
                self._clear_breach_count(patient_id, vital_sign)
                cooldown_key = (patient_id, vital_sign)
                if cooldown_key in self._cooldowns:
                    self._cooldowns[cooldown_key]["returned_to_normal"] = True
                continue

            severity, threshold_type, threshold_value = breach

            # Check cooldown — don't re-alert if recently acknowledged
            if self._is_in_cooldown(patient_id, vital_sign):
                continue

            # Check for existing active alert on this vital
            existing = self._find_active_alert(patient_id, vital_sign)

            if existing is None:
                # New breach — create alert
                alert = self._create_alert(
                    patient_id, vital_sign, value, severity,
                    threshold_type, threshold_value
                )
                self.active_alerts.append(alert)
                new_alerts.append(alert)
                self._increment_breach_count(patient_id, vital_sign)
                # Fire on_created hooks for escalation integration
                self._fire_hooks("on_created", alert)
            else:
                # Existing breach — increment and check escalation
                count = self._increment_breach_count(patient_id, vital_sign)
                if (
                    count >= ESCALATION_READINGS
                    and existing.severity == AlertSeverity.WARNING
                ):
                    existing.severity = AlertSeverity.CRITICAL
                    existing.escalated = True
                existing.breach_count = count
                existing.value = value

        return new_alerts

    def _check_threshold(
        self, value: float, config: dict
    ) -> tuple[AlertSeverity, str, float] | None:
        """Check if value breaches any threshold. Returns (severity, type, threshold) or None."""
        # Check critical thresholds first (higher priority)
        high_critical = config.get("high_critical")
        if high_critical is not None and value >= high_critical:
            return (AlertSeverity.CRITICAL, "high", high_critical)

        low_critical = config.get("low_critical")
        if low_critical is not None and value <= low_critical:
            return (AlertSeverity.CRITICAL, "low", low_critical)

        # Check warning thresholds
        high_warning = config.get("high_warning")
        if high_warning is not None and value >= high_warning:
            return (AlertSeverity.WARNING, "high", high_warning)

        low_warning = config.get("low_warning")
        if low_warning is not None and value <= low_warning:
            return (AlertSeverity.WARNING, "low", low_warning)

        return None

    def _find_active_alert(self, patient_id: str, vital_sign: str) -> Alert | None:
        """Find an existing active alert for a patient's vital sign."""
        for alert in self.active_alerts:
            if alert.patient_id == patient_id and alert.vital_sign == vital_sign:
                return alert
        return None

    def _create_alert(
        self,
        patient_id: str,
        vital_sign: str,
        value: float,
        severity: AlertSeverity,
        threshold_type: str,
        threshold_value: float,
    ) -> Alert:
        """Create a new alert."""
        return Alert(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            patient_name=self._patient_names.get(patient_id, "Unknown"),
            vital_sign=vital_sign,
            threshold_type=threshold_type,
            value=value,
            threshold_value=threshold_value,
            severity=severity,
            created_at=datetime.now(timezone.utc),
        )

    def _increment_breach_count(self, patient_id: str, vital_sign: str) -> int:
        """Increment and return breach count for a patient's vital sign."""
        key = (patient_id, vital_sign)
        self.breach_counts[key] = self.breach_counts.get(key, 0) + 1
        return self.breach_counts[key]

    def _clear_breach_count(self, patient_id: str, vital_sign: str):
        """Reset breach count when value returns to normal."""
        key = (patient_id, vital_sign)
        self.breach_counts[key] = 0

    def _is_in_cooldown(self, patient_id: str, vital_sign: str) -> bool:
        """Check if a patient+vital is in cooldown after acknowledgment.
        
        Cooldown requires BOTH:
        1. Value must have returned to normal at least once
        2. At least 60 seconds must have passed since acknowledgment
        """
        key = (patient_id, vital_sign)
        cooldown = self._cooldowns.get(key)
        if cooldown is None:
            return False

        now = datetime.now(timezone.utc)
        elapsed = (now - cooldown["acknowledged_at"]).total_seconds()

        if not cooldown["returned_to_normal"]:
            # Still breaching since acknowledgment — stay in cooldown
            return True

        if elapsed < self._cooldown_seconds:
            # Returned to normal but not enough time passed
            return True

        # Cooldown expired — remove it and allow new alerts
        del self._cooldowns[key]
        return False

    def get_active_alerts(self) -> list[Alert]:
        """Return all active (unacknowledged) alerts."""
        return self.active_alerts

    def get_patient_alerts(self, patient_id: str) -> list[Alert]:
        """Return all alerts (active + acknowledged) for a specific patient."""
        all_alerts = self.active_alerts + self.acknowledged_alerts
        return [a for a in all_alerts if a.patient_id == patient_id]

    def get_alert_history(self) -> list[Alert]:
        """Return all alerts (active + acknowledged)."""
        return self.active_alerts + self.acknowledged_alerts

    def acknowledge_alert(self, alert_id: str, note: str) -> Alert | None:
        """Acknowledge an alert with a clinician note."""
        alert = None
        for a in self.active_alerts:
            if a.id == alert_id:
                alert = a
                break

        if alert is None:
            return None

        # Update alert state
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledgment = Acknowledgment(
            note=note,
            acknowledged_at=datetime.now(timezone.utc),
        )

        # Move from active to acknowledged
        self.active_alerts.remove(alert)
        self.acknowledged_alerts.append(alert)

        # Clear breach count for this vital
        self._clear_breach_count(alert.patient_id, alert.vital_sign)

        # Set cooldown — prevent re-triggering until normal + 60s
        cooldown_key = (alert.patient_id, alert.vital_sign)
        self._cooldowns[cooldown_key] = {
            "acknowledged_at": datetime.now(timezone.utc),
            "returned_to_normal": False,
        }

        # Fire on_acknowledged hooks for escalation integration
        self._fire_hooks("on_acknowledged", alert_id, note)

        return alert

    def get_thresholds(self) -> dict:
        """Return current threshold configuration."""
        return THRESHOLDS

    def derive_patient_status(self, patient_id: str) -> PatientStatus:
        """Derive patient status from active alerts (highest severity wins)."""
        patient_alerts = [
            a for a in self.active_alerts if a.patient_id == patient_id
        ]

        if any(a.severity == AlertSeverity.CRITICAL for a in patient_alerts):
            return PatientStatus.CRITICAL
        elif any(a.severity == AlertSeverity.WARNING for a in patient_alerts):
            return PatientStatus.WARNING
        else:
            return PatientStatus.NORMAL

    def get_escalated_alerts(self) -> list[Alert]:
        """Return alerts that have been escalated (for tracking)."""
        return [a for a in self.active_alerts if a.escalated]
