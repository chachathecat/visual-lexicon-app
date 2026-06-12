import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_SCHEMA_CONTRACT_VERSION = 1 as const;

export type AccountSyncSchemaContractVersion =
  typeof ACCOUNT_SYNC_SCHEMA_CONTRACT_VERSION;

export type AccountSyncPayloadSizeClass =
  | "request_body_bytes"
  | "query_cursor_bytes"
  | "response_summary_bytes"
  | "apply_collection_items";

export type AccountSyncPayloadLimitId =
  | "preview_request_body"
  | "apply_request_body"
  | "digest_query_cursor"
  | "audit_query_cursor"
  | "digest_response_summary"
  | "audit_response_summary"
  | "review_events_per_apply"
  | "saved_words_per_apply"
  | "pack_progress_entries_per_apply"
  | "upgrade_interest_records_per_apply";

export type AccountSyncPayloadLimitPolicy = {
  id: AccountSyncPayloadLimitId;
  label: string;
  routeIds: readonly VlxAccountSyncRouteId[];
  sizeClass: AccountSyncPayloadSizeClass;
  unit: "bytes" | "items";
  ceiling: number;
  designOnlyCeiling: true;
  unlimited: false;
  requiredBeforeRealRoutes: true;
};

export type AccountSyncValidationFailureReason =
  | "malformed_payload"
  | "invalid_payload_version"
  | "payload_too_large"
  | "query_or_cursor_too_large"
  | "response_summary_too_large"
  | "review_event_count_too_large"
  | "saved_word_count_too_large"
  | "pack_progress_count_too_large"
  | "upgrade_interest_count_too_large"
  | "missing_idempotency_key"
  | "missing_client_confirmation"
  | "client_account_id_not_trusted"
  | "provider_tokens_forbidden"
  | "production_credentials_forbidden"
  | "billing_payment_payload_forbidden"
  | "paid_entitlement_payload_forbidden"
  | "fake_server_mastery_claim"
  | "raw_sensitive_payload_forbidden";

export type AccountSyncForbiddenPayloadFamily =
  | "raw_provider_tokens"
  | "production_credentials"
  | "billing_payment_checkout_subscription"
  | "paid_entitlement_grants"
  | "fake_server_mastery_claims"
  | "raw_guest_snapshots_in_digest_audit"
  | "raw_sensitive_payloads";

export type AccountSyncSensitiveFieldPolicy = {
  forbiddenPayloadFamilies: readonly AccountSyncForbiddenPayloadFamily[];
  forbiddenFieldNamePatterns: readonly string[];
  clientProvidedAccountIdTrustedAsOwnershipProof: false;
  providerTokensAllowed: false;
  productionCredentialsAllowed: false;
  billingPaymentCheckoutSubscriptionAllowed: false;
  paidEntitlementGrantAllowed: false;
  fakeServerMasteryClaimsAllowed: false;
  localMasteredAcceptedAsServerMastery: false;
  localMasteredTreatedAsClientClaimOnly: true;
  reviewEventsRemainSourceOfTruth: true;
};

export type AccountSyncMalformedPayloadPolicy = {
  previewRejectsMalformedBeforeConflictResolution: true;
  applyRejectsMalformedBeforeConflictResolution: true;
  applyRejectsMalformedBeforeIdempotencyRecord: true;
  applyRejectsMalformedBeforeLearningStateWrite: true;
  malformedApplyCanCreateIdempotencyRecord: false;
  malformedApplyCanCreatePartialLearningState: false;
  digestRejectsUnboundedQuery: true;
  auditRejectsUnboundedQuery: true;
  digestAuditReturnRawSnapshots: false;
  digestAuditReturnRawSensitivePayloads: false;
};

export type AccountSyncPreviewPayloadShape = {
  routeId: "preview";
  accountSyncPayloadVersion: AccountSyncSchemaContractVersion;
  shape: "preview_request_body";
  requiredTopLevelFields: readonly (
    | "accountSyncPayloadVersion"
    | "localSnapshot"
    | "requestedAt"
    | "previewOnly"
  )[];
  optionalTopLevelFields: readonly (
    | "clientStateDigest"
    | "clientProvidedAccountId"
  )[];
  previewOnlyMustBeTrue: true;
  localSnapshotRequired: true;
  clientProvidedAccountIdOwnershipProofTrusted: false;
  rejectsMalformedBeforeConflictResolution: true;
  mutatesLearningState: false;
  grantsPaidEntitlement: false;
};

export type AccountSyncApplyPayloadShape = {
  routeId: "apply";
  accountSyncPayloadVersion: AccountSyncSchemaContractVersion;
  shape: "apply_request_body";
  requiredTopLevelFields: readonly (
    | "accountSyncPayloadVersion"
    | "mode"
    | "idempotencyKey"
    | "clientConfirmation"
  )[];
  allowedModes: readonly (
    | "apply_previewed_plan"
    | "apply_snapshot_after_revalidation"
  )[];
  requiresPreviewedPlanOrSnapshotEvidence: true;
  requiresIdempotencyKey: true;
  requiresClientConfirmationOrSafeApplyIntent: true;
  rejectsMalformedBeforeConflictResolution: true;
  rejectsMalformedBeforeIdempotencyRecord: true;
  rejectsMalformedBeforeLearningStateWrite: true;
  grantsPaidEntitlement: false;
};

export type AccountSyncDigestQueryShape = {
  routeId: "digest";
  shape: "digest_query";
  allowedQueryFields: readonly ("cursor" | "limit" | "since" | "summaryOnly")[];
  requiresBoundedQuery: true;
  requiresBoundedResponse: true;
  returnsRawGuestSnapshot: false;
  returnsRawSensitivePayload: false;
};

export type AccountSyncAuditQueryShape = {
  routeId: "audit";
  shape: "audit_query";
  allowedQueryFields: readonly (
    | "cursor"
    | "limit"
    | "since"
    | "category"
    | "summaryOnly"
  )[];
  requiresBoundedQuery: true;
  requiresBoundedResponse: true;
  returnsRawGuestSnapshot: false;
  returnsRawSensitivePayload: false;
};

export type AccountSyncRouteSchemaPolicy = {
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  mutating: boolean;
  payloadShape:
    | AccountSyncPreviewPayloadShape["shape"]
    | AccountSyncApplyPayloadShape["shape"]
    | AccountSyncDigestQueryShape["shape"]
    | AccountSyncAuditQueryShape["shape"];
  requiresSchemaValidation: true;
  requiresPayloadSizeLimit: true;
  requiresAccountSyncPayloadVersion: boolean;
  requiresIdempotencyKey: boolean;
  requiresClientConfirmationOrSafeApplyIntent: boolean;
  rejectsMalformedBeforeConflictResolution: boolean;
  rejectsMalformedBeforeIdempotencyRecord: boolean;
  rejectsMalformedBeforeLearningStateWrite: boolean;
  noMutationPolicy: boolean;
  requiresBoundedQuery: boolean;
  requiresBoundedResponse: boolean;
  responseMustExcludeRawSensitivePayloads: true;
  trustsClientProvidedAccountIdAsOwnershipProof: false;
  fakeServerMasteryClaimsAccepted: false;
  localMasteredStateAcceptedAsServerMastery: false;
  reviewEventsRemainSourceOfTruth: true;
  packProgressWithoutReviewEventsAuditOnly: true;
  upgradeInterestAttributionOnly: true;
  grantsPaidEntitlement: false;
  billingPaymentOutsideSync: true;
  designOnly: true;
  implementsRuntimeValidation: false;
  validationDependencyIntegrated: false;
};

export type AccountSyncValidationInput = {
  routeId: VlxAccountSyncRouteId;
  payloadByteLength?: number;
  queryCursorByteLength?: number;
  responseSummaryByteLength?: number;
  reviewEventCount?: number;
  savedWordCount?: number;
  packProgressEntryCount?: number;
  upgradeInterestRecordCount?: number;
  hasMalformedPayload?: boolean;
  hasInvalidPayloadVersion?: boolean;
  missingIdempotencyKey?: boolean;
  missingClientConfirmation?: boolean;
  hasClientProvidedAccountIdAsOwnershipProof?: boolean;
  includesProviderTokens?: boolean;
  includesProductionCredentials?: boolean;
  includesBillingPaymentCheckoutSubscription?: boolean;
  requestsPaidEntitlement?: boolean;
  hasFakeServerMasteryClaim?: boolean;
  hasLocalMasteredClientClaim?: boolean;
  containsRawSensitivePayload?: boolean;
  hasReviewEventEvidence?: boolean;
  hasPackProgressWithoutReviewEventEvidence?: boolean;
  hasUpgradeInterestRecords?: boolean;
};

export type AccountSyncValidationDecision = {
  ok: boolean;
  status: "accepted" | "rejected";
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  failureReasons: readonly AccountSyncValidationFailureReason[];
  schemaValidationRequired: true;
  payloadLimitRequired: true;
  conflictResolutionAllowed: boolean;
  futureIdempotencyRecordEligible: boolean;
  futureLearningStateWriteEligible: boolean;
  actualLearningStateWriteImplemented: false;
  actualRuntimeValidationImplemented: false;
  validationDependencyIntegrated: false;
  clientAccountIdTrustedAsOwnershipProof: false;
  fakeServerMasteryAccepted: false;
  localMasteredTreatedAsClientClaimOnly: boolean;
  serverSrsRecomputedOnlyFromReviewEvents: true;
  reviewEventEvidenceRequiredForServerMastery: true;
  packProgressWithoutReviewEventsAuditOnly: boolean;
  upgradeInterestAttributionOnly: boolean;
  paidEntitlementGranted: false;
  billingPaymentAccepted: false;
  sensitivePayloadAccepted: false;
  designOnly: true;
};

export type AccountSyncSchemaPayloadContract = {
  accountSyncSchemaContractVersion: AccountSyncSchemaContractVersion;
  purpose: string;
  routePolicies: readonly AccountSyncRouteSchemaPolicy[];
  payloadLimitPolicies: readonly AccountSyncPayloadLimitPolicy[];
  payloadShapes: {
    preview: AccountSyncPreviewPayloadShape;
    apply: AccountSyncApplyPayloadShape;
    digest: AccountSyncDigestQueryShape;
    audit: AccountSyncAuditQueryShape;
  };
  sensitiveFieldPolicy: AccountSyncSensitiveFieldPolicy;
  malformedPayloadPolicy: AccountSyncMalformedPayloadPolicy;
  sourceOfTruthPolicy: {
    reviewEventsRemainSourceOfTruth: true;
    reviewStateRecomputedFromEventEvidence: true;
    fakeLocalMasteryCanBecomeServerMastery: false;
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
    browserNetworkHelpersAllowed: false;
    browserStorageAllowed: false;
    environmentReadsAllowed: false;
  };
  finalVerdict: {
    verdict: "design_only";
    implementationReady: false;
    realApiRouteRecommended: false;
    nextRecommendedPr: {
      number: 62;
      title: "Account sync audit logging and privacy redaction policy";
      docsContractsTestsOnly: true;
    };
  };
};

export const ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES = [
  {
    id: "preview_request_body",
    label: "Preview request body",
    routeIds: ["preview"],
    sizeClass: "request_body_bytes",
    unit: "bytes",
    ceiling: 98_304,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "apply_request_body",
    label: "Apply request body",
    routeIds: ["apply"],
    sizeClass: "request_body_bytes",
    unit: "bytes",
    ceiling: 163_840,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "digest_query_cursor",
    label: "Digest query and cursor metadata",
    routeIds: ["digest"],
    sizeClass: "query_cursor_bytes",
    unit: "bytes",
    ceiling: 2_048,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "audit_query_cursor",
    label: "Audit query and cursor metadata",
    routeIds: ["audit"],
    sizeClass: "query_cursor_bytes",
    unit: "bytes",
    ceiling: 4_096,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "digest_response_summary",
    label: "Digest response summary",
    routeIds: ["digest"],
    sizeClass: "response_summary_bytes",
    unit: "bytes",
    ceiling: 32_768,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "audit_response_summary",
    label: "Audit response summary",
    routeIds: ["audit"],
    sizeClass: "response_summary_bytes",
    unit: "bytes",
    ceiling: 65_536,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "review_events_per_apply",
    label: "Review events per apply",
    routeIds: ["apply"],
    sizeClass: "apply_collection_items",
    unit: "items",
    ceiling: 100,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "saved_words_per_apply",
    label: "Saved words per apply",
    routeIds: ["apply"],
    sizeClass: "apply_collection_items",
    unit: "items",
    ceiling: 200,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "pack_progress_entries_per_apply",
    label: "Pack progress entries per apply",
    routeIds: ["apply"],
    sizeClass: "apply_collection_items",
    unit: "items",
    ceiling: 50,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "upgrade_interest_records_per_apply",
    label: "Upgrade interest records per apply",
    routeIds: ["apply"],
    sizeClass: "apply_collection_items",
    unit: "items",
    ceiling: 10,
    designOnlyCeiling: true,
    unlimited: false,
    requiredBeforeRealRoutes: true
  }
] as const satisfies readonly AccountSyncPayloadLimitPolicy[];

export const ACCOUNT_SYNC_PREVIEW_PAYLOAD_SHAPE = {
  routeId: "preview",
  accountSyncPayloadVersion: ACCOUNT_SYNC_SCHEMA_CONTRACT_VERSION,
  shape: "preview_request_body",
  requiredTopLevelFields: [
    "accountSyncPayloadVersion",
    "localSnapshot",
    "requestedAt",
    "previewOnly"
  ],
  optionalTopLevelFields: ["clientStateDigest", "clientProvidedAccountId"],
  previewOnlyMustBeTrue: true,
  localSnapshotRequired: true,
  clientProvidedAccountIdOwnershipProofTrusted: false,
  rejectsMalformedBeforeConflictResolution: true,
  mutatesLearningState: false,
  grantsPaidEntitlement: false
} as const satisfies AccountSyncPreviewPayloadShape;

export const ACCOUNT_SYNC_APPLY_PAYLOAD_SHAPE = {
  routeId: "apply",
  accountSyncPayloadVersion: ACCOUNT_SYNC_SCHEMA_CONTRACT_VERSION,
  shape: "apply_request_body",
  requiredTopLevelFields: [
    "accountSyncPayloadVersion",
    "mode",
    "idempotencyKey",
    "clientConfirmation"
  ],
  allowedModes: ["apply_previewed_plan", "apply_snapshot_after_revalidation"],
  requiresPreviewedPlanOrSnapshotEvidence: true,
  requiresIdempotencyKey: true,
  requiresClientConfirmationOrSafeApplyIntent: true,
  rejectsMalformedBeforeConflictResolution: true,
  rejectsMalformedBeforeIdempotencyRecord: true,
  rejectsMalformedBeforeLearningStateWrite: true,
  grantsPaidEntitlement: false
} as const satisfies AccountSyncApplyPayloadShape;

export const ACCOUNT_SYNC_DIGEST_QUERY_SHAPE = {
  routeId: "digest",
  shape: "digest_query",
  allowedQueryFields: ["cursor", "limit", "since", "summaryOnly"],
  requiresBoundedQuery: true,
  requiresBoundedResponse: true,
  returnsRawGuestSnapshot: false,
  returnsRawSensitivePayload: false
} as const satisfies AccountSyncDigestQueryShape;

export const ACCOUNT_SYNC_AUDIT_QUERY_SHAPE = {
  routeId: "audit",
  shape: "audit_query",
  allowedQueryFields: ["cursor", "limit", "since", "category", "summaryOnly"],
  requiresBoundedQuery: true,
  requiresBoundedResponse: true,
  returnsRawGuestSnapshot: false,
  returnsRawSensitivePayload: false
} as const satisfies AccountSyncAuditQueryShape;

export const ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    mutating: false,
    payloadShape: "preview_request_body",
    requiresSchemaValidation: true,
    requiresPayloadSizeLimit: true,
    requiresAccountSyncPayloadVersion: true,
    requiresIdempotencyKey: false,
    requiresClientConfirmationOrSafeApplyIntent: false,
    rejectsMalformedBeforeConflictResolution: true,
    rejectsMalformedBeforeIdempotencyRecord: false,
    rejectsMalformedBeforeLearningStateWrite: true,
    noMutationPolicy: true,
    requiresBoundedQuery: false,
    requiresBoundedResponse: false,
    responseMustExcludeRawSensitivePayloads: true,
    trustsClientProvidedAccountIdAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    localMasteredStateAcceptedAsServerMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    designOnly: true,
    implementsRuntimeValidation: false,
    validationDependencyIntegrated: false
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    mutating: true,
    payloadShape: "apply_request_body",
    requiresSchemaValidation: true,
    requiresPayloadSizeLimit: true,
    requiresAccountSyncPayloadVersion: true,
    requiresIdempotencyKey: true,
    requiresClientConfirmationOrSafeApplyIntent: true,
    rejectsMalformedBeforeConflictResolution: true,
    rejectsMalformedBeforeIdempotencyRecord: true,
    rejectsMalformedBeforeLearningStateWrite: true,
    noMutationPolicy: false,
    requiresBoundedQuery: false,
    requiresBoundedResponse: false,
    responseMustExcludeRawSensitivePayloads: true,
    trustsClientProvidedAccountIdAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    localMasteredStateAcceptedAsServerMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    designOnly: true,
    implementsRuntimeValidation: false,
    validationDependencyIntegrated: false
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    mutating: false,
    payloadShape: "digest_query",
    requiresSchemaValidation: true,
    requiresPayloadSizeLimit: true,
    requiresAccountSyncPayloadVersion: false,
    requiresIdempotencyKey: false,
    requiresClientConfirmationOrSafeApplyIntent: false,
    rejectsMalformedBeforeConflictResolution: false,
    rejectsMalformedBeforeIdempotencyRecord: false,
    rejectsMalformedBeforeLearningStateWrite: true,
    noMutationPolicy: true,
    requiresBoundedQuery: true,
    requiresBoundedResponse: true,
    responseMustExcludeRawSensitivePayloads: true,
    trustsClientProvidedAccountIdAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    localMasteredStateAcceptedAsServerMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    designOnly: true,
    implementsRuntimeValidation: false,
    validationDependencyIntegrated: false
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    mutating: false,
    payloadShape: "audit_query",
    requiresSchemaValidation: true,
    requiresPayloadSizeLimit: true,
    requiresAccountSyncPayloadVersion: false,
    requiresIdempotencyKey: false,
    requiresClientConfirmationOrSafeApplyIntent: false,
    rejectsMalformedBeforeConflictResolution: false,
    rejectsMalformedBeforeIdempotencyRecord: false,
    rejectsMalformedBeforeLearningStateWrite: true,
    noMutationPolicy: true,
    requiresBoundedQuery: true,
    requiresBoundedResponse: true,
    responseMustExcludeRawSensitivePayloads: true,
    trustsClientProvidedAccountIdAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    localMasteredStateAcceptedAsServerMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    designOnly: true,
    implementsRuntimeValidation: false,
    validationDependencyIntegrated: false
  }
] as const satisfies readonly AccountSyncRouteSchemaPolicy[];

export const ACCOUNT_SYNC_SENSITIVE_FIELD_POLICY = {
  forbiddenPayloadFamilies: [
    "raw_provider_tokens",
    "production_credentials",
    "billing_payment_checkout_subscription",
    "paid_entitlement_grants",
    "fake_server_mastery_claims",
    "raw_guest_snapshots_in_digest_audit",
    "raw_sensitive_payloads"
  ],
  forbiddenFieldNamePatterns: [
    "providerToken",
    "accessToken",
    "refreshToken",
    "secret",
    "credential",
    "billing",
    "payment",
    "checkoutSession",
    "subscription",
    "invoice",
    "entitlementGrant",
    "serverMastery"
  ],
  clientProvidedAccountIdTrustedAsOwnershipProof: false,
  providerTokensAllowed: false,
  productionCredentialsAllowed: false,
  billingPaymentCheckoutSubscriptionAllowed: false,
  paidEntitlementGrantAllowed: false,
  fakeServerMasteryClaimsAllowed: false,
  localMasteredAcceptedAsServerMastery: false,
  localMasteredTreatedAsClientClaimOnly: true,
  reviewEventsRemainSourceOfTruth: true
} as const satisfies AccountSyncSensitiveFieldPolicy;

export const ACCOUNT_SYNC_MALFORMED_PAYLOAD_POLICY = {
  previewRejectsMalformedBeforeConflictResolution: true,
  applyRejectsMalformedBeforeConflictResolution: true,
  applyRejectsMalformedBeforeIdempotencyRecord: true,
  applyRejectsMalformedBeforeLearningStateWrite: true,
  malformedApplyCanCreateIdempotencyRecord: false,
  malformedApplyCanCreatePartialLearningState: false,
  digestRejectsUnboundedQuery: true,
  auditRejectsUnboundedQuery: true,
  digestAuditReturnRawSnapshots: false,
  digestAuditReturnRawSensitivePayloads: false
} as const satisfies AccountSyncMalformedPayloadPolicy;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT = {
  accountSyncSchemaContractVersion: ACCOUNT_SYNC_SCHEMA_CONTRACT_VERSION,
  purpose:
    "Define design-only account sync schema validation and payload size limits before any future API route implementation.",
  routePolicies: ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES,
  payloadLimitPolicies: ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES,
  payloadShapes: {
    preview: ACCOUNT_SYNC_PREVIEW_PAYLOAD_SHAPE,
    apply: ACCOUNT_SYNC_APPLY_PAYLOAD_SHAPE,
    digest: ACCOUNT_SYNC_DIGEST_QUERY_SHAPE,
    audit: ACCOUNT_SYNC_AUDIT_QUERY_SHAPE
  },
  sensitiveFieldPolicy: ACCOUNT_SYNC_SENSITIVE_FIELD_POLICY,
  malformedPayloadPolicy: ACCOUNT_SYNC_MALFORMED_PAYLOAD_POLICY,
  sourceOfTruthPolicy: {
    reviewEventsRemainSourceOfTruth: true,
    reviewStateRecomputedFromEventEvidence: true,
    fakeLocalMasteryCanBecomeServerMastery: false,
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
    browserNetworkHelpersAllowed: false,
    browserStorageAllowed: false,
    environmentReadsAllowed: false
  },
  finalVerdict: {
    verdict: "design_only",
    implementationReady: false,
    realApiRouteRecommended: false,
    nextRecommendedPr: {
      number: 62,
      title: "Account sync audit logging and privacy redaction policy",
      docsContractsTestsOnly: true
    }
  }
} as const satisfies AccountSyncSchemaPayloadContract;

function getRequiredLimit(limitId: AccountSyncPayloadLimitId) {
  const policy = ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES.find(
    (limit) => limit.id === limitId
  );

  if (!policy) {
    throw new Error(`Missing account sync payload limit policy: ${limitId}`);
  }

  return policy;
}

function addFailureWhenOverLimit({
  value,
  limitId,
  reason,
  failureReasons
}: {
  value: number | undefined;
  limitId: AccountSyncPayloadLimitId;
  reason: AccountSyncValidationFailureReason;
  failureReasons: AccountSyncValidationFailureReason[];
}) {
  if (typeof value !== "number") {
    return;
  }

  if (value > getRequiredLimit(limitId).ceiling) {
    failureReasons.push(reason);
  }
}

export function getAccountSyncRouteSchemaPolicy(routeId: VlxAccountSyncRouteId) {
  return ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES.find(
    (policy) => policy.routeId === routeId
  );
}

export function getAccountSyncPayloadLimitPolicy(
  limitId: AccountSyncPayloadLimitId
) {
  return ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES.find(
    (policy) => policy.id === limitId
  );
}

export function decideAccountSyncValidation(
  input: AccountSyncValidationInput
): AccountSyncValidationDecision {
  const policy = getAccountSyncRouteSchemaPolicy(input.routeId);

  if (!policy) {
    throw new Error(`Missing account sync schema policy for route: ${input.routeId}`);
  }

  const failureReasons: AccountSyncValidationFailureReason[] = [];

  if (input.hasMalformedPayload) {
    failureReasons.push("malformed_payload");
  }

  if (policy.requiresAccountSyncPayloadVersion && input.hasInvalidPayloadVersion) {
    failureReasons.push("invalid_payload_version");
  }

  if (policy.routeId === "preview") {
    addFailureWhenOverLimit({
      value: input.payloadByteLength,
      limitId: "preview_request_body",
      reason: "payload_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "apply") {
    addFailureWhenOverLimit({
      value: input.payloadByteLength,
      limitId: "apply_request_body",
      reason: "payload_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.reviewEventCount,
      limitId: "review_events_per_apply",
      reason: "review_event_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.savedWordCount,
      limitId: "saved_words_per_apply",
      reason: "saved_word_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.packProgressEntryCount,
      limitId: "pack_progress_entries_per_apply",
      reason: "pack_progress_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.upgradeInterestRecordCount,
      limitId: "upgrade_interest_records_per_apply",
      reason: "upgrade_interest_count_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "digest") {
    addFailureWhenOverLimit({
      value: input.queryCursorByteLength,
      limitId: "digest_query_cursor",
      reason: "query_or_cursor_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.responseSummaryByteLength,
      limitId: "digest_response_summary",
      reason: "response_summary_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "audit") {
    addFailureWhenOverLimit({
      value: input.queryCursorByteLength,
      limitId: "audit_query_cursor",
      reason: "query_or_cursor_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.responseSummaryByteLength,
      limitId: "audit_response_summary",
      reason: "response_summary_too_large",
      failureReasons
    });
  }

  if (policy.requiresIdempotencyKey && input.missingIdempotencyKey) {
    failureReasons.push("missing_idempotency_key");
  }

  if (
    policy.requiresClientConfirmationOrSafeApplyIntent &&
    input.missingClientConfirmation
  ) {
    failureReasons.push("missing_client_confirmation");
  }

  if (input.hasClientProvidedAccountIdAsOwnershipProof) {
    failureReasons.push("client_account_id_not_trusted");
  }

  if (input.includesProviderTokens) {
    failureReasons.push("provider_tokens_forbidden");
  }

  if (input.includesProductionCredentials) {
    failureReasons.push("production_credentials_forbidden");
  }

  if (input.includesBillingPaymentCheckoutSubscription) {
    failureReasons.push("billing_payment_payload_forbidden");
  }

  if (input.requestsPaidEntitlement) {
    failureReasons.push("paid_entitlement_payload_forbidden");
  }

  if (input.hasFakeServerMasteryClaim) {
    failureReasons.push("fake_server_mastery_claim");
  }

  if (input.containsRawSensitivePayload) {
    failureReasons.push("raw_sensitive_payload_forbidden");
  }

  const uniqueFailureReasons = Array.from(new Set(failureReasons));
  const ok = uniqueFailureReasons.length === 0;
  const isApply = policy.routeId === "apply";

  return {
    ok,
    status: ok ? "accepted" : "rejected",
    routeId: policy.routeId,
    method: policy.method,
    path: policy.path,
    failureReasons: uniqueFailureReasons,
    schemaValidationRequired: true,
    payloadLimitRequired: true,
    conflictResolutionAllowed: ok && (policy.routeId === "preview" || isApply),
    futureIdempotencyRecordEligible: ok && isApply,
    futureLearningStateWriteEligible: ok && isApply,
    actualLearningStateWriteImplemented: false,
    actualRuntimeValidationImplemented: false,
    validationDependencyIntegrated: false,
    clientAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryAccepted: false,
    localMasteredTreatedAsClientClaimOnly: Boolean(
      input.hasLocalMasteredClientClaim
    ),
    serverSrsRecomputedOnlyFromReviewEvents: true,
    reviewEventEvidenceRequiredForServerMastery: true,
    packProgressWithoutReviewEventsAuditOnly: Boolean(
      input.hasPackProgressWithoutReviewEventEvidence
    ),
    upgradeInterestAttributionOnly: Boolean(input.hasUpgradeInterestRecords),
    paidEntitlementGranted: false,
    billingPaymentAccepted: false,
    sensitivePayloadAccepted: false,
    designOnly: true
  };
}
