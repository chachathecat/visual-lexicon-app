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
    savedWords?: Record<string, unknown>;
    reviewState?: Record<string, unknown>;
    reviewEvents?: unknown[];
    dailyStats?: Record<string, unknown>;
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

test.describe("Saved Library v2 memory queue", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/saved renders Due, Weak, New, Learning, Mastered, and All tabs", async ({
    page
  }) => {
    await openSaved(page);

    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Saved words that are ready/ })
    ).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(6);

    for (const tabId of [
      "due",
      "weak",
      "new",
      "learning",
      "mastered",
      "all"
    ]) {
      await expect(tab(page, tabId)).toBeVisible();
    }

    await expect(tab(page, "due")).toContainText("Due");
    await expect(tab(page, "weak")).toContainText("Weak");
    await expect(tab(page, "new")).toContainText("New");
    await expect(tab(page, "learning")).toContainText("Learning");
    await expect(tab(page, "mastered")).toContainText("Mastered");
    await expect(tab(page, "all")).toContainText("All");
  });

  test("Due tab derives only from nextDueAt <= now and excludes Mastered", async ({
    page
  }) => {
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

  test("Weak tab derives from Weak mastery, weakScore, and wrong count", async ({
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

  test("Mastered tab requires real Mastered mastery and box 5", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        laconic: makeSavedWord({
          slug: "laconic",
          word: "Laconic"
        }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient"
        }),
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid"
        })
      },
      reviewState: {
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
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          box: 5,
          mastery: "Strong",
          correct: 9,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        }),
        lucid: makeReviewStateItem({
          slug: "lucid",
          word: "Lucid",
          box: 4,
          mastery: "Mastered",
          correct: 9,
          wrong: 0,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await openSaved(page);
    await tab(page, "mastered").click();

    await expect(tab(page, "mastered")).toContainText("1");
    await expect(panel(page, "mastered")).toContainText("Laconic");
    await expect(panel(page, "mastered")).not.toContainText("Resilient");
    await expect(panel(page, "mastered")).not.toContainText("Lucid");
  });

  test("New tab does not fake review state for saved-only entries", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          definition: "Clear and easy to understand."
        }),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate",
          definition: "To make unclear."
        }),
        abundance: makeSavedWord({
          slug: "abundance",
          word: "Abundance",
          definition: "A large amount."
        })
      },
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneDayFromNow()
        }),
        abundance: {
          slug: "abundance",
          word: "Abundance",
          mastery: "Learning",
          correct: 1,
          nextDueAt: oneDayFromNow()
        }
      }
    });

    await openSaved(page);
    await tab(page, "new").click();

    await expect(tab(page, "new")).toContainText("1");
    await expect(panel(page, "new")).toContainText("Lucid");
    await expect(card(page, "lucid")).toContainText("No review state yet");
    await expect(card(page, "lucid")).not.toContainText("Box");
    await expect(panel(page, "new")).not.toContainText("Obfuscate");
    await expect(panel(page, "new")).not.toContainText("Abundance");

    await tab(page, "all").click();
    await expect(card(page, "abundance")).toContainText("Stale review state");
  });

  test("Review now and bulk review links use existing review routes", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate"
        }),
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid"
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          nextDueAt: oneMinuteAgo(),
          mastery: "Learning",
          correct: 1
        }),
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Weak",
          wrong: 1,
          weakScore: 0,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await openSaved(page);

    await expect(
      page.getByRole("link", { name: /Review due words/ })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      page.getByRole("link", { name: /Practice weak words/ })
    ).toHaveAttribute("href", "/review/weak-sprint");
    await expect(
      card(page, "dissonance").getByRole("link", { name: "Review Dissonance" })
    ).toHaveAttribute("href", "/review/due");

    await tab(page, "weak").click();
    await expect(
      card(page, "obfuscate").getByRole("link", { name: "Review Obfuscate" })
    ).toHaveAttribute("href", "/review/weak-sprint");

    await tab(page, "new").click();
    await expect(
      card(page, "lucid").getByRole("link", { name: "Review Lucid" })
    ).toHaveAttribute("href", "/review?mode=saved");
  });

  test("each tab renders an honest empty state", async ({ page }) => {
    await openSaved(page);

    const emptyStates: Array<[string, string]> = [
      ["due", "No due words"],
      ["weak", "No weak words"],
      ["new", "No new saved words"],
      ["learning", "No learning words"],
      ["mastered", "No mastered words"],
      ["all", "No saved words"]
    ];

    for (const [tabId, heading] of emptyStates) {
      await tab(page, tabId).click();
      await expect(
        page.getByRole("heading", { name: heading })
      ).toBeVisible();
    }

    await expect(page.locator("body")).not.toContainText("mock words");
    await expect(page.locator(".track-b-upgrade-nudge")).toHaveCount(0);
  });

  test("/saved does not mutate review_state, review_events, or daily_stats", async ({
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
        eventId: "evt_saved_read_only_1",
        sessionId: "s_saved_read_only",
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

    await openSaved(page);

    expect(await readLocalJson(page, "vlx_review_state_v1")).toEqual(reviewState);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toEqual(
      reviewEvents
    );
    expect(await readLocalJson(page, "vlx_daily_stats_v1")).toEqual(dailyStats);
  });

  test("saved queue avoids fake mastery, fake counts, and upgrade nudges", async ({
    page
  }) => {
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
    await tab(page, "mastered").click();

    await expect(tab(page, "mastered")).toContainText("0");
    await expect(
      page.getByRole("heading", { name: "No mastered words" })
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("fake mastery");
    await expect(page.locator("body")).not.toContainText("streak");
    await expect(page.locator(".track-b-upgrade-nudge")).toHaveCount(0);
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });
});

test.describe("Saved Library v2 static contract", () => {
  test("documents Saved Library v2 and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_SAVED_LIBRARY_V2.md");
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_SAVED_LIBRARY_V2.md");
    expect(doc).toContain("Saved Library v2");
    expect(doc).toContain("vlx_daily_stats_v1");
  });

  test("does not introduce billing, payment, auth, Webflow, or Cloudflare changes", () => {
    const savedLibraryFiles = [
      "src/app/saved/page.tsx",
      "src/components/views/saved-library-view.tsx"
    ];
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /\bcheckout\b/i,
      /\bsubscription\b/i,
      /\binvoice\b/i,
      /\bbilling\b/i,
      /\bpayment\b/i,
      /\bpublic paid beta\b/i,
      /\bwebflow\b/i,
      /\bcloudflare\b/i,
      /\bprocess\.env\b/,
      /\bmiddleware\b/
    ];

    for (const relativePath of savedLibraryFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });
});
