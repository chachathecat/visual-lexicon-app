import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN_VERSION = 1 as const;

export type AccountSyncImplementationSpikePlanVersion =
  typeof ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN_VERSION;

export type AccountSyncImplementationSpikeSourcePr =
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67;

export type AccountSyncImplementationSpikePhase =
  | "design_only"
  | "future_disabled_route_skeleton"
  | "future_mock_gated_adapter_work"
  | "future_shadow_mode_no_mutation"
  | "future_read_only_preview"
  | "future_apply_enabled_after_owner_approval"
  | "production_enabled";

export type AccountSyncImplementationSpikeDecision = {
  id: "account_sync_implementation_spike_plan_v1";
  accountSyncImplementationSpikePlanVersion: AccountSyncImplementationSpikePlanVersion;
  appliesToPr: 68;
  relationshipPrs: readonly AccountSyncImplementationSpikeSourcePr[];
  currentPhase: "design_only";
  implementationAllowed: false;
  realRoutesAllowed: false;
  productionEnabled: false;
  finalVerdict: "design_only_real_routes_still_blocked";
  docsContractsTestsOnly: true;
  noRuntimeBehaviorChange: true;
  routeFilesCreatedInThisPr: false;
  routeHandlersCreatedInThisPr: false;
  middlewareCreatedInThisPr: false;
  runtimeIntegrationCreatedInThisPr: false;
};

export type AccountSyncImplementationSpikeGateId =
  | "owner_approval_and_no_go_to_go"
  | "disabled_by_default"
  | "mock_boundary_before_provider_integration"
  | "auth_adapter_boundary"
  | "db_adapter_boundary"
  | "validator_adapter_boundary"
  | "durable_idempotency"
  | "audit_redaction"
  | "monitoring"
  | "kill_switch"
  | "rollback"
  | "manual_qa"
  | "shadow_mode_no_mutation"
  | "production_data_safety"
  | "billing_payment_boundary"
  | "paid_entitlement_boundary"
  | "fake_mastery_block"
  | "srs_event_source_of_truth";

export type AccountSyncImplementationSpikeGateStatus =
  | "blocked"
  | "not_started"
  | "requires_owner_approval"
  | "requires_separate_pr"
  | "design_contract_only";

export type AccountSyncImplementationSpikeGate = {
  id: AccountSyncImplementationSpikeGateId;
  label: string;
  status: AccountSyncImplementationSpikeGateStatus;
  requiredBeforeAnyRealRoute: boolean;
  requiredBeforePreviewEnablement: boolean;
  requiredBeforeApplyEnablement: boolean;
  requiredBeforeProductionEnablement: true;
  blocksRealRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncImplementationSpikeStopConditionId =
  | "auth_ambiguity"
  | "cross_account_risk"
  | "validation_leakage"
  | "raw_payload_exposure"
  | "idempotency_conflict"
  | "fake_mastery_acceptance"
  | "paid_entitlement_mutation"
  | "billing_payment_boundary_crossed"
  | "missing_rollback"
  | "missing_kill_switch"
  | "production_data_access"
  | "monitoring_failure"
  | "provider_code_in_sync_core"
  | "shadow_mode_mutation";

export type AccountSyncImplementationSpikeStopCondition = {
  id: AccountSyncImplementationSpikeStopConditionId;
  severity: "P0";
  trigger: string;
  stopAction:
    | "stop_before_route_pr"
    | "stop_before_preview_enablement"
    | "stop_before_apply_enablement"
    | "disable_apply_and_return_to_design";
  routeIds: readonly VlxAccountSyncRouteId[];
  blocksRealRoutes: true;
  requiresOwnerDecisionToResume: true;
};

export type AccountSyncImplementationSpikeScope = {
  docsContractsTestsOnly: true;
  apiRouteFilesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  runtimeRouteIntegrationAllowed: false;
  realAuthAllowed: false;
  databasePersistenceAllowed: false;
  authProviderSdkAllowed: false;
  dbProviderSdkAllowed: false;
  validationDependencyAllowed: false;
  loggingProviderSdkAllowed: false;
  paymentProviderSdkAllowed: false;
  networkCallsAllowed: false;
  browserStorageAccessAllowed: false;
  environmentReadsAllowed: false;
  packageJsonChangesAllowed: false;
  packageLockChangesAllowed: false;
  migrationsAllowed: false;
  executableSchemasAllowed: false;
  productionDataAccessAllowed: false;
  productionDataMutationAllowed: false;
  webflowChangesAllowed: false;
  cloudflareWorkerChangesAllowed: false;
  vercelSettingsChangesAllowed: false;
  dnsChangesAllowed: false;
  paidEntitlementGrantAllowed: false;
  billingPaymentAllowed: false;
  fakeMasteryAllowed: false;
};

export type AccountSyncImplementationSpikeNonGoal = {
  id:
    | "real_api_routes"
    | "route_handlers"
    | "middleware"
    | "runtime_route_or_component_integration"
    | "real_auth"
    | "database_persistence"
    | "provider_sdks"
    | "validation_dependencies"
    | "logging_or_observability_sdks"
    | "network_calls"
    | "browser_storage_access"
    | "environment_configuration"
    | "billing_payment_checkout_subscription"
    | "paid_entitlement_grants"
    | "production_data_access"
    | "migrations_or_executable_schema"
    | "webflow_cloudflare_vercel_dns";
  description: string;
};

export type AccountSyncImplementationSpikeMockBoundary = {
  id: "account_sync_disabled_mock_boundary_v1";
  requiredBeforeProviderIntegration: true;
  mockOnlyInterfacesRequired: true;
  disabledByDefaultRequired: true;
  realProviderIntegrationAllowed: false;
  productionDataAccessAllowed: false;
  authProviderSpecificCodeAllowedInSyncCore: false;
  dbProviderSpecificCodeAllowedInSyncCore: false;
  validatorSpecificCodeAllowedInSyncCore: false;
  authProviderSpecificCodeAllowedAtAdapterEdgeInFuture: true;
  dbProviderSpecificCodeAllowedAtAdapterEdgeInFuture: true;
  validatorSpecificCodeAllowedAtAdapterEdgeInFuture: true;
  routeHandlerCreatedInThisPr: false;
  middlewareCreatedInThisPr: false;
  runtimeIntegrationCreatedInThisPr: false;
  networkCallsAllowedInThisPr: false;
  browserStorageAccessAllowedInThisPr: false;
  environmentReadsAllowedInThisPr: false;
};

export type AccountSyncImplementationSpikeRoutePlan = {
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  purpose: string;
  futureOnly: true;
  disabledByDefaultRequired: true;
  mockGatedBeforeProviderIntegration: true;
  realRouteAllowedInThisPr: false;
  routeFileCreatedInThisPr: false;
  routeHandlerCreatedInThisPr: false;
  runtimeIntegrationCreatedInThisPr: false;
  productionEnabled: false;
  readOnly: boolean;
  mutatingFutureRoute: boolean;
  applyDisabled: boolean;
  ownerOnlyRequired: true;
  boundedResponseRequired: boolean;
  redactedResponseRequired: boolean;
  requiresAuthGate: true;
  requiresDbGate: boolean;
  requiresValidatorGate: true;
  requiresIdempotencyGate: boolean;
  requiresAuditRedactionGate: true;
  requiresMonitoringGate: true;
  requiresRollbackGate: boolean;
  requiresKillSwitchBeforeMutation: boolean;
  grantsPaidEntitlement: false;
  billingPaymentOutsideSync: true;
  productionDataAccessAllowedInThisPr: false;
};

export type AccountSyncImplementationSequenceStepId =
  | "reconfirm_owner_approval_and_no_go_to_go_criteria"
  | "future_provider_neutral_route_skeleton_pr"
  | "future_disabled_mock_only_route_skeleton"
  | "future_runtime_validator_adapter_pr"
  | "future_auth_adapter_pr"
  | "future_persistence_adapter_pr"
  | "future_durable_idempotency_storage_pr"
  | "future_audit_redaction_writer_pr"
  | "future_monitoring_and_kill_switch_pr"
  | "internal_staff_only_qa"
  | "shadow_mode_no_mutation"
  | "preview_read_only_enablement_after_gates"
  | "apply_enablement_after_explicit_owner_approval";

export type AccountSyncImplementationSpikeSequenceStep = {
  order: number;
  id: AccountSyncImplementationSequenceStepId;
  label: string;
  allowedInThisPr: false;
  futureSeparatePrRequired: true;
  ownerApprovalRequiredBeforeStart: boolean;
  routeFilesMayBeCreatedInThisPr: false;
  realProviderIntegrationAllowedAtThisStep: boolean;
  productionMutationAllowed: false;
};

export type AccountSyncImplementationValidationCheckpointId =
  | "current_phase_design_only"
  | "no_actual_route_files"
  | "disabled_by_default"
  | "mock_boundary_before_provider_integration"
  | "provider_specific_code_outside_sync_core"
  | "preview_read_only"
  | "apply_disabled_until_all_gates"
  | "digest_audit_owner_only_bounded_redacted"
  | "shadow_mode_no_mutation"
  | "review_events_srs_source_of_truth"
  | "idempotency_replay_no_double_advance"
  | "same_key_different_fingerprint_rejected"
  | "pack_progress_audit_only_without_event_evidence"
  | "fake_mastery_blocked"
  | "paid_entitlement_blocked"
  | "billing_payment_outside_sync"
  | "production_data_forbidden";

export type AccountSyncImplementationSpikeValidationPlan = {
  id: "account_sync_implementation_spike_validation_plan_v1";
  checkpoints: readonly AccountSyncImplementationValidationCheckpointId[];
  currentPhaseMustBeDesignOnly: true;
  realRoutesMustRemainBlocked: true;
  packageFilesMustRemainUnchanged: true;
  previewMustBeReadOnly: true;
  applyMustRemainDisabledUntilAllGatesSatisfied: true;
  digestAuditMustBeOwnerOnlyBoundedAndRedacted: true;
  mockBoundaryRequiredBeforeProviderIntegration: true;
  providerSpecificCodeMustRemainOutsideSyncCore: true;
  manualQaWithRealAuthenticatedSessionsRequiredBeforeProduction: true;
  shadowModeCanMutateLearningState: false;
  productionDataAccessAllowed: false;
  paidEntitlementGrantAllowed: false;
  billingPaymentMutationAllowed: false;
  fakeMasteryAccepted: false;
  reviewEventsRemainSrsSourceOfTruth: true;
  duplicateReplayCanAdvanceSrsTwice: false;
  sameKeyDifferentFingerprintAccepted: false;
  packProgressWithoutReviewEventsAuditOnly: true;
};

export type AccountSyncImplementationSpikeRollbackPlan = {
  id: "account_sync_implementation_spike_rollback_plan_v1";
  requiredBeforeApplyEnablement: true;
  killSwitchRequiredBeforeAnyRealMutation: true;
  monitoringRequiredBeforeAnyEnablement: true;
  firstActionOnIncident: "disable_mutating_apply";
  preservesIdempotencyRecords: true;
  preservesAuditSummaries: true;
  preservesReviewEvents: true;
  preservesReviewState: true;
  preservesSavedWords: true;
  preservesDailyStats: true;
  preservesPackEvidence: true;
  deletesProductionLearningEvidence: false;
  duplicateReplayAfterRollbackCanAdvanceSrsTwice: false;
  rollbackRequiresOwnerApproval: true;
  missingRollbackIsStopCondition: true;
};

export type AccountSyncImplementationManualQAFlow = {
  id:
    | "preview_read_only"
    | "apply_disabled"
    | "digest_owner_only_bounded"
    | "audit_owner_only_redacted"
    | "shadow_mode_no_mutation"
    | "idempotency_replay"
    | "idempotency_conflict"
    | "kill_switch"
    | "rollback"
    | "fake_mastery"
    | "paid_entitlement_boundary"
    | "billing_payment_boundary"
    | "production_data_safety";
  routeIds: readonly VlxAccountSyncRouteId[];
  requiresRealAuthenticatedSession: true;
  requiredBeforeProductionEnablement: true;
  requiresOwnerOnlyEvidence: boolean;
  requiresNoMutationEvidence: boolean;
  requiresRedactionEvidence: boolean;
};

export type AccountSyncImplementationSpikeManualQAPlan = {
  id: "account_sync_implementation_spike_manual_qa_plan_v1";
  requiredBeforeProductionEnablement: true;
  requiredBeforeApplyEnablement: true;
  requiresRealAuthenticatedSessions: true;
  internalStaffOnlyBeforePreview: true;
  flows: readonly AccountSyncImplementationManualQAFlow[];
};

export type AccountSyncImplementationSpikeNextStep = {
  prNumber: 69;
  title: "Account sync route skeleton decision";
  stillDisabledMockGated: true;
  explicitOwnerApprovalRequiredBeforeRouteFiles: true;
  realApiRouteImplementationRecommended: false;
  docsContractsTestsOnlyRecommended: true;
};

export type AccountSyncImplementationSpikePlan = {
  decision: AccountSyncImplementationSpikeDecision;
  scope: AccountSyncImplementationSpikeScope;
  nonGoals: readonly AccountSyncImplementationSpikeNonGoal[];
  mockBoundary: AccountSyncImplementationSpikeMockBoundary;
  routePlans: readonly AccountSyncImplementationSpikeRoutePlan[];
  gates: readonly AccountSyncImplementationSpikeGate[];
  stopConditions: readonly AccountSyncImplementationSpikeStopCondition[];
  implementationSequence: readonly AccountSyncImplementationSpikeSequenceStep[];
  validationPlan: AccountSyncImplementationSpikeValidationPlan;
  rollbackPlan: AccountSyncImplementationSpikeRollbackPlan;
  manualQAPlan: AccountSyncImplementationSpikeManualQAPlan;
  nextStep: AccountSyncImplementationSpikeNextStep;
};

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION = {
  id: "account_sync_implementation_spike_plan_v1",
  accountSyncImplementationSpikePlanVersion:
    ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN_VERSION,
  appliesToPr: 68,
  relationshipPrs: [58, 59, 60, 61, 62, 63, 64, 65, 66, 67],
  currentPhase: "design_only",
  implementationAllowed: false,
  realRoutesAllowed: false,
  productionEnabled: false,
  finalVerdict: "design_only_real_routes_still_blocked",
  docsContractsTestsOnly: true,
  noRuntimeBehaviorChange: true,
  routeFilesCreatedInThisPr: false,
  routeHandlersCreatedInThisPr: false,
  middlewareCreatedInThisPr: false,
  runtimeIntegrationCreatedInThisPr: false
} as const satisfies AccountSyncImplementationSpikeDecision;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SCOPE = {
  docsContractsTestsOnly: true,
  apiRouteFilesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeRouteIntegrationAllowed: false,
  realAuthAllowed: false,
  databasePersistenceAllowed: false,
  authProviderSdkAllowed: false,
  dbProviderSdkAllowed: false,
  validationDependencyAllowed: false,
  loggingProviderSdkAllowed: false,
  paymentProviderSdkAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  environmentReadsAllowed: false,
  packageJsonChangesAllowed: false,
  packageLockChangesAllowed: false,
  migrationsAllowed: false,
  executableSchemasAllowed: false,
  productionDataAccessAllowed: false,
  productionDataMutationAllowed: false,
  webflowChangesAllowed: false,
  cloudflareWorkerChangesAllowed: false,
  vercelSettingsChangesAllowed: false,
  dnsChangesAllowed: false,
  paidEntitlementGrantAllowed: false,
  billingPaymentAllowed: false,
  fakeMasteryAllowed: false
} as const satisfies AccountSyncImplementationSpikeScope;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NON_GOALS = [
  {
    id: "real_api_routes",
    description: "No real account sync API route files are created."
  },
  {
    id: "route_handlers",
    description: "No route handler functions are created."
  },
  {
    id: "middleware",
    description: "No middleware is added or changed."
  },
  {
    id: "runtime_route_or_component_integration",
    description: "No runtime route, server, or component integration is added."
  },
  {
    id: "real_auth",
    description: "No real authentication implementation is added."
  },
  {
    id: "database_persistence",
    description: "No database persistence or table implementation is added."
  },
  {
    id: "provider_sdks",
    description: "No auth, database, payment, or operations provider package is imported."
  },
  {
    id: "validation_dependencies",
    description: "No runtime validator package is added or imported."
  },
  {
    id: "logging_or_observability_sdks",
    description: "No logging or observability provider package is added."
  },
  {
    id: "network_calls",
    description: "No network helper or remote service access is added."
  },
  {
    id: "browser_storage_access",
    description: "No browser storage read or write behavior is added."
  },
  {
    id: "environment_configuration",
    description: "No environment variable, secret, or feature configuration is added."
  },
  {
    id: "billing_payment_checkout_subscription",
    description: "No billing, payment, checkout, invoice, or subscription behavior is added."
  },
  {
    id: "paid_entitlement_grants",
    description: "No paid entitlement can be granted by account sync."
  },
  {
    id: "production_data_access",
    description: "No production user data is read, written, migrated, or deleted."
  },
  {
    id: "migrations_or_executable_schema",
    description: "No migration file or executable database schema is created."
  },
  {
    id: "webflow_cloudflare_vercel_dns",
    description: "No Webflow, Cloudflare Worker, Vercel, deployment, or DNS setting is changed."
  }
] as const satisfies readonly AccountSyncImplementationSpikeNonGoal[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MOCK_BOUNDARY = {
  id: "account_sync_disabled_mock_boundary_v1",
  requiredBeforeProviderIntegration: true,
  mockOnlyInterfacesRequired: true,
  disabledByDefaultRequired: true,
  realProviderIntegrationAllowed: false,
  productionDataAccessAllowed: false,
  authProviderSpecificCodeAllowedInSyncCore: false,
  dbProviderSpecificCodeAllowedInSyncCore: false,
  validatorSpecificCodeAllowedInSyncCore: false,
  authProviderSpecificCodeAllowedAtAdapterEdgeInFuture: true,
  dbProviderSpecificCodeAllowedAtAdapterEdgeInFuture: true,
  validatorSpecificCodeAllowedAtAdapterEdgeInFuture: true,
  routeHandlerCreatedInThisPr: false,
  middlewareCreatedInThisPr: false,
  runtimeIntegrationCreatedInThisPr: false,
  networkCallsAllowedInThisPr: false,
  browserStorageAccessAllowedInThisPr: false,
  environmentReadsAllowedInThisPr: false
} as const satisfies AccountSyncImplementationSpikeMockBoundary;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    purpose:
      "Future read-only conflict preview that must not mutate learning state or account state.",
    futureOnly: true,
    disabledByDefaultRequired: true,
    mockGatedBeforeProviderIntegration: true,
    realRouteAllowedInThisPr: false,
    routeFileCreatedInThisPr: false,
    routeHandlerCreatedInThisPr: false,
    runtimeIntegrationCreatedInThisPr: false,
    productionEnabled: false,
    readOnly: true,
    mutatingFutureRoute: false,
    applyDisabled: false,
    ownerOnlyRequired: true,
    boundedResponseRequired: true,
    redactedResponseRequired: true,
    requiresAuthGate: true,
    requiresDbGate: true,
    requiresValidatorGate: true,
    requiresIdempotencyGate: false,
    requiresAuditRedactionGate: true,
    requiresMonitoringGate: true,
    requiresRollbackGate: false,
    requiresKillSwitchBeforeMutation: false,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    productionDataAccessAllowedInThisPr: false
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    purpose:
      "Future mutating apply route that stays disabled until every auth, DB, validator, idempotency, audit, monitoring, rollback, kill-switch, and QA gate is satisfied.",
    futureOnly: true,
    disabledByDefaultRequired: true,
    mockGatedBeforeProviderIntegration: true,
    realRouteAllowedInThisPr: false,
    routeFileCreatedInThisPr: false,
    routeHandlerCreatedInThisPr: false,
    runtimeIntegrationCreatedInThisPr: false,
    productionEnabled: false,
    readOnly: false,
    mutatingFutureRoute: true,
    applyDisabled: true,
    ownerOnlyRequired: true,
    boundedResponseRequired: true,
    redactedResponseRequired: true,
    requiresAuthGate: true,
    requiresDbGate: true,
    requiresValidatorGate: true,
    requiresIdempotencyGate: true,
    requiresAuditRedactionGate: true,
    requiresMonitoringGate: true,
    requiresRollbackGate: true,
    requiresKillSwitchBeforeMutation: true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    productionDataAccessAllowedInThisPr: false
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    purpose:
      "Future owner-only bounded account-state digest without full sensitive state.",
    futureOnly: true,
    disabledByDefaultRequired: true,
    mockGatedBeforeProviderIntegration: true,
    realRouteAllowedInThisPr: false,
    routeFileCreatedInThisPr: false,
    routeHandlerCreatedInThisPr: false,
    runtimeIntegrationCreatedInThisPr: false,
    productionEnabled: false,
    readOnly: true,
    mutatingFutureRoute: false,
    applyDisabled: false,
    ownerOnlyRequired: true,
    boundedResponseRequired: true,
    redactedResponseRequired: true,
    requiresAuthGate: true,
    requiresDbGate: true,
    requiresValidatorGate: true,
    requiresIdempotencyGate: false,
    requiresAuditRedactionGate: true,
    requiresMonitoringGate: true,
    requiresRollbackGate: false,
    requiresKillSwitchBeforeMutation: false,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    productionDataAccessAllowedInThisPr: false
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    purpose:
      "Future owner-only bounded redacted audit summary route without raw payload material.",
    futureOnly: true,
    disabledByDefaultRequired: true,
    mockGatedBeforeProviderIntegration: true,
    realRouteAllowedInThisPr: false,
    routeFileCreatedInThisPr: false,
    routeHandlerCreatedInThisPr: false,
    runtimeIntegrationCreatedInThisPr: false,
    productionEnabled: false,
    readOnly: true,
    mutatingFutureRoute: false,
    applyDisabled: false,
    ownerOnlyRequired: true,
    boundedResponseRequired: true,
    redactedResponseRequired: true,
    requiresAuthGate: true,
    requiresDbGate: true,
    requiresValidatorGate: true,
    requiresIdempotencyGate: false,
    requiresAuditRedactionGate: true,
    requiresMonitoringGate: true,
    requiresRollbackGate: false,
    requiresKillSwitchBeforeMutation: false,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    productionDataAccessAllowedInThisPr: false
  }
] as const satisfies readonly AccountSyncImplementationSpikeRoutePlan[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES = [
  {
    id: "owner_approval_and_no_go_to_go",
    label: "Owner approval and No-Go-to-Go criteria are reconfirmed.",
    status: "requires_owner_approval",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Owner explicitly approves the next PR scope and confirms all No-Go-to-Go criteria."
  },
  {
    id: "disabled_by_default",
    label: "Any future route skeleton starts disabled by default.",
    status: "blocked",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Future route skeleton must expose no production behavior until gates are proven."
  },
  {
    id: "mock_boundary_before_provider_integration",
    label: "Mock-only boundary exists before provider integration.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Route-shaped work must run only against disabled mock interfaces before auth, DB, or validator providers are wired."
  },
  {
    id: "auth_adapter_boundary",
    label: "Auth adapter keeps provider-specific code outside sync core.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Only a normalized server-derived principal may enter account sync core."
  },
  {
    id: "db_adapter_boundary",
    label: "DB adapter keeps provider-specific code outside sync core.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Persistence must flow through an owner-scoped port and avoid provider details in sync core."
  },
  {
    id: "validator_adapter_boundary",
    label: "Runtime validator adapter keeps package-specific code outside sync core.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Validation output must normalize to redacted route decisions before sync core sees it."
  },
  {
    id: "durable_idempotency",
    label: "Durable idempotency storage and replay safety are proven.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: false,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Same key and fingerprint replay returns the stored outcome; same key with a different fingerprint rejects."
  },
  {
    id: "audit_redaction",
    label: "Audit writer and redaction policy are implemented.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Audit and digest responses contain bounded summaries only."
  },
  {
    id: "monitoring",
    label: "Monitoring is implemented before enablement.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Preview, apply, digest, audit, rejections, latency, and kill-switch status are visible."
  },
  {
    id: "kill_switch",
    label: "Apply kill switch exists before any real mutation.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: false,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Mutating apply can be disabled while owner-only read diagnostics remain bounded and redacted."
  },
  {
    id: "rollback",
    label: "Rollback preserves learning evidence and idempotency records.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: false,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Rollback disables apply first and never deletes review events, derived state, or idempotency records."
  },
  {
    id: "manual_qa",
    label: "Manual QA with real authenticated sessions is complete.",
    status: "not_started",
    requiredBeforeAnyRealRoute: false,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Authenticated preview, apply-disabled, digest, audit, idempotency, redaction, rollback, and kill-switch flows are checked."
  },
  {
    id: "shadow_mode_no_mutation",
    label: "Shadow mode cannot mutate learning state.",
    status: "requires_separate_pr",
    requiredBeforeAnyRealRoute: false,
    requiredBeforePreviewEnablement: false,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Shadow-mode apply planning proves no review event, review state, saved word, daily stat, or pack progress mutation."
  },
  {
    id: "production_data_safety",
    label: "Production data access remains forbidden until approved.",
    status: "requires_owner_approval",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Owner-approved production data safety, retention, rollback, privacy, and deletion policy."
  },
  {
    id: "billing_payment_boundary",
    label: "Billing and payment stay outside account sync.",
    status: "design_contract_only",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Billing, checkout, invoice, subscription, and payment payloads reject at the sync boundary."
  },
  {
    id: "paid_entitlement_boundary",
    label: "Account sync cannot grant paid entitlement.",
    status: "design_contract_only",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Upgrade interest remains attribution-only and cannot become entitlement state."
  },
  {
    id: "fake_mastery_block",
    label: "Fake mastery remains blocked.",
    status: "design_contract_only",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Server mastery can only derive from delayed review-event evidence."
  },
  {
    id: "srs_event_source_of_truth",
    label: "Review events remain the SRS source of truth.",
    status: "design_contract_only",
    requiredBeforeAnyRealRoute: true,
    requiredBeforePreviewEnablement: true,
    requiredBeforeApplyEnablement: true,
    requiredBeforeProductionEnablement: true,
    blocksRealRouteImplementation: true,
    evidenceRequired:
      "Duplicate review event replay cannot advance SRS twice."
  }
] as const satisfies readonly AccountSyncImplementationSpikeGate[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS = [
  {
    id: "auth_ambiguity",
    severity: "P0",
    trigger:
      "The authenticated owner cannot be derived unambiguously from the server session.",
    stopAction: "stop_before_route_pr",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "cross_account_risk",
    severity: "P0",
    trigger: "Any read, preview, apply, digest, or audit path could target another account.",
    stopAction: "stop_before_route_pr",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "validation_leakage",
    severity: "P0",
    trigger: "Validation failures expose raw values or provider details.",
    stopAction: "stop_before_preview_enablement",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "raw_payload_exposure",
    severity: "P0",
    trigger: "Audit, digest, metrics, or errors expose raw snapshots or full state.",
    stopAction: "stop_before_preview_enablement",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "idempotency_conflict",
    severity: "P0",
    trigger: "Same idempotency key with a different request fingerprint is not rejected.",
    stopAction: "stop_before_apply_enablement",
    routeIds: ["apply"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "fake_mastery_acceptance",
    severity: "P0",
    trigger: "Fake local mastery or unsupported server mastery could become trusted state.",
    stopAction: "disable_apply_and_return_to_design",
    routeIds: ["preview", "apply"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "paid_entitlement_mutation",
    severity: "P0",
    trigger: "Account sync could grant, revoke, or alter paid entitlement.",
    stopAction: "disable_apply_and_return_to_design",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "billing_payment_boundary_crossed",
    severity: "P0",
    trigger: "Billing, payment, checkout, invoice, or subscription state enters sync.",
    stopAction: "disable_apply_and_return_to_design",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "missing_rollback",
    severity: "P0",
    trigger: "Rollback cannot preserve idempotency records and learning evidence.",
    stopAction: "stop_before_apply_enablement",
    routeIds: ["apply"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "missing_kill_switch",
    severity: "P0",
    trigger: "Mutating apply cannot be disabled independently.",
    stopAction: "stop_before_apply_enablement",
    routeIds: ["apply"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "production_data_access",
    severity: "P0",
    trigger: "A disabled or mock-gated spike touches production data.",
    stopAction: "stop_before_route_pr",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "monitoring_failure",
    severity: "P0",
    trigger: "Operators cannot see route attempts, rejections, conflicts, latency, or disablement.",
    stopAction: "stop_before_preview_enablement",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "provider_code_in_sync_core",
    severity: "P0",
    trigger: "Auth, DB, or validator provider-specific code enters account sync core.",
    stopAction: "stop_before_route_pr",
    routeIds: ["preview", "apply", "digest", "audit"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  },
  {
    id: "shadow_mode_mutation",
    severity: "P0",
    trigger: "Shadow mode can create review events, derived state, saved words, stats, or pack progress.",
    stopAction: "stop_before_apply_enablement",
    routeIds: ["apply"],
    blocksRealRoutes: true,
    requiresOwnerDecisionToResume: true
  }
] as const satisfies readonly AccountSyncImplementationSpikeStopCondition[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE = [
  {
    order: 1,
    id: "reconfirm_owner_approval_and_no_go_to_go_criteria",
    label: "Reconfirm owner approval and No-Go-to-Go criteria.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: false,
    productionMutationAllowed: false
  },
  {
    order: 2,
    id: "future_provider_neutral_route_skeleton_pr",
    label: "Add provider-neutral route skeleton only in a future separate PR.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: false,
    productionMutationAllowed: false
  },
  {
    order: 3,
    id: "future_disabled_mock_only_route_skeleton",
    label: "Keep any future route skeleton disabled and mock-only.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: false,
    productionMutationAllowed: false
  },
  {
    order: 4,
    id: "future_runtime_validator_adapter_pr",
    label: "Add runtime validator adapter after dependency approval.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: false,
    productionMutationAllowed: false
  },
  {
    order: 5,
    id: "future_auth_adapter_pr",
    label: "Add auth adapter after provider approval.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 6,
    id: "future_persistence_adapter_pr",
    label: "Add persistence adapter after DB provider approval.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 7,
    id: "future_durable_idempotency_storage_pr",
    label: "Add durable idempotency storage in a future separate PR.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 8,
    id: "future_audit_redaction_writer_pr",
    label: "Add audit redaction writer in a future separate PR.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 9,
    id: "future_monitoring_and_kill_switch_pr",
    label: "Add monitoring and kill switch in a future separate PR.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 10,
    id: "internal_staff_only_qa",
    label: "Run internal and staff-only QA.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 11,
    id: "shadow_mode_no_mutation",
    label: "Run shadow mode with no mutation.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 12,
    id: "preview_read_only_enablement_after_gates",
    label: "Enable read-only preview only after gates.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  },
  {
    order: 13,
    id: "apply_enablement_after_explicit_owner_approval",
    label: "Enable apply only after explicit owner approval.",
    allowedInThisPr: false,
    futureSeparatePrRequired: true,
    ownerApprovalRequiredBeforeStart: true,
    routeFilesMayBeCreatedInThisPr: false,
    realProviderIntegrationAllowedAtThisStep: true,
    productionMutationAllowed: false
  }
] as const satisfies readonly AccountSyncImplementationSpikeSequenceStep[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN = {
  id: "account_sync_implementation_spike_validation_plan_v1",
  checkpoints: [
    "current_phase_design_only",
    "no_actual_route_files",
    "disabled_by_default",
    "mock_boundary_before_provider_integration",
    "provider_specific_code_outside_sync_core",
    "preview_read_only",
    "apply_disabled_until_all_gates",
    "digest_audit_owner_only_bounded_redacted",
    "shadow_mode_no_mutation",
    "review_events_srs_source_of_truth",
    "idempotency_replay_no_double_advance",
    "same_key_different_fingerprint_rejected",
    "pack_progress_audit_only_without_event_evidence",
    "fake_mastery_blocked",
    "paid_entitlement_blocked",
    "billing_payment_outside_sync",
    "production_data_forbidden"
  ],
  currentPhaseMustBeDesignOnly: true,
  realRoutesMustRemainBlocked: true,
  packageFilesMustRemainUnchanged: true,
  previewMustBeReadOnly: true,
  applyMustRemainDisabledUntilAllGatesSatisfied: true,
  digestAuditMustBeOwnerOnlyBoundedAndRedacted: true,
  mockBoundaryRequiredBeforeProviderIntegration: true,
  providerSpecificCodeMustRemainOutsideSyncCore: true,
  manualQaWithRealAuthenticatedSessionsRequiredBeforeProduction: true,
  shadowModeCanMutateLearningState: false,
  productionDataAccessAllowed: false,
  paidEntitlementGrantAllowed: false,
  billingPaymentMutationAllowed: false,
  fakeMasteryAccepted: false,
  reviewEventsRemainSrsSourceOfTruth: true,
  duplicateReplayCanAdvanceSrsTwice: false,
  sameKeyDifferentFingerprintAccepted: false,
  packProgressWithoutReviewEventsAuditOnly: true
} as const satisfies AccountSyncImplementationSpikeValidationPlan;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROLLBACK_PLAN = {
  id: "account_sync_implementation_spike_rollback_plan_v1",
  requiredBeforeApplyEnablement: true,
  killSwitchRequiredBeforeAnyRealMutation: true,
  monitoringRequiredBeforeAnyEnablement: true,
  firstActionOnIncident: "disable_mutating_apply",
  preservesIdempotencyRecords: true,
  preservesAuditSummaries: true,
  preservesReviewEvents: true,
  preservesReviewState: true,
  preservesSavedWords: true,
  preservesDailyStats: true,
  preservesPackEvidence: true,
  deletesProductionLearningEvidence: false,
  duplicateReplayAfterRollbackCanAdvanceSrsTwice: false,
  rollbackRequiresOwnerApproval: true,
  missingRollbackIsStopCondition: true
} as const satisfies AccountSyncImplementationSpikeRollbackPlan;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN = {
  id: "account_sync_implementation_spike_manual_qa_plan_v1",
  requiredBeforeProductionEnablement: true,
  requiredBeforeApplyEnablement: true,
  requiresRealAuthenticatedSessions: true,
  internalStaffOnlyBeforePreview: true,
  flows: [
    {
      id: "preview_read_only",
      routeIds: ["preview"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "apply_disabled",
      routeIds: ["apply"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "digest_owner_only_bounded",
      routeIds: ["digest"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "audit_owner_only_redacted",
      routeIds: ["audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "shadow_mode_no_mutation",
      routeIds: ["apply"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "idempotency_replay",
      routeIds: ["apply"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: false
    },
    {
      id: "idempotency_conflict",
      routeIds: ["apply"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "kill_switch",
      routeIds: ["apply", "digest", "audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "rollback",
      routeIds: ["apply", "audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "fake_mastery",
      routeIds: ["preview", "apply"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "paid_entitlement_boundary",
      routeIds: ["preview", "apply", "digest", "audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "billing_payment_boundary",
      routeIds: ["preview", "apply", "digest", "audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    },
    {
      id: "production_data_safety",
      routeIds: ["preview", "apply", "digest", "audit"],
      requiresRealAuthenticatedSession: true,
      requiredBeforeProductionEnablement: true,
      requiresOwnerOnlyEvidence: true,
      requiresNoMutationEvidence: true,
      requiresRedactionEvidence: true
    }
  ]
} as const satisfies AccountSyncImplementationSpikeManualQAPlan;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NEXT_STEP = {
  prNumber: 69,
  title: "Account sync route skeleton decision",
  stillDisabledMockGated: true,
  explicitOwnerApprovalRequiredBeforeRouteFiles: true,
  realApiRouteImplementationRecommended: false,
  docsContractsTestsOnlyRecommended: true
} as const satisfies AccountSyncImplementationSpikeNextStep;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN = {
  decision: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DECISION,
  scope: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SCOPE,
  nonGoals: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NON_GOALS,
  mockBoundary: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MOCK_BOUNDARY,
  routePlans: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS,
  gates: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES,
  stopConditions: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS,
  implementationSequence: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE,
  validationPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN,
  rollbackPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROLLBACK_PLAN,
  manualQAPlan: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN,
  nextStep: ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_NEXT_STEP
} as const satisfies AccountSyncImplementationSpikePlan;

export function getAccountSyncImplementationSpikeRoutePlan(
  routeId: VlxAccountSyncRouteId
) {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS.find(
    (routePlan) => routePlan.routeId === routeId
  );
}

export function getAccountSyncImplementationSpikeGate(
  gateId: AccountSyncImplementationSpikeGateId
) {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES.find(
    (gate) => gate.id === gateId
  );
}

export function getAccountSyncImplementationSpikeStopCondition(
  stopConditionId: AccountSyncImplementationSpikeStopConditionId
) {
  return ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS.find(
    (stopCondition) => stopCondition.id === stopConditionId
  );
}
