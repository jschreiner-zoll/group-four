# Functional Design Plan

## Connected Care / Remote Patient Monitoring PoC

This plan covers the detailed business logic design for the entire PoC (single unit of work).

---

## Design Steps

- [x] Define domain entities and relationships
- [x] Design vital sign simulation algorithms and ranges
- [x] Design threshold evaluation and alert generation logic
- [x] Design alert lifecycle state machine
- [x] Design condition simulation behavior
- [x] Define frontend component state and interaction flows
- [x] Validate design completeness

---

## Design Questions

Please answer the following questions by filling in the letter choice after each [Answer]: tag.

### Vital Sign Simulation

## Question 1
How should normal vital sign values vary over time for a patient?

A) Fixed baseline with small random noise (e.g., HR stays around 72 ± 3 bpm)
B) Gradual drift within normal range with occasional small fluctuations (more realistic)
C) Completely random values within normal range each reading (simplest)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
When a condition is simulated (e.g., tachycardia), how should the transition happen?

A) Immediate jump — vitals instantly shift to abnormal values
B) Gradual ramp — vitals drift toward abnormal over 2-3 readings (10-15 seconds)
C) Sudden spike followed by sustained abnormal values
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Alert Logic

## Question 3
Should the system generate repeated alerts if a threshold remains breached across multiple readings?

A) Single alert per breach — one alert when threshold first crossed, no repeats until resolved
B) Escalating alerts — if breach persists for 3+ readings, escalate severity (warning → critical)
C) Repeated alerts at intervals — new alert every 30 seconds while breach persists
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
If multiple vital signs breach thresholds simultaneously for one patient, how should alerts be handled?

A) One alert per vital sign — separate alerts for each breached threshold
B) Single consolidated alert listing all breached vitals
C) One alert per vital sign, but grouped visually in the UI under the patient
X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Patient Status Logic

## Question 5
How should overall patient status (Normal/Warning/Critical) be determined when multiple vitals are in different states?

A) Highest severity wins — if any vital is critical, patient is critical
B) Weighted — certain vitals (HR, SpO2) carry more weight than others (temperature)
C) Count-based — 1 warning vital = warning status, 2+ warning or any critical = critical
X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Condition Simulation Details

## Question 6
When "Return to Normal" is pressed, how should recovery behave?

A) Immediate return — all vitals snap back to normal ranges instantly
B) Gradual recovery — vitals drift back to normal over 3-4 readings (15-20 seconds)
C) Immediate return but alert remains active until acknowledged
X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Frontend Interaction

## Question 7
When a patient tile is clicked for detail view, how should it display?

A) Modal/overlay on top of the dashboard (dashboard remains visible behind)
B) Slide-out panel from the right side (dashboard shifts left)
C) Replace the patient grid area (alert sidebar remains visible)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 8
How should the alert sidebar be sorted and organized?

A) Newest alerts at top, flat list (no grouping)
B) Grouped by patient, then sorted by severity within each group
C) Sorted by severity first (critical at top), then by timestamp within severity
X) Other (please describe after [Answer]: tag below)

[Answer]: C

