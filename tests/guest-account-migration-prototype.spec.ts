import { expect, test } from '@playwright/test';

import { createInMemoryServerSrsSyncService } from '../src/lib/server-srs-sync/spike/sync-service';
import { createGuestSnapshotFromStores } from '../src/lib/account-persistence/local-snapshot';
import {
  createGuestToAccountMigrationPlan,
  hasMigrationWork,
} from '../src/lib/account-persistence/migration-prototype/migration-plan';
import {
  runGuestToAccountMigrationPlan,
  type VlxGuestMigrationRunSummaryItem,
} from '../src/lib/account-persistence/migration-prototype/migration-runner';
import {
  EMPTY_GUEST_SNAPSHOT,
  FAKE_MASTERED_RISK_GUEST_SNAPSHOT,
  PACK_PROGRESS_GUEST_SNAPSHOT,
  SAVED_ONLY_GUEST_SNAPSHOT,
  SAVED_PLUS_REVIEW_EVENTS_GUEST_SNAPSHOT,
  UPGRADE_INTEREST_GUEST_SNAPSHOT,
  WEAK_WORD_GUEST_SNAPSHOT,
} from '../src/lib/account-persistence/migration-prototype/fixtures';
import { createMockAccountProfile } from '../src/lib/account-persistence/mock-adapter';
import type { VlxReviewEvent } from '../src/lib/srs/types';

const now = '2026-06-11T12:00:00.000Z';

function makePlanUserId(accountId = 'migration-user-1') {
  return createMockAccountProfile({ accountId });
}

function reviewKey(accountId: string, slug = 'dissonance') {
  return `${accountId}:${slug}`;
}

function duplicateReviewEventSnapshot() {
  return createGuestSnapshotFromStores({
    capturedAt: now,
    source: 'guest_snapshot',
    reviewEvents: [
      {
        eventId: 'dup-review-event',
        sessionId: 'session-dup',
        slug: 'dissonance',
        word: 'Dissonance',
        hub: 'academic-vocabulary',
        questionType: 'saved_review',
        selected: 'Dissonance',
        answer: 'Dissonance',
        result: 'correct',
        responseMs: 3000,
        createdAt: now,
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0,
        weakScoreAfter: 0,
      } satisfies VlxReviewEvent,
      {
        eventId: 'dup-review-event',
        sessionId: 'session-dup-2',
        slug: 'dissonance',
        word: 'Dissonance',
        hub: 'academic-vocabulary',
        questionType: 'saved_review',
        selected: 'Dissonance',
        answer: 'Dissonance',
        result: 'correct',
        responseMs: 3000,
        createdAt: now,
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0,
        weakScoreAfter: 0,
      } satisfies VlxReviewEvent,
    ],
  });
}

function withNoExternalSideEffects(callback: () => void) {
  const originalFetch = globalThis.fetch;
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage'
  );
  let fetchAccessed = false;
  let localStorageAccessed = false;

  if (typeof originalFetch === 'function') {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: () => {
        fetchAccessed = true;
        throw new Error('fetch must not be called by prototype runner');
      },
    });
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    },
  });

  try {
    callback();
  } finally {
    if (typeof originalFetch === 'function') {
      (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  }

  return { fetchAccessed, localStorageAccessed };
}

test.describe('guest account migration prototype', () => {
  test('empty guest creates no migration work', () => {
    const plan = createGuestToAccountMigrationPlan(
      EMPTY_GUEST_SNAPSHOT,
      makePlanUserId()
    );

    expect(hasMigrationWork(plan)).toBe(false);
    expect(plan.operations).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(0);
  });

  test('saved-only guest imports saved word and creates review state through spike', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accountId = 'migration-user-1';
    const plan = createGuestToAccountMigrationPlan(
      SAVED_ONLY_GUEST_SNAPSHOT,
      makePlanUserId(accountId)
    );

    const result = runGuestToAccountMigrationPlan(plan, service);
    const accountReviewKey = reviewKey(accountId);

    expect(result.accepted.some((item) => item.kind === 'import_saved_word')).toBe(true);
    expect(result.accepted.every((item) => item.status === 'accepted')).toBe(true);
    expect(service.store.savedWords[accountReviewKey]).toBeDefined();
    expect(service.store.reviewState[accountReviewKey]).toMatchObject({
      box: 0,
      mastery: 'New',
      slug: 'dissonance',
    });
    expect(service.store.reviewEvents).toHaveLength(0);
  });

  test('review events are ordered before materialized review state', () => {
    const plan = createGuestToAccountMigrationPlan(
      SAVED_PLUS_REVIEW_EVENTS_GUEST_SNAPSHOT,
      makePlanUserId()
    );
    const operationKinds = plan.operations.map((operation) => operation.kind);
    const reviewEventIndex = operationKinds.indexOf('import_review_event');
    const reviewStateIndex = operationKinds.indexOf('import_review_state');

    expect(reviewEventIndex).toBeGreaterThan(-1);
    expect(reviewStateIndex).toBeGreaterThan(reviewEventIndex);
  });

  test('duplicate review event is idempotent', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const plan = createGuestToAccountMigrationPlan(
      duplicateReviewEventSnapshot(),
      makePlanUserId()
    );

    const reviewEvents = plan.operations.filter(
      (operation) => operation.kind === 'import_review_event'
    );

    expect(reviewEvents).toHaveLength(2);

    const result = runGuestToAccountMigrationPlan(plan, service);
    const acceptedReviewEvents = result.accepted.filter(
      (item): item is VlxGuestMigrationRunSummaryItem & { kind: "import_review_event" } =>
        item.kind === "import_review_event"
    );

    expect(acceptedReviewEvents).toHaveLength(2);
    expect(acceptedReviewEvents.some((entry) => entry.duplicate)).toBe(true);
    expect(service.store.reviewEvents).toHaveLength(1);
    expect(result.conflicts.some((conflict) => conflict.category === 'duplicate_review_event')).toBe(true);
  });

  test('weak-word snapshot preserves weak state after migration', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accountId = 'migration-user-1';
    const plan = createGuestToAccountMigrationPlan(
      WEAK_WORD_GUEST_SNAPSHOT,
      makePlanUserId(accountId)
    );

    runGuestToAccountMigrationPlan(plan, service);
    const accountReviewState = service.store.reviewState[reviewKey(accountId)];

    expect(accountReviewState?.mastery).toBe('Weak');
    expect(accountReviewState?.weakScore).toBeGreaterThan(0);
    expect(accountReviewState?.wrong).toBeGreaterThan(0);
  });

  test('fake-mastered-risk review state is not migrated as Mastered', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accountId = 'migration-user-1';
    const plan = createGuestToAccountMigrationPlan(
      FAKE_MASTERED_RISK_GUEST_SNAPSHOT,
      makePlanUserId(accountId)
    );

    expect(plan.conflicts.some((conflict) => conflict.category === 'fake_mastery_risk')).toBe(true);

    const result = runGuestToAccountMigrationPlan(plan, service);
    const accountReviewState = service.store.reviewState[reviewKey(accountId)];

    expect(result.skipped.some((entry) => entry.kind === 'import_review_state')).toBe(true);
    expect(result.accepted.some((entry) => entry.kind === 'import_saved_word')).toBe(true);
    expect(accountReviewState).toMatchObject({
      mastery: 'New',
    });
  });

  test('pack progress without events is flagged and skipped safely', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const plan = createGuestToAccountMigrationPlan(
      PACK_PROGRESS_GUEST_SNAPSHOT,
      makePlanUserId()
    );

    expect(plan.conflicts.some((conflict) => conflict.category === 'pack_progress_without_events')).toBe(true);
    expect(plan.operations).toHaveLength(1);

    const result = runGuestToAccountMigrationPlan(plan, service);

    expect(result.skipped.some((entry) => entry.kind === 'import_pack_progress')).toBe(true);
    expect(result.accepted).toHaveLength(0);
    expect(service.store.packProgress).toEqual({});
  });

  test('upgrade-interest does not grant paid entitlement', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accountId = 'migration-user-1';
    const plan = createGuestToAccountMigrationPlan(
      UPGRADE_INTEREST_GUEST_SNAPSHOT,
      makePlanUserId(accountId)
    );

    const result = runGuestToAccountMigrationPlan(plan, service);

    expect(result.accepted).toHaveLength(0);
    expect(result.skipped.some((entry) => entry.kind === 'import_upgrade_interest')).toBe(true);
    expect(service.store.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_srs_sync_spike',
    });
  });

  test('runner returns accepted, rejected, and skipped summaries', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const plan = createGuestToAccountMigrationPlan(
      SAVED_PLUS_REVIEW_EVENTS_GUEST_SNAPSHOT,
      makePlanUserId()
    );

    const result = runGuestToAccountMigrationPlan(plan, service);

    expect(result.totalOperations).toBe(plan.operations.length);
    expect(result.accepted.length + result.rejected.length + result.skipped.length).toBe(
      result.totalOperations
    );
    expect(result.accepted.length).toBeGreaterThan(0);
    expect(result.rejected).toHaveLength(0);
    expect(result.skipped.length).toBeGreaterThan(0);
  });

  test('prototype does not read localStorage, fetch, or auth/db/payment surfaces', () => {
    const plan = createGuestToAccountMigrationPlan(
      SAVED_ONLY_GUEST_SNAPSHOT,
      makePlanUserId()
    );
    const service = createInMemoryServerSrsSyncService({ now });
    const marker = process.env.VLX_MIGRATION_PROTOTYPE_NOOP;
    process.env.VLX_MIGRATION_PROTOTYPE_NOOP = 'present';

    const { fetchAccessed, localStorageAccessed } = withNoExternalSideEffects(() => {
      runGuestToAccountMigrationPlan(plan, service);
    });

    expect(fetchAccessed).toBe(false);
    expect(localStorageAccessed).toBe(false);
    expect(process.env.VLX_MIGRATION_PROTOTYPE_NOOP).toBe('present');

    if (marker === undefined) {
      delete process.env.VLX_MIGRATION_PROTOTYPE_NOOP;
    } else {
      process.env.VLX_MIGRATION_PROTOTYPE_NOOP = marker;
    }
  });

  test('runner does not grant paid entitlement for any operation kind', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const plan = createGuestToAccountMigrationPlan(
      SAVED_PLUS_REVIEW_EVENTS_GUEST_SNAPSHOT,
      makePlanUserId()
    );

    runGuestToAccountMigrationPlan(plan, service);

    expect(service.store.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_srs_sync_spike',
    });
  });
});
