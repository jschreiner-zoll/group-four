# Frontend Components — Care Team Escalation Routing

---

## Component Hierarchy

```
App
├── Sidebar Navigation
│   ├── Dashboard (link)
│   └── Care Team (link)
├── Header
│   ├── ClinicianSelector (atom)
│   └── NotificationPanel (organism, overlay)
├── DashboardPage (existing, enhanced)
│   ├── PatientGrid (existing)
│   │   └── PatientTile (existing)
│   └── AlertSidebar (existing)
│       └── AlertCard (enhanced)
│           └── EscalationStatusPanel (molecule, NEW)
│               ├── EscalationBadge (atom)
│               └── CountdownTimer (atom)
└── CareTeamPage (NEW)
    ├── CareTeamTable (organism)
    │   └── CareTeamAssignmentRow (molecule) x10
    ├── ClinicianRoster (organism)
    ├── EscalationHistoryTimeline (organism)
    └── ShiftHandoffCard (molecule, conditional)
```

---

## New Components — Detailed Specs

### ClinicianSelector (Atom)

**Props:**
| Prop | Type | Description |
|---|---|---|
| clinicians | Practitioner[] | Available clinicians |
| selectedId | string | Currently selected clinician ID |
| onSelect | (id: string) => void | Selection handler |

**State:** None (controlled component)

**Behavior:**
- Renders a dropdown/select with clinician name + role
- Shows duty status indicator (green dot = on-duty, gray = off-duty)
- Selection dispatches `SET_SELECTED_CLINICIAN` to EscalationContext
- Default selection: first on-duty clinician

**Accessibility:**
- `aria-label="Select clinician role"`
- Options include role in label: "Sarah Johnson (Primary Nurse)"

---

### EscalationBadge (Atom)

**Props:**
| Prop | Type | Description |
|---|---|---|
| level | number (1-4) | Current escalation level |
| maxLevel | number (1-4) | Maximum level for this escalation |

**State:** None

**Behavior:**
- Renders level number with color-coded background
- Colors: Level 1 = #2E7D32 (green), Level 2 = #F9A825 (yellow), Level 3 = #E65100 (orange), Level 4 = #B71C1C (red)
- All colors meet WCAG 2.0 AA contrast with white text
- Includes icon: Level 1 = user, Level 2 = users, Level 3 = stethoscope, Level 4 = alert-triangle
- Shows text label: "L1: Primary Nurse", "L2: Charge Nurse", "L3: Physician", "L4: RRT"

**Accessibility:**
- `aria-label="Escalation level {level} of {maxLevel}: {role_name}"`

---

### CountdownTimer (Atom)

**Props:**
| Prop | Type | Description |
|---|---|---|
| targetTime | Date | When the next escalation fires |
| onExpired | () => void | Callback when timer reaches zero |

**State:**
| State | Type | Description |
|---|---|---|
| remaining | number | Seconds remaining |

**Behavior:**
- Updates every second via `setInterval`
- Displays as "MM:SS" format
- When remaining ≤ 0: displays "Escalating..." in orange
- Cleans up interval on unmount

**Accessibility:**
- `aria-live="polite"` for screen reader updates
- `aria-label="Time until next escalation: {mm} minutes {ss} seconds"`

---

### EscalationStatusPanel (Molecule)

**Props:**
| Prop | Type | Description |
|---|---|---|
| escalation | EscalationState | Current escalation state |
| alertId | string | Alert this panel is displayed on |

**State:** None (reads from EscalationContext)

**Behavior:**
- Renders EscalationBadge with current level
- Renders CountdownTimer with next escalation time
- Lists notified clinicians with timestamps
- Shows time spent at each level in level_history
- Progressive border color matches escalation level
- Hidden when no active escalation exists for this alert

**Layout:**
```
┌─────────────────────────────────┐
│ [EscalationBadge L2] ⏱ 03:42   │
│ Notified:                       │
│  • Sarah J. (L1) - 5:00 ago    │
│  • Mike C. (L2) - 0:18 ago     │
└─────────────────────────────────┘
```

---

### CareTeamAssignmentRow (Molecule)

**Props:**
| Prop | Type | Description |
|---|---|---|
| patient | Patient | Patient data |
| careTeam | CareTeam | FHIR CareTeam resource |
| clinicians | Practitioner[] | Available clinicians for dropdowns |
| selected | boolean | Whether row is selected for bulk ops |
| onSelect | (patientId: string) => void | Selection toggle |
| onReassign | (patientId, clinicianId, level) => void | Reassignment handler |

**Behavior:**
- Renders patient name, room, status badge
- Renders dropdown per level (1-4) showing assigned clinician
- Dropdown options filtered by role qualification
- Checkbox for bulk selection
- Shows active escalation indicator if patient has pending escalation

---

### ShiftHandoffCard (Molecule)

**Props:**
| Prop | Type | Description |
|---|---|---|
| summary | HandoffSummary | Generated handoff data |
| onDismiss | () => void | Close handler |

**Behavior:**
- Appears after bulk handoff completes
- Sections: Active Alerts, Pending Escalations, Needs Attention, Recent Acks
- Each section shows count badge
- Dismissible (X button)
- Auto-appears, does not auto-dismiss

---

### NotificationToast (Molecule)

**Props:**
| Prop | Type | Description |
|---|---|---|
| notification | EscalationEvent | Notification data |
| onDismiss | (id: string) => void | Dismiss handler |

**Behavior:**
- Renders notification type icon + patient name + vital sign + severity
- Color-coded by event type: escalated=orange, resolved=green, notified=blue
- Auto-dismisses after 10 seconds
- Click navigates to relevant alert
- Stacks vertically (newest on top)

---

### CareTeamTable (Organism)

**Props:** None (reads from EscalationContext)

**State:**
| State | Type | Description |
|---|---|---|
| selectedPatients | Set<string> | Patient IDs selected for bulk ops |
| filterClinician | string | Filter by assigned clinician |

**Behavior:**
- Renders CareTeamAssignmentRow for each patient (10 rows)
- "Select All" checkbox in header
- "Bulk Handoff" button (enabled when ≥1 selected)
- Bulk Handoff opens a modal: select target clinician + level → confirm
- After handoff: displays ShiftHandoffCard with summary
- Filter dropdown to show only patients assigned to a specific clinician

---

### ClinicianRoster (Organism)

**Props:** None (reads from EscalationContext)

**Behavior:**
- Lists all 4 clinicians with: name, role, duty status toggle, patient count
- Toggle switch for on-duty/off-duty (calls PUT /api/care-team/clinicians/{id}/status)
- Patient count shows how many patients are assigned to this clinician
- Off-duty clinicians shown with muted styling
- Sorted by level (1-4)

---

### EscalationHistoryTimeline (Organism)

**Props:**
| Prop | Type | Description |
|---|---|---|
| alertId | string | Alert to show history for (optional) |
| patientId | string | Patient to show history for (optional) |

**State:**
| State | Type | Description |
|---|---|---|
| timeline | EscalationEvent[] | Loaded timeline data |
| loading | boolean | Loading state |

**Behavior:**
- Fetches timeline from GET /api/escalation/{alert_id}/timeline
- Renders vertical timeline with event nodes
- Each node shows: event type icon, clinician name, timestamp, level
- Color-coded by event type
- Shows response time between events
- Highlights acknowledgment event with green checkmark
- Shows total duration at bottom

---

### NotificationPanel (Organism)

**Props:** None (reads from EscalationContext)

**Behavior:**
- Overlay/drawer that slides in from right
- Shows notifications filtered for selected clinician
- Badge on trigger button shows unread count
- Notifications grouped by time (Today, Earlier)
- Click on notification navigates to alert
- "Clear All" button

---

### CareTeamPage (Page)

**Props:** None

**State:**
| State | Type | Description |
|---|---|---|
| activeTab | string | "assignments" | "history" |
| handoffSummary | HandoffSummary | Latest handoff summary (if any) |

**Behavior:**
- Two sections/tabs: "Team Assignments" and "Escalation History"
- Team Assignments tab: CareTeamTable + ClinicianRoster side by side
- Escalation History tab: EscalationHistoryTimeline (shows all recent escalations)
- Fetches data on mount from care-team and escalation APIs
- Subscribes to WebSocket for real-time updates

---

## Modified Components

### AlertCard (Enhanced)

**New Props Added:**
| Prop | Type | Description |
|---|---|---|
| escalation | EscalationState | Escalation state for this alert's patient |

**Modifications:**
- Add EscalationStatusPanel below existing alert content (only shown if escalation exists)
- Add progressive border-left color based on escalation level
- Existing acknowledge button behavior unchanged (backend handles escalation stop)

### SimulationControls (Enhanced)

**New Props Added:**
| Prop | Type | Description |
|---|---|---|
| demoMode | boolean | Current demo mode state |
| onDemoToggle | () => void | Toggle handler |

**Modifications:**
- Add toggle switch: "Demo Mode (30x speed)"
- When ON: show indicator "⚡ Demo Mode Active"
- Toggle calls POST /api/escalation/demo-mode

### DashboardPage (Enhanced)

**Modifications:**
- Wrap with EscalationContext.Provider
- Add sidebar navigation (Dashboard | Care Team links)
- Add ClinicianSelector in header area
- Add NotificationPanel trigger button in header
- Pass escalation state to AlertCard components

---

## EscalationContext — Reducer Actions

| Action | Payload | Effect |
|---|---|---|
| SET_CARE_TEAMS | {careTeams: {}} | Replace all care team data |
| UPDATE_CARE_TEAM | {patientId, careTeam} | Update single patient's team |
| SET_CLINICIANS | {clinicians: []} | Replace clinician roster |
| UPDATE_CLINICIAN_STATUS | {clinicianId, active} | Toggle duty status |
| SET_ESCALATIONS | {escalations: {}} | Replace all escalation states |
| UPDATE_ESCALATION | {alertId, escalation} | Update single escalation |
| REMOVE_ESCALATION | {alertId} | Remove resolved escalation from active |
| ADD_NOTIFICATION | {notification} | Add to notification queue |
| CLEAR_NOTIFICATIONS | — | Clear all notifications |
| SET_SELECTED_CLINICIAN | {clinicianId} | Set active clinician identity |
| SET_DEMO_MODE | {enabled} | Update demo mode flag |
| SET_ESCALATION_CONFIG | {config} | Update escalation configuration |
| SET_HANDOFF_SUMMARY | {summary} | Store latest handoff summary |

---

## API Integration Map

| Component | Endpoint | Method | Trigger |
|---|---|---|---|
| CareTeamPage | /api/care-team/assignments | GET | On mount |
| CareTeamPage | /api/care-team/clinicians | GET | On mount |
| CareTeamTable | /api/care-team/assignments/{id} | PUT | On reassign |
| CareTeamTable | /api/care-team/handoff | POST | On bulk handoff |
| ClinicianRoster | /api/care-team/clinicians/{id}/status | PUT | On duty toggle |
| EscalationHistoryTimeline | /api/escalation/{id}/timeline | GET | On view |
| SimulationControls | /api/escalation/demo-mode | POST | On toggle |
| EscalationContext | WebSocket (escalation_event) | — | Real-time |
| EscalationContext | WebSocket (care_team_updated) | — | Real-time |

