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
  | "vlx_save_word_click"
  | "vlx_paywall_view"
  | "vlx_upgrade_click";

export type VlxAnalyticsUserState = "guest" | "free" | "lite" | "pro";

export type VlxAnalyticsReviewMode = "mixed" | "due" | "weak";

export type VlxSaveWordResult =
  | "saved"
  | "duplicate"
  | "missing"
  | "storage_error";

export type VlxSaveWordFoundSource =
  | "r2_pack"
  | "mock_fallback"
  | "missing";

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
  mode: "weak";
  cardsSeen: number;
  dueCount?: number;
  weakWordsCount?: number;
};

export type VlxSaveWordClickEventPayload = VlxAnalyticsBasePayload & {
  event: "vlx_save_word_click";
  slug: string;
  word?: string;
  hub?: string;
  result: VlxSaveWordResult;
  word_found_source?: VlxSaveWordFoundSource;
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
  vlx_save_word_click: VlxSaveWordClickEventPayload;
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
