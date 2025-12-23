import { test, expect } from '@playwright/test';

// Define types inline to avoid module resolution issues in Playwright
enum WatchStatus {
  TO_WATCH = 'TO_WATCH',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
}

enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

interface MediaItem {
  id: string;
  userId: string;
  tmdbId: number;
  imdbId?: string | null;
  title: string;
  year: number;
  type: MediaType;
  status: WatchStatus;
  isFavorite: boolean;
  rating: number;
  rtScore?: string | null;
  posterPath?: string | null;
  addedAt: number;
  genre: string[];
  plot: string;
}

test.describe('Rotten Tomatoes UI Integration', () => {

  const testUser = {
      id: 'rt-test-user',
      email: 'rt-test@infocus.de',
      username: 'RT_Tester',
      role: 'ADMIN',
  };

  const mediaItemWithRtScore: MediaItem = {
    id: '1',
    userId: 'rt-test-user',
    tmdbId: 123,
    imdbId: 'tt12345',
    title: 'Test Movie with RT Score',
    year: 2025,
    type: MediaType.MOVIE,
    status: WatchStatus.WATCHED,
    isFavorite: false,
    rating: 8.5,
    rtScore: '95%', // The important part
    posterPath: '/test-poster.jpg',
    addedAt: Date.now(),
    genre: ['Test'],
    plot: 'A test movie.'
  };

  test('should display RT score badge on MediaCard when rtScore is present', async ({ page }) => {
    // 1. Intercept the Supabase API call to fetch media items
    await page.route('**/rest/v1/media_items?*', async route => {
      // Respond with our mock data
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            ...mediaItemWithRtScore,
            // Convert camelCase to snake_case for the mock API response
            user_id: mediaItemWithRtScore.userId,
            tmdb_id: mediaItemWithRtScore.tmdbId,
            imdb_id: mediaItemWithRtScore.imdbId,
            original_title: mediaItemWithRtScore.title, // Simplified for test
            poster_path: mediaItemWithRtScore.posterPath,
            added_at: new Date(mediaItemWithRtScore.addedAt).toISOString(),
            is_favorite: mediaItemWithRtScore.isFavorite,
            rt_score: mediaItemWithRtScore.rtScore,
          }
        ]),
      });
    });

    // 2. Navigate to the app
    await page.goto('/');

    // 3. Inject test user
    await page.evaluate(({ user }) => {
      localStorage.setItem('TEST_MODE_USER', JSON.stringify(user));
    }, { user: testUser });

    // 4. Reload the page to trigger the (now mocked) data fetch
    await page.reload();

    // 5. Find the media card for our test movie
    const cardLocator = page.locator('.group').filter({ hasText: 'Test Movie with RT Score' });
    await expect(cardLocator).toBeVisible({ timeout: 10000 });

    // 6. Verify that the Rotten Tomatoes badge is rendered within that card
    const rtBadgeLocator = cardLocator.locator('div').filter({ hasText: '95%' }).first();
    
    // Check for the Zap icon, a key visual indicator
    await expect(rtBadgeLocator.locator('svg.lucide-zap')).toBeVisible();

    // Check that the score text is displayed correctly
    await expect(rtBadgeLocator).toContainText('95%');
  });});
