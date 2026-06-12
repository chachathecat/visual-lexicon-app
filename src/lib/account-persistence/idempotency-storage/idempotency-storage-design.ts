export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CONTRACT_VERSION = 1 as const;

export type AccountSyncApplyRouteId = "apply";

export type AccountSyncIdempotencyStatus =
  | "pending"
  | "committed"
  | "replayed"
  | "blocked"
  | "rejected"
  | "conflict"
  | "expired";

export type AccountSyncIdempotencyKey = {
  value: string;
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  requiredForApply: true;
  scope: "authenticated_account_owner";
  lookupScope: "account_owner_id_route_id_idempotency_key";
  reusableAcrossAccounts: false;
};

export type AccountSyncRequestFingerprint = {
  value: string;
  algorithm: "canonical_json_sha256_design";
  covers: readonly (
    | "account_sync_payload_version"
    | "apply_mode"
    | "client_confirmation"
    | "snapshot_evidence"
    | "previewed_plan"
    | "accepted_resolution_ids"
  )[];
  excludes: readonly (
    | "raw_guest_snapshot_storage"
    | "provider_tokens"
    | "production_secrets"
    | "billing_payment_state"
    | "paid_entitlement_state"
  )[];
  storesRawPayload: false;
  storesSensitivePayload: false;
};

export type AccountSyncIdempotencyOutcomeSummary = {
  status: AccountSyncIdempotencyStatus;
  responseStatus: number;
  applicationStatus:
    | "accepted"
    | "replayed"
    | "blocked"
    | "rejected"
    | "conflict";
  acceptedReviewEventCount: number;
  duplicateReviewEventCount: number;
  savedWordCount: number;
  auditSummaryCount: number;
  blockedReasonCodes: readonly string[];
  rejectedReasonCodes: readonly string[];
  digestFingerprint?: string;
  redacted: true;
  containsRawGuestSnapshot: false;
  containsSensitivePayload: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncIdempotencyRecord = {
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  idempotencyKey: string;
  requestFingerprint: AccountSyncRequestFingerprint;
  status: AccountSyncIdempotencyStatus;
  outcomeSummary: AccountSyncIdempotencyOutcomeSummary;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  storesRawGuestSnapshot: false;
  storesSensitivePayload: false;
  storesProviderTokens: false;
  storesProductionSecrets: false;
  storesBillingPaymentState: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncIdempotencyReplayDecision = {
  kind: "replay_original_result";
  status: "accepted";
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  idempotencyKey: string;
  requestFingerprint: string;
  sameAccount: true;
  sameKey: true;
  sameFingerprint: true;
  replayAllowed: true;
  mutationAllowed: false;
  returnsOriginalOutcomeSummary: true;
  reappliesReviewEvents: false;
  advancesSrsAgain: false;
  duplicateReviewEventsCanAdvanceSrsTwice: false;
  outcomeSummary: AccountSyncIdempotencyOutcomeSummary;
};

export type AccountSyncIdempotencyConflictDecision = {
  kind:
    | "reject_same_key_different_fingerprint"
    | "reject_cross_account_replay"
    | "reject_route_mismatch";
  status: "rejected";
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  idempotencyKey: string;
  requestFingerprint: string;
  existingRecordOwnerId?: string;
  existingRecordFingerprint?: string;
  sameKey: boolean;
  sameAccount: boolean;
  sameFingerprint: boolean;
  conflictRejected: true;
  mutationAllowed: false;
  crossAccountReplayRejected: boolean;
  safeToRetryWithNewIdempotencyKey: boolean;
  reason:
    | "same_key_different_fingerprint"
    | "cross_account_replay"
    | "route_mismatch";
};

export type AccountSyncIdempotencyStorageDecision =
  | {
      kind: "missing_idempotency_key";
      status: "rejected";
      accountOwnerId: string;
      routeId: AccountSyncApplyRouteId;
      requiresIdempotencyKey: true;
      mutationAllowed: false;
      reason: "missing_idempotency_key";
    }
  | {
      kind: "record_new_request";
      status: "accepted";
      accountOwnerId: string;
      routeId: AccountSyncApplyRouteId;
      idempotencyKey: string;
      requestFingerprint: string;
      accountScopedKey: true;
      mutationAllowed: true;
      reason: "new_account_scoped_key";
    }
  | AccountSyncIdempotencyReplayDecision
  | AccountSyncIdempotencyConflictDecision;

export type AccountSyncStorageTableName =
  | "account_sync_idempotency_records"
  | "account_sync_audit_summaries"
  | "account_review_events"
  | "account_review_state"
  | "account_daily_stats"
  | "account_saved_words"
  | "account_pack_progress";

export type AccountSyncStorageTableDesign = {
  tableName: AccountSyncStorageTableName;
  purpose: string;
  ownerKey: string;
  requiredFields: readonly string[];
  forbiddenFields: readonly string[];
  writeBehavior: string;
  readBehavior: string;
  retentionNotes: string;
  privacyNotes: string;
  implementationStatus: "design_only";
  createsActualTable: false;
};

export type AccountSyncTransactionStepId =
  | "verify_auth_ownership"
  | "validate_schema_and_payload_size"
  | "check_idempotency_key"
  | "reject_same_key_different_fingerprint"
  | "replay_same_key_same_fingerprint_without_mutation"
  | "reject_blocked_plans_before_learning_writes"
  | "insert_accepted_review_events_once"
  | "recompute_review_state_from_event_evidence"
  | "update_daily_stats_from_accepted_events"
  | "update_saved_words_from_allowed_inputs"
  | "update_pack_progress_from_event_evidence_or_audit_marker"
  | "write_redacted_audit_summary"
  | "store_idempotency_outcome"
  | "commit_atomically_or_rollback";

export type AccountSyncTransactionBoundaryStep = {
  order: number;
  id: AccountSyncTransactionStepId;
  label: string;
  required: true;
  beforeLearningStateWrites: boolean;
  mutatesLearningState: boolean;
  rollbackRequiredOnFailure: boolean;
};

export type AccountSyncTransactionBoundaryDesign = {
  routeId: AccountSyncApplyRouteId;
  purpose: string;
  sequence: readonly AccountSyncTransactionBoundaryStep[];
  commitMode: "transaction_like_future_backend";
  atomicCommitRequired: true;
  partialWritesAllowed: false;
  replayCanMutateLearningState: false;
  blockedPlanCanMutateLearningState: false;
  malformedPayloadCanCreatePartialState: false;
  actualTransactionImplemented: false;
  implementationStatus: "design_only";
};

export type AccountSyncApplyCommitPlan = {
  planId: string;
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  idempotencyKey: AccountSyncIdempotencyKey;
  requestFingerprint: AccountSyncRequestFingerprint;
  status: "accepted" | "blocked" | "rejected";
  hasBlockedResolutions: boolean;
  hasMalformedPayload: boolean;
  containsFakeMasteryClaim: boolean;
  containsPaidEntitlementRequest: boolean;
  containsBillingPaymentState: boolean;
  reviewEventWrites: readonly {
    eventId: string;
    slug: string;
    idempotencyKey: string;
    operation: "insert_once" | "duplicate_noop";
  }[];
  savedWordSlugs: readonly string[];
  packProgressInputs: readonly {
    packId: string;
    derivedFromReviewEventIds: readonly string[];
    auditOnlyWhenNoEventEvidence: boolean;
  }[];
  writesAuditSummary: true;
  storesIdempotencyOutcome: true;
  grantsPaidEntitlement: false;
};

export type AccountSyncApplyCommitResult = {
  planId: string;
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  status:
    | "committed"
    | "replayed"
    | "blocked_recorded"
    | "rejected_rolled_back"
    | "conflict_rejected";
  idempotencyStatus: AccountSyncIdempotencyStatus;
  mutationSummary: {
    reviewEventsInserted: number;
    reviewEventsSkippedAsDuplicate: number;
    reviewStateRecomputed: number;
    dailyStatsUpdated: number;
    savedWordsUpdated: number;
    packProgressUpdated: number;
    auditSummariesWritten: number;
  };
  learningStateMutated: boolean;
  acceptedReviewEventsCommittedExactlyOnce: boolean;
  replayAdvancedSrs: false;
  duplicateReviewEventAdvancedSrs: false;
  blockedPlanMutatedLearningState: false;
  malformedPayloadCreatedPartialLearningState: false;
  fakeLocalMasteryBecameServerMastery: false;
  auditOnlyPackProgressBecameProgress: false;
  grantsPaidEntitlement: false;
  mutatesBillingPaymentState: false;
  rolledBackOnFailure: boolean;
};

export type AccountSyncPersistenceStorageDesign = {
  accountSyncIdempotencyStorageContractVersion: typeof ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CONTRACT_VERSION;
  purpose: string;
  appliesToRoute: AccountSyncApplyRouteId;
  storageGroups: readonly AccountSyncStorageTableDesign[];
  idempotencyPolicy: {
    applyRouteRequiresIdempotencyKey: true;
    idempotencyKeyScopedToAuthenticatedAccountOwner: true;
    idempotencyKeyGloballyReusableAcrossAccounts: false;
    sameAccountSameKeySameFingerprintReplaysOriginalResult: true;
    sameAccountSameKeyDifferentFingerprintRejectedAsConflict: true;
    crossAccountReplayImpossible: true;
    replayReappliesReviewEvents: false;
    replayAdvancesSrsAgain: false;
  };
  safetyPolicy: {
    acceptedReviewEventsCommittedExactlyOnce: true;
    duplicateReviewEventsCanAdvanceSrsTwice: false;
    blockedPlansRecordedWithoutLearningStateMutation: true;
    rejectedMalformedPayloadsCreatePartialLearningState: false;
    auditOnlyPackProgressRemainsAuditOnlyWithoutReviewEvents: true;
    fakeLocalMasteryCanBecomeServerMastery: false;
    paidEntitlementGrantedBySyncStorage: false;
    billingPaymentCheckoutSubscriptionOutsideSyncStorage: true;
  };
  implementationScope: {
    docsContractsTestsOnly: true;
    actualDatabaseImplementation: false;
    actualApiRouteImplementation: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    realAuthAllowed: false;
    databaseProviderSdkAllowed: false;
    authProviderSdkAllowed: false;
    paymentProviderSdkAllowed: false;
    networkCallsAllowed: false;
    browserStorageAllowed: false;
    environmentReadsAllowed: false;
  };
  finalVerdict: {
    verdict: "design_only";
    implementationReady: false;
    realApplyRouteRecommended: false;
    nextRecommendedPr: {
      number: 61;
      title: "Account sync schema validation and payload size limits contract";
      docsContractsTestsOnly: true;
    };
  };
};

export const ACCOUNT_SYNC_IDEMPOTENCY_STATUS_VALUES = [
  "pending",
  "committed",
  "replayed",
  "blocked",
  "rejected",
  "conflict",
  "expired"
] as const satisfies readonly AccountSyncIdempotencyStatus[];

export const ACCOUNT_SYNC_STORAGE_TABLE_DESIGNS = [
  {
    tableName: "account_sync_idempotency_records",
    purpose:
      "Durably scope each apply idempotency key to one authenticated account owner, request fingerprint, route, and redacted outcome.",
    ownerKey: "account_owner_id + route_id + idempotency_key",
    requiredFields: [
      "account_owner_id",
      "route_id",
      "idempotency_key",
      "request_fingerprint",
      "status",
      "outcome_summary",
      "created_at",
      "updated_at",
      "expires_at"
    ],
    forbiddenFields: [
      "raw_guest_snapshot",
      "raw_local_snapshot",
      "raw_request_body",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "checkout_state",
      "subscription_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Insert or lock by owner, route, and key before apply writes; store only the fingerprint, status, and redacted outcome.",
    readBehavior:
      "Read only by the authenticated owner plus route and key; never by key alone.",
    retentionNotes:
      "Keep through the approved retry window, then expire or archive only redacted summaries.",
    privacyNotes:
      "No raw snapshots, tokens, secrets, billing state, or entitlement state are stored.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_sync_audit_summaries",
    purpose:
      "Record redacted apply decisions for accepted, skipped, rejected, audit-only, blocked, and conflict outcomes.",
    ownerKey: "account_owner_id + audit_id",
    requiredFields: [
      "account_owner_id",
      "audit_id",
      "route_id",
      "plan_id",
      "decision_status",
      "reason_codes",
      "counts",
      "created_at",
      "retention_until"
    ],
    forbiddenFields: [
      "raw_guest_snapshot",
      "raw_server_payload",
      "provider_token",
      "production_secret",
      "full_account_state",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Write bounded redacted summaries after validation and plan classification.",
    readBehavior:
      "Read owner-only summaries through future bounded audit access.",
    retentionNotes:
      "Retain only within the approved support and privacy window.",
    privacyNotes:
      "Summaries carry reason codes and counts, not raw account or guest payloads.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_review_events",
    purpose:
      "Store accepted review-event evidence exactly once as the source of truth for SRS state.",
    ownerKey: "account_owner_id + event_id",
    requiredFields: [
      "account_owner_id",
      "event_id",
      "slug",
      "word",
      "question_type",
      "result",
      "response_ms",
      "created_at",
      "box_after",
      "weak_score_after",
      "idempotency_key",
      "request_fingerprint"
    ],
    forbiddenFields: [
      "raw_guest_snapshot",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Insert accepted event evidence once; duplicate event ids and duplicate idempotency evidence are no-op replays.",
    readBehavior:
      "Read by owner for event-derived review state, daily stats, and pack progress recomputation.",
    retentionNotes:
      "Retain as learning evidence unless a future privacy policy defines deletion semantics.",
    privacyNotes:
      "Contains learning evidence only, not raw sync snapshots or provider material.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_review_state",
    purpose:
      "Hold current SRS state recomputed from accepted review events and allowed saved-word initialization.",
    ownerKey: "account_owner_id + slug",
    requiredFields: [
      "account_owner_id",
      "slug",
      "word",
      "box",
      "mastery",
      "correct",
      "wrong",
      "streak_correct",
      "weak_score",
      "last_reviewed_at",
      "next_due_at",
      "derived_from_event_ids",
      "updated_at"
    ],
    forbiddenFields: [
      "imported_local_mastery_label",
      "unsupported_mastered_state",
      "raw_guest_snapshot",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Recompute from accepted event evidence; never trust local Mastered labels without delayed recall evidence.",
    readBehavior:
      "Read by owner for due, weak, strong, and mastered learning views.",
    retentionNotes:
      "Retain while the word remains in the account learning record.",
    privacyNotes:
      "Stores derived learning state only, not raw payloads or billing data.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_daily_stats",
    purpose:
      "Store daily review counts derived from accepted review events.",
    ownerKey: "account_owner_id + yyyy_mm_dd",
    requiredFields: [
      "account_owner_id",
      "date",
      "reviewed",
      "correct",
      "wrong",
      "derived_from_event_ids",
      "updated_at"
    ],
    forbiddenFields: [
      "raw_answers",
      "raw_guest_snapshot",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Update only from newly accepted review events; duplicate events do not increment counts.",
    readBehavior: "Read by owner for bounded learning streak and mission summaries.",
    retentionNotes:
      "Use a future retention policy for historical stats compaction.",
    privacyNotes:
      "Contains aggregate learning counts only.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_saved_words",
    purpose:
      "Store allowed saved-word records and initialize New review state when no state exists.",
    ownerKey: "account_owner_id + slug",
    requiredFields: [
      "account_owner_id",
      "slug",
      "word",
      "saved_at",
      "source",
      "idempotency_key",
      "updated_at"
    ],
    forbiddenFields: [
      "raw_guest_snapshot",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Upsert allowed saved words idempotently without resetting existing review state.",
    readBehavior: "Read by owner for saved library and review queue support.",
    retentionNotes: "Retain while saved by the account owner.",
    privacyNotes:
      "Saved-word metadata must remain separate from auth, billing, and provider material.",
    implementationStatus: "design_only",
    createsActualTable: false
  },
  {
    tableName: "account_pack_progress",
    purpose:
      "Store pack progress only when backed by accepted review-event evidence.",
    ownerKey: "account_owner_id + pack_id",
    requiredFields: [
      "account_owner_id",
      "pack_id",
      "reviewed_count",
      "correct_count",
      "derived_from_event_ids",
      "idempotency_keys",
      "updated_at"
    ],
    forbiddenFields: [
      "unsupported_local_progress_counter",
      "raw_guest_snapshot",
      "provider_token",
      "production_secret",
      "billing_state",
      "payment_state",
      "paid_entitlement"
    ],
    writeBehavior:
      "Update from accepted review events; unsupported progress inputs are recorded only as audit summaries.",
    readBehavior: "Read by owner for pack learning progress.",
    retentionNotes: "Retain while the account has pack learning history.",
    privacyNotes:
      "Pack progress remains evidence-derived and does not imply paid entitlement.",
    implementationStatus: "design_only",
    createsActualTable: false
  }
] as const satisfies readonly AccountSyncStorageTableDesign[];

export const ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY = {
  routeId: "apply",
  purpose:
    "Future apply must commit idempotency, review events, derived learning state, saved words, pack progress, and redacted audit summaries as one transaction-like unit.",
  sequence: [
    {
      order: 1,
      id: "verify_auth_ownership",
      label: "Verify auth ownership.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 2,
      id: "validate_schema_and_payload_size",
      label: "Validate schema and payload size.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 3,
      id: "check_idempotency_key",
      label: "Check idempotency key.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 4,
      id: "reject_same_key_different_fingerprint",
      label: "Reject same-key different-fingerprint conflicts.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 5,
      id: "replay_same_key_same_fingerprint_without_mutation",
      label: "Replay same-key same-fingerprint outcomes without mutation.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 6,
      id: "reject_blocked_plans_before_learning_writes",
      label: "Reject blocked plans before learning-state writes.",
      required: true,
      beforeLearningStateWrites: true,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: false
    },
    {
      order: 7,
      id: "insert_accepted_review_events_once",
      label: "Insert accepted review events exactly once.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: true,
      rollbackRequiredOnFailure: true
    },
    {
      order: 8,
      id: "recompute_review_state_from_event_evidence",
      label: "Recompute review state from event evidence.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: true,
      rollbackRequiredOnFailure: true
    },
    {
      order: 9,
      id: "update_daily_stats_from_accepted_events",
      label: "Update daily stats from accepted events.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: true,
      rollbackRequiredOnFailure: true
    },
    {
      order: 10,
      id: "update_saved_words_from_allowed_inputs",
      label: "Update saved words from allowed inputs.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: true,
      rollbackRequiredOnFailure: true
    },
    {
      order: 11,
      id: "update_pack_progress_from_event_evidence_or_audit_marker",
      label: "Update pack progress only from event evidence or audit-only marker.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: true,
      rollbackRequiredOnFailure: true
    },
    {
      order: 12,
      id: "write_redacted_audit_summary",
      label: "Write redacted audit summary.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: true
    },
    {
      order: 13,
      id: "store_idempotency_outcome",
      label: "Store idempotency outcome.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: true
    },
    {
      order: 14,
      id: "commit_atomically_or_rollback",
      label: "Commit atomically or rollback.",
      required: true,
      beforeLearningStateWrites: false,
      mutatesLearningState: false,
      rollbackRequiredOnFailure: true
    }
  ],
  commitMode: "transaction_like_future_backend",
  atomicCommitRequired: true,
  partialWritesAllowed: false,
  replayCanMutateLearningState: false,
  blockedPlanCanMutateLearningState: false,
  malformedPayloadCanCreatePartialState: false,
  actualTransactionImplemented: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncTransactionBoundaryDesign;

export const ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN = {
  accountSyncIdempotencyStorageContractVersion:
    ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CONTRACT_VERSION,
  purpose:
    "Define the durable idempotency and persistence storage contract required before a future account sync apply route can exist.",
  appliesToRoute: "apply",
  storageGroups: ACCOUNT_SYNC_STORAGE_TABLE_DESIGNS,
  idempotencyPolicy: {
    applyRouteRequiresIdempotencyKey: true,
    idempotencyKeyScopedToAuthenticatedAccountOwner: true,
    idempotencyKeyGloballyReusableAcrossAccounts: false,
    sameAccountSameKeySameFingerprintReplaysOriginalResult: true,
    sameAccountSameKeyDifferentFingerprintRejectedAsConflict: true,
    crossAccountReplayImpossible: true,
    replayReappliesReviewEvents: false,
    replayAdvancesSrsAgain: false
  },
  safetyPolicy: {
    acceptedReviewEventsCommittedExactlyOnce: true,
    duplicateReviewEventsCanAdvanceSrsTwice: false,
    blockedPlansRecordedWithoutLearningStateMutation: true,
    rejectedMalformedPayloadsCreatePartialLearningState: false,
    auditOnlyPackProgressRemainsAuditOnlyWithoutReviewEvents: true,
    fakeLocalMasteryCanBecomeServerMastery: false,
    paidEntitlementGrantedBySyncStorage: false,
    billingPaymentCheckoutSubscriptionOutsideSyncStorage: true
  },
  implementationScope: {
    docsContractsTestsOnly: true,
    actualDatabaseImplementation: false,
    actualApiRouteImplementation: false,
    routeHandlersAllowed: false,
    middlewareAllowed: false,
    runtimeIntegrationAllowed: false,
    realAuthAllowed: false,
    databaseProviderSdkAllowed: false,
    authProviderSdkAllowed: false,
    paymentProviderSdkAllowed: false,
    networkCallsAllowed: false,
    browserStorageAllowed: false,
    environmentReadsAllowed: false
  },
  finalVerdict: {
    verdict: "design_only",
    implementationReady: false,
    realApplyRouteRecommended: false,
    nextRecommendedPr: {
      number: 61,
      title: "Account sync schema validation and payload size limits contract",
      docsContractsTestsOnly: true
    }
  }
} as const satisfies AccountSyncPersistenceStorageDesign;

export function getAccountSyncStorageTableDesign(
  tableName: AccountSyncStorageTableName
) {
  return ACCOUNT_SYNC_STORAGE_TABLE_DESIGNS.find(
    (table) => table.tableName === tableName
  );
}

export function getAccountSyncApplyTransactionStep(
  stepId: AccountSyncTransactionStepId
) {
  return ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY.sequence.find(
    (step) => step.id === stepId
  );
}

export function decideAccountSyncIdempotencyStorage({
  accountOwnerId,
  routeId,
  idempotencyKey,
  requestFingerprint,
  existingRecord
}: {
  accountOwnerId: string;
  routeId: AccountSyncApplyRouteId;
  idempotencyKey?: string;
  requestFingerprint: AccountSyncRequestFingerprint;
  existingRecord?: AccountSyncIdempotencyRecord;
}): AccountSyncIdempotencyStorageDecision {
  const normalizedKey = idempotencyKey?.trim();

  if (!normalizedKey) {
    return {
      kind: "missing_idempotency_key",
      status: "rejected",
      accountOwnerId,
      routeId,
      requiresIdempotencyKey: true,
      mutationAllowed: false,
      reason: "missing_idempotency_key"
    };
  }

  if (!existingRecord) {
    return {
      kind: "record_new_request",
      status: "accepted",
      accountOwnerId,
      routeId,
      idempotencyKey: normalizedKey,
      requestFingerprint: requestFingerprint.value,
      accountScopedKey: true,
      mutationAllowed: true,
      reason: "new_account_scoped_key"
    };
  }

  if (existingRecord.accountOwnerId !== accountOwnerId) {
    return {
      kind: "reject_cross_account_replay",
      status: "rejected",
      accountOwnerId,
      routeId,
      idempotencyKey: normalizedKey,
      requestFingerprint: requestFingerprint.value,
      existingRecordOwnerId: existingRecord.accountOwnerId,
      existingRecordFingerprint: existingRecord.requestFingerprint.value,
      sameKey: existingRecord.idempotencyKey === normalizedKey,
      sameAccount: false,
      sameFingerprint:
        existingRecord.requestFingerprint.value === requestFingerprint.value,
      conflictRejected: true,
      mutationAllowed: false,
      crossAccountReplayRejected: true,
      safeToRetryWithNewIdempotencyKey: false,
      reason: "cross_account_replay"
    };
  }

  if (existingRecord.routeId !== routeId) {
    return {
      kind: "reject_route_mismatch",
      status: "rejected",
      accountOwnerId,
      routeId,
      idempotencyKey: normalizedKey,
      requestFingerprint: requestFingerprint.value,
      existingRecordOwnerId: existingRecord.accountOwnerId,
      existingRecordFingerprint: existingRecord.requestFingerprint.value,
      sameKey: existingRecord.idempotencyKey === normalizedKey,
      sameAccount: true,
      sameFingerprint:
        existingRecord.requestFingerprint.value === requestFingerprint.value,
      conflictRejected: true,
      mutationAllowed: false,
      crossAccountReplayRejected: false,
      safeToRetryWithNewIdempotencyKey: false,
      reason: "route_mismatch"
    };
  }

  if (existingRecord.requestFingerprint.value === requestFingerprint.value) {
    return {
      kind: "replay_original_result",
      status: "accepted",
      accountOwnerId,
      routeId,
      idempotencyKey: normalizedKey,
      requestFingerprint: requestFingerprint.value,
      sameAccount: true,
      sameKey: true,
      sameFingerprint: true,
      replayAllowed: true,
      mutationAllowed: false,
      returnsOriginalOutcomeSummary: true,
      reappliesReviewEvents: false,
      advancesSrsAgain: false,
      duplicateReviewEventsCanAdvanceSrsTwice: false,
      outcomeSummary: existingRecord.outcomeSummary
    };
  }

  return {
    kind: "reject_same_key_different_fingerprint",
    status: "rejected",
    accountOwnerId,
    routeId,
    idempotencyKey: normalizedKey,
    requestFingerprint: requestFingerprint.value,
    existingRecordOwnerId: existingRecord.accountOwnerId,
    existingRecordFingerprint: existingRecord.requestFingerprint.value,
    sameKey: existingRecord.idempotencyKey === normalizedKey,
    sameAccount: true,
    sameFingerprint: false,
    conflictRejected: true,
    mutationAllowed: false,
    crossAccountReplayRejected: false,
    safeToRetryWithNewIdempotencyKey: true,
    reason: "same_key_different_fingerprint"
  };
}
