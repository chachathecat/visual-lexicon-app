import { createGuestSnapshotFromStores } from "@/lib/account-persistence/local-snapshot";
import type {
  VlxAccountSyncReviewEventEvidence,
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type { VlxPackProgress } from "@/lib/packs/progress";
import type { VlxReviewStateItem, VlxSavedWord } from "@/lib/srs/types";
import type { VlxGuestDeviceSnapshot } from "@/lib/account-persistence/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

export const SYNC_CONFLICT_FIXTURE_NOW = "2026-06-11T12:00:00.000Z";

export function makeConflictSavedWord(
  overrides: Partial<VlxSavedWord> = {}
): VlxSavedWord {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "word_page",
    savedAt: SYNC_CONFLICT_FIXTURE_NOW,
    ...overrides
  };
}

export function makeConflictReviewEvent(
  overrides: Partial<VlxAccountSyncReviewEventEvidence> = {}
): VlxAccountSyncReviewEventEvidence {
  return {
    eventId: "event-dissonance-1",
    sessionId: "session-conflict",
    slug: "dissonance",
    word: "Dissonance",
    hub: "academic-vocabulary",
    questionType: "saved_review",
    selected: "Dissonance",
    answer: "Dissonance",
    result: "correct",
    responseMs: 3000,
    createdAt: SYNC_CONFLICT_FIXTURE_NOW,
    boxBefore: 0,
    boxAfter: 1,
    weakScoreBefore: 0,
    weakScoreAfter: 0,
    ...overrides
  };
}

export function makeConflictReviewState(
  overrides: Partial<VlxReviewStateItem> = {}
): VlxReviewStateItem {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: SYNC_CONFLICT_FIXTURE_NOW,
    weakScore: 0,
    createdAt: SYNC_CONFLICT_FIXTURE_NOW,
    updatedAt: SYNC_CONFLICT_FIXTURE_NOW,
    ...overrides
  };
}

export function makeConflictPackProgress(
  overrides: Partial<VlxPackProgress> = {}
): VlxPackProgress {
  return {
    packId: "academic-vocabulary",
    reviewedCount: 3,
    correctCount: 2,
    source: "pack_detail",
    ...overrides
  };
}

export function makeConflictUpgradeInterest(
  overrides: Partial<VlxUpgradeInterestRecord> = {}
): VlxUpgradeInterestRecord {
  return {
    id: "upgrade-interest-1",
    plan: "lite",
    source: "pricing_page",
    trigger: "learning_limit_reached",
    createdAt: SYNC_CONFLICT_FIXTURE_NOW,
    pagePath: "/pricing",
    ...overrides
  };
}

export function createSyncConflictSnapshot(
  input: Partial<VlxGuestDeviceSnapshot["stores"]> & {
    snapshotId?: string;
    capturedAt?: string;
  } = {}
): VlxGuestDeviceSnapshot {
  return createGuestSnapshotFromStores({
    snapshotId: input.snapshotId ?? "sync-conflict-snapshot",
    capturedAt: input.capturedAt ?? SYNC_CONFLICT_FIXTURE_NOW,
    source: "guest_snapshot",
    savedWords: input.savedWords,
    reviewState: input.reviewState,
    reviewEvents: input.reviewEvents,
    dailyStats: input.dailyStats,
    packProgress: input.packProgress,
    upgradeInterest: input.upgradeInterest
  });
}

export function createSyncConflictServerState(
  input: VlxAccountSyncServerState = {}
): VlxAccountSyncServerState {
  return {
    accountId: input.accountId ?? "sync-conflict-user-1",
    capturedAt: input.capturedAt ?? SYNC_CONFLICT_FIXTURE_NOW,
    syncCursor: input.syncCursor ?? "server-cursor-1",
    savedWords: input.savedWords ?? {},
    reviewState: input.reviewState ?? {},
    reviewEvents: input.reviewEvents ?? [],
    packProgress: input.packProgress ?? {},
    upgradeInterest: input.upgradeInterest ?? [],
    entitlement: input.entitlement ?? {
      paid: false,
      source: "not_in_conflict_resolution_contract"
    }
  };
}

export const LOCAL_ONLY_SAVED_WORD_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "local-only-saved-word",
  savedWords: {
    dissonance: makeConflictSavedWord()
  }
});

export const SERVER_ONLY_SAVED_WORD_STATE = createSyncConflictServerState({
  savedWords: {
    dissonance: makeConflictSavedWord()
  }
});

export const DUPLICATE_SAVED_WORD_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "duplicate-saved-word",
  savedWords: {
    dissonance: makeConflictSavedWord()
  }
});

export const DUPLICATE_SAVED_WORD_SERVER_STATE =
  createSyncConflictServerState({
    savedWords: {
      dissonance: makeConflictSavedWord({
        savedAt: "2026-06-10T12:00:00.000Z"
      })
    },
    reviewState: {
      dissonance: makeConflictReviewState({
        box: 2,
        mastery: "Learning",
        correct: 2,
        wrong: 0,
        streakCorrect: 2,
        lastReviewedAt: "2026-06-10T12:00:00.000Z",
        updatedAt: "2026-06-10T12:00:00.000Z"
      })
    }
  });

export const LOCAL_REVIEW_EVENT_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "local-review-event",
  reviewEvents: [
    makeConflictReviewEvent({
      eventId: "event-local-new",
      idempotencyKey: "idem-local-new"
    })
  ]
});

export const DUPLICATE_REVIEW_EVENT = makeConflictReviewEvent({
  eventId: "event-duplicate",
  idempotencyKey: "idem-duplicate"
});

export const DUPLICATE_REVIEW_EVENT_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "duplicate-review-event",
  reviewEvents: [DUPLICATE_REVIEW_EVENT]
});

export const DUPLICATE_REVIEW_EVENT_SERVER_STATE =
  createSyncConflictServerState({
    reviewEvents: [DUPLICATE_REVIEW_EVENT]
  });

export const IDEMPOTENCY_CONFLICT_SERVER_EVENT = makeConflictReviewEvent({
  eventId: "event-idem-original",
  idempotencyKey: "idem-reused"
});

export const IDEMPOTENCY_CONFLICT_LOCAL_EVENT = makeConflictReviewEvent({
  eventId: "event-idem-local-conflict",
  idempotencyKey: "idem-reused",
  result: "wrong",
  selected: "Harmony",
  responseMs: 12000,
  weakScoreAfter: 0.2
});

export const STRONG_SERVER_STATE = createSyncConflictServerState({
  reviewState: {
    dissonance: makeConflictReviewState({
      box: 3,
      mastery: "Strong",
      correct: 3,
      wrong: 0,
      streakCorrect: 3,
      weakScore: 0,
      lastReviewedAt: "2026-06-11T11:30:00.000Z",
      updatedAt: "2026-06-11T11:30:00.000Z"
    })
  }
});

export const LOCAL_WEAK_EVIDENCE_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "local-weak-evidence",
  reviewEvents: [
    makeConflictReviewEvent({
      eventId: "event-weak-1",
      result: "wrong",
      selected: "Harmony",
      responseMs: 12000,
      createdAt: "2026-06-11T12:01:00.000Z"
    }),
    makeConflictReviewEvent({
      eventId: "event-weak-2",
      result: "wrong",
      selected: "Melody",
      responseMs: 12000,
      createdAt: "2026-06-11T12:02:00.000Z"
    }),
    makeConflictReviewEvent({
      eventId: "event-weak-3",
      result: "wrong",
      selected: "Noise",
      responseMs: 12000,
      createdAt: "2026-06-11T12:03:00.000Z"
    })
  ]
});

export const STALE_LOCAL_STRONG_STATE_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "stale-local-strong",
  reviewState: {
    dissonance: makeConflictReviewState({
      box: 1,
      mastery: "Learning",
      correct: 1,
      wrong: 0,
      streakCorrect: 1
    })
  }
});

export const WRONG_AFTER_STRONG_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "wrong-after-strong",
  reviewEvents: [
    makeConflictReviewEvent({
      eventId: "event-wrong-after-strong",
      result: "wrong",
      selected: "Harmony",
      responseMs: 12000,
      confidence: "forgot",
      createdAt: "2026-06-11T12:10:00.000Z"
    })
  ]
});

export const FAKE_MASTERED_LOCAL_STATE_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "fake-mastered-local-state",
  reviewState: {
    dissonance: makeConflictReviewState({
      box: 5,
      mastery: "Mastered",
      correct: 12,
      wrong: 0,
      streakCorrect: 12,
      weakScore: 0
    })
  }
});

export const PACK_PROGRESS_WITHOUT_EVENTS_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "pack-progress-without-events",
  packProgress: {
    "academic-vocabulary": makeConflictPackProgress()
  }
});

export const UPGRADE_INTEREST_ONLY_SNAPSHOT = createSyncConflictSnapshot({
  snapshotId: "upgrade-interest-only",
  upgradeInterest: [makeConflictUpgradeInterest()]
});
