"""Unit tests for the vital signs simulator."""

import pytest

from app.config import CONDITION_VALUES, NORMAL_RANGES, RECOVERY_READINGS
from app.simulator import VitalSignsSimulator


@pytest.fixture
def simulator():
    """Create a fresh simulator instance."""
    return VitalSignsSimulator()


@pytest.fixture
def patient_id(simulator):
    """Get the first patient ID."""
    patients = simulator.get_patients()
    return patients[0].id


class TestNormalGeneration:
    """Test normal vital sign generation."""

    def test_generates_10_patients(self, simulator):
        patients = simulator.get_patients()
        assert len(patients) == 10

    def test_patients_have_unique_ids(self, simulator):
        patients = simulator.get_patients()
        ids = [p.id for p in patients]
        assert len(set(ids)) == 10

    def test_heart_rate_within_normal_range(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        ranges = NORMAL_RANGES["heart_rate"]
        assert ranges["min"] <= vitals.heart_rate <= ranges["max"]

    def test_spo2_within_normal_range(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        ranges = NORMAL_RANGES["spo2"]
        assert ranges["min"] <= vitals.spo2 <= ranges["max"]

    def test_temperature_within_normal_range(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        ranges = NORMAL_RANGES["temperature"]
        assert ranges["min"] <= vitals.temperature <= ranges["max"]

    def test_blood_glucose_within_normal_range(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        ranges = NORMAL_RANGES["blood_glucose"]
        assert ranges["min"] <= vitals.blood_glucose <= ranges["max"]

    def test_ecg_waveform_generated(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        assert len(vitals.ecg_waveform) == 50

    def test_all_vitals_present(self, simulator, patient_id):
        vitals = simulator.generate_vitals(patient_id)
        assert vitals.heart_rate is not None
        assert vitals.blood_pressure_systolic is not None
        assert vitals.blood_pressure_diastolic is not None
        assert vitals.spo2 is not None
        assert vitals.temperature is not None
        assert vitals.respiratory_rate is not None
        assert vitals.blood_glucose is not None


class TestConditionSimulation:
    """Test condition simulation behavior."""

    def test_tachycardia_spike(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        vitals = simulator.generate_vitals(patient_id)
        config = CONDITION_VALUES["tachycardia"]
        assert config["spike_min"] <= vitals.heart_rate <= config["spike_max"]

    def test_tachycardia_sustained(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        simulator.generate_vitals(patient_id)  # First reading (spike)
        vitals = simulator.generate_vitals(patient_id)  # Second reading (sustained)
        config = CONDITION_VALUES["tachycardia"]
        assert config["sustained_min"] <= vitals.heart_rate <= config["sustained_max"]

    def test_hypoxia_spike(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "hypoxia")
        vitals = simulator.generate_vitals(patient_id)
        config = CONDITION_VALUES["hypoxia"]
        assert config["spike_min"] <= vitals.spo2 <= config["spike_max"]

    def test_multiple_conditions_different_vitals(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        simulator.trigger_condition(patient_id, "hypoxia")
        vitals = simulator.generate_vitals(patient_id)
        # Both should be abnormal
        assert vitals.heart_rate >= CONDITION_VALUES["tachycardia"]["spike_min"]
        assert vitals.spo2 <= CONDITION_VALUES["hypoxia"]["spike_max"]

    def test_trigger_condition_invalid_patient(self, simulator):
        result = simulator.trigger_condition("invalid-id", "tachycardia")
        assert result is False

    def test_trigger_condition_invalid_condition(self, simulator, patient_id):
        result = simulator.trigger_condition(patient_id, "invalid_condition")
        assert result is False

    def test_trigger_condition_idempotent(self, simulator, patient_id):
        result1 = simulator.trigger_condition(patient_id, "tachycardia")
        result2 = simulator.trigger_condition(patient_id, "tachycardia")
        assert result1 is True
        assert result2 is True


class TestRecovery:
    """Test gradual recovery behavior."""

    def test_reset_initiates_recovery(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        simulator.generate_vitals(patient_id)  # Generate one reading
        result = simulator.reset_patient(patient_id)
        assert result is True

    def test_recovery_takes_4_readings(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        simulator.generate_vitals(patient_id)  # Spike
        simulator.reset_patient(patient_id)

        # Generate 4 recovery readings
        for _ in range(RECOVERY_READINGS):
            simulator.generate_vitals(patient_id)

        # After recovery, should be back to normal
        vitals = simulator.generate_vitals(patient_id)
        ranges = NORMAL_RANGES["heart_rate"]
        assert ranges["min"] <= vitals.heart_rate <= ranges["max"]

    def test_reset_invalid_patient(self, simulator):
        result = simulator.reset_patient("invalid-id")
        assert result is False

    def test_reset_clears_active_conditions(self, simulator, patient_id):
        simulator.trigger_condition(patient_id, "tachycardia")
        simulator.reset_patient(patient_id)
        patient = simulator.get_patient(patient_id)
        assert patient.active_conditions == []
