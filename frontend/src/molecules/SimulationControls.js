/**
 * SimulationControls - Buttons to trigger medical condition simulations.
 * Enhanced with demo mode toggle for escalation timer compression.
 */

import React, { useState } from 'react';
import { simulateCondition, resetPatient } from '../services/api';
import { toggleDemoMode } from '../services/escalationApi';
import { useLanguage } from '../context/LanguageContext';

const CONDITIONS = [
  { id: 'tachycardia', labelKey: 'tachycardia' },
  { id: 'bradycardia', labelKey: 'bradycardia' },
  { id: 'hypoxia', labelKey: 'hypoxia' },
  { id: 'hyperthermia', labelKey: 'hyperthermia' },
  { id: 'hypotension', labelKey: 'hypotension' },
  { id: 'hyperglycemia', labelKey: 'hyperglycemia' },
];

export default function SimulationControls({ patientId, activeConditions = [], demoMode: demoModeProp, onDemoToggle }) {
  const [loading, setLoading] = useState(null);
  const [localDemoMode, setLocalDemoMode] = useState(false);
  const { t } = useLanguage();

  // Use prop if provided, otherwise use local state
  const demoMode = demoModeProp !== undefined ? demoModeProp : localDemoMode;

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

  const handleDemoToggle = async (e) => {
    e.stopPropagation();
    const newMode = !demoMode;
    try {
      await toggleDemoMode(newMode);
      setLocalDemoMode(newMode);
      if (onDemoToggle) onDemoToggle(newMode);
    } catch (err) {
      console.error('Failed to toggle demo mode:', err);
    }
  };

  const demoToggleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    padding: '8px 0 4px 0',
    borderTop: '1px solid #E0E0E0',
    width: '100%',
  };

  const demoLabelStyle = {
    fontSize: '11px',
    color: demoMode ? '#E65100' : '#757575',
    fontWeight: demoMode ? '600' : '400',
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

      {/* Demo Mode Toggle */}
      <div style={demoToggleStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={demoMode}
            onChange={handleDemoToggle}
            data-testid="demo-mode-toggle"
            aria-label="Toggle demo mode (30x escalation speed)"
          />
          <span style={demoLabelStyle}>
            {demoMode ? '⚡ Demo Mode (30x)' : 'Demo Mode'}
          </span>
        </label>
      </div>
    </div>
  );
}
