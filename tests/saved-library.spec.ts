import { expect, test, type Page } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const storageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  'vlx_pack_progress_v1',
  'vlx_plan_state_v1',
  'vlx_upgrade_interest_v1',
] as const;

const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const oneMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    source: 'word_page',
    savedAt: oneHourAgo(),
    ...overrides,
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === 'string' ? overrides.createdAt : oneHourAgo();

  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    box: 0,
    mastery: 'New',
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: createdAt,
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedVlxLocalStorage(
  page: Page,
  values: {
    savedWords?: Record<string, unknown>;
    reviewState?: Record<string, unknown>;
    reviewEvents?: unknown[];
  },
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(({ savedWords, reviewState, reviewEvents }) => {
    localStorage.setItem(
      'vlx_saved_words_v1',
      JSON.stringify(savedWords ?? {}),
    );
    localStorage.setItem(
      'vlx_review_state_v1',
      JSON.stringify(reviewState ?? {}),
    );
    localStorage.setItem(
      'vlx_review_events_v1',
      JSON.stringify(reviewEvents ?? []),
    );
    localStorage.setItem('vlx_daily_stats_v1', '{}');
  }, values);
}

async function waitForSavedSlug(page: Page, slug: string) {
  await page.waitForFunction(
    (targetSlug) => {
      const rawSaved = localStorage.getItem('vlx_saved_words_v1');
      const rawState = localStorage.getItem('vlx_review_state_v1');

      if (!rawSaved || !rawState) return false;

      try {
        const saved = JSON.parse(rawSaved);
        const state = JSON.parse(rawState);

        return Boolean(saved?.[targetSlug] && state?.[targetSlug]);
      } catch {
        return false;
      }
    },
    slug,
    { timeout: 15000 },
  );
}

test.describe('Saved library live local state', () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test('saved words appear on /saved after /save', async ({ page }) => {
    const response = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: 'domcontentloaded' },
    );

    expect(response?.status()).toBe(200);
    await waitForSavedSlug(page, 'dissonance');

    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: 'Saved Library' }),
    ).toBeVisible();

    const card = page
      .locator('.saved-word-card')
      .filter({ hasText: 'Dissonance' });

    await expect(card).toBeVisible();
    await expect(card).toContainText(
      'A clash between sounds, ideas, or feelings.',
    );
    await expect(card).toContainText('New');
    await expect(card).toContainText('Box 0');
    await expect(page.locator('body')).not.toContainText('mock words');
  });

  test('empty state is honest after localStorage clear', async ({ page }) => {
    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: 'No saved words in this browser' }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText(
      'This page does not show sample words as saved.',
    );
    await expect(page.locator('body')).not.toContainText('Dissonance');
    await expect(page.locator('body')).not.toContainText('Abundance');
    await expect(page.locator('body')).not.toContainText('Lucid');
    await expect(page.locator('body')).not.toContainText('mock words');
  });

  test('saved entries link to review and word detail', async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          box: 1,
          mastery: 'Learning',
          correct: 1,
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });

    const header = page.locator('.page-header');
    const card = page
      .locator('.saved-word-card')
      .filter({ hasText: 'Dissonance' });

    await expect(
      header.getByRole('link', { name: 'Review saved' }),
    ).toHaveAttribute('href', '/review?mode=saved');
    await expect(
      header.getByRole('link', { name: 'Due review' }),
    ).toHaveAttribute('href', '/review?mode=due');
    await expect(
      header.getByRole('link', { name: 'Weak words' }),
    ).toHaveAttribute('href', '/review?mode=weak');
    await expect(
      card.getByRole('link', { name: 'Word detail' }),
    ).toHaveAttribute('href', '/word/dissonance');
    await expect(
      card.getByRole('link', { name: 'Review saved' }),
    ).toHaveAttribute('href', '/review?mode=saved');
  });

  test('saved entries show alias_search and extension source labels', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        obfuscate: makeSavedWord({
          slug: 'obfuscate',
          word: 'Obfuscate',
          image: 'https://cdn.visuallexicon.org/images/obfuscate.webp',
          definition: 'To make something unclear or difficult to understand.',
          hub: 'academic-vocabulary',
          source: 'alias_search',
        }),
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
          image: 'https://cdn.visuallexicon.org/images/lucid.webp',
          definition: 'Clear and easy to understand.',
          hub: 'academic-vocabulary',
          source: 'extension',
        }),
      },
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: 'obfuscate',
          word: 'Obfuscate',
          definition: 'To make something unclear or difficult to understand.',
          box: 0,
          mastery: 'Weak',
          correct: 1,
          wrong: 2,
          weakScore: 0.72,
        }),
      },
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });

    const aliasCard = page
      .locator('.saved-word-card')
      .filter({ hasText: 'Obfuscate' });
    const extensionCard = page
      .locator('.saved-word-card')
      .filter({ hasText: 'Lucid' });

    await expect(aliasCard).toContainText('Source: Alias search');
    await expect(aliasCard).toContainText('Weak');
    await expect(aliasCard).toContainText('Box 0');
    await expect(aliasCard).toContainText('Weak 72%');
    await expect(extensionCard).toContainText('Source: Extension');
    await expect(extensionCard).toContainText('No review state yet');
    await expect(extensionCard).not.toContainText('Mastered');
  });

  test('saved-only entries do not show fake mastery', async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
          image: 'https://cdn.visuallexicon.org/images/lucid.webp',
          definition: 'Clear and easy to understand.',
          hub: 'academic-vocabulary',
        }),
      },
      reviewState: {},
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });

    const card = page.locator('.saved-word-card').filter({ hasText: 'Lucid' });

    await expect(card).toBeVisible();
    await expect(card).toContainText('No review state yet');
    await expect(card).not.toContainText('Mastered');
    await expect(card).not.toContainText('Box 5');
    await expect(card).not.toContainText('Box 0');
  });
});
