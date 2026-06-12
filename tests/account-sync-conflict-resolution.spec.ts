import { expect, test } from '@playwright/test';

import {
  findAccountSyncResolution,
  resolveAccountSyncConflicts,
} from '../src/lib/account-persistence/sync-conflicts/conflict-resolver';
import type {
  VlxAccountSyncConflictCategory,
  VlxAccountSyncConflictResolutionPlan,
} from '../src/lib/account-persistence/sync-conflicts/conflict-types';
import {
  DUPLICATE_REVIEW_EVENT_SERVER_STATE,
  DUPLICATE_REVIEW_EVENT_SNAPSHOT,
  DUPLICATE_SAVED_WORD_SERVER_STATE,
  DUPLICATE_SAVED_WORD_SNAPSHOT,
  FAKE_MASTERED_LOCAL_STATE_SNAPSHOT,
  IDEMPOTENCY_CONFLICT_LOCAL_EVENT,
  IDEMPOTENCY_CONFLICT_SERVER_EVENT,
  LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  LOCAL_REVIEW_EVENT_SNAPSHOT,
  LOCAL_WEAK_EVIDENCE_SNAPSHOT,
  PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT,
  SERVER_ONLY_SAVED_WORD_STATE,
  STALE_LOCAL_STRONG_STATE_SNAPSHOT,
  STRONG_SERVER_STATE,
  UPGRADE_INTEREST_ONLY_SNAPSHOT,
  WRONG_AFTER_STRONG_SNAPSHOT,
  createSyncConflictServerState,
  createSyncConflictSnapshot,
} from '../src/lib/account-persistence/sync-conflicts/fixtures';

const accountId = 'sync-conflict-user-1';

function buildPlan(
  snapshot = LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  serverState = createSyncConflictServerState()
) {
  return resolveAccountSyncConflicts({
    accountId,
    localSnapshot: snapshot,
    serverState,
  });
}

function expectResolution(
  plan: VlxAccountSyncConflictResolutionPlan,
  category: VlxAccountSyncConflictCategory
) {
  const resolution = findAccountSyncResolution(plan, category);

  expect(resolution, `Expected ${category} resolution`).toBeDefined();

  if (!resolution) {
    throw new Error(`Expected ${category} resolution`);
  }

  return resolution;
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
        throw new Error('fetch must not be called by conflict resolver');
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

test.describe('account sync conflict resolution contracts', () => {
  test('local-only saved word resolves to import_to_server', () => {
    const plan = buildPlan(LOCAL_ONLY_SAVED_WORD_SNAPSHOT);
    const resolution = expectResolution(plan, 'local_only_saved_word');

    expect(resolution).toMatchObject({
      action: 'import_to_server',
      target: 'saved_word',
      slug: 'dissonance',
      preservesReviewState: true,
    });
  });

  test('server-only saved word resolves to keep_server', () => {
    const plan = buildPlan(createSyncConflictSnapshot(), SERVER_ONLY_SAVED_WORD_STATE);
    const resolution = expectResolution(plan, 'server_only_saved_word');

    expect(resolution).toMatchObject({
      action: 'keep_server',
      target: 'saved_word',
      slug: 'dissonance',
    });
  });

  test('duplicate saved word resolves to no_op_duplicate and does not reset review_state', () => {
    const beforeState = DUPLICATE_SAVED_WORD_SERVER_STATE.reviewState?.dissonance;
    const plan = buildPlan(
      DUPLICATE_SAVED_WORD_SNAPSHOT,
      DUPLICATE_SAVED_WORD_SERVER_STATE
    );
    const resolution = expectResolution(plan, 'duplicate_saved_word');

    expect(resolution).toMatchObject({
      action: 'no_op_duplicate',
      target: 'saved_word',
      slug: 'dissonance',
      preservesReviewState: true,
    });
    expect(plan.resolutions.some((item) => item.action === 'import_to_server')).toBe(false);
    expect(DUPLICATE_SAVED_WORD_SERVER_STATE.reviewState?.dissonance).toEqual(
      beforeState
    );
  });

  test('local review event not on server resolves to merge_event_evidence', () => {
    const plan = buildPlan(LOCAL_REVIEW_EVENT_SNAPSHOT);
    const resolution = expectResolution(plan, 'local_review_event_not_on_server');

    expect(resolution).toMatchObject({
      action: 'merge_event_evidence',
      target: 'review_event',
      eventId: 'event-local-new',
    });
    expect(plan.summary.merge_event_evidence).toBe(1);
  });

  test('duplicate review event resolves to no_op_duplicate', () => {
    const plan = buildPlan(
      DUPLICATE_REVIEW_EVENT_SNAPSHOT,
      DUPLICATE_REVIEW_EVENT_SERVER_STATE
    );
    const resolution = expectResolution(plan, 'duplicate_review_event');

    expect(resolution).toMatchObject({
      action: 'no_op_duplicate',
      target: 'review_event',
      eventId: 'event-duplicate',
    });
  });

  test('reused idempotencyKey with different payload resolves to reject_blocked', () => {
    const plan = buildPlan(
      createSyncConflictSnapshot({
        snapshotId: 'idempotency-conflict-local',
        reviewEvents: [IDEMPOTENCY_CONFLICT_LOCAL_EVENT],
      }),
      createSyncConflictServerState({
        reviewEvents: [IDEMPOTENCY_CONFLICT_SERVER_EVENT],
      })
    );
    const resolution = expectResolution(plan, 'idempotency_key_payload_conflict');

    expect(resolution).toMatchObject({
      action: 'reject_blocked',
      target: 'review_event',
      idempotencyKey: 'idem-reused',
    });
    expect(plan.status).toBe('blocked');
  });

  test('local weak evidence is preserved over stronger-looking stale server state', () => {
    const plan = buildPlan(LOCAL_WEAK_EVIDENCE_SNAPSHOT, STRONG_SERVER_STATE);
    const resolution = expectResolution(plan, 'local_weaker_than_server');

    expect(resolution).toMatchObject({
      action: 'recompute_from_events',
      target: 'review_state',
      slug: 'dissonance',
      preservesWeakEvidence: true,
    });
    expect(resolution.proposedReviewState).toMatchObject({
      mastery: 'Weak',
      wrong: 3,
    });
    expect(resolution.proposedReviewState?.weakScore).toBeGreaterThan(0);
  });

  test('server stronger state is preserved if local state has no supporting events', () => {
    const plan = buildPlan(STALE_LOCAL_STRONG_STATE_SNAPSHOT, STRONG_SERVER_STATE);
    const resolution = expectResolution(plan, 'server_stronger_than_local');

    expect(resolution).toMatchObject({
      action: 'keep_server',
      target: 'review_state',
      slug: 'dissonance',
      localEvidenceCount: 0,
    });
  });

  test('wrong local event can regress previously strong server state through recompute_from_events', () => {
    const plan = buildPlan(WRONG_AFTER_STRONG_SNAPSHOT, STRONG_SERVER_STATE);
    const resolution = expectResolution(plan, 'local_weaker_than_server');
    const serverState = STRONG_SERVER_STATE.reviewState?.dissonance;

    expect(resolution.action).toBe('recompute_from_events');
    expect(serverState).toBeDefined();

    if (!serverState || !resolution.proposedReviewState) {
      throw new Error('Expected server and proposed review states');
    }

    expect(resolution.proposedReviewState.box).toBeLessThan(serverState.box);
    expect(['Learning', 'Weak']).toContain(resolution.proposedReviewState.mastery);
    expect(resolution.proposedReviewState.wrong).toBe(1);
  });

  test('fake local Mastered state without enough review events is blocked', () => {
    const plan = buildPlan(FAKE_MASTERED_LOCAL_STATE_SNAPSHOT);
    const resolution = expectResolution(plan, 'fake_mastery_risk');

    expect(['reject_blocked', 'skip_audit_only']).toContain(resolution.action);
    expect(resolution.importsLocalMasteryLabel).toBe(false);
    expect(plan.status).toBe('blocked');
  });

  test('pack progress without events is skip_audit_only', () => {
    const plan = buildPlan(PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT);
    const resolution = expectResolution(plan, 'pack_progress_without_event_evidence');

    expect(resolution).toMatchObject({
      action: 'skip_audit_only',
      target: 'pack_progress',
      packId: 'academic-vocabulary',
    });
  });

  test('upgrade interest is attribution_only and never grants entitlement', () => {
    const plan = buildPlan(UPGRADE_INTEREST_ONLY_SNAPSHOT);
    const resolution = expectResolution(plan, 'upgrade_interest_attribution_only');

    expect(resolution).toMatchObject({
      action: 'attribution_only',
      target: 'upgrade_interest',
      grantsPaidEntitlement: false,
    });
    expect(plan.grantsPaidEntitlement).toBe(false);
    expect(plan.paidEntitlementPolicy).toBe('never_grant_from_conflict_resolution');
  });

  test('resolver does not access fetch, localStorage, process env, auth, db, or payment surfaces', () => {
    let plan: VlxAccountSyncConflictResolutionPlan | undefined;
    const sideEffects = withNoExternalSideEffects(() => {
      plan = buildPlan(LOCAL_ONLY_SAVED_WORD_SNAPSHOT);
    });

    expect(sideEffects).toEqual({
      fetchAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false,
      providerSurfaceAccessed: false,
    });
    expect(plan).toMatchObject({
      mutatesRuntimeStorage: false,
      callsNetwork: false,
      readsLocalStorage: false,
      readsProcessEnv: false,
      importsAuthProviderSdk: false,
      importsDatabaseSdk: false,
      importsPaymentSdk: false,
      grantsPaidEntitlement: false,
    });
  });
});
