import { expect, test } from '@playwright/test';

import {
  FAKE_MASTERED_RISK_GUEST_SNAPSHOT,
  UPGRADE_INTEREST_GUEST_SNAPSHOT,
} from '../src/lib/account-persistence/migration-prototype/fixtures';
import { createGuestToAccountMigrationPlan } from '../src/lib/account-persistence/migration-prototype/migration-plan';
import { runGuestToAccountMigrationPlan } from '../src/lib/account-persistence/migration-prototype/migration-runner';
import { createMockAccountProfile } from '../src/lib/account-persistence/mock-adapter';
import type {
  VlxSaveWordRequest,
  VlxSubmitReviewEventRequest,
  VlxSyncPendingLocalQueueRequest,
} from '../src/lib/server-srs-sync/contracts';
import { createInMemoryServerSrsSyncService } from '../src/lib/server-srs-sync/spike/sync-service';
import {
  VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
  type VlxPendingLocalQueueItem,
  type VlxServerSrsSyncErrorCode,
  type VlxServerSrsSyncResponse,
} from '../src/lib/server-srs-sync/types';
import type { VlxSavedWord } from '../src/lib/srs/types';

const now = '2026-06-11T12:00:00.000Z';
const userId = 'idempotency-user-1';
const deviceId = 'device-1';
const reviewKey = `${userId}:dissonance`;

type QueueableEnvelope = VlxSaveWordRequest | VlxSubmitReviewEventRequest;

function expectOk<T>(response: VlxServerSrsSyncResponse<T>) {
  expect(response.ok).toBe(true);

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
}

function expectError<T>(
  response: VlxServerSrsSyncResponse<T>,
  code: VlxServerSrsSyncErrorCode
) {
  expect(response.ok).toBe(false);

  if (response.ok) {
    throw new Error('Expected server SRS sync response to fail.');
  }

  expect(response.error.code).toBe(code);
  expect(response.error.retryable).toBe(false);

  return response.error;
}

function makeSavedWord(overrides: Partial<VlxSavedWord> = {}): VlxSavedWord {
  return {
    slug: 'dissonance',
    word: 'Dissonance',
    image: 'https://cdn.visuallexicon.org/images/dissonance.webp',
    definition: 'A clash between sounds, ideas, or feelings.',
    hub: 'academic-vocabulary',
    source: 'word_page',
    savedAt: now,
    ...overrides,
  };
}

function makeSaveEnvelope(
  id: string,
  savedWord: VlxSavedWord = makeSavedWord(),
  overrides: Partial<Omit<VlxSaveWordRequest, 'operation' | 'payloadVersion' | 'payload'>> = {}
): VlxSaveWordRequest {
  return {
    clientMutationId: `client-${id}`,
    idempotencyKey: `idem-${id}`,
    deviceId,
    userId,
    operation: 'save_word',
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: now,
    payload: {
      savedWord,
    },
    ...overrides,
  };
}

function makeReviewEnvelope(
  id: string,
  eventOverrides: Partial<VlxSubmitReviewEventRequest['payload']['event']> = {},
  envelopeOverrides: Partial<
    Omit<VlxSubmitReviewEventRequest, 'operation' | 'payloadVersion' | 'payload'>
  > = {}
): VlxSubmitReviewEventRequest {
  return {
    clientMutationId: `client-${id}`,
    idempotencyKey: `idem-${id}`,
    deviceId,
    userId,
    operation: 'submit_review_event',
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: now,
    payload: {
      event: {
        eventId: `event-${id}`,
        sessionId: `session-${id}`,
        slug: 'dissonance',
        word: 'Dissonance',
        hub: 'academic-vocabulary',
        questionType: 'saved_review',
        selected: 'Dissonance',
        answer: 'Dissonance',
        result: 'correct',
        responseMs: 3000,
        createdAt: now,
        ...eventOverrides,
      },
    },
    ...envelopeOverrides,
  };
}

function makeQueueItem(
  envelope: QueueableEnvelope,
  queueId: string,
  overrides: Partial<VlxPendingLocalQueueItem> = {}
): VlxPendingLocalQueueItem {
  return {
    ...envelope,
    queueId,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    ...overrides,
  } as VlxPendingLocalQueueItem;
}

function makeSyncQueueEnvelope({
  id,
  batchId,
  items,
}: {
  id: string;
  batchId: string;
  items: VlxPendingLocalQueueItem[];
}): VlxSyncPendingLocalQueueRequest {
  return {
    clientMutationId: `client-${id}`,
    idempotencyKey: `idem-${id}`,
    deviceId,
    userId,
    operation: 'sync_pending_local_queue',
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: now,
    payload: {
      batchId,
      items,
    },
  };
}

test.describe('server review event idempotency contracts', () => {
  test('re-sending the same review event with the same idempotencyKey does not increment box twice', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const review = makeReviewEnvelope('review-idempotent', {
      eventId: 'event-review-idempotent',
    });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));

    const first = expectOk(service.submitReviewEvent(review));
    const retryResponse = service.submitReviewEvent(review);
    const retry = expectOk(retryResponse);

    expect(retryResponse).toMatchObject({
      ok: true,
      duplicateOf: review.idempotencyKey,
    });
    expect(first.reviewState).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
    expect(retry.reviewState).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
    expect(service.store.reviewEvents).toHaveLength(1);
    expect(service.store.reviewState[reviewKey]).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
  });

  test('re-sending the same queue batch does not duplicate review_events', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const queuedReview = makeQueueItem(
      makeReviewEnvelope('queued-review', {
        eventId: 'event-queued-review',
        packId: 'academic-vocabulary',
      }),
      'queue-review-1'
    );
    const batch = makeSyncQueueEnvelope({
      id: 'queue-batch',
      batchId: 'batch-review-idempotency',
      items: [queuedReview],
    });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.syncPendingLocalQueue(batch));
    const retry = expectOk(service.syncPendingLocalQueue(batch));

    expect(retry.accepted).toHaveLength(1);
    expect(service.store.reviewEvents.map((event) => event.eventId)).toEqual([
      'event-queued-review',
    ]);
  });

  test('retrying the same queue batch does not double-count daily_stats or pack_progress', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const queuedReview = makeQueueItem(
      makeReviewEnvelope('queued-pack-review', {
        eventId: 'event-queued-pack-review',
        packId: 'academic-vocabulary',
      }),
      'queue-pack-review'
    );
    const firstBatch = makeSyncQueueEnvelope({
      id: 'queue-batch-first',
      batchId: 'batch-pack-review',
      items: [queuedReview],
    });
    const retryBatch = makeSyncQueueEnvelope({
      id: 'queue-batch-retry',
      batchId: 'batch-pack-review',
      items: [queuedReview],
    });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.syncPendingLocalQueue(firstBatch));
    const retry = expectOk(service.syncPendingLocalQueue(retryBatch));

    expect(retry.accepted).toMatchObject([
      {
        queueId: 'queue-pack-review',
        status: 'conflict_resolved',
        duplicateOf: queuedReview.idempotencyKey,
      },
    ]);
    expect(service.store.reviewEvents).toHaveLength(1);
    expect(service.store.dailyStats[`${userId}:2026-06-11`]).toMatchObject({
      reviewed: 1,
      correct: 1,
      wrong: 0,
      sessions: 1,
      derivedFromEventIds: ['event-queued-pack-review'],
    });
    expect(service.store.packProgress[`${userId}:academic-vocabulary`]).toMatchObject({
      reviewedCount: 1,
      correctCount: 1,
      derivedFromEventIds: ['event-queued-pack-review'],
      idempotencyKeys: [queuedReview.idempotencyKey],
    });
  });

  test('same idempotencyKey with a different payload is rejected as a conflict', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const first = makeReviewEnvelope(
      'idempotency-conflict-original',
      {
        eventId: 'event-idempotency-conflict',
      },
      {
        idempotencyKey: 'idem-review-conflict',
      }
    );
    const conflictingRetry = makeReviewEnvelope(
      'idempotency-conflict-retry',
      {
        eventId: 'event-idempotency-conflict',
        result: 'wrong',
        selected: 'Harmony',
        responseMs: 12000,
      },
      {
        idempotencyKey: 'idem-review-conflict',
      }
    );

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.submitReviewEvent(first));
    expectError(service.submitReviewEvent(conflictingRetry), 'idempotency_conflict');

    expect(service.store.reviewEvents).toHaveLength(1);
    expect(service.store.reviewState[reviewKey]).toMatchObject({
      box: 1,
      correct: 1,
      wrong: 0,
    });
  });

  test('duplicate save does not reset existing review_state', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('review-1')));

    const duplicate = expectOk(
      service.saveWord(
        makeSaveEnvelope(
          'save-duplicate',
          makeSavedWord({
            source: 'app',
            savedAt: '2026-06-11T12:05:00.000Z',
          })
        )
      )
    );

    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.reviewState).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
    });
    expect(service.store.reviewState[reviewKey]).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
    });
  });

  test('wrong answer moves a previously strong state back toward Learning or Weak', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('strong-1')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('strong-2')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('strong-3')));

    const strongState = service.store.reviewState[reviewKey];

    expect(strongState).toMatchObject({
      box: 3,
      mastery: 'Strong',
      correct: 3,
      wrong: 0,
    });

    const regressed = expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('wrong-after-strong', {
          result: 'wrong',
          selected: 'Harmony',
          responseMs: 12000,
          confidence: 'forgot',
          createdAt: '2026-06-11T12:10:00.000Z',
        })
      )
    );

    expect(regressed.reviewState.box).toBeLessThan(strongState.box);
    expect(['Learning', 'Weak']).toContain(regressed.reviewState.mastery);
    expect(regressed.reviewState).toMatchObject({
      correct: 3,
      wrong: 1,
      streakCorrect: 0,
    });
    expect(regressed.reviewState.weakScore).toBeGreaterThan(strongState.weakScore);
  });

  test('fake mastered state cannot be created from migration-only or one-event evidence', () => {
    const oneEventService = createInMemoryServerSrsSyncService({ now });

    expectOk(oneEventService.saveWord(makeSaveEnvelope('save-1')));
    const claimedMastered = expectOk(
      oneEventService.submitReviewEvent(
        makeReviewEnvelope('client-claimed-mastered', {
          boxBefore: 4,
          boxAfter: 5,
          weakScoreBefore: 0,
          weakScoreAfter: 0,
        })
      )
    );

    expect(claimedMastered.event.boxAfter).toBe(1);
    expect(claimedMastered.reviewState.mastery).not.toBe('Mastered');
    expect(expectOk(oneEventService.fetchMasteredWords(userId)).items).toHaveLength(0);

    const migrationService = createInMemoryServerSrsSyncService({ now });
    const accountId = 'fake-mastered-migration-user';
    const plan = createGuestToAccountMigrationPlan(
      FAKE_MASTERED_RISK_GUEST_SNAPSHOT,
      createMockAccountProfile({ accountId })
    );
    const result = runGuestToAccountMigrationPlan(plan, migrationService);

    expect(plan.conflicts.some((conflict) => conflict.category === 'fake_mastery_risk')).toBe(true);
    expect(result.skipped.some((entry) => entry.kind === 'import_review_state')).toBe(true);
    expect(migrationService.store.reviewState[`${accountId}:dissonance`]).toMatchObject({
      box: 0,
      mastery: 'New',
    });
    expect(expectOk(migrationService.fetchMasteredWords(accountId)).items).toHaveLength(0);
  });

  test('upgrade_interest never grants paid entitlement', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accountId = 'upgrade-interest-idempotency-user';
    const plan = createGuestToAccountMigrationPlan(
      UPGRADE_INTEREST_GUEST_SNAPSHOT,
      createMockAccountProfile({ accountId })
    );
    const result = runGuestToAccountMigrationPlan(plan, service);

    expect(result.accepted).toHaveLength(0);
    expect(result.skipped.some((entry) => entry.kind === 'import_upgrade_interest')).toBe(true);
    expect(service.store.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_srs_sync_spike',
    });
    expect(service.store.savedWords).toEqual({});
    expect(service.store.reviewEvents).toEqual([]);
  });
});
