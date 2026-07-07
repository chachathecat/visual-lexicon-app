import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const packProgressStorageKey = "vlx_pack_progress_v1";

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  packProgressStorageKey,
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const academicPreviewReviewHref =
  "/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview";

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60_000).toISOString();
}

function oneMinuteAgo() {
  return new Date(Date.now() - 60_000).toISOString();
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
    packProgress?: Record<string, unknown>;
    reviewEvents?: unknown[];
    reviewState?: Record<string, unknown>;
    savedWords?: Record<string, unknown>;
  }
) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ packProgress, reviewEvents, reviewState, savedWords }) => {
      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords ?? {}));
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify(reviewState ?? {})
      );
      localStorage.setItem(
        "vlx_review_events_v1",
        JSON.stringify(reviewEvents ?? [])
      );
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));

      if (packProgress) {
        localStorage.setItem("vlx_pack_progress_v1", JSON.stringify(packProgress));
      }
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

function packCard(page: Page, packId: string) {
  return page.locator(`#packs-v2-featured [data-pack-id="${packId}"]`);
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt = oneHourAgo();

  return {
    slug: "obfuscate",
    word: "Obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    hub: "academic-vocabulary",
    box: 1,
    mastery: "Weak",
    correct: 1,
    wrong: 2,
    streakCorrect: 0,
    lastReviewedAt: createdAt,
    nextDueAt: oneMinuteAgo(),
    weakScore: 0.78,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

async function expectNoForbiddenPacksCopy(page: Page) {
  const text = await page.locator("body").innerText();

  expect(text).not.toMatch(/\bcheckout\b/i);
  expect(text).not.toMatch(/\bpayment\b/i);
  expect(text).not.toMatch(/\bbilling\b/i);
  expect(text).not.toMatch(/public paid beta is launched/i);
  expect(text).not.toMatch(/private beta is launched/i);
}

test.describe("Packs v3 30-Day Plan Surface", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/packs loads as a 30-day plan surface without writing pack progress", async ({
    page
  }) => {
    const response = await page.goto(`${baseUrl}/packs`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Packs" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "Turn saved words into 30-day visual learning plans."
    );

    for (const title of [
      "Academic Vocabulary",
      "IELTS Writing",
      "GRE Visual Verbal"
    ]) {
      await expect(page.locator("body")).toContainText(title);
    }

    await expect(page.getByLabel(/Active packs: 0/)).toBeVisible();
    await expect(page.getByLabel(/Preview progress: 0/)).toBeVisible();
    await expect(page.getByLabel(/Completed previews: 0/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Start Academic preview" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");
    await expect(page.locator("body")).not.toContainText("Reviewed count");
    await expect(page.locator("body")).not.toContainText("Correct count");
    expect(await readLocalJson(page, packProgressStorageKey)).toBeNull();
    await expectNoForbiddenPacksCopy(page);
  });

  test("real vlx_pack_progress_v1 drives the primary CTA and card progress", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, {
      packProgress: {
        "academic-vocabulary": {
          packId: "academic-vocabulary",
          startedAt: "2026-06-28T10:00:00.000Z",
          previewStartedAt: "2026-06-28T10:00:00.000Z",
          previewCompletedAt: "2026-06-29T10:00:00.000Z",
          lastReviewedAt: "2026-06-29T10:00:00.000Z",
          reviewedCount: 4,
          correctCount: 3,
          source: "review"
        }
      }
    });

    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await expect(page.getByLabel(/Active packs: 1/)).toBeVisible();
    await expect(page.getByLabel(/Preview progress: 1/)).toBeVisible();
    await expect(page.getByLabel(/Completed previews: 1/)).toBeVisible();
    await expect(page.getByLabel(/Reviewed from pack progress: 4/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue learning plan" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");

    const academicCard = packCard(page, "academic-vocabulary");

    await expect(academicCard).toContainText("Preview completed");
    await expect(academicCard).toContainText("Reviewed count");
    await expect(academicCard).toContainText("4");
    await expect(academicCard).toContainText("Correct count");
    await expect(academicCard).toContainText("3");
    await expect(
      academicCard.getByRole("link", { name: "Continue Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);
    await expectNoForbiddenPacksCopy(page);
  });

  test("Academic detail is read-only on load and switches CTA from start to continue from real progress", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });

    await expect(
      page.getByRole("heading", { level: 1, name: "Academic Vocabulary" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "30-day visual learning plan surface"
    );
    await expect(
      page.getByRole("link", { name: "Start preview Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);
    await expect(page.locator("body")).not.toContainText("Reviewed count");
    await expect(page.locator("body")).not.toContainText("Correct count");
    expect(await readLocalJson(page, packProgressStorageKey)).toBeNull();
    await expectNoForbiddenPacksCopy(page);

    await seedVlxLocalStorage(page, {
      packProgress: {
        "academic-vocabulary": {
          packId: "academic-vocabulary",
          startedAt: "2026-06-28T10:00:00.000Z",
          previewStartedAt: "2026-06-28T10:00:00.000Z",
          lastReviewedAt: "2026-06-29T10:00:00.000Z",
          reviewedCount: 2,
          correctCount: 1,
          source: "review"
        }
      }
    });

    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });

    await expect(
      page.getByRole("link", { name: "Continue review Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);
    await expect(page.locator("body")).toContainText("Reviewed count");
    await expect(page.locator("body")).toContainText("2");
    await expect(page.locator("body")).toContainText("Correct count");
    await expect(page.locator("body")).toContainText("1");
    await expectNoForbiddenPacksCopy(page);
  });

  test("IELTS and GRE detail pages stay preview-only without fake full content", async ({
    page
  }) => {
    for (const route of [
      {
        path: "/packs/ielts-writing-vocabulary",
        heading: "IELTS Writing",
        fullPackCopy: "Full IELTS Writing pack is planned, not live.",
        previewWords: ["Lucid", "Abundance"]
      },
      {
        path: "/packs/gre-visual-verbal",
        heading: "GRE Visual Verbal",
        fullPackCopy: "Full GRE Visual Verbal pack is planned, not live.",
        previewWords: ["Obfuscate", "Lucid"]
      }
    ]) {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading })
      ).toBeVisible();
      await expect(page.locator("body")).toContainText(
        "Preview-only content v1 from current static words."
      );
      await expect(page.locator("body")).toContainText(
        "Private/manual beta requires owner approval."
      );
      await expect(page.locator("body")).toContainText(route.fullPackCopy);
      await expect(page.locator("body")).toContainText(
        "Preview of planned 30-day path"
      );
      await expect(page.locator("body")).toContainText("Preview-only: 4 cards");
      await expect(page.locator("body")).not.toContainText("Word count pending");
      await expect(page.locator("body")).not.toContainText("Free preview pending");
      for (const previewWord of route.previewWords) {
        await expect(page.locator("#pack-preview-words")).toContainText(
          previewWord
        );
      }
      await expect(
        page.getByRole("link", { name: /Start preview|Continue review|Continue/ })
      ).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText(/500 words/i);
      await expect(page.locator("body")).not.toContainText(/full content ready/i);
      await expect(page.locator("body")).not.toContainText(/full unlock/i);
      await expectNoForbiddenPacksCopy(page);
    }
  });

  test("weak words inside packs appear only with real review evidence", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await expect(page.locator("body")).not.toContainText("Weak inside packs");
    await expect(
      packCard(page, "academic-vocabulary").getByRole("link", {
        name: "Practice weak Academic Vocabulary"
      })
    ).toHaveCount(0);

    await seedVlxLocalStorage(page, {
      reviewEvents: [
        {
          sessionId: "s_pack_v3",
          slug: "obfuscate",
          word: "Obfuscate",
          questionType: "weak_review",
          selected: "Clarify",
          answer: "Obfuscate",
          result: "wrong",
          responseMs: 1400,
          createdAt: oneHourAgo(),
          boxAfter: 0,
          weakScoreAfter: 0.78
        }
      ],
      reviewState: {
        obfuscate: makeReviewStateItem()
      }
    });

    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await expect(page.getByLabel(/Weak inside packs: 1/)).toBeVisible();
    await expect(
      packCard(page, "academic-vocabulary").getByRole("link", {
        name: "Practice weak Academic Vocabulary"
      })
    ).toHaveAttribute("href", "/review/weak");
  });

  test("forbidden payment dependencies and route directories are not added", () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, "package.json"), "utf8")
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {})
    };
    const forbiddenDependencies = [
      "stripe",
      "paddle",
      "lemon",
      "lemonsqueezy",
      "lemon-squeezy"
    ];
    const forbiddenRouteDirectories = [
      "src/app/checkout",
      "src/app/billing",
      "src/app/payment",
      "src/app/payments",
      "src/app/api/checkout",
      "src/app/api/billing",
      "src/app/api/payment",
      "src/app/api/payments"
    ];

    for (const dependency of forbiddenDependencies) {
      expect(dependencies, dependency).not.toHaveProperty(dependency);
    }

    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }
  });
});
