import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const reportPath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md"
);
const fixedPast = "2026-06-19T10:00:00.000Z";
const fixedFuture = "2026-07-20T10:00:00.000Z";
const academicPreviewReviewHref =
  "/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview";

const requiredRoutes = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings"
] as const;

const cleanupStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
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
  "lemon-squeezy",
  "paypal",
  "braintree",
  "portone"
] as const;

const forbiddenAnalyticsDependencyFragments = [
  "segment",
  "mixpanel",
  "amplitude",
  "posthog",
  "plausible",
  "rudderstack",
  "gtm",
  "gtag",
  "google-analytics"
] as const;

const words = {
  dissonance: {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary"
  },
  obfuscate: {
    slug: "obfuscate",
    word: "Obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    hub: "academic-vocabulary"
  }
} as const;

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readWorkspaceFile(relativePath)) as TValue;
}

function readRootPackageDependencies(
  fileName: "package.json" | "package-lock.json"
) {
  const parsed = readJsonFile<{
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
  }>(fileName);
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

async function seedKeyboardQaState(page: Page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ cleanupStorageKeys, fixedFuture, fixedPast, words }) => {
      for (const key of cleanupStorageKeys) {
        localStorage.removeItem(key);
      }

      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify({
          dissonance: {
            ...words.dissonance,
            source: "word_page",
            savedAt: fixedPast
          },
          obfuscate: {
            ...words.obfuscate,
            source: "word_page",
            savedAt: fixedPast
          }
        })
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify({
          dissonance: {
            ...words.dissonance,
            box: 1,
            mastery: "Learning",
            correct: 1,
            wrong: 0,
            streakCorrect: 1,
            lastReviewedAt: fixedPast,
            nextDueAt: fixedPast,
            weakScore: 0,
            avgResponseMs: 900,
            lastQuestionType: "due_review",
            createdAt: fixedPast,
            updatedAt: fixedPast
          },
          obfuscate: {
            ...words.obfuscate,
            box: 0,
            mastery: "Weak",
            correct: 1,
            wrong: 2,
            streakCorrect: 0,
            lastReviewedAt: fixedPast,
            nextDueAt: fixedFuture,
            weakScore: 0.72,
            avgResponseMs: 2400,
            lastQuestionType: "weak_review",
            createdAt: fixedPast,
            updatedAt: fixedPast
          }
        })
      );
      localStorage.setItem("vlx_review_events_v1", JSON.stringify([]));
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));
      localStorage.setItem("vlx_pack_progress_v1", JSON.stringify({}));
    },
    { cleanupStorageKeys, fixedFuture, fixedPast, words }
  );
}

async function seedSettingsPaywallState(page: Page) {
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ cleanupStorageKeys, fixedPast, words }) => {
      for (const key of cleanupStorageKeys) {
        localStorage.removeItem(key);
      }

      const savedWords = Object.fromEntries(
        Array.from({ length: 51 }, (_, index) => {
          const slug = `saved-${index + 1}`;

          return [
            slug,
            {
              ...words.dissonance,
              slug,
              word: `Saved ${index + 1}`,
              source: "word_page",
              savedAt: fixedPast
            }
          ];
        })
      );

      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
      localStorage.setItem("vlx_review_state_v1", JSON.stringify({}));
      localStorage.setItem("vlx_review_events_v1", JSON.stringify([]));
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));
      localStorage.setItem("vlx_pack_progress_v1", JSON.stringify({}));
    },
    { cleanupStorageKeys, fixedPast, words }
  );
}

async function expectKeyboardActivationShowsConfidence(
  page: Page,
  route: "/review/due" | "/review/weak",
  answerName: "Dissonance" | "Obfuscate"
) {
  await seedKeyboardQaState(page);
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

  const answer = page.getByRole("button", { name: answerName });

  await expect(answer).toBeEnabled();
  await answer.focus();
  await page.keyboard.press("Space");

  const confidence = page.getByRole("button", { name: "I knew it" });

  await expect(confidence).toBeEnabled();
  await confidence.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "View summary" })).toBeEnabled();
}

test.describe("Track B v3 keyboard QA follow-up", () => {
  test("keyboard follow-up report exists and records required scope", () => {
    expect(existsSync(reportPath), reportPath).toBe(true);

    const report = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md"
    );

    for (const section of [
      "## Executive Summary",
      "## Why This Follows #176 And #177",
      "## Environment",
      "## Commit Under Test",
      "## Keyboard QA Scope",
      "## Routes Tested",
      "## Sequential Tab Traversal Result",
      "## Focus Visibility Result",
      "## Primary CTA Keyboard Activation Result",
      "## Review Controls Keyboard Result",
      "## Saved Library Keyboard Result",
      "## Packs Keyboard Result",
      "## Pricing/Paywall Keyboard Result",
      "## Settings/Paywall Prompt Focus Result",
      "## Mobile Keyboard/Small Viewport Note",
      "## Known Limitations",
      "## P0/P1/P2 Result",
      "## Private/Manual Beta Recommendation",
      "## Public Paid Beta Recommendation",
      "## Explicit Safety Confirmation"
    ]) {
      expect(report, section).toContain(section);
    }

    for (const status of ["PASS", "PASS WITH NOTE", "FAIL", "BLOCKED"]) {
      expect(report, status).toContain(status);
    }

    expect(report).toContain("#176");
    expect(report).toContain("#177");
    expect(report).toContain("full sequential Tab traversal was brittle");
    expect(report).toContain("conditional owner-gated candidate only");
    expect(report).toContain("Public paid beta remains No-Go");
    expect(report).toContain(
      "docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md"
    );

    for (const route of requiredRoutes) {
      expect(report, route).toContain(route);
    }
  });

  test("README links the keyboard follow-up report and guard", () => {
    const readme = readWorkspaceFile("README.md");

    expect(readme).toContain(
      "docs/TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md"
    );
    expect(readme).toContain("tests/v3-keyboard-qa-follow-up.spec.ts");
  });

  test("primary CTA accessible names and keyboard activation remain stable", async ({
    page
  }) => {
    await seedKeyboardQaState(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    const dashboardCta = page.getByRole("link", { name: "Start due review" });

    await expect(dashboardCta).toHaveAttribute("href", "/review/due");
    await dashboardCta.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/review\/due$/);

    await seedKeyboardQaState(page);
    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start due review" })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      page.getByRole("link", { name: "Review Dissonance" })
    ).toHaveAttribute("href", "/review/due");

    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start free review" })
    ).toHaveAttribute("href", "/dashboard");

    const liteInterest = page.getByRole("button", {
      name: "I'm interested in Lite"
    });

    await expect(liteInterest).toBeEnabled();
    await liteInterest.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText(
      "This does not grant paid access"
    );

    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start Academic preview" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");
    await expect(
      page.getByRole("link", { name: "Start preview Academic Vocabulary" }).first()
    ).toHaveAttribute("href", academicPreviewReviewHref);

    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });
    await expect(
      page.getByRole("link", { name: "Start preview Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);
  });

  test("review answer option and confidence controls are keyboard-addressable", async ({
    page
  }) => {
    await expectKeyboardActivationShowsConfidence(
      page,
      "/review/due",
      "Dissonance"
    );
    await expectKeyboardActivationShowsConfidence(
      page,
      "/review/weak",
      "Obfuscate"
    );
  });

  test("pricing customer disclosure remains clear and interest-only", async ({
    page
  }) => {
    await seedKeyboardQaState(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const pricingText = await page.locator("body").innerText();

    for (const phrase of [
      "Early access preview",
      "Paid plans aren't available to purchase yet",
      "Interest buttons save your preference on this device only",
      "no payment is taken",
      "no paid features are unlocked"
    ]) {
      expect(pricingText, phrase).toContain(phrase);
    }

    expect(pricingText).not.toMatch(/no-go|owner approval|entitlement|paywall/i);
    expect(pricingText).not.toMatch(/checkout enabled|billing connected/i);
    expect(pricingText).not.toMatch(/payment active|subscription active/i);
    expect(pricingText).not.toMatch(/paid access granted|paid entitlement granted/i);
  });

  test("settings paywall prompt exposes accessible heading body and action copy", async ({
    page
  }) => {
    await seedSettingsPaywallState(page);
    await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });

    const prompt = page.locator("[data-paywall-trigger='save_limit']").first();

    await expect(prompt).toBeVisible();
    await expect(
      prompt.getByRole("heading", { name: /memory library is full/i })
    ).toBeVisible();
    await expect(prompt).toContainText("Billing is not connected yet");
    await expect(prompt).toContainText("No checkout is live");
    await expect(prompt).toContainText("This records beta interest only");
    await expect(prompt).toContainText("This does not grant paid access");
    await expect(prompt).toContainText("No real paid entitlement is active");
    await expect(prompt).toContainText("Public paid beta remains No-Go");

    const interestButton = prompt.getByRole("button", {
      name: "Note Lite interest - billing not connected yet"
    });

    await expect(interestButton).toBeEnabled();
    await interestButton.focus();
    await page.keyboard.press("Enter");
    await expect(prompt.getByRole("status")).toContainText(
      "This does not grant paid access"
    );
    await expect(
      prompt.getByRole("link", { name: "Compare plans" })
    ).toHaveAttribute("href", "/pricing");

    const localPlanState = await page.evaluate(() =>
      localStorage.getItem("vlx_plan_state_v1")
    );

    expect(localPlanState).toBeNull();
  });

  test("no checkout payment billing route directories exist", () => {
    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }
  });

  test("no forbidden payment dependencies exist", () => {
    expectNoDependencyFragments(forbiddenPaymentDependencyFragments);
  });

  test("no analytics SDK or tracking pixel dependency is added", () => {
    expectNoDependencyFragments(forbiddenAnalyticsDependencyFragments);
  });
});
