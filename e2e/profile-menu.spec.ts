import { test, expect } from '@playwright/test';

// Define UserRole enum inline to avoid module resolution issues
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OWNER = 'OWNER',
}

interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isStatsPublic?: boolean;
  createdAt: number;
}

test.describe('Profile Menu Functionality', () => {

  const standardUser: User = {
      id: 'test-user',
      email: 'test@example.com',
      username: 'TestUser',
      role: UserRole.USER,
      createdAt: Date.now(),
  };

  test.beforeEach(async ({ page }) => {
    // Inject a standard user to ensure all user-level options are visible
    await page.goto('/');
    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
    }, standardUser);
    await page.reload();
    // Wait for the app to load and the profile icon to be visible
    await expect(page.locator('.lucide-clapperboard').first()).toBeVisible({ timeout: 10000 });
  });

  test('Design Lab button should be visible in profile menu for all users', async ({ page }) => {
    // 1. Click the profile avatar to open the menu
    const avatarButton = page.locator('header').getByRole('button').filter({has: page.locator('.lucide-user')});
    await expect(avatarButton).toBeVisible();
    await avatarButton.click();

    // 2. Locate the "Design Lab" button within the opened menu
    const designLabButton = page.locator('.absolute.right-0.mt-4.w-72 button', { hasText: 'Design Lab' });
    await expect(designLabButton).toBeVisible();

    // 3. Click the button and verify the DesignLabModal opens
    await designLabButton.click();
    const designLabModal = page.locator('.fixed.inset-0', { hasText: 'Design Lab' }); // Assuming the modal has this text
    await expect(designLabModal).toBeVisible();
  });

  test('Admin tools should be visible for admin user', async ({ page }) => {
    // Re-inject user as ADMIN
    const adminUser: User = { ...standardUser, role: UserRole.ADMIN };
    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
    }, adminUser);
    await page.reload();

    // 1. Click the profile avatar to open the menu
    const avatarButton = page.locator('header').getByRole('button').filter({has: page.locator('.lucide-user')});
    await expect(avatarButton).toBeVisible();
    await avatarButton.click();

    // 2. Verify admin tools are visible
    await expect(page.locator('button', { hasText: 'Benutzer' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Einstellungen' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Smart Import' })).toBeVisible();
  });

});
