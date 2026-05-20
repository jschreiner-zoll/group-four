/**
 * FR-3: Medical Condition Simulation
 *
 * FR-3.1: Each patient tile provides multiple condition simulation buttons
 * FR-3.2: Available conditions: Tachycardia, Bradycardia, Hypoxia, Hyperthermia, Hypotension, Hyperglycemia
 * FR-3.3: When simulation button pressed, patient's vital data shifts to condition values
 * FR-3.4: Conditions persist until manually reset via "Return to Normal" button
 */
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  waitForDashboardReady,
  getPatientIdFromTile,
  triggerCondition,
  resetPatient,
  acknowledgeAllAlerts,
} = require('./helpers');

test.describe('FR-3: Medical Condition Simulation', () => {
  test('FR-3.1: Each patient tile provides condition simulation buttons', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.first();
    const patientId = await getPatientIdFromTile(tile);

    // Should have simulation control buttons
    const simControls = tile.locator('.simulation-controls');
    await expect(simControls).toBeVisible();

    // Should have at least 6 condition buttons + 1 reset button
    const buttons = simControls.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(7); // 6 conditions + reset
  });

  test('FR-3.2: All 6 required conditions are available', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.first();
    const patientId = await getPatientIdFromTile(tile);

    const conditions = ['tachycardia', 'bradycardia', 'hypoxia', 'hyperthermia', 'hypotension', 'hyperglycemia'];

    for (const condition of conditions) {
      const btn = page.getByTestId(`simulate-${condition}-${patientId}`);
      await expect(btn).toBeVisible();
    }
  });

  test('FR-3.3: Triggering tachycardia shifts heart rate above threshold', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(5);
    const patientId = await getPatientIdFromTile(tile);

    // Reset first to ensure clean state
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
    await page.waitForTimeout(25000);

    // Trigger tachycardia
    await triggerCondition(page, patientId, 'tachycardia');

    // Wait for vitals to update (next cycle)
    await page.waitForTimeout(6000);

    // Verify via API that heart rate is elevated
    const response = await page.request.get(`${API_BASE}/patients/${patientId}`);
    const patient = await response.json();
    // Patient status should be Warning or Critical
    expect(['Warning', 'Critical']).toContain(patient.status);

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-3.3: Triggering hypoxia shifts SpO2 below threshold', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(6);
    const patientId = await getPatientIdFromTile(tile);

    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
    await page.waitForTimeout(25000);

    // Trigger hypoxia
    await triggerCondition(page, patientId, 'hypoxia');
    await page.waitForTimeout(6000);

    // Patient should be in warning or critical state
    const response = await page.request.get(`${API_BASE}/patients/${patientId}`);
    const patient = await response.json();
    expect(['Warning', 'Critical']).toContain(patient.status);

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-3.4: Conditions persist until reset button is pressed', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(7);
    const patientId = await getPatientIdFromTile(tile);

    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
    await page.waitForTimeout(25000);

    // Trigger condition
    await triggerCondition(page, patientId, 'hyperthermia');
    await page.waitForTimeout(6000);

    // Condition should persist across multiple cycles
    await page.waitForTimeout(6000);
    const response1 = await page.request.get(`${API_BASE}/patients/${patientId}`);
    const patient1 = await response1.json();
    expect(patient1.active_conditions).toContain('hyperthermia');

    // Press reset
    await resetPatient(page, patientId);
    await page.waitForTimeout(25000); // Wait for full recovery

    // Should be back to normal
    await acknowledgeAllAlerts(page, patientId);
    await page.waitForTimeout(6000);
    const response2 = await page.request.get(`${API_BASE}/patients/${patientId}`);
    const patient2 = await response2.json();
    expect(patient2.status).toBe('Normal');
  });

  test('FR-3.4: Reset button is available on each patient tile', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.first();
    const patientId = await getPatientIdFromTile(tile);

    const resetBtn = page.getByTestId(`reset-${patientId}`);
    await expect(resetBtn).toBeVisible();
  });
});
