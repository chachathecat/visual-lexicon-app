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

async function seedDashboardMission(page: Page) {
  await seedVlxLocalStorage(page, {
    savedWords: {
      dissonance: makeSavedWord(),
      abundance: makeSavedWord({
        slug: "abundance",
        word: "Abundance",
        image: "https://cdn.visuallexicon.org/images/abundance.webp",
        definition: "A large quantity of something useful or valuable.",
        hub: "core-vocabulary"
      }),
      resilient: makeSavedWord({
        slug: "resilient",
        word: "Resilient",
        image: "https://cdn.visuallexicon.org/images/resilient.webp",
        definition: "Able to recover after pressure, shock, or difficulty.",
        hub: "workplace-english"
      }),
      lucid: makeSavedWord({
        slug: "lucid",
        word: "Lucid",
        image: "https://cdn.visuallexicon.org/images/lucid.webp",
        definition: "Clear and easy to understand.",
        hub: "academic-vocabulary"
      })
    },
    reviewState: {
      dissonance: makeReviewStateItem({
        mastery: "Weak",
        wrong: 3,
        weakScore: 0.72,
        nextDueAt: oneMinuteAgo()
      }),
      abundance: makeReviewStateItem({
        slug: "abundance",
        word: "Abundance",
        image: "https://cdn.visuallexicon.org/images/abundance.webp",
        definition: "A large quantity of something useful or valuable.",
        hub: "core-vocabulary",
        box: 1,
        mastery: "Learning",
        correct: 1,
        nextDueAt: oneMinuteAgo()
      }),
      resilient: makeReviewStateItem({
        slug: "resilient",
        word: "Resilient",
        image: "https://cdn.visuallexicon.org/images/resilient.webp",
        definition: "Able to recover after pressure, shock, or difficulty.",
        hub: "workplace-english",
        box: 2,
        mastery: "Strong",
        correct: 2,
        nextDueAt: oneMinuteAgo()
      }),
      obfuscate: makeReviewStateItem({
        slug: "obfuscate",
        word: "Obfuscate",
        image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
        definition: "To make something unclear or difficult to understand.",
        hub: "academic-vocabulary",
        box: 5,
        mastery: "Mastered",
        correct: 5,
        nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
      })
    },
    reviewEvents: [
      {
        sessionId: "s_test",
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        answer: "Dissonance",
        result: "wrong",
        responseMs: 1200,
        createdAt: oneMinuteAgo(),
        boxAfter: 0,
        weakScoreAfter: 0.72
      }
    ]
  });
}

test.describe("Dashboard Figma source parity", () => {
  test("uses /dashboard as the canonical Track B app entry", async ({
    page,
    request
  }) => {
    const rootRoute = readFileSync(
      join(workspaceRoot, "src", "app", "page.tsx"),
      "utf8"
    );
    const dashboardRoute = readFileSync(
      join(workspaceRoot, "src", "app", "dashboard", "page.tsx"),
      "utf8"
    );

    expect(rootRoute).toContain('import { redirect } from "next/navigation";');
    expect(rootRoute).toContain('redirect("/dashboard");');
    expect(rootRoute).not.toContain("DashboardView");
    expect(dashboardRoute).toContain("DashboardV3View");
    expect(dashboardRoute).toContain("return <DashboardV3View />;");

    const rootResponse = await request.get(`${baseUrl}/`, { maxRedirects: 0 });
    const rootLocation = rootResponse.headers().location;

    expect(rootResponse.status()).toBe(307);
    expect(rootLocation).toBeTruthy();
    expect(new URL(rootLocation ?? "", baseUrl).pathname).toBe("/dashboard");

    const followedResponse = await page.goto(`${baseUrl}/`, {
      waitUntil: "networkidle"
    });

    expect(followedResponse?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/dashboard");
    await expect(page.locator(".dashboard-v3-mission")).toBeVisible();
  });

  test("serves /dashboard directly without a redirect loop", async ({
    page,
    request
  }) => {
    const dashboardResponse = await request.get(`${baseUrl}/dashboard`, {
      maxRedirects: 0
    });

    expect(dashboardResponse.status()).toBe(200);
    expect(dashboardResponse.headers().location).toBeUndefined();

    const pageResponse = await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "networkidle"
    });

    expect(pageResponse?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/dashboard");
    await expect(page.locator(".dashboard-v3-mission")).toBeVisible();
  });

  test("renders only the requested first-screen learning loop", async ({ page }) => {
    await seedDashboardMission(page);

    const response = await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(page.locator(".track-b-shell__sidebar")).toHaveCount(0);
    await expect(page.locator(".track-b-page-header")).toHaveCount(0);

    const mission = page.locator(".dashboard-v3-mission");
    await expect(mission).toBeVisible();
    await expect(mission).toContainText("Today's Memory Mission");
    await expect(mission.getByRole("heading", { name: "Today's Memory Mission" })).toBeVisible();
    await expect(mission.locator(".dashboard-v3-word-row")).toHaveCount(3);
    await expect(mission.getByRole("link", { name: "Start due review" })).toHaveAttribute(
      "href",
      "/review/due"
    );

    const stateCards = page
      .getByRole("region", { name: "Your memory progress" })
      .locator(".dashboard-v3-card");
    await expect(stateCards).toHaveCount(6);

    await expect(page.getByLabel("Due Today: 3")).toBeVisible();
    await expect(page.getByLabel("Weak Words: 1")).toBeVisible();
    await expect(page.getByLabel("New Saved: 1")).toBeVisible();
    await expect(page.getByLabel("Mastered: 1")).toBeVisible();
    await expect(page.getByText("Weekly Reviewed Words")).toBeVisible();
    await expect(page.getByText("Recent Saved")).toBeVisible();
    await expect(page.getByText("Continue Pack")).toHaveCount(0);

    const bodyText = await page.locator("body").innerText();
    for (const forbidden of [
      "Alias Search",
      "Hub Progress",
      "Streak",
      "Pro promotion",
      "Saved Library",
      "checkout",
      "payment",
      "billing"
    ]) {
      expect(bodyText).not.toContain(forbidden);
    }
    expect(bodyText).not.toMatch(
      /nextDueAt|weakScore|box 5|real local|local saved-word storage/i
    );
  });

  test("uses real visual thumbnails for the three due preview rows", async ({
    page
  }) => {
    await seedDashboardMission(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    const mission = page.locator(".dashboard-v3-mission");
    await expect(mission.locator(".dashboard-v3-word-row")).toHaveCount(3);

    const visuals = await page
      .locator(".dashboard-v3-mission .dashboard-v3-word-thumb")
      .evaluateAll((images) =>
        images.map((image) => ({
          className: Array.from(image.classList).join(" "),
          imageSrc: image.querySelector("img")?.getAttribute("src") ?? ""
        }))
      );

    expect(visuals).toHaveLength(3);
    for (const { className, imageSrc } of visuals) {
      expect(className).toContain("word-card__visual--");
      expect(className).toContain("word-card__visual--image");
      expect(imageSrc).toContain("/vlx-word-visuals/");
    }
  });

  test("keeps a single primary dashboard CTA", async ({ page }) => {
    await seedDashboardMission(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const primaryActions = page.locator(
      ".track-b-shell__main .track-b-button--primary"
    );

    await expect(primaryActions).toHaveCount(1);
    await expect(primaryActions).toContainText("Start due review");
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
    expect(doc).toContain("Today -> Save -> Review -> Queue -> Early Access");
  });

  test("does not introduce forbidden dashboard integrations", () => {
    const dashboardFiles = [
      "src/app/dashboard/page.tsx",
      "src/components/views/dashboard-v3-view.tsx"
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
