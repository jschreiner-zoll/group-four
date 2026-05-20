/**
 * Shared helpers for E2E tests.
 */

const API_BASE = 'http://localhost:8001/api';

/**
 * Wait for the patient grid to load with all 10 patients and vitals visible.
 */
async function waitForDashboardReady(page) {
  const grid = page.getByTestId('patient-grid');
  await grid.waitFor({ state: 'visible', timeout: 15000 });
  const tiles = grid.locator('[data-testid^="patient-tile-"]');
  await tiles.first().waitFor({ state: 'visible', timeout: 15000 });
  // Wait for vitals to populate
  await tiles.first().locator('.vital-badge').first().waitFor({ state: 'visible', timeout: 15000 });
  return tiles;
}

/**
 * Get a patient ID from a tile's data-testid attribute.
 */
async function getPatientIdFromTile(tile) {
  const testId = await tile.getAttribute('data-testid');
  return testId.replace('patient-tile-', '');
}

/**
 * Trigger a condition via the API.
 */
async function triggerCondition(page, patientId, condition) {
  return page.request.post(`${API_BASE}/patients/${patientId}/simulate`, {
    data: { condition },
  });
}

/**
 * Reset a patient via the API.
 */
async function resetPatient(page, patientId) {
  return page.request.post(`${API_BASE}/patients/${patientId}/reset`);
}

/**
 * Acknowledge all active alerts for a patient.
 */
async function acknowledgeAllAlerts(page, patientId) {
  const response = await page.request.get(`${API_BASE}/alerts`);
  const alerts = await response.json();
  for (const alert of alerts.filter((a) => a.patient_id === patientId)) {
    await page.request.post(`${API_BASE}/alerts/${alert.id}/acknowledge`, {
      data: { note: 'test cleanup' },
    });
  }
}

/**
 * Wait for an alert card to appear in the sidebar.
 */
async function waitForAlert(page, timeout = 30000) {
  const alertCard = page.locator('[data-testid^="alert-card-"]').first();
  await alertCard.waitFor({ state: 'visible', timeout });
  return alertCard;
}

/**
 * Get all patients from the API.
 */
async function getPatients(page) {
  const response = await page.request.get(`${API_BASE}/patients`);
  return response.json();
}

module.exports = {
  API_BASE,
  waitForDashboardReady,
  getPatientIdFromTile,
  triggerCondition,
  resetPatient,
  acknowledgeAllAlerts,
  waitForAlert,
  getPatients,
};
