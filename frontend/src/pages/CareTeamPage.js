/**
 * CareTeamPage — dedicated page for care team management and escalation history.
 */

import React, { useEffect, useState } from 'react';
import { useEscalation } from '../context/EscalationContext';
import CareTeamTable from '../organisms/CareTeamTable';
import ClinicianRoster from '../organisms/ClinicianRoster';
import EscalationHistoryTimeline from '../organisms/EscalationHistoryTimeline';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function CareTeamPage() {
  const [activeTab, setActiveTab] = useState('assignments');
  const [patients, setPatients] = useState([]);
  const { escalations } = useEscalation();

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch(`${API_BASE}/api/patients`);
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      }
    }
    loadPatients();
  }, []);

  // Get recent escalation events for history tab
  const recentEscalations = Object.values(escalations);

  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#FAFAFA',
  };

  const tabBarStyle = {
    display: 'flex',
    gap: '0',
    borderBottom: '2px solid #E0E0E0',
    backgroundColor: '#FFFFFF',
    padding: '0 16px',
  };

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: '500',
    color: isActive ? '#1565C0' : '#757575',
    borderBottom: isActive ? '2px solid #1565C0' : '2px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: isActive ? '#1565C0' : 'transparent',
  });

  const contentStyle = {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  };

  const gridStyle = {
    display: 'flex',
    gap: '20px',
  };

  const mainColumnStyle = {
    flex: 1,
    minWidth: 0,
  };

  const sideColumnStyle = {
    flex: '0 0 280px',
  };

  return (
    <div style={pageStyle} data-testid="care-team-page">
      <div style={tabBarStyle}>
        <button
          style={tabStyle(activeTab === 'assignments')}
          onClick={() => setActiveTab('assignments')}
          data-testid="tab-assignments"
        >
          Team Assignments
        </button>
        <button
          style={tabStyle(activeTab === 'history')}
          onClick={() => setActiveTab('history')}
          data-testid="tab-history"
        >
          Escalation History
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'assignments' && (
          <div style={gridStyle}>
            <div style={mainColumnStyle}>
              <CareTeamTable patients={patients} />
            </div>
            <div style={sideColumnStyle}>
              <ClinicianRoster />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
            <EscalationHistoryTimeline />
          </div>
        )}
      </div>
    </div>
  );
}
