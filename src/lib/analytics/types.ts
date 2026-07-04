import type {
  VlxMasteryLabel,
  VlxQuestionType,
  VlxReviewResult
} from "@/lib/srs/types";

export type VlxAnalyticsEventName =
  | "vlx_save_word"
  | "vlx_saved_library_view"
  | "vlx_word_memory_state_view"
  | "vlx_review_start"
  | "vlx_review_answer"
  | "vlx_review_complete"
  | "vlx_pack_preview_start"
  | "vlx_pack_preview_complete"
  | "vlx_pricing_interest"
  | "vlx_paywall_interest"
  | "vlx_quiz_start"
  | "vlx_quiz_answer"
  | "vlx_quiz_complete"
  | "vlx_review_state_update"
  | "vlx_due_review_start"
  | "vlx_weak_review_start"
  | "vlx_alias_search"
  | "vlx_save_word_click"
  | "vlx_extension_open_app"
  | "vlx_extension_save_click"
  | "vlx_extension_review_start"
  | "vlx_extension_quiz_later_click"
  | "vlx_exam_pack_preview_view"
  | "vlx_exam_pack_preview_start"
  | "vlx_paywall_view"
  | "vlx_upgrade_click";

export type VlxAnalyticsUserState = "guest" | "free" | "lite" | "pro";

export type VlxAnalyticsReviewMode =
  | "mixed"
  | "saved"
  | "due"
  | "weak"
  | "weak-sprint"
  | "word"
  | "hub";

export type VlxSaveWordResult =
  | "saved"
  | "duplicate"
  | "missing"
  | "storage_error";

export type VlxSavePackSource =
  | "r2"
  | "mock"
  | "fallback"
  | "unavailable";

export type VlxExamPackPreviewStatus =
  | "available"
  | "empty"
  | "placeholder";

export type VlxAliasSearchResult = "matched" | "no_match";

export type VlxAliasSearchQueryLanguage = "ko" | "ja" | "en";

export type VlxAnalyticsPlan = "lite" | "pro" | "exam_pack";

export type VlxAnalyticsSourceOfTruth = "client" | "server" | "derived";

export type VlxAnalyticsAllowedPayload = {
  event: VlxAnalyticsEventName;
  eventId: string;
  eventTime: string;
  schemaVersion?: 1;
  sourceOfTruth?: VlxAnalyticsSourceOfTruth;
  source?: string;
  slug?: string;
  word?: string;
  route?: string;
  mode?: VlxAnalyticsReviewMode;
  packId?: string;
  plan?: VlxAnalyticsPlan;
  trigger?: string;
  result?: VlxReviewResult | VlxSaveWordResult | VlxAliasSearchResult | string;
  questionType?: VlxQuestionType;
  responseMs?: number;
  boxBefore?: number;
  boxAfter?: number;
  weakScoreAfter?: number;
  weakScoreBefore?: number;
  masteryBefore?: VlxMasteryLabel;
  masteryAfter?: VlxMasteryLabel;
  reviewedCount?: number;
  correctCount?: number;
  wrongCount?: number;
  dueCount?: number;
  weakCount?: number;
  savedCount?: number;
  reviewEventCount?: number;
  durationMs?: number;
  confidence?: "knew" | "guessed" | "forgot";
  queueSize?: number;
  sessionId?: string;
  hasLocalReviewState?: boolean;
  hasLocalSavedWord?: boolean;
  mastery?: VlxMasteryLabel;
};

export type VlxAnalyticsEvent<
  TEventName extends VlxAnalyticsEventName = VlxAnalyticsEventName
> = VlxAnalyticsAllowedPayload & {
  event: TEventName;
};

export type VlxLegacyAnalyticsInputFields = {
  userState?: VlxAnalyticsUserState;
  user_state?: VlxAnalyticsUserState;
  pagePath?: string;
  sessionId?: string;
  cardsSeen?: number;
  weakWordsCount?: number;
  savedWordsCount?: number;
  localCandidateCount?: number;
  weakScoreBefore?: number;
  masteryBefore?: VlxMasteryLabel;
  masteryAfter?: VlxMasteryLabel;
  weakScoreAfter?: number;
  correct?: boolean;
  responseMs?: number;
  durationMs?: number;
  queueSize?: number;
  confidence?: "knew" | "guessed" | "forgot";
  pack_source?: VlxSavePackSource;
  title?: string;
  targetLabel?: string;
  wordCount?: number;
  previewCount?: number;
  status?: VlxExamPackPreviewStatus;
  reviewHref?: string;
  query_language?: VlxAliasSearchQueryLanguage;
  matched_slug?: string;
};

export type VlxAnalyticsEventInput<
  TEventName extends VlxAnalyticsEventName = VlxAnalyticsEventName
> = Partial<Omit<VlxAnalyticsAllowedPayload, "event">> &
  VlxLegacyAnalyticsInputFields & {
    eventId?: string;
    eventTime?: string;
    event?: never;
  };

export type VlxAnalyticsEventPayload = VlxAnalyticsEvent;
