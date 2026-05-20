# Component Methods — Care Team Escalation Routing & Management

---

## Backend Components

### 1. Escalation Engine (`escalation.py`)

```python
class EscalationEngine:
    def __init__(self, care_team_manager, escalation_tracker, virtual_clock, ws_manager)
    
    # Hook callbacks (registered on AlertEngine)
    def on_alert_created(self, alert: Alert) -> None
    def on_alert_acknowledged(self, alert_id: str, acknowledged_by: str) -> None
    
    # Escalation cascade management
    def start_escalation(self, alert: Alert) -> EscalationState
    def escalate_to_next_level(self, alert_id: str) -> None
    def stop_escalation(self, alert_id: str, reason: str) -> None
    
    # Configuration
    def get_max_level_for_severity(self, severity: AlertSeverity) -> int
    def set_max_level_for_severity(self, severity: AlertSeverity, max_level: int) -> None
    
    # Notification
    def notify_clinician(self, clinician_id: str, alert: Alert, level: int) -> None
    def notify_resolution(self, alert_id: str, acknowledged_by: str) -> None
    
    # Demo mode
    def set_demo_mode(self, enabled: bool) -> None
    def get_demo_mode(self) -> bool
```

### 2. Care Team Manager (`care_team.py`)

```python
class CareTeamManager:
    def __init__(self)
    
    # Clinician roster management
    def get_all_clinicians(self) -> list[Practitioner]
    def get_clinician(self, clinician_id: str) -> Practitioner | None
    def set_duty_status(self, clinician_id: str, on_duty: bool) -> Practitioner
    
    # Care team assignment
    def get_care_team(self, patient_id: str) -> CareTeam
    def get_all_care_teams(self) -> list[CareTeam]
    def assign_clinician(self, patient_id: str, clinician_id: str, level: int) -> CareTeam
    def reassign_patient(self, patient_id: str, from_clinician_id: str, to_clinician_id: str) -> CareTeam
    
    # Bulk operations
    def bulk_handoff(self, patient_ids: list[str], to_clinician_id: str, level: int) -> HandoffSummary
    def generate_handoff_summary(self, patient_ids: list[str], outgoing_clinician_id: str) -> HandoffSummary
    
    # Escalation routing
    def get_clinician_for_level(self, patient_id: str, level: int) -> Practitioner | None
    def get_next_available_level(self, patient_id: str, current_level: int) -> tuple[int, Practitioner] | None
    
    # RRT management
    def get_rrt_members(self, patient_id: str) -> list[Practitioner]
    def set_rrt_members(self, patient_id: str, clinician_ids: list[str]) -> CareTeam
    
    # Escalation configuration
    def get_escalation_config(self) -> EscalationConfig
    def set_escalation_config(self, config: EscalationConfig) -> None
```

### 3. Escalation Tracker (`escalation_tracker.py`)

```python
class EscalationTracker:
    def __init__(self)
    
    # State management
    def create_escalation(self, alert_id: str, patient_id: str, initial_clinician: Practitioner) -> EscalationState
    def get_escalation(self, alert_id: str) -> EscalationState | None
    def get_active_escalations(self) -> list[EscalationState]
    def get_escalations_for_patient(self, patient_id: str) -> list[EscalationState]
    def get_escalations_for_clinician(self, clinician_id: str) -> list[EscalationState]
    
    # Level transitions
    def record_level_change(self, alert_id: str, new_level: int, clinician: Practitioner) -> None
    def record_acknowledgment(self, alert_id: str, clinician_id: str) -> None
    def complete_escalation(self, alert_id: str, reason: str) -> None
    
    # Callback tracking
    def set_pending_callback(self, alert_id: str, callback_handle) -> None
    def get_pending_callback(self, alert_id: str) -> callback_handle | None
    def clear_pending_callback(self, alert_id: str) -> None
    
    # Audit trail
    def get_escalation_timeline(self, alert_id: str) -> list[EscalationEvent]
    def get_response_times(self, alert_id: str) -> dict[int, float]
```

### 4. Virtual Clock (`virtual_clock.py`)

```python
class VirtualClock:
    def __init__(self)
    
    # Time operations
    def now(self) -> datetime
    def call_later(self, delay_seconds: float, callback: Callable) -> CallbackHandle
    def cancel(self, handle: CallbackHandle) -> None
    
    # Mode control
    def set_time_scale(self, scale: float) -> None  # 1.0 = real-time, 30.0 = 30x speed
    def get_time_scale(self) -> float
    def is_demo_mode(self) -> bool
    
    # Testing support
    def advance(self, seconds: float) -> None  # For tests only — manually advance time
    def reset(self) -> None
```

### 5. FHIR Models (`fhir_models.py`)

```python
# FHIR R4 CareTeam resource (Pydantic)
class CareTeam(BaseModel):
    resourceType: str = "CareTeam"
    id: str
    identifier: list[Identifier]
    status: CareTeamStatus  # proposed | active | suspended | inactive
    category: list[CodeableConcept]
    name: str
    subject: Reference  # Reference to Patient
    period: Period | None
    participant: list[CareTeamParticipant]

class CareTeamParticipant(BaseModel):
    role: list[CodeableConcept]  # Escalation level role
    member: Reference  # Reference to Practitioner or CareTeam (for RRT)
    coverage_period: Period | None  # On-duty period

class Practitioner(BaseModel):
    resourceType: str = "Practitioner"
    id: str
    identifier: list[Identifier]
    name: list[HumanName]
    qualification: list[Qualification]  # Role/specialty
    active: bool  # On-duty status

# Escalation-specific models
class EscalationState(BaseModel):
    alert_id: str
    patient_id: str
    current_level: int
    started_at: datetime
    level_history: list[EscalationLevelRecord]
    notified_clinicians: list[NotifiedClinician]
    status: EscalationStatus  # active | resolved | timed_out

class EscalationEvent(BaseModel):
    id: str
    alert_id: str
    event_type: str  # escalated | resolved | acknowledged | notified
    level: int
    clinician_id: str | None
    timestamp: datetime
    context: dict

class EscalationConfig(BaseModel):
    level_timeouts: dict[int, int]  # level -> seconds (default: {1: 300, 2: 600, 3: 900})
    severity_max_levels: dict[str, int]  # severity -> max level
    
class HandoffSummary(BaseModel):
    patient_ids: list[str]
    active_alerts: list[Alert]
    pending_escalations: list[EscalationState]
    patients_requiring_attention: list[str]
    recent_acknowledgments: list[Alert]
    generated_at: datetime
```

---

## Frontend Components (Key Methods)

### EscalationContext

```javascript
// State shape
{
  careTeams: {},           // patient_id -> CareTeam FHIR resource
  clinicians: [],          // Practitioner[] roster
  escalations: {},         // alert_id -> EscalationState
  notifications: [],       // EscalationEvent[] for selected clinician
  selectedClinician: null, // current clinician identity
  escalationConfig: {},    // severity -> max level mapping
  demoMode: false          // real-time vs compressed
}

// Reducer actions
SET_CARE_TEAMS, UPDATE_CARE_TEAM, SET_CLINICIANS, UPDATE_CLINICIAN_STATUS,
SET_ESCALATIONS, UPDATE_ESCALATION, REMOVE_ESCALATION,
ADD_NOTIFICATION, CLEAR_NOTIFICATIONS, SET_SELECTED_CLINICIAN,
SET_DEMO_MODE, SET_ESCALATION_CONFIG
```

### CareTeamPage

```javascript
// Key methods
fetchCareTeams()           // GET /api/care-team/assignments
fetchClinicians()          // GET /api/care-team/clinicians
handleReassign(patientId, clinicianId, level)  // PUT /api/care-team/assignments/{patientId}
handleBulkHandoff(patientIds, toClinician)     // POST /api/care-team/handoff
handleDutyToggle(clinicianId, onDuty)          // PUT /api/care-team/clinicians/{id}/status
```

---

## REST API Endpoints (New)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/care-team/clinicians` | GET | List all clinicians with duty status |
| `/api/care-team/clinicians/{id}/status` | PUT | Set on-duty/off-duty |
| `/api/care-team/assignments` | GET | List all patient care team assignments |
| `/api/care-team/assignments/{patient_id}` | GET | Get care team for specific patient |
| `/api/care-team/assignments/{patient_id}` | PUT | Update care team assignment |
| `/api/care-team/handoff` | POST | Bulk handoff patients |
| `/api/care-team/rrt/{patient_id}` | GET | Get RRT members for patient |
| `/api/care-team/rrt/{patient_id}` | PUT | Set RRT members |
| `/api/escalation/active` | GET | List all active escalations |
| `/api/escalation/{alert_id}` | GET | Get escalation state for alert |
| `/api/escalation/{alert_id}/timeline` | GET | Get escalation audit trail |
| `/api/escalation/config` | GET | Get escalation configuration |
| `/api/escalation/config` | PUT | Update escalation configuration |
| `/api/escalation/demo-mode` | POST | Toggle demo mode |

---

## WebSocket Message Types (New)

| Message Type | Direction | Payload |
|---|---|---|
| `escalation_event` | Server → Client | `{type: "escalated\|resolved\|acknowledged\|notified", alert_id, level, clinician_id, timestamp, context}` |
| `care_team_updated` | Server → Client | `{patient_id, care_team: CareTeam}` |
| `clinician_status_changed` | Server → Client | `{clinician_id, on_duty: bool}` |
| `handoff_complete` | Server → Client | `{summary: HandoffSummary}` |

