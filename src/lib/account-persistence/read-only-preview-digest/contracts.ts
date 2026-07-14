export const VLX_ACCOUNT_LEARNING_READ_SCHEMA_VERSION = 1 as const;
export const VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA =
  "vlx.account-learning.preview.v1" as const;
export const VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA =
  "vlx.account-learning.digest.v1" as const;

export const VLX_ACCOUNT_LEARNING_PREVIEW_MAX_BODY_BYTES = 98_304;
export const VLX_ACCOUNT_LEARNING_DIGEST_MAX_QUERY_BYTES = 2_048;
export const VLX_ACCOUNT_LEARNING_RESPONSE_MAX_BYTES = 32_768;
export const VLX_ACCOUNT_LEARNING_PREVIEW_MAX_SAVED_WORD_SLUGS = 200;
export const VLX_ACCOUNT_LEARNING_PREVIEW_MAX_REVIEW_EVENT_IDS = 100;
export const VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT = 500;
export const VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT = 1_000;
export const VLX_ACCOUNT_LEARNING_CURSOR_HMAC_MIN_SECRET_BYTES = 32;

export const VLX_ACCOUNT_LEARNING_APPLY_ENABLED = false as const;
export const VLX_ACCOUNT_LEARNING_MUTATES_SERVER = false as const;
export const VLX_ACCOUNT_LEARNING_MUTATES_BROWSER = false as const;

export type VlxAccountLearningReadRoute = "preview" | "digest";

export type VlxAccountLearningPreviewInput = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_READ_SCHEMA_VERSION;
  previewOnly: true;
  localEvidence: {
    savedWordSlugs: readonly string[];
    reviewEventIds: readonly string[];
  };
};

export type VlxAccountLearningDigestQuery = Record<string, never>;

export type VlxAccountLearningCounts = {
  savedWords: number;
  reviewEvents: number;
};

export type VlxAccountLearningCompleteness = {
  savedWords: boolean;
  reviewEvents: boolean;
};

export type VlxAccountLearningHashedCursors = {
  algorithm: "hmac-sha256";
  reversible: false;
  savedWords: string | null;
  reviewEvents: string | null;
};

export type VlxAccountLearningRedaction = {
  containsAccountId: false;
  containsSavedWordSlugs: false;
  containsReviewEventIds: false;
  containsWords: false;
  containsAnswers: false;
  containsProviderPayload: false;
  containsAuthMaterial: false;
};

export type VlxAccountLearningPreviewResponse = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA;
  route: "preview";
  ownerSource: "supabase_server_session";
  readOnly: true;
  bounded: true;
  applyEnabled: false;
  evaluatedAt: string;
  mutatesServer: false;
  mutatesBrowser: false;
  grantsPaidEntitlement: false;
  counts: {
    local: VlxAccountLearningCounts;
    accountObserved: VlxAccountLearningCounts;
    overlap: VlxAccountLearningCounts;
    localNotSeenInAccountPage: VlxAccountLearningCounts;
    accountOnlyObserved: VlxAccountLearningCounts;
  };
  complete: VlxAccountLearningCompleteness;
  cursors: VlxAccountLearningHashedCursors;
  redaction: VlxAccountLearningRedaction;
};

export type VlxAccountLearningDigestResponse = {
  schemaVersion: typeof VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA;
  route: "digest";
  ownerSource: "supabase_server_session";
  readOnly: true;
  bounded: true;
  applyEnabled: false;
  evaluatedAt: string;
  mutatesServer: false;
  mutatesBrowser: false;
  grantsPaidEntitlement: false;
  counts: VlxAccountLearningCounts;
  complete: VlxAccountLearningCompleteness;
  cursors: VlxAccountLearningHashedCursors;
  redaction: VlxAccountLearningRedaction;
};

export type VlxAccountLearningReadErrorCode =
  | "ROUTE_DISABLED"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "MALFORMED_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "ORIGIN_NOT_ALLOWED"
  | "AUTH_REQUIRED"
  | "AUTH_INVALID"
  | "AUTH_UNAVAILABLE"
  | "EVIDENCE_UNAVAILABLE"
  | "INVALID_EVIDENCE_RESPONSE"
  | "RESPONSE_BOUNDARY_FAILED";

export type VlxAccountLearningValidationIssue = {
  path: string;
  code: "invalid_type" | "invalid_value" | "too_big" | "unrecognized_key";
  rawValueIncluded: false;
};

export type VlxAccountLearningValidationResult<TValue> =
  | { ok: true; value: TValue }
  | {
      ok: false;
      issues: readonly VlxAccountLearningValidationIssue[];
    };

export const VLX_ACCOUNT_LEARNING_REDACTION = {
  containsAccountId: false,
  containsSavedWordSlugs: false,
  containsReviewEventIds: false,
  containsWords: false,
  containsAnswers: false,
  containsProviderPayload: false,
  containsAuthMaterial: false,
} as const satisfies VlxAccountLearningRedaction;
