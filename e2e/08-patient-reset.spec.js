/**
 * Test Case 8: Patient Reset & Recovery
 * Verifies reset triggers gradual recovery and patient returns to normal.
 */
const { test, expect } = require('@playwright/test');
const {
  waitForPatientsLoaded,
  waitForVitalsOnTile,
  getPatientIdFromTile,
  triggerConditionViaApi,
  resetPatientViaApi,
  acknowledgeAllAlertsForPatient,
} = require('./helpers');

test.describe('8. Patient Reset & Recovery', () => {
  test('reset button becomes enabled after triggering a condition', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(4);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    const resetBtn = page.getByTestId(`reset-${patientId}`);

    // Initially disabled
    await expect(resetBtn).toBeDisabled();

    // Trigger condition
    await page.getByTestId(`simulate-tachycardia-${patientId}`).click();

    // Wait for the condition to register and button to enable
    await expect(resetBtn).toBeEnabled({ timeout: 10000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('clicking reset initiates recovery', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(5);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);

    // Trigger condition
    await triggerConditionViaApi(page, patientId, 'hypoxia');

    // Wait for condition to be active (button disabled)
    const simBtn = page.getByTestId(`simulate-hypoxia-${patientId}`);
    await expect(simBtn).toBeDisabled({ timeout: 10000 });

    // Click reset
    const resetBtn = page.getByTestId(`reset-${patientId}`);
    await expect(resetBtn).toBeEnabled({ timeout: 10000 });
    await resetBtn.click();

    // After reset, the reset button should become disabled (no active conditions)
    await expect(resetBtn).toBeDisabled({ timeout: 10000 });

    // Cleanup
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('patient status returns to Normal after recovery period', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(6);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    // Trigger and then reset
    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for alert to generate (confirms condition is active)
    await page.waitForTimeout(6000);

    // Reset the patient
    await resetPatientViaApi(page, patientId);

    // Acknowledge any alerts so status can return to Normal
    await page.waitForTimeout(2000);
    await acknowledgeAllAlertsForPatient(page, patientId);

    // Wait for recovery (4 readings × 5s = 20s + buffer)
    await page.waitForTimeout(25000);

    // Verify patient status via API
    const response = await page.request.get(
      `http://localhost:8000/api/patients/${patientId}`
    );
    const patient = await response.json();
    expect(patient.status).toBe('Normal');
  });
});
