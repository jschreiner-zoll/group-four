/**
 * CareTeamAssignmentRow — displays a single patient's care team assignment in the management table.
 */

import React from 'react';

export default function CareTeamAssignmentRow({
  patient,
  careTeam,
  clinicians,
  selected,
  onSelect,
  onReassign,
  hasActiveEscalation,
}) {
  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #E0E0E0',
    backgroundColor: selected ? '#E3F2FD' : '#FFFFFF',
    gap: '12px',
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const patientInfoStyle = {
    flex: '0 0 180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const nameStyle = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212121',
  };

  const roomStyle = {
    fontSize: '12px',
    color: '#757575',
  };

  const levelCellStyle = {
    flex: '1',
    minWidth: '120px',
  };

  const selectStyle = {
    padding: '4px 6px',
    borderRadius: '4px',
    border: '1px solid #BDBDBD',
    fontSize: '12px',
    width: '100%',
    backgroundColor: '#FFFFFF',
  };

  const escalationIndicatorStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#E65100',
    display: 'inline-block',
    marginLeft: '4px',
  };

  const participants = careTeam?.participant || [];

  function getClinicianAtLevel(level) {
    const participant = participants.find((p) => {
      const coding = p.role?.[0]?.coding?.[0];
      if (!coding) return false;
      const levelMap = {
        'primary-nurse': 1,
        'charge-nurse': 2,
        'attending-physician': 3,
        'rapid-response-team': 4,
      };
      return levelMap[coding.code] === level;
    });
    if (!participant) return null;
    const ref = participant.member?.reference || '';
    return ref.split('/').pop();
  }

  function handleLevelChange(level, clinicianId) {
    if (onReassign) {
      onReassign(patient.id, clinicianId, level);
    }
  }

  return (
    <div style={rowStyle} data-testid={`care-team-row-${patient.id}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(patient.id)}
        style={checkboxStyle}
        aria-label={`Select ${patient.name} for bulk operation`}
      />

      <div style={patientInfoStyle}>
        <span style={nameStyle}>
          {patient.name}
          {hasActiveEscalation && (
            <span
              style={escalationIndicatorStyle}
              title="Active escalation"
              aria-label="Active escalation in progress"
            />
          )}
        </span>
        <span style={roomStyle}>{patient.room}</span>
      </div>

      {[1, 2, 3, 4].map((level) => {
        const currentClinicianId = getClinicianAtLevel(level);
        return (
          <div key={level} style={levelCellStyle}>
            <select
              value={currentClinicianId || ''}
              onChange={(e) => handleLevelChange(level, e.target.value)}
              style={selectStyle}
              aria-label={`Level ${level} clinician for ${patient.name}`}
              data-testid={`assignment-level-${level}-${patient.id}`}
            >
              <option value="">— Unassigned —</option>
              {clinicians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name?.[0]?.text || c.id}
                  {!c.active ? ' [Off]' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
