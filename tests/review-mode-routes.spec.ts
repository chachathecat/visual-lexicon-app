import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import {
  buildExtensionReviewUrl,
  buildExtensionSaveUrl,
  isExtensionSource,
  normalizeExtensionSource,
} from '../src/lib/extension/bridge';
import {
  VLX_ANALYTICS_EVENTS,
  type VlxAnalyticsEventInput,
} from '../src/lib/analytics';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const workspaceRoot = process.cwd();

const storageKeys = [
  'vlx_saved_words_v1',
  'vlx_review_state_v1',
  'vlx_review_events_v1',
  'vlx_daily_stats_v1',
  'vlx_pack_progress_v1',
  'vlx_plan_state_v1',
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

async function answerFirstCard(page: Page, confidence = /I knew it/i) {
  await expect(page.locator('.review-session')).toBeVisible({ timeout: 15000 });

  const firstChoice = page.locator('.review-option').first();

  await expect(firstChoice).toBeVisible();
  await firstChoice.click();
  await expect(
    page.getByRole('heading', { name: 'How did that recall feel?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: confidence }).click();
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

  test('extension bridge URL helper builds app-side routes', () => {
    expect(buildExtensionSaveUrl(' Dissonance ')).toBe(
      '/save?slug=dissonance&source=extension',
    );
    expect(buildExtensionReviewUrl({ mode: 'saved' })).toBe(
      '/review?mode=saved&source=extension',
    );
    expect(buildExtensionReviewUrl({ mode: 'due' })).toBe(
      '/review?mode=due&source=extension',
    );
    expect(
      buildExtensionReviewUrl({
        mode: 'word',
        slug: 'Dissonance',
      }),
    ).toBe('/review?mode=word&slug=dissonance&source=extension');
    expect(
      buildExtensionReviewUrl({
        mode: 'hub',
        hub: 'Academic-Vocabulary',
        limit: 10,
      }),
    ).toBe(
      '/review?mode=hub&hub=academic-vocabulary&limit=10&source=extension',
    );
    expect(normalizeExtensionSource(' Extension ')).toBe('extension');
    expect(isExtensionSource('word_page')).toBe(false);
  });

  test('analytics event types accept extension bridge events', () => {
    const openAppPayload = {
      source: 'extension',
      slug: 'dissonance',
      mode: 'word',
      userState: 'guest',
      pagePath: '/review?mode=word&slug=dissonance&source=extension',
      eventId: 'evt_extension_open_app',
      eventTime: '2026-06-08T00:00:00.000Z',
    } satisfies VlxAnalyticsEventInput<
      typeof VLX_ANALYTICS_EVENTS.extensionOpenApp
    >;
    const reviewStartPayload = {
      source: 'extension',
      mode: 'due',
      userState: 'guest',
      pagePath: '/review?mode=due&source=extension',
    } satisfies VlxAnalyticsEventInput<
      typeof VLX_ANALYTICS_EVENTS.extensionReviewStart
    >;

    expect(VLX_ANALYTICS_EVENTS.extensionOpenApp).toBe(
      'vlx_extension_open_app',
    );
    expect(VLX_ANALYTICS_EVENTS.extensionSaveClick).toBe(
      'vlx_extension_save_click',
    );
    expect(VLX_ANALYTICS_EVENTS.extensionReviewStart).toBe(
      'vlx_extension_review_start',
    );
    expect(VLX_ANALYTICS_EVENTS.extensionQuizLaterClick).toBe(
      'vlx_extension_quiz_later_click',
    );
    expect(openAppPayload).toMatchObject({
      source: 'extension',
      slug: 'dissonance',
      mode: 'word',
      userState: 'guest',
    });
    expect(reviewStartPayload).toMatchObject({
      source: 'extension',
      mode: 'due',
      userState: 'guest',
    });
  });

  test('/review renders without crashing', async ({ page }) => {
    const response = await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', {
        name: /A focused recall session for today's memory loop/i,
      }),
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
      page.getByRole('heading', { name: /Recall words from your saved library/i }),
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
    expect(event.confidence).toBe('knew');
  });

  test('/review/due renders due mode from the direct route', async ({ page }) => {
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
      },
    });

    const response = await page.goto(`${baseUrl}/review/due`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Review the cards due now/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card 1 of 1' })).toBeVisible();
  });

  test('/review?mode=due&source=extension renders and preserves source analytics', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
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
      },
    });

    const response = await page.goto(
      `${baseUrl}/review?mode=due&source=extension`,
      { waitUntil: 'networkidle' },
    );

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Review the cards due now/i }),
    ).toBeVisible();
    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });

    await page.waitForFunction(
      () => {
        const dataLayer = (window as Window & { dataLayer?: unknown[] })
          .dataLayer;

        if (!Array.isArray(dataLayer)) return false;

        return dataLayer.some((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return false;
          }

          const event = item as Record<string, unknown>;

          return (
            event.event === 'vlx_review_start' &&
            event.mode === 'due' &&
            event.source === 'extension'
          );
        });
      },
      { timeout: 15000 },
    );

    const analyticsEvents = await page.evaluate(() => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;

      if (!Array.isArray(dataLayer)) return [];

      return dataLayer.filter((item): item is Record<string, unknown> => {
        return Boolean(
          item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            (item as Record<string, unknown>).event === 'vlx_review_start',
        );
      });
    });

    expect(
      analyticsEvents.some(
        (event) =>
          event.event === 'vlx_review_start' &&
          event.mode === 'due' &&
          event.source === 'extension',
      ),
    ).toBe(true);
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

  test('/review/weak renders weak mode from the direct route', async ({
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
      },
    });

    const response = await page.goto(`${baseUrl}/review/weak`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Repair fragile recall/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card 1 of 1' })).toBeVisible();
  });

  test('confidence UI appears before feedback and persists on review events', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
      },
    });

    await page.goto(`${baseUrl}/review?mode=saved`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('button', { name: 'Dissonance' }).click();
    await expect(
      page.getByRole('heading', { name: 'How did that recall feel?' }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText(
      'One saved card at a time. Confidence is required before memory state updates.',
    );
    await expect(page.locator('.track-b-page-header__aside')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /I knew it/i })).toBeVisible();
    await expect(page.locator('.review-feedback')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /I guessed/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /I forgot/i })).toBeVisible();

    const eventsBefore = await readLocalJson<unknown[]>(
      page,
      'vlx_review_events_v1',
    );

    expect(eventsBefore).toEqual([]);

    await page.getByRole('button', { name: /I guessed/i }).click();
    await expect(page.locator('.review-feedback')).toBeVisible();
    await expect(page.locator('.review-feedback')).toContainText(
      'Memory state updated from this answer and confidence.',
    );

    const event = await expectLastReviewEvent(page);

    expect(event).toMatchObject({
      slug: 'dissonance',
      selected: 'Dissonance',
      result: 'correct',
      confidence: 'guessed',
      boxBefore: 0,
      boxAfter: 0,
    });
  });

  test('guessed correct answers do not inflate the SRS box', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          slug: 'dissonance',
          word: 'Dissonance',
          definition: 'A clash between sounds, ideas, or feelings.',
          box: 2,
          mastery: 'Learning',
          correct: 2,
          wrong: 0,
          weakScore: 0.2,
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/due`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('button', { name: 'Dissonance' }).click();
    await page.getByRole('button', { name: /I guessed/i }).click();

    const event = await expectLastReviewEvent(page);
    const reviewState = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, 'vlx_review_state_v1');

    expect(event).toMatchObject({
      slug: 'dissonance',
      confidence: 'guessed',
      boxBefore: 2,
      boxAfter: 2,
    });
    expect(reviewState?.dissonance?.box).toBe(2);
    expect(reviewState?.dissonance?.mastery).not.toBe('Mastered');
  });

  test('fallback distractors are labeled when no confusable data exists', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        customword: makeSavedWord({
          slug: 'customword',
          word: 'Customword',
          definition: 'A learner supplied word without pack distractors.',
          hub: 'custom',
        }),
      },
    });

    await page.goto(`${baseUrl}/review?mode=saved`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.review-session')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('.review-v2-answer-heading')).toContainText(
      'Static pack fallback candidates',
    );
  });

  test('/review/weak-sprint renders real weak words and updates SRS state', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        abundance: makeReviewStateItem({
          slug: 'abundance',
          word: 'Abundance',
          definition: 'A large quantity of something useful or valuable.',
          mastery: 'Weak',
          box: 2,
          correct: 1,
          wrong: 2,
          weakScore: 0.65,
          nextDueAt: oneDayFromNow(),
        }),
        laconic: makeReviewStateItem({
          slug: 'laconic',
          word: 'Laconic',
          definition: 'Using very few words.',
          mastery: 'Weak',
          box: 0,
          correct: 1,
          wrong: 1,
          weakScore: 0.8,
          nextDueAt: oneDayFromNow(),
        }),
        obfuscate: makeReviewStateItem({
          slug: 'obfuscate',
          word: 'Obfuscate',
          definition: 'To make something unclear or difficult to understand.',
          mastery: 'Weak',
          box: 3,
          correct: 2,
          wrong: 1,
          weakScore: 0.8,
          nextDueAt: oneDayFromNow(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/weak-sprint`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { name: /A five-card sprint for fragile recall/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Card 1 of 3' })).toBeVisible();
    await page.getByRole('button', { name: 'Laconic' }).click();
    await expect(
      page.getByRole('heading', { name: 'How did that recall feel?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: /I knew it/i }).click();
    await expect(page.locator('.review-feedback')).toBeVisible();

    const event = await expectLastReviewEvent(page);
    const reviewState = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, 'vlx_review_state_v1');
    const dailyStats = await readLocalJson<Record<string, { reviewed?: number }>>(
      page,
      'vlx_daily_stats_v1',
    );
    const reviewedCount = Object.values(dailyStats ?? {}).reduce(
      (sum, item) => sum + (typeof item.reviewed === 'number' ? item.reviewed : 0),
      0,
    );

    expect(event).toMatchObject({
      slug: 'laconic',
      word: 'Laconic',
      questionType: 'weak_review',
      result: 'correct',
      selected: 'Laconic',
      answer: 'Laconic',
      confidence: 'knew',
      weakScoreBefore: 0.8,
    });
    expect(typeof event.responseMs).toBe('number');
    expect(reviewState?.laconic).toMatchObject({
      slug: 'laconic',
      correct: 2,
      wrong: 1,
      lastQuestionType: 'weak_review',
    });
    expect(
      Number(reviewState?.laconic?.weakScore ?? 1),
    ).toBeLessThan(0.8);
    expect(reviewedCount).toBeGreaterThan(0);
  });

  test('/review/weak-sprint shows empty state when no weak words exist', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        lucid: makeReviewStateItem({
          slug: 'lucid',
          word: 'Lucid',
          definition: 'Clear and easy to understand.',
          mastery: 'Strong',
          box: 3,
          correct: 5,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/weak-sprint`, {
      waitUntil: 'networkidle',
    });

    await expect(
      page.getByRole('heading', { name: 'No weak words right now.' }),
    ).toBeVisible();
    await expect(
      page.locator('.review-v2-empty').getByRole('link', { name: 'Back to Today' }),
    ).toBeVisible();
    await expect(
      page.locator('.review-v2-empty').getByRole('link', { name: 'Browse packs' }),
    ).toBeVisible();
    await expect(page.locator('.review-session')).toHaveCount(0);
  });

  test('dashboard shows Start Weak Sprint when weak words exist', async ({
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

    const sprintLink = page.getByRole('link', { name: 'Start Weak Sprint' });

    await expect(sprintLink).toBeVisible();
    await expect(sprintLink).toHaveAttribute('href', '/review/weak-sprint');
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

  test('/review empty state does not use fake mastery or streak wording', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
    });

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);
    expect(bodyText).not.toMatch(/\bMastered\b/);
  });
});

test.describe('Review Session v2 static contract', () => {
  test('documents review session v2 and links it from README', () => {
    const docPath = join(workspaceRoot, 'docs', 'TRACK_B_REVIEW_SESSION_V2.md');
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(docPath, 'utf8');

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain('docs/TRACK_B_REVIEW_SESSION_V2.md');
    expect(doc).toContain('Review Session v2');
    expect(doc).toContain('confidence');
    expect(doc).toContain('Static pack fallback candidates');
    expect(doc).toContain('Recommended next PR: **#76 Saved Library v2**');
  });

  test('does not introduce forbidden review integrations', () => {
    const reviewFiles = [
      'src/app/review/page.tsx',
      'src/app/review/due/page.tsx',
      'src/app/review/weak/page.tsx',
      'src/app/review/weak-sprint/page.tsx',
      'src/components/views/review-session-view.tsx',
    ];
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']openai/,
      /from ["']ai/,
      /\bprocess\.env\b/,
      /\bmiddleware\b/,
    ];

    for (const relativePath of reviewFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern,
        );
      }
    }
  });
});
