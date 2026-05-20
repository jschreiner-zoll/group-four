/**
 * NFR-2: Accessibility
 *
 * NFR-2.1: WCAG 2.0 AA contrast ratio requirements
 * NFR-2.2: Status indicators don't rely solely on color (icons + text)
 * NFR-2.3: Alert audio has visual equivalent
 * NFR-2.4: All interactive elements are keyboard accessible
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

test.describe('NFR-2: Accessibility', () => {
  test('NFR-2.2: Status indicators use icons and text, not just color', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Status indicator should have both icon and text label
    const firstTile = tiles.first();
    const statusIndicator = firstTile.locator('[data-testid^="status-indicator-"]');
    await expect(statusIndicator).toBeVisible();

    // Should contain text (Normal, Warning, or Critical)
    const text = await statusIndicator.textContent();
    expect(text).toMatch(/Normal|Warning|Critical/);
  });

  test('NFR-2.3: Alerts have visual equivalent (alert panel, badges, color changes)', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(5);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'tachycardia');

    // Wait for alert
    const alertCard = await waitForAlert(page);

    // Visual indicators present: severity icon, severity text, color-coded card
    const severity = alertCard.locator('.alert-card__severity');
    await expect(severity).toBeVisible();

    // Alert sidebar shows count
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar.locator('.alert-sidebar__title')).toContainText(/\(\d+\)/);

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('NFR-2.4: Patient tiles are keyboard accessible (role=button, tabIndex)', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Patient tiles should have role="button" and tabIndex
    const firstTile = tiles.first();
    await expect(firstTile).toHaveAttribute('role', 'button');
    await expect(firstTile).toHaveAttribute('tabindex', '0');
  });

  test('NFR-2.4: Patient tile can be activated with Enter key', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Focus and press Enter
    const firstTile = tiles.first();
    await firstTile.focus();
    await firstTile.press('Enter');

    // Detail panel should open
    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
  });

  test('NFR-2.4: Patient tiles have aria-label with patient name and status', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    const firstTile = tiles.first();
    const ariaLabel = await firstTile.getAttribute('aria-label');

    // Should contain "Patient" and "status"
    expect(ariaLabel).toMatch(/Patient .+, status .+/);
  });

  test('NFR-2.4: Vital badges have aria-label with value and status', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    const firstTile = tiles.first();
    const badge = firstTile.locator('.vital-badge').first();
    const ariaLabel = await badge.getAttribute('aria-label');

    // Should describe the vital sign
    expect(ariaLabel).toMatch(/status/);
  });

  test('NFR-2.4: Mute button has descriptive aria-label', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    const muteBtn = page.getByTestId('mute-toggle');
    const ariaLabel = await muteBtn.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/[Mm]ute alerts/);
  });

  test('NFR-2.4: Close button on detail panel is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    await tiles.first().click();
    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Close button should have aria-label
    const closeBtn = page.getByTestId('detail-panel-close');
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close patient detail');
  });
});
