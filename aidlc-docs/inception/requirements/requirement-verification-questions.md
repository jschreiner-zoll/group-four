# Care Team Escalation Routing — Requirements Clarification Questions

Please answer the following questions to help clarify the requirements for the Care Team Escalation Routing & Management feature. Fill in the letter choice after each [Answer]: tag.

---

## Question 1
How should care team data be stored, given the existing in-memory architecture?

A) In-memory only (consistent with existing PoC approach — data resets on restart)
B) Add a lightweight database (SQLite) for care team assignments and escalation history persistence
C) In-memory for runtime state, with JSON file export/import for care team configurations
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
How should the escalation timer mechanism work in the backend?

A) Background async task per active alert that checks elapsed time every second
B) A single periodic scheduler (e.g., every 5 seconds) that scans all active alerts and escalates any that have exceeded their time threshold
C) Event-driven with scheduled callbacks (asyncio.call_later) per alert
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
How should "notifications" to care team members be delivered in this PoC?

A) WebSocket push to all connected clients — the frontend filters and displays relevant notifications per clinician role (no actual user login/identity)
B) WebSocket push with a simple clinician selector (dropdown to "act as" a specific clinician) — notifications appear only for the selected role
C) Simple in-app notification panel visible to all users (no role-based filtering) — all escalation events shown to everyone
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
For the care team management interface, what level of UI complexity is appropriate?

A) A dedicated full page (new route/tab) with tables, forms, and bulk operations
B) A slide-out panel accessible from the dashboard (similar to PatientDetailPanel)
C) A modal dialog with tabbed sections (Assignments, Shift Handoff, Audit Trail)
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 5
How should the "Rapid Response Team" (Level 4) be modeled?

A) As a single team entity (not individual clinicians) — escalation to RRT triggers a team-wide page/notification
B) As a named group with individual members listed — each member gets notified individually
C) As a simple flag/status on the alert (no specific team members) — just indicates RRT has been paged
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 6
For the demo/simulation mode (compressed escalation timers), how should it integrate?

A) A toggle on the existing SimulationControls that switches between real-time (5/10/15 min) and demo mode (10/20/30 sec)
B) A separate "Escalation Demo" panel with its own fire-alert button and visible countdown timers
C) Configurable time multiplier (e.g., slider from 1x to 30x speed) applied globally to all escalation timers
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 7
How should the shift handoff summary be triggered and displayed?

A) Auto-generated as a downloadable report (PDF/printable view) when bulk reassignment occurs
B) Auto-generated as an in-app summary panel that appears after bulk handoff completes
C) Both — in-app summary immediately visible, with option to export/print
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 8
Should the escalation feature support alert severity filtering (i.e., only critical alerts escalate to RRT)?

A) Yes — only CRITICAL severity alerts can reach Level 4 (RRT). WARNING alerts stop escalating at Level 3 (Physician)
B) No — all alerts follow the full 4-level cascade regardless of severity
C) Configurable per alert severity — supervisor can set max escalation level per severity type
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 9
How should the escalation audit trail be accessed?

A) Inline on the AlertCard — expandable section showing the timeline directly on the alert
B) A dedicated "Escalation History" tab/view accessible from the alert or a separate page
C) Both — brief inline summary on the AlertCard with a "View Full Timeline" link to detailed view
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 10
How many clinicians should be pre-populated in the demo system?

A) Minimal (4 clinicians — one per escalation level: 1 primary nurse, 1 charge nurse, 1 physician, 1 RRT)
B) Moderate (8-10 clinicians — multiple nurses, 2 physicians, 1 RRT, allowing shift change demos)
C) Realistic (12-15 clinicians — full shift roster with day/night teams for realistic handoff scenarios)
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 11: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 12: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
C) Other (please describe after [Answer]: tag below)

[Answer]: 
