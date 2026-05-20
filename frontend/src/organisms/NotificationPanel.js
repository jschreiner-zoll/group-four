/**
 * NotificationPanel — displays notification feed for the selected clinician.
 */

import React, { useState } from 'react';
import { useEscalation, useEscalationDispatch, ESCALATION_ACTIONS } from '../context/EscalationContext';
import NotificationToast from '../molecules/NotificationToast';

export default function NotificationPanel() {
  const { notifications, selectedClinician } = useEscalation();
  const dispatch = useEscalationDispatch();
  const [isOpen, setIsOpen] = useState(false);

  // Filter notifications for selected clinician
  const filteredNotifications = notifications.filter(
    (n) => n.clinician_id === selectedClinician
  );

  const unreadCount = filteredNotifications.length;

  function handleDismiss(notificationId) {
    // Remove from list (simplified — in production would mark as read)
  }

  function handleClearAll() {
    dispatch({ type: ESCALATION_ACTIONS.CLEAR_NOTIFICATIONS });
  }

  const triggerStyle = {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  };

  const badgeCountStyle = {
    position: 'absolute',
    top: '-2px',
    right: '0',
    backgroundColor: '#B71C1C',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '8px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center',
  };

  const panelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '340px',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease',
  };

  const panelHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #E0E0E0',
  };

  const panelTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212121',
  };

  const clearBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: '#1565C0',
    cursor: 'pointer',
  };

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#757575',
  };

  const listStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
  };

  const emptyStyle = {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: '13px',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={triggerStyle}
        aria-label={`Notifications (${unreadCount} unread)`}
        data-testid="notification-panel-trigger"
      >
        🔔
        {unreadCount > 0 && (
          <span style={badgeCountStyle}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <div style={panelStyle} role="complementary" aria-label="Notifications panel">
        <div style={panelHeaderStyle}>
          <span style={panelTitleStyle}>Notifications</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {filteredNotifications.length > 0 && (
              <button onClick={handleClearAll} style={clearBtnStyle} data-testid="clear-notifications">
                Clear All
              </button>
            )}
            <button onClick={() => setIsOpen(false)} style={closeBtnStyle} aria-label="Close notifications">
              ✕
            </button>
          </div>
        </div>

        <div style={listStyle}>
          {filteredNotifications.length === 0 ? (
            <div style={emptyStyle}>No notifications</div>
          ) : (
            filteredNotifications.map((notification, idx) => (
              <NotificationToast
                key={notification.id || idx}
                notification={notification}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      </div>

      {/* Overlay when panel is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: '340px',
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 999,
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
