"""Pydantic data models for the Remote Patient Monitoring PoC."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PatientStatus(str, Enum):
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"


class AlertSeverity(str, Enum):
    WARNING = "Warning"
    CRITICAL = "Critical"


class AlertStatus(str, Enum):
    ACTIVE = "Active"
    ACKNOWLEDGED = "Acknowledged"


class SimulatedCondition(str, Enum):
    TACHYCARDIA = "tachycardia"
    BRADYCARDIA = "bradycardia"
    HYPOXIA = "hypoxia"
    HYPERTHERMIA = "hyperthermia"
    HYPOTENSION = "hypotension"
    HYPERGLYCEMIA = "hyperglycemia"


class Patient(BaseModel):
    id: str
    name: str
    age: int
    room: str
    status: PatientStatus = PatientStatus.NORMAL
    active_conditions: list[str] = Field(default_factory=list)


class VitalReading(BaseModel):
    patient_id: str
    timestamp: datetime
    heart_rate: float
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    spo2: float
    temperature: float
    respiratory_rate: float
    ecg_waveform: list[float] = Field(default_factory=list)
    blood_glucose: float


class Acknowledgment(BaseModel):
    note: str = Field(min_length=1, max_length=500)
    acknowledged_at: datetime


class Alert(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    vital_sign: str
    threshold_type: str  # "high" or "low"
    value: float
    threshold_value: float
    severity: AlertSeverity
    status: AlertStatus = AlertStatus.ACTIVE
    created_at: datetime
    breach_count: int = 1
    escalated: bool = False
    acknowledgment: Optional[Acknowledgment] = None


class ActiveConditionRecord(BaseModel):
    patient_id: str
    condition: str
    started_at: datetime
    recovering: bool = False
    recovery_readings_remaining: int = 0
    is_first_reading: bool = True


# Request/Response models

class SimulateRequest(BaseModel):
    condition: SimulatedCondition


class AcknowledgeRequest(BaseModel):
    note: str = Field(min_length=1, max_length=500)


# WebSocket message models

class VitalsUpdateMessage(BaseModel):
    type: str = "vitals_update"
    data: dict


class NewAlertMessage(BaseModel):
    type: str = "new_alert"
    data: dict


class AlertEscalatedMessage(BaseModel):
    type: str = "alert_escalated"
    data: dict


class AlertAcknowledgedMessage(BaseModel):
    type: str = "alert_acknowledged"
    data: dict
