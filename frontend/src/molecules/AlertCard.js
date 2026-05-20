/**
 * AlertCard - Displays a single alert with details and acknowledge action.
 * Enhanced with EscalationStatusPanel for care team escalation routing.
 */

import { useState } from 'react';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { acknowledgeAlert } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import EscalationStatusPanel from './EscalationStatusPanel';

export default function AlertCard({ alert, escalation, onFormOpen, onFormClose, isNew = false }) {
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const isAcknowledged = alert.status === 'Acknowledged';
  const severityClass = `alert-card alert-card--${alert.severity.toLowerCase()}${
    isAcknowledged ? ' alert-card--acknowledged' : ''
  }${isNew && alert.severity === 'Critical' ? ' alert-card--new' : ''}`;

  const SeverityIcon = alert.severity === 'Critical' ? AlertOctagon : AlertTriangle;

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    if (note.trim().length === 0) {
      setError(t('noteRequired'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await acknowledgeAlert(alert.id, note.trim());
      setShowForm(false);
      setNote('');
      onFormClose && onFormClose();
    } catch (err) {
      setError(err.message || 'Failed to acknowledge alert');
    } finally {
      setSubmitting(false);
    }
  };

  const timeStr = new Date(alert.created_at).toLocaleTimeString();
  const severityLabel = alert.severity === 'Critical' ? t('critical') : t('warning');

  return (
    <div className={severityClass} data-testid={`alert-card-${alert.id}`}>
      <div className="alert-card__header">
        <SeverityIcon size={16} aria-hidden="true" />
        <span className={`alert-card__severity alert-card__severity--${alert.severity.toLowerCase()}`}>
          {severityLabel}
        </span>
        <span className="alert-card__time">{timeStr}</span>
      </div>

      <div className="alert-card__details">
        <strong>{alert.patient_name}</strong> — {alert.vital_sign.replace(/_/g, ' ')}:{' '}
        {alert.value} ({t('threshold')}: {alert.threshold_value})
        {alert.escalated && <span> [{t('escalated')}]</span>}
      </div>

      {isAcknowledged && alert.acknowledgment && (
        <div className="alert-card__details" style={{ fontStyle: 'italic' }}>
          {t('acknowledged')}: {alert.acknowledgment.note}
        </div>
      )}

      {!isAcknowledged && !showForm && (
        <button
          className="btn btn--sm btn--primary"
          onClick={() => { setShowForm(true); onFormOpen && onFormOpen(); }}
          data-testid={`acknowledge-btn-${alert.id}`}
        >
          {t('acknowledge')}
        </button>
      )}

      {/* Escalation Status Panel — shows when escalation is active */}
      {escalation && <EscalationStatusPanel escalation={escalation} />}

      {!isAcknowledged && showForm && (
        <form className="alert-card__acknowledge-form" onSubmit={handleAcknowledge}>
          <input
            className="alert-card__note-input"
            type="text"
            placeholder={t('enterNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            aria-label={t('enterNote')}
            data-testid={`acknowledge-note-${alert.id}`}
          />
          <button
            className="btn btn--sm btn--primary"
            type="submit"
            disabled={submitting || note.trim().length === 0}
            data-testid={`acknowledge-submit-${alert.id}`}
          >
            {submitting ? '...' : t('submit')}
          </button>
          <button
            className="btn btn--sm"
            type="button"
            onClick={() => { setShowForm(false); setNote(''); setError(''); onFormClose && onFormClose(); }}
          >
            {t('cancel')}
          </button>
          {error && <span style={{ color: 'var(--color-critical)', fontSize: 'var(--font-size-xs)' }}>{error}</span>}
        </form>
      )}
    </div>
  );
}
