# Requirements — Care Team Escalation Routing & Management

## Intent Analysis

- **User Request**: Add a care team escalation routing system as a new feature module to the existing Remote Patient Monitoring platform
- **Request Type**: New Feature (enhancement to existing system)
- **Scope Estimate**: Multiple Components (backend escalation engine, new data models, new frontend pages, modifications to existing alert system)
- **Complexity Estimate**: Complex (time-based state machines, multi-level routing, new UI pages, integration with existing alert lifecycle)

---

## Functional Requirements

### FR-01: Care Team Assignment Model

The system shall maintain a care team assignment model where each patient is assigned to a care team consisting of:

| Level | Role | Responsibility |
|---|---|---|
| 1 | Primary Nurse | First responder for alerts |
| 2 | Charge Nurse | Escalation level 2 |
| 3 | Attending Physician | Escalation level 3 |
| 4 | Rapid Response Team | Escalation level 4 (severity-dependent) |

**Details**:
- Each patient has exactly one care team assignment at any time
- The Rapid Response Team (RRT) is modeled as a named group whose members are any subset of the overall care team roster (e.g., the RRT for a given patient could include the charge nurse, physician, and/or any other clinicians). Each RRT member receives individual notifications when escalation reaches Level 4
- Care team assignments are stored in-memory (consistent with existing PoC architecture — data resets on server restart)
- The system shall pre-populate 4 clinicians (one per escalation level) for demo purposes

### FR-02: Time-Based Auto-Escalation

The system shall implement automatic time-based escalation for unacknowledged alerts:

| Elapsed Time | Action |
|---|---|
| 0 min | Alert fires → routed to Primary Nurse (Level 1) |
| 5 min | Unacknowledged → escalate to Charge Nurse (Level 2) + notify Primary Nurse of escalation |
| 10 min | Unacknowledged → escalate to Attending Physician (Level 3) |
| 15 min | Unacknowledged → escalate to Rapid Response Team (Level 4) |

**Details**:
- Escalation timers use event-driven scheduled callbacks (asyncio.call_later) per alert
- Each escalation event includes: original alert context, time since first alert, list of previously notified team members who did not respond
- The maximum escalation level is configurable per alert severity (supervisor-configurable):
  - Default: WARNING alerts stop at Level 3 (Physician), CRITICAL alerts reach Level 4 (RRT)
  - Supervisor can adjust max escalation level per severity type

### FR-03: Escalation Acknowledgment and Cascade Stop

When a clinician acknowledges an alert at any escalation level:
- The escalation cascade immediately stops (pending scheduled callbacks are cancelled)
- All previously notified team members receive a "resolved" notification via WebSocket
- The acknowledgment record includes: who acknowledged, at what level, response time from initial alert

### FR-04: Care Team Management Interface

A dedicated full page (new route/tab) shall provide supervisors with:

**4a. Active Assignments View**:
- Table showing all patients with their assigned care team members
- Current on-duty/off-duty status for each clinician

**4b. Patient Reassignment**:
- Reassign individual patients between clinicians (shift change scenario)
- Drag-and-drop or select-based reassignment

**4c. Clinician Duty Status**:
- Set on-duty / off-duty status for each clinician
- Off-duty clinicians are skipped in escalation routing (escalation proceeds to next level)

**4d. Bulk Handoff**:
- Select multiple patients simultaneously
- Transfer all selected patients to an incoming shift clinician
- Triggers shift handoff summary generation (see FR-06)

### FR-05: Escalation Status Visualization

The alert card (existing AlertCard component, enhanced) shall display:
- Current escalation level (1-4)
- Time spent at each escalation level
- List of who has been notified at each level
- Countdown timer to next escalation
- Progressive color/badge changes as escalation advances:
  - Level 1: Green (Primary Nurse notified)
  - Level 2: Yellow (Charge Nurse notified)
  - Level 3: Orange (Physician notified)
  - Level 4: Red (RRT paged)

### FR-06: Shift Handoff Summary

When care team assignments change via bulk handoff:
- The system auto-generates an in-app summary panel displayed after the handoff completes
- The summary includes:
  - Active alerts for transferred patients
  - Pending escalations (alerts currently in escalation cascade)
  - Patients requiring immediate attention
  - Recent acknowledgments from the outgoing shift (last 30 minutes)

### FR-07: Escalation Audit Trail

For any alert, the system shall provide a complete escalation timeline accessible via a dedicated "Escalation History" tab/view:
- Who was notified at each level
- When each notification was sent
- At what escalation level
- Who acknowledged (if acknowledged)
- Response time at each level
- Total time from alert creation to resolution

### FR-08: Escalation Demo Mode

A toggle on the existing SimulationControls shall switch between:
- **Real-time mode**: Standard escalation intervals (5/10/15 minutes)
- **Demo mode**: Compressed intervals (10/20/30 seconds) for live demonstrations

The demo mode allows presenters to fire an alert and watch the full escalation cascade in real-time without waiting 15 minutes.

### FR-09: Clinician Role Selector

The frontend shall provide a clinician selector (dropdown) allowing the user to "act as" a specific clinician:
- Notifications are filtered to show only those relevant to the selected clinician role
- Escalation events appear only when the selected clinician is the target of the notification
- This simulates multi-user behavior in a single-browser PoC environment

---

### FR-10: FHIR R4 Compliance for Care Team Data Model

The care team data model shall align with the [HL7 FHIR R4 CareTeam resource](https://www.hl7.org/fhir/careteam-definitions.html) structure:

**FHIR CareTeam Resource Mapping:**

| FHIR Element | Our Implementation | Description |
|---|---|---|
| `CareTeam.identifier` | Care team ID | Unique business identifier |
| `CareTeam.status` | active/inactive | Team status (proposed, active, suspended, inactive) |
| `CareTeam.category` | "escalation-team" | Type of team (escalation routing) |
| `CareTeam.name` | Team display name | Human-readable team label |
| `CareTeam.subject` | Patient reference | Which patient this team covers |
| `CareTeam.period` | Assignment period | When the team is active (shift start/end) |
| `CareTeam.participant` | Array of team members | Each member with role and coverage |
| `CareTeam.participant.role` | Escalation level role code | Primary Nurse, Charge Nurse, Physician, RRT |
| `CareTeam.participant.member` | Clinician reference | Reference to the Practitioner |
| `CareTeam.participant.coverage[x]` | On-duty period/schedule | When this member is available |

**Implementation Details:**
- Internal data models shall use FHIR-aligned field names and structures
- REST API responses for care team data shall return FHIR-conformant JSON (CareTeam resource format)
- Participant roles shall use FHIR-compatible CodeableConcept values
- The RRT group is represented as a nested CareTeam reference within `participant.member` (FHIR allows CareTeam as a member type)
- A FHIR-to-internal mapping layer handles translation between FHIR resource format and the in-memory runtime structures

**Scope of FHIR Compliance:**
- Data model structure and field naming: FHIR-compliant
- REST API response format: FHIR-conformant JSON
- Full FHIR server capabilities (search parameters, versioning, bundles): Out of scope for PoC
- FHIR validation/conformance testing: Out of scope for PoC

---

## Non-Functional Requirements

### NFR-01: Performance
- Escalation timer callbacks shall fire within 1 second of their scheduled time
- WebSocket notification delivery shall occur within 500ms of escalation event
- The care team management page shall load within 2 seconds with 10 patients and 4 clinicians

### NFR-02: Reliability
- Cancelled escalation callbacks (on acknowledgment) shall never fire after cancellation
- If a clinician is off-duty, escalation shall skip to the next level without delay
- Timer state shall be consistent — no duplicate escalations for the same alert at the same level

### NFR-03: Usability (WCAG 2.0)
- Escalation level colors (green/yellow/orange/red) shall meet WCAG 2.0 AA contrast ratios
- All escalation status information shall be conveyed through color + icon + text (not color alone)
- Countdown timers shall be accessible to screen readers
- The care team management interface shall be keyboard-navigable

### NFR-04: Maintainability
- Escalation logic shall be encapsulated in a dedicated module (separate from existing alert engine)
- Care team data models shall extend (not modify) existing models.py
- New REST endpoints shall follow existing API patterns (/api/care-team/*, /api/escalation/*)
- Frontend components shall follow existing Atomic Design hierarchy

### NFR-05: Testability
- Escalation timer behavior shall be testable with mocked time (no real 5-minute waits in tests)
- Property-based testing shall be applied to escalation state machine logic (PBT extension enabled)
- All new backend modules shall have >80% test coverage

---

## Integration Points

### Existing System Touchpoints
| Component | Integration Type | Description |
|---|---|---|
| `alerts.py` (AlertEngine) | Extension | Hook into alert creation to trigger escalation cascade |
| `alerts.py` (acknowledge_alert) | Extension | Hook into acknowledgment to stop escalation + notify team |
| `models.py` | Extension | Add new models (CareTeam, Clinician, EscalationEvent) |
| `websocket_manager.py` | Extension | New message types for escalation events and notifications |
| `main.py` | Extension | Register new routers and startup tasks |
| AlertCard (frontend) | Modification | Add escalation status display |
| DashboardPage (frontend) | Extension | Add navigation to care team management page |
| SimulationControls (frontend) | Extension | Add demo mode toggle |

### New Components
| Component | Type | Purpose |
|---|---|---|
| `escalation.py` (backend) | New module | Escalation engine with timer management |
| `care_team.py` (backend) | New module | Care team CRUD and assignment logic |
| CareTeamPage (frontend) | New page | Care team management interface |
| EscalationHistory (frontend) | New organism | Escalation audit trail view |
| ClinicianSelector (frontend) | New atom | Role selector dropdown |
| EscalationBadge (frontend) | New atom | Escalation level indicator |

---

## Out of Scope

- User authentication / login (clinician selector is a simulation tool, not real auth)
- Persistent storage (all data in-memory, resets on restart)
- Email/SMS/pager notifications (WebSocket push only)
- Multiple simultaneous browser sessions with different clinician identities
- Full FHIR server capabilities (search parameters, versioning, bundles, conformance testing)
- Mobile-specific responsive design (desktop-first PoC)

---

## Assumptions

- The existing alert lifecycle (active → acknowledged) remains unchanged; escalation is an additional layer on top
- Only one escalation cascade runs per alert at a time (no parallel escalation paths)
- The 4 pre-populated clinicians are sufficient for demonstrating all escalation scenarios
- Off-duty clinicians are skipped silently (no "unable to reach" notification)
- The clinician selector affects notification display only — all users can still acknowledge any alert
