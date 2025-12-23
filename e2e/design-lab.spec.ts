import { test, expect } from '@playwright/test';

test.describe('Design Lab', () => {
  
  test.beforeEach(async ({ page }) => {
    // Inject the specific user provided by the reporter
    const testUser = {
        id: 'test-user-design-lab',
        email: 'martin.staiger@eclipso.de',
        username: 'infocus',
        firstName: 'Martin',
        lastName: 'Staiger',
        role: 'USER', 
        isStatsPublic: false,
        createdAt: Date.now(),
        avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=infocus'
    };

    await page.goto('/');

    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
    }, testUser);

    await page.reload();
    
    // Wait for dashboard to ensure we are logged in
    await expect(page.locator('.lucide-clapperboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow changing themes and closing the modal', async ({ page }) => {
    // 1. Open Profile Menu
    // Looking for the user avatar/icon button in header
    const profileBtn = page.locator('header button').filter({ has: page.locator('img, svg.lucide-user') }).first();
    await profileBtn.click();

    // 2. Click "Design Lab"
    await page.getByText('Design Lab').click();

    // 3. Verify Modal is Open
    const modal = page.locator('text=Interface Customization');
    await expect(modal).toBeVisible();

    // 4. Test Theme Switching
    // Check initial class (should be theme-dark by default)
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-dark/);

    // Switch to Light
    await page.getByText('Daylight').click();
    await expect(html).toHaveClass(/theme-light/);

    // Switch to Glass
    await page.getByText('Glassmorphism').click();
    await expect(html).toHaveClass(/theme-glass/);

    // Switch back to Dark
    await page.getByText('Cinematic Dark').click();
    await expect(html).toHaveClass(/theme-dark/);

    // 5. Test Closing
    // Close via X button
    // The X button is usually in the top right.
    const closeBtn = page.locator('button > svg.lucide-x').first(); 
    // Wait, DesignLabModal renders an X icon inside a button.
    // Let's use a more specific selector if needed, or getByRole.
    // In DesignLabModal: <button onClick={onClose} ...><X size={20} /></button>
    // We can find it by looking for the button inside the modal container if we had a specific test-id, 
    // or just the X icon.
    // Let's try finding the button that contains the X icon.
    
    // There might be multiple X icons (SearchModal, etc.), so we need to be careful.
    // The Design Lab modal has text "Design Lab". We can scope to the modal.
    const designLabModal = page.locator('.fixed.inset-0').filter({ hasText: 'Design Lab' });
    const closeButton = designLabModal.locator('button').filter({ has: page.locator('svg.lucide-x') });
    
    await closeButton.click();

    // Verify Modal is Closed
    await expect(modal).not.toBeVisible();
  });

});