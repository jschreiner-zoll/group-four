/**
 * NotificationToast — displays escalation notification to the selected clinician.
 */

import React, { useEffect } from 'react';

const EVENT_CONFIG = {
  notified: { color: '#1565C0', icon: '🔔', label: 'Alert Escalated to You' },
  escalated: { color: '#E65100', icon: '⬆️', label: 'Escalation Level Up' },
  resolved: { color: '#2E7D32', icon: '✓', label: 'Alert Resolved' },
  acknowledged: { color: '#2E7D32', icon: '✓', label: 'Alert Acknowledged' },
};

const LEVEL_NAMES = {
  1: 'Primary Nurse',
  2: 'Charge Nurse',
  3: 'Attending Physician',
  4: 'Rapid Response Team',
};

export default function NotificationToast({ notification, onDismiss }) {
  const eventType = notification?.type || 'notified';
  const config = EVENT_CONFIG[eventType] || EVENT_CONFIG.notified;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss(notification.id || notification.alert_id);
    }, 10000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const toastStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#FFFFFF',
    borderLeft: `4px solid ${config.color}`,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    marginBottom: '8px',
    maxWidth: '320px',
    animation: 'slideIn 0.3s ease-out',
  };

  const iconStyle = {
    fontSize: '16px',
    flexShrink: 0,
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: config.color,
  };

  const detailStyle = {
    fontSize: '12px',
    color: '#616161',
  };

  const dismissBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#9E9E9E',
    padding: '0',
    lineHeight: '1',
  };

  return (
    <div
      style={toastStyle}
      role="alert"
      aria-live="assertive"
      data-testid="notification-toast"
    >
      <span style={iconStyle} aria-hidden="true">{config.icon}</span>
      <div style={contentStyle}>
        <span style={labelStyle}>{config.label}</span>
        <span style={detailStyle}>
          <strong>{notification.patient_name || 'Patient'}</strong> — {notification.vital_sign?.replace(/_/g, ' ') || 'Alert'}
          {notification.severity && ` (${notification.severity})`}
        </span>
        {notification.level && (
          <span style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '2px' }}>
            Level {notification.level}: {LEVEL_NAMES[notification.level] || `Level ${notification.level}`}
            {notification.current_value && ` • Value: ${notification.current_value}`}
          </span>
        )}
        {eventType === 'notified' && (
          <span style={{ fontSize: '11px', color: config.color, marginTop: '2px', fontStyle: 'italic' }}>
            Action required — please review and acknowledge
          </span>
        )}
        {eventType === 'resolved' && (
          <span style={{ fontSize: '11px', color: config.color, marginTop: '2px', fontStyle: 'italic' }}>
            No action needed — another clinician responded
          </span>
        )}
      </div>
      <button
        onClick={() => onDismiss && onDismiss(notification.id || notification.alert_id)}
        style={dismissBtnStyle}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
