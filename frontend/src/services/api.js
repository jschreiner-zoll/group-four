/**
 * REST API client for the Remote Patient Monitoring backend.
 */

const API_BASE = 'http://localhost:8000/api';

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchPatients() {
  const response = await fetch(`${API_BASE}/patients`);
  return handleResponse(response);
}

export async function fetchPatient(patientId) {
  const response = await fetch(`${API_BASE}/patients/${patientId}`);
  return handleResponse(response);
}

export async function simulateCondition(patientId, condition) {
  const response = await fetch(`${API_BASE}/patients/${patientId}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ condition }),
  });
  return handleResponse(response);
}

export async function resetPatient(patientId) {
  const response = await fetch(`${API_BASE}/patients/${patientId}/reset`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function fetchAlerts() {
  const response = await fetch(`${API_BASE}/alerts`);
  return handleResponse(response);
}

export async function fetchAlertHistory() {
  const response = await fetch(`${API_BASE}/alerts/history`);
  return handleResponse(response);
}

export async function acknowledgeAlert(alertId, note) {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  return handleResponse(response);
}

export async function fetchThresholds() {
  const response = await fetch(`${API_BASE}/thresholds`);
  return handleResponse(response);
}
