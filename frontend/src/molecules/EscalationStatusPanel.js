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
  if (!escalation || escalation.status !== 'active') {
    return null;
  }

  const {
    current_level,
    max_level,
    level_entered_at,
    notified_clinicians = [],
    level_history = [],
  } = escalation;

  // Calculate next escalation time based on level timeout (default 300s)
  const levelTimeout = 300; // seconds — will be from config in production
  const enteredAt = new Date(level_entered_at);
  const nextEscalationTime = new Date(enteredAt.getTime() + levelTimeout * 1000);

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
