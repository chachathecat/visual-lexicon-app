import { expect, test } from '@playwright/test';

import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  evaluateWeakWordsSprintLockedPaywall,
} from '../src/lib/paywall';

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
      body: 'You have weak words waiting. Pro unlocks focused weak-word sprint.',
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
});
