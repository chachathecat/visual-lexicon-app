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
  'vlx_upgrade_interest_v1',
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
    await expect(
      page.getByRole('heading', { name: 'How did that recall feel?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /I knew it/i }).click();

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

  test('dashboard with weak words keeps upgrade nudge visual-only', async ({
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

    await expect(
      page.getByRole('link', { name: 'Start Weak Sprint' }),
    ).toHaveAttribute('href', '/review/weak-sprint');
    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-paywall-trigger="weak_words_sprint_locked"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-paywall-trigger="mastery_export_locked"]'),
    ).toHaveCount(0);
    await expect(page.locator('[data-paywall-trigger]')).toHaveCount(0);
    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]'),
    ).toContainText(
      'This is a visual-only upgrade note',
    );
  });

  test('save limit prompt appears when saved count reaches free limit', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: makeSavedWords(49),
    });

    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: 'domcontentloaded',
    });

    const prompt = page.locator('[data-paywall-trigger="save_limit"]');

    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Keep new saved words in review');
    await expect(
      prompt.getByRole('link', { name: 'Compare plans' }),
    ).toHaveAttribute('href', '/pricing');

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

    const pageUrlBeforeClick = page.url();

    await prompt.getByRole('button', { name: 'Preview Lite' }).click();

    await expect(page).toHaveURL(pageUrlBeforeClick);
    await expect(
      prompt.getByText('Paid beta interest noted locally. Billing is not connected.'),
    ).toBeVisible();
    const interestRecords = await readLocalJson<Record<string, unknown>[]>(
      page,
      'vlx_upgrade_interest_v1',
    );

    expect(interestRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plan: 'lite',
          source: 'save_confirmation',
          trigger: 'save_limit',
        }),
      ]),
    );
    expect(
      interestRecords?.some(
        (record) =>
          typeof record.createdAt === 'string' &&
          typeof record.pagePath === 'string' &&
          record.pagePath.startsWith('/save?slug=dissonance'),
      ),
    ).toBe(true);

    await expect
      .poll(async () => {
        const events = await getDataLayerEvents(page, 'vlx_paywall_interest');

        return events.some(
          (event) =>
            event.source === 'save_confirmation' &&
            event.plan === 'lite' &&
            event.trigger === 'save_limit',
        );
      })
      .toBe(true);
  });

  test('pricing page Lite and Pro placeholders record local paid beta interest', async ({
    page,
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

    const pricingUrl = page.url();

    await page.getByRole('button', { name: 'Join paid beta' }).click();
    await page.getByRole('button', { name: 'Request early access' }).click();

    await expect(page).toHaveURL(pricingUrl);
    await expect(
      page.getByText('Paid beta interest noted locally. Billing is not connected.'),
    ).toHaveCount(2);

    const interestRecords = await readLocalJson<Record<string, unknown>[]>(
      page,
      'vlx_upgrade_interest_v1',
    );

    expect(interestRecords).toHaveLength(2);
    expect(interestRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plan: 'lite',
          source: 'pricing_page',
          pagePath: '/pricing',
        }),
        expect.objectContaining({
          plan: 'pro',
          source: 'pricing_page',
          pagePath: '/pricing',
        }),
      ]),
    );
    expect(
      interestRecords?.every((record) => typeof record.createdAt === 'string'),
    ).toBe(true);
  });

  test('pricing CTAs stay local interest-only buttons', async ({
    page,
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('button', { name: 'Join paid beta' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Request early access' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Join paid beta' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Request early access' }),
    ).toHaveCount(0);
    await expect(page.locator('body')).toContainText(
      'records local interest only',
    );
  });

  test('no prompt appears for Lite or Pro local plan when access already exists', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      plan: 'lite',
      savedWords: makeSavedWords(50),
    });

    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: 'domcontentloaded',
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
