/**
 * ClinicianRoster — displays and manages the clinician roster with duty status.
 */

import React from 'react';
import { useEscalation, useEscalationDispatch, ESCALATION_ACTIONS } from '../context/EscalationContext';
import { updateDutyStatus } from '../services/escalationApi';

export default function ClinicianRoster() {
  const { clinicians, careTeams } = useEscalation();
  const dispatch = useEscalationDispatch();

  async function handleDutyToggle(clinicianId, currentStatus) {
    try {
      await updateDutyStatus(clinicianId, !currentStatus);
      dispatch({
        type: ESCALATION_ACTIONS.UPDATE_CLINICIAN_STATUS,
        payload: { clinicianId, active: !currentStatus },
      });
    } catch (error) {
      console.error('Failed to update duty status:', error);
    }
  }

  function getPatientCount(clinicianId) {
    let count = 0;
    Object.values(careTeams).forEach((ct) => {
      const participants = ct.participant || [];
      const isAssigned = participants.some((p) => {
        const ref = p.member?.reference || '';
        return ref.includes(clinicianId);
      });
      if (isAssigned) count++;
    });
    return count;
  }

  const rosterStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
  };

  const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212121',
    marginBottom: '8px',
  };

  const clinicianCardStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: active ? '#FFFFFF' : '#F5F5F5',
    border: `1px solid ${active ? '#E0E0E0' : '#BDBDBD'}`,
    opacity: active ? 1 : 0.7,
  });

  const infoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const nameStyle = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#212121',
  };

  const roleStyle = {
    fontSize: '11px',
    color: '#757575',
  };

  const rightSideStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const patientCountStyle = {
    fontSize: '11px',
    color: '#9E9E9E',
  };

  const toggleStyle = (active) => ({
    position: 'relative',
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: active ? '#4CAF50' : '#BDBDBD',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    transition: 'background-color 0.2s',
  });

  const toggleKnobStyle = (active) => ({
    position: 'absolute',
    top: '2px',
    left: active ? '18px' : '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    transition: 'left 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  });

  // Sort by level (based on role code)
  const sorted = [...clinicians].sort((a, b) => {
    const levelA = getLevelFromClinician(a);
    const levelB = getLevelFromClinician(b);
    return levelA - levelB;
  });

  return (
    <div style={rosterStyle} data-testid="clinician-roster">
      <div style={titleStyle}>Clinician Roster</div>

      {sorted.map((clinician) => {
        const patientCount = getPatientCount(clinician.id);
        return (
          <div key={clinician.id} style={clinicianCardStyle(clinician.active)}>
            <div style={infoStyle}>
              <span style={nameStyle}>{clinician.name?.[0]?.text || clinician.id}</span>
              <span style={roleStyle}>{clinician.qualification?.[0]?.code?.text || 'Unknown'}</span>
            </div>
            <div style={rightSideStyle}>
              <span style={patientCountStyle}>{patientCount} patients</span>
              <button
                onClick={() => handleDutyToggle(clinician.id, clinician.active)}
                style={toggleStyle(clinician.active)}
                aria-label={`${clinician.active ? 'Set off-duty' : 'Set on-duty'}: ${clinician.name?.[0]?.text}`}
                data-testid={`duty-toggle-${clinician.id}`}
              >
                <div style={toggleKnobStyle(clinician.active)} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getLevelFromClinician(clinician) {
  const code = clinician.qualification?.[0]?.code?.coding?.[0]?.code || '';
  const map = { 'primary-nurse': 1, 'charge-nurse': 2, 'attending-physician': 3, 'rapid-response-team': 4 };
  return map[code] || 99;
}
