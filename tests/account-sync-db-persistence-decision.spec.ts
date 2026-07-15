import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_DB_OWNER_KEY_POLICY,
  ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD,
  ACCOUNT_SYNC_DB_PRIVACY_POLICY,
  ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES,
  ACCOUNT_SYNC_DB_SAFETY_SCOPE,
  ACCOUNT_SYNC_DB_TABLE_DESIGNS,
  ACCOUNT_SYNC_DB_TRANSACTION_POLICY,
  ACCOUNT_SYNC_PERSISTENCE_ADAPTER_BOUNDARY,
  ACCOUNT_SYNC_PERSISTENCE_PORT_CONTRACT,
  decideAccountSyncDbPersistenceAccess,
  getAccountSyncDbProviderCandidate,
  getAccountSyncPersistenceTableDesign,
  type AccountSyncDbImplementationGate,
  type AccountSyncDbManualQARequirement,
  type AccountSyncDbNextStep,
  type AccountSyncDbPersistenceDecisionRecord,
  type AccountSyncDbPersistenceDecisionVersion,
  type AccountSyncDbProviderCandidate,
  type AccountSyncDbProviderDecisionStatus,
  type AccountSyncDbProviderKind,
  type AccountSyncDbProviderNonGoal,
  type AccountSyncDbProviderRisk,
  type AccountSyncPersistenceAdapterBoundary,
  type AccountSyncPersistenceOwnerKeyPolicy,
  type AccountSyncPersistencePortContract,
  type AccountSyncPersistencePrivacyPolicy,
  type AccountSyncPersistenceRetentionPolicy,
  type AccountSyncPersistenceTableDesign,
  type AccountSyncPersistenceTableGroup,
  type AccountSyncPersistenceTransactionPolicy,
  type AccountSyncSelectedDbStrategy,
} from '../src/lib/account-persistence/db-persistence-decision/db-persistence-decision';
import {
  ACCOUNT_SYNC_DB_DAILY_STATS_UNIQUE_FIELDS,
  ACCOUNT_SYNC_DB_EXPECTED_APPLY_TRANSACTION_GROUPS,
  ACCOUNT_SYNC_DB_EXPECTED_MANUAL_QA_IDS,
  ACCOUNT_SYNC_DB_EXPECTED_PROVIDER_CANDIDATES,
  ACCOUNT_SYNC_DB_EXPECTED_SELECTED_STRATEGIES,
  ACCOUNT_SYNC_DB_EXPECTED_TABLE_GROUPS,
  ACCOUNT_SYNC_DB_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_DB_FORBIDDEN_SCHEMA_AND_MIGRATION_PATHS,
  ACCOUNT_SYNC_DB_IDEMPOTENCY_UNIQUE_FIELDS,
  ACCOUNT_SYNC_DB_MODULE_FILES,
  ACCOUNT_SYNC_DB_OTHER_ACCOUNT_ID,
  ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
  ACCOUNT_SYNC_DB_PACK_PROGRESS_UNIQUE_FIELDS,
  ACCOUNT_SYNC_DB_REVIEW_EVENT_UNIQUE_FIELDS,
  ACCOUNT_SYNC_DB_REVIEW_STATE_UNIQUE_FIELDS,
  ACCOUNT_SYNC_DB_SAVED_WORD_UNIQUE_FIELDS,
} from '../src/lib/account-persistence/db-persistence-decision/fixtures';

const workspaceRoot = process.cwd();

type RequiredDbPersistenceDecisionTypeSurface = {
  version: AccountSyncDbPersistenceDecisionVersion;
  candidate: AccountSyncDbProviderCandidate;
  status: AccountSyncDbProviderDecisionStatus;
  strategy: AccountSyncSelectedDbStrategy;
  kind: AccountSyncDbProviderKind;
  adapterBoundary: AccountSyncPersistenceAdapterBoundary;
  portContract: AccountSyncPersistencePortContract;
  tableGroup: AccountSyncPersistenceTableGroup;
  tableDesign: AccountSyncPersistenceTableDesign;
  ownerKeyPolicy: AccountSyncPersistenceOwnerKeyPolicy;
  transactionPolicy: AccountSyncPersistenceTransactionPolicy;
  retentionPolicy: AccountSyncPersistenceRetentionPolicy;
  privacyPolicy: AccountSyncPersistencePrivacyPolicy;
  record: AccountSyncDbPersistenceDecisionRecord;
  risk: AccountSyncDbProviderRisk;
  nonGoal: AccountSyncDbProviderNonGoal;
  gate: AccountSyncDbImplementationGate;
  manualQA: AccountSyncDbManualQARequirement;
  nextStep: AccountSyncDbNextStep;
};

const exportedTypeSmoke: RequiredDbPersistenceDecisionTypeSurface = {
  version:
    ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD
      .accountSyncDbPersistenceDecisionVersion,
  candidate: ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES[0],
  status: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.decisionStatus,
  strategy: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.selectedStrategies[0],
  kind: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.selectedProviderKind,
  adapterBoundary: ACCOUNT_SYNC_PERSISTENCE_ADAPTER_BOUNDARY,
  portContract: ACCOUNT_SYNC_PERSISTENCE_PORT_CONTRACT,
  tableGroup: ACCOUNT_SYNC_DB_TABLE_DESIGNS[0].tableGroup,
  tableDesign: ACCOUNT_SYNC_DB_TABLE_DESIGNS[0],
  ownerKeyPolicy: ACCOUNT_SYNC_DB_OWNER_KEY_POLICY,
  transactionPolicy: ACCOUNT_SYNC_DB_TRANSACTION_POLICY,
  retentionPolicy: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.retentionPolicy,
  privacyPolicy: ACCOUNT_SYNC_DB_PRIVACY_POLICY,
  record: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD,
  risk: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.risks[0],
  nonGoal: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.nonGoals[0],
  gate: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.implementationGates[0],
  manualQA: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.manualQARequirements[0],
  nextStep: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.nextStep,
};

function providerCandidateKinds() {
  return ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.candidates.map(
    (candidate) => candidate.kind
  );
}

function tableGroups() {
  return ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.tableDesigns.map(
    (table) => table.tableGroup
  );
}

function manualQAIds() {
  return ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.manualQARequirements.map(
    (requirement) => requirement.id
  );
}

function expectTable(tableGroup: AccountSyncPersistenceTableGroup) {
  const table = getAccountSyncPersistenceTableDesign(tableGroup);

  expect(table, `${tableGroup} table design`).toBeDefined();

  if (!table) {
    throw new Error(`Missing table design: ${tableGroup}`);
  }

  return table;
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, 'env');
  const guardedGlobals = [
    '__vlxAuthProviderSdk',
    '__vlxDatabaseSdk',
    '__vlxPaymentSdk',
    '__vlxLoggingProviderSdk',
    '__vlxObservabilitySdk',
    '__vlxValidationDependency',
    '__vlxWebflowCms',
    '__vlxCloudflareWorkers',
    '__vlxVercelSettings',
    '__vlxDnsProvider',
    '__vlxProductionData',
  ] as const;
  const originalGuardedDescriptors = new Map<string, PropertyDescriptor | undefined>();
  let fetchAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;
  let providerSurfaceAccessed = false;

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    get() {
      fetchAccessed = true;
      return () => {
        throw new Error('db persistence decision must not call network helpers');
      };
    },
  });

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    },
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, 'env', {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      },
    });
  }

  for (const name of guardedGlobals) {
    originalGuardedDescriptors.set(
      name,
      Object.getOwnPropertyDescriptor(globalThis, name)
    );
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        providerSurfaceAccessed = true;
        return undefined;
      },
    });
  }

  try {
    const value = callback();

    return {
      value,
      sideEffects: {
        fetchAccessed,
        localStorageAccessed,
        processEnvAccessed,
        providerSurfaceAccessed,
      },
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, 'env', originalProcessEnvDescriptor);
    }

    for (const name of guardedGlobals) {
      const descriptor = originalGuardedDescriptors.get(name);

      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
  }
}

test.describe('account sync db persistence decision', () => {
  test('exports the required db persistence decision type surface through static values', () => {
    expect(exportedTypeSmoke).toMatchObject({
      version: 1,
      status: 'design_only_not_implementation_ready',
      strategy: 'existing_account_backend_first_if_available',
      kind: 'existing_account_backend',
      tableGroup: 'account_sync_idempotency_records',
    });
  });

  test('selects the existing account backend first and keeps the adapter provider-neutral', () => {
    expect(ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD).toMatchObject({
      selectedProviderKind: 'existing_account_backend',
      selectedStrategies: ACCOUNT_SYNC_DB_EXPECTED_SELECTED_STRATEGIES,
      accountSyncCoreDbProviderNeutral: true,
      finalVerdict: 'design_only',
      implementationReady: false,
    });
    expect(getAccountSyncDbProviderCandidate('existing_account_backend')).toMatchObject({
      decisionStatus: 'selected_if_available',
      reusesExistingAccountBackend: true,
      providerNeutralAdapterRequired: true,
    });
    expect(ACCOUNT_SYNC_PERSISTENCE_ADAPTER_BOUNDARY).toMatchObject({
      selectedProviderKind: 'existing_account_backend',
      providerSpecificCodeAllowedAtAdapterEdge: true,
      providerSpecificCodeAllowedInSyncCore: false,
      accountSyncCoreDbProviderNeutral: true,
      dbProviderSdkImportedInThisPr: false,
      migrationsCreatedInThisPr: false,
      actualDatabasePersistenceCreatedInThisPr: false,
    });
    expect(providerCandidateKinds()).toEqual(
      ACCOUNT_SYNC_DB_EXPECTED_PROVIDER_CANDIDATES
    );
  });

  test('prefers a Postgres-compatible relational design as the long-term table shape', () => {
    expect(ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD).toMatchObject({
      preferredLongTermProviderKind: 'postgres_compatible',
      selectedStrategies: expect.arrayContaining([
        'postgres_compatible_relational_design',
      ]),
    });
    expect(getAccountSyncDbProviderCandidate('postgres_compatible')).toMatchObject({
      decisionStatus: 'preferred_long_term_shape',
      postgresCompatible: true,
      relationalTableShapeCompatible: true,
      accountSyncCoreCanImportProviderSdk: false,
    });

    for (const kind of ['supabase_postgres', 'neon_postgres', 'vercel_postgres'] as const) {
      expect(getAccountSyncDbProviderCandidate(kind)).toMatchObject({
        decisionStatus: 'compatible_future_candidate',
        postgresCompatible: true,
        providerNeutralAdapterRequired: true,
        canBeIntroducedInThisPr: false,
      });
    }
  });

  test('forbids DB provider SDK imports and keeps account sync core DB-provider-neutral', () => {
    expect(ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD).toMatchObject({
      accountSyncCoreDbProviderNeutral: true,
      dbProviderSdkImportedInThisPr: false,
      migrationsCreatedInThisPr: false,
      executableSchemaCreatedInThisPr: false,
      actualDatabasePersistenceCreatedInThisPr: false,
    });
    expect(ACCOUNT_SYNC_PERSISTENCE_PORT_CONTRACT).toMatchObject({
      ownerKeySource: 'authenticated_server_session',
      providerSpecificCodeAllowedInPortImplementation: true,
      providerSpecificCodeAllowedInSyncCore: false,
      accountSyncCoreDbProviderNeutral: true,
      dbProviderSdkImportedInThisPr: false,
      migrationsCreatedInThisPr: false,
      actualDatabasePersistenceCreatedInThisPr: false,
    });

    for (const candidate of ACCOUNT_SYNC_DB_PROVIDER_CANDIDATES) {
      expect(candidate).toMatchObject({
        providerNeutralAdapterRequired: true,
        accountSyncCoreCanImportProviderSdk: false,
        canBeIntroducedInThisPr: false,
      });
    }
  });

  test('every table group is owner-scoped and design-only', () => {
    expect(tableGroups()).toEqual(ACCOUNT_SYNC_DB_EXPECTED_TABLE_GROUPS);
    expect(ACCOUNT_SYNC_DB_OWNER_KEY_POLICY).toMatchObject({
      trustedOwnerKeySource: 'authenticated_server_session',
      ownerKeyField: 'ownerAccountId',
      allTableGroupsOwnerScoped: true,
      clientProvidedAccountIdOwnershipProofAllowed: false,
      readLookupMustIncludeOwner: true,
      writeLookupMustIncludeOwner: true,
      crossAccountReadsRejected: true,
      crossAccountWritesRejected: true,
    });

    for (const table of ACCOUNT_SYNC_DB_TABLE_DESIGNS) {
      expect(table).toMatchObject({
        ownerKey: 'ownerAccountId',
        implementationStatus: 'design_only',
        createsActualTable: false,
        executableSchemaCreated: false,
      });
      expect(table.requiredFields).toContain('ownerAccountId');
      expect(table.uniqueFields).toContain('ownerAccountId');
      expect(table.forbiddenFields).toEqual(
        expect.arrayContaining([
          'rawGuestSnapshot',
          'providerToken',
          'productionSecret',
          'paidEntitlement',
        ])
      );
    }
  });

  test('client-provided accountId is never ownership proof', () => {
    const decision = decideAccountSyncDbPersistenceAccess({
      operationKind: 'apply_write',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      clientProvidedAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
    });

    expect(decision.ok).toBe(false);
    expect(decision.failureReasons).toContain('client_account_id_not_trusted');
    expect(decision.clientProvidedAccountIdTrustedAsOwnershipProof).toBe(false);
    expect(decision.mutationAllowed).toBe(false);
  });

  test('cross-account reads and writes are rejected by design', () => {
    const crossAccountWrite = decideAccountSyncDbPersistenceAccess({
      operationKind: 'apply_write',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OTHER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
    });
    const crossAccountRead = decideAccountSyncDbPersistenceAccess({
      operationKind: 'read_digest',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OTHER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      boundedOwnerOnlyRead: true,
    });

    expect(crossAccountWrite).toMatchObject({
      ok: false,
      status: 'rejected',
      crossAccountAccessRejected: true,
      mutationAllowed: false,
    });
    expect(crossAccountWrite.failureReasons).toContain('cross_account_target');
    expect(crossAccountRead).toMatchObject({
      ok: false,
      status: 'rejected',
      crossAccountAccessRejected: true,
    });
    expect(crossAccountRead.failureReasons).toContain('cross_account_target');
  });

  test('uniqueness policies match the required owner-scoped keys', () => {
    expect(expectTable('account_sync_idempotency_records')).toMatchObject({
      requiredFields: expect.arrayContaining([
        'ownerAccountId',
        'routeId',
        'idempotencyKey',
        'requestFingerprint',
        'status',
        'outcomeSummary',
        'createdAt',
        'updatedAt',
        'expiresAt',
      ]),
      uniqueFields: ACCOUNT_SYNC_DB_IDEMPOTENCY_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + routeId + idempotencyKey',
    });
    expect(expectTable('account_review_events')).toMatchObject({
      requiredFields: expect.arrayContaining([
        'ownerAccountId',
        'eventId',
        'slug',
        'questionType',
        'result',
        'responseMs',
        'createdAt',
        'source',
      ]),
      uniqueFields: ACCOUNT_SYNC_DB_REVIEW_EVENT_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + eventId',
    });
    expect(expectTable('account_review_state')).toMatchObject({
      uniqueFields: ACCOUNT_SYNC_DB_REVIEW_STATE_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + slug',
    });
    expect(expectTable('account_saved_words')).toMatchObject({
      uniqueFields: ACCOUNT_SYNC_DB_SAVED_WORD_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + slug',
    });
    expect(expectTable('account_daily_stats')).toMatchObject({
      uniqueFields: ACCOUNT_SYNC_DB_DAILY_STATS_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + date',
    });
    expect(expectTable('account_pack_progress')).toMatchObject({
      uniqueFields: ACCOUNT_SYNC_DB_PACK_PROGRESS_UNIQUE_FIELDS,
      uniquenessPolicy: 'ownerAccountId + packId',
    });
  });

  test('apply transaction boundary includes idempotency, events, derived state, stats, saved words, pack progress, and audit summaries', () => {
    expect(ACCOUNT_SYNC_DB_TRANSACTION_POLICY.criticalTableGroups).toEqual(
      ACCOUNT_SYNC_DB_EXPECTED_APPLY_TRANSACTION_GROUPS
    );
    expect(ACCOUNT_SYNC_DB_TRANSACTION_POLICY).toMatchObject({
      routeId: 'apply',
      commitMode: 'transaction_like_future_backend',
      atomicCommitRequired: true,
      partialWritesAllowed: false,
      actualTransactionImplemented: false,
      implementationStatus: 'design_only',
    });

    const replay = decideAccountSyncDbPersistenceAccess({
      operationKind: 'apply_write',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      sameIdempotencyKey: true,
      sameRequestFingerprint: true,
    });
    const conflict = decideAccountSyncDbPersistenceAccess({
      operationKind: 'apply_write',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      sameIdempotencyKey: true,
      sameRequestFingerprint: false,
    });

    expect(replay).toMatchObject({
      ok: true,
      status: 'replay',
      replayAllowed: true,
      mutationAllowed: false,
      advancesSrs: false,
    });
    expect(conflict).toMatchObject({
      ok: false,
      status: 'rejected',
      mutationAllowed: false,
    });
    expect(conflict.failureReasons).toContain('same_key_different_fingerprint');
  });

  test('duplicate review events cannot advance SRS twice and review state is event-derived', () => {
    const duplicateEvent = decideAccountSyncDbPersistenceAccess({
      operationKind: 'insert_review_event',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      duplicateReviewEvent: true,
    });
    const derivedState = decideAccountSyncDbPersistenceAccess({
      operationKind: 'derive_review_state',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      reviewEventEvidenceAvailable: true,
    });
    const missingEventEvidence = decideAccountSyncDbPersistenceAccess({
      operationKind: 'derive_review_state',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      reviewEventEvidenceAvailable: false,
    });

    expect(duplicateEvent).toMatchObject({
      ok: true,
      status: 'duplicate_noop',
      mutationAllowed: false,
      advancesSrs: false,
    });
    expect(ACCOUNT_SYNC_DB_TRANSACTION_POLICY).toMatchObject({
      duplicateReviewEventsCanAdvanceSrsTwice: false,
      reviewEventsSourceOfTruthForSrs: true,
      reviewStateDerivedFromAcceptedReviewEvents: true,
    });
    expect(derivedState).toMatchObject({
      ok: true,
      status: 'accepted',
      reviewStateDerivedFromEventEvidence: true,
    });
    expect(missingEventEvidence.ok).toBe(false);
    expect(missingEventEvidence.failureReasons).toContain(
      'review_state_requires_event_evidence'
    );
  });

  test('pack progress without review evidence remains audit-only', () => {
    const auditOnlyPackProgress = decideAccountSyncDbPersistenceAccess({
      operationKind: 'update_pack_progress',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      packProgressHasReviewEventEvidence: false,
    });
    const packProgress = expectTable('account_pack_progress');

    expect(auditOnlyPackProgress).toMatchObject({
      ok: true,
      status: 'audit_only',
      mutationAllowed: false,
      packProgressAuditOnly: true,
    });
    expect(packProgress.requiredFields).toEqual(
      expect.arrayContaining(['auditOnly', 'derivedFromEventEvidence'])
    );
    expect(ACCOUNT_SYNC_DB_TRANSACTION_POLICY).toMatchObject({
      packProgressWithoutReviewEventEvidenceAuditOnly: true,
    });
  });

  test('fake mastery, paid entitlement, and billing/payment payloads remain blocked', () => {
    const blocked = decideAccountSyncDbPersistenceAccess({
      operationKind: 'apply_write',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      requestContainsFakeMasteryWithoutDelayedRecallEvidence: true,
      requestIncludesPaidEntitlementGrant: true,
      requestIncludesBillingPaymentState: true,
    });
    const reviewState = expectTable('account_review_state');

    expect(blocked.ok).toBe(false);
    expect(blocked.failureReasons).toEqual(
      expect.arrayContaining([
        'fake_mastery_not_accepted',
        'paid_entitlement_outside_sync',
        'billing_payment_outside_sync',
      ])
    );
    expect(blocked).toMatchObject({
      grantsPaidEntitlement: false,
      persistsBillingPaymentState: false,
      acceptsFakeMastery: false,
      mutationAllowed: false,
    });
    expect(reviewState.forbiddenFields).toEqual(
      expect.arrayContaining([
        'importedLocalMasteryLabel',
        'unsupportedMasteredState',
        'paidEntitlement',
        'billingPayload',
        'paymentPayload',
      ])
    );
    expect(ACCOUNT_SYNC_DB_TRANSACTION_POLICY).toMatchObject({
      fakeLocalMasteryCanBecomeServerMastery: false,
      paidEntitlementPersistedBySyncStorage: false,
      billingPaymentCheckoutSubscriptionPersistedBySyncStorage: false,
    });
  });

  test('audit summaries forbid raw payloads, provider tokens, production secrets, and full account state', () => {
    const auditSummary = expectTable('account_sync_audit_summaries');
    const digestRead = decideAccountSyncDbPersistenceAccess({
      operationKind: 'read_digest',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
      boundedOwnerOnlyRead: true,
    });
    const auditReadWithoutBound = decideAccountSyncDbPersistenceAccess({
      operationKind: 'read_audit',
      ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
      ownerDerivedFromAuthenticatedServerSession: true,
    });

    expect(auditSummary.forbiddenFields).toEqual(
      expect.arrayContaining([
        'rawGuestSnapshot',
        'rawRequestBody',
        'providerToken',
        'productionSecret',
        'fullAccountState',
        'billingPayload',
        'paymentPayload',
        'paidEntitlement',
      ])
    );
    expect(ACCOUNT_SYNC_DB_PRIVACY_POLICY).toMatchObject({
      auditSummariesRedactedOnly: true,
      digestReadsOwnerOnlyAndBounded: true,
      auditReadsOwnerOnlyAndBounded: true,
      fullAccountStateAuditStorageAllowed: false,
      rawPayloadStorageAllowed: false,
    });
    expect(digestRead).toMatchObject({
      ok: true,
      status: 'accepted',
      boundedOwnerOnlyReadRequired: true,
    });
    expect(auditReadWithoutBound.ok).toBe(false);
    expect(auditReadWithoutBound.failureReasons).toContain(
      'owner_only_bounded_access_required'
    );
  });

  test('final verdict remains design_only and points to runtime validator selection next', () => {
    expect(ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD).toMatchObject({
      decisionStatus: 'design_only_not_implementation_ready',
      finalVerdict: 'design_only',
      implementationReady: false,
      nextStep: {
        prNumber: 67,
        title: 'Runtime validator selection and dependency decision',
        docsContractsTestsOnly: true,
        realApiRouteImplementationRecommended: false,
      },
    });
    expect(manualQAIds()).toEqual(ACCOUNT_SYNC_DB_EXPECTED_MANUAL_QA_IDS);

    for (const gate of ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.implementationGates) {
      expect(gate).toMatchObject({
        requiredBeforeRealRoutes: true,
        blocksRealApiRouteImplementation: true,
      });
    }
  });

  test('no actual API routes, route handlers, middleware, schema, or migration files are created', () => {
    for (const relativePath of [
      ...ACCOUNT_SYNC_DB_FORBIDDEN_ACTUAL_ROUTE_PATHS,
      ...ACCOUNT_SYNC_DB_FORBIDDEN_SCHEMA_AND_MIGRATION_PATHS,
    ].flatMap((path) =>
      path === 'src/app/api/account/sync' || path === 'src/app/api/account'
        ? ['src/app/api/account/sync/audit']
        : [path]
    )) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('db persistence decision module files contain no forbidden integrations or runtime access', () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\b/,
      /\blocalStorage\b/,
      /\bprocess\.env\b/,
      /from ['"]zod/,
      /from ['"]yup/,
      /from ['"]valibot/,
      /from ['"]ajv/,
      /from ['"]@supabase\//,
      /from ['"]@neondatabase\//,
      /from ['"]@vercel\/postgres/,
      /from ['"]firebase/,
      /from ['"]@firebase\//,
      /from ['"]prisma/,
      /from ['"]@prisma\//,
      /from ['"]drizzle/,
      /from ['"]drizzle-orm/,
      /from ['"]pg/,
      /from ['"]postgres/,
      /from ['"]mysql/,
      /from ['"]sqlite/,
      /from ['"]@clerk\//,
      /from ['"]@auth\//,
      /from ['"]next-auth/,
      /from ['"]better-auth/,
      /from ['"]stripe/,
      /from ['"]paddle/,
      /from ['"]@sentry\//,
      /from ['"]posthog/,
      /from ['"]@datadog\//,
      /from ['"]newrelic/,
      /from ['"]winston/,
      /from ['"]pino/,
      /\bcreateRouteHandler\b/,
    ];

    for (const relativePath of ACCOUNT_SYNC_DB_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('db persistence decision contract is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decideAccountSyncDbPersistenceAccess({
        operationKind: 'read_digest',
        ownerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
        targetOwnerAccountId: ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID,
        ownerDerivedFromAuthenticatedServerSession: true,
        boundedOwnerOnlyRead: true,
      });

      return {
        candidateCount: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.candidates.length,
        tableGroupCount: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.tableDesigns.length,
        decisionStatus: ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD.decisionStatus,
        dbProviderSdkAllowed: ACCOUNT_SYNC_DB_SAFETY_SCOPE.dbProviderSdkAllowed,
        readAccepted: decision.ok,
      };
    });

    expect(value).toEqual({
      candidateCount: ACCOUNT_SYNC_DB_EXPECTED_PROVIDER_CANDIDATES.length,
      tableGroupCount: ACCOUNT_SYNC_DB_EXPECTED_TABLE_GROUPS.length,
      decisionStatus: 'design_only_not_implementation_ready',
      dbProviderSdkAllowed: false,
      readAccepted: true,
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and db persistence decision docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_DB_PERSISTENCE_DECISION.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync DB Persistence Decision](docs/ACCOUNT_SYNC_DB_PERSISTENCE_DECISION.md)'
    );
    expect(doc).toContain('Final verdict: `design_only`, not implementation-ready.');
    expect(doc).toContain('existing account backend first if available');
    expect(doc).toContain('Postgres-compatible relational design');
    expect(doc).toContain('#67 Runtime validator selection and dependency decision');
  });
});
