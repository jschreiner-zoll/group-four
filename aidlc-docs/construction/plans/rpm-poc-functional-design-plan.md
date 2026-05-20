# Functional Design Plan — Care Team Escalation Routing & Management

## Plan Overview

This plan defines the detailed business logic design for the Care Team Escalation Routing feature, building on the Application Design artifacts.

---

## Design Steps

- [x] Define domain entities (FHIR-aligned CareTeam, Practitioner, EscalationState, EscalationEvent)
- [x] Define escalation state machine (states, transitions, triggers)
- [x] Define business rules (escalation timing, severity routing, off-duty handling, RRT composition)
- [x] Define business logic model (escalation cascade algorithm, acknowledgment flow, handoff logic)
- [x] Define frontend component behavior (EscalationStatusPanel, CareTeamPage interactions, notification filtering)
- [x] Identify testable properties for PBT (PBT-01 compliance)
- [x] Validate completeness against requirements

---

## Functional Design Questions

Please answer the following questions by filling in the letter choice after each [Answer]: tag.

### Question 1: Escalation State Machine — Off-Duty Skip Behavior
When a clinician at the target escalation level is off-duty, how should the system handle the timer for the skipped level?

A) Skip immediately to next level with no delay — if Level 2 clinician is off-duty, jump straight to Level 3 with Level 3's timer starting fresh
B) Skip to next level but consume the skipped level's time — if Level 2 is off-duty, Level 3 timer starts but the total elapsed time still counts the Level 2 window
C) Skip to next level and start a fresh timer with the NEXT level's timeout duration — each level always gets its full timeout regardless of skips
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2: Concurrent Alerts for Same Patient
If a patient has multiple active alerts simultaneously (e.g., tachycardia AND hypoxia), how should escalation work?

A) Independent escalation per alert — each alert has its own escalation cascade running independently
B) Grouped escalation — all alerts for the same patient share one escalation cascade (highest severity drives the level)
C) Independent but coordinated — separate cascades, but acknowledging one does NOT stop the others
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3: Acknowledgment During Escalation — Who Can Acknowledge?
When an alert has escalated to Level 3 (Physician), who is allowed to acknowledge it?

A) Any clinician at any level can acknowledge (the Level 1 nurse can still acknowledge even after escalation to Level 3)
B) Only the clinician at the current escalation level or higher can acknowledge
C) Any clinician who was notified during the cascade can acknowledge (Levels 1, 2, and 3 in this case)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Handoff During Active Escalation
If a patient is reassigned (handoff) while an active escalation is in progress for that patient, what happens?

A) Escalation continues with the OLD care team — the cascade already in progress is not affected by reassignment
B) Escalation restarts with the NEW care team — cancel current cascade, start fresh with new Level 1 clinician
C) Escalation transfers to NEW care team at the CURRENT level — if at Level 2, the new Level 2 clinician gets notified and timer continues
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5: Notification Content — What Context is Included?
When a clinician receives an escalation notification, what information should be included?

A) Minimal — alert summary only (patient name, vital sign, severity, current value)
B) Standard — alert summary + escalation context (current level, time since alert, who was previously notified)
C) Comprehensive — alert summary + escalation context + patient vitals snapshot + care team info + previous acknowledgment history
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: Escalation History Retention
How long should escalation history be retained in memory?

A) Forever (until server restart) — all completed escalations remain queryable
B) Last N escalations per patient (e.g., last 10) — older ones are discarded
C) Time-based retention (e.g., last 24 hours) — older ones are discarded
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7: Demo Mode Transition — Active Escalations
When demo mode is toggled ON while escalations are already in progress (real-time mode), what happens to those active escalations?

A) Existing escalations continue at real-time speed — only NEW escalations use demo timing
B) All active escalations immediately switch to demo timing — pending callbacks are rescheduled with compressed delays
C) All active escalations are cancelled/reset — user must trigger new alerts to see demo behavior
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 8: Shift Handoff Summary — Scope
What time window should the "recent acknowledgments from outgoing shift" cover in the handoff summary?

A) Last 30 minutes
B) Last 1 hour
C) Since the outgoing clinician's shift started (requires tracking shift start time)
D) Configurable (default 30 minutes, supervisor can adjust)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

