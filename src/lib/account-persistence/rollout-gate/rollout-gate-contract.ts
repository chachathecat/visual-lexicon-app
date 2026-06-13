import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_ROLLOUT_GATE_VERSION = 1 as const;

export type AccountSyncRolloutGateVersion =
  typeof ACCOUNT_SYNC_ROLLOUT_GATE_VERSION;

export type AccountSyncRolloutPhase =
  | "design_only"
  | "local_contracts"
  | "mocked_handler_harness"
  | "internal_preview_only"
  | "staff_only_apply_disabled"
  | "limited_apply_shadow_mode"
  | "limited_apply_enabled"
  | "production_enabled"
  | "rollback_required"
  | "disabled";

export type AccountSyncApplyDisableMode =
  | "apply_route_not_created"
  | "mutating_apply_disabled"
  | "shadow_mode_no_mutation"
  | "read_only_diagnostics_only"
  | "full_account_sync_disabled";

export type AccountSyncIncidentSeverity = "SEV0" | "SEV1" | "SEV2" | "SEV3";

export type AccountSyncRolloutGateStatus =
  | "blocked"
  | "not_started"
  | "requires_separate_pr"
  | "requires_owner_approval"
  | "design_only";

export type AccountSyncOperationalRiskId =
  | "learning_state_corruption"
  | "duplicate_replay_advances_srs"
  | "fake_mastery_claim"
  | "paid_entitlement_or_billing_mutation"
  | "privacy_payload_exposure"
  | "cross_account_access"
  | "monitoring_blind_spot"
  | "kill_switch_missing"
  | "rollback_deletes_learning_evidence";

export type AccountSyncMetricName =
  | "account_sync_preview_requested"
  | "account_sync_preview_rejected"
  | "account_sync_apply_requested"
  | "account_sync_apply_accepted"
  | "account_sync_apply_replayed"
  | "account_sync_apply_blocked"
  | "account_sync_apply_rejected"
  | "account_sync_apply_conflict"
  | "account_sync_schema_rejected"
  | "account_sync_payload_too_large"
  | "account_sync_ownership_rejected"
  | "account_sync_idempotency_conflict"
  | "account_sync_fake_mastery_blocked"
  | "account_sync_paid_entitlement_ignored"
  | "account_sync_billing_payload_rejected"
  | "account_sync_digest_requested"
  | "account_sync_digest_rejected"
  | "account_sync_audit_requested"
  | "account_sync_audit_rejected"
  | "account_sync_latency_p95"
  | "account_sync_error_rate"
  | "account_sync_kill_switch_active";

export type AccountSyncMonitoringMetric = {
  name: AccountSyncMetricName;
  category:
    | "traffic"
    | "accepted"
    | "replay"
    | "blocked"
    | "rejected"
    | "conflict"
    | "diagnostic"
    | "performance"
    | "safety";
  routeIds: readonly VlxAccountSyncRouteId[];
  description: string;
  requiredBeforeProduction: true;
  ownerScoped: true;
  containsRawPayload: false;
  providerIntegratedInThisPr: false;
  implementationStatus: "design_only";
};

export type AccountSyncAlertPolicy = {
  id: string;
  metricNames: readonly AccountSyncMetricName[];
  severity: AccountSyncIncidentSeverity;
  trigger: string;
  ownerEscalation: {
    primaryOwner: "product_engineering";
    secondaryOwner: "founder_operator";
    escalationRequired: true;
  };
  activatesKillSwitch: boolean;
  requiresIncidentRecord: boolean;
  providerIntegratedInThisPr: false;
  implementationStatus: "design_only";
};

export type AccountSyncKillSwitchPolicy = {
  id: "account_sync_apply_kill_switch_v1";
  requiredBeforeProduction: true;
  emergencyDisableRequiredBeforeApply: true;
  disablesMutatingApply: true;
  canDisableApplyWithoutDisablingApp: true;
  preservesSafeReadOnlyDiagnostics: true;
  readOnlyDiagnosticsPolicy: {
    ownerOnly: true;
    bounded: true;
    redactedSummariesOnly: true;
    rawPayloadAccessAllowed: false;
    crossAccountReadsAllowed: false;
    productionSecretsVisible: false;
    providerTokensVisible: false;
  };
  allowedDisableModes: readonly AccountSyncApplyDisableMode[];
  actualRuntimeSwitchImplemented: false;
  providerIntegratedInThisPr: false;
  implementationStatus: "design_only";
};

export type AccountSyncRollbackPolicy = {
  id: "account_sync_rollback_policy_v1";
  requiredBeforeLimitedApply: true;
  activationPhases: readonly Extract<
    AccountSyncRolloutPhase,
    "limited_apply_enabled" | "production_enabled" | "rollback_required"
  >[];
  firstAction: "activate_apply_kill_switch";
  disablesMutatingApply: true;
  preservesIdempotencyRecords: true;
  preservesAuditSummaries: true;
  deletesProductionUserLearningEvidence: false;
  rollbackDeletesReviewEvents: false;
  rollbackDeletesReviewState: false;
  duplicateReplayAfterRollbackCanAdvanceSrsTwice: false;
  replayUsesStoredIdempotencyOutcome: true;
  rollbackRequiresReplayProcedure: true;
  rollbackRequiresOwnerApproval: true;
  implementationStatus: "design_only";
};

export type AccountSyncRecoveryRunbookStep = {
  order: number;
  id:
    | "activate_kill_switch"
    | "freeze_mutating_apply"
    | "confirm_read_only_diagnostics"
    | "inspect_metrics"
    | "preserve_idempotency_and_audit"
    | "verify_no_learning_evidence_deleted"
    | "replay_idempotency_without_mutation"
    | "classify_privacy_or_entitlement_incident"
    | "document_owner_approval"
    | "prepare_reenablement_review";
  label: string;
  required: true;
  mutatesLearningState: false;
  deletesProductionUserData: false;
};

export type AccountSyncManualQARequirement = {
  id:
    | "preview"
    | "apply"
    | "digest"
    | "audit"
    | "kill_switch"
    | "rollback"
    | "idempotency_replay"
    | "blocked_plans"
    | "fake_mastery"
    | "paid_entitlement_boundary"
    | "privacy_redaction";
  label: string;
  routeIds: readonly VlxAccountSyncRouteId[];
  requiredBeforeProduction: true;
  requiresOwnerOnlyEvidence: boolean;
  requiresNoMutationEvidence: boolean;
  requiresRedactionEvidence: boolean;
};

export type AccountSyncProductionEnablementGate = {
  id:
    | "route_readiness_p0_gates"
    | "auth_ownership_boundary"
    | "durable_idempotency_storage"
    | "schema_payload_limits"
    | "audit_redaction_privacy"
    | "monitoring_alerting"
    | "kill_switch"
    | "rollback_replay"
    | "manual_qa"
    | "owner_approval";
  sourcePr: 58 | 59 | 60 | 61 | 62 | 63;
  label: string;
  status: AccountSyncRolloutGateStatus;
  severity: "P0";
  satisfied: false;
  blocksProductionEnablement: true;
  blocksRealApiRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncOperationalRisk = {
  id: AccountSyncOperationalRiskId;
  severity: AccountSyncIncidentSeverity;
  description: string;
  mitigationGate: AccountSyncProductionEnablementGate["id"];
  blocksProductionEnablement: true;
  incidentPolicyRequired: true;
};

export type AccountSyncRolloutPhasePolicy = {
  phase: AccountSyncRolloutPhase;
  description: string;
  realApiRouteAllowed: boolean;
  mutatingApplyAllowed: boolean;
  productionTrafficAllowed: boolean;
  requiresAllP0GatesSatisfied: boolean;
  shadowModeOnly: boolean;
};

export type AccountSyncRolloutDecision = {
  accountSyncRolloutGateVersion: AccountSyncRolloutGateVersion;
  currentPhase: AccountSyncRolloutPhase;
  decision: "blocked_from_implementation";
  productionEnablementAllowed: false;
  realApiRouteImplementationAllowed: false;
  mutatingApplyAllowed: false;
  readOnlyPreviewAllowedInProduction: false;
  reason: string;
  nextRecommendedPr: {
    number: 64;
    title: "Account sync final implementation readiness review";
    realApiRouteImplementationRecommended: false;
  };
};

export type AccountSyncRolloutGateContract = {
  accountSyncRolloutGateVersion: AccountSyncRolloutGateVersion;
  currentPhase: AccountSyncRolloutPhase;
  phases: readonly AccountSyncRolloutPhasePolicy[];
  productionEnablementGates: readonly AccountSyncProductionEnablementGate[];
  killSwitchPolicy: AccountSyncKillSwitchPolicy;
  monitoringMetrics: readonly AccountSyncMonitoringMetric[];
  alertPolicies: readonly AccountSyncAlertPolicy[];
  rollbackPolicy: AccountSyncRollbackPolicy;
  recoveryRunbook: readonly AccountSyncRecoveryRunbookStep[];
  manualQARequirements: readonly AccountSyncManualQARequirement[];
  operationalRisks: readonly AccountSyncOperationalRisk[];
  finalDecision: AccountSyncRolloutDecision;
  safetyScope: {
    docsContractsTestsOnly: true;
    actualApiRouteFilesAllowed: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    deploymentProviderIntegrationAllowed: false;
    loggingProviderSdkAllowed: false;
    authProviderSdkAllowed: false;
    databaseProviderSdkAllowed: false;
    paymentBillingProviderSdkAllowed: false;
    validationDependencyAllowed: false;
    networkCallsAllowed: false;
    browserStorageAccessAllowed: false;
    environmentReadsAllowed: false;
    webflowChangesAllowed: false;
    cloudflareWorkerChangesAllowed: false;
    vercelSettingsChangesAllowed: false;
    dnsChangesAllowed: false;
    productionDataMutationAllowed: false;
    paidEntitlementGrantAllowed: false;
  };
};

export const ACCOUNT_SYNC_CURRENT_ROLLOUT_PHASE =
  "design_only" as const satisfies AccountSyncRolloutPhase;

export const ACCOUNT_SYNC_ROLLOUT_PHASES = [
  {
    phase: "design_only",
    description:
      "Static docs, contracts, and tests only. No account sync route exists.",
    realApiRouteAllowed: false,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: false,
    shadowModeOnly: false
  },
  {
    phase: "local_contracts",
    description:
      "Local contract fixtures may be extended without route handlers or provider integration.",
    realApiRouteAllowed: false,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: false,
    shadowModeOnly: false
  },
  {
    phase: "mocked_handler_harness",
    description:
      "A non-production harness may exercise route-shaped mocks without real routes.",
    realApiRouteAllowed: false,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: false,
    shadowModeOnly: false
  },
  {
    phase: "internal_preview_only",
    description:
      "Future preview access is internal and read-only after auth, schema, payload, and rate-limit gates are approved.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  },
  {
    phase: "staff_only_apply_disabled",
    description:
      "Future staff-only diagnostics keep mutating apply disabled while digest and audit remain bounded and owner-only.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  },
  {
    phase: "limited_apply_shadow_mode",
    description:
      "Future limited shadow mode verifies apply plans without writing learning state.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: true
  },
  {
    phase: "limited_apply_enabled",
    description:
      "Future limited apply requires kill switch, rollback, replay, monitoring, and owner approval.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: true,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  },
  {
    phase: "production_enabled",
    description:
      "Future production enablement requires every P0 gate and manual QA requirement to be satisfied.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: true,
    productionTrafficAllowed: true,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  },
  {
    phase: "rollback_required",
    description:
      "Mutating apply must be disabled while idempotency records and audit summaries are preserved.",
    realApiRouteAllowed: true,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  },
  {
    phase: "disabled",
    description:
      "Account sync is disabled; read-only diagnostics may remain only if owner-only, bounded, and redacted.",
    realApiRouteAllowed: false,
    mutatingApplyAllowed: false,
    productionTrafficAllowed: false,
    requiresAllP0GatesSatisfied: true,
    shadowModeOnly: false
  }
] as const satisfies readonly AccountSyncRolloutPhasePolicy[];

export const ACCOUNT_SYNC_PRODUCTION_ENABLEMENT_GATES = [
  {
    id: "route_readiness_p0_gates",
    sourcePr: 58,
    label: "All route readiness P0 gates are satisfied.",
    status: "blocked",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Auth, schema, payload, rate-limit, idempotency, audit, privacy, monitoring, and rollback gates must be approved."
  },
  {
    id: "auth_ownership_boundary",
    sourcePr: 59,
    label: "Authenticated owner-only account boundary is approved.",
    status: "requires_owner_approval",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Server-derived account ownership must be verified before preview, apply, digest, or audit access."
  },
  {
    id: "durable_idempotency_storage",
    sourcePr: 60,
    label: "Durable idempotency and transaction-like persistence are approved.",
    status: "requires_separate_pr",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Apply must store request fingerprints and replay original outcomes without duplicating review events."
  },
  {
    id: "schema_payload_limits",
    sourcePr: 61,
    label: "Production schema validation and payload size limits are approved.",
    status: "requires_separate_pr",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Malformed, oversized, billing, paid entitlement, and fake mastery payloads must be rejected before learning writes."
  },
  {
    id: "audit_redaction_privacy",
    sourcePr: 62,
    label: "Audit logging, redaction, retention, digest, and audit visibility policies are approved.",
    status: "requires_owner_approval",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Digest and audit must be bounded, owner-only, redacted, and free of raw payloads, provider tokens, and production secrets."
  },
  {
    id: "monitoring_alerting",
    sourcePr: 63,
    label: "Monitoring metrics and owner escalation alerts are approved.",
    status: "design_only",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Preview, apply, digest, audit, rejection, latency, error-rate, and kill-switch metrics must be integrated in a later PR."
  },
  {
    id: "kill_switch",
    sourcePr: 63,
    label: "Emergency kill switch can disable mutating apply.",
    status: "design_only",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Apply must be disableable independently while safe read-only diagnostics remain owner-only, bounded, and redacted."
  },
  {
    id: "rollback_replay",
    sourcePr: 63,
    label: "Rollback and replay procedures preserve evidence and prevent duplicate SRS advancement.",
    status: "design_only",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Rollback must preserve idempotency records, audit summaries, and production learning evidence."
  },
  {
    id: "manual_qa",
    sourcePr: 63,
    label: "Manual QA covers preview, apply, digest, audit, kill switch, rollback, replay, and privacy boundaries.",
    status: "not_started",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Golden flow notes must prove blocked plans, fake mastery, paid entitlement, billing, and redaction boundaries."
  },
  {
    id: "owner_approval",
    sourcePr: 63,
    label: "Owner approval confirms production rollout and rollback readiness.",
    status: "requires_owner_approval",
    severity: "P0",
    satisfied: false,
    blocksProductionEnablement: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Owner signoff must happen after all P0 gates and manual QA evidence are complete."
  }
] as const satisfies readonly AccountSyncProductionEnablementGate[];

export const ACCOUNT_SYNC_KILL_SWITCH_POLICY = {
  id: "account_sync_apply_kill_switch_v1",
  requiredBeforeProduction: true,
  emergencyDisableRequiredBeforeApply: true,
  disablesMutatingApply: true,
  canDisableApplyWithoutDisablingApp: true,
  preservesSafeReadOnlyDiagnostics: true,
  readOnlyDiagnosticsPolicy: {
    ownerOnly: true,
    bounded: true,
    redactedSummariesOnly: true,
    rawPayloadAccessAllowed: false,
    crossAccountReadsAllowed: false,
    productionSecretsVisible: false,
    providerTokensVisible: false
  },
  allowedDisableModes: [
    "apply_route_not_created",
    "mutating_apply_disabled",
    "shadow_mode_no_mutation",
    "read_only_diagnostics_only",
    "full_account_sync_disabled"
  ],
  actualRuntimeSwitchImplemented: false,
  providerIntegratedInThisPr: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncKillSwitchPolicy;

export const ACCOUNT_SYNC_MONITORING_METRICS = [
  {
    name: "account_sync_preview_requested",
    category: "traffic",
    routeIds: ["preview"],
    description: "Preview route attempts.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_preview_rejected",
    category: "rejected",
    routeIds: ["preview"],
    description: "Preview attempts rejected by schema, payload, ownership, rate-limit, or safety gates.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_requested",
    category: "traffic",
    routeIds: ["apply"],
    description: "Apply route attempts.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_accepted",
    category: "accepted",
    routeIds: ["apply"],
    description: "Apply attempts accepted after all safety gates.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_replayed",
    category: "replay",
    routeIds: ["apply"],
    description: "Same key and same fingerprint returned the original outcome without mutation.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_blocked",
    category: "blocked",
    routeIds: ["apply"],
    description: "Apply plan blocked before learning-state writes.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_rejected",
    category: "rejected",
    routeIds: ["apply"],
    description: "Apply request rejected before learning-state writes.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_apply_conflict",
    category: "conflict",
    routeIds: ["apply"],
    description: "Same idempotency key with a different request fingerprint was rejected.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_schema_rejected",
    category: "rejected",
    routeIds: ["preview", "apply"],
    description: "Malformed or invalid payload rejected before conflict resolution or learning writes.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_payload_too_large",
    category: "rejected",
    routeIds: ["preview", "apply", "digest", "audit"],
    description: "Request, query, collection, or response summary size exceeded the approved ceiling.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_ownership_rejected",
    category: "rejected",
    routeIds: ["preview", "apply", "digest", "audit"],
    description: "Owner-only account access check rejected the request.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_idempotency_conflict",
    category: "conflict",
    routeIds: ["apply"],
    description: "Apply idempotency key reuse failed due to conflicting owner, route, or fingerprint.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_fake_mastery_blocked",
    category: "safety",
    routeIds: ["preview", "apply"],
    description: "Client-supplied mastery claim was blocked from becoming server mastery.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_paid_entitlement_ignored",
    category: "safety",
    routeIds: ["preview", "apply"],
    description: "Upgrade interest was treated as attribution only and no paid entitlement was granted.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_billing_payload_rejected",
    category: "safety",
    routeIds: ["preview", "apply", "digest", "audit"],
    description: "Billing, payment, checkout, subscription, invoice, or billing portal payload was rejected.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_digest_requested",
    category: "diagnostic",
    routeIds: ["digest"],
    description: "Digest route attempts.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_digest_rejected",
    category: "rejected",
    routeIds: ["digest"],
    description: "Digest request rejected by owner-only, bounded-query, privacy, or rate-limit gates.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_audit_requested",
    category: "diagnostic",
    routeIds: ["audit"],
    description: "Audit route attempts.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_audit_rejected",
    category: "rejected",
    routeIds: ["audit"],
    description: "Audit request rejected by owner-only, bounded-query, privacy, or rate-limit gates.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_latency_p95",
    category: "performance",
    routeIds: ["preview", "apply", "digest", "audit"],
    description: "P95 route latency by route and rollout phase.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_error_rate",
    category: "performance",
    routeIds: ["preview", "apply", "digest", "audit"],
    description: "Error rate by route, rollout phase, and rejection category.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    name: "account_sync_kill_switch_active",
    category: "safety",
    routeIds: ["apply"],
    description: "Emergency apply disablement is active.",
    requiredBeforeProduction: true,
    ownerScoped: true,
    containsRawPayload: false,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  }
] as const satisfies readonly AccountSyncMonitoringMetric[];

export const ACCOUNT_SYNC_ALERT_POLICIES = [
  {
    id: "account_sync_integrity_or_privacy_incident",
    metricNames: [
      "account_sync_fake_mastery_blocked",
      "account_sync_billing_payload_rejected",
      "account_sync_ownership_rejected",
      "account_sync_paid_entitlement_ignored"
    ],
    severity: "SEV0",
    trigger:
      "Any accepted mutation, privacy exposure, entitlement mutation, billing mutation, or cross-account access suspicion.",
    ownerEscalation: {
      primaryOwner: "product_engineering",
      secondaryOwner: "founder_operator",
      escalationRequired: true
    },
    activatesKillSwitch: true,
    requiresIncidentRecord: true,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    id: "account_sync_apply_failure_spike",
    metricNames: [
      "account_sync_apply_rejected",
      "account_sync_apply_conflict",
      "account_sync_idempotency_conflict",
      "account_sync_error_rate"
    ],
    severity: "SEV1",
    trigger:
      "Apply rejection, conflict, or error-rate spike above the future approved threshold.",
    ownerEscalation: {
      primaryOwner: "product_engineering",
      secondaryOwner: "founder_operator",
      escalationRequired: true
    },
    activatesKillSwitch: true,
    requiresIncidentRecord: true,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  },
  {
    id: "account_sync_diagnostic_access_failure",
    metricNames: [
      "account_sync_preview_rejected",
      "account_sync_digest_rejected",
      "account_sync_audit_rejected",
      "account_sync_latency_p95"
    ],
    severity: "SEV2",
    trigger:
      "Sustained preview, digest, audit, or latency failures during controlled rollout.",
    ownerEscalation: {
      primaryOwner: "product_engineering",
      secondaryOwner: "founder_operator",
      escalationRequired: true
    },
    activatesKillSwitch: false,
    requiresIncidentRecord: true,
    providerIntegratedInThisPr: false,
    implementationStatus: "design_only"
  }
] as const satisfies readonly AccountSyncAlertPolicy[];

export const ACCOUNT_SYNC_ROLLBACK_POLICY = {
  id: "account_sync_rollback_policy_v1",
  requiredBeforeLimitedApply: true,
  activationPhases: [
    "limited_apply_enabled",
    "production_enabled",
    "rollback_required"
  ],
  firstAction: "activate_apply_kill_switch",
  disablesMutatingApply: true,
  preservesIdempotencyRecords: true,
  preservesAuditSummaries: true,
  deletesProductionUserLearningEvidence: false,
  rollbackDeletesReviewEvents: false,
  rollbackDeletesReviewState: false,
  duplicateReplayAfterRollbackCanAdvanceSrsTwice: false,
  replayUsesStoredIdempotencyOutcome: true,
  rollbackRequiresReplayProcedure: true,
  rollbackRequiresOwnerApproval: true,
  implementationStatus: "design_only"
} as const satisfies AccountSyncRollbackPolicy;

export const ACCOUNT_SYNC_RECOVERY_RUNBOOK = [
  {
    order: 1,
    id: "activate_kill_switch",
    label: "Activate emergency apply disablement.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 2,
    id: "freeze_mutating_apply",
    label: "Confirm mutating apply cannot create or update learning state.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 3,
    id: "confirm_read_only_diagnostics",
    label: "Allow diagnostics only if owner-only, bounded, and redacted.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 4,
    id: "inspect_metrics",
    label: "Classify preview, apply, digest, audit, rejection, latency, and error metrics.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 5,
    id: "preserve_idempotency_and_audit",
    label: "Preserve idempotency records and redacted audit summaries.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 6,
    id: "verify_no_learning_evidence_deleted",
    label: "Verify review events, review state, saved words, daily stats, and pack evidence were not deleted.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 7,
    id: "replay_idempotency_without_mutation",
    label: "Verify replay returns stored outcomes and does not advance SRS twice.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 8,
    id: "classify_privacy_or_entitlement_incident",
    label: "Escalate fake mastery, privacy, paid entitlement, or billing boundary incidents.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 9,
    id: "document_owner_approval",
    label: "Record owner approval before any re-enable attempt.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  },
  {
    order: 10,
    id: "prepare_reenablement_review",
    label: "Prepare a separate readiness review before leaving rollback_required or disabled.",
    required: true,
    mutatesLearningState: false,
    deletesProductionUserData: false
  }
] as const satisfies readonly AccountSyncRecoveryRunbookStep[];

export const ACCOUNT_SYNC_MANUAL_QA_REQUIREMENTS = [
  {
    id: "preview",
    label: "Preview rejects malformed, oversized, cross-account, paid entitlement, billing, and fake mastery inputs without mutation.",
    routeIds: ["preview"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "apply",
    label: "Apply writes only after auth, schema, payload, idempotency, and blocked-plan gates pass.",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: false,
    requiresRedactionEvidence: true
  },
  {
    id: "digest",
    label: "Digest remains owner-only, bounded, redacted, and summary-only.",
    routeIds: ["digest"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "audit",
    label: "Audit returns redacted summaries only and excludes raw guest, server, provider, secret, and billing payloads.",
    routeIds: ["audit"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "kill_switch",
    label: "Kill switch disables mutating apply while safe diagnostics remain bounded and owner-only.",
    routeIds: ["apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "rollback",
    label: "Rollback preserves idempotency records, audit summaries, and production learning evidence.",
    routeIds: ["apply", "audit"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "idempotency_replay",
    label: "Replay after rollback returns stored outcome and cannot advance SRS twice.",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "blocked_plans",
    label: "Blocked apply plans stop before learning-state writes and write only redacted audit summaries.",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "fake_mastery",
    label: "Fake local mastery claims are blocked from becoming server mastery.",
    routeIds: ["preview", "apply"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "paid_entitlement_boundary",
    label: "Paid entitlement, checkout, billing, invoice, and subscription payloads cannot mutate account sync state.",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  },
  {
    id: "privacy_redaction",
    label: "Privacy redaction excludes raw snapshots, raw server payloads, provider tokens, production secrets, and full account state.",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresOwnerOnlyEvidence: true,
    requiresNoMutationEvidence: true,
    requiresRedactionEvidence: true
  }
] as const satisfies readonly AccountSyncManualQARequirement[];

export const ACCOUNT_SYNC_OPERATIONAL_RISKS = [
  {
    id: "learning_state_corruption",
    severity: "SEV0",
    description: "Apply writes could corrupt saved words, review events, review state, daily stats, or pack progress.",
    mitigationGate: "rollback_replay",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "duplicate_replay_advances_srs",
    severity: "SEV0",
    description: "A replay could incorrectly advance SRS state more than once.",
    mitigationGate: "durable_idempotency_storage",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "fake_mastery_claim",
    severity: "SEV0",
    description: "Client-supplied mastery could be accepted as server mastery without delayed recall evidence.",
    mitigationGate: "schema_payload_limits",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "paid_entitlement_or_billing_mutation",
    severity: "SEV0",
    description: "Account sync could accidentally grant paid access or mutate billing-adjacent state.",
    mitigationGate: "schema_payload_limits",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "privacy_payload_exposure",
    severity: "SEV0",
    description: "Digest, audit, or monitoring could expose raw payloads, provider tokens, production secrets, or full account state.",
    mitigationGate: "audit_redaction_privacy",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "cross_account_access",
    severity: "SEV0",
    description: "A user could preview, apply, digest, or audit another account's sync state.",
    mitigationGate: "auth_ownership_boundary",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "monitoring_blind_spot",
    severity: "SEV1",
    description: "Operators could miss failed syncs, rejection spikes, latency regressions, or kill-switch activation.",
    mitigationGate: "monitoring_alerting",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "kill_switch_missing",
    severity: "SEV1",
    description: "Mutating apply could not be disabled quickly during an incident.",
    mitigationGate: "kill_switch",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  },
  {
    id: "rollback_deletes_learning_evidence",
    severity: "SEV0",
    description: "Rollback could delete review evidence needed for memory state reconstruction and audit.",
    mitigationGate: "rollback_replay",
    blocksProductionEnablement: true,
    incidentPolicyRequired: true
  }
] as const satisfies readonly AccountSyncOperationalRisk[];

export const ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION = {
  accountSyncRolloutGateVersion: ACCOUNT_SYNC_ROLLOUT_GATE_VERSION,
  currentPhase: ACCOUNT_SYNC_CURRENT_ROLLOUT_PHASE,
  decision: "blocked_from_implementation",
  productionEnablementAllowed: false,
  realApiRouteImplementationAllowed: false,
  mutatingApplyAllowed: false,
  readOnlyPreviewAllowedInProduction: false,
  reason:
    "Account sync remains design_only until route readiness, auth ownership, durable idempotency, schema payload limits, audit redaction, monitoring, kill switch, rollback, manual QA, and owner approval gates are satisfied.",
  nextRecommendedPr: {
    number: 64,
    title: "Account sync final implementation readiness review",
    realApiRouteImplementationRecommended: false
  }
} as const satisfies AccountSyncRolloutDecision;

export const ACCOUNT_SYNC_ROLLOUT_SAFETY_SCOPE = {
  docsContractsTestsOnly: true,
  actualApiRouteFilesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeIntegrationAllowed: false,
  deploymentProviderIntegrationAllowed: false,
  loggingProviderSdkAllowed: false,
  authProviderSdkAllowed: false,
  databaseProviderSdkAllowed: false,
  paymentBillingProviderSdkAllowed: false,
  validationDependencyAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  environmentReadsAllowed: false,
  webflowChangesAllowed: false,
  cloudflareWorkerChangesAllowed: false,
  vercelSettingsChangesAllowed: false,
  dnsChangesAllowed: false,
  productionDataMutationAllowed: false,
  paidEntitlementGrantAllowed: false
} as const satisfies AccountSyncRolloutGateContract["safetyScope"];

export const ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT = {
  accountSyncRolloutGateVersion: ACCOUNT_SYNC_ROLLOUT_GATE_VERSION,
  currentPhase: ACCOUNT_SYNC_CURRENT_ROLLOUT_PHASE,
  phases: ACCOUNT_SYNC_ROLLOUT_PHASES,
  productionEnablementGates: ACCOUNT_SYNC_PRODUCTION_ENABLEMENT_GATES,
  killSwitchPolicy: ACCOUNT_SYNC_KILL_SWITCH_POLICY,
  monitoringMetrics: ACCOUNT_SYNC_MONITORING_METRICS,
  alertPolicies: ACCOUNT_SYNC_ALERT_POLICIES,
  rollbackPolicy: ACCOUNT_SYNC_ROLLBACK_POLICY,
  recoveryRunbook: ACCOUNT_SYNC_RECOVERY_RUNBOOK,
  manualQARequirements: ACCOUNT_SYNC_MANUAL_QA_REQUIREMENTS,
  operationalRisks: ACCOUNT_SYNC_OPERATIONAL_RISKS,
  finalDecision: ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION,
  safetyScope: ACCOUNT_SYNC_ROLLOUT_SAFETY_SCOPE
} as const satisfies AccountSyncRolloutGateContract;
