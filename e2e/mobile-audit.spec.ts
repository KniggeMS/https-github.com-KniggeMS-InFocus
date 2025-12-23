import { test, expect } from '@playwright/test';

// Enums and Interfaces
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: number;
}

const standardUser: User = {
  id: 'audit-user',
  email: 'user@audit.com',
  username: 'AuditUser',
  role: UserRole.USER,
  createdAt: Date.now(),
};

const adminUser: User = {
  id: 'audit-admin',
  email: 'admin@audit.com',
  username: 'AuditAdmin',
  role: UserRole.ADMIN,
  createdAt: Date.now(),
};

// Common Selectors
const SEARCH_NAV_BTN = 'button[data-testid="search-nav-button"]';
const SEARCH_INPUT = 'input[data-testid="search-input"]';
const LISTS_NAV_BTN = 'button:has(.lucide-list)';

test.describe('Mobile Audit - Standard User', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
        localStorage.setItem('language', 'de');
    }, standardUser);
    await page.reload();
    await expect(page.locator('.lucide-clapperboard').first()).toBeVisible({ timeout: 15000 });
  });

  // --- 1. Navigation & Layout ---
  test('6 & 8: Mobile Nav & Layout', async ({ page }) => {
    const bottomNav = page.getByTestId('mobile-nav');
    await expect(bottomNav).toBeVisible();
    await expect(page.locator(SEARCH_NAV_BTN)).toBeVisible(); 
  });

  // --- 2. Discovery ---
  test('9 & 10: Search Functionality', async ({ page }) => {
    // Force click the trigger
    await page.locator(SEARCH_NAV_BTN).click({ force: true });
    
    // Explicitly wait for input to be present in DOM and visible
    const input = page.locator(SEARCH_INPUT);
    await expect(input).toBeVisible({ timeout: 10000 });
    
    await input.fill('Inception');
    await page.keyboard.press('Enter');
    await expect(page.locator('h3', { hasText: 'Inception' }).first()).toBeVisible({ timeout: 15000 });
  });

  // --- 3. Collection & List Ops ---
  test('13, 14, 15, 16: Collection Operations', async ({ page }) => {
    await page.locator(SEARCH_NAV_BTN).click({ force: true });
    const input = page.locator(SEARCH_INPUT);
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('Matrix');
    await page.keyboard.press('Enter');
    
    const result = page.locator('h3', { hasText: 'The Matrix' }).first();
    await expect(result).toBeVisible({ timeout: 15000 });
    await result.click({ force: true });
    
    // Add button in DetailView
    await page.getByRole('button', { name: /Sammlung hinzufügen/i }).click({ force: true });
    
    // Close Detail
    await page.getByTestId('close-detail').click({ force: true });
    
    // Go Home
    await page.getByTestId('mobile-nav').locator('a').first().click({ force: true });
    const card = page.locator('article', { hasText: /Matrix/i }).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    
    // Favorite
    await card.locator('.lucide-heart').click({ force: true });
    
    // Open/Close
    await card.click({ force: true });
    await expect(page.locator('h1')).toContainText('Matrix');
    await page.getByTestId('close-detail').click({ force: true });
  });

  // --- 4. Lists Operations ---
  test('17, 18, 19, 20, 21: List Operations', async ({ page }) => {
    await page.locator(LISTS_NAV_BTN).click({ force: true });
    await expect(page.getByTestId('bottom-sheet')).toBeVisible();
    
    await page.getByTestId('bottom-sheet-action').first().click({ force: true });
    await page.getByPlaceholder(/Name der Liste/i).fill('Mobile Test List');
    await page.getByTestId('submit-create-list').click({ force: true });
    
    // Verify - Give it time to sync and close sheet first
    await page.waitForTimeout(2000);
    await page.locator(LISTS_NAV_BTN).click({ force: true });
    await expect(page.getByText('Mobile Test List')).toBeVisible({ timeout: 15000 });
  });

  // --- 5. Detail View ---
  test('24-29: Detail View Features', async ({ page }) => {
    await page.locator(SEARCH_NAV_BTN).click({ force: true });
    const input = page.locator(SEARCH_INPUT);
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('Interstellar');
    await page.keyboard.press('Enter');
    await page.locator('h3', { hasText: 'Interstellar' }).first().click({ force: true });
    
    await expect(page.locator('h1')).toContainText('Interstellar');
    await page.getByTestId('tab-cast').click({ force: true });
    await expect(page.locator('.grid-cols-2')).toBeVisible();
    await page.getByTestId('tab-facts').click({ force: true });
    await expect(page.getByText(/Budget/i)).toBeVisible();
    await page.getByTestId('tab-analysis').click({ force: true });
    await expect(page.getByText(/DEEP CONTENT ANALYSIS/i)).toBeVisible({ timeout: 15000 }); 
    await expect(page.getByTestId('detail-share-button')).toBeVisible();
  });

  // --- 6. Security ---
  test('34: API Keys BLOCKED for User', async ({ page }) => {
    await page.locator('header button').filter({has: page.locator('.lucide-user')}).click({ force: true });
    await expect(page.locator('button', { hasText: 'Einstellungen' })).not.toBeVisible();
  });

});

test.describe('Mobile Audit - Admin User', () => {
  test.use({ viewport: { width: 390, height: 844 } });
    
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((user) => {
        localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
        localStorage.setItem('language', 'de');
    }, adminUser);
    await page.reload();
    await expect(page.locator('.lucide-clapperboard').first()).toBeVisible({ timeout: 15000 });
  });

  test('34, 37: Admin Access & PWA', async ({ page }) => {
    const profileBtn = page.locator('header button').filter({has: page.locator('.lucide-user')});
    await profileBtn.click({ force: true });
    await expect(page.locator('button', { hasText: 'Einstellungen' })).toBeVisible();
    await page.locator('button', { hasText: 'Einstellungen' }).click({ force: true });
    await expect(page.locator('.fixed.inset-0', { hasText: /API/i })).toBeVisible();
    await page.locator('button:has(.lucide-x)').first().click({ force: true });
  });

});
