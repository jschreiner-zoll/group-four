/**
 * Test Case 12: WebSocket Connection Status
 * Verifies connection indicator reflects WebSocket state.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded } = require('./helpers');

test.describe('12. WebSocket Connection Status', () => {
  test('shows Connected status on page load', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    // Should show "Connected" text
    await expect(page.locator('.connection-status')).toContainText('Connected');
  });

  test('connection dot is visible', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const dot = page.locator('.connection-dot');
    await expect(dot).toBeVisible();

    // Should NOT have the disconnected class when connected
    await expect(dot).not.toHaveClass(/connection-dot--disconnected/);
  });

  test('WebSocket delivers data after connection', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    // Verify we're receiving data by checking vitals appear
    const grid = page.getByTestId('patient-grid');
    const firstTile = grid.locator('[data-testid^="patient-tile-"]').first();
    await firstTile.locator('.vital-badge').first().waitFor({ state: 'visible', timeout: 10000 });

    // Data is flowing — connection is working
    const badges = firstTile.locator('.vital-badge');
    const count = await badges.count();
    expect(count).toBe(7);
  });
});
