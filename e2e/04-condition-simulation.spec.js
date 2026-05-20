/**
 * Test Case 4: Condition Simulation
 * Verifies triggering conditions via UI buttons and API.
 */
const { test, expect } = require('@playwright/test');
const {
  waitForPatientsLoaded,
  waitForVitalsOnTile,
  getPatientIdFromTile,
  resetPatientViaApi,
  acknowledgeAllAlertsForPatient,
} = require('./helpers');

test.describe('4. Condition Simulation', () => {
  test('clicking a condition button triggers the simulation', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(0);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);

    // Click the tachycardia button
    const simButton = page.getByTestId(`simulate-tachycardia-${patientId}`);
    await expect(simButton).toBeVisible();
    await simButton.click();

    // Button should become disabled after triggering
    await expect(simButton).toBeDisabled({ timeout: 5000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('condition button is disabled while condition is active', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(1);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);

    const simButton = page.getByTestId(`simulate-hypoxia-${patientId}`);
    await simButton.click();

    // Should be disabled now
    await expect(simButton).toBeDisabled({ timeout: 5000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('multiple conditions can be active simultaneously', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(2);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);

    // Trigger two different conditions
    const tachyBtn = page.getByTestId(`simulate-tachycardia-${patientId}`);
    const hypoxiaBtn = page.getByTestId(`simulate-hypoxia-${patientId}`);

    await tachyBtn.click();
    await page.waitForTimeout(500);
    await hypoxiaBtn.click();

    // Both should be disabled
    await expect(tachyBtn).toBeDisabled({ timeout: 5000 });
    await expect(hypoxiaBtn).toBeDisabled({ timeout: 5000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('reset button is disabled when no active conditions', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(3);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    const resetBtn = page.getByTestId(`reset-${patientId}`);

    // Should be disabled initially (no active conditions)
    await expect(resetBtn).toBeDisabled();
  });
});
