import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateNoWatermarkDownloadPaywall,
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
      title: 'Your memory library is full',
      primaryCtaLabel: 'Note Lite interest - billing not connected yet',
      source: 'save_button',
      reasonMetrics: {
        savedCount: 50,
        savedLimit: 50,
      },
    });
    expect(prompt?.body).toContain('Your memory library is full');
    expect(prompt?.body).toContain('Billing is not connected yet');
    expect(prompt?.body).toContain('does not grant paid access');
    expect(prompt?.body).toContain('beta interest only');
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
      title: 'Keep reviewing before words fade',
      primaryCtaLabel: 'Note Lite interest - billing not connected yet',
      reasonMetrics: {
        dailyReviewedCount: 10,
        dailyReviewLimit: 10,
      },
    });
    expect(prompt?.body).toContain("You rescued today's free cards");
    expect(prompt?.body).toContain('Billing is not connected yet');
    expect(prompt?.body).toContain('does not grant paid access');
    expect(
      evaluateReviewLimitPaywall({
        plan: 'pro',
        dailyReviewedCount: 30,
        source: 'review_session',
      }),
    ).toBeNull();
  });

  test('pack_preview_end records Exam Pack interest after a completed preview', () => {
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
      id: 'pack_preview_end',
      recommendedPlan: 'pro',
      title: 'Continue the guided exam plan',
      primaryCtaLabel: 'Note Pro interest - billing not connected yet',
      reasonMetrics: {
        packId: 'academic-vocabulary',
      },
    });
    expect(prompt?.body).toContain('You started the 30-day Academic plan');
    expect(prompt?.body).toContain('Pro unlocks the full guided pack');
    expect(prompt?.body).toContain('Billing is not connected yet');
    expect(prompt?.body).toContain('does not grant paid access');
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
      title: 'You have weak words waiting',
      primaryCtaLabel: 'Note Pro interest - billing not connected yet',
      reasonMetrics: {
        weakCount: 4,
      },
    });
    expect(prompt?.body).toContain('Pro unlocks focused weak-word practice');
    expect(prompt?.body).toContain('Billing is not connected yet');
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
      title: 'Use review history outside the app',
      primaryCtaLabel: 'Note Pro interest - billing not connected yet',
      reasonMetrics: {
        masteredCount: 12,
      },
    });
    expect(prompt?.body).toContain('real review history');
    expect(prompt?.body).toContain('not fabricated mastery claims');
    expect(
      evaluateMasteryExportLockedPaywall({
        plan: 'pro',
        masteredCount: 12,
        source: 'mastery_export',
      }),
    ).toBeNull();
  });

  test('no_watermark_download is a Lite planning trigger', () => {
    const prompt = evaluateNoWatermarkDownloadPaywall({
      plan: 'free',
      slug: 'lucid',
      source: 'word_download',
    });

    expect(prompt).toMatchObject({
      id: 'no_watermark_download',
      recommendedPlan: 'lite',
      title: 'No-watermark export is locked',
      primaryCtaLabel: 'Note Lite interest - billing not connected yet',
      reasonMetrics: {
        slug: 'lucid',
      },
    });
    expect(prompt?.body).toContain('No-watermark export is locked');
    expect(prompt?.body).toContain('does not grant paid access');
    expect(prompt?.body).toContain('Billing is not connected yet');
    expect(
      evaluateNoWatermarkDownloadPaywall({
        plan: 'lite',
        slug: 'lucid',
        source: 'word_download',
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
      title: 'Mistake explanations come later',
      primaryCtaLabel: 'Note Pro interest - billing not connected yet',
      reasonMetrics: {
        wrongCount: 2,
        slug: 'dissonance',
      },
    });
    expect(prompt?.body).toContain('A wrong answer is a mistake record');
    expect(prompt?.body).toContain('AI mistake explanations later');
    expect(prompt?.body).toContain('Billing is not connected yet');
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
      'portone',
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
