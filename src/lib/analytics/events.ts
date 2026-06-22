import type {
  VlxAnalyticsAllowedPayload,
  VlxAnalyticsEvent,
  VlxAnalyticsEventInput,
  VlxAnalyticsEventName,
  VlxAnalyticsEventPayload
} from "@/lib/analytics/types";

export const VLX_ANALYTICS_EVENTS = {
  saveWord: "vlx_save_word",
  savedLibraryView: "vlx_saved_library_view",
  wordMemoryStateView: "vlx_word_memory_state_view",
  reviewStart: "vlx_review_start",
  reviewAnswer: "vlx_review_answer",
  reviewComplete: "vlx_review_complete",
  packPreviewStart: "vlx_pack_preview_start",
  packPreviewComplete: "vlx_pack_preview_complete",
  pricingInterest: "vlx_pricing_interest",
  paywallInterest: "vlx_paywall_interest",
  quizStart: "vlx_quiz_start",
  quizAnswer: "vlx_quiz_answer",
  quizComplete: "vlx_quiz_complete",
  reviewStateUpdate: "vlx_review_state_update",
  dueReviewStart: "vlx_due_review_start",
  weakReviewStart: "vlx_weak_review_start",
  aliasSearch: "vlx_alias_search",
  saveWordClick: "vlx_save_word_click",
  extensionOpenApp: "vlx_extension_open_app",
  extensionSaveClick: "vlx_extension_save_click",
  extensionReviewStart: "vlx_extension_review_start",
  extensionQuizLaterClick: "vlx_extension_quiz_later_click",
  examPackPreviewView: "vlx_exam_pack_preview_view",
  examPackPreviewStart: "vlx_exam_pack_preview_start",
  paywallView: "vlx_paywall_view",
  upgradeClick: "vlx_upgrade_click"
} as const satisfies Record<string, VlxAnalyticsEventName>;

type VlxDataLayerWindow = Window & {
  dataLayer?: unknown[];
};

type VlxAnalyticsAllowedKey = keyof VlxAnalyticsAllowedPayload;

const ANALYTICS_SCHEMA_VERSION = 1;
const ANALYTICS_SOURCE_OF_TRUTH = "client";

const allowedKeys = new Set<VlxAnalyticsAllowedKey>([
  "event",
  "eventId",
  "eventTime",
  "schemaVersion",
  "sourceOfTruth",
  "source",
  "slug",
  "word",
  "route",
  "mode",
  "packId",
  "plan",
  "trigger",
  "result",
  "questionType",
  "boxBefore",
  "boxAfter",
  "weakScoreAfter",
  "weakScoreBefore",
  "masteryBefore",
  "masteryAfter",
  "responseMs",
  "durationMs",
  "reviewedCount",
  "correctCount",
  "wrongCount",
  "dueCount",
  "weakCount",
  "savedCount",
  "reviewEventCount",
  "queueSize",
  "hasLocalReviewState",
  "hasLocalSavedWord",
  "mastery",
  "confidence",
  "sessionId"
]);

const stringKeys = new Set<VlxAnalyticsAllowedKey>([
  "event",
  "eventId",
  "eventTime",
  "source",
  "slug",
  "word",
  "route",
  "mode",
  "packId",
  "plan",
  "trigger",
  "result",
  "questionType",
  "masteryBefore",
  "masteryAfter",
  "mastery",
  "sourceOfTruth",
  "sessionId",
  "confidence"
]);

const numberKeys = new Set<VlxAnalyticsAllowedKey>([
  "boxBefore",
  "boxAfter",
  "weakScoreAfter",
  "weakScoreBefore",
  "reviewedCount",
  "correctCount",
  "wrongCount",
  "dueCount",
  "weakCount",
  "savedCount",
  "reviewEventCount",
  "queueSize",
  "responseMs",
  "durationMs",
  "schemaVersion"
]);

const booleanKeys = new Set<VlxAnalyticsAllowedKey>([
  "hasLocalReviewState",
  "hasLocalSavedWord"
]);

const allowedBoxKeys = new Set<VlxAnalyticsAllowedKey>(["boxBefore", "boxAfter"]);
const allowedWeakScoreKeys = new Set<VlxAnalyticsAllowedKey>([
  "weakScoreAfter",
  "weakScoreBefore"
]);
const allowedCountKeys = new Set<VlxAnalyticsAllowedKey>([
  "reviewedCount",
  "correctCount",
  "wrongCount",
  "dueCount",
  "weakCount",
  "savedCount",
  "reviewEventCount",
  "queueSize"
]);
const allowedResponseNumberKeys = new Set<VlxAnalyticsAllowedKey>([
  "responseMs",
  "durationMs"
]);

const allowedConfidenceValues = new Set(["knew", "guessed", "forgot"]);
const allowedSourceOfTruth = new Set(["client", "server", "derived"]);

const pushedEvents = new Map<string, string>();

function getBrowserWindow() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window as VlxDataLayerWindow;
}

function normalizeRoute(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const route = trimmed.split("?")[0]?.split("#")[0] || "/";

  return route.startsWith("/") ? route.slice(0, 160) : undefined;
}

function getCurrentRoute(browserWindow: VlxDataLayerWindow | undefined) {
  return normalizeRoute(browserWindow?.location?.pathname);
}

function createEventId(eventName: VlxAnalyticsEventName) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${eventName}_${Date.now()}_${randomPart}`;
}

function sanitizeString(key: VlxAnalyticsAllowedKey, value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (key === "route") {
    return normalizeRoute(trimmed);
  }

  if (key === "sourceOfTruth") {
    return allowedSourceOfTruth.has(trimmed as "client" | "server" | "derived")
      ? trimmed
      : undefined;
  }

  return trimmed.slice(0, 160);
}

function sanitizeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function sanitizeNonNegativeInteger(value: unknown) {
  const number = sanitizeNumber(value);

  if (number === undefined || !Number.isInteger(number) || number < 0) {
    return undefined;
  }

  return number;
}

function sanitizeIntegerRange(value: unknown, min: number, max: number) {
  const number = sanitizeNumber(value);

  if (
    number === undefined ||
    !Number.isInteger(number) ||
    number < min ||
    number > max
  ) {
    return undefined;
  }

  return number;
}

function sanitizeFraction01(value: unknown) {
  const number = sanitizeNumber(value);

  if (number === undefined || number < 0 || number > 1) {
    return undefined;
  }

  return number;
}

function sanitizeSchemaVersion(value: unknown) {
  return value === ANALYTICS_SCHEMA_VERSION ? ANALYTICS_SCHEMA_VERSION : undefined;
}

function sanitizeConfidence(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return allowedConfidenceValues.has(normalized)
    ? (normalized as "knew" | "guessed" | "forgot")
    : undefined;
}

function sanitizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getDataLayer(browserWindow: VlxDataLayerWindow | undefined) {
  if (!browserWindow) {
    return undefined;
  }

  if (browserWindow.dataLayer === undefined) {
    browserWindow.dataLayer = [];
  }

  return Array.isArray(browserWindow.dataLayer)
    ? browserWindow.dataLayer
    : undefined;
}

function withLegacyCountAliases(
  input: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...input,
    slug: input.slug ?? input.matched_slug,
    reviewedCount: input.reviewedCount ?? input.cardsSeen,
    correctCount: input.correctCount,
    wrongCount: input.wrongCount,
    weakCount: input.weakCount ?? input.weakWordsCount,
    savedCount: input.savedCount ?? input.savedWordsCount,
    weakScoreAfter: input.weakScoreAfter ?? input.weakScore,
    weakScoreBefore: input.weakScoreBefore,
    masteryBefore: input.masteryBefore,
    masteryAfter: input.masteryAfter,
    mastery: input.mastery ?? input.masteryAfter
  };
}

function toAllowedPayloadEntry(
  key: VlxAnalyticsAllowedKey,
  value: unknown
) {
  if (numberKeys.has(key)) {
    if (allowedBoxKeys.has(key)) {
      return sanitizeIntegerRange(value, 0, 5);
    }

    if (allowedWeakScoreKeys.has(key)) {
      return sanitizeFraction01(value);
    }

    if (allowedResponseNumberKeys.has(key)) {
      const normalized = sanitizeNumber(value);

      return normalized !== undefined && normalized >= 0 ? normalized : undefined;
    }

    if (allowedCountKeys.has(key)) {
      return sanitizeNonNegativeInteger(value);
    }

    if (key === "schemaVersion") {
      return sanitizeSchemaVersion(value);
    }

    return sanitizeNumber(value);
  }

  if (stringKeys.has(key)) {
    if (key === "confidence") {
      return sanitizeConfidence(value);
    }

    return sanitizeString(key, value);
  }

  if (booleanKeys.has(key)) {
    return sanitizeBoolean(value);
  }

  return undefined;
}

function applySourceAndSchemaDefaults(
  rawPayload: Record<VlxAnalyticsAllowedKey, unknown>,
  sanitizedPayload: Partial<VlxAnalyticsAllowedPayload>
) {
  sanitizedPayload.schemaVersion = ANALYTICS_SCHEMA_VERSION;
  sanitizedPayload.sourceOfTruth = ANALYTICS_SOURCE_OF_TRUTH;
}

export function sanitizeVlxEventPayload<
  TEventName extends VlxAnalyticsEventName
>(
  event: TEventName,
  input: VlxAnalyticsEventInput<TEventName>,
  fallbackRoute?: string
): VlxAnalyticsEvent<TEventName> {
  const eventInput = input as Record<string, unknown>;
  const rawPayload = withLegacyCountAliases({
    ...eventInput,
    event,
    eventId: eventInput.eventId ?? createEventId(event),
    eventTime: eventInput.eventTime ?? new Date().toISOString(),
    schemaVersion: eventInput.schemaVersion ?? ANALYTICS_SCHEMA_VERSION,
    sourceOfTruth: eventInput.sourceOfTruth ?? ANALYTICS_SOURCE_OF_TRUTH,
    route:
      eventInput.route ??
      fallbackRoute ??
      normalizeRoute(eventInput.pagePath as string | undefined)
  }) as Record<VlxAnalyticsAllowedKey, unknown>;
  const sanitizedPayload: Partial<VlxAnalyticsAllowedPayload> = {};

  for (const key of allowedKeys) {
    const sanitizedValue = toAllowedPayloadEntry(key, rawPayload[key]);

    if (sanitizedValue !== undefined) {
      sanitizedPayload[key] = sanitizedValue as never;
    }
  }

  applySourceAndSchemaDefaults(rawPayload, sanitizedPayload);

  return sanitizedPayload as VlxAnalyticsEvent<TEventName>;
}

function pushToDataLayer(payload: VlxAnalyticsEventPayload) {
  const dataLayer = getDataLayer(getBrowserWindow());

  if (!dataLayer) {
    return;
  }

  dataLayer.push(payload);
}

function getDedupeFingerprint(payload: VlxAnalyticsEventPayload) {
  return JSON.stringify(
    Object.entries(payload)
      .filter(([key]) => key !== "eventTime")
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
  );
}

export function pushVlxEvent<TEventName extends VlxAnalyticsEventName>(
  event: TEventName,
  input: VlxAnalyticsEventInput<TEventName> = {}
): VlxAnalyticsEvent<TEventName> {
  const browserWindow = getBrowserWindow();
  const payload = sanitizeVlxEventPayload(
    event,
    input,
    getCurrentRoute(browserWindow)
  );
  const dedupeKey = `${payload.event}_${payload.eventId}`;
  const dedupeFingerprint = getDedupeFingerprint(payload);
  const previousFingerprint = pushedEvents.get(dedupeKey);

  if (previousFingerprint === undefined) {
    pushedEvents.set(dedupeKey, dedupeFingerprint);
    try {
      pushToDataLayer(payload);
    } catch {
      // Analytics should never interrupt the learning flow.
    }
  } else if (
    previousFingerprint !== dedupeFingerprint &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      "[vlx analytics] duplicate eventId with conflicting payload",
      payload.event,
      payload.eventId
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[vlx analytics]", payload.event, payload);
  }

  return payload;
}

export function resetDataLayerDedupState() {
  pushedEvents.clear();
}

export const emitVlxEvent = pushVlxEvent;
