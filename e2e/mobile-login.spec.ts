import { test, expect } from '@playwright/test';

test.describe('Mobile Login Screen', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title correctly on mobile', async ({ page }) => {
    // Prüfen, ob wir auf der Auth-Page sind (da nicht eingeloggt)
    // Suche nach dem Text "InFocus" oder "Anmelden"
    await expect(page.locator('text=InFocus')).toBeVisible();
    await expect(page.locator('text=CineLog')).toBeVisible();
  });

  test('should have email and password inputs visible', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should not have horizontal scroll (responsive check)', async ({ page }) => {
    // Prüfen, ob die Seite breiter ist als der Viewport (typischer Mobile-Fehler)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Toleranz von 1px für Subpixel-Rendering
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});