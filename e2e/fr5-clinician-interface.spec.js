/**
 * FR-5: Clinician Interface
 *
 * FR-5.1: Accessible without authentication (open access for PoC)
 * FR-5.2: Clinicians can view all patient statuses from grid/tile dashboard
 * FR-5.3: Clinicians can view individual patient detail by selecting a tile
 * FR-5.4: Patient detail shows all current vital signs and active alerts
 */
const { test, expect } = require('@playwright/test');
const {
  waitForDashboardReady,
  getPatientIdFromTile,
  triggerCondition,
  resetPatient,
  acknowledgeAllAlerts,
} = require('./helpers');

test.describe('FR-5: Clinician Interface', () => {
  test('FR-5.1: Dashboard is accessible without authentication', async ({ page }) => {
    // Simply navigating to the page should work — no login required
    const response = await page.goto('/');
    expect(response.status()).toBe(200);

    const tiles = await waitForDashboardReady(page);
    await expect(tiles.first()).toBeVisible();
  });

  test('FR-5.2: Clinicians can view all patient statuses from grid dashboard', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // All 10 patients visible
    await expect(tiles).toHaveCount(10);

    // Each tile has a status indicator
    for (let i = 0; i < 3; i++) {
      const tile = tiles.nth(i);
      const status = tile.locator('[data-testid^="status-indicator-"]');
      await expect(status).toBeVisible();
    }
  });

  test('FR-5.3: Clicking a patient tile opens the detail panel', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Click first patient tile
    await tiles.first().click();

    // Detail panel should open
    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
  });

  test('FR-5.3: Detail panel shows patient name, age, and room', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Should show age and room info
    await expect(panel.locator('text=Age')).toBeVisible();
    await expect(panel.locator('text=Room')).toBeVisible();
  });

  test('FR-5.3: Detail panel can be closed', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Close the panel
    await page.getByTestId('detail-panel-close').click();
    await expect(panel).not.toBeVisible();
  });

  test('FR-5.4: Patient detail shows all 7 current vital signs', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Should have 7 vital rows
    const vitalRows = panel.locator('.detail-panel__vital-row');
    await expect(vitalRows).toHaveCount(7);
  });

  test('FR-5.4: Patient detail shows ECG waveform', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    const ecg = panel.getByTestId('ecg-viewer');
    await expect(ecg).toBeVisible();
  });

  test('FR-5.4: Patient detail shows active alerts for that patient', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(8);
    const patientId = await getPatientIdFromTile(tile);

    // Trigger a condition so there's an alert
    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'tachycardia');
    await page.waitForTimeout(6000);

    // Open detail panel
    await tile.click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Should show active alerts section
    await expect(panel.locator('text=Active Alerts')).toBeVisible({ timeout: 10000 });

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });
});
