import {
  ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN,
  ACCOUNT_SYNC_STORAGE_TABLE_DESIGNS,
  type AccountSyncApplyCommitPlan,
  type AccountSyncApplyCommitResult,
  type AccountSyncIdempotencyKey,
  type AccountSyncIdempotencyRecord,
  type AccountSyncRequestFingerprint,
  type AccountSyncStorageTableName,
  type AccountSyncTransactionStepId
} from "@/lib/account-persistence/idempotency-storage/idempotency-storage-design";

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID =
  "account-sync-idempotency-owner-1";

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OTHER_ACCOUNT_ID =
  "account-sync-idempotency-owner-2";

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_NOW =
  "2026-06-12T00:00:00.000Z";

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPIRES_AT =
  "2026-07-12T00:00:00.000Z";

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY = {
  value: "idem-account-sync-apply-1",
  accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
  routeId: "apply",
  requiredForApply: true,
  scope: "authenticated_account_owner",
  lookupScope: "account_owner_id_route_id_idempotency_key",
  reusableAcrossAccounts: false
} as const satisfies AccountSyncIdempotencyKey;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT = {
  value: "sha256-design-account-sync-apply-same-payload-1",
  algorithm: "canonical_json_sha256_design",
  covers: [
    "account_sync_payload_version",
    "apply_mode",
    "client_confirmation",
    "snapshot_evidence",
    "previewed_plan",
    "accepted_resolution_ids"
  ],
  excludes: [
    "raw_guest_snapshot_storage",
    "provider_tokens",
    "production_secrets",
    "billing_payment_state",
    "paid_entitlement_state"
  ],
  storesRawPayload: false,
  storesSensitivePayload: false
} as const satisfies AccountSyncRequestFingerprint;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DIFFERENT_FINGERPRINT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
  value: "sha256-design-account-sync-apply-different-payload-1"
} as const satisfies AccountSyncRequestFingerprint;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD = {
  accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
  routeId: "apply",
  idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
  requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
  status: "committed",
  outcomeSummary: {
    status: "committed",
    responseStatus: 200,
    applicationStatus: "accepted",
    acceptedReviewEventCount: 1,
    duplicateReviewEventCount: 0,
    savedWordCount: 1,
    auditSummaryCount: 1,
    blockedReasonCodes: [],
    rejectedReasonCodes: [],
    digestFingerprint: "sha256-design-digest-after-accepted-1",
    redacted: true,
    containsRawGuestSnapshot: false,
    containsSensitivePayload: false,
    grantsPaidEntitlement: false
  },
  createdAt: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_NOW,
  updatedAt: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_NOW,
  expiresAt: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPIRES_AT,
  storesRawGuestSnapshot: false,
  storesSensitivePayload: false,
  storesProviderTokens: false,
  storesProductionSecrets: false,
  storesBillingPaymentState: false,
  grantsPaidEntitlement: false
} as const satisfies AccountSyncIdempotencyRecord;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CROSS_ACCOUNT_RECORD = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD,
  accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OTHER_ACCOUNT_ID
} as const satisfies AccountSyncIdempotencyRecord;

export const ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_PLAN = {
  planId: "account-sync-apply-plan-1",
  accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
  routeId: "apply",
  idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY,
  requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
  status: "accepted",
  hasBlockedResolutions: false,
  hasMalformedPayload: false,
  containsFakeMasteryClaim: false,
  containsPaidEntitlementRequest: false,
  containsBillingPaymentState: false,
  reviewEventWrites: [
    {
      eventId: "event-idempotency-storage-review-1",
      slug: "dissonance",
      idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
      operation: "insert_once"
    }
  ],
  savedWordSlugs: ["dissonance"],
  packProgressInputs: [
    {
      packId: "academic-vocabulary",
      derivedFromReviewEventIds: ["event-idempotency-storage-review-1"],
      auditOnlyWhenNoEventEvidence: false
    }
  ],
  writesAuditSummary: true,
  storesIdempotencyOutcome: true,
  grantsPaidEntitlement: false
} as const satisfies AccountSyncApplyCommitPlan;

export const ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_RESULT = {
  planId: ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_PLAN.planId,
  accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
  routeId: "apply",
  status: "committed",
  idempotencyStatus: "committed",
  mutationSummary: {
    reviewEventsInserted: 1,
    reviewEventsSkippedAsDuplicate: 0,
    reviewStateRecomputed: 1,
    dailyStatsUpdated: 1,
    savedWordsUpdated: 1,
    packProgressUpdated: 1,
    auditSummariesWritten: 1
  },
  learningStateMutated: true,
  acceptedReviewEventsCommittedExactlyOnce: true,
  replayAdvancedSrs: false,
  duplicateReviewEventAdvancedSrs: false,
  blockedPlanMutatedLearningState: false,
  malformedPayloadCreatedPartialLearningState: false,
  fakeLocalMasteryBecameServerMastery: false,
  auditOnlyPackProgressBecameProgress: false,
  grantsPaidEntitlement: false,
  mutatesBillingPaymentState: false,
  rolledBackOnFailure: false
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_REPLAY_COMMIT_RESULT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_RESULT,
  status: "replayed",
  idempotencyStatus: "replayed",
  mutationSummary: {
    reviewEventsInserted: 0,
    reviewEventsSkippedAsDuplicate: 1,
    reviewStateRecomputed: 0,
    dailyStatsUpdated: 0,
    savedWordsUpdated: 0,
    packProgressUpdated: 0,
    auditSummariesWritten: 0
  },
  learningStateMutated: false,
  replayAdvancedSrs: false,
  duplicateReviewEventAdvancedSrs: false
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_BLOCKED_COMMIT_RESULT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_RESULT,
  status: "blocked_recorded",
  idempotencyStatus: "blocked",
  mutationSummary: {
    reviewEventsInserted: 0,
    reviewEventsSkippedAsDuplicate: 0,
    reviewStateRecomputed: 0,
    dailyStatsUpdated: 0,
    savedWordsUpdated: 0,
    packProgressUpdated: 0,
    auditSummariesWritten: 1
  },
  learningStateMutated: false,
  blockedPlanMutatedLearningState: false
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_REJECTED_MALFORMED_RESULT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_RESULT,
  status: "rejected_rolled_back",
  idempotencyStatus: "rejected",
  mutationSummary: {
    reviewEventsInserted: 0,
    reviewEventsSkippedAsDuplicate: 0,
    reviewStateRecomputed: 0,
    dailyStatsUpdated: 0,
    savedWordsUpdated: 0,
    packProgressUpdated: 0,
    auditSummariesWritten: 0
  },
  learningStateMutated: false,
  malformedPayloadCreatedPartialLearningState: false,
  rolledBackOnFailure: true
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_FAKE_MASTERY_RESULT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_BLOCKED_COMMIT_RESULT,
  fakeLocalMasteryBecameServerMastery: false
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_AUDIT_ONLY_PACK_RESULT = {
  ...ACCOUNT_SYNC_IDEMPOTENCY_ACCEPTED_COMMIT_RESULT,
  mutationSummary: {
    reviewEventsInserted: 0,
    reviewEventsSkippedAsDuplicate: 0,
    reviewStateRecomputed: 0,
    dailyStatsUpdated: 0,
    savedWordsUpdated: 0,
    packProgressUpdated: 0,
    auditSummariesWritten: 1
  },
  learningStateMutated: false,
  auditOnlyPackProgressBecameProgress: false
} as const satisfies AccountSyncApplyCommitResult;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TABLE_NAMES = [
  "account_sync_idempotency_records",
  "account_sync_audit_summaries",
  "account_review_events",
  "account_review_state",
  "account_daily_stats",
  "account_saved_words",
  "account_pack_progress"
] as const satisfies readonly AccountSyncStorageTableName[];

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TRANSACTION_STEPS = [
  "verify_auth_ownership",
  "validate_schema_and_payload_size",
  "check_idempotency_key",
  "reject_same_key_different_fingerprint",
  "replay_same_key_same_fingerprint_without_mutation",
  "reject_blocked_plans_before_learning_writes",
  "insert_accepted_review_events_once",
  "recompute_review_state_from_event_evidence",
  "update_daily_stats_from_accepted_events",
  "update_saved_words_from_allowed_inputs",
  "update_pack_progress_from_event_evidence_or_audit_marker",
  "write_redacted_audit_summary",
  "store_idempotency_outcome",
  "commit_atomically_or_rollback"
] as const satisfies readonly AccountSyncTransactionStepId[];

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/lib/account-persistence/idempotency-storage/route.ts",
  "src/lib/account-persistence/idempotency-storage/preview",
  "src/lib/account-persistence/idempotency-storage/apply",
  "src/lib/account-persistence/idempotency-storage/digest",
  "src/lib/account-persistence/idempotency-storage/audit"
] as const;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_SCHEMA_PATHS = [
  "prisma",
  "drizzle",
  "supabase",
  "migrations",
  "src/db",
  "src/database",
  "db",
  "database",
  "schema.prisma"
] as const;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN_FIXTURE =
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_TABLE_FIXTURES =
  ACCOUNT_SYNC_STORAGE_TABLE_DESIGNS;

export const ACCOUNT_SYNC_IDEMPOTENCY_TRANSACTION_FIXTURE =
  ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY;
