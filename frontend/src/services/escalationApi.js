/**
 * Escalation API service — dedicated API calls for care team and escalation endpoints.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// --- Care Team Endpoints ---

export async function fetchClinicians() {
  const res = await fetch(`${API_BASE}/api/care-team/clinicians`);
  if (!res.ok) throw new Error('Failed to fetch clinicians');
  return res.json();
}

export async function updateDutyStatus(clinicianId, onDuty) {
  const res = await fetch(`${API_BASE}/api/care-team/clinicians/${clinicianId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on_duty: onDuty }),
  });
  if (!res.ok) throw new Error('Failed to update duty status');
  return res.json();
}

export async function fetchAssignments() {
  const res = await fetch(`${API_BASE}/api/care-team/assignments`);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

export async function getAssignment(patientId) {
  const res = await fetch(`${API_BASE}/api/care-team/assignments/${patientId}`);
  if (!res.ok) throw new Error('Failed to fetch assignment');
  return res.json();
}

export async function updateAssignment(patientId, clinicianId, level) {
  const res = await fetch(`${API_BASE}/api/care-team/assignments/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinician_id: clinicianId, level }),
  });
  if (!res.ok) throw new Error('Failed to update assignment');
  return res.json();
}

export async function bulkHandoff(patientIds, toClinicianId, level = 1) {
  const res = await fetch(`${API_BASE}/api/care-team/handoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_ids: patientIds, to_clinician_id: toClinicianId, level }),
  });
  if (!res.ok) throw new Error('Failed to perform handoff');
  return res.json();
}

export async function getRrtMembers(patientId) {
  const res = await fetch(`${API_BASE}/api/care-team/rrt/${patientId}`);
  if (!res.ok) throw new Error('Failed to fetch RRT members');
  return res.json();
}

export async function updateRrtMembers(patientId, clinicianIds) {
  const res = await fetch(`${API_BASE}/api/care-team/rrt/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinician_ids: clinicianIds }),
  });
  if (!res.ok) throw new Error('Failed to update RRT members');
  return res.json();
}

// --- Escalation Endpoints ---

export async function fetchActiveEscalations() {
  const res = await fetch(`${API_BASE}/api/escalation/active`);
  if (!res.ok) throw new Error('Failed to fetch escalations');
  return res.json();
}

export async function getEscalationForAlert(alertId) {
  const res = await fetch(`${API_BASE}/api/escalation/${alertId}`);
  if (!res.ok) throw new Error('Failed to fetch escalation');
  return res.json();
}

export async function getEscalationTimeline(alertId) {
  const res = await fetch(`${API_BASE}/api/escalation/${alertId}/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function getEscalationConfig() {
  const res = await fetch(`${API_BASE}/api/escalation/config/current`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}

export async function updateEscalationConfig(config) {
  const res = await fetch(`${API_BASE}/api/escalation/config/current`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update config');
  return res.json();
}

export async function toggleDemoMode(enabled) {
  const res = await fetch(`${API_BASE}/api/escalation/demo-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to toggle demo mode');
  return res.json();
}
