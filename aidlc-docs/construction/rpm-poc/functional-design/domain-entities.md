# Domain Entities

## Connected Care / Remote Patient Monitoring PoC

---

## Entity Relationship Overview

```
+----------+       1:N       +-------------+       1:N       +---------+
|  Patient | -------------> | VitalReading | <-------------- |  Alert  |
+----------+                +-------------+                  +---------+
     |                                                            |
     | 1:N                                                        |
     v                                                            v
+-------------------+                                  +--------------------+
| ActiveCondition   |                                  | Acknowledgment     |
+-------------------+                                  +--------------------+
```

---

## Entities

### Patient

| Field | Type | Description |
|---|---|---|
| id | string (UUID) | Unique patient identifier |
| name | string | Full name (e.g., "John Smith") |
| age | int | Patient age in years |
| room | string | Room/bed assignment (e.g., "Room 204-A") |
| status | enum: Normal, Warning, Critical | Overall patient status (derived from vitals) |
| active_conditions | List[string] | Currently simulated conditions |

### VitalReading

| Field | Type | Description |
|---|---|---|
| patient_id | string | Reference to Patient |
| timestamp | datetime (ISO 8601) | When reading was generated |
| heart_rate | float | Beats per minute (bpm) |
| blood_pressure_systolic | float | Systolic BP (mmHg) |
| blood_pressure_diastolic | float | Diastolic BP (mmHg) |
| spo2 | float | Oxygen saturation (%) |
| temperature | float | Body temperature (°F) |
| respiratory_rate | float | Breaths per minute |
| ecg_waveform | List[float] | ECG data points (simplified) |
| blood_glucose | float | Blood glucose (mg/dL) |

### Alert

| Field | Type | Description |
|---|---|---|
| id | string (UUID) | Unique alert identifier |
| patient_id | string | Reference to Patient |
| vital_sign | string | Which vital triggered the alert (e.g., "heart_rate") |
| threshold_type | string | Which threshold was breached (e.g., "high", "low") |
| value | float | The actual value that breached the threshold |
| threshold_value | float | The threshold that was breached |
| severity | enum: Warning, Critical | Alert severity level |
| status | enum: Active, Acknowledged | Current alert state |
| created_at | datetime | When alert was generated |
| breach_count | int | Number of consecutive readings breaching threshold |
| escalated | bool | Whether alert was escalated from warning to critical |
| acknowledgment | Acknowledgment or None | Acknowledgment details if acknowledged |

### Acknowledgment

| Field | Type | Description |
|---|---|---|
| note | string | Clinician's acknowledgment note (min 1 char) |
| acknowledged_at | datetime | When alert was acknowledged |

### ActiveCondition

| Field | Type | Description |
|---|---|---|
| patient_id | string | Reference to Patient |
| condition | string | Condition name (e.g., "tachycardia") |
| started_at | datetime | When condition was triggered |
| recovering | bool | Whether patient is in recovery phase |
| recovery_readings_remaining | int | Readings left until fully recovered (0 = not recovering) |

### ThresholdConfig

| Field | Type | Description |
|---|---|---|
| vital_sign | string | Which vital sign |
| high_warning | float or None | Upper warning threshold |
| high_critical | float or None | Upper critical threshold |
| low_warning | float or None | Lower warning threshold |
| low_critical | float or None | Lower critical threshold |
| escalation_readings | int | Readings before escalation (default: 3) |

---

## Enumerations

### PatientStatus
- `Normal` — All vitals within normal range
- `Warning` — At least one vital in warning range, none critical
- `Critical` — At least one vital in critical range

### AlertSeverity
- `Warning` — Threshold breached but not yet critical
- `Critical` — Critical threshold breached OR escalated from warning

### AlertStatus
- `Active` — Alert is unacknowledged, requires clinician attention
- `Acknowledged` — Clinician has acknowledged with a note

### SimulatedCondition
- `tachycardia` — Heart rate >100 bpm
- `bradycardia` — Heart rate <60 bpm
- `hypoxia` — SpO2 <90%
- `hyperthermia` — Temperature >101°F
- `hypotension` — Systolic BP <90 mmHg
- `hyperglycemia` — Blood glucose >180 mg/dL
