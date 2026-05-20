# Application Design Plan — Care Team Escalation Routing & Management

## Plan Overview

This plan defines the application design steps for the Care Team Escalation Routing feature, integrating into the existing RPM platform.

---

## Design Steps

- [x] Define new backend components (escalation.py, care_team.py)
- [x] Define new/modified data models (FHIR-aligned CareTeam, Clinician, EscalationEvent)
- [x] Define component methods and interfaces
- [x] Define service layer orchestration (Escalation Service, Care Team Service)
- [x] Define component dependencies and integration points with existing system
- [x] Define new frontend components (CareTeamPage, EscalationHistory, ClinicianSelector, EscalationBadge)
- [x] Define new REST API endpoints
- [x] Define new WebSocket message types
- [x] Validate design completeness and consistency

---

## Design Questions

Please answer the following questions by filling in the letter choice after each [Answer]: tag.

### Question 1: Escalation Engine Coupling
How tightly should the new escalation engine be coupled to the existing AlertEngine?

A) Loosely coupled — escalation.py subscribes to alert events via a callback/hook pattern. AlertEngine calls a registered hook when alerts are created/acknowledged. Escalation engine is fully independent.
B) Moderately coupled — escalation.py imports and directly references AlertEngine methods. AlertEngine gains a reference to the escalation engine at startup.
C) Integrated — escalation logic is added directly into the existing AlertEngine class as new methods.
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: FHIR Model Implementation Approach
How should the FHIR-aligned data models be structured?

A) Dual-model approach — internal runtime models (simple Python classes) + separate FHIR serialization layer that converts to/from FHIR JSON on API boundaries
B) FHIR-native models — Pydantic models directly mirror FHIR resource structure (field names, nesting). Used internally and for API responses.
C) FHIR-lite — use FHIR field naming conventions but flatten the structure (no deep nesting like CodeableConcept). API responses include a FHIR-conformant wrapper.
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3: Escalation State Management
How should the escalation state machine track state per alert?

A) Dedicated EscalationState object per alert — stored in a dict keyed by alert_id. Contains current level, timestamps per level, notified clinicians, scheduled callback references.
B) Extend the existing Alert model — add escalation fields directly to the Alert Pydantic model (current_level, escalation_history, next_escalation_at).
C) Separate EscalationTracker class — manages all active escalations as a collection, with methods to query/update individual alert escalation state.
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 4: Frontend State for Escalation
How should escalation state be managed in the React frontend?

A) Extend existing AppContext/useReducer — add escalation-related state slices (careTeam, escalations, notifications) to the existing reducer
B) Separate EscalationContext — new React Context dedicated to escalation state, keeping it isolated from the existing patient/alert state
C) Combined approach — care team data in a new CareTeamContext, but escalation status merged into existing alert state (since it's alert-related)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5: Care Team Management Page Routing
How should the new Care Team Management page be accessed?

A) Tab-based navigation — add a tab bar to the dashboard (Dashboard | Care Team | Escalation History)
B) Sidebar navigation — add a persistent sidebar with page links
C) Header navigation — add navigation links in the app header/toolbar
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 6: Demo Mode Timer Architecture
How should the demo mode (compressed timers) be implemented?

A) Global time multiplier — a single configurable factor (e.g., 30x) that the escalation engine applies to all timer durations. Toggle switches between 1x and 30x.
B) Separate timer configuration — demo mode uses a completely different set of timer values (10s, 20s, 30s) rather than multiplying the real values.
C) Time simulation — a virtual clock that advances faster in demo mode, with all timer logic referencing the virtual clock.
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 7: Notification Delivery Pattern
How should escalation notifications be structured for WebSocket delivery?

A) Single notification message type — one `escalation_event` message with a `type` field (escalated, resolved, acknowledged) and full context payload
B) Multiple message types — separate WebSocket message types per event (escalation_level_change, escalation_resolved, escalation_acknowledged, team_notified)
C) Notification queue — backend maintains a per-clinician notification queue; frontend polls or receives batched notifications
D) Other (please describe after [Answer]: tag below)

[Answer]: A

