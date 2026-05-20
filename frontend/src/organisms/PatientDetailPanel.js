/**
 * PatientDetailPanel - Slide-out panel with expanded patient view.
 */

import React from 'react';
import { X, Heart, Activity, Wind, Thermometer, Waves, Droplet } from 'lucide-react';
import StatusIndicator from '../atoms/StatusIndicator';
import SimulationControls from '../molecules/SimulationControls';
import AlertCard from '../molecules/AlertCard';
import EcgViewer from '../molecules/EcgViewer';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { ACTIONS } from '../context/appReducer';
import { useLanguage } from '../context/LanguageContext';

const VITAL_DISPLAY = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Heart },
  { key: 'blood_pressure_systolic', label: 'Systolic BP', unit: 'mmHg', icon: Activity },
  { key: 'blood_pressure_diastolic', label: 'Diastolic BP', unit: 'mmHg', icon: Activity },
  { key: 'spo2', label: 'SpO2', unit: '%', icon: Wind },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: Thermometer },
  { key: 'respiratory_rate', label: 'Respiratory Rate', unit: '/min', icon: Waves },
  { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', icon: Droplet },
];

export default function PatientDetailPanel() {
  const { selectedPatientId, patients, vitals, alerts } = useAppState();
  const dispatch = useAppDispatch();
  const { t, convertTemp, tempUnit } = useLanguage();

  if (!selectedPatientId) return null;

  const patient = patients[selectedPatientId];
  if (!patient) return null;

  const patientVitals = vitals[selectedPatientId] || {};
  const patientAlerts = alerts.active.filter(
    (a) => a.patient_id === selectedPatientId
  );

  const handleClose = () => {
    dispatch({ type: ACTIONS.SELECT_PATIENT, payload: null });
  };

  const panelClass = `detail-panel ${selectedPatientId ? 'detail-panel--open' : ''}`;

  return (
    <div className={panelClass} role="dialog" aria-label={`Patient details: ${patient.name}`} data-testid="patient-detail-panel">
      <div className="detail-panel__header">
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '4px' }}>
            {patient.name}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {t('age')}: {patient.age} | {patient.room}
          </p>
        </div>
        <button
          className="detail-panel__close"
          onClick={handleClose}
          aria-label="Close patient detail"
          data-testid="detail-panel-close"
        >
          <X size={24} />
        </button>
      </div>

      <StatusIndicator status={patient.status || 'Normal'} size="lg" />

      <h3 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
        {t('currentVitals')}
      </h3>
      <div className="detail-panel__vitals">
        {VITAL_DISPLAY.map(({ key, label, unit, icon: Icon }) => {
          let displayValue = patientVitals[key] != null ? patientVitals[key] : '--';
          let displayUnit = unit;

          if (key === 'temperature' && patientVitals[key] != null) {
            displayValue = convertTemp(patientVitals[key]);
            displayUnit = tempUnit();
          }

          return (
            <div key={key} className="detail-panel__vital-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </div>
              <strong>
                {displayValue} {displayUnit}
              </strong>
            </div>
          );
        })}
      </div>

      <EcgViewer waveformData={patientVitals.ecg_waveform} />

      {patientAlerts.length > 0 && (
        <>
          <h3 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
            {t('activeAlerts')} ({patientAlerts.length})
          </h3>
          {patientAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </>
      )}

      <h3 style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
        {t('simulationControls')}
      </h3>
      <SimulationControls
        patientId={selectedPatientId}
        activeConditions={patient.active_conditions || []}
      />
    </div>
  );
}
