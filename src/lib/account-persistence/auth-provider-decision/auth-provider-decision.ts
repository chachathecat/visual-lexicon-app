import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_VERSION = 1 as const;

export type AccountSyncAuthProviderDecisionVersion =
  typeof ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_VERSION;

export type AccountSyncAuthProviderKind =
  | "existing_account_session_boundary"
  | "clerk"
  | "authjs"
  | "supabase_auth"
  | "firebase_auth"
  | "custom_backend_session"
  | "unsupported_provider";

export type AccountSyncAuthProviderDecisionStatus =
  | "selected"
  | "compatible_candidate"
  | "deferred"
  | "rejected_for_now"
  | "design_only_not_implementation_ready";

export type AccountSyncSelectedAuthStrategy =
  | "existing_account_session_boundary_first"
  | "provider_neutral_adapter_boundary"
  | "no_provider_sdk_in_sync_core";

export type AccountSyncAccountStatus =
  | "active"
  | "missing"
  | "deleted"
  | "blocked";

export type AccountSyncAuthAssuranceLevel =
  | "none"
  | "server_session"
  | "recent_server_session"
  | "step_up_required";

export type AccountSyncOwnershipSource =
  | "authenticated_server_session"
  | "none";

export type AccountSyncReadonlyPlanContext = {
  planState: "unknown" | "free" | "paid";
  source: "existing_account_session" | "provider_claim" | "none";
  readonly: true;
  canGrantPaidEntitlement: false;
  billingPaymentOutsideSync: true;
};

export type AccountSyncNormalizedAuthPrincipal = {
  accountSyncAuthProviderDecisionVersion: AccountSyncAuthProviderDecisionVersion;
  authenticatedAccountId: string;
  providerKind: AccountSyncAuthProviderKind;
  providerSubject: string;
  providerSubjectAmbiguous: boolean;
  sessionId: string;
  sessionIssuedAt: string;
  sessionExpiresAt: string;
  sessionRevoked: boolean;
  accountStatus: AccountSyncAccountStatus;
  emailVerified: boolean;
  assuranceLevel: AccountSyncAuthAssuranceLevel;
  planContextReadonly: AccountSyncReadonlyPlanContext;
  ownershipSource: AccountSyncOwnershipSource;
  derivedFromAuthenticatedServerSession: boolean;
  clientProvidedAccountIdTrustedAsOwnershipProof: false;
};

export type AccountSyncRejectedAuthState =
  | "anonymous"
  | "missing"
  | "expired"
  | "revoked"
  | "ambiguous"
  | "unsupported"
  | "deleted"
  | "blocked";

export type AccountSyncRouteAuthRequirement = {
  routeId: VlxAccountSyncRouteId;
  requiredPrincipal: "normalized_authenticated_server_principal";
  ownerOnly: true;
  requiresServerDerivedOwner: true;
  rejectsClientProvidedAccountIdAsOwnershipProof: true;
  rejectsCrossAccountTarget: true;
  requiresImmediateRevalidationBeforeMutation: boolean;
  requiresOwnerOnlyBoundedRead: boolean;
  authFailureBehavior: "reject_before_account_sync_core";
  canGrantPaidEntitlement: false;
  billingPaymentOutsideSync: true;
  reviewEventsRemainSrsSourceOfTruth: true;
  fakeMasteryAllowed: false;
};

export type AccountSyncAuthProviderCandidate = {
  kind: Exclude<AccountSyncAuthProviderKind, "unsupported_provider">;
  label: string;
  decisionStatus: AccountSyncAuthProviderDecisionStatus;
  selectedStrategy: readonly AccountSyncSelectedAuthStrategy[];
  reusesExistingAppSessionBoundary: boolean;
  providerNeutralAdapterRequired: true;
  accountSyncCoreCanImportProviderSdk: false;
  canBeIntroducedInThisPr: false;
  notes: string;
};

export type AccountSyncServerSessionBoundary = {
  id: "account_sync_server_session_boundary_v1";
  selectedProviderKind: "existing_account_session_boundary";
  ownerIdentitySource: "authenticated_server_session";
  normalizedPrincipalOutput: "account_sync_normalized_auth_principal";
  clientProvidedAccountIdOwnershipProofAllowed: false;
  rejectedAuthStates: readonly AccountSyncRejectedAuthState[];
  applyRevalidatesImmediatelyBeforeMutation: true;
  digestAuditOwnerOnlyAndBounded: true;
  planContextReadonlyOnly: true;
  canGrantPaidEntitlement: false;
  billingPaymentOutsideSync: true;
  providerSdkImportedInThisPr: false;
  implementsRealAuthInThisPr: false;
};

export type AccountSyncAuthAdapterBoundary = {
  id: "account_sync_auth_adapter_boundary_v1";
  input: "provider_specific_server_session";
  output: "account_sync_normalized_auth_principal";
  providerSpecificCodeAllowedAtAdapterEdge: true;
  providerSpecificCodeAllowedInSyncCore: false;
  accountSyncCoreProviderNeutral: true;
  providerSdkImportedInThisPr: false;
  routeHandlerCreatedInThisPr: false;
  middlewareCreatedInThisPr: false;
  databasePersistenceCreatedInThisPr: false;
  networkCallsAllowedInThisPr: false;
  browserStorageAccessAllowedInThisPr: false;
  environmentReadsAllowedInThisPr: false;
  rejectsBeforeLoadingSyncState: true;
};

export type AccountSyncAuthProviderRisk = {
  id:
    | "provider_sdk_leaks_into_sync_core"
    | "client_account_id_trusted_as_owner"
    | "cross_account_access"
    | "expired_or_revoked_session_accepted"
    | "plan_metadata_grants_entitlement"
    | "billing_payment_boundary_crossed"
    | "fake_mastery_accepted"
    | "raw_provider_payload_retained";
  severity: "P0";
  mitigation: string;
  blocksRealRoutes: true;
};

export type AccountSyncAuthProviderNonGoal = {
  id:
    | "real_auth_implementation"
    | "provider_sdk_imports"
    | "api_routes_or_handlers"
    | "middleware"
    | "database_persistence"
    | "validation_dependencies"
    | "logging_or_observability_sdks"
    | "billing_payment_or_checkout"
    | "paid_entitlement_grants"
    | "production_configuration_or_data";
  description: string;
};

export type AccountSyncAuthProviderImplementationGate = {
  id:
    | "existing_session_boundary_confirmed"
    | "auth_adapter_implemented_in_separate_pr"
    | "provider_sdk_contained_outside_sync_core"
    | "server_session_revalidation"
    | "database_provider_decision"
    | "runtime_validation_decision"
    | "manual_authenticated_qa";
  status: "blocked" | "requires_separate_pr" | "requires_owner_approval";
  requiredBeforeRealRoutes: true;
  blocksRealApiRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncAuthProviderManualQARequirement = {
  id:
    | "preview_owner_session"
    | "apply_revalidation"
    | "digest_owner_only_bounded"
    | "audit_owner_only_redacted"
    | "cross_account_rejection"
    | "rejected_auth_states"
    | "plan_context_readonly"
    | "fake_mastery_block";
  routeIds: readonly VlxAccountSyncRouteId[];
  requiredBeforeProduction: true;
  requiresAuthenticatedRealSession: true;
  requiresNoMutationEvidence: boolean;
  requiresOwnerOnlyEvidence: true;
};

export type AccountSyncAuthProviderNextStep = {
  prNumber: 66;
  title: "Database persistence provider decision and table design";
  docsContractsTestsOnly: true;
  realApiRouteImplementationRecommended: false;
};

export type AccountSyncAuthProviderDecisionFailureReason =
  | AccountSyncRejectedAuthState
  | "client_account_id_not_trusted"
  | "cross_account_target"
  | "mutation_revalidation_required"
  | "owner_only_bounded_access_required"
  | "paid_entitlement_outside_sync"
  | "billing_payment_outside_sync"
  | "fake_mastery_not_accepted";

export type AccountSyncAuthProviderAccessDecision = {
  ok: boolean;
  status: "accepted" | "rejected";
  routeId: VlxAccountSyncRouteId;
  authenticatedAccountId?: string;
  targetAccountId?: string;
  clientProvidedAccountId?: string;
  failureReasons: readonly AccountSyncAuthProviderDecisionFailureReason[];
  ownerDerivedFromAuthenticatedServerSession: boolean;
  clientProvidedAccountIdTrustedAsOwnershipProof: false;
  requiresImmediateRevalidationBeforeMutation: boolean;
  digestAuditAccessOwnerOnlyAndBounded: boolean;
  planContextReadonly: boolean;
  grantsPaidEntitlement: false;
  billingPaymentOutsideSync: true;
  acceptsFakeMastery: false;
  reviewEventsRemainSourceOfTruth: true;
  designOnly: true;
  implementsRealAuth: false;
};

export type AccountSyncAuthProviderDecisionRecord = {
  accountSyncAuthProviderDecisionVersion: AccountSyncAuthProviderDecisionVersion;
  decisionStatus: "design_only_not_implementation_ready";
  selectedProviderKind: "existing_account_session_boundary";
  selectedStrategies: readonly AccountSyncSelectedAuthStrategy[];
  finalVerdict: "design_only";
  implementationReady: false;
  accountSyncCoreProviderNeutral: true;
  providerSdkImportedInThisPr: false;
  candidates: readonly AccountSyncAuthProviderCandidate[];
  serverSessionBoundary: AccountSyncServerSessionBoundary;
  adapterBoundary: AccountSyncAuthAdapterBoundary;
  routeAuthRequirements: readonly AccountSyncRouteAuthRequirement[];
  risks: readonly AccountSyncAuthProviderRisk[];
  nonGoals: readonly AccountSyncAuthProviderNonGoal[];
  implementationGates: readonly AccountSyncAuthProviderImplementationGate[];
  manualQARequirements: readonly AccountSyncAuthProviderManualQARequirement[];
  nextStep: AccountSyncAuthProviderNextStep;
  safetyScope: {
    docsContractsTestsOnly: true;
    realAuthAllowed: false;
    apiRoutesAllowed: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    providerSdkAllowed: false;
    databasePersistenceAllowed: false;
    validationDependencyAllowed: false;
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

export const ACCOUNT_SYNC_SELECTED_AUTH_STRATEGIES = [
  "existing_account_session_boundary_first",
  "provider_neutral_adapter_boundary",
  "no_provider_sdk_in_sync_core"
] as const satisfies readonly AccountSyncSelectedAuthStrategy[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES = [
  {
    kind: "existing_account_session_boundary",
    label: "Existing app/account session boundary",
    decisionStatus: "selected",
    selectedStrategy: ACCOUNT_SYNC_SELECTED_AUTH_STRATEGIES,
    reusesExistingAppSessionBoundary: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Preferred first because account sync should reuse the app session owner boundary before considering a new provider."
  },
  {
    kind: "clerk",
    label: "Clerk",
    decisionStatus: "compatible_candidate",
    selectedStrategy: ["provider_neutral_adapter_boundary"],
    reusesExistingAppSessionBoundary: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. Provider-specific session data would be adapted before reaching sync core."
  },
  {
    kind: "authjs",
    label: "Auth.js",
    decisionStatus: "compatible_candidate",
    selectedStrategy: ["provider_neutral_adapter_boundary"],
    reusesExistingAppSessionBoundary: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. Account sync core remains independent of provider session details."
  },
  {
    kind: "supabase_auth",
    label: "Supabase Auth",
    decisionStatus: "compatible_candidate",
    selectedStrategy: ["provider_neutral_adapter_boundary"],
    reusesExistingAppSessionBoundary: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. Database and auth choices remain separate decisions."
  },
  {
    kind: "firebase_auth",
    label: "Firebase Auth",
    decisionStatus: "compatible_candidate",
    selectedStrategy: ["provider_neutral_adapter_boundary"],
    reusesExistingAppSessionBoundary: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. Provider claims must normalize to the same server principal shape."
  },
  {
    kind: "custom_backend_session",
    label: "Custom backend session",
    decisionStatus: "deferred",
    selectedStrategy: ["provider_neutral_adapter_boundary"],
    reusesExistingAppSessionBoundary: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Deferred until the existing account session boundary is confirmed and database ownership design is approved."
  }
] as const satisfies readonly AccountSyncAuthProviderCandidate[];

export const ACCOUNT_SYNC_REJECTED_AUTH_STATES = [
  "anonymous",
  "missing",
  "expired",
  "revoked",
  "ambiguous",
  "unsupported",
  "deleted",
  "blocked"
] as const satisfies readonly AccountSyncRejectedAuthState[];

export const ACCOUNT_SYNC_SERVER_SESSION_BOUNDARY = {
  id: "account_sync_server_session_boundary_v1",
  selectedProviderKind: "existing_account_session_boundary",
  ownerIdentitySource: "authenticated_server_session",
  normalizedPrincipalOutput: "account_sync_normalized_auth_principal",
  clientProvidedAccountIdOwnershipProofAllowed: false,
  rejectedAuthStates: ACCOUNT_SYNC_REJECTED_AUTH_STATES,
  applyRevalidatesImmediatelyBeforeMutation: true,
  digestAuditOwnerOnlyAndBounded: true,
  planContextReadonlyOnly: true,
  canGrantPaidEntitlement: false,
  billingPaymentOutsideSync: true,
  providerSdkImportedInThisPr: false,
  implementsRealAuthInThisPr: false
} as const satisfies AccountSyncServerSessionBoundary;

export const ACCOUNT_SYNC_AUTH_ADAPTER_BOUNDARY = {
  id: "account_sync_auth_adapter_boundary_v1",
  input: "provider_specific_server_session",
  output: "account_sync_normalized_auth_principal",
  providerSpecificCodeAllowedAtAdapterEdge: true,
  providerSpecificCodeAllowedInSyncCore: false,
  accountSyncCoreProviderNeutral: true,
  providerSdkImportedInThisPr: false,
  routeHandlerCreatedInThisPr: false,
  middlewareCreatedInThisPr: false,
  databasePersistenceCreatedInThisPr: false,
  networkCallsAllowedInThisPr: false,
  browserStorageAccessAllowedInThisPr: false,
  environmentReadsAllowedInThisPr: false,
  rejectsBeforeLoadingSyncState: true
} as const satisfies AccountSyncAuthAdapterBoundary;

export const ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS = [
  {
    routeId: "preview",
    requiredPrincipal: "normalized_authenticated_server_principal",
    ownerOnly: true,
    requiresServerDerivedOwner: true,
    rejectsClientProvidedAccountIdAsOwnershipProof: true,
    rejectsCrossAccountTarget: true,
    requiresImmediateRevalidationBeforeMutation: false,
    requiresOwnerOnlyBoundedRead: false,
    authFailureBehavior: "reject_before_account_sync_core",
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    reviewEventsRemainSrsSourceOfTruth: true,
    fakeMasteryAllowed: false
  },
  {
    routeId: "apply",
    requiredPrincipal: "normalized_authenticated_server_principal",
    ownerOnly: true,
    requiresServerDerivedOwner: true,
    rejectsClientProvidedAccountIdAsOwnershipProof: true,
    rejectsCrossAccountTarget: true,
    requiresImmediateRevalidationBeforeMutation: true,
    requiresOwnerOnlyBoundedRead: false,
    authFailureBehavior: "reject_before_account_sync_core",
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    reviewEventsRemainSrsSourceOfTruth: true,
    fakeMasteryAllowed: false
  },
  {
    routeId: "digest",
    requiredPrincipal: "normalized_authenticated_server_principal",
    ownerOnly: true,
    requiresServerDerivedOwner: true,
    rejectsClientProvidedAccountIdAsOwnershipProof: true,
    rejectsCrossAccountTarget: true,
    requiresImmediateRevalidationBeforeMutation: false,
    requiresOwnerOnlyBoundedRead: true,
    authFailureBehavior: "reject_before_account_sync_core",
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    reviewEventsRemainSrsSourceOfTruth: true,
    fakeMasteryAllowed: false
  },
  {
    routeId: "audit",
    requiredPrincipal: "normalized_authenticated_server_principal",
    ownerOnly: true,
    requiresServerDerivedOwner: true,
    rejectsClientProvidedAccountIdAsOwnershipProof: true,
    rejectsCrossAccountTarget: true,
    requiresImmediateRevalidationBeforeMutation: false,
    requiresOwnerOnlyBoundedRead: true,
    authFailureBehavior: "reject_before_account_sync_core",
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    reviewEventsRemainSrsSourceOfTruth: true,
    fakeMasteryAllowed: false
  }
] as const satisfies readonly AccountSyncRouteAuthRequirement[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_RISKS = [
  {
    id: "provider_sdk_leaks_into_sync_core",
    severity: "P0",
    mitigation:
      "Keep provider-specific session reads in a future adapter and pass only the normalized principal to sync core.",
    blocksRealRoutes: true
  },
  {
    id: "client_account_id_trusted_as_owner",
    severity: "P0",
    mitigation:
      "Derive ownership only from authenticated server session identity and treat request account ids as untrusted hints.",
    blocksRealRoutes: true
  },
  {
    id: "cross_account_access",
    severity: "P0",
    mitigation:
      "Reject any target account that does not match the normalized authenticated account id.",
    blocksRealRoutes: true
  },
  {
    id: "expired_or_revoked_session_accepted",
    severity: "P0",
    mitigation:
      "Reject missing, expired, revoked, ambiguous, unsupported, anonymous, deleted, and blocked states before sync state loads.",
    blocksRealRoutes: true
  },
  {
    id: "plan_metadata_grants_entitlement",
    severity: "P0",
    mitigation:
      "Treat plan data as read-only context and keep entitlement mutations outside account sync.",
    blocksRealRoutes: true
  },
  {
    id: "billing_payment_boundary_crossed",
    severity: "P0",
    mitigation:
      "Reject billing, payment, checkout, invoice, subscription, and billing portal data at the sync boundary.",
    blocksRealRoutes: true
  },
  {
    id: "fake_mastery_accepted",
    severity: "P0",
    mitigation:
      "Keep review events and delayed recall evidence as the only source of server mastery.",
    blocksRealRoutes: true
  },
  {
    id: "raw_provider_payload_retained",
    severity: "P0",
    mitigation:
      "Normalize the future provider session into bounded fields and discard raw provider payloads before sync core.",
    blocksRealRoutes: true
  }
] as const satisfies readonly AccountSyncAuthProviderRisk[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_NON_GOALS = [
  {
    id: "real_auth_implementation",
    description: "No real authentication implementation is added."
  },
  {
    id: "provider_sdk_imports",
    description: "No auth provider package is imported."
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
    id: "database_persistence",
    description: "No database persistence or migration is added."
  },
  {
    id: "validation_dependencies",
    description: "No validation dependency is added."
  },
  {
    id: "logging_or_observability_sdks",
    description: "No logging or observability provider package is imported."
  },
  {
    id: "billing_payment_or_checkout",
    description: "No billing, payment, checkout, invoice, or subscription behavior is added."
  },
  {
    id: "paid_entitlement_grants",
    description: "No paid entitlement can be granted by account sync."
  },
  {
    id: "production_configuration_or_data",
    description: "No production configuration or production user data is changed."
  }
] as const satisfies readonly AccountSyncAuthProviderNonGoal[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_IMPLEMENTATION_GATES = [
  {
    id: "existing_session_boundary_confirmed",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Confirm the existing app/account session boundary can expose a stable server-derived account owner."
  },
  {
    id: "auth_adapter_implemented_in_separate_pr",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Implement the adapter only after owner approval and keep sync core provider-neutral."
  },
  {
    id: "provider_sdk_contained_outside_sync_core",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Prove provider-specific code cannot leak into account sync core modules."
  },
  {
    id: "server_session_revalidation",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Apply must revalidate owner identity immediately before mutation."
  },
  {
    id: "database_provider_decision",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Select database persistence and table design before real sync state loads."
  },
  {
    id: "runtime_validation_decision",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Select runtime validation and payload parsing before route implementation."
  },
  {
    id: "manual_authenticated_qa",
    status: "blocked",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Run authenticated manual QA with safe test accounts after provider and persistence boundaries exist."
  }
] as const satisfies readonly AccountSyncAuthProviderImplementationGate[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_MANUAL_QA_REQUIREMENTS = [
  {
    id: "preview_owner_session",
    routeIds: ["preview"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "apply_revalidation",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: false,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "digest_owner_only_bounded",
    routeIds: ["digest"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "audit_owner_only_redacted",
    routeIds: ["audit"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "cross_account_rejection",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "rejected_auth_states",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "plan_context_readonly",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "fake_mastery_block",
    routeIds: ["preview", "apply"],
    requiredBeforeProduction: true,
    requiresAuthenticatedRealSession: true,
    requiresNoMutationEvidence: true,
    requiresOwnerOnlyEvidence: true
  }
] as const satisfies readonly AccountSyncAuthProviderManualQARequirement[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_NEXT_STEP = {
  prNumber: 66,
  title: "Database persistence provider decision and table design",
  docsContractsTestsOnly: true,
  realApiRouteImplementationRecommended: false
} as const satisfies AccountSyncAuthProviderNextStep;

export const ACCOUNT_SYNC_AUTH_PROVIDER_SAFETY_SCOPE = {
  docsContractsTestsOnly: true,
  realAuthAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeIntegrationAllowed: false,
  providerSdkAllowed: false,
  databasePersistenceAllowed: false,
  validationDependencyAllowed: false,
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
} as const satisfies AccountSyncAuthProviderDecisionRecord["safetyScope"];

export const ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD = {
  accountSyncAuthProviderDecisionVersion:
    ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_VERSION,
  decisionStatus: "design_only_not_implementation_ready",
  selectedProviderKind: "existing_account_session_boundary",
  selectedStrategies: ACCOUNT_SYNC_SELECTED_AUTH_STRATEGIES,
  finalVerdict: "design_only",
  implementationReady: false,
  accountSyncCoreProviderNeutral: true,
  providerSdkImportedInThisPr: false,
  candidates: ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES,
  serverSessionBoundary: ACCOUNT_SYNC_SERVER_SESSION_BOUNDARY,
  adapterBoundary: ACCOUNT_SYNC_AUTH_ADAPTER_BOUNDARY,
  routeAuthRequirements: ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS,
  risks: ACCOUNT_SYNC_AUTH_PROVIDER_RISKS,
  nonGoals: ACCOUNT_SYNC_AUTH_PROVIDER_NON_GOALS,
  implementationGates: ACCOUNT_SYNC_AUTH_PROVIDER_IMPLEMENTATION_GATES,
  manualQARequirements: ACCOUNT_SYNC_AUTH_PROVIDER_MANUAL_QA_REQUIREMENTS,
  nextStep: ACCOUNT_SYNC_AUTH_PROVIDER_NEXT_STEP,
  safetyScope: ACCOUNT_SYNC_AUTH_PROVIDER_SAFETY_SCOPE
} as const satisfies AccountSyncAuthProviderDecisionRecord;

export function getAccountSyncAuthProviderCandidate(
  providerKind: AccountSyncAuthProviderKind
) {
  return ACCOUNT_SYNC_AUTH_PROVIDER_CANDIDATES.find(
    (candidate) => candidate.kind === providerKind
  );
}

export function getAccountSyncRouteAuthRequirement(
  routeId: VlxAccountSyncRouteId
) {
  return ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS.find(
    (requirement) => requirement.routeId === routeId
  );
}

function isExpired(sessionExpiresAt: string, nowIso: string) {
  return Date.parse(sessionExpiresAt) <= Date.parse(nowIso);
}

export function decideAccountSyncAuthProviderAccess({
  routeId,
  principal,
  nowIso,
  targetAccountId,
  clientProvidedAccountId,
  revalidatedImmediatelyBeforeMutation,
  boundedOwnerOnlyRead,
  requestIncludesPaidEntitlementGrant = false,
  requestIncludesBillingPaymentState = false,
  requestContainsFakeMasteryWithoutDelayedRecallEvidence = false
}: {
  routeId: VlxAccountSyncRouteId;
  principal?: AccountSyncNormalizedAuthPrincipal;
  nowIso: string;
  targetAccountId?: string;
  clientProvidedAccountId?: string;
  revalidatedImmediatelyBeforeMutation?: boolean;
  boundedOwnerOnlyRead?: boolean;
  requestIncludesPaidEntitlementGrant?: boolean;
  requestIncludesBillingPaymentState?: boolean;
  requestContainsFakeMasteryWithoutDelayedRecallEvidence?: boolean;
}): AccountSyncAuthProviderAccessDecision {
  const requirement = getAccountSyncRouteAuthRequirement(routeId);

  if (!requirement) {
    throw new Error(`Missing account sync auth requirement for route: ${routeId}`);
  }

  const failureReasons: AccountSyncAuthProviderDecisionFailureReason[] = [];

  if (!principal) {
    failureReasons.push(clientProvidedAccountId ? "missing" : "anonymous");
  } else {
    if (!getAccountSyncAuthProviderCandidate(principal.providerKind)) {
      failureReasons.push("unsupported");
    }

    if (
      !principal.authenticatedAccountId ||
      !principal.sessionId ||
      principal.accountStatus === "missing" ||
      principal.ownershipSource !== "authenticated_server_session" ||
      !principal.derivedFromAuthenticatedServerSession
    ) {
      failureReasons.push("missing");
    }

    if (isExpired(principal.sessionExpiresAt, nowIso)) {
      failureReasons.push("expired");
    }

    if (principal.sessionRevoked) {
      failureReasons.push("revoked");
    }

    if (!principal.providerSubject || principal.providerSubjectAmbiguous) {
      failureReasons.push("ambiguous");
    }

    if (principal.accountStatus === "deleted") {
      failureReasons.push("deleted");
    }

    if (principal.accountStatus === "blocked") {
      failureReasons.push("blocked");
    }

    if (
      targetAccountId &&
      String(targetAccountId) !== String(principal.authenticatedAccountId)
    ) {
      failureReasons.push("cross_account_target");
    }
  }

  if (clientProvidedAccountId) {
    failureReasons.push("client_account_id_not_trusted");
  }

  if (
    requirement.requiresImmediateRevalidationBeforeMutation &&
    !revalidatedImmediatelyBeforeMutation
  ) {
    failureReasons.push("mutation_revalidation_required");
  }

  if (requirement.requiresOwnerOnlyBoundedRead && !boundedOwnerOnlyRead) {
    failureReasons.push("owner_only_bounded_access_required");
  }

  if (requestIncludesPaidEntitlementGrant) {
    failureReasons.push("paid_entitlement_outside_sync");
  }

  if (requestIncludesBillingPaymentState) {
    failureReasons.push("billing_payment_outside_sync");
  }

  if (requestContainsFakeMasteryWithoutDelayedRecallEvidence) {
    failureReasons.push("fake_mastery_not_accepted");
  }

  const uniqueFailureReasons = Array.from(new Set(failureReasons));
  const ok = uniqueFailureReasons.length === 0;

  return {
    ok,
    status: ok ? "accepted" : "rejected",
    routeId,
    authenticatedAccountId: principal?.authenticatedAccountId,
    targetAccountId,
    clientProvidedAccountId,
    failureReasons: uniqueFailureReasons,
    ownerDerivedFromAuthenticatedServerSession:
      principal?.derivedFromAuthenticatedServerSession === true,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    requiresImmediateRevalidationBeforeMutation:
      requirement.requiresImmediateRevalidationBeforeMutation,
    digestAuditAccessOwnerOnlyAndBounded:
      requirement.requiresOwnerOnlyBoundedRead,
    planContextReadonly: principal?.planContextReadonly.readonly === true,
    grantsPaidEntitlement: false,
    billingPaymentOutsideSync: true,
    acceptsFakeMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    designOnly: true,
    implementsRealAuth: false
  };
}
