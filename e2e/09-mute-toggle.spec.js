/**
 * Test Case 9: Mute/Unmute Toggle
 * Verifies the audio mute toggle changes state and label.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded } = require('./helpers');

test.describe('9. Mute/Unmute Toggle', () => {
  test('mute button is visible and labeled correctly', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const muteBtn = page.getByTestId('mute-toggle');
    await expect(muteBtn).toBeVisible();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');
  });

  test('clicking mute changes label to Unmute', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const muteBtn = page.getByTestId('mute-toggle');
    await muteBtn.click();

    await expect(muteBtn).toHaveAttribute('aria-label', 'Unmute alerts');
  });

  test('clicking unmute restores original label', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const muteBtn = page.getByTestId('mute-toggle');

    // Mute
    await muteBtn.click();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Unmute alerts');

    // Unmute
    await muteBtn.click();
    await expect(muteBtn).toHaveAttribute('aria-label', 'Mute alerts');
  });
});
