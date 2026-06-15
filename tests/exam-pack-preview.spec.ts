import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const packProgressStorageKey = "vlx_pack_progress_v1";
const academicPreviewReviewHref =
  "/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview";

const vlxLocalStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  packProgressStorageKey,
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const plannedPlaceholderRoutes = [
  {
    path: "/packs/ielts-writing-vocabulary",
    heading: "IELTS Writing Vocabulary",
    emptyHeading: "IELTS pack data is not available yet"
  },
  {
    path: "/packs/gre-visual-verbal",
    heading: "GRE Visual Verbal",
    emptyHeading: "GRE pack data is not available yet"
  }
] as const;

const oneMinuteAgo = () => new Date(Date.now() - 60_000).toISOString();
const oneHourAgo = () => new Date(Date.now() - 60 * 60_000).toISOString();
const oneDayFromNow = () =>
  new Date(Date.now() + 24 * 60 * 60_000).toISOString();

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "exam_pack",
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

  await page.evaluate((storageKeys) => {
    for (const storageKey of storageKeys) {
      localStorage.removeItem(storageKey);
    }

    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  }, vlxLocalStorageKeys);
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

function featuredCard(page: Page, title: string) {
  return page
    .locator("#packs-v2-featured article.pack-card")
    .filter({ hasText: title });
}

async function completeReviewSession(page: Page) {
  let answeredCards = 0;

  for (let index = 0; index < 20; index += 1) {
    await expect(page.locator(".review-session")).toBeVisible({
      timeout: 15000
    });

    const firstChoice = page.locator(".review-option").first();

    await expect(firstChoice).toBeVisible();
    await firstChoice.click();
    await expect(
      page.getByRole("heading", { name: "How did that recall feel?" })
    ).toBeVisible();
    await page.getByRole("button", { name: /I knew it/i }).click();
    answeredCards += 1;

    const nextButton = page.getByRole("button", {
      name: /Next card|View summary/i
    });

    await expect(nextButton).toBeVisible();

    const buttonLabel = await nextButton.innerText();

    await nextButton.click();

    if (/View summary/i.test(buttonLabel)) {
      break;
    }
  }

  await expect(
    page.getByRole("heading", { name: "Session summary" })
  ).toBeVisible();

  return answeredCards;
}

test.describe("Packs v2 learning-plan surface", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/packs renders the Track B Packs v2 surface", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/packs`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Packs" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "Guided visual vocabulary plans for goals and exams."
    );
    await expect(
      page.getByRole("heading", { name: "Featured learning plans" })
    ).toBeVisible();

    for (const title of [
      "Academic Vocabulary",
      "IELTS Writing Vocabulary",
      "GRE Visual Verbal"
    ]) {
      await expect(featuredCard(page, title)).toBeVisible();
    }
  });

  test("featured cards show honest preview and progress states", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    const academicCard = featuredCard(page, "Academic Vocabulary");

    await expect(academicCard).toContainText("Preview ready");
    await expect(academicCard).toContainText("Academic essays and lectures");
    await expect(academicCard).toContainText("3 words");
    await expect(academicCard).toContainText("Free preview: 3 cards");
    await expect(academicCard).toContainText("14-day plan");
    await expect(academicCard).toContainText("No local pack progress yet");
    await expect(
      academicCard.getByRole("link", { name: "Preview Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);

    for (const title of ["IELTS Writing Vocabulary", "GRE Visual Verbal"]) {
      const card = featuredCard(page, title);

      await expect(card).toContainText("Data pending");
      await expect(card).toContainText("Word count pending");
      await expect(card).toContainText("Free preview pending");
      await expect(card).toContainText(
        "Progress cannot be computed until this pack has word data."
      );
      await expect(
        card.getByRole("link", { name: /Preview|Start review|Continue/ })
      ).toHaveCount(0);
      await expect(
        card.getByRole("link", { name: `View ${title} plan` })
      ).toHaveAttribute("href", /\/packs\//);
    }
  });

  test("Academic CTA links to the existing safe review route and records pack progress only", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await featuredCard(page, "Academic Vocabulary")
      .getByRole("link", { name: "Preview Academic Vocabulary" })
      .click();

    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/
    );
    await expect(
      page.getByRole("heading", { name: /Review a vocabulary hub/i })
    ).toBeVisible();

    const progressStore = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, packProgressStorageKey);
    const academicProgress = progressStore?.["academic-vocabulary"];

    expect(academicProgress?.source).toBe("packs_page");
    expect(typeof academicProgress?.startedAt).toBe("string");
    expect(typeof academicProgress?.previewStartedAt).toBe("string");
    expect(academicProgress?.reviewedCount).toBe(0);
    expect(academicProgress?.correctCount).toBe(0);
    expect(await readLocalJson(page, "vlx_review_state_v1")).toBeNull();
    expect(await readLocalJson(page, "vlx_review_events_v1")).toBeNull();

    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });
    await expect(
      featuredCard(page, "Academic Vocabulary").getByRole("link", {
        name: "Continue Academic Vocabulary"
      })
    ).toBeVisible();
    await expect(featuredCard(page, "Academic Vocabulary")).toContainText(
      "Preview started"
    );
  });

  test("pack detail shows hero, real SRS counts, queues, preview words, and visual-only Pro nudge", async ({
    page
  }) => {
    const reviewState = {
      dissonance: makeReviewStateItem({
        box: 1,
        mastery: "Learning",
        correct: 1,
        nextDueAt: oneMinuteAgo()
      }),
      obfuscate: makeReviewStateItem({
        slug: "obfuscate",
        word: "Obfuscate",
        definition: "To make something unclear or difficult to understand.",
        box: 1,
        mastery: "Weak",
        correct: 1,
        wrong: 3,
        weakScore: 0.72,
        nextDueAt: oneDayFromNow()
      }),
      lucid: makeReviewStateItem({
        slug: "lucid",
        word: "Lucid",
        definition: "Clear and easy to understand.",
        box: 5,
        mastery: "Mastered",
        correct: 8,
        wrong: 0,
        weakScore: 0.04,
        nextDueAt: oneDayFromNow()
      })
    };
    const reviewEvents = [
      {
        eventId: "evt_pack_v2_1",
        sessionId: "s_pack_v2",
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
        dissonance: makeSavedWord(),
        obfuscate: makeSavedWord({
          slug: "obfuscate",
          word: "Obfuscate"
        })
      },
      reviewState,
      reviewEvents
    });

    const response = await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Academic Vocabulary" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Progress summary" })).toBeVisible();
    await expect(page.getByLabel("Due: 1")).toBeVisible();
    await expect(page.getByLabel("Weak: 1")).toBeVisible();
    await expect(page.getByLabel("Mastered: 1")).toBeVisible();
    await expect(page.getByLabel("Review events: 1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Due within this pack" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Weak within this pack" })).toBeVisible();
    await expect(
      page
        .locator(".packs-v2-queue-panel")
        .filter({ has: page.getByRole("heading", { name: "Due within this pack" }) })
        .getByText("Dissonance")
    ).toBeVisible();
    await expect(
      page
        .locator(".packs-v2-queue-panel")
        .filter({ has: page.getByRole("heading", { name: "Weak within this pack" }) })
        .getByText("Obfuscate")
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preview words" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Preview image for Dissonance" })
    ).toBeVisible();
    await expect(
      page.locator('.track-b-upgrade-nudge[data-visual-only="true"]')
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "View pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
    await expect(page.getByRole("link", { name: "Review due" })).toHaveAttribute(
      "href",
      "/review/due"
    );
    await expect(
      page.getByRole("link", { exact: true, name: "Practice weak" })
    ).toHaveAttribute("href", "/review/weak");
    expect(await readLocalJson(page, "vlx_review_state_v1")).toEqual(reviewState);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toEqual(
      reviewEvents
    );
  });

  test("completing Academic preview review writes pack progress from real answers", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });

    await page
      .getByRole("link", { name: "Preview Academic Vocabulary" })
      .click();

    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/
    );

    const answeredCards = await completeReviewSession(page);
    const reviewEvents = await readLocalJson<Record<string, unknown>[]>(
      page,
      "vlx_review_events_v1"
    );
    const actualCorrectAnswers = (reviewEvents ?? []).filter(
      (event) => event.result === "correct"
    ).length;
    const progressStore = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, packProgressStorageKey);
    const academicProgress = progressStore?.["academic-vocabulary"];

    expect(reviewEvents).toHaveLength(answeredCards);
    expect(academicProgress?.reviewedCount).toBe(answeredCards);
    expect(academicProgress?.correctCount).toBe(actualCorrectAnswers);
    expect(typeof academicProgress?.previewCompletedAt).toBe("string");
    expect(typeof academicProgress?.lastReviewedAt).toBe("string");
    expect(academicProgress?.source).toBe("review");
  });

  test("planned IELTS and GRE detail pages stay honest without fake access or progress", async ({
    page
  }) => {
    for (const route of plannedPlaceholderRoutes) {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading })
      ).toBeVisible();
      await expect(page.getByText("Data pending", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Free preview pending", { exact: true })
      ).toBeVisible();
      await expect(page.getByText("Not available yet").first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: route.emptyHeading })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Preview|Start review|Continue/ })
      ).toHaveCount(0);
      await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
    }
  });

  test("Packs v2 avoids fake paid access, fake mastery copy, and streak wording", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).not.toMatch(/paid access granted|subscription active/i);
    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });
});

test.describe("Packs v2 static contract", () => {
  test("documents Packs v2 and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_PACKS_V2.md");
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_PACKS_V2.md");
    expect(doc).toContain("Packs v2");
    expect(doc).toContain("Guided visual vocabulary plans for goals and exams.");
    expect(doc).toContain("Recommended next PR: **#78 Pricing / Paywall v2**");
  });

  test("does not introduce forbidden Packs v2 integrations", () => {
    const packsFiles = [
      "src/app/packs/page.tsx",
      "src/app/packs/[packId]/page.tsx",
      "src/components/views/packs-v2-view.tsx",
      "src/lib/packs/preview.ts"
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
      /\bmiddleware\b/,
      /\bwriteReviewState\b/,
      /\bappendReviewEvent\b/,
      /\bapplyReviewAnswer\b/
    ];

    for (const relativePath of packsFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });
});
