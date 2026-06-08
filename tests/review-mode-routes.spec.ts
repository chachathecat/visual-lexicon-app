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
] as const;

const oneMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();
const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const oneDayFromNow = () =>
  new Date(Date.now() + 24 * 60 * 60_000).toISOString();

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
  },
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(({ savedWords, reviewState }) => {
    localStorage.setItem(
      'vlx_saved_words_v1',
      JSON.stringify(savedWords ?? {}),
    );
    localStorage.setItem(
      'vlx_review_state_v1',
      JSON.stringify(reviewState ?? {}),
    );
    localStorage.setItem('vlx_review_events_v1', '[]');
    localStorage.setItem('vlx_daily_stats_v1', '{}');
  }, values);
}

async function readLocalJson<T = unknown>(
  page: Page,
  key: string,
): Promise<T | null> {
  return await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, key);
}

async function answerFirstCard(page: Page) {
  await expect(page.locator('.review-session')).toBeVisible({ timeout: 15000 });

  const firstChoice = page.locator('.review-option').first();

  await expect(firstChoice).toBeVisible();
  await firstChoice.click();
  await expect(page.locator('.review-feedback')).toBeVisible();
}

async function expectLastReviewEvent(page: Page) {
  await expect
    .poll(async () => {
      const events = await readLocalJson<unknown[]>(
        page,
        'vlx_review_events_v1',
      );

      return Array.isArray(events) ? events.length : 0;
    })
    .toBeGreaterThan(0);

  const events = await readLocalJson<Record<string, unknown>[]>(
    page,
    'vlx_review_events_v1',
  );

  expect(Array.isArray(events)).toBe(true);

  return events?.[events.length - 1] ?? {};
}

test.describe('Visual Lexicon review route mode contract', () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test('/review renders without crashing', async ({ page }) => {
    const response = await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Five cards for today's memory loop/i }),
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      'This page could not be found',
    );
  });

  test('/review?mode=saved renders from saved words', async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
    });

    await page.goto(`${baseUrl}/review?mode=saved`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { name: /Review words from your saved library/i }),
    ).toBeVisible();
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Dissonance' })).toBeVisible();
  });

  test('/review?mode=due selects items due now', async ({ page }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: 'obfuscate',
          word: 'Obfuscate',
          definition: 'To make something unclear or difficult to understand.',
          box: 1,
          mastery: 'Learning',
          correct: 1,
          nextDueAt: oneMinuteAgo(),
        }),
        lucid: makeReviewStateItem({
          slug: 'lucid',
          word: 'Lucid',
          definition: 'Clear and easy to understand.',
          box: 2,
          mastery: 'Learning',
          correct: 2,
          nextDueAt: oneDayFromNow(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review?mode=due`, {
      waitUntil: 'networkidle',
    });
    await answerFirstCard(page);

    const event = await expectLastReviewEvent(page);

    expect(event.slug).toBe('obfuscate');
    expect(event.questionType).toBe('due_review');
  });

  test('/review?mode=weak selects weakScore or Weak mastery items', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        abundance: makeReviewStateItem({
          slug: 'abundance',
          word: 'Abundance',
          definition: 'A large quantity of something useful or valuable.',
          mastery: 'Learning',
          correct: 3,
          wrong: 1,
          weakScore: 0.2,
          nextDueAt: oneDayFromNow(),
        }),
        resilient: makeReviewStateItem({
          slug: 'resilient',
          word: 'Resilient',
          definition: 'Able to recover after pressure, shock, or difficulty.',
          mastery: 'Learning',
          correct: 4,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review?mode=weak`, {
      waitUntil: 'networkidle',
    });
    await answerFirstCard(page);

    const event = await expectLastReviewEvent(page);

    expect(event.slug).toBe('abundance');
    expect(event.questionType).toBe('weak_review');
  });

  test('/review?mode=word&slug=dissonance renders a focused session', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { name: /Review one word in focus/i }),
    ).toBeVisible();
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Dissonance' })).toBeVisible();
  });

  test('/review?mode=hub&hub=academic-vocabulary&limit=10 renders a hub session', async ({
    page,
  }) => {
    await page.goto(
      `${baseUrl}/review?mode=hub&hub=academic-vocabulary&limit=10`,
      { waitUntil: 'networkidle' },
    );

    await expect(
      page.getByRole('heading', { name: /Review a vocabulary hub/i }),
    ).toBeVisible();
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });

    const cardHeading = page.getByRole('heading', { name: /Card 1 of \d+/ });

    await expect(cardHeading).toBeVisible();
    const headingText = await cardHeading.innerText();
    const totalCards = Number(headingText.match(/Card 1 of (\d+)/)?.[1] ?? 0);

    expect(totalCards).toBeGreaterThan(0);
    expect(totalCards).toBeLessThanOrEqual(10);
  });

  test('route mode answers still write review events and daily stats', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance`, {
      waitUntil: 'networkidle',
    });
    await answerFirstCard(page);

    const event = await expectLastReviewEvent(page);
    const dailyStats = await readLocalJson<Record<string, { reviewed?: number }>>(
      page,
      'vlx_daily_stats_v1',
    );
    const reviewedCount = Object.values(dailyStats ?? {}).reduce(
      (sum, item) => sum + (typeof item.reviewed === 'number' ? item.reviewed : 0),
      0,
    );

    expect(event.slug).toBe('dissonance');
    expect(reviewedCount).toBeGreaterThan(0);
  });

  test('normal /review completion does not write pack progress without packId', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
    });

    await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
    });
    await answerFirstCard(page);

    await page.getByRole('button', { name: 'View summary' }).click();
    await expect(
      page.getByRole('heading', { name: 'Session summary' }),
    ).toBeVisible();

    const packProgress = await readLocalJson(
      page,
      'vlx_pack_progress_v1',
    );

    expect(packProgress).toBeNull();
  });

  test('missing focused word shows a safe empty state', async ({ page }) => {
    await page.goto(`${baseUrl}/review?mode=word&slug=missing-route-word`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { name: /Word not found/i })).toBeVisible();
    await expect(page.locator('.review-session')).toHaveCount(0);
  });
});
