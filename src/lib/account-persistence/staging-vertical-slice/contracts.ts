import type {
  VlxReviewEvent,
  VlxSavedWord,
} from "@/lib/srs/types";

export const VLX_ACCOUNT_LEARNING_APPLY_INPUT_VERSION = 1 as const;
export const VLX_ACCOUNT_LEARNING_APPLY_SCHEMA =
  "vlx.account-learning.apply.v1" as const;
export const VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA =
  "vlx.account-learning.hydrate.v1" as const;
export const VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE =
  "dissonance_saved_review_v1" as const;
export const VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY =
  "vlx_pr_c_golden_seed_v1" as const;

export const VLX_ACCOUNT_LEARNING_APPLY_MAX_BODY_BYTES = 16_384;
export const VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES = 32_768;
export const VLX_ACCOUNT_LEARNING_IDEMPOTENCY_KEY_MAX_BYTES = 128;
export const VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES = 32;
export const VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT = 1;

export const VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD = {
  slug: "dissonance",
  word: "Dissonance",
  image: "https://cdn.visuallexicon.org/images/dissonance.webp",
  definition: "A clash between sounds, ideas, or feelings.",
  hub: "academic-vocabulary",
  source: "word_page",
} as const;

export const VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT = {
  slug: "dissonance",
  word: "Dissonance",
  hub: "academic-vocabulary",
  questionType: "saved_review",
  selected: "Dissonance",
  answer: "Dissonance",
  result: "correct",
  usedHint: false,
  confidence: "knew",
  boxBefore: 0,
  boxAfter: 1,
  weakScoreBefore: 0,
  weakScoreAfter: 0,
} as const;

export type VlxAccountLearningApplyInput = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_APPLY_INPUT_VERSION;
  fixture: typeof VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE;
  savedWord: VlxSavedWord & {
    slug: "dissonance";
    word: "Dissonance";
    image: typeof VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.image;
    definition: typeof VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.definition;
    hub: typeof VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.hub;
    source: "word_page";
  };
  reviewEvent: VlxReviewEvent & {
    slug: "dissonance";
    word: "Dissonance";
    hub: typeof VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.hub;
    questionType: "saved_review";
    selected: "Dissonance";
    answer: "Dissonance";
    result: "correct";
    usedHint: false;
    confidence: "knew";
    boxBefore: 0;
    boxAfter: 1;
    weakScoreBefore: 0;
    weakScoreAfter: 0;
  };
};

export type VlxAccountLearningApplyProviderOutcome = {
  status: "committed" | "replayed" | "conflict" | "disabled" | "auth_required" | "scope_conflict";
  requestFingerprint?: string;
  savedWordsInserted?: number;
  reviewEventsInserted?: number;
  duplicateReviewEvents?: number;
  idempotencyRecordsInserted?: number;
  learningEvidenceMutated?: boolean;
};

export type VlxAccountLearningApplyResponse = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_APPLY_SCHEMA;
  route: "apply";
  ownerSource: "supabase_server_session";
  target: "isolated_staging";
  fixture: typeof VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE;
  status: "committed" | "replayed";
  bounded: true;
  idempotency: {
    fingerprint: string;
    replayed: boolean;
  };
  counts: {
    savedWordsInserted: number;
    reviewEventsInserted: number;
    duplicateReviewEvents: number;
    idempotencyRecordsInserted: number;
  };
  mutatesServer: boolean;
  mutatesBrowser: false;
  mutatesLearningEvidence: boolean;
  grantsPaidEntitlement: false;
  touchesBilling: false;
  touchesPackProgress: false;
};

export type VlxAccountLearningHydrateResponse = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA;
  route: "hydrate";
  ownerSource: "supabase_server_session";
  target: "isolated_staging";
  fixture: typeof VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE;
  readOnly: true;
  bounded: true;
  items: {
    savedWords: readonly VlxSavedWord[];
    reviewEvents: readonly VlxReviewEvent[];
  };
  counts: {
    savedWords: number;
    reviewEvents: number;
  };
  complete: {
    savedWords: true;
    reviewEvents: true;
  };
  mutatesServer: false;
  mutatesBrowser: false;
  grantsPaidEntitlement: false;
  touchesBilling: false;
  touchesPackProgress: false;
};

export type VlxAccountLearningVerticalSliceErrorCode =
  | "ROUTE_DISABLED"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "MALFORMED_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "ORIGIN_NOT_ALLOWED"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "FAKE_MASTERY_REJECTED"
  | "OUT_OF_SCOPE_FIELD"
  | "AUTH_REQUIRED"
  | "AUTH_UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "SCOPE_CONFLICT"
  | "EVIDENCE_UNAVAILABLE"
  | "INVALID_EVIDENCE_RESPONSE"
  | "APPLY_UNAVAILABLE"
  | "RESPONSE_BOUNDARY_FAILED";

export type VlxAccountLearningVerticalSliceValidationResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; reason: "malformed" | "fake_mastery" | "out_of_scope" };
