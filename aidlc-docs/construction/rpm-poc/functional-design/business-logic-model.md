# Business Logic Model — Care Team Escalation Routing

---

## Escalation State Machine

### States
```
[IDLE] --alert_created--> [LEVEL_1_ACTIVE]
[LEVEL_1_ACTIVE] --timer_expired--> [LEVEL_2_ACTIVE]
[LEVEL_2_ACTIVE] --timer_expired--> [LEVEL_3_ACTIVE]
[LEVEL_3_ACTIVE] --timer_expired--> [LEVEL_4_ACTIVE]
[LEVEL_4_ACTIVE] --timer_expired--> [TIMED_OUT]

[ANY_ACTIVE] --acknowledged--> [RESOLVED]
[ANY_ACTIVE] --handoff--> [RESTARTED] --immediate--> [LEVEL_1_ACTIVE]
[ANY_ACTIVE] --alert_joined--> [SAME_STATE] (update max_level)
```

### State Transitions

| From | Trigger | To | Action |
|---|---|---|---|
| IDLE | alert_created | LEVEL_1_ACTIVE | Lookup Level 1 clinician, notify, start timer |
| LEVEL_N_ACTIVE | timer_expired | LEVEL_N+1_ACTIVE | Lookup next clinician, notify, start timer |
| LEVEL_N_ACTIVE | clinician_off_duty | LEVEL_N+1_ACTIVE | Skip immediately (no delay), fresh timer at next level |
| ANY_ACTIVE | acknowledged | RESOLVED | Cancel timer, notify all previously notified |
| ANY_ACTIVE | handoff | LEVEL_1_ACTIVE | Cancel timer, restart with new care team |
| LEVEL_MAX_ACTIVE | timer_expired | TIMED_OUT | No further escalation, alert remains active |

---

## Core Algorithms

### Algorithm 1: Start Escalation (on alert created)

```
FUNCTION start_escalation(alert):
    patient_id = alert.patient_id
    
    # Check if patient already has an active escalation (grouped model)
    existing = escalation_tracker.get_active_for_patient(patient_id)
    
    IF existing:
        # Join existing escalation
        existing.alert_ids.append(alert.id)
        # Update max_level if new alert has higher severity
        new_max = config.severity_max_levels[alert.severity]
        IF new_max > existing.max_level:
            existing.max_level = new_max
        record_event(alert_joined, existing)
        RETURN existing
    
    # Create new escalation
    max_level = config.severity_max_levels[alert.severity]
    care_team = care_team_manager.get_care_team(patient_id)
    
    # Find first available clinician (skip off-duty)
    level, clinician = find_first_available(care_team, start_level=1, max_level=max_level)
    
    IF clinician is None:
        # No available clinicians — create escalation in timed_out state
        state = create_escalation(patient_id, [alert.id], max_level, status=TIMED_OUT)
        RETURN state
    
    state = create_escalation(patient_id, [alert.id], max_level, current_level=level)
    notify_clinician(clinician, alert, level)
    schedule_next_escalation(state)
    RETURN state
```

### Algorithm 2: Escalate to Next Level (timer expired)

```
FUNCTION escalate_to_next_level(escalation_id):
    state = escalation_tracker.get_escalation(escalation_id)
    
    IF state.status != ACTIVE:
        RETURN  # Already resolved or timed out
    
    # Record exit from current level
    record_level_exit(state)
    
    next_level = state.current_level + 1
    
    IF next_level > state.max_level:
        # Reached maximum — timed out
        state.status = TIMED_OUT
        record_event(timed_out, state)
        RETURN
    
    care_team = care_team_manager.get_care_team(state.patient_id)
    
    # Find next available clinician (skip off-duty levels)
    level, clinician = find_first_available(care_team, start_level=next_level, max_level=state.max_level)
    
    IF clinician is None:
        state.status = TIMED_OUT
        RETURN
    
    # Handle RRT (Level 4) — notify all members
    IF level == 4:
        rrt_members = care_team_manager.get_rrt_members(state.patient_id)
        FOR member IN rrt_members:
            notify_clinician(member, state, level, is_rrt=True)
    ELSE:
        notify_clinician(clinician, state, level)
    
    state.current_level = level
    state.level_entered_at = virtual_clock.now()
    record_event(escalated, state, level, clinician)
    schedule_next_escalation(state)
```

### Algorithm 3: Find First Available Clinician

```
FUNCTION find_first_available(care_team, start_level, max_level):
    FOR level IN range(start_level, max_level + 1):
        participant = get_participant_at_level(care_team, level)
        
        IF participant is None:
            CONTINUE  # No one assigned at this level
        
        IF level == 4:
            # RRT — check if any member is on duty
            rrt_members = get_rrt_members(care_team)
            IF any(member.active for member in rrt_members):
                RETURN (level, rrt_members[0])  # Return first available
        ELSE:
            clinician = resolve_practitioner(participant.member)
            IF clinician.active:  # On-duty
                RETURN (level, clinician)
            ELSE:
                record_event(skipped, level, clinician)  # Log the skip
    
    RETURN (None, None)  # No available clinicians
```

### Algorithm 4: Acknowledge Alert (stops escalation)

```
FUNCTION on_alert_acknowledged(alert_id, acknowledged_by_clinician_id):
    # Find escalation containing this alert
    state = escalation_tracker.find_by_alert_id(alert_id)
    
    IF state is None OR state.status != ACTIVE:
        RETURN  # No active escalation for this alert
    
    # Cancel pending timer
    IF state.pending_callback_handle:
        virtual_clock.cancel(state.pending_callback_handle)
        state.pending_callback_handle = None
    
    # Record acknowledgment
    state.status = RESOLVED
    state.resolved_by = acknowledged_by_clinician_id
    state.resolved_at = virtual_clock.now()
    record_level_exit(state)
    record_event(acknowledged, state, acknowledged_by_clinician_id)
    
    # Notify all previously notified clinicians of resolution
    FOR notified IN state.notified_clinicians:
        IF notified.clinician_id != acknowledged_by_clinician_id:
            send_resolution_notification(notified.clinician_id, state)
    
    record_event(resolved, state)
```

### Algorithm 5: Handoff During Active Escalation

```
FUNCTION on_patient_handoff(patient_id, new_care_team):
    state = escalation_tracker.get_active_for_patient(patient_id)
    
    IF state is None:
        RETURN  # No active escalation
    
    # Cancel current escalation
    IF state.pending_callback_handle:
        virtual_clock.cancel(state.pending_callback_handle)
    
    record_event(restarted, state, reason="handoff")
    
    # Restart with new care team at Level 1
    state.current_level = 0  # Will be set by start logic
    state.level_entered_at = virtual_clock.now()
    state.notified_clinicians = []  # Reset notifications
    
    # Find first available in new team
    level, clinician = find_first_available(new_care_team, start_level=1, max_level=state.max_level)
    
    IF clinician:
        state.current_level = level
        notify_clinician(clinician, state, level)
        schedule_next_escalation(state)
    ELSE:
        state.status = TIMED_OUT
```

### Algorithm 6: Demo Mode Toggle

```
FUNCTION toggle_demo_mode(enabled):
    old_scale = virtual_clock.get_time_scale()
    new_scale = config.demo_time_scale IF enabled ELSE 1.0
    virtual_clock.set_time_scale(new_scale)
    
    # Reschedule all active escalation callbacks
    FOR state IN escalation_tracker.get_active_escalations():
        IF state.pending_callback_handle:
            # Cancel old callback
            virtual_clock.cancel(state.pending_callback_handle)
            
            # Calculate remaining time at current level
            elapsed = (virtual_clock.now() - state.level_entered_at).total_seconds()
            timeout = config.level_timeouts[state.current_level]
            remaining_real = timeout - elapsed
            
            IF remaining_real <= 0:
                # Should have already escalated — do it now
                escalate_to_next_level(state.id)
            ELSE:
                # Reschedule with new time scale
                scaled_remaining = remaining_real / new_scale
                handle = virtual_clock.call_later(scaled_remaining, escalate_to_next_level, state.id)
                state.pending_callback_handle = handle
    
    broadcast(demo_mode_changed, enabled)
```

### Algorithm 7: Generate Handoff Summary

```
FUNCTION generate_handoff_summary(patient_ids, from_clinician_id):
    one_hour_ago = virtual_clock.now() - timedelta(hours=1)
    
    active_alerts = []
    pending_escalations = []
    patients_needing_attention = []
    recent_acks = []
    
    FOR patient_id IN patient_ids:
        # Collect active alerts
        patient_alerts = alert_engine.get_patient_alerts(patient_id)
        active = [a for a in patient_alerts if a.status == ACTIVE]
        active_alerts.extend(active)
        
        # Collect pending escalations
        escalation = escalation_tracker.get_active_for_patient(patient_id)
        IF escalation:
            pending_escalations.append(escalation)
            patients_needing_attention.append(patient_id)
        ELIF active:
            patients_needing_attention.append(patient_id)
        
        # Collect recent acknowledgments (last 1 hour)
        acknowledged = [a for a in patient_alerts 
                       if a.status == ACKNOWLEDGED 
                       and a.acknowledgment.acknowledged_at >= one_hour_ago]
        recent_acks.extend(acknowledged)
    
    RETURN HandoffSummary(
        patient_ids=patient_ids,
        active_alerts=active_alerts,
        pending_escalations=pending_escalations,
        patients_requiring_attention=patients_needing_attention,
        recent_acknowledgments=recent_acks,
        generated_at=virtual_clock.now(),
        from_clinician_id=from_clinician_id
    )
```

---

## Timer Scheduling Logic

### Schedule Next Escalation

```
FUNCTION schedule_next_escalation(state):
    IF state.current_level >= state.max_level:
        RETURN  # At max level, no further escalation
    
    timeout = config.level_timeouts[state.current_level]
    # VirtualClock handles time scaling internally
    handle = virtual_clock.call_later(timeout, escalate_to_next_level, state.id)
    state.pending_callback_handle = handle
    escalation_tracker.set_pending_callback(state.id, handle)
```

### Virtual Clock Behavior

```
Real-time mode (scale = 1.0):
  call_later(300, callback) → fires after 300 real seconds

Demo mode (scale = 30.0):
  call_later(300, callback) → fires after 10 real seconds (300/30)
```

---

## Notification Logic

### Notification Payload (Minimal — per Q5 answer)

```
escalation_event = {
    type: "escalated" | "resolved" | "acknowledged" | "notified",
    alert_id: str,          # Primary alert ID
    patient_id: str,
    patient_name: str,
    vital_sign: str,
    severity: str,
    current_value: float,
    level: int,
    clinician_id: str,      # Target clinician
    timestamp: datetime
}
```

**Note**: Full escalation context (who was previously notified, time at each level) is available via the escalation state query endpoint — not included in the push notification payload itself. The AlertCard UI fetches this from state.

