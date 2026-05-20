/**
 * PatientTile - Displays a single patient's summary with all current vitals.
 */

import React from 'react';
import { Heart, Activity, Wind, Thermometer, Waves, Droplet } from 'lucide-react';
import VitalSignBadge from '../atoms/VitalSignBadge';
import StatusIndicator from '../atoms/StatusIndicator';
import AlertBadge from '../atoms/AlertBadge';
import SimulationControls from './SimulationControls';
import { useAppState } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const VITAL_CONFIG = [
  { key: 'heart_rate', labelKey: 'hr', unit: 'bpm', icon: Heart },
  { key: 'blood_pressure_systolic', labelKey: 'bpSys', unit: 'mmHg', icon: Activity },
  { key: 'blood_pressure_diastolic', labelKey: 'bpDia', unit: 'mmHg', icon: Activity },
  { key: 'spo2', labelKey: 'spo2', unit: '%', icon: Wind },
  { key: 'temperature', labelKey: 'temp', unit: 'temp', icon: Thermometer },
  { key: 'respiratory_rate', labelKey: 'rr', unit: '/min', icon: Waves },
  { key: 'blood_glucose', labelKey: 'bg', unit: 'mg/dL', icon: Droplet },
];

function getVitalStatus(vitalKey, value) {
  // Simplified status determination based on common thresholds
  const thresholds = {
    heart_rate: { warnHigh: 100, critHigh: 130, warnLow: 60 },
    blood_pressure_systolic: { warnHigh: 140, critHigh: 180, warnLow: 90, critLow: 70 },
    blood_pressure_diastolic: { warnHigh: 90, critHigh: 120, warnLow: 50 },
    spo2: { warnLow: 90, critLow: 85 },
    temperature: { warnHigh: 100.4, critHigh: 103, warnLow: 96, critLow: 95 },
    respiratory_rate: { warnHigh: 24, critHigh: 30, warnLow: 10, critLow: 8 },
    blood_glucose: { warnHigh: 180, critHigh: 250, warnLow: 70, critLow: 54 },
  };

  const t = thresholds[vitalKey];
  if (!t) return 'normal';

  if ((t.critHigh && value >= t.critHigh) || (t.critLow && value <= t.critLow)) {
    return 'critical';
  }
  if ((t.warnHigh && value >= t.warnHigh) || (t.warnLow && value <= t.warnLow)) {
    return 'warning';
  }
  return 'normal';
}

export default function PatientTile({ patient, onSelect }) {
  const { vitals, alerts } = useAppState();
  const { t, convertTemp, tempUnit } = useLanguage();
  const patientVitals = vitals[patient.id] || {};
  const patientAlertCount = alerts.active.filter(
    (a) => a.patient_id === patient.id
  ).length;
  const highestSeverity = alerts.active
    .filter((a) => a.patient_id === patient.id)
    .some((a) => a.severity === 'Critical')
    ? 'critical'
    : 'warning';

  const status = patient.status || 'Normal';
  const tileClass = `patient-tile patient-tile--${status.toLowerCase()}`;

  return (
    <div
      className={tileClass}
      onClick={() => onSelect(patient.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(patient.id)}
      role="button"
      tabIndex={0}
      aria-label={`Patient ${patient.name}, status ${status}`}
      data-testid={`patient-tile-${patient.id}`}
    >
      <div className="patient-tile__header">
        <div>
          <div className="patient-tile__name">{patient.name}</div>
          <div className="patient-tile__room">{patient.room}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusIndicator status={status} size="sm" />
          <AlertBadge count={patientAlertCount} severity={highestSeverity} />
        </div>
      </div>

      <div className="patient-tile__vitals">
        {VITAL_CONFIG.map(({ key, labelKey, unit, icon }) => {
          let displayValue = patientVitals[key] != null ? patientVitals[key] : '--';
          let displayUnit = unit;

          if (key === 'temperature' && patientVitals[key] != null) {
            displayValue = convertTemp(patientVitals[key]);
            displayUnit = tempUnit();
          } else if (unit === 'temp') {
            displayUnit = tempUnit();
          }

          return (
            <VitalSignBadge
              key={key}
              label={t(labelKey)}
              value={displayValue}
              unit={displayUnit}
              icon={icon}
              status={patientVitals[key] != null ? getVitalStatus(key, patientVitals[key]) : 'normal'}
            />
          );
        })}
      </div>

      <div className="patient-tile__actions">
        <SimulationControls
          patientId={patient.id}
          activeConditions={patient.active_conditions || []}
        />
      </div>
    </div>
  );
}
