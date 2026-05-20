/**
 * ShiftHandoffCard — displays shift handoff summary after bulk reassignment.
 */

import React from 'react';

export default function ShiftHandoffCard({ summary, onDismiss }) {
  if (!summary) return null;

  const cardStyle = {
    padding: '16px',
    backgroundColor: '#E8F5E9',
    border: '1px solid #A5D6A7',
    borderRadius: '8px',
    position: 'relative',
    marginBottom: '16px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1B5E20',
  };

  const dismissStyle = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#757575',
    padding: '4px',
  };

  const sectionStyle = {
    marginBottom: '8px',
  };

  const sectionTitleStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#424242',
    marginBottom: '4px',
  };

  const badgeStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: color,
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '500',
    marginLeft: '6px',
  });

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '12px',
    color: '#616161',
  };

  return (
    <div style={cardStyle} data-testid="shift-handoff-card">
      <div style={headerStyle}>
        <span style={titleStyle}>
          📋 Shift Handoff Summary
        </span>
        <button
          onClick={onDismiss}
          style={dismissStyle}
          aria-label="Dismiss handoff summary"
          data-testid="handoff-dismiss"
        >
          ✕
        </button>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>
          Active Alerts
          <span style={badgeStyle('#E65100')}>{summary.active_alerts?.length || 0}</span>
        </span>
        {summary.active_alerts?.length > 0 && (
          <ul style={listStyle}>
            {summary.active_alerts.slice(0, 5).map((alert, idx) => (
              <li key={idx}>• {alert.patient_name || 'Patient'} — {alert.vital_sign} ({alert.severity})</li>
            ))}
          </ul>
        )}
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>
          Pending Escalations
          <span style={badgeStyle('#F57F17')}>{summary.pending_escalations?.length || 0}</span>
        </span>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>
          Patients Requiring Attention
          <span style={badgeStyle('#B71C1C')}>{summary.patients_requiring_attention?.length || 0}</span>
        </span>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>
          Recent Acknowledgments (last 1hr)
          <span style={badgeStyle('#2E7D32')}>{summary.recent_acknowledgments?.length || 0}</span>
        </span>
      </div>

      <div style={{ fontSize: '11px', color: '#9E9E9E', marginTop: '8px' }}>
        Generated: {new Date(summary.generated_at).toLocaleTimeString()}
      </div>
    </div>
  );
}
