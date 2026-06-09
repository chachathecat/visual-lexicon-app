import { VLX_PLAN_DEFINITIONS, type VlxPlanId } from "@/lib/entitlements";
import type {
  VlxExamPackPreviewEndPaywallInput,
  VlxMasteryExportLockedPaywallInput,
  VlxMistakeExplanationLockedPaywallInput,
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
    title: "Keep every saved word in review",
    body: "Your first 50 saved words are safe. Lite unlocks unlimited visual review.",
    primaryCtaLabel: "Preview Lite"
  },
  review_limit: {
    recommendedPlan: "lite",
    title: "Keep today's queue moving",
    body: "You used today's free review cards. Lite keeps the due queue moving.",
    primaryCtaLabel: "Preview Lite"
  },
  exam_pack_preview_end: {
    recommendedPlan: "pro",
    title: "Continue the exam memory path",
    body: "You finished the preview. Pro unlocks the full exam memory path.",
    primaryCtaLabel: "Preview Pro"
  },
  weak_words_sprint_locked: {
    recommendedPlan: "pro",
    title: "Work through weak words first",
    body:
      "You have weak words waiting. Pro is planned for deeper weak-word tools; the local sprint stays available in this MVP.",
    primaryCtaLabel: "Preview Pro"
  },
  mastery_export_locked: {
    recommendedPlan: "pro",
    title: "Plan from real mastery state",
    body: "Mastery export is a Pro planning tool.",
    primaryCtaLabel: "Preview Pro"
  },
  mistake_explanation_locked: {
    recommendedPlan: "pro",
    title: "Learn why the wrong answer pulled you in",
    body: "Pro explains why the wrong answer was tempting.",
    primaryCtaLabel: "Preview Pro"
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

  return createPrompt("exam_pack_preview_end", input.source, {
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
