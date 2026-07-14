import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

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

function oneMinuteAgo() {
  return new Date(Date.now() - 60_000).toISOString();
}

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60_000).toISOString();
}

function oneDayFromNow() {
  return new Date(Date.now() + 24 * 60 * 60_000).toISOString();
}

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
    dailyStats?: Record<string, unknown>;
    packProgress?: Record<string, unknown>;
    reviewEvents?: unknown[];
    reviewState?: Record<string, unknown>;
    savedWords?: Record<string, unknown>;
  },
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ dailyStats, packProgress, reviewEvents, reviewState, savedWords }) => {
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

      if (packProgress) {
        localStorage.setItem(
          'vlx_pack_progress_v1',
          JSON.stringify(packProgress),
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

async function expectReviewStorageCommitted(page: Page) {
  await expect
    .poll(async () => {
      const events = await readLocalJson<unknown[]>(
        page,
        'vlx_review_events_v1',
      );

      return Array.isArray(events) ? events.length : 0;
    })
    .toBeGreaterThan(0);
}

async function answerCurrentCard(
  page: Page,
  result: 'correct' | 'wrong',
  confidence: 'I knew it' | 'I guessed' | 'I forgot' = 'I knew it',
) {
  await expect(page.locator('.review-session')).toBeVisible({ timeout: 15000 });

  const answer = (await page.locator('#review-session-title').innerText()).trim();
  const optionLabels = (await page.locator('.review-option').allInnerTexts()).map(
    (label) => label.trim(),
  );
  const selected =
    result === 'correct'
      ? answer
      : optionLabels.find((label) => label !== answer) ?? optionLabels[0];

  await page.getByRole('button', { name: selected, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'How did that recall feel?' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'I knew it' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I guessed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'I forgot' })).toBeVisible();

  const eventsBefore = await readLocalJson<unknown[]>(
    page,
    'vlx_review_events_v1',
  );

  await page.getByRole('button', { name: confidence }).click();
  await expect(page.locator('.review-feedback')).toBeVisible();

  const feedbackText = await page.locator('.review-feedback').innerText();
  const eventsAfter = await readLocalJson<unknown[]>(
    page,
    'vlx_review_events_v1',
  );

  expect(eventsAfter?.length ?? 0).toBeGreaterThan(eventsBefore?.length ?? 0);

  return feedbackText;
}

async function viewSummary(page: Page) {
  await page.getByRole('button', { name: 'View summary' }).click();
  await expect(page.locator('.review-v2-summary')).toBeVisible();
}

test.describe('Review Session v3 Focus Mode', () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test('/review loads a focused session or honest empty state', async ({
    page,
  }) => {
    const response = await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.locator('.review-session, .review-v2-empty').first(),
    ).toBeVisible({ timeout: 15000 });

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/checkout|payment|billing/i);
    expect(bodyText).not.toMatch(/public paid beta is launched/i);
    expect(bodyText).not.toMatch(/private beta is launched/i);
  });

  test('/review/due uses real due state and commits answer state events and daily stats', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          box: 0,
          mastery: 'New',
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/due`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('progressbar').getByText('Card 1 of 1'),
    ).toBeVisible();
    await expect(page.getByText('Due Review').first()).toBeVisible();
    await expect(page.getByText('Due Review').nth(1)).toBeVisible();

    const feedback = await answerCurrentCard(page, 'correct', 'I knew it');

    expect(feedback).toContain(
      'You recalled it. This memory is getting stronger.',
    );
    expect(feedback).toMatch(/Learning · due in about 1 day/);
    expect(feedback).toMatch(/memory status/i);
    expect(feedback).toMatch(/review again/i);
    expect(feedback).not.toMatch(/\bbox\b|weak score|weakScore/i);

    const events = await readLocalJson<Record<string, unknown>[]>(
      page,
      'vlx_review_events_v1',
    );
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

    expect(events).toHaveLength(1);
    expect(events?.[0]).toMatchObject({
      slug: 'dissonance',
      result: 'correct',
      confidence: 'knew',
      questionType: 'due_review',
      boxBefore: 0,
      boxAfter: 1,
    });
    expect(reviewState?.dissonance).toMatchObject({
      correct: 1,
      lastQuestionType: 'due_review',
      mastery: 'Learning',
      box: 1,
    });
    expect(reviewedCount).toBe(1);
  });

  test('/review/weak loads weak review from real weak evidence and shows weak summary evidence', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        abundance: makeReviewStateItem({
          slug: 'abundance',
          word: 'Abundance',
          definition: 'A large quantity of something useful or valuable.',
          box: 2,
          mastery: 'Weak',
          correct: 1,
          wrong: 2,
          weakScore: 0.8,
          nextDueAt: oneDayFromNow(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/weak`, { waitUntil: 'networkidle' });

    await expect(page.getByText('Weak Review').first()).toBeVisible();
    await expect(
      page.getByRole('progressbar').getByText('Card 1 of 1'),
    ).toBeVisible();

    const feedback = await answerCurrentCard(page, 'correct', 'I knew it');

    expect(feedback).toContain(
      'This word will stay in your practice queue until recall feels stronger.',
    );
    expect(feedback).toMatch(/Needs more practice · due in about 7 days/);
    expect(feedback).not.toMatch(/\bbox\b|weak score|weakScore/i);

    await viewSummary(page);
    await expect(page.getByTestId('review-weak-spotlight')).toBeVisible();
    await expect(page.getByTestId('review-weak-spotlight')).toContainText(
      'Abundance',
    );
    await expect(
      page.getByRole('link', { name: /Review Weak Words/i }),
    ).toBeVisible();
  });

  test('feedback differs for correct and wrong answers and summary counts match committed cards', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          box: 1,
          mastery: 'Learning',
          correct: 1,
          weakScore: 0,
          nextDueAt: oneMinuteAgo(),
        }),
        obfuscate: makeReviewStateItem({
          slug: 'obfuscate',
          word: 'Obfuscate',
          definition: 'To make something unclear or difficult to understand.',
          box: 1,
          mastery: 'Learning',
          correct: 1,
          wrong: 2,
          weakScore: 0.55,
          nextDueAt: oneMinuteAgo(),
        }),
      },
    });

    await page.goto(`${baseUrl}/review/due?limit=2`, {
      waitUntil: 'networkidle',
    });

    const correctFeedback = await answerCurrentCard(page, 'correct', 'I knew it');

    expect(correctFeedback).toContain(
      'You recalled it. This memory is getting stronger.',
    );
    await page.getByRole('button', { name: 'Next card' }).click();

    const wrongFeedback = await answerCurrentCard(page, 'wrong', 'I forgot');

    expect(wrongFeedback).toContain('Almost. This word will come back sooner.');
    expect(wrongFeedback).not.toBe(correctFeedback);

    await expectReviewStorageCommitted(page);
    await viewSummary(page);

    const summaryStats = page.getByTestId('review-summary-stats');

    await expect(summaryStats).toContainText('Reviewed');
    await expect(summaryStats).toContainText('2');
    await expect(summaryStats).toContainText('Correct');
    await expect(summaryStats).toContainText('1');
    await expect(summaryStats).toContainText('Try again');
    await expect(summaryStats).toContainText('1');
    await expect(summaryStats).toContainText('Improved');
    await expect(summaryStats).toContainText('moved forward');
    await expect(summaryStats).toContainText('Needs practice');
    await expect(summaryStats).not.toContainText(/weak score|real weak|\bbox\b/i);
    await expect(page.locator('.review-v2-summary__header')).toContainText(
      'You rescued 2 words from forgetting.',
    );
  });

  test('weak spotlight and weak CTA stay hidden when no weak evidence exists', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
          definition: 'Clear and easy to understand.',
        }),
      },
    });

    await page.goto(`${baseUrl}/review?mode=saved`, {
      waitUntil: 'networkidle',
    });

    await answerCurrentCard(page, 'correct', 'I knew it');
    await viewSummary(page);

    await expect(page.getByTestId('review-weak-spotlight')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /Review Weak Words/i }),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Continue Pack/i })).toHaveCount(
      0,
    );
  });

  test('Continue Pack CTA appears only from visible vlx_pack_progress_v1 evidence', async ({
    page,
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: 'lucid',
          word: 'Lucid',
          definition: 'Clear and easy to understand.',
        }),
      },
      packProgress: {
        'academic-vocabulary': {
          packId: 'academic-vocabulary',
          startedAt: oneHourAgo(),
          previewStartedAt: oneHourAgo(),
          reviewedCount: 0,
          correctCount: 0,
          source: 'packs_page',
        },
      },
    });

    await page.goto(`${baseUrl}/review?mode=saved`, {
      waitUntil: 'networkidle',
    });

    await answerCurrentCard(page, 'correct', 'I knew it');
    await viewSummary(page);

    const continuePack = page.getByRole('link', { name: /Continue Pack/i });

    await expect(continuePack).toBeVisible();
    await expect(continuePack).toHaveAttribute(
      'href',
      '/packs/academic-vocabulary',
    );
  });

  test('static safety checks block payment dependencies and forbidden route directories', () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    const forbiddenDependencies = [
      'stripe',
      'paddle',
      'lemon',
      'lemonsqueezy',
      'lemon-squeezy',
    ];
    const forbiddenRouteDirectories = [
      'src/app/checkout',
      'src/app/billing',
      'src/app/payment',
      'src/app/payments',
      'src/app/api/checkout',
      'src/app/api/billing',
      'src/app/api/payment',
      'src/app/api/payments',
    ];

    for (const dependency of forbiddenDependencies) {
      expect(dependencies, dependency).not.toHaveProperty(dependency);
    }

    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory,
      ).toBe(false);
    }
  });
});
