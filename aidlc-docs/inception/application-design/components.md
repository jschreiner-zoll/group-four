# Component Definitions — Care Team Escalation Routing & Management

## Connected Care / Remote Patient Monitoring — Feature Extension

---

## New Backend Components (Python/FastAPI)

### 1. Escalation Engine (`escalation.py`)
**Purpose**: Manage time-based alert escalation cascades using event-driven callbacks

**Responsibilities**:
- Register as a hook/callback on the existing AlertEngine (loosely coupled)
- Start escalation cascade when new alerts are created
- Schedule escalation level transitions using virtual clock callbacks
- Cancel pending escalations when alerts are acknowledged
- Track escalation state via EscalationTracker
- Broadcast escalation events via WebSocket
- Support configurable max escalation level per severity type
- Notify all previously-notified team members on resolution

### 2. Care Team Manager (`care_team.py`)
**Purpose**: Manage care team assignments, clinician roster, and shift operations

**Responsibilities**:
- Maintain in-memory clinician roster with duty status
- Manage patient-to-care-team assignments (FHIR CareTeam resources)
- Handle patient reassignment between clinicians
- Support bulk handoff operations
- Generate shift handoff summaries
- Provide care team lookup for escalation routing
- Expose REST endpoints for care team CRUD operations

### 3. Escalation Tracker (`escalation_tracker.py`)
**Purpose**: Track and manage escalation state for all active alert escalations

**Responsibilities**:
- Maintain collection of active EscalationState objects (keyed by alert_id)
- Provide query methods (get by alert, get by clinician, get by patient)
- Record escalation history (who notified, when, at what level)
- Track response times per escalation level
- Provide audit trail data for any alert's escalation timeline
- Manage scheduled callback references for cancellation

### 4. Virtual Clock (`virtual_clock.py`)
**Purpose**: Provide time abstraction for escalation timers supporting real-time and demo modes

**Responsibilities**:
- Provide current time (real or simulated)
- Schedule callbacks with time-aware delays (real seconds or compressed)
- Cancel scheduled callbacks by reference
- Switch between real-time mode (1x) and demo mode (accelerated)
- Ensure all escalation timer logic references the virtual clock (not system time directly)
- Support testability — tests can advance time without real waits

### 5. FHIR Models (`fhir_models.py`)
**Purpose**: Define FHIR R4-native Pydantic models for care team data

**Responsibilities**:
- Define CareTeam resource model (FHIR R4 structure)
- Define Practitioner resource model (clinician representation)
- Define participant structure with role CodeableConcept
- Provide FHIR-conformant JSON serialization for API responses
- Define EscalationEvent model for audit trail records
- Define notification payload models

---

## New Frontend Components (React — Atomic Design)

### Atoms

### 6. ClinicianSelector
**Purpose**: Dropdown to select which clinician role the user is "acting as"

**Responsibilities**:
- Render dropdown with all clinicians from the roster
- Show clinician name, role, and duty status
- Dispatch selection to EscalationContext
- Filter notifications based on selected clinician

### 7. EscalationBadge
**Purpose**: Display current escalation level with progressive color coding

**Responsibilities**:
- Render escalation level indicator (1-4)
- Apply progressive colors: Level 1 green, Level 2 yellow, Level 3 orange, Level 4 red
- WCAG 2.0 AA compliant (color + icon + text)
- Show level label (Primary Nurse, Charge Nurse, Physician, RRT)

### 8. CountdownTimer
**Purpose**: Display countdown to next escalation level

**Responsibilities**:
- Render real-time countdown (mm:ss format)
- Update every second
- Show "Escalating..." when timer reaches zero
- Accessible to screen readers (aria-live region)

### Molecules

### 9. EscalationStatusPanel
**Purpose**: Display complete escalation status on an alert card

**Responsibilities**:
- Show current escalation level (EscalationBadge)
- Show countdown to next escalation (CountdownTimer)
- List who has been notified at each level
- Show time spent at each level

### 10. CareTeamAssignmentRow
**Purpose**: Display a single patient's care team assignment in the management table

**Responsibilities**:
- Show patient name, room, current status
- Show assigned clinicians per level
- Provide reassignment controls (dropdowns per level)
- Show checkbox for bulk selection

### 11. ShiftHandoffCard
**Purpose**: Display shift handoff summary after bulk reassignment

**Responsibilities**:
- Show active alerts for transferred patients
- Show pending escalations
- Show patients requiring attention
- Show recent acknowledgments from outgoing shift

### 12. NotificationToast
**Purpose**: Display escalation notification to the selected clinician

**Responsibilities**:
- Show notification type (escalation, resolved, acknowledged)
- Show alert context (patient, vital sign, severity)
- Auto-dismiss after timeout or on user interaction
- Stack multiple notifications

### Organisms

### 13. CareTeamTable
**Purpose**: Full care team assignment table with management controls

**Responsibilities**:
- Render all patient assignments as CareTeamAssignmentRow molecules
- Support bulk selection (checkboxes)
- Provide bulk handoff action button
- Filter by clinician or patient
- Show clinician duty status indicators

### 14. ClinicianRoster
**Purpose**: Display and manage the clinician roster with duty status

**Responsibilities**:
- List all clinicians with name, role, duty status
- Toggle on-duty/off-duty per clinician
- Show patient count per clinician
- Highlight off-duty clinicians

### 15. EscalationHistoryTimeline
**Purpose**: Display complete escalation audit trail for an alert

**Responsibilities**:
- Render vertical timeline of escalation events
- Show who was notified, when, at what level
- Show response times per level
- Highlight acknowledgment event
- Show total time from alert to resolution

### 16. NotificationPanel
**Purpose**: Display notification feed for the selected clinician

**Responsibilities**:
- List recent escalation notifications
- Filter by selected clinician role
- Show notification type, timestamp, alert context
- Mark notifications as read/unread

### Pages

### 17. CareTeamPage
**Purpose**: Dedicated page for care team management and escalation history

**Responsibilities**:
- Render CareTeamTable organism
- Render ClinicianRoster organism
- Provide tab/section for Escalation History
- Handle bulk handoff workflow
- Display ShiftHandoffCard after handoff operations

---

## Modified Existing Components

### AlertCard (Enhanced)
**Modifications**:
- Add EscalationStatusPanel molecule (shows level, countdown, notified clinicians)
- Progressive color border based on escalation level
- Acknowledgment now triggers escalation stop + team notification

### SimulationControls (Enhanced)
**Modifications**:
- Add demo mode toggle (real-time vs compressed timers)
- Show current mode indicator

### DashboardPage (Enhanced)
**Modifications**:
- Add sidebar navigation (Dashboard | Care Team)
- Add ClinicianSelector to header area
- Add NotificationPanel overlay/drawer

### AppContext/Reducer (Unchanged)
**Note**: Escalation state managed in separate EscalationContext. Existing AppContext unchanged.

---

## Shared/Cross-Cutting

### 18. EscalationContext (React Context)
**Purpose**: Manage escalation-specific state separate from existing app state

**Responsibilities**:
- Store care team assignments
- Store active escalation states
- Store clinician roster and duty status
- Store notification queue for selected clinician
- Store selected clinician identity
- Provide dispatch for escalation actions
- Connect to WebSocket for escalation_event messages

