# Business Rules — Care Team Escalation Routing

---

## Escalation Rules

### BR-01: Grouped Escalation Per Patient
- All active alerts for the same patient share ONE escalation cascade
- When a new alert fires for a patient with an active escalation, it joins the existing cascade
- The escalation's `max_level` is updated to the highest severity's max level
- Acknowledging the escalation resolves ALL grouped alerts

### BR-02: Escalation Timing
- Level 1 → Level 2: 300 seconds (5 minutes)
- Level 2 → Level 3: 300 seconds (5 minutes from Level 2 entry)
- Level 3 → Level 4: 300 seconds (5 minutes from Level 3 entry)
- Each level gets its own full timeout regardless of previous levels
- Timers are managed by VirtualClock (supports real-time and demo mode)

### BR-03: Severity-Based Maximum Level
- WARNING alerts: maximum escalation Level 3 (Physician)
- CRITICAL alerts: maximum escalation Level 4 (RRT)
- Configurable by supervisor via escalation config endpoint
- When grouped, the highest severity determines the max level

### BR-04: Off-Duty Skip
- If the target clinician at a level is off-duty, skip immediately to the next level
- No delay is incurred for skipped levels
- The next level starts with a fresh timer (its own full timeout)
- Skipped levels are recorded in the audit trail with `skipped: true`
- If ALL clinicians up to max_level are off-duty, escalation enters TIMED_OUT state

### BR-05: RRT Notification (Level 4)
- Level 4 (RRT) is a group — ALL on-duty RRT members are notified individually
- RRT members are any subset of the overall care team roster
- A clinician can appear at their individual level AND as part of the RRT
- If no RRT members are on-duty, escalation enters TIMED_OUT state

### BR-06: Escalation Stop on Acknowledgment
- Any clinician at any level can acknowledge an alert (no level restriction)
- Acknowledgment immediately cancels the pending escalation timer
- All previously notified clinicians receive a "resolved" notification
- The acknowledging clinician does NOT receive a resolution notification (they already know)
- Escalation status transitions to RESOLVED

### BR-07: Handoff Restarts Escalation
- When a patient is reassigned (bulk handoff or individual), active escalations restart
- The current cascade is cancelled (timer cancelled, state reset)
- A new cascade starts at Level 1 with the NEW care team
- The restart is recorded in the audit trail as event type "restarted"
- Previous notification history is preserved in the audit trail

---

## Care Team Rules

### BR-08: Care Team Assignment
- Each patient has exactly one active CareTeam at any time
- CareTeam must have at least a Level 1 participant (Primary Nurse)
- Levels 2, 3, 4 are optional but recommended
- CareTeam status must be "active" for escalation routing

### BR-09: Clinician Duty Status
- On-duty (active=true): available for escalation routing and notifications
- Off-duty (active=false): skipped during escalation, no notifications sent
- Toggling off-duty does NOT affect already-sent notifications
- If a clinician goes off-duty while at their escalation level: the timer continues normally (no immediate skip — skip only happens at transition time)

### BR-10: Bulk Handoff
- Multiple patients can be transferred simultaneously
- All selected patients are reassigned to the target clinician at the specified level
- Active escalations for transferred patients are restarted (BR-07)
- A HandoffSummary is auto-generated after the operation completes
- The summary covers the last 1 hour of acknowledgments

### BR-11: RRT Composition
- RRT members are defined per patient's CareTeam
- Any clinician from the roster can be designated as an RRT member
- The same clinician can serve at their individual level AND be part of RRT
- RRT composition can be modified by supervisor at any time

---

## Demo Mode Rules

### BR-12: Virtual Clock Time Scaling
- Real-time mode: time_scale = 1.0 (300 seconds = 300 real seconds)
- Demo mode: time_scale = 30.0 (300 seconds = 10 real seconds)
- Toggling demo mode reschedules ALL active escalation callbacks
- Remaining time at current level is recalculated with new scale
- If remaining time is ≤ 0 after rescale, escalation fires immediately

### BR-13: Demo Mode Scope
- Demo mode affects ALL escalation timers globally
- Both new and existing escalations use the current time scale
- Demo mode toggle is available via SimulationControls UI and REST API
- VirtualClock.now() always returns real system time (only delays are scaled)

---

## Notification Rules

### BR-14: Notification Content (Minimal)
- Push notifications contain: alert summary (patient name, vital sign, severity, current value)
- Full escalation context (who was notified, time at each level) is available via state query
- The AlertCard UI displays full context by reading escalation state
- Notifications are delivered via WebSocket as `escalation_event` messages

### BR-15: Notification Filtering
- Frontend filters notifications based on selected clinician (ClinicianSelector)
- Only notifications targeting the selected clinician are displayed in NotificationPanel
- All escalation events are broadcast to all connected clients (filtering is client-side)
- Resolution notifications are sent to all previously notified clinicians

---

## History and Audit Rules

### BR-16: Escalation History Retention
- All completed escalations are retained in memory until server restart
- No automatic pruning or time-based expiration
- History is queryable by alert_id, patient_id, or clinician_id
- Audit trail includes complete timeline of all events

### BR-17: Audit Trail Completeness
- Every escalation event is recorded with timestamp, level, clinician, and event type
- Skipped levels are explicitly recorded
- Response time per level is calculated (time from notification to level exit)
- Total escalation duration is tracked (started_at to resolved_at)

---

## Validation Rules

### VR-01: Care Team Assignment Validation
- patient_id must reference an existing patient
- clinician_id must reference an existing clinician in the roster
- Level must be 1-4
- Cannot assign the same clinician to multiple levels for the same patient (except RRT)

### VR-02: Escalation Config Validation
- level_timeouts values must be positive integers (> 0)
- severity_max_levels values must be 1-4
- demo_time_scale must be > 0 (typically 1.0 or 30.0)

### VR-03: Handoff Validation
- patient_ids must all reference existing patients
- Target clinician must exist and be on-duty
- Cannot handoff to the same clinician already assigned at that level

---

## Testable Properties (PBT-01 Compliance)

### Property Category: Invariants (PBT-03)
1. **Escalation level monotonicity**: Current level never decreases during a cascade (only increases or stays same)
2. **Timer cancellation guarantee**: After acknowledgment, no escalation callback fires for that alert
3. **Notification completeness**: On resolution, every clinician in `notified_clinicians` receives a resolution event
4. **Grouped alert consistency**: All alert_ids in an EscalationState belong to the same patient_id
5. **Max level ceiling**: current_level never exceeds max_level

### Property Category: Idempotence (PBT-04)
6. **Acknowledge idempotence**: Acknowledging an already-resolved escalation has no effect (no duplicate notifications)
7. **Demo mode toggle idempotence**: Toggling demo mode ON when already ON has no effect on timers

### Property Category: State Machine (PBT-06)
8. **Valid state transitions**: EscalationState only transitions through valid states (active → resolved | timed_out)
9. **No orphaned callbacks**: Every active escalation has exactly one pending callback OR is at max_level/timed_out
10. **Handoff restart correctness**: After handoff, escalation is at Level 1 with new care team's clinician

### Property Category: Round-Trip (PBT-02)
11. **FHIR serialization round-trip**: CareTeam model serialized to JSON and deserialized back equals original
12. **EscalationState serialization**: State serialized for WebSocket and deserialized on frontend equals original

