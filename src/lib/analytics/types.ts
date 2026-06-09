import type {
  VlxMasteryLabel,
  VlxQuestionType,
  VlxReviewResult
} from "@/lib/srs/types";

export type VlxAnalyticsEventName =
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

export type VlxAnalyticsBasePayload = {
  event: VlxAnalyticsEventName;
  eventId: string;
  eventTime: string;
  userState?: VlxAnalyticsUserState;
  pagePath?: string;
  source?: string;
};

export type VlxQuizStartEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_quiz_start";
  sessionId: string;
  mode: VlxAnalyticsReviewMode;
  cardsSeen: number;
  dueCount?: number;
  weakWordsCount?: number;
  savedWordsCount?: number;
  localCandidateCount?: number;
};

export type VlxQuizAnswerEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_quiz_answer";
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  mode: VlxAnalyticsReviewMode;
  questionType: VlxQuestionType;
  result: VlxReviewResult;
  correct: boolean;
  responseMs: number;
};

export type VlxQuizCompleteEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_quiz_complete";
  sessionId: string;
  mode: VlxAnalyticsReviewMode;
  cardsSeen: number;
  correctCount: number;
  wrongCount: number;
  weakWordsCount: number;
};

export type VlxReviewStateUpdateEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_review_state_update";
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  mode: VlxAnalyticsReviewMode;
  questionType: VlxQuestionType;
  result: VlxReviewResult;
  boxBefore: number;
  boxAfter: number;
  weakScoreBefore: number;
  weakScoreAfter: number;
  masteryAfter: VlxMasteryLabel;
};

export type VlxDueReviewStartEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_due_review_start";
  sessionId: string;
  mode: "due";
  cardsSeen: number;
  dueCount?: number;
  weakWordsCount?: number;
};

export type VlxWeakReviewStartEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_weak_review_start";
  sessionId: string;
  mode: "weak" | "weak-sprint";
  cardsSeen: number;
  dueCount?: number;
  weakWordsCount?: number;
};

export type VlxSaveWordClickEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_save_word_click";
  slug: string;
  word?: string;
  hub?: string;
  user_state: VlxAnalyticsUserState;
  result: VlxSaveWordResult;
  pack_source: VlxSavePackSource;
};

export type VlxAliasSearchEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_alias_search";
  source: "alias_search";
  query_language?: VlxAliasSearchQueryLanguage;
  matched_slug?: string;
  result: VlxAliasSearchResult;
};

type VlxExtensionBridgeEventName =
  | "vlx_extension_open_app"
  | "vlx_extension_save_click"
  | "vlx_extension_review_start"
  | "vlx_extension_quiz_later_click";

type VlxExtensionBridgeEventPayload<TEvent extends VlxExtensionBridgeEventName> =
  VlxAnalyticsBasePayload & {
    event: TEvent;
    slug?: string;
    mode?: VlxAnalyticsReviewMode;
  };

export type VlxExtensionOpenAppEventPayload =
  VlxExtensionBridgeEventPayload<"vlx_extension_open_app">;

export type VlxExtensionSaveClickEventPayload =
  VlxExtensionBridgeEventPayload<"vlx_extension_save_click">;

export type VlxExtensionReviewStartEventPayload =
  VlxExtensionBridgeEventPayload<"vlx_extension_review_start">;

export type VlxExtensionQuizLaterClickEventPayload =
  VlxExtensionBridgeEventPayload<"vlx_extension_quiz_later_click">;

export type VlxExamPackPreviewViewEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_exam_pack_preview_view";
  packId: string;
  title: string;
  targetLabel?: string;
  wordCount?: number;
  previewCount?: number;
  status: VlxExamPackPreviewStatus;
};

export type VlxExamPackPreviewStartEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_exam_pack_preview_start";
  packId: string;
  title: string;
  targetLabel?: string;
  wordCount?: number;
  previewCount?: number;
  status: VlxExamPackPreviewStatus;
  reviewHref: string;
};

export type VlxPaywallViewEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_paywall_view";
  source: string;
  plan?: "lite" | "pro";
};

export type VlxUpgradeClickEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_upgrade_click";
  source: string;
  plan: "lite" | "pro";
};

export type VlxAnalyticsEventMap = {
  vlx_quiz_start: VlxQuizStartEventPayload;
  vlx_quiz_answer: VlxQuizAnswerEventPayload;
  vlx_quiz_complete: VlxQuizCompleteEventPayload;
  vlx_review_state_update: VlxReviewStateUpdateEventPayload;
  vlx_due_review_start: VlxDueReviewStartEventPayload;
  vlx_weak_review_start: VlxWeakReviewStartEventPayload;
  vlx_alias_search: VlxAliasSearchEventPayload;
  vlx_save_word_click: VlxSaveWordClickEventPayload;
  vlx_extension_open_app: VlxExtensionOpenAppEventPayload;
  vlx_extension_save_click: VlxExtensionSaveClickEventPayload;
  vlx_extension_review_start: VlxExtensionReviewStartEventPayload;
  vlx_extension_quiz_later_click: VlxExtensionQuizLaterClickEventPayload;
  vlx_exam_pack_preview_view: VlxExamPackPreviewViewEventPayload;
  vlx_exam_pack_preview_start: VlxExamPackPreviewStartEventPayload;
  vlx_paywall_view: VlxPaywallViewEventPayload;
  vlx_upgrade_click: VlxUpgradeClickEventPayload;
};

export type VlxAnalyticsEvent<TEventName extends VlxAnalyticsEventName> =
  VlxAnalyticsEventMap[TEventName];

export type VlxAnalyticsEventPayload =
  VlxAnalyticsEventMap[VlxAnalyticsEventName];

export type VlxAnalyticsEventInput<TEventName extends VlxAnalyticsEventName> =
  Omit<
    VlxAnalyticsEvent<TEventName>,
    "event" | "eventId" | "eventTime"
  > &
    Partial<Pick<VlxAnalyticsBasePayload, "eventId" | "eventTime">>;
