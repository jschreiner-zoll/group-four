/**
 * DashboardTemplate - Defines the overall dashboard layout structure.
 */

import React from 'react';
import { Sun, Moon, Gamepad2 } from 'lucide-react';
import PatientGrid from '../organisms/PatientGrid';
import AlertSidebar from '../organisms/AlertSidebar';
import PatientDetailPanel from '../organisms/PatientDetailPanel';
import BlackjackModal from '../organisms/BlackjackModal';
import { useAppState } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../atoms/LanguageSelector';

export default function DashboardTemplate() {
  const { wsConnected } = useAppState();
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [waitingMode, setWaitingMode] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <h1>{t('title')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="waiting-mode-btn"
            onClick={() => setWaitingMode(true)}
            aria-label="Open waiting mode"
            data-testid="waiting-mode-btn"
          >
            <Gamepad2 size={16} />
            Waiting Mode
          </button>
          <LanguageSelector />
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            data-testid="theme-toggle"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? t('light') : t('dark')}
          </button>
          <div className="connection-status">
            <span
              className={`connection-dot ${!wsConnected ? 'connection-dot--disconnected' : ''}`}
              aria-hidden="true"
            />
            <span>{wsConnected ? t('connected') : t('disconnected')}</span>
          </div>
        </div>
      </header>

      <main>
        <PatientGrid />
      </main>

      <PatientDetailPanel />
      <AlertSidebar />
      <BlackjackModal open={waitingMode} onClose={() => setWaitingMode(false)} />
    </div>
  );
}
