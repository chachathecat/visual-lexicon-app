import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_VERSION = 1 as const;

export type AccountSyncDbPersistenceDecisionVersion =
  typeof ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_VERSION;

export type AccountSyncDbProviderKind =
  | "existing_account_backend"
  | "postgres_compatible"
  | "supabase_postgres"
  | "neon_postgres"
  | "vercel_postgres"
  | "cloudflare_d1"
  | "firebase_firestore"
  | "custom_backend_storage"
  | "in_memory_mock_only";

export type AccountSyncDbProviderDecisionStatus =
  | "selected_if_available"
  | "preferred_long_term_shape"
  | "compatible_future_candidate"
  | "deferred"
  | "rejected_for_now"
  | "mock_only"
  | "design_only_not_implementation_ready";

export type AccountSyncSelectedDbStrategy =
  | "existing_account_backend_first_if_available"
  | "postgres_compatible_relational_design"
  | "provider_neutral_persistence_adapter"
  | "no_db_provider_sdk_in_sync_core"
  | "no_migrations_in_this_pr";

export type AccountSyncDbProviderCandidate = {
  kind: AccountSyncDbProviderKind;
  label: string;
  decisionStatus: AccountSyncDbProviderDecisionStatus;
  selectedStrategy: readonly AccountSyncSelectedDbStrategy[];
  reusesExistingAccountBackend: boolean;
  postgresCompatible: boolean;
  relationalTableShapeCompatible: boolean;
  providerNeutralAdapterRequired: true;
  accountSyncCoreCanImportProviderSdk: false;
  canBeIntroducedInThisPr: false;
  notes: string;
};

export type AccountSyncPersistenceTableGroup =
  | "account_sync_idempotency_records"
  | "account_sync_audit_summaries"
  | "account_review_events"
  | "account_review_state"
  | "account_daily_stats"
  | "account_saved_words"
  | "account_pack_progress"
  | "account_sync_operation_locks"
  | "account_sync_cursors";

export type AccountSyncPersistenceTableDesign = {
  tableGroup: AccountSyncPersistenceTableGroup;
  purpose: string;
  ownerKey: "ownerAccountId";
  requiredFields: readonly string[];
  uniqueFields: readonly string[];
  uniquenessPolicy: string;
  forbiddenFields: readonly string[];
  writeBehavior: string;
  readBehavior: string;
  transactionParticipation:
    | "apply_critical_transaction"
    | "apply_supporting_transaction"
    | "owner_only_bounded_read"
    | "operation_lock"
    | "cursor_checkpoint";
  retentionNotes: string;
  privacyNotes: string;
  rollbackNotes: string;
  implementationStatus: "design_only";
  createsActualTable: false;
  executableSchemaCreated: false;
};

export type AccountSyncPersistenceOwnerKeyPolicy = {
  id: "account_sync_owner_key_policy_v1";
  trustedOwnerKeySource: "authenticated_server_session";
  ownerKeyField: "ownerAccountId";
  allTableGroupsOwnerScoped: true;
  tableGroupsWithOwnerKey: readonly AccountSyncPersistenceTableGroup[];
  clientProvidedAccountIdOwnershipProofAllowed: false;
  clientProvidedAccountIdMayOnlyBeLegacyMetadata: true;
  readLookupMustIncludeOwner: true;
  writeLookupMustIncludeOwner: true;
  crossAccountReadsRejected: true;
  crossAccountWritesRejected: true;
};

export type AccountSyncPersistenceTransactionPolicy = {
  id: "account_sync_apply_transaction_policy_v1";
  routeId: "apply";
  commitMode: "transaction_like_future_backend";
  criticalTableGroups: readonly AccountSyncPersistenceTableGroup[];
  supportingTableGroups: readonly AccountSyncPersistenceTableGroup[];
  atomicCommitRequired: true;
  partialWritesAllowed: false;
  sameIdempotencyKeySameRequestFingerprintReplaysSafely: true;
  sameIdempotencyKeyDifferentRequestFingerprintRejected: true;
  duplicateReviewEventsCanAdvanceSrsTwice: false;
  reviewEventsSourceOfTruthForSrs: true;
  reviewStateDerivedFromAcceptedReviewEvents: true;
  packProgressWithoutReviewEventEvidenceAuditOnly: true;
  fakeLocalMasteryCanBecomeServerMastery: false;
  paidEntitlementPersistedBySyncStorage: false;
  billingPaymentCheckoutSubscriptionPersistedBySyncStorage: false;
  actualTransactionImplemented: false;
  implementationStatus: "design_only";
};

export type AccountSyncPersistenceRetentionPolicy = {
  id: "account_sync_db_retention_policy_v1";
  idempotencyRecordRetention: "retry_window_then_expire_or_redacted_archive";
  reviewEventRetention: "learning_evidence_until_future_privacy_delete_policy";
  reviewStateRetention: "derived_current_state_while_word_remains_in_account";
  auditSummaryRetention: "bounded_support_window_redacted_only";
  digestReadRetention: "bounded_owner_only_summary_window";
  productionDataAccessedInThisPr: false;
};

export type AccountSyncPersistencePrivacyPolicy = {
  id: "account_sync_db_privacy_policy_v1";
  rawPayloadStorageAllowed: false;
  rawGuestSnapshotStorageAllowed: false;
  rawSensitivePayloadStorageAllowed: false;
  providerTokenStorageAllowed: false;
  productionSecretStorageAllowed: false;
  fullAccountStateAuditStorageAllowed: false;
  auditSummariesRedactedOnly: true;
  digestReadsOwnerOnlyAndBounded: true;
  auditReadsOwnerOnlyAndBounded: true;
  paidEntitlementStorageAllowed: false;
  billingPaymentCheckoutSubscriptionStorageAllowed: false;
};

export type AccountSyncPersistencePortOperation = {
  kind:
    | "load_owner_state_for_preview"
    | "apply_account_sync_plan"
    | "record_review_events_once"
    | "derive_review_state_from_events"
    | "read_owner_digest_bounded"
    | "read_owner_audit_bounded";
  routeIds: readonly VlxAccountSyncRouteId[];
  requiresServerDerivedOwnerAccountId: true;
  ownerScoped: true;
  transactionRequired: boolean;
  boundedReadRequired: boolean;
  canGrantPaidEntitlement: false;
  canPersistBillingPaymentState: false;
};

export type AccountSyncPersistencePortContract = {
  id: "account_sync_persistence_port_v1";
  input:
    | "normalized_account_sync_write_plan"
    | "owner_only_bounded_read_request";
  output:
    | "redacted_apply_outcome"
    | "owner_only_digest"
    | "owner_only_redacted_audit_summaries";
  ownerKeySource: "authenticated_server_session";
  providerSpecificCodeAllowedInPortImplementation: true;
  providerSpecificCodeAllowedInSyncCore: false;
  accountSyncCoreDbProviderNeutral: true;
  dbProviderSdkImportedInThisPr: false;
  migrationsCreatedInThisPr: false;
  actualDatabasePersistenceCreatedInThisPr: false;
  operations: readonly AccountSyncPersistencePortOperation[];
  tableGroups: readonly AccountSyncPersistenceTableGroup[];
  transactionPolicyId: AccountSyncPersistenceTransactionPolicy["id"];
};

export type AccountSyncPersistenceAdapterBoundary = {
  id: "account_sync_persistence_adapter_boundary_v1";
  selectedProviderKind: "existing_account_backend";
  preferredLongTermProviderKind: "postgres_compatible";
  normalizedPort: AccountSyncPersistencePortContract["id"];
  providerSpecificCodeAllowedAtAdapterEdge: true;
  providerSpecificCodeAllowedInSyncCore: false;
  accountSyncCoreDbProviderNeutral: true;
  ownerScopedPortRequired: true;
  serverSessionOwnerRequiredBeforePortCall: true;
  dbProviderSdkImportedInThisPr: false;
  migrationsCreatedInThisPr: false;
  executableSchemaCreatedInThisPr: false;
  actualDatabasePersistenceCreatedInThisPr: false;
  routeHandlerCreatedInThisPr: false;
  middlewareCreatedInThisPr: false;
  networkCallsAllowedInThisPr: false;
  browserStorageAccessAllowedInThisPr: false;
  environmentReadsAllowedInThisPr: false;
};

export type AccountSyncDbProviderRisk = {
  id:
    | "db_provider_sdk_leaks_into_sync_core"
    | "direct_table_access_without_owner_scope"
    | "client_account_id_trusted_as_owner"
    | "cross_account_data_access"
    | "non_transactional_apply"
    | "duplicate_review_event_advances_srs"
    | "fake_mastery_imported_as_server_mastery"
    | "paid_entitlement_persisted_by_sync"
    | "billing_payment_payload_persisted_by_sync"
    | "raw_payload_or_secret_retained"
    | "migration_created_before_provider_approval";
  severity: "P0";
  mitigation: string;
  blocksRealRoutes: true;
};

export type AccountSyncDbProviderNonGoal = {
  id:
    | "real_database_implementation"
    | "db_provider_sdk_imports"
    | "migrations"
    | "executable_schema"
    | "api_routes_or_handlers"
    | "middleware"
    | "runtime_integration"
    | "real_auth_implementation"
    | "validation_dependencies"
    | "logging_or_observability_sdks"
    | "billing_payment_or_checkout"
    | "paid_entitlement_grants"
    | "production_configuration_or_data";
  description: string;
};

export type AccountSyncDbImplementationGate = {
  id:
    | "existing_account_backend_confirmed"
    | "provider_adapter_implemented_in_separate_pr"
    | "postgres_table_design_approved"
    | "transaction_semantics_proven"
    | "migration_plan_approved"
    | "runtime_validation_decision"
    | "manual_persistence_qa"
    | "production_data_safety_approval";
  status: "blocked" | "requires_separate_pr" | "requires_owner_approval";
  requiredBeforeRealRoutes: true;
  blocksRealApiRouteImplementation: true;
  evidenceRequired: string;
};

export type AccountSyncDbManualQARequirement = {
  id:
    | "owner_scoped_preview_load"
    | "owner_scoped_apply_write"
    | "cross_account_rejection"
    | "idempotency_replay"
    | "idempotency_conflict"
    | "duplicate_review_event_noop"
    | "fake_mastery_block"
    | "audit_digest_bounded_owner_only"
    | "rollback_recovery"
    | "no_billing_entitlement_mutation";
  routeIds: readonly VlxAccountSyncRouteId[];
  requiredBeforeProduction: true;
  requiresRealPersistenceIntegration: true;
  requiresOwnerOnlyEvidence: true;
};

export type AccountSyncDbNextStep = {
  prNumber: 67;
  title: "Runtime validator selection and dependency decision";
  docsContractsTestsOnly: true;
  realApiRouteImplementationRecommended: false;
};

export type AccountSyncDbPersistenceFailureReason =
  | "owner_required"
  | "client_account_id_not_trusted"
  | "cross_account_target"
  | "owner_only_bounded_access_required"
  | "same_key_different_fingerprint"
  | "review_state_requires_event_evidence"
  | "paid_entitlement_outside_sync"
  | "billing_payment_outside_sync"
  | "fake_mastery_not_accepted";

export type AccountSyncDbPersistenceOperationKind =
  | "read_digest"
  | "read_audit"
  | "apply_write"
  | "insert_review_event"
  | "derive_review_state"
  | "update_pack_progress";

export type AccountSyncDbPersistenceAccessDecision = {
  ok: boolean;
  status: "accepted" | "rejected" | "replay" | "duplicate_noop" | "audit_only";
  operationKind: AccountSyncDbPersistenceOperationKind;
  ownerAccountId?: string;
  targetOwnerAccountId?: string;
  clientProvidedAccountId?: string;
  failureReasons: readonly AccountSyncDbPersistenceFailureReason[];
  ownerScoped: true;
  ownerDerivedFromAuthenticatedServerSession: boolean;
  clientProvidedAccountIdTrustedAsOwnershipProof: false;
  crossAccountAccessRejected: boolean;
  mutationAllowed: boolean;
  boundedOwnerOnlyReadRequired: boolean;
  replayAllowed: boolean;
  advancesSrs: boolean;
  reviewStateDerivedFromEventEvidence: boolean;
  packProgressAuditOnly: boolean;
  grantsPaidEntitlement: false;
  persistsBillingPaymentState: false;
  acceptsFakeMastery: false;
  designOnly: true;
  implementsRealDb: false;
};

export type AccountSyncDbPersistenceDecisionRecord = {
  accountSyncDbPersistenceDecisionVersion: AccountSyncDbPersistenceDecisionVersion;
  decisionStatus: "design_only_not_implementation_ready";
  selectedProviderKind: "existing_account_backend";
  preferredLongTermProviderKind: "postgres_compatible";
  selectedStrategies: readonly AccountSyncSelectedDbStrategy[];
  finalVerdict: "design_only";
  implementationReady: false;
  accountSyncCoreDbProviderNeutral: true;
  dbProviderSdkImportedInThisPr: false;
  migrationsCreatedInThisPr: false;
  executableSchemaCreatedInThisPr: false;
  actualDatabasePersistenceCreatedInThisPr: false;
  candidates: readonly AccountSyncDbProviderCandidate[];
  adapterBoundary: AccountSyncPersistenceAdapterBoundary;
  portContract: AccountSyncPersistencePortContract;
  tableDesigns: readonly AccountSyncPersistenceTableDesign[];
  ownerKeyPolicy: AccountSyncPersistenceOwnerKeyPolicy;
  transactionPolicy: AccountSyncPersistenceTransactionPolicy;
  retentionPolicy: AccountSyncPersistenceRetentionPolicy;
  privacyPolicy: AccountSyncPersistencePrivacyPolicy;
  risks: readonly AccountSyncDbProviderRisk[];
  nonGoals: readonly AccountSyncDbProviderNonGoal[];
  implementationGates: readonly AccountSyncDbImplementationGate[];
  manualQARequirements: readonly AccountSyncDbManualQARequirement[];
  nextStep: AccountSyncDbNextStep;
  safetyScope: {
    docsContractsTestsOnly: true;
    realDatabaseAllowed: false;
    migrationsAllowed: false;
    executableSchemaAllowed: false;
    apiRoutesAllowed: false;
    routeHandlersAllowed: false;
    middlewareAllowed: false;
    runtimeIntegrationAllowed: false;
    realAuthAllowed: false;
    dbProviderSdkAllowed: false;
    authProviderSdkAllowed: false;
    paymentProviderSdkAllowed: false;
    loggingProviderSdkAllowed: false;
    validationDependencyAllowed: false;
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

export const ACCOUNT_SYNC_SELECTED_DB_STRATEGIES = [
  "existing_account_backend_first_if_available",
  "postgres_compatible_relational_design",
  "provider_neutral_persistence_adapter",
  "no_db_provider_sdk_in_sync_core",
  "no_migrations_in_this_pr"
] as const satisfies readonly AccountSyncSelectedDbStrategy[];

export const ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES = [
  {
    kind: "existing_account_backend",
    label: "Existing app/account backend persistence boundary",
    decisionStatus: "selected_if_available",
    selectedStrategy: [
      "existing_account_backend_first_if_available",
      "provider_neutral_persistence_adapter",
      "no_db_provider_sdk_in_sync_core",
      "no_migrations_in_this_pr"
    ],
    reusesExistingAccountBackend: true,
    postgresCompatible: false,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Prefer the existing app/account backend boundary if it can expose owner-scoped persistence through the normalized port."
  },
  {
    kind: "postgres_compatible",
    label: "Postgres-compatible relational design",
    decisionStatus: "preferred_long_term_shape",
    selectedStrategy: [
      "postgres_compatible_relational_design",
      "provider_neutral_persistence_adapter",
      "no_db_provider_sdk_in_sync_core",
      "no_migrations_in_this_pr"
    ],
    reusesExistingAccountBackend: false,
    postgresCompatible: true,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Preferred long-term table shape because account sync needs owner keys, uniqueness constraints, and transaction-like apply semantics."
  },
  {
    kind: "supabase_postgres",
    label: "Supabase Postgres",
    decisionStatus: "compatible_future_candidate",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: false,
    postgresCompatible: true,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. A provider adapter would hide provider-specific calls from sync core."
  },
  {
    kind: "neon_postgres",
    label: "Neon Postgres",
    decisionStatus: "compatible_future_candidate",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: false,
    postgresCompatible: true,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. The relational shape stays portable through the persistence port."
  },
  {
    kind: "vercel_postgres",
    label: "Vercel Postgres",
    decisionStatus: "compatible_future_candidate",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: false,
    postgresCompatible: true,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Future candidate only. This PR does not change deployment or platform settings."
  },
  {
    kind: "cloudflare_d1",
    label: "Cloudflare D1",
    decisionStatus: "deferred",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: false,
    postgresCompatible: false,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Deferred because the preferred long-term shape is Postgres-compatible unless an existing backend requires another adapter."
  },
  {
    kind: "firebase_firestore",
    label: "Firebase Firestore",
    decisionStatus: "rejected_for_now",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: false,
    postgresCompatible: false,
    relationalTableShapeCompatible: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Rejected for now because the requested account sync design depends on relational uniqueness and transaction-like grouping."
  },
  {
    kind: "custom_backend_storage",
    label: "Custom backend storage",
    decisionStatus: "deferred",
    selectedStrategy: ["provider_neutral_persistence_adapter"],
    reusesExistingAccountBackend: true,
    postgresCompatible: false,
    relationalTableShapeCompatible: true,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Deferred until the existing account backend boundary is confirmed and mapped to the normalized persistence port."
  },
  {
    kind: "in_memory_mock_only",
    label: "In-memory mock only",
    decisionStatus: "mock_only",
    selectedStrategy: ["no_migrations_in_this_pr"],
    reusesExistingAccountBackend: false,
    postgresCompatible: false,
    relationalTableShapeCompatible: false,
    providerNeutralAdapterRequired: true,
    accountSyncCoreCanImportProviderSdk: false,
    canBeIntroducedInThisPr: false,
    notes:
      "Useful for tests and harnesses only. It cannot satisfy production durability, owner isolation, or replay requirements."
  }
] as const satisfies readonly AccountSyncDbProviderCandidate[];

const ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS = [
  "rawGuestSnapshot",
  "rawLocalSnapshot",
  "rawRequestBody",
  "rawSensitivePayload",
  "providerToken",
  "refreshToken",
  "sessionSecret",
  "apiKey",
  "productionSecret",
  "fullAccountState",
  "billingPayload",
  "paymentPayload",
  "checkoutPayload",
  "invoicePayload",
  "subscriptionPayload",
  "billingPortalPayload",
  "paidEntitlement"
] as const;

export const ACCOUNT_SYNC_DB_TABLE_DESIGNS = [
  {
    tableGroup: "account_sync_idempotency_records",
    purpose:
      "Store owner-scoped apply idempotency records, request fingerprints, statuses, and redacted outcomes.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "routeId",
      "idempotencyKey",
      "requestFingerprint",
      "status",
      "outcomeSummary",
      "createdAt",
      "updatedAt",
      "expiresAt"
    ],
    uniqueFields: ["ownerAccountId", "routeId", "idempotencyKey"],
    uniquenessPolicy: "ownerAccountId + routeId + idempotencyKey",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Insert or lock by owner, route, and idempotency key before apply writes; same key and different fingerprint rejects.",
    readBehavior:
      "Read only by server-derived owner plus route and key; never by idempotency key alone.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes:
      "Expire after the approved retry window or keep only redacted archive summaries.",
    privacyNotes:
      "Must not store raw guest snapshots, raw sensitive payloads, provider tokens, secrets, paid entitlement, or billing/payment fields.",
    rollbackNotes:
      "Outcome storage commits with the apply unit or rolls back with all learning writes.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_sync_audit_summaries",
    purpose:
      "Store redacted owner-only sync decision summaries for apply, replay, reject, block, and audit-only outcomes.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "auditId",
      "eventType",
      "severity",
      "redactedSummary",
      "createdAt",
      "retentionClass"
    ],
    uniqueFields: ["ownerAccountId", "auditId"],
    uniquenessPolicy: "ownerAccountId + auditId",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Write bounded redacted summaries only after owner, validation, idempotency, and apply classification succeed.",
    readBehavior:
      "Read only through bounded owner-only audit access; never expose raw payloads or full account state.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes:
      "Use a bounded support and privacy window with redacted summaries only.",
    privacyNotes:
      "Must not store raw payloads, provider tokens, production secrets, billing/payment payloads, or full account state.",
    rollbackNotes:
      "Accepted apply audit summaries commit with the apply unit; rejected preflight summaries remain redacted and owner-scoped.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_review_events",
    purpose:
      "Store accepted review event evidence exactly once as the server SRS source of truth.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "eventId",
      "slug",
      "questionType",
      "result",
      "responseMs",
      "createdAt",
      "source"
    ],
    uniqueFields: ["ownerAccountId", "eventId"],
    uniquenessPolicy: "ownerAccountId + eventId",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Insert accepted review events once; duplicate owner/event pairs are no-op and cannot advance SRS twice.",
    readBehavior:
      "Read by owner for SRS recomputation, daily stats, weak/due/mastered derivation, and pack evidence.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes:
      "Retain as learning evidence unless a future privacy deletion policy requires removal.",
    privacyNotes:
      "Must not contain paid entitlement or billing/payment fields.",
    rollbackNotes:
      "Rollback removes event inserts and all derived state updates from the same apply unit.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_review_state",
    purpose:
      "Store current review state derived from accepted review events and allowed saved-word initialization.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "slug",
      "box",
      "mastery",
      "correct",
      "wrong",
      "lastReviewedAt",
      "nextDueAt",
      "weakScore",
      "avgResponseMs",
      "derivedFromEventCursor"
    ],
    uniqueFields: ["ownerAccountId", "slug"],
    uniquenessPolicy: "ownerAccountId + slug",
    forbiddenFields: [
      ...ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
      "importedLocalMasteryLabel",
      "unsupportedMasteredState"
    ],
    writeBehavior:
      "Recompute from accepted review event evidence; local Mastered labels cannot become server Mastered state.",
    readBehavior:
      "Read by owner for due, weak, strong, mastered, dashboard, and review queue derivation.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes:
      "Retain while the word remains in the account learning record.",
    privacyNotes:
      "Stores derived learning state only, not raw snapshots, provider data, or billing data.",
    rollbackNotes:
      "Rollback restores the previous derived state if event insertion or downstream stats fail.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_daily_stats",
    purpose:
      "Store owner-scoped daily learning aggregates derived from accepted review events.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "date",
      "reviewed",
      "correct",
      "wrong",
      "weakAdded",
      "mastered"
    ],
    uniqueFields: ["ownerAccountId", "date"],
    uniquenessPolicy: "ownerAccountId + date",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Increment only from newly accepted review events; duplicate events do not change counts.",
    readBehavior:
      "Read by owner for bounded learning mission, streak, and digest summaries.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes:
      "Future retention may compact historical aggregates without keeping raw answers.",
    privacyNotes:
      "Contains aggregate learning counts only.",
    rollbackNotes:
      "Daily stat increments roll back with the review events that produced them.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_saved_words",
    purpose:
      "Store saved words for an owner and initialize review state without overwriting existing learning evidence.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "slug",
      "savedAt",
      "source",
      "metadataSummary"
    ],
    uniqueFields: ["ownerAccountId", "slug"],
    uniquenessPolicy: "ownerAccountId + slug",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Upsert by server-derived owner and slug; client accountId values are never ownership proof.",
    readBehavior:
      "Read by owner to support saved library and review queue creation.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes: "Retain while saved by the owner or until future deletion policy.",
    privacyNotes:
      "Metadata summary must stay bounded and exclude raw snapshots, provider data, and billing/payment data.",
    rollbackNotes:
      "Saved-word upserts roll back with the apply unit when related learning writes fail.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_pack_progress",
    purpose:
      "Store owner-scoped pack progress only when backed by accepted review event evidence.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "packId",
      "reviewedCount",
      "correctCount",
      "lastReviewedAt",
      "auditOnly",
      "derivedFromEventEvidence"
    ],
    uniqueFields: ["ownerAccountId", "packId"],
    uniquenessPolicy: "ownerAccountId + packId",
    forbiddenFields: [
      ...ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
      "unsupportedLocalProgressCounter"
    ],
    writeBehavior:
      "Update from accepted review event evidence only; pack inputs without evidence remain audit-only.",
    readBehavior: "Read by owner for pack progress and continue-deck summaries.",
    transactionParticipation: "apply_critical_transaction",
    retentionNotes: "Retain while the owner has pack learning history.",
    privacyNotes:
      "Progress does not imply paid entitlement and must not mirror billing/subscription state.",
    rollbackNotes:
      "Pack progress updates roll back with their source review events.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_sync_operation_locks",
    purpose:
      "Represent a future owner-scoped operation lock for concurrent apply protection.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "operationKind",
      "lockId",
      "acquiredAt",
      "expiresAt",
      "purpose"
    ],
    uniqueFields: ["ownerAccountId", "operationKind"],
    uniquenessPolicy: "ownerAccountId + operationKind",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Acquire per owner and operation kind before mutating apply work; release or expire deterministically.",
    readBehavior:
      "Read only by owner and operation kind for apply coordination diagnostics.",
    transactionParticipation: "operation_lock",
    retentionNotes:
      "Short-lived records expire quickly and should not retain request payloads.",
    privacyNotes:
      "Stores only lock metadata and no sync payload or provider material.",
    rollbackNotes:
      "Expired locks must be recoverable without replaying review events or losing idempotency records.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  },
  {
    tableGroup: "account_sync_cursors",
    purpose:
      "Store owner-scoped cursors for future digest, audit, and event-derived recomputation checkpoints.",
    ownerKey: "ownerAccountId",
    requiredFields: [
      "ownerAccountId",
      "cursorKind",
      "cursorValue",
      "updatedAt"
    ],
    uniqueFields: ["ownerAccountId", "cursorKind"],
    uniquenessPolicy: "ownerAccountId + cursorKind",
    forbiddenFields: ACCOUNT_SYNC_FORBIDDEN_DB_TABLE_FIELDS,
    writeBehavior:
      "Advance only after the related owner-scoped transaction or bounded read checkpoint is accepted.",
    readBehavior:
      "Read by owner and cursor kind; never expose cross-account cursors.",
    transactionParticipation: "cursor_checkpoint",
    retentionNotes: "Retain only current cursor checkpoints unless future audit policy requires more.",
    privacyNotes:
      "Cursor values must be opaque checkpoints, not raw payloads or provider tokens.",
    rollbackNotes:
      "Cursor advancement rolls back or stays behind when source writes fail.",
    implementationStatus: "design_only",
    createsActualTable: false,
    executableSchemaCreated: false
  }
] as const satisfies readonly AccountSyncPersistenceTableDesign[];

export const ACCOUNT_SYNC_DB_OWNER_KEY_POLICY = {
  id: "account_sync_owner_key_policy_v1",
  trustedOwnerKeySource: "authenticated_server_session",
  ownerKeyField: "ownerAccountId",
  allTableGroupsOwnerScoped: true,
  tableGroupsWithOwnerKey: ACCOUNT_SYNC_DB_TABLE_DESIGNS.map(
    (table) => table.tableGroup
  ),
  clientProvidedAccountIdOwnershipProofAllowed: false,
  clientProvidedAccountIdMayOnlyBeLegacyMetadata: true,
  readLookupMustIncludeOwner: true,
  writeLookupMustIncludeOwner: true,
  crossAccountReadsRejected: true,
  crossAccountWritesRejected: true
} as const satisfies AccountSyncPersistenceOwnerKeyPolicy;

export const ACCOUNT_SYNC_DB_TRANSACTION_POLICY = {
  id: "account_sync_apply_transaction_policy_v1",
  routeId: "apply",
  commitMode: "transaction_like_future_backend",
  criticalTableGroups: [
    "account_sync_idempotency_records",
    "account_review_events",
    "account_review_state",
    "account_daily_stats",
    "account_saved_words",
    "account_pack_progress",
    "account_sync_audit_summaries"
  ],
  supportingTableGroups: [
    "account_sync_operation_locks",
    "account_sync_cursors"
  ],
  atomicCommitRequired: true,
  partialWritesAllowed: false,
  sameIdempotencyKeySameRequestFingerprintReplaysSafely: true,
  sameIdempotencyKeyDifferentRequestFingerprintRejected: true,
  duplicateReviewEventsCanAdvanceSrsTwice: false,
  reviewEventsSourceOfTruthForSrs: true,
  reviewStateDerivedFromAcceptedReviewEvents: true,
  packProgressWithoutReviewEventEvidenceAuditOnly: true,
  fakeLocalMasteryCanBecomeServerMastery: false,
  paidEntitlementPersistedBySyncStorage: false,
  billingPaymentCheckoutSubscriptionPersistedBySyncStorage: false,
  actualTransactionImplemented: false,
  implementationStatus: "design_only"
} as const satisfies AccountSyncPersistenceTransactionPolicy;

export const ACCOUNT_SYNC_DB_RETENTION_POLICY = {
  id: "account_sync_db_retention_policy_v1",
  idempotencyRecordRetention: "retry_window_then_expire_or_redacted_archive",
  reviewEventRetention: "learning_evidence_until_future_privacy_delete_policy",
  reviewStateRetention: "derived_current_state_while_word_remains_in_account",
  auditSummaryRetention: "bounded_support_window_redacted_only",
  digestReadRetention: "bounded_owner_only_summary_window",
  productionDataAccessedInThisPr: false
} as const satisfies AccountSyncPersistenceRetentionPolicy;

export const ACCOUNT_SYNC_DB_PRIVACY_POLICY = {
  id: "account_sync_db_privacy_policy_v1",
  rawPayloadStorageAllowed: false,
  rawGuestSnapshotStorageAllowed: false,
  rawSensitivePayloadStorageAllowed: false,
  providerTokenStorageAllowed: false,
  productionSecretStorageAllowed: false,
  fullAccountStateAuditStorageAllowed: false,
  auditSummariesRedactedOnly: true,
  digestReadsOwnerOnlyAndBounded: true,
  auditReadsOwnerOnlyAndBounded: true,
  paidEntitlementStorageAllowed: false,
  billingPaymentCheckoutSubscriptionStorageAllowed: false
} as const satisfies AccountSyncPersistencePrivacyPolicy;

export const ACCOUNT_SYNC_PERSISTENCE_PORT_CONTRACT = {
  id: "account_sync_persistence_port_v1",
  input: "normalized_account_sync_write_plan",
  output: "redacted_apply_outcome",
  ownerKeySource: "authenticated_server_session",
  providerSpecificCodeAllowedInPortImplementation: true,
  providerSpecificCodeAllowedInSyncCore: false,
  accountSyncCoreDbProviderNeutral: true,
  dbProviderSdkImportedInThisPr: false,
  migrationsCreatedInThisPr: false,
  actualDatabasePersistenceCreatedInThisPr: false,
  operations: [
    {
      kind: "load_owner_state_for_preview",
      routeIds: ["preview"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: false,
      boundedReadRequired: true,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    },
    {
      kind: "apply_account_sync_plan",
      routeIds: ["apply"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: true,
      boundedReadRequired: false,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    },
    {
      kind: "record_review_events_once",
      routeIds: ["apply"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: true,
      boundedReadRequired: false,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    },
    {
      kind: "derive_review_state_from_events",
      routeIds: ["apply"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: true,
      boundedReadRequired: false,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    },
    {
      kind: "read_owner_digest_bounded",
      routeIds: ["digest"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: false,
      boundedReadRequired: true,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    },
    {
      kind: "read_owner_audit_bounded",
      routeIds: ["audit"],
      requiresServerDerivedOwnerAccountId: true,
      ownerScoped: true,
      transactionRequired: false,
      boundedReadRequired: true,
      canGrantPaidEntitlement: false,
      canPersistBillingPaymentState: false
    }
  ],
  tableGroups: ACCOUNT_SYNC_DB_TABLE_DESIGNS.map((table) => table.tableGroup),
  transactionPolicyId: ACCOUNT_SYNC_DB_TRANSACTION_POLICY.id
} as const satisfies AccountSyncPersistencePortContract;

export const ACCOUNT_SYNC_PERSISTENCE_ADAPTER_BOUNDARY = {
  id: "account_sync_persistence_adapter_boundary_v1",
  selectedProviderKind: "existing_account_backend",
  preferredLongTermProviderKind: "postgres_compatible",
  normalizedPort: "account_sync_persistence_port_v1",
  providerSpecificCodeAllowedAtAdapterEdge: true,
  providerSpecificCodeAllowedInSyncCore: false,
  accountSyncCoreDbProviderNeutral: true,
  ownerScopedPortRequired: true,
  serverSessionOwnerRequiredBeforePortCall: true,
  dbProviderSdkImportedInThisPr: false,
  migrationsCreatedInThisPr: false,
  executableSchemaCreatedInThisPr: false,
  actualDatabasePersistenceCreatedInThisPr: false,
  routeHandlerCreatedInThisPr: false,
  middlewareCreatedInThisPr: false,
  networkCallsAllowedInThisPr: false,
  browserStorageAccessAllowedInThisPr: false,
  environmentReadsAllowedInThisPr: false
} as const satisfies AccountSyncPersistenceAdapterBoundary;

export const ACCOUNT_SYNC_DB_PROVIDER_RISKS = [
  {
    id: "db_provider_sdk_leaks_into_sync_core",
    severity: "P0",
    mitigation:
      "Keep provider-specific database calls behind the normalized persistence port.",
    blocksRealRoutes: true
  },
  {
    id: "direct_table_access_without_owner_scope",
    severity: "P0",
    mitigation:
      "Require every read and write lookup to include the server-derived ownerAccountId.",
    blocksRealRoutes: true
  },
  {
    id: "client_account_id_trusted_as_owner",
    severity: "P0",
    mitigation:
      "Treat client account ids as untrusted metadata and derive owner keys from authenticated server sessions only.",
    blocksRealRoutes: true
  },
  {
    id: "cross_account_data_access",
    severity: "P0",
    mitigation:
      "Reject any target owner mismatch before persistence port access.",
    blocksRealRoutes: true
  },
  {
    id: "non_transactional_apply",
    severity: "P0",
    mitigation:
      "Apply idempotency, review events, derived state, stats, saved words, pack progress, and audit summaries as one unit.",
    blocksRealRoutes: true
  },
  {
    id: "duplicate_review_event_advances_srs",
    severity: "P0",
    mitigation:
      "Use ownerAccountId + eventId uniqueness and treat duplicate events as no-op evidence.",
    blocksRealRoutes: true
  },
  {
    id: "fake_mastery_imported_as_server_mastery",
    severity: "P0",
    mitigation:
      "Derive server mastery only from delayed review-event evidence.",
    blocksRealRoutes: true
  },
  {
    id: "paid_entitlement_persisted_by_sync",
    severity: "P0",
    mitigation:
      "Forbid entitlement fields in every sync table group and keep plan data outside sync writes.",
    blocksRealRoutes: true
  },
  {
    id: "billing_payment_payload_persisted_by_sync",
    severity: "P0",
    mitigation:
      "Reject billing, payment, checkout, invoice, subscription, and billing portal payloads at the sync boundary.",
    blocksRealRoutes: true
  },
  {
    id: "raw_payload_or_secret_retained",
    severity: "P0",
    mitigation:
      "Store only bounded metadata, fingerprints, event evidence, and redacted summaries.",
    blocksRealRoutes: true
  },
  {
    id: "migration_created_before_provider_approval",
    severity: "P0",
    mitigation:
      "Keep this PR design-only and require separate owner approval for executable schema or migrations.",
    blocksRealRoutes: true
  }
] as const satisfies readonly AccountSyncDbProviderRisk[];

export const ACCOUNT_SYNC_DB_PROVIDER_NON_GOALS = [
  {
    id: "real_database_implementation",
    description: "No real database persistence is implemented."
  },
  {
    id: "db_provider_sdk_imports",
    description:
      "No Supabase, Prisma, Drizzle, Neon, Firebase, Cloudflare D1, Postgres, or provider SDK package is imported."
  },
  {
    id: "migrations",
    description: "No migration file is created."
  },
  {
    id: "executable_schema",
    description: "No executable database schema is created."
  },
  {
    id: "api_routes_or_handlers",
    description: "No account sync API route or route handler is created."
  },
  {
    id: "middleware",
    description: "No middleware is added or changed."
  },
  {
    id: "runtime_integration",
    description: "No runtime route, component, or server integration is added."
  },
  {
    id: "real_auth_implementation",
    description: "No real auth implementation is added."
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
] as const satisfies readonly AccountSyncDbProviderNonGoal[];

export const ACCOUNT_SYNC_DB_IMPLEMENTATION_GATES = [
  {
    id: "existing_account_backend_confirmed",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Confirm whether the existing app/account backend can expose the normalized owner-scoped persistence port."
  },
  {
    id: "provider_adapter_implemented_in_separate_pr",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Implement provider-specific persistence only behind the adapter boundary in a later PR."
  },
  {
    id: "postgres_table_design_approved",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Approve table groups, owner keys, uniqueness, retention, rollback, and privacy behavior before schema work."
  },
  {
    id: "transaction_semantics_proven",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Prove apply can commit idempotency, review evidence, derived state, stats, saved words, pack progress, and audit as one unit."
  },
  {
    id: "migration_plan_approved",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Create migrations only after provider selection and owner-approved rollback procedure."
  },
  {
    id: "runtime_validation_decision",
    status: "requires_separate_pr",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Select runtime validation before any real persistence route accepts payloads."
  },
  {
    id: "manual_persistence_qa",
    status: "blocked",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Run authenticated owner-scoped QA with real persistence after adapter and schema work exist."
  },
  {
    id: "production_data_safety_approval",
    status: "requires_owner_approval",
    requiredBeforeRealRoutes: true,
    blocksRealApiRouteImplementation: true,
    evidenceRequired:
      "Approve production data access, backup, retention, rollback, and deletion behavior before touching production data."
  }
] as const satisfies readonly AccountSyncDbImplementationGate[];

export const ACCOUNT_SYNC_DB_MANUAL_QA_REQUIREMENTS = [
  {
    id: "owner_scoped_preview_load",
    routeIds: ["preview"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "owner_scoped_apply_write",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "cross_account_rejection",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "idempotency_replay",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "idempotency_conflict",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "duplicate_review_event_noop",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "fake_mastery_block",
    routeIds: ["preview", "apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "audit_digest_bounded_owner_only",
    routeIds: ["digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "rollback_recovery",
    routeIds: ["apply"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  },
  {
    id: "no_billing_entitlement_mutation",
    routeIds: ["preview", "apply", "digest", "audit"],
    requiredBeforeProduction: true,
    requiresRealPersistenceIntegration: true,
    requiresOwnerOnlyEvidence: true
  }
] as const satisfies readonly AccountSyncDbManualQARequirement[];

export const ACCOUNT_SYNC_DB_NEXT_STEP = {
  prNumber: 67,
  title: "Runtime validator selection and dependency decision",
  docsContractsTestsOnly: true,
  realApiRouteImplementationRecommended: false
} as const satisfies AccountSyncDbNextStep;

export const ACCOUNT_SYNC_DB_SAFETY_SCOPE = {
  docsContractsTestsOnly: true,
  realDatabaseAllowed: false,
  migrationsAllowed: false,
  executableSchemaAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeIntegrationAllowed: false,
  realAuthAllowed: false,
  dbProviderSdkAllowed: false,
  authProviderSdkAllowed: false,
  paymentProviderSdkAllowed: false,
  loggingProviderSdkAllowed: false,
  validationDependencyAllowed: false,
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
} as const satisfies AccountSyncDbPersistenceDecisionRecord["safetyScope"];

export const ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD = {
  accountSyncDbPersistenceDecisionVersion:
    ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_VERSION,
  decisionStatus: "design_only_not_implementation_ready",
  selectedProviderKind: "existing_account_backend",
  preferredLongTermProviderKind: "postgres_compatible",
  selectedStrategies: ACCOUNT_SYNC_SELECTED_DB_STRATEGIES,
  finalVerdict: "design_only",
  implementationReady: false,
  accountSyncCoreDbProviderNeutral: true,
  dbProviderSdkImportedInThisPr: false,
  migrationsCreatedInThisPr: false,
  executableSchemaCreatedInThisPr: false,
  actualDatabasePersistenceCreatedInThisPr: false,
  candidates: ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES,
  adapterBoundary: ACCOUNT_SYNC_PERSISTENCE_ADAPTER_BOUNDARY,
  portContract: ACCOUNT_SYNC_PERSISTENCE_PORT_CONTRACT,
  tableDesigns: ACCOUNT_SYNC_DB_TABLE_DESIGNS,
  ownerKeyPolicy: ACCOUNT_SYNC_DB_OWNER_KEY_POLICY,
  transactionPolicy: ACCOUNT_SYNC_DB_TRANSACTION_POLICY,
  retentionPolicy: ACCOUNT_SYNC_DB_RETENTION_POLICY,
  privacyPolicy: ACCOUNT_SYNC_DB_PRIVACY_POLICY,
  risks: ACCOUNT_SYNC_DB_PROVIDER_RISKS,
  nonGoals: ACCOUNT_SYNC_DB_PROVIDER_NON_GOALS,
  implementationGates: ACCOUNT_SYNC_DB_IMPLEMENTATION_GATES,
  manualQARequirements: ACCOUNT_SYNC_DB_MANUAL_QA_REQUIREMENTS,
  nextStep: ACCOUNT_SYNC_DB_NEXT_STEP,
  safetyScope: ACCOUNT_SYNC_DB_SAFETY_SCOPE
} as const satisfies AccountSyncDbPersistenceDecisionRecord;

export function getAccountSyncDbProviderCandidate(
  providerKind: AccountSyncDbProviderKind
) {
  return ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES.find(
    (candidate) => candidate.kind === providerKind
  );
}

export function getAccountSyncPersistenceTableDesign(
  tableGroup: AccountSyncPersistenceTableGroup
) {
  return ACCOUNT_SYNC_DB_TABLE_DESIGNS.find(
    (table) => table.tableGroup === tableGroup
  );
}

export function decideAccountSyncDbPersistenceAccess({
  operationKind,
  ownerAccountId,
  targetOwnerAccountId,
  clientProvidedAccountId,
  ownerDerivedFromAuthenticatedServerSession,
  boundedOwnerOnlyRead,
  sameIdempotencyKey,
  sameRequestFingerprint,
  duplicateReviewEvent,
  reviewEventEvidenceAvailable,
  packProgressHasReviewEventEvidence,
  requestIncludesPaidEntitlementGrant = false,
  requestIncludesBillingPaymentState = false,
  requestContainsFakeMasteryWithoutDelayedRecallEvidence = false
}: {
  operationKind: AccountSyncDbPersistenceOperationKind;
  ownerAccountId?: string;
  targetOwnerAccountId?: string;
  clientProvidedAccountId?: string;
  ownerDerivedFromAuthenticatedServerSession: boolean;
  boundedOwnerOnlyRead?: boolean;
  sameIdempotencyKey?: boolean;
  sameRequestFingerprint?: boolean;
  duplicateReviewEvent?: boolean;
  reviewEventEvidenceAvailable?: boolean;
  packProgressHasReviewEventEvidence?: boolean;
  requestIncludesPaidEntitlementGrant?: boolean;
  requestIncludesBillingPaymentState?: boolean;
  requestContainsFakeMasteryWithoutDelayedRecallEvidence?: boolean;
}): AccountSyncDbPersistenceAccessDecision {
  const failureReasons: AccountSyncDbPersistenceFailureReason[] = [];
  const boundedOwnerOnlyReadRequired =
    operationKind === "read_digest" || operationKind === "read_audit";

  if (!ownerAccountId || !ownerDerivedFromAuthenticatedServerSession) {
    failureReasons.push("owner_required");
  }

  if (clientProvidedAccountId) {
    failureReasons.push("client_account_id_not_trusted");
  }

  if (
    ownerAccountId &&
    targetOwnerAccountId &&
    ownerAccountId !== targetOwnerAccountId
  ) {
    failureReasons.push("cross_account_target");
  }

  if (boundedOwnerOnlyReadRequired && !boundedOwnerOnlyRead) {
    failureReasons.push("owner_only_bounded_access_required");
  }

  if (sameIdempotencyKey === true && sameRequestFingerprint === false) {
    failureReasons.push("same_key_different_fingerprint");
  }

  if (
    operationKind === "derive_review_state" &&
    reviewEventEvidenceAvailable !== true
  ) {
    failureReasons.push("review_state_requires_event_evidence");
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
  const rejected = uniqueFailureReasons.length > 0;
  const replay =
    !rejected &&
    operationKind === "apply_write" &&
    sameIdempotencyKey === true &&
    sameRequestFingerprint === true;
  const duplicateNoop =
    !rejected &&
    operationKind === "insert_review_event" &&
    duplicateReviewEvent === true;
  const packAuditOnly =
    !rejected &&
    operationKind === "update_pack_progress" &&
    packProgressHasReviewEventEvidence !== true;
  const mutationAllowed =
    !rejected && !replay && !duplicateNoop && !packAuditOnly;

  return {
    ok: !rejected,
    status: rejected
      ? "rejected"
      : replay
        ? "replay"
        : duplicateNoop
          ? "duplicate_noop"
          : packAuditOnly
            ? "audit_only"
            : "accepted",
    operationKind,
    ownerAccountId,
    targetOwnerAccountId,
    clientProvidedAccountId,
    failureReasons: uniqueFailureReasons,
    ownerScoped: true,
    ownerDerivedFromAuthenticatedServerSession,
    clientProvidedAccountIdTrustedAsOwnershipProof: false,
    crossAccountAccessRejected: uniqueFailureReasons.includes(
      "cross_account_target"
    ),
    mutationAllowed,
    boundedOwnerOnlyReadRequired,
    replayAllowed: replay,
    advancesSrs:
      mutationAllowed &&
      operationKind === "insert_review_event" &&
      duplicateReviewEvent !== true,
    reviewStateDerivedFromEventEvidence:
      operationKind === "derive_review_state"
        ? reviewEventEvidenceAvailable === true && !rejected
        : ACCOUNT_SYNC_DB_TRANSACTION_POLICY.reviewStateDerivedFromAcceptedReviewEvents,
    packProgressAuditOnly: packAuditOnly,
    grantsPaidEntitlement: false,
    persistsBillingPaymentState: false,
    acceptsFakeMastery: false,
    designOnly: true,
    implementsRealDb: false
  };
}
