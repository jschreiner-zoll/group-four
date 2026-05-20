# Unit Test Execution — Care Team Escalation Routing

## Backend Unit Tests

### Run All Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Run Only New Escalation Tests
```bash
cd backend
python -m pytest tests/test_fhir_models.py tests/test_virtual_clock.py tests/test_escalation_tracker.py tests/test_care_team.py tests/test_escalation.py -v
```

### Run Property-Based Tests
```bash
cd backend
python -m pytest tests/test_pbt_escalation.py -v --hypothesis-show-statistics
```

### Expected Results
- **Existing tests**: 52 tests pass (no regressions)
- **New unit tests**: ~40-60 tests covering:
  - FHIR model creation and serialization
  - Virtual clock time scaling and callback management
  - Escalation tracker state management and queries
  - Care team manager CRUD and routing
  - Escalation engine cascade logic
- **PBT tests**: ~12 property tests covering:
  - FHIR serialization round-trips
  - Escalation level monotonicity
  - Timer cancellation guarantees
  - Grouped alert consistency
  - Acknowledge idempotence
  - State machine valid transitions

### Test Coverage Target
- New modules: >80% line coverage
- Run with coverage:
```bash
cd backend
pip install pytest-cov
python -m pytest tests/ --cov=app --cov-report=term-missing
```

---

## Frontend Unit Tests

### Run All Frontend Tests
```bash
cd frontend
npm test -- --watchAll=false
```

### Run Specific Test Files
```bash
cd frontend
npm test -- --testPathPattern="escalationReducer" --watchAll=false
npm test -- --testPathPattern="EscalationBadge" --watchAll=false
npm test -- --testPathPattern="CountdownTimer" --watchAll=false
```

### Expected Results
- **Existing tests**: appReducer.test.js passes
- **New tests**: ~20-30 tests covering:
  - escalationReducer: All 12 action types
  - EscalationBadge: Level rendering, colors, accessibility
  - CountdownTimer: Timer behavior, expiration callback
  - PBT: State invariants with fast-check

---

## Test File Inventory

### Backend Tests (to create)
| File | Tests | Coverage |
|---|---|---|
| `tests/test_fhir_models.py` | Model creation, serialization, validation | fhir_models.py |
| `tests/test_virtual_clock.py` | Time scaling, callbacks, cancellation, test mode | virtual_clock.py |
| `tests/test_escalation_tracker.py` | State CRUD, queries, audit trail | escalation_tracker.py |
| `tests/test_care_team.py` | Roster, assignments, handoff, RRT | care_team.py |
| `tests/test_escalation.py` | Full cascade, ack stop, off-duty skip, grouped, demo | escalation.py |
| `tests/test_pbt_escalation.py` | 12 property-based tests | All modules |

### Frontend Tests (to create)
| File | Tests | Coverage |
|---|---|---|
| `__tests__/escalationReducer.test.js` | 12 reducer actions | escalationReducer.js |
| `__tests__/EscalationBadge.test.js` | Rendering, colors, a11y | EscalationBadge.js |
| `__tests__/CountdownTimer.test.js` | Timer, expiration | CountdownTimer.js |
| `__tests__/pbt_escalation.test.js` | State invariants | Reducer + models |

---

## PBT Framework Configuration

### Backend (Hypothesis)
- Already in `requirements.txt`: `hypothesis==6.92.2`
- Configuration in `pytest.ini` (add if needed):
```ini
[pytest]
addopts = --hypothesis-seed=0
```

### Frontend (fast-check)
- Add to `package.json` devDependencies:
```json
"fast-check": "^3.14.0"
```
- Install: `npm install --save-dev fast-check`

---

## Fixing Failing Tests

1. Review test output for specific assertion failures
2. Check if failure is in existing tests (regression) or new tests (implementation bug)
3. For PBT failures: note the shrunk counterexample — it reveals the minimal failing case
4. Fix the implementation, not the test (unless test has a logic error)
5. Rerun until all pass
