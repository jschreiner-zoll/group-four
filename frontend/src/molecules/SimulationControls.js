/**
 * SimulationControls - Buttons to trigger medical condition simulations.
 */

import React, { useState } from 'react';
import { simulateCondition, resetPatient } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const CONDITIONS = [
  { id: 'tachycardia', labelKey: 'tachycardia' },
  { id: 'bradycardia', labelKey: 'bradycardia' },
  { id: 'hypoxia', labelKey: 'hypoxia' },
  { id: 'hyperthermia', labelKey: 'hyperthermia' },
  { id: 'hypotension', labelKey: 'hypotension' },
  { id: 'hyperglycemia', labelKey: 'hyperglycemia' },
];

export default function SimulationControls({ patientId, activeConditions = [] }) {
  const [loading, setLoading] = useState(null);
  const { t } = useLanguage();

  const handleSimulate = async (e, condition) => {
    e.stopPropagation();
    setLoading(condition);
    try {
      await simulateCondition(patientId, condition);
    } catch (err) {
      console.error('Failed to simulate condition:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async (e) => {
    e.stopPropagation();
    setLoading('reset');
    try {
      await resetPatient(patientId);
    } catch (err) {
      console.error('Failed to reset patient:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="simulation-controls" onClick={(e) => e.stopPropagation()}>
      {CONDITIONS.map(({ id, labelKey }) => (
        <button
          key={id}
          className="btn btn--sm"
          onClick={(e) => handleSimulate(e, id)}
          disabled={activeConditions.includes(id) || loading === id}
          aria-label={t(labelKey)}
          data-testid={`simulate-${id}-${patientId}`}
        >
          {loading === id ? '...' : t(labelKey)}
        </button>
      ))}
      <button
        className="btn btn--sm btn--danger"
        onClick={handleReset}
        disabled={activeConditions.length === 0 || loading === 'reset'}
        aria-label={t('returnToNormal')}
        data-testid={`reset-${patientId}`}
      >
        {loading === 'reset' ? '...' : t('returnToNormal')}
      </button>
    </div>
  );
}
