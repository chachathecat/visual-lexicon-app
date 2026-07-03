import {
  VLX_DEFAULT_PLAN_ID,
  VLX_PLAN_DEFINITIONS,
  VLX_PLAN_STATE_STORAGE_KEY,
  isVlxPlanId,
  type VlxPlanId
} from "@/lib/entitlements";
import {
  VLX_PACK_PROGRESS_STORAGE_KEY,
  hasVisiblePackProgress,
  type VlxPackProgress,
  type VlxPackProgressStore
} from "@/lib/packs/progress";
import {
  evaluateExamPackPreviewEndPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  type VlxPaywallPrompt
} from "@/lib/paywall";
import {
  getMastered,
  getNewSaved,
  getReviewedToday,
  getSavedLibrary,
  getWeakWords
} from "@/lib/srs/selectors";
import {
  VLX_STORAGE_KEYS,
  type VlxDailyStatsItem,
  type VlxDailyStatsStore,
  type VlxMasteryLabel,
  type VlxReviewEventsStore,
  type VlxReviewStateItem,
  type VlxReviewStateStore,
  type VlxSavedWord,
  type VlxSavedWordsStore,
  type VlxSrsBox
} from "@/lib/srs/types";

export const DASHBOARD_V2_LOCAL_STORAGE_KEYS = {
  ...VLX_STORAGE_KEYS,
  packProgress: VLX_PACK_PROGRESS_STORAGE_KEY,
  planState: VLX_PLAN_STATE_STORAGE_KEY
} as const;

export type DashboardV2ReadIssue = {
  key: string;
  message: string;
};

export type DashboardV2ReadModelInput = {
  savedWords?: unknown;
  reviewState?: unknown;
  reviewEvents?: unknown;
  dailyStats?: unknown;
  packProgress?: unknown;
  plan?: VlxPlanId;
  now?: string | Date;
  issues?: DashboardV2ReadIssue[];
};

export type DashboardV2ReadModel = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEventsStore;
  dailyStats: VlxDailyStatsStore;
  packProgress: VlxPackProgressStore;
  dueWords: VlxReviewStateItem[];
  weakWords: VlxReviewStateItem[];
  newSaved: VlxSavedWord[];
  masteredWords: VlxReviewStateItem[];
  recentSavedWords: VlxSavedWord[];
  visiblePackProgress: VlxPackProgress[];
  reviewedToday: number;
  hasAnyLocalData: boolean;
  upgradePrompt: VlxPaywallPrompt | null;
  issues: DashboardV2ReadIssue[];
};

const masteryLabels = new Set<VlxMasteryLabel>([
  "New",
  "Learning",
  "Weak",
  "Strong",
  "Mastered"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasKeys(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function readSrsBox(value: unknown): VlxSrsBox | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
    ? (value as VlxSrsBox)
    : undefined;
}

function readMastery(value: unknown): VlxMasteryLabel | undefined {
  return typeof value === "string" && masteryLabels.has(value as VlxMasteryLabel)
    ? (value as VlxMasteryLabel)
    : undefined;
}

function isValidDateString(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function readRequiredDateString(value: unknown) {
  const text = readString(value);

  return text && isValidDateString(text) ? text : undefined;
}

function readOptionalDateString(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return {
      ok: true,
      value: undefined
    };
  }

  const text = readString(value);

  return {
    ok: Boolean(text && isValidDateString(text)),
    value: text
  };
}

function addIssue(
  issues: DashboardV2ReadIssue[],
  key: string,
  message: string
) {
  issues.push({ key, message });
}

function normalizeSavedWord(
  key: string,
  value: unknown
): VlxSavedWord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const slug = readString(value.slug) ?? readString(key);
  const word = readString(value.word);
  const savedAt = readRequiredDateString(value.savedAt);

  if (!slug || !word || !savedAt) {
    return undefined;
  }

  return {
    slug,
    word,
    image: readOptionalString(value.image),
    definition: readOptionalString(value.definition),
    hub: readOptionalString(value.hub),
    source: readOptionalString(value.source) as VlxSavedWord["source"],
    savedAt
  };
}

function normalizeSavedWordsStore(
  value: unknown,
  issues: DashboardV2ReadIssue[]
): VlxSavedWordsStore {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    addIssue(
      issues,
      VLX_STORAGE_KEYS.savedWords,
      "Saved words storage is not a record, so it was ignored."
    );
    return {};
  }

  return Object.entries(value).reduce<VlxSavedWordsStore>(
    (store, [key, savedWord]) => {
      const normalized = normalizeSavedWord(key, savedWord);

      if (normalized) {
        store[normalized.slug] = normalized;
      } else {
        addIssue(
          issues,
          VLX_STORAGE_KEYS.savedWords,
          `Saved word "${key}" is stale or incomplete, so it was ignored.`
        );
      }

      return store;
    },
    {}
  );
}

function normalizeReviewStateItem(
  key: string,
  value: unknown
): VlxReviewStateItem | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const slug = readString(value.slug) ?? readString(key);
  const word = readString(value.word);
  const box = readSrsBox(value.box);
  const mastery = readMastery(value.mastery);
  const correct = readNonNegativeNumber(value.correct);
  const wrong = readNonNegativeNumber(value.wrong);
  const streakCorrect = readNonNegativeNumber(value.streakCorrect);
  const weakScore = readNonNegativeNumber(value.weakScore);
  const createdAt = readRequiredDateString(value.createdAt);
  const updatedAt = readRequiredDateString(value.updatedAt);
  const lastReviewedAt = readOptionalDateString(value.lastReviewedAt);
  const nextDueAt = readOptionalDateString(value.nextDueAt);

  if (
    !slug ||
    !word ||
    box === undefined ||
    !mastery ||
    correct === undefined ||
    wrong === undefined ||
    streakCorrect === undefined ||
    weakScore === undefined ||
    !createdAt ||
    !updatedAt ||
    !lastReviewedAt.ok ||
    !nextDueAt.ok
  ) {
    return undefined;
  }

  return {
    slug,
    word,
    image: readOptionalString(value.image),
    definition: readOptionalString(value.definition),
    hub: readOptionalString(value.hub),
    box,
    mastery,
    correct,
    wrong,
    streakCorrect,
    lastReviewedAt: lastReviewedAt.value,
    nextDueAt: nextDueAt.value,
    weakScore,
    avgResponseMs: readNonNegativeNumber(value.avgResponseMs),
    lastQuestionType: readOptionalString(
      value.lastQuestionType
    ) as VlxReviewStateItem["lastQuestionType"],
    createdAt,
    updatedAt
  };
}

function normalizeReviewStateStore(
  value: unknown,
  issues: DashboardV2ReadIssue[]
): VlxReviewStateStore {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    addIssue(
      issues,
      VLX_STORAGE_KEYS.reviewState,
      "Review state storage is not a record, so it was ignored."
    );
    return {};
  }

  return Object.entries(value).reduce<VlxReviewStateStore>(
    (store, [key, reviewItem]) => {
      const normalized = normalizeReviewStateItem(key, reviewItem);

      if (normalized) {
        store[normalized.slug] = normalized;
      } else {
        addIssue(
          issues,
          VLX_STORAGE_KEYS.reviewState,
          `Review state "${key}" is stale or incomplete, so it was ignored.`
        );
      }

      return store;
    },
    {}
  );
}

function normalizeReviewEventsStore(
  value: unknown,
  issues: DashboardV2ReadIssue[]
): VlxReviewEventsStore {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    addIssue(
      issues,
      VLX_STORAGE_KEYS.reviewEvents,
      "Review events storage is not an array, so it was ignored."
    );
    return [];
  }

  return value.filter(isRecord) as VlxReviewEventsStore;
}

function normalizeDailyStatsItem(
  key: string,
  value: unknown
): VlxDailyStatsItem | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const date = readString(value.date) ?? readString(key);
  const reviewed = readNonNegativeNumber(value.reviewed);
  const correct = readNonNegativeNumber(value.correct);
  const wrong = readNonNegativeNumber(value.wrong);
  const mastered = readNonNegativeNumber(value.mastered);
  const weakAdded = readNonNegativeNumber(value.weakAdded);
  const minutes = readNonNegativeNumber(value.minutes);
  const sessions = readNonNegativeNumber(value.sessions);

  if (
    !date ||
    reviewed === undefined ||
    correct === undefined ||
    wrong === undefined ||
    mastered === undefined ||
    weakAdded === undefined ||
    minutes === undefined ||
    sessions === undefined
  ) {
    return undefined;
  }

  return {
    date,
    reviewed,
    correct,
    wrong,
    mastered,
    weakAdded,
    minutes,
    sessions
  };
}

function normalizeDailyStatsStore(
  value: unknown,
  issues: DashboardV2ReadIssue[]
): VlxDailyStatsStore {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    addIssue(
      issues,
      VLX_STORAGE_KEYS.dailyStats,
      "Daily stats storage is not a record, so it was ignored."
    );
    return {};
  }

  return Object.entries(value).reduce<VlxDailyStatsStore>(
    (store, [key, dailyStats]) => {
      const normalized = normalizeDailyStatsItem(key, dailyStats);

      if (normalized) {
        store[key] = normalized;
      } else {
        addIssue(
          issues,
          VLX_STORAGE_KEYS.dailyStats,
          `Daily stats "${key}" is stale or incomplete, so it was ignored.`
        );
      }

      return store;
    },
    {}
  );
}

function normalizePackProgressSource(value: unknown) {
  return value === "packs_page" || value === "pack_detail" || value === "review"
    ? value
    : "packs_page";
}

function normalizePackProgressItem(
  key: string,
  value: unknown
): VlxPackProgress | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const packId = readString(value.packId) ?? readString(key);
  const reviewedCount = readNonNegativeNumber(value.reviewedCount);
  const correctCount = readNonNegativeNumber(value.correctCount);
  const startedAt = readOptionalDateString(value.startedAt);
  const lastOpenedAt = readOptionalDateString(value.lastOpenedAt);
  const previewStartedAt = readOptionalDateString(value.previewStartedAt);
  const previewCompletedAt = readOptionalDateString(value.previewCompletedAt);
  const lastReviewedAt = readOptionalDateString(value.lastReviewedAt);

  if (
    !packId ||
    reviewedCount === undefined ||
    correctCount === undefined ||
    !startedAt.ok ||
    !lastOpenedAt.ok ||
    !previewStartedAt.ok ||
    !previewCompletedAt.ok ||
    !lastReviewedAt.ok
  ) {
    return undefined;
  }

  return {
    packId,
    startedAt: startedAt.value,
    lastOpenedAt: lastOpenedAt.value,
    previewStartedAt: previewStartedAt.value,
    previewCompletedAt: previewCompletedAt.value,
    lastReviewedAt: lastReviewedAt.value,
    reviewedCount,
    correctCount,
    source: normalizePackProgressSource(value.source)
  };
}

function normalizePackProgressStore(
  value: unknown,
  issues: DashboardV2ReadIssue[]
): VlxPackProgressStore {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    addIssue(
      issues,
      VLX_PACK_PROGRESS_STORAGE_KEY,
      "Pack progress storage is not a record, so it was ignored."
    );
    return {};
  }

  return Object.entries(value).reduce<VlxPackProgressStore>(
    (store, [key, progress]) => {
      const normalized = normalizePackProgressItem(key, progress);

      if (normalized) {
        store[normalized.packId] = normalized;
      } else {
        addIssue(
          issues,
          VLX_PACK_PROGRESS_STORAGE_KEY,
          `Pack progress "${key}" is stale or incomplete, so it was ignored.`
        );
      }

      return store;
    },
    {}
  );
}

function getModelNow(now: DashboardV2ReadModelInput["now"]) {
  const date = now instanceof Date ? new Date(now.getTime()) : new Date(now ?? "");

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getDueTimestamp(item: VlxReviewStateItem) {
  return item.nextDueAt ? Date.parse(item.nextDueAt) : Number.POSITIVE_INFINITY;
}

function sortByDueThenWeakness(
  first: VlxReviewStateItem,
  second: VlxReviewStateItem
) {
  const firstDue = getDueTimestamp(first);
  const secondDue = getDueTimestamp(second);

  if (firstDue !== secondDue) {
    return firstDue - secondDue;
  }

  return second.weakScore - first.weakScore;
}

export function getDashboardDueWords(
  reviewState: VlxReviewStateStore,
  now: string | Date = new Date()
) {
  const dueBy = getModelNow(now);

  return Object.values(reviewState)
    .filter((item) => {
      if (item.mastery === "Mastered") {
        return false;
      }

      if (!item.nextDueAt) {
        return false;
      }

      return Date.parse(item.nextDueAt) <= dueBy.getTime();
    })
    .sort(sortByDueThenWeakness);
}

function getPackProgressTimestamp(item: VlxPackProgress) {
  return Math.max(
    ...[
      item.lastReviewedAt,
      item.previewCompletedAt,
      item.previewStartedAt,
      item.lastOpenedAt,
      item.startedAt
    ].map((value) => {
      if (!value) {
        return 0;
      }

      const timestamp = Date.parse(value);

      return Number.isNaN(timestamp) ? 0 : timestamp;
    })
  );
}

export function getVisibleDashboardPackProgress(
  packProgress: VlxPackProgressStore
) {
  return Object.values(packProgress)
    .filter(hasVisiblePackProgress)
    .sort((first, second) => {
      const firstTimestamp = getPackProgressTimestamp(first);
      const secondTimestamp = getPackProgressTimestamp(second);

      if (firstTimestamp !== secondTimestamp) {
        return secondTimestamp - firstTimestamp;
      }

      return first.packId.localeCompare(second.packId);
    });
}

function getExamPackPrompt(
  plan: VlxPlanId,
  visiblePackProgress: VlxPackProgress[]
) {
  const completedPreview = visiblePackProgress.find(
    (progress) => progress.previewCompletedAt
  );

  if (!completedPreview) {
    return null;
  }

  return evaluateExamPackPreviewEndPaywall({
    plan,
    packId: completedPreview.packId,
    previewCompleted: true,
    source: "dashboard_pack_progress"
  });
}

function getDashboardUpgradePrompt({
  plan,
  recentSavedWords,
  reviewedToday,
  visiblePackProgress
}: {
  plan: VlxPlanId;
  recentSavedWords: VlxSavedWord[];
  reviewedToday: number;
  visiblePackProgress: VlxPackProgress[];
}) {
  const planDefinition = VLX_PLAN_DEFINITIONS[plan];

  return (
    evaluateSaveLimitPaywall({
      plan,
      savedCount: recentSavedWords.length,
      savedLimit: planDefinition.limits.savedWordsLimit,
      source: "dashboard_saved_words"
    }) ??
    evaluateReviewLimitPaywall({
      plan,
      dailyReviewedCount: reviewedToday,
      dailyReviewLimit: planDefinition.limits.dailyReviewLimit,
      source: "dashboard_review_limit"
    }) ??
    getExamPackPrompt(plan, visiblePackProgress)
  );
}

export function buildDashboardV2ReadModel({
  dailyStats: rawDailyStats,
  issues: initialIssues = [],
  now,
  packProgress: rawPackProgress,
  plan = VLX_DEFAULT_PLAN_ID,
  reviewEvents: rawReviewEvents,
  reviewState: rawReviewState,
  savedWords: rawSavedWords
}: DashboardV2ReadModelInput = {}): DashboardV2ReadModel {
  const issues = [...initialIssues];
  const savedWords = normalizeSavedWordsStore(rawSavedWords, issues);
  const reviewState = normalizeReviewStateStore(rawReviewState, issues);
  const reviewEvents = normalizeReviewEventsStore(rawReviewEvents, issues);
  const dailyStats = normalizeDailyStatsStore(rawDailyStats, issues);
  const packProgress = normalizePackProgressStore(rawPackProgress, issues);
  const modelNow = getModelNow(now);
  const dueWords = getDashboardDueWords(reviewState, modelNow);
  const weakWords = getWeakWords(reviewState);
  const newSaved = getNewSaved(savedWords, reviewState);
  const masteredWords = getMastered(reviewState);
  const recentSavedWords = getSavedLibrary(savedWords);
  const visiblePackProgress = getVisibleDashboardPackProgress(packProgress);
  const reviewedToday = getReviewedToday(dailyStats, modelNow);
  const hasAnyLocalData =
    hasKeys(savedWords) ||
    hasKeys(reviewState) ||
    reviewEvents.length > 0 ||
    hasKeys(dailyStats) ||
    visiblePackProgress.length > 0;

  return {
    savedWords,
    reviewState,
    reviewEvents,
    dailyStats,
    packProgress,
    dueWords,
    weakWords,
    newSaved,
    masteredWords,
    recentSavedWords,
    visiblePackProgress,
    reviewedToday,
    hasAnyLocalData,
    upgradePrompt: getDashboardUpgradePrompt({
      plan,
      recentSavedWords,
      reviewedToday,
      visiblePackProgress
    }),
    issues
  };
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readBrowserJson(
  key: string,
  issues: DashboardV2ReadIssue[]
): unknown {
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
    addIssue(issues, key, `${key} contains malformed JSON and was ignored.`);
    return undefined;
  }
}

function normalizePlanId(value: unknown): VlxPlanId {
  if (isVlxPlanId(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return VLX_DEFAULT_PLAN_ID;
  }

  const candidate = value.plan ?? value.planId;

  return isVlxPlanId(candidate) ? candidate : VLX_DEFAULT_PLAN_ID;
}

export function readDashboardV2BrowserReadModel(
  now: string | Date = new Date()
) {
  const issues: DashboardV2ReadIssue[] = [];
  const planState = readBrowserJson(VLX_PLAN_STATE_STORAGE_KEY, issues);

  return buildDashboardV2ReadModel({
    savedWords: readBrowserJson(VLX_STORAGE_KEYS.savedWords, issues),
    reviewState: readBrowserJson(VLX_STORAGE_KEYS.reviewState, issues),
    reviewEvents: readBrowserJson(VLX_STORAGE_KEYS.reviewEvents, issues),
    dailyStats: readBrowserJson(VLX_STORAGE_KEYS.dailyStats, issues),
    packProgress: readBrowserJson(VLX_PACK_PROGRESS_STORAGE_KEY, issues),
    plan: normalizePlanId(planState),
    now,
    issues
  });
}
