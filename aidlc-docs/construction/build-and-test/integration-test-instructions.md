# Integration Test Instructions — Care Team Escalation Routing

## Purpose
Test interactions between the escalation engine, care team manager, alert engine, and WebSocket broadcasting to ensure the full escalation cascade works end-to-end.

---

## Setup Integration Test Environment

### 1. Start Backend Server
```bash
cd backend
uvicorn app.main:app --port 8000
```

### 2. Verify Server Health
```bash
curl http://localhost:8000/api/patients
# Should return 10 patients

curl http://localhost:8000/api/care-team/clinicians
# Should return 4 clinicians (all on-duty)
```

---

## Integration Test Scenarios

### Scenario 1: Full Escalation Cascade (Demo Mode)

**Description**: Trigger an alert and watch it escalate through all 4 levels in demo mode.

**Steps**:
1. Enable demo mode:
```bash
curl -X POST http://localhost:8000/api/escalation/demo-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

2. Trigger a critical condition (tachycardia) on patient 1:
```bash
curl -X POST http://localhost:8000/api/patients/patient-001/simulate \
  -H "Content-Type: application/json" \
  -d '{"condition": "tachycardia"}'
```

3. Wait for alert to be generated (5 seconds for vitals cycle + threshold breach)

4. Check active escalations:
```bash
curl http://localhost:8000/api/escalation/active
# Should show escalation at Level 1 for patient-001
```

5. Wait 10 seconds (demo mode: 300s / 30 = 10s) — should escalate to Level 2

6. Check escalation again:
```bash
curl http://localhost:8000/api/escalation/active
# Should show escalation at Level 2
```

7. Wait another 10 seconds — should escalate to Level 3

8. Acknowledge the alert:
```bash
# Get alert ID from active alerts
ALERT_ID=$(curl -s http://localhost:8000/api/alerts | python -c "import sys,json; alerts=json.load(sys.stdin); print(alerts[0]['id'] if alerts else '')")

curl -X POST "http://localhost:8000/api/alerts/${ALERT_ID}/acknowledge" \
  -H "Content-Type: application/json" \
  -d '{"note": "Patient assessed, vitals stabilizing"}'
```

9. Verify escalation stopped:
```bash
curl http://localhost:8000/api/escalation/active
# Should be empty (escalation resolved)
```

10. Check escalation timeline:
```bash
curl "http://localhost:8000/api/escalation/${ALERT_ID}/timeline"
# Should show: started → notified → escalated → escalated → acknowledged → resolved
```

**Expected Results**:
- Escalation progresses through levels every ~10 seconds in demo mode
- Acknowledgment stops the cascade
- Timeline shows complete audit trail

---

### Scenario 2: Off-Duty Skip

**Description**: Set a clinician off-duty and verify escalation skips their level.

**Steps**:
1. Set Charge Nurse (Level 2) off-duty:
```bash
curl -X PUT http://localhost:8000/api/care-team/clinicians/clinician-002/status \
  -H "Content-Type: application/json" \
  -d '{"on_duty": false}'
```

2. Enable demo mode and trigger alert (same as Scenario 1, steps 1-2)

3. After Level 1 timeout (10s demo), check escalation:
```bash
curl http://localhost:8000/api/escalation/active
# Should show Level 3 (skipped Level 2 because clinician-002 is off-duty)
```

4. Check timeline for skip event:
```bash
curl "http://localhost:8000/api/escalation/${ALERT_ID}/timeline"
# Should include event_type: "skipped" at level 2
```

5. Cleanup — set clinician back on-duty:
```bash
curl -X PUT http://localhost:8000/api/care-team/clinicians/clinician-002/status \
  -H "Content-Type: application/json" \
  -d '{"on_duty": true}'
```

---

### Scenario 3: Bulk Handoff with Active Escalation

**Description**: Perform a bulk handoff while an escalation is active — verify restart.

**Steps**:
1. Trigger alert and wait for escalation to reach Level 2 (demo mode)

2. Perform bulk handoff:
```bash
curl -X POST http://localhost:8000/api/care-team/handoff \
  -H "Content-Type: application/json" \
  -d '{"patient_ids": ["patient-001"], "to_clinician_id": "clinician-001", "level": 1}'
```

3. Check escalation:
```bash
curl http://localhost:8000/api/escalation/active
# Should show escalation restarted at Level 1 with new care team
```

4. Check timeline:
```bash
# Should include event_type: "restarted" with reason: "handoff"
```

---

### Scenario 4: Grouped Escalation (Multiple Alerts Same Patient)

**Description**: Trigger multiple conditions on same patient — verify single escalation.

**Steps**:
1. Trigger tachycardia on patient-001
2. Wait for alert to generate
3. Trigger hypoxia on same patient
4. Wait for second alert

5. Check escalations:
```bash
curl http://localhost:8000/api/escalation/active
# Should show ONE escalation with multiple alert_ids
```

6. Acknowledge one alert — should resolve the entire grouped escalation

---

### Scenario 5: WebSocket Escalation Events

**Description**: Connect via WebSocket and verify escalation events are broadcast.

**Steps**:
1. Connect to WebSocket:
```bash
# Using websocat or similar tool:
websocat ws://localhost:8000/ws
```

2. Trigger alert in another terminal (demo mode)

3. Observe WebSocket messages:
```json
{"type": "escalation_event", "data": {"type": "notified", "alert_id": "...", "level": 1, "clinician_id": "clinician-001", ...}}
```

4. Wait for escalation:
```json
{"type": "escalation_event", "data": {"type": "escalated", "alert_id": "...", "level": 2, "clinician_id": "clinician-002", ...}}
```

5. Acknowledge — observe resolution:
```json
{"type": "escalation_event", "data": {"type": "resolved", "alert_id": "...", ...}}
```

---

### Scenario 6: Escalation Configuration

**Description**: Modify escalation config and verify behavior changes.

**Steps**:
1. Set WARNING alerts to max Level 2:
```bash
curl -X PUT http://localhost:8000/api/escalation/config/current \
  -H "Content-Type: application/json" \
  -d '{"severity_max_levels": {"Warning": 2, "Critical": 4}}'
```

2. Trigger a WARNING-level condition (e.g., mild tachycardia at 105 bpm)

3. Verify escalation stops at Level 2 (does not proceed to Level 3)

---

## Cleanup

After integration testing:
```bash
# Disable demo mode
curl -X POST http://localhost:8000/api/escalation/demo-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Reset all clinicians to on-duty
curl -X PUT http://localhost:8000/api/care-team/clinicians/clinician-002/status \
  -H "Content-Type: application/json" \
  -d '{"on_duty": true}'

# Restart server to reset all in-memory state
```
