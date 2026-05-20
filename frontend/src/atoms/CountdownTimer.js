/**
 * CountdownTimer — displays countdown to next escalation level.
 * Updates every second. Accessible via aria-live region.
 */

import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ targetTime, onExpired }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    function calculateRemaining() {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      return Math.max(0, Math.floor((target - now) / 1000));
    }

    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const r = calculateRemaining();
      setRemaining(r);
      if (r <= 0 && onExpired) {
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = remaining > 0
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : 'Escalating...';

  const timerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: remaining <= 30 ? '#E65100' : '#424242',
    fontFamily: 'monospace',
  };

  return (
    <span
      style={timerStyle}
      role="timer"
      aria-live="polite"
      aria-label={
        remaining > 0
          ? `Time until next escalation: ${minutes} minutes ${seconds} seconds`
          : 'Escalating to next level'
      }
      data-testid="countdown-timer"
    >
      <span aria-hidden="true">⏱</span>
      <span>{display}</span>
    </span>
  );
}
