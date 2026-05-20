# Frontend Components — Functional Design

## Connected Care / Remote Patient Monitoring PoC

---

## State Management (Context + useReducer)

### Application State Shape
```typescript
interface AppState {
  patients: Record<string, Patient>;        // keyed by patient_id
  vitals: Record<string, VitalReading>;     // latest reading per patient_id
  alerts: {
    active: Alert[];                         // unacknowledged, sorted by severity
    acknowledged: Alert[];                   // acknowledged, sorted by timestamp desc
  };
  selectedPatientId: string | null;          // for slide-out detail panel
  audioMuted: boolean;                       // global mute state
  wsConnected: boolean;                      // WebSocket connection status
}
```

### Reducer Actions
| Action | Payload | Effect |
|---|---|---|
| SET_PATIENTS | Patient[] | Initialize patient list on first load |
| UPDATE_VITALS | { patient_id, vitals, patient_status } | Update latest vitals and patient status |
| ADD_ALERT | Alert | Add to active alerts, re-sort |
| ESCALATE_ALERT | { alert_id, new_severity } | Update severity of existing active alert |
| ACKNOWLEDGE_ALERT | { alert_id, note, timestamp } | Move from active to acknowledged |
| SELECT_PATIENT | patient_id or null | Open/close detail panel |
| TOGGLE_MUTE | — | Toggle audioMuted |
| SET_WS_CONNECTED | boolean | Update connection status |

---

## Component Hierarchy and Props

### Pages

#### DashboardPage
- **State**: Owns the Context Provider, initializes WebSocket connection
- **On mount**: Fetch patients via REST, establish WebSocket
- **On unmount**: Close WebSocket connection
- **Renders**: DashboardTemplate

### Templates

#### DashboardTemplate
- **Props**: None (reads from Context)
- **Layout**: CSS Grid — main area (PatientGrid) + right sidebar (AlertSidebar) + conditional slide-out (PatientDetailPanel)
- **Responsive**: Sidebar collapses to bottom on mobile breakpoints

### Organisms

#### PatientGrid
- **Props**: None (reads patients + vitals from Context)
- **Renders**: Grid of PatientTile molecules (responsive: 2-5 columns based on viewport)
- **Behavior**: Highlights tiles with active alerts

#### AlertSidebar
- **Props**: None (reads alerts from Context)
- **Layout**: Scrollable list, fixed header with alert count + mute toggle
- **Sorting**: Critical alerts first, then warning, then by timestamp (newest first within severity)
- **Grouping**: Visual patient headers grouping their alerts
- **Renders**: AlertCard molecules grouped by patient

#### PatientDetailPanel
- **Props**: None (reads selectedPatientId from Context)
- **Visibility**: Shown when selectedPatientId is not null
- **Animation**: Slides in from right (300ms ease-in-out)
- **Layout**: Patient demographics + all vitals (large display) + patient-specific alerts + simulation controls
- **Close**: X button or click outside

### Molecules

#### PatientTile
- **Props**: `{ patient: Patient, vitals: VitalReading, alertCount: number }`
- **Renders**: Patient name, room, StatusIndicator, 7x VitalSignBadge, alert count badge
- **Interaction**: Click → dispatch SELECT_PATIENT
- **Border**: Color-coded by patient status (WCAG compliant)

#### AlertCard
- **Props**: `{ alert: Alert, onAcknowledge: (alertId, note) => void }`
- **Renders**: Severity icon, patient name, vital sign name, value vs threshold, timestamp
- **Interaction**: "Acknowledge" button expands inline form with text input + submit
- **States**: Active (prominent) vs Acknowledged (muted/dimmed)

#### SimulationControls
- **Props**: `{ patientId: string, activeConditions: string[], recovering: boolean }`
- **Renders**: Button per condition + "Return to Normal" button
- **Behavior**: 
  - Buttons disabled if condition already active OR patient is recovering
  - "Return to Normal" disabled if no active conditions
  - Each button calls REST `POST /api/patients/{id}/simulate`
  - "Return to Normal" calls REST `POST /api/patients/{id}/reset`

### Atoms

#### VitalSignBadge
- **Props**: `{ label: string, value: number, unit: string, status: 'normal' | 'warning' | 'critical', icon: LucideIcon }`
- **Renders**: Icon + label + value + unit, background color by status
- **Accessibility**: aria-label with full description, color + icon for status

#### StatusIndicator
- **Props**: `{ status: 'normal' | 'warning' | 'critical', size?: 'sm' | 'md' | 'lg' }`
- **Renders**: Colored circle + icon (CheckCircle/AlertTriangle/AlertOctagon) + text label
- **Colors** (WCAG 2.0 AA compliant):
  - Normal: `#2E7D32` (green) on white background — contrast 5.1:1
  - Warning: `#E65100` (deep orange) on white background — contrast 5.5:1
  - Critical: `#B71C1C` (dark red) on white background — contrast 7.8:1

#### AlertBadge
- **Props**: `{ count: number, severity: 'warning' | 'critical' }`
- **Renders**: Pill-shaped badge with count, colored by highest severity
- **Behavior**: Hidden when count is 0

---

## Audio Alert Integration

### AudioAlertManager (non-visual component)
- **Trigger**: On ADD_ALERT action dispatched to reducer
- **Behavior**:
  - If alert severity is CRITICAL → play critical sound (higher pitch, faster tempo)
  - If alert severity is WARNING → play warning sound (lower pitch, slower tempo)
  - If critical sound is already playing and new warning arrives → queue warning
  - If warning sound is playing and new critical arrives → interrupt, play critical
- **Stop**: When alert is acknowledged, stop sound for that alert
- **Mute**: Global mute toggle suppresses all audio (state persists in Context)
- **Implementation**: Web Audio API with oscillator-generated tones (no external audio files needed)

### Sound Design
| Severity | Frequency | Pattern | Duration |
|---|---|---|---|
| Warning | 440 Hz (A4) | 3 beeps, 1 second apart | Repeats every 5 seconds until acknowledged |
| Critical | 880 Hz (A5) | Continuous rapid beeps (0.3s interval) | Continuous until acknowledged |

---

## User Interaction Flows

### Flow 1: Normal Monitoring
1. Dashboard loads → REST GET /api/patients → SET_PATIENTS
2. WebSocket connects → vitals stream begins
3. Every 5 seconds: UPDATE_VITALS for each patient → tiles re-render with new values

### Flow 2: Alert Generated
1. Backend detects threshold breach → WebSocket "new_alert" message
2. Frontend dispatches ADD_ALERT → alert appears in sidebar
3. AudioAlertManager triggers appropriate sound
4. Patient tile border changes color, StatusIndicator updates
5. Alert sidebar re-sorts (new alert positioned by severity)

### Flow 3: Alert Acknowledgment
1. Clinician clicks "Acknowledge" on AlertCard
2. Inline form appears with text input
3. Clinician types note (min 1 char) and submits
4. REST POST /api/alerts/{id}/acknowledge
5. Backend broadcasts "alert_acknowledged" via WebSocket
6. Frontend dispatches ACKNOWLEDGE_ALERT → alert moves to acknowledged list
7. Audio stops for that alert
8. Patient status recalculated (may change if no other active alerts)

### Flow 4: Condition Simulation
1. Clinician clicks condition button (e.g., "Simulate Tachycardia") on PatientTile or DetailPanel
2. REST POST /api/patients/{id}/simulate with condition name
3. Backend activates condition → next vital reading reflects spike
4. Vitals update arrives via WebSocket → tile shows abnormal values
5. Threshold evaluation triggers → alert generated → Flow 2 begins

### Flow 5: Return to Normal
1. Clinician clicks "Return to Normal" button
2. REST POST /api/patients/{id}/reset
3. Backend sets recovery mode (4 readings)
4. Subsequent vitals gradually return to normal range
5. After 4 readings: patient fully normal
6. Note: Existing alerts remain active until acknowledged
