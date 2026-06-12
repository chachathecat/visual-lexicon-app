import type { VlxGuestDeviceSnapshot } from "@/lib/account-persistence/types";
import { createInMemoryServerPersistenceAccountState } from "@/lib/account-persistence/server-adapter/in-memory-adapter";
import type { VlxServerPersistenceAccountState } from "@/lib/account-persistence/server-adapter/adapter-contract";
import type { VlxServerPersistenceIntegrationHarnessInput } from "@/lib/account-persistence/sync-harness/harness";
import {
  DUPLICATE_REVIEW_EVENT,
  DUPLICATE_REVIEW_EVENT_SNAPSHOT,
  DUPLICATE_SAVED_WORD_SNAPSHOT,
  FAKE_MASTERED_LOCAL_STATE_SNAPSHOT,
  IDEMPOTENCY_CONFLICT_LOCAL_EVENT,
  IDEMPOTENCY_CONFLICT_SERVER_EVENT,
  LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  LOCAL_WEAK_EVIDENCE_SNAPSHOT,
  PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT,
  SYNC_CONFLICT_FIXTURE_NOW,
  UPGRADE_INTEREST_ONLY_SNAPSHOT,
  WRONG_AFTER_STRONG_SNAPSHOT,
  createSyncConflictSnapshot,
  makeConflictReviewEvent,
  makeConflictReviewState,
  makeConflictSavedWord
} from "@/lib/account-persistence/sync-conflicts/fixtures";
import type { VlxReviewStateItem } from "@/lib/srs/types";

export const SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW =
  SYNC_CONFLICT_FIXTURE_NOW;
export const SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID =
  "server-persistence-integration-harness-user-1";

export {
  DUPLICATE_REVIEW_EVENT_SNAPSHOT as DUPLICATE_REVIEW_EVENT_HARNESS_SNAPSHOT,
  DUPLICATE_SAVED_WORD_SNAPSHOT as DUPLICATE_SAVED_WORD_HARNESS_SNAPSHOT,
  FAKE_MASTERED_LOCAL_STATE_SNAPSHOT as FAKE_MASTERED_HARNESS_SNAPSHOT,
  LOCAL_ONLY_SAVED_WORD_SNAPSHOT as LOCAL_ONLY_SAVED_WORD_HARNESS_SNAPSHOT,
  LOCAL_WEAK_EVIDENCE_SNAPSHOT as LOCAL_WEAK_EVIDENCE_HARNESS_SNAPSHOT,
  PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT as PACK_PROGRESS_WITHOUT_EVENTS_HARNESS_SNAPSHOT,
  UPGRADE_INTEREST_ONLY_SNAPSHOT as UPGRADE_INTEREST_ONLY_HARNESS_SNAPSHOT,
  WRONG_AFTER_STRONG_SNAPSHOT as WRONG_AFTER_STRONG_HARNESS_SNAPSHOT,
  makeConflictReviewEvent as makeSyncHarnessReviewEvent,
  makeConflictReviewState as makeSyncHarnessReviewState,
  makeConflictSavedWord as makeSyncHarnessSavedWord
};

export const EMPTY_SYNC_HARNESS_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "sync-harness-empty"
});

export const PACK_REVIEW_EVENT_HARNESS_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "sync-harness-pack-review-event",
  reviewEvents: [
    makeConflictReviewEvent({
      eventId: "event-harness-pack-review",
      idempotencyKey: "idem-harness-pack-review",
      packId: "academic-vocabulary"
    })
  ]
});

export const IDEMPOTENT_SAVED_AND_PACK_REVIEW_HARNESS_SNAPSHOT =
  createSyncConflictSnapshot({
    snapshotId: "sync-harness-idempotent-saved-pack-review",
    savedWords: {
      dissonance: makeConflictSavedWord()
    },
    reviewEvents: [
      makeConflictReviewEvent({
        eventId: "event-harness-idempotent-pack-review",
        idempotencyKey: "idem-harness-idempotent-pack-review",
        packId: "academic-vocabulary"
      })
    ]
  });

export const IDEMPOTENCY_PAYLOAD_CONFLICT_HARNESS_SNAPSHOT =
  createSyncConflictSnapshot({
    snapshotId: "sync-harness-idempotency-payload-conflict",
    reviewEvents: [IDEMPOTENCY_CONFLICT_LOCAL_EVENT]
  });

export function createSyncHarnessInitialServerState(
  input: Partial<
    Omit<VlxServerPersistenceAccountState, "accountId" | "entitlement" | "syncCursor">
  > & {
    accountId?: string;
  } = {}
): VlxServerPersistenceAccountState {
  return createInMemoryServerPersistenceAccountState({
    accountId: input.accountId ?? SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
    capturedAt: input.capturedAt ?? SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
    syncVersion: input.syncVersion,
    savedWords: input.savedWords,
    reviewState: input.reviewState,
    reviewEvents: input.reviewEvents,
    dailyStats: input.dailyStats,
    packProgress: input.packProgress,
    upgradeInterest: input.upgradeInterest,
    auditRecords: input.auditRecords,
    processedIdempotencyKeys: input.processedIdempotencyKeys
  });
}

export function createDuplicateSavedWordHarnessServerState({
  reviewState = makeConflictReviewState({
    box: 3,
    mastery: "Strong",
    correct: 3,
    wrong: 0,
    streakCorrect: 3,
    lastReviewedAt: "2026-06-11T11:30:00.000Z",
    updatedAt: "2026-06-11T11:30:00.000Z"
  })
}: {
  reviewState?: VlxReviewStateItem;
} = {}) {
  return createSyncHarnessInitialServerState({
    savedWords: {
      dissonance: makeConflictSavedWord({
        savedAt: "2026-06-10T12:00:00.000Z"
      })
    },
    reviewState: {
      dissonance: reviewState
    }
  });
}

export function createDuplicateReviewEventHarnessServerState() {
  return createSyncHarnessInitialServerState({
    reviewEvents: [DUPLICATE_REVIEW_EVENT]
  });
}

export function createIdempotencyPayloadConflictHarnessServerState() {
  return createSyncHarnessInitialServerState({
    reviewEvents: [IDEMPOTENCY_CONFLICT_SERVER_EVENT]
  });
}

export function createStrongReviewStateHarnessServerState({
  reviewState = makeConflictReviewState({
    box: 3,
    mastery: "Strong",
    correct: 3,
    wrong: 0,
    streakCorrect: 3,
    weakScore: 0,
    lastReviewedAt: "2026-06-11T11:30:00.000Z",
    updatedAt: "2026-06-11T11:30:00.000Z"
  })
}: {
  reviewState?: VlxReviewStateItem;
} = {}) {
  return createSyncHarnessInitialServerState({
    reviewState: {
      dissonance: reviewState
    }
  });
}

export function createHarnessInput(
  localSnapshot: VlxGuestDeviceSnapshot,
  initialServerState?: VlxServerPersistenceAccountState
): VlxServerPersistenceIntegrationHarnessInput {
  return {
    accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
    localSnapshot,
    initialServerState,
    now: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW
  };
}
