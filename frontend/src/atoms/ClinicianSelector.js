/**
 * ClinicianSelector — dropdown to select which clinician role the user is "acting as".
 * Filters notifications based on selected clinician.
 * Shows a role badge next to the dropdown for visual confirmation.
 */

import React from 'react';

const ROLE_COLORS = {
  'Primary Nurse': '#2E7D32',
  'Charge Nurse': '#F57F17',
  'Attending Physician': '#E65100',
  'RRT Member': '#B71C1C',
};

export default function ClinicianSelector({ clinicians, selectedId, onSelect }) {
  const selectedClinician = clinicians.find((c) => c.id === selectedId);
  const roleName = selectedClinician?.qualification?.[0]?.code?.text || '';
  const roleColor = ROLE_COLORS[roleName] || '#757575';

  const selectorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const labelStyle = {
    fontSize: '13px',
    color: '#616161',
    fontWeight: '500',
  };

  const selectStyle = {
    padding: '6px 10px',
    borderRadius: '4px',
    border: `2px solid ${roleColor}`,
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontWeight: '500',
  };

  const roleBadgeStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: roleColor,
    padding: '2px 8px',
    borderRadius: '10px',
  };

  if (!clinicians || clinicians.length === 0) {
    return (
      <div style={selectorStyle} data-testid="clinician-selector">
        <span style={labelStyle}>Loading clinicians...</span>
      </div>
    );
  }

  return (
    <div style={selectorStyle} data-testid="clinician-selector">
      <label htmlFor="clinician-select" style={labelStyle}>
        Acting as:
      </label>
      <select
        id="clinician-select"
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        style={selectStyle}
        aria-label="Select clinician role"
      >
        {clinicians.map((clinician) => (
          <option key={clinician.id} value={clinician.id}>
            {clinician.name?.[0]?.text || clinician.id}
            {' '}
            ({clinician.qualification?.[0]?.code?.text || 'Unknown'})
            {!clinician.active ? ' [Off-duty]' : ''}
          </option>
        ))}
      </select>
      {roleName && <span style={roleBadgeStyle}>{roleName}</span>}
    </div>
  );
}
