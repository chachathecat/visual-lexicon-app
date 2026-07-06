import { VLX_PACK_PROGRESS_STORAGE_KEY } from "@/lib/packs/progress";
import { getDueToday } from "@/lib/srs/selectors";
import {
  VLX_STORAGE_KEYS,
  type VlxDailyStatsItem,
  type VlxDailyStatsStore,
  type VlxMasteryLabel,
  type VlxQuestionType,
  type VlxReviewEvent,
  type VlxReviewEventsStore,
  type VlxReviewStateItem,
  type VlxReviewStateStore,
  type VlxSavedWord,
  type VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_UPGRADE_INTEREST_STORAGE_KEY } from "@/lib/upgrade/upgrade-interest";

export const VLX_LEARNING_FUNNEL_STORAGE_KEYS = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
  VLX_PACK_PROGRESS_STORAGE_KEY,
  VLX_UPGRADE_INTEREST_STORAGE_KEY
] as const;

export type VlxLearningFunnelStorageKey =
  (typeof VLX_LEARNING_FUNNEL_STORAGE_KEYS)[number];

export type VlxLearningFunnelRawStores = Partial<
  Record<VlxLearningFunnelStorageKey, unknown>
>;

export type VlxLearningFunnelEvidenceSource =
  | "review_events"
  | "daily_stats"
  | "none";

export type VlxLearningFunnelSafetyFlag = {
  id:
    | "read_only_existing_local_keys"
    | "no_external_analytics_delivery"
    | "no_tracking_pixel"
    | "upgrade_interest_attribution_only"
    | "no_real_paid_entitlement"
    | "public_paid_beta_remains_no_go"
    | "local_storage_payloads_parse";
  severity: "P0" | "P1" | "P2";
  passed: boolean;
  message: string;
};

export type VlxLearningFunnelSnapshot = {
  sourceOfTruth: "browser_local_storage";
  productionConnected: false;
  analyticsSdkConnected: false;
  realPaidEntitlementEnabled: false;
  publicPaidBetaUnblocked: false;
  weeklyReviewedWords: number;
  weeklyReviewedWordsSource: VlxLearningFunnelEvidenceSource;
  savedWordCount: number;
  saveToReviewWordCount: number;
  saveToReviewRate: number | null;
  dueWordCount: number;
  weakWordCount: number;
  masteredWordCount: number;
  reviewEventCount: number;
  reviewCompletionCount: number;
  weakWordRepairCount: number;
  packPreviewStartedCount: number;
  packPreviewCompletedCount: number;
  upgradeInterestCount: number;
  lastReviewAt?: string;
  corruptPayloadKeys: readonly VlxLearningFunnelStorageKey[];
  safetyFlags: readonly VlxLearningFunnelSafetyFlag[];
};

type ParsedStores = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: NormalizedReviewEvent[];
  dailyStats: VlxDailyStatsStore;
  packProgress: Record<string, NormalizedPackProgress>;
  upgradeInterest: NormalizedUpgradeInterest[];
  corruptPayloadKeys: VlxLearningFunnelStorageKey[];
};

type NormalizedReviewEvent = VlxReviewEvent & {
  createdAtMs: number;
  canonicalSlug: string;
};

type NormalizedPackProgress = {
  packId: string;
  startedAt?: string;
  previewStartedAt?: string;
  previewCompletedAt?: string;
  lastReviewedAt?: string;
  reviewedCount: number;
  correctCount: number;
};

type NormalizedUpgradeInterest = {
  id: string;
  plan: "lite" | "pro" | "exam_pack";
  source: string;
  createdAt: string;
};

const MIN_BOX = 0;
const MAX_BOX = 5;
const MIN_WEAK_SCORE = 0;
const MAX_WEAK_SCORE = 1;
const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_MASTERY_LABELS = new Set<VlxMasteryLabel>([
  "New",
  "Learning",
  "Weak",
  "Strong",
  "Mastered"
]);
const VALID_QUESTION_TYPES = new Set<VlxQuestionType>([
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
const VALID_REVIEW_RESULTS = new Set(["correct", "wrong"]);
const VALID_UPGRADE_PLANS = new Set(["lite", "pro", "exam_pack"]);

function canUseLocalStorage() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function readIsoString(value: unknown) {
  const candidate = readString(value);

  if (!candidate) {
    return undefined;
  }

  const time = Date.parse(candidate);

  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

function readNonNegativeInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined;
  }

  return value;
}

function readNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

function readBox(value: unknown) {
  const box = readNonNegativeInteger(value);

  return box !== undefined && box >= MIN_BOX && box <= MAX_BOX
    ? (box as VlxReviewStateItem["box"])
    : undefined;
}

function readWeakScore(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_WEAK_SCORE ||
    value > MAX_WEAK_SCORE
  ) {
    return undefined;
  }

  return value;
}

function readMastery(value: unknown) {
  return typeof value === "string" && VALID_MASTERY_LABELS.has(value as VlxMasteryLabel)
    ? (value as VlxMasteryLabel)
    : undefined;
}

function readQuestionType(value: unknown) {
  return typeof value === "string" && VALID_QUESTION_TYPES.has(value as VlxQuestionType)
    ? (value as VlxQuestionType)
    : undefined;
}

function parseJsonLike(
  key: VlxLearningFunnelStorageKey,
  rawValue: unknown,
  corruptPayloadKeys: VlxLearningFunnelStorageKey[]
) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }

  if (typeof rawValue !== "string") {
    return rawValue;
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    corruptPayloadKeys.push(key);
    return undefined;
  }
}

function readRecordStore(
  key: VlxLearningFunnelStorageKey,
  rawStores: VlxLearningFunnelRawStores,
  corruptPayloadKeys: VlxLearningFunnelStorageKey[]
) {
  const parsed = parseJsonLike(key, rawStores[key], corruptPayloadKeys);

  if (parsed === undefined) {
    return {};
  }

  if (!isRecord(parsed)) {
    corruptPayloadKeys.push(key);
    return {};
  }

  return parsed;
}

function readArrayStore(
  key: VlxLearningFunnelStorageKey,
  rawStores: VlxLearningFunnelRawStores,
  corruptPayloadKeys: VlxLearningFunnelStorageKey[]
) {
  const parsed = parseJsonLike(key, rawStores[key], corruptPayloadKeys);

  if (parsed === undefined) {
    return [];
  }

  if (!Array.isArray(parsed)) {
    corruptPayloadKeys.push(key);
    return [];
  }

  return parsed as unknown[];
}

function normalizeSlug(value: unknown, fallback?: string) {
  const candidate = readString(value) ?? readString(fallback);

  return candidate?.toLowerCase();
}

function normalizeSavedWords(rawStore: Record<string, unknown>) {
  const savedWords: VlxSavedWordsStore = {};

  for (const [fallbackSlug, rawSavedWord] of Object.entries(rawStore)) {
    if (!isRecord(rawSavedWord)) {
      continue;
    }

    const slug = normalizeSlug(rawSavedWord.slug, fallbackSlug);
    const word = readString(rawSavedWord.word);
    const savedAt = readIsoString(rawSavedWord.savedAt);

    if (!slug || !word || !savedAt) {
      continue;
    }

    const savedWord: VlxSavedWord = {
      slug,
      word,
      savedAt,
      image: readString(rawSavedWord.image),
      definition: readString(rawSavedWord.definition),
      hub: readString(rawSavedWord.hub)
    };

    savedWords[slug] = savedWord;
  }

  return savedWords;
}

function normalizeReviewState(rawStore: Record<string, unknown>) {
  const reviewState: VlxReviewStateStore = {};

  for (const [fallbackSlug, rawStateItem] of Object.entries(rawStore)) {
    if (!isRecord(rawStateItem)) {
      continue;
    }

    const slug = normalizeSlug(rawStateItem.slug, fallbackSlug);
    const word = readString(rawStateItem.word);
    const box = readBox(rawStateItem.box);
    const mastery = readMastery(rawStateItem.mastery);
    const correct = readNonNegativeInteger(rawStateItem.correct);
    const wrong = readNonNegativeInteger(rawStateItem.wrong);
    const streakCorrect = readNonNegativeInteger(rawStateItem.streakCorrect);
    const weakScore = readWeakScore(rawStateItem.weakScore);

    if (
      !slug ||
      !word ||
      box === undefined ||
      !mastery ||
      correct === undefined ||
      wrong === undefined ||
      streakCorrect === undefined ||
      weakScore === undefined
    ) {
      continue;
    }

    const createdAt =
      readIsoString(rawStateItem.createdAt) ??
      readIsoString(rawStateItem.lastReviewedAt) ??
      "1970-01-01T00:00:00.000Z";
    const updatedAt =
      readIsoString(rawStateItem.updatedAt) ??
      readIsoString(rawStateItem.lastReviewedAt) ??
      createdAt;
    const avgResponseMs = readNonNegativeNumber(rawStateItem.avgResponseMs);
    const lastQuestionType = readQuestionType(rawStateItem.lastQuestionType);

    reviewState[slug] = {
      slug,
      word,
      image: readString(rawStateItem.image),
      definition: readString(rawStateItem.definition),
      hub: readString(rawStateItem.hub),
      box,
      mastery,
      correct,
      wrong,
      streakCorrect,
      lastReviewedAt: readIsoString(rawStateItem.lastReviewedAt),
      nextDueAt: readIsoString(rawStateItem.nextDueAt),
      weakScore,
      avgResponseMs,
      lastQuestionType,
      createdAt,
      updatedAt
    };
  }

  return reviewState;
}

function normalizeReviewEvent(rawEvent: unknown, nowMs: number) {
  if (!isRecord(rawEvent)) {
    return undefined;
  }

  const canonicalSlug = normalizeSlug(rawEvent.slug);
  const word = readString(rawEvent.word);
  const questionType = readQuestionType(rawEvent.questionType);
  const result =
    typeof rawEvent.result === "string" &&
    VALID_REVIEW_RESULTS.has(rawEvent.result)
      ? (rawEvent.result as VlxReviewEvent["result"])
      : undefined;
  const responseMs = readNonNegativeInteger(rawEvent.responseMs);
  const createdAt = readIsoString(rawEvent.createdAt);
  const boxAfter = readBox(rawEvent.boxAfter);
  const weakScoreAfter = readWeakScore(rawEvent.weakScoreAfter);

  if (
    !canonicalSlug ||
    !word ||
    !questionType ||
    !result ||
    responseMs === undefined ||
    !createdAt ||
    boxAfter === undefined ||
    weakScoreAfter === undefined
  ) {
    return undefined;
  }

  const createdAtMs = Date.parse(createdAt);

  if (createdAtMs > nowMs) {
    return undefined;
  }

  const weakScoreBefore = readWeakScore(rawEvent.weakScoreBefore) ?? weakScoreAfter;
  const boxBefore = readBox(rawEvent.boxBefore) ?? boxAfter;
  const event: NormalizedReviewEvent = {
    eventId: readString(rawEvent.eventId) ?? `legacy_${canonicalSlug}_${createdAtMs}`,
    sessionId: readString(rawEvent.sessionId) ?? `legacy_session_${createdAt.slice(0, 10)}`,
    slug: canonicalSlug,
    canonicalSlug,
    word,
    hub: readString(rawEvent.hub),
    questionType,
    selected: readString(rawEvent.selected),
    answer: readString(rawEvent.answer) ?? word,
    result,
    responseMs,
    usedHint:
      typeof rawEvent.usedHint === "boolean" ? rawEvent.usedHint : undefined,
    confidence:
      rawEvent.confidence === "knew" ||
      rawEvent.confidence === "guessed" ||
      rawEvent.confidence === "forgot"
        ? rawEvent.confidence
        : undefined,
    createdAt,
    createdAtMs,
    boxBefore,
    boxAfter,
    weakScoreBefore,
    weakScoreAfter
  };

  return event;
}

function reviewEventFingerprint(event: NormalizedReviewEvent) {
  return [
    event.canonicalSlug,
    event.sessionId,
    event.questionType,
    event.result,
    event.responseMs,
    event.createdAt,
    event.boxBefore,
    event.boxAfter,
    event.weakScoreBefore,
    event.weakScoreAfter
  ].join("|");
}

function normalizeReviewEvents(rawEvents: unknown[], nowMs: number) {
  const events: NormalizedReviewEvent[] = [];
  const seenEventIds = new Map<string, string>();
  const seenLegacyFingerprints = new Set<string>();

  for (const rawEvent of rawEvents) {
    const event = normalizeReviewEvent(rawEvent, nowMs);

    if (!event) {
      continue;
    }

    const fingerprint = reviewEventFingerprint(event);

    if (event.eventId.startsWith("legacy_")) {
      if (seenLegacyFingerprints.has(fingerprint)) {
        continue;
      }

      seenLegacyFingerprints.add(fingerprint);
      events.push(event);
      continue;
    }

    const previousFingerprint = seenEventIds.get(event.eventId);

    if (previousFingerprint !== undefined) {
      if (previousFingerprint === fingerprint) {
        continue;
      }

      continue;
    }

    seenEventIds.set(event.eventId, fingerprint);
    events.push(event);
  }

  return events;
}

function normalizeDailyStats(rawStore: Record<string, unknown>) {
  const dailyStats: VlxDailyStatsStore = {};

  for (const [fallbackDate, rawStats] of Object.entries(rawStore)) {
    if (!isRecord(rawStats)) {
      continue;
    }

    const date = readString(rawStats.date) ?? fallbackDate;
    const reviewed = readNonNegativeInteger(rawStats.reviewed);
    const correct = readNonNegativeInteger(rawStats.correct) ?? 0;
    const wrong = readNonNegativeInteger(rawStats.wrong) ?? 0;
    const mastered = readNonNegativeInteger(rawStats.mastered) ?? 0;
    const weakAdded = readNonNegativeInteger(rawStats.weakAdded) ?? 0;
    const minutes = readNonNegativeNumber(rawStats.minutes) ?? 0;
    const sessions = readNonNegativeInteger(rawStats.sessions) ?? 0;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00.000Z`)) ||
      reviewed === undefined
    ) {
      continue;
    }

    dailyStats[date] = {
      date,
      reviewed,
      correct,
      wrong,
      mastered,
      weakAdded,
      minutes,
      sessions
    } satisfies VlxDailyStatsItem;
  }

  return dailyStats;
}

function normalizePackProgress(rawStore: Record<string, unknown>) {
  const packProgress: Record<string, NormalizedPackProgress> = {};

  for (const [fallbackPackId, rawProgress] of Object.entries(rawStore)) {
    if (!isRecord(rawProgress)) {
      continue;
    }

    const packId = readString(rawProgress.packId) ?? fallbackPackId;

    if (!packId) {
      continue;
    }

    packProgress[packId] = {
      packId,
      startedAt: readIsoString(rawProgress.startedAt),
      previewStartedAt: readIsoString(rawProgress.previewStartedAt),
      previewCompletedAt: readIsoString(rawProgress.previewCompletedAt),
      lastReviewedAt: readIsoString(rawProgress.lastReviewedAt),
      reviewedCount: readNonNegativeInteger(rawProgress.reviewedCount) ?? 0,
      correctCount: readNonNegativeInteger(rawProgress.correctCount) ?? 0
    };
  }

  return packProgress;
}

function normalizeUpgradeInterest(rawRecords: unknown[]) {
  const records: NormalizedUpgradeInterest[] = [];

  for (const rawRecord of rawRecords) {
    if (!isRecord(rawRecord)) {
      continue;
    }

    const id = readString(rawRecord.id);
    const source = readString(rawRecord.source);
    const createdAt = readIsoString(rawRecord.createdAt);
    const plan =
      typeof rawRecord.plan === "string" && VALID_UPGRADE_PLANS.has(rawRecord.plan)
        ? (rawRecord.plan as NormalizedUpgradeInterest["plan"])
        : undefined;

    if (!id || !source || !createdAt || !plan) {
      continue;
    }

    records.push({ id, plan, source, createdAt });
  }

  return records;
}

function parseStores(
  rawStores: VlxLearningFunnelRawStores,
  nowMs: number
): ParsedStores {
  const corruptPayloadKeys: VlxLearningFunnelStorageKey[] = [];
  const savedWords = normalizeSavedWords(
    readRecordStore(VLX_STORAGE_KEYS.savedWords, rawStores, corruptPayloadKeys)
  );
  const reviewState = normalizeReviewState(
    readRecordStore(VLX_STORAGE_KEYS.reviewState, rawStores, corruptPayloadKeys)
  );
  const reviewEvents = normalizeReviewEvents(
    readArrayStore(VLX_STORAGE_KEYS.reviewEvents, rawStores, corruptPayloadKeys),
    nowMs
  );
  const dailyStats = normalizeDailyStats(
    readRecordStore(VLX_STORAGE_KEYS.dailyStats, rawStores, corruptPayloadKeys)
  );
  const packProgress = normalizePackProgress(
    readRecordStore(
      VLX_PACK_PROGRESS_STORAGE_KEY,
      rawStores,
      corruptPayloadKeys
    )
  );
  const upgradeInterest = normalizeUpgradeInterest(
    readArrayStore(
      VLX_UPGRADE_INTEREST_STORAGE_KEY,
      rawStores,
      corruptPayloadKeys
    )
  );

  return {
    savedWords,
    reviewState,
    reviewEvents,
    dailyStats,
    packProgress,
    upgradeInterest,
    corruptPayloadKeys: Array.from(new Set(corruptPayloadKeys))
  };
}

function getUtcWeekWindow(now: Date) {
  const endMs = now.getTime();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  start.setUTCDate(start.getUTCDate() - 6);

  return {
    startMs: start.getTime(),
    endMs
  };
}

function isInWindow(timestampMs: number, startMs: number, endMs: number) {
  return timestampMs >= startMs && timestampMs <= endMs;
}

function getWeeklyReviewedWordsFromEvents(
  reviewEvents: NormalizedReviewEvent[],
  startMs: number,
  endMs: number
) {
  const weeklySlugs = new Set<string>();

  for (const event of reviewEvents) {
    if (isInWindow(event.createdAtMs, startMs, endMs)) {
      weeklySlugs.add(event.canonicalSlug);
    }
  }

  return weeklySlugs.size;
}

function getWeeklyReviewedWordsFromDailyStats(
  dailyStats: VlxDailyStatsStore,
  startMs: number,
  endMs: number
) {
  return Object.values(dailyStats).reduce((total, item) => {
    const dayMs = Date.parse(`${item.date}T00:00:00.000Z`);

    if (!isInWindow(dayMs, startMs, endMs + DAY_MS - 1)) {
      return total;
    }

    return total + item.reviewed;
  }, 0);
}

function getSaveToReviewCount(
  savedWords: VlxSavedWordsStore,
  reviewEvents: NormalizedReviewEvent[]
) {
  let reviewedSavedWords = 0;

  for (const savedWord of Object.values(savedWords)) {
    const savedAtMs = Date.parse(savedWord.savedAt);

    if (
      reviewEvents.some(
        (event) =>
          event.canonicalSlug === savedWord.slug && event.createdAtMs >= savedAtMs
      )
    ) {
      reviewedSavedWords += 1;
    }
  }

  return reviewedSavedWords;
}

function isWeakFromReviewStateEvidence(item: VlxReviewStateItem) {
  const reviewCount = item.correct + item.wrong;

  return (
    item.weakScore >= 0.6 ||
    item.wrong >= 3 ||
    (item.wrong > 0 && item.wrong >= item.correct && reviewCount > 1) ||
    (item.mastery === "Weak" && (item.wrong > 0 || item.weakScore > 0))
  );
}

function isMasteredFromReviewStateEvidence(item: VlxReviewStateItem) {
  return (
    item.mastery === "Mastered" &&
    item.box === 5 &&
    item.correct > 0 &&
    Boolean(item.lastReviewedAt)
  );
}

function getReviewCompletionCount(
  reviewEvents: NormalizedReviewEvent[],
  dailyStats: VlxDailyStatsStore
) {
  const eventSessionIds = new Set(
    reviewEvents.flatMap((event) => (event.sessionId ? [event.sessionId] : []))
  );
  const dailyStatSessions = Object.values(dailyStats).reduce(
    (total, item) => total + item.sessions,
    0
  );

  return Math.max(eventSessionIds.size, dailyStatSessions);
}

function getWeakWordRepairCount(
  reviewEvents: NormalizedReviewEvent[],
  startMs: number,
  endMs: number
) {
  const repairedSlugs = new Set<string>();

  for (const event of reviewEvents) {
    if (
      isInWindow(event.createdAtMs, startMs, endMs) &&
      event.weakScoreAfter < event.weakScoreBefore
    ) {
      repairedSlugs.add(event.canonicalSlug);
    }
  }

  return repairedSlugs.size;
}

function getLastReviewAt(
  reviewEvents: NormalizedReviewEvent[],
  dailyStats: VlxDailyStatsStore
) {
  const lastEventMs = reviewEvents.reduce(
    (latest, event) => Math.max(latest, event.createdAtMs),
    0
  );

  if (lastEventMs > 0) {
    return new Date(lastEventMs).toISOString();
  }

  const lastDailyStatsMs = Object.values(dailyStats).reduce((latest, item) => {
    if (item.reviewed <= 0) {
      return latest;
    }

    return Math.max(latest, Date.parse(`${item.date}T00:00:00.000Z`));
  }, 0);

  return lastDailyStatsMs > 0
    ? new Date(lastDailyStatsMs).toISOString()
    : undefined;
}

function hasPackPreviewStarted(progress: NormalizedPackProgress) {
  return Boolean(progress.previewStartedAt || progress.startedAt);
}

function hasPackPreviewCompleted(progress: NormalizedPackProgress) {
  return Boolean(progress.previewCompletedAt || progress.reviewedCount > 0);
}

function getSafetyFlags(
  corruptPayloadKeys: readonly VlxLearningFunnelStorageKey[]
): VlxLearningFunnelSafetyFlag[] {
  return [
    {
      id: "read_only_existing_local_keys",
      severity: "P0",
      passed: true,
      message:
        "Snapshot reads only approved Track B localStorage-compatible keys and does not write state."
    },
    {
      id: "no_external_analytics_delivery",
      severity: "P0",
      passed: true,
      message:
        "Snapshot does not send analytics to a vendor, network endpoint, or production dashboard."
    },
    {
      id: "no_tracking_pixel",
      severity: "P0",
      passed: true,
      message: "Snapshot does not create tracking pixels, cookies, or identity."
    },
    {
      id: "upgrade_interest_attribution_only",
      severity: "P0",
      passed: true,
      message:
        "Upgrade interest is counted as attribution only and never grants paid access."
    },
    {
      id: "no_real_paid_entitlement",
      severity: "P0",
      passed: true,
      message:
        "Snapshot reports no real paid entitlement, checkout, billing, payment, or subscription state."
    },
    {
      id: "public_paid_beta_remains_no_go",
      severity: "P0",
      passed: true,
      message: "Public paid beta remains blocked by readiness gates."
    },
    {
      id: "local_storage_payloads_parse",
      severity: corruptPayloadKeys.length > 0 ? "P1" : "P0",
      passed: corruptPayloadKeys.length === 0,
      message:
        corruptPayloadKeys.length === 0
          ? "All supplied local payloads parsed or were absent."
          : `Ignored corrupt local payloads: ${corruptPayloadKeys.join(", ")}.`
    }
  ];
}

function readBrowserRawStores(): VlxLearningFunnelRawStores {
  if (!canUseLocalStorage()) {
    return {};
  }

  return VLX_LEARNING_FUNNEL_STORAGE_KEYS.reduce<VlxLearningFunnelRawStores>(
    (stores, key) => {
      stores[key] = window.localStorage.getItem(key) ?? undefined;
      return stores;
    },
    {}
  );
}

export function getLearningFunnelSnapshot(
  rawStores: VlxLearningFunnelRawStores = readBrowserRawStores(),
  now: string | Date = new Date()
): VlxLearningFunnelSnapshot {
  const nowDate = new Date(now);
  const safeNow = Number.isNaN(nowDate.getTime()) ? new Date() : nowDate;
  const { startMs, endMs } = getUtcWeekWindow(safeNow);
  const parsedStores = parseStores(rawStores, safeNow.getTime());
  const weeklyFromEvents = getWeeklyReviewedWordsFromEvents(
    parsedStores.reviewEvents,
    startMs,
    endMs
  );
  const weeklyFromDailyStats = getWeeklyReviewedWordsFromDailyStats(
    parsedStores.dailyStats,
    startMs,
    endMs
  );
  const weeklyReviewedWords =
    weeklyFromEvents > 0 ? weeklyFromEvents : weeklyFromDailyStats;
  const weeklyReviewedWordsSource: VlxLearningFunnelEvidenceSource =
    weeklyFromEvents > 0
      ? "review_events"
      : weeklyFromDailyStats > 0
        ? "daily_stats"
        : "none";
  const savedWordCount = Object.keys(parsedStores.savedWords).length;
  const saveToReviewWordCount = getSaveToReviewCount(
    parsedStores.savedWords,
    parsedStores.reviewEvents
  );
  const packProgressItems = Object.values(parsedStores.packProgress);

  return {
    sourceOfTruth: "browser_local_storage",
    productionConnected: false,
    analyticsSdkConnected: false,
    realPaidEntitlementEnabled: false,
    publicPaidBetaUnblocked: false,
    weeklyReviewedWords,
    weeklyReviewedWordsSource,
    savedWordCount,
    saveToReviewWordCount,
    saveToReviewRate:
      savedWordCount === 0 ? null : saveToReviewWordCount / savedWordCount,
    dueWordCount: getDueToday(parsedStores.reviewState, safeNow).length,
    weakWordCount: Object.values(parsedStores.reviewState).filter(
      isWeakFromReviewStateEvidence
    ).length,
    masteredWordCount: Object.values(parsedStores.reviewState).filter(
      isMasteredFromReviewStateEvidence
    ).length,
    reviewEventCount: parsedStores.reviewEvents.length,
    reviewCompletionCount: getReviewCompletionCount(
      parsedStores.reviewEvents,
      parsedStores.dailyStats
    ),
    weakWordRepairCount: getWeakWordRepairCount(
      parsedStores.reviewEvents,
      startMs,
      endMs
    ),
    packPreviewStartedCount: packProgressItems.filter(hasPackPreviewStarted)
      .length,
    packPreviewCompletedCount: packProgressItems.filter(hasPackPreviewCompleted)
      .length,
    upgradeInterestCount: parsedStores.upgradeInterest.length,
    lastReviewAt: getLastReviewAt(
      parsedStores.reviewEvents,
      parsedStores.dailyStats
    ),
    corruptPayloadKeys: parsedStores.corruptPayloadKeys,
    safetyFlags: getSafetyFlags(parsedStores.corruptPayloadKeys)
  };
}
