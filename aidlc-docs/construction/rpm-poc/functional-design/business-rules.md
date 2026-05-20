# Business Rules

## Connected Care / Remote Patient Monitoring PoC

---

## Vital Sign Generation Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| VSR-1 | Normal values are randomly generated within physiological range each reading | No memory of previous values |
| VSR-2 | Condition simulation produces a sudden spike on first reading | Spike value exceeds threshold significantly |
| VSR-3 | After spike, condition produces sustained abnormal values | Values remain in abnormal range until reset |
| VSR-4 | Recovery takes 4 readings (20 seconds) with linear interpolation | Progress: 0%, 25%, 50%, 75%, 100% normal |
| VSR-5 | Only one condition can affect a given vital sign at a time | Triggering same-vital condition replaces previous |
| VSR-6 | Multiple conditions can be active simultaneously if they affect different vitals | e.g., tachycardia + hypoxia together |
| VSR-7 | ECG waveform is simplified as a sine wave with random noise | Not clinically accurate, visual only |
| VSR-8 | Data generation interval is exactly 5 seconds per patient | All patients generate independently |

---

## Threshold Evaluation Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| THR-1 | Every vital reading triggers threshold evaluation | No readings skip evaluation |
| THR-2 | A value breaching a critical threshold generates a CRITICAL alert | Regardless of breach count |
| THR-3 | A value breaching a warning threshold generates a WARNING alert | May escalate later |
| THR-4 | Only one active alert per patient per vital sign at a time | New breach on same vital updates existing alert |
| THR-5 | If value returns to normal, breach count resets to 0 | Alert remains active until acknowledged |
| THR-6 | Threshold evaluation uses >= for high thresholds and <= for low thresholds | Boundary values trigger alerts |

---

## Alert Escalation Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| ESC-1 | Warning alerts escalate to Critical after 3 consecutive breach readings | 3 readings = 15 seconds minimum |
| ESC-2 | Escalation only applies to WARNING → CRITICAL | Already-critical alerts don't escalate further |
| ESC-3 | Escalation broadcasts an "alert_escalated" WebSocket message | Frontend updates severity display |
| ESC-4 | Breach count resets if value returns to normal range | Even momentarily |
| ESC-5 | Escalated alerts are marked with `escalated = True` | Distinguishable from originally-critical alerts |

---

## Alert Lifecycle Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| ALR-1 | Alerts are never automatically dismissed or resolved | Only clinician acknowledgment changes state |
| ALR-2 | Acknowledgment requires a text note of minimum 1 character | Empty notes are rejected |
| ALR-3 | Acknowledged alerts move to history but remain queryable | Never deleted during session |
| ALR-4 | Only active (unacknowledged) alerts affect patient status | Acknowledged alerts don't contribute to status |
| ALR-5 | Alert acknowledgment broadcasts to all connected clients | All clinicians see the update |
| ALR-6 | Each alert has a unique ID (UUID) | For tracking and acknowledgment targeting |

---

## Patient Status Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| PSR-1 | Patient status = highest severity among active alerts | Critical > Warning > Normal |
| PSR-2 | Patient with no active alerts has status Normal | Regardless of acknowledged alert history |
| PSR-3 | Patient status updates immediately when alerts change | On new alert, escalation, or acknowledgment |
| PSR-4 | Patient status is included in every vitals_update WebSocket message | Frontend always has current status |

---

## Condition Simulation Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| CSR-1 | Each condition maps to exactly one vital sign | See condition-vital mapping in domain entities |
| CSR-2 | Triggering a condition immediately affects the next vital reading | No delay between button press and effect |
| CSR-3 | "Return to Normal" initiates gradual recovery (4 readings) | Not instant return |
| CSR-4 | During recovery, threshold evaluation still runs | Recovery values may still breach thresholds |
| CSR-5 | Multiple conditions can be active on one patient simultaneously | If they affect different vitals |
| CSR-6 | Triggering a condition that's already active has no additional effect | Idempotent operation |
| CSR-7 | "Return to Normal" resets ALL active conditions for that patient | Not per-condition reset |

---

## Frontend Display Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| FDR-1 | Patient detail view opens as slide-out panel from right | Dashboard shifts left, remains partially visible |
| FDR-2 | Alert sidebar sorted by severity (critical first), then timestamp within severity | Most urgent alerts always at top |
| FDR-3 | Alerts grouped visually by patient in the sidebar | Patient header with their alerts underneath |
| FDR-4 | Active alerts visually distinct from acknowledged (color, opacity, icon) | Clear at-a-glance differentiation |
| FDR-5 | Audio plays different sounds for warning vs critical | Priority queue: critical interrupts warning |
| FDR-6 | All status colors meet WCAG 2.0 AA contrast ratio (4.5:1 minimum) | Verified against background colors |
| FDR-7 | Status indicators use color + icon + text label | Never color-only |
| FDR-8 | Simulation buttons disabled during recovery phase | Prevent re-triggering while recovering |

---

## Validation Rules

| Rule ID | Rule | Constraint |
|---|---|---|
| VAL-1 | Alert acknowledgment note: minimum 1 character, maximum 500 characters | Trimmed of whitespace before validation |
| VAL-2 | Condition simulation: patient_id must exist | 404 if invalid patient |
| VAL-3 | Condition simulation: condition must be a valid enum value | 400 if invalid condition |
| VAL-4 | Alert acknowledgment: alert_id must exist and be in ACTIVE state | 404 if not found, 409 if already acknowledged |
