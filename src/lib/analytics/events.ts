import type {
  VlxAnalyticsEvent,
  VlxAnalyticsEventInput,
  VlxAnalyticsEventName,
  VlxAnalyticsEventPayload
} from "@/lib/analytics/types";

export const VLX_ANALYTICS_EVENTS = {
  quizStart: "vlx_quiz_start",
  quizAnswer: "vlx_quiz_answer",
  quizComplete: "vlx_quiz_complete",
  reviewStateUpdate: "vlx_review_state_update",
  dueReviewStart: "vlx_due_review_start",
  weakReviewStart: "vlx_weak_review_start",
  saveWordClick: "vlx_save_word_click",
  examPackPreviewView: "vlx_exam_pack_preview_view",
  examPackPreviewStart: "vlx_exam_pack_preview_start",
  paywallView: "vlx_paywall_view",
  upgradeClick: "vlx_upgrade_click"
} as const satisfies Record<string, VlxAnalyticsEventName>;

type VlxDataLayerWindow = Window & {
  dataLayer?: unknown[];
};

function getBrowserWindow() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window as VlxDataLayerWindow;
}

function getPagePath(browserWindow: VlxDataLayerWindow | undefined) {
  if (!browserWindow?.location) {
    return undefined;
  }

  return `${browserWindow.location.pathname}${browserWindow.location.search}`;
}

function createEventId(eventName: VlxAnalyticsEventName) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${eventName}_${Date.now()}_${randomPart}`;
}

function pushToDataLayer(payload: VlxAnalyticsEventPayload) {
  const browserWindow = getBrowserWindow();
  const dataLayer = browserWindow?.dataLayer;

  if (!Array.isArray(dataLayer)) {
    return;
  }

  dataLayer.push(payload);
}

export function emitVlxEvent<TEventName extends VlxAnalyticsEventName>(
  event: TEventName,
  input: VlxAnalyticsEventInput<TEventName>
): VlxAnalyticsEvent<TEventName> {
  const browserWindow = getBrowserWindow();
  const payload = {
    ...input,
    event,
    eventId: input.eventId ?? createEventId(event),
    eventTime: input.eventTime ?? new Date().toISOString(),
    pagePath: input.pagePath ?? getPagePath(browserWindow)
  } as VlxAnalyticsEvent<TEventName>;

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
