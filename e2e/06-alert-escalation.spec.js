/**
 * Test Case 6: Alert Escalation
 * Verifies Warning alerts escalate to Critical after 3 consecutive breach readings.
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

test.describe('6. Alert Escalation', () => {
  test('warning alert escalates to critical after 3 consecutive breaches', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(8);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    // Trigger a condition that produces Warning-level values (tachycardia starts at spike then sustained ~105-140)
    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for the alert to appear
    await waitForAlertInSidebar(page, 30000);

    // Wait for escalation (3 readings × 5s = 15s + buffer)
    // The alert should escalate and show [ESCALATED] text
    await expect(
      page.locator('[data-testid^="alert-card-"]').filter({ hasText: 'ESCALATED' }).first()
    ).toBeVisible({ timeout: 35000 });

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });

  test('escalated alert shows Critical severity', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const tile = tiles.nth(9);
    await waitForVitalsOnTile(tile);

    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlertsForPatient(page, patientId);

    await triggerConditionViaApi(page, patientId, 'tachycardia');

    // Wait for escalation
    const escalatedCard = page.locator('[data-testid^="alert-card-"]')
      .filter({ hasText: 'ESCALATED' })
      .first();
    await expect(escalatedCard).toBeVisible({ timeout: 35000 });

    // Should show Critical severity
    const severity = escalatedCard.locator('.alert-card__severity');
    await expect(severity).toContainText('Critical');

    // Cleanup
    await resetPatientViaApi(page, patientId);
    await acknowledgeAllAlertsForPatient(page, patientId);
  });
});
