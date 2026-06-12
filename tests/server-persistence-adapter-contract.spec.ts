import { expect, test } from '@playwright/test';

import {
  VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED,
  type VlxServerPersistenceReasonCode,
  type VlxServerPersistenceResult,
} from '../src/lib/account-persistence/server-adapter/adapter-contract';
import {
  createInMemoryServerPersistenceAccountState,
  createInMemoryServerPersistenceAdapter,
  createInMemoryServerPersistenceStore,
} from '../src/lib/account-persistence/server-adapter/in-memory-adapter';
import {
  SERVER_PERSISTENCE_ADAPTER_ACCOUNT_ID,
  SERVER_PERSISTENCE_ADAPTER_FIXTURE_NOW,
  createServerPersistenceResolutionPlanInput,
  makeServerPersistenceFixtureReviewEvent,
  makeServerPersistenceFixtureReviewState,
  makeServerPersistenceFixtureSavedWord,
} from '../src/lib/account-persistence/server-adapter/fixtures';
import {
  DUPLICATE_SAVED_WORD_SNAPSHOT,
  FAKE_MASTERED_LOCAL_STATE_SNAPSHOT,
  LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  LOCAL_REVIEW_EVENT_SNAPSHOT,
  PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT,
  UPGRADE_INTEREST_ONLY_SNAPSHOT,
  WRONG_AFTER_STRONG_SNAPSHOT,
} from '../src/lib/account-persistence/sync-conflicts/fixtures';

const accountId = SERVER_PERSISTENCE_ADAPTER_ACCOUNT_ID;
const now = SERVER_PERSISTENCE_ADAPTER_FIXTURE_NOW;

function expectOk<TData>(result: VlxServerPersistenceResult<TData>) {
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  expect(result).toMatchObject({
    callsNetwork: false,
    readsLocalStorage: false,
    readsProcessEnv: false,
    importsAuthProviderSdk: false,
    importsDatabaseSdk: false,
    importsPaymentSdk: false,
    grantsPaidEntitlement: false,
  });

  return result.data;
}

function expectError<TData>(
  result: VlxServerPersistenceResult<TData>,
  code: VlxServerPersistenceReasonCode
) {
  expect(result.ok).toBe(false);

  if (result.ok) {
    throw new Error('Expected server persistence adapter result to fail.');
  }

  expect(result.error).toMatchObject({
    code,
    retryable: false,
  });
  expect(result.error.message).toBeTruthy();
  expect(result.error.metadata ?? {}).toBeDefined();

  return result.error;
}

function snapshotStore(store: unknown) {
  return JSON.stringify(store);
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
        throw new Error('fetch must not be called by server persistence adapter');
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

test.describe('server persistence adapter contract', () => {
  test('loads an empty account state deterministically', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });

    const state = expectOk(adapter.loadAccountSyncServerState(accountId));

    expect(VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED).toBe(false);
    expect(adapter.enabled).toBe(false);
    expect(adapter.adapterStatus).toBe('disabled_mock_only');
    expect(state).toMatchObject({
      accountId,
      capturedAt: now,
      syncCursor: 'server-persistence-adapter-0',
      savedWords: {},
      reviewState: {},
      reviewEvents: [],
      packProgress: {},
      upgradeInterest: [],
      entitlement: {
        paid: false,
        source: 'not_in_server_persistence_adapter',
      },
    });
    expect(adapter.store.accounts[accountId]).toBeUndefined();
  });

  test('previews a resolution plan without mutating in-memory state', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
      accountId,
    });
    const before = snapshotStore(adapter.store);

    const preview = expectOk(adapter.previewApplyAccountSyncResolutionPlan(input));

    expect(preview).toMatchObject({
      planId: input.plan.planId,
      accountId,
      canApply: true,
      mutatesOnPreview: false,
    });
    expect(preview.acceptedResolutionIds).toHaveLength(1);
    expect(snapshotStore(adapter.store)).toBe(before);
  });

  test('applying local_only_saved_word records saved word exactly once', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
      accountId,
    });

    expectOk(adapter.applyAccountSyncResolutionPlan(input));
    expectOk(adapter.applyAccountSyncResolutionPlan(input));

    const account = adapter.store.accounts[accountId];

    expect(Object.keys(account.savedWords)).toEqual(['dissonance']);
    expect(account.savedWords.dissonance.word).toBe('Dissonance');
    expect(account.reviewState.dissonance).toMatchObject({
      box: 0,
      mastery: 'New',
      correct: 0,
      wrong: 0,
    });
  });

  test('applying duplicate_saved_word does not reset existing review_state', () => {
    const existingReviewState = makeServerPersistenceFixtureReviewState({
      box: 3,
      mastery: 'Strong',
      correct: 3,
      wrong: 0,
      streakCorrect: 3,
      lastReviewedAt: now,
      updatedAt: now,
    });
    const store = createInMemoryServerPersistenceStore({
      accounts: {
        [accountId]: createInMemoryServerPersistenceAccountState({
          accountId,
          capturedAt: now,
          savedWords: {
            dissonance: makeServerPersistenceFixtureSavedWord({
              savedAt: '2026-06-10T12:00:00.000Z',
            }),
          },
          reviewState: {
            dissonance: existingReviewState,
          },
        }),
      },
    });
    const adapter = createInMemoryServerPersistenceAdapter({ now, store });
    const serverState = expectOk(adapter.loadAccountSyncServerState(accountId));
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: DUPLICATE_SAVED_WORD_SNAPSHOT,
      serverState,
      accountId,
    });

    const result = expectOk(adapter.applyAccountSyncResolutionPlan(input));

    expect(result.skipped).toContainEqual(
      expect.objectContaining({
        category: 'duplicate_saved_word',
        status: 'duplicate_noop',
      })
    );
    expect(store.accounts[accountId].reviewState.dissonance).toEqual(
      existingReviewState
    );
  });

  test('applying local_review_event_not_on_server records event evidence and recomputes review_state', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: LOCAL_REVIEW_EVENT_SNAPSHOT,
      accountId,
    });

    const result = expectOk(adapter.applyAccountSyncResolutionPlan(input));
    const account = adapter.store.accounts[accountId];

    expect(result.accepted).toContainEqual(
      expect.objectContaining({
        category: 'local_review_event_not_on_server',
        status: 'accepted',
      })
    );
    expect(account.reviewEvents.map((event) => event.eventId)).toEqual([
      'event-local-new',
    ]);
    expect(account.reviewState.dissonance).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
    });
  });

  test('re-applying the same review event idempotencyKey does not advance SRS twice', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: LOCAL_REVIEW_EVENT_SNAPSHOT,
      accountId,
    });

    expectOk(adapter.applyAccountSyncResolutionPlan(input));
    expectOk(adapter.applyAccountSyncResolutionPlan(input));

    const account = adapter.store.accounts[accountId];

    expect(account.reviewEvents).toHaveLength(1);
    expect(account.reviewState.dissonance).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
    expect(account.dailyStats['2026-06-11']).toMatchObject({
      reviewed: 1,
      correct: 1,
      wrong: 0,
      derivedFromEventIds: ['event-local-new'],
    });
  });

  test('reusing the same idempotencyKey with a different payload is rejected', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const firstEvent = makeServerPersistenceFixtureReviewEvent({
      eventId: 'event-idempotency-original',
    });
    const conflictingEvent = makeServerPersistenceFixtureReviewEvent({
      eventId: 'event-idempotency-conflict',
      result: 'wrong',
      selected: 'Harmony',
      responseMs: 12000,
    });

    expectOk(adapter.recordReviewEvent(accountId, firstEvent, 'idem-reused'));
    const error = expectError(
      adapter.recordReviewEvent(accountId, conflictingEvent, 'idem-reused'),
      'idempotency_payload_conflict'
    );

    expect(error.metadata).toMatchObject({
      idempotencyKey: 'idem-reused',
    });
    expect(adapter.store.accounts[accountId].reviewEvents).toHaveLength(1);
    expect(adapter.store.accounts[accountId].reviewState.dissonance).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
  });

  test('review-event retry does not double-count daily_stats or pack_progress', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const reviewEvent = makeServerPersistenceFixtureReviewEvent({
      eventId: 'event-pack-review',
      idempotencyKey: 'idem-pack-review',
      packId: 'academic-vocabulary',
    });

    expectOk(adapter.recordReviewEvent(accountId, reviewEvent, 'idem-pack-review'));
    expectOk(adapter.recordReviewEvent(accountId, reviewEvent, 'idem-pack-review'));

    const account = adapter.store.accounts[accountId];

    expect(account.reviewEvents).toHaveLength(1);
    expect(account.dailyStats['2026-06-11']).toMatchObject({
      reviewed: 1,
      correct: 1,
      wrong: 0,
      derivedFromEventIds: ['event-pack-review'],
    });
    expect(account.packProgress['academic-vocabulary']).toMatchObject({
      reviewedCount: 1,
      correctCount: 1,
      derivedFromEventIds: ['event-pack-review'],
      idempotencyKeys: ['idem-pack-review'],
    });
  });

  test('wrong local review evidence can regress a stronger server state through recompute_from_events', () => {
    const strongState = makeServerPersistenceFixtureReviewState({
      box: 3,
      mastery: 'Strong',
      correct: 3,
      wrong: 0,
      streakCorrect: 3,
      weakScore: 0,
      lastReviewedAt: '2026-06-11T11:30:00.000Z',
      updatedAt: '2026-06-11T11:30:00.000Z',
    });
    const store = createInMemoryServerPersistenceStore({
      accounts: {
        [accountId]: createInMemoryServerPersistenceAccountState({
          accountId,
          capturedAt: now,
          reviewState: {
            dissonance: strongState,
          },
        }),
      },
    });
    const adapter = createInMemoryServerPersistenceAdapter({ now, store });
    const serverState = expectOk(adapter.loadAccountSyncServerState(accountId));
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: WRONG_AFTER_STRONG_SNAPSHOT,
      serverState,
      accountId,
    });

    expectOk(adapter.applyAccountSyncResolutionPlan(input));

    const regressedState = store.accounts[accountId].reviewState.dissonance;

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
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: FAKE_MASTERED_LOCAL_STATE_SNAPSHOT,
      accountId,
    });
    const before = snapshotStore(adapter.store);

    expectError(adapter.applyAccountSyncResolutionPlan(input), 'blocked_plan');

    expect(snapshotStore(adapter.store)).toBe(before);
    expect(adapter.store.accounts[accountId]).toBeUndefined();
  });

  test('pack progress without event evidence is skipped audit-only', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT,
      accountId,
    });

    const result = expectOk(adapter.applyAccountSyncResolutionPlan(input));
    const account = adapter.store.accounts[accountId];

    expect(result.skipped).toContainEqual(
      expect.objectContaining({
        category: 'pack_progress_without_event_evidence',
        status: 'audit_only',
      })
    );
    expect(account.packProgress).toEqual({});
    expect(account.auditRecords).toContainEqual(
      expect.objectContaining({
        category: 'pack_progress_without_event_evidence',
        status: 'audit_only',
      })
    );
  });

  test('upgrade_interest is attribution-only and does not grant paid entitlement', () => {
    const adapter = createInMemoryServerPersistenceAdapter({ now });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: UPGRADE_INTEREST_ONLY_SNAPSHOT,
      accountId,
    });

    expectOk(adapter.applyAccountSyncResolutionPlan(input));

    const account = adapter.store.accounts[accountId];

    expect(account.upgradeInterest).toHaveLength(1);
    expect(account.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_persistence_adapter',
    });
  });

  test('blocked plan leaves existing in-memory state unchanged', () => {
    const store = createInMemoryServerPersistenceStore({
      accounts: {
        [accountId]: createInMemoryServerPersistenceAccountState({
          accountId,
          capturedAt: now,
          savedWords: {
            dissonance: makeServerPersistenceFixtureSavedWord(),
          },
        }),
      },
    });
    const adapter = createInMemoryServerPersistenceAdapter({ now, store });
    const input = createServerPersistenceResolutionPlanInput({
      snapshot: FAKE_MASTERED_LOCAL_STATE_SNAPSHOT,
      accountId,
    });
    const before = snapshotStore(store);

    expectError(adapter.applyAccountSyncResolutionPlan(input), 'blocked_plan');

    expect(snapshotStore(store)).toBe(before);
  });

  test('adapter never accesses fetch, localStorage, process.env, provider SDKs, or production surfaces', () => {
    let operationsSucceeded = false;
    const sideEffects = withNoExternalSideEffects(() => {
      const adapter = createInMemoryServerPersistenceAdapter({ now });
      const input = createServerPersistenceResolutionPlanInput({
        snapshot: LOCAL_REVIEW_EVENT_SNAPSHOT,
        accountId,
      });
      const loaded = adapter.loadAccountSyncServerState(accountId);
      const previewed = adapter.previewApplyAccountSyncResolutionPlan(input);
      const applied = adapter.applyAccountSyncResolutionPlan(input);
      const digested = adapter.getAccountStateDigest(accountId);

      operationsSucceeded =
        loaded.ok && previewed.ok && applied.ok && digested.ok;
    });

    expect(operationsSucceeded).toBe(true);
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
  });
});
