/**
 * PatientGrid - Responsive grid of PatientTile molecules.
 */

import React from 'react';
import PatientTile from '../molecules/PatientTile';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { ACTIONS } from '../context/appReducer';
import { useLanguage } from '../context/LanguageContext';

export default function PatientGrid() {
  const { patients } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();

  const patientList = Object.values(patients).filter(Boolean);

  const handleSelectPatient = (patientId) => {
    dispatch({ type: ACTIONS.SELECT_PATIENT, payload: patientId });
  };

  if (patientList.length === 0) {
    return (
      <div className="patient-grid" data-testid="patient-grid">
        <p style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
          {t('waitingForData')}
        </p>
      </div>
    );
  }

  return (
    <div className="patient-grid" data-testid="patient-grid">
      {patientList.map((patient) => (
        <PatientTile
          key={patient.id}
          patient={patient}
          onSelect={handleSelectPatient}
        />
      ))}
    </div>
  );
}
