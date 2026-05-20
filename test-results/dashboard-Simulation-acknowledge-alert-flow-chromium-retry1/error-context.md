# Test info

- Name: Simulation >> acknowledge alert flow
- Location: /Users/albertmiller/Code/e2e/dashboard.spec.js:84:3

# Error details

```
Error: Timed out 30000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid^="alert-card-"]').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 30000ms
  - waiting for locator('[data-testid^="alert-card-"]').first()

    at /Users/albertmiller/Code/e2e/dashboard.spec.js:111:29
```

# Page snapshot

```yaml
- banner:
  - heading "Connected Care — Remote Patient Monitoring" [level=1]
  - button "Select language": 🇺🇸 English ▼
  - button "Switch to dark mode":
    - img
    - text: Dark
  - text: Connected
- main:
  - button "Patient John Smith, status Critical":
    - text: John Smith Room 201-A Critical 120.4 bpm 108.5 mmHg 81.7 mmHg 96.2 % 97.6 °F 12.2 /min 110 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Maria Garcia, status Normal":
    - text: Maria Garcia Room 201-B Normal 75.9 bpm 107.1 mmHg 70.5 mmHg 81.3 % 98.4 °F 16.3 /min 112.8 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Robert Johnson, status Normal":
    - text: Robert Johnson Room 202-A Normal 89.6 bpm 114.5 mmHg 76.3 mmHg 96.5 % 102.1 °F 12.4 /min 98.9 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia" [disabled]
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Sarah Williams, status Normal":
    - text: Sarah Williams Room 202-B Normal 63.8 bpm 126.1 mmHg 81.8 mmHg 86.7 % 97.6 °F 12.4 /min 126.7 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient James Brown, status Critical":
    - text: James Brown Room 203-A Critical 107.8 bpm 123.8 mmHg 79.8 mmHg 95.3 % 98.6 °F 15.3 /min 99.9 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Patricia Davis, status Normal":
    - text: Patricia Davis Room 203-B Normal 89.2 bpm 132.2 mmHg 78.4 mmHg 86.7 % 98.7 °F 19.5 /min 88.8 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Michael Wilson, status Normal":
    - text: Michael Wilson Room 204-A Normal 91.4 bpm 105.9 mmHg 71.3 mmHg 97.6 % 99 °F 18.6 /min 122.4 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset" [disabled]
  - button "Patient Jennifer Martinez, status Normal":
    - text: Jennifer Martinez Room 204-B Normal 137.8 bpm 109.4 mmHg 80.2 mmHg 95.1 % 97.8 °F 16.5 /min 117.6 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient David Anderson, status Normal":
    - text: David Anderson Room 205-A Normal 90.7 bpm 131.1 mmHg 82.3 mmHg 85.2 % 98 °F 14.2 /min 132.7 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Linda Thomas, status Normal":
    - text: Linda Thomas Room 205-B Normal 83.4 bpm 125.3 mmHg 76.5 mmHg 96.6 % 97.9 °F 13.7 /min 84 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset" [disabled]
- complementary "Alerts":
  - text: Alerts (0)
  - button "Mute alerts":
    - img
  - paragraph: No active alerts
```

# Test source

```ts
   11 |     // Wait for patients to load (10 simulated patients)
   12 |     const tiles = grid.locator('[data-testid^="patient-tile-"]');
   13 |     await expect(tiles).toHaveCount(10, { timeout: 10000 });
   14 |   });
   15 |
   16 |   test('displays real-time vitals via WebSocket', async ({ page }) => {
   17 |     // Wait for first patient tile to have vital data
   18 |     const firstTile = page.locator('[data-testid^="patient-tile-"]').first();
   19 |     await expect(firstTile).toBeVisible({ timeout: 10000 });
   20 |     // Vitals should update within 5s (WebSocket interval)
   21 |     await expect(firstTile.locator('.vital-badge')).toHaveCount(7, { timeout: 10000 });
   22 |   });
   23 |
   24 |   test('opens patient detail panel on tile click', async ({ page }) => {
   25 |     const firstTile = page.locator('[data-testid^="patient-tile-"]').first();
   26 |     await expect(firstTile).toBeVisible({ timeout: 10000 });
   27 |     await firstTile.click();
   28 |
   29 |     const panel = page.getByTestId('patient-detail-panel');
   30 |     await expect(panel).toBeVisible();
   31 |     // Panel shows vitals and simulation controls
   32 |     await expect(panel.locator('.detail-panel__vital-row')).toHaveCount(7);
   33 |     // Close button works
   34 |     await page.getByTestId('detail-panel-close').click();
   35 |     await expect(panel).not.toBeVisible();
   36 |   });
   37 |
   38 |   test('alert sidebar is visible', async ({ page }) => {
   39 |     const sidebar = page.getByTestId('alert-sidebar');
   40 |     await expect(sidebar).toBeVisible();
   41 |   });
   42 |
   43 |   test('mute toggle works', async ({ page }) => {
   44 |     const muteBtn = page.getByTestId('mute-toggle');
   45 |     await expect(muteBtn).toBeVisible();
   46 |     await muteBtn.click();
   47 |     // Button label should change to "Unmute alerts"
   48 |     await expect(muteBtn).toHaveAttribute('aria-label', 'Unmute alerts');
   49 |     await muteBtn.click();
   50 |     await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');
   51 |   });
   52 | });
   53 |
   54 | test.describe('Simulation', () => {
   55 |   test('trigger condition and see alert generated', async ({ page }) => {
   56 |     await page.goto('/');
   57 |     const tiles = page.locator('[data-testid^="patient-tile-"]');
   58 |     await expect(tiles.first()).toBeVisible({ timeout: 10000 });
   59 |     await expect(tiles.first().locator('.vital-badge').first()).toBeVisible({ timeout: 15000 });
   60 |
   61 |     // Use patient at index 7 (unlikely to have been touched)
   62 |     const tile = tiles.nth(7);
   63 |     const testId = await tile.getAttribute('data-testid');
   64 |     const patientId = testId.replace('patient-tile-', '');
   65 |
   66 |     // Acknowledge any existing alerts for this patient (so new ones will be created)
   67 |     const existingResp = await page.request.get('http://localhost:8000/api/alerts');
   68 |     const existingAlerts = await existingResp.json();
   69 |     for (const a of existingAlerts.filter((x) => x.patient_id === patientId)) {
   70 |       await page.request.post(`http://localhost:8000/api/alerts/${a.id}/acknowledge`, {
   71 |         data: { note: 'test setup' },
   72 |       });
   73 |     }
   74 |
   75 |     // Trigger condition — this will generate a NEW alert on next vitals cycle
   76 |     await page.request.post(`http://localhost:8000/api/patients/${patientId}/simulate`, {
   77 |       data: { condition: 'tachycardia' },
   78 |     });
   79 |
   80 |     // Wait for alert card to appear in UI (delivered via WebSocket after page loaded)
   81 |     await expect(page.locator('[data-testid^="alert-card-"]').first()).toBeVisible({ timeout: 30000 });
   82 |   });
   83 |
   84 |   test('acknowledge alert flow', async ({ page }) => {
   85 |     await page.goto('/');
   86 |     const tiles = page.locator('[data-testid^="patient-tile-"]');
   87 |     await expect(tiles.first()).toBeVisible({ timeout: 10000 });
   88 |     await expect(tiles.first().locator('.vital-badge').first()).toBeVisible({ timeout: 15000 });
   89 |
   90 |     // Use patient at index 8
   91 |     const tile = tiles.nth(8);
   92 |     const testId = await tile.getAttribute('data-testid');
   93 |     const patientId = testId.replace('patient-tile-', '');
   94 |
   95 |     // Clear existing alerts for this patient
   96 |     const existingResp = await page.request.get('http://localhost:8000/api/alerts');
   97 |     const existingAlerts = await existingResp.json();
   98 |     for (const a of existingAlerts.filter((x) => x.patient_id === patientId)) {
   99 |       await page.request.post(`http://localhost:8000/api/alerts/${a.id}/acknowledge`, {
  100 |         data: { note: 'test setup' },
  101 |       });
  102 |     }
  103 |
  104 |     // Trigger condition
  105 |     await page.request.post(`http://localhost:8000/api/patients/${patientId}/simulate`, {
  106 |       data: { condition: 'hypoxia' },
  107 |     });
  108 |
  109 |     // Wait for alert card to appear in UI
  110 |     const alertCard = page.locator('[data-testid^="alert-card-"]').first();
> 111 |     await expect(alertCard).toBeVisible({ timeout: 30000 });
      |                             ^ Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
  112 |
  113 |     // Get alert ID and acknowledge
  114 |     const alertTestId = await alertCard.getAttribute('data-testid');
  115 |     const alertId = alertTestId.replace('alert-card-', '');
  116 |
  117 |     await page.getByTestId(`acknowledge-btn-${alertId}`).click();
  118 |
  119 |     const noteInput = page.getByTestId(`acknowledge-note-${alertId}`);
  120 |     await expect(noteInput).toBeVisible();
  121 |     await noteInput.fill('Patient assessed, monitoring closely');
  122 |     await page.getByTestId(`acknowledge-submit-${alertId}`).click();
  123 |
  124 |     // Alert should show as acknowledged
  125 |     await expect(alertCard.locator('text=Acknowledged')).toBeVisible({ timeout: 5000 });
  126 |   });
  127 | });
  128 |
```