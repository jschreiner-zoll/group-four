"""Unit tests for the alert engine."""

import pytest
from datetime import datetime, timezone

from app.alerts import AlertEngine
from app.config import ESCALATION_READINGS
from app.models import AlertSeverity, AlertStatus, PatientStatus, VitalReading


@pytest.fixture
def alert_engine():
    """Create a fresh alert engine instance."""
    engine = AlertEngine()
    engine.set_patient_names({"patient-1": "John Smith", "patient-2": "Maria Garcia"})
    return engine


def make_vitals(patient_id="patient-1", **overrides):
    """Helper to create a VitalReading with defaults in normal range."""
    defaults = {
        "patient_id": patient_id,
        "timestamp": datetime.now(timezone.utc),
        "heart_rate": 75,
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 75,
        "spo2": 98,
        "temperature": 98.6,
        "respiratory_rate": 16,
        "ecg_waveform": [0.0] * 50,
        "blood_glucose": 100,
    }
    defaults.update(overrides)
    return VitalReading(**defaults)


class TestThresholdEvaluation:
    """Test threshold breach detection."""

    def test_normal_vitals_no_alerts(self, alert_engine):
        vitals = make_vitals()
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 0

    def test_high_heart_rate_warning(self, alert_engine):
        vitals = make_vitals(heart_rate=105)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 1
        assert alerts[0].severity == AlertSeverity.WARNING
        assert alerts[0].vital_sign == "heart_rate"

    def test_high_heart_rate_critical(self, alert_engine):
        vitals = make_vitals(heart_rate=135)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 1
        assert alerts[0].severity == AlertSeverity.CRITICAL

    def test_low_spo2_warning(self, alert_engine):
        vitals = make_vitals(spo2=88)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 1
        assert alerts[0].severity == AlertSeverity.WARNING
        assert alerts[0].vital_sign == "spo2"

    def test_low_spo2_critical(self, alert_engine):
        vitals = make_vitals(spo2=83)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 1
        assert alerts[0].severity == AlertSeverity.CRITICAL

    def test_high_temperature_warning(self, alert_engine):
        vitals = make_vitals(temperature=101.5)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 1
        assert alerts[0].vital_sign == "temperature"

    def test_multiple_vitals_breach(self, alert_engine):
        vitals = make_vitals(heart_rate=110, spo2=87)
        alerts = alert_engine.evaluate_vitals("patient-1", vitals)
        assert len(alerts) == 2

    def test_no_duplicate_alert_on_continued_breach(self, alert_engine):
        vitals1 = make_vitals(heart_rate=110)
        vitals2 = make_vitals(heart_rate=112)
        alerts1 = alert_engine.evaluate_vitals("patient-1", vitals1)
        alerts2 = alert_engine.evaluate_vitals("patient-1", vitals2)
        assert len(alerts1) == 1
        assert len(alerts2) == 0  # No new alert, existing one updated


class TestEscalation:
    """Test alert escalation logic."""

    def test_escalation_after_3_readings(self, alert_engine):
        for i in range(ESCALATION_READINGS):
            vitals = make_vitals(heart_rate=105 + i)
            alert_engine.evaluate_vitals("patient-1", vitals)

        active = alert_engine.get_active_alerts()
        assert len(active) == 1
        assert active[0].severity == AlertSeverity.CRITICAL
        assert active[0].escalated is True

    def test_no_escalation_before_3_readings(self, alert_engine):
        for i in range(ESCALATION_READINGS - 1):
            vitals = make_vitals(heart_rate=105)
            alert_engine.evaluate_vitals("patient-1", vitals)

        active = alert_engine.get_active_alerts()
        assert active[0].severity == AlertSeverity.WARNING
        assert active[0].escalated is False

    def test_breach_count_resets_on_normal(self, alert_engine):
        # Two breach readings
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=105))
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=108))
        # Normal reading resets count
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=75))
        # Two more breach readings (should not escalate yet)
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=110))
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=112))

        active = alert_engine.get_active_alerts()
        # Should have a new alert (old one still active from first breach)
        # The new breach creates a fresh alert since count was reset
        assert all(a.escalated is False for a in active)

    def test_critical_alert_does_not_escalate_further(self, alert_engine):
        for i in range(5):
            vitals = make_vitals(heart_rate=135)  # Already critical threshold
            alert_engine.evaluate_vitals("patient-1", vitals)

        active = alert_engine.get_active_alerts()
        assert active[0].severity == AlertSeverity.CRITICAL
        assert active[0].escalated is False  # Was critical from start


class TestAcknowledgment:
    """Test alert acknowledgment."""

    def test_acknowledge_valid_alert(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=110))
        active = alert_engine.get_active_alerts()
        alert_id = active[0].id

        result = alert_engine.acknowledge_alert(alert_id, "Patient assessed")
        assert result is not None
        assert result.status == AlertStatus.ACKNOWLEDGED
        assert result.acknowledgment.note == "Patient assessed"

    def test_acknowledge_moves_to_history(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=110))
        active = alert_engine.get_active_alerts()
        alert_id = active[0].id

        alert_engine.acknowledge_alert(alert_id, "Noted")
        assert len(alert_engine.get_active_alerts()) == 0
        assert len(alert_engine.acknowledged_alerts) == 1

    def test_acknowledge_invalid_alert(self, alert_engine):
        result = alert_engine.acknowledge_alert("invalid-id", "Note")
        assert result is None

    def test_acknowledge_already_acknowledged(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=110))
        active = alert_engine.get_active_alerts()
        alert_id = active[0].id

        alert_engine.acknowledge_alert(alert_id, "First note")
        result = alert_engine.acknowledge_alert(alert_id, "Second note")
        assert result is None


class TestPatientStatus:
    """Test patient status derivation."""

    def test_normal_status_no_alerts(self, alert_engine):
        status = alert_engine.derive_patient_status("patient-1")
        assert status == PatientStatus.NORMAL

    def test_warning_status(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=105))
        status = alert_engine.derive_patient_status("patient-1")
        assert status == PatientStatus.WARNING

    def test_critical_status(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=135))
        status = alert_engine.derive_patient_status("patient-1")
        assert status == PatientStatus.CRITICAL

    def test_highest_severity_wins(self, alert_engine):
        alert_engine.evaluate_vitals(
            "patient-1", make_vitals(heart_rate=105, spo2=83)
        )
        status = alert_engine.derive_patient_status("patient-1")
        assert status == PatientStatus.CRITICAL

    def test_acknowledged_alert_not_counted(self, alert_engine):
        alert_engine.evaluate_vitals("patient-1", make_vitals(heart_rate=110))
        active = alert_engine.get_active_alerts()
        alert_engine.acknowledge_alert(active[0].id, "Noted")
        status = alert_engine.derive_patient_status("patient-1")
        assert status == PatientStatus.NORMAL
