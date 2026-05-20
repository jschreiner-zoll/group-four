# Integration Test Instructions

## Purpose
Test the interaction between backend components (simulator → alert engine → WebSocket) and frontend-backend communication.

## Test Scenarios

### Scenario 1: Simulator → Alert Engine → WebSocket Flow
- **Description**: Verify that simulated vitals trigger threshold evaluation and alerts are broadcast
- **Setup**: Start backend server
- **Test Steps**:
  1. Start the backend: `uvicorn app.main:app --port 8000`
  2. Connect a WebSocket client: `websocat ws://localhost:8000/ws`
  3. Trigger a condition: `curl -X POST http://localhost:8000/api/patients/{id}/simulate -H "Content-Type: application/json" -d '{"condition": "tachycardia"}'`
  4. Wait 5-10 seconds for vitals generation
  5. Observe WebSocket messages for `vitals_update` with elevated heart rate
  6. Observe `new_alert` message with heart_rate threshold breach
- **Expected Results**: WebSocket receives vitals_update with HR >100, followed by new_alert message
- **Cleanup**: Stop the server (Ctrl+C)

### Scenario 2: Alert Acknowledgment Flow
- **Description**: Verify alert acknowledgment updates state and broadcasts to all clients
- **Setup**: Backend running with at least one active alert
- **Test Steps**:
  1. Get active alerts: `curl http://localhost:8000/api/alerts`
  2. Copy an alert ID from the response
  3. Acknowledge it: `curl -X POST http://localhost:8000/api/alerts/{alert_id}/acknowledge -H "Content-Type: application/json" -d '{"note": "Patient assessed"}'`
  4. Verify alert moved to history: `curl http://localhost:8000/api/alerts/history`
  5. Verify WebSocket received `alert_acknowledged` message
- **Expected Results**: Alert status changes to "Acknowledged", note is stored, WebSocket broadcasts update

### Scenario 3: Alert Escalation Flow
- **Description**: Verify alerts escalate from Warning to Critical after 3 consecutive breaches
- **Setup**: Backend running
- **Test Steps**:
  1. Trigger tachycardia (produces HR 105-140, which is warning level)
  2. Wait 15+ seconds (3 readings at 5-second intervals)
  3. Check alerts: `curl http://localhost:8000/api/alerts`
  4. Verify the alert severity changed from "Warning" to "Critical"
  5. Verify `escalated` field is `true`
- **Expected Results**: After 15 seconds, alert escalates to Critical with escalated=true

### Scenario 4: Patient Reset and Recovery
- **Description**: Verify gradual recovery over 4 readings
- **Setup**: Backend running with active condition
- **Test Steps**:
  1. Trigger condition: POST simulate with "hypoxia"
  2. Wait 5 seconds, observe low SpO2 in vitals_update
  3. Reset patient: POST reset
  4. Observe next 4 vitals_update messages (20 seconds)
  5. Verify SpO2 gradually returns to normal range (95-100%)
- **Expected Results**: SpO2 interpolates from abnormal toward normal over 4 readings

## Manual Integration Test Script

```bash
#!/bin/bash
# Quick integration test script
BASE_URL="http://localhost:8000/api"

echo "1. Getting patients..."
PATIENTS=$(curl -s $BASE_URL/patients)
PATIENT_ID=$(echo $PATIENTS | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
echo "   Patient ID: $PATIENT_ID"

echo "2. Triggering tachycardia..."
curl -s -X POST "$BASE_URL/patients/$PATIENT_ID/simulate" \
  -H "Content-Type: application/json" \
  -d '{"condition": "tachycardia"}'
echo ""

echo "3. Waiting 10 seconds for alerts..."
sleep 10

echo "4. Checking alerts..."
ALERTS=$(curl -s $BASE_URL/alerts)
echo "   Active alerts: $ALERTS"

echo "5. Resetting patient..."
curl -s -X POST "$BASE_URL/patients/$PATIENT_ID/reset"
echo ""

echo "6. Done! Check WebSocket output for real-time messages."
```

## Run Integration Tests

No automated integration test framework is configured for this PoC. Use the manual scenarios above or the test script to verify integration.
