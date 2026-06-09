import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  evaluateWeakWordsSprintLockedPaywall,
} from '../src/lib/paywall';
import {
  getUpgradeTarget,
  hasConfiguredUpgradeUrl,
  normalizeUpgradeSource,
} from '../src/lib/upgrade/upgrade-targets';

const upgradeEnvKeys = [
  'NEXT_PUBLIC_LITE_PAYMENT_URL',
  'NEXT_PUBLIC_PRO_PAYMENT_URL',
  'NEXT_PUBLIC_PAID_BETA_FORM_URL',
] as const;

const originalUpgradeEnv = upgradeEnvKeys.reduce<
  Partial<Record<(typeof upgradeEnvKeys)[number], string>>
>((store, key) => {
  store[key] = process.env[key];
  return store;
}, {});

function clearUpgradeEnv() {
  for (const key of upgradeEnvKeys) {
    delete process.env[key];
  }
}

function restoreUpgradeEnv() {
  for (const key of upgradeEnvKeys) {
    const originalValue = originalUpgradeEnv[key];

    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
}

test.afterEach(() => {
  restoreUpgradeEnv();
});

test.describe('Visual Lexicon paywall trigger evaluator', () => {
  test('save_limit recommends Lite at the free saved-word limit', () => {
    expect(
      evaluateSaveLimitPaywall({
        plan: 'free',
        savedCount: 49,
        source: 'save_button',
      }),
    ).toBeNull();

    const prompt = evaluateSaveLimitPaywall({
      plan: 'free',
      savedCount: 50,
      source: 'save_button',
    });

    expect(prompt).toMatchObject({
      id: 'save_limit',
      recommendedPlan: 'lite',
      title: 'Keep every saved word in review',
      body: 'Your first 50 saved words are safe. Lite unlocks unlimited visual review.',
      primaryCtaLabel: 'Preview Lite',
      source: 'save_button',
      reasonMetrics: {
        savedCount: 50,
        savedLimit: 50,
      },
    });
    expect(
      evaluateSaveLimitPaywall({
        plan: 'lite',
        savedCount: 75,
        source: 'save_button',
      }),
    ).toBeNull();
  });

  test('review_limit recommends Lite when the daily free review cap is used', () => {
    expect(
      evaluateReviewLimitPaywall({
        plan: 'free',
        dailyReviewedCount: 9,
        source: 'review_session',
      }),
    ).toBeNull();

    const prompt = evaluateReviewLimitPaywall({
      plan: 'guest',
      dailyReviewedCount: 10,
      source: 'review_session',
    });

    expect(prompt).toMatchObject({
      id: 'review_limit',
      recommendedPlan: 'lite',
      body: "You used today's free review cards. Lite keeps the due queue moving.",
      reasonMetrics: {
        dailyReviewedCount: 10,
        dailyReviewLimit: 10,
      },
    });
    expect(
      evaluateReviewLimitPaywall({
        plan: 'pro',
        dailyReviewedCount: 30,
        source: 'review_session',
      }),
    ).toBeNull();
  });

  test('exam_pack_preview_end recommends Pro after a completed preview', () => {
    expect(
      evaluateExamPackPreviewEndPaywall({
        plan: 'free',
        packId: 'academic-vocabulary',
        previewCompleted: false,
        source: 'pack_preview',
      }),
    ).toBeNull();

    const prompt = evaluateExamPackPreviewEndPaywall({
      plan: 'lite',
      packId: 'academic-vocabulary',
      previewCompleted: true,
      source: 'pack_preview',
    });

    expect(prompt).toMatchObject({
      id: 'exam_pack_preview_end',
      recommendedPlan: 'pro',
      body: 'You finished the preview. Pro unlocks the full exam memory path.',
      reasonMetrics: {
        packId: 'academic-vocabulary',
      },
    });
    expect(
      evaluateExamPackPreviewEndPaywall({
        plan: 'pro',
        packId: 'academic-vocabulary',
        previewCompleted: true,
        source: 'pack_preview',
      }),
    ).toBeNull();
  });

  test('weak_words_sprint_locked recommends Pro only when weak words exist', () => {
    expect(
      evaluateWeakWordsSprintLockedPaywall({
        plan: 'free',
        weakCount: 0,
        source: 'weak_review',
      }),
    ).toBeNull();

    const prompt = evaluateWeakWordsSprintLockedPaywall({
      plan: 'lite',
      weakCount: 4,
      source: 'weak_review',
    });

    expect(prompt).toMatchObject({
      id: 'weak_words_sprint_locked',
      recommendedPlan: 'pro',
      body:
        'You have weak words waiting. Pro is planned for deeper weak-word tools; the local sprint stays available in this MVP.',
      reasonMetrics: {
        weakCount: 4,
      },
    });
  });

  test('mastery_export_locked is a Pro planning trigger', () => {
    const prompt = evaluateMasteryExportLockedPaywall({
      plan: 'lite',
      masteredCount: 12,
      source: 'mastery_export',
    });

    expect(prompt).toMatchObject({
      id: 'mastery_export_locked',
      recommendedPlan: 'pro',
      body: 'Mastery export is a Pro planning tool.',
      reasonMetrics: {
        masteredCount: 12,
      },
    });
    expect(
      evaluateMasteryExportLockedPaywall({
        plan: 'pro',
        masteredCount: 12,
        source: 'mastery_export',
      }),
    ).toBeNull();
  });

  test('mistake_explanation_locked sells memory diagnostics instead of more quizzes', () => {
    const prompt = evaluateMistakeExplanationLockedPaywall({
      plan: 'free',
      wrongCount: 2,
      slug: 'dissonance',
      source: 'review_feedback',
    });

    expect(prompt).toMatchObject({
      id: 'mistake_explanation_locked',
      recommendedPlan: 'pro',
      body: 'Pro explains why the wrong answer was tempting.',
      reasonMetrics: {
        wrongCount: 2,
        slug: 'dissonance',
      },
    });
    expect(
      evaluateMistakeExplanationLockedPaywall({
        plan: 'pro',
        wrongCount: 2,
        slug: 'dissonance',
        source: 'review_feedback',
      }),
    ).toBeNull();
  });

  test('upgrade target helper stays local without configured paid beta URLs', () => {
    clearUpgradeEnv();

    expect(hasConfiguredUpgradeUrl('lite')).toBe(false);
    expect(hasConfiguredUpgradeUrl('pro')).toBe(false);
    expect(getUpgradeTarget('lite', 'Pricing Page')).toBeNull();
    expect(normalizeUpgradeSource('Pricing Page')).toBe('pricing_page');
  });

  test('upgrade target helper exposes configured external placeholder URLs', () => {
    clearUpgradeEnv();
    process.env.NEXT_PUBLIC_LITE_PAYMENT_URL =
      'https://paid-beta.example.test/lite';
    process.env.NEXT_PUBLIC_PAID_BETA_FORM_URL =
      'https://paid-beta.example.test/form';

    const liteTarget = getUpgradeTarget('lite', 'pricing page');
    const proTarget = getUpgradeTarget('pro', 'Weak Words Sprint');

    expect(hasConfiguredUpgradeUrl('lite')).toBe(true);
    expect(hasConfiguredUpgradeUrl('pro')).toBe(true);
    expect(liteTarget).toBeTruthy();
    expect(proTarget).toBeTruthy();

    const liteUrl = new URL(liteTarget as string);
    const proUrl = new URL(proTarget as string);

    expect(`${liteUrl.origin}${liteUrl.pathname}`).toBe(
      'https://paid-beta.example.test/lite',
    );
    expect(liteUrl.searchParams.get('plan')).toBe('lite');
    expect(liteUrl.searchParams.get('source')).toBe('pricing_page');
    expect(`${proUrl.origin}${proUrl.pathname}`).toBe(
      'https://paid-beta.example.test/form',
    );
    expect(proUrl.searchParams.get('plan')).toBe('pro');
    expect(proUrl.searchParams.get('source')).toBe('weak_words_sprint');
  });

  test('no payment SDK or checkout route is added', () => {
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
