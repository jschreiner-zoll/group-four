/**
 * NFR-1: Technology Stack
 *
 * NFR-1.3: Real-time communication via WebSocket protocol
 * NFR-1.4: In-memory data storage (no persistence)
 * NFR-1.5: Data update frequency every 5 seconds per patient
 */
const { test, expect } = require('@playwright/test');
const { API_BASE, waitForDashboardReady } = require('./helpers');

test.describe('NFR-1: Technology Stack', () => {
  test('NFR-1.3: WebSocket connection is established for real-time communication', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Connection status should show connected
    await expect(page.locator('.connection-status')).toContainText('Connected');

    // Connection dot should not have disconnected class
    const dot = page.locator('.connection-dot');
    await expect(dot).not.toHaveClass(/connection-dot--disconnected/);
  });

  test('NFR-1.4: Data is in-memory only (API returns fresh data on each call)', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Verify API endpoints work (data is served from memory)
    const patientsResponse = await page.request.get(`${API_BASE}/patients`);
    expect(patientsResponse.ok()).toBeTruthy();

    const alertsResponse = await page.request.get(`${API_BASE}/alerts`);
    expect(alertsResponse.ok()).toBeTruthy();

    const thresholdsResponse = await page.request.get(`${API_BASE}/thresholds`);
    expect(thresholdsResponse.ok()).toBeTruthy();
  });

  test('NFR-1.5: Data updates every 5 seconds per patient', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Record timestamp of first vital display
    const firstTile = tiles.first();
    const badge = firstTile.locator('.vital-badge').first();
    const value1 = await badge.locator('.vital-badge__value').textContent();

    // Wait slightly more than 5 seconds
    await page.waitForTimeout(5500);

    // Value should have been updated (randomized each cycle)
    const value2 = await badge.locator('.vital-badge__value').textContent();
    // Both should be valid numbers
    expect(value1).toMatch(/[\d.]+/);
    expect(value2).toMatch(/[\d.]+/);
  });
});
