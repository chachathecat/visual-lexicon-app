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

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  packProgressStorageKey,
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const previewOnlyPacks = [
  {
    path: "/packs/ielts-writing-vocabulary",
    title: "IELTS Writing",
    fullPackCopy: "Full IELTS Writing pack is planned, not live.",
    previewWords: ["Lucid", "Abundance"],
    forbiddenClaim: /full IELTS pack available|IELTS\/GRE full pack available/i
  },
  {
    path: "/packs/gre-visual-verbal",
    title: "GRE Visual Verbal",
    fullPackCopy: "Full GRE Visual Verbal pack is planned, not live.",
    previewWords: ["Obfuscate", "Lucid"],
    forbiddenClaim: /full GRE pack available|IELTS\/GRE full pack available/i
  }
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

const forbiddenPaymentDependencies = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy"
] as const;

const forbiddenAnalyticsDependencies = [
  "segment",
  "mixpanel",
  "amplitude",
  "posthog",
  "plausible",
  "rudderstack"
] as const;

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
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

async function seedPackProgress(page: Page) {
  await clearVlxLocalStorage(page);

  await page.evaluate(() => {
    localStorage.setItem(
      "vlx_pack_progress_v1",
      JSON.stringify({
        "academic-vocabulary": {
          packId: "academic-vocabulary",
          startedAt: "2026-07-07T09:00:00.000Z",
          previewStartedAt: "2026-07-07T09:00:00.000Z",
          lastReviewedAt: "2026-07-07T09:04:00.000Z",
          reviewedCount: 2,
          correctCount: 1,
          source: "review"
        }
      })
    );
  });
}

function featuredCard(page: Page, title: string) {
  return page
    .locator("#packs-v2-featured article.pack-card")
    .filter({ hasText: title });
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

test.describe("Exam Pack Content v1", () => {
  test.beforeEach(async ({ page }) => {
    await clearVlxLocalStorage(page);
  });

  test("/packs loads and shows the three canonical exam plans", async ({
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
      await expect(featuredCard(page, title)).toBeVisible();
    }
  });

  test("Academic remains the active starter pack backed by current data", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    const academicCard = featuredCard(page, "Academic Vocabulary");

    await expect(academicCard).toContainText("Active starter pack");
    await expect(academicCard).toContainText("Preview ready");
    await expect(academicCard).toContainText("3 words");
    await expect(academicCard).toContainText("Free preview: 3 cards");
    await expect(
      academicCard.getByRole("link", {
        name: "Start preview Academic Vocabulary"
      })
    ).toHaveAttribute("href", academicPreviewReviewHref);

    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });
    await expect(page.locator("#pack-preview-words")).toContainText("Dissonance");
    await expect(page.locator("#pack-preview-words")).toContainText(
      "Memory cue:"
    );
  });

  test("IELTS and GRE show preview-only content without full-pack claims", async ({
    page
  }) => {
    for (const pack of previewOnlyPacks) {
      await page.goto(`${baseUrl}${pack.path}`, { waitUntil: "networkidle" });

      const bodyText = await page.locator("body").innerText();

      await expect(
        page.getByRole("heading", { level: 1, name: pack.title })
      ).toBeVisible();
      await expect(page.locator("body")).toContainText(
        "Preview of planned 30-day path"
      );
      await expect(page.locator("body")).toContainText(
        "Preview-only content v1 from current static words."
      );
      await expect(page.locator("body")).toContainText(pack.fullPackCopy);
      await expect(page.locator("body")).toContainText("Preview-only: 4 cards");

      for (const previewWord of pack.previewWords) {
        await expect(page.locator("#pack-preview-words")).toContainText(
          previewWord
        );
      }

      expect(bodyText).not.toMatch(pack.forbiddenClaim);
      expect(bodyText).not.toMatch(/500 words|700 words|900 words/i);
      expect(bodyText).not.toMatch(/full content ready|full unlock/i);
      await expect(
        page.getByRole("link", { name: /Start preview|Start review|Continue/ })
      ).toHaveCount(0);
    }
  });

  test("pack page loads do not write fake pack progress", async ({ page }) => {
    for (const route of [
      "/packs",
      "/packs/academic-vocabulary",
      "/packs/ielts-writing-vocabulary",
      "/packs/gre-visual-verbal"
    ]) {
      await clearVlxLocalStorage(page);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      expect(await readLocalJson(page, packProgressStorageKey)).toBeNull();
    }
  });

  test("Continue CTA appears only from real vlx_pack_progress_v1 evidence", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Start Academic preview" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue learning plan" })
    ).toHaveCount(0);

    await seedPackProgress(page);
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Continue learning plan" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");
    await expect(
      featuredCard(page, "Academic Vocabulary").getByRole("link", {
        name: "Continue Academic Vocabulary"
      })
    ).toHaveAttribute("href", academicPreviewReviewHref);
  });

  test("explicit Academic preview action can create progress without review events", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });

    expect(await readLocalJson(page, packProgressStorageKey)).toBeNull();

    await featuredCard(page, "Academic Vocabulary")
      .getByRole("link", { name: "Start preview Academic Vocabulary" })
      .click();

    await expect(page).toHaveURL(/\/review\?/);

    const progressStore = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, packProgressStorageKey);
    const academicProgress = progressStore?.["academic-vocabulary"];

    expect(academicProgress?.source).toBe("packs_page");
    expect(typeof academicProgress?.previewStartedAt).toBe("string");
    expect(academicProgress?.reviewedCount).toBe(0);
    expect(academicProgress?.correctCount).toBe(0);
    expect(await readLocalJson(page, "vlx_review_events_v1")).toBeNull();
    expect(await readLocalJson(page, "vlx_review_state_v1")).toBeNull();
  });

  test("forbidden payment routes, payment deps, and analytics SDKs are absent", () => {
    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }

    expectNoDependencyFragments(forbiddenPaymentDependencies);
    expectNoDependencyFragments(forbiddenAnalyticsDependencies);
  });

  test("docs preserve real-vs-planned inventory and beta safety state", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_EXAM_PACK_CONTENT_V1.md");
    const doc = readFileSync(docPath, "utf8");
    const placeholderAudit = readWorkspaceFile(
      "docs",
      "TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md"
    );
    const keyboardReport = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md"
    );

    expect(existsSync(docPath)).toBe(true);

    for (const section of [
      "## Executive Summary",
      "## Why This Follows #178",
      "## Pack Content Inventory",
      "## Academic Content Status",
      "## IELTS Preview Content Status",
      "## GRE Preview Content Status",
      "## What Is Real Vs Planned",
      "## P0/P1/P2 Content Risk Summary",
      "## Safety Boundaries",
      "## Future Content Expansion Plan"
    ]) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("Public paid beta remains No-Go");
    expect(doc).toContain("Private/manual beta remains owner-gated");
    expect(doc).toContain("No Webflow, Cloudflare Workers, auth, billing");
    expect(doc).toContain("dissonance");
    expect(doc).toContain("ielts-writing-vocabulary");
    expect(doc).toContain("gre-visual-verbal");
    expect(placeholderAudit).toContain(
      "P0 unsafe paid-access copy found in current runtime surfaces: `0`"
    );
    expect(placeholderAudit).toContain("Public paid beta: No-Go");
    expect(keyboardReport).toContain(
      "PR target | `#178 [Track B] Add v3 Keyboard QA Follow-up Report`"
    );
    expect(keyboardReport).toContain("Public paid beta remains No-Go");
  });
});
