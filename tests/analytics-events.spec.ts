import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  sanitizeVlxEventPayload,
  VLX_ANALYTICS_EVENTS,
  type VlxAnalyticsEventInput,
} from '../src/lib/analytics';

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

    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
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
    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  }, values);
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

async function waitForDataLayerEvent(page: Page, eventName: string) {
  await page.waitForFunction(
    (name) => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] })
        .dataLayer;

      return (
        Array.isArray(dataLayer) &&
        dataLayer.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            (item as Record<string, unknown>).event === name,
        )
      );
    },
    eventName,
    { timeout: 15000 },
  );
}

function isExpectedSaveNavigationAbort(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /net::ERR_ABORTED|frame was detached/i.test(message);
}

async function gotoSaveRoute(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (!isExpectedSaveNavigationAbort(error)) {
      throw error;
    }
  }
}

async function waitForSaveEventOrLocalState(page: Page, slug: string) {
  await page.waitForFunction(
    (targetSlug) => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] })
        .dataLayer;
      const hasSaveEvent =
        Array.isArray(dataLayer) &&
        dataLayer.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            (item as Record<string, unknown>).event === 'vlx_save_word' &&
            (item as Record<string, unknown>).slug === targetSlug,
        );

      if (hasSaveEvent) return true;

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

test.describe('Visual Lexicon paid beta analytics events', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
  });

  test('analytics helper sanitizes disallowed keys and private route data', () => {
    const unsafeInput = {
      slug: 'dissonance',
      source: 'word_page',
      route: '/save?slug=dissonance&email=learner@example.test&token=secret',
      word: 'Dissonance',
      hasLocalReviewState: true,
      hasLocalSavedWord: true,
      email: 'learner@example.test',
      authToken: 'secret',
      apiToken: 'secret',
      pageText: 'full page text',
      browserHistory: ['/private'],
      eventId: 'evt_fixed',
      eventTime: '2026-06-10T00:00:00.000Z',
    } as VlxAnalyticsEventInput<typeof VLX_ANALYTICS_EVENTS.saveWord> &
      Record<string, unknown>;

    const payload = sanitizeVlxEventPayload(
      VLX_ANALYTICS_EVENTS.saveWord,
      unsafeInput,
    );

    expect(payload).toMatchObject({
      event: 'vlx_save_word',
      eventId: 'evt_fixed',
      eventTime: '2026-06-10T00:00:00.000Z',
      route: '/save',
      slug: 'dissonance',
      source: 'word_page',
      word: 'Dissonance',
      hasLocalReviewState: true,
      hasLocalSavedWord: true,
    });
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('authToken');
    expect(payload).not.toHaveProperty('apiToken');
    expect(payload).not.toHaveProperty('pageText');
    expect(payload).not.toHaveProperty('browserHistory');
    expect(payload).not.toHaveProperty('pagePath');
    expect(Object.keys(payload)).not.toContain('sessionId');
  });

  test('/save pushes vlx_save_word without secrets', async ({ page }) => {
    await clearVlxLocalStorage(page);
    await gotoSaveRoute(
      page,
      `${baseUrl}/save?slug=dissonance&source=word_page&email=learner@example.test&token=secret`,
    );

    await waitForSaveEventOrLocalState(page, 'dissonance');
    await expect
      .poll(
        async () => {
          const events = await getDataLayerEvents(page, 'vlx_save_word');

          return Boolean(events.find((item) => item.slug === 'dissonance'));
        },
        { timeout: 15000 },
      )
      .toBe(true);

    const events = await getDataLayerEvents(page, 'vlx_save_word');
    const event = events.find((item) => item.slug === 'dissonance');

    expect(event).toMatchObject({
      event: 'vlx_save_word',
      route: '/save',
      slug: 'dissonance',
      source: 'word_page',
      result: 'saved',
      hasLocalReviewState: true,
      hasLocalSavedWord: true,
    });
    expect(event).not.toHaveProperty('email');
    expect(event).not.toHaveProperty('token');
    expect(event).not.toHaveProperty('pagePath');
  });

  test('/saved pushes vlx_saved_library_view with savedCount', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
      reviewState: {
        dissonance: makeReviewStateItem(),
      },
      reviewEvents: [{ slug: 'dissonance', createdAt: oneHourAgo() }],
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: 'networkidle' });
    await waitForDataLayerEvent(page, 'vlx_saved_library_view');

    const events = await getDataLayerEvents(page, 'vlx_saved_library_view');

    expect(events.at(-1)).toMatchObject({
      event: 'vlx_saved_library_view',
      route: '/saved',
      savedCount: 1,
      dueCount: 1,
      weakCount: 0,
      reviewEventCount: 1,
      hasLocalSavedWord: true,
      hasLocalReviewState: true,
    });
  });

  test('/word/dissonance pushes vlx_word_memory_state_view after local state read', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({ source: 'extension' }),
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: 'Weak',
          box: 2,
          wrong: 3,
          weakScore: 0.72,
        }),
      },
      reviewEvents: [{ slug: 'dissonance', createdAt: oneHourAgo() }],
    });

    await page.goto(`${baseUrl}/word/dissonance`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForDataLayerEvent(page, 'vlx_word_memory_state_view');

    const events = await getDataLayerEvents(
      page,
      'vlx_word_memory_state_view',
    );

    expect(events.at(-1)).toMatchObject({
      event: 'vlx_word_memory_state_view',
      route: '/word/dissonance',
      slug: 'dissonance',
      source: 'extension',
      mastery: 'Weak',
      reviewEventCount: 1,
      hasLocalSavedWord: true,
      hasLocalReviewState: true,
    });
  });

  test('review start, answer, and completion push local review analytics', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
      reviewState: {
        dissonance: makeReviewStateItem(),
      },
    });

    await page.goto(`${baseUrl}/review?mode=due`, {
      waitUntil: 'networkidle',
    });
    await waitForDataLayerEvent(page, 'vlx_review_start');

    const firstChoice = page.locator('.review-option').first();

    await expect(firstChoice).toBeVisible();
    await firstChoice.click();
    await expect(
      page.getByRole('heading', { name: 'How did that recall feel?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /I knew it/i }).click();
    await waitForDataLayerEvent(page, 'vlx_review_answer');

    const answerEvents = await getDataLayerEvents(page, 'vlx_review_answer');

    expect(answerEvents.at(-1)).toMatchObject({
      event: 'vlx_review_answer',
      route: '/review',
      slug: 'dissonance',
      mode: 'due',
      source: 'due',
    });
    expect(typeof answerEvents.at(-1)?.boxAfter).toBe('number');
    expect(typeof answerEvents.at(-1)?.weakScoreAfter).toBe('number');

    await page.getByRole('button', { name: /View summary/i }).click();
    await waitForDataLayerEvent(page, 'vlx_review_complete');

    const completeEvents = await getDataLayerEvents(
      page,
      'vlx_review_complete',
    );

    expect(completeEvents.at(-1)).toMatchObject({
      event: 'vlx_review_complete',
      route: '/review',
      mode: 'due',
      reviewedCount: 1,
    });
    expect(typeof completeEvents.at(-1)?.correctCount).toBe('number');
    expect(typeof completeEvents.at(-1)?.wrongCount).toBe('number');
  });

  test('pricing CTA pushes vlx_pricing_interest', async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'Preview Pro' }).click();
    await waitForDataLayerEvent(page, 'vlx_pricing_interest');

    const events = await getDataLayerEvents(page, 'vlx_pricing_interest');

    expect(events.at(-1)).toMatchObject({
      event: 'vlx_pricing_interest',
      route: '/pricing',
      source: 'pricing_page',
      plan: 'pro',
    });
  });

  test('no payment route, payment SDK, or external analytics SDK is introduced', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });
    const disallowedPackageFragments = [
      'stripe',
      'lemonsqueezy',
      'lemon-squeezy',
      'paddle',
      'posthog',
      'segment',
      'mixpanel',
      'amplitude',
      'google-analytics',
      '@vercel/analytics',
    ];

    for (const dependencyName of dependencyNames) {
      const normalizedName = dependencyName.toLowerCase();

      expect(
        disallowedPackageFragments.some((fragment) =>
          normalizedName.includes(fragment),
        ),
      ).toBe(false);
    }

    const disallowedRoutePaths = [
      'src/app/payment',
      'src/app/payments',
      'src/app/billing',
      'src/app/checkout',
      'src/app/api/payment',
      'src/app/api/payments',
      'src/app/api/billing',
      'src/app/api/checkout',
    ];

    for (const routePath of disallowedRoutePaths) {
      expect(existsSync(join(process.cwd(), routePath))).toBe(false);
    }
  });
});
