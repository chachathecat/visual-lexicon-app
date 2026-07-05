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

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoDaysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60_000).toISOString();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "word_page",
    savedAt: isoMinutesAgo(60),
    ...overrides
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === "string" ? overrides.createdAt : isoMinutesAgo(60);

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
    nextDueAt: isoMinutesAgo(5),
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

function makeReviewEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2)}`,
    sessionId: "s-dashboard-v3",
    slug: "dissonance",
    word: "Dissonance",
    hub: "academic-vocabulary",
    questionType: "due_review",
    selected: "Dissonance",
    answer: "Dissonance",
    result: "correct",
    responseMs: 2400,
    createdAt: isoMinutesAgo(15),
    boxBefore: 0,
    boxAfter: 1,
    weakScoreBefore: 0,
    weakScoreAfter: 0,
    ...overrides
  };
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });

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
    packProgress?: Record<string, unknown>;
  }
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ dailyStats, packProgress, reviewEvents, reviewState, savedWords }) => {
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
      localStorage.setItem(
        "vlx_pack_progress_v1",
        JSON.stringify(packProgress ?? {})
      );
    },
    values
  );
}

async function getStoredReviewCommitKeys(page: Page) {
  return page.evaluate(() => ({
    reviewState: localStorage.getItem("vlx_review_state_v1"),
    reviewEvents: localStorage.getItem("vlx_review_events_v1"),
    dailyStats: localStorage.getItem("vlx_daily_stats_v1")
  }));
}

test.describe("Dashboard v3 Today Memory Mission", () => {
  test("/dashboard loads and shows the Today Memory Mission hero", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);

    const response = await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Today's Memory Mission" })
    ).toBeVisible();
  });

  test("does not write review state, events, or daily stats on dashboard load", async ({
    page
  }) => {
    const reviewState = {
      dissonance: makeReviewStateItem({ nextDueAt: isoMinutesAgo(3) })
    };
    const reviewEvents = [makeReviewEvent({ eventId: "evt-no-write" })];
    const dailyStats = {
      [todayKey()]: {
        date: todayKey(),
        reviewed: 1,
        correct: 1,
        wrong: 0,
        mastered: 0,
        weakAdded: 0,
        minutes: 1,
        sessions: 1
      }
    };

    await seedVlxLocalStorage(page, {
      reviewState,
      reviewEvents,
      dailyStats
    });

    const before = await getStoredReviewCommitKeys(page);

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.locator(".dashboard-v3-mission")).toBeVisible();
    await expect.poll(() => getStoredReviewCommitKeys(page)).toEqual(before);
  });

  test("uses due review as the primary action when words are due", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({ nextDueAt: isoMinutesAgo(5) }),
        abundance: makeReviewStateItem({
          slug: "abundance",
          word: "Abundance",
          nextDueAt: isoMinutesAgo(10)
        })
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const mission = page.locator(".dashboard-v3-mission");

    await expect(mission).toContainText("2 words due");
    await expect(mission.getByText("Due count").locator("..")).toContainText("2");
    await expect(
      mission.getByRole("link", { name: "Start due review" })
    ).toHaveAttribute("href", "/review/due");
  });

  test("uses weak practice when weak words exist and none are due", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: isoDaysFromNow(3)
        })
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const mission = page.locator(".dashboard-v3-mission");

    await expect(mission).toContainText("0 words due");
    await expect(mission).toContainText("1 weak");
    await expect(
      mission.getByRole("link", { name: "Practice weak words" })
    ).toHaveAttribute("href", "/review/weak");
  });

  test("uses new saved review when saved words have no due or weak state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const mission = page.locator(".dashboard-v3-mission");

    await expect(mission).toContainText("1 new saved word");
    await expect(page.getByLabel("New Saved: 1")).toBeVisible();
    await expect(
      mission.getByRole("link", { name: "Review new saved words" })
    ).toHaveAttribute("href", "/review");
  });

  test("empty state stays honest and guides the user to save or start learning", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {});

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(
      page.getByText(
        "No words due yet. Save a word or start a pack to build your review queue."
      )
    ).toBeVisible();
    await expect(
      page.locator(".dashboard-v3-mission").getByRole("link", {
        name: "Save a word to start"
      })
    ).toHaveAttribute("href", "/saved");
    await expect(page.getByLabel("Due Today: 0")).toBeVisible();
    await expect(page.getByLabel("Weak Words: 0")).toBeVisible();
    await expect(page.getByLabel("Mastered: 0")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Review 5 words");
    await expect(page.locator("body")).not.toContainText("Start today's review");
  });

  test("mastered count comes only from box 5 Mastered review state", async ({
    page
  }) => {
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
          box: 5,
          mastery: "Mastered",
          correct: 5,
          nextDueAt: isoDaysFromNow(30),
          lastReviewedAt: isoMinutesAgo(30)
        }),
        lucid: makeReviewStateItem({
          slug: "lucid",
          word: "Lucid",
          box: 5,
          mastery: "Strong",
          correct: 5,
          nextDueAt: isoDaysFromNow(30)
        })
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.getByLabel("Mastered: 1")).toBeVisible();
  });

  test("Weekly Reviewed Words comes from review-event evidence", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      dailyStats: {
        [todayKey()]: {
          date: todayKey(),
          reviewed: 99,
          correct: 99,
          wrong: 0,
          mastered: 0,
          weakAdded: 0,
          minutes: 30,
          sessions: 1
        }
      },
      reviewEvents: [
        makeReviewEvent({ eventId: "evt-weekly-1", slug: "dissonance" }),
        makeReviewEvent({
          eventId: "evt-weekly-2",
          slug: "abundance",
          word: "Abundance"
        }),
        makeReviewEvent({
          eventId: "evt-old",
          slug: "resilient",
          word: "Resilient",
          createdAt: isoDaysFromNow(-12)
        })
      ]
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.getByLabel("Weekly Reviewed Words: 2")).toBeVisible();
  });

  test("Continue Pack appears only when visible pack progress exists", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      packProgress: {}
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Continue Pack")).toHaveCount(0);

    await seedVlxLocalStorage(page, {
      packProgress: {
        "academic-vocabulary": {
          packId: "academic-vocabulary",
          startedAt: isoMinutesAgo(120),
          previewStartedAt: isoMinutesAgo(90),
          lastReviewedAt: isoMinutesAgo(20),
          reviewedCount: 3,
          correctCount: 2,
          source: "review"
        }
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Continue Pack")).toBeVisible();
    await expect(page.getByText("Academic Vocabulary")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open pack" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");
  });

  test("Recent Saved appears only when saved words exist", async ({ page }) => {
    await seedVlxLocalStorage(page, {});

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Recent Saved")).toHaveCount(0);

    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Recent Saved")).toBeVisible();
    await expect(
      page
        .locator(".dashboard-v3-card--recent")
        .getByRole("link", { name: /Dissonance/ })
    ).toBeVisible();
  });

  test("dashboard copy does not include checkout, payment, or billing claims", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem()
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toMatch(/\bcheckout\b/i);
    expect(bodyText).not.toMatch(/\bpayment\b/i);
    expect(bodyText).not.toMatch(/\bbilling\b/i);
    expect(bodyText).not.toMatch(/\bsubscription\b/i);
  });
});

test.describe("Dashboard v3 static safety", () => {
  test("does not add forbidden payment dependencies", () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    for (const forbiddenDependency of [
      "stripe",
      "paddle",
      "lemon",
      "lemonsqueezy",
      "lemon-squeezy"
    ]) {
      expect(dependencies).not.toHaveProperty(forbiddenDependency);
    }
  });

  test("does not add forbidden checkout, payment, or billing route directories", () => {
    for (const forbiddenRouteDirectory of [
      "src/app/checkout",
      "src/app/billing",
      "src/app/payment",
      "src/app/payments",
      "src/app/api/checkout",
      "src/app/api/billing",
      "src/app/api/payment",
      "src/app/api/payments"
    ]) {
      expect(
        existsSync(join(workspaceRoot, forbiddenRouteDirectory)),
        forbiddenRouteDirectory
      ).toBe(false);
    }
  });
});
