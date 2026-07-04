import { VLX_PLAN_DEFINITIONS, type VlxPlanId } from "@/lib/entitlements";
import type {
  VlxExamPackPreviewEndPaywallInput,
  VlxMasteryExportLockedPaywallInput,
  VlxMistakeExplanationLockedPaywallInput,
  VlxNoWatermarkDownloadPaywallInput,
  VlxPaywallPrompt,
  VlxPaywallReasonMetrics,
  VlxPaywallRecommendedPlan,
  VlxPaywallTriggerId,
  VlxReviewLimitPaywallInput,
  VlxSaveLimitPaywallInput,
  VlxWeakWordsSprintLockedPaywallInput
} from "@/lib/paywall/types";

const FREE_SAVED_WORDS_LIMIT = VLX_PLAN_DEFINITIONS.free.limits.savedWordsLimit;
const FREE_DAILY_REVIEW_LIMIT =
  VLX_PLAN_DEFINITIONS.free.limits.dailyReviewLimit;

const PAYWALL_COPY = {
  save_limit: {
    recommendedPlan: "lite",
    title: "Keep new saved words in review",
    body:
      "You reached the free saved-word limit from local saved-word evidence. Lite is positioned to keep more new words moving into review. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  review_limit: {
    recommendedPlan: "lite",
    title: "Keep reviewing before words fade",
    body:
      "You reached today's free review limit from local daily review evidence. Lite supports a daily visual memory habit without pretending paid access is active. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  pack_preview_end: {
    recommendedPlan: "exam_pack",
    title: "Continue the guided exam plan",
    body:
      "You finished a real pack preview. Exam Pack is a guided visual vocabulary plan, but full-pack access remains locked until future approved entitlements exist. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Exam Pack interest - billing not connected yet"
  },
  weak_words_sprint_locked: {
    recommendedPlan: "pro",
    title: "Repair weak words with Pro tools",
    body:
      "You have weak words from review misses or weakScore. Pro is positioned for Weak Sprint and advanced weak-word repair after the beta gates are cleared. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  },
  mastery_export_locked: {
    recommendedPlan: "pro",
    title: "Use review history outside the app",
    body:
      "You have mastery evidence from local review state. Pro export is planned for using real review history outside the app, not for faking mastery. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  },
  no_watermark_download: {
    recommendedPlan: "lite",
    title: "Clean downloads are still gated",
    body:
      "You asked for a clean visual download. Lite and Pro may support no-watermark downloads in a future approved implementation, but no clean asset delivery or paid access is active. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  mistake_explanation_locked: {
    recommendedPlan: "pro",
    title: "Get mistake explanations later",
    body:
      "You made a wrong answer that could support a future mistake explanation. AI mistake explanations come later after the SRS loop works; no AI is connected in this MVP. Billing is not connected yet; this records beta interest only.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  }
} as const satisfies Record<
  VlxPaywallTriggerId,
  {
    recommendedPlan: VlxPaywallRecommendedPlan;
    title: string;
    body: string;
    primaryCtaLabel: string;
  }
>;

function getCurrentPlan(plan: VlxPlanId | undefined): VlxPlanId {
  return plan ?? "guest";
}

function hasLiteAccess(plan: VlxPlanId | undefined) {
  const currentPlan = getCurrentPlan(plan);

  return currentPlan === "lite" || currentPlan === "pro";
}

function hasProAccess(plan: VlxPlanId | undefined) {
  return getCurrentPlan(plan) === "pro";
}

function cleanReasonMetrics(
  metrics: VlxPaywallReasonMetrics
): VlxPaywallReasonMetrics | undefined {
  const output: VlxPaywallReasonMetrics = {};

  if (typeof metrics.savedCount === "number") {
    output.savedCount = metrics.savedCount;
  }

  if (typeof metrics.savedLimit === "number") {
    output.savedLimit = metrics.savedLimit;
  }

  if (typeof metrics.dailyReviewedCount === "number") {
    output.dailyReviewedCount = metrics.dailyReviewedCount;
  }

  if (typeof metrics.dailyReviewLimit === "number") {
    output.dailyReviewLimit = metrics.dailyReviewLimit;
  }

  if (typeof metrics.weakCount === "number") {
    output.weakCount = metrics.weakCount;
  }

  if (typeof metrics.masteredCount === "number") {
    output.masteredCount = metrics.masteredCount;
  }

  if (typeof metrics.wrongCount === "number") {
    output.wrongCount = metrics.wrongCount;
  }

  if (metrics.packId) {
    output.packId = metrics.packId;
  }

  if (metrics.slug) {
    output.slug = metrics.slug;
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

function createPrompt(
  id: VlxPaywallTriggerId,
  source: string,
  reasonMetrics: VlxPaywallReasonMetrics = {}
): VlxPaywallPrompt {
  const copy = PAYWALL_COPY[id];

  return {
    id,
    recommendedPlan: copy.recommendedPlan,
    title: copy.title,
    body: copy.body,
    primaryCtaLabel: copy.primaryCtaLabel,
    source,
    reasonMetrics: cleanReasonMetrics(reasonMetrics)
  };
}

function getNumericLimit(limit: number | "unlimited" | undefined, fallback: number) {
  return limit === undefined ? fallback : limit;
}

export function evaluateSaveLimitPaywall(
  input: VlxSaveLimitPaywallInput
): VlxPaywallPrompt | null {
  const savedLimit = getNumericLimit(input.savedLimit, FREE_SAVED_WORDS_LIMIT);

  if (hasLiteAccess(input.plan) || savedLimit === "unlimited") {
    return null;
  }

  if (input.savedCount < savedLimit) {
    return null;
  }

  return createPrompt("save_limit", input.source, {
    savedCount: input.savedCount,
    savedLimit
  });
}

export function evaluateReviewLimitPaywall(
  input: VlxReviewLimitPaywallInput
): VlxPaywallPrompt | null {
  const dailyReviewLimit = getNumericLimit(
    input.dailyReviewLimit,
    FREE_DAILY_REVIEW_LIMIT
  );

  if (hasLiteAccess(input.plan) || dailyReviewLimit === "unlimited") {
    return null;
  }

  if (input.dailyReviewedCount < dailyReviewLimit) {
    return null;
  }

  return createPrompt("review_limit", input.source, {
    dailyReviewedCount: input.dailyReviewedCount,
    dailyReviewLimit
  });
}

export function evaluateExamPackPreviewEndPaywall(
  input: VlxExamPackPreviewEndPaywallInput
): VlxPaywallPrompt | null {
  if (hasProAccess(input.plan) || !input.previewCompleted) {
    return null;
  }

  return createPrompt("pack_preview_end", input.source, {
    packId: input.packId
  });
}

export function evaluateWeakWordsSprintLockedPaywall(
  input: VlxWeakWordsSprintLockedPaywallInput
): VlxPaywallPrompt | null {
  if (hasProAccess(input.plan) || input.weakCount <= 0) {
    return null;
  }

  return createPrompt("weak_words_sprint_locked", input.source, {
    weakCount: input.weakCount
  });
}

export function evaluateMasteryExportLockedPaywall(
  input: VlxMasteryExportLockedPaywallInput
): VlxPaywallPrompt | null {
  if (hasProAccess(input.plan)) {
    return null;
  }

  return createPrompt("mastery_export_locked", input.source, {
    masteredCount: input.masteredCount
  });
}

export function evaluateNoWatermarkDownloadPaywall(
  input: VlxNoWatermarkDownloadPaywallInput
): VlxPaywallPrompt | null {
  if (hasLiteAccess(input.plan)) {
    return null;
  }

  return createPrompt("no_watermark_download", input.source, {
    slug: input.slug
  });
}

export function evaluateMistakeExplanationLockedPaywall(
  input: VlxMistakeExplanationLockedPaywallInput
): VlxPaywallPrompt | null {
  if (hasProAccess(input.plan)) {
    return null;
  }

  return createPrompt("mistake_explanation_locked", input.source, {
    wrongCount: input.wrongCount,
    slug: input.slug
  });
}
