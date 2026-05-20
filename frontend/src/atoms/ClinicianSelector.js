/**
 * ClinicianSelector — dropdown to select which clinician role the user is "acting as".
 * Filters notifications based on selected clinician.
 */

import React from 'react';

export default function ClinicianSelector({ clinicians, selectedId, onSelect }) {
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
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #BDBDBD',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  };

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
    </div>
  );
}
