/**
 * Test Case 10: Language Switching
 * Verifies language selector changes UI labels and temperature units.
 */
const { test, expect } = require('@playwright/test');
const { waitForPatientsLoaded } = require('./helpers');

test.describe('10. Language Switching', () => {
  test('language selector is visible', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const selector = page.getByTestId('language-selector');
    await expect(selector).toBeVisible();
  });

  test('switching to Japanese translates UI labels', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    // Open language dropdown
    const selector = page.getByTestId('language-selector');
    await selector.locator('button').click();

    // Select Japanese
    await selector.locator('text=日本語').click();

    // Title should be in Japanese
    await expect(page.locator('h1')).toContainText('コネクテッドケア');

    // Alert sidebar should show Japanese label
    const sidebar = page.getByTestId('alert-sidebar');
    await expect(sidebar).toContainText('アラート');
  });

  test('switching to German translates UI labels', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    const selector = page.getByTestId('language-selector');
    await selector.locator('button').click();
    await selector.locator('text=Deutsch').click();

    await expect(page.locator('h1')).toContainText('Fernüberwachung');
  });

  test('switching back to English restores labels', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    // Switch to French first
    const selector = page.getByTestId('language-selector');
    await selector.locator('button').click();
    await selector.locator('text=Français').click();
    await expect(page.locator('h1')).toContainText('Surveillance');

    // Switch back to English
    await selector.locator('button').click();
    await selector.locator('text=English').click();
    await expect(page.locator('h1')).toContainText('Connected Care');
  });

  test('language selection persists across page reload', async ({ page }) => {
    await page.goto('/');
    await waitForPatientsLoaded(page);

    // Switch to Spanish
    const selector = page.getByTestId('language-selector');
    await selector.locator('button').click();
    await selector.locator('text=Español').click();
    await expect(page.locator('h1')).toContainText('Monitoreo remoto');

    // Reload page
    await page.reload();
    await waitForPatientsLoaded(page);

    // Should still be in Spanish
    await expect(page.locator('h1')).toContainText('Monitoreo remoto');

    // Reset to English for other tests
    const selectorAfter = page.getByTestId('language-selector');
    await selectorAfter.locator('button').click();
    await selectorAfter.locator('text=English').click();
  });
});
