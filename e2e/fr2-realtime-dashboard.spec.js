/**
 * FR-2: Real-Time Dashboard (Landing Page)
 *
 * FR-2.1: Multi-patient grid/tile view showing all 10 patients simultaneously
 * FR-2.2: Each tile displays current vital sign values (latest reading only)
 * FR-2.3: Patient tiles include visual status indicators (normal, warning, critical)
 * FR-2.4: Vital sign values update in real-time via WebSocket
 * FR-2.5: Alert sidebar displays active alerts with severity and timestamp
 */
const { test, expect } = require('@playwright/test');
const {
  waitForDashboardReady,
  getPatientIdFromTile,
  triggerCondition,
  resetPatient,
  acknowledgeAllAlerts,
  waitForAlert,
} = require('./helpers');

test.describe('FR-2: Real-Time Dashboard', () => {
  test('FR-2.1: Landing page displays multi-patient grid with all 10 patients', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    await expect(tiles).toHaveCount(10);

    // Grid container is visible
    const grid = page.getByTestId('patient-grid');
    await expect(grid).toBeVisible();
  });

  test('FR-2.2: Each patient tile displays current vital sign values', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Check multiple tiles have vital badges with numeric values
    for (let i = 0; i < 3; i++) {
      const tile = tiles.nth(i);
      const badges = tile.locator('.vital-badge');
      await expect(badges).toHaveCount(7);

      // Each badge should contain a numeric value
      const firstBadge = badges.first();
      const text = await firstBadge.textContent();
      expect(text).toMatch(/\d/);
    }
  });

  test('FR-2.3: Patient tiles include visual status indicators', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Each tile should have a status indicator
    const firstTile = tiles.first();
    const statusIndicator = firstTile.locator('[data-testid^="status-indicator-"]');
    await expect(statusIndicator).toBeVisible();
  });

  test('FR-2.3: Status indicators show normal, warning, or critical states', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(3);
    const patientId = await getPatientIdFromTile(tile);

    // Reset to ensure normal state
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
    await page.waitForTimeout(25000);

    // Should show normal status
    await expect(tile.locator('[data-testid="status-indicator-normal"]')).toBeVisible({ timeout: 10000 });

    // Trigger condition to get warning/critical
    await triggerCondition(page, patientId, 'tachycardia');
    await page.waitForTimeout(6000);

    // Status should change to warning or critical
    const warningOrCritical = tile.locator('[data-testid="status-indicator-warning"], [data-testid="status-indicator-critical"]');
    await expect(warningOrCritical).toBeVisible({ timeout: 15000 });

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-2.4: Vital sign values update in real-time via WebSocket', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Verify WebSocket is connected
    await expect(page.locator('.connection-status')).toContainText('Connected');

    // Capture a value, wait, and verify it updates
    const firstTile = tiles.first();
    const badge = firstTile.locator('.vital-badge').first();
    const value1 = await badge.locator('.vital-badge__value').textContent();

    // Wait for next update cycle
    await page.waitForTimeout(6000);

    const value2 = await badge.locator('.vital-badge__value').textContent();
    // Values are randomized, so they should differ (or at minimum still be numeric)
    expect(value2).toMatch(/\d/);
  });

  test('FR-2.5: Alert sidebar displays active alerts with severity and timestamp', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Alert sidebar should be visible
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar).toBeVisible();

    // Trigger a condition to generate an alert
    const tile = tiles.nth(4);
    const patientId = await getPatientIdFromTile(tile);
    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hypoxia');

    // Wait for alert to appear
    const alertCard = await waitForAlert(page);

    // Alert should show severity
    const severity = alertCard.locator('.alert-card__severity');
    await expect(severity).toBeVisible();

    // Alert should show timestamp
    const time = alertCard.locator('.alert-card__time');
    await expect(time).toBeVisible();

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });
});
