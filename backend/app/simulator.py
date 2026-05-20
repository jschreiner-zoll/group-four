"""Vital signs simulation engine for the Remote Patient Monitoring PoC."""

import asyncio
import math
import random
import uuid
from datetime import datetime, timezone

from app.config import (
    CONDITION_VALUES,
    NORMAL_RANGES,
    RECOVERY_READINGS,
    SEED_PATIENTS,
    SIMULATION_INTERVAL,
)
from app.models import (
    ActiveConditionRecord,
    Patient,
    PatientStatus,
    VitalReading,
)


class VitalSignsSimulator:
    """Generates simulated vital sign data for virtual patients."""

    def __init__(self):
        self.patients: dict[str, Patient] = {}
        self.active_conditions: dict[str, dict[str, ActiveConditionRecord]] = {}
        self.tasks: list[asyncio.Task] = []
        self.running = False
        self._on_vitals_callback = None
        self._initialize_patients()

    def _initialize_patients(self):
        """Create 10 patients from seed data."""
        for seed in SEED_PATIENTS:
            patient_id = str(uuid.uuid4())
            self.patients[patient_id] = Patient(
                id=patient_id,
                name=seed["name"],
                age=seed["age"],
                room=seed["room"],
            )
            self.active_conditions[patient_id] = {}

    def set_vitals_callback(self, callback):
        """Set callback function called when new vitals are generated."""
        self._on_vitals_callback = callback

    def get_patients(self) -> list[Patient]:
        """Return all patient records."""
        return list(self.patients.values())

    def get_patient(self, patient_id: str) -> Patient | None:
        """Return a single patient by ID."""
        return self.patients.get(patient_id)

    def start_simulation(self):
        """Start background tasks for all patients."""
        if self.running:
            return
        self.running = True
        for patient_id in self.patients:
            task = asyncio.create_task(self._simulation_loop(patient_id))
            self.tasks.append(task)

    def stop_simulation(self):
        """Stop all simulation tasks."""
        self.running = False
        for task in self.tasks:
            task.cancel()
        self.tasks.clear()

    async def _simulation_loop(self, patient_id: str):
        """Generate vitals every SIMULATION_INTERVAL seconds for a patient."""
        try:
            while self.running:
                vitals = self.generate_vitals(patient_id)
                if self._on_vitals_callback:
                    await self._on_vitals_callback(patient_id, vitals)
                await asyncio.sleep(SIMULATION_INTERVAL)
        except asyncio.CancelledError:
            pass

    def generate_vitals(self, patient_id: str) -> VitalReading:
        """Generate one vital signs reading for a patient."""
        conditions = self.active_conditions.get(patient_id, {})

        heart_rate = self._generate_vital_value("heart_rate", patient_id, conditions)
        bp_systolic = self._generate_vital_value(
            "blood_pressure_systolic", patient_id, conditions
        )
        bp_diastolic = self._generate_vital_value(
            "blood_pressure_diastolic", patient_id, conditions
        )
        spo2 = self._generate_vital_value("spo2", patient_id, conditions)
        temperature = self._generate_vital_value("temperature", patient_id, conditions)
        respiratory_rate = self._generate_vital_value(
            "respiratory_rate", patient_id, conditions
        )
        blood_glucose = self._generate_vital_value(
            "blood_glucose", patient_id, conditions
        )
        ecg_waveform = self._generate_ecg_waveform()

        # Update recovery state for conditions in recovery
        self._update_recovery_state(patient_id)

        return VitalReading(
            patient_id=patient_id,
            timestamp=datetime.now(timezone.utc),
            heart_rate=round(heart_rate, 1),
            blood_pressure_systolic=round(bp_systolic, 1),
            blood_pressure_diastolic=round(bp_diastolic, 1),
            spo2=round(spo2, 1),
            temperature=round(temperature, 1),
            respiratory_rate=round(respiratory_rate, 1),
            ecg_waveform=ecg_waveform,
            blood_glucose=round(blood_glucose, 1),
        )

    def _generate_vital_value(
        self,
        vital_sign: str,
        patient_id: str,
        conditions: dict[str, ActiveConditionRecord],
    ) -> float:
        """Generate a value for a specific vital sign considering active conditions."""
        # Check if any condition affects this vital sign
        for condition_name, record in conditions.items():
            condition_config = CONDITION_VALUES.get(condition_name)
            if condition_config and condition_config["vital_sign"] == vital_sign:
                if record.recovering:
                    return self._generate_recovery_value(vital_sign, record)
                else:
                    return self._generate_condition_value(condition_name, record)

        # Normal random generation
        ranges = NORMAL_RANGES[vital_sign]
        return random.uniform(ranges["min"], ranges["max"])

    def _generate_condition_value(
        self, condition: str, record: ActiveConditionRecord
    ) -> float:
        """Generate abnormal value for a simulated condition."""
        config = CONDITION_VALUES[condition]
        if record.is_first_reading:
            record.is_first_reading = False
            return random.uniform(config["spike_min"], config["spike_max"])
        else:
            return random.uniform(config["sustained_min"], config["sustained_max"])

    def _generate_recovery_value(
        self, vital_sign: str, record: ActiveConditionRecord
    ) -> float:
        """Generate interpolated value during recovery."""
        # Progress goes from 0.25 to 1.0 over 4 readings (never 0%)
        progress = 1 - ((record.recovery_readings_remaining - 1) / RECOVERY_READINGS)
        progress = max(0.25, min(1.0, progress))
        ranges = NORMAL_RANGES[vital_sign]
        normal_value = random.uniform(ranges["min"], ranges["max"])

        # Find the condition affecting this vital to get sustained range
        condition_name = record.condition
        config = CONDITION_VALUES[condition_name]
        abnormal_value = random.uniform(config["sustained_min"], config["sustained_max"])

        # Linear interpolation from abnormal toward normal
        return abnormal_value + (normal_value - abnormal_value) * progress

    def _generate_ecg_waveform(self) -> list[float]:
        """Generate realistic ECG waveform with PQRST complex."""
        points = []
        # Generate 2 heartbeat cycles across 50 points
        for i in range(50):
            t = (i / 50.0) * 2  # 2 cycles
            cycle_pos = t % 1.0  # Position within one heartbeat cycle

            if cycle_pos < 0.05:
                # Baseline
                value = 0.0
            elif cycle_pos < 0.12:
                # P wave (small bump)
                p = (cycle_pos - 0.05) / 0.07
                value = 0.15 * math.sin(p * math.pi)
            elif cycle_pos < 0.18:
                # PR segment (flat)
                value = 0.0
            elif cycle_pos < 0.22:
                # Q wave (small dip)
                q = (cycle_pos - 0.18) / 0.04
                value = -0.1 * math.sin(q * math.pi)
            elif cycle_pos < 0.30:
                # R wave (tall spike)
                r = (cycle_pos - 0.22) / 0.08
                value = 1.0 * math.sin(r * math.pi)
            elif cycle_pos < 0.35:
                # S wave (dip below baseline)
                s = (cycle_pos - 0.30) / 0.05
                value = -0.25 * math.sin(s * math.pi)
            elif cycle_pos < 0.45:
                # ST segment (flat, slightly elevated)
                value = 0.02
            elif cycle_pos < 0.60:
                # T wave (broad bump)
                tw = (cycle_pos - 0.45) / 0.15
                value = 0.3 * math.sin(tw * math.pi)
            else:
                # Baseline
                value = 0.0

            # Add small noise for realism
            value += random.uniform(-0.03, 0.03)
            points.append(round(value, 3))
        return points

    def _update_recovery_state(self, patient_id: str):
        """Decrement recovery counters and remove fully recovered conditions."""
        conditions = self.active_conditions.get(patient_id, {})
        to_remove = []
        for condition_name, record in conditions.items():
            if record.recovering:
                record.recovery_readings_remaining -= 1
                if record.recovery_readings_remaining <= 0:
                    to_remove.append(condition_name)

        for condition_name in to_remove:
            del conditions[condition_name]

        # Update patient's active_conditions list
        patient = self.patients.get(patient_id)
        if patient:
            patient.active_conditions = [
                name for name, rec in conditions.items() if not rec.recovering
            ]

    def trigger_condition(self, patient_id: str, condition: str) -> bool:
        """Activate a simulated condition for a patient."""
        if patient_id not in self.patients:
            return False
        if condition not in CONDITION_VALUES:
            return False

        # Check if condition already active (idempotent)
        conditions = self.active_conditions[patient_id]
        if condition in conditions and not conditions[condition].recovering:
            return True

        # Activate condition
        conditions[condition] = ActiveConditionRecord(
            patient_id=patient_id,
            condition=condition,
            started_at=datetime.now(timezone.utc),
            is_first_reading=True,
        )

        # Update patient's active_conditions list
        patient = self.patients[patient_id]
        if condition not in patient.active_conditions:
            patient.active_conditions.append(condition)

        return True

    def reset_patient(self, patient_id: str) -> bool:
        """Initiate gradual recovery for all active conditions on a patient."""
        if patient_id not in self.patients:
            return False

        conditions = self.active_conditions[patient_id]
        if not conditions:
            return True

        # Set all conditions to recovering
        for record in conditions.values():
            if not record.recovering:
                record.recovering = True
                record.recovery_readings_remaining = RECOVERY_READINGS

        # Clear patient's active_conditions display
        self.patients[patient_id].active_conditions = []

        return True
