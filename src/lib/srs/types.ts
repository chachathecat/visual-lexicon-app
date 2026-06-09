export const VLX_STORAGE_KEYS = {
  savedWords: "vlx_saved_words_v1",
  reviewState: "vlx_review_state_v1",
  reviewEvents: "vlx_review_events_v1",
  dailyStats: "vlx_daily_stats_v1"
} as const;

export const VLX_BOX_INTERVAL_DAYS = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
} as const;

export const VLX_BOX_ZERO_DUE_MINUTES = 10;
export const VLX_FAST_RESPONSE_MS = 5000;
export const VLX_SLOW_RESPONSE_MS = 10000;

export type VlxSrsBox = 0 | 1 | 2 | 3 | 4 | 5;

export type VlxMasteryLabel =
  | "New"
  | "Learning"
  | "Weak"
  | "Strong"
  | "Mastered";

export type VlxQuestionType =
  | "image_to_word"
  | "definition_to_word"
  | "word_to_image"
  | "cloze"
  | "confusable_pair"
  | "saved_review"
  | "due_review"
  | "weak_review"
  | "exam_pack";

export type VlxReviewResult = "correct" | "wrong";

export type VlxReviewConfidence = "knew" | "guessed" | "forgot";

export type VlxSavedWordSource =
  | "word_page"
  | "hub_page"
  | "extension"
  | "alias_search"
  | "app"
  | "exam_pack"
  | "manual";

export type VlxSavedWord = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  source?: VlxSavedWordSource;
  savedAt: string;
};

export type VlxSavedWordsStore = Record<string, VlxSavedWord>;

export type VlxReviewStateItem = {
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  box: VlxSrsBox;
  mastery: VlxMasteryLabel;
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: VlxQuestionType;
  createdAt: string;
  updatedAt: string;
};

export type VlxReviewStateStore = Record<string, VlxReviewStateItem>;

export type VlxReviewEvent = {
  eventId: string;
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: VlxQuestionType;
  selected?: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  usedHint?: boolean;
  confidence?: VlxReviewConfidence;
  createdAt: string;
  boxBefore: number;
  boxAfter: number;
  weakScoreBefore: number;
  weakScoreAfter: number;
};

export type VlxReviewEventsStore = VlxReviewEvent[];

export type VlxDailyStatsItem = {
  date: string;
  reviewed: number;
  correct: number;
  wrong: number;
  mastered: number;
  weakAdded: number;
  minutes: number;
  sessions: number;
};

export type VlxDailyStatsStore = Record<string, VlxDailyStatsItem>;

export type VlxReviewAnswerInput = {
  eventId?: string;
  sessionId?: string;
  slug: string;
  word: string;
  image?: string;
  definition?: string;
  hub?: string;
  questionType: VlxQuestionType;
  selected?: string;
  answer: string;
  result: VlxReviewResult;
  responseMs: number;
  usedHint?: boolean;
  confidence?: VlxReviewConfidence;
  createdAt?: string;
};

export type VlxApplyReviewAnswerOptions = {
  currentState?: VlxReviewStateItem;
  dailyStats?: VlxDailyStatsItem;
  countSession?: boolean;
};

export type VlxReviewUpdateOutput = {
  event: VlxReviewEvent;
  state: VlxReviewStateItem;
  dailyStats: VlxDailyStatsItem;
};
