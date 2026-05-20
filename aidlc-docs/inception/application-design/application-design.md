# Application Design — Consolidated

## Connected Care / Remote Patient Monitoring PoC

---

## Architecture Overview

A single-process Python/FastAPI backend with background async simulation tasks, communicating with a React frontend via REST (commands/queries) and WebSocket (real-time data push).

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
+------------------------------------------------------------------+
         |  REST API  |              |  WebSocket  |
         v            v              v             v
+------------------------------------------------------------------+
|                      FRONTEND (React)                             |
|                                                                  |
|  [WebSocketClient] --dispatch--> [Context/Reducer]               |
|                                        |                         |
|  [DashboardPage]                  state updates                  |
|    +-- [PatientGrid]                   |                         |
|    |     +-- [PatientTile] x10  <------+                         |
|    +-- [AlertSidebar]                                            |
|          +-- [AlertCard] xN                                      |
|          +-- [AudioAlertManager]                                 |
+------------------------------------------------------------------+
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend framework | Python/FastAPI | User preference, async support, WebSocket built-in |
| Backend organization | Modular route files | Clean separation without over-engineering |
| Frontend framework | React | User preference, rich ecosystem |
| Frontend organization | Atomic Design | Structured component hierarchy (atoms → molecules → organisms → templates → pages) |
| Communication | REST + WebSocket | REST for commands, WebSocket for real-time streaming |
| IoT simulation | Background async tasks | Simplest approach, single process, no IPC needed |
| State management | React Context + useReducer | Lightweight, no external dependencies |
| Threshold evaluation | Backend only | Single source of truth, consistent alerting |
| Audio alerts | Web Audio API + priority queue | Different sounds for warning/critical, queue management |
| Data storage | In-memory | PoC simplicity, no persistence needed |

---

## Component Summary

### Backend (5 modules)
1. **simulator.py** — Generates vitals for 10 patients every 5 seconds
2. **alerts.py** — Evaluates thresholds, manages alert lifecycle
3. **patients.py** — REST endpoints for patient data and commands
4. **websocket_manager.py** — WebSocket connection management and broadcasting
5. **models.py** — Data structures (Patient, VitalSigns, Alert)

### Frontend (Atomic Design hierarchy)
- **Atoms**: VitalSignBadge, StatusIndicator, AlertBadge
- **Molecules**: PatientTile, AlertCard, SimulationControls
- **Organisms**: PatientGrid, AlertSidebar, PatientDetailPanel
- **Templates**: DashboardTemplate
- **Pages**: DashboardPage

### Cross-Cutting
- **AudioAlertManager** — Web Audio API with priority queue
- **WebSocketClient** — Connection management and message parsing

---

## API Contract Summary

### REST Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/patients` | GET | List all patients with current status |
| `/api/patients/{id}` | GET | Get single patient detail |
| `/api/patients/{id}/simulate` | POST | Trigger condition simulation |
| `/api/patients/{id}/reset` | POST | Reset patient to normal |
| `/api/alerts` | GET | Get active alerts |
| `/api/alerts/history` | GET | Get alert history |
| `/api/alerts/{id}/acknowledge` | POST | Acknowledge alert with note |
| `/api/thresholds` | GET | Get threshold configuration |

### WebSocket
| Endpoint | Direction | Message Types |
|---|---|---|
| `/ws` | Server → Client | `vitals_update`, `new_alert`, `alert_acknowledged` |

---

## Key Design Decisions

1. **Single process**: Everything runs in one FastAPI process — simulator, alert engine, WebSocket server. Simplest deployment for PoC.
2. **Backend-authoritative alerts**: Threshold evaluation happens server-side only. Frontend displays what the backend tells it. No client-side threshold logic.
3. **Unidirectional frontend data flow**: WebSocket → dispatch → state → render. User actions → REST → server → WebSocket broadcast → state → render.
4. **No persistence**: All data lives in memory. Restarting the server resets everything.
5. **WCAG 2.0 compliance**: Colors meet AA contrast ratios. Status indicators use color + icon + text. Audio alerts have visual equivalents.
