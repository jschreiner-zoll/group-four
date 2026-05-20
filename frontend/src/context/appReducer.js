/**
 * Application state reducer for the Remote Patient Monitoring dashboard.
 */

export const initialState = {
  patients: {},
  vitals: {},
  alerts: {
    active: [],
    acknowledged: [],
  },
  selectedPatientId: null,
  audioMuted: false,
  wsConnected: false,
};

// Action types
export const ACTIONS = {
  SET_PATIENTS: 'SET_PATIENTS',
  UPDATE_VITALS: 'UPDATE_VITALS',
  ADD_ALERT: 'ADD_ALERT',
  ESCALATE_ALERT: 'ESCALATE_ALERT',
  ACKNOWLEDGE_ALERT: 'ACKNOWLEDGE_ALERT',
  SELECT_PATIENT: 'SELECT_PATIENT',
  TOGGLE_MUTE: 'TOGGLE_MUTE',
  SET_WS_CONNECTED: 'SET_WS_CONNECTED',
};

/**
 * Sort alerts by severity (critical first), then by timestamp (newest first).
 */
function sortAlerts(alerts) {
  return [...alerts].sort((a, b) => {
    // Critical before Warning
    if (a.severity === 'Critical' && b.severity === 'Warning') return -1;
    if (a.severity === 'Warning' && b.severity === 'Critical') return 1;
    // Within same severity, newest first
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

export function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PATIENTS: {
      const patients = {};
      action.payload.forEach((patient) => {
        patients[patient.id] = patient;
      });
      return { ...state, patients };
    }

    case ACTIONS.UPDATE_VITALS: {
      const { patient_id, vitals, patient_status } = action.payload;
      const existingPatient = state.patients[patient_id];
      return {
        ...state,
        vitals: {
          ...state.vitals,
          [patient_id]: vitals,
        },
        patients: existingPatient
          ? {
              ...state.patients,
              [patient_id]: { ...existingPatient, status: patient_status },
            }
          : state.patients,
      };
    }

    case ACTIONS.ADD_ALERT: {
      const newAlert = action.payload;
      // Prevent duplicates (same alert ID)
      if (state.alerts.active.some((a) => a.id === newAlert.id)) {
        return state;
      }
      const updatedActive = sortAlerts([...state.alerts.active, newAlert]);
      return {
        ...state,
        alerts: {
          ...state.alerts,
          active: updatedActive,
        },
      };
    }

    case ACTIONS.ESCALATE_ALERT: {
      const { id, new_severity, breach_count } = action.payload;
      const updatedAlerts = state.alerts.active.map((alert) =>
        alert.id === id
          ? { ...alert, severity: new_severity, breach_count, escalated: true }
          : alert
      );
      return {
        ...state,
        alerts: {
          ...state.alerts,
          active: sortAlerts(updatedAlerts),
        },
      };
    }

    case ACTIONS.ACKNOWLEDGE_ALERT: {
      const { id, note, acknowledged_at } = action.payload;
      const alertToAck = state.alerts.active.find((a) => a.id === id);
      if (!alertToAck) return state;

      const acknowledgedAlert = {
        ...alertToAck,
        status: 'Acknowledged',
        acknowledgment: { note, acknowledged_at },
      };

      return {
        ...state,
        alerts: {
          active: state.alerts.active.filter((a) => a.id !== id),
          acknowledged: [acknowledgedAlert, ...state.alerts.acknowledged],
        },
      };
    }

    case ACTIONS.SELECT_PATIENT: {
      return {
        ...state,
        selectedPatientId: action.payload,
      };
    }

    case ACTIONS.TOGGLE_MUTE: {
      return {
        ...state,
        audioMuted: !state.audioMuted,
      };
    }

    case ACTIONS.SET_WS_CONNECTED: {
      return {
        ...state,
        wsConnected: action.payload,
      };
    }

    default:
      return state;
  }
}
