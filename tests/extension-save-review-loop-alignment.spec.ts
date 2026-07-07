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
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
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

const forbiddenPaymentDependencyFragments = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy"
] as const;

const forbiddenAnalyticsDependencyFragments = [
  "segment",
  "mixpanel",
  "amplitude",
  "posthog",
  "plausible",
  "rudderstack"
] as const;

const requiredDocSections = [
  "## Executive Summary",
  "## Why This Follows #179",
  "## Extension Save Review Contract",
  "## Current App-Side Behavior",
  "## What Is Real Vs Planned",
  "## Route Inventory",
  "## LocalStorage Key Inventory",
  "## P0/P1/P2 Risk Summary",
  "## Safety Boundaries",
  "## Manual QA Checklist",
  "## Future Extension Integration Plan"
] as const;

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const oneMinuteAgo = () => minutesFromNow(-1);
const oneHourAgo = () => minutesFromNow(-60);
const oneHourFromNow = () => minutesFromNow(60);

type JsonRecord = Record<string, unknown>;

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
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

async function saveDissonanceFromExtension(page: Page) {
  const response = await page.goto(
    `${baseUrl}/save?slug=dissonance&source=extension`,
    { waitUntil: "networkidle" }
  );

  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-testid='save-live-region']")).toContainText(
    /Dissonance was (added to|already in) your saved words\./
  );

  await expect
    .poll(async () => {
      const savedWords = await readLocalJson<Record<string, JsonRecord>>(
        page,
        "vlx_saved_words_v1"
      );

      return savedWords?.dissonance?.source;
    })
    .toBe("extension");
}

async function seedVlxLocalStorage(
  page: Page,
  values: {
    dailyStats?: JsonRecord;
    reviewEvents?: JsonRecord[];
    reviewState?: Record<string, JsonRecord>;
    savedWords?: Record<string, JsonRecord>;
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

function makeSavedWord(overrides: JsonRecord = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "/vlx-word-visuals/dissonance.png",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "extension",
    savedAt: oneHourAgo(),
    ...overrides
  };
}

function makeReviewStateItem(overrides: JsonRecord = {}) {
  const createdAt =
    typeof overrides.createdAt === "string" ? overrides.createdAt : oneHourAgo();

  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "/vlx-word-visuals/dissonance.png",
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

function makeWrongReviewEvent(overrides: JsonRecord = {}) {
  const createdAt =
    typeof overrides.createdAt === "string" ? overrides.createdAt : oneHourAgo();

  return {
    eventId: "evt_extension_alignment_wrong",
    sessionId: "s_extension_alignment_wrong",
    slug: "dissonance",
    word: "Dissonance",
    hub: "academic-vocabulary",
    questionType: "due_review",
    selected: "Lucid",
    answer: "Dissonance",
    result: "wrong",
    responseMs: 1800,
    confidence: "forgot",
    createdAt,
    boxBefore: 1,
    boxAfter: 0,
    weakScoreBefore: 0,
    weakScoreAfter: 0.24,
    ...overrides
  };
}

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

function readRootPackageDependencies(
  fileName: "package.json" | "package-lock.json"
) {
  const parsed = JSON.parse(readWorkspaceFile(fileName)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    packages?: Record<
      string,
      {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        optionalDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      }
    >;
  };
  const rootPackage =
    fileName === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  };
}

function expectNoDependencyFragments(fragments: readonly string[]) {
  for (const fileName of ["package.json", "package-lock.json"] as const) {
    const dependencies = readRootPackageDependencies(fileName);

    for (const dependencyName of Object.keys(dependencies)) {
      const normalizedName = dependencyName.toLowerCase();

      expect(
        fragments.some((fragment) => normalizedName.includes(fragment)),
        `${fileName} should not include forbidden dependency ${dependencyName}`
      ).toBe(false);
    }
  }
}

test.describe("Extension save review loop alignment", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/save?slug=dissonance&source=extension creates only saved and New review state", async ({
    page
  }) => {
    await saveDissonanceFromExtension(page);

    const savedWords = await readLocalJson<Record<string, JsonRecord>>(
      page,
      "vlx_saved_words_v1"
    );
    const reviewState = await readLocalJson<Record<string, JsonRecord>>(
      page,
      "vlx_review_state_v1"
    );
    const savedWord = savedWords?.dissonance;
    const reviewItem = reviewState?.dissonance;

    expect(savedWord).toMatchObject({
      slug: "dissonance",
      word: "Dissonance",
      hub: "academic-vocabulary",
      source: "extension"
    });
    expect(typeof savedWord?.savedAt).toBe("string");

    expect(reviewItem).toMatchObject({
      slug: "dissonance",
      word: "Dissonance",
      hub: "academic-vocabulary",
      box: 0,
      correct: 0,
      wrong: 0,
      streakCorrect: 0,
      weakScore: 0
    });
    expect(["New", "Learning"]).toContain(reviewItem?.mastery);
    expect(reviewItem?.mastery).not.toBe("Weak");
    expect(reviewItem?.mastery).not.toBe("Mastered");
    expect(typeof reviewItem?.nextDueAt).toBe("string");

    expect(await readLocalRaw(page, "vlx_review_events_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_daily_stats_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_upgrade_interest_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_plan_state_v1")).toBeNull();
  });

  test("extension source is represented in saved metadata and the saved library", async ({
    page
  }) => {
    await saveDissonanceFromExtension(page);

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /New/i }).click();

    const savedCard = page.locator('[data-saved-word="dissonance"]');

    await expect(savedCard).toContainText("Dissonance");
    await expect(savedCard).toContainText("Extension");
    await expect(savedCard).toContainText("New");
  });

  test("extension-saved words can enter saved, due, and focused review routes", async ({
    page
  }) => {
    await saveDissonanceFromExtension(page);

    const reviewRoutes = [
      {
        route: "/review?mode=saved&source=extension",
        heading: /Recall words from your saved library/i
      },
      {
        route: "/review?mode=due&source=extension",
        heading: /Review the cards due now/i
      },
      {
        route: "/review?mode=word&slug=dissonance&source=extension",
        heading: /Review one word in focus/i
      }
    ] as const;

    for (const { heading, route } of reviewRoutes) {
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "networkidle"
      });

      expect(response?.status(), route).toBe(200);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.locator(".review-session"), route).toBeVisible({
        timeout: 15000
      });
      await expect(
        page.getByRole("button", { name: "Dissonance" }),
        route
      ).toBeVisible();
    }
  });

  test("weak review remains driven by real review state or seeded wrong-answer evidence", async ({
    page
  }) => {
    await saveDissonanceFromExtension(page);

    await page.goto(`${baseUrl}/review?mode=weak&source=extension`, {
      waitUntil: "networkidle"
    });

    await expect(
      page.getByRole("heading", { name: "No weak words right now" })
    ).toBeVisible();
    await expect(page.locator(".review-session")).toHaveCount(0);
    expect(await readLocalRaw(page, "vlx_review_events_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_daily_stats_v1")).toBeNull();

    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord()
      },
      reviewState: {
        dissonance: makeReviewStateItem({
          mastery: "Weak",
          wrong: 1,
          weakScore: 0.24,
          nextDueAt: oneHourFromNow(),
          lastReviewedAt: oneHourAgo(),
          lastQuestionType: "due_review"
        })
      },
      reviewEvents: [makeWrongReviewEvent()],
      dailyStats: {
        "2026-07-07": {
          date: "2026-07-07",
          reviewed: 1,
          correct: 0,
          wrong: 1,
          mastered: 0,
          weakAdded: 1,
          minutes: 0.03,
          sessions: 1
        }
      }
    });

    await page.goto(`${baseUrl}/review?mode=weak&source=extension`, {
      waitUntil: "networkidle"
    });

    await expect(
      page.getByRole("heading", { name: /Repair fragile recall/i })
    ).toBeVisible();
    await expect(page.locator(".review-session")).toBeVisible({
      timeout: 15000
    });
    await expect(page.getByRole("button", { name: "Dissonance" })).toBeVisible();
  });

  test("pricing interest stays local and does not create paid entitlement", async ({
    page
  }) => {
    const response = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await page
      .getByRole("button", {
        name: "Note Lite interest - billing not connected yet"
      })
      .click();

    await expect(
      page.getByText(
        "Paid beta interest noted locally. Billing is not connected yet. This does not grant paid access."
      )
    ).toBeVisible();

    const interest = await readLocalJson<JsonRecord[]>(
      page,
      "vlx_upgrade_interest_v1"
    );

    expect(interest).toHaveLength(1);
    expect(interest?.[0]).toMatchObject({
      plan: "lite",
      source: "pricing_page",
      pagePath: "/pricing"
    });
    expect(await readLocalRaw(page, "vlx_plan_state_v1")).toBeNull();
  });

  test("#179 pack content remains intact and planned pack copy stays safe", async ({
    page
  }) => {
    const response = await page.goto(`${baseUrl}/packs`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);

    for (const title of [
      "Academic Vocabulary",
      "IELTS Writing",
      "GRE Visual Verbal"
    ]) {
      await expect(
        page.locator("#packs-v2-featured article.pack-card").filter({
          hasText: title
        }),
        title
      ).toBeVisible();
    }

    for (const pack of [
      {
        path: "/packs/ielts-writing-vocabulary",
        title: "IELTS Writing",
        plannedCopy: "Full IELTS Writing pack is planned, not live."
      },
      {
        path: "/packs/gre-visual-verbal",
        title: "GRE Visual Verbal",
        plannedCopy: "Full GRE Visual Verbal pack is planned, not live."
      }
    ] as const) {
      await page.goto(`${baseUrl}${pack.path}`, { waitUntil: "networkidle" });

      await expect(
        page.getByRole("heading", { level: 1, name: pack.title })
      ).toBeVisible();
      await expect(page.locator("body")).toContainText(
        "Preview of planned 30-day path"
      );

      const bodyText = await page.locator("body").innerText();

      expect(bodyText).toContain("Preview of planned 30-day path");
      expect(bodyText).toContain("Preview-only content v1 from current static words.");
      expect(bodyText).toContain(pack.plannedCopy);
      expect(bodyText).toContain("Private/manual beta requires owner approval.");
      expect(bodyText).not.toMatch(/private beta launched|private beta is launched/i);
      await expect(
        page.getByRole("link", { name: /Start preview|Start review|Continue/ })
      ).toHaveCount(0);
    }

    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(
      "Public paid beta remains No-Go."
    );
    await expect(page.locator("body")).toContainText(
      "Private/manual beta requires owner approval."
    );
  });
});

test.describe("Extension save review loop static alignment", () => {
  test("documents the alignment and links it from README", () => {
    const docPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md"
    );
    const doc = readFileSync(docPath, "utf8");
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain(
      "docs/TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md"
    );

    for (const section of requiredDocSections) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("/save?slug=dissonance&source=extension");
    expect(doc).toContain("vlx_saved_words_v1");
    expect(doc).toContain("vlx_review_state_v1");
    expect(doc).toContain("source: \"extension\"");
    expect(doc).toContain("Public paid beta remains No-Go");
    expect(doc).toContain("Private/manual beta remains owner-gated");
    expect(doc).toContain("No Webflow, Cloudflare Workers, auth, billing");
  });

  test("forbidden checkout billing payment routes remain absent", () => {
    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }
  });

  test("forbidden payment dependencies and analytics SDKs remain absent", () => {
    expectNoDependencyFragments(forbiddenPaymentDependencyFragments);
    expectNoDependencyFragments(forbiddenAnalyticsDependencyFragments);
  });
});
