# Test info

- Name: Simulation >> trigger condition and see alert generated
- Location: /Users/albertmiller/Code/e2e/dashboard.spec.js:55:3

# Error details

```
Error: Timed out 30000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid^="alert-card-"]').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 30000ms
  - waiting for locator('[data-testid^="alert-card-"]').first()

    at /Users/albertmiller/Code/e2e/dashboard.spec.js:81:72
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
    - text: John Smith Room 201-A Critical 128.5 bpm 126.8 mmHg 69.6 mmHg 97.9 % 97.1 °F 12.1 /min 126.5 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Maria Garcia, status Normal":
    - text: Maria Garcia Room 201-B Normal 82.3 bpm 120.5 mmHg 66.7 mmHg 86.5 % 97.8 °F 15.4 /min 91.9 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Robert Johnson, status Normal":
    - text: Robert Johnson Room 202-A Normal 67.2 bpm 105.8 mmHg 75.1 mmHg 97.9 % 103.3 °F 14.9 /min 95.2 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia" [disabled]
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Sarah Williams, status Normal":
    - text: Sarah Williams Room 202-B Normal 66 bpm 100 mmHg 74.4 mmHg 81 % 98.5 °F 12.7 /min 99.2 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient James Brown, status Critical":
    - text: James Brown Room 203-A Critical 117.5 bpm 129.8 mmHg 63 mmHg 98 % 98.4 °F 15.8 /min 130.7 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Patricia Davis, status Normal":
    - text: Patricia Davis Room 203-B Normal 76.1 bpm 115.4 mmHg 83.8 mmHg 87.3 % 97.5 °F 15.8 /min 83.6 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Michael Wilson, status Normal":
    - text: Michael Wilson Room 204-A Normal 63.2 bpm 118.6 mmHg 62.5 mmHg 95.7 % 98.6 °F 18.2 /min 114.2 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset" [disabled]
  - button "Patient Jennifer Martinez, status Normal":
    - text: Jennifer Martinez Room 204-B Normal 138.7 bpm 134.4 mmHg 76.1 mmHg 99.1 % 97.8 °F 17.7 /min 133.4 mg/dL
    - button "Tachycardia" [disabled]
    - button "Bradycardia"
    - button "Hypoxia"
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient David Anderson, status Normal":
    - text: David Anderson Room 205-A Normal 74.8 bpm 103.9 mmHg 84.1 mmHg 81.4 % 98.2 °F 12.2 /min 97.6 mg/dL
    - button "Tachycardia"
    - button "Bradycardia"
    - button "Hypoxia" [disabled]
    - button "Hyperthermia"
    - button "Hypotension"
    - button "Hyperglycemia"
    - button "Reset"
  - button "Patient Linda Thomas, status Normal":
    - text: Linda Thomas Room 205-B Normal 78.9 bpm 112.1 mmHg 80.8 mmHg 95 % 99 °F 16.8 /min 78.7 mg/dL
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
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Dashboard', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto('/');
   6 |   });
   7 |
   8 |   test('loads and displays patient grid', async ({ page }) => {
   9 |     const grid = page.getByTestId('patient-grid');
   10 |     await expect(grid).toBeVisible();
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
>  81 |     await expect(page.locator('[data-testid^="alert-card-"]').first()).toBeVisible({ timeout: 30000 });
      |                                                                        ^ Error: Timed out 30000ms waiting for expect(locator).toBeVisible()
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
  111 |     await expect(alertCard).toBeVisible({ timeout: 30000 });
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