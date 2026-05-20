/**
 * Test Case 1: Dashboard Initial Load
 * Verifies the app loads, displays 10 patient tiles, and connects WebSocket.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded, waitForVitalsOnTile } = require('./helpers');

test.describe('1. Dashboard Initial Load', () => {
  test('displays 10 patient tiles in the grid', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await expect(tiles).toHaveCount(10);
  });

  test('shows WebSocket connected status', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);
    // Connection status should show "Connected"
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 10000 });
  });

  test('vital signs populate on tiles within 5 seconds', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    await waitForVitalsOnTile(firstTile);
    // Should have 7 vital badges
    const badges = firstTile.locator('.vital-badge');
    await expect(badges).toHaveCount(7);
  });

  test('each patient tile shows name and room', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    // Should have patient name and room text
    await expect(firstTile.locator('.patient-tile__name')).toBeVisible();
    await expect(firstTile.locator('.patient-tile__room')).toBeVisible();
  });
});
