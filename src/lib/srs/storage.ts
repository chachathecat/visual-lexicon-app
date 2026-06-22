import {
  applyReviewAnswer as applyReviewAnswerToState,
  createReviewItemFromSavedWord as createInitialReviewItem
} from "@/lib/srs/engine";
import type {
  VlxDailyStatsItem,
  VlxDailyStatsStore,
  VlxReviewAnswerInput,
  VlxReviewEvent,
  VlxReviewEventsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxReviewUpdateOutput,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";

const reviewCommitKeys = [
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats
] as const;

type ReviewCommitKey = (typeof reviewCommitKeys)[number];

type ReviewStoreSnapshot = Record<ReviewCommitKey, string | null>;

type ParsedReviewStores = {
  dailyStatsStore: VlxDailyStatsStore;
  reviewEvents: VlxReviewEventsStore;
  reviewState: VlxReviewStateStore;
};

type ReviewInputConflictField =
  | "sessionId"
  | "slug"
  | "word"
  | "hub"
  | "questionType"
  | "selected"
  | "answer"
  | "result"
  | "responseMs"
  | "usedHint"
  | "confidence"
  | "createdAt";

const reviewEventComparisonFields = [
  "eventId",
  "sessionId",
  "slug",
  "word",
  "hub",
  "questionType",
  "selected",
  "answer",
  "result",
  "responseMs",
  "usedHint",
  "confidence",
  "createdAt",
  "boxBefore",
  "boxAfter",
  "weakScoreBefore",
  "weakScoreAfter"
] satisfies Array<keyof VlxReviewEvent>;

const reviewInputConflictFields = [
  "sessionId",
  "slug",
  "word",
  "hub",
  "questionType",
  "selected",
  "answer",
  "result",
  "responseMs",
  "usedHint",
  "confidence",
  "createdAt"
] satisfies ReviewInputConflictField[];

export class VlxReviewStorageError extends Error {
  fatal: boolean;

  constructor(message: string, options: { fatal?: boolean } = {}) {
    super(message);
    this.name = "VlxReviewStorageError";
    this.fatal = options.fatal ?? false;
  }
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getLocalStorageOrThrow() {
  if (!canUseLocalStorage()) {
    throw new VlxReviewStorageError(
      "Local storage is unavailable, so this review answer was not saved."
    );
  }

  return window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(key: string): unknown {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return undefined;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readRecord<T>(key: string): Record<string, T> {
  const value = readJson(key);

  return isRecord(value) ? (value as Record<string, T>) : {};
}

function readArray<T>(key: string): T[] {
  const value = readJson(key);

  return Array.isArray(value) ? (value as T[]) : [];
}

function getIsoDate(value: string) {
  return value.slice(0, 10);
}

function parseJsonStrict(rawValue: string, key: string): unknown {
  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    throw new VlxReviewStorageError(
      `${key} contains malformed JSON. The review answer was not saved.`
    );
  }
}

function parseRecordStore<T>(
  rawValue: string | null,
  key: string
): Record<string, T> {
  if (rawValue === null) {
    return {};
  }

  const parsedValue = parseJsonStrict(rawValue, key);

  if (!isRecord(parsedValue)) {
    throw new VlxReviewStorageError(
      `${key} is not a review record. The review answer was not saved.`
    );
  }

  return parsedValue as Record<string, T>;
}

function parseReviewEventsStore(rawValue: string | null) {
  if (rawValue === null) {
    return [];
  }

  const parsedValue = parseJsonStrict(rawValue, VLX_STORAGE_KEYS.reviewEvents);

  if (!Array.isArray(parsedValue)) {
    throw new VlxReviewStorageError(
      `${VLX_STORAGE_KEYS.reviewEvents} is not an event list. The review answer was not saved.`
    );
  }

  return parsedValue as VlxReviewEventsStore;
}

function readReviewStoreSnapshot(storage: Storage): ReviewStoreSnapshot {
  return {
    [VLX_STORAGE_KEYS.reviewState]: storage.getItem(VLX_STORAGE_KEYS.reviewState),
    [VLX_STORAGE_KEYS.reviewEvents]: storage.getItem(VLX_STORAGE_KEYS.reviewEvents),
    [VLX_STORAGE_KEYS.dailyStats]: storage.getItem(VLX_STORAGE_KEYS.dailyStats)
  };
}

function parseReviewStoreSnapshot(
  snapshot: ReviewStoreSnapshot
): ParsedReviewStores {
  return {
    reviewState: parseRecordStore<VlxReviewStateItem>(
      snapshot[VLX_STORAGE_KEYS.reviewState],
      VLX_STORAGE_KEYS.reviewState
    ),
    reviewEvents: parseReviewEventsStore(
      snapshot[VLX_STORAGE_KEYS.reviewEvents]
    ),
    dailyStatsStore: parseRecordStore<VlxDailyStatsItem>(
      snapshot[VLX_STORAGE_KEYS.dailyStats],
      VLX_STORAGE_KEYS.dailyStats
    )
  };
}

function restoreReviewStoreSnapshot(
  storage: Storage,
  snapshot: ReviewStoreSnapshot
) {
  const failedKeys: string[] = [];

  for (const key of reviewCommitKeys) {
    try {
      const rawValue = snapshot[key];

      if (rawValue === null) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, rawValue);
      }
    } catch (_error) {
      failedKeys.push(key);
    }
  }

  if (failedKeys.length) {
    throw new VlxReviewStorageError(
      `Fatal local-storage error: rollback could not restore ${failedKeys.join(", ")}. Memory state may be inconsistent.`,
      { fatal: true }
    );
  }
}

function writeReviewStoresAtomically(
  storage: Storage,
  snapshot: ReviewStoreSnapshot,
  stores: ParsedReviewStores
) {
  let activeKey: ReviewCommitKey = VLX_STORAGE_KEYS.reviewState;

  try {
    activeKey = VLX_STORAGE_KEYS.reviewState;
    storage.setItem(
      VLX_STORAGE_KEYS.reviewState,
      JSON.stringify(stores.reviewState)
    );
    activeKey = VLX_STORAGE_KEYS.reviewEvents;
    storage.setItem(
      VLX_STORAGE_KEYS.reviewEvents,
      JSON.stringify(stores.reviewEvents)
    );
    activeKey = VLX_STORAGE_KEYS.dailyStats;
    storage.setItem(
      VLX_STORAGE_KEYS.dailyStats,
      JSON.stringify(stores.dailyStatsStore)
    );
  } catch (_error) {
    restoreReviewStoreSnapshot(storage, snapshot);
    throw new VlxReviewStorageError(
      `${activeKey} could not be written. Previous review storage was restored; retry the answer.`
    );
  }
}

function findReviewEventById(
  events: VlxReviewEventsStore,
  eventId: string | undefined
) {
  if (!eventId) {
    return undefined;
  }

  return events.find((event) => event.eventId === eventId);
}

function getReviewEventConflict(
  existingEvent: VlxReviewEvent,
  nextEvent: VlxReviewEvent
) {
  return reviewEventComparisonFields.find(
    (field) => existingEvent[field] !== nextEvent[field]
  );
}

function getReviewInputConflict(
  existingEvent: VlxReviewEvent,
  input: VlxReviewAnswerInput & { createdAt: string; sessionId: string },
  originalInput: VlxReviewAnswerInput
) {
  return reviewInputConflictFields.find((field) => {
    if (field === "createdAt" && originalInput.createdAt === undefined) {
      return false;
    }

    if (field === "sessionId" && originalInput.sessionId === undefined) {
      return false;
    }

    return existingEvent[field] !== input[field];
  });
}

function assertNoReviewEventConflict(
  existingEvent: VlxReviewEvent,
  nextEvent: VlxReviewEvent
) {
  const conflictField = getReviewEventConflict(existingEvent, nextEvent);

  if (conflictField) {
    throw new VlxReviewStorageError(
      `Duplicate review event ${nextEvent.eventId} conflicts on ${conflictField}. The review answer was not saved.`
    );
  }
}

function getDuplicateReviewOutput(
  stores: ParsedReviewStores,
  existingEvent: VlxReviewEvent,
  input: VlxReviewAnswerInput & { createdAt: string; sessionId: string },
  originalInput: VlxReviewAnswerInput
): VlxReviewUpdateOutput {
  const conflictField = getReviewInputConflict(
    existingEvent,
    input,
    originalInput
  );

  if (conflictField) {
    throw new VlxReviewStorageError(
      `Duplicate review event ${existingEvent.eventId} conflicts on ${conflictField}. The review answer was not saved.`
    );
  }

  const state = stores.reviewState[existingEvent.slug];
  const dailyStats = stores.dailyStatsStore[getIsoDate(existingEvent.createdAt)];

  if (!state || !dailyStats) {
    throw new VlxReviewStorageError(
      `Duplicate review event ${existingEvent.eventId} is missing committed state or stats. The review answer was not replayed.`
    );
  }

  return {
    event: existingEvent,
    state,
    dailyStats
  };
}

function hasSessionEventForDate(
  events: VlxReviewEventsStore,
  sessionId: string,
  date: string
) {
  return events.some(
    (event) =>
      event.sessionId === sessionId && getIsoDate(event.createdAt) === date
  );
}

export function readSavedWords(): VlxSavedWordsStore {
  return readRecord<VlxSavedWord>(VLX_STORAGE_KEYS.savedWords);
}

export function writeSavedWords(savedWords: VlxSavedWordsStore) {
  writeJson(VLX_STORAGE_KEYS.savedWords, savedWords);
}

export function readReviewState(): VlxReviewStateStore {
  return readRecord(VLX_STORAGE_KEYS.reviewState);
}

export function writeReviewState(reviewState: VlxReviewStateStore) {
  writeJson(VLX_STORAGE_KEYS.reviewState, reviewState);
}

export function readReviewEvents(): VlxReviewEventsStore {
  return readArray<VlxReviewEvent>(VLX_STORAGE_KEYS.reviewEvents);
}

export function appendReviewEvent(event: VlxReviewEvent) {
  const storage = getLocalStorageOrThrow();
  const events = parseReviewEventsStore(
    storage.getItem(VLX_STORAGE_KEYS.reviewEvents)
  );
  const existingEvent = findReviewEventById(events, event.eventId);

  if (existingEvent) {
    assertNoReviewEventConflict(existingEvent, event);
    return events;
  }

  const nextEvents = [...events, event];

  storage.setItem(VLX_STORAGE_KEYS.reviewEvents, JSON.stringify(nextEvents));
  return nextEvents;
}

export function readDailyStats(): VlxDailyStatsStore {
  return readRecord(VLX_STORAGE_KEYS.dailyStats);
}

export function writeDailyStats(dailyStats: VlxDailyStatsStore) {
  writeJson(VLX_STORAGE_KEYS.dailyStats, dailyStats);
}

export function createReviewItemFromSavedWord(
  savedWord: VlxSavedWord,
  createdAt = new Date().toISOString()
) {
  const reviewState = readReviewState();
  const existingItem = reviewState[savedWord.slug];

  if (existingItem) {
    return existingItem;
  }

  const item = createInitialReviewItem(savedWord, createdAt);
  writeReviewState({
    ...reviewState,
    [item.slug]: item
  });

  return item;
}

export function applyReviewAnswer(
  input: VlxReviewAnswerInput
): VlxReviewUpdateOutput {
  const storage = getLocalStorageOrThrow();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const sessionId = input.sessionId ?? `s_${createdAt.slice(0, 10).replaceAll("-", "")}_local`;
  const snapshot = readReviewStoreSnapshot(storage);
  const stores = parseReviewStoreSnapshot(snapshot);
  const existingEvent = findReviewEventById(stores.reviewEvents, input.eventId);
  const committedInput = {
    ...input,
    sessionId,
    createdAt
  };

  if (existingEvent) {
    return getDuplicateReviewOutput(
      stores,
      existingEvent,
      committedInput,
      input
    );
  }

  const date = getIsoDate(createdAt);
  const output = applyReviewAnswerToState(
    committedInput,
    {
      currentState: stores.reviewState[input.slug],
      dailyStats: stores.dailyStatsStore[date],
      countSession: !hasSessionEventForDate(stores.reviewEvents, sessionId, date)
    }
  );
  const duplicateOutputEvent = findReviewEventById(
    stores.reviewEvents,
    output.event.eventId
  );

  if (duplicateOutputEvent) {
    assertNoReviewEventConflict(duplicateOutputEvent, output.event);
    return getDuplicateReviewOutput(
      stores,
      duplicateOutputEvent,
      committedInput,
      input
    );
  }

  writeReviewStoresAtomically(storage, snapshot, {
    reviewState: {
      ...stores.reviewState,
      [output.state.slug]: output.state
    },
    reviewEvents: [...stores.reviewEvents, output.event],
    dailyStatsStore: {
      ...stores.dailyStatsStore,
      [output.dailyStats.date]: output.dailyStats
    }
  });

  return output;
}
