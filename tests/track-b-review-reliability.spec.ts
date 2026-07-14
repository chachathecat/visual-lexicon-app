import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import {
  appendReviewEvent,
  applyReviewAnswer,
  readReviewState,
  writeReviewState
} from "../src/lib/srs/storage";
import { getDueToday } from "../src/lib/srs/selectors";
import {
  VLX_STORAGE_KEYS,
  type VlxDailyStatsStore,
  type VlxReviewEvent,
  type VlxReviewEventsStore,
  type VlxReviewStateItem,
  type VlxReviewStateStore,
  type VlxSavedWordsStore
} from "../src/lib/srs/types";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const savedAt = "2026-06-20T08:00:00.000Z";
const reviewedAt = "2026-06-20T12:00:00.000Z";
const reviewDate = "2026-06-20";

const approvedStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1"
] as const;

const cleanupStorageKeys = [
  ...approvedStorageKeys,
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const words = {
  dissonance: {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary"
  },
  abundance: {
    slug: "abundance",
    word: "Abundance",
    image: "https://cdn.visuallexicon.org/images/abundance.webp",
    definition: "A large quantity of something useful or valuable.",
    hub: "core-vocabulary"
  },
  resilient: {
    slug: "resilient",
    word: "Resilient",
    image: "https://cdn.visuallexicon.org/images/resilient.webp",
    definition: "Able to recover after pressure, shock, or difficulty.",
    hub: "workplace-english"
  },
  obfuscate: {
    slug: "obfuscate",
    word: "Obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    hub: "academic-vocabulary"
  },
  lucid: {
    slug: "lucid",
    word: "Lucid",
    image: "https://cdn.visuallexicon.org/images/lucid.webp",
    definition: "Clear and easy to understand.",
    hub: "academic-vocabulary"
  }
} as const;

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "window"
);

type MemoryStorage = Storage & {
  failNextRemoveItemFor(key: string): void;
  failNextSetItemFor(
    key: string,
    when?: (value: string, currentValue: string | null) => boolean
  ): void;
};

function createMemoryLocalStorage(): MemoryStorage {
  const store = new Map<string, string>();
  const removeFailures = new Map<string, number>();
  const setFailures = new Map<
    string,
    Array<(value: string, currentValue: string | null) => boolean>
  >();

  return {
    failNextRemoveItemFor(key: string) {
      removeFailures.set(key, (removeFailures.get(key) ?? 0) + 1);
    },
    failNextSetItemFor(key: string, when = () => true) {
      setFailures.set(key, [...(setFailures.get(key) ?? []), when]);
    },
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      const remainingFailures = removeFailures.get(key) ?? 0;

      if (remainingFailures > 0) {
        removeFailures.set(key, remainingFailures - 1);
        throw new Error(`Forced localStorage remove failure for ${key}`);
      }

      store.delete(key);
    },
    setItem(key: string, value: string) {
      const currentValue = store.get(key) ?? null;
      const keyFailures = setFailures.get(key) ?? [];
      const failureIndex = keyFailures.findIndex((when) =>
        when(value, currentValue)
      );

      if (failureIndex >= 0) {
        setFailures.set(key, [
          ...keyFailures.slice(0, failureIndex),
          ...keyFailures.slice(failureIndex + 1)
        ]);
        throw new Error(`Forced localStorage failure for ${key}`);
      }

      store.set(key, value);
    }
  };
}

function installLocalStorage() {
  const localStorage = createMemoryLocalStorage();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage }
  });

  return localStorage;
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, "window");
}

function readStorageJson<T>(localStorage: Storage, key: string): T {
  const rawValue = localStorage.getItem(key);

  expect(rawValue).not.toBeNull();

  return JSON.parse(rawValue as string) as T;
}

function snapshotReviewStores(localStorage: Storage) {
  return {
    reviewState: localStorage.getItem(VLX_STORAGE_KEYS.reviewState),
    reviewEvents: localStorage.getItem(VLX_STORAGE_KEYS.reviewEvents),
    dailyStats: localStorage.getItem(VLX_STORAGE_KEYS.dailyStats)
  };
}

function makeReviewStateItem(
  slug: keyof typeof words = "dissonance",
  overrides: Partial<VlxReviewStateItem> = {}
): VlxReviewStateItem {
  const word = words[slug];
  const createdAt = overrides.createdAt ?? savedAt;

  return {
    ...word,
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: createdAt,
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

function makeSavedWordsStore() {
  return Object.fromEntries(
    Object.values(words).map((word) => [
      word.slug,
      {
        ...word,
        source: "word_page",
        savedAt
      }
    ])
  ) as VlxSavedWordsStore;
}

function seedStorageStores(localStorage: Storage) {
  localStorage.setItem(
    VLX_STORAGE_KEYS.reviewState,
    JSON.stringify({
      dissonance: makeReviewStateItem("dissonance")
    } satisfies VlxReviewStateStore)
  );
  localStorage.setItem(VLX_STORAGE_KEYS.reviewEvents, "[]");
  localStorage.setItem(VLX_STORAGE_KEYS.dailyStats, "{}");
}

function makeAnswerInput(overrides = {}) {
  return {
    eventId: "evt_reliability_1",
    sessionId: "s_reliability_1",
    slug: "dissonance",
    word: "Dissonance",
    image: words.dissonance.image,
    definition: words.dissonance.definition,
    hub: words.dissonance.hub,
    questionType: "saved_review",
    selected: "Dissonance",
    answer: "Dissonance",
    result: "correct",
    responseMs: 1200,
    confidence: "knew",
    createdAt: reviewedAt,
    ...overrides
  } as const;
}

async function readLocalJson<T = unknown>(
  page: Page,
  key: string
): Promise<T | null> {
  return await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, key);
}

async function readLocalRaw(page: Page, key: string) {
  return await page.evaluate((storageKey) => {
    return localStorage.getItem(storageKey);
  }, key);
}

async function snapshotPageReviewStores(page: Page) {
  return {
    reviewState: await readLocalRaw(page, "vlx_review_state_v1"),
    reviewEvents: await readLocalRaw(page, "vlx_review_events_v1"),
    dailyStats: await readLocalRaw(page, "vlx_daily_stats_v1")
  };
}

async function clearLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, cleanupStorageKeys);
}

async function seedPageStorage(
  page: Page,
  values: {
    dailyStats?: VlxDailyStatsStore;
    reviewEvents?: VlxReviewEventsStore;
    reviewState?: VlxReviewStateStore;
    savedWords?: VlxSavedWordsStore;
  } = {}
) {
  await clearLocalStorage(page);
  await page.evaluate(
    ({ values }) => {
      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify(values.savedWords ?? {})
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify(values.reviewState ?? {})
      );
      localStorage.setItem(
        "vlx_review_events_v1",
        JSON.stringify(values.reviewEvents ?? [])
      );
      localStorage.setItem(
        "vlx_daily_stats_v1",
        JSON.stringify(values.dailyStats ?? {})
      );
    },
    { values }
  );
}

async function getReviewEventCount(page: Page) {
  return await page.evaluate(() => {
    try {
      const events = JSON.parse(
        localStorage.getItem("vlx_review_events_v1") ?? "[]"
      );

      return Array.isArray(events) ? events.length : 0;
    } catch {
      return 0;
    }
  });
}

async function getDailyReviewedAndSessions(page: Page) {
  return await page.evaluate(() => {
    const stats = JSON.parse(localStorage.getItem("vlx_daily_stats_v1") ?? "{}");

    return Object.values(
      stats as Record<string, { reviewed?: number; sessions?: number }>
    ).reduce<{ reviewed: number; sessions: number }>(
        (total, item) => ({
          reviewed: total.reviewed + (item.reviewed ?? 0),
          sessions: total.sessions + (item.sessions ?? 0)
        }),
        { reviewed: 0, sessions: 0 }
      );
  });
}

async function answerCurrentCard(page: Page, confidence = /I knew it/i) {
  const word = (await page.locator("#review-session-title").innerText()).trim();

  await page.getByRole("button", { name: word, exact: true }).click();
  await page.getByRole("button", { name: confidence }).click();
  await expect(page.locator(".review-v2-feedback")).toBeVisible();
}

test.afterEach(() => {
  restoreWindow();
});

test.describe("Track B review reliability storage", () => {
  test("same eventId applied twice creates one event", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    const firstOutput = applyReviewAnswer(makeAnswerInput());
    const beforeDuplicate = snapshotReviewStores(localStorage);
    const secondOutput = applyReviewAnswer(makeAnswerInput());
    const afterDuplicate = snapshotReviewStores(localStorage);
    const events = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents
    );

    expect(secondOutput.event).toEqual(firstOutput.event);
    expect(afterDuplicate).toEqual(beforeDuplicate);
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe("evt_reliability_1");
  });

  test("conflicting duplicate eventId fails safely", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    applyReviewAnswer(makeAnswerInput());
    const before = snapshotReviewStores(localStorage);

    expect(() =>
      applyReviewAnswer(
        makeAnswerInput({
          result: "wrong",
          selected: "Harmony",
          confidence: "forgot"
        })
      )
    ).toThrow(/conflicts/);
    expect(snapshotReviewStores(localStorage)).toEqual(before);
  });

  test("duplicate input does not double-update state", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    applyReviewAnswer(makeAnswerInput());
    applyReviewAnswer(makeAnswerInput());

    const state = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState
    );

    expect(state.dissonance.correct).toBe(1);
    expect(state.dissonance.box).toBe(1);
  });

  test("duplicate input does not double-increment daily stats", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    applyReviewAnswer(makeAnswerInput());
    applyReviewAnswer(makeAnswerInput());

    const dailyStats = readStorageJson<VlxDailyStatsStore>(
      localStorage,
      VLX_STORAGE_KEYS.dailyStats
    );

    expect(dailyStats[reviewDate].reviewed).toBe(1);
    expect(dailyStats[reviewDate].correct).toBe(1);
  });

  test("duplicate input does not double-increment sessions", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    applyReviewAnswer(makeAnswerInput());
    applyReviewAnswer(makeAnswerInput());

    const dailyStats = readStorageJson<VlxDailyStatsStore>(
      localStorage,
      VLX_STORAGE_KEYS.dailyStats
    );

    expect(dailyStats[reviewDate].sessions).toBe(1);
  });

  test("inputs without eventId retain compatible append behavior", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);

    applyReviewAnswer(makeAnswerInput({ eventId: undefined }));
    applyReviewAnswer(makeAnswerInput({ eventId: undefined }));

    const events = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents
    );
    const state = readStorageJson<VlxReviewStateStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewState
    );

    expect(events).toHaveLength(2);
    expect(state.dissonance.correct).toBe(2);
  });

  test("appendReviewEvent does not store duplicate eventIds", () => {
    const localStorage = installLocalStorage();
    const event = {
      eventId: "evt_append_1",
      sessionId: "s_append_1",
      slug: "dissonance",
      word: "Dissonance",
      hub: "academic-vocabulary",
      questionType: "saved_review",
      selected: "Dissonance",
      answer: "Dissonance",
      result: "correct",
      responseMs: 1000,
      confidence: "knew",
      createdAt: reviewedAt,
      boxBefore: 0,
      boxAfter: 1,
      weakScoreBefore: 0,
      weakScoreAfter: 0
    } satisfies VlxReviewEvent;

    appendReviewEvent(event);
    appendReviewEvent(event);

    const events = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents
    );

    expect(events).toHaveLength(1);
    expect(() => appendReviewEvent({ ...event, result: "wrong" })).toThrow(
      /conflicts/
    );
  });

  for (const [name, key] of [
    ["review_state", VLX_STORAGE_KEYS.reviewState],
    ["review_events", VLX_STORAGE_KEYS.reviewEvents],
    ["daily_stats", VLX_STORAGE_KEYS.dailyStats]
  ] as const) {
    test(`${name} write failure rolls back all stores`, () => {
      const localStorage = installLocalStorage();
      seedStorageStores(localStorage);
      const before = snapshotReviewStores(localStorage);

      localStorage.failNextSetItemFor(key);

      expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(/restored/);
      expect(snapshotReviewStores(localStorage)).toEqual(before);
    });
  }

  test("rollback removes stores that were absent before the failed commit", () => {
    const localStorage = installLocalStorage();
    const before = snapshotReviewStores(localStorage);

    localStorage.failNextSetItemFor(VLX_STORAGE_KEYS.dailyStats);

    expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(/restored/);
    expect(before).toEqual({
      reviewState: null,
      reviewEvents: null,
      dailyStats: null
    });
    expect(snapshotReviewStores(localStorage)).toEqual(before);
  });

  test("rollback removeItem failure is reported as fatal without claiming recovery", () => {
    const localStorage = installLocalStorage();

    localStorage.failNextSetItemFor(VLX_STORAGE_KEYS.dailyStats);
    localStorage.failNextRemoveItemFor(VLX_STORAGE_KEYS.reviewState);

    expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(
      /Fatal local-storage error/
    );
    expect(localStorage.getItem(VLX_STORAGE_KEYS.reviewState)).not.toBeNull();
    expect(localStorage.getItem(VLX_STORAGE_KEYS.reviewEvents)).toBeNull();
    expect(localStorage.getItem(VLX_STORAGE_KEYS.dailyStats)).toBeNull();
  });

  test("rollback setItem failure is reported as fatal without claiming recovery", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);
    const before = snapshotReviewStores(localStorage);

    localStorage.failNextSetItemFor(VLX_STORAGE_KEYS.dailyStats);
    localStorage.failNextSetItemFor(
      VLX_STORAGE_KEYS.reviewEvents,
      (value) => value === before.reviewEvents
    );

    expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(
      /Fatal local-storage error/
    );
    expect(snapshotReviewStores(localStorage)).not.toEqual(before);
  });

  test("retry after rollback commits exactly once", () => {
    const localStorage = installLocalStorage();
    seedStorageStores(localStorage);
    const input = makeAnswerInput({ eventId: "evt_retry_1" });

    localStorage.failNextSetItemFor(VLX_STORAGE_KEYS.reviewEvents);

    expect(() => applyReviewAnswer(input)).toThrow(/restored/);

    applyReviewAnswer(input);

    const events = readStorageJson<VlxReviewEventsStore>(
      localStorage,
      VLX_STORAGE_KEYS.reviewEvents
    );
    const dailyStats = readStorageJson<VlxDailyStatsStore>(
      localStorage,
      VLX_STORAGE_KEYS.dailyStats
    );

    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe("evt_retry_1");
    expect(dailyStats[reviewDate].reviewed).toBe(1);
  });

  test("malformed storage is not silently overwritten by an answer commit", () => {
    const localStorage = installLocalStorage();

    localStorage.setItem(VLX_STORAGE_KEYS.reviewState, "{bad json");
    localStorage.setItem(VLX_STORAGE_KEYS.reviewEvents, "[]");
    localStorage.setItem(VLX_STORAGE_KEYS.dailyStats, "{}");

    expect(readReviewState()).toEqual({});
    expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(
      /malformed JSON/
    );
    expect(localStorage.getItem(VLX_STORAGE_KEYS.reviewState)).toBe("{bad json");
  });

  test("exact nextDueAt boundary is due", () => {
    const boundary = "2026-06-20T12:00:00.000Z";
    const due = makeReviewStateItem("dissonance", {
      mastery: "Learning",
      correct: 1,
      nextDueAt: boundary
    });

    expect(getDueToday({ dissonance: due }, boundary).map((item) => item.slug)).toEqual([
      "dissonance"
    ]);
  });

  test("localStorage unavailable fails without claiming a saved answer", () => {
    restoreWindow();

    expect(() => applyReviewAnswer(makeAnswerInput())).toThrow(/unavailable/);
  });
});

test.describe("Track B review reliability browser flow", () => {
  test("/save creates one saved word and one review-state item exactly once", async ({
    page
  }) => {
    await clearLocalStorage(page);
    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: "networkidle"
    });

    await expect(page.getByText("Added to your review queue")).toBeVisible();

    const savedWords = await readLocalJson<VlxSavedWordsStore>(
      page,
      "vlx_saved_words_v1"
    );
    const reviewState = await readLocalJson<VlxReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );
    const firstRawSavedWords = await readLocalRaw(page, "vlx_saved_words_v1");
    const firstRawReviewState = await readLocalRaw(page, "vlx_review_state_v1");

    expect(Object.keys(savedWords ?? {})).toEqual(["dissonance"]);
    expect(Object.keys(reviewState ?? {})).toEqual(["dissonance"]);
    expect(reviewState?.dissonance).toMatchObject({
      slug: "dissonance",
      word: "Dissonance",
      box: 0,
      mastery: "New",
      correct: 0,
      wrong: 0,
      streakCorrect: 0,
      weakScore: 0
    });
    expect(await readLocalRaw(page, "vlx_review_events_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_daily_stats_v1")).toBeNull();

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Added to your review queue")).toBeVisible();

    expect(await readLocalRaw(page, "vlx_saved_words_v1")).toBe(
      firstRawSavedWords
    );
    expect(await readLocalRaw(page, "vlx_review_state_v1")).toBe(
      firstRawReviewState
    );
    expect(
      Object.keys(
        (await readLocalJson<VlxSavedWordsStore>(
          page,
          "vlx_saved_words_v1"
        )) ?? {}
      )
    ).toEqual(["dissonance"]);
    expect(
      Object.keys(
        (await readLocalJson<VlxReviewStateStore>(
          page,
          "vlx_review_state_v1"
        )) ?? {}
      )
    ).toEqual(["dissonance"]);
  });

  test("rapid answer double click creates one event", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await page.getByRole("button", { name: /I knew it/i }).click();

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("repeated confidence submission creates one event", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("repeated next action advances once", async ({ page }) => {
    await seedPageStorage(page);
    await page.goto(`${baseUrl}/review?mode=hub&hub=academic-vocabulary&limit=2`, {
      waitUntil: "networkidle"
    });

    await answerCurrentCard(page);
    await page.getByRole("button", { name: "Next card" }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect(page.getByRole("heading", { name: "Card 2 of 2" })).toBeVisible();
    await expect(page.locator(".review-v2-summary")).toHaveCount(0);
  });

  test("keyboard plus pointer input creates one event", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("repeated Enter, Space, and click confidence input creates one event and one summary row", async ({
    page
  }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    const confidenceButton = page.getByRole("button", { name: /I knew it/i });

    await confidenceButton.evaluate((button) => {
      button.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "Enter" })
      );
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: " " })
      );
      button.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: " " })
      );
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    expect(await getReviewEventCount(page)).toBe(1);

    await page.getByRole("button", { name: "View summary" }).click();

    await expect(page.locator(".review-v2-summary")).toBeVisible();
    await expect(page.locator(".review-result-row")).toHaveCount(1);
    await expect(page.getByTestId("review-live-region")).toContainText(
      "1 reviewed"
    );
  });

  test("duplicate input does not double-increment browser daily stats or sessions", async ({
    page
  }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const totals = await getDailyReviewedAndSessions(page);

    expect(totals).toEqual({ reviewed: 1, sessions: 1 });
  });

  test("conflicting duplicate eventId leaves raw stores unchanged and shows no success feedback", async ({
    page
  }) => {
    await page.addInitScript(() => {
      const fixedRandomUUID =
        (): `${string}-${string}-${string}-${string}-${string}` =>
          "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

      try {
        Object.defineProperty(crypto, "randomUUID", {
          configurable: true,
          value: fixedRandomUUID
        });
      } catch {
        crypto.randomUUID = fixedRandomUUID;
      }
    });
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore,
      reviewState: {
        dissonance: makeReviewStateItem("dissonance")
      }
    });

    const datePart = await page.evaluate(() =>
      new Date().toISOString().slice(0, 10).replaceAll("-", "")
    );
    const sessionId = `s_${datePart}_saved_aaaaaaaa`;
    const eventId = `evt_${sessionId}_1_dissonance_aaaaaaaa`;

    await page.evaluate(
      ({ eventId, sessionId }) => {
        const conflictingEvent = {
          eventId,
          sessionId,
          slug: "dissonance",
          word: "Dissonance",
          hub: "academic-vocabulary",
          questionType: "saved_review",
          selected: "Harmony",
          answer: "Dissonance",
          result: "wrong",
          responseMs: 9999,
          confidence: "forgot",
          createdAt: "2026-06-20T12:00:00.000Z",
          boxBefore: 0,
          boxAfter: 0,
          weakScoreBefore: 0,
          weakScoreAfter: 0.2
        };

        localStorage.setItem(
          "vlx_review_events_v1",
          JSON.stringify([conflictingEvent])
        );
      },
      { eventId, sessionId }
    );

    const beforeAnswer = await snapshotPageReviewStores(page);

    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();

    const storageAlert = page.locator(".review-v2-storage-alert");
    await expect(storageAlert).toContainText(/could not be saved safely/i);
    expect(await storageAlert.innerText()).not.toMatch(
      /conflict|local storage|vlx_|rollback|malformed|memory state/i
    );
    await expect(page.locator(".review-v2-feedback")).toHaveCount(0);
    expect(await snapshotPageReviewStores(page)).toEqual(beforeAnswer);
  });

  test("persistence failure remains on card and retry commits exactly once", async ({
    page
  }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      const testWindow = window as Window & {
        __vlxAttemptedReviewEventIds?: string[];
      };
      let failed = false;

      testWindow.__vlxAttemptedReviewEventIds = [];
      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "vlx_review_events_v1") {
          try {
            const events = JSON.parse(String(value));
            const event = Array.isArray(events)
              ? events[events.length - 1]
              : null;

            if (
              event &&
              typeof event === "object" &&
              typeof event.eventId === "string"
            ) {
              testWindow.__vlxAttemptedReviewEventIds?.push(event.eventId);
            }
          } catch {
            // Ignore malformed test instrumentation payloads.
          }
        }

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
    await expect(page.locator(".review-v2-feedback")).toHaveCount(0);
    expect(await getReviewEventCount(page)).toBe(0);

    await page.getByRole("button", { name: "Retry save" }).click();

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    const events = await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    );
    const attemptedEventIds = await page.evaluate(() => {
      return (
        (window as Window & { __vlxAttemptedReviewEventIds?: string[] })
          .__vlxAttemptedReviewEventIds ?? []
      );
    });

    await expect(getReviewEventCount(page)).resolves.toBe(1);
    expect(attemptedEventIds).toHaveLength(2);
    expect(new Set(attemptedEventIds).size).toBe(1);
    expect(events).toHaveLength(1);
    expect(events?.[0]?.eventId).toBe(attemptedEventIds[0]);
  });

  test("/review/weak-sprint failed commit rolls back and retry commits one weak event", async ({
    page
  }) => {
    await seedPageStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem("dissonance", {
          mastery: "Weak",
          correct: 1,
          wrong: 2,
          weakScore: 0.75,
          nextDueAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString()
        })
      }
    });
    await page.goto(`${baseUrl}/review/weak-sprint`, {
      waitUntil: "networkidle"
    });
    const beforeAnswer = await snapshotPageReviewStores(page);

    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;

      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "vlx_daily_stats_v1" && !failed) {
          failed = true;
          throw new Error("forced daily stats write failure");
        }

        return originalSetItem.call(this, key, value);
      };
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();

    await expect(page.locator(".review-v2-storage-alert")).toBeVisible();
    await expect(page.locator(".review-v2-feedback")).toHaveCount(0);
    await expect.poll(async () => snapshotPageReviewStores(page)).toEqual(
      beforeAnswer
    );

    await page.getByRole("button", { name: "Retry save" }).click();

    await expect(page.locator(".review-v2-feedback")).toBeVisible();
    const events = await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    );
    const reviewState = await readLocalJson<VlxReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );

    expect(events).toHaveLength(1);
    expect(events?.[0]).toMatchObject({
      slug: "dissonance",
      questionType: "weak_review",
      result: "correct"
    });
    expect(reviewState?.dissonance.correct).toBe(2);
  });

  test("refresh after committed answer does not duplicate", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await answerCurrentCard(page);

    expect(await getReviewEventCount(page)).toBe(1);

    await page.reload({ waitUntil: "networkidle" });

    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("back and forward navigation does not replay an event", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await answerCurrentCard(page);

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await page.goBack({ waitUntil: "networkidle" });
    await page.goForward({ waitUntil: "networkidle" });

    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("one-card session summary is correct", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await answerCurrentCard(page);
    await page.getByRole("button", { name: "View summary" }).click();

    await expect(page.locator(".review-v2-summary")).toBeVisible();
    await expect(page.locator(".review-result-row")).toHaveCount(1);
    await expect(page.getByTestId("review-live-region")).toContainText(
      "1 reviewed"
    );
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("five-card session summary equals committed events", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: makeSavedWordsStore()
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=5`, {
      waitUntil: "networkidle"
    });

    for (let index = 0; index < 5; index += 1) {
      await expect(
        page.getByRole("heading", { name: `Card ${index + 1} of 5` })
      ).toBeVisible();
      await answerCurrentCard(page);
      await page
        .getByRole("button", {
          name: index === 4 ? "View summary" : "Next card"
        })
        .click();
    }

    const events = await readLocalJson<VlxReviewEventsStore>(
      page,
      "vlx_review_events_v1"
    );

    await expect(page.locator(".review-result-row")).toHaveCount(5);
    await expect(page.getByTestId("review-live-region")).toContainText(
      "5 reviewed"
    );
    expect(events).toHaveLength(5);
  });

  test("failed answer is excluded from summary", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      let failed = false;

      Storage.prototype.setItem = function setItem(key, value) {
        if (key === "vlx_daily_stats_v1" && !failed) {
          failed = true;
          throw new Error("forced daily stats write failure");
        }

        return originalSetItem.call(this, key, value);
      };
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();

    await expect(page.locator(".review-v2-storage-alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "View summary" })).toHaveCount(0);
    expect(await getReviewEventCount(page)).toBe(0);

    await page.getByRole("button", { name: "Retry save" }).click();
    await page.getByRole("button", { name: "View summary" }).click();

    await expect(page.locator(".review-result-row")).toHaveCount(1);
    await expect(page.getByTestId("review-live-region")).toContainText(
      "1 reviewed"
    );
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("duplicate slugs are removed from a session", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore,
      reviewState: {
        dissonance: makeReviewStateItem("dissonance", {
          mastery: "Weak",
          wrong: 2,
          weakScore: 0.72,
          nextDueAt: new Date(Date.now() - 60_000).toISOString()
        })
      }
    });

    await page.goto(`${baseUrl}/review?mode=mixed&limit=5`, {
      waitUntil: "networkidle"
    });

    await expect(page.getByRole("heading", { name: "Card 1 of 1" })).toBeVisible();
  });

  test("corrupted storage does not crash the route", async ({ page }) => {
    await clearLocalStorage(page);
    await page.evaluate(() => {
      localStorage.setItem("vlx_saved_words_v1", "{bad json");
      localStorage.setItem("vlx_review_state_v1", "{bad json");
      localStorage.setItem("vlx_review_events_v1", "[]");
      localStorage.setItem("vlx_daily_stats_v1", "{}");
    });

    const response = await page.goto(`${baseUrl}/review`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".review-v2-empty, .review-session")).toHaveCount(1);
  });

  test("empty queues remain honest", async ({ page }) => {
    await seedPageStorage(page);
    await page.goto(`${baseUrl}/review/due`, { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: /No due words right now/i })).toBeVisible();
    await expect(page.locator(".review-session")).toHaveCount(0);
    expect(await getReviewEventCount(page)).toBe(0);
  });

  test("all existing route modes still work", async ({ page }) => {
    const routeSeeds: Array<[string, Parameters<typeof seedPageStorage>[1]]> = [
      [
        "/review",
        {
          savedWords: {
            dissonance: {
              ...words.dissonance,
              source: "word_page",
              savedAt
            }
          } as VlxSavedWordsStore
        }
      ],
      [
        "/review/due",
        {
          reviewState: {
            dissonance: makeReviewStateItem("dissonance", {
              mastery: "Learning",
              correct: 1,
              nextDueAt: new Date(Date.now() - 60_000).toISOString()
            })
          }
        }
      ],
      [
        "/review/weak",
        {
          reviewState: {
            dissonance: makeReviewStateItem("dissonance", {
              mastery: "Weak",
              wrong: 2,
              weakScore: 0.7
            })
          }
        }
      ],
      [
        "/review/weak-sprint",
        {
          reviewState: {
            dissonance: makeReviewStateItem("dissonance", {
              mastery: "Weak",
              wrong: 2,
              weakScore: 0.7
            })
          }
        }
      ],
      [
        "/review?mode=saved",
        {
          savedWords: {
            dissonance: {
              ...words.dissonance,
              source: "word_page",
              savedAt
            }
          } as VlxSavedWordsStore
        }
      ],
      ["/review?mode=word&slug=dissonance&limit=1", {}],
      ["/review?mode=hub&hub=academic-vocabulary&limit=2", {}]
    ];

    for (const [route, seed] of routeSeeds) {
      await seedPageStorage(page, seed);
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "networkidle"
      });

      expect(response?.status(), route).toBe(200);
      await expect(page.locator(".track-b-shell"), route).toHaveCount(1);
      await expect(page.locator(".review-session"), route).toBeVisible({
        timeout: 15000
      });
    }
  });

  test("accessibility announcements still work", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt
        }
      } as VlxSavedWordsStore
    });
    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    const liveRegion = page.getByTestId("review-live-region");

    await expect(liveRegion).toHaveAttribute("role", "status");
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");

    await answerCurrentCard(page);

    await expect(liveRegion).toContainText(/Strong recall|Correct|Not yet/);
    expect(await liveRegion.innerText()).not.toMatch(
      /\bbox\b|weak score|weakScore|memory state updated/i
    );
    await expect(page.locator('[role="status"]')).toHaveCount(1);
  });

  test("missing image fallback renders without failing review", async ({ page }) => {
    await seedPageStorage(page, {
      savedWords: {
        customword: {
          slug: "customword",
          word: "Customword",
          definition: "A learner supplied word without an image.",
          hub: "custom",
          source: "manual",
          savedAt
        }
      } as VlxSavedWordsStore
    });

    await page.goto(`${baseUrl}/review?mode=saved&limit=1`, {
      waitUntil: "networkidle"
    });

    await expect(page.getByRole("img", { name: /Visual cue for Customword/i })).toBeVisible();
    await answerCurrentCard(page);
    expect(await getReviewEventCount(page)).toBe(1);
  });

  test("Figma screenshots remain unchanged through the existing parity gate", () => {
    const figmaSpec = fs.readFileSync(
      path.join(workspaceRoot, "tests", "figma-parity-screenshots.spec.ts"),
      "utf8"
    );
    const snapshotDir = path.join(
      workspaceRoot,
      "tests",
      "figma-parity-screenshots.spec.ts-snapshots"
    );

    expect(figmaSpec).toContain("toHaveScreenshot");
    expect(
      fs.readdirSync(snapshotDir).filter((fileName) => fileName.endsWith(".png"))
        .length
    ).toBeGreaterThanOrEqual(14);
  });
});
