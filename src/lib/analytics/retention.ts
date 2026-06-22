import type { VlxQuestionType, VlxSavedWordsStore, VlxReviewEventsStore } from "@/lib/srs/types";

const WEEK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_BOX_VALUE = 0;
const MAX_BOX_VALUE = 5;
const MIN_WEAK_SCORE = 0;
const MAX_WEAK_SCORE = 1;
const ONE_HUNDRED_PERCENT = 1;

const ALLOWED_DUE_QUESTION_TYPES = new Set<VlxQuestionType>([
  "due_review"
]);
const ALLOWED_QUESTION_TYPES = new Set<VlxQuestionType>([
  "image_to_word",
  "definition_to_word",
  "word_to_image",
  "cloze",
  "confusable_pair",
  "saved_review",
  "due_review",
  "weak_review",
  "exam_pack"
]);
const VALID_RESULT_VALUES = new Set(["correct", "wrong"]);

type RetentionReviewQuestionType = VlxQuestionType;

type NormalizedReviewEvent = {
  eventId?: string;
  canonicalSlug: string;
  createdAtMs: number;
  questionType: RetentionReviewQuestionType;
  result: "correct" | "wrong";
  responseMs: number;
  boxAfter: number;
  weakScoreBefore: number;
  weakScoreAfter: number;
  answer: string;
  selected?: string;
};

type CandidateReviewEvent = {
  eventId?: unknown;
  slug?: unknown;
  questionType?: unknown;
  answer?: unknown;
  selected?: unknown;
  result?: unknown;
  responseMs?: unknown;
  createdAt?: unknown;
  boxAfter?: unknown;
  weakScoreBefore?: unknown;
  weakScoreAfter?: unknown;
};

export type VlxTrackBRetentionSignals = {
  weeklyReviewedWords: number;
  reviewedTodayWords: number;
  activeReviewDays7d: number;
  hasConsecutiveDayReturn: boolean;
  savedWordsCount: number;
  savedWordsReviewedAtLeastOnce: number;
  saveToFirstReviewRate: number | null;
  dueReviewedWords7d: number;
  weakRecoveredWords7d: number;
  duplicateEventCount: number;
  invalidEventCount: number;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toUtcDateKey(date: Date) {
  const utc = new Date(date.getTime());

  utc.setUTCHours(0, 0, 0, 0);

  return utc.toISOString().slice(0, 10);
}

function startOfUtcWindow(now: Date) {
  const endMs = now.getTime();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  start.setUTCDate(start.getUTCDate() - (WEEK_DAYS - 1));

  return {
    startMs: start.getTime(),
    endMs,
    utcToday: toUtcDateKey(now)
  };
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function normalizeSavedWords(savedWords: VlxSavedWordsStore) {
  const safeSavedWords = toRecord(savedWords) ?? {};
  const savedWordSavedAtBySlug = new Map<string, number | null>();

  for (const [fallbackSlug, rawSavedWord] of Object.entries(safeSavedWords)) {
    const savedWord = toRecord(rawSavedWord);
    const canonicalSlug = normalizeSlug(savedWord?.slug ?? fallbackSlug);

    if (!canonicalSlug) {
      continue;
    }

    const savedAt = toDate(savedWord?.savedAt);
    const savedAtMs = savedAt ? savedAt.getTime() : null;
    const existingSavedAtMs = savedWordSavedAtBySlug.get(canonicalSlug);

    if (existingSavedAtMs === undefined) {
      savedWordSavedAtBySlug.set(canonicalSlug, savedAtMs);
      continue;
    }

    if (savedAtMs === null) {
      continue;
    }

    savedWordSavedAtBySlug.set(
      canonicalSlug,
      existingSavedAtMs === null
        ? savedAtMs
        : Math.min(existingSavedAtMs, savedAtMs)
    );
  }

  return savedWordSavedAtBySlug;
}

function normalizeReviewEvent(
  rawEvent: Record<string, unknown>,
  nowMs: number
): NormalizedReviewEvent | null {
  const canonicalSlug = normalizeSlug(rawEvent.slug);

  if (!canonicalSlug) {
    return null;
  }

  if (typeof rawEvent.questionType !== "string") {
    return null;
  }

  if (!ALLOWED_QUESTION_TYPES.has(rawEvent.questionType as VlxQuestionType)) {
    return null;
  }

  const questionType = rawEvent.questionType as RetentionReviewQuestionType;
  const result = rawEvent.result;

  if (!VALID_RESULT_VALUES.has(result as string)) {
    return null;
  }

  const createdAt = toDate(rawEvent.createdAt);
  if (!createdAt || createdAt.getTime() > nowMs) {
    return null;
  }

  if (
    typeof rawEvent.responseMs !== "number" ||
    !Number.isFinite(rawEvent.responseMs) ||
    rawEvent.responseMs < 0 ||
    !Number.isInteger(rawEvent.responseMs)
  ) {
    return null;
  }

  if (
    typeof rawEvent.boxAfter !== "number" ||
    !Number.isInteger(rawEvent.boxAfter) ||
    rawEvent.boxAfter < MIN_BOX_VALUE ||
    rawEvent.boxAfter > MAX_BOX_VALUE
  ) {
    return null;
  }

  if (
    typeof rawEvent.weakScoreBefore !== "number" ||
    !Number.isFinite(rawEvent.weakScoreBefore) ||
    rawEvent.weakScoreBefore < MIN_WEAK_SCORE ||
    rawEvent.weakScoreBefore > MAX_WEAK_SCORE
  ) {
    return null;
  }

  if (
    typeof rawEvent.weakScoreAfter !== "number" ||
    !Number.isFinite(rawEvent.weakScoreAfter) ||
    rawEvent.weakScoreAfter < MIN_WEAK_SCORE ||
    rawEvent.weakScoreAfter > ONE_HUNDRED_PERCENT
  ) {
    return null;
  }

  if (
    typeof rawEvent.answer !== "string" ||
    rawEvent.answer.trim().length === 0
  ) {
    return null;
  }

  const answer = rawEvent.answer.trim();
  const selected =
    typeof rawEvent.selected === "string"
      ? rawEvent.selected.trim()
      : undefined;

  const eventId =
    typeof rawEvent.eventId === "string"
      ? rawEvent.eventId.trim() || undefined
      : undefined;

  return {
    eventId,
    canonicalSlug,
    createdAtMs: createdAt.getTime(),
    questionType,
    result: result as "correct" | "wrong",
    responseMs: rawEvent.responseMs,
    boxAfter: rawEvent.boxAfter,
    weakScoreBefore: rawEvent.weakScoreBefore,
    weakScoreAfter: rawEvent.weakScoreAfter,
    answer,
    selected: selected || undefined
  };
}

function eventFingerprint(event: NormalizedReviewEvent) {
  return [
    event.canonicalSlug,
    event.questionType,
    event.result,
    event.boxAfter,
    event.responseMs,
    event.answer,
    event.selected ?? "",
    event.weakScoreBefore,
    event.weakScoreAfter,
    event.createdAtMs
  ].join("|");
}

function dedupeReviewEvents(
  events: VlxReviewEventsStore,
  nowMs: number
) {
  const normalized: NormalizedReviewEvent[] = [];
  let duplicateEventCount = 0;
  let invalidEventCount = 0;

  const seenEventIds = new Map<string, string>();
  const seenFingerprints = new Set<string>();

  for (const raw of events) {
    const rawRecord = toRecord(raw);
    if (!rawRecord) {
      invalidEventCount += 1;
      continue;
    }

    const eventRecord = rawRecord as CandidateReviewEvent;
    const normalizedEvent = normalizeReviewEvent(eventRecord as Record<string, unknown>, nowMs);
    if (!normalizedEvent) {
      invalidEventCount += 1;
      continue;
    }

    const fingerprint = eventFingerprint(normalizedEvent);

    if (normalizedEvent.eventId) {
      const previousFingerprint = seenEventIds.get(normalizedEvent.eventId);
      if (previousFingerprint !== undefined) {
        if (previousFingerprint === fingerprint) {
          duplicateEventCount += 1;
        } else {
          invalidEventCount += 1;
        }
        continue;
      }

      seenEventIds.set(normalizedEvent.eventId, fingerprint);
      normalized.push(normalizedEvent);
      continue;
    }

    if (seenFingerprints.has(fingerprint)) {
      duplicateEventCount += 1;
      continue;
    }

    seenFingerprints.add(fingerprint);
    normalized.push(normalizedEvent);
  }

  return {
    normalized,
    duplicateEventCount,
    invalidEventCount
  };
}

export function getRetentionSignals(
  savedWords: VlxSavedWordsStore,
  reviewEvents: VlxReviewEventsStore,
  now: string | Date = new Date()
): VlxTrackBRetentionSignals {
  const nowDate = toDate(now) ?? new Date();
  const { startMs, endMs, utcToday } = startOfUtcWindow(nowDate);
  const nowMs = nowDate.getTime();
  const validReviewEvents = Array.isArray(reviewEvents) ? reviewEvents : [];
  const deduped = dedupeReviewEvents(validReviewEvents, nowMs);
  const savedWordSavedAtBySlug = normalizeSavedWords(savedWords);
  const allReviewedSlugs = new Set<string>();
  const weeklyReviewedSlugs = new Set<string>();
  const todayReviewedSlugs = new Set<string>();
  const activeReviewDateKeys = new Set<string>();
  const dueReviewedSlugs = new Set<string>();
  const weakRecoveredSlugs = new Set<string>();

  for (const event of deduped.normalized) {
    allReviewedSlugs.add(event.canonicalSlug);

    if (event.createdAtMs < startMs || event.createdAtMs > endMs) {
      continue;
    }

    const dayKey = toUtcDateKey(new Date(event.createdAtMs));

    weeklyReviewedSlugs.add(event.canonicalSlug);
    activeReviewDateKeys.add(dayKey);

    if (dayKey === utcToday) {
      todayReviewedSlugs.add(event.canonicalSlug);
    }

    if (ALLOWED_DUE_QUESTION_TYPES.has(event.questionType)) {
      dueReviewedSlugs.add(event.canonicalSlug);
    }

    if (event.weakScoreAfter < event.weakScoreBefore) {
      weakRecoveredSlugs.add(event.canonicalSlug);
    }
  }

  let reviewedSavedIntersection = 0;
  for (const [savedSlug, savedAtMs] of savedWordSavedAtBySlug) {
    if (savedAtMs === null || !allReviewedSlugs.has(savedSlug)) {
      continue;
    }

    const reviewedAtOrAfterSavedAt = deduped.normalized.some(
      (event) =>
        event.canonicalSlug === savedSlug && event.createdAtMs >= savedAtMs
    );

    if (reviewedAtOrAfterSavedAt) {
      reviewedSavedIntersection += 1;
    }
  }

  const uniqueReviewDayMs = Array.from(activeReviewDateKeys).map((key) =>
    Date.parse(`${key}T00:00:00.000Z`)
  );
  uniqueReviewDayMs.sort((left, right) => left - right);

  let hasConsecutiveDayReturn = false;
  for (let index = 1; index < uniqueReviewDayMs.length; index += 1) {
    if (uniqueReviewDayMs[index] - uniqueReviewDayMs[index - 1] === DAY_MS) {
      hasConsecutiveDayReturn = true;
      break;
    }
  }

  return {
    weeklyReviewedWords: weeklyReviewedSlugs.size,
    reviewedTodayWords: todayReviewedSlugs.size,
    activeReviewDays7d: uniqueReviewDayMs.length,
    hasConsecutiveDayReturn,
    savedWordsCount: savedWordSavedAtBySlug.size,
    savedWordsReviewedAtLeastOnce: reviewedSavedIntersection,
    saveToFirstReviewRate:
      savedWordSavedAtBySlug.size === 0
        ? null
        : reviewedSavedIntersection / savedWordSavedAtBySlug.size,
    dueReviewedWords7d: dueReviewedSlugs.size,
    weakRecoveredWords7d: weakRecoveredSlugs.size,
    duplicateEventCount: deduped.duplicateEventCount,
    invalidEventCount: deduped.invalidEventCount
  };
}
