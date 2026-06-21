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

const oneMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();
const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const twoHoursAgo = () => new Date(Date.now() - 2 * 60 * 60_000).toISOString();
const oneDayFromNow = () =>
  new Date(Date.now() + 24 * 60 * 60_000).toISOString();

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
  }
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(({ reviewEvents, reviewState, savedWords }) => {
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
    localStorage.setItem("vlx_daily_stats_v1", "{}");
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

async function waitForSavedSlug(page: Page, slug: string) {
  await page.waitForFunction(
    (targetSlug) => {
      const rawSaved = localStorage.getItem("vlx_saved_words_v1");
      const rawState = localStorage.getItem("vlx_review_state_v1");

      if (!rawSaved || !rawState) return false;

      try {
        const saved = JSON.parse(rawSaved);
        const state = JSON.parse(rawState);

        return Boolean(saved?.[targetSlug] && state?.[targetSlug]);
      } catch {
        return false;
      }
    },
    slug,
    { timeout: 15000 }
  );
}

function queueSection(page: Page, heading: string) {
  return page.locator(".saved-v2-section").filter({
    has: page.getByRole("heading", { name: heading })
  });
}

async function expectSectionCount(page: Page, heading: string, count: string) {
  const section = queueSection(page, heading);

  await expect(section).toBeVisible();
  await expect(section.locator(".saved-v2-section__header > span").last()).toHaveText(
    count
  );
}

test.describe("Saved queue Figma source parity", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/saved renders the Figma memory queue after a local save", async ({
    page
  }) => {
    const response = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: "domcontentloaded" }
    );

    expect(response?.status()).toBe(200);
    await waitForSavedSlug(page, "dissonance");

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(page.locator(".track-b-shell__sidebar")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Your memory queue" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "These words are working their way into memory."
    );
    await expect(
      page
        .locator(".saved-v2-queue-hero")
        .getByRole("link", { name: /Review 1 ready word/ })
    ).toHaveAttribute("href", "/review/due");

    const reviewNow = queueSection(page, "Review now");
    await expect(reviewNow).toBeVisible();
    await expect(reviewNow.locator(".saved-v2-word-card")).toHaveCount(1);
    await expect(reviewNow).toContainText("Dissonance");
    await expect(reviewNow).toContainText(
      "A clash between sounds, ideas, or feelings."
    );
    await expect(
      reviewNow.getByRole("link", { name: "Review Dissonance" })
    ).toHaveAttribute("href", "/review/due");

    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.locator(".track-b-upgrade-nudge")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("mock words");
  });

  test("queue sections derive from saved review state without duplicate cards", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({ savedAt: twoHoursAgo() }),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate",
          definition: "To make something unclear or difficult to understand.",
          source: "alias_search",
          savedAt: oneHourAgo()
        }),
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          definition: "Clear and easy to understand.",
          source: "extension",
          savedAt: oneMinuteAgo()
        }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient",
          definition: "Able to recover after pressure.",
          savedAt: twoHoursAgo()
        }),
        laconic: makeSavedWord({
          slug: "laconic",
          word: "Laconic",
          definition: "Using very few words.",
          savedAt: twoHoursAgo()
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          nextDueAt: oneMinuteAgo()
        }),
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          definition: "To make something unclear or difficult to understand.",
          mastery: "Weak",
          correct: 1,
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: oneDayFromNow()
        }),
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          definition: "Able to recover after pressure.",
          box: 3,
          mastery: "Strong",
          correct: 5,
          wrong: 0,
          weakScore: 0.1,
          nextDueAt: oneDayFromNow()
        }),
        laconic: makeReviewStateItem({
          slug: "laconic",
          word: "Laconic",
          definition: "Using very few words.",
          box: 5,
          mastery: "Mastered",
          correct: 9,
          wrong: 0,
          weakScore: 0.04,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expectSectionCount(page, "Review now", "1");
    await expectSectionCount(page, "Needs another pass", "1");
    await expectSectionCount(page, "Saved and waiting", "1");
    await expectSectionCount(page, "Held in memory", "1");

    await expect(queueSection(page, "Review now")).toContainText("Dissonance");
    await expect(queueSection(page, "Needs another pass")).toContainText(
      "Obfuscate"
    );
    await expect(queueSection(page, "Saved and waiting")).toContainText("Lucid");
    await expect(queueSection(page, "Held in memory")).toContainText("Laconic");

    await expect(page.locator(".saved-v2-word-card")).toHaveCount(4);
    await expect(page.locator(".saved-v2-word-card").filter({ hasText: "Resilient" })).toHaveCount(
      0
    );
  });

  test("weak queue sorts by weakScore evidence", async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate"
        }),
        laconic: makeSavedWord({
          slug: "laconic",
          word: "Laconic"
        })
      },
      reviewState: {
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Weak",
          wrong: 2,
          weakScore: 0.65,
          nextDueAt: oneDayFromNow()
        }),
        laconic: makeReviewStateItem({
          slug: "laconic",
          word: "Laconic",
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.91,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(
      queueSection(page, "Needs another pass")
        .locator(".saved-v2-word-card h3")
        .first()
    ).toHaveText("Laconic");
  });

  test("empty states are honest and do not show sample saved words", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "No words in queue" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "No saved words were found in local storage."
    );
    await expect(page.locator("body")).not.toContainText("Dissonance");
  });

  test("saved-only entries and non-mastered box 5 items do not show as mastered", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          definition: "Clear and easy to understand."
        }),
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient",
          definition: "Able to recover after pressure."
        })
      },
      reviewState: {
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          box: 5,
          mastery: "Strong",
          correct: 9,
          wrong: 0,
          weakScore: 0.04,
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(queueSection(page, "Saved and waiting")).toContainText("Lucid");
    await expect(queueSection(page, "Held in memory")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Mastered");
  });

  test("/saved does not mutate review_state or review_events", async ({
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

    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState,
      reviewEvents
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    expect(await readLocalJson(page, "vlx_review_state_v1")).toEqual(reviewState);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toEqual(
      reviewEvents
    );
  });

  test("review CTAs link only to existing safe review routes", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord(),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate"
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          nextDueAt: oneMinuteAgo()
        }),
        obfuscate: makeReviewStateItem({
          slug: "obfuscate",
          word: "Obfuscate",
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.8,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(
      page
        .locator(".saved-v2-queue-hero")
        .getByRole("link", { name: /Review 2 ready words/ })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      queueSection(page, "Review now").getByRole("link", {
        name: "Review Dissonance"
      })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      queueSection(page, "Needs another pass").getByRole("link", {
        name: "Review Obfuscate"
      })
    ).toHaveAttribute("href", "/review/weak");
  });

  test("saved queue avoids fake mastery, streak wording, and upgrade nudges", async ({
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

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);
    await expect(page.locator(".track-b-upgrade-nudge")).toHaveCount(0);
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });
});

test.describe("Saved queue static contract", () => {
  test("documents Saved Library v2 and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_SAVED_LIBRARY_V2.md");
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_SAVED_LIBRARY_V2.md");
    expect(doc).toContain("Saved");
    expect(doc).toContain("review");
  });

  test("does not introduce forbidden saved-library integrations", () => {
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
      /from ["']openai/,
      /from ["']ai/,
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
