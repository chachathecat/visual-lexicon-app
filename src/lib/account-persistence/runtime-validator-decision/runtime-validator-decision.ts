import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_VERSION = 1 as const;

export type AccountSyncRuntimeValidatorDecisionVersion =
  typeof ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_VERSION;

export type AccountSyncRuntimeValidatorKind =
  | "zod"
  | "valibot"
  | "arktype"
  | "ajv_json_schema"
  | "superstruct"
  | "custom_no_dependency_validator"
  | "type_guards_only"
  | "mock_only_no_runtime_validator";

export type AccountSyncRuntimeValidatorDecisionStatus =
  | "preferred_future_adapter"
  | "compatible_future_candidate"
  | "deferred"
  | "rejected_for_now"
  | "mock_only"
  | "design_only_not_implementation_ready";

export type AccountSyncSelectedRuntimeValidatorStrategy =
  | "zod_compatible_future_adapter"
  | "validator_neutral_sync_core"
  | "no_validator_dependency_in_this_pr"
  | "separate_owner_approved_dependency_pr_required"
  | "runtime_validation_before_idempotency_or_writes"
  | "redacted_structured_validation_errors";

export type AccountSyncRuntimeValidatorCandidate = {
  kind: AccountSyncRuntimeValidatorKind;
  label: string;
  decisionStatus: AccountSyncRuntimeValidatorDecisionStatus;
  selectedStrategy: readonly AccountSyncSelectedRuntimeValidatorStrategy[];
  preferredFutureOption: boolean;
  canProduceTypedStructuredFailures: boolean;
  canRedactIssuesAtAdapterBoundary: boolean;
  validatorNeutralAdapterRequired: true;
  accountSyncCoreCanImportValidatorLibrary: false;
  dependencyAddedInThisPr: false;
  canBeIntroducedInThisPr: false;
  requiresSeparateOwnerApprovedDependencyPr: boolean;
  notes: string;
};

export type AccountSyncRuntimeValidationTarget =
  | "request_body"
  | "query_and_cursor"
  | "response_body";

export type AccountSyncRuntimeValidationOrderStep =
  | "payload_size_ceiling"
  | "runtime_schema_parse"
  | "redacted_failure_decision"
  | "conflict_resolution"
  | "idempotency_record_creation"
  | "learning_state_write"
  | "bounded_response_return";

export type AccountSyncRuntimeValidationRoutePolicy = {
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  target: AccountSyncRuntimeValidationTarget;
  validationOrder: readonly AccountSyncRuntimeValidationOrderStep[];
  requiresRuntimeValidation: true;
  requiresPayloadSizeBeforeDeepValidation: true;
  requiresBoundedQueryValidation: boolean;
  requiresBoundedResponseValidation: boolean;
  requiresIdempotencyKey: boolean;
  requiresSafeApplyIntent: boolean;
  validatesBeforeConflictResolution: boolean;
  validatesBeforeIdempotencyRecord: boolean;
  validatesBeforeLearningStateWrite: boolean;
  malformedCanCreateIdempotencyRecord: false;
  malformedCanCreatePartialLearningState: false;
  clientProvidedAccountIdTrustedAsOwnershipProof: false;
  fakeServerMasteryClaimsAccepted: false;
  reviewEventsRemainSourceOfTruth: true;
  packProgressWithoutReviewEventsAuditOnly: true;
  upgradeInterestAttributionOnly: true;
  grantsPaidEntitlement: false;
  billingPaymentPayloadAllowed: false;
  providerTokensAllowed: false;
  productionSecretsAllowed: false;
  actualRuntimeValidationImplemented: false;
  validationDependencyIntegrated: false;
  designOnly: true;
};

export type AccountSyncRuntimeValidatorAdapterBoundary = {
  id: "account_sync_runtime_validator_adapter_boundary_v1";
  selectedStrategy: "zod_compatible_future_adapter";
  preferredFutureValidatorKind: "zod";
  normalizedPort: "account_sync_runtime_validation_port_v1";
  validatorSpecificCodeAllowedAtAdapterEdge: true;
  validatorSpecificCodeAllowedInSyncCore: false;
  accountSyncCoreValidatorNeutral: true;
  zodCompatibleIssueShapePreferred: true;
  validatorDependencyImportedInThisPr: false;
  validatorDependencyAddedInThisPr: false;
  separateOwnerApprovedDependencyPrRequired: true;
  routeHandlerCreatedInThisPr: false;
  middlewareCreatedInThisPr: false;
  runtimeRouteIntegrationCreatedInThisPr: false;
  networkCallsAllowedInThisPr: false;
  browserStorageAccessAllowedInThisPr: false;
  environmentReadsAllowedInThisPr: false;
};

export type AccountSyncRuntimeValidationPortContract = {
  id: "account_sync_runtime_validation_port_v1";
  input: "unknown_request_body_or_query_or_response_summary";
  output: "typed_structured_redacted_validation_decision";
  adapterBoundaryId: AccountSyncRuntimeValidatorAdapterBoundary["id"];
  validatorSpecificIssuesNormalizedBeforeSyncCore: true;
  accountSyncCoreReceivesOnlyNormalizedDecision: true;
  accountSyncCoreValidatorNeutral: true;
  validatorLibraryImportsAllowedInSyncCore: false;
  validatorDependencyImportedInThisPr: false;
  routePolicies: readonly AccountSyncRuntimeValidationRoutePolicy[];
  allowedIssueFields: readonly AccountSyncRuntimeValidationIssueField[];
  redactionPolicyId: AccountSyncRuntimeValidationRedactionPolicy["id"];
};

export type AccountSyncRuntimeValidationFailureReason =
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
  | "missing_safe_apply_intent"
  | "client_account_id_not_trusted"
  | "provider_tokens_forbidden"
  | "production_secrets_forbidden"
  | "billing_payment_payload_forbidden"
  | "paid_entitlement_payload_forbidden"
  | "fake_server_mastery_claim"
  | "raw_sensitive_payload_forbidden";

export type AccountSyncRuntimeValidationIssueCode =
  AccountSyncRuntimeValidationFailureReason;

export type AccountSyncRuntimeValidationIssueField =
  | "path"
  | "code"
  | "expectedKind"
  | "sizeClass";

export type AccountSyncRuntimeValidationIssue = {
  path: string;
  code: AccountSyncRuntimeValidationIssueCode;
  expectedKind?:
    | "object"
    | "array"
    | "string"
    | "boolean"
    | "number"
    | "bounded_query"
    | "bounded_response"
    | "safe_apply_intent"
    | "forbidden_field_absent";
  sizeClass?:
    | "request_body_bytes"
    | "query_cursor_bytes"
    | "response_summary_bytes"
    | "apply_collection_items";
  rawValueIncluded: false;
  rawPayloadEchoed: false;
  safeForClient: true;
  safeForAudit: true;
};

export type AccountSyncRuntimeValidationRedactionPolicy = {
  id: "account_sync_runtime_validation_redaction_policy_v1";
  allowedIssueFields: readonly AccountSyncRuntimeValidationIssueField[];
  rawPayloadEchoAllowed: false;
  rawFieldValueEchoAllowed: false;
  rawProviderPayloadEchoAllowed: false;
  productionSecretEchoAllowed: false;
  billingPaymentPayloadEchoAllowed: false;
  safePathAllowed: true;
  safeCodeAllowed: true;
  expectedKindAllowed: true;
  sizeClassAllowed: true;
  maxIssuesReturned: 12;
  failureMessagesAreGeneric: true;
  auditSummariesRedactedOnly: true;
};

export type AccountSyncRuntimeValidatorDependencyPolicy = {
  id: "account_sync_runtime_validator_dependency_policy_v1";
  preferredFutureValidatorKind: "zod";
  preferredFutureStrategy: "zod_compatible_future_adapter";
  directValidatorDependenciesAddedInThisPr: false;
  packageJsonChangesAllowedInThisPr: false;
  packageLockChangesAllowedInThisPr: false;
  validatorDependencyImportsAllowedInThisPr: false;
  validatorLibraryImportsAllowedInSyncCore: false;
  separateOwnerApprovedDependencyPrRequired: true;
  prohibitedDirectDependencyNames: readonly string[];
  preExistingToolTransitiveDependenciesDoNotSelectValidator: true;
};

export type AccountSyncRuntimeValidatorRisk = {
  id:
    | "validator_library_leaks_into_sync_core"
    | "raw_payload_echoed_in_validation_error"
    | "deep_validation_before_size_ceiling"
    | "malformed_apply_creates_idempotency_record"
    | "malformed_apply_creates_partial_learning_state"
    | "client_account_id_trusted_as_owner"
    | "fake_mastery_accepted"
    | "paid_entitlement_or_billing_payload_accepted"
    | "provider_token_or_secret_echoed"
    | "runtime_route_implemented_before_validator_dependency_approval";
  severity: "P0";
  mitigation: string;
  blocksRealRoutes: true;
};

export type AccountSyncRuntimeValidatorNonGoal = {
  id:
    | "real_runtime_validator_implementation"
    | "validator_dependency_addition"
    | "validator_library_imports"
    | "api_routes_or_handlers"
    | "middleware"
    | "runtime_route_or_component_integration"
    | "real_auth_implementation"
    | "database_persistence"
    | "provider_sdks"
    | "logging_or_observability_sdks"
    | "network_or_browser_storage_access"
    | "environment_configuration"
    | "billing_payment_or_checkout"
    | "paid_entitlement_grants"
    | "production_configuration_or_data";
  description: string;
};

export type AccountSyncRuntimeValidatorImplementationGate = {
  id:
    | "owner_approves_validator_dependency"
    | "validator_adapter_implemented_in_separate_pr"
    | "normalized_issue_mapping_proven"
    | "size_ceiling_enforced_before_deep_validation"
    | "apply_rejects_before_idempotency_or_writes"
    | "digest_audit_bounded_validation_proven"
    | "redacted_failure_manual_qa"
    | "auth_and_persistence_boundaries_ready";
  status: "blocked" | "requires_separate_pr" | "requires_owner_approval";
  requiredBeforeRealRoutes: true;
  blocksRealApiRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncRuntimeValidatorManualQARequirement = {
  id:
    | "preview_malformed_rejection"
    | "apply_malformed_rejection_before_idempotency"
    | "apply_missing_idempotency_key"
    | "apply_missing_safe_intent"
    | "digest_audit_bounded_query"
    | "bounded_response_validation"
    | "redacted_validation_errors"
    | "forbidden_sensitive_fields"
    | "fake_mastery_block"
    | "no_billing_or_entitlement_mutation";
  routeIds: readonly VlxAccountSyncRouteId[];
  requiredBeforeProduction: true;
  requiresRealValidatorIntegration: true;
  requiresNoMutationEvidence: boolean;
  requiresRedactionEvidence: boolean;
};

export type AccountSyncRuntimeValidatorNextStep = {
  prNumber: 68;
  title: "Disabled/mock-gated account sync implementation spike plan";
  docsContractsTestsOnly: true;
  realApiRouteImplementationRecommended: false;
};

export type AccountSyncRuntimeValidationInput = {
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
  missingSafeApplyIntent?: boolean;
  hasClientProvidedAccountIdAsOwnershipProof?: boolean;
  includesProviderTokens?: boolean;
  includesProductionSecrets?: boolean;
  includesBillingPaymentCheckoutSubscription?: boolean;
  requestsPaidEntitlement?: boolean;
  hasFakeServerMasteryClaim?: boolean;
  containsRawSensitivePayload?: boolean;
  hasPackProgressWithoutReviewEventEvidence?: boolean;
  hasUpgradeInterestRecords?: boolean;
};

export type AccountSyncRuntimeValidationDecision = {
  ok: boolean;
  status: "accepted" | "rejected";
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  failureReasons: readonly AccountSyncRuntimeValidationFailureReason[];
  issues: readonly AccountSyncRuntimeValidationIssue[];
  sizeCeilingCheckedBeforeDeepValidation: true;
  deepValidationAllowed: boolean;
  runtimeValidatorDependencyUsed: false;
  validatorAdapterInvoked: false;
  conflictResolutionAllowed: boolean;
  idempotencyRecordCreationAllowed: boolean;
  learningStateWriteAllowed: boolean;
  malformedApplyCanCreateIdempotencyRecord: false;
  malformedApplyCanCreatePartialLearningState: false;
  boundedQueryValidated: boolean;
  boundedResponseValidated: boolean;
  clientAccountIdTrustedAsOwnershipProof: false;
  fakeServerMasteryAccepted: false;
  reviewEventsRemainSourceOfTruth: true;
  packProgressWithoutReviewEventsAuditOnly: boolean;
  upgradeInterestAttributionOnly: boolean;
  paidEntitlementGranted: false;
  billingPaymentAccepted: false;
  providerTokensAccepted: false;
  productionSecretsAccepted: false;
  rawPayloadEchoed: false;
  designOnly: true;
  implementsActualRuntimeValidation: false;
};

export type AccountSyncRuntimeValidatorDecisionRecord = {
  accountSyncRuntimeValidatorDecisionVersion: AccountSyncRuntimeValidatorDecisionVersion;
  decisionStatus: "design_only_not_implementation_ready";
  selectedRuntimeValidatorStrategy: "zod_compatible_future_adapter";
  preferredFutureValidatorKind: "zod";
  selectedStrategies: readonly AccountSyncSelectedRuntimeValidatorStrategy[];
  finalVerdict: "design_only";
  implementationReady: false;
  accountSyncCoreValidatorNeutral: true;
  validatorDependencyAddedInThisPr: false;
  validatorDependencyImportedInThisPr: false;
  candidates: readonly AccountSyncRuntimeValidatorCandidate[];
  adapterBoundary: AccountSyncRuntimeValidatorAdapterBoundary;
  portContract: AccountSyncRuntimeValidationPortContract;
  routePolicies: readonly AccountSyncRuntimeValidationRoutePolicy[];
  redactionPolicy: AccountSyncRuntimeValidationRedactionPolicy;
  dependencyPolicy: AccountSyncRuntimeValidatorDependencyPolicy;
  risks: readonly AccountSyncRuntimeValidatorRisk[];
  nonGoals: readonly AccountSyncRuntimeValidatorNonGoal[];
  implementationGates: readonly AccountSyncRuntimeValidatorImplementationGate[];
  manualQARequirements: readonly AccountSyncRuntimeValidatorManualQARequirement[];
  nextStep: AccountSyncRuntimeValidatorNextStep;
  safetyScope: {
    docsContractsTestsOnly: true;
    actualRuntimeValidationAllowed: false;
    validatorDependencyAllowed: false;
    validatorLibraryImportsAllowed: false;
    apiRoutesAllowed: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    realAuthAllowed: false;
    databasePersistenceAllowed: false;
    dbProviderSdkAllowed: false;
    authProviderSdkAllowed: false;
    paymentProviderSdkAllowed: false;
    loggingProviderSdkAllowed: false;
    networkCallsAllowed: false;
    browserStorageAccessAllowed: false;
    environmentReadsAllowed: false;
    billingPaymentAllowed: false;
    paidEntitlementGrantAllowed: false;
    webflowChangesAllowed: false;
    cloudflareWorkerChangesAllowed: false;
    vercelSettingsChangesAllowed: false;
    dnsChangesAllowed: false;
    productionDataChangesAllowed: false;
  };
};

export const ACCOUNT_SYNC_SELECTED_RUNTIME_VALIDATOR_STRATEGIES = [
  "zod_compatible_future_adapter",
  "validator_neutral_sync_core",
  "no_validator_dependency_in_this_pr",
  "separate_owner_approved_dependency_pr_required",
  "runtime_validation_before_idempotency_or_writes",
  "redacted_structured_validation_errors"
] as const satisfies readonly AccountSyncSelectedRuntimeValidatorStrategy[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES = [
  {
    kind: "zod",
    label: "Zod-compatible future adapter",
    decisionStatus: "preferred_future_adapter",
    selectedStrategy: ACCOUNT_SYNC_SELECTED_RUNTIME_VALIDATOR_STRATEGIES,
    preferredFutureOption: true,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: true,
    notes:
      "Preferred future option because it can map request parsing into typed, structured, redacted decisions behind the normalized port."
  },
  {
    kind: "valibot",
    label: "Valibot",
    decisionStatus: "compatible_future_candidate",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "separate_owner_approved_dependency_pr_required",
      "redacted_structured_validation_errors"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: true,
    notes:
      "Compatible future candidate if owner later selects it, but it must remain outside sync core."
  },
  {
    kind: "arktype",
    label: "ArkType",
    decisionStatus: "compatible_future_candidate",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "separate_owner_approved_dependency_pr_required",
      "redacted_structured_validation_errors"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: true,
    notes:
      "Future candidate only. Issue mapping would need proof before real route integration."
  },
  {
    kind: "ajv_json_schema",
    label: "AJV JSON Schema",
    decisionStatus: "deferred",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "separate_owner_approved_dependency_pr_required",
      "redacted_structured_validation_errors"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: true,
    notes:
      "Deferred because JSON Schema portability is useful, but typed route contracts still need adapter mapping."
  },
  {
    kind: "superstruct",
    label: "Superstruct",
    decisionStatus: "deferred",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "separate_owner_approved_dependency_pr_required",
      "redacted_structured_validation_errors"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: true,
    notes:
      "Deferred unless owner later prefers its ergonomics and redacted issue mapping is proven."
  },
  {
    kind: "custom_no_dependency_validator",
    label: "Custom no-dependency validator",
    decisionStatus: "deferred",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "no_validator_dependency_in_this_pr",
      "redacted_structured_validation_errors"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: true,
    canRedactIssuesAtAdapterBoundary: true,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: false,
    notes:
      "Possible later fallback, but a hand-written validator raises maintenance risk and is not implemented here."
  },
  {
    kind: "type_guards_only",
    label: "Type guards only",
    decisionStatus: "rejected_for_now",
    selectedStrategy: [
      "validator_neutral_sync_core",
      "no_validator_dependency_in_this_pr"
    ],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: false,
    canRedactIssuesAtAdapterBoundary: false,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: false,
    notes:
      "Rejected for real routes because type guards alone are unlikely to produce rich redacted failure decisions."
  },
  {
    kind: "mock_only_no_runtime_validator",
    label: "Mock-only, no runtime validator",
    decisionStatus: "mock_only",
    selectedStrategy: ["no_validator_dependency_in_this_pr"],
    preferredFutureOption: false,
    canProduceTypedStructuredFailures: false,
    canRedactIssuesAtAdapterBoundary: false,
    validatorNeutralAdapterRequired: true,
    accountSyncCoreCanImportValidatorLibrary: false,
    dependencyAddedInThisPr: false,
    canBeIntroducedInThisPr: false,
    requiresSeparateOwnerApprovedDependencyPr: false,
    notes:
      "Only acceptable for design fixtures and disabled spikes. It cannot protect real account sync routes."
  }
] as const satisfies readonly AccountSyncRuntimeValidatorCandidate[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    target: "request_body",
    validationOrder: [
      "payload_size_ceiling",
      "runtime_schema_parse",
      "redacted_failure_decision",
      "conflict_resolution"
    ],
    requiresRuntimeValidation: true,
    requiresPayloadSizeBeforeDeepValidation: true,
    requiresBoundedQueryValidation: false,
    requiresBoundedResponseValidation: false,
    requiresIdempotencyKey: false,
    requiresSafeApplyIntent: false,
    validatesBeforeConflictResolution: true,
    validatesBeforeIdempotencyRecord: false,
    validatesBeforeLearningStateWrite: true,
    malformedCanCreateIdempotencyRecord: false,
    malformedCanCreatePartialLearningState: false,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentPayloadAllowed: false,
    providerTokensAllowed: false,
    productionSecretsAllowed: false,
    actualRuntimeValidationImplemented: false,
    validationDependencyIntegrated: false,
    designOnly: true
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    target: "request_body",
    validationOrder: [
      "payload_size_ceiling",
      "runtime_schema_parse",
      "redacted_failure_decision",
      "conflict_resolution",
      "idempotency_record_creation",
      "learning_state_write"
    ],
    requiresRuntimeValidation: true,
    requiresPayloadSizeBeforeDeepValidation: true,
    requiresBoundedQueryValidation: false,
    requiresBoundedResponseValidation: false,
    requiresIdempotencyKey: true,
    requiresSafeApplyIntent: true,
    validatesBeforeConflictResolution: true,
    validatesBeforeIdempotencyRecord: true,
    validatesBeforeLearningStateWrite: true,
    malformedCanCreateIdempotencyRecord: false,
    malformedCanCreatePartialLearningState: false,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentPayloadAllowed: false,
    providerTokensAllowed: false,
    productionSecretsAllowed: false,
    actualRuntimeValidationImplemented: false,
    validationDependencyIntegrated: false,
    designOnly: true
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    target: "query_and_cursor",
    validationOrder: [
      "payload_size_ceiling",
      "runtime_schema_parse",
      "redacted_failure_decision",
      "bounded_response_return"
    ],
    requiresRuntimeValidation: true,
    requiresPayloadSizeBeforeDeepValidation: true,
    requiresBoundedQueryValidation: true,
    requiresBoundedResponseValidation: true,
    requiresIdempotencyKey: false,
    requiresSafeApplyIntent: false,
    validatesBeforeConflictResolution: false,
    validatesBeforeIdempotencyRecord: false,
    validatesBeforeLearningStateWrite: true,
    malformedCanCreateIdempotencyRecord: false,
    malformedCanCreatePartialLearningState: false,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentPayloadAllowed: false,
    providerTokensAllowed: false,
    productionSecretsAllowed: false,
    actualRuntimeValidationImplemented: false,
    validationDependencyIntegrated: false,
    designOnly: true
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    target: "query_and_cursor",
    validationOrder: [
      "payload_size_ceiling",
      "runtime_schema_parse",
      "redacted_failure_decision",
      "bounded_response_return"
    ],
    requiresRuntimeValidation: true,
    requiresPayloadSizeBeforeDeepValidation: true,
    requiresBoundedQueryValidation: true,
    requiresBoundedResponseValidation: true,
    requiresIdempotencyKey: false,
    requiresSafeApplyIntent: false,
    validatesBeforeConflictResolution: false,
    validatesBeforeIdempotencyRecord: false,
    validatesBeforeLearningStateWrite: true,
    malformedCanCreateIdempotencyRecord: false,
    malformedCanCreatePartialLearningState: false,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryClaimsAccepted: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: true,
    upgradeInterestAttributionOnly: true,
    grantsPaidEntitlement: false,
    billingPaymentPayloadAllowed: false,
    providerTokensAllowed: false,
    productionSecretsAllowed: false,
    actualRuntimeValidationImplemented: false,
    validationDependencyIntegrated: false,
    designOnly: true
  }
] as const satisfies readonly AccountSyncRuntimeValidationRoutePolicy[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY = {
  id: "account_sync_runtime_validation_redaction_policy_v1",
  allowedIssueFields: ["path", "code", "expectedKind", "sizeClass"],
  rawPayloadEchoAllowed: false,
  rawFieldValueEchoAllowed: false,
  rawProviderPayloadEchoAllowed: false,
  productionSecretEchoAllowed: false,
  billingPaymentPayloadEchoAllowed: false,
  safePathAllowed: true,
  safeCodeAllowed: true,
  expectedKindAllowed: true,
  sizeClassAllowed: true,
  maxIssuesReturned: 12,
  failureMessagesAreGeneric: true,
  auditSummariesRedactedOnly: true
} as const satisfies AccountSyncRuntimeValidationRedactionPolicy;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_ADAPTER_BOUNDARY = {
  id: "account_sync_runtime_validator_adapter_boundary_v1",
  selectedStrategy: "zod_compatible_future_adapter",
  preferredFutureValidatorKind: "zod",
  normalizedPort: "account_sync_runtime_validation_port_v1",
  validatorSpecificCodeAllowedAtAdapterEdge: true,
  validatorSpecificCodeAllowedInSyncCore: false,
  accountSyncCoreValidatorNeutral: true,
  zodCompatibleIssueShapePreferred: true,
  validatorDependencyImportedInThisPr: false,
  validatorDependencyAddedInThisPr: false,
  separateOwnerApprovedDependencyPrRequired: true,
  routeHandlerCreatedInThisPr: false,
  middlewareCreatedInThisPr: false,
  runtimeRouteIntegrationCreatedInThisPr: false,
  networkCallsAllowedInThisPr: false,
  browserStorageAccessAllowedInThisPr: false,
  environmentReadsAllowedInThisPr: false
} as const satisfies AccountSyncRuntimeValidatorAdapterBoundary;

export const ACCOUNT_SYNC_RUNTIME_VALIDATION_PORT_CONTRACT = {
  id: "account_sync_runtime_validation_port_v1",
  input: "unknown_request_body_or_query_or_response_summary",
  output: "typed_structured_redacted_validation_decision",
  adapterBoundaryId: "account_sync_runtime_validator_adapter_boundary_v1",
  validatorSpecificIssuesNormalizedBeforeSyncCore: true,
  accountSyncCoreReceivesOnlyNormalizedDecision: true,
  accountSyncCoreValidatorNeutral: true,
  validatorLibraryImportsAllowedInSyncCore: false,
  validatorDependencyImportedInThisPr: false,
  routePolicies: ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES,
  allowedIssueFields:
    ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY.allowedIssueFields,
  redactionPolicyId: ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY.id
} as const satisfies AccountSyncRuntimeValidationPortContract;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY = {
  id: "account_sync_runtime_validator_dependency_policy_v1",
  preferredFutureValidatorKind: "zod",
  preferredFutureStrategy: "zod_compatible_future_adapter",
  directValidatorDependenciesAddedInThisPr: false,
  packageJsonChangesAllowedInThisPr: false,
  packageLockChangesAllowedInThisPr: false,
  validatorDependencyImportsAllowedInThisPr: false,
  validatorLibraryImportsAllowedInSyncCore: false,
  separateOwnerApprovedDependencyPrRequired: true,
  prohibitedDirectDependencyNames: [
    "zod",
    "valibot",
    "yup",
    "arktype",
    "ajv",
    "superstruct",
    "joi",
    "io-ts",
    "runtypes",
    "class-validator"
  ],
  preExistingToolTransitiveDependenciesDoNotSelectValidator: true
} as const satisfies AccountSyncRuntimeValidatorDependencyPolicy;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_RISKS = [
  {
    id: "validator_library_leaks_into_sync_core",
    severity: "P0",
    mitigation:
      "Keep validator-specific parsing and issue shapes behind the normalized validation port.",
    blocksRealRoutes: true
  },
  {
    id: "raw_payload_echoed_in_validation_error",
    severity: "P0",
    mitigation:
      "Return only safe paths, codes, expected kinds, and size classes in validation issues.",
    blocksRealRoutes: true
  },
  {
    id: "deep_validation_before_size_ceiling",
    severity: "P0",
    mitigation:
      "Reject oversized bodies, cursors, response summaries, and collections before any deep parse.",
    blocksRealRoutes: true
  },
  {
    id: "malformed_apply_creates_idempotency_record",
    severity: "P0",
    mitigation:
      "Require apply validation to pass before idempotency record creation.",
    blocksRealRoutes: true
  },
  {
    id: "malformed_apply_creates_partial_learning_state",
    severity: "P0",
    mitigation:
      "Require apply validation to pass before review events or derived learning state writes.",
    blocksRealRoutes: true
  },
  {
    id: "client_account_id_trusted_as_owner",
    severity: "P0",
    mitigation:
      "Reject client-provided account ids as ownership proof before sync core decisions continue.",
    blocksRealRoutes: true
  },
  {
    id: "fake_mastery_accepted",
    severity: "P0",
    mitigation:
      "Reject server mastery claims that lack delayed review-event evidence.",
    blocksRealRoutes: true
  },
  {
    id: "paid_entitlement_or_billing_payload_accepted",
    severity: "P0",
    mitigation:
      "Forbid paid entitlement, billing, payment, checkout, invoice, and subscription payload families at validation.",
    blocksRealRoutes: true
  },
  {
    id: "provider_token_or_secret_echoed",
    severity: "P0",
    mitigation:
      "Reject provider tokens and production secrets with generic redacted issues only.",
    blocksRealRoutes: true
  },
  {
    id: "runtime_route_implemented_before_validator_dependency_approval",
    severity: "P0",
    mitigation:
      "Keep real routes blocked until a separate owner-approved validator adapter PR lands.",
    blocksRealRoutes: true
  }
] as const satisfies readonly AccountSyncRuntimeValidatorRisk[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_NON_GOALS = [
  {
    id: "real_runtime_validator_implementation",
    description: "No real runtime validator implementation is added."
  },
  {
    id: "validator_dependency_addition",
    description: "No validator package is added."
  },
  {
    id: "validator_library_imports",
    description: "No validator library is imported."
  },
  {
    id: "api_routes_or_handlers",
    description: "No account sync API route or handler is created."
  },
  {
    id: "middleware",
    description: "No middleware is added or changed."
  },
  {
    id: "runtime_route_or_component_integration",
    description: "No runtime route or component integration is added."
  },
  {
    id: "real_auth_implementation",
    description: "No real auth implementation is added."
  },
  {
    id: "database_persistence",
    description: "No database persistence, schema, or migration is added."
  },
  {
    id: "provider_sdks",
    description: "No auth, database, payment, or external provider SDK is added."
  },
  {
    id: "logging_or_observability_sdks",
    description: "No logging or observability provider package is added."
  },
  {
    id: "network_or_browser_storage_access",
    description: "No network helper or browser storage access is added."
  },
  {
    id: "environment_configuration",
    description: "No environment variables or feature flags are added."
  },
  {
    id: "billing_payment_or_checkout",
    description:
      "No billing, payment, checkout, invoice, or subscription behavior is added."
  },
  {
    id: "paid_entitlement_grants",
    description: "No paid entitlement can be granted by account sync."
  },
  {
    id: "production_configuration_or_data",
    description:
      "No production configuration, deployment setting, secret, or production user data is changed."
  }
] as const satisfies readonly AccountSyncRuntimeValidatorNonGoal[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_IMPLEMENTATION_GATES = [
  {
    id: "owner_approves_validator_dependency",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Owner approves the validator package and dependency PR before any real route parses live payloads."
  },
  {
    id: "validator_adapter_implemented_in_separate_pr",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Implement validator-specific parsing only behind the normalized validation port."
  },
  {
    id: "normalized_issue_mapping_proven",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Map validator-native issues into safe paths, codes, expected kinds, and size classes."
  },
  {
    id: "size_ceiling_enforced_before_deep_validation",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Prove request, cursor, response, and collection ceilings reject before deep parsing."
  },
  {
    id: "apply_rejects_before_idempotency_or_writes",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Prove malformed apply cannot create idempotency records, review events, or derived learning state."
  },
  {
    id: "digest_audit_bounded_validation_proven",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Prove digest and audit validate bounded query and bounded response shapes."
  },
  {
    id: "redacted_failure_manual_qa",
    status: "blocked",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Run manual QA proving validation failures never echo raw payloads, secrets, provider tokens, or billing data."
  },
  {
    id: "auth_and_persistence_boundaries_ready",
    status: "blocked",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Complete auth ownership, persistence, idempotency, monitoring, rollout, rollback, and QA blockers first."
  }
] as const satisfies readonly AccountSyncRuntimeValidatorImplementationGate[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MANUAL_QA_REQUIREMENTS = [
  {
    id: "preview_malformed_rejection",
    routeIds: ["preview"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "apply_malformed_rejection_before_idempotency",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "apply_missing_idempotency_key",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "apply_missing_safe_intent",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "digest_audit_bounded_query",
    routeIds: ["digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "bounded_response_validation",
    routeIds: ["digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "redacted_validation_errors",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "forbidden_sensitive_fields",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "fake_mastery_block",
    routeIds: ["preview", "apply"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "no_billing_or_entitlement_mutation",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealValidatorIntegration: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  }
] as const satisfies readonly AccountSyncRuntimeValidatorManualQARequirement[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_NEXT_STEP = {
  prNumber: 68,
  title: "Disabled/mock-gated account sync implementation spike plan",
  docsContractsTestsOnly: true,
  realApiRouteImplementationRecommended: false
} as const satisfies AccountSyncRuntimeValidatorNextStep;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_SAFETY_SCOPE = {
  docsContractsTestsOnly: true,
  actualRuntimeValidationAllowed: false,
  validatorDependencyAllowed: false,
  validatorLibraryImportsAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeIntegrationAllowed: false,
  realAuthAllowed: false,
  databasePersistenceAllowed: false,
  dbProviderSdkAllowed: false,
  authProviderSdkAllowed: false,
  paymentProviderSdkAllowed: false,
  loggingProviderSdkAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  environmentReadsAllowed: false,
  billingPaymentAllowed: false,
  paidEntitlementGrantAllowed: false,
  webflowChangesAllowed: false,
  cloudflareWorkerChangesAllowed: false,
  vercelSettingsChangesAllowed: false,
  dnsChangesAllowed: false,
  productionDataChangesAllowed: false
} as const satisfies AccountSyncRuntimeValidatorDecisionRecord["safetyScope"];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD = {
  accountSyncRuntimeValidatorDecisionVersion:
    ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_VERSION,
  decisionStatus: "design_only_not_implementation_ready",
  selectedRuntimeValidatorStrategy: "zod_compatible_future_adapter",
  preferredFutureValidatorKind: "zod",
  selectedStrategies: ACCOUNT_SYNC_SELECTED_RUNTIME_VALIDATOR_STRATEGIES,
  finalVerdict: "design_only",
  implementationReady: false,
  accountSyncCoreValidatorNeutral: true,
  validatorDependencyAddedInThisPr: false,
  validatorDependencyImportedInThisPr: false,
  candidates: ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES,
  adapterBoundary: ACCOUNT_SYNC_RUNTIME_VALIDATOR_ADAPTER_BOUNDARY,
  portContract: ACCOUNT_SYNC_RUNTIME_VALIDATION_PORT_CONTRACT,
  routePolicies: ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES,
  redactionPolicy: ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY,
  dependencyPolicy: ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY,
  risks: ACCOUNT_SYNC_RUNTIME_VALIDATOR_RISKS,
  nonGoals: ACCOUNT_SYNC_RUNTIME_VALIDATOR_NON_GOALS,
  implementationGates: ACCOUNT_SYNC_RUNTIME_VALIDATOR_IMPLEMENTATION_GATES,
  manualQARequirements: ACCOUNT_SYNC_RUNTIME_VALIDATOR_MANUAL_QA_REQUIREMENTS,
  nextStep: ACCOUNT_SYNC_RUNTIME_VALIDATOR_NEXT_STEP,
  safetyScope: ACCOUNT_SYNC_RUNTIME_VALIDATOR_SAFETY_SCOPE
} as const satisfies AccountSyncRuntimeValidatorDecisionRecord;

const RUNTIME_VALIDATION_LIMITS = {
  preview_request_body: 98_304,
  apply_request_body: 163_840,
  digest_query_cursor: 2_048,
  audit_query_cursor: 4_096,
  digest_response_summary: 32_768,
  audit_response_summary: 65_536,
  review_events_per_apply: 100,
  saved_words_per_apply: 200,
  pack_progress_entries_per_apply: 50,
  upgrade_interest_records_per_apply: 10
} as const;

function getRequiredRoutePolicy(routeId: VlxAccountSyncRouteId) {
  const policy = ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES.find(
    (routePolicy) => routePolicy.routeId === routeId
  );

  if (!policy) {
    throw new Error(`Missing runtime validation route policy: ${routeId}`);
  }

  return policy;
}

function addFailureWhenOverLimit({
  value,
  ceiling,
  reason,
  failureReasons
}: {
  value: number | undefined;
  ceiling: number;
  reason: AccountSyncRuntimeValidationFailureReason;
  failureReasons: AccountSyncRuntimeValidationFailureReason[];
}) {
  if (typeof value === "number" && value > ceiling) {
    failureReasons.push(reason);
  }
}

function issueForReason(
  reason: AccountSyncRuntimeValidationFailureReason
): AccountSyncRuntimeValidationIssue {
  const issueByReason: Record<
    AccountSyncRuntimeValidationFailureReason,
    AccountSyncRuntimeValidationIssue
  > = {
    malformed_payload: {
      path: "$",
      code: "malformed_payload",
      expectedKind: "object",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    invalid_payload_version: {
      path: "$.accountSyncPayloadVersion",
      code: "invalid_payload_version",
      expectedKind: "number",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    payload_too_large: {
      path: "$",
      code: "payload_too_large",
      sizeClass: "request_body_bytes",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    query_or_cursor_too_large: {
      path: "$.cursor",
      code: "query_or_cursor_too_large",
      sizeClass: "query_cursor_bytes",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    response_summary_too_large: {
      path: "$.responseSummary",
      code: "response_summary_too_large",
      sizeClass: "response_summary_bytes",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    review_event_count_too_large: {
      path: "$.reviewEvents",
      code: "review_event_count_too_large",
      sizeClass: "apply_collection_items",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    saved_word_count_too_large: {
      path: "$.savedWords",
      code: "saved_word_count_too_large",
      sizeClass: "apply_collection_items",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    pack_progress_count_too_large: {
      path: "$.packProgress",
      code: "pack_progress_count_too_large",
      sizeClass: "apply_collection_items",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    upgrade_interest_count_too_large: {
      path: "$.upgradeInterest",
      code: "upgrade_interest_count_too_large",
      sizeClass: "apply_collection_items",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    missing_idempotency_key: {
      path: "$.idempotencyKey",
      code: "missing_idempotency_key",
      expectedKind: "string",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    missing_safe_apply_intent: {
      path: "$.clientConfirmation",
      code: "missing_safe_apply_intent",
      expectedKind: "safe_apply_intent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    client_account_id_not_trusted: {
      path: "$.clientProvidedAccountId",
      code: "client_account_id_not_trusted",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    provider_tokens_forbidden: {
      path: "$.providerToken",
      code: "provider_tokens_forbidden",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    production_secrets_forbidden: {
      path: "$.productionSecret",
      code: "production_secrets_forbidden",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    billing_payment_payload_forbidden: {
      path: "$.billing",
      code: "billing_payment_payload_forbidden",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    paid_entitlement_payload_forbidden: {
      path: "$.paidEntitlement",
      code: "paid_entitlement_payload_forbidden",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    fake_server_mastery_claim: {
      path: "$.mastery",
      code: "fake_server_mastery_claim",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    },
    raw_sensitive_payload_forbidden: {
      path: "$.rawPayload",
      code: "raw_sensitive_payload_forbidden",
      expectedKind: "forbidden_field_absent",
      rawValueIncluded: false,
      rawPayloadEchoed: false,
      safeForClient: true,
      safeForAudit: true
    }
  };

  return issueByReason[reason];
}

export function getAccountSyncRuntimeValidatorCandidate(
  validatorKind: AccountSyncRuntimeValidatorKind
) {
  return ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES.find(
    (candidate) => candidate.kind === validatorKind
  );
}

export function getAccountSyncRuntimeValidationRoutePolicy(
  routeId: VlxAccountSyncRouteId
) {
  return ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES.find(
    (policy) => policy.routeId === routeId
  );
}

export function decideAccountSyncRuntimeValidation(
  input: AccountSyncRuntimeValidationInput
): AccountSyncRuntimeValidationDecision {
  const policy = getRequiredRoutePolicy(input.routeId);
  const failureReasons: AccountSyncRuntimeValidationFailureReason[] = [];

  if (policy.routeId === "preview") {
    addFailureWhenOverLimit({
      value: input.payloadByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.preview_request_body,
      reason: "payload_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "apply") {
    addFailureWhenOverLimit({
      value: input.payloadByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.apply_request_body,
      reason: "payload_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.reviewEventCount,
      ceiling: RUNTIME_VALIDATION_LIMITS.review_events_per_apply,
      reason: "review_event_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.savedWordCount,
      ceiling: RUNTIME_VALIDATION_LIMITS.saved_words_per_apply,
      reason: "saved_word_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.packProgressEntryCount,
      ceiling: RUNTIME_VALIDATION_LIMITS.pack_progress_entries_per_apply,
      reason: "pack_progress_count_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.upgradeInterestRecordCount,
      ceiling: RUNTIME_VALIDATION_LIMITS.upgrade_interest_records_per_apply,
      reason: "upgrade_interest_count_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "digest") {
    addFailureWhenOverLimit({
      value: input.queryCursorByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.digest_query_cursor,
      reason: "query_or_cursor_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.responseSummaryByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.digest_response_summary,
      reason: "response_summary_too_large",
      failureReasons
    });
  }

  if (policy.routeId === "audit") {
    addFailureWhenOverLimit({
      value: input.queryCursorByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.audit_query_cursor,
      reason: "query_or_cursor_too_large",
      failureReasons
    });
    addFailureWhenOverLimit({
      value: input.responseSummaryByteLength,
      ceiling: RUNTIME_VALIDATION_LIMITS.audit_response_summary,
      reason: "response_summary_too_large",
      failureReasons
    });
  }

  const sizeFailureCount = failureReasons.length;

  if (sizeFailureCount === 0) {
    if (input.hasMalformedPayload) {
      failureReasons.push("malformed_payload");
    }

    if (input.hasInvalidPayloadVersion) {
      failureReasons.push("invalid_payload_version");
    }

    if (policy.requiresIdempotencyKey && input.missingIdempotencyKey) {
      failureReasons.push("missing_idempotency_key");
    }

    if (policy.requiresSafeApplyIntent && input.missingSafeApplyIntent) {
      failureReasons.push("missing_safe_apply_intent");
    }

    if (input.hasClientProvidedAccountIdAsOwnershipProof) {
      failureReasons.push("client_account_id_not_trusted");
    }

    if (input.includesProviderTokens) {
      failureReasons.push("provider_tokens_forbidden");
    }

    if (input.includesProductionSecrets) {
      failureReasons.push("production_secrets_forbidden");
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
    issues: uniqueFailureReasons
      .slice(0, ACCOUNT_SYNC_RUNTIME_VALIDATION_REDACTION_POLICY.maxIssuesReturned)
      .map(issueForReason),
    sizeCeilingCheckedBeforeDeepValidation: true,
    deepValidationAllowed: sizeFailureCount === 0,
    runtimeValidatorDependencyUsed: false,
    validatorAdapterInvoked: false,
    conflictResolutionAllowed:
      ok && (policy.routeId === "preview" || policy.routeId === "apply"),
    idempotencyRecordCreationAllowed: ok && isApply,
    learningStateWriteAllowed: ok && isApply,
    malformedApplyCanCreateIdempotencyRecord: false,
    malformedApplyCanCreatePartialLearningState: false,
    boundedQueryValidated: ok && policy.requiresBoundedQueryValidation,
    boundedResponseValidated: ok && policy.requiresBoundedResponseValidation,
    clientAccountIdTrustedAsOwnershipProof: false,
    fakeServerMasteryAccepted: false,
    reviewEventsRemainSourceOfTruth: true,
    packProgressWithoutReviewEventsAuditOnly: Boolean(
      input.hasPackProgressWithoutReviewEventEvidence
    ),
    upgradeInterestAttributionOnly: Boolean(input.hasUpgradeInterestRecords),
    paidEntitlementGranted: false,
    billingPaymentAccepted: false,
    providerTokensAccepted: false,
    productionSecretsAccepted: false,
    rawPayloadEchoed: false,
    designOnly: true,
    implementsActualRuntimeValidation: false
  };
}
