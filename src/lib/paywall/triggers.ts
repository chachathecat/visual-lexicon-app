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
    title: "Your memory library is full",
    body:
      "Your memory library is full. Lite is planned for expanded saved words and daily review capacity. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  review_limit: {
    recommendedPlan: "lite",
    title: "Keep reviewing before words fade",
    body:
      "You rescued today's free cards. Lite is planned for keeping daily review moving before words fade. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  pack_preview_end: {
    recommendedPlan: "pro",
    title: "Continue the guided exam plan",
    body:
      "You started the 30-day Academic plan. Pro guided pack access is planned for a future owner-gated beta. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  },
  weak_words_sprint_locked: {
    recommendedPlan: "pro",
    title: "You have weak words waiting",
    body:
      "You have weak words waiting. Pro is planned for focused weak-word practice after owner approval. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  },
  mastery_export_locked: {
    recommendedPlan: "pro",
    title: "Use review history outside the app",
    body:
      "Your mastery evidence is useful beyond the app. Pro is planned for memory exports from real review history and delayed recall, not fabricated mastery claims. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Pro interest - billing not connected yet"
  },
  no_watermark_download: {
    recommendedPlan: "lite",
    title: "No-watermark export is planned",
    body:
      "No-watermark export is planned for a future approved implementation. Lite is planned for clean study visuals, while Pro adds exam-ready export support. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
    primaryCtaLabel: "Note Lite interest - billing not connected yet"
  },
  mistake_explanation_locked: {
    recommendedPlan: "pro",
    title: "Mistake explanations come later",
    body:
      "A wrong answer is a mistake record. AI mistake explanations are planned for a future approved implementation after the SRS loop works. Billing is not connected yet. No checkout is live. This records beta interest only. This does not grant paid access. No real paid entitlement is active.",
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
