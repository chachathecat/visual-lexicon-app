import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_AUDIT_POLICY_VERSION = 1 as const;

export type AccountSyncAuditPolicyVersion =
  typeof ACCOUNT_SYNC_AUDIT_POLICY_VERSION;

export type AccountSyncAuditEventType =
  | "preview_requested"
  | "preview_rejected"
  | "apply_requested"
  | "apply_replayed"
  | "apply_accepted"
  | "apply_blocked"
  | "apply_rejected"
  | "apply_conflict"
  | "digest_requested"
  | "digest_rejected"
  | "audit_requested"
  | "audit_rejected"
  | "schema_rejected"
  | "payload_too_large"
  | "ownership_rejected"
  | "idempotency_conflict"
  | "fake_mastery_blocked"
  | "paid_entitlement_ignored"
  | "billing_payload_rejected";

export type AccountSyncAuditSeverity =
  | "info"
  | "warning"
  | "blocked"
  | "critical";

export type AccountSyncSensitiveFieldClassification =
  | "allowed_summary"
  | "hashed_or_count_only"
  | "redacted"
  | "forbidden";

export type AccountSyncSensitiveFieldName =
  | "accountOwnerId"
  | "auditId"
  | "eventType"
  | "routeId"
  | "severity"
  | "reasonCodes"
  | "counts"
  | "createdAt"
  | "retentionUntil"
  | "planId"
  | "requestFingerprint"
  | "idempotencyKey"
  | "reviewEventIds"
  | "savedWordSlugs"
  | "packIds"
  | "targetAccountId"
  | "clientProvidedAccountId"
  | "upgradeInterest"
  | "clientMasteryClaim"
  | "rawGuestSnapshot"
  | "rawServerPayload"
  | "rawReviewEvents"
  | "rawSavedWords"
  | "providerToken"
  | "sessionToken"
  | "refreshToken"
  | "apiKey"
  | "secret"
  | "env"
  | "paymentMethod"
  | "checkoutSession"
  | "subscriptionPayload"
  | "billingPortalPayload"
  | "invoicePayload"
  | "productionCredential"
  | "fullAccountState"
  | "rawLocalSnapshot"
  | "accessToken"
  | "entitlementGrant"
  | "billingState";

export type AccountSyncSensitiveFieldRule = {
  fieldName: AccountSyncSensitiveFieldName;
  classification: AccountSyncSensitiveFieldClassification;
  storeMode:
    | "raw_summary_value"
    | "hash_or_count_only"
    | "redacted_marker_only"
    | "reject_field";
  allowedInAuditSummary: boolean;
  storesRawValue: boolean;
  reason: string;
};

export type AccountSyncRedactionDecision = {
  fieldName: string;
  classification: AccountSyncSensitiveFieldClassification;
  allowedInAuditSummary: boolean;
  storeMode: AccountSyncSensitiveFieldRule["storeMode"];
  storesRawValue: boolean;
  forbidden: boolean;
  reason: string;
  redactionRequired: boolean;
};

export type AccountSyncAuditSummaryShape = {
  accountSyncAuditPolicyVersion: AccountSyncAuditPolicyVersion;
  shape: "owner_scoped_redacted_audit_summary";
  requiredFields: readonly AccountSyncSensitiveFieldName[];
  allowedSummaryFields: readonly AccountSyncSensitiveFieldName[];
  hashedOrCountOnlyFields: readonly AccountSyncSensitiveFieldName[];
  redactedFields: readonly AccountSyncSensitiveFieldName[];
  forbiddenFields: readonly AccountSyncSensitiveFieldName[];
  ownerScoped: true;
  bounded: true;
  redacted: true;
  storesRawGuestSnapshot: false;
  storesRawServerPayload: false;
  storesFullReviewEventBodies: false;
  storesProviderTokens: false;
  storesProductionSecrets: false;
  storesBillingPaymentPayloads: false;
  storesFullAccountState: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncAuditRedactionPolicy = {
  accountSyncAuditPolicyVersion: AccountSyncAuditPolicyVersion;
  sensitiveFieldRules: readonly AccountSyncSensitiveFieldRule[];
  forbiddenFields: readonly AccountSyncSensitiveFieldName[];
  defaultUnknownFieldClassification: "redacted";
  auditSummariesOwnerScoped: true;
  auditSummariesRedacted: true;
  rawGuestSnapshotsAllowed: false;
  rawServerPayloadsAllowed: false;
  fullReviewEventBodiesAllowed: false;
  providerTokensAllowed: false;
  productionSecretsAllowed: false;
  billingPaymentPayloadsAllowed: false;
  fullAccountStateAllowed: false;
  paidEntitlementGrantAllowed: false;
  fakeMasteryCanBecomeServerMastery: false;
  upgradeInterestAttributionOnly: true;
  packProgressWithoutReviewEvidenceAuditOnly: true;
};

export type AccountSyncAuditRetentionPolicy = {
  id: "account_sync_audit_retention_v1";
  auditSummaryRetentionDays: number;
  idempotencyConflictRetentionDays: number;
  rejectedPayloadSummaryRetentionDays: number;
  previewResponseLocalRetentionDays: 0;
  rawPayloadRetentionDays: 0;
  redactedSummariesOnly: true;
  deletesOrAvoidsRawSensitivePayloads: true;
  implementationStatus: "design_only";
};

export type AccountSyncAuditVisibilityPolicy = {
  routeId: "audit";
  method: "GET";
  path: "/api/account/sync/audit";
  ownerOnly: true;
  boundedSummariesOnly: true;
  maxSummaryCount: number;
  maxResponseBytes: number;
  returnsRawGuestSnapshots: false;
  returnsRawServerPayloads: false;
  returnsFullReviewEvents: false;
  returnsFullAccountState: false;
  supportOrOperatorVisibilityGranted: false;
  implementationStatus: "design_only";
};

export type AccountSyncDigestVisibilityPolicy = {
  routeId: "digest";
  method: "GET";
  path: "/api/account/sync/digest";
  ownerOnly: true;
  boundedMetadataOnly: true;
  maxSummaryCount: number;
  maxResponseBytes: number;
  returnsRawGuestSnapshots: false;
  returnsRawServerPayloads: false;
  returnsFullReviewEvents: false;
  returnsFullAccountState: false;
  returnsRawUpgradeInterestRecords: false;
  implementationStatus: "design_only";
};

export type AccountSyncAuditWritePolicy = {
  id:
    | "preview_response_local_audit"
    | "apply_redacted_audit_summary"
    | "rejected_payload_redacted_summary"
    | "owner_boundary_redacted_summary"
    | "digest_audit_access_summary";
  routeIds: readonly VlxAccountSyncRouteId[];
  eventTypes: readonly AccountSyncAuditEventType[];
  durableAuditWriteAllowedByDefault: boolean;
  responseLocalOnlyByDefault: boolean;
  requiresSeparateApprovalForPreviewDurableLogs: boolean;
  requiresOwnerScope: true;
  requiresOwnershipCheckBeforeDurableWrite: boolean;
  requiresSchemaCheckBeforeLearningWrite: boolean;
  requiresPayloadLimitBeforeLearningWrite: boolean;
  requiresIdempotencyCheckBeforeLearningWrite: boolean;
  writesRedactedSummaryOnly: true;
  storesRawGuestSnapshot: false;
  storesRawServerPayload: false;
  storesFullReviewEventBodies: false;
  storesProviderTokens: false;
  storesProductionSecrets: false;
  storesBillingPaymentPayloads: false;
  grantsPaidEntitlement: false;
  loggingProviderIntegrated: false;
  implementationStatus: "design_only";
};

export type AccountSyncAuditReadPolicy = {
  routeId: "audit";
  requiresOwnerOnlyAccess: true;
  requiresBoundedQuery: true;
  requiresBoundedResponse: true;
  redactedSummariesOnly: true;
  rawPayloadAccessAllowed: false;
  crossAccountReadsAllowed: false;
  supportVisibilityGranted: false;
  implementationStatus: "design_only";
};

export type AccountSyncOwnerOnlyAccessPolicy = {
  id: "account_sync_owner_only_audit_digest_access";
  appliesToRoutes: readonly ("digest" | "audit")[];
  requiresAuthenticatedServerSession: true;
  requiresServerDerivedOwner: true;
  clientAccountIdTrustedAsOwner: false;
  rejectsCrossAccountAccess: true;
  exposesTargetAccountPayloadOnReject: false;
  returnsSafeMetadataOnlyOnReject: true;
  providerTokensVisibleToOwnerRead: false;
  productionSecretsVisibleToOwnerRead: false;
  implementationStatus: "design_only";
};

export type AccountSyncAuditEventDefinition = {
  eventType: AccountSyncAuditEventType;
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  severity: AccountSyncAuditSeverity;
  mutatingRoute: boolean;
  writePolicyId: AccountSyncAuditWritePolicy["id"];
  ownerScoped: true;
  summaryShape: AccountSyncAuditSummaryShape["shape"];
  redactedSummaryOnly: true;
  durableWriteAllowedByDefault: boolean;
  responseLocalOnlyByDefault: boolean;
};

export type AccountSyncAuditWriteDecisionInput = {
  eventType: AccountSyncAuditEventType;
  ownerScoped: boolean;
  ownerAccessVerified: boolean;
  schemaValidated: boolean;
  payloadWithinLimit: boolean;
  idempotencyValidated: boolean;
  previewDurableAuditApproved?: boolean;
  crossAccountAttempt?: boolean;
  malformedPayload?: boolean;
  sameKeyDifferentFingerprint?: boolean;
  containsRawGuestSnapshot?: boolean;
  containsRawServerPayload?: boolean;
  containsFullReviewEventBodies?: boolean;
  containsProviderTokens?: boolean;
  containsProductionSecrets?: boolean;
  containsBillingPaymentPayload?: boolean;
  requestsPaidEntitlementGrant?: boolean;
  containsFakeMasteryClaim?: boolean;
  hasUpgradeInterest?: boolean;
  hasPackProgressWithoutReviewEventEvidence?: boolean;
};

export type AccountSyncAuditWriteDecision = {
  eventType: AccountSyncAuditEventType;
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  severity: AccountSyncAuditSeverity;
  writePolicyId: AccountSyncAuditWritePolicy["id"];
  durableAuditWriteAllowed: boolean;
  responseLocalOnly: boolean;
  ownerScoped: boolean;
  ownerOnlyAccessRequired: true;
  summaryShape: AccountSyncAuditSummaryShape["shape"];
  summaryRedacted: true;
  storesRawGuestSnapshot: false;
  storesRawServerPayload: false;
  storesFullReviewEventBodies: false;
  storesProviderTokens: false;
  storesProductionSecrets: false;
  storesBillingPaymentPayloads: false;
  exposesTargetAccountPayloadOnCrossAccountAttempt: false;
  malformedPayloadRawStored: false;
  sameKeyDifferentFingerprintRawPayloadStored: false;
  fakeMasteryOutcome: "blocked_or_client_claim_only" | "not_present";
  upgradeInterestMode: "attribution_only" | "not_present";
  packProgressMode:
    | "audit_only_without_review_event_evidence"
    | "event_evidence_required"
    | "not_present";
  grantsPaidEntitlement: false;
  loggingProviderIntegrated: false;
  implementationStatus: "design_only";
  failureReasons: readonly string[];
};

export type AccountSyncAuditRedactionContract = {
  accountSyncAuditPolicyVersion: AccountSyncAuditPolicyVersion;
  purpose: string;
  eventTypes: readonly AccountSyncAuditEventType[];
  eventTaxonomy: readonly AccountSyncAuditEventDefinition[];
  summaryShape: AccountSyncAuditSummaryShape;
  redactionPolicy: AccountSyncAuditRedactionPolicy;
  retentionPolicy: AccountSyncAuditRetentionPolicy;
  auditVisibilityPolicy: AccountSyncAuditVisibilityPolicy;
  digestVisibilityPolicy: AccountSyncDigestVisibilityPolicy;
  auditWritePolicies: readonly AccountSyncAuditWritePolicy[];
  auditReadPolicy: AccountSyncAuditReadPolicy;
  ownerOnlyAccessPolicy: AccountSyncOwnerOnlyAccessPolicy;
  sourceOfTruthPolicy: {
    reviewEventsRemainSourceOfTruth: true;
    fakeLocalMasteryCanBecomeServerMastery: false;
    fakeMasteryLoggedAsBlockedOrClientClaimOnly: true;
    packProgressWithoutReviewEventsAuditOnly: true;
    upgradeInterestAttributionOnly: true;
  };
  implementationScope: {
    docsContractsTestsOnly: true;
    actualApiRouteImplementation: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    realAuthAllowed: false;
    databasePersistenceAllowed: false;
    validationDependencyAllowed: false;
    authProviderSdkAllowed: false;
    databaseProviderSdkAllowed: false;
    paymentProviderSdkAllowed: false;
    loggingProviderSdkAllowed: false;
    browserNetworkHelpersAllowed: false;
    browserStorageAllowed: false;
    environmentReadsAllowed: false;
  };
  finalVerdict: {
    verdict: "design_only";
    implementationReady: false;
    realApiRouteRecommended: false;
    nextRecommendedPr: {
      number: 63;
      title: "Account sync monitoring, rollout, rollback, and kill-switch gate";
      docsContractsTestsOnly: true;
    };
  };
};

export const ACCOUNT_SYNC_AUDIT_EVENT_TYPES = [
  "preview_requested",
  "preview_rejected",
  "apply_requested",
  "apply_replayed",
  "apply_accepted",
  "apply_blocked",
  "apply_rejected",
  "apply_conflict",
  "digest_requested",
  "digest_rejected",
  "audit_requested",
  "audit_rejected",
  "schema_rejected",
  "payload_too_large",
  "ownership_rejected",
  "idempotency_conflict",
  "fake_mastery_blocked",
  "paid_entitlement_ignored",
  "billing_payload_rejected"
] as const satisfies readonly AccountSyncAuditEventType[];

export const ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES = [
  "rawGuestSnapshot",
  "rawServerPayload",
  "rawReviewEvents",
  "rawSavedWords",
  "providerToken",
  "sessionToken",
  "refreshToken",
  "apiKey",
  "secret",
  "env",
  "paymentMethod",
  "checkoutSession",
  "subscriptionPayload",
  "billingPortalPayload",
  "invoicePayload",
  "productionCredential",
  "fullAccountState"
] as const satisfies readonly AccountSyncSensitiveFieldName[];

export const ACCOUNT_SYNC_AUDIT_SENSITIVE_FIELD_RULES = [
  {
    fieldName: "accountOwnerId",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Required owner scope for future audit summary lookup."
  },
  {
    fieldName: "auditId",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Opaque audit summary id."
  },
  {
    fieldName: "eventType",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Audit taxonomy marker."
  },
  {
    fieldName: "routeId",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Planned account sync route id."
  },
  {
    fieldName: "severity",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Bounded severity label."
  },
  {
    fieldName: "reasonCodes",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Bounded policy reason codes."
  },
  {
    fieldName: "counts",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Aggregate counts only."
  },
  {
    fieldName: "createdAt",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Timestamp for bounded owner audit history."
  },
  {
    fieldName: "retentionUntil",
    classification: "allowed_summary",
    storeMode: "raw_summary_value",
    allowedInAuditSummary: true,
    storesRawValue: true,
    reason: "Retention boundary for redacted summaries."
  },
  {
    fieldName: "planId",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Plan identifiers should be opaque or hashed."
  },
  {
    fieldName: "requestFingerprint",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Request identity may be stored only as a fingerprint."
  },
  {
    fieldName: "idempotencyKey",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Idempotency keys must not be stored raw in audit output."
  },
  {
    fieldName: "reviewEventIds",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Review event evidence is count or id-reference only."
  },
  {
    fieldName: "savedWordSlugs",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Saved-word payloads are not audit summary content."
  },
  {
    fieldName: "packIds",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Pack progress is evidence-derived or audit-only."
  },
  {
    fieldName: "targetAccountId",
    classification: "hashed_or_count_only",
    storeMode: "hash_or_count_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Cross-account attempts must not expose target account payloads."
  },
  {
    fieldName: "clientProvidedAccountId",
    classification: "redacted",
    storeMode: "redacted_marker_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Client account ids are not ownership proof."
  },
  {
    fieldName: "upgradeInterest",
    classification: "redacted",
    storeMode: "redacted_marker_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Upgrade interest remains attribution-only."
  },
  {
    fieldName: "clientMasteryClaim",
    classification: "redacted",
    storeMode: "redacted_marker_only",
    allowedInAuditSummary: true,
    storesRawValue: false,
    reason: "Fake local mastery is logged only as blocked or client claim."
  },
  ...ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES.map((fieldName) => ({
    fieldName,
    classification: "forbidden" as const,
    storeMode: "reject_field" as const,
    allowedInAuditSummary: false,
    storesRawValue: false,
    reason: "Forbidden from account sync audit summaries."
  })),
  {
    fieldName: "rawLocalSnapshot",
    classification: "forbidden",
    storeMode: "reject_field",
    allowedInAuditSummary: false,
    storesRawValue: false,
    reason: "Raw local snapshots cannot be stored in audit summaries."
  },
  {
    fieldName: "accessToken",
    classification: "forbidden",
    storeMode: "reject_field",
    allowedInAuditSummary: false,
    storesRawValue: false,
    reason: "Provider tokens are forbidden."
  },
  {
    fieldName: "entitlementGrant",
    classification: "forbidden",
    storeMode: "reject_field",
    allowedInAuditSummary: false,
    storesRawValue: false,
    reason: "Account sync audit logging cannot grant paid entitlement."
  },
  {
    fieldName: "billingState",
    classification: "forbidden",
    storeMode: "reject_field",
    allowedInAuditSummary: false,
    storesRawValue: false,
    reason: "Billing state is outside account sync."
  }
] as const satisfies readonly AccountSyncSensitiveFieldRule[];

export const ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE = {
  accountSyncAuditPolicyVersion: ACCOUNT_SYNC_AUDIT_POLICY_VERSION,
  shape: "owner_scoped_redacted_audit_summary",
  requiredFields: [
    "accountOwnerId",
    "auditId",
    "eventType",
    "routeId",
    "severity",
    "reasonCodes",
    "counts",
    "createdAt",
    "retentionUntil"
  ],
  allowedSummaryFields: [
    "accountOwnerId",
    "auditId",
    "eventType",
    "routeId",
    "severity",
    "reasonCodes",
    "counts",
    "createdAt",
    "retentionUntil"
  ],
  hashedOrCountOnlyFields: [
    "planId",
    "requestFingerprint",
    "idempotencyKey",
    "reviewEventIds",
    "savedWordSlugs",
    "packIds",
    "targetAccountId"
  ],
  redactedFields: [
    "clientProvidedAccountId",
    "upgradeInterest",
    "clientMasteryClaim"
  ],
  forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES,
  ownerScoped: true,
  bounded: true,
  redacted: true,
  storesRawGuestSnapshot: false,
  storesRawServerPayload: false,
  storesFullReviewEventBodies: false,
  storesProviderTokens: false,
  storesProductionSecrets: false,
  storesBillingPaymentPayloads: false,
  storesFullAccountState: false,
  grantsPaidEntitlement: false
} as const satisfies AccountSyncAuditSummaryShape;

export const ACCOUNT_SYNC_AUDIT_REDACTION_POLICY = {
  accountSyncAuditPolicyVersion: ACCOUNT_SYNC_AUDIT_POLICY_VERSION,
  sensitiveFieldRules: ACCOUNT_SYNC_AUDIT_SENSITIVE_FIELD_RULES,
  forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES,
  defaultUnknownFieldClassification: "redacted",
  auditSummariesOwnerScoped: true,
  auditSummariesRedacted: true,
  rawGuestSnapshotsAllowed: false,
  rawServerPayloadsAllowed: false,
  fullReviewEventBodiesAllowed: false,
  providerTokensAllowed: false,
  productionSecretsAllowed: false,
  billingPaymentPayloadsAllowed: false,
  fullAccountStateAllowed: false,
  paidEntitlementGrantAllowed: false,
  fakeMasteryCanBecomeServerMastery: false,
  upgradeInterestAttributionOnly: true,
  packProgressWithoutReviewEvidenceAuditOnly: true
} as const satisfies AccountSyncAuditRedactionPolicy;

export const ACCOUNT_SYNC_AUDIT_RETENTION_POLICY = {
  id: "account_sync_audit_retention_v1",
  auditSummaryRetentionDays: 90,
  idempotencyConflictRetentionDays: 30,
  rejectedPayloadSummaryRetentionDays: 30,
  previewResponseLocalRetentionDays: 0,
  rawPayloadRetentionDays: 0,
  redactedSummariesOnly: true,
  deletesOrAvoidsRawSensitivePayloads: true,
  implementationStatus: "design_only"
} as const satisfies AccountSyncAuditRetentionPolicy;

export const ACCOUNT_SYNC_AUDIT_VISIBILITY_POLICY = {
  routeId: "audit",
  method: "GET",
  path: "/api/account/sync/audit",
  ownerOnly: true,
  boundedSummariesOnly: true,
  maxSummaryCount: 100,
  maxResponseBytes: 65_536,
  returnsRawGuestSnapshots: false,
  returnsRawServerPayloads: false,
  returnsFullReviewEvents: false,
  returnsFullAccountState: false,
  supportOrOperatorVisibilityGranted: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncAuditVisibilityPolicy;

export const ACCOUNT_SYNC_DIGEST_VISIBILITY_POLICY = {
  routeId: "digest",
  method: "GET",
  path: "/api/account/sync/digest",
  ownerOnly: true,
  boundedMetadataOnly: true,
  maxSummaryCount: 50,
  maxResponseBytes: 32_768,
  returnsRawGuestSnapshots: false,
  returnsRawServerPayloads: false,
  returnsFullReviewEvents: false,
  returnsFullAccountState: false,
  returnsRawUpgradeInterestRecords: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncDigestVisibilityPolicy;

export const ACCOUNT_SYNC_AUDIT_WRITE_POLICIES = [
  {
    id: "preview_response_local_audit",
    routeIds: ["preview"],
    eventTypes: ["preview_requested", "preview_rejected"],
    durableAuditWriteAllowedByDefault: false,
    responseLocalOnlyByDefault: true,
    requiresSeparateApprovalForPreviewDurableLogs: true,
    requiresOwnerScope: true,
    requiresOwnershipCheckBeforeDurableWrite: false,
    requiresSchemaCheckBeforeLearningWrite: true,
    requiresPayloadLimitBeforeLearningWrite: true,
    requiresIdempotencyCheckBeforeLearningWrite: false,
    writesRedactedSummaryOnly: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only"
  },
  {
    id: "apply_redacted_audit_summary",
    routeIds: ["apply"],
    eventTypes: [
      "apply_requested",
      "apply_replayed",
      "apply_accepted",
      "apply_blocked",
      "apply_rejected",
      "apply_conflict",
      "fake_mastery_blocked",
      "paid_entitlement_ignored"
    ],
    durableAuditWriteAllowedByDefault: true,
    responseLocalOnlyByDefault: false,
    requiresSeparateApprovalForPreviewDurableLogs: false,
    requiresOwnerScope: true,
    requiresOwnershipCheckBeforeDurableWrite: true,
    requiresSchemaCheckBeforeLearningWrite: true,
    requiresPayloadLimitBeforeLearningWrite: true,
    requiresIdempotencyCheckBeforeLearningWrite: true,
    writesRedactedSummaryOnly: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only"
  },
  {
    id: "rejected_payload_redacted_summary",
    routeIds: ["preview", "apply"],
    eventTypes: [
      "schema_rejected",
      "payload_too_large",
      "billing_payload_rejected"
    ],
    durableAuditWriteAllowedByDefault: true,
    responseLocalOnlyByDefault: false,
    requiresSeparateApprovalForPreviewDurableLogs: false,
    requiresOwnerScope: true,
    requiresOwnershipCheckBeforeDurableWrite: true,
    requiresSchemaCheckBeforeLearningWrite: false,
    requiresPayloadLimitBeforeLearningWrite: false,
    requiresIdempotencyCheckBeforeLearningWrite: false,
    writesRedactedSummaryOnly: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only"
  },
  {
    id: "owner_boundary_redacted_summary",
    routeIds: ["preview", "apply", "digest", "audit"],
    eventTypes: ["ownership_rejected", "idempotency_conflict"],
    durableAuditWriteAllowedByDefault: true,
    responseLocalOnlyByDefault: false,
    requiresSeparateApprovalForPreviewDurableLogs: false,
    requiresOwnerScope: true,
    requiresOwnershipCheckBeforeDurableWrite: false,
    requiresSchemaCheckBeforeLearningWrite: false,
    requiresPayloadLimitBeforeLearningWrite: false,
    requiresIdempotencyCheckBeforeLearningWrite: false,
    writesRedactedSummaryOnly: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only"
  },
  {
    id: "digest_audit_access_summary",
    routeIds: ["digest", "audit"],
    eventTypes: [
      "digest_requested",
      "digest_rejected",
      "audit_requested",
      "audit_rejected"
    ],
    durableAuditWriteAllowedByDefault: true,
    responseLocalOnlyByDefault: false,
    requiresSeparateApprovalForPreviewDurableLogs: false,
    requiresOwnerScope: true,
    requiresOwnershipCheckBeforeDurableWrite: true,
    requiresSchemaCheckBeforeLearningWrite: false,
    requiresPayloadLimitBeforeLearningWrite: true,
    requiresIdempotencyCheckBeforeLearningWrite: false,
    writesRedactedSummaryOnly: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only"
  }
] as const satisfies readonly AccountSyncAuditWritePolicy[];

export const ACCOUNT_SYNC_AUDIT_READ_POLICY = {
  routeId: "audit",
  requiresOwnerOnlyAccess: true,
  requiresBoundedQuery: true,
  requiresBoundedResponse: true,
  redactedSummariesOnly: true,
  rawPayloadAccessAllowed: false,
  crossAccountReadsAllowed: false,
  supportVisibilityGranted: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncAuditReadPolicy;

export const ACCOUNT_SYNC_OWNER_ONLY_ACCESS_POLICY = {
  id: "account_sync_owner_only_audit_digest_access",
  appliesToRoutes: ["digest", "audit"],
  requiresAuthenticatedServerSession: true,
  requiresServerDerivedOwner: true,
  clientAccountIdTrustedAsOwner: false,
  rejectsCrossAccountAccess: true,
  exposesTargetAccountPayloadOnReject: false,
  returnsSafeMetadataOnlyOnReject: true,
  providerTokensVisibleToOwnerRead: false,
  productionSecretsVisibleToOwnerRead: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncOwnerOnlyAccessPolicy;

const routeConfigByRouteId = {
  preview: {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    mutatingRoute: false
  },
  apply: {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    mutatingRoute: true
  },
  digest: {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    mutatingRoute: false
  },
  audit: {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    mutatingRoute: false
  }
} as const satisfies Record<
  VlxAccountSyncRouteId,
  {
    routeId: VlxAccountSyncRouteId;
    method: VlxAccountSyncRouteMethod;
    path: VlxAccountSyncRoutePath;
    mutatingRoute: boolean;
  }
>;

const eventRouteMap = {
  preview_requested: "preview",
  preview_rejected: "preview",
  apply_requested: "apply",
  apply_replayed: "apply",
  apply_accepted: "apply",
  apply_blocked: "apply",
  apply_rejected: "apply",
  apply_conflict: "apply",
  digest_requested: "digest",
  digest_rejected: "digest",
  audit_requested: "audit",
  audit_rejected: "audit",
  schema_rejected: "apply",
  payload_too_large: "apply",
  ownership_rejected: "apply",
  idempotency_conflict: "apply",
  fake_mastery_blocked: "apply",
  paid_entitlement_ignored: "apply",
  billing_payload_rejected: "apply"
} as const satisfies Record<AccountSyncAuditEventType, VlxAccountSyncRouteId>;

const eventSeverityMap = {
  preview_requested: "info",
  preview_rejected: "warning",
  apply_requested: "info",
  apply_replayed: "info",
  apply_accepted: "info",
  apply_blocked: "blocked",
  apply_rejected: "warning",
  apply_conflict: "warning",
  digest_requested: "info",
  digest_rejected: "warning",
  audit_requested: "info",
  audit_rejected: "warning",
  schema_rejected: "warning",
  payload_too_large: "warning",
  ownership_rejected: "critical",
  idempotency_conflict: "warning",
  fake_mastery_blocked: "blocked",
  paid_entitlement_ignored: "blocked",
  billing_payload_rejected: "blocked"
} as const satisfies Record<AccountSyncAuditEventType, AccountSyncAuditSeverity>;

function getWritePolicyForEvent(eventType: AccountSyncAuditEventType) {
  const policy = ACCOUNT_SYNC_AUDIT_WRITE_POLICIES.find((candidate) =>
    (candidate.eventTypes as readonly AccountSyncAuditEventType[]).includes(
      eventType
    )
  );

  if (!policy) {
    throw new Error(`Missing account sync audit write policy: ${eventType}`);
  }

  return policy;
}

export const ACCOUNT_SYNC_AUDIT_EVENT_TAXONOMY =
  ACCOUNT_SYNC_AUDIT_EVENT_TYPES.map((eventType) => {
    const routeId = eventRouteMap[eventType];
    const routeConfig = routeConfigByRouteId[routeId];
    const writePolicy = getWritePolicyForEvent(eventType);

    return {
      eventType,
      routeId,
      method: routeConfig.method,
      path: routeConfig.path,
      severity: eventSeverityMap[eventType],
      mutatingRoute: routeConfig.mutatingRoute,
      writePolicyId: writePolicy.id,
      ownerScoped: true,
      summaryShape: ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE.shape,
      redactedSummaryOnly: true,
      durableWriteAllowedByDefault: writePolicy.durableAuditWriteAllowedByDefault,
      responseLocalOnlyByDefault: writePolicy.responseLocalOnlyByDefault
    };
  }) satisfies readonly AccountSyncAuditEventDefinition[];

export const ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT = {
  accountSyncAuditPolicyVersion: ACCOUNT_SYNC_AUDIT_POLICY_VERSION,
  purpose:
    "Define design-only account sync audit logging, privacy redaction, sensitive payload exclusion, and owner-only digest/audit visibility before any future route implementation.",
  eventTypes: ACCOUNT_SYNC_AUDIT_EVENT_TYPES,
  eventTaxonomy: ACCOUNT_SYNC_AUDIT_EVENT_TAXONOMY,
  summaryShape: ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE,
  redactionPolicy: ACCOUNT_SYNC_AUDIT_REDACTION_POLICY,
  retentionPolicy: ACCOUNT_SYNC_AUDIT_RETENTION_POLICY,
  auditVisibilityPolicy: ACCOUNT_SYNC_AUDIT_VISIBILITY_POLICY,
  digestVisibilityPolicy: ACCOUNT_SYNC_DIGEST_VISIBILITY_POLICY,
  auditWritePolicies: ACCOUNT_SYNC_AUDIT_WRITE_POLICIES,
  auditReadPolicy: ACCOUNT_SYNC_AUDIT_READ_POLICY,
  ownerOnlyAccessPolicy: ACCOUNT_SYNC_OWNER_ONLY_ACCESS_POLICY,
  sourceOfTruthPolicy: {
    reviewEventsRemainSourceOfTruth: true,
    fakeLocalMasteryCanBecomeServerMastery: false,
    fakeMasteryLoggedAsBlockedOrClientClaimOnly: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true
  },
  implementationScope: {
    docsContractsTestsOnly: true,
    actualApiRouteImplementation: false,
    routeHandlersAllowed: false,
    middlewareAllowed: false,
    runtimeIntegrationAllowed: false,
    realAuthAllowed: false,
    databasePersistenceAllowed: false,
    validationDependencyAllowed: false,
    authProviderSdkAllowed: false,
    databaseProviderSdkAllowed: false,
    paymentProviderSdkAllowed: false,
    loggingProviderSdkAllowed: false,
    browserNetworkHelpersAllowed: false,
    browserStorageAllowed: false,
    environmentReadsAllowed: false
  },
  finalVerdict: {
    verdict: "design_only",
    implementationReady: false,
    realApiRouteRecommended: false,
    nextRecommendedPr: {
      number: 63,
      title: "Account sync monitoring, rollout, rollback, and kill-switch gate",
      docsContractsTestsOnly: true
    }
  }
} as const satisfies AccountSyncAuditRedactionContract;

export function getAccountSyncAuditEventDefinition(
  eventType: AccountSyncAuditEventType
) {
  return ACCOUNT_SYNC_AUDIT_EVENT_TAXONOMY.find(
    (definition) => definition.eventType === eventType
  );
}

export function getAccountSyncAuditWritePolicy(
  policyId: AccountSyncAuditWritePolicy["id"]
) {
  return ACCOUNT_SYNC_AUDIT_WRITE_POLICIES.find(
    (policy) => policy.id === policyId
  );
}

export function decideAccountSyncRedaction(
  fieldName: string
): AccountSyncRedactionDecision {
  const rule = ACCOUNT_SYNC_AUDIT_SENSITIVE_FIELD_RULES.find(
    (candidate) => candidate.fieldName === fieldName
  );

  if (!rule) {
    return {
      fieldName,
      classification: "redacted",
      allowedInAuditSummary: true,
      storeMode: "redacted_marker_only",
      storesRawValue: false,
      forbidden: false,
      reason: "Unknown fields default to redacted marker-only storage.",
      redactionRequired: true
    };
  }

  return {
    fieldName,
    classification: rule.classification,
    allowedInAuditSummary: rule.allowedInAuditSummary,
    storeMode: rule.storeMode,
    storesRawValue: rule.storesRawValue,
    forbidden: rule.classification === "forbidden",
    reason: rule.reason,
    redactionRequired: rule.classification !== "allowed_summary"
  };
}

export function decideAccountSyncAuditWrite(
  input: AccountSyncAuditWriteDecisionInput
): AccountSyncAuditWriteDecision {
  const eventDefinition = getAccountSyncAuditEventDefinition(input.eventType);

  if (!eventDefinition) {
    throw new Error(`Missing account sync audit event: ${input.eventType}`);
  }

  const writePolicy = getWritePolicyForEvent(input.eventType);
  const failureReasons: string[] = [];
  const requiresFullApplyGates =
    writePolicy.id === "apply_redacted_audit_summary";
  const previewDurableBlocked =
    writePolicy.id === "preview_response_local_audit" &&
    input.previewDurableAuditApproved !== true;

  if (!input.ownerScoped) {
    failureReasons.push("audit_summary_must_be_owner_scoped");
  }

  if (requiresFullApplyGates && !input.ownerAccessVerified) {
    failureReasons.push("ownership_check_required_before_apply_audit_write");
  }

  if (requiresFullApplyGates && !input.schemaValidated) {
    failureReasons.push("schema_check_required_before_apply_audit_write");
  }

  if (requiresFullApplyGates && !input.payloadWithinLimit) {
    failureReasons.push("payload_limit_required_before_apply_audit_write");
  }

  if (requiresFullApplyGates && !input.idempotencyValidated) {
    failureReasons.push("idempotency_check_required_before_apply_audit_write");
  }

  if (previewDurableBlocked) {
    failureReasons.push("preview_durable_audit_requires_separate_approval");
  }

  const durableAuditWriteAllowed =
    writePolicy.durableAuditWriteAllowedByDefault &&
    !previewDurableBlocked &&
    (!requiresFullApplyGates ||
      (input.ownerAccessVerified &&
        input.schemaValidated &&
        input.payloadWithinLimit &&
        input.idempotencyValidated));

  return {
    eventType: eventDefinition.eventType,
    routeId: eventDefinition.routeId,
    method: eventDefinition.method,
    path: eventDefinition.path,
    severity: eventDefinition.severity,
    writePolicyId: eventDefinition.writePolicyId,
    durableAuditWriteAllowed,
    responseLocalOnly:
      writePolicy.responseLocalOnlyByDefault || previewDurableBlocked,
    ownerScoped: input.ownerScoped,
    ownerOnlyAccessRequired: true,
    summaryShape: ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE.shape,
    summaryRedacted: true,
    storesRawGuestSnapshot: false,
    storesRawServerPayload: false,
    storesFullReviewEventBodies: false,
    storesProviderTokens: false,
    storesProductionSecrets: false,
    storesBillingPaymentPayloads: false,
    exposesTargetAccountPayloadOnCrossAccountAttempt: false,
    malformedPayloadRawStored: false,
    sameKeyDifferentFingerprintRawPayloadStored: false,
    fakeMasteryOutcome: input.containsFakeMasteryClaim
      ? "blocked_or_client_claim_only"
      : "not_present",
    upgradeInterestMode: input.hasUpgradeInterest
      ? "attribution_only"
      : "not_present",
    packProgressMode: input.hasPackProgressWithoutReviewEventEvidence
      ? "audit_only_without_review_event_evidence"
      : input.eventType === "apply_accepted"
        ? "event_evidence_required"
        : "not_present",
    grantsPaidEntitlement: false,
    loggingProviderIntegrated: false,
    implementationStatus: "design_only",
    failureReasons
  };
}
