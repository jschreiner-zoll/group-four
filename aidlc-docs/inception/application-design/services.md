# Service Definitions — Care Team Escalation Routing & Management

---

## Service Architecture Overview

The escalation feature adds two new backend services and one new frontend service, all operating within the existing single-process FastAPI architecture. The key design principle is **loose coupling** — the escalation engine connects to the existing alert system via callback hooks, not direct integration.

---

## New Backend Services

### 1. Escalation Service
**Responsibility**: Orchestrate the complete escalation lifecycle from alert creation through resolution

**Interactions**:
- Receives alert creation events via callback hook registered on AlertEngine
- Receives acknowledgment events via callback hook registered on AlertEngine
- Uses CareTeamManager to look up who to notify at each level
- Uses EscalationTracker to manage escalation state
- Uses VirtualClock to schedule time-based escalation transitions
- Broadcasts escalation events via WebSocket Manager

**Orchestration Flow — Alert Created**:
```
[AlertEngine.on_alert_created hook fires]
  -> EscalationEngine.on_alert_created(alert)
  -> CareTeamManager.get_clinician_for_level(patient_id, level=1)
  -> IF clinician is off-duty: get_next_available_level()
  -> EscalationTracker.create_escalation(alert_id, patient_id, clinician)
  -> notify_clinician(clinician_id, alert, level)
  -> WebSocketManager.broadcast(escalation_event: notified)
  -> VirtualClock.call_later(timeout, escalate_to_next_level)
  -> EscalationTracker.set_pending_callback(alert_id, handle)
```

**Orchestration Flow — Timer Expires (Escalate)**:
```
[VirtualClock callback fires]
  -> EscalationEngine.escalate_to_next_level(alert_id)
  -> EscalationTracker.get_escalation(alert_id)
  -> Check max level for alert severity
  -> IF at max level: stop (no further escalation)
  -> CareTeamManager.get_clinician_for_level(patient_id, next_level)
  -> IF clinician off-duty: skip to next available level
  -> IF level == 4 (RRT): get_rrt_members() -> notify each
  -> EscalationTracker.record_level_change(alert_id, new_level, clinician)
  -> notify_clinician(clinician_id, alert, new_level)
  -> WebSocketManager.broadcast(escalation_event: escalated)
  -> VirtualClock.call_later(next_timeout, escalate_to_next_level)
```

**Orchestration Flow — Alert Acknowledged**:
```
[AlertEngine.on_alert_acknowledged hook fires]
  -> EscalationEngine.on_alert_acknowledged(alert_id, acknowledged_by)
  -> EscalationTracker.get_pending_callback(alert_id)
  -> VirtualClock.cancel(callback_handle)
  -> EscalationTracker.record_acknowledgment(alert_id, clinician_id)
  -> EscalationTracker.complete_escalation(alert_id, "acknowledged")
  -> notify_resolution(alert_id, acknowledged_by)
  -> WebSocketManager.broadcast(escalation_event: resolved) to all notified clinicians
```

### 2. Care Team Service
**Responsibility**: Manage care team assignments, clinician roster, and shift operations

**Interactions**:
- Serves REST endpoints for care team CRUD
- Provides clinician lookup for Escalation Service
- Generates handoff summaries using EscalationTracker data
- Broadcasts care team changes via WebSocket Manager

**Orchestration Flow — Bulk Handoff**:
```
[POST /api/care-team/handoff received]
  -> CareTeamManager.generate_handoff_summary(patient_ids, outgoing_clinician)
  -> CareTeamManager.bulk_handoff(patient_ids, to_clinician, level)
  -> Update active escalations if affected patients have pending escalations
  -> WebSocketManager.broadcast(handoff_complete: summary)
  -> WebSocketManager.broadcast(care_team_updated) per patient
```

**Orchestration Flow — Duty Status Change**:
```
[PUT /api/care-team/clinicians/{id}/status received]
  -> CareTeamManager.set_duty_status(clinician_id, on_duty)
  -> IF going off-duty: check active escalations targeting this clinician
  -> IF active escalation at this clinician's level: escalate immediately to next
  -> WebSocketManager.broadcast(clinician_status_changed)
```

### 3. Virtual Clock Service
**Responsibility**: Provide time abstraction for all escalation timer operations

**Interactions**:
- Used by Escalation Service for scheduling callbacks
- Controlled by demo mode toggle (REST endpoint)
- Referenced by EscalationTracker for timestamp recording

**Orchestration Flow — Demo Mode Toggle**:
```
[POST /api/escalation/demo-mode received]
  -> VirtualClock.set_time_scale(30.0 if demo else 1.0)
  -> All future call_later() calls use scaled delays
  -> Existing pending callbacks are NOT rescheduled (only new ones use new scale)
  -> WebSocketManager.broadcast(demo_mode_changed)
```

---

## New Frontend Service

### 4. Escalation Real-Time Service (EscalationContext + WebSocket)
**Responsibility**: Manage escalation-specific real-time data flow

**Orchestration Flow**:
```
[WebSocket escalation_event received]
  -> Parse event type (escalated | resolved | acknowledged | notified)
  -> IF type == "escalated" or "notified":
     -> dispatch UPDATE_ESCALATION
     -> IF target clinician matches selectedClinician: dispatch ADD_NOTIFICATION
  -> IF type == "resolved" or "acknowledged":
     -> dispatch REMOVE_ESCALATION
     -> IF selectedClinician was notified: dispatch ADD_NOTIFICATION (resolution)

[WebSocket care_team_updated received]
  -> dispatch UPDATE_CARE_TEAM

[WebSocket clinician_status_changed received]
  -> dispatch UPDATE_CLINICIAN_STATUS

[WebSocket handoff_complete received]
  -> dispatch SET_HANDOFF_SUMMARY
  -> Show ShiftHandoffCard
```

---

## Service Communication Summary

```
+-------------------+       +------------------+       +-------------------+
|   Alert Engine    | -hook-> | Escalation      | ----> |   WebSocket Mgr   |
|   (existing)      |       |   Engine (NEW)   |       |   (broadcast)     |
+-------------------+       +------------------+       +-------------------+
                                    |       |                    |
                                    v       v                    v
                            +--------+  +--------+      +-------------------+
                            | Care   |  | Escal. |      |   React Frontend  |
                            | Team   |  | Tracker|      |   (via WS)        |
                            | Mgr    |  | (NEW)  |      +-------------------+
                            | (NEW)  |  +--------+              |
                            +--------+      |                   v
                                    |       |           +-------------------+
                                    v       v           | EscalationContext |
                            +------------------+        |   (NEW)           |
                            |  Virtual Clock   |        +-------------------+
                            |  (NEW)           |                |
                            +------------------+                v
                                                        +-------------------+
                                                        | CareTeamPage      |
                                                        | (NEW)             |
                                                        +-------------------+
```

---

## Integration with Existing Services

| Existing Service | Integration Point | Change Type |
|---|---|---|
| Alert Service (AlertEngine) | Register on_alert_created and on_alert_acknowledged hooks | Minor extension (add hook registration) |
| WebSocket Manager | New message types broadcast | Minor extension (new broadcast calls) |
| Simulation Service | Demo mode toggle affects VirtualClock | New endpoint, no existing code change |
| Patient Data Service | No direct changes | Unchanged |
| Audio Alert Service | No changes | Unchanged |

**Key Principle**: The existing AlertEngine gains two hook registration points but its internal logic remains unchanged. All escalation logic lives in the new EscalationEngine module.

