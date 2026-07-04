import type { VlxPlanId, VlxPlanLimit } from "@/lib/entitlements";

export type VlxPaywallTriggerId =
  | "save_limit"
  | "review_limit"
  | "pack_preview_end"
  | "weak_words_sprint_locked"
  | "mastery_export_locked"
  | "no_watermark_download"
  | "mistake_explanation_locked";

export type VlxPaywallRecommendedPlan =
  | Extract<VlxPlanId, "lite" | "pro">
  | "exam_pack";

export type VlxPaywallReasonMetrics = {
  savedCount?: number;
  savedLimit?: number;
  dailyReviewedCount?: number;
  dailyReviewLimit?: number;
  weakCount?: number;
  masteredCount?: number;
  wrongCount?: number;
  packId?: string;
  slug?: string;
};

export type VlxPaywallPrompt = {
  id: VlxPaywallTriggerId;
  recommendedPlan: VlxPaywallRecommendedPlan;
  title: string;
  body: string;
  primaryCtaLabel: string;
  source: string;
  reasonMetrics?: VlxPaywallReasonMetrics;
};

export type VlxPaywallEvaluationBase = {
  plan?: VlxPlanId;
  source: string;
};

export type VlxSaveLimitPaywallInput = VlxPaywallEvaluationBase & {
  savedCount: number;
  savedLimit?: VlxPlanLimit;
};

export type VlxReviewLimitPaywallInput = VlxPaywallEvaluationBase & {
  dailyReviewedCount: number;
  dailyReviewLimit?: VlxPlanLimit;
};

export type VlxExamPackPreviewEndPaywallInput = VlxPaywallEvaluationBase & {
  packId: string;
  previewCompleted: boolean;
};

export type VlxWeakWordsSprintLockedPaywallInput = VlxPaywallEvaluationBase & {
  weakCount: number;
};

export type VlxMasteryExportLockedPaywallInput = VlxPaywallEvaluationBase & {
  masteredCount?: number;
};

export type VlxNoWatermarkDownloadPaywallInput = VlxPaywallEvaluationBase & {
  slug?: string;
};

export type VlxMistakeExplanationLockedPaywallInput = VlxPaywallEvaluationBase & {
  wrongCount?: number;
  slug?: string;
};
