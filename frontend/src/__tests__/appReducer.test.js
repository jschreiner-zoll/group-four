/**
 * Unit tests for the application state reducer.
 */

import { appReducer, initialState, ACTIONS } from '../context/appReducer';

describe('appReducer', () => {
  describe('SET_PATIENTS', () => {
    it('should set patients keyed by ID', () => {
      const patients = [
        { id: 'p1', name: 'John', age: 67, room: '201-A', status: 'Normal' },
        { id: 'p2', name: 'Maria', age: 54, room: '201-B', status: 'Normal' },
      ];
      const state = appReducer(initialState, {
        type: ACTIONS.SET_PATIENTS,
        payload: patients,
      });
      expect(Object.keys(state.patients)).toHaveLength(2);
      expect(state.patients['p1'].name).toBe('John');
      expect(state.patients['p2'].name).toBe('Maria');
    });
  });

  describe('UPDATE_VITALS', () => {
    it('should update vitals for a specific patient', () => {
      const stateWithPatients = {
        ...initialState,
        patients: { p1: { id: 'p1', name: 'John', status: 'Normal' } },
      };
      const state = appReducer(stateWithPatients, {
        type: ACTIONS.UPDATE_VITALS,
        payload: {
          patient_id: 'p1',
          vitals: { heart_rate: 72, spo2: 98 },
          patient_status: 'Normal',
        },
      });
      expect(state.vitals['p1'].heart_rate).toBe(72);
      expect(state.vitals['p1'].spo2).toBe(98);
      expect(state.patients['p1'].status).toBe('Normal');
    });

    it('should update patient status', () => {
      const stateWithPatients = {
        ...initialState,
        patients: { p1: { id: 'p1', name: 'John', status: 'Normal' } },
      };
      const state = appReducer(stateWithPatients, {
        type: ACTIONS.UPDATE_VITALS,
        payload: {
          patient_id: 'p1',
          vitals: { heart_rate: 110 },
          patient_status: 'Warning',
        },
      });
      expect(state.patients['p1'].status).toBe('Warning');
    });
  });

  describe('ADD_ALERT', () => {
    it('should add alert to active list', () => {
      const alert = {
        id: 'a1',
        patient_id: 'p1',
        severity: 'Warning',
        vital_sign: 'heart_rate',
        created_at: '2024-01-01T00:00:00Z',
      };
      const state = appReducer(initialState, {
        type: ACTIONS.ADD_ALERT,
        payload: alert,
      });
      expect(state.alerts.active).toHaveLength(1);
      expect(state.alerts.active[0].id).toBe('a1');
    });

    it('should sort alerts by severity (critical first)', () => {
      const warning = {
        id: 'a1',
        severity: 'Warning',
        created_at: '2024-01-01T00:00:01Z',
      };
      const critical = {
        id: 'a2',
        severity: 'Critical',
        created_at: '2024-01-01T00:00:00Z',
      };
      let state = appReducer(initialState, {
        type: ACTIONS.ADD_ALERT,
        payload: warning,
      });
      state = appReducer(state, {
        type: ACTIONS.ADD_ALERT,
        payload: critical,
      });
      expect(state.alerts.active[0].id).toBe('a2'); // Critical first
      expect(state.alerts.active[1].id).toBe('a1');
    });
  });

  describe('ESCALATE_ALERT', () => {
    it('should update alert severity', () => {
      const stateWithAlert = {
        ...initialState,
        alerts: {
          active: [{ id: 'a1', severity: 'Warning', created_at: '2024-01-01T00:00:00Z' }],
          acknowledged: [],
        },
      };
      const state = appReducer(stateWithAlert, {
        type: ACTIONS.ESCALATE_ALERT,
        payload: { id: 'a1', new_severity: 'Critical', breach_count: 3 },
      });
      expect(state.alerts.active[0].severity).toBe('Critical');
      expect(state.alerts.active[0].escalated).toBe(true);
    });
  });

  describe('ACKNOWLEDGE_ALERT', () => {
    it('should move alert from active to acknowledged', () => {
      const stateWithAlert = {
        ...initialState,
        alerts: {
          active: [{ id: 'a1', severity: 'Warning', patient_id: 'p1', created_at: '2024-01-01T00:00:00Z' }],
          acknowledged: [],
        },
      };
      const state = appReducer(stateWithAlert, {
        type: ACTIONS.ACKNOWLEDGE_ALERT,
        payload: { id: 'a1', note: 'Patient assessed', acknowledged_at: '2024-01-01T00:01:00Z' },
      });
      expect(state.alerts.active).toHaveLength(0);
      expect(state.alerts.acknowledged).toHaveLength(1);
      expect(state.alerts.acknowledged[0].acknowledgment.note).toBe('Patient assessed');
    });
  });

  describe('SELECT_PATIENT', () => {
    it('should set selected patient ID', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.SELECT_PATIENT,
        payload: 'p1',
      });
      expect(state.selectedPatientId).toBe('p1');
    });

    it('should clear selection with null', () => {
      const stateWithSelection = { ...initialState, selectedPatientId: 'p1' };
      const state = appReducer(stateWithSelection, {
        type: ACTIONS.SELECT_PATIENT,
        payload: null,
      });
      expect(state.selectedPatientId).toBeNull();
    });
  });

  describe('TOGGLE_MUTE', () => {
    it('should toggle audio muted state', () => {
      const state1 = appReducer(initialState, { type: ACTIONS.TOGGLE_MUTE });
      expect(state1.audioMuted).toBe(true);
      const state2 = appReducer(state1, { type: ACTIONS.TOGGLE_MUTE });
      expect(state2.audioMuted).toBe(false);
    });
  });

  describe('SET_WS_CONNECTED', () => {
    it('should set WebSocket connection status', () => {
      const state = appReducer(initialState, {
        type: ACTIONS.SET_WS_CONNECTED,
        payload: true,
      });
      expect(state.wsConnected).toBe(true);
    });
  });
});
