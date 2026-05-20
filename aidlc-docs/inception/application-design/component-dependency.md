# Component Dependencies

## Connected Care / Remote Patient Monitoring PoC

---

## Dependency Matrix

| Component | Depends On | Depended By |
|---|---|---|
| **Vital Signs Simulator** | Data Models | Alert Engine, WebSocket Manager |
| **Alert Engine** | Data Models | Patient Manager (REST), WebSocket Manager |
| **Patient Manager** | Data Models, Alert Engine, Simulator | Frontend (via REST) |
| **WebSocket Manager** | None | Simulator, Alert Engine, Frontend |
| **Data Models** | None | All backend components |
| **WebSocketClient** | None | DashboardPage, State Management |
| **AudioAlertManager** | None | AlertSidebar, DashboardPage |
| **State (Context/Reducer)** | WebSocketClient | All frontend UI components |
| **PatientGrid** | PatientTile, State | DashboardTemplate |
| **AlertSidebar** | AlertCard, AudioAlertManager, State | DashboardTemplate |
| **PatientTile** | VitalSignBadge, StatusIndicator, SimulationControls | PatientGrid |
| **AlertCard** | AlertBadge, StatusIndicator | AlertSidebar |
| **DashboardPage** | DashboardTemplate, WebSocketClient, AudioAlertManager, State | App (root) |

---

## Communication Patterns

### Backend Internal Communication
```
Simulator ──(generates vitals)──> Alert Engine ──(evaluates)──> WebSocket Manager
    |                                   |                              |
    +──(broadcasts vitals)──────────────+──(broadcasts alerts)─────────+
                                                                       |
                                                                       v
                                                              Connected Clients
```

**Pattern**: Direct function calls (all in-process, no message broker)
- Simulator calls `alert_engine.evaluate_vitals()` directly
- Simulator calls `websocket_manager.broadcast_vitals()` directly
- Alert Engine calls `websocket_manager.broadcast_alert()` when threshold breached

### Frontend-Backend Communication
```
React App ──(REST GET)──────> FastAPI ──(JSON response)──> React App
React App ──(REST POST)─────> FastAPI ──(JSON response)──> React App
FastAPI   ──(WebSocket push)──────────────────────────────> React App
```

**Patterns**:
- **REST (Request/Response)**: Commands and queries (acknowledge alert, trigger simulation, get patients)
- **WebSocket (Server Push)**: Real-time data (vitals updates every 5s, new alerts, acknowledgment broadcasts)

### Frontend Internal Communication
```
WebSocketClient ──(dispatches)──> Context/Reducer ──(state)──> UI Components
                                                                     |
REST API calls <──(user actions: acknowledge, simulate)──────────────+
```

**Pattern**: Unidirectional data flow
- WebSocket messages → dispatch actions → state updates → component re-renders
- User interactions → REST API calls → server processes → WebSocket broadcasts → state updates

---

## Data Flow Diagram

```
+------------------------------------------------------------------+
|                        BACKEND (FastAPI)                          |
|                                                                  |
|  [Simulator] --vitals--> [Alert Engine] --alert--> [WS Manager]  |
|       |                       |                         |        |
|       +-------vitals----------+-------------------------+        |
|                               |                         |        |
|                        [In-Memory Store]                 |        |
|                         patients[]                       |        |
|                         alerts[]                         |        |
|                         vitals_history[]                 |        |
+------------------------------------------------------------------+
         |  REST API  |              |  WebSocket  |
         v            v              v             v
+------------------------------------------------------------------+
|                      FRONTEND (React)                             |
|                                                                  |
|  [WebSocketClient] --dispatch--> [Context/Reducer]               |
|                                        |                         |
|                                   state updates                  |
|                                        |                         |
|  [DashboardPage]                       v                         |
|    +-- [PatientGrid]  <-- patients, vitals state                 |
|    |     +-- [PatientTile] x10                                   |
|    |           +-- [VitalSignBadge] x7                           |
|    |           +-- [SimulationControls]                          |
|    |                                                             |
|    +-- [AlertSidebar]  <-- alerts state                          |
|          +-- [AlertCard] xN                                      |
|          +-- [AudioAlertManager]                                 |
+------------------------------------------------------------------+
```

---

## Startup Sequence

1. FastAPI server starts
2. In-memory data store initialized (10 patients with demographics)
3. Simulation background tasks started (one per patient)
4. WebSocket endpoint ready for connections
5. React frontend loads, establishes WebSocket connection
6. Frontend receives initial patient data via REST `GET /api/patients`
7. Real-time vitals begin streaming via WebSocket
8. Alert engine evaluates each vitals reading as it's generated
