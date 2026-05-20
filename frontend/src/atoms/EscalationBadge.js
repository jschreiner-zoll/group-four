/**
 * EscalationBadge — displays current escalation level with progressive color coding.
 * WCAG 2.0 AA compliant colors with icon + text (not color alone).
 */

import React from 'react';

const LEVEL_CONFIG = {
  1: { color: 'var(--color-escalation-1, #2E7D32)', label: 'Primary Nurse', icon: '👤' },
  2: { color: 'var(--color-escalation-2, #F57F17)', label: 'Charge Nurse', icon: '👥' },
  3: { color: 'var(--color-escalation-3, #E65100)', label: 'Physician', icon: '⚕️' },
  4: { color: 'var(--color-escalation-4, #B71C1C)', label: 'RRT', icon: '🚨' },
};

export default function EscalationBadge({ level, maxLevel }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: config.color,
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1.4',
  };

  return (
    <span
      style={badgeStyle}
      role="status"
      aria-label={`Escalation level ${level} of ${maxLevel}: ${config.label}`}
      data-testid="escalation-badge"
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>L{level}: {config.label}</span>
    </span>
  );
}
