/**
 * Test Case 14: API Error Handling
 * Verifies the app handles API errors gracefully.
 */
const { test, expect } = require('@playwright/test');
const { API_BASE, waitForPatientsLoaded, waitForVitalsOnTile } = require('./helpers');

test.describe('14. API Error Handling', () => {
  test('simulate condition on invalid patient returns 404', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const response = await page.request.post(
      `${API_BASE}/patients/invalid-patient-id/simulate`,
      { data: { condition: 'tachycardia' } }
    );
    expect(response.status()).toBe(404);
  });

  test('simulate with invalid condition returns 422', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);
    const firstTile = tiles.first();
    const testId = await firstTile.getAttribute('data-testid');
    const patientId = testId.replace('patient-tile-', '');

    const response = await page.request.post(
      `${API_BASE}/patients/${patientId}/simulate`,
      { data: { condition: 'invalid_condition' } }
    );
    expect(response.status()).toBe(422);
  });

  test('acknowledge with empty note returns 422', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const response = await page.request.post(
      `${API_BASE}/alerts/some-alert-id/acknowledge`,
      { data: { note: '' } }
    );
    expect(response.status()).toBe(422);
  });

  test('acknowledge non-existent alert returns 404', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const response = await page.request.post(
      `${API_BASE}/alerts/non-existent-id/acknowledge`,
      { data: { note: 'Test note' } }
    );
    expect(response.status()).toBe(404);
  });

  test('get non-existent patient returns 404', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const response = await page.request.get(`${API_BASE}/patients/non-existent-id`);
    expect(response.status()).toBe(404);
  });

  test('reset non-existent patient returns 404', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const response = await page.request.post(`${API_BASE}/patients/non-existent-id/reset`);
    expect(response.status()).toBe(404);
  });

  test('app remains functional after API error', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForPatientsLoaded(page);

    // Trigger an API error
    await page.request.post(`${API_BASE}/patients/invalid-id/simulate`, {
      data: { condition: 'tachycardia' },
    });

    // App should still be functional — tiles still visible
    await expect(tiles.first()).toBeVisible();

    // Can still interact with the UI
    await tiles.first().click();
    const panel = page.getByTestId('patient-detail-panel');
    await expect(panel).toBeVisible();
  });
});
