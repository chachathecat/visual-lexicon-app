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

async function openTab(page: Page, name: RegExp) {
  await page.getByRole("tab", { name }).click();
}

function savedPanel(page: Page) {
  return page.locator(".saved-v2-panel");
}

test.describe("Saved Library v2", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/saved renders Saved Library v2 after a local save", async ({ page }) => {
    const response = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: "domcontentloaded" }
    );

    expect(response?.status()).toBe(200);
    await waitForSavedSlug(page, "dissonance");

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Memory queue" })).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "Saved is a review queue, not bookmarks."
    );
    await expect(page.locator("body")).toContainText(
      "Saved words are waiting to be reviewed."
    );
    await expect(
      page.getByRole("link", { exact: true, name: "Review now" })
    ).toHaveAttribute("href", "/review?mode=saved");

    for (const tabName of ["Due", "Weak", "New", "Learning", "Mastered", "All"]) {
      await expect(
        page.getByRole("tab", { name: new RegExp(`^${tabName}\\b`) })
      ).toBeVisible();
    }

    const panel = savedPanel(page);

    await expect(panel.locator(".saved-v2-word-card")).toHaveCount(1);
    await expect(panel).toContainText("Dissonance");
    await expect(panel).toContainText("A clash between sounds, ideas, or feelings.");
    await expect(panel).toContainText("Box 0");
    await expect(panel).toContainText("Due");
    await expect(page.locator("body")).not.toContainText("mock words");
  });

  test("summary cards and tabs derive counts from saved review state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({
          savedAt: twoHoursAgo()
        }),
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
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(page.getByLabel("Due now: 1")).toBeVisible();
    await expect(page.getByLabel("Weak words: 1")).toBeVisible();
    await expect(page.getByLabel("New saved: 2")).toBeVisible();
    await expect(page.getByLabel("Learning: 1")).toBeVisible();
    await expect(page.getByLabel("Mastered: 1")).toBeVisible();
  });

  test("Due, Weak, New, Learning, Mastered, and All tabs show honest queues", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({
          savedAt: twoHoursAgo()
        }),
        abundance: makeSavedWord({
          slug: "abundance",
          word: "Abundance",
          definition: "A large quantity of something useful or valuable.",
          savedAt: oneHourAgo()
        }),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate",
          definition: "To make something unclear or difficult to understand.",
          source: "alias_search",
          savedAt: twoHoursAgo()
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
        abundance: makeReviewStateItem({
          slug: "abundance",
          word: "Abundance",
          definition: "A large quantity of something useful or valuable.",
          box: 2,
          mastery: "Learning",
          correct: 2,
          wrong: 0,
          weakScore: 0.12,
          nextDueAt: oneDayFromNow()
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
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(savedPanel(page)).toContainText("Dissonance");
    await expect(savedPanel(page)).not.toContainText("Abundance");
    await expect(
      savedPanel(page).getByRole("link", { name: "Review Dissonance now" })
    ).toHaveAttribute("href", "/review/due");

    await openTab(page, /^Weak\b/);
    await expect(savedPanel(page)).toContainText("Obfuscate");
    await expect(savedPanel(page)).toContainText("Weak score 72%");
    await expect(savedPanel(page)).toContainText("Source: Alias search");
    await expect(
      savedPanel(page).getByRole("link", {
        name: "Review Obfuscate in weak review"
      })
    ).toHaveAttribute("href", "/review/weak");

    await openTab(page, /^New\b/);
    await expect(savedPanel(page)).toContainText("Dissonance");
    await expect(savedPanel(page)).toContainText("Lucid");
    await expect(savedPanel(page)).toContainText("Source: Extension");
    await expect(savedPanel(page)).toContainText("No review state yet");

    await openTab(page, /^Learning\b/);
    await expect(savedPanel(page)).toContainText("Abundance");
    await expect(savedPanel(page)).toContainText("Resilient");
    await expect(savedPanel(page)).not.toContainText("Obfuscate");

    await openTab(page, /^Mastered\b/);
    await expect(savedPanel(page)).toContainText("Laconic");
    await expect(savedPanel(page)).toContainText("Mastered");
    await expect(savedPanel(page)).toContainText("Box 5");
    await expect(savedPanel(page)).not.toContainText("Lucid");

    await openTab(page, /^All\b/);
    await expect(savedPanel(page).locator(".saved-v2-word-card")).toHaveCount(6);
    await expect(savedPanel(page).locator(".saved-v2-word-card h3").first()).toHaveText(
      "Lucid"
    );
  });

  test("Weak tab sorts by weakScore evidence", async ({ page }) => {
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
    await openTab(page, /^Weak\b/);

    await expect(savedPanel(page).locator(".saved-v2-word-card h3").first()).toHaveText(
      "Laconic"
    );
  });

  test("empty states are honest for missing saved, due, weak, and mastered queues", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "No saved words yet" })
    ).toBeVisible();
    await expect(savedPanel(page)).toContainText(
      "This page does not show sample words as saved."
    );
    await expect(savedPanel(page)).not.toContainText("Dissonance");

    await seedVlxLocalStorage(page, {
      savedWords: {
        resilient: makeSavedWord({
          slug: "resilient",
          word: "Resilient"
        })
      },
      reviewState: {
        resilient: makeReviewStateItem({
          slug: "resilient",
          word: "Resilient",
          box: 3,
          mastery: "Strong",
          correct: 5,
          wrong: 0,
          weakScore: 0.1,
          nextDueAt: oneDayFromNow()
        })
      }
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "No saved words due now" })
    ).toBeVisible();

    await openTab(page, /^Weak\b/);
    await expect(
      page.getByRole("heading", { name: "No weak saved words right now" })
    ).toBeVisible();

    await openTab(page, /^Mastered\b/);
    await expect(
      page.getByRole("heading", { name: "No mastered saved words yet" })
    ).toBeVisible();
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
    await openTab(page, /^Mastered\b/);

    await expect(
      page.getByRole("heading", { name: "No mastered saved words yet" })
    ).toBeVisible();
    await expect(savedPanel(page)).not.toContainText("Lucid");
    await expect(savedPanel(page)).not.toContainText("Resilient");

    await openTab(page, /^All\b/);
    const lucidCard = savedPanel(page)
      .locator(".saved-v2-word-card")
      .filter({ hasText: "Lucid" });

    await expect(lucidCard).toContainText("No review state yet");
    await expect(lucidCard).not.toContainText("Box 5");
  });

  test("/saved does not mutate review_state or review_events", async ({ page }) => {
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
    await openTab(page, /^Weak\b/);
    await openTab(page, /^All\b/);
    await openTab(page, /^Due\b/);

    expect(await readLocalJson(page, "vlx_review_state_v1")).toEqual(reviewState);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toEqual(
      reviewEvents
    );
  });

  test("review CTAs link only to existing safe review routes", async ({ page }) => {
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
      page.getByRole("link", { exact: true, name: "Review now" })
    ).toHaveAttribute("href", "/review?mode=saved");
    await expect(
      page.getByRole("link", { name: "Review due" })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      page.getByRole("link", { exact: true, name: "Practice weak" })
    ).toHaveAttribute("href", "/review/weak");
    await expect(page.getByRole("link", { name: "Find words" })).toHaveAttribute(
      "href",
      "/packs"
    );

    await openTab(page, /^Weak\b/);
    await expect(
      savedPanel(page).getByRole("link", {
        name: "Review Obfuscate in weak review"
      })
    ).toHaveAttribute("href", "/review/weak");
  });

  test("saved page avoids fake mastery and streak wording", async ({ page }) => {
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
  });

  test("keeps the saved library upgrade nudge visual-only", async ({ page }) => {
    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });

    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]')
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
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
    expect(doc).toContain("Saved words become review cards.");
    expect(doc).toContain("Due, Weak, New, Learning, Mastered, and All");
    expect(doc).toContain("Recommended next PR: **#77 Packs v2**");
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
