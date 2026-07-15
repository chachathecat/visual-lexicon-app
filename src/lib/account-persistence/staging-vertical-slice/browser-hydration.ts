import {
  applyReviewAnswer,
  createReviewItemFromSavedWord,
} from "@/lib/srs/engine";
import type {
  VlxDailyStatsStore,
  VlxQuestionType,
  VlxReviewConfidence,
  VlxReviewEvent,
  VlxReviewEventsStore,
  VlxReviewResult,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore,
} from "@/lib/srs/types";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";

import {
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES,
  type VlxAccountLearningHydrateResponse,
} from "./contracts";
import { validateAccountLearningHydrateResponse } from "./validator";

const HYDRATION_STORAGE_KEYS = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
] as const;

const SAVED_WORD_KEYS = [
  "slug",
  "word",
  "image",
  "definition",
  "hub",
  "source",
  "savedAt",
] as const;

const REVIEW_EVENT_KEYS = [
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
  "weakScoreAfter",
] as const satisfies readonly (keyof VlxReviewEvent)[];

const SAVED_WORD_SOURCES = new Set([
  "word_page",
  "hub_page",
  "extension",
  "alias_search",
  "app",
  "exam_pack",
  "manual",
]);

const QUESTION_TYPES = new Set<VlxQuestionType>([
  "image_to_word",
  "definition_to_word",
  "word_to_image",
  "cloze",
  "confusable_pair",
  "saved_review",
  "due_review",
  "weak_review",
  "exam_pack",
]);

const REVIEW_RESULTS = new Set<VlxReviewResult>(["correct", "wrong"]);
const REVIEW_CONFIDENCE = new Set<VlxReviewConfidence>([
  "knew",
  "guessed",
  "forgot",
]);

const OPAQUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const WORD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type HydrationStorageKey = (typeof HYDRATION_STORAGE_KEYS)[number];
type HydrationStorageSnapshot = Record<HydrationStorageKey, string | null>;

export type VlxAccountLearningHydrationStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type VlxAccountLearningBrowserHydrationErrorCode =
  | "PAYLOAD_INVALID"
  | "PAYLOAD_TOO_LARGE"
  | "BASELINE_NOT_CLEAN"
  | "LOCAL_STATE_INVALID"
  | "DUPLICATE_EVENT_CONFLICT"
  | "EVENT_TRANSITION_INVALID"
  | "STORAGE_UNAVAILABLE"
  | "STORAGE_WRITE_FAILED"
  | "STORAGE_ROLLBACK_FAILED";

export class VlxAccountLearningBrowserHydrationError extends Error {
  readonly code: VlxAccountLearningBrowserHydrationErrorCode;
  readonly fatal: boolean;

  constructor(
    code: VlxAccountLearningBrowserHydrationErrorCode,
    message: string,
    options: { cause?: unknown; fatal?: boolean } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "VlxAccountLearningBrowserHydrationError";
    this.code = code;
    this.fatal = options.fatal ?? false;
  }
}

export type VlxAccountLearningBrowserHydrationResult = {
  status: "committed" | "no_op";
  wroteBrowserStorage: boolean;
  derivedOnlyFromReviewEvents: true;
  importedMastery: false;
  importedPackProgress: false;
  importedBillingOrEntitlement: false;
  counts: {
    savedWords: number;
    reviewEvents: number;
    reviewStateItems: number;
    dailyStatDays: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[]
) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isBoundedString(
  value: unknown,
  { minimum = 0, maximum }: { minimum?: number; maximum: number }
): value is string {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    value.length <= maximum
  );
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  );
}

function isOpaqueId(value: unknown): value is string {
  return (
    isBoundedString(value, { minimum: 1, maximum: 200 }) &&
    OPAQUE_ID_PATTERN.test(value)
  );
}

function isWordSlug(value: unknown): value is string {
  return (
    isBoundedString(value, { minimum: 1, maximum: 200 }) &&
    WORD_SLUG_PATTERN.test(value)
  );
}

function readOptionalString(
  value: Record<string, unknown>,
  key: string,
  maximum: number
) {
  return (
    !Object.prototype.hasOwnProperty.call(value, key) ||
    isBoundedString(value[key], { maximum })
  );
}

function parseSavedWord(value: unknown): VlxSavedWord | null {
  if (!isRecord(value) || !hasOnlyKeys(value, SAVED_WORD_KEYS)) {
    return null;
  }

  if (
    !isWordSlug(value.slug) ||
    !isBoundedString(value.word, { minimum: 1, maximum: 300 }) ||
    !readOptionalString(value, "image", 2_048) ||
    !readOptionalString(value, "definition", 4_000) ||
    !readOptionalString(value, "hub", 200) ||
    !isIsoTimestamp(value.savedAt)
  ) {
    return null;
  }

  if (
    Object.prototype.hasOwnProperty.call(value, "source") &&
    (typeof value.source !== "string" || !SAVED_WORD_SOURCES.has(value.source))
  ) {
    return null;
  }

  return { ...value } as VlxSavedWord;
}

function isOptionalBoolean(value: Record<string, unknown>, key: string) {
  return (
    !Object.prototype.hasOwnProperty.call(value, key) ||
    typeof value[key] === "boolean"
  );
}

function isOptionalConfidence(value: Record<string, unknown>) {
  return (
    !Object.prototype.hasOwnProperty.call(value, "confidence") ||
    (typeof value.confidence === "string" &&
      REVIEW_CONFIDENCE.has(value.confidence as VlxReviewConfidence))
  );
}

function isSrsBox(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 5;
}

function isWeakScore(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function parseReviewEvent(value: unknown): VlxReviewEvent | null {
  if (!isRecord(value) || !hasOnlyKeys(value, REVIEW_EVENT_KEYS)) {
    return null;
  }

  if (
    !isOpaqueId(value.eventId) ||
    !isOpaqueId(value.sessionId) ||
    !isWordSlug(value.slug) ||
    !isBoundedString(value.word, { minimum: 1, maximum: 300 }) ||
    !readOptionalString(value, "hub", 200) ||
    typeof value.questionType !== "string" ||
    !QUESTION_TYPES.has(value.questionType as VlxQuestionType) ||
    !readOptionalString(value, "selected", 2_000) ||
    !isBoundedString(value.answer, { minimum: 1, maximum: 2_000 }) ||
    typeof value.result !== "string" ||
    !REVIEW_RESULTS.has(value.result as VlxReviewResult) ||
    !Number.isInteger(value.responseMs) ||
    Number(value.responseMs) < 0 ||
    Number(value.responseMs) > 3_600_000 ||
    !isOptionalBoolean(value, "usedHint") ||
    !isOptionalConfidence(value) ||
    !isIsoTimestamp(value.createdAt) ||
    !isSrsBox(value.boxBefore) ||
    !isSrsBox(value.boxAfter) ||
    !isWeakScore(value.weakScoreBefore) ||
    !isWeakScore(value.weakScoreAfter)
  ) {
    return null;
  }

  return { ...value } as VlxReviewEvent;
}

function parseJson(rawValue: string, key: HydrationStorageKey): unknown {
  try {
    return JSON.parse(rawValue);
  } catch (cause) {
    throw new VlxAccountLearningBrowserHydrationError(
      "LOCAL_STATE_INVALID",
      `${key} contains malformed JSON. Hydration did not change browser state.`,
      { cause }
    );
  }
}

function parseLocalSavedWords(rawValue: string | null): VlxSavedWordsStore {
  if (rawValue === null) {
    return {};
  }

  const parsed = parseJson(rawValue, VLX_STORAGE_KEYS.savedWords);

  if (!isRecord(parsed)) {
    throw new VlxAccountLearningBrowserHydrationError(
      "LOCAL_STATE_INVALID",
      `${VLX_STORAGE_KEYS.savedWords} is not a saved-word record. Hydration did not change browser state.`
    );
  }

  const savedWords: VlxSavedWordsStore = {};

  for (const [slug, value] of Object.entries(parsed)) {
    const savedWord = parseSavedWord(value);

    if (!savedWord || savedWord.slug !== slug) {
      throw new VlxAccountLearningBrowserHydrationError(
        "LOCAL_STATE_INVALID",
        `${VLX_STORAGE_KEYS.savedWords} contains an invalid saved word. Hydration did not change browser state.`
      );
    }

    savedWords[slug] = savedWord;
  }

  return savedWords;
}

function parseLocalReviewEvents(rawValue: string | null): VlxReviewEventsStore {
  if (rawValue === null) {
    return [];
  }

  const parsed = parseJson(rawValue, VLX_STORAGE_KEYS.reviewEvents);

  if (!Array.isArray(parsed)) {
    throw new VlxAccountLearningBrowserHydrationError(
      "LOCAL_STATE_INVALID",
      `${VLX_STORAGE_KEYS.reviewEvents} is not a review-event list. Hydration did not change browser state.`
    );
  }

  return parsed.map((value) => {
    const event = parseReviewEvent(value);

    if (!event) {
      throw new VlxAccountLearningBrowserHydrationError(
        "LOCAL_STATE_INVALID",
        `${VLX_STORAGE_KEYS.reviewEvents} contains an invalid review event. Hydration did not change browser state.`
      );
    }

    return event;
  });
}

function getSerializedPayloadByteLength(payload: unknown) {
  let serialized: string | undefined;

  try {
    serialized = JSON.stringify(payload);
  } catch (cause) {
    throw new VlxAccountLearningBrowserHydrationError(
      "PAYLOAD_INVALID",
      "The hydration payload is not serializable.",
      { cause }
    );
  }

  if (serialized === undefined) {
    throw new VlxAccountLearningBrowserHydrationError(
      "PAYLOAD_INVALID",
      "The hydration payload is missing."
    );
  }

  return new TextEncoder().encode(serialized).byteLength;
}

function parseHydrationPayload(
  payload: unknown
): VlxAccountLearningHydrateResponse {
  const payloadBytes = getSerializedPayloadByteLength(payload);

  if (payloadBytes > VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES) {
    throw new VlxAccountLearningBrowserHydrationError(
      "PAYLOAD_TOO_LARGE",
      "The hydration payload exceeds the staging response boundary."
    );
  }

  const validated = validateAccountLearningHydrateResponse(payload);

  if (!validated.ok) {
    throw new VlxAccountLearningBrowserHydrationError(
      "PAYLOAD_INVALID",
      "The hydration payload failed the strict staging contract."
    );
  }

  const { savedWords, reviewEvents } = validated.value.items;

  if (
    validated.value.counts.savedWords !== savedWords.length ||
    validated.value.counts.reviewEvents !== reviewEvents.length ||
    savedWords.length !== reviewEvents.length
  ) {
    throw new VlxAccountLearningBrowserHydrationError(
      "PAYLOAD_INVALID",
      "The hydration payload counts or golden-pair boundary are inconsistent."
    );
  }

  return validated.value;
}

function getBrowserStorage(): VlxAccountLearningHydrationStorage {
  if (typeof window === "undefined") {
    throw new VlxAccountLearningBrowserHydrationError(
      "STORAGE_UNAVAILABLE",
      "Browser local storage is unavailable."
    );
  }

  try {
    const storage = window.localStorage;

    if (!storage) {
      throw new Error("Local storage is missing.");
    }

    return storage;
  } catch (cause) {
    throw new VlxAccountLearningBrowserHydrationError(
      "STORAGE_UNAVAILABLE",
      "Browser local storage is unavailable.",
      { cause }
    );
  }
}

function snapshotHydrationStorage(
  storage: VlxAccountLearningHydrationStorage
): HydrationStorageSnapshot {
  try {
    return {
      [VLX_STORAGE_KEYS.savedWords]: storage.getItem(VLX_STORAGE_KEYS.savedWords),
      [VLX_STORAGE_KEYS.reviewState]: storage.getItem(VLX_STORAGE_KEYS.reviewState),
      [VLX_STORAGE_KEYS.reviewEvents]: storage.getItem(VLX_STORAGE_KEYS.reviewEvents),
      [VLX_STORAGE_KEYS.dailyStats]: storage.getItem(VLX_STORAGE_KEYS.dailyStats),
    };
  } catch (cause) {
    throw new VlxAccountLearningBrowserHydrationError(
      "STORAGE_UNAVAILABLE",
      "Browser storage could not be snapshotted; hydration did not start.",
      { cause }
    );
  }
}

function hasCleanHydrationSnapshot(snapshot: HydrationStorageSnapshot) {
  const expectedEmptyValues: Record<HydrationStorageKey, unknown> = {
    [VLX_STORAGE_KEYS.savedWords]: {},
    [VLX_STORAGE_KEYS.reviewState]: {},
    [VLX_STORAGE_KEYS.reviewEvents]: [],
    [VLX_STORAGE_KEYS.dailyStats]: {},
  };

  try {
    return HYDRATION_STORAGE_KEYS.every((key) => {
      const rawValue = snapshot[key];
      return (
        rawValue === null ||
        JSON.stringify(JSON.parse(rawValue) as unknown) ===
          JSON.stringify(expectedEmptyValues[key])
      );
    });
  } catch {
    return false;
  }
}

function compareReviewEvents(left: VlxReviewEvent, right: VlxReviewEvent) {
  for (const key of REVIEW_EVENT_KEYS) {
    if (left[key] !== right[key]) {
      return key;
    }
  }

  return null;
}

function mergeSavedWords(
  local: VlxSavedWordsStore,
  incoming: readonly VlxSavedWord[]
): VlxSavedWordsStore {
  const merged = new Map<string, VlxSavedWord>(Object.entries(local));

  for (const savedWord of incoming) {
    const existing = merged.get(savedWord.slug);

    merged.set(
      savedWord.slug,
      existing
        ? {
            ...existing,
            ...savedWord,
            savedAt:
              Date.parse(existing.savedAt) <= Date.parse(savedWord.savedAt)
                ? existing.savedAt
                : savedWord.savedAt,
          }
        : { ...savedWord }
    );
  }

  return Object.fromEntries(
    [...merged.entries()].sort(([left], [right]) => left.localeCompare(right))
  );
}

function mergeReviewEvents(
  local: readonly VlxReviewEvent[],
  incoming: readonly VlxReviewEvent[]
) {
  const merged = new Map<string, VlxReviewEvent>();

  for (const event of [...local, ...incoming]) {
    const existing = merged.get(event.eventId);

    if (existing) {
      const conflictField = compareReviewEvents(existing, event);

      if (conflictField) {
        throw new VlxAccountLearningBrowserHydrationError(
          "DUPLICATE_EVENT_CONFLICT",
          `A duplicate review event conflicts on ${conflictField}; hydration did not change browser state.`
        );
      }

      continue;
    }

    merged.set(event.eventId, { ...event });
  }

  return [...merged.values()].sort(
    (left, right) =>
      Date.parse(left.createdAt) - Date.parse(right.createdAt) ||
      left.eventId.localeCompare(right.eventId)
  );
}

function deriveStoresFromEvents({
  savedWords,
  reviewEvents,
}: {
  savedWords: VlxSavedWordsStore;
  reviewEvents: readonly VlxReviewEvent[];
}) {
  const reviewState: VlxReviewStateStore = {};
  const dailyStats: VlxDailyStatsStore = {};
  const canonicalEvents: VlxReviewEvent[] = [];
  const countedSessions = new Set<string>();

  for (const providerEvent of reviewEvents) {
    const date = providerEvent.createdAt.slice(0, 10);
    const sessionDateKey = `${date}\u0000${providerEvent.sessionId}`;
    const savedWord = savedWords[providerEvent.slug];
    const currentState =
      reviewState[providerEvent.slug] ??
      (savedWord
        ? createReviewItemFromSavedWord(savedWord, providerEvent.createdAt)
        : undefined);
    const output = applyReviewAnswer(
      {
        eventId: providerEvent.eventId,
        sessionId: providerEvent.sessionId,
        slug: providerEvent.slug,
        word: providerEvent.word,
        image: savedWord?.image,
        definition: savedWord?.definition,
        hub: providerEvent.hub,
        questionType: providerEvent.questionType,
        selected: providerEvent.selected,
        answer: providerEvent.answer,
        result: providerEvent.result,
        responseMs: providerEvent.responseMs,
        usedHint: providerEvent.usedHint,
        confidence: providerEvent.confidence,
        createdAt: providerEvent.createdAt,
      },
      {
        currentState,
        dailyStats: dailyStats[date],
        countSession: !countedSessions.has(sessionDateKey),
      }
    );
    const transitionConflict = compareReviewEvents(providerEvent, output.event);

    if (transitionConflict) {
      throw new VlxAccountLearningBrowserHydrationError(
        "EVENT_TRANSITION_INVALID",
        `A review event is inconsistent with SRS replay on ${transitionConflict}; hydration did not change browser state.`
      );
    }

    countedSessions.add(sessionDateKey);
    canonicalEvents.push(output.event);
    reviewState[output.state.slug] = output.state;
    dailyStats[output.dailyStats.date] = output.dailyStats;
  }

  return {
    reviewEvents: canonicalEvents,
    reviewState: Object.fromEntries(
      Object.entries(reviewState).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    ) as VlxReviewStateStore,
    dailyStats: Object.fromEntries(
      Object.entries(dailyStats).sort(([left], [right]) =>
        left.localeCompare(right)
      )
    ) as VlxDailyStatsStore,
  };
}

function restoreHydrationStorage(
  storage: VlxAccountLearningHydrationStorage,
  snapshot: HydrationStorageSnapshot,
  writeCause: unknown
): never {
  const failedKeys: HydrationStorageKey[] = [];

  for (const key of HYDRATION_STORAGE_KEYS) {
    try {
      const rawValue = snapshot[key];

      if (rawValue === null) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, rawValue);
      }
    } catch {
      failedKeys.push(key);
    }
  }

  if (failedKeys.length > 0) {
    throw new VlxAccountLearningBrowserHydrationError(
      "STORAGE_ROLLBACK_FAILED",
      `Fatal browser-storage error: rollback could not restore ${failedKeys.join(", ")}.`,
      { cause: writeCause, fatal: true }
    );
  }

  throw new VlxAccountLearningBrowserHydrationError(
    "STORAGE_WRITE_FAILED",
    "Browser hydration could not be committed. All four SRS keys were restored.",
    { cause: writeCause }
  );
}

function writeHydrationStorageAtomically(
  storage: VlxAccountLearningHydrationStorage,
  snapshot: HydrationStorageSnapshot,
  nextValues: Record<HydrationStorageKey, string>
) {
  try {
    for (const key of HYDRATION_STORAGE_KEYS) {
      storage.setItem(key, nextValues[key]);
    }
  } catch (cause) {
    restoreHydrationStorage(storage, snapshot, cause);
  }
}

export function hydrateAccountLearningBrowserState(
  payload: unknown,
  options: {
    storage?: VlxAccountLearningHydrationStorage;
    requireCleanBaseline?: boolean;
  } = {}
): VlxAccountLearningBrowserHydrationResult {
  const storage = options.storage ?? getBrowserStorage();
  const snapshot = snapshotHydrationStorage(storage);

  if (options.requireCleanBaseline && !hasCleanHydrationSnapshot(snapshot)) {
    throw new VlxAccountLearningBrowserHydrationError(
      "BASELINE_NOT_CLEAN",
      "Hydration requires an empty second-browser baseline; no browser state changed."
    );
  }

  const response = parseHydrationPayload(payload);
  const localSavedWords = parseLocalSavedWords(
    snapshot[VLX_STORAGE_KEYS.savedWords]
  );
  const localReviewEvents = parseLocalReviewEvents(
    snapshot[VLX_STORAGE_KEYS.reviewEvents]
  );
  const savedWords = mergeSavedWords(
    localSavedWords,
    response.items.savedWords
  );
  const mergedEvents = mergeReviewEvents(
    localReviewEvents,
    response.items.reviewEvents
  );
  const derived = deriveStoresFromEvents({
    savedWords,
    reviewEvents: mergedEvents,
  });
  const nextValues: Record<HydrationStorageKey, string> = {
    [VLX_STORAGE_KEYS.savedWords]: JSON.stringify(savedWords),
    [VLX_STORAGE_KEYS.reviewState]: JSON.stringify(derived.reviewState),
    [VLX_STORAGE_KEYS.reviewEvents]: JSON.stringify(derived.reviewEvents),
    [VLX_STORAGE_KEYS.dailyStats]: JSON.stringify(derived.dailyStats),
  };
  const unchanged = HYDRATION_STORAGE_KEYS.every(
    (key) => snapshot[key] === nextValues[key]
  );

  if (!unchanged) {
    writeHydrationStorageAtomically(storage, snapshot, nextValues);
  }

  return {
    status: unchanged ? "no_op" : "committed",
    wroteBrowserStorage: !unchanged,
    derivedOnlyFromReviewEvents: true,
    importedMastery: false,
    importedPackProgress: false,
    importedBillingOrEntitlement: false,
    counts: {
      savedWords: Object.keys(savedWords).length,
      reviewEvents: derived.reviewEvents.length,
      reviewStateItems: Object.keys(derived.reviewState).length,
      dailyStatDays: Object.keys(derived.dailyStats).length,
    },
  };
}
