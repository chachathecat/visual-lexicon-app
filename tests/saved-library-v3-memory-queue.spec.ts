import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const reviewStorageKeys = [
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1"
] as const;

const forbiddenRouteDirectories = [
  "src/app/checkout",
  "src/app/billing",
  "src/app/payment",
  "src/app/payments",
  "src/app/api/checkout",
  "src/app/api/billing",
  "src/app/api/payment",
  "src/app/api/payments"
] as const;

const forbiddenDependencies = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy"
] as const;

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();
const oneMinuteAgo = () => minutesFromNow(-1);
const oneHourAgo = () => minutesFromNow(-60);
const twoHoursAgo = () => minutesFromNow(-120);
const oneHourFromNow = () => minutesFromNow(60);
const oneDayFromNow = () => minutesFromNow(24 * 60);

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "word_page",
    savedAt: oneHourAgo(),
    ...overrides
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === "string" ? overrides.createdAt : oneHourAgo();

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
    nextDueAt: createdAt,
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedVlxLocalStorage(
  page: Page,
  values: {
    dailyStats?: Record<string, unknown>;
    reviewEvents?: unknown[];
    reviewState?: Record<string, unknown>;
    savedWords?: Record<string, unknown>;
  }
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(({ dailyStats, reviewEvents, reviewState, savedWords }) => {
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
  }, values);
}

async function readLocalRaw(page: Page, key: string) {
  return await page.evaluate((storageKey) => {
    return localStorage.getItem(storageKey);
  }, key);
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

async function readReviewStorageSnapshot(page: Page) {
  return Object.fromEntries(
    await Promise.all(
      reviewStorageKeys.map(async (key) => [key, await readLocalRaw(page, key)])
    )
  ) as Record<(typeof reviewStorageKeys)[number], string | null>;
}

function tab(page: Page, tabId: string) {
  return page.locator(`#saved-v2-tab-${tabId}`);
}

function panel(page: Page, tabId: string) {
  return page.locator(`#saved-v2-panel-${tabId}`);
}

function card(page: Page, slug: string) {
  return page.locator(`[data-saved-word="${slug}"]`);
}

async function openSaved(page: Page) {
  const response = await page.goto(`${baseUrl}/saved`, {
    waitUntil: "networkidle"
  });

  expect(response?.status()).toBe(200);
}

async function expectPrimaryAction(
  page: Page,
  label: string,
  href: string
) {
  const action = page.getByRole("link", { name: label, exact: true });

  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", href);
}

test.describe("Saved Library v3 Memory Queue", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/saved loads with the required heading, subtitle, and queue tabs", async ({
    page
  }) => {
    await openSaved(page);

    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Saved Library", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Saved words become review cards.")).toBeVisible();

    for (const tabName of [
      "Due",
      "Weak",
      "New",
      "Learning",
      "Mastered",
      "All"
    ]) {
      await expect(page.getByRole("tab", { name: new RegExp(tabName) })).toBeVisible();
    }
  });

  test("loading /saved does not write review state, events, or daily stats", async ({
    page
  }) => {
    const reviewState = {
      dissonance: makeReviewStateItem({
        box: 1,
        mastery: "Learning",
        correct: 1,
        nextDueAt: oneMinuteAgo()
      })
    };
    const reviewEvents = [
      {
        eventId: "evt_saved_v3_read_only",
        sessionId: "s_saved_v3_read_only",
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        selected: "Dissonance",
        answer: "Dissonance",
        result: "correct",
        responseMs: 1200,
        createdAt: oneHourAgo(),
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0,
        weakScoreAfter: 0
      }
    ];
    const dailyStats = {
      "2026-06-10": {
        date: "2026-06-10",
        reviewed: 1,
        correct: 1,
        wrong: 0,
        mastered: 0,
        weakAdded: 0,
        minutes: 0.02,
        sessions: 1
      }
    };

    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState,
      reviewEvents,
      dailyStats
    });

    const before = await readReviewStorageSnapshot(page);

    await openSaved(page);

    expect(await readReviewStorageSnapshot(page)).toEqual(before);
    expect(await readLocalJson(page, "vlx_review_state_v1")).toEqual(reviewState);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toEqual(
      reviewEvents
    );
    expect(await readLocalJson(page, "vlx_daily_stats_v1")).toEqual(dailyStats);
  });

  test("Due tab shows only saved words due at or before now", async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({ savedAt: twoHoursAgo() }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient",
          definition: "Able to recover after pressure.",
          savedAt: oneHourAgo()
        }),
        laconic: makeSavedWord({
          slug: "laconic",
          word: "Laconic",
          definition: "Using very few words.",
          savedAt: oneHourAgo()
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          nextDueAt: oneMinuteAgo(),
          mastery: "Learning",
          correct: 1
        }),
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneHourFromNow()
        }),
        laconic: makeReviewStateItem({
          slug: "laconic",
          word: "Laconic",
          box: 5,
          mastery: "Mastered",
          correct: 8,
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await openSaved(page);

    await expect(tab(page, "due")).toContainText("1");
    await expect(panel(page, "due")).toContainText("Dissonance");
    await expect(card(page, "dissonance")).toContainText("Next due");
    await expect(card(page, "resilient")).toHaveCount(0);
    await expect(card(page, "laconic")).toHaveCount(0);
  });

  test("Weak tab shows Weak mastery, weakScore, and wrong-answer evidence", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate",
          definition: "To make something unclear."
        }),
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          definition: "Clear and easy to understand."
        }),
        abundance: makeSavedWord({
          slug: "abundance",
          word: "Abundance",
          definition: "A large amount."
        }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient",
          definition: "Able to recover after pressure."
        })
      },
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Weak",
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        }),
        lucid: makeReviewStateItem({
          slug: "lucid",
          word: "Lucid",
          mastery: "Learning",
          correct: 2,
          wrong: 1,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        }),
        abundance: makeReviewStateItem({
          slug: "abundance",
          word: "Abundance",
          mastery: "Strong",
          correct: 3,
          wrong: 0,
          weakScore: 0.2,
          nextDueAt: oneDayFromNow()
        }),
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          mastery: "Strong",
          correct: 5,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await openSaved(page);
    await tab(page, "weak").click();

    await expect(tab(page, "weak")).toContainText("3");
    await expect(panel(page, "weak")).toContainText("Obfuscate");
    await expect(panel(page, "weak")).toContainText("Lucid");
    await expect(panel(page, "weak")).toContainText("Abundance");
    await expect(panel(page, "weak")).not.toContainText("Resilient");
    await expect(card(page, "lucid")).toContainText("1 wrong");
    await expect(card(page, "abundance")).toContainText("Weak score 0.2");
  });

  test("New, Learning, Mastered, and All tabs derive from real state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          source: "extension"
        }),
        careful: makeSavedWord({
          slug: "careful",
          word: "Careful",
          source: "alias_search"
        }),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate",
          source: "word_page"
        }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient",
          source: "pack"
        }),
        laconic: makeSavedWord({
          slug: "laconic",
          word: "Laconic"
        }),
        premature: makeSavedWord({
          slug: "premature",
          word: "Premature"
        })
      },
      reviewState: {
        careful: makeReviewStateItem({
          slug: "careful",
          word: "Careful",
          mastery: "New",
          correct: 0,
          wrong: 0,
          nextDueAt: oneDayFromNow()
        }),
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneDayFromNow()
        }),
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          mastery: "Strong",
          correct: 5,
          nextDueAt: oneDayFromNow()
        }),
        laconic: makeReviewStateItem({
          slug: "laconic",
          word: "Laconic",
          box: 5,
          mastery: "Mastered",
          correct: 9,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        }),
        premature: makeReviewStateItem({
          slug: "premature",
          word: "Premature",
          box: 4,
          mastery: "Mastered",
          correct: 8,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await openSaved(page);

    await tab(page, "new").click();
    await expect(tab(page, "new")).toContainText("2");
    await expect(panel(page, "new")).toContainText("Lucid");
    await expect(panel(page, "new")).toContainText("Careful");
    await expect(card(page, "lucid")).toContainText("No review state yet");
    await expect(card(page, "lucid")).toContainText("No due date yet");
    await expect(card(page, "lucid")).toContainText("Extension");
    await expect(card(page, "careful")).toContainText("Alias search");

    await tab(page, "learning").click();
    await expect(tab(page, "learning")).toContainText("2");
    await expect(panel(page, "learning")).toContainText("Obfuscate");
    await expect(panel(page, "learning")).toContainText("Resilient");
    await expect(card(page, "obfuscate")).toContainText("Word page");
    await expect(card(page, "resilient")).toContainText("Pack");
    await expect(panel(page, "learning")).not.toContainText("Laconic");

    await tab(page, "mastered").click();
    await expect(tab(page, "mastered")).toContainText("1");
    await expect(panel(page, "mastered")).toContainText("Laconic");
    await expect(panel(page, "mastered")).not.toContainText("Premature");

    await tab(page, "all").click();
    await expect(tab(page, "all")).toContainText("6");
    await expect(panel(page, "all")).toContainText("Lucid");
    await expect(panel(page, "all")).toContainText("Careful");
    await expect(panel(page, "all")).toContainText("Obfuscate");
    await expect(panel(page, "all")).toContainText("Resilient");
    await expect(panel(page, "all")).toContainText("Laconic");
    await expect(panel(page, "all")).toContainText("Premature");
  });

  test("primary CTA routes for due, weak, new, and empty states", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneMinuteAgo()
        })
      }
    });
    await openSaved(page);
    await expectPrimaryAction(page, "Start due review", "/review/due");

    await seedVlxLocalStorage(page, {
      savedWords: {
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate"
        })
      },
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Weak",
          wrong: 1,
          nextDueAt: oneDayFromNow()
        })
      }
    });
    await openSaved(page);
    await expectPrimaryAction(page, "Practice weak words", "/review/weak");

    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid"
        })
      },
      reviewState: {}
    });
    await openSaved(page);
    await expectPrimaryAction(page, "Review new saved words", "/review");

    await seedVlxLocalStorage(page, {
      savedWords: {},
      reviewState: {}
    });
    await openSaved(page);
    await expectPrimaryAction(page, "Find words to save", "/packs");
  });

  test("word cards include Review now and View word CTAs", async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await openSaved(page);

    await expect(
      card(page, "dissonance").getByRole("link", { name: "Review Dissonance" })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      card(page, "dissonance").getByRole("link", {
        name: "View word Dissonance"
      })
    ).toHaveAttribute("href", "/word/dissonance");
  });

  test("empty states are honest and do not include checkout, billing, or payment copy", async ({
    page
  }) => {
    await openSaved(page);

    const emptyStates: Array<[string, string]> = [
      ["due", "No words due right now."],
      ["weak", "No weak words yet. Wrong answers will appear here."],
      ["new", "Save a word to start your memory queue."],
      ["learning", "Review saved words to build learning progress."],
      ["mastered", "Mastered words appear after delayed recall evidence."],
      ["all", "Your saved words will appear here."]
    ];

    for (const [tabId, heading] of emptyStates) {
      await tab(page, tabId).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/fake progress/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);
    expect(bodyText).not.toMatch(/\bcheckout\b/i);
    expect(bodyText).not.toMatch(/\bbilling\b/i);
    expect(bodyText).not.toMatch(/\bpayment\b/i);
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });

  test("tabs are keyboard accessible with clear selected state", async ({
    page
  }) => {
    await openSaved(page);

    await tab(page, "due").focus();
    await expect(tab(page, "due")).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "weak")).toBeFocused();
    await expect(tab(page, "weak")).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("End");
    await expect(tab(page, "all")).toBeFocused();
    await expect(tab(page, "all")).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("Saved Library v3 static safety", () => {
  test("documents Saved Library v3 and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "SAVED_LIBRARY_V3_MEMORY_QUEUE.md");
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain("docs/SAVED_LIBRARY_V3_MEMORY_QUEUE.md");
    expect(doc).toContain("Saved Library v3 Memory Queue");
    expect(doc).toContain("vlx_saved_words_v1");
    expect(doc).toContain("read-only");
  });

  test("does not add forbidden payment dependencies or routes", () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {})
    ]);

    for (const dependency of forbiddenDependencies) {
      expect(dependencyNames.has(dependency), dependency).toBe(false);
    }

    for (const directory of forbiddenRouteDirectories) {
      expect(existsSync(join(workspaceRoot, directory)), directory).toBe(false);
    }
  });
});
