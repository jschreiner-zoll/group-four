# Domain Entities — Care Team Escalation Routing

---

## Entity Relationship Overview

```
Practitioner (1) ---participates-in---> (*) CareTeamParticipant
CareTeam (1) ---has---> (*) CareTeamParticipant
CareTeam (1) ---covers---> (1) Patient
Patient (1) ---has---> (*) Alert
Alert (1) ---triggers---> (0..1) EscalationState (grouped per patient)
EscalationState (1) ---records---> (*) EscalationEvent
EscalationState (1) ---tracks---> (*) NotifiedClinician
EscalationConfig (1) ---configures---> EscalationEngine
```

---

## FHIR R4-Native Entities

### Practitioner
**FHIR Resource**: Practitioner (R4)

| Field | Type | Description |
|---|---|---|
| resourceType | str | "Practitioner" (fixed) |
| id | str | Unique identifier (UUID) |
| identifier | list[Identifier] | Business identifiers |
| name | list[HumanName] | Clinician name (family, given) |
| qualification | list[Qualification] | Role/specialty (Primary Nurse, Charge Nurse, Physician, RRT) |
| active | bool | On-duty status (true = on-duty) |

**Business Constraints:**
- `id` is globally unique (UUID)
- `active` determines availability for escalation routing
- `qualification[0].code` determines escalation level capability

### CareTeam
**FHIR Resource**: CareTeam (R4)

| Field | Type | Description |
|---|---|---|
| resourceType | str | "CareTeam" (fixed) |
| id | str | Unique identifier (UUID) |
| identifier | list[Identifier] | Business identifiers |
| status | CareTeamStatus | active, inactive, suspended |
| category | list[CodeableConcept] | Team type ("escalation-team") |
| name | str | Display name |
| subject | Reference | Reference to Patient (patient_id) |
| period | Period | Active period (shift start/end) |
| participant | list[CareTeamParticipant] | Team members with roles |

**Business Constraints:**
- Each patient has exactly one active CareTeam at any time
- `status` must be "active" for escalation routing to use this team
- `participant` must include at least Level 1 (Primary Nurse)

### CareTeamParticipant
**FHIR Element**: CareTeam.participant

| Field | Type | Description |
|---|---|---|
| role | list[CodeableConcept] | Escalation level role |
| member | Reference | Reference to Practitioner or CareTeam (for RRT) |
| coverage_period | Period | When this member is available |

**Role Codes (CodeableConcept):**
| Code | Display | Level |
|---|---|---|
| `primary-nurse` | Primary Nurse | 1 |
| `charge-nurse` | Charge Nurse | 2 |
| `attending-physician` | Attending Physician | 3 |
| `rapid-response-team` | Rapid Response Team | 4 |

**Business Constraints:**
- Level 4 (RRT) member references a CareTeam (sub-team) whose members are any subset of the overall roster
- A clinician can appear at their individual level AND as part of the RRT group

---

## Escalation-Specific Entities

### EscalationState
**Purpose**: Tracks the current state of an escalation cascade for a patient (grouped)

| Field | Type | Description |
|---|---|---|
| id | str | Unique identifier (UUID) |
| patient_id | str | Patient this escalation covers |
| alert_ids | list[str] | All alert IDs grouped into this escalation |
| current_level | int | Current escalation level (1-4) |
| max_level | int | Maximum level allowed (based on highest severity) |
| status | EscalationStatus | active, resolved, timed_out |
| started_at | datetime | When escalation began |
| level_entered_at | datetime | When current level was entered |
| notified_clinicians | list[NotifiedClinician] | Who has been notified |
| level_history | list[EscalationLevelRecord] | Timeline of level transitions |
| pending_callback_handle | Any | Reference to scheduled VirtualClock callback |
| resolved_by | str | Clinician ID who acknowledged (if resolved) |
| resolved_at | datetime | When resolved (if resolved) |

**Business Constraints:**
- One EscalationState per patient (grouped model)
- New alerts for the same patient join the existing escalation (update max_level if higher severity)
- `max_level` is determined by the highest severity alert in `alert_ids`
- `status` transitions: active → resolved (on acknowledgment) or active → timed_out (at max level with no response)

### EscalationLevelRecord
**Purpose**: Records a single level transition in the escalation timeline

| Field | Type | Description |
|---|---|---|
| level | int | Escalation level (1-4) |
| clinician_id | str | Who was notified at this level |
| clinician_name | str | Display name |
| entered_at | datetime | When this level was entered |
| exited_at | datetime | When this level was exited (escalated or resolved) |
| response_time_seconds | float | Time spent at this level (None if still active) |
| skipped | bool | Whether this level was skipped (off-duty) |

### NotifiedClinician
**Purpose**: Tracks who has been notified during an escalation

| Field | Type | Description |
|---|---|---|
| clinician_id | str | Clinician identifier |
| clinician_name | str | Display name |
| level | int | At what level they were notified |
| notified_at | datetime | When notification was sent |
| is_rrt_member | bool | Whether notified as part of RRT group |

### EscalationEvent
**Purpose**: Audit trail event for escalation timeline

| Field | Type | Description |
|---|---|---|
| id | str | Unique identifier (UUID) |
| escalation_id | str | Reference to EscalationState |
| alert_id | str | Primary alert that triggered this |
| event_type | EscalationEventType | Type of event |
| level | int | Escalation level at time of event |
| clinician_id | str | Clinician involved (if applicable) |
| clinician_name | str | Display name |
| timestamp | datetime | When event occurred |
| context | dict | Additional context data |

**Event Types:**
| Type | Description |
|---|---|
| `started` | Escalation cascade initiated |
| `notified` | Clinician notified at a level |
| `escalated` | Timer expired, moved to next level |
| `skipped` | Level skipped (clinician off-duty) |
| `acknowledged` | Alert acknowledged, cascade stopped |
| `resolved` | Resolution notification sent to team |
| `alert_joined` | New alert joined existing escalation |
| `restarted` | Escalation restarted due to handoff |

### EscalationConfig
**Purpose**: Configurable escalation parameters

| Field | Type | Description |
|---|---|---|
| level_timeouts | dict[int, int] | Level → timeout in seconds |
| severity_max_levels | dict[str, int] | Severity → max escalation level |
| demo_time_scale | float | Time multiplier for demo mode (default 30.0) |

**Default Values:**
| Setting | Value |
|---|---|
| Level 1 → 2 timeout | 300 seconds (5 min) |
| Level 2 → 3 timeout | 300 seconds (5 min from Level 2 entry) |
| Level 3 → 4 timeout | 300 seconds (5 min from Level 3 entry) |
| WARNING max level | 3 |
| CRITICAL max level | 4 |
| Demo time scale | 30.0 (300s → 10s) |

### HandoffSummary
**Purpose**: Auto-generated summary when care team assignments change

| Field | Type | Description |
|---|---|---|
| patient_ids | list[str] | Patients transferred |
| active_alerts | list[Alert] | Active alerts for transferred patients |
| pending_escalations | list[EscalationState] | Active escalations for transferred patients |
| patients_requiring_attention | list[str] | Patient IDs with active alerts or escalations |
| recent_acknowledgments | list[Alert] | Acknowledged alerts in last 1 hour |
| generated_at | datetime | When summary was created |
| from_clinician_id | str | Outgoing clinician |
| to_clinician_id | str | Incoming clinician |

---

## Enumerations

### EscalationStatus
| Value | Description |
|---|---|
| `active` | Escalation in progress |
| `resolved` | Acknowledged by a clinician |
| `timed_out` | Reached max level with no response |

### CareTeamStatus
| Value | Description |
|---|---|
| `active` | Team is currently active |
| `inactive` | Team is no longer active |
| `suspended` | Team temporarily suspended |

### EscalationEventType
| Value | Description |
|---|---|
| `started` | Cascade initiated |
| `notified` | Clinician notified |
| `escalated` | Level transition |
| `skipped` | Level skipped (off-duty) |
| `acknowledged` | Alert acknowledged |
| `resolved` | Team notified of resolution |
| `alert_joined` | New alert joined group |
| `restarted` | Cascade restarted (handoff) |

