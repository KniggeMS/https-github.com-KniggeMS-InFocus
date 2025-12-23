import { test, expect } from '@playwright/test';

test.describe('Mobile UI Fixes', () => {
  
  // Wir nutzen einen Fake-Login State im LocalStorage, um die AuthPage zu überspringen
  test.beforeEach(async ({ page }) => {
    // Definieren des Test-Users
    const testUser = {
        id: 'test-user-mobile',
        email: 'mobile.test@infocus.de',
        username: 'MobileTester',
        firstName: 'Test',
        lastName: 'Bot',
        role: 'USER', // Standard User
        isStatsPublic: false,
        createdAt: Date.now(),
        avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=MobileTester'
    };

    // 1. Seite öffnen (damit LocalStorage verfügbar ist)
    await page.goto('/');

    // 2. Backdoor aktivieren: Fake-User in LocalStorage schreiben
    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
    }, testUser);

    // 3. Reload, damit AuthContext den Key findet
    await page.reload();
    
    // Warten bis Dashboard da ist (Indikator: Suche oder Header)
    await expect(page.locator('.lucide-clapperboard').first()).toBeVisible({ timeout: 5000 });
  });

  test('Test 2: AI Recommendation FAB should be visible on mobile', async ({ page }) => {
    // Dieser Test läuft nur auf Mobile Viewports (via Config gesteuert oder wir checken Viewport)
    if (page.viewportSize()!.width > 768) test.skip();

    // Suche nach dem FAB (runder Button mit Sparkles Icon)
    // Er ist fixed bottom-24 left-4 (laut Code)
    const fab = page.locator('button.fixed.bottom-24.left-4');
    
    await expect(fab).toBeVisible();
    // Prüfen ob Sparkles Icon drin ist
    await expect(fab.locator('.lucide-sparkles')).toBeVisible();
  });

  test('Test 1: Mobile Nav "Lists" button should open BottomSheet', async ({ page }) => {
    if (page.viewportSize()!.width > 768) test.skip();

    // 1. Suche Mobile Nav (unten) - Es ist ein Div mit fixed bottom-4
    const mobileNav = page.locator('div.fixed.bottom-4').filter({ has: page.locator('.lucide-layout-dashboard') });
    await expect(mobileNav).toBeVisible();

    // 2. Klicke auf das Listen-Icon (List oder ähnlich)
    const listBtn = mobileNav.locator('button').filter({ has: page.locator('.lucide-list') });
    await listBtn.click();

    // 3. Prüfe ob BottomSheet aufgeht
    // Wir suchen spezifisch im BottomSheet (glass-panel)
    const sheet = page.locator('.glass-panel');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('text=Meine Listen')).toBeVisible();

    // 4. Prüfe ob "Liste erstellen" Option da ist
    await expect(sheet.locator('text=Liste erstellen')).toBeVisible();
  });

});