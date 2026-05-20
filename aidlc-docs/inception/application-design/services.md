# Service Definitions

## Connected Care / Remote Patient Monitoring PoC

---

## Service Architecture Overview

The application uses a simple service pattern within a single FastAPI process. Services coordinate between components without external message brokers or microservice boundaries.

---

## Backend Services

### 1. Simulation Service
**Responsibility**: Orchestrate the lifecycle of patient vital sign simulation

**Interactions**:
- Starts/stops background async tasks for each patient
- Feeds generated vitals to the Alert Engine for threshold evaluation
- Feeds generated vitals to the WebSocket Manager for client broadcast
- Responds to simulation trigger/reset commands from REST endpoints

**Orchestration Flow**:
```
[Simulation Loop] → generate_vitals(patient)
                  → alert_engine.evaluate_vitals(patient_id, vitals)
                  → websocket_manager.broadcast_vitals(vitals_data)
                  → (if alert generated) websocket_manager.broadcast_alert(alert)
```

### 2. Alert Service
**Responsibility**: Coordinate alert lifecycle from generation through acknowledgment

**Interactions**:
- Receives vitals from Simulation Service for threshold evaluation
- Generates alerts and stores in memory
- Broadcasts new alerts via WebSocket Manager
- Processes acknowledgment commands from REST endpoints
- Broadcasts acknowledgment updates via WebSocket Manager

**Orchestration Flow**:
```
[Threshold Breach Detected]
  → Create Alert object (severity, patient, vital, timestamp)
  → Store in active_alerts list
  → Update patient status (normal → warning/critical)
  → websocket_manager.broadcast_alert(alert)

[Acknowledgment Received]
  → Validate alert exists and is active
  → Update alert status to "acknowledged"
  → Store clinician note and timestamp
  → websocket_manager.broadcast(alert_acknowledged)
```

### 3. Patient Data Service
**Responsibility**: Maintain patient state and serve data queries

**Interactions**:
- Provides patient registry data to REST endpoints
- Updates patient status based on alert engine evaluations
- Serves initial patient data on frontend connection

---

## Frontend Services

### 4. Real-Time Data Service (WebSocketClient + Context)
**Responsibility**: Manage real-time data flow from backend to UI components

**Orchestration Flow**:
```
[WebSocket Message Received]
  → Parse message type
  → IF vitals_update: dispatch UPDATE_VITALS action
  → IF new_alert: dispatch ADD_ALERT action + trigger AudioAlertManager
  → IF alert_acknowledged: dispatch ACKNOWLEDGE_ALERT action
```

### 5. Audio Alert Service (AudioAlertManager)
**Responsibility**: Manage audio notifications with priority and queue

**Orchestration Flow**:
```
[New Alert Received]
  → Check severity (warning vs critical)
  → IF critical: playCriticalSound() (interrupts warning)
  → IF warning: playWarningSound() (queued if critical playing)
  → On acknowledgment: stopSound() for that alert
```

---

## Service Communication Summary

```
+-------------------+       +------------------+       +-------------------+
|   Simulation      | ----> |   Alert Engine   | ----> |   WebSocket Mgr   |
|   Service         |       |   Service        |       |   (broadcast)     |
+-------------------+       +------------------+       +-------------------+
        |                           |                           |
        v                           v                           v
+-------------------+       +------------------+       +-------------------+
|   Patient Data    |       |   In-Memory      |       |   React Frontend  |
|   Service         |       |   Alert Store    |       |   (via WS)        |
+-------------------+       +------------------+       +-------------------+
                                                                |
                                                                v
                                                       +-------------------+
                                                       |   Audio Alert     |
                                                       |   Manager         |
                                                       +-------------------+
```
