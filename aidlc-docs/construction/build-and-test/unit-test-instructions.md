# Unit Test Execution

## Backend Tests (pytest)

### Run All Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Run Specific Test Files
```bash
pytest tests/test_simulator.py -v    # Vital sign simulation tests
pytest tests/test_alerts.py -v       # Alert engine tests
pytest tests/test_patients.py -v     # REST API endpoint tests
```

### Expected Results
- **Total Tests**: 52
- **test_simulator.py**: 17 tests (normal generation, condition simulation, recovery)
- **test_alerts.py**: 23 tests (threshold evaluation, escalation, acknowledgment, patient status)
- **test_patients.py**: 12 tests (REST endpoints, validation)
- **Expected**: All 52 pass, 0 failures

### Test Coverage Areas
| Component | Tests | Coverage |
|---|---|---|
| Vital Sign Simulator | 17 | Normal ranges, spike/sustained, recovery, edge cases |
| Alert Engine | 23 | Threshold detection, escalation, acknowledgment, status derivation |
| REST API | 12 | All endpoints, validation errors, 404 handling |

---

## Frontend Tests (Jest + React Testing Library)

### Run All Frontend Tests
```bash
cd frontend
npm test -- --watchAll=false
```

### Run Specific Test Files
```bash
npm test -- --testPathPattern=appReducer
```

### Expected Results
- **Total Tests**: 10
- **appReducer.test.js**: 10 tests (all reducer actions, sorting, state transitions)
- **Expected**: All 10 pass, 0 failures

### Test Coverage Areas
| Component | Tests | Coverage |
|---|---|---|
| App Reducer | 10 | SET_PATIENTS, UPDATE_VITALS, ADD_ALERT, ESCALATE_ALERT, ACKNOWLEDGE_ALERT, SELECT_PATIENT, TOGGLE_MUTE, SET_WS_CONNECTED |

---

## Fix Failing Tests

If tests fail:
1. Read the test output to identify the failing assertion
2. Check if it's a code bug or a test expectation issue
3. Fix the source code (not the test) unless the test expectation is wrong
4. Rerun the specific test file to verify the fix
5. Run the full suite to ensure no regressions
