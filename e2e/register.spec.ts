import { test, expect } from '@playwright/test';

test.describe('Registration Screen', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show confirm password field when switching to register view', async ({ page }) => {
    // 1. Klicke auf den Link/Button, um zur Registrierung zu wechseln
    // Wir suchen nach Textteilen, die den Wechsel auslösen
    await page.click('text=hier registrieren'); // oder der Text aus t('register_here')

    // 2. Warte kurz auf die Animation/Render
    await page.waitForTimeout(500);

    // 3. Suche nach Passwort-Input-Feldern
    // Da wir placeholder benutzen, können wir danach suchen oder nach type="password"
    const passwordFields = page.locator('input[type="password"]');
    
    // Wir erwarten 2 Felder: Passwort und Passwort bestätigen
    await expect(passwordFields).toHaveCount(2);

    // Optional: Prüfen, ob das neue Feld den richtigen Placeholder hat
    await expect(page.getByPlaceholder('Passwort bestätigen')).toBeVisible();
  });
});