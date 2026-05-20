/**
 * Shared helpers for E2E tests.
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Wait for the patient grid to load with all 10 patients.
 */
async function waitForPatientsLoaded(page) {
  const grid = page.getByTestId('patient-grid');
  await grid.waitFor({ state: 'visible', timeout: 15000 });
  const tiles = grid.locator('[data-testid^="patient-tile-"]');
  await tiles.first().waitFor({ state: 'visible', timeout: 15000 });
  return tiles;
}

/**
 * Wait for vitals to appear on a patient tile (at least one vital badge with a numeric value).
 */
async function waitForVitalsOnTile(tile) {
  await tile.locator('.vital-badge').first().waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Get a patient ID from a tile's data-testid attribute.
 */
async function getPatientIdFromTile(tile) {
  const testId = await tile.getAttribute('data-testid');
  return testId.replace('patient-tile-', '');
}

/**
 * Trigger a condition via the API directly (faster than UI clicks for setup).
 */
async function triggerConditionViaApi(page, patientId, condition) {
  const response = await page.request.post(
    `${API_BASE}/patients/${patientId}/simulate`,
    { data: { condition } }
  );
  return response;
}

/**
 * Reset a patient via the API directly.
 */
async function resetPatientViaApi(page, patientId) {
  const response = await page.request.post(`${API_BASE}/patients/${patientId}/reset`);
  return response;
}

/**
 * Acknowledge all active alerts for a patient (cleanup helper).
 */
async function acknowledgeAllAlertsForPatient(page, patientId) {
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
async function waitForAlertInSidebar(page, timeout = 30000) {
  const alertCard = page.locator('[data-testid^="alert-card-"]').first();
  await alertCard.waitFor({ state: 'visible', timeout });
  return alertCard;
}

module.exports = {
  API_BASE,
  waitForPatientsLoaded,
  waitForVitalsOnTile,
  getPatientIdFromTile,
  triggerConditionViaApi,
  resetPatientViaApi,
  acknowledgeAllAlertsForPatient,
  waitForAlertInSidebar,
};
