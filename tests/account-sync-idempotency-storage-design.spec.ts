import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

import {
  ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN,
  decideAccountSyncIdempotencyStorage,
  getAccountSyncStorageTableDesign,
} from '../src/lib/account-persistence/idempotency-storage/idempotency-storage-design';
import {
  ACCOUNT_SYNC_IDEMPOTENCY_AUDIT_ONLY_PACK_RESULT,
  ACCOUNT_SYNC_IDEMPOTENCY_BLOCKED_COMMIT_RESULT,
  ACCOUNT_SYNC_IDEMPOTENCY_FAKE_MASTERY_RESULT,
  ACCOUNT_SYNC_IDEMPOTENCY_REJECTED_MALFORMED_RESULT,
  ACCOUNT_SYNC_IDEMPOTENCY_REPLAY_COMMIT_RESULT,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CROSS_ACCOUNT_RECORD,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DIFFERENT_FINGERPRINT,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TABLE_NAMES,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TRANSACTION_STEPS,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_ACTUAL_ROUTE_PATHS,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_SCHEMA_PATHS,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY,
  ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
} from '../src/lib/account-persistence/idempotency-storage/fixtures';

const workspaceRoot = process.cwd();

function expectTable(tableName: (typeof ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TABLE_NAMES)[number]) {
  const table = getAccountSyncStorageTableDesign(tableName);

  expect(table, `${tableName} table design`).toBeDefined();

  if (!table) {
    throw new Error(`Missing table design: ${tableName}`);
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
        throw new Error('idempotency storage design must not call network helpers');
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

test.describe('account sync idempotency storage design', () => {
  test('design requires an idempotency key for apply', () => {
    const decision = decideAccountSyncIdempotencyStorage({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      idempotencyKey: '',
      requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
    });

    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.idempotencyPolicy).toMatchObject({
      applyRouteRequiresIdempotencyKey: true,
    });
    expect(decision).toEqual({
      kind: 'missing_idempotency_key',
      status: 'rejected',
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      requiresIdempotencyKey: true,
      mutationAllowed: false,
      reason: 'missing_idempotency_key',
    });
  });

  test('idempotency key is scoped to the authenticated account owner', () => {
    const decision = decideAccountSyncIdempotencyStorage({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
      requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
    });

    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY).toMatchObject({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      requiredForApply: true,
      scope: 'authenticated_account_owner',
      lookupScope: 'account_owner_id_route_id_idempotency_key',
      reusableAcrossAccounts: false,
    });
    expect(decision).toMatchObject({
      kind: 'record_new_request',
      accountScopedKey: true,
      mutationAllowed: true,
    });
  });

  test('same key and same fingerprint replays the original result safely', () => {
    const decision = decideAccountSyncIdempotencyStorage({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
      requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
      existingRecord: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD,
    });

    expect(decision).toMatchObject({
      kind: 'replay_original_result',
      sameAccount: true,
      sameKey: true,
      sameFingerprint: true,
      replayAllowed: true,
      mutationAllowed: false,
      returnsOriginalOutcomeSummary: true,
      reappliesReviewEvents: false,
      advancesSrsAgain: false,
      duplicateReviewEventsCanAdvanceSrsTwice: false,
    });
  });

  test('same key and different fingerprint is rejected as conflict', () => {
    const decision = decideAccountSyncIdempotencyStorage({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
      requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DIFFERENT_FINGERPRINT,
      existingRecord: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD,
    });

    expect(decision).toMatchObject({
      kind: 'reject_same_key_different_fingerprint',
      status: 'rejected',
      sameAccount: true,
      sameFingerprint: false,
      conflictRejected: true,
      mutationAllowed: false,
      reason: 'same_key_different_fingerprint',
    });
  });

  test('cross-account replay is rejected', () => {
    const decision = decideAccountSyncIdempotencyStorage({
      accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
      routeId: 'apply',
      idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
      requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
      existingRecord: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_CROSS_ACCOUNT_RECORD,
    });

    expect(decision).toMatchObject({
      kind: 'reject_cross_account_replay',
      status: 'rejected',
      sameAccount: false,
      conflictRejected: true,
      mutationAllowed: false,
      crossAccountReplayRejected: true,
      safeToRetryWithNewIdempotencyKey: false,
      reason: 'cross_account_replay',
    });
  });

  test('replay and duplicate review events cannot advance SRS twice', () => {
    expect(ACCOUNT_SYNC_IDEMPOTENCY_REPLAY_COMMIT_RESULT).toMatchObject({
      status: 'replayed',
      learningStateMutated: false,
      replayAdvancedSrs: false,
      duplicateReviewEventAdvancedSrs: false,
      mutationSummary: {
        reviewEventsInserted: 0,
        reviewEventsSkippedAsDuplicate: 1,
        reviewStateRecomputed: 0,
        dailyStatsUpdated: 0,
        packProgressUpdated: 0,
      },
    });
    expect(
      ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.safetyPolicy
        .duplicateReviewEventsCanAdvanceSrsTwice
    ).toBe(false);
  });

  test('blocked and malformed plans do not mutate learning state', () => {
    expect(ACCOUNT_SYNC_IDEMPOTENCY_BLOCKED_COMMIT_RESULT).toMatchObject({
      status: 'blocked_recorded',
      learningStateMutated: false,
      blockedPlanMutatedLearningState: false,
      mutationSummary: {
        reviewEventsInserted: 0,
        reviewStateRecomputed: 0,
        dailyStatsUpdated: 0,
        savedWordsUpdated: 0,
        packProgressUpdated: 0,
        auditSummariesWritten: 1,
      },
    });
    expect(ACCOUNT_SYNC_IDEMPOTENCY_REJECTED_MALFORMED_RESULT).toMatchObject({
      status: 'rejected_rolled_back',
      learningStateMutated: false,
      malformedPayloadCreatedPartialLearningState: false,
      rolledBackOnFailure: true,
    });
  });

  test('storage groups include required designs and privacy fields', () => {
    expect(
      ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.storageGroups.map(
        (group) => group.tableName
      )
    ).toEqual(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TABLE_NAMES);

    for (const tableName of ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TABLE_NAMES) {
      const table = expectTable(tableName);

      expect(table).toMatchObject({
        implementationStatus: 'design_only',
        createsActualTable: false,
      });
      expect(table.requiredFields.length).toBeGreaterThan(0);
      expect(table.forbiddenFields).toEqual(
        expect.arrayContaining([
          'provider_token',
          'production_secret',
          'payment_state',
          'paid_entitlement',
        ])
      );
    }
  });

  test('idempotency records forbid raw snapshots and sensitive payloads', () => {
    const table = expectTable('account_sync_idempotency_records');

    expect(table.requiredFields).toEqual(
      expect.arrayContaining([
        'account_owner_id',
        'route_id',
        'idempotency_key',
        'request_fingerprint',
        'status',
        'outcome_summary',
        'created_at',
        'updated_at',
        'expires_at',
      ])
    );
    expect(table.forbiddenFields).toEqual(
      expect.arrayContaining([
        'raw_guest_snapshot',
        'raw_local_snapshot',
        'raw_request_body',
        'provider_token',
        'production_secret',
      ])
    );
    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD).toMatchObject({
      storesRawGuestSnapshot: false,
      storesSensitivePayload: false,
      storesProviderTokens: false,
      storesProductionSecrets: false,
      storesBillingPaymentState: false,
    });
  });

  test('fake mastery, paid entitlement, billing, and audit-only pack progress remain blocked', () => {
    const reviewStateTable = expectTable('account_review_state');
    const packProgressTable = expectTable('account_pack_progress');

    expect(reviewStateTable.forbiddenFields).toEqual(
      expect.arrayContaining(['imported_local_mastery_label', 'unsupported_mastered_state'])
    );
    expect(ACCOUNT_SYNC_IDEMPOTENCY_FAKE_MASTERY_RESULT).toMatchObject({
      fakeLocalMasteryBecameServerMastery: false,
      grantsPaidEntitlement: false,
      mutatesBillingPaymentState: false,
    });
    expect(ACCOUNT_SYNC_IDEMPOTENCY_AUDIT_ONLY_PACK_RESULT).toMatchObject({
      learningStateMutated: false,
      auditOnlyPackProgressBecameProgress: false,
      mutationSummary: {
        packProgressUpdated: 0,
        auditSummariesWritten: 1,
      },
    });
    expect(packProgressTable.writeBehavior).toContain('audit summaries');
    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.safetyPolicy).toMatchObject({
      fakeLocalMasteryCanBecomeServerMastery: false,
      paidEntitlementGrantedBySyncStorage: false,
      billingPaymentCheckoutSubscriptionOutsideSyncStorage: true,
      auditOnlyPackProgressRemainsAuditOnlyWithoutReviewEvents: true,
    });
  });

  test('transaction boundary includes the required ordered apply steps', () => {
    expect(
      ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY.sequence.map((step) => step.id)
    ).toEqual(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_EXPECTED_TRANSACTION_STEPS);
    expect(ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY).toMatchObject({
      atomicCommitRequired: true,
      partialWritesAllowed: false,
      replayCanMutateLearningState: false,
      blockedPlanCanMutateLearningState: false,
      malformedPayloadCanCreatePartialState: false,
      actualTransactionImplemented: false,
      implementationStatus: 'design_only',
    });
  });

  test('final verdict remains design only with no real implementation', () => {
    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.finalVerdict).toEqual({
      verdict: 'design_only',
      implementationReady: false,
      realApplyRouteRecommended: false,
      nextRecommendedPr: {
        number: 61,
        title: 'Account sync schema validation and payload size limits contract',
        docsContractsTestsOnly: true,
      },
    });
    expect(ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.implementationScope).toEqual({
      docsContractsTestsOnly: true,
      actualDatabaseImplementation: false,
      actualApiRouteImplementation: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      runtimeIntegrationAllowed: false,
      realAuthAllowed: false,
      databaseProviderSdkAllowed: false,
      authProviderSdkAllowed: false,
      paymentProviderSdkAllowed: false,
      networkCallsAllowed: false,
      browserStorageAllowed: false,
      environmentReadsAllowed: false,
    });
  });

  test('no actual DB schema, migration files, routes, handlers, or middleware are created', () => {
    for (const relativePath of [
      ...ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_SCHEMA_PATHS,
      ...ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FORBIDDEN_ACTUAL_ROUTE_PATHS,
    ]) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test('idempotency storage module contains no forbidden integrations or runtime access', () => {
    const moduleFiles = [
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'idempotency-storage',
        'idempotency-storage-design.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'idempotency-storage',
        'fixtures.ts'
      ),
      join(
        workspaceRoot,
        'src',
        'lib',
        'account-persistence',
        'idempotency-storage',
        'README.md'
      ),
    ];
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\b/,
      /\blocalStorage\b/,
      /\bprocess\.env\b/,
      /from ['"]@supabase\//,
      /from ['"]@clerk\//,
      /from ['"]@auth\//,
      /from ['"]next-auth/,
      /from ['"]better-auth/,
      /from ['"]firebase/,
      /from ['"]lucia/,
      /from ['"]passport/,
      /from ['"]prisma/,
      /from ['"]drizzle/,
      /from ['"]mongoose/,
      /from ['"]pg/,
      /from ['"]mysql/,
      /from ['"]stripe/,
      /from ['"]paddle/,
    ];

    for (const filePath of moduleFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${filePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test('idempotency storage design is pure static data and deterministic logic', () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => {
      const decision = decideAccountSyncIdempotencyStorage({
        accountOwnerId: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_OWNER_ACCOUNT_ID,
        routeId: 'apply',
        idempotencyKey: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_KEY.value,
        requestFingerprint: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_FINGERPRINT,
        existingRecord: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_COMMITTED_RECORD,
      });

      return {
        tableCount: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.storageGroups.length,
        transactionStepCount: ACCOUNT_SYNC_APPLY_TRANSACTION_BOUNDARY.sequence.length,
        decisionKind: decision.kind,
        verdict: ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.finalVerdict.verdict,
      };
    });

    expect(value).toEqual({
      tableCount: 7,
      transactionStepCount: 14,
      decisionKind: 'replay_original_result',
      verdict: 'design_only',
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });

  test('README and account sync idempotency storage docs are linked and explicit', () => {
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(
      join(workspaceRoot, 'docs', 'ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.md'),
      'utf8'
    );

    expect(readme).toContain(
      '[Account Sync Idempotency Storage Design](docs/ACCOUNT_SYNC_IDEMPOTENCY_STORAGE_DESIGN.md)'
    );
    expect(doc).toContain('Final verdict: **design_only, not implementation-ready**.');
    expect(doc).toContain('Same account, same key, and same request fingerprint');
    expect(doc).toContain('Cross-account replay is rejected');
    expect(doc).toContain('#61 Account sync schema validation and payload size limits contract');
  });
});
