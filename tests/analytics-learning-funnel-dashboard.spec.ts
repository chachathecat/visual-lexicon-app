import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  getLearningFunnelSnapshot,
  VLX_LEARNING_FUNNEL_STORAGE_KEYS,
  type VlxLearningFunnelRawStores,
} from '../src/lib/analytics/learning-funnel';

const now = '2026-07-06T12:00:00.000Z';
const workspaceRoot = process.cwd();

function asLocalStoragePayload(value: unknown) {
  return JSON.stringify(value);
}

function makeSavedWord(slug: string, savedAt = '2026-07-01T08:00:00.000Z') {
  return {
    slug,
    word: slug[0].toUpperCase() + slug.slice(1),
    image: `/${slug}.webp`,
    hub: 'academic-vocabulary',
    source: 'word_page',
    savedAt,
  };
}

function makeReviewStateItem(
  slug: string,
  overrides: Record<string, unknown> = {},
) {
  const updatedAt =
    typeof overrides.updatedAt === 'string'
      ? overrides.updatedAt
      : '2026-07-06T09:00:00.000Z';

  return {
    slug,
    word: slug[0].toUpperCase() + slug.slice(1),
    image: `/${slug}.webp`,
    hub: 'academic-vocabulary',
    box: 0,
    mastery: 'New',
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: '2026-07-06T08:00:00.000Z',
    weakScore: 0,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt,
    ...overrides,
  };
}

function makeReviewEvent(
  id: string,
  slug: string,
  createdAt: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    eventId: id,
    sessionId: `session-${id}`,
    slug,
    word: slug[0].toUpperCase() + slug.slice(1),
    hub: 'academic-vocabulary',
    questionType: 'due_review',
    selected: slug,
    answer: slug,
    result: 'correct',
    responseMs: 1400,
    createdAt,
    boxBefore: 1,
    boxAfter: 2,
    weakScoreBefore: 0.7,
    weakScoreAfter: 0.4,
    ...overrides,
  };
}

function snapshot(rawStores: VlxLearningFunnelRawStores = {}) {
  return getLearningFunnelSnapshot(rawStores, now);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), 'utf8'),
  ) as TValue;
}

function readRootPackageDependencies(fileName: 'package.json' | 'package-lock.json') {
  const parsed = readJsonFile<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    packages?: Record<
      string,
      {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        optionalDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      }
    >;
  }>(fileName);
  const rootPackage = fileName === 'package-lock.json' ? parsed.packages?.[''] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies,
  };
}

test.describe('Track B analytics learning funnel dashboard snapshot', () => {
  test('derives Weekly Reviewed Words from real review-event evidence', () => {
    const result = snapshot({
      vlx_review_events_v1: asLocalStoragePayload([
        makeReviewEvent('evt-1', 'dissonance', '2026-07-06T09:00:00.000Z'),
        makeReviewEvent('evt-2', 'lucid', '2026-07-05T09:00:00.000Z', {
          sessionId: 'session-shared',
        }),
        makeReviewEvent('evt-3', 'dissonance', '2026-07-04T09:00:00.000Z', {
          sessionId: 'session-shared',
          weakScoreBefore: 0.2,
          weakScoreAfter: 0.2,
        }),
        makeReviewEvent('evt-old', 'resilient', '2026-06-25T09:00:00.000Z'),
        makeReviewEvent('evt-future', 'obfuscate', '2026-07-07T09:00:00.000Z'),
      ]),
      vlx_daily_stats_v1: asLocalStoragePayload({
        '2026-07-06': {
          date: '2026-07-06',
          reviewed: 99,
          correct: 99,
          wrong: 0,
          mastered: 0,
          weakAdded: 0,
          minutes: 12,
          sessions: 8,
        },
      }),
    });

    expect(result.weeklyReviewedWords).toBe(2);
    expect(result.weeklyReviewedWordsSource).toBe('review_events');
    expect(result.reviewEventCount).toBe(4);
    expect(result.reviewCompletionCount).toBe(8);
    expect(result.weakWordRepairCount).toBe(2);
    expect(result.lastReviewAt).toBe('2026-07-06T09:00:00.000Z');
  });

  test('falls back to daily stats when review events are absent', () => {
    const result = snapshot({
      vlx_daily_stats_v1: asLocalStoragePayload({
        '2026-07-06': {
          date: '2026-07-06',
          reviewed: 3,
          correct: 2,
          wrong: 1,
          mastered: 0,
          weakAdded: 1,
          minutes: 5,
          sessions: 1,
        },
        '2026-07-02': {
          date: '2026-07-02',
          reviewed: 2,
          correct: 2,
          wrong: 0,
          mastered: 0,
          weakAdded: 0,
          minutes: 4,
          sessions: 1,
        },
        '2026-06-20': {
          date: '2026-06-20',
          reviewed: 20,
          correct: 20,
          wrong: 0,
          mastered: 0,
          weakAdded: 0,
          minutes: 20,
          sessions: 3,
        },
      }),
    });

    expect(result.weeklyReviewedWords).toBe(5);
    expect(result.weeklyReviewedWordsSource).toBe('daily_stats');
    expect(result.reviewCompletionCount).toBe(5);
  });

  test('derives saved count and Save -> Review conversion from saved words', () => {
    const result = snapshot({
      vlx_saved_words_v1: asLocalStoragePayload({
        dissonance: makeSavedWord('dissonance', '2026-07-01T08:00:00.000Z'),
        lucid: makeSavedWord('lucid', '2026-07-03T08:00:00.000Z'),
      }),
      vlx_review_events_v1: asLocalStoragePayload([
        makeReviewEvent('evt-reviewed', 'dissonance', '2026-07-02T08:00:00.000Z'),
        makeReviewEvent('evt-before-save', 'lucid', '2026-07-02T07:00:00.000Z'),
      ]),
    });

    expect(result.savedWordCount).toBe(2);
    expect(result.saveToReviewWordCount).toBe(1);
    expect(result.saveToReviewRate).toBe(0.5);
  });

  test('derives Weak and Mastered counts from review state evidence, not labels alone', () => {
    const result = snapshot({
      vlx_review_state_v1: asLocalStoragePayload({
        weak_real: makeReviewStateItem('weak_real', {
          mastery: 'Weak',
          correct: 1,
          wrong: 2,
          weakScore: 0.72,
        }),
        weak_label_only: makeReviewStateItem('weak_label_only', {
          mastery: 'Weak',
          correct: 0,
          wrong: 0,
          weakScore: 0,
        }),
        mastered_real: makeReviewStateItem('mastered_real', {
          box: 5,
          mastery: 'Mastered',
          correct: 7,
          wrong: 0,
          streakCorrect: 5,
          weakScore: 0,
          lastReviewedAt: '2026-07-01T08:00:00.000Z',
          nextDueAt: '2026-07-31T08:00:00.000Z',
        }),
        mastered_label_only: makeReviewStateItem('mastered_label_only', {
          box: 2,
          mastery: 'Mastered',
          correct: 7,
          wrong: 0,
          lastReviewedAt: '2026-07-01T08:00:00.000Z',
        }),
        mastered_box_only: makeReviewStateItem('mastered_box_only', {
          box: 5,
          mastery: 'Strong',
          correct: 7,
          wrong: 0,
          lastReviewedAt: '2026-07-01T08:00:00.000Z',
        }),
      }),
    });

    expect(result.weakWordCount).toBe(1);
    expect(result.masteredWordCount).toBe(1);
    expect(result.dueWordCount).toBe(3);
  });

  test('derives pack preview progress from vlx_pack_progress_v1', () => {
    const result = snapshot({
      vlx_pack_progress_v1: asLocalStoragePayload({
        academic: {
          packId: 'academic',
          startedAt: '2026-07-03T08:00:00.000Z',
          previewStartedAt: '2026-07-03T08:00:00.000Z',
          previewCompletedAt: '2026-07-03T08:10:00.000Z',
          reviewedCount: 10,
          correctCount: 8,
          source: 'review',
        },
        gre: {
          packId: 'gre',
          previewStartedAt: '2026-07-04T08:00:00.000Z',
          reviewedCount: 0,
          correctCount: 0,
          source: 'pack_detail',
        },
      }),
    });

    expect(result.packPreviewStartedCount).toBe(2);
    expect(result.packPreviewCompletedCount).toBe(1);
  });

  test('derives upgrade interest from vlx_upgrade_interest_v1 without entitlement', () => {
    const result = snapshot({
      vlx_upgrade_interest_v1: asLocalStoragePayload([
        {
          id: 'upgrade-1',
          plan: 'pro',
          source: 'pricing_page',
          trigger: 'hero',
          createdAt: '2026-07-06T08:00:00.000Z',
          pagePath: '/pricing',
        },
        {
          id: 'upgrade-invalid',
          plan: 'enterprise',
          source: 'pricing_page',
          createdAt: '2026-07-06T08:00:00.000Z',
          pagePath: '/pricing',
        },
      ]),
    });

    expect(result.upgradeInterestCount).toBe(1);
    expect(result.realPaidEntitlementEnabled).toBe(false);
    expect(
      result.safetyFlags.find(
        (flag) => flag.id === 'upgrade_interest_attribution_only',
      ),
    ).toMatchObject({ passed: true });
  });

  test('empty state returns zero counts without throwing', () => {
    const result = snapshot();

    expect(result).toMatchObject({
      weeklyReviewedWords: 0,
      weeklyReviewedWordsSource: 'none',
      savedWordCount: 0,
      saveToReviewWordCount: 0,
      saveToReviewRate: null,
      dueWordCount: 0,
      weakWordCount: 0,
      masteredWordCount: 0,
      reviewEventCount: 0,
      reviewCompletionCount: 0,
      weakWordRepairCount: 0,
      packPreviewStartedCount: 0,
      packPreviewCompletedCount: 0,
      upgradeInterestCount: 0,
      productionConnected: false,
      analyticsSdkConnected: false,
      realPaidEntitlementEnabled: false,
      publicPaidBetaUnblocked: false,
    });
    expect(result.safetyFlags.every((flag) => flag.passed)).toBe(true);
  });

  test('corrupt localStorage-like payloads are handled safely', () => {
    const result = snapshot({
      vlx_saved_words_v1: '{bad json',
      vlx_review_state_v1: asLocalStoragePayload([]),
      vlx_review_events_v1: asLocalStoragePayload({ not: 'an array' }),
      vlx_daily_stats_v1: asLocalStoragePayload({
        '2026-07-06': { date: 'not-a-date', reviewed: 4 },
      }),
      vlx_pack_progress_v1: asLocalStoragePayload(null),
      vlx_upgrade_interest_v1: asLocalStoragePayload([
        { id: 'bad', plan: 'pro', source: 'pricing' },
      ]),
    });

    expect(result.savedWordCount).toBe(0);
    expect(result.reviewEventCount).toBe(0);
    expect(result.weeklyReviewedWords).toBe(0);
    expect(result.corruptPayloadKeys).toEqual(
      expect.arrayContaining([
        'vlx_saved_words_v1',
        'vlx_review_state_v1',
        'vlx_review_events_v1',
      ]),
    );
    expect(
      result.safetyFlags.find(
        (flag) => flag.id === 'local_storage_payloads_parse',
      ),
    ).toMatchObject({ passed: false, severity: 'P1' });
  });

  test('no external analytics SDK is added', () => {
    const disallowedPackageFragments = [
      'posthog',
      'segment',
      'mixpanel',
      'amplitude',
      'google-analytics',
      'gtag',
      '@vercel/analytics',
      '@segment/',
      '@sentry/',
      'datadog',
      'newrelic',
    ];

    for (const fileName of ['package.json', 'package-lock.json'] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of Object.keys(dependencies)) {
        const normalizedName = dependencyName.toLowerCase();

        expect(
          disallowedPackageFragments.some((fragment) =>
            normalizedName.includes(fragment),
          ),
          `${fileName} should not include analytics SDK ${dependencyName}`,
        ).toBe(false);
      }
    }
  });

  test('no forbidden payment checkout or billing routes are added', () => {
    const forbiddenRoutePaths = [
      'src/app/payment',
      'src/app/payments',
      'src/app/billing',
      'src/app/checkout',
      'src/app/api/payment',
      'src/app/api/payments',
      'src/app/api/billing',
      'src/app/api/checkout',
    ];

    for (const routePath of forbiddenRoutePaths) {
      expect(existsSync(join(workspaceRoot, routePath)), routePath).toBe(false);
    }
  });

  test('no real paid entitlement or public paid beta unblock appears', () => {
    const result = snapshot({
      vlx_upgrade_interest_v1: asLocalStoragePayload([
        {
          id: 'upgrade-1',
          plan: 'pro',
          source: 'paywall',
          createdAt: '2026-07-06T08:00:00.000Z',
          pagePath: '/pricing',
        },
      ]),
    });
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'TRACK_B_ANALYTICS_LEARNING_FUNNEL_DASHBOARD.md'),
      'utf8',
    );

    expect(VLX_LEARNING_FUNNEL_STORAGE_KEYS).toEqual([
      'vlx_saved_words_v1',
      'vlx_review_state_v1',
      'vlx_review_events_v1',
      'vlx_daily_stats_v1',
      'vlx_pack_progress_v1',
      'vlx_upgrade_interest_v1',
    ]);
    expect(result.productionConnected).toBe(false);
    expect(result.analyticsSdkConnected).toBe(false);
    expect(result.realPaidEntitlementEnabled).toBe(false);
    expect(result.publicPaidBetaUnblocked).toBe(false);
    expect(doc).toContain('Public paid beta remains No-Go');
    expect(doc).toContain('never entitlement');
    expect(doc).not.toContain('Public paid beta is Go');
    expect(doc).not.toContain('real paid entitlement enabled');
  });
});
