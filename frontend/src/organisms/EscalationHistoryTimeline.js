/**
 * EscalationHistoryTimeline — displays complete escalation audit trail for an alert.
 */

import React, { useEffect, useState } from 'react';
import { getEscalationTimeline } from '../services/escalationApi';

const EVENT_ICONS = {
  started: '🚀',
  notified: '🔔',
  escalated: '⬆️',
  skipped: '⏭️',
  acknowledged: '✅',
  resolved: '✓',
  alert_joined: '➕',
  restarted: '🔄',
};

const EVENT_COLORS = {
  started: '#1565C0',
  notified: '#1565C0',
  escalated: '#E65100',
  skipped: '#9E9E9E',
  acknowledged: '#2E7D32',
  resolved: '#2E7D32',
  alert_joined: '#7B1FA2',
  restarted: '#F57F17',
};

export default function EscalationHistoryTimeline({ alertId, escalations }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true);
      try {
        if (alertId) {
          // Fetch timeline for a specific alert
          const events = await getEscalationTimeline(alertId);
          setTimeline(events);
        } else {
          // Fetch all active escalations and get their timelines
          const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
          const res = await fetch(`${API_BASE}/api/escalation/active`);
          if (res.ok) {
            const activeEscalations = await res.json();
            // Fetch timeline for each active escalation's first alert
            const allEvents = [];
            for (const esc of activeEscalations) {
              if (esc.alert_ids && esc.alert_ids.length > 0) {
                try {
                  const events = await getEscalationTimeline(esc.alert_ids[0]);
                  allEvents.push(...events);
                } catch (e) {
                  // Skip failed fetches
                }
              }
            }
            // Sort by timestamp descending
            allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTimeline(allEvents);
          }
        }
      } catch (error) {
        console.error('Failed to load timeline:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTimeline();
  }, [alertId]);

  // Use fetched timeline data
  const displayEvents = timeline;

  if (loading) {
    return <div style={{ padding: '20px', color: '#9E9E9E' }}>Loading timeline...</div>;
  }

  if (displayEvents.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#9E9E9E', textAlign: 'center' }}>
        No escalation history available.
      </div>
    );
  }

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212121',
    marginBottom: '16px',
  };

  const timelineStyle = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingLeft: '24px',
  };

  const lineStyle = {
    position: 'absolute',
    left: '11px',
    top: '0',
    bottom: '0',
    width: '2px',
    backgroundColor: '#E0E0E0',
  };

  const eventStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
    position: 'relative',
  };

  const dotStyle = (color) => ({
    position: 'absolute',
    left: '-19px',
    top: '4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: color,
    border: '2px solid #FFFFFF',
    boxShadow: '0 0 0 2px ' + color,
    zIndex: 1,
  });

  const eventContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const eventLabelStyle = (color) => ({
    fontSize: '12px',
    fontWeight: '600',
    color: color,
  });

  const eventDetailStyle = {
    fontSize: '11px',
    color: '#616161',
  };

  const eventTimeStyle = {
    fontSize: '10px',
    color: '#9E9E9E',
  };

  // Calculate total duration
  const firstEvent = displayEvents[0];
  const lastEvent = displayEvents[displayEvents.length - 1];
  const totalDuration = firstEvent && lastEvent
    ? Math.floor((new Date(lastEvent.timestamp) - new Date(firstEvent.timestamp)) / 1000)
    : 0;

  return (
    <div style={containerStyle} data-testid="escalation-history-timeline">
      <div style={titleStyle}>Escalation Timeline</div>

      <div style={timelineStyle}>
        <div style={lineStyle} />

        {displayEvents.map((event, idx) => {
          const eventType = event.event_type || 'notified';
          const color = EVENT_COLORS[eventType] || '#757575';
          const icon = EVENT_ICONS[eventType] || '•';

          return (
            <div key={event.id || idx} style={eventStyle}>
              <div style={dotStyle(color)} />
              <div style={eventContentStyle}>
                <span style={eventLabelStyle(color)}>
                  {icon} {formatEventType(eventType)} — Level {event.level}
                </span>
                {event.clinician_name && (
                  <span style={eventDetailStyle}>{event.clinician_name}</span>
                )}
                <span style={eventTimeStyle}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalDuration > 0 && (
        <div style={{ fontSize: '11px', color: '#757575', marginTop: '8px', paddingLeft: '24px' }}>
          Total duration: {formatDuration(totalDuration)}
        </div>
      )}
    </div>
  );
}

function formatEventType(type) {
  const labels = {
    started: 'Escalation Started',
    notified: 'Clinician Notified',
    escalated: 'Escalated',
    skipped: 'Level Skipped (Off-duty)',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    alert_joined: 'Alert Joined Group',
    restarted: 'Restarted (Handoff)',
  };
  return labels[type] || type;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
