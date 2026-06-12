import {
  createGuestSnapshotFromStores,
} from "@/lib/account-persistence/local-snapshot";
import type { VlxGuestDeviceSnapshot } from "@/lib/account-persistence/types";
import type { VlxReviewEvent, VlxReviewStateItem, VlxSavedWord } from "@/lib/srs/types";
import type { VlxPackProgress } from "@/lib/packs/progress";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

const now = "2026-06-11T12:00:00.000Z";

const makeSavedWord = (overrides: Partial<VlxSavedWord> = {}): VlxSavedWord => ({
  slug: "dissonance",
  word: "Dissonance",
  image: "https://cdn.visuallexicon.org/images/dissonance.webp",
  definition: "A clash between sounds, ideas, or feelings.",
  hub: "academic-vocabulary",
  source: "word_page",
  savedAt: now,
  ...overrides,
});

const makeReviewEvent = (
  overrides: Partial<VlxReviewEvent> = {}
): VlxReviewEvent => ({
  eventId: "event-dissonance-1",
  sessionId: "session-prototype",
  slug: "dissonance",
  word: "Dissonance",
  hub: "academic-vocabulary",
  questionType: "saved_review",
  selected: "Dissonance",
  answer: "Dissonance",
  result: "correct",
  responseMs: 3000,
  createdAt: now,
  boxBefore: 0,
  boxAfter: 1,
  weakScoreBefore: 0,
  weakScoreAfter: 0,
  ...overrides,
});

const makeReviewState = (
  overrides: Partial<VlxReviewStateItem> = {}
): VlxReviewStateItem => ({
  slug: "dissonance",
  word: "Dissonance",
  image: "https://cdn.visuallexicon.org/images/dissonance.webp",
  definition: "A clash between sounds, ideas, or feelings.",
  hub: "academic-vocabulary",
  box: 0,
  mastery: "New",
  correct: 1,
  wrong: 0,
  streakCorrect: 1,
  nextDueAt: now,
  weakScore: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const makePackProgress = (
  overrides: Partial<VlxPackProgress> = {}
): VlxPackProgress => ({
  packId: "academic-vocabulary",
  reviewedCount: 3,
  correctCount: 2,
  source: "pack_detail",
  ...overrides,
});

const makeUpgradeInterest = (
  overrides: Partial<VlxUpgradeInterestRecord> = {}
): VlxUpgradeInterestRecord => ({
  id: "upgrade-interest-1",
  plan: "lite",
  source: "pricing_page",
  trigger: "learning_limit_reached",
  createdAt: now,
  pagePath: "/pricing",
  ...overrides,
});

export const EMPTY_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
  });

export const SAVED_ONLY_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    savedWords: {
      dissonance: makeSavedWord(),
    },
  });

export const SAVED_PLUS_REVIEW_EVENTS_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    savedWords: {
      dissonance: makeSavedWord(),
    },
    reviewEvents: [
      makeReviewEvent(),
      makeReviewEvent({
        eventId: "event-dissonance-2",
        result: "wrong",
        answer: "Harmony",
        selected: "Harmony",
        responseMs: 9000,
        boxBefore: 1,
        boxAfter: 0,
        weakScoreBefore: 0,
        weakScoreAfter: 0.2,
      }),
    ],
    reviewState: {
      dissonance: makeReviewState({
        correct: 2,
        wrong: 1,
        box: 1,
        mastery: "Learning",
      }),
    },
  });

export const WEAK_WORD_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    savedWords: {
      dissonance: makeSavedWord(),
    },
    reviewEvents: [
      makeReviewEvent({
        eventId: "event-weak-1",
        result: "wrong",
        answer: "Harmony",
        selected: "Harmony",
        responseMs: 12000,
      }),
      makeReviewEvent({
        eventId: "event-weak-2",
        result: "wrong",
        answer: "Melody",
        selected: "Melody",
        responseMs: 12000,
      }),
    ],
  });

export const FAKE_MASTERED_RISK_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    savedWords: {
      dissonance: makeSavedWord({ savedAt: now }),
    },
    reviewState: {
      dissonance: makeReviewState({
        box: 5,
        mastery: "Mastered",
        correct: 12,
        wrong: 0,
        weakScore: 0,
      }),
    },
  });

export const PACK_PROGRESS_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    packProgress: {
      "academic-vocabulary": makePackProgress(),
    },
  });

export const UPGRADE_INTEREST_GUEST_SNAPSHOT: VlxGuestDeviceSnapshot =
  createGuestSnapshotFromStores({
    capturedAt: now,
    source: "guest_snapshot",
    upgradeInterest: [makeUpgradeInterest()],
  });
