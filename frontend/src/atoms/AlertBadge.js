/**
 * AlertBadge - Displays alert count with severity-based coloring.
 */

import React from 'react';

export default function AlertBadge({ count, severity = 'warning' }) {
  if (count === 0) return null;

  const className = `alert-badge alert-badge--${severity.toLowerCase()}`;

  return (
    <span
      className={className}
      aria-label={`${count} ${severity} alert${count > 1 ? 's' : ''}`}
      data-testid="alert-badge"
    >
      {count}
    </span>
  );
}
