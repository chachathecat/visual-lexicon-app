import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
  "## Why This Follows #181",
  "## Track A / Track B Responsibility Split",
  "## Current App-Side Save Route Contract",
  "## Required Webflow CTA URL Templates",
  "## Word Page Save CTA Contract",
  "## Word Page Quiz/Review CTA Contract",
  "## Hub Page Deck CTA Contract",
  "## Source Attribution Rules",
  "## Slug Mapping Rules",
  "## LocalStorage State Expectations",
  "## Manual QA Checklist",
  "## What Is Real Vs Planned",
  "## P0/P1/P2 Risk Summary",
  "## Safety Boundaries",
  "## Future Webflow Implementation Plan"
] as const;

const requiredUrlTemplates = [
  "https://app.visuallexicon.org/save?slug={slug}&source=word_page",
  "https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page",
  "https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page",
  "https://app.visuallexicon.org/packs/{packId}?source=hub_page"
] as const;

const forbiddenLaunchClaimPattern =
  /private beta launched|private beta is launched|private\/manual beta is launched|public paid beta launched|public paid beta is live|public paid beta is launched|public paid beta is go|public paid beta unblocked|paid access granted|paid entitlement granted/i;

type JsonRecord = Record<string, unknown>;

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const oneHourAgo = () => minutesFromNow(-60);
const oneDayFromNow = () => minutesFromNow(24 * 60);

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

async function saveDissonanceFromWordPage(page: Page) {
  const response = await page.goto(
    `${baseUrl}/save?slug=dissonance&source=word_page`,
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
    .toBe("word_page");
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
    box: 3,
    mastery: "Strong",
    correct: 4,
    wrong: 0,
    streakCorrect: 4,
    lastReviewedAt: createdAt,
    nextDueAt: oneDayFromNow(),
    weakScore: 0,
    avgResponseMs: 1200,
    lastQuestionType: "due_review",
    createdAt,
    updatedAt: createdAt,
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

test.describe("Track A public Webflow to Track B save CTA bridge", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/save?slug=dissonance&source=word_page creates only saved and safe New review state", async ({
    page
  }) => {
    await saveDissonanceFromWordPage(page);

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
      source: "word_page"
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
    expect(reviewItem?.mastery).not.toBe("Strong");
    expect(reviewItem?.mastery).not.toBe("Mastered");
    expect(typeof reviewItem?.nextDueAt).toBe("string");

    expect(await readLocalRaw(page, "vlx_review_events_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_daily_stats_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_pack_progress_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_upgrade_interest_v1")).toBeNull();
    expect(await readLocalRaw(page, "vlx_plan_state_v1")).toBeNull();
  });

  test("word-page save preserves existing saved metadata and review state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      savedWords: {
        dissonance: makeSavedWord({
          source: "extension",
          savedAt: "2026-07-01T00:00:00.000Z"
        })
      },
      reviewState: {
        dissonance: makeReviewStateItem()
      },
      reviewEvents: [],
      dailyStats: {}
    });

    const response = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: "networkidle" }
    );

    expect(response?.status()).toBe(200);
    await expect(page.locator("[data-testid='save-live-region']")).toContainText(
      "The existing review state was preserved."
    );

    const savedWords = await readLocalJson<Record<string, JsonRecord>>(
      page,
      "vlx_saved_words_v1"
    );
    const reviewState = await readLocalJson<Record<string, JsonRecord>>(
      page,
      "vlx_review_state_v1"
    );

    expect(savedWords?.dissonance).toMatchObject({
      source: "extension",
      savedAt: "2026-07-01T00:00:00.000Z"
    });
    expect(reviewState?.dissonance).toMatchObject({
      box: 3,
      mastery: "Strong",
      correct: 4,
      wrong: 0,
      lastQuestionType: "due_review"
    });
    expect(await readLocalJson<unknown[]>(page, "vlx_review_events_v1")).toEqual(
      []
    );
    expect(await readLocalJson<JsonRecord>(page, "vlx_daily_stats_v1")).toEqual(
      {}
    );
  });

  test("word-page saved word can enter existing saved due and focused review routes", async ({
    page
  }) => {
    await saveDissonanceFromWordPage(page);

    const reviewRoutes = [
      {
        route: "/review?mode=saved",
        heading: /Recall words from your saved library/i
      },
      {
        route: "/review?mode=due",
        heading: /Review the cards due now/i
      },
      {
        route: "/review?mode=word&slug=dissonance",
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

  test("word hub and pack CTA targets load through existing app routes", async ({
    page
  }) => {
    const hubReviewResponse = await page.goto(
      `${baseUrl}/review?mode=hub&hub=academic-vocabulary&source=hub_page`,
      { waitUntil: "networkidle" }
    );

    expect(hubReviewResponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: /Review a vocabulary hub/i })
    ).toBeVisible();
    await expect(page.locator(".review-session")).toBeVisible({
      timeout: 15000
    });

    const packResponse = await page.goto(
      `${baseUrl}/packs/academic-vocabulary?source=hub_page`,
      { waitUntil: "networkidle" }
    );

    expect(packResponse?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Academic Vocabulary" })
    ).toBeVisible();
  });
});

test.describe("Track A to Track B save CTA bridge static contract", () => {
  test("bridge doc exists includes required sections and is linked from README", () => {
    const docPath = join(
      workspaceRoot,
      "docs",
      "TRACK_A_TO_B_SAVE_CTA_BRIDGE.md"
    );
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_TO_B_SAVE_CTA_BRIDGE.md"
    );
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(docPath), docPath).toBe(true);
    expect(readme).toContain("docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md");

    for (const section of requiredDocSections) {
      expect(doc, section).toContain(section);
    }

    for (const urlTemplate of requiredUrlTemplates) {
      expect(doc, urlTemplate).toContain(urlTemplate);
    }

    for (const key of [
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1"
    ]) {
      expect(doc, key).toContain(key);
    }
  });

  test("#181 owner gate remains intact and does not claim launch or public paid beta unblock", () => {
    const ownerGatePath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );
    const ownerGate = readWorkspaceFile(
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );
    const bridgeDoc = readWorkspaceFile(
      "docs",
      "TRACK_A_TO_B_SAVE_CTA_BRIDGE.md"
    );

    expect(existsSync(ownerGatePath), ownerGatePath).toBe(true);
    expect(ownerGate).toContain("Public paid beta remains No-Go");
    expect(ownerGate).toContain(
      "Private/manual beta is a conditional owner-gated candidate only"
    );
    expect(ownerGate).toContain(
      "This document does not launch private/manual beta"
    );
    expect(ownerGate).toContain(
      "This document must not be interpreted as a public paid beta unblock."
    );
    expect(ownerGate).not.toMatch(forbiddenLaunchClaimPattern);

    expect(bridgeDoc).toContain("Why This Follows #181");
    expect(bridgeDoc).toContain("Public paid beta remains No-Go");
    expect(bridgeDoc).toContain(
      "Private/manual beta remains an owner-gated candidate only"
    );
    expect(bridgeDoc).not.toMatch(forbiddenLaunchClaimPattern);
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
