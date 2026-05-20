/**
 * AlertSidebar - Sidebar panel showing active alerts with management controls.
 */

import React from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import AlertCard from '../molecules/AlertCard';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { ACTIONS } from '../context/appReducer';
import audioAlertManager from '../services/audioAlertManager';
import { useLanguage } from '../context/LanguageContext';
import { useEscalation } from '../context/EscalationContext';

export default function AlertSidebar() {
  const { alerts, audioMuted } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const [isTyping, setIsTyping] = React.useState(false);
  const [frozenAlerts, setFrozenAlerts] = React.useState(null);
  const [newAlertIds, setNewAlertIds] = React.useState(new Set());
  const prevAlertIdsRef = React.useRef(new Set());

  // Get escalation state for alerts
  const escalationState = useEscalation();
  const escalations = escalationState?.escalations || {};

  // Track newly added alerts
  React.useEffect(() => {
    const currentIds = new Set(alerts.active.map((a) => a.id));
    const added = [];
    currentIds.forEach((id) => {
      if (!prevAlertIdsRef.current.has(id)) {
        added.push(id);
      }
    });
    if (added.length > 0) {
      setNewAlertIds((prev) => {
        const next = new Set(prev);
        added.forEach((id) => next.add(id));
        return next;
      });
      const timer = setTimeout(() => {
        setNewAlertIds((prev) => {
          const next = new Set(prev);
          added.forEach((id) => next.delete(id));
          return next;
        });
      }, 700);
      return () => clearTimeout(timer);
    }
    prevAlertIdsRef.current = currentIds;
  }, [alerts.active.length]);

  const handleToggleMute = () => {
    audioAlertManager.toggleMute();
    dispatch({ type: ACTIONS.TOGGLE_MUTE });
  };

  const displayAlerts = isTyping && frozenAlerts ? frozenAlerts : alerts.active;

  const handleFormOpen = () => {
    setIsTyping(true);
    setFrozenAlerts([...alerts.active]);
  };

  const handleFormClose = () => {
    setIsTyping(false);
    setFrozenAlerts(null);
  };

  // Group active alerts by patient
  const groupedAlerts = {};
  displayAlerts.forEach((alert) => {
    if (!groupedAlerts[alert.patient_id]) {
      groupedAlerts[alert.patient_id] = {
        patientName: alert.patient_name,
        alerts: [],
      };
    }
    groupedAlerts[alert.patient_id].alerts.push(alert);
  });

  const totalActive = alerts.active.length;

  return (
    <aside className="alert-sidebar" aria-label={t('alerts')} data-testid="alert-sidebar">
      <div className="alert-sidebar__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} aria-hidden="true" />
          <span className="alert-sidebar__title">
            {t('alerts')} ({totalActive})
          </span>
        </div>
        <button
          className="mute-toggle"
          onClick={handleToggleMute}
          aria-label={audioMuted ? t('unmuteAlerts') : t('muteAlerts')}
          data-testid="mute-toggle"
        >
          {audioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="alert-sidebar__list">
        {totalActive === 0 && (
          <p style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {t('noActiveAlerts')}
          </p>
        )}

        {Object.entries(groupedAlerts).map(([patientId, group]) => (
          <div key={patientId}>
            <div className="alert-sidebar__group-header">
              {group.patientName}
            </div>
            {group.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} escalation={escalations[alert.id]} isNew={newAlertIds.has(alert.id)} onFormOpen={handleFormOpen} onFormClose={handleFormClose} />
            ))}
          </div>
        ))}

        {alerts.acknowledged.length > 0 && (
          <>
            <div className="alert-sidebar__group-header" style={{ marginTop: '1rem', opacity: 0.7 }}>
              {t('acknowledged')} ({alerts.acknowledged.length})
            </div>
            {alerts.acknowledged.slice(0, 10).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
