/**
 * App root component with sidebar navigation for Dashboard and Care Team pages.
 * Wraps with EscalationProvider for escalation state management.
 */

import React, { useState, useEffect } from 'react';
import DashboardPage from './pages/DashboardPage';
import CareTeamPage from './pages/CareTeamPage';
import { EscalationProvider } from './context/EscalationContext';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import ClinicianSelector from './atoms/ClinicianSelector';
import NotificationPanel from './organisms/NotificationPanel';
import { useEscalation, useEscalationDispatch, ESCALATION_ACTIONS } from './context/EscalationContext';
import audioAlertManager from './services/audioAlertManager';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const { clinicians, selectedClinician } = useEscalation();
  const dispatch = useEscalationDispatch();

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlockAudio = () => {
      audioAlertManager.unlock();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const handleClinicianSelect = (clinicianId) => {
    dispatch({ type: ESCALATION_ACTIONS.SET_SELECTED_CLINICIAN, payload: clinicianId });
  };

  const layoutStyle = {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  };

  const sidebarStyle = {
    width: '200px',
    backgroundColor: '#1A237E',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  };

  const logoStyle = {
    padding: '16px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  const navStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
    flex: 1,
  };

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: isActive ? '3px solid #64B5F6' : '3px solid transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '400',
    textDecoration: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  });

  const mainStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E0E0E0',
    flexShrink: 0,
  };

  const headerTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212121',
  };

  const headerActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const contentStyle = {
    flex: 1,
    overflow: 'auto',
  };

  return (
    <div style={layoutStyle}>
      {/* Sidebar Navigation */}
      <nav style={sidebarStyle} aria-label="Main navigation">
        <div style={logoStyle}>Connected Care RPM</div>
        <div style={navStyle}>
          <button
            style={navItemStyle(activePage === 'dashboard')}
            onClick={() => setActivePage('dashboard')}
            data-testid="nav-dashboard"
          >
            <span aria-hidden="true">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            style={navItemStyle(activePage === 'careteam')}
            onClick={() => setActivePage('careteam')}
            data-testid="nav-careteam"
          >
            <span aria-hidden="true">👥</span>
            <span>Care Team</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={mainStyle}>
        {/* Header with Clinician Selector and Notifications */}
        <header style={headerStyle}>
          <h1 style={headerTitleStyle}>
            {activePage === 'dashboard' ? 'Patient Dashboard' : 'Care Team Management'}
          </h1>
          <div style={headerActionsStyle}>
            <ClinicianSelector
              clinicians={clinicians}
              selectedId={selectedClinician}
              onSelect={handleClinicianSelect}
            />
            <NotificationPanel />
          </div>
        </header>

        {/* Page Content — DashboardPage always mounted to keep WebSocket + audio alive */}
        <div style={contentStyle}>
          <div style={{ display: activePage === 'dashboard' ? 'block' : 'none', height: '100%' }}>
            <DashboardPage />
          </div>
          {activePage === 'careteam' && <CareTeamPage />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <EscalationProvider>
          <AppContent />
        </EscalationProvider>
      </LanguageProvider>
    </AppProvider>
  );
}

export default App;
