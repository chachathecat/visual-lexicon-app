import { expect, test } from '@playwright/test';

import {
  runServerPersistenceIntegrationHarness,
  type VlxServerPersistenceIntegrationHarnessReport,
} from '../src/lib/account-persistence/sync-harness/harness';
import {
  DUPLICATE_REVIEW_EVENT_HARNESS_SNAPSHOT,
  DUPLICATE_SAVED_WORD_HARNESS_SNAPSHOT,
  EMPTY_SYNC_HARNESS_SNAPSHOT,
  FAKE_MASTERED_HARNESS_SNAPSHOT,
  IDEMPOTENCY_PAYLOAD_CONFLICT_HARNESS_SNAPSHOT,
  IDEMPOTENT_SAVED_AND_PACK_REVIEW_HARNESS_SNAPSHOT,
  LOCAL_ONLY_SAVED_WORD_HARNESS_SNAPSHOT,
  LOCAL_WEAK_EVIDENCE_HARNESS_SNAPSHOT,
  PACK_PROGRESS_WITHOUT_EVENTS_HARNESS_SNAPSHOT,
  PACK_REVIEW_EVENT_HARNESS_SNAPSHOT,
  SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  UPGRADE_INTEREST_ONLY_HARNESS_SNAPSHOT,
  WRONG_AFTER_STRONG_HARNESS_SNAPSHOT,
  createDuplicateReviewEventHarnessServerState,
  createDuplicateSavedWordHarnessServerState,
  createHarnessInput,
  createIdempotencyPayloadConflictHarnessServerState,
  createStrongReviewStateHarnessServerState,
  createSyncHarnessInitialServerState,
  makeSyncHarnessSavedWord,
} from '../src/lib/account-persistence/sync-harness/fixtures';

function expectPreviewOk(report: VlxServerPersistenceIntegrationHarnessReport) {
  expect(report.previewResult.ok).toBe(true);

  if (!report.previewResult.ok) {
    throw new Error(report.previewResult.error.message);
  }

  return report.previewResult.data;
}

function expectApplyOk(report: VlxServerPersistenceIntegrationHarnessReport) {
  expect(report.applyResult.attempted).toBe(true);

  if (!report.applyResult.attempted) {
    throw new Error(report.applyResult.reason.message);
  }

  expect(report.applyResult.result.ok).toBe(true);

  if (!report.applyResult.result.ok) {
    throw new Error(report.applyResult.result.error.message);
  }

  return report.applyResult.result.data;
}

function expectServerState(report: VlxServerPersistenceIntegrationHarnessReport) {
  expect(report.serverStateAfter).toBeDefined();

  if (!report.serverStateAfter) {
    throw new Error('Expected harness server state after run.');
  }

  return report.serverStateAfter;
}

function snapshotState(state: unknown) {
  return JSON.stringify(state);
}

function withNoExternalSideEffects(callback: () => void) {
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
        throw new Error('fetch must not be called by sync harness');
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
    callback();
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

  return {
    fetchAccessed,
    localStorageAccessed,
    processEnvAccessed,
    providerSurfaceAccessed,
  };
}

test.describe('server persistence integration harness', () => {
  test('empty snapshot produces no writes and a stable digest', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(EMPTY_SYNC_HARNESS_SNAPSHOT)
    );

    expect(report.harnessStatus).toBe('disabled_mock_only');
    expect(report.planStatus).toBe('preview_only');
    expect(expectPreviewOk(report).canApply).toBe(true);
    expectApplyOk(report);
    expect(report.beforeDigest).toEqual(report.afterDigest);
    expect(report.counts).toMatchObject({
      accepted: 0,
      skipped: 0,
      rejected: 0,
      audit: 0,
    });
    expect(expectServerState(report)).toMatchObject({
      savedWords: {},
      reviewState: {},
      reviewEvents: [],
      dailyStats: {},
      packProgress: {},
      upgradeInterest: [],
    });
  });

  test('local-only saved word previews and applies once to the server digest', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(LOCAL_ONLY_SAVED_WORD_HARNESS_SNAPSHOT)
    );
    const application = expectApplyOk(report);
    const account = expectServerState(report);

    expect(expectPreviewOk(report).acceptedResolutionIds).toHaveLength(1);
    expect(application.accepted).toContainEqual(
      expect.objectContaining({
        category: 'local_only_saved_word',
        status: 'accepted',
      })
    );
    expect(report.afterDigest.savedWordSlugs).toEqual(['dissonance']);
    expect(Object.keys(account.savedWords)).toEqual(['dissonance']);
    expect(Object.keys(account.reviewState)).toEqual(['dissonance']);
  });

  test('local review event records evidence and recomputes state, daily stats, and pack progress', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(PACK_REVIEW_EVENT_HARNESS_SNAPSHOT)
    );
    const account = expectServerState(report);

    expectApplyOk(report);
    expect(account.reviewEvents.map((event) => event.eventId)).toEqual([
      'event-harness-pack-review',
    ]);
    expect(account.reviewState.dissonance).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
    });
    expect(account.dailyStats['2026-06-11']).toMatchObject({
      reviewed: 1,
      correct: 1,
      wrong: 0,
      derivedFromEventIds: ['event-harness-pack-review'],
    });
    expect(account.packProgress['academic-vocabulary']).toMatchObject({
      reviewedCount: 1,
      correctCount: 1,
      derivedFromEventIds: ['event-harness-pack-review'],
      idempotencyKeys: ['idem-harness-pack-review'],
    });
  });

  test('re-running the same harness input is idempotent across all derived stores', () => {
    const first = runServerPersistenceIntegrationHarness(
      createHarnessInput(IDEMPOTENT_SAVED_AND_PACK_REVIEW_HARNESS_SNAPSHOT)
    );
    const firstState = expectServerState(first);
    const second = runServerPersistenceIntegrationHarness(
      createHarnessInput(IDEMPOTENT_SAVED_AND_PACK_REVIEW_HARNESS_SNAPSHOT, firstState)
    );
    const account = expectServerState(second);

    expectApplyOk(second);
    expect(Object.keys(account.savedWords)).toEqual(['dissonance']);
    expect(account.reviewEvents.map((event) => event.eventId)).toEqual([
      'event-harness-idempotent-pack-review',
    ]);
    expect(Object.keys(account.dailyStats)).toEqual(['2026-06-11']);
    expect(account.dailyStats['2026-06-11'].derivedFromEventIds).toEqual([
      'event-harness-idempotent-pack-review',
    ]);
    expect(Object.keys(account.packProgress)).toEqual(['academic-vocabulary']);
    expect(account.packProgress['academic-vocabulary']).toMatchObject({
      reviewedCount: 1,
      correctCount: 1,
      derivedFromEventIds: ['event-harness-idempotent-pack-review'],
      idempotencyKeys: ['idem-harness-idempotent-pack-review'],
    });
    expect(second.counts.accepted).toBe(0);
  });

  test('duplicate saved word preserves existing server review_state', () => {
    const initialServerState = createDuplicateSavedWordHarnessServerState();
    const existingReviewState = initialServerState.reviewState.dissonance;
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(DUPLICATE_SAVED_WORD_HARNESS_SNAPSHOT, initialServerState)
    );
    const account = expectServerState(report);

    expectApplyOk(report);
    expect(account.reviewState.dissonance).toEqual(existingReviewState);
    expect(account.savedWords.dissonance.savedAt).toBe('2026-06-10T12:00:00.000Z');
  });

  test('duplicate review event is a no-op duplicate', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(
        DUPLICATE_REVIEW_EVENT_HARNESS_SNAPSHOT,
        createDuplicateReviewEventHarnessServerState()
      )
    );
    const account = expectServerState(report);

    expectApplyOk(report);
    expect(report.plan.summary.no_op_duplicate).toBe(1);
    expect(report.counts.accepted).toBe(0);
    expect(report.counts.skipped).toBe(1);
    expect(account.reviewEvents.map((event) => event.eventId)).toEqual([
      'event-duplicate',
    ]);
  });

  test('same idempotencyKey with different payload is blocked and leaves state unchanged', () => {
    const initialServerState = createIdempotencyPayloadConflictHarnessServerState();
    const before = snapshotState(initialServerState);
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(
        IDEMPOTENCY_PAYLOAD_CONFLICT_HARNESS_SNAPSHOT,
        initialServerState
      )
    );

    expect(report.planStatus).toBe('blocked');
    expect(expectPreviewOk(report).rejectedResolutionIds).toHaveLength(1);
    expect(report.applyResult.attempted).toBe(false);
    expect(report.counts.rejected).toBe(1);
    expect(snapshotState(report.serverStateAfter)).toBe(before);
    expect(report.beforeDigest).toEqual(report.afterDigest);
  });

  test('local weak evidence is preserved against stronger-looking stale state', () => {
    const initialServerState = createStrongReviewStateHarnessServerState();
    const strongState = initialServerState.reviewState.dissonance;
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(LOCAL_WEAK_EVIDENCE_HARNESS_SNAPSHOT, initialServerState)
    );
    const account = expectServerState(report);
    const resolution = report.plan.resolutions.find(
      (item) => item.category === 'local_weaker_than_server'
    );

    expectApplyOk(report);
    expect(resolution).toMatchObject({
      action: 'recompute_from_events',
      preservesWeakEvidence: true,
    });
    expect(account.reviewState.dissonance.wrong).toBe(3);
    expect(account.reviewState.dissonance.weakScore).toBeGreaterThan(
      strongState.weakScore
    );
    expect(['Learning', 'Weak']).toContain(account.reviewState.dissonance.mastery);
  });

  test('wrong local review event can regress strong server review_state', () => {
    const initialServerState = createStrongReviewStateHarnessServerState();
    const strongState = initialServerState.reviewState.dissonance;
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(WRONG_AFTER_STRONG_HARNESS_SNAPSHOT, initialServerState)
    );
    const regressedState = expectServerState(report).reviewState.dissonance;

    expectApplyOk(report);
    expect(regressedState.box).toBeLessThan(strongState.box);
    expect(['Learning', 'Weak']).toContain(regressedState.mastery);
    expect(regressedState).toMatchObject({
      correct: 3,
      wrong: 1,
      streakCorrect: 0,
    });
    expect(regressedState.weakScore).toBeGreaterThan(strongState.weakScore);
  });

  test('fake local Mastered state is blocked and does not create Mastered', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(FAKE_MASTERED_HARNESS_SNAPSHOT)
    );
    const resolution = report.plan.resolutions.find(
      (item) => item.category === 'fake_mastery_risk'
    );

    expect(report.planStatus).toBe('blocked');
    expect(report.applyResult.attempted).toBe(false);
    expect(resolution).toMatchObject({
      action: 'reject_blocked',
      importsLocalMasteryLabel: false,
    });
    expect(report.afterDigest.reviewStateSlugs).toEqual([]);
    expect(report.serverStateAfter).toBeUndefined();
  });

  test('pack progress without review event evidence stays audit-only', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(PACK_PROGRESS_WITHOUT_EVENTS_HARNESS_SNAPSHOT)
    );
    const account = expectServerState(report);

    expectApplyOk(report);
    expect(account.packProgress).toEqual({});
    expect(account.auditRecords).toContainEqual(
      expect.objectContaining({
        category: 'pack_progress_without_event_evidence',
        status: 'audit_only',
      })
    );
    expect(report.counts).toMatchObject({
      skipped: 1,
      audit: 1,
    });
  });

  test('upgrade interest is attribution-only and never grants paid entitlement', () => {
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(UPGRADE_INTEREST_ONLY_HARNESS_SNAPSHOT)
    );
    const account = expectServerState(report);

    expectApplyOk(report);
    expect(account.upgradeInterest).toHaveLength(1);
    expect(account.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_persistence_adapter',
    });
    expect(report.safety.grantsPaidEntitlement).toBe(false);
  });

  test('blocked plan leaves existing server state unchanged', () => {
    const initialServerState = createSyncHarnessInitialServerState({
      savedWords: {
        dissonance: makeSyncHarnessSavedWord(),
      },
    });
    const before = snapshotState(initialServerState);
    const report = runServerPersistenceIntegrationHarness(
      createHarnessInput(FAKE_MASTERED_HARNESS_SNAPSHOT, initialServerState)
    );

    expect(report.planStatus).toBe('blocked');
    expect(report.applyResult.attempted).toBe(false);
    expect(snapshotState(report.serverStateAfter)).toBe(before);
    expect(report.beforeDigest).toEqual(report.afterDigest);
  });

  test('harness never accesses runtime, provider, deployment, or production surfaces', () => {
    let report: VlxServerPersistenceIntegrationHarnessReport | undefined;
    const sideEffects = withNoExternalSideEffects(() => {
      report = runServerPersistenceIntegrationHarness(
        createHarnessInput(PACK_REVIEW_EVENT_HARNESS_SNAPSHOT)
      );
    });

    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
    expect(report?.safety).toMatchObject({
      mutatesRuntimeStorage: false,
      callsNetwork: false,
      readsLocalStorage: false,
      readsProcessEnv: false,
      importsAuthProviderSdk: false,
      importsDatabaseSdk: false,
      importsPaymentSdk: false,
      grantsPaidEntitlement: false,
      mutatesOnPreview: false,
      touchesWebflow: false,
      touchesCloudflare: false,
      touchesVercel: false,
      touchesDns: false,
      touchesProductionData: false,
    });
    expect(report?.accountId).toBe(SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID);
    expect(report?.createdAt).toBe(SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW);
  });
});
