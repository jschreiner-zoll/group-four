/**
 * Escalation state reducer for Care Team Escalation Routing.
 * Manages care team assignments, escalation states, clinician roster, and notifications.
 */

export const ESCALATION_ACTIONS = {
  SET_CARE_TEAMS: 'SET_CARE_TEAMS',
  UPDATE_CARE_TEAM: 'UPDATE_CARE_TEAM',
  SET_CLINICIANS: 'SET_CLINICIANS',
  UPDATE_CLINICIAN_STATUS: 'UPDATE_CLINICIAN_STATUS',
  SET_ESCALATIONS: 'SET_ESCALATIONS',
  UPDATE_ESCALATION: 'UPDATE_ESCALATION',
  REMOVE_ESCALATION: 'REMOVE_ESCALATION',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_SELECTED_CLINICIAN: 'SET_SELECTED_CLINICIAN',
  SET_DEMO_MODE: 'SET_DEMO_MODE',
  SET_ESCALATION_CONFIG: 'SET_ESCALATION_CONFIG',
  SET_HANDOFF_SUMMARY: 'SET_HANDOFF_SUMMARY',
};

export const initialEscalationState = {
  careTeams: {},           // patient_id -> CareTeam FHIR resource
  clinicians: [],          // Practitioner[] roster
  escalations: {},         // alert_id -> EscalationState
  notifications: [],       // EscalationEvent[] for selected clinician
  selectedClinician: null, // current clinician identity
  escalationConfig: {
    level_timeouts: { 1: 300, 2: 300, 3: 300 },
    severity_max_levels: { Warning: 3, Critical: 4 },
    demo_time_scale: 30.0,
  },
  demoMode: false,
  handoffSummary: null,
};

export function escalationReducer(state, action) {
  switch (action.type) {
    case ESCALATION_ACTIONS.SET_CARE_TEAMS:
      return { ...state, careTeams: action.payload };

    case ESCALATION_ACTIONS.UPDATE_CARE_TEAM:
      return {
        ...state,
        careTeams: {
          ...state.careTeams,
          [action.payload.patientId]: action.payload.careTeam,
        },
      };

    case ESCALATION_ACTIONS.SET_CLINICIANS:
      return { ...state, clinicians: action.payload };

    case ESCALATION_ACTIONS.UPDATE_CLINICIAN_STATUS: {
      const updated = state.clinicians.map((c) =>
        c.id === action.payload.clinicianId
          ? { ...c, active: action.payload.active }
          : c
      );
      return { ...state, clinicians: updated };
    }

    case ESCALATION_ACTIONS.SET_ESCALATIONS:
      return { ...state, escalations: action.payload };

    case ESCALATION_ACTIONS.UPDATE_ESCALATION:
      return {
        ...state,
        escalations: {
          ...state.escalations,
          [action.payload.alertId]: action.payload.escalation,
        },
      };

    case ESCALATION_ACTIONS.REMOVE_ESCALATION: {
      const { [action.payload.alertId]: _, ...remaining } = state.escalations;
      return { ...state, escalations: remaining };
    }

    case ESCALATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
      };

    case ESCALATION_ACTIONS.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };

    case ESCALATION_ACTIONS.SET_SELECTED_CLINICIAN:
      return { ...state, selectedClinician: action.payload };

    case ESCALATION_ACTIONS.SET_DEMO_MODE:
      return { ...state, demoMode: action.payload };

    case ESCALATION_ACTIONS.SET_ESCALATION_CONFIG:
      return { ...state, escalationConfig: action.payload };

    case ESCALATION_ACTIONS.SET_HANDOFF_SUMMARY:
      return { ...state, handoffSummary: action.payload };

    default:
      return state;
  }
}
