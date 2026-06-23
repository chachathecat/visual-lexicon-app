import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getRetentionSignals,
  pushVlxEvent,
  resetDataLayerDedupState,
  sanitizeVlxEventPayload,
  VLX_ANALYTICS_EVENTS
} from "../src/lib/analytics";
import type {
  VlxReviewEventsStore,
  VlxReviewStateStore,
  VlxSavedWordsStore
} from "../src/lib/srs/types";
import { VLX_STORAGE_KEYS } from "../src/lib/srs/types";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();

const allowedVlxStorageKeys = [
  VLX_STORAGE_KEYS.savedWords,
  VLX_STORAGE_KEYS.reviewState,
  VLX_STORAGE_KEYS.reviewEvents,
  VLX_STORAGE_KEYS.dailyStats,
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
] as const;

type GlobalWindowStub = {
  dataLayer: unknown[];
  location: { pathname: string };
};

function fixedIso(value: string) {
  return new Date(value).toISOString();
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "word_page",
    savedAt: minutesFromNow(-60),
    ...overrides
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === "string"
      ? overrides.createdAt
      : minutesFromNow(-60);

  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: minutesFromNow(-1),
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

function makeReviewEvent(overrides: Record<string, unknown> = {}) {
  const event = {
    eventId: "evt-default",
    sessionId: "s-default",
    slug: "dissonance",
    word: "Dissonance",
    hub: "academic-vocabulary",
    questionType: "due_review",
    selected: "Dissonance",
    answer: "Dissonance",
    result: "correct",
    responseMs: 800,
    confidence: "knew",
    createdAt: fixedIso("2026-06-22T10:00:00.000Z"),
    boxBefore: 0,
    boxAfter: 1,
    weakScoreBefore: 0.5,
    weakScoreAfter: 0.5,
    ...overrides
  };

  if (
    Object.prototype.hasOwnProperty.call(overrides, "eventId") &&
    overrides.eventId === undefined
  ) {
    delete (event as Record<string, unknown>).eventId;
  }

  return event;
}

function snapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function setAnalyticsWindow(pathname = "/review") {
  (globalThis as unknown as { window?: GlobalWindowStub }).window = {
    dataLayer: [],
    location: { pathname }
  };
}

function getNodeDataLayer() {
  return (
    (globalThis as unknown as { window?: GlobalWindowStub }).window?.dataLayer ??
    []
  );
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  }, allowedVlxStorageKeys);
}

async function seedVlxLocalStorage(
  page: Page,
  values: {
    savedWords?: Record<string, unknown>;
    reviewState?: Record<string, unknown>;
    reviewEvents?: unknown[];
    dailyStats?: Record<string, unknown>;
  }
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ dailyStats, reviewEvents, reviewState, savedWords }) => {
      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify(savedWords ?? {})
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify(reviewState ?? {})
      );
      localStorage.setItem(
        "vlx_review_events_v1",
        JSON.stringify(reviewEvents ?? [])
      );
      localStorage.setItem(
        "vlx_daily_stats_v1",
        JSON.stringify(dailyStats ?? {})
      );
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    },
    values
  );
}

async function readLocalJson<T>(page: Page, key: string) {
  return await page.evaluate((storageKey) => {
    const rawValue = localStorage.getItem(storageKey);

    return rawValue ? JSON.parse(rawValue) : null;
  }, key) as T | null;
}

async function getDataLayerEvents(page: Page, eventName: string) {
  return await page.evaluate((name) => {
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;

    if (!Array.isArray(dataLayer)) {
      return [];
    }

    return dataLayer.filter((item): item is Record<string, unknown> => {
      return Boolean(
        item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          (item as Record<string, unknown>).event === name
      );
    });
  }, eventName);
}

async function waitForDataLayerEvent(page: Page, eventName: string) {
  await page.waitForFunction(
    (name) => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] })
        .dataLayer;

      return (
        Array.isArray(dataLayer) &&
        dataLayer.some(
          (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            (item as Record<string, unknown>).event === name
        )
      );
    },
    eventName,
    { timeout: 15000 }
  );
}

async function waitForEventResult(
  page: Page,
  eventName: string,
  result: string
) {
  await expect
    .poll(
      async () =>
        (await getDataLayerEvents(page, eventName)).some(
          (event) => event.result === result
        ),
      { timeout: 15000 }
    )
    .toBe(true);
}

function isExpectedSaveNavigationAbort(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /net::ERR_ABORTED|frame was detached/i.test(message);
}

async function gotoSaveRoute(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!isExpectedSaveNavigationAbort(error)) {
      throw error;
    }
  }
}

test("retention conversion requires savedAt and handles zero denominator", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const noSavedSignals = getRetentionSignals(
    {},
    [
      makeReviewEvent({
        eventId: "evt-unsaved",
        slug: "unsaved",
        createdAt: fixedIso("2026-06-21T10:00:00.000Z")
      })
    ] as VlxReviewEventsStore,
    now
  );

  expect(noSavedSignals.savedWordsCount).toBe(0);
  expect(noSavedSignals.savedWordsReviewedAtLeastOnce).toBe(0);
  expect(noSavedSignals.saveToFirstReviewRate).toBeNull();

  const savedWords = {
    before: makeSavedWord({
      slug: "before",
      word: "Before",
      savedAt: fixedIso("2026-06-20T10:00:00.000Z")
    }),
    at: makeSavedWord({
      slug: "at",
      word: "At",
      savedAt: fixedIso("2026-06-20T11:00:00.000Z")
    }),
    after: makeSavedWord({
      slug: "after",
      word: "After",
      savedAt: fixedIso("2026-06-20T12:00:00.000Z")
    })
  } as VlxSavedWordsStore;
  const signals = getRetentionSignals(
    savedWords,
    [
      makeReviewEvent({
        eventId: "evt-before",
        slug: "before",
        word: "Before",
        createdAt: fixedIso("2026-06-20T09:59:59.999Z")
      }),
      makeReviewEvent({
        eventId: "evt-at",
        slug: "at",
        word: "At",
        createdAt: fixedIso("2026-06-20T11:00:00.000Z")
      }),
      makeReviewEvent({
        eventId: "evt-after",
        slug: "after",
        word: "After",
        createdAt: fixedIso("2026-06-20T12:00:00.001Z")
      })
    ] as VlxReviewEventsStore,
    now
  );

  expect(signals.savedWordsCount).toBe(3);
  expect(signals.savedWordsReviewedAtLeastOnce).toBe(2);
  expect(signals.saveToFirstReviewRate).toBe(2 / 3);
});

test("retention selector uses accepted deduped review events over seven UTC dates", () => {
  const now = "2026-06-22T12:00:00.000Z";
  const reviewEvents = [
    makeReviewEvent({
      eventId: "evt-boundary",
      slug: "boundary",
      word: "Boundary",
      questionType: "due_review",
      createdAt: fixedIso("2026-06-16T00:00:00.000Z"),
      weakScoreBefore: 0.8,
      weakScoreAfter: 0.4
    }),
    makeReviewEvent({
      eventId: "evt-old",
      slug: "old",
      word: "Old",
      questionType: "due_review",
      createdAt: fixedIso("2026-06-15T23:59:59.999Z")
    }),
    makeReviewEvent({
      eventId: "evt-today-1",
      slug: "today",
      word: "Today",
      questionType: "image_to_word",
      createdAt: fixedIso("2026-06-22T12:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-today-2",
      slug: "today",
      word: "Today",
      questionType: "image_to_word",
      createdAt: fixedIso("2026-06-22T11:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-duplicate",
      slug: "duplicate",
      word: "Duplicate",
      questionType: "due_review",
      createdAt: fixedIso("2026-06-21T10:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-duplicate",
      slug: "duplicate",
      word: "Duplicate",
      questionType: "due_review",
      createdAt: fixedIso("2026-06-21T10:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-conflict",
      slug: "conflict",
      word: "Conflict",
      questionType: "word_to_image",
      createdAt: fixedIso("2026-06-21T11:00:00.000Z")
    }),
    makeReviewEvent({
      eventId: "evt-conflict",
      slug: "conflict",
      word: "Conflict",
      questionType: "word_to_image",
      result: "wrong",
      selected: "Other",
      createdAt: fixedIso("2026-06-21T11:00:00.000Z")
    }),
    {
      eventId: "evt-malformed",
      sessionId: "s-default",
      slug: "malformed",
      word: "Malformed",
      questionType: "due_review",
      result: "correct",
      responseMs: 900,
      createdAt: fixedIso("2026-06-20T10:00:00.000Z"),
      boxAfter: 1,
      weakScoreBefore: 0.3,
      weakScoreAfter: 0.2
    },
    makeReviewEvent({
      eventId: "evt-future",
      slug: "future",
      word: "Future",
      questionType: "due_review",
      createdAt: fixedIso("2026-06-22T12:00:00.001Z")
    }),
    makeReviewEvent({
      eventId: undefined,
      slug: "legacy",
      word: "Legacy",
      questionType: "weak_review",
      createdAt: fixedIso("2026-06-20T10:00:00.000Z"),
      weakScoreBefore: 0.9,
      weakScoreAfter: 0.3
    }),
    makeReviewEvent({
      eventId: undefined,
      slug: "legacy",
      word: "Legacy",
      questionType: "weak_review",
      createdAt: fixedIso("2026-06-20T10:00:00.000Z"),
      weakScoreBefore: 0.9,
      weakScoreAfter: 0.3
    }),
    makeReviewEvent({
      eventId: "evt-friday",
      slug: "friday",
      word: "Friday",
      questionType: "definition_to_word",
      createdAt: fixedIso("2026-06-19T10:00:00.000Z")
    })
  ] as VlxReviewEventsStore;
  const savedWords = {};
  const savedSnapshot = snapshot(savedWords);
  const eventsSnapshot = snapshot(reviewEvents);
  const signals = getRetentionSignals(savedWords, reviewEvents, now);

  expect(signals.weeklyReviewedWords).toBe(6);
  expect(signals.reviewedTodayWords).toBe(1);
  expect(signals.activeReviewDays7d).toBe(5);
  expect(signals.hasConsecutiveDayReturn).toBe(true);
  expect(signals.dueReviewedWords7d).toBe(2);
  expect(signals.weakRecoveredWords7d).toBe(2);
  expect(signals.duplicateEventCount).toBe(2);
  expect(signals.invalidEventCount).toBe(3);
  expect(savedWords).toEqual(savedSnapshot);
  expect(reviewEvents).toEqual(eventsSnapshot);
});

test("runtime envelope preserves valid fields and strips unsafe payload data", () => {
  const payload = sanitizeVlxEventPayload(VLX_ANALYTICS_EVENTS.reviewAnswer, {
    eventId: "evt-envelope",
    eventTime: "2026-06-22T10:00:00.000Z",
    route:
      "/review/due?email=learner@example.test&token=secret&url=https://example.test#raw",
    sessionId: "s-envelope",
    slug: "dissonance",
    responseMs: 1200,
    durationMs: 4200,
    confidence: "knew",
    masteryAfter: "Strong",
    weakScoreBefore: 0.72,
    weakScoreAfter: 0.24,
    boxBefore: 2,
    boxAfter: 3,
    selected: "private answer",
    answer: "Dissonance",
    email: "learner@example.test",
    token: "secret",
    auth: "bearer secret",
    url: "https://example.test/private",
    aliasQuery: "raw learner query",
    pageText: "full page content",
    arbitrary: { nested: true },
    schemaVersion: 9,
    sourceOfTruth: "server"
  } as Record<string, unknown>);

  expect(payload).toMatchObject({
    event: "vlx_review_answer",
    eventId: "evt-envelope",
    eventTime: "2026-06-22T10:00:00.000Z",
    schemaVersion: 1,
    sourceOfTruth: "client",
    route: "/review/due",
    sessionId: "s-envelope",
    slug: "dissonance",
    responseMs: 1200,
    durationMs: 4200,
    confidence: "knew",
    masteryAfter: "Strong",
    weakScoreBefore: 0.72,
    weakScoreAfter: 0.24,
    boxBefore: 2,
    boxAfter: 3
  });

  for (const forbiddenKey of [
    "selected",
    "answer",
    "email",
    "token",
    "auth",
    "url",
    "aliasQuery",
    "pageText",
    "arbitrary"
  ]) {
    expect(payload).not.toHaveProperty(forbiddenKey);
  }
});

test("runtime envelope omits invalid numeric values", () => {
  const payload = sanitizeVlxEventPayload(VLX_ANALYTICS_EVENTS.reviewComplete, {
    eventId: "evt-invalid-numeric",
    responseMs: -1,
    durationMs: Number.POSITIVE_INFINITY,
    boxBefore: -1,
    boxAfter: 6,
    weakScoreBefore: -0.1,
    weakScoreAfter: 1.1,
    reviewedCount: 1.5,
    correctCount: -1,
    wrongCount: Number.NaN,
    queueSize: 2.2
  } as Record<string, unknown>);

  for (const omittedKey of [
    "responseMs",
    "durationMs",
    "boxBefore",
    "boxAfter",
    "weakScoreBefore",
    "weakScoreAfter",
    "reviewedCount",
    "correctCount",
    "wrongCount",
    "queueSize"
  ]) {
    expect(payload).not.toHaveProperty(omittedKey);
  }
});

test("dataLayer dedupe is scoped by event name and eventId", () => {
  setAnalyticsWindow("/save");
  resetDataLayerDedupState();

  pushVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    eventId: "evt-shared",
    slug: "dissonance",
    result: "saved"
  });
  pushVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    eventId: "evt-shared",
    slug: "dissonance",
    result: "saved"
  });
  pushVlxEvent(VLX_ANALYTICS_EVENTS.saveWord, {
    eventId: "evt-shared",
    slug: "lucid",
    result: "saved"
  });
  pushVlxEvent(VLX_ANALYTICS_EVENTS.reviewAnswer, {
    eventId: "evt-shared",
    sessionId: "s-shared",
    slug: "dissonance",
    result: "correct"
  });

  const layer = getNodeDataLayer();

  expect(layer).toHaveLength(2);
  expect(layer[0]).toMatchObject({
    event: "vlx_save_word",
    eventId: "evt-shared",
    slug: "dissonance"
  });
  expect(layer[1]).toMatchObject({
    event: "vlx_review_answer",
    eventId: "evt-shared",
    sessionId: "s-shared"
  });
});

test("canonical dashboard entry preserves the retention selector boundary", async ({
  page
}) => {
  const rootRoute = readFileSync(
    join(workspaceRoot, "src", "app", "page.tsx"),
    "utf8"
  );
  const dashboardRoute = readFileSync(
    join(workspaceRoot, "src", "app", "dashboard", "page.tsx"),
    "utf8"
  );
  const dashboardV2View = readFileSync(
    join(workspaceRoot, "src", "components", "views", "dashboard-v2-view.tsx"),
    "utf8"
  );

  expect(rootRoute).toContain('redirect("/dashboard");');
  expect(rootRoute).not.toContain("DashboardView");
  expect(dashboardRoute).toContain("DashboardV2View");
  expect(dashboardV2View).not.toContain("getWeeklyReviewedWords");

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  expect(new URL(page.url()).pathname).toBe("/dashboard");
  await expect(page.locator(".dashboard-v2-mission-card")).toBeVisible();
  await expect(page.getByText("Weekly Reviewed Words")).toHaveCount(0);
});

test.describe("browser runtime analytics gate", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });
  });

  test("active review emits start, committed answer, and completion once", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState: {
        dissonance: makeReviewStateItem()
      }
    });

    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await waitForDataLayerEvent(page, "vlx_review_start");

    let startEvents = await getDataLayerEvents(page, "vlx_review_start");
    expect(startEvents).toHaveLength(1);
    expect(startEvents[0]).toMatchObject({
      event: "vlx_review_start",
      mode: "saved",
      queueSize: 1,
      dueCount: 1,
      weakCount: 0
    });
    expect(typeof startEvents[0].sessionId).toBe("string");
    expect(startEvents[0].eventId).toBe(
      `vlx_review_start_${startEvents[0].sessionId}`
    );

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();
    await waitForDataLayerEvent(page, "vlx_review_answer");

    const storedEvents = await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    );
    const answerEvents = await getDataLayerEvents(page, "vlx_review_answer");
    const answerEvent = answerEvents.at(-1);

    expect(storedEvents).toHaveLength(1);
    expect(answerEvents).toHaveLength(1);
    expect(answerEvent).toMatchObject({
      event: "vlx_review_answer",
      eventId: storedEvents?.[0]?.eventId,
      sessionId: storedEvents?.[0]?.sessionId,
      slug: "dissonance",
      mode: "saved",
      source: "saved",
      result: storedEvents?.[0]?.result,
      questionType: storedEvents?.[0]?.questionType,
      responseMs: storedEvents?.[0]?.responseMs,
      confidence: storedEvents?.[0]?.confidence,
      boxBefore: storedEvents?.[0]?.boxBefore,
      boxAfter: storedEvents?.[0]?.boxAfter,
      weakScoreBefore: storedEvents?.[0]?.weakScoreBefore,
      weakScoreAfter: storedEvents?.[0]?.weakScoreAfter
    });
    expect(answerEvent).toHaveProperty("masteryAfter");
    expect(answerEvent).not.toHaveProperty("selected");

    await page.getByRole("button", { name: /View summary/i }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await waitForDataLayerEvent(page, "vlx_review_complete");
    await expect(page.locator(".review-v2-summary")).toBeVisible();

    const completeEvents = await getDataLayerEvents(page, "vlx_review_complete");
    const completeEvent = completeEvents[0];

    expect(completeEvents).toHaveLength(1);
    expect(completeEvent).toMatchObject({
      event: "vlx_review_complete",
      eventId: `vlx_review_complete_${storedEvents?.[0]?.sessionId}`,
      sessionId: storedEvents?.[0]?.sessionId,
      mode: "saved",
      reviewedCount: 1
    });
    expect(completeEvent.reviewedCount).toBe(
      Number(completeEvent.correctCount) + Number(completeEvent.wrongCount)
    );
    expect(typeof completeEvent.durationMs).toBe("number");
    expect(Number(completeEvent.durationMs)).toBeGreaterThanOrEqual(0);

    startEvents = await getDataLayerEvents(page, "vlx_review_start");
    expect(startEvents).toHaveLength(1);
  });

  test("empty review emits no start", async ({ page }) => {
    await seedVlxLocalStorage(page, {});

    await page.goto(`${baseUrl}/review?mode=due`, {
      waitUntil: "networkidle"
    });
    await expect(page.locator(".review-v2-empty")).toBeVisible();
    await page.waitForTimeout(300);

    expect(await getDataLayerEvents(page, "vlx_review_start")).toHaveLength(0);
  });

  test("rolled-back answer emits no answer and retry emits one committed answer", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState: {
        dissonance: makeReviewStateItem()
      }
    });

    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;

      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "vlx_review_events_v1" && !failed) {
          failed = true;
          throw new Error("forced review event write failure");
        }

        return originalSetItem.call(this, key, value);
      };
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();

    await expect(page.locator(".review-v2-storage-alert")).toContainText(
      /restored|retry/i
    );
    expect(await getDataLayerEvents(page, "vlx_review_answer")).toHaveLength(0);
    expect(await getDataLayerEvents(page, "vlx_review_state_update")).toHaveLength(
      0
    );
    expect(await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    )).toHaveLength(0);

    await page.getByRole("button", { name: "Retry save" }).click();
    await waitForDataLayerEvent(page, "vlx_review_answer");
    await expect(page.locator(".review-v2-feedback")).toBeVisible();

    const answerEvents = await getDataLayerEvents(page, "vlx_review_answer");
    const storedEvents = await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    );

    expect(answerEvents).toHaveLength(1);
    expect(storedEvents).toHaveLength(1);
    expect(answerEvents[0]).toMatchObject({
      eventId: storedEvents?.[0]?.eventId,
      sessionId: storedEvents?.[0]?.sessionId
    });

    await page.getByRole("button", { name: /View summary/i }).click();
    await waitForDataLayerEvent(page, "vlx_review_complete");

    const completeEvents = await getDataLayerEvents(page, "vlx_review_complete");

    expect(completeEvents).toHaveLength(1);
    expect(completeEvents[0].reviewedCount).toBe(1);
    expect(completeEvents[0].reviewedCount).toBe(
      Number(completeEvents[0].correctCount) +
        Number(completeEvents[0].wrongCount)
    );
  });

  test("save analytics reports saved, duplicate, missing, and storage_error honestly", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);
    await gotoSaveRoute(
      page,
      `${baseUrl}/save?slug=dissonance&source=word_page&email=learner@example.test&token=secret#raw`
    );
    await waitForEventResult(page, "vlx_save_word", "saved");

    let saveEvents = await getDataLayerEvents(page, "vlx_save_word");
    expect(saveEvents).toHaveLength(1);
    expect(saveEvents[0]).toMatchObject({
      event: "vlx_save_word",
      route: "/save",
      slug: "dissonance",
      source: "word_page",
      result: "saved",
      hasLocalSavedWord: true,
      hasLocalReviewState: true
    });
    for (const forbiddenKey of ["email", "token", "auth", "url", "pagePath"]) {
      expect(saveEvents[0]).not.toHaveProperty(forbiddenKey);
    }

    await page.evaluate(() => {
      const rawState = localStorage.getItem("vlx_review_state_v1");
      const state = rawState ? JSON.parse(rawState) : {};

      state.dissonance = {
        ...state.dissonance,
        box: 3,
        mastery: "Strong",
        correct: 4,
        wrong: 1,
        weakScore: 0.11
      };
      localStorage.setItem("vlx_review_state_v1", JSON.stringify(state));
    });

    await gotoSaveRoute(
      page,
      `${baseUrl}/save?slug=dissonance&source=token&auth=secret`
    );
    await waitForEventResult(page, "vlx_save_word", "duplicate");

    saveEvents = await getDataLayerEvents(page, "vlx_save_word");
    expect(saveEvents).toHaveLength(1);
    expect(saveEvents[0]).toMatchObject({
      event: "vlx_save_word",
      route: "/save",
      slug: "dissonance",
      result: "duplicate"
    });
    expect(saveEvents[0]).not.toHaveProperty("source");
    expect(saveEvents[0]).not.toHaveProperty("auth");

    const stateAfterDuplicate = await readLocalJson<VlxReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );

    expect(stateAfterDuplicate?.dissonance).toMatchObject({
      box: 3,
      mastery: "Strong",
      correct: 4,
      wrong: 1,
      weakScore: 0.11
    });

    await clearVlxLocalStorage(page);
    await gotoSaveRoute(page, `${baseUrl}/save?source=email&token=secret`);
    await waitForEventResult(page, "vlx_save_word", "missing");

    const missingEvents = await getDataLayerEvents(page, "vlx_save_word");
    expect(missingEvents).toHaveLength(1);
    expect(missingEvents[0]).toMatchObject({
      event: "vlx_save_word",
      route: "/save",
      result: "missing"
    });
    expect(missingEvents[0]).not.toHaveProperty("slug");
    expect(missingEvents[0]).not.toHaveProperty("source");

    await clearVlxLocalStorage(page);
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;

      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "vlx_saved_words_v1") {
          throw new Error("forced save write failure");
        }

        return originalSetItem.call(this, key, value);
      };
    });
    await gotoSaveRoute(page, `${baseUrl}/save?slug=dissonance&source=word_page`);
    await waitForEventResult(page, "vlx_save_word", "storage_error");

    const storageErrorEvents = await getDataLayerEvents(page, "vlx_save_word");
    expect(storageErrorEvents).toHaveLength(1);
    expect(storageErrorEvents[0]).toMatchObject({
      event: "vlx_save_word",
      route: "/save",
      slug: "dissonance",
      source: "word_page",
      result: "storage_error"
    });
  });

  test("pricing interest is local diagnostics and does not change entitlement", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const planBefore = await page.evaluate(() =>
      localStorage.getItem("vlx_plan_state_v1")
    );

    await page.getByRole("button", { name: "Request early access" }).click();
    await waitForDataLayerEvent(page, "vlx_pricing_interest");

    const events = await getDataLayerEvents(page, "vlx_pricing_interest");
    const planAfter = await page.evaluate(() =>
      localStorage.getItem("vlx_plan_state_v1")
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event: "vlx_pricing_interest",
      route: "/pricing",
      source: "pricing_page",
      plan: "pro"
    });
    expect(planAfter).toBe(planBefore);
  });

  test("runtime flows do not create new vlx storage keys", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await gotoSaveRoute(page, `${baseUrl}/save?slug=dissonance&source=app`);
    await waitForEventResult(page, "vlx_save_word", "saved");

    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Request early access" }).click();
    await waitForDataLayerEvent(page, "vlx_pricing_interest");

    const keys = await page.evaluate(() => {
      return {
        local: Object.keys(localStorage).filter((key) => key.startsWith("vlx_")),
        session: Object.keys(sessionStorage).filter((key) =>
          key.startsWith("vlx_")
        )
      };
    });
    const allowedKeys = new Set<string>(allowedVlxStorageKeys);

    expect(keys.local.filter((key) => !allowedKeys.has(key))).toEqual([]);
    expect(keys.session.filter((key) => !allowedKeys.has(key))).toEqual([]);
  });
});
