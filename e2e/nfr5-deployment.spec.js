/**
 * NFR-5: Deployment
 *
 * NFR-5.1: Application runs locally with minimal setup
 * NFR-5.2: No external service dependencies (fully self-contained)
 */
const { test, expect } = require('@playwright/test');
const { API_BASE, waitForDashboardReady } = require('./helpers');

test.describe('NFR-5: Deployment', () => {
  test('NFR-5.1: Frontend is accessible on localhost:3000', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
    await waitForDashboardReady(page);
  });

  test('NFR-5.1: Backend API is accessible on localhost:8000', async ({ page }) => {
    await page.goto('/');

    const response = await page.request.get(`${API_BASE}/patients`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('NFR-5.2: No external dependencies — all data generated internally', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Patients are generated internally (10 seed patients)
    const patientsResponse = await page.request.get(`${API_BASE}/patients`);
    const patients = await patientsResponse.json();
    expect(patients).toHaveLength(10);

    // Thresholds are configured internally
    const thresholdsResponse = await page.request.get(`${API_BASE}/thresholds`);
    expect(thresholdsResponse.ok()).toBeTruthy();

    // Alerts are generated internally from simulation
    const alertsResponse = await page.request.get(`${API_BASE}/alerts/history`);
    expect(alertsResponse.ok()).toBeTruthy();
  });

  test('NFR-5.2: WebSocket connects without external services', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // WebSocket should be connected (no external broker needed)
    await expect(page.locator('.connection-status')).toContainText('Connected');
  });
});
