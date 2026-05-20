# Component Dependencies — Care Team Escalation Routing & Management

---

## Dependency Matrix

### Backend Dependencies

| Component | Depends On | Depended On By |
|---|---|---|
| `escalation.py` (EscalationEngine) | CareTeamManager, EscalationTracker, VirtualClock, WebSocketManager | main.py (startup registration) |
| `care_team.py` (CareTeamManager) | fhir_models.py | EscalationEngine, REST endpoints |
| `escalation_tracker.py` (EscalationTracker) | fhir_models.py | EscalationEngine, REST endpoints |
| `virtual_clock.py` (VirtualClock) | asyncio | EscalationEngine |
| `fhir_models.py` | pydantic | CareTeamManager, EscalationTracker, REST endpoints |
| `alerts.py` (AlertEngine) — EXISTING | models.py | EscalationEngine (via hooks) |
| `websocket_manager.py` — EXISTING | — | EscalationEngine, CareTeamManager |
| `main.py` — EXISTING | All modules | — |

### Frontend Dependencies

| Component | Depends On | Depended On By |
|---|---|---|
| EscalationContext | WebSocket, API service | All escalation components |
| CareTeamPage | EscalationContext, CareTeamTable, ClinicianRoster, EscalationHistoryTimeline | App router |
| CareTeamTable | EscalationContext, CareTeamAssignmentRow | CareTeamPage |
| ClinicianRoster | EscalationContext | CareTeamPage |
| EscalationHistoryTimeline | EscalationContext | CareTeamPage |
| EscalationStatusPanel | EscalationContext, EscalationBadge, CountdownTimer | AlertCard (enhanced) |
| ClinicianSelector | EscalationContext | DashboardPage header |
| NotificationPanel | EscalationContext, NotificationToast | DashboardPage |
| AlertCard (enhanced) | EscalationStatusPanel, existing props | AlertSidebar |

---

## Communication Patterns

### Backend Communication

```
Hook Pattern (Loose Coupling):
  AlertEngine --[on_alert_created]--> EscalationEngine
  AlertEngine --[on_alert_acknowledged]--> EscalationEngine

Direct Method Calls:
  EscalationEngine --> CareTeamManager.get_clinician_for_level()
  EscalationEngine --> EscalationTracker.create_escalation()
  EscalationEngine --> VirtualClock.call_later()
  EscalationEngine --> WebSocketManager.broadcast()
  CareTeamManager --> EscalationTracker.get_escalations_for_patient()

REST API (Frontend -> Backend):
  Frontend --> /api/care-team/* --> CareTeamManager
  Frontend --> /api/escalation/* --> EscalationTracker + EscalationEngine

WebSocket (Backend -> Frontend):
  EscalationEngine --> WebSocketManager --> Frontend (escalation_event)
  CareTeamManager --> WebSocketManager --> Frontend (care_team_updated)
```

### Frontend Communication

```
Context Pattern:
  EscalationContext <-- WebSocket messages
  EscalationContext --> CareTeamPage (via useContext)
  EscalationContext --> AlertCard/EscalationStatusPanel (via useContext)
  EscalationContext --> ClinicianSelector (via useContext)
  EscalationContext --> NotificationPanel (via useContext)

REST Calls:
  CareTeamPage --> /api/care-team/* (CRUD operations)
  CareTeamPage --> /api/escalation/* (history, config)
  SimulationControls --> /api/escalation/demo-mode (toggle)
```

---

## Data Flow Diagram

### Escalation Cascade Flow

```
+-------------+     hook      +------------------+    lookup    +----------------+
| AlertEngine | -----------> | EscalationEngine | ----------> | CareTeamManager|
| (existing)  |              |                  |             |                |
+-------------+              +------------------+             +----------------+
                                    |       |
                          schedule  |       | track
                                    v       v
                            +--------+  +------------------+
                            | Virtual|  | EscalationTracker|
                            | Clock  |  |                  |
                            +--------+  +------------------+
                                    |
                          callback  |
                          fires     v
                            +------------------+    broadcast   +----------------+
                            | EscalationEngine | ------------> | WebSocket Mgr  |
                            | .escalate_to_    |               |                |
                            |  next_level()    |               +----------------+
                            +------------------+                       |
                                                                       v
                                                               +----------------+
                                                               | React Frontend |
                                                               | (Escalation    |
                                                               |  Context)      |
                                                               +----------------+
```

### Acknowledgment Flow

```
+-------------+     hook      +------------------+    cancel    +--------+
| AlertEngine | -----------> | EscalationEngine | ----------> | Virtual|
| .acknowledge|              | .on_alert_ack()  |             | Clock  |
+-------------+              +------------------+             +--------+
                                    |
                          complete  |
                                    v
                            +------------------+
                            | EscalationTracker|
                            | .complete_       |
                            |  escalation()    |
                            +------------------+
                                    |
                          broadcast |  (resolved notification)
                                    v
                            +------------------+    to all notified
                            | WebSocket Mgr    | ----------------->  Frontend
                            +------------------+
```

---

## Initialization Order (Startup)

```python
# In main.py lifespan/startup:
1. virtual_clock = VirtualClock()
2. care_team_manager = CareTeamManager()  # Initializes roster + default assignments
3. escalation_tracker = EscalationTracker()
4. escalation_engine = EscalationEngine(care_team_manager, escalation_tracker, virtual_clock, ws_manager)
5. alert_engine.register_hook("on_created", escalation_engine.on_alert_created)
6. alert_engine.register_hook("on_acknowledged", escalation_engine.on_alert_acknowledged)
```

---

## Module File Structure (Backend)

```
backend/app/
  ├── __init__.py
  ├── main.py              (MODIFIED — register new routers + hooks)
  ├── config.py            (MODIFIED — add escalation config constants)
  ├── models.py            (EXISTING — unchanged)
  ├── alerts.py            (MODIFIED — add hook registration mechanism)
  ├── patients.py          (EXISTING — unchanged)
  ├── simulator.py         (EXISTING — unchanged)
  ├── websocket_manager.py (EXISTING — unchanged, new broadcast calls from new modules)
  ├── escalation.py        (NEW — EscalationEngine)
  ├── escalation_tracker.py(NEW — EscalationTracker)
  ├── care_team.py         (NEW — CareTeamManager + REST endpoints)
  ├── virtual_clock.py     (NEW — VirtualClock)
  └── fhir_models.py       (NEW — FHIR R4 Pydantic models)
```

## Module File Structure (Frontend)

```
frontend/src/
  ├── context/
  │   ├── AppContext.js          (EXISTING — unchanged)
  │   ├── appReducer.js          (EXISTING — unchanged)
  │   ├── LanguageContext.js     (EXISTING — unchanged)
  │   ├── EscalationContext.js   (NEW)
  │   └── escalationReducer.js   (NEW)
  ├── atoms/
  │   ├── ClinicianSelector.js   (NEW)
  │   ├── EscalationBadge.js     (NEW)
  │   └── CountdownTimer.js      (NEW)
  ├── molecules/
  │   ├── AlertCard.js           (MODIFIED — add EscalationStatusPanel)
  │   ├── EscalationStatusPanel.js (NEW)
  │   ├── CareTeamAssignmentRow.js (NEW)
  │   ├── ShiftHandoffCard.js    (NEW)
  │   ├── NotificationToast.js   (NEW)
  │   └── SimulationControls.js  (MODIFIED — add demo toggle)
  ├── organisms/
  │   ├── CareTeamTable.js       (NEW)
  │   ├── ClinicianRoster.js     (NEW)
  │   ├── EscalationHistoryTimeline.js (NEW)
  │   ├── NotificationPanel.js   (NEW)
  │   └── AlertSidebar.js        (EXISTING — unchanged)
  ├── pages/
  │   ├── DashboardPage.js       (MODIFIED — add sidebar nav + clinician selector)
  │   └── CareTeamPage.js        (NEW)
  └── services/
      ├── api.js                 (MODIFIED — add care team + escalation API calls)
      └── escalationApi.js       (NEW — dedicated escalation API service)
```

