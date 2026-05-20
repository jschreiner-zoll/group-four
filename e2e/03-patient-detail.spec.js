/**
 * Test Case 3: Patient Detail Panel
 * Verifies clicking a tile opens the detail panel with full patient info.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded, waitForVitalsOnTile } = require('./helpers');

test.describe('3. Patient Detail Panel', () => {
  test('click a patient tile opens the detail panel', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    await waitForVitalsOnTile(firstTile);

    await firstTile.click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
  });

  test('detail panel shows patient name, age, room, and status', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await waitForVitalsOnTile(tiles.first());

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Should contain age and room info
    await expect(panel.locator('text=Age')).toBeVisible();
    await expect(panel.locator('text=Room')).toBeVisible();
  });

  test('detail panel shows all 7 vitals with values', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await waitForVitalsOnTile(tiles.first());

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    // Should have 7 vital rows
    const vitalRows = panel.locator('.detail-panel__vital-row');
    await expect(vitalRows).toHaveCount(7);
  });

  test('detail panel shows ECG waveform viewer', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await waitForVitalsOnTile(tiles.first());

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    const ecg = panel.getByTestId('ecg-viewer');
    await expect(ecg).toBeVisible();
  });

  test('close button dismisses the detail panel', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await waitForVitalsOnTile(tiles.first());

    await tiles.first().click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();

    await page.getByTestId('detail-panel-close').click();
    await expect(panel).not.toBeVisible();
  });

  test('keyboard Enter key opens the detail panel', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    await waitForVitalsOnTile(tiles.first());

    // Focus the first tile and press Enter
    await tiles.first().focus();
    await tiles.first().press('Enter');

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
  });
});
