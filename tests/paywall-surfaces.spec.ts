import { expect, test, type Page } from '@playwright/test';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const academicPreviewReviewHref =
  '/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview';

const storageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  'vlx_pack_progress_v1',
  'vlx_plan_state_v1',
] as const;

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60_000).toISOString();
}

function oneMinuteAgo() {
  return new Date(Date.now() - 60_000).toISOString();
}

function makeSavedWord(slug: string, index = 0) {
  return {
    slug,
    word: `Saved ${index}`,
    definition: `Saved word ${index}.`,
    hub: 'limit-test',
    source: 'manual',
    savedAt: oneHourAgo(),
  };
}

function makeSavedWords(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const slug = `saved-limit-${index}`;

    return [slug, makeSavedWord(slug, index)] as const;
  }).reduce<Record<string, unknown>>((store, [slug, word]) => {
    store[slug] = word;
    return store;
  }, {});
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === 'string' ? overrides.createdAt : oneHourAgo();

  return {
    slug: 'dissonance',
    word: 'Dissonance',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    box: 0,
    mastery: 'New',
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: oneMinuteAgo(),
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
    plan?: 'guest' | 'free' | 'lite' | 'pro';
    savedWords?: Record<string, unknown>;
    reviewState?: Record<string, unknown>;
    reviewEvents?: unknown[];
    dailyStats?: Record<string, unknown>;
  },
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ plan, savedWords, reviewState, reviewEvents, dailyStats }) => {
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
      localStorage.setItem(
        'vlx_daily_stats_v1',
        JSON.stringify(dailyStats ?? {}),
      );

      if (plan) {
        localStorage.setItem(
          'vlx_plan_state_v1',
          JSON.stringify({
            plan,
            source: 'local',
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    },
    values,
  );
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

async function completeReviewSession(page: Page) {
  for (let index = 0; index < 20; index += 1) {
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });

    const firstChoice = page.locator('.review-option').first();

    await expect(firstChoice).toBeVisible();
    await firstChoice.click();

    const nextButton = page.getByRole('button', {
      name: /Next card|View summary/i,
    });

    await expect(nextButton).toBeVisible();

    const buttonLabel = await nextButton.innerText();

    await nextButton.click();

    if (/View summary/i.test(buttonLabel)) {
      break;
    }
  }

  await expect(
    page.getByRole('heading', { name: 'Session summary' }),
  ).toBeVisible();
}

async function getDataLayerEvents(page: Page, eventName: string) {
  return await page.evaluate((name) => {
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;

    if (!Array.isArray(dataLayer)) return [];

    return dataLayer.filter((item): item is Record<string, unknown> => {
      return Boolean(
        item &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          (item as Record<string, unknown>).event === name,
      );
    });
  }, eventName);
}

test.describe('Visual Lexicon product paywall surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
  });

  test('review summary after pack preview shows exam_pack_preview_end prompt', async ({
    page,
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}${academicPreviewReviewHref}`, {
      waitUntil: 'networkidle',
    });

    await completeReviewSession(page);

    await expect(
      page.locator('[data-paywall-trigger="exam_pack_preview_end"]'),
    ).toBeVisible();
    await expect(page.locator('[data-paywall-trigger]')).toHaveCount(1);
    await expect(
      page.locator('[data-paywall-trigger="review_limit"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-paywall-trigger="mistake_explanation_locked"]'),
    ).toHaveCount(0);
  });

  test('dashboard with weak words shows weak sprint locked prompt', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: 'Weak',
          wrong: 3,
          weakScore: 0.72,
        }),
      },
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    const prompt = page.locator(
      '[data-paywall-trigger="weak_words_sprint_locked"]',
    );

    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Work through weak words first');
    await expect(prompt).toContainText('Weak Count');
    await expect(
      page.locator('[data-paywall-trigger="mastery_export_locked"]'),
    ).toHaveCount(0);
  });

  test('save limit prompt appears when saved count reaches free limit', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: makeSavedWords(49),
    });

    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: 'networkidle',
    });

    const prompt = page.locator('[data-paywall-trigger="save_limit"]');

    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Keep every saved word in review');

    const savedWords = await readLocalJson<Record<string, unknown>>(
      page,
      'vlx_saved_words_v1',
    );

    expect(savedWords?.dissonance).toBeTruthy();
    expect(Object.keys(savedWords ?? {})).toHaveLength(50);

    await expect
      .poll(async () => {
        const events = await getDataLayerEvents(page, 'vlx_paywall_view');

        return events.some(
          (event) =>
            event.source === 'save_confirmation' && event.plan === 'lite',
        );
      })
      .toBe(true);

    await prompt.getByRole('button', { name: 'Preview Lite' }).click();

    await expect
      .poll(async () => {
        const events = await getDataLayerEvents(page, 'vlx_upgrade_click');

        return events.some(
          (event) =>
            event.source === 'save_confirmation' && event.plan === 'lite',
        );
      })
      .toBe(true);
  });

  test('no prompt appears for Lite or Pro local plan when access already exists', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      plan: 'lite',
      savedWords: makeSavedWords(50),
    });

    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.locator('[data-paywall-trigger="save_limit"]'),
    ).toHaveCount(0);

    await seedVlxLocalStorage(page, {
      plan: 'pro',
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: 'Weak',
          wrong: 3,
          weakScore: 0.72,
        }),
        lucid: makeReviewStateItem({
          slug: 'lucid',
          word: 'Lucid',
          mastery: 'Mastered',
          box: 5,
          correct: 7,
          wrong: 0,
          weakScore: 0,
        }),
      },
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    await expect(page.locator('[data-paywall-trigger]')).toHaveCount(0);
  });
});
