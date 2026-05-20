/**
 * DashboardPage - Main landing page. Connects WebSocket, fetches data, manages audio.
 */

import React, { useEffect } from 'react';
import DashboardTemplate from '../templates/DashboardTemplate';
import { AppProvider, useAppDispatch, useAppState } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ACTIONS } from '../context/appReducer';
import wsClient from '../services/websocketClient';
import audioAlertManager from '../services/audioAlertManager';
import { fetchPatients } from '../services/api';

function DashboardPageInner() {
  const dispatch = useAppDispatch();
  const { audioMuted } = useAppState();

  useEffect(() => {
    // Unlock audio on first user interaction (browser autoplay policy)
    const unlockAudio = () => {
      audioAlertManager.unlock();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    // Fetch initial patient data
    fetchPatients()
      .then((patients) => {
        dispatch({ type: ACTIONS.SET_PATIENTS, payload: patients });
      })
      .catch((err) => console.error('Failed to fetch patients:', err));

    // Set up WebSocket handlers
    wsClient.setConnectionChangeHandler((connected) => {
      dispatch({ type: ACTIONS.SET_WS_CONNECTED, payload: connected });
    });

    wsClient.onVitalsUpdate((data) => {
      dispatch({
        type: ACTIONS.UPDATE_VITALS,
        payload: {
          patient_id: data.patient_id,
          vitals: data.vitals,
          patient_status: data.patient_status,
        },
      });
    });

    wsClient.onNewAlert((data) => {
      dispatch({ type: ACTIONS.ADD_ALERT, payload: data });
      // Trigger audio alert
      if (!audioMuted) {
        audioAlertManager.playAlert(data.severity);
      }
    });

    wsClient.onAlertEscalated((data) => {
      dispatch({ type: ACTIONS.ESCALATE_ALERT, payload: data });
      // Play critical sound on escalation
      if (!audioMuted) {
        audioAlertManager.playAlert('Critical');
      }
    });

    wsClient.onAlertAcknowledged((data) => {
      dispatch({
        type: ACTIONS.ACKNOWLEDGE_ALERT,
        payload: {
          id: data.id,
          note: data.note,
          acknowledged_at: data.acknowledged_at,
        },
      });
      audioAlertManager.stopSound();
    });

    // Connect WebSocket
    wsClient.connect();

    return () => {
      wsClient.disconnect();
      audioAlertManager.mute();
    };
  }, []);

  return <DashboardTemplate />;
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <LanguageProvider>
        <DashboardPageInner />
      </LanguageProvider>
    </AppProvider>
  );
}
