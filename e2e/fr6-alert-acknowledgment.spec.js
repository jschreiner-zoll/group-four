/**
 * FR-6: Alert Acknowledgment
 *
 * FR-6.1: Clinicians can acknowledge an active alert
 * FR-6.2: Acknowledgment requires a brief text note (min 1 character)
 * FR-6.3: Acknowledged alerts move to "Acknowledged" state and remain in history
 * FR-6.4: Alert history displays original details, acknowledgment timestamp, clinician note
 * FR-6.5: Active alerts are visually distinct from acknowledged alerts
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

test.describe('FR-6: Alert Acknowledgment', () => {
  test('FR-6.1: Clinician can acknowledge an active alert via UI', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(0);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'tachycardia');

    const alertCard = await waitForAlert(page);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Click acknowledge button
    const ackBtn = page.getByTestId(`acknowledge-btn-${alertId}`);
    await expect(ackBtn).toBeVisible();
    await ackBtn.click();

    // Fill note and submit
    const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
    await noteInput.fill('Patient assessed');
    await page.getByTestId(`acknowledge-submit-${alertId}`).click();

    // Alert should show acknowledged state
    await expect(
      page.locator(`[data-testid="alert-card-${alertId}"]`).locator('text=Acknowledged')
    ).toBeVisible({ timeout: 10000 });

    // Cleanup
    await resetPatient(page, patientId);
  });

  test('FR-6.2: Acknowledgment requires a text note (submit disabled when empty)', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(1);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hypoxia');

    const alertCard = await waitForAlert(page);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Open acknowledge form
    await page.getByTestId(`acknowledge-btn-${alertId}`).click();

    // Submit button should be disabled when note is empty
    const submitBtn = page.getByTestId(`acknowledge-submit-${alertId}`);
    await expect(submitBtn).toBeDisabled();

    // Type a note — submit should become enabled
    const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
    await noteInput.fill('Noted');
    await expect(submitBtn).toBeEnabled();

    // Cleanup
    await resetPatient(page, patientId);
    await acknowledgeAllAlerts(page, patientId);
  });

  test('FR-6.2: API rejects acknowledgment with empty note', async ({ page }) => {
    await page.goto('/');
    await waitForDashboardReady(page);

    // Try to acknowledge with empty note via API
    const response = await page.request.post(`${API_BASE}/alerts/some-id/acknowledge`, {
      data: { note: '' },
    });
    expect(response.status()).toBe(422);
  });

  test('FR-6.3: Acknowledged alerts remain visible in alert history', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(2);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hyperthermia');

    // Wait for alert
    await page.waitForTimeout(6000);

    // Get alert from API
    const alertsResponse = await page.request.get(`${API_BASE}/alerts`);
    const alerts = await alertsResponse.json();
    const patientAlert = alerts.find((a) => a.patient_id === patientId);

    if (patientAlert) {
      // Acknowledge it
      await page.request.post(`${API_BASE}/alerts/${patientAlert.id}/acknowledge`, {
        data: { note: 'Test acknowledgment' },
      });

      // Check alert history
      const historyResponse = await page.request.get(`${API_BASE}/alerts/history`);
      const history = await historyResponse.json();
      const acked = history.find((a) => a.id === patientAlert.id);

      expect(acked).toBeTruthy();
      expect(acked.status).toBe('Acknowledged');
    }

    // Cleanup
    await resetPatient(page, patientId);
  });

  test('FR-6.4: Alert history shows original details, timestamp, and clinician note', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(3);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'hyperglycemia');
    await page.waitForTimeout(6000);

    // Get and acknowledge alert
    const alertsResponse = await page.request.get(`${API_BASE}/alerts`);
    const alerts = await alertsResponse.json();
    const patientAlert = alerts.find((a) => a.patient_id === patientId);

    if (patientAlert) {
      const clinicianNote = 'Blood glucose elevated, administering insulin';
      await page.request.post(`${API_BASE}/alerts/${patientAlert.id}/acknowledge`, {
        data: { note: clinicianNote },
      });

      // Verify history contains all required fields
      const historyResponse = await page.request.get(`${API_BASE}/alerts/history`);
      const history = await historyResponse.json();
      const acked = history.find((a) => a.id === patientAlert.id);

      expect(acked).toBeTruthy();
      expect(acked.vital_sign).toBeTruthy();
      expect(acked.severity).toBeTruthy();
      expect(acked.created_at).toBeTruthy();
      expect(acked.acknowledgment).toBeTruthy();
      expect(acked.acknowledgment.note).toBe(clinicianNote);
      expect(acked.acknowledgment.acknowledged_at).toBeTruthy();
    }

    // Cleanup
    await resetPatient(page, patientId);
  });

  test('FR-6.5: Active alerts are visually distinct from acknowledged alerts', async ({ page }) => {
    await page.goto('/');
    const tiles = await waitForDashboardReady(page);
    const tile = tiles.nth(4);
    const patientId = await getPatientIdFromTile(tile);

    await acknowledgeAllAlerts(page, patientId);
    await triggerCondition(page, patientId, 'tachycardia');

    const alertCard = await waitForAlert(page);
    const alertTestId = await alertCard.getAttribute('data-testid');
    const alertId = alertTestId.replace('alert-card-', '');

    // Active alert should NOT have acknowledged class
    let cardClass = await alertCard.getAttribute('class');
    expect(cardClass).not.toContain('alert-card--acknowledged');

    // Acknowledge it
    await page.getByTestId(`acknowledge-btn-${alertId}`).click();
    await page.getByTestId(`acknowledge-note-${alertId}`).fill('Addressed');
    await page.getByTestId(`acknowledge-submit-${alertId}`).click();

    // Wait for acknowledgment to process
    await page.waitForTimeout(2000);

    // Acknowledged alert should have the acknowledged class
    const ackedCard = page.locator(`[data-testid="alert-card-${alertId}"]`);
    const ackedClass = await ackedCard.getAttribute('class');
    expect(ackedClass).toContain('alert-card--acknowledged');

    // Cleanup
    await resetPatient(page, patientId);
  });
});
