# Component Methods

## Connected Care / Remote Patient Monitoring PoC

Method signatures for each component. Detailed business rules will be defined in Functional Design.

---

## Backend Methods

### Vital Signs Simulator (`simulator.py`)

| Method | Input | Output | Purpose |
|---|---|---|---|
| `start_simulation()` | None | None | Start background tasks for all 10 patients |
| `stop_simulation()` | None | None | Stop all simulation tasks |
| `generate_vitals(patient_id: str)` | patient_id | VitalSigns | Generate one reading for a patient |
| `trigger_condition(patient_id: str, condition: str)` | patient_id, condition name | bool | Shift patient vitals to simulate condition |
| `reset_patient(patient_id: str)` | patient_id | bool | Return patient vitals to normal ranges |
| `get_patients()` | None | List[Patient] | Return all patient records |

### Alert Engine (`alerts.py`)

| Method | Input | Output | Purpose |
|---|---|---|---|
| `evaluate_vitals(patient_id: str, vitals: VitalSigns)` | patient_id, vitals | List[Alert] or None | Check vitals against thresholds, generate alerts |
| `get_active_alerts()` | None | List[Alert] | Return all unacknowledged alerts |
| `get_patient_alerts(patient_id: str)` | patient_id | List[Alert] | Return alerts for specific patient |
| `acknowledge_alert(alert_id: str, note: str)` | alert_id, note text | Alert | Mark alert as acknowledged with note |
| `get_alert_history()` | None | List[Alert] | Return all alerts (active + acknowledged) |
| `get_thresholds()` | None | Dict | Return current threshold configuration |

### Patient Manager (`patients.py`) — REST Endpoints

| Endpoint | Method | Input | Output | Purpose |
|---|---|---|---|---|
| `GET /api/patients` | GET | None | List[Patient] | Get all patients with current status |
| `GET /api/patients/{id}` | GET | patient_id | Patient | Get single patient detail |
| `POST /api/patients/{id}/simulate` | POST | patient_id, condition | bool | Trigger condition simulation |
| `POST /api/patients/{id}/reset` | POST | patient_id | bool | Reset patient to normal |
| `GET /api/alerts` | GET | None | List[Alert] | Get all active alerts |
| `GET /api/alerts/history` | GET | None | List[Alert] | Get alert history |
| `POST /api/alerts/{id}/acknowledge` | POST | alert_id, note | Alert | Acknowledge an alert |
| `GET /api/thresholds` | GET | None | Dict | Get threshold configuration |

### WebSocket Manager (`websocket_manager.py`)

| Method | Input | Output | Purpose |
|---|---|---|---|
| `connect(websocket: WebSocket)` | WebSocket connection | None | Register new client connection |
| `disconnect(websocket: WebSocket)` | WebSocket connection | None | Remove client connection |
| `broadcast_vitals(data: dict)` | vitals data | None | Send vitals update to all clients |
| `broadcast_alert(alert: Alert)` | alert object | None | Send new alert to all clients |

### WebSocket Endpoint

| Endpoint | Purpose |
|---|---|
| `WS /ws` | WebSocket connection for real-time vitals and alert streaming |

**WebSocket Message Types (Server → Client):**
- `{"type": "vitals_update", "data": {...}}` — New vital signs reading
- `{"type": "new_alert", "data": {...}}` — New alert generated
- `{"type": "alert_acknowledged", "data": {...}}` — Alert was acknowledged

---

## Frontend Methods

### WebSocketClient

| Method | Input | Output | Purpose |
|---|---|---|---|
| `connect(url: string)` | WebSocket URL | void | Establish connection |
| `disconnect()` | None | void | Close connection |
| `onVitalsUpdate(callback)` | callback function | void | Register vitals update handler |
| `onNewAlert(callback)` | callback function | void | Register alert handler |
| `onAlertAcknowledged(callback)` | callback function | void | Register acknowledgment handler |

### AudioAlertManager

| Method | Input | Output | Purpose |
|---|---|---|---|
| `playWarningSound()` | None | void | Play warning-level audio |
| `playCriticalSound()` | None | void | Play critical-level audio |
| `stopSound()` | None | void | Stop current audio playback |
| `mute()` | None | void | Mute all audio |
| `unmute()` | None | void | Unmute audio |
| `isPlaying()` | None | boolean | Check if audio is currently playing |

### State Management (useReducer actions)

| Action Type | Payload | Purpose |
|---|---|---|
| `UPDATE_VITALS` | { patientId, vitals } | Update patient's current vital signs |
| `ADD_ALERT` | { alert } | Add new alert to active alerts list |
| `ACKNOWLEDGE_ALERT` | { alertId, note, timestamp } | Move alert to acknowledged state |
| `SET_PATIENTS` | { patients[] } | Initialize patient list |
| `UPDATE_PATIENT_STATUS` | { patientId, status } | Update patient overall status |
