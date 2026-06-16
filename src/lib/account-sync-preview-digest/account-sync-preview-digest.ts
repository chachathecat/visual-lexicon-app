import { VLX_PACK_PROGRESS_STORAGE_KEY } from "@/lib/packs/progress";
import type { VlxPackProgressStore } from "@/lib/packs/progress";
import type {
  VlxDailyStatsStore,
  VlxReviewEventsStore,
  VlxReviewStateStore,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";
import {
  VLX_UPGRADE_INTEREST_STORAGE_KEY,
  type VlxUpgradeInterestRecord
} from "@/lib/upgrade/upgrade-interest";

export const ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION = 1 as const;

export const ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
  VLX_PACK_PROGRESS_STORAGE_KEY,
  VLX_UPGRADE_INTEREST_STORAGE_KEY
] as const;

export type AccountSyncPreviewAllowedLocalStorageKey =
  (typeof ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS)[number];

export type AccountSyncPreviewStorageValueByKey = {
  [VLX_STORAGE_KEYS.savedWords]: VlxSavedWordsStore;
  [VLX_STORAGE_KEYS.reviewState]: VlxReviewStateStore;
  [VLX_STORAGE_KEYS.reviewEvents]: VlxReviewEventsStore;
  [VLX_STORAGE_KEYS.dailyStats]: VlxDailyStatsStore;
  [VLX_PACK_PROGRESS_STORAGE_KEY]: VlxPackProgressStore;
  [VLX_UPGRADE_INTEREST_STORAGE_KEY]: readonly VlxUpgradeInterestRecord[];
};

export type AccountSyncPreviewStorageInput =
  Partial<AccountSyncPreviewStorageValueByKey> & Record<string, unknown>;

export type AccountSyncPreviewLocalStateCategory =
  | "saved_words"
  | "review_state"
  | "review_events"
  | "daily_stats"
  | "pack_progress"
  | "upgrade_interest";

export type AccountSyncPreviewExpectedJsonType = "record" | "array";

export type AccountSyncPreviewAllowedLocalStateCategory = {
  key: AccountSyncPreviewAllowedLocalStorageKey;
  category: AccountSyncPreviewLocalStateCategory;
  label: string;
  expectedJsonType: AccountSyncPreviewExpectedJsonType;
  allowedInPreviewPayload: true;
  redactedDigestMode: "count_byte_length_and_fingerprint_only";
  futureApplyMode:
    | "learning_state_candidate"
    | "review_event_evidence"
    | "event_derived_or_audit_only"
    | "attribution_only";
  grantsPaidEntitlement: false;
  notes: string;
};

export type AccountSyncPreviewBlockedField = {
  fieldName: string;
  category:
    | "provider_token"
    | "secret_or_credential"
    | "billing_payment"
    | "entitlement"
    | "auth_session"
    | "production_data"
    | "raw_sensitive_payload";
  blockedInPreview: true;
  blockedInDigest: true;
  reason: string;
};

export type AccountSyncPreviewPayloadLimitPolicy = {
  previewPayloadMaxBytes: number;
  redactedDigestMaxBytes: number;
  maxAllowedStorageKeys: typeof ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS.length;
  maxReviewEvents: number;
  maxSavedWords: number;
  maxPackProgressEntries: number;
  maxUpgradeInterestRecords: number;
  unlimitedPayloadAllowed: false;
  oversizedPayloadAccepted: false;
};

export type AccountSyncPreviewVerdicts = {
  realAccountSync: "blocked";
  previewDigestMock: "allowed";
  applyWriteOperation: "blocked";
  publicPaidBeta: "no_go";
  privatePaidBeta: "conditional_manual_only";
};

export type AccountSyncPreviewImplementationScope = {
  docsContractsTestsOnly: true;
  noRuntimeBehaviorChange: true;
  noApiRoutes: true;
  noRouteHandlers: true;
  noMiddleware: true;
  noAuthIntegrations: true;
  noDatabaseProviderSdk: true;
  noPaymentProviderSdk: true;
  noNetworkCalls: true;
  noBrowserStorageMutation: true;
  noProductionDataMutation: true;
  noEnvVarChanges: true;
  noAiCalls: true;
  noDeploymentChanges: true;
};

export type AccountSyncPreviewValidationFailureReason =
  | "preview_only_required"
  | "unknown_storage_key"
  | "malformed_payload"
  | "blocked_sensitive_field"
  | "payload_too_large"
  | "review_event_count_too_large"
  | "saved_word_count_too_large"
  | "pack_progress_count_too_large"
  | "upgrade_interest_count_too_large";

export type AccountSyncPreviewBlockedFieldMatch = {
  path: string;
  fieldName: string;
  blockedCategory: AccountSyncPreviewBlockedField["category"];
};

export type AccountSyncPreviewValidationDecision = {
  ok: boolean;
  status: "accepted" | "rejected";
  failureReasons: readonly AccountSyncPreviewValidationFailureReason[];
  unknownKeys: readonly string[];
  blockedFieldMatches: readonly AccountSyncPreviewBlockedFieldMatch[];
  payloadByteLength: number;
  payloadLimitBytes: number;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  appliesAccountSync: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncPreviewPayloadInput = {
  requestedAt: string;
  storageValues: AccountSyncPreviewStorageInput;
  previewOnly?: boolean;
  clientStateDigest?: string;
  clientProvidedAccountId?: string;
};

export type AccountSyncPreviewLocalStateEntry = {
  key: AccountSyncPreviewAllowedLocalStorageKey;
  category: AccountSyncPreviewLocalStateCategory;
  present: boolean;
  valueType: AccountSyncPreviewExpectedJsonType | "missing";
  itemCount: number;
  byteLength: number;
  valueFingerprint: string;
  previewValue?: unknown;
};

export type AccountSyncPreviewRejectedPayload = {
  accountSyncPreviewDigestMockVersion: typeof ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION;
  shape: "account_sync_preview_payload";
  ok: false;
  status: "rejected";
  previewOnly: boolean;
  requestedAt: string;
  failureReasons: readonly AccountSyncPreviewValidationFailureReason[];
  unknownKeys: readonly string[];
  blockedFieldMatches: readonly AccountSyncPreviewBlockedFieldMatch[];
  payloadByteLength: number;
  payloadLimitBytes: number;
  localState: readonly [];
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  appliesAccountSync: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncPreviewPayload = {
  accountSyncPreviewDigestMockVersion: typeof ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION;
  shape: "account_sync_preview_payload";
  ok: true;
  status: "accepted";
  previewOnly: true;
  requestedAt: string;
  previewId: string;
  clientStateDigest?: string;
  clientProvidedAccountId?: string;
  clientProvidedAccountIdTrustedAsOwner: false;
  ownerBoundaryAssumption: "future_server_derived_owner_required";
  localState: readonly AccountSyncPreviewLocalStateEntry[];
  payloadByteLength: number;
  payloadLimitBytes: number;
  requestFingerprint: AccountSyncRequestFingerprintStrategy;
  idempotencyKeyStrategy: AccountSyncIdempotencyKeyStrategy;
  conflictDetectionAssumptions: AccountSyncConflictDetectionAssumptions;
  rollbackDiscardBehavior: AccountSyncRollbackDiscardBehavior;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  appliesAccountSync: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncPreviewBuildResult =
  | AccountSyncPreviewPayload
  | AccountSyncPreviewRejectedPayload;

export type AccountSyncDigestStorageSummary = {
  key: AccountSyncPreviewAllowedLocalStorageKey;
  category: AccountSyncPreviewLocalStateCategory;
  present: boolean;
  itemCount: number;
  byteLength: number;
  valueFingerprint: string;
  redaction: "raw_value_removed";
};

export type AccountSyncRedactedDigestShape = {
  accountSyncPreviewDigestMockVersion: typeof ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION;
  shape: "account_sync_redacted_digest";
  previewId: string;
  requestedAt: string;
  createdAt: string;
  sourcePreviewStatus: AccountSyncPreviewBuildResult["status"];
  sourcePreviewAccepted: boolean;
  storageSummaries: readonly AccountSyncDigestStorageSummary[];
  counts: {
    presentStorageKeys: number;
    savedWords: number;
    reviewStateItems: number;
    reviewEvents: number;
    dailyStatDays: number;
    packProgressEntries: number;
    upgradeInterestRecords: number;
  };
  requestFingerprint: AccountSyncRequestFingerprintStrategy;
  idempotencyKeyStrategy: AccountSyncIdempotencyKeyStrategy;
  auditRedactionRules: AccountSyncAuditRedactionRules;
  verdicts: AccountSyncPreviewVerdicts;
  implementationScope: AccountSyncPreviewImplementationScope;
  containsRawLocalState: false;
  containsRawReviewEvents: false;
  containsRawPaymentData: false;
  containsProviderTokens: false;
  containsSecrets: false;
  grantsPaidEntitlement: false;
  mutatesRuntimeStorage: false;
  appliesAccountSync: false;
};

export type AccountSyncIdempotencyKeyStrategy = {
  futureApplyRequiresIdempotencyKey: true;
  previewRequiresIdempotencyKey: false;
  keySource: "future_client_generated_opaque_key";
  scope: "authenticated_account_owner_plus_apply_route";
  sameKeySameFingerprint: "replay_original_redacted_outcome_without_mutation";
  sameKeyDifferentFingerprint: "reject_as_conflict_before_write";
  rawKeyStoredInAudit: false;
  implementedInThisMock: false;
};

export type AccountSyncRequestFingerprintStrategy = {
  algorithm: "canonical_json_sha256_design_mock";
  value: string;
  covers: readonly (
    | "payload_version"
    | "preview_only"
    | "allowed_storage_key_order"
    | "storage_value_fingerprints"
    | "requested_at"
  )[];
  excludes: readonly (
    | "provider_tokens"
    | "production_secrets"
    | "payment_billing_payloads"
    | "paid_entitlement_state"
  )[];
  storesRawPayload: false;
};

export type AccountSyncConflictDetectionAssumptions = {
  futureServerStateRequired: true;
  detectsLocalOnlySavedWords: true;
  detectsLocalReviewEventsNotOnServer: true;
  detectsDuplicateReviewEvents: true;
  detectsPackProgressWithoutReviewEventEvidence: true;
  detectsUpgradeInterestAsAttributionOnly: true;
  treatsLocalMasteredAsClientClaimOnly: true;
  serverMasteryRequiresDelayedReviewEventEvidence: true;
  implementedInThisMock: false;
};

export type AccountSyncAuditRedactionRules = {
  digestContainsCountsOnly: true;
  digestContainsFingerprintsOnly: true;
  auditStoresRawLocalSnapshot: false;
  auditStoresRawReviewEvents: false;
  auditStoresProviderTokens: false;
  auditStoresProductionSecrets: false;
  auditStoresBillingPaymentPayloads: false;
  auditStoresPaidEntitlementState: false;
  unknownFieldsDefault: "redacted_marker_only";
};

export type AccountSyncRollbackDiscardBehavior = {
  previewCanBeDiscardedWithoutStateChange: true;
  discardDeletesNoLearningState: true;
  discardRequiresNoRollbackMigration: true;
  applyRollbackImplemented: false;
  reason: string;
};

export type AccountSyncPreviewP0Blocker = {
  id: string;
  title: string;
  blocksRealAccountSync: boolean;
  blocksPublicPaidBeta: boolean;
};

export type AccountSyncPreviewNextPR = {
  prNumber: 83 | 84 | 85;
  title: string;
  docsContractsTestsOnly: true;
  realAccountSyncImplementationRecommended: false;
};

export type AccountSyncPreviewDigestMockContract = {
  accountSyncPreviewDigestMockVersion: typeof ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION;
  purpose: string;
  allowedLocalStateCategories: readonly AccountSyncPreviewAllowedLocalStateCategory[];
  blockedSensitiveFields: readonly AccountSyncPreviewBlockedField[];
  payloadLimitPolicy: AccountSyncPreviewPayloadLimitPolicy;
  previewPayloadShape: {
    shape: AccountSyncPreviewPayload["shape"];
    requiredFields: readonly ("requestedAt" | "previewOnly" | "localState")[];
    previewOnlyMustBeTrue: true;
    mutatesRuntimeStorage: false;
    appliesAccountSync: false;
  };
  redactedDigestShape: {
    shape: AccountSyncRedactedDigestShape["shape"];
    rawLocalStateIncluded: false;
    rawReviewEventsIncluded: false;
    rawPaymentDataIncluded: false;
    providerTokensIncluded: false;
    secretsIncluded: false;
  };
  malformedPayloadHandling: {
    rejectsMalformedBeforeConflictDetection: true;
    rejectsUnknownStorageKeys: true;
    rejectsBlockedSensitiveFields: true;
    rejectedPayloadCanApplyWrite: false;
    rejectedPayloadCanMutateStorage: false;
  };
  ownerAccountBoundaryAssumptions: {
    futureServerDerivedOwnerRequired: true;
    clientProvidedAccountIdTrustedAsOwner: false;
    previewMayUseClientProvidedAccountIdForDisplayOnly: true;
    crossAccountApplyBlockedUntilRealAuthExists: true;
  };
  idempotencyKeyStrategy: AccountSyncIdempotencyKeyStrategy;
  requestFingerprintStrategy: Omit<AccountSyncRequestFingerprintStrategy, "value">;
  conflictDetectionAssumptions: AccountSyncConflictDetectionAssumptions;
  auditRedactionRules: AccountSyncAuditRedactionRules;
  rollbackDiscardBehavior: AccountSyncRollbackDiscardBehavior;
  verdicts: AccountSyncPreviewVerdicts;
  implementationScope: AccountSyncPreviewImplementationScope;
  p0Blockers: readonly AccountSyncPreviewP0Blocker[];
  nextPRSequence: readonly AccountSyncPreviewNextPR[];
};

type JsonValidationResult = {
  ok: boolean;
  reason?: "malformed_payload";
};

export const ACCOUNT_SYNC_PREVIEW_ALLOWED_LOCAL_STATE_CATEGORIES = [
  {
    key: VLX_STORAGE_KEYS.savedWords,
    category: "saved_words",
    label: "Saved words",
    expectedJsonType: "record",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "learning_state_candidate",
    grantsPaidEntitlement: false,
    notes:
      "Saved-word metadata can seed account saved words without resetting existing review state."
  },
  {
    key: VLX_STORAGE_KEYS.reviewState,
    category: "review_state",
    label: "Review state",
    expectedJsonType: "record",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "learning_state_candidate",
    grantsPaidEntitlement: false,
    notes:
      "Local mastery is only a client claim; future server mastery must be event-evidence derived."
  },
  {
    key: VLX_STORAGE_KEYS.reviewEvents,
    category: "review_events",
    label: "Review events",
    expectedJsonType: "array",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "review_event_evidence",
    grantsPaidEntitlement: false,
    notes:
      "Review events are the primary evidence for future SRS recomputation."
  },
  {
    key: VLX_STORAGE_KEYS.dailyStats,
    category: "daily_stats",
    label: "Daily stats",
    expectedJsonType: "record",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "event_derived_or_audit_only",
    grantsPaidEntitlement: false,
    notes:
      "Daily stats are previewable but future durable stats should be derived from accepted review events."
  },
  {
    key: VLX_PACK_PROGRESS_STORAGE_KEY,
    category: "pack_progress",
    label: "Pack progress",
    expectedJsonType: "record",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "event_derived_or_audit_only",
    grantsPaidEntitlement: false,
    notes:
      "Pack progress without matching review-event evidence remains audit-only."
  },
  {
    key: VLX_UPGRADE_INTEREST_STORAGE_KEY,
    category: "upgrade_interest",
    label: "Upgrade interest",
    expectedJsonType: "array",
    allowedInPreviewPayload: true,
    redactedDigestMode: "count_byte_length_and_fingerprint_only",
    futureApplyMode: "attribution_only",
    grantsPaidEntitlement: false,
    notes:
      "Upgrade interest is attribution-only and can never grant paid access."
  }
] as const satisfies readonly AccountSyncPreviewAllowedLocalStateCategory[];

export const ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS = [
  {
    fieldName: "providerToken",
    category: "provider_token",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Provider tokens are never account-sync payload material."
  },
  {
    fieldName: "accessToken",
    category: "provider_token",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Auth access tokens must not appear in preview or digest payloads."
  },
  {
    fieldName: "refreshToken",
    category: "provider_token",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Refresh tokens must not appear in preview or digest payloads."
  },
  {
    fieldName: "sessionToken",
    category: "auth_session",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Session material belongs to future server auth, not local sync."
  },
  {
    fieldName: "apiKey",
    category: "secret_or_credential",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "API keys and credentials are secrets."
  },
  {
    fieldName: "secret",
    category: "secret_or_credential",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Secrets are forbidden in all account-sync preview material."
  },
  {
    fieldName: "credential",
    category: "secret_or_credential",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Credentials are forbidden in all account-sync preview material."
  },
  {
    fieldName: "env",
    category: "production_data",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Environment data and deployment state are outside this contract."
  },
  {
    fieldName: "paymentMethod",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Raw payment data is outside account sync."
  },
  {
    fieldName: "checkoutSession",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Checkout state is outside account sync."
  },
  {
    fieldName: "subscription",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Subscription state is outside account sync."
  },
  {
    fieldName: "invoice",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Invoices and billing records are outside account sync."
  },
  {
    fieldName: "billingState",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Billing state is outside account sync."
  },
  {
    fieldName: "rawPaymentPayload",
    category: "billing_payment",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Raw payment payloads are forbidden."
  },
  {
    fieldName: "entitlementGrant",
    category: "entitlement",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Account sync preview cannot grant paid entitlement."
  },
  {
    fieldName: "paidEntitlement",
    category: "entitlement",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Paid entitlement is manual-only and outside this preview."
  },
  {
    fieldName: "rawProductionUserData",
    category: "production_data",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Production user data mutation is forbidden."
  },
  {
    fieldName: "rawLocalStorageDump",
    category: "raw_sensitive_payload",
    blockedInPreview: true,
    blockedInDigest: true,
    reason: "Only enumerated local state categories are previewable."
  }
] as const satisfies readonly AccountSyncPreviewBlockedField[];

export const ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY = {
  previewPayloadMaxBytes: 98_304,
  redactedDigestMaxBytes: 32_768,
  maxAllowedStorageKeys: ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS.length,
  maxReviewEvents: 100,
  maxSavedWords: 200,
  maxPackProgressEntries: 50,
  maxUpgradeInterestRecords: 10,
  unlimitedPayloadAllowed: false,
  oversizedPayloadAccepted: false
} as const satisfies AccountSyncPreviewPayloadLimitPolicy;

export const ACCOUNT_SYNC_PREVIEW_VERDICTS = {
  realAccountSync: "blocked",
  previewDigestMock: "allowed",
  applyWriteOperation: "blocked",
  publicPaidBeta: "no_go",
  privatePaidBeta: "conditional_manual_only"
} as const satisfies AccountSyncPreviewVerdicts;

export const ACCOUNT_SYNC_PREVIEW_IMPLEMENTATION_SCOPE = {
  docsContractsTestsOnly: true,
  noRuntimeBehaviorChange: true,
  noApiRoutes: true,
  noRouteHandlers: true,
  noMiddleware: true,
  noAuthIntegrations: true,
  noDatabaseProviderSdk: true,
  noPaymentProviderSdk: true,
  noNetworkCalls: true,
  noBrowserStorageMutation: true,
  noProductionDataMutation: true,
  noEnvVarChanges: true,
  noAiCalls: true,
  noDeploymentChanges: true
} as const satisfies AccountSyncPreviewImplementationScope;

export const ACCOUNT_SYNC_IDEMPOTENCY_KEY_STRATEGY = {
  futureApplyRequiresIdempotencyKey: true,
  previewRequiresIdempotencyKey: false,
  keySource: "future_client_generated_opaque_key",
  scope: "authenticated_account_owner_plus_apply_route",
  sameKeySameFingerprint: "replay_original_redacted_outcome_without_mutation",
  sameKeyDifferentFingerprint: "reject_as_conflict_before_write",
  rawKeyStoredInAudit: false,
  implementedInThisMock: false
} as const satisfies AccountSyncIdempotencyKeyStrategy;

export const ACCOUNT_SYNC_REQUEST_FINGERPRINT_STRATEGY = {
  algorithm: "canonical_json_sha256_design_mock",
  covers: [
    "payload_version",
    "preview_only",
    "allowed_storage_key_order",
    "storage_value_fingerprints",
    "requested_at"
  ],
  excludes: [
    "provider_tokens",
    "production_secrets",
    "payment_billing_payloads",
    "paid_entitlement_state"
  ],
  storesRawPayload: false
} as const satisfies Omit<AccountSyncRequestFingerprintStrategy, "value">;

export const ACCOUNT_SYNC_CONFLICT_DETECTION_ASSUMPTIONS = {
  futureServerStateRequired: true,
  detectsLocalOnlySavedWords: true,
  detectsLocalReviewEventsNotOnServer: true,
  detectsDuplicateReviewEvents: true,
  detectsPackProgressWithoutReviewEventEvidence: true,
  detectsUpgradeInterestAsAttributionOnly: true,
  treatsLocalMasteredAsClientClaimOnly: true,
  serverMasteryRequiresDelayedReviewEventEvidence: true,
  implementedInThisMock: false
} as const satisfies AccountSyncConflictDetectionAssumptions;

export const ACCOUNT_SYNC_AUDIT_REDACTION_RULES = {
  digestContainsCountsOnly: true,
  digestContainsFingerprintsOnly: true,
  auditStoresRawLocalSnapshot: false,
  auditStoresRawReviewEvents: false,
  auditStoresProviderTokens: false,
  auditStoresProductionSecrets: false,
  auditStoresBillingPaymentPayloads: false,
  auditStoresPaidEntitlementState: false,
  unknownFieldsDefault: "redacted_marker_only"
} as const satisfies AccountSyncAuditRedactionRules;

export const ACCOUNT_SYNC_ROLLBACK_DISCARD_BEHAVIOR = {
  previewCanBeDiscardedWithoutStateChange: true,
  discardDeletesNoLearningState: true,
  discardRequiresNoRollbackMigration: true,
  applyRollbackImplemented: false,
  reason:
    "This mock creates preview and digest objects only; discarding them leaves existing browser learning state untouched."
} as const satisfies AccountSyncRollbackDiscardBehavior;

export const ACCOUNT_SYNC_PREVIEW_P0_BLOCKERS = [
  {
    id: "real_account_sync_not_implemented",
    title: "Real account sync is blocked until auth ownership, server writes, and rollback gates exist.",
    blocksRealAccountSync: true,
    blocksPublicPaidBeta: true
  },
  {
    id: "apply_write_operation_not_implemented",
    title: "Apply/write operation is blocked; this PR defines preview and digest only.",
    blocksRealAccountSync: true,
    blocksPublicPaidBeta: true
  },
  {
    id: "manual_payment_entitlement_only",
    title: "Automatic entitlement remains blocked; private beta is manual-only.",
    blocksRealAccountSync: false,
    blocksPublicPaidBeta: true
  },
  {
    id: "monitoring_support_privacy_gate_missing",
    title: "Monitoring, support, and privacy beta gate must be completed before owner-run private beta launch.",
    blocksRealAccountSync: false,
    blocksPublicPaidBeta: true
  }
] as const satisfies readonly AccountSyncPreviewP0Blocker[];

export const ACCOUNT_SYNC_PREVIEW_NEXT_PR_SEQUENCE = [
  {
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    docsContractsTestsOnly: true,
    realAccountSyncImplementationRecommended: false
  },
  {
    prNumber: 84,
    title: "Private beta readiness rerun",
    docsContractsTestsOnly: true,
    realAccountSyncImplementationRecommended: false
  },
  {
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    docsContractsTestsOnly: true,
    realAccountSyncImplementationRecommended: false
  }
] as const satisfies readonly AccountSyncPreviewNextPR[];

export const ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK = {
  accountSyncPreviewDigestMockVersion: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
  purpose:
    "Define a docs/contracts/tests-only account sync preview and redacted digest mock for existing Track B local learning state before any real sync implementation.",
  allowedLocalStateCategories: ACCOUNT_SYNC_PREVIEW_ALLOWED_LOCAL_STATE_CATEGORIES,
  blockedSensitiveFields: ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS,
  payloadLimitPolicy: ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY,
  previewPayloadShape: {
    shape: "account_sync_preview_payload",
    requiredFields: ["requestedAt", "previewOnly", "localState"],
    previewOnlyMustBeTrue: true,
    mutatesRuntimeStorage: false,
    appliesAccountSync: false
  },
  redactedDigestShape: {
    shape: "account_sync_redacted_digest",
    rawLocalStateIncluded: false,
    rawReviewEventsIncluded: false,
    rawPaymentDataIncluded: false,
    providerTokensIncluded: false,
    secretsIncluded: false
  },
  malformedPayloadHandling: {
    rejectsMalformedBeforeConflictDetection: true,
    rejectsUnknownStorageKeys: true,
    rejectsBlockedSensitiveFields: true,
    rejectedPayloadCanApplyWrite: false,
    rejectedPayloadCanMutateStorage: false
  },
  ownerAccountBoundaryAssumptions: {
    futureServerDerivedOwnerRequired: true,
    clientProvidedAccountIdTrustedAsOwner: false,
    previewMayUseClientProvidedAccountIdForDisplayOnly: true,
    crossAccountApplyBlockedUntilRealAuthExists: true
  },
  idempotencyKeyStrategy: ACCOUNT_SYNC_IDEMPOTENCY_KEY_STRATEGY,
  requestFingerprintStrategy: ACCOUNT_SYNC_REQUEST_FINGERPRINT_STRATEGY,
  conflictDetectionAssumptions: ACCOUNT_SYNC_CONFLICT_DETECTION_ASSUMPTIONS,
  auditRedactionRules: ACCOUNT_SYNC_AUDIT_REDACTION_RULES,
  rollbackDiscardBehavior: ACCOUNT_SYNC_ROLLBACK_DISCARD_BEHAVIOR,
  verdicts: ACCOUNT_SYNC_PREVIEW_VERDICTS,
  implementationScope: ACCOUNT_SYNC_PREVIEW_IMPLEMENTATION_SCOPE,
  p0Blockers: ACCOUNT_SYNC_PREVIEW_P0_BLOCKERS,
  nextPRSequence: ACCOUNT_SYNC_PREVIEW_NEXT_PR_SEQUENCE
} as const satisfies AccountSyncPreviewDigestMockContract;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCategoryForKey(key: string) {
  return ACCOUNT_SYNC_PREVIEW_ALLOWED_LOCAL_STATE_CATEGORIES.find(
    (category) => category.key === key
  );
}

function getValueType(value: unknown): AccountSyncPreviewExpectedJsonType | "missing" {
  if (Array.isArray(value)) {
    return "array";
  }

  if (isRecord(value)) {
    return "record";
  }

  return "missing";
}

function countItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (isRecord(value)) {
    return Object.keys(value).length;
  }

  return 0;
}

function validateJsonValue(
  value: unknown,
  seen = new WeakSet<object>()
): JsonValidationResult {
  if (value === null) {
    return { ok: true };
  }

  const valueType = typeof value;

  if (valueType === "string" || valueType === "boolean") {
    return { ok: true };
  }

  if (valueType === "number") {
    return { ok: Number.isFinite(value), reason: "malformed_payload" };
  }

  if (valueType !== "object") {
    return { ok: false, reason: "malformed_payload" };
  }

  const objectValue = value as object;

  if (seen.has(objectValue)) {
    return { ok: false, reason: "malformed_payload" };
  }

  seen.add(objectValue);

  if (Array.isArray(value)) {
    for (const item of value) {
      const itemDecision = validateJsonValue(item, seen);

      if (!itemDecision.ok) {
        return itemDecision;
      }
    }

    return { ok: true };
  }

  for (const [key, nestedValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!key) {
      return { ok: false, reason: "malformed_payload" };
    }

    const nestedDecision = validateJsonValue(nestedValue, seen);

    if (!nestedDecision.ok) {
      return nestedDecision;
    }
  }

  return { ok: true };
}

function canonicalStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }

  const valueType = typeof value;

  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`)
      .join(",")}}`;
  }

  return "undefined";
}

function getByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

function fingerprintCanonicalValue(value: unknown) {
  const canonicalValue = canonicalStringify(value);
  let hash = 2_166_136_261;

  for (let index = 0; index < canonicalValue.length; index += 1) {
    hash ^= canonicalValue.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return `mock-fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function collectBlockedFieldMatches(
  value: unknown,
  path: string[] = []
): AccountSyncPreviewBlockedFieldMatch[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectBlockedFieldMatches(item, [...path, String(index)])
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  const matches: AccountSyncPreviewBlockedFieldMatch[] = [];

  for (const [key, nestedValue] of Object.entries(value)) {
    const blockedField = ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS.find(
      (field) => field.fieldName.toLowerCase() === key.toLowerCase()
    );
    const nextPath = [...path, key];

    if (blockedField) {
      matches.push({
        path: nextPath.join("."),
        fieldName: key,
        blockedCategory: blockedField.category
      });
    }

    matches.push(...collectBlockedFieldMatches(nestedValue, nextPath));
  }

  return matches;
}

function buildLocalStateEntries(
  storageValues: AccountSyncPreviewStorageInput
): readonly AccountSyncPreviewLocalStateEntry[] {
  return ACCOUNT_SYNC_PREVIEW_ALLOWED_LOCAL_STATE_CATEGORIES.map((category) => {
    const value = storageValues[category.key];
    const present = typeof value !== "undefined";
    const canonicalValue = present ? canonicalStringify(value) : "";

    return {
      key: category.key,
      category: category.category,
      present,
      valueType: present ? getValueType(value) : "missing",
      itemCount: present ? countItems(value) : 0,
      byteLength: present ? getByteLength(canonicalValue) : 0,
      valueFingerprint: present
        ? fingerprintCanonicalValue(value)
        : "mock-fnv1a-00000000",
      ...(present ? { previewValue: value } : {})
    };
  });
}

function buildRequestFingerprint({
  requestedAt,
  localState
}: {
  requestedAt: string;
  localState: readonly AccountSyncPreviewLocalStateEntry[];
}): AccountSyncRequestFingerprintStrategy {
  return {
    ...ACCOUNT_SYNC_REQUEST_FINGERPRINT_STRATEGY,
    value: fingerprintCanonicalValue({
      version: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
      previewOnly: true,
      requestedAt,
      keys: ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS,
      storageFingerprints: localState.map((entry) => ({
        key: entry.key,
        present: entry.present,
        valueFingerprint: entry.valueFingerprint
      }))
    })
  };
}

function getCountForCategory(
  localState: readonly AccountSyncPreviewLocalStateEntry[],
  category: AccountSyncPreviewLocalStateCategory
) {
  return localState.find((entry) => entry.category === category)?.itemCount ?? 0;
}

export function getAccountSyncPreviewAllowedKeys() {
  return [...ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS];
}

export function getAccountSyncPreviewBlockedFields() {
  return [...ACCOUNT_SYNC_PREVIEW_BLOCKED_FIELDS];
}

export function getAccountSyncPreviewP0Blockers() {
  return [...ACCOUNT_SYNC_PREVIEW_P0_BLOCKERS];
}

export function getAccountSyncPreviewNextPRSequence() {
  return [...ACCOUNT_SYNC_PREVIEW_NEXT_PR_SEQUENCE];
}

export function getAccountSyncPreviewDigestMock() {
  return ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK;
}

export function validateAccountSyncPreviewPayloadInput(
  input: AccountSyncPreviewPayloadInput
): AccountSyncPreviewValidationDecision {
  const unknownKeys = Object.keys(input.storageValues).filter(
    (key) => !getCategoryForKey(key)
  );
  const localState = buildLocalStateEntries(input.storageValues);
  const failureReasons: AccountSyncPreviewValidationFailureReason[] = [];
  const blockedFieldMatches = ACCOUNT_SYNC_PREVIEW_ALLOWED_KEYS.flatMap((key) =>
    collectBlockedFieldMatches(input.storageValues[key], [key])
  );

  if (input.previewOnly !== true) {
    failureReasons.push("preview_only_required");
  }

  if (unknownKeys.length > 0) {
    failureReasons.push("unknown_storage_key");
  }

  for (const category of ACCOUNT_SYNC_PREVIEW_ALLOWED_LOCAL_STATE_CATEGORIES) {
    const value = input.storageValues[category.key];

    if (typeof value === "undefined") {
      continue;
    }

    const valueType = getValueType(value);
    const jsonDecision = validateJsonValue(value);

    if (valueType !== category.expectedJsonType || !jsonDecision.ok) {
      failureReasons.push("malformed_payload");
    }
  }

  if (blockedFieldMatches.length > 0) {
    failureReasons.push("blocked_sensitive_field");
  }

  const payloadByteLength = getByteLength(
    canonicalStringify({
      version: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
      previewOnly: input.previewOnly,
      requestedAt: input.requestedAt,
      storageValues: input.storageValues
    })
  );

  if (
    payloadByteLength >
    ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.previewPayloadMaxBytes
  ) {
    failureReasons.push("payload_too_large");
  }

  if (
    getCountForCategory(localState, "review_events") >
    ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.maxReviewEvents
  ) {
    failureReasons.push("review_event_count_too_large");
  }

  if (
    getCountForCategory(localState, "saved_words") >
    ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.maxSavedWords
  ) {
    failureReasons.push("saved_word_count_too_large");
  }

  if (
    getCountForCategory(localState, "pack_progress") >
    ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.maxPackProgressEntries
  ) {
    failureReasons.push("pack_progress_count_too_large");
  }

  if (
    getCountForCategory(localState, "upgrade_interest") >
    ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.maxUpgradeInterestRecords
  ) {
    failureReasons.push("upgrade_interest_count_too_large");
  }

  const uniqueFailureReasons = Array.from(new Set(failureReasons));

  return {
    ok: uniqueFailureReasons.length === 0,
    status: uniqueFailureReasons.length === 0 ? "accepted" : "rejected",
    failureReasons: uniqueFailureReasons,
    unknownKeys,
    blockedFieldMatches,
    payloadByteLength,
    payloadLimitBytes:
      ACCOUNT_SYNC_PREVIEW_PAYLOAD_LIMIT_POLICY.previewPayloadMaxBytes,
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    appliesAccountSync: false,
    grantsPaidEntitlement: false
  };
}

export function buildAccountSyncPreviewPayload(
  input: AccountSyncPreviewPayloadInput
): AccountSyncPreviewBuildResult {
  const validation = validateAccountSyncPreviewPayloadInput(input);

  if (!validation.ok) {
    return {
      accountSyncPreviewDigestMockVersion: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
      shape: "account_sync_preview_payload",
      ok: false,
      status: "rejected",
      previewOnly: input.previewOnly === true,
      requestedAt: input.requestedAt,
      failureReasons: validation.failureReasons,
      unknownKeys: validation.unknownKeys,
      blockedFieldMatches: validation.blockedFieldMatches,
      payloadByteLength: validation.payloadByteLength,
      payloadLimitBytes: validation.payloadLimitBytes,
      localState: [],
      mutatesRuntimeStorage: false,
      callsNetwork: false,
      appliesAccountSync: false,
      grantsPaidEntitlement: false
    };
  }

  const localState = buildLocalStateEntries(input.storageValues);
  const requestFingerprint = buildRequestFingerprint({
    requestedAt: input.requestedAt,
    localState
  });

  return {
    accountSyncPreviewDigestMockVersion: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
    shape: "account_sync_preview_payload",
    ok: true,
    status: "accepted",
    previewOnly: true,
    requestedAt: input.requestedAt,
    previewId: `preview_${requestFingerprint.value}`,
    clientStateDigest: input.clientStateDigest,
    clientProvidedAccountId: input.clientProvidedAccountId,
    clientProvidedAccountIdTrustedAsOwner: false,
    ownerBoundaryAssumption: "future_server_derived_owner_required",
    localState,
    payloadByteLength: validation.payloadByteLength,
    payloadLimitBytes: validation.payloadLimitBytes,
    requestFingerprint,
    idempotencyKeyStrategy: ACCOUNT_SYNC_IDEMPOTENCY_KEY_STRATEGY,
    conflictDetectionAssumptions: ACCOUNT_SYNC_CONFLICT_DETECTION_ASSUMPTIONS,
    rollbackDiscardBehavior: ACCOUNT_SYNC_ROLLBACK_DISCARD_BEHAVIOR,
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    appliesAccountSync: false,
    grantsPaidEntitlement: false
  };
}

export function buildAccountSyncDigest({
  preview,
  createdAt
}: {
  preview: AccountSyncPreviewBuildResult;
  createdAt: string;
}): AccountSyncRedactedDigestShape {
  const localState = preview.ok ? preview.localState : [];
  const requestFingerprint = preview.ok
    ? preview.requestFingerprint
    : {
        ...ACCOUNT_SYNC_REQUEST_FINGERPRINT_STRATEGY,
        value: fingerprintCanonicalValue({
          requestedAt: preview.requestedAt,
          status: preview.status,
          failureReasons: preview.failureReasons
        })
      };

  return {
    accountSyncPreviewDigestMockVersion: ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK_VERSION,
    shape: "account_sync_redacted_digest",
    previewId: preview.ok ? preview.previewId : `rejected_${requestFingerprint.value}`,
    requestedAt: preview.requestedAt,
    createdAt,
    sourcePreviewStatus: preview.status,
    sourcePreviewAccepted: preview.ok,
    storageSummaries: localState.map((entry) => ({
      key: entry.key,
      category: entry.category,
      present: entry.present,
      itemCount: entry.itemCount,
      byteLength: entry.byteLength,
      valueFingerprint: entry.valueFingerprint,
      redaction: "raw_value_removed"
    })),
    counts: {
      presentStorageKeys: localState.filter((entry) => entry.present).length,
      savedWords: getCountForCategory(localState, "saved_words"),
      reviewStateItems: getCountForCategory(localState, "review_state"),
      reviewEvents: getCountForCategory(localState, "review_events"),
      dailyStatDays: getCountForCategory(localState, "daily_stats"),
      packProgressEntries: getCountForCategory(localState, "pack_progress"),
      upgradeInterestRecords: getCountForCategory(localState, "upgrade_interest")
    },
    requestFingerprint,
    idempotencyKeyStrategy: ACCOUNT_SYNC_IDEMPOTENCY_KEY_STRATEGY,
    auditRedactionRules: ACCOUNT_SYNC_AUDIT_REDACTION_RULES,
    verdicts: ACCOUNT_SYNC_PREVIEW_VERDICTS,
    implementationScope: ACCOUNT_SYNC_PREVIEW_IMPLEMENTATION_SCOPE,
    containsRawLocalState: false,
    containsRawReviewEvents: false,
    containsRawPaymentData: false,
    containsProviderTokens: false,
    containsSecrets: false,
    grantsPaidEntitlement: false,
    mutatesRuntimeStorage: false,
    appliesAccountSync: false
  };
}

export function redactAccountSyncPreviewPayload(
  preview: AccountSyncPreviewBuildResult,
  createdAt = preview.requestedAt
) {
  return buildAccountSyncDigest({ preview, createdAt });
}
