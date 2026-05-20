/**
 * Test Case 13: Multi-Client Alert Sync
 * Verifies acknowledging an alert via API broadcasts to connected WebSocket clients.
 */
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  waitForPatientsLoaded,
  waitForVitalsOnTile,
  getPatientIdFromTile,
  triggerConditionViaApi,
  resetPatientViaApi,
  acknowledgeAllAlertsForPatient,
  waitForAlertInSidebar,
} = require('./helpers');

test.describe('13. Multi-Client Alert Sync', () => {
  test('acknowledging alert via API updates the UI in real-time', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(7);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    // Trigger condition to generate alert
    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for alert to appear in UI
    const alertCard = await waitForAlertInSidebar(page, 30000);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Acknowledge via API (simulating another client)
    await page.request.post(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      data: { note: 'Acknowledged from another client' },
    });

    // The UI should update via WebSocket broadcast — alert should show as acknowledged
    await expect(
      page.locator(`[data-testid="alert-card-${alertId}"]`).locator('text=Acknowledged')
    ).toBeVisible({ timeout: 10000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
  });

  test('two browser contexts see the same alert', async ({ browser }) => {
    // Create two separate browser contexts (simulating two clients)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await page1.goto('http://localhost:3000');
      await page2.goto('http://localhost:3000');

      const tiles1 = await waitForPatientsLoaded(page1);
      const tiles2 = await waitForPatientsLoaded(page2);

      const tile = tiles1.nth(8);
      await waitForVitalsOnTile(tile);
      await waitForVitalsOnTile(tiles2.nth(8));

      const patientId = await getPatientIdFromTile(tile);
      await acknowledgeAllAlertsForPatient(page1, patientId);

      // Trigger condition from page1
      await triggerConditionViaApi(page1, patientId, 'hypoxia');

      // Both pages should see the alert
      await waitForAlertInSidebar(page1, 30000);
      await waitForAlertInSidebar(page2, 30000);

      // Cleanup
      await resetPatientViaApi(page1, patientId);
      await acknowledgeAllAlertsForPatient(page1, patientId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
