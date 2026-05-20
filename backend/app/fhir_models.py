"""FHIR R4-native Pydantic models for Care Team Escalation Routing."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# --- Enumerations ---

class EscalationStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    TIMED_OUT = "timed_out"


class CareTeamStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class EscalationEventType(str, Enum):
    STARTED = "started"
    NOTIFIED = "notified"
    ESCALATED = "escalated"
    SKIPPED = "skipped"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ALERT_JOINED = "alert_joined"
    RESTARTED = "restarted"


# --- FHIR R4 Building Blocks ---

class Identifier(BaseModel):
    system: str = ""
    value: str = ""


class HumanName(BaseModel):
    family: str = ""
    given: list[str] = Field(default_factory=list)
    text: str = ""


class CodeableConcept(BaseModel):
    coding: list[dict] = Field(default_factory=list)
    text: str = ""


class Reference(BaseModel):
    reference: str = ""
    display: str = ""


class Period(BaseModel):
    start: Optional[datetime] = None
    end: Optional[datetime] = None


class Qualification(BaseModel):
    code: CodeableConcept = Field(default_factory=CodeableConcept)


# --- FHIR R4 Resources ---

class Practitioner(BaseModel):
    """FHIR R4 Practitioner resource representing a clinician."""
    resourceType: str = "Practitioner"
    id: str
    identifier: list[Identifier] = Field(default_factory=list)
    name: list[HumanName] = Field(default_factory=list)
    qualification: list[Qualification] = Field(default_factory=list)
    active: bool = True  # On-duty status

    @property
    def display_name(self) -> str:
        if self.name:
            n = self.name[0]
            if n.text:
                return n.text
            given = " ".join(n.given) if n.given else ""
            return f"{given} {n.family}".strip()
        return self.id

    @property
    def role_code(self) -> str:
        if self.qualification:
            coding = self.qualification[0].code.coding
            if coding:
                return coding[0].get("code", "")
        return ""

    @property
    def role_display(self) -> str:
        if self.qualification:
            return self.qualification[0].code.text
        return ""


class CareTeamParticipant(BaseModel):
    """FHIR R4 CareTeam.participant element."""
    role: list[CodeableConcept] = Field(default_factory=list)
    member: Reference = Field(default_factory=Reference)
    coverage_period: Optional[Period] = None

    @property
    def level(self) -> int:
        """Extract escalation level from role coding."""
        if self.role:
            coding = self.role[0].coding
            if coding:
                code = coding[0].get("code", "")
                return ROLE_CODE_TO_LEVEL.get(code, 0)
        return 0


class CareTeam(BaseModel):
    """FHIR R4 CareTeam resource."""
    resourceType: str = "CareTeam"
    id: str
    identifier: list[Identifier] = Field(default_factory=list)
    status: CareTeamStatus = CareTeamStatus.ACTIVE
    category: list[CodeableConcept] = Field(default_factory=list)
    name: str = ""
    subject: Reference = Field(default_factory=Reference)
    period: Optional[Period] = None
    participant: list[CareTeamParticipant] = Field(default_factory=list)

    def get_participant_at_level(self, level: int) -> Optional[CareTeamParticipant]:
        """Get the participant assigned at a specific escalation level."""
        for p in self.participant:
            if p.level == level:
                return p
        return None


# --- Escalation-Specific Models ---

class NotifiedClinician(BaseModel):
    """Tracks a clinician who has been notified during an escalation."""
    clinician_id: str
    clinician_name: str
    level: int
    notified_at: datetime
    is_rrt_member: bool = False


class EscalationLevelRecord(BaseModel):
    """Records a single level transition in the escalation timeline."""
    level: int
    clinician_id: str
    clinician_name: str
    entered_at: datetime
    exited_at: Optional[datetime] = None
    response_time_seconds: Optional[float] = None
    skipped: bool = False


class EscalationState(BaseModel):
    """Tracks the current state of an escalation cascade for a patient (grouped)."""
    id: str
    patient_id: str
    alert_ids: list[str] = Field(default_factory=list)
    current_level: int = 1
    max_level: int = 4
    status: EscalationStatus = EscalationStatus.ACTIVE
    started_at: datetime
    level_entered_at: datetime
    notified_clinicians: list[NotifiedClinician] = Field(default_factory=list)
    level_history: list[EscalationLevelRecord] = Field(default_factory=list)
    pending_callback_handle: Optional[str] = None  # Serializable handle ID
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None


class EscalationEvent(BaseModel):
    """Audit trail event for escalation timeline."""
    id: str
    escalation_id: str
    alert_id: str
    event_type: EscalationEventType
    level: int
    clinician_id: Optional[str] = None
    clinician_name: Optional[str] = None
    timestamp: datetime
    context: dict = Field(default_factory=dict)


class EscalationConfig(BaseModel):
    """Configurable escalation parameters."""
    level_timeouts: dict[int, int] = Field(
        default_factory=lambda: {1: 300, 2: 300, 3: 300}
    )
    severity_max_levels: dict[str, int] = Field(
        default_factory=lambda: {"Warning": 3, "Critical": 4}
    )
    demo_time_scale: float = 30.0


class HandoffSummary(BaseModel):
    """Auto-generated summary when care team assignments change."""
    patient_ids: list[str] = Field(default_factory=list)
    active_alerts: list[dict] = Field(default_factory=list)
    pending_escalations: list[dict] = Field(default_factory=list)
    patients_requiring_attention: list[str] = Field(default_factory=list)
    recent_acknowledgments: list[dict] = Field(default_factory=list)
    generated_at: datetime
    from_clinician_id: Optional[str] = None
    to_clinician_id: Optional[str] = None


# --- Role Code Constants ---

ROLE_CODES = {
    1: {"code": "primary-nurse", "display": "Primary Nurse"},
    2: {"code": "charge-nurse", "display": "Charge Nurse"},
    3: {"code": "attending-physician", "display": "Attending Physician"},
    4: {"code": "rapid-response-team", "display": "Rapid Response Team"},
}

ROLE_CODE_TO_LEVEL = {
    "primary-nurse": 1,
    "charge-nurse": 2,
    "attending-physician": 3,
    "rapid-response-team": 4,
}


def make_role_codeable_concept(level: int) -> CodeableConcept:
    """Create a CodeableConcept for an escalation level role."""
    role_info = ROLE_CODES.get(level, {"code": "unknown", "display": "Unknown"})
    return CodeableConcept(
        coding=[{"system": "http://example.org/escalation-roles", "code": role_info["code"], "display": role_info["display"]}],
        text=role_info["display"],
    )


# --- WebSocket Event Payload ---

class EscalationEventPayload(BaseModel):
    """WebSocket payload for escalation_event messages."""
    type: str  # escalated | resolved | acknowledged | notified
    alert_id: str
    patient_id: str
    patient_name: str = ""
    vital_sign: str = ""
    severity: str = ""
    current_value: Optional[float] = None
    level: int = 0
    clinician_id: str = ""
    timestamp: datetime
