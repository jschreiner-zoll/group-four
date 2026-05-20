const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays patient grid', async ({ page }) => {
    const grid = page.getByTestId('patient-grid');
    await expect(grid).toBeVisible();
    // Wait for patients to load (10 simulated patients)
    const tiles = grid.locator('[data-testid^="patient-tile-"]');
    await expect(tiles).toHaveCount(10, { timeout: 10000 });
  });

  test('displays real-time vitals via WebSocket', async ({ page }) => {
    // Wait for first patient tile to have vital data
    const firstTile = page.locator('[data-testid^="patient-tile-"]').first();
    await expect(firstTile).toBeVisible({ timeout: 10000 });
    // Vitals should update within 5s (WebSocket interval)
    await expect(firstTile.locator('.vital-badge')).toHaveCount(7, { timeout: 10000 });
  });

  test('opens patient detail panel on tile click', async ({ page }) => {
    const firstTile = page.locator('[data-testid^="patient-tile-"]').first();
    await expect(firstTile).toBeVisible({ timeout: 10000 });
    await firstTile.click();

    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
    // Panel shows vitals and simulation controls
    await expect(panel.locator('.detail-panel__vital-row')).toHaveCount(7);
    // Close button works
    await page.getByTestId('detail-panel-close').click();
    await expect(panel).not.toBeVisible();
  });

  test('alert sidebar is visible', async ({ page }) => {
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('mute toggle works', async ({ page }) => {
    const muteBtn = page.getByTestId('mute-toggle');
    await expect(muteBtn).toBeVisible();
    await muteBtn.click();
    // Button label should change to "Unmute alerts"
    await expect(muteBtn).toHaveAttribute('aria-label', 'Unmute alerts');
    await muteBtn.click();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');
  });
});

test.describe('Simulation', () => {
  test('trigger condition and see alert generated', async ({ page }) => {
    await page.goto('/');
    const tiles = page.locator('[data-testid^="patient-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    await expect(tiles.first().locator('.vital-badge').first()).toBeVisible({ timeout: 15000 });

    // Use patient at index 7 (unlikely to have been touched)
    const tile = tiles.nth(7);
    const testId = await tile.getAttribute('data-testid');
    const patientId = testId.replace('patient-tile-', '');

    // Acknowledge any existing alerts for this patient (so new ones will be created)
    const existingResp = await page.request.get('http://localhost:8000/api/alerts');
    const existingAlerts = await existingResp.json();
    for (const a of existingAlerts.filter((x) => x.patient_id === patientId)) {
      await page.request.post(`http://localhost:8000/api/alerts/${a.id}/acknowledge`, {
        data: { note: 'test setup' },
      });
    }

    // Trigger condition — this will generate a NEW alert on next vitals cycle
    await page.request.post(`http://localhost:8000/api/patients/${patientId}/simulate`, {
      data: { condition: 'tachycardia' },
    });

    // Wait for alert card to appear in UI (delivered via WebSocket after page loaded)
    await expect(page.locator('[data-testid^="alert-card-"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('acknowledge alert flow', async ({ page }) => {
    await page.goto('/');
    const tiles = page.locator('[data-testid^="patient-tile-"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
    await expect(tiles.first().locator('.vital-badge').first()).toBeVisible({ timeout: 15000 });

    // Use patient at index 8
    const tile = tiles.nth(8);
    const testId = await tile.getAttribute('data-testid');
    const patientId = testId.replace('patient-tile-', '');

    // Clear existing alerts for this patient
    const existingResp = await page.request.get('http://localhost:8000/api/alerts');
    const existingAlerts = await existingResp.json();
    for (const a of existingAlerts.filter((x) => x.patient_id === patientId)) {
      await page.request.post(`http://localhost:8000/api/alerts/${a.id}/acknowledge`, {
        data: { note: 'test setup' },
      });
    }

    // Trigger condition
    await page.request.post(`http://localhost:8000/api/patients/${patientId}/simulate`, {
      data: { condition: 'hypoxia' },
    });

    // Wait for alert card to appear in UI
    const alertCard = page.locator('[data-testid^="alert-card-"]').first();
    await expect(alertCard).toBeVisible({ timeout: 30000 });

    // Get alert ID and acknowledge
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    await page.getByTestId(`acknowledge-btn-${alertId}`).click();

    const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
    await expect(noteInput).toBeVisible();
    await noteInput.fill('Patient assessed, monitoring closely');
    await page.getByTestId(`acknowledge-submit-${alertId}`).click();

    // Alert should show as acknowledged
    await expect(alertCard.locator('text=Acknowledged')).toBeVisible({ timeout: 5000 });
  });
});
