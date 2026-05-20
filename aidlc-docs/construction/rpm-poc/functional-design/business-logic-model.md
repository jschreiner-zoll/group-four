# Business Logic Model

## Connected Care / Remote Patient Monitoring PoC

---

## 1. Vital Sign Simulation Algorithm

### Normal Value Generation
Each reading generates completely random values within the normal physiological range for each vital sign.

**Normal Ranges:**

| Vital Sign | Min | Max | Unit |
|---|---|---|---|
| Heart Rate | 60 | 100 | bpm |
| Systolic BP | 90 | 140 | mmHg |
| Diastolic BP | 60 | 90 | mmHg |
| SpO2 | 95 | 100 | % |
| Temperature | 97.0 | 99.0 | °F |
| Respiratory Rate | 12 | 20 | breaths/min |
| Blood Glucose | 70 | 140 | mg/dL |
| ECG Waveform | — | — | Simplified sine wave with noise |

**Algorithm (per reading, per patient):**
```
FOR each vital_sign:
  IF patient has active_condition affecting this vital:
    value = generate_condition_value(condition, vital_sign)
  ELIF patient is recovering for this vital:
    value = generate_recovery_value(vital_sign, recovery_progress)
  ELSE:
    value = random_uniform(normal_min, normal_max)
```

### Condition Simulation (Sudden Spike + Sustained)

When a condition is triggered:
1. **First reading**: Generate a sudden spike value (significantly beyond threshold)
2. **Subsequent readings**: Generate sustained abnormal values (randomly within abnormal range)

**Condition Value Ranges:**

| Condition | Vital | Spike Value | Sustained Range |
|---|---|---|---|
| Tachycardia | Heart Rate | 130-150 bpm | 105-140 bpm |
| Bradycardia | Heart Rate | 40-45 bpm | 42-58 bpm |
| Hypoxia | SpO2 | 78-82% | 80-88% |
| Hyperthermia | Temperature | 103-104°F | 101.5-103.5°F |
| Hypotension | Systolic BP | 70-75 mmHg | 72-88 mmHg |
| Hyperglycemia | Blood Glucose | 250-300 mg/dL | 185-280 mg/dL |

**Algorithm:**
```
def generate_condition_value(condition, vital_sign, is_first_reading):
    IF is_first_reading:
        return random_uniform(spike_min, spike_max)
    ELSE:
        return random_uniform(sustained_min, sustained_max)
```

### Recovery Algorithm (Gradual — 3-4 readings)

When "Return to Normal" is pressed:
1. Set `recovering = True`, `recovery_readings_remaining = 4`
2. Each subsequent reading interpolates between abnormal and normal ranges
3. After 4 readings (20 seconds), patient returns to fully normal generation

**Algorithm:**
```
def generate_recovery_value(vital_sign, readings_remaining):
    progress = 1 - (readings_remaining / 4)  # 0.0 → 1.0
    abnormal_value = random_uniform(sustained_min, sustained_max)
    normal_value = random_uniform(normal_min, normal_max)
    return abnormal_value + (normal_value - abnormal_value) * progress
```

After `recovery_readings_remaining` reaches 0:
- Remove active condition
- Set `recovering = False`
- Resume normal random generation

---

## 2. Threshold Evaluation Logic

### Evaluation Trigger
- Runs on EVERY vital reading generated (every 5 seconds per patient)
- Evaluates ALL vital signs in the reading against configured thresholds

### Default Threshold Configuration

| Vital Sign | Low Critical | Low Warning | High Warning | High Critical |
|---|---|---|---|---|
| Heart Rate | — | <60 bpm | >100 bpm | >130 bpm |
| Systolic BP | <70 mmHg | <90 mmHg | >140 mmHg | >180 mmHg |
| Diastolic BP | — | <50 mmHg | >90 mmHg | >120 mmHg |
| SpO2 | <85% | <90% | — | — |
| Temperature | <95°F | <96°F | >100.4°F | >103°F |
| Respiratory Rate | <8 | <10 | >24 | >30 |
| Blood Glucose | <54 mg/dL | <70 mg/dL | >180 mg/dL | >250 mg/dL |

### Evaluation Algorithm
```
def evaluate_vitals(patient_id, vitals):
    new_alerts = []
    FOR each vital_sign in vitals:
        value = vitals[vital_sign]
        thresholds = get_thresholds(vital_sign)
        
        IF value breaches critical threshold:
            severity = CRITICAL
        ELIF value breaches warning threshold:
            severity = WARNING
        ELSE:
            # Value is normal — check if existing alert should be cleared
            clear_breach_count(patient_id, vital_sign)
            CONTINUE
        
        existing_alert = find_active_alert(patient_id, vital_sign)
        
        IF existing_alert is None:
            # New breach — create alert
            alert = create_alert(patient_id, vital_sign, value, severity)
            new_alerts.append(alert)
        ELSE:
            # Existing breach — increment count, check escalation
            existing_alert.breach_count += 1
            IF existing_alert.breach_count >= 3 AND existing_alert.severity == WARNING:
                existing_alert.severity = CRITICAL
                existing_alert.escalated = True
                # Broadcast escalation update
    
    update_patient_status(patient_id)
    return new_alerts
```

---

## 3. Alert Escalation Logic

### Escalation Rules
- An alert starts at the severity determined by the threshold breached
- If the breach **persists for 3 or more consecutive readings** (15+ seconds) AND the alert is currently WARNING severity:
  - Escalate to CRITICAL
  - Set `escalated = True`
  - Broadcast escalation update via WebSocket
- Alerts that start as CRITICAL do not escalate further
- If a reading returns to normal, reset the breach count (alert remains active until acknowledged)

### Breach Count Tracking
```
breach_counts = {}  # Key: (patient_id, vital_sign), Value: int

def on_threshold_breach(patient_id, vital_sign):
    key = (patient_id, vital_sign)
    breach_counts[key] = breach_counts.get(key, 0) + 1
    return breach_counts[key]

def clear_breach_count(patient_id, vital_sign):
    key = (patient_id, vital_sign)
    breach_counts[key] = 0
```

---

## 4. Alert Lifecycle State Machine

```
                    +--------+
                    | (none) |
                    +--------+
                        |
              threshold breach detected
                        |
                        v
                    +--------+
            +------>| ACTIVE |
            |       +--------+
            |           |                    |
    escalation          | clinician          | value returns
    (3+ readings)       | acknowledges      | to normal
            |           |                    |
            |           v                    v
            |   +--------------+      (alert stays ACTIVE
            +---| ACKNOWLEDGED |       until acknowledged)
                +--------------+
```

**State Transitions:**
1. **(none) → ACTIVE**: Threshold breach detected, new alert created
2. **ACTIVE → ACTIVE (escalated)**: 3+ consecutive breach readings, severity upgrades WARNING → CRITICAL
3. **ACTIVE → ACKNOWLEDGED**: Clinician submits acknowledgment with note
4. **ACKNOWLEDGED**: Terminal state — alert remains in history

**Key Rule**: An alert is NEVER automatically dismissed. Even if vitals return to normal, the alert stays ACTIVE until a clinician acknowledges it. This ensures no alert goes unnoticed.

---

## 5. Patient Status Derivation

### Rule: Highest Severity Wins

```
def derive_patient_status(patient_id):
    active_alerts = get_active_alerts(patient_id)
    
    IF any alert has severity == CRITICAL:
        return PatientStatus.CRITICAL
    ELIF any alert has severity == WARNING:
        return PatientStatus.WARNING
    ELSE:
        return PatientStatus.NORMAL
```

**Note**: Only ACTIVE (unacknowledged) alerts contribute to patient status. Once acknowledged, the alert no longer affects the patient's displayed status.

---

## 6. WebSocket Message Flow

### Vitals Update (every 5 seconds per patient)
```json
{
  "type": "vitals_update",
  "data": {
    "patient_id": "uuid",
    "timestamp": "ISO-8601",
    "vitals": {
      "heart_rate": 72,
      "blood_pressure_systolic": 120,
      "blood_pressure_diastolic": 80,
      "spo2": 98,
      "temperature": 98.6,
      "respiratory_rate": 16,
      "blood_glucose": 95,
      "ecg_waveform": [0.1, 0.3, 0.8, ...]
    },
    "patient_status": "Normal"
  }
}
```

### New Alert
```json
{
  "type": "new_alert",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "John Smith",
    "vital_sign": "heart_rate",
    "value": 135,
    "threshold_value": 100,
    "severity": "Warning",
    "created_at": "ISO-8601"
  }
}
```

### Alert Escalated
```json
{
  "type": "alert_escalated",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "vital_sign": "heart_rate",
    "new_severity": "Critical",
    "breach_count": 3
  }
}
```

### Alert Acknowledged
```json
{
  "type": "alert_acknowledged",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "note": "Patient assessed, monitoring closely",
    "acknowledged_at": "ISO-8601"
  }
}
```
