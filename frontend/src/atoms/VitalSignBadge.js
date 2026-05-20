/**
 * VitalSignBadge - Displays a single vital sign value with status color coding.
 */

import React from 'react';

export default function VitalSignBadge({ label, value, unit, status = 'normal', icon: Icon }) {
  const statusClass = `vital-badge vital-badge--${status}`;
  const ariaLabel = `${label}: ${value} ${unit}, status ${status}`;

  return (
    <div className={statusClass} aria-label={ariaLabel} data-testid={`vital-badge-${label.toLowerCase().replace(/\s/g, '-')}`}>
      {Icon && <Icon className="vital-badge__icon" aria-hidden="true" />}
      <span className="vital-badge__value">{value}</span>
      <span className="vital-badge__unit">{unit}</span>
    </div>
  );
}
