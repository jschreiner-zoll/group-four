/**
 * EscalationContext — manages escalation-specific state separate from existing AppContext.
 * Handles care team assignments, escalation states, clinician roster, and notifications.
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  escalationReducer,
  initialEscalationState,
  ESCALATION_ACTIONS,
} from './escalationReducer';
import wsClient from '../services/websocketClient';

const EscalationContext = createContext(null);
const EscalationDispatchContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export function EscalationProvider({ children }) {
  const [state, dispatch] = useReducer(escalationReducer, initialEscalationState);

  // Fetch initial data on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch clinicians
        const cliniciansRes = await fetch(`${API_BASE}/api/care-team/clinicians`);
        if (cliniciansRes.ok) {
          const clinicians = await cliniciansRes.json();
          dispatch({ type: ESCALATION_ACTIONS.SET_CLINICIANS, payload: clinicians });
          // Auto-select first on-duty clinician
          const onDuty = clinicians.find((c) => c.active);
          if (onDuty) {
            dispatch({ type: ESCALATION_ACTIONS.SET_SELECTED_CLINICIAN, payload: onDuty.id });
          }
        }

        // Fetch care team assignments
        const assignmentsRes = await fetch(`${API_BASE}/api/care-team/assignments`);
        if (assignmentsRes.ok) {
          const assignments = await assignmentsRes.json();
          const careTeamMap = {};
          assignments.forEach((ct) => {
            const patientId = ct.subject?.reference?.split('/').pop() || '';
            if (patientId) {
              careTeamMap[patientId] = ct;
            }
          });
          dispatch({ type: ESCALATION_ACTIONS.SET_CARE_TEAMS, payload: careTeamMap });
        }

        // Fetch active escalations
        const escalationsRes = await fetch(`${API_BASE}/api/escalation/active`);
        if (escalationsRes.ok) {
          const escalations = await escalationsRes.json();
          const escalationMap = {};
          escalations.forEach((e) => {
            if (e.alert_ids && e.alert_ids.length > 0) {
              e.alert_ids.forEach((alertId) => {
                escalationMap[alertId] = e;
              });
            }
          });
          dispatch({ type: ESCALATION_ACTIONS.SET_ESCALATIONS, payload: escalationMap });
        }

        // Fetch escalation config
        const configRes = await fetch(`${API_BASE}/api/escalation/config/current`);
        if (configRes.ok) {
          const config = await configRes.json();
          dispatch({ type: ESCALATION_ACTIONS.SET_ESCALATION_CONFIG, payload: config });
        }
      } catch (error) {
        console.error('Failed to fetch escalation data:', error);
      }
    }

    fetchInitialData();
  }, []);

  // Handle WebSocket messages for escalation events via wsClient
  useEffect(() => {
    wsClient.onEscalationEvent((data) => {
      const eventType = data.type;

      if (eventType === 'escalated' || eventType === 'notified') {
        dispatch({
          type: ESCALATION_ACTIONS.UPDATE_ESCALATION,
          payload: { alertId: data.alert_id, escalation: data },
        });
        if (data.clinician_id === state.selectedClinician) {
          dispatch({ type: ESCALATION_ACTIONS.ADD_NOTIFICATION, payload: data });
        }
      } else if (eventType === 'resolved' || eventType === 'acknowledged') {
        dispatch({
          type: ESCALATION_ACTIONS.REMOVE_ESCALATION,
          payload: { alertId: data.alert_id },
        });
        if (data.clinician_id === state.selectedClinician) {
          dispatch({ type: ESCALATION_ACTIONS.ADD_NOTIFICATION, payload: data });
        }
      }
    });

    wsClient.onCareTeamUpdated((data) => {
      dispatch({
        type: ESCALATION_ACTIONS.UPDATE_CARE_TEAM,
        payload: { patientId: data.patient_id, careTeam: data.care_team },
      });
    });

    wsClient.onClinicianStatusChanged((data) => {
      dispatch({
        type: ESCALATION_ACTIONS.UPDATE_CLINICIAN_STATUS,
        payload: { clinicianId: data.clinician_id, active: data.on_duty },
      });
    });

    wsClient.onHandoffComplete((data) => {
      dispatch({
        type: ESCALATION_ACTIONS.SET_HANDOFF_SUMMARY,
        payload: data.summary,
      });
    });
  }, [state.selectedClinician]);

  return (
    <EscalationContext.Provider value={state}>
      <EscalationDispatchContext.Provider value={dispatch}>
        {children}
      </EscalationDispatchContext.Provider>
    </EscalationContext.Provider>
  );
}

export function useEscalation() {
  const context = useContext(EscalationContext);
  if (context === null) {
    // Return default state if not inside provider (graceful fallback)
    return initialEscalationState;
  }
  return context;
}

export function useEscalationDispatch() {
  const context = useContext(EscalationDispatchContext);
  if (context === null) {
    throw new Error('useEscalationDispatch must be used within an EscalationProvider');
  }
  return context;
}

export { ESCALATION_ACTIONS };
export default EscalationContext;
