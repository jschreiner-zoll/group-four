/**
 * Test Case 7: Alert Acknowledgment
 * Verifies the clinician can acknowledge alerts with notes.
 */
const { test, expect } = require('@playwright/test');
const {
  waitForPatientsLoaded,
  waitForVitalsOnTile,
  getPatientIdFromTile,
  triggerConditionViaApi,
  resetPatientViaApi,
  acknowledgeAllAlertsForPatient,
  waitForAlertInSidebar,
} = require('./helpers');

test.describe('7. Alert Acknowledgment', () => {
  test('clicking Acknowledge opens the note form', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(0);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);
    await triggerConditionViaApi(page, patientId, 'tachycardia');

    const alertCard = await waitForAlertInSidebar(page, 30000);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Click acknowledge button
    await page.getByTestId(`acknowledge-btn-${alertId}`).click();

    // Note input should appear
    const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
    await expect(noteInput).toBeVisible();

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('submitting with empty note shows validation error', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(1);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);
    await triggerConditionViaApi(page, patientId, 'hypoxia');

    const alertCard = await waitForAlertInSidebar(page, 30000);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    await page.getByTestId(`acknowledge-btn-${alertId}`).click();

    // Submit button should be disabled when note is empty
    const submitBtn = page.getByTestId(`acknowledge-submit-${alertId}`);
    await expect(submitBtn).toBeDisabled();

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('submitting with valid note acknowledges the alert', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(2);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);
    await triggerConditionViaApi(page, patientId, 'hyperthermia');

    const alertCard = await waitForAlertInSidebar(page, 30000);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Open form and submit
    await page.getByTestId(`acknowledge-btn-${alertId}`).click();
    const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
    await noteInput.fill('Patient assessed, monitoring closely');
    await page.getByTestId(`acknowledge-submit-${alertId}`).click();

    // Alert should show as acknowledged
    await expect(
      page.locator(`[data-testid="alert-card-${alertId}"]`).locator('text=Acknowledged')
    ).toBeVisible({ timeout: 10000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
  });

  test('acknowledged alert moves to acknowledged section', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(3);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);
    await triggerConditionViaApi(page, patientId, 'hypotension');

    const alertCard = await waitForAlertInSidebar(page, 30000);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Acknowledge it
    await page.getByTestId(`acknowledge-btn-${alertId}`).click();
    await page.getByTestId(`acknowledge-note-${alertId}`).fill('Noted and addressed');
    await page.getByTestId(`acknowledge-submit-${alertId}`).click();

    // Wait for the acknowledged section to appear
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar.locator('text=Acknowledged')).toBeVisible({ timeout: 10000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
  });
});
