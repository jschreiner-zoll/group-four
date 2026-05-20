/**
 * NFR-4: Healthcare UI Standards
 *
 * NFR-4.1: Dashboard follows standard RPM conventions (multi-patient grid + alert sidebar)
 * NFR-4.2: Vital signs use standard medical abbreviations (HR, BP, SpO2, RR, Temp, BG)
 * NFR-4.3: Color coding follows healthcare conventions (green/yellow/red)
 * NFR-4.4: Patient tiles follow consistent layout pattern
 */
const { test, expect } = require('@playwright/test');
const { waitForDashboardReady } = require('./helpers');

test.describe('NFR-4: Healthcare UI Standards', () => {
  test('NFR-4.1: Dashboard has multi-patient grid layout', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Grid container exists
    const grid = page.getByTestId('patient-grid');
    await expect(grid).toBeVisible();

    // Contains 10 patient tiles
    await expect(tiles).toHaveCount(10);
  });

  test('NFR-4.1: Dashboard has alert sidebar', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar).toBeVisible();

    // Sidebar has alerts title
    await expect(sidebar.locator('.alert-sidebar__title')).toBeVisible();
  });

  test('NFR-4.2: Vital signs use standard medical abbreviations', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Check that standard abbreviations are used in vital badges
    const firstTile = tiles.first();
    const tileText = await firstTile.textContent();

    // Should contain standard abbreviations
    expect(tileText).toMatch(/HR/);
    expect(tileText).toMatch(/SpO2/);
    expect(tileText).toMatch(/Temp/);
    expect(tileText).toMatch(/RR/);
    expect(tileText).toMatch(/BG/);
  });

  test('NFR-4.2: Vital signs display with appropriate units', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    const firstTile = tiles.first();
    const tileText = await firstTile.textContent();

    // Should contain standard units
    expect(tileText).toMatch(/bpm/);
    expect(tileText).toMatch(/mmHg/);
    expect(tileText).toMatch(/%/);
    expect(tileText).toMatch(/°F/);
    expect(tileText).toMatch(/\/min/);
    expect(tileText).toMatch(/mg\/dL/);
  });

  test('NFR-4.3: Vital badges have status-based CSS classes for color coding', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Vital badges should have status classes (normal, warning, or critical)
    const firstTile = tiles.first();
    const badges = firstTile.locator('.vital-badge');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      const className = await badge.getAttribute('class');
      // Should have one of the status classes
      expect(className).toMatch(/vital-badge--(normal|warning|critical)/);
    }
  });

  test('NFR-4.4: Patient tiles follow consistent layout (header, vitals, actions)', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Check first 3 tiles have consistent structure
    for (let i = 0; i < 3; i++) {
      const tile = tiles.nth(i);

      // Header with name and room
      await expect(tile.locator('.patient-tile__header')).toBeVisible();
      await expect(tile.locator('.patient-tile__name')).toBeVisible();
      await expect(tile.locator('.patient-tile__room')).toBeVisible();

      // Vitals section
      await expect(tile.locator('.patient-tile__vitals')).toBeVisible();

      // Actions section (simulation controls)
      await expect(tile.locator('.patient-tile__actions')).toBeVisible();
    }
  });

  test('NFR-4.4: All tiles have identical structure', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);

    // Every tile should have the same number of vital badges
    for (let i = 0; i < 10; i++) {
      const tile = tiles.nth(i);
      const badges = tile.locator('.vital-badge');
      await expect(badges).toHaveCount(7);
    }
  });
});
