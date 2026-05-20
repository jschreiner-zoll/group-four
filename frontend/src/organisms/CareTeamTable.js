/**
 * CareTeamTable — full care team assignment table with management controls.
 */

import React, { useState } from 'react';
import { useEscalation, useEscalationDispatch, ESCALATION_ACTIONS } from '../context/EscalationContext';
import CareTeamAssignmentRow from '../molecules/CareTeamAssignmentRow';
import ShiftHandoffCard from '../molecules/ShiftHandoffCard';
import { bulkHandoff, updateAssignment } from '../services/escalationApi';

export default function CareTeamTable({ patients }) {
  const { careTeams, clinicians, escalations, handoffSummary } = useEscalation();
  const dispatch = useEscalationDispatch();
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [handoffTarget, setHandoffTarget] = useState('');
  const [showHandoffModal, setShowHandoffModal] = useState(false);

  function toggleSelect(patientId) {
    setSelectedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) next.delete(patientId);
      else next.add(patientId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(patients.map((p) => p.id)));
    }
  }

  async function handleReassign(patientId, clinicianId, level) {
    try {
      const updated = await updateAssignment(patientId, clinicianId, level);
      dispatch({
        type: ESCALATION_ACTIONS.UPDATE_CARE_TEAM,
        payload: { patientId, careTeam: updated },
      });
    } catch (error) {
      console.error('Reassignment failed:', error);
    }
  }

  async function handleBulkHandoff() {
    if (selectedPatients.size === 0 || !handoffTarget) return;
    try {
      await bulkHandoff(Array.from(selectedPatients), handoffTarget, 1);

      // Re-fetch updated care team assignments to refresh dropdowns
      const { fetchAssignments } = await import('../services/escalationApi');
      const assignments = await fetchAssignments();
      const careTeamMap = {};
      assignments.forEach((ct) => {
        const patientId = ct.subject?.reference?.split('/').pop() || '';
        if (patientId) {
          careTeamMap[patientId] = ct;
        }
      });
      dispatch({ type: ESCALATION_ACTIONS.SET_CARE_TEAMS, payload: careTeamMap });

      setSelectedPatients(new Set());
      setShowHandoffModal(false);
    } catch (error) {
      console.error('Bulk handoff failed:', error);
    }
  }

  function hasActiveEscalation(patientId) {
    return Object.values(escalations).some(
      (e) => e.patient_id === patientId && e.status === 'active'
    );
  }

  const tableStyle = {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F5F5F5',
    borderBottom: '2px solid #E0E0E0',
    gap: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
  };

  const actionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #E0E0E0',
  };

  const buttonStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: selectedPatients.size > 0 ? '#1565C0' : '#BDBDBD',
    color: '#FFFFFF',
  };

  return (
    <div data-testid="care-team-table">
      {handoffSummary && (
        <ShiftHandoffCard
          summary={handoffSummary}
          onDismiss={() => dispatch({ type: ESCALATION_ACTIONS.SET_HANDOFF_SUMMARY, payload: null })}
        />
      )}

      <div style={actionsStyle}>
        <button
          onClick={() => setShowHandoffModal(true)}
          disabled={selectedPatients.size === 0}
          style={buttonStyle}
          data-testid="bulk-handoff-button"
        >
          Bulk Handoff ({selectedPatients.size} selected)
        </button>
        {showHandoffModal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={handoffTarget}
              onChange={(e) => setHandoffTarget(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #BDBDBD' }}
              data-testid="handoff-target-select"
            >
              <option value="">Select clinician...</option>
              {clinicians.filter((c) => c.active).map((c) => (
                <option key={c.id} value={c.id}>{c.name?.[0]?.text}</option>
              ))}
            </select>
            <button
              onClick={handleBulkHandoff}
              disabled={!handoffTarget}
              style={{ ...buttonStyle, backgroundColor: handoffTarget ? '#2E7D32' : '#BDBDBD' }}
              data-testid="confirm-handoff-button"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowHandoffModal(false)}
              style={{ ...buttonStyle, backgroundColor: '#757575' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div style={tableStyle}>
        <div style={headerStyle}>
          <input
            type="checkbox"
            checked={selectedPatients.size === patients.length && patients.length > 0}
            onChange={toggleSelectAll}
            style={{ width: '18px', height: '18px' }}
            aria-label="Select all patients"
          />
          <div style={{ flex: '0 0 180px' }}>Patient</div>
          <div style={{ flex: 1, minWidth: '120px' }}>L1: Primary</div>
          <div style={{ flex: 1, minWidth: '120px' }}>L2: Charge</div>
          <div style={{ flex: 1, minWidth: '120px' }}>L3: Physician</div>
          <div style={{ flex: 1, minWidth: '120px' }}>L4: RRT</div>
        </div>

        {patients.map((patient) => (
          <CareTeamAssignmentRow
            key={patient.id}
            patient={patient}
            careTeam={careTeams[patient.id]}
            clinicians={clinicians}
            selected={selectedPatients.has(patient.id)}
            onSelect={toggleSelect}
            onReassign={handleReassign}
            hasActiveEscalation={hasActiveEscalation(patient.id)}
          />
        ))}
      </div>
    </div>
  );
}
