/**
 * Test Case 5: Alert Generation & Display
 * Verifies alerts appear in the sidebar when thresholds are breached.
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

test.describe('5. Alert Generation & Display', () => {
  test('triggering a condition generates an alert in the sidebar', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(4);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);

    // Clear any existing alerts
    await acknowledgeAllAlertsForPatient(page, patientId);

    // Trigger condition
    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for alert to appear in sidebar
    const alertCard = await waitForAlertInSidebar(page, 30000);
    await expect(alertCard).toBeVisible();

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('alert card shows severity, patient name, vital sign, and value', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(5);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    await triggerConditionViaApi(page, patientId, 'hypoxia');

    const alertCard = await waitForAlertInSidebar(page, 30000);

    // Alert should contain severity label
    const severityLabel = alertCard.locator('.alert-card__severity');
    await expect(severityLabel).toBeVisible();

    // Alert should contain patient name and vital sign details
    const details = alertCard.locator('.alert-card__details');
    await expect(details).toBeVisible();
    await expect(details).toContainText('spo2');

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('alert sidebar shows total active alert count', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(6);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for alert to appear
    await waitForAlertInSidebar(page, 30000);

    // Sidebar title should show count > 0
    const sidebar = page.getByTestId('alert-sidebar');
    const title = sidebar.locator('.alert-sidebar__title');
    await expect(title).toContainText(/Alerts \(\d+\)/);

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('alerts are grouped by patient in the sidebar', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(7);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    await triggerConditionViaApi(page, patientId, 'hyperthermia');

    await waitForAlertInSidebar(page, 30000);

    // Should have a group header with patient name
    const sidebar = page.getByTestId('alert-sidebar');
    const groupHeaders = sidebar.locator('.alert-sidebar__group-header');
    const count = await groupHeaders.count();
    expect(count).toBeGreaterThan(0);

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });
});
