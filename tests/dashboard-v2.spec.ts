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

const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const oneMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();

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

test.describe("Dashboard v0 Today's Memory Mission", () => {
  test("renders the dashboard route with Today's Memory Mission first", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);

    const response = await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page
        .locator(".track-b-page-header")
        .getByRole("heading", { name: "Today's Memory Mission" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Due queue is clear|Start with the words due now/
      })
    ).toBeVisible();
    await expect(page.locator(".track-b-primary-action-card")).toBeVisible();
  });

  test("keeps the required dominant review CTA available", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const dueReviewLink = page.getByRole("link", {
      name: "Review 5 words before you forget"
    });

    await expect(dueReviewLink).toBeVisible();
    await expect(dueReviewLink).toHaveAttribute("href", "/review/due");
  });

  test("shows only the four approved supporting stats", async ({ page }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid"
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: oneMinuteAgo()
        })
      },
      reviewEvents: [
        {
          slug: "dissonance",
          createdAt: oneMinuteAgo()
        },
        {
          slug: "dissonance",
          createdAt: oneMinuteAgo()
        },
        {
          slug: "lucid",
          createdAt: oneMinuteAgo()
        }
      ]
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const statusGrid = page.getByRole("region", {
      name: "Today's review picture"
    });
    const metricCards = statusGrid.locator("article[aria-label]");
    await expect(metricCards).toHaveCount(4);

    const labels = await metricCards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("aria-label")?.split(":")[0] ?? "")
    );

    expect(labels).toEqual(["Due", "Weak", "New", "Reviewed this week"]);
    await expect(statusGrid).toContainText("Reviewed this week");
    await expect(
      statusGrid.locator('article[aria-label="Reviewed this week: 2"]')
    ).toBeVisible();
    await expect(statusGrid).not.toContainText("Learning");
    await expect(statusGrid).not.toContainText("Mastered");
  });

  test("does not present multiple competing primary Dashboard CTAs", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: oneMinuteAgo()
        })
      },
      packProgress: {
        "home-v1": {
          packId: "home-v1",
          startedAt: oneHourAgo(),
          lastOpenedAt: oneMinuteAgo(),
          previewStartedAt: oneHourAgo(),
          reviewedCount: 0,
          correctCount: 0,
          source: "packs_page"
        }
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const primaryActions = page.locator(
      ".track-b-shell__main .track-b-button--primary"
    );

    await expect(primaryActions).toHaveCount(1);
    await expect(primaryActions).toHaveText("Review 5 words before you forget");
  });

  test("renders an honest empty state when no words are due", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("heading", { name: "Due queue is clear" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "No due words were found in vlx_review_state_v1."
    );
    await expect(page.locator("body")).toContainText(
      "tomorrow's queue comes from that state"
    );
  });

  test("does not render fake mastery or streak wording", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);
  });

  test("uses Track B app shell classes and safe route links", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page.locator('.track-b-nav-link[aria-current="page"]').filter({
        hasText: "Today"
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Review words" }).first()
    ).toHaveAttribute("href", "/review");
    await expect(
      page.getByRole("link", { name: "Practice weak words" }).first()
    ).toHaveAttribute("href", "/review/weak");
    await expect(
      page.getByRole("link", { name: "Open packs" }).first()
    ).toHaveAttribute("href", "/packs");
    await expect(
      page.getByRole("link", { name: "Open saved words" }).first()
    ).toHaveAttribute("href", "/saved");
    await expect(page.getByRole("link", { name: "View pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  test("shows weak candidates and weak sprint link only from real weak state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const weakSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Repair fragile recall" })
    });

    await expect(weakSection).toContainText("Dissonance");
    await expect(weakSection).toContainText("Weak 72%");
    await expect(
      weakSection.getByRole("link", { name: "Start Weak Sprint" })
    ).toHaveAttribute("href", "/review/weak-sprint");
    await expect(
      weakSection.getByRole("link", { name: "Start Weak Sprint" })
    ).toHaveClass(/track-b-button--quiet/);
  });

  test("shows recently saved words without inventing saved-only mastery", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        lucid: makeSavedWord({
          slug: "lucid",
          word: "Lucid",
          definition: "Clear and easy to understand.",
          hub: "academic-vocabulary"
        })
      },
      reviewState: {}
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const savedSection = page.locator("section", {
      has: page.getByRole("heading", { name: "Saved words entering review" })
    });

    await expect(savedSection).toContainText("Lucid");
    await expect(savedSection).toContainText("No review state yet");
    await expect(savedSection).not.toContainText("Box 0");
    await expect(savedSection).not.toContainText("Mastered");
  });

  test("continues active pack only when local pack progress exists", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      packProgress: {
        "home-v1": {
          packId: "home-v1",
          startedAt: oneHourAgo(),
          lastOpenedAt: oneMinuteAgo(),
          previewStartedAt: oneHourAgo(),
          reviewedCount: 0,
          correctCount: 0,
          source: "packs_page"
        }
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.getByText("Continue active pack")).toBeVisible();
    await expect(page.getByText("Everyday Memory Deck")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue deck" })
    ).toHaveAttribute("href", /\/review\?/);
    await expect(page.getByRole("link", { name: "Continue deck" })).toHaveClass(
      /track-b-button--quiet/
    );
  });

  test("keeps deferred Dashboard surfaces visually de-emphasized", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 3,
          weakScore: 0.72,
          nextDueAt: oneMinuteAgo()
        })
      }
    });

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(
      page.locator(".dashboard-v2-section--deferred .track-b-button--primary")
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Start Weak Sprint" })).toHaveClass(
      /track-b-button--quiet/
    );
    await expect(page.getByRole("link", { name: "Browse packs" })).toHaveClass(
      /track-b-button--quiet/
    );
    await expect(page.getByRole("link", { name: "View pricing" })).toHaveClass(
      /track-b-button--secondary/
    );
  });

  test("keeps dashboard upgrade nudge visual-only", async ({ page }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]')
    ).toBeVisible();
    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]')
    ).toContainText("Public paid beta remains No-Go");
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });
});

test.describe("Dashboard v2 static contract", () => {
  test("documents dashboard v2 and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_DASHBOARD_V2.md");
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_DASHBOARD_V2.md");
    expect(doc).toContain("Today's Memory Mission");
    expect(doc).toContain("Today -> Review -> Weak -> Packs -> Saved -> Progress");
    expect(doc).toContain("Recommended next PR: **#75 Review Session v2**");
  });

  test("does not introduce forbidden dashboard integrations", () => {
    const dashboardFiles = [
      "src/app/dashboard/page.tsx",
      "src/components/views/dashboard-v2-view.tsx"
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

    for (const relativePath of dashboardFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });
});
