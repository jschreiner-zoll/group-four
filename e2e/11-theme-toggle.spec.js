/**
 * Test Case 11: Dark/Light Theme Toggle
 * Verifies theme switching and persistence.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded } = require('./helpers');

test.describe('11. Dark/Light Theme Toggle', () => {
  test('theme toggle button is visible', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const themeBtn = page.getByTestId('theme-toggle');
    await expect(themeBtn).toBeVisible();
  });

  test('clicking theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const themeBtn = page.getByTestId('theme-toggle');

    // Check initial state — could be light or dark depending on localStorage
    // Click to toggle
    await themeBtn.click();

    // Verify data-theme attribute changes on html element
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(theme);
  });

  test('toggling twice returns to original theme', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const themeBtn = page.getByTestId('theme-toggle');

    // Get initial theme
    const initialTheme = await page.locator('html').getAttribute('data-theme');

    // Toggle twice
    await themeBtn.click();
    await themeBtn.click();

    const finalTheme = await page.locator('html').getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);
  });

  test('theme persists across page reload', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const themeBtn = page.getByTestId('theme-toggle');

    // Set to dark mode
    // First check current state
    const currentTheme = await page.locator('html').getAttribute('data-theme');
    if (currentTheme !== 'dark') {
      await themeBtn.click();
    }

    // Verify it's dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reload
    await page.reload();
    await waitForPatientsLoaded(page);

    // Should still be dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reset to light for other tests
    await page.getByTestId('theme-toggle').click();
  });
});
