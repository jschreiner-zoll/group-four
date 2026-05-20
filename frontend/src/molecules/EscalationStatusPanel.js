/**
 * EscalationStatusPanel — displays complete escalation status on an alert card.
 * Shows current level, countdown, and notified clinicians.
 */

import React from 'react';
import EscalationBadge from '../atoms/EscalationBadge';
import CountdownTimer from '../atoms/CountdownTimer';

const LEVEL_BORDER_COLORS = {
  1: '#2E7D32',
  2: '#F57F17',
  3: '#E65100',
  4: '#B71C1C',
};

export default function EscalationStatusPanel({ escalation }) {
  if (!escalation) {
    return null;
  }

  // Accept both full escalation state (from API) and partial event data (from WebSocket)
  // If status exists and is not 'active', hide the panel
  if (escalation.status && escalation.status !== 'active') {
    return null;
  }

  const {
    current_level,
    max_level = 4,
    level_entered_at,
    notified_clinicians = [],
  } = escalation;

  // Calculate next escalation time
  // In demo mode (30x), backend schedules at 10s real time per level
  // The level_entered_at is real time, so we calculate based on when the level was entered
  // and add the real-world delay (which the backend already computed with time scaling)
  // Since we poll every 5s, we use a simple heuristic: if level_entered_at is recent, show countdown
  const enteredAt = level_entered_at ? new Date(level_entered_at) : new Date();
  const now = Date.now();
  const elapsedMs = now - enteredAt.getTime();
  
  // Estimate timeout: if elapsed < 15s, likely demo mode (10s per level)
  // if elapsed > 60s, likely real mode (300s per level)
  // Use the actual elapsed to determine remaining
  const estimatedTimeout = elapsedMs < 30000 ? 10000 : 300000; // 10s demo or 300s real
  const remainingMs = Math.max(0, estimatedTimeout - elapsedMs);
  const nextEscalationTime = new Date(now + remainingMs);

  const panelStyle = {
    padding: '8px 12px',
    borderLeft: `3px solid ${LEVEL_BORDER_COLORS[current_level] || '#757575'}`,
    backgroundColor: '#FAFAFA',
    borderRadius: '0 4px 4px 0',
    marginTop: '8px',
    fontSize: '12px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  };

  const notifiedListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: '4px 0 0 0',
  };

  const notifiedItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 0',
    color: '#616161',
    fontSize: '11px',
  };

  return (
    <div style={panelStyle} data-testid="escalation-status-panel">
      <div style={headerStyle}>
        <EscalationBadge level={current_level} maxLevel={max_level} />
        {current_level < max_level && (
          <CountdownTimer targetTime={nextEscalationTime.toISOString()} />
        )}
      </div>

      {notified_clinicians.length > 0 && (
        <div>
          <span style={{ fontSize: '11px', color: '#9E9E9E', fontWeight: '500' }}>
            Notified:
          </span>
          <ul style={notifiedListStyle}>
            {notified_clinicians.map((nc, idx) => {
              const timeAgo = getTimeAgo(nc.notified_at);
              return (
                <li key={idx} style={notifiedItemStyle}>
                  <span>•</span>
                  <span>{nc.clinician_name} (L{nc.level})</span>
                  <span style={{ color: '#BDBDBD' }}>— {timeAgo}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return `${Math.floor(diffMinutes / 60)}h ago`;
}
