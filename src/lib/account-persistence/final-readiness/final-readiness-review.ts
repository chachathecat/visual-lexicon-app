import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_FINAL_READINESS_VERSION = 1 as const;

export type AccountSyncFinalReadinessVersion =
  typeof ACCOUNT_SYNC_FINAL_READINESS_VERSION;

export type AccountSyncPriorReadinessPr = 58 | 59 | 60 | 61 | 62 | 63;

export type AccountSyncReadinessGateId =
  | "route_readiness"
  | "auth_ownership"
  | "durable_idempotency"
  | "persistence_storage"
  | "schema_validation"
  | "payload_size_limits"
  | "audit_logging"
  | "privacy_redaction"
  | "monitoring_alerting"
  | "rollout_rollback"
  | "kill_switch"
  | "manual_qa"
  | "provider_decision"
  | "database_decision"
  | "deployment_decision"
  | "billing_payment_boundary"
  | "paid_entitlement_boundary"
  | "fake_mastery_block"
  | "production_data_safety";

export type AccountSyncReadinessGateStatus =
  | "completed_design_contract"
  | "blocked"
  | "not_started"
  | "outstanding_decision"
  | "outstanding_implementation"
  | "requires_owner_approval";

export type AccountSyncReadinessGateSeverity = "P0" | "P1" | "P2";

export type AccountSyncFinalReadinessVerdict =
  | "no_go_for_real_api_routes"
  | "conditional_go_after_blockers"
  | "go_for_real_api_routes";

export type AccountSyncImplementationPhase =
  | "design_only"
  | "provider_decision"
  | "mock_integration_boundary"
  | "runtime_route_implementation"
  | "limited_shadow"
  | "production_enabled";

export type AccountSyncReadinessGate = {
  id: AccountSyncReadinessGateId;
  label: string;
  sourcePrs: readonly AccountSyncPriorReadinessPr[];
  status: AccountSyncReadinessGateStatus;
  severity: AccountSyncReadinessGateSeverity;
  designContractComplete: boolean;
  implementationComplete: false;
  requiredBeforeRealRoutes: true;
  blocksRealApiRouteImplementation: true;
  evidence: string;
};

export type AccountSyncOutstandingBlockerId =
  | "auth_provider_decision_outstanding"
  | "database_persistence_decision_outstanding"
  | "no_real_route_handlers"
  | "runtime_schema_validation_implementation_outstanding"
  | "production_rate_limiting_implementation_outstanding"
  | "deployment_rollback_mechanism_outstanding"
  | "monitoring_alerting_provider_outstanding"
  | "manual_authenticated_qa_outstanding";

export type AccountSyncOutstandingBlocker = {
  id: AccountSyncOutstandingBlockerId;
  gateId: AccountSyncReadinessGateId;
  severity: "P0";
  title: string;
  status: "open";
  ownerDecisionRequired: boolean;
  separatePrRequired: true;
  requiredBefore: "real_api_route_implementation";
  blocksRealApiRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncSafetyBoundaryId =
  | "no_fake_mastery"
  | "no_paid_entitlement_grants"
  | "no_billing_payment_sync"
  | "no_raw_payload_exposure"
  | "no_cross_account_ownership"
  | "no_duplicate_srs_advancement";

export type AccountSyncSafetyBoundary = {
  id: AccountSyncSafetyBoundaryId;
  label: string;
  sourcePrs: readonly AccountSyncPriorReadinessPr[];
  preserved: true;
  allowsViolation: false;
  requiredBeforeRealRoutes: true;
};

export type AccountSyncRealRouteImplementationPolicy = {
  plannedRouteIds: readonly VlxAccountSyncRouteId[];
  realApiRouteImplementationAllowed: false;
  apiRouteFilesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  runtimeRouteIntegrationAllowed: false;
  authProviderSdkAllowed: false;
  databaseProviderSdkAllowed: false;
  loggingProviderSdkAllowed: false;
  validationDependencyAllowed: false;
  networkCallsAllowed: false;
  browserStorageAccessAllowed: false;
  environmentReadsAllowed: false;
  billingPaymentIntegrationAllowed: false;
  paidEntitlementGrantAllowed: false;
  rawPayloadExposureAllowed: false;
  blockedUntilAllOutstandingBlockersClose: true;
};

export type AccountSyncNextPrOption =
  | "Auth provider final decision and mock integration boundary"
  | "Database persistence provider decision and table design"
  | "Runtime validator selection and dependency decision";

export type AccountSyncNextPrRecommendation = {
  number: 65;
  recommendedOption: AccountSyncNextPrOption;
  options: readonly AccountSyncNextPrOption[];
  realApiRouteImplementationRecommended: false;
  docsContractsTestsOnly: true;
  reason: string;
};

export type AccountSyncImplementationRecommendation = {
  implementationPhase: AccountSyncImplementationPhase;
  verdict: AccountSyncFinalReadinessVerdict;
  recommendation: "do_not_begin_real_api_route_implementation";
  realApiRouteImplementationRecommended: false;
  realApiRouteImplementationBlocked: true;
  nextPr: AccountSyncNextPrRecommendation;
  reason: string;
};

export type AccountSyncFinalReadinessReview = {
  accountSyncFinalReadinessVersion: AccountSyncFinalReadinessVersion;
  purpose: string;
  sourcePrs: readonly AccountSyncPriorReadinessPr[];
  implementationPhase: AccountSyncImplementationPhase;
  finalVerdict: AccountSyncFinalReadinessVerdict;
  gateMatrix: readonly AccountSyncReadinessGate[];
  completedDesignGateIds: readonly AccountSyncReadinessGateId[];
  outstandingBlockers: readonly AccountSyncOutstandingBlocker[];
  realRouteImplementationPolicy: AccountSyncRealRouteImplementationPolicy;
  implementationRecommendation: AccountSyncImplementationRecommendation;
  safetyBoundaries: readonly AccountSyncSafetyBoundary[];
  productionQaPrerequisites: readonly string[];
};

export const ACCOUNT_SYNC_FINAL_READINESS_GATE_IDS = [
  "route_readiness",
  "auth_ownership",
  "durable_idempotency",
  "persistence_storage",
  "schema_validation",
  "payload_size_limits",
  "audit_logging",
  "privacy_redaction",
  "monitoring_alerting",
  "rollout_rollback",
  "kill_switch",
  "manual_qa",
  "provider_decision",
  "database_decision",
  "deployment_decision",
  "billing_payment_boundary",
  "paid_entitlement_boundary",
  "fake_mastery_block",
  "production_data_safety"
] as const satisfies readonly AccountSyncReadinessGateId[];

export const ACCOUNT_SYNC_FINAL_READINESS_VERDICT =
  "no_go_for_real_api_routes" as const satisfies AccountSyncFinalReadinessVerdict;

export const ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE =
  "design_only" as const satisfies AccountSyncImplementationPhase;

export const ACCOUNT_SYNC_FINAL_READINESS_GATE_MATRIX = [
  {
    id: "route_readiness",
    label: "Route readiness No-Go gate",
    sourcePrs: [58],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #58 defined the planned route inventory and the first No-Go gate for real account sync API routes."
  },
  {
    id: "auth_ownership",
    label: "Auth ownership boundary",
    sourcePrs: [59],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #59 defined server-session ownership rules and cross-account rejection, but no real provider is integrated."
  },
  {
    id: "durable_idempotency",
    label: "Durable idempotency contract",
    sourcePrs: [60],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #60 defined account-scoped idempotency and replay safety, but no durable store exists."
  },
  {
    id: "persistence_storage",
    label: "Persistence storage design",
    sourcePrs: [60],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #60 defined storage groups and transaction-like sequencing, but no real database tables or adapter exist."
  },
  {
    id: "schema_validation",
    label: "Schema validation contract",
    sourcePrs: [61],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #61 defined validation requirements, but no runtime validator or dependency has been selected."
  },
  {
    id: "payload_size_limits",
    label: "Payload size limit contract",
    sourcePrs: [61],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #61 defined byte and collection ceilings, but no production enforcement exists."
  },
  {
    id: "audit_logging",
    label: "Audit logging contract",
    sourcePrs: [62],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #62 defined redacted audit summaries, but no logging provider or durable write implementation exists."
  },
  {
    id: "privacy_redaction",
    label: "Privacy redaction policy",
    sourcePrs: [62],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #62 defined raw payload exclusion, owner-only audit, and digest visibility boundaries."
  },
  {
    id: "monitoring_alerting",
    label: "Monitoring and alerting gate",
    sourcePrs: [63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #63 defined metrics and alert policy, but no production monitoring provider is integrated."
  },
  {
    id: "rollout_rollback",
    label: "Rollout and rollback gate",
    sourcePrs: [63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #63 defined rollout phases and rollback expectations, but no real deployment rollback mechanism exists."
  },
  {
    id: "kill_switch",
    label: "Apply kill-switch gate",
    sourcePrs: [63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "PR #63 defined apply disable modes, but no runtime kill switch exists because no real route exists."
  },
  {
    id: "manual_qa",
    label: "Manual authenticated QA",
    sourcePrs: [63],
    status: "not_started",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "Manual QA requirements exist, but no authenticated real-session account sync QA has been executed."
  },
  {
    id: "provider_decision",
    label: "Auth and provider decision",
    sourcePrs: [59],
    status: "outstanding_decision",
    severity: "P0",
    designContractComplete: false,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "No real auth provider or session integration has been selected or implemented for account sync."
  },
  {
    id: "database_decision",
    label: "Database and persistence provider decision",
    sourcePrs: [60],
    status: "outstanding_decision",
    severity: "P0",
    designContractComplete: false,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "No real database provider, table design approval, migration, or persistence adapter exists."
  },
  {
    id: "deployment_decision",
    label: "Deployment and rollback implementation decision",
    sourcePrs: [63],
    status: "outstanding_decision",
    severity: "P0",
    designContractComplete: false,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "No real deployment, rollback, replay, or owner re-enable procedure has been implemented."
  },
  {
    id: "billing_payment_boundary",
    label: "Billing and payment boundary",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "All prior gates keep billing, payment, checkout, subscription, invoice, and billing portal behavior outside sync."
  },
  {
    id: "paid_entitlement_boundary",
    label: "Paid entitlement boundary",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "All prior gates require upgrade interest to stay attribution-only and forbid paid entitlement grants."
  },
  {
    id: "fake_mastery_block",
    label: "Fake mastery block",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    status: "completed_design_contract",
    severity: "P0",
    designContractComplete: true,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "All prior gates require server mastery to come only from delayed review-event evidence."
  },
  {
    id: "production_data_safety",
    label: "Production data safety",
    sourcePrs: [58, 62, 63],
    status: "requires_owner_approval",
    severity: "P0",
    designContractComplete: false,
    implementationComplete: false,
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidence:
      "No owner-approved production data access, retention, monitoring, rollback, or manual QA evidence exists."
  }
] as const satisfies readonly AccountSyncReadinessGate[];

export const ACCOUNT_SYNC_FINAL_COMPLETED_DESIGN_GATE_IDS = [
  "route_readiness",
  "auth_ownership",
  "durable_idempotency",
  "persistence_storage",
  "schema_validation",
  "payload_size_limits",
  "audit_logging",
  "privacy_redaction",
  "monitoring_alerting",
  "rollout_rollback",
  "kill_switch",
  "manual_qa",
  "billing_payment_boundary",
  "paid_entitlement_boundary",
  "fake_mastery_block"
] as const satisfies readonly AccountSyncReadinessGateId[];

export const ACCOUNT_SYNC_FINAL_OUTSTANDING_BLOCKERS = [
  {
    id: "auth_provider_decision_outstanding",
    gateId: "provider_decision",
    severity: "P0",
    title: "No real auth provider integration has been selected or implemented.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Owner-approved auth provider, server-session boundary, and mock integration boundary."
  },
  {
    id: "database_persistence_decision_outstanding",
    gateId: "database_decision",
    severity: "P0",
    title: "No real database or persistence implementation has been selected or implemented.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Owner-approved database provider, table design, transaction plan, and adapter boundary."
  },
  {
    id: "no_real_route_handlers",
    gateId: "route_readiness",
    severity: "P0",
    title: "No real account sync route handlers exist.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Real route handler work must wait until provider, database, runtime validation, rate limit, monitoring, rollback, and QA blockers are closed."
  },
  {
    id: "runtime_schema_validation_implementation_outstanding",
    gateId: "schema_validation",
    severity: "P0",
    title: "No runtime schema validation implementation exists.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Validator selection, dependency approval, payload parsing, and rejection behavior."
  },
  {
    id: "production_rate_limiting_implementation_outstanding",
    gateId: "route_readiness",
    severity: "P0",
    title: "No production rate limiting exists for account sync routes.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Per-account and per-session abuse limits for preview, apply, digest, and audit."
  },
  {
    id: "deployment_rollback_mechanism_outstanding",
    gateId: "deployment_decision",
    severity: "P0",
    title: "No real deployment or rollback mechanism exists for account sync routes.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Owner-approved rollout, rollback, replay, and re-enable procedure with apply disablement."
  },
  {
    id: "monitoring_alerting_provider_outstanding",
    gateId: "monitoring_alerting",
    severity: "P0",
    title: "No production monitoring provider is integrated for account sync.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Provider decision, metric implementation, alert thresholds, and owner escalation path."
  },
  {
    id: "manual_authenticated_qa_outstanding",
    gateId: "manual_qa",
    severity: "P0",
    title: "No manual QA with authenticated real sessions has been executed.",
    status: "open",
    ownerDecisionRequired: true,
    separatePrRequired: true,
    requiredBefore: "real_api_route_implementation",
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Authenticated preview, apply, digest, audit, rollback, kill-switch, idempotency replay, and privacy QA notes."
  }
] as const satisfies readonly AccountSyncOutstandingBlocker[];

export const ACCOUNT_SYNC_FINAL_SAFETY_BOUNDARIES = [
  {
    id: "no_fake_mastery",
    label: "Fake local mastery cannot become server mastery.",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "no_paid_entitlement_grants",
    label: "Account sync cannot grant paid entitlement.",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "no_billing_payment_sync",
    label: "Billing, payment, checkout, subscription, invoice, and billing portal behavior stay outside sync.",
    sourcePrs: [58, 59, 60, 61, 62, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "no_raw_payload_exposure",
    label: "Digest, audit, metrics, and alerts cannot expose raw payloads or full account state.",
    sourcePrs: [58, 61, 62, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "no_cross_account_ownership",
    label: "Client-provided account ids are not ownership proof and cross-account access is rejected.",
    sourcePrs: [59, 62, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  },
  {
    id: "no_duplicate_srs_advancement",
    label: "Replay and duplicate review events cannot advance SRS twice.",
    sourcePrs: [58, 60, 63],
    preserved: true,
    allowsViolation: false,
    requiredBeforeRealRoutes: true
  }
] as const satisfies readonly AccountSyncSafetyBoundary[];

export const ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY = {
  plannedRouteIds: ["preview", "apply", "digest", "audit"],
  realApiRouteImplementationAllowed: false,
  apiRouteFilesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeRouteIntegrationAllowed: false,
  authProviderSdkAllowed: false,
  databaseProviderSdkAllowed: false,
  loggingProviderSdkAllowed: false,
  validationDependencyAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  environmentReadsAllowed: false,
  billingPaymentIntegrationAllowed: false,
  paidEntitlementGrantAllowed: false,
  rawPayloadExposureAllowed: false,
  blockedUntilAllOutstandingBlockersClose: true
} as const satisfies AccountSyncRealRouteImplementationPolicy;

export const ACCOUNT_SYNC_FINAL_NEXT_PR_RECOMMENDATION = {
  number: 65,
  recommendedOption: "Auth provider final decision and mock integration boundary",
  options: [
    "Auth provider final decision and mock integration boundary",
    "Database persistence provider decision and table design",
    "Runtime validator selection and dependency decision"
  ],
  realApiRouteImplementationRecommended: false,
  docsContractsTestsOnly: true,
  reason:
    "The next PR should close a provider, database, or runtime-validator decision before any real route handler work begins."
} as const satisfies AccountSyncNextPrRecommendation;

export const ACCOUNT_SYNC_FINAL_IMPLEMENTATION_RECOMMENDATION = {
  implementationPhase: ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE,
  verdict: ACCOUNT_SYNC_FINAL_READINESS_VERDICT,
  recommendation: "do_not_begin_real_api_route_implementation",
  realApiRouteImplementationRecommended: false,
  realApiRouteImplementationBlocked: true,
  nextPr: ACCOUNT_SYNC_FINAL_NEXT_PR_RECOMMENDATION,
  reason:
    "Design contracts from #58-#63 are consolidated, but provider, database, runtime validation, rate limit, monitoring, deployment, and manual authenticated QA blockers remain open."
} as const satisfies AccountSyncImplementationRecommendation;

export const ACCOUNT_SYNC_PRODUCTION_QA_PREREQUISITES = [
  "Authenticated preview rejects malformed, oversized, cross-account, paid entitlement, billing, and fake mastery inputs without mutation.",
  "Authenticated apply writes only after auth ownership, schema, payload, idempotency, and blocked-plan gates pass.",
  "Digest and audit remain owner-only, bounded, redacted, and summary-only.",
  "Kill switch disables mutating apply while safe diagnostics remain bounded and owner-only.",
  "Rollback preserves idempotency records, audit summaries, review events, review state, saved words, daily stats, and pack evidence.",
  "Idempotency replay returns stored outcomes and cannot advance SRS twice.",
  "Monitoring and alerting cover preview, apply, digest, audit, rejection categories, latency, error rate, and kill-switch activation."
] as const satisfies readonly string[];

export const ACCOUNT_SYNC_FINAL_READINESS_REVIEW = {
  accountSyncFinalReadinessVersion: ACCOUNT_SYNC_FINAL_READINESS_VERSION,
  purpose:
    "Consolidate account sync implementation readiness gates from #58 through #63 and decide whether real API route implementation may begin.",
  sourcePrs: [58, 59, 60, 61, 62, 63],
  implementationPhase: ACCOUNT_SYNC_FINAL_IMPLEMENTATION_PHASE,
  finalVerdict: ACCOUNT_SYNC_FINAL_READINESS_VERDICT,
  gateMatrix: ACCOUNT_SYNC_FINAL_READINESS_GATE_MATRIX,
  completedDesignGateIds: ACCOUNT_SYNC_FINAL_COMPLETED_DESIGN_GATE_IDS,
  outstandingBlockers: ACCOUNT_SYNC_FINAL_OUTSTANDING_BLOCKERS,
  realRouteImplementationPolicy: ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY,
  implementationRecommendation: ACCOUNT_SYNC_FINAL_IMPLEMENTATION_RECOMMENDATION,
  safetyBoundaries: ACCOUNT_SYNC_FINAL_SAFETY_BOUNDARIES,
  productionQaPrerequisites: ACCOUNT_SYNC_PRODUCTION_QA_PREREQUISITES
} as const satisfies AccountSyncFinalReadinessReview;

export function getAccountSyncFinalReadinessGate(
  gateId: AccountSyncReadinessGateId
) {
  return ACCOUNT_SYNC_FINAL_READINESS_GATE_MATRIX.find(
    (gate) => gate.id === gateId
  );
}

export function getAccountSyncOutstandingBlocker(
  blockerId: AccountSyncOutstandingBlockerId
) {
  return ACCOUNT_SYNC_FINAL_OUTSTANDING_BLOCKERS.find(
    (blocker) => blocker.id === blockerId
  );
}
