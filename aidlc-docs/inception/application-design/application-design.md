# Application Design — Care Team Escalation Routing & Management (Consolidated)

## Feature Overview

A care team escalation routing system that integrates into the existing RPM platform via loose coupling (callback hooks). When an alert fires, it enters a timed escalation cascade through the patient's assigned care team. Acknowledging at any level stops the cascade and notifies the whole team.

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                    BACKEND (FastAPI) — EXTENDED                   |
|                                                                  |
|  [AlertEngine] --hook--> [EscalationEngine] --schedule-->        |
|       |                       |        |              [VirtClock] |
|       |                       v        v                         |
|       |              [CareTeamMgr] [EscalTracker]                |
|       |                       |        |                         |
|       +-------vitals----------+--------+--> [WS Manager]         |
|                                                                  |
|  [In-Memory Store]                                               |
|    patients[], alerts[]                                           |
|    clinicians[], care_teams[], escalations[]                      |
+------------------------------------------------------------------+
         |  REST API  |              |  WebSocket  |
         v            v              v             v
+------------------------------------------------------------------+
|                   FRONTEND (React) — EXTENDED                     |
|                                                                  |
|  [WebSocketClient] --dispatch--> [AppContext] + [EscalContext]    |
|                                        |              |          |
|  [Sidebar Nav]                    state updates  escalation      |
|    +-- Dashboard                       |          state          |
|    |     +-- [PatientGrid]             |              |          |
|    |     +-- [AlertSidebar]            |              |          |
|    |           +-- [AlertCard+Escal]   |              |          |
|    +-- Care Team                       |              |          |
|          +-- [CareTeamPage]  <---------+--------------+          |
|          +-- [EscalHistory]                                      |
|                                                                  |
|  [ClinicianSelector] (header)                                    |
|  [NotificationPanel] (overlay)                                   |
+------------------------------------------------------------------+
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Escalation coupling | Loosely coupled (callback hooks) | AlertEngine unchanged; escalation logic fully independent and removable |
| FHIR models | FHIR-native Pydantic models | Direct FHIR R4 structure used internally and for API responses |
| Escalation state | Separate EscalationTracker class | Clean separation; manages all escalations as a collection |
| Frontend state | Separate EscalationContext | Isolated from existing AppContext; no risk of breaking existing functionality |
| Page navigation | Sidebar navigation | Persistent access to both Dashboard and Care Team pages |
| Demo mode timers | Virtual clock with time scaling | Cleanest abstraction; supports testing and demo mode uniformly |
| Notifications | Single escalation_event message type | Simpler WebSocket protocol; frontend parses event.type field |

---

## New Backend Modules (5)

| Module | Purpose |
|---|---|
| `escalation.py` | Escalation engine — manages cascade lifecycle via hooks |
| `escalation_tracker.py` | Tracks all active escalation states and audit trail |
| `care_team.py` | Care team assignments, clinician roster, bulk handoff |
| `virtual_clock.py` | Time abstraction for real-time and demo mode |
| `fhir_models.py` | FHIR R4 Pydantic models (CareTeam, Practitioner, etc.) |

## Modified Backend Modules (3)

| Module | Change |
|---|---|
| `alerts.py` | Add hook registration mechanism (on_created, on_acknowledged) |
| `main.py` | Register new routers, initialize escalation engine, register hooks |
| `config.py` | Add escalation timing constants and default configuration |

---

## New Frontend Components (14)

| Layer | Component | Purpose |
|---|---|---|
| Context | EscalationContext | Escalation state management |
| Context | escalationReducer | Reducer for escalation actions |
| Atom | ClinicianSelector | Role selector dropdown |
| Atom | EscalationBadge | Level indicator with colors |
| Atom | CountdownTimer | Countdown to next escalation |
| Molecule | EscalationStatusPanel | Complete escalation status on alert |
| Molecule | CareTeamAssignmentRow | Patient assignment table row |
| Molecule | ShiftHandoffCard | Handoff summary display |
| Molecule | NotificationToast | Escalation notification popup |
| Organism | CareTeamTable | Full assignment management table |
| Organism | ClinicianRoster | Clinician list with duty controls |
| Organism | EscalationHistoryTimeline | Audit trail timeline view |
| Organism | NotificationPanel | Notification feed for clinician |
| Page | CareTeamPage | Care team management page |

## Modified Frontend Components (3)

| Component | Change |
|---|---|
| AlertCard | Add EscalationStatusPanel, progressive color border |
| SimulationControls | Add demo mode toggle |
| DashboardPage | Add sidebar navigation, ClinicianSelector, NotificationPanel |

---

## API Contract Summary (New Endpoints)

### Care Team Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/care-team/clinicians` | GET | List clinician roster |
| `/api/care-team/clinicians/{id}/status` | PUT | Toggle duty status |
| `/api/care-team/assignments` | GET | List all care team assignments |
| `/api/care-team/assignments/{patient_id}` | GET/PUT | Get/update patient's care team |
| `/api/care-team/handoff` | POST | Bulk handoff patients |
| `/api/care-team/rrt/{patient_id}` | GET/PUT | Get/set RRT members |

### Escalation Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/escalation/active` | GET | List active escalations |
| `/api/escalation/{alert_id}` | GET | Get escalation state |
| `/api/escalation/{alert_id}/timeline` | GET | Get audit trail |
| `/api/escalation/config` | GET/PUT | Get/update escalation config |
| `/api/escalation/demo-mode` | POST | Toggle demo mode |

### WebSocket (New Message Types)
| Type | Payload |
|---|---|
| `escalation_event` | `{type, alert_id, level, clinician_id, timestamp, context}` |
| `care_team_updated` | `{patient_id, care_team}` |
| `clinician_status_changed` | `{clinician_id, on_duty}` |
| `handoff_complete` | `{summary}` |

---

## Pre-populated Demo Data

**4 Clinicians:**
1. Sarah Johnson — Primary Nurse (Level 1)
2. Mike Chen — Charge Nurse (Level 2)
3. Dr. Emily Rodriguez — Attending Physician (Level 3)
4. Alex Thompson — RRT Member (Level 4)

**Default RRT Composition**: Mike Chen + Dr. Emily Rodriguez + Alex Thompson (subset of roster)

**Default Escalation Config:**
- Level 1 → Level 2: 300 seconds (5 min) / 10 seconds (demo)
- Level 2 → Level 3: 600 seconds (10 min) / 20 seconds (demo)
- Level 3 → Level 4: 900 seconds (15 min) / 30 seconds (demo)
- WARNING alerts: max Level 3
- CRITICAL alerts: max Level 4

