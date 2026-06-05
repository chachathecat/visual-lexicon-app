import {
  applyReviewAnswer as applyReviewAnswerToState,
  createReviewItemFromSavedWord as createInitialReviewItem
} from "@/lib/srs/engine";
import type {
  VlxDailyStatsStore,
  VlxReviewAnswerInput,
  VlxReviewEvent,
  VlxReviewEventsStore,
  VlxReviewStateStore,
  VlxReviewUpdateOutput,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
  } catch {
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
  const events = [...readReviewEvents(), event];
  writeJson(VLX_STORAGE_KEYS.reviewEvents, events);
  return events;
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
  const createdAt = input.createdAt ?? new Date().toISOString();
  const reviewState = readReviewState();
  const reviewEvents = readReviewEvents();
  const dailyStatsStore = readDailyStats();
  const sessionId = input.sessionId ?? `s_${createdAt.slice(0, 10).replaceAll("-", "")}_local`;
  const date = getIsoDate(createdAt);
  const output = applyReviewAnswerToState(
    {
      ...input,
      sessionId,
      createdAt
    },
    {
      currentState: reviewState[input.slug],
      dailyStats: dailyStatsStore[date],
      countSession: !hasSessionEventForDate(reviewEvents, sessionId, date)
    }
  );

  writeReviewState({
    ...reviewState,
    [output.state.slug]: output.state
  });
  appendReviewEvent(output.event);
  writeDailyStats({
    ...dailyStatsStore,
    [output.dailyStats.date]: output.dailyStats
  });

  return output;
}
