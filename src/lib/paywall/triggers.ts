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
    title: "Keep new saved words in review",
    body:
      "Free starts your first saved-word habit. Lite is for a larger daily visual memory habit with expanded review capacity.",
    primaryCtaLabel: "Preview Lite"
  },
  review_limit: {
    recommendedPlan: "lite",
    title: "Keep reviewing before words fade",
    body:
      "Free previews today's review loop. Lite is for daily due and weak review when you want the habit to continue.",
    primaryCtaLabel: "Preview Lite"
  },
  exam_pack_preview_end: {
    recommendedPlan: "pro",
    title: "Continue the guided exam plan",
    body:
      "The free preview is complete. Pro is positioned for full Exam Packs like Academic Vocabulary, IELTS Writing, and GRE Visual Verbal.",
    primaryCtaLabel: "Preview Pro"
  },
  weak_words_sprint_locked: {
    recommendedPlan: "pro",
    title: "Repair weak words with Pro tools",
    body:
      "Your weak words come from review misses and weakScore. Pro is positioned for Weak Sprint and advanced weak-word repair while the local sprint remains safe in this MVP.",
    primaryCtaLabel: "Preview Pro"
  },
  mastery_export_locked: {
    recommendedPlan: "pro",
    title: "Use review history outside the app",
    body:
      "Pro export and no-watermark download support planning from real review history; they do not replace recall practice.",
    primaryCtaLabel: "Preview Pro"
  },
  mistake_explanation_locked: {
    recommendedPlan: "pro",
    title: "Get mistake explanations later",
    body:
      "AI mistake explanations are planned later for Pro after the SRS loop is working. No AI is connected in this MVP.",
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
