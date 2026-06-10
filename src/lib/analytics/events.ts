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

const allowedKeys = new Set<VlxAnalyticsAllowedKey>([
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
  "boxBefore",
  "boxAfter",
  "weakScoreAfter",
  "reviewedCount",
  "correctCount",
  "wrongCount",
  "dueCount",
  "weakCount",
  "savedCount",
  "reviewEventCount",
  "hasLocalReviewState",
  "hasLocalSavedWord",
  "mastery"
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
  "mastery"
]);

const numberKeys = new Set<VlxAnalyticsAllowedKey>([
  "boxBefore",
  "boxAfter",
  "weakScoreAfter",
  "reviewedCount",
  "correctCount",
  "wrongCount",
  "dueCount",
  "weakCount",
  "savedCount",
  "reviewEventCount"
]);

const booleanKeys = new Set<VlxAnalyticsAllowedKey>([
  "hasLocalReviewState",
  "hasLocalSavedWord"
]);

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

  return trimmed.slice(0, 160);
}

function sanitizeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
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
    weakScoreAfter: input.weakScoreAfter,
    mastery: input.mastery ?? input.masteryAfter
  };
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
    route:
      eventInput.route ??
      fallbackRoute ??
      normalizeRoute(eventInput.pagePath as string | undefined)
  });
  const sanitizedPayload: Partial<VlxAnalyticsAllowedPayload> = {};

  for (const key of allowedKeys) {
    const value = rawPayload[key];

    if (stringKeys.has(key)) {
      const sanitizedValue = sanitizeString(key, value);

      if (sanitizedValue !== undefined) {
        sanitizedPayload[key] = sanitizedValue as never;
      }

      continue;
    }

    if (numberKeys.has(key)) {
      const sanitizedValue = sanitizeNumber(value);

      if (sanitizedValue !== undefined) {
        sanitizedPayload[key] = sanitizedValue as never;
      }

      continue;
    }

    if (booleanKeys.has(key)) {
      const sanitizedValue = sanitizeBoolean(value);

      if (sanitizedValue !== undefined) {
        sanitizedPayload[key] = sanitizedValue as never;
      }
    }
  }

  return sanitizedPayload as VlxAnalyticsEvent<TEventName>;
}

function pushToDataLayer(payload: VlxAnalyticsEventPayload) {
  const dataLayer = getDataLayer(getBrowserWindow());

  if (!dataLayer) {
    return;
  }

  dataLayer.push(payload);
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

  try {
    pushToDataLayer(payload);
  } catch {
    // Analytics should never interrupt the learning flow.
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[vlx analytics]", payload.event, payload);
  }

  return payload;
}

export const emitVlxEvent = pushVlxEvent;
