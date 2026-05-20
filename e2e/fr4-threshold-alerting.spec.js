/**
 * FR-4: Threshold-Based Alerting
 *
 * FR-4.1: System monitors all vital signs against configurable thresholds
 * FR-4.2: Default thresholds for HR, SpO2, Temp, BP, Blood Glucose
 * FR-4.3: Threshold breach generates alert with severity, vital sign, patient ID, timestamp
 * FR-4.4: Alerts delivered visually (color changes, badges, alert panel) and with audio
 * FR-4.5: Audio alerts distinguishable by severity (warning vs critical)
 */
const { test, expect } = require('@playwright/test');
const {
  API_BASE,
  waitForDashboardReady,
  getPatientIdFromTile,
  triggerCondition,
  resetPatient,
  acknowledgeAllAlerts,
  waitForAlert,
} = require('./helpers');

test.describe('FR-4: Threshold-Based Alerting', () => {
  test('FR-4.1: System monitors vital signs against configurable thresholds', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Verify thresholds endpoint returns configuration
    const response = await page.request.get(`${API_BASE}/thresholds`);
    expect(response.ok()).toBeTruthy();
    const thresholds = await response.json();

    // Should have thresholds for all monitored vitals
    expect(thresholds).toHaveProperty('heart_rate');
    expect(thresholds).toHaveProperty('blood_pressure_systolic');
    expect(thresholds).toHaveProperty('blood_pressure_diastolic');
    expect(thresholds).toHaveProperty('spo2');
    expect(thresholds).toHaveProperty('temperature');
    expect(thresholds).toHaveProperty('respiratory_rate');
    expect(thresholds).toHaveProperty('blood_glucose');
  });

  test('FR-4.2: Default thresholds include HR high/low, SpO2 low, Temp high, BP, Glucose', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    const response = await page.request.get(`${API_BASE}/thresholds`);
    const thresholds = await response.json();

    // Heart rate thresholds
    expect(thresholds.heart_rate.high_warning).toBe(100);
    expect(thresholds.heart_rate.high_critical).toBe(130);
    expect(thresholds.heart_rate.low_warning).toBe(60);

    // SpO2 thresholds
    expect(thresholds.spo2.low_warning).toBe(90);
    expect(thresholds.spo2.low_critical).toBe(85);

    // Temperature thresholds
    expect(thresholds.temperature.high_warning).toBe(100.4);
    expect(thresholds.temperature.high_critical).toBe(103);

    // BP systolic thresholds
    expect(thresholds.blood_pressure_systolic.high_critical).toBe(180);
    expect(thresholds.blood_pressure_systolic.low_warning).toBe(90);
    expect(thresholds.blood_pressure_systolic.low_critical).toBe(70);

    // Blood glucose thresholds
    expect(thresholds.blood_glucose.high_warning).toBe(180);
    expect(thresholds.blood_glucose.high_critical).toBe(250);
    expect(thresholds.blood_glucose.low_warning).toBe(70);
    expect(thresholds.blood_glucose.low_critical).toBe(54);
  });

  test('FR-4.3: Threshold breach generates alert with severity, vital sign, patient ID, timestamp', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(0);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'tachycardia');

    // Wait for alert to be generated
    await page.waitForTimeout(6000);

    // Check alert via API
    const response = await page.request.get(`${API_BASE}/alerts`);
    const alerts = await response.json();
    const patientAlerts = alerts.filter((a) => a.patient_id === patientId);

    expect(patientAlerts.length).toBeGreaterThan(0);

    const alert = patientAlerts[0];
    expect(alert).toHaveProperty('severity');
    expect(alert).toHaveProperty('vital_sign');
    expect(alert).toHaveProperty('patient_id', patientId);
    expect(alert).toHaveProperty('created_at');
    expect(alert).toHaveProperty('value');
    expect(alert).toHaveProperty('threshold_value');
    expect(['Warning', 'Critical']).toContain(alert.severity);

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-4.4: Alerts delivered visually in alert panel with color coding', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(1);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hypoxia');

    // Wait for alert to appear in UI
    const alertCard = await waitForAlert(page);

    // Alert card should have severity-based CSS class
    const cardClass = await alertCard.getAttribute('class');
    expect(cardClass).toMatch(/alert-card--(warning|critical)/);

    // Alert sidebar should be visible
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar).toBeVisible();

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-4.4: Patient tile shows alert badge when alerts are active', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(2);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hyperthermia');

    // Wait for alert generation
    await page.waitForTimeout(6000);

    // Patient tile status should change
    const statusIndicator = tile.locator('[data-testid="status-indicator-warning"], [data-testid="status-indicator-critical"]');
    await expect(statusIndicator).toBeVisible({ timeout: 15000 });

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-4.5: Mute toggle controls audio alerts', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Mute button should be visible
    const muteBtn = page.getByTestId('mute-toggle');
    await expect(muteBtn).toBeVisible();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');

    // Click to mute
    await muteBtn.click();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Unmute alerts');

    // Click to unmute
    await muteBtn.click();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');
  });
});
