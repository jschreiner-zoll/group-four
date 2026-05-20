# Component Definitions

## Connected Care / Remote Patient Monitoring PoC

---

## Backend Components (Python/FastAPI)

### 1. Vital Signs Simulator (`simulator.py`)
**Purpose**: Generate realistic simulated vital sign data for 10 virtual patients

**Responsibilities**:
- Maintain patient registry with demographic data
- Generate physiologically realistic vital signs at 5-second intervals
- Support condition simulation (tachycardia, bradycardia, hypoxia, etc.)
- Provide "return to normal" reset capability per patient
- Run as background async tasks within the FastAPI server

### 2. Alert Engine (`alerts.py`)
**Purpose**: Evaluate vital signs against thresholds and generate alerts

**Responsibilities**:
- Monitor incoming vital sign data against configurable thresholds
- Generate alerts with severity classification (warning/critical)
- Manage alert lifecycle (active → acknowledged)
- Store alert history in memory
- Push new alerts to connected clients via WebSocket

### 3. Patient Manager (`patients.py`)
**Purpose**: Manage patient data and provide REST/WebSocket endpoints

**Responsibilities**:
- Maintain in-memory patient state (demographics + current vitals + status)
- Expose REST endpoints for patient data queries
- Expose REST endpoints for commands (trigger simulation, acknowledge alert)
- Broadcast real-time vital updates via WebSocket

### 4. WebSocket Manager (`websocket_manager.py`)
**Purpose**: Manage WebSocket connections and message broadcasting

**Responsibilities**:
- Track active WebSocket connections
- Broadcast vital sign updates to all connected clients
- Broadcast alert notifications to all connected clients
- Handle connection/disconnection lifecycle

### 5. Data Models (`models.py`)
**Purpose**: Define data structures for the application

**Responsibilities**:
- Define Patient, VitalSigns, Alert, and AlertAcknowledgment data models
- Provide serialization/deserialization for WebSocket messages
- Define threshold configuration structures

---

## Frontend Components (React — Atomic Design)

### Atoms (Smallest UI elements)

### 6. VitalSignBadge
**Purpose**: Display a single vital sign value with status color coding

**Responsibilities**:
- Render vital sign label, value, and unit
- Apply WCAG 2.0 compliant color based on status (normal/warning/critical)
- Include non-color status indicator (icon)

### 7. StatusIndicator
**Purpose**: Show patient overall status (normal/warning/critical)

**Responsibilities**:
- Render colored dot/icon with text label
- WCAG 2.0 AA compliant colors
- Accessible to screen readers

### 8. AlertBadge
**Purpose**: Display alert count or severity indicator

**Responsibilities**:
- Show number of active alerts
- Color-coded by highest severity
- Accessible label for screen readers

### Molecules (Combinations of atoms)

### 9. PatientTile
**Purpose**: Display a single patient's summary with all current vitals

**Responsibilities**:
- Render patient name, room/bed, and overall status
- Display all 7 vital sign values using VitalSignBadge atoms
- Show active alert count
- Provide click-through to patient detail view
- Display condition simulation buttons

### 10. AlertCard
**Purpose**: Display a single alert with details and acknowledge action

**Responsibilities**:
- Show alert severity, patient name, vital sign, threshold breached, timestamp
- Provide "Acknowledge" button with note input field
- Visual distinction between active and acknowledged states

### 11. SimulationControls
**Purpose**: Provide buttons to trigger medical condition simulations

**Responsibilities**:
- Render individual buttons for each condition (Tachycardia, Bradycardia, Hypoxia, etc.)
- Include "Return to Normal" reset button
- Disable buttons when condition is already active

### Organisms (Complex UI sections)

### 12. PatientGrid
**Purpose**: Multi-patient tile grid showing all patients simultaneously

**Responsibilities**:
- Render responsive grid of PatientTile molecules
- Sort/highlight patients by severity
- Handle real-time updates from WebSocket

### 13. AlertSidebar
**Purpose**: Sidebar panel showing active alerts with management controls

**Responsibilities**:
- List active alerts sorted by severity then timestamp
- Provide alert acknowledgment workflow
- Show alert history (acknowledged alerts)
- Trigger audio alerts for new notifications

### 14. PatientDetailPanel
**Purpose**: Expanded view of a single patient's data

**Responsibilities**:
- Show all vital signs with larger display
- Show patient demographics
- List patient-specific alerts
- Provide simulation controls for the selected patient

### Templates (Page layouts)

### 15. DashboardTemplate
**Purpose**: Define the overall dashboard layout structure

**Responsibilities**:
- Define grid/sidebar layout proportions
- Handle responsive breakpoints
- Provide slots for PatientGrid and AlertSidebar

### Pages

### 16. DashboardPage
**Purpose**: Main landing page assembling all dashboard components

**Responsibilities**:
- Connect to WebSocket for real-time data
- Manage application state via Context API + useReducer
- Orchestrate data flow between components
- Handle audio alert playback via Web Audio API

---

## Shared/Cross-Cutting

### 17. AudioAlertManager
**Purpose**: Manage audio notifications with priority queue

**Responsibilities**:
- Play different sounds for warning vs critical alerts
- Queue management (don't overlap sounds)
- Provide mute/unmute control
- Stop sound on alert acknowledgment

### 18. WebSocketClient
**Purpose**: Frontend WebSocket connection management

**Responsibilities**:
- Establish and maintain WebSocket connection to backend
- Parse incoming messages (vitals updates, alert notifications)
- Dispatch received data to application state
- Handle reconnection on disconnect
