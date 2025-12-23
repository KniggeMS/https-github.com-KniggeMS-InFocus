import { test, expect } from '@playwright/test';

test.describe('User Permissions & Menu Visibility', () => {
  
  test('regular user should NOT see admin menu items', async ({ page }) => {
    // 1. Setup: Validen User generieren
    const timestamp = Math.floor(Math.random() * 10000);
    const username = `TestBot${timestamp}`;
    const email = `testbot.${timestamp}@infocus.de`;
    const password = 'Password123!';

    // --- MOCKING START ---
    // Wir fangen die Netzwerk-Anfragen an Supabase ab und simulieren erfolgreiche Antworten.
    // Das verhindert "Email not confirmed" Fehler und hält Tests isoliert.
    
    const mockUser = {
        id: 'fake-user-id-123',
        aud: 'authenticated',
        role: 'authenticated',
        email: email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { username: username },
        created_at: new Date().toISOString(),
    };

    const mockSession = {
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: mockUser,
    };

    // 1. Mock Registrierung (Return success fake user)
    await page.route('**/auth/v1/signup', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: mockUser,
                session: null // Bei Registrierung oft null, wenn Confirm nötig wäre, aber wir tun so als ob alles ok ist
            })
        });
    });

    // 2. Mock Login (Return fake session)
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSession)
        });
    });

    // 3. Mock "Get User" (Falls die App beim Reload den User prüft)
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockUser)
        });
    });
    // --- MOCKING END ---

    // 2. Registrierungs-Flow durchlaufen
    await page.goto('/');
    
    // Sicherstellen, dass wir ausgeloggt sind
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Zur Registrierung wechseln
    await page.getByText(/hier registrieren|register here/i).click();

    // Formular ausfüllen
    await page.getByPlaceholder(/vorname/i).fill('Test');
    await page.getByPlaceholder(/benutzername/i).fill(username);
    await page.getByPlaceholder(/e-mail adresse|email/i).fill(email);
    
    // Beide Passwort-Felder ausfüllen (wir wissen jetzt, dass es 2 gibt!)
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(password);
    await passwordInputs[1].fill(password); // Confirm Password

    // Absenden
    await page.click('button[type="submit"]');

    // 2b. Nach Registrierung: Wir landen wieder beim Login (AuthPage Logik)
    // Wir füllen das Login-Formular aus
    await expect(page.getByText(/willkommen zurück|welcome back/i)).toBeVisible({ timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Klicke den Button "Anmelden" oder "Log In"
    await page.locator('button').filter({ hasText: /anmelden|log in/i }).click();

    // 3. Warten auf Login/Redirect
    // Wir wissen, dass wir drin sind, wenn wir das Profilbild oder die Suche sehen
    await expect(page.locator('button:has-text("Profil")').or(page.locator('.lucide-search'))).toBeVisible({ timeout: 15000 });

    // 4. Profilmenü öffnen
    // Der Button hat oft ein User-Icon oder Avatar. Wir suchen den Button im Header.
    // Strategie: Wir suchen den Button, der das Profilbild enthält (MobileNav oder Header)
    // Da wir Desktop/Mobile testen, nehmen wir den Header-Button (oben rechts)
    // Auf Mobile ist der Avatar Button auch sichtbar.
    const profileButton = page.locator('header button').filter({ has: page.locator('img, svg.lucide-user') }).first();
    await profileButton.click();

    // 5. Assertions (Die Prüfung)
    const menu = page.locator('.absolute.right-0'); // Das Dropdown

    // Diese Buttons dürfen NICHT da sein
    await expect(menu.locator('text=Einstellungen')).not.toBeVisible();
    await expect(menu.locator('text=Smart Import')).not.toBeVisible();
    await expect(menu.locator('text=Benutzerverwaltung')).not.toBeVisible();

    // Diese Buttons MÜSSEN da sein
    await expect(menu.locator('text=Profil')).toBeVisible();
    await expect(menu.locator('text=Abmelden')).toBeVisible();
  });

});