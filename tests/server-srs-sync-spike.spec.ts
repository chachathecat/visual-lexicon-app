import { expect, test } from '@playwright/test';

import {
  VLX_SERVER_SRS_SYNC_SPIKE_ENABLED,
  assertServerSrsSyncSpikeDisabledByDefault,
} from '../src/lib/server-srs-sync/spike/feature-flag';
import { createInMemoryServerSrsSyncService } from '../src/lib/server-srs-sync/spike/sync-service';
import type {
  VlxArchiveWordRequest,
  VlxSaveWordRequest,
  VlxSubmitReviewEventRequest,
  VlxSyncPendingLocalQueueRequest,
} from '../src/lib/server-srs-sync/contracts';
import {
  VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
  type VlxPendingLocalQueueItem,
  type VlxServerReviewStateItem,
  type VlxServerSrsSyncResponse,
} from '../src/lib/server-srs-sync/types';
import type { VlxSavedWord } from '../src/lib/srs/types';

const now = '2026-06-11T12:00:00.000Z';
const userId = 'user-1';
const deviceId = 'device-1';

function expectOk<T>(response: VlxServerSrsSyncResponse<T>) {
  expect(response.ok).toBe(true);

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
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
  };
}

function makeReviewEnvelope(
  id: string,
  overrides: Partial<VlxSubmitReviewEventRequest['payload']['event']> = {},
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
        ...overrides,
      },
    },
  };
}

function makeArchiveEnvelope(
  id: string,
  slug = 'dissonance',
): VlxArchiveWordRequest {
  return {
    clientMutationId: `client-${id}`,
    idempotencyKey: `idem-${id}`,
    deviceId,
    userId,
    operation: 'archive_word',
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: now,
    payload: {
      slug,
      archivedAt: now,
      reason: 'user_unsave',
    },
  };
}

function makeQueueItem(
  envelope:
    | VlxSaveWordRequest
    | VlxArchiveWordRequest
    | VlxSubmitReviewEventRequest,
  queueId: string,
  overrides: Partial<VlxPendingLocalQueueItem> = {},
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

function makeSyncQueueEnvelope(
  items: VlxPendingLocalQueueItem[],
): VlxSyncPendingLocalQueueRequest {
  return {
    clientMutationId: 'client-sync-queue',
    idempotencyKey: 'idem-sync-queue',
    deviceId,
    userId,
    operation: 'sync_pending_local_queue',
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: now,
    payload: {
      batchId: 'batch-1',
      items,
    },
  };
}

function makeServerReviewState(
  overrides: Partial<VlxServerReviewStateItem> = {},
): VlxServerReviewStateItem {
  return {
    slug: 'mastered',
    word: 'Mastered',
    box: 5,
    mastery: 'Mastered',
    correct: 8,
    wrong: 0,
    streakCorrect: 5,
    lastReviewedAt: now,
    nextDueAt: '2026-07-11T12:00:00.000Z',
    weakScore: 0,
    createdAt: now,
    updatedAt: now,
    userId,
    materializedFrom: 'review_events',
    lastEventId: 'event-mastered',
    serverUpdatedAt: now,
    version: 1,
    ...overrides,
  };
}

test.describe('server SRS sync implementation spike', () => {
  test('feature flag is disabled by default', () => {
    expect(VLX_SERVER_SRS_SYNC_SPIKE_ENABLED).toBe(false);
    expect(() => assertServerSrsSyncSpikeDisabledByDefault()).not.toThrow();
  });

  test('save creates saved word and review state', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const data = expectOk(service.saveWord(makeSaveEnvelope('save-1')));

    expect(data.savedWord.active).toBe(true);
    expect(data.savedWord.userId).toBe(userId);
    expect(data.reviewState).toMatchObject({
      slug: 'dissonance',
      box: 0,
      mastery: 'New',
      correct: 0,
      wrong: 0,
      userId,
    });
    expect(Object.values(service.store.savedWords)).toHaveLength(1);
    expect(Object.values(service.store.reviewState)).toHaveLength(1);
  });

  test('duplicate save is idempotent by saved word slug', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    const duplicate = expectOk(service.saveWord(makeSaveEnvelope('save-2')));

    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(Object.values(service.store.savedWords)).toHaveLength(1);
    expect(Object.values(service.store.reviewState)).toHaveLength(1);
  });

  test('submit review event appends once and updates review state', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    const data = expectOk(service.submitReviewEvent(makeReviewEnvelope('review-1')));

    expect(data.duplicate).toBe(false);
    expect(data.event.boxBefore).toBe(0);
    expect(data.event.boxAfter).toBe(1);
    expect(data.reviewState).toMatchObject({
      box: 1,
      mastery: 'Learning',
      correct: 1,
      wrong: 0,
    });
    expect(service.store.reviewEvents).toHaveLength(1);
  });

  test('duplicate review event does not advance box twice', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    const first = expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('review-1', { eventId: 'event-dedupe' }),
      ),
    );
    const duplicate = expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('review-2', { eventId: 'event-dedupe' }),
      ),
    );

    expect(first.reviewState.box).toBe(1);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.reviewState.box).toBe(1);
    expect(service.store.reviewEvents).toHaveLength(1);
  });

  test('wrong answer moves word toward weak state', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('wrong-1', {
          result: 'wrong',
          selected: 'Melody',
          responseMs: 12000,
          confidence: 'forgot',
        }),
      ),
    );
    const data = expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('wrong-2', {
          result: 'wrong',
          selected: 'Melody',
          responseMs: 12000,
          confidence: 'forgot',
        }),
      ),
    );

    expect(data.reviewState.box).toBe(0);
    expect(data.reviewState.mastery).toBe('Weak');
    expect(data.reviewState.wrong).toBe(2);
    expect(data.reviewState.weakScore).toBeGreaterThan(0);
  });

  test('archive preserves review state and events', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('review-1')));
    const archive = expectOk(service.archiveWord(makeArchiveEnvelope('archive-1')));
    const hydration = expectOk(service.hydrateAccountState(userId));

    expect(archive.savedWord.active).toBe(false);
    expect(archive.reviewStatePreserved).toBe(true);
    expect(hydration.savedWords.dissonance.active).toBe(false);
    expect(hydration.reviewState.dissonance).toBeDefined();
    expect(hydration.reviewEvents).toHaveLength(1);
  });

  test('hydrate account state returns saved review events stats and progress', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('review-1', {
          packId: 'academic-vocabulary',
        }),
      ),
    );
    const hydration = expectOk(service.hydrateAccountState(userId));

    expect(Object.keys(hydration.savedWords)).toEqual(['dissonance']);
    expect(Object.keys(hydration.reviewState)).toEqual(['dissonance']);
    expect(hydration.reviewEvents).toHaveLength(1);
    expect(Object.keys(hydration.dailyStats)).toEqual(['2026-06-11']);
    expect(Object.keys(hydration.packProgress)).toEqual(['academic-vocabulary']);
  });

  test('due weak and mastered queues derive from real review state', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('wrong-1', {
          result: 'wrong',
          selected: 'Melody',
          responseMs: 12000,
        }),
      ),
    );
    expectOk(
      service.submitReviewEvent(
        makeReviewEnvelope('wrong-2', {
          result: 'wrong',
          selected: 'Melody',
          responseMs: 12000,
        }),
      ),
    );
    service.store.reviewState[`${userId}:mastered`] = makeServerReviewState();

    const due = expectOk(service.fetchDueQueue(userId));
    const weak = expectOk(service.fetchWeakQueue(userId));
    const mastered = expectOk(service.fetchMasteredWords(userId));

    expect(due.items.map((item) => item.slug)).toContain('dissonance');
    expect(weak.items.map((item) => item.slug)).toContain('dissonance');
    expect(mastered.items.map((item) => item.slug)).toEqual(['mastered']);
  });

  test('sync pending local queue processes accepted rejected and retryable buckets', () => {
    const service = createInMemoryServerSrsSyncService({ now });
    const accepted = makeQueueItem(
      makeSaveEnvelope(
        'queued-save',
        makeSavedWord({ slug: 'lucid', word: 'Lucid' }),
      ),
      'queue-accepted',
    );
    const rejected = makeQueueItem(
      makeReviewEnvelope('queued-invalid', { responseMs: -1 }),
      'queue-rejected',
    );
    const retryable = makeQueueItem(makeSaveEnvelope('queued-retry'), 'queue-retry', {
      status: 'retryable_error',
      attempts: 1,
      lastError: {
        code: 'server_unavailable',
        message: 'Retry later.',
        retryable: true,
      },
    });

    const data = expectOk(
      service.syncPendingLocalQueue(
        makeSyncQueueEnvelope([accepted, rejected, retryable]),
      ),
    );

    expect(data.accepted.map((item) => item.queueId)).toEqual(['queue-accepted']);
    expect(data.rejected.map((item) => item.queueId)).toEqual(['queue-rejected']);
    expect(data.retryable.map((item) => item.queueId)).toEqual(['queue-retry']);
    expect(expectOk(service.hydrateAccountState(userId)).savedWords.lucid).toBeDefined();
  });

  test('no helper grants fake Mastered from one answer', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    const data = expectOk(service.submitReviewEvent(makeReviewEnvelope('review-1')));

    expect(data.reviewState.mastery).not.toBe('Mastered');
    expect(data.reviewState.box).toBe(1);
  });

  test('no helper grants paid entitlement', () => {
    const service = createInMemoryServerSrsSyncService({ now });

    expectOk(service.saveWord(makeSaveEnvelope('save-1')));
    expectOk(service.submitReviewEvent(makeReviewEnvelope('review-1')));

    expect(service.store.entitlement).toEqual({
      paid: false,
      source: 'not_in_server_srs_sync_spike',
    });
  });
});
