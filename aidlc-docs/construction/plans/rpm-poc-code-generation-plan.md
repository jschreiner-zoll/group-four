# Code Generation Plan — Care Team Escalation Routing & Management

## Unit Context

- **Project Type**: Brownfield (existing RPM platform)
- **Workspace Root**: /Users/albertmiller/Code
- **Backend**: /Users/albertmiller/Code/backend/app/
- **Frontend**: /Users/albertmiller/Code/frontend/src/
- **Backend Tests**: /Users/albertmiller/Code/backend/tests/
- **Frontend Tests**: /Users/albertmiller/Code/frontend/src/__tests__/

## Generation Approach

- **Brownfield rules**: Modify existing files in-place, create new files where needed
- **PBT Extension**: Property-based tests required (Hypothesis for Python, fast-check for JS)
- **FHIR Compliance**: Models use FHIR R4 structure natively

---

## Step-by-Step Plan

### Step 1: Backend — FHIR Models (`fhir_models.py`)
- [x] Create `backend/app/fhir_models.py`
- [x] Define FHIR R4 Pydantic models: CareTeam, CareTeamParticipant, Practitioner, CodeableConcept, Reference, Period, Identifier, HumanName, Qualification
- [x] Define escalation models: EscalationState, EscalationLevelRecord, NotifiedClinician, EscalationEvent, EscalationConfig, HandoffSummary
- [x] Define enumerations: EscalationStatus, CareTeamStatus, EscalationEventType
- [x] Define role code constants for escalation levels

### Step 2: Backend — Virtual Clock (`virtual_clock.py`)
- [x] Create `backend/app/virtual_clock.py`
- [x] Implement VirtualClock class with: now(), call_later(), cancel(), set_time_scale(), get_time_scale(), is_demo_mode()
- [x] Implement CallbackHandle for cancellation tracking
- [x] Implement advance() method for testing support
- [x] Use asyncio.get_event_loop().call_later() internally with scaled delays

### Step 3: Backend — Escalation Tracker (`escalation_tracker.py`)
- [x] Create `backend/app/escalation_tracker.py`
- [x] Implement EscalationTracker class with all methods from component-methods.md
- [x] Implement grouped escalation logic (one per patient)
- [x] Implement audit trail recording (EscalationEvent creation)
- [x] Implement query methods (by alert, patient, clinician)
- [x] Implement callback handle tracking

### Step 4: Backend — Care Team Manager (`care_team.py`)
- [x] Create `backend/app/care_team.py`
- [x] Implement CareTeamManager class with all methods from component-methods.md
- [x] Pre-populate 4 clinicians (Sarah Johnson, Mike Chen, Dr. Emily Rodriguez, Alex Thompson)
- [x] Pre-populate default care team assignments for all 10 patients
- [x] Implement FHIR CareTeam resource construction
- [x] Implement RRT member management (subset of roster)
- [x] Implement bulk handoff with summary generation
- [x] Implement REST router (APIRouter) with all care-team endpoints
- [x] Implement duty status toggle

### Step 5: Backend — Escalation Engine (`escalation.py`)
- [x] Create `backend/app/escalation.py`
- [x] Implement EscalationEngine class with all methods from component-methods.md
- [x] Implement hook callbacks: on_alert_created, on_alert_acknowledged
- [x] Implement start_escalation algorithm (with grouped model)
- [x] Implement escalate_to_next_level algorithm
- [x] Implement find_first_available algorithm (off-duty skip)
- [x] Implement stop_escalation and notify_resolution
- [x] Implement demo mode toggle with callback rescheduling
- [x] Implement REST router with escalation endpoints
- [x] Implement configurable severity max levels

### Step 6: Backend — Modify Existing Files
- [x] Modify `backend/app/alerts.py`: Add hook registration mechanism (on_created, on_acknowledged callbacks list)
- [x] Modify `backend/app/config.py`: Add escalation timing constants and default configuration
- [x] Modify `backend/app/main.py`: Import and initialize new modules, register hooks, register new routers
- [x] Add `hypothesis` to `backend/requirements.txt`
- [x] Modify `backend/app/websocket_manager.py`: Add broadcast_escalation_event and broadcast_care_team_updated methods

### Step 7: Backend — Unit Tests (Example-Based)
- [ ] Create `backend/tests/test_fhir_models.py`: Model creation, serialization, validation
- [ ] Create `backend/tests/test_virtual_clock.py`: Time scaling, callback scheduling, cancellation
- [ ] Create `backend/tests/test_escalation_tracker.py`: State management, queries, audit trail
- [ ] Create `backend/tests/test_care_team.py`: Assignments, handoff, duty status, RRT
- [ ] Create `backend/tests/test_escalation.py`: Full cascade, acknowledgment stop, off-duty skip, grouped alerts, handoff restart, demo mode

### Step 8: Backend — Property-Based Tests (PBT)
- [ ] Create `backend/tests/test_pbt_escalation.py`
- [ ] PBT-02: FHIR CareTeam serialization round-trip
- [ ] PBT-02: EscalationState serialization round-trip
- [ ] PBT-03: Escalation level monotonicity invariant
- [ ] PBT-03: Max level ceiling invariant
- [ ] PBT-03: Grouped alert patient consistency invariant
- [ ] PBT-03: Notification completeness on resolution
- [ ] PBT-04: Acknowledge idempotence
- [ ] PBT-04: Demo mode toggle idempotence
- [ ] PBT-06: Valid state transitions (stateful testing)
- [ ] PBT-06: No orphaned callbacks invariant
- [ ] PBT-06: Handoff restart correctness
- [ ] PBT-07: Domain-specific generators (EscalationState, CareTeam, Alert generators)

### Step 9: Frontend — EscalationContext and Reducer
- [x] Create `frontend/src/context/EscalationContext.js`
- [x] Create `frontend/src/context/escalationReducer.js`
- [x] Implement all 12 reducer actions from frontend-components.md
- [x] Implement WebSocket subscription for escalation_event, care_team_updated, clinician_status_changed, handoff_complete
- [x] Implement initial data fetch on mount (care teams, clinicians, escalations, config)

### Step 10: Frontend — Atoms (ClinicianSelector, EscalationBadge, CountdownTimer)
- [x] Create `frontend/src/atoms/ClinicianSelector.js`
- [x] Create `frontend/src/atoms/EscalationBadge.js`
- [x] Create `frontend/src/atoms/CountdownTimer.js`
- [x] Implement WCAG 2.0 AA compliant colors and accessibility attributes
- [x] Add data-testid attributes for automation

### Step 11: Frontend — Molecules (EscalationStatusPanel, CareTeamAssignmentRow, ShiftHandoffCard, NotificationToast)
- [ ] Create `frontend/src/molecules/EscalationStatusPanel.js`
- [ ] Create `frontend/src/molecules/CareTeamAssignmentRow.js`
- [ ] Create `frontend/src/molecules/ShiftHandoffCard.js`
- [ ] Create `frontend/src/molecules/NotificationToast.js`
- [ ] Add data-testid attributes for automation

### Step 12: Frontend — Organisms (CareTeamTable, ClinicianRoster, EscalationHistoryTimeline, NotificationPanel)
- [ ] Create `frontend/src/organisms/CareTeamTable.js`
- [ ] Create `frontend/src/organisms/ClinicianRoster.js`
- [ ] Create `frontend/src/organisms/EscalationHistoryTimeline.js`
- [ ] Create `frontend/src/organisms/NotificationPanel.js`
- [ ] Add data-testid attributes for automation

### Step 13: Frontend — CareTeamPage and Navigation
- [ ] Create `frontend/src/pages/CareTeamPage.js`
- [ ] Create `frontend/src/services/escalationApi.js` (API service for care-team and escalation endpoints)
- [ ] Modify `frontend/src/App.js`: Add sidebar navigation, wrap with EscalationContext.Provider
- [ ] Modify `frontend/src/pages/DashboardPage.js`: Add ClinicianSelector to header, add NotificationPanel

### Step 14: Frontend — Modify Existing Components
- [ ] Modify `frontend/src/molecules/AlertCard.js`: Add EscalationStatusPanel, progressive border color
- [ ] Modify `frontend/src/molecules/SimulationControls.js`: Add demo mode toggle
- [ ] Modify `frontend/src/services/api.js`: Add care-team and escalation API functions (or import from escalationApi.js)

### Step 15: Frontend — Tests
- [ ] Create `frontend/src/__tests__/escalationReducer.test.js`: All 12 reducer actions
- [ ] Create `frontend/src/__tests__/EscalationBadge.test.js`: Level rendering, colors, accessibility
- [ ] Create `frontend/src/__tests__/CountdownTimer.test.js`: Timer behavior, expiration
- [ ] Add `fast-check` to `frontend/package.json` devDependencies
- [ ] Create `frontend/src/__tests__/pbt_escalation.test.js`: Round-trip serialization, state invariants

### Step 16: Documentation and Summary
- [ ] Create `aidlc-docs/construction/rpm-poc/code/code-generation-summary.md` with file inventory
- [ ] Update `backend/requirements.txt` if any new dependencies needed
- [ ] Verify all files created/modified are listed

---

## File Inventory (Expected)

### New Backend Files (5)
1. `backend/app/fhir_models.py`
2. `backend/app/virtual_clock.py`
3. `backend/app/escalation_tracker.py`
4. `backend/app/care_team.py`
5. `backend/app/escalation.py`

### Modified Backend Files (4)
6. `backend/app/alerts.py` (add hook mechanism)
7. `backend/app/config.py` (add escalation constants)
8. `backend/app/main.py` (register new modules)
9. `backend/requirements.txt` (add hypothesis)

### New Backend Test Files (6)
10. `backend/tests/test_fhir_models.py`
11. `backend/tests/test_virtual_clock.py`
12. `backend/tests/test_escalation_tracker.py`
13. `backend/tests/test_care_team.py`
14. `backend/tests/test_escalation.py`
15. `backend/tests/test_pbt_escalation.py`

### New Frontend Files (14)
16. `frontend/src/context/EscalationContext.js`
17. `frontend/src/context/escalationReducer.js`
18. `frontend/src/atoms/ClinicianSelector.js`
19. `frontend/src/atoms/EscalationBadge.js`
20. `frontend/src/atoms/CountdownTimer.js`
21. `frontend/src/molecules/EscalationStatusPanel.js`
22. `frontend/src/molecules/CareTeamAssignmentRow.js`
23. `frontend/src/molecules/ShiftHandoffCard.js`
24. `frontend/src/molecules/NotificationToast.js`
25. `frontend/src/organisms/CareTeamTable.js`
26. `frontend/src/organisms/ClinicianRoster.js`
27. `frontend/src/organisms/EscalationHistoryTimeline.js`
28. `frontend/src/organisms/NotificationPanel.js`
29. `frontend/src/pages/CareTeamPage.js`

### New Frontend Service/Test Files (4)
30. `frontend/src/services/escalationApi.js`
31. `frontend/src/__tests__/escalationReducer.test.js`
32. `frontend/src/__tests__/EscalationBadge.test.js`
33. `frontend/src/__tests__/CountdownTimer.test.js`

### Modified Frontend Files (4)
34. `frontend/src/App.js` (sidebar nav, EscalationContext)
35. `frontend/src/pages/DashboardPage.js` (ClinicianSelector, NotificationPanel)
36. `frontend/src/molecules/AlertCard.js` (EscalationStatusPanel)
37. `frontend/src/molecules/SimulationControls.js` (demo toggle)

### Frontend PBT (1)
38. `frontend/src/__tests__/pbt_escalation.test.js`

### Documentation (1)
39. `aidlc-docs/construction/rpm-poc/code/code-generation-summary.md`

**Total: 39 files (20 new backend, 18 new frontend, 1 documentation)**

