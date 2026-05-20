/**
 * DashboardTemplate - Defines the overall dashboard layout structure.
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import PatientGrid from '../organisms/PatientGrid';
import AlertSidebar from '../organisms/AlertSidebar';
import PatientDetailPanel from '../organisms/PatientDetailPanel';
import { useAppState } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../atoms/LanguageSelector';

export default function DashboardTemplate() {
  const { wsConnected } = useAppState();
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="dashboard-layout dashboard-layout--no-header">
      <main>
        <PatientGrid />
      </main>

      <PatientDetailPanel />
      <AlertSidebar />
    </div>
  );
}
