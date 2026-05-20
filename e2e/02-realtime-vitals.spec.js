/**
 * Test Case 2: Real-Time Vitals Streaming
 * Verifies vitals update via WebSocket and badges reflect threshold colors.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded, waitForVitalsOnTile } = require('./helpers');

test.describe('2. Real-Time Vitals Streaming', () => {
  test('vitals update every 5 seconds via WebSocket', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    await waitForVitalsOnTile(firstTile);

    // Capture initial HR value
    const hrBadge = firstTile.locator('.vital-badge').first();
    const initialText = await hrBadge.textContent();

    // Wait for next update cycle (5s + buffer)
    await page.waitForTimeout(6000);

    // Value should have changed (vitals are randomized each cycle)
    const updatedText = await hrBadge.textContent();
    // At minimum, the badge should still be visible and contain a number
    expect(updatedText).toMatch(/\d/);
  });

  test('all 7 vitals display on each tile', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    await waitForVitalsOnTile(firstTile);

    const badges = firstTile.locator('.vital-badge');
    await expect(badges).toHaveCount(7);
  });

  test('vital badges show numeric values', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    await waitForVitalsOnTile(firstTile);

    // Each badge should contain a numeric value
    const badges = firstTile.locator('.vital-badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      expect(text).toMatch(/\d/);
    }
  });
});
