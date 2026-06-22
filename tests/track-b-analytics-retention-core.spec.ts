import { test, expect } from "@playwright/test";

import {
  getRetentionSignals,
  pushVlxEvent,
  resetDataLayerDedupState,
  sanitizeVlxEventPayload,
  VLX_ANALYTICS_EVENTS
} from "../src/lib/analytics";
import type {
  VlxSavedWordsStore,
  VlxReviewEventsStore
} from "../src/lib/srs/types";
import type { VlxTrackBRetentionSignals } from "../src/lib/analytics/retention";

type GlobalWindowStub = {
  dataLayer: unknown[];
  location: { pathname: string };
};

function makeFixedDate(iso: string) {
  return new Date(iso).toISOString();
}

function setAnalyticsWindow() {
  (globalThis as unknown as { window?: GlobalWindowStub }).window = {
    dataLayer: [],
    location: { pathname: "/" }
  };
}

function getDataLayer() {
  return (
    (globalThis as unknown as { window?: GlobalWindowStub }).window?.dataLayer || []
  );
}

function makeSavedWords() {
  return {
    dissonance: {
      slug: "dissonance",
      word: "Dissonance",
      image: "/dissonance.webp",
      savedAt: makeFixedDate("2026-06-10T08:00:00.000Z")
    },
    lucid: {
      slug: "lucid",
      word: "Lucid",
      image: "/lucid.webp",
      savedAt: makeFixedDate("2026-06-12T09:00:00.000Z")
    },
    resilient: {
      slug: "resilient",
      word: "Resilient",
      image: "/resilient.webp",
      savedAt: makeFixedDate("2026-06-15T10:00:00.000Z")
    }
  } as VlxSavedWordsStore;
}

function makeReviewEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: "evt-1",
    slug: "dissonance",
    word: "Dissonance",
    questionType: "due_review",
    answer: "Dissonance",
    result: "correct",
    responseMs: 800,
    boxAfter: 1,
    weakScoreBefore: 0.7,
    weakScoreAfter: 0.5,
    createdAt: makeFixedDate("2026-06-20T10:00:00.000Z"),
    ...overrides
  };
}

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

test("schema sanitization applies new analytics rules", () => {
  const payload = sanitizeVlxEventPayload(VLX_ANALYTICS_EVENTS.reviewAnswer, {
    eventId: "  review-1  ",
    route: "/review/due?slug=dissonance#step",
    sessionId: "  session-1  ",
    responseMs: 1200,
    durationMs: 3500,
    boxBefore: 1,
    boxAfter: 2,
    weakScoreBefore: 0.8,
    weakScoreAfter: 0.4,
    masteryBefore: "Learning",
    masteryAfter: "Strong",
    queueSize: 4,
    reviewedCount: 3,
    confidence: "knew",
    schemaVersion: 9,
    sourceOfTruth: "server"
  } as Record<string, unknown>);

  expect(payload.schemaVersion).toBe(1);
  expect(payload.sourceOfTruth).toBe("client");
  expect(payload.route).toBe("/review/due");
  expect(payload.sessionId).toBe("session-1");
  expect(payload.responseMs).toBe(1200);
  expect(payload.durationMs).toBe(3500);
  expect(payload.boxBefore).toBe(1);
  expect(payload.boxAfter).toBe(2);
  expect(payload.weakScoreBefore).toBe(0.8);
  expect(payload.weakScoreAfter).toBe(0.4);
  expect(payload.masteryBefore).toBe("Learning");
  expect(payload.masteryAfter).toBe("Strong");
  expect(payload.queueSize).toBe(4);
  expect(payload.reviewedCount).toBe(3);
  expect(payload.confidence).toBe("knew");
});

test("schema sanitization drops invalid values and disallowed keys", () => {
  const payload = sanitizeVlxEventPayload(VLX_ANALYTICS_EVENTS.reviewAnswer, {
    eventId: "review-2",
    route: "https://app.visuallexicon.org/review?slug=dissonance",
    questionType: "due_review",
    answer: "Dissonance",
    result: "correct",
    responseMs: -1,
    durationMs: -20,
    boxAfter: 11,
    weakScoreAfter: 2.5,
    reviewedCount: 1.5,
    confidence: "invalid",
    email: "learner@example.test",
    authToken: "secret",
    aliasQuery: "dissonance",
    pageText: "private"
  } as Record<string, unknown>);

  expect(payload.route).toBeUndefined();
  expect(payload).not.toHaveProperty("responseMs");
  expect(payload).not.toHaveProperty("durationMs");
  expect(payload).not.toHaveProperty("boxAfter");
  expect(payload).not.toHaveProperty("weakScoreAfter");
  expect(payload).not.toHaveProperty("reviewedCount");
  expect(payload).not.toHaveProperty("confidence");
  expect(payload).not.toHaveProperty("email");
  expect(payload).not.toHaveProperty("authToken");
  expect(payload).not.toHaveProperty("aliasQuery");
  expect(payload).not.toHaveProperty("pageText");
});

test("dataLayer dedupe uses eventName + eventId only", () => {
  setAnalyticsWindow();
  resetDataLayerDedupState();

  pushVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    eventId: "same-id",
    slug: "dissonance"
  });
  pushVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    eventId: "same-id",
    slug: "dissonance"
  });
  pushVlxEvent(VLX_ANALYTICS_EVENTS.reviewAnswer, {
    eventId: "same-id",
    slug: "dissonance"
  });

  const layer = getDataLayer();
  expect(layer).toHaveLength(2);
});

test("weekly reviewed words are canonical and windowed by UTC 7-day range", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const signals = getRetentionSignals(
    makeSavedWords(),
    [
      makeReviewEvent({
        eventId: "evt-1",
        slug: "Dissonance",
        createdAt: makeFixedDate("2026-06-22T09:00:00.000Z"),
        questionType: "due_review",
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.7
      }),
      makeReviewEvent({
        eventId: "evt-2",
        slug: "lucid",
        createdAt: makeFixedDate("2026-06-20T07:00:00.000Z"),
        weakScoreAfter: 0.8,
        questionType: "word_to_image"
      }),
      makeReviewEvent({
        eventId: "evt-3",
        slug: "resilient",
        createdAt: makeFixedDate("2026-06-21T06:00:00.000Z"),
        questionType: "due_review",
        weakScoreBefore: 0.9,
        weakScoreAfter: 0.2
      }),
      makeReviewEvent({
        eventId: "evt-4",
        slug: "dissonance",
        createdAt: makeFixedDate("2026-06-19T06:00:00.000Z"),
        questionType: "due_review",
        weakScoreBefore: 0.3,
        weakScoreAfter: 0.6
      }),
      makeReviewEvent({
        eventId: "evt-5",
        slug: "ABundance",
        createdAt: makeFixedDate("2026-06-15T06:00:00.000Z"),
        questionType: "due_review"
      })
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.weeklyReviewedWords).toBe(3);
  expect(signals.reviewedTodayWords).toBe(1);
  expect(signals.activeReviewDays7d).toBe(4);
  expect(signals.hasConsecutiveDayReturn).toBe(true);
  expect(signals.dueReviewedWords7d).toBe(2);
  expect(signals.weakRecoveredWords7d).toBe(2);
});

test("reviewed today, saved-word coverage, and first-review rate", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const signals = getRetentionSignals(
    makeSavedWords(),
    [
      makeReviewEvent({
        eventId: "evt-11",
        slug: "dissonance",
        createdAt: makeFixedDate("2026-06-22T08:00:00.000Z")
      }),
      makeReviewEvent({
        eventId: "evt-12",
        slug: "lucid",
        createdAt: makeFixedDate("2026-06-20T08:00:00.000Z")
      })
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.reviewedTodayWords).toBe(1);
  expect(signals.savedWordsCount).toBe(3);
  expect(signals.savedWordsReviewedAtLeastOnce).toBe(2);
  expect(signals.saveToFirstReviewRate).toBe(2 / 3);
});

test("save-to-first-review rate is null when no words are saved", () => {
  const signals = getRetentionSignals(
    {},
    [
      makeReviewEvent({
        eventId: "evt-unsaved",
        createdAt: makeFixedDate("2026-06-22T08:00:00.000Z")
      })
    ] as VlxReviewEventsStore,
    "2026-06-22T12:00:00.000Z"
  );

  expect(signals.savedWordsCount).toBe(0);
  expect(signals.savedWordsReviewedAtLeastOnce).toBe(0);
  expect(signals.saveToFirstReviewRate).toBeNull();
});

test("save-to-first-review requires review at or after savedAt", () => {
  const savedWords = {
    dissonance: {
      slug: "dissonance",
      word: "Dissonance",
      savedAt: makeFixedDate("2026-06-20T08:00:00.000Z")
    },
    lucid: {
      slug: "lucid",
      word: "Lucid",
      savedAt: makeFixedDate("2026-06-20T09:00:00.000Z")
    }
  } as VlxSavedWordsStore;
  const signals = getRetentionSignals(
    savedWords,
    [
      makeReviewEvent({
        eventId: "evt-before",
        slug: "dissonance",
        createdAt: makeFixedDate("2026-06-20T07:59:59.999Z")
      }),
      makeReviewEvent({
        eventId: "evt-at",
        slug: "lucid",
        createdAt: makeFixedDate("2026-06-20T09:00:00.000Z")
      })
    ] as VlxReviewEventsStore,
    "2026-06-22T12:00:00.000Z"
  );

  expect(signals.savedWordsCount).toBe(2);
  expect(signals.savedWordsReviewedAtLeastOnce).toBe(1);
  expect(signals.saveToFirstReviewRate).toBe(1 / 2);
});

test("invalid review events are excluded and do not impact coverage", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const signals = getRetentionSignals(
    makeSavedWords(),
    [
      makeReviewEvent({
        eventId: "invalid-future",
        createdAt: makeFixedDate("2026-06-30T08:00:00.000Z")
      }),
      makeReviewEvent({
        eventId: "invalid-response",
        responseMs: -100
      }),
      makeReviewEvent({
        eventId: "invalid-box",
        boxAfter: 99,
        createdAt: makeFixedDate("2026-06-21T06:00:00.000Z")
      })
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.invalidEventCount).toBe(3);
  expect(signals.weeklyReviewedWords).toBe(0);
});

test("legacy events are deduped by fingerprint and conflicting eventId is invalid", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const signals = getRetentionSignals(
    makeSavedWords(),
    [
      {
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        answer: "Dissonance",
        selected: "option-a",
        result: "correct",
        responseMs: 700,
        boxAfter: 1,
        boxBefore: 0,
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.7,
        createdAt: makeFixedDate("2026-06-22T10:00:00.000Z")
      },
      {
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        answer: "Dissonance",
        selected: "option-a",
        result: "correct",
        responseMs: 700,
        boxAfter: 1,
        boxBefore: 0,
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.7,
        createdAt: makeFixedDate("2026-06-22T10:00:00.000Z")
      },
      {
        eventId: "evt-conflict",
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        answer: "Dissonance",
        selected: "option-a",
        result: "correct",
        responseMs: 700,
        boxAfter: 1,
        boxBefore: 0,
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.7,
        createdAt: makeFixedDate("2026-06-21T11:00:00.000Z")
      },
      {
        eventId: "evt-conflict",
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        answer: "Dissonance",
        selected: "option-b",
        result: "wrong",
        responseMs: 700,
        boxAfter: 1,
        boxBefore: 0,
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.7,
        createdAt: makeFixedDate("2026-06-21T11:00:00.000Z")
      }
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.duplicateEventCount).toBe(1);
  expect(signals.invalidEventCount).toBe(1);
});

test("active days and consecutive day return are UTC date based", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const signals = getRetentionSignals(
    makeSavedWords(),
    [
      makeReviewEvent({
        eventId: "evt-day-1",
        slug: "dissonance",
        createdAt: makeFixedDate("2026-06-20T23:59:00.000Z")
      }),
      makeReviewEvent({
        eventId: "evt-day-2",
        slug: "lucid",
        createdAt: makeFixedDate("2026-06-21T00:00:00.000Z")
      }),
      makeReviewEvent({
        eventId: "evt-day-3",
        slug: "resilient",
        createdAt: makeFixedDate("2026-06-23T00:00:00.000Z")
      }),
      {
        eventId: "evt-bad",
        slug: "missing-answer",
        questionType: "due_review",
        result: "correct",
        responseMs: 700,
        boxAfter: 1,
        weakScoreBefore: 0.8,
        weakScoreAfter: 0.9,
        createdAt: makeFixedDate("2026-06-22T11:00:00.000Z")
      }
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.activeReviewDays7d).toBe(2);
  expect(signals.hasConsecutiveDayReturn).toBe(true);
});

test("retention selector does not mutate its inputs", () => {
  const savedWords = makeSavedWords();
  const reviewEvents = [
    makeReviewEvent({
      eventId: "evt-a",
      createdAt: makeFixedDate("2026-06-20T09:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-b",
      slug: "lucid",
      createdAt: makeFixedDate("2026-06-21T10:00:00.000Z")
    })
  ] as VlxReviewEventsStore;

  const savedWordsSnapshot = snapshot(savedWords);
  const reviewEventsSnapshot = snapshot(reviewEvents);
  const _signals: VlxTrackBRetentionSignals = getRetentionSignals(
    savedWords,
    reviewEvents,
    makeFixedDate("2026-06-22T12:00:00.000Z")
  );

  expect(savedWords).toEqual(savedWordsSnapshot);
  expect(reviewEvents).toEqual(reviewEventsSnapshot);
});
