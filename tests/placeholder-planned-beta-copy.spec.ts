import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateNoWatermarkDownloadPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  evaluateWeakWordsSprintLockedPaywall
} from "../src/lib/paywall";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();

const approvedSafetyCopy = [
  "Billing is not connected yet.",
  "No checkout is live.",
  "This records beta interest only.",
  "This does not grant paid access.",
  "No real paid entitlement is active.",
  "Private/manual beta requires owner approval.",
  "Public paid beta remains No-Go.",
  "Preview plan is being prepared.",
  "Planned pack data is not available yet.",
  "Full IELTS/GRE content is not implied until real word data exists.",
  "AI mistake explanations are planned for a future approved implementation."
] as const;

const forbiddenClaimPattern =
  /checkout enabled|billing connected|payment active|subscription active|paid access granted|paid entitlement granted|public beta launched|public paid beta is live|public paid beta launched|public paid beta is launched|private beta launched|private beta is launched|private\/manual beta is launched/i;

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
  "google-analytics"
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

function makePaywallPrompts() {
  return [
    evaluateSaveLimitPaywall({
      plan: "free",
      savedCount: 50,
      source: "copy_audit_save_limit"
    }),
    evaluateReviewLimitPaywall({
      plan: "guest",
      dailyReviewedCount: 10,
      source: "copy_audit_review_limit"
    }),
    evaluateExamPackPreviewEndPaywall({
      plan: "lite",
      packId: "academic-vocabulary",
      previewCompleted: true,
      source: "copy_audit_pack_preview_end"
    }),
    evaluateWeakWordsSprintLockedPaywall({
      plan: "lite",
      weakCount: 2,
      source: "copy_audit_weak_words_sprint"
    }),
    evaluateMasteryExportLockedPaywall({
      plan: "free",
      masteredCount: 1,
      source: "copy_audit_mastery_export"
    }),
    evaluateNoWatermarkDownloadPaywall({
      plan: "free",
      slug: "lucid",
      source: "copy_audit_no_watermark"
    }),
    evaluateMistakeExplanationLockedPaywall({
      plan: "free",
      wrongCount: 2,
      slug: "dissonance",
      source: "copy_audit_mistake_explanation"
    })
  ].filter((prompt): prompt is NonNullable<typeof prompt> => Boolean(prompt));
}

test.describe("Placeholder planned beta copy safety", () => {
  test("pricing and paywall surfaces expose approved interest-only safety copy", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const pricingText = await page.locator("body").innerText();

    for (const phrase of approvedSafetyCopy.slice(0, 7)) {
      expect(pricingText, phrase).toContain(phrase);
    }

    expect(pricingText).not.toMatch(forbiddenClaimPattern);
    expect(pricingText).not.toMatch(/Pro unlocks|Exam Pack unlocks/i);

    const promptText = makePaywallPrompts()
      .map((prompt) => `${prompt.title}\n${prompt.body}\n${prompt.primaryCtaLabel}`)
      .join("\n");

    for (const phrase of approvedSafetyCopy.slice(0, 5)) {
      expect(promptText, phrase).toContain(phrase);
    }

    expect(promptText).toContain(
      "AI mistake explanations are planned for a future approved implementation"
    );
    expect(promptText).toContain(
      "No-watermark export is planned for a future approved implementation"
    );
    expect(promptText).not.toMatch(forbiddenClaimPattern);
    expect(promptText).not.toMatch(/Pro unlocks|Exam Pack unlocks/i);
  });

  test("current runtime beta surfaces avoid forbidden launch or paid-access claims", async ({
    page
  }) => {
    for (const route of [
      "/pricing",
      "/packs",
      "/packs/academic-vocabulary",
      "/packs/ielts-writing-vocabulary",
      "/packs/gre-visual-verbal",
      "/settings"
    ]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      const bodyText = await page.locator("body").innerText();

      expect(bodyText, route).not.toMatch(forbiddenClaimPattern);
      expect(bodyText, route).not.toMatch(/checkout enabled/i);
      expect(bodyText, route).not.toMatch(/billing connected/i);
      expect(bodyText, route).not.toMatch(/payment active/i);
      expect(bodyText, route).not.toMatch(/subscription active/i);
    }
  });

  test("private/manual beta remains owner-gated and public paid beta remains No-Go", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    await expect(page.locator("body")).toContainText(
      "Private/manual beta requires owner approval."
    );
    await expect(page.locator("body")).toContainText(
      "Public paid beta remains No-Go."
    );

    for (const route of [
      "/packs/ielts-writing-vocabulary",
      "/packs/gre-visual-verbal"
    ]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toContainText(
        "Private/manual beta requires owner approval."
      );
      await expect(page.locator("body")).not.toContainText(
        /private beta launched|private beta is launched/i
      );
    }
  });

  test("planned IELTS and GRE packs do not claim full content without real data", async ({
    page
  }) => {
    for (const route of [
      "/packs/ielts-writing-vocabulary",
      "/packs/gre-visual-verbal"
    ]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });

      const bodyText = await page.locator("body").innerText();

      expect(bodyText).toContain("Preview plan is being prepared.");
      expect(bodyText).toContain("Planned pack data is not available yet.");
      expect(bodyText).toContain(
        "Full IELTS/GRE content is not implied until real word data exists."
      );
      expect(bodyText).toContain("Word count pending");
      expect(bodyText).toContain("Free preview pending");
      expect(bodyText).not.toMatch(/IELTS\/GRE full pack available/i);
      expect(bodyText).not.toMatch(/500 words|700 words|full content ready/i);
      await expect(
        page.getByRole("link", { name: /Start preview|Continue review|Continue/ })
      ).toHaveCount(0);
    }
  });

  test("AI mistake explanation export and no-watermark copy remain planned or gated", () => {
    const prompts = makePaywallPrompts();
    const noWatermarkPrompt = prompts.find(
      (prompt) => prompt.id === "no_watermark_download"
    );
    const mistakePrompt = prompts.find(
      (prompt) => prompt.id === "mistake_explanation_locked"
    );
    const exportPrompt = prompts.find(
      (prompt) => prompt.id === "mastery_export_locked"
    );

    expect(noWatermarkPrompt?.body).toContain(
      "No-watermark export is planned for a future approved implementation."
    );
    expect(mistakePrompt?.body).toContain(
      "AI mistake explanations are planned for a future approved implementation"
    );
    expect(exportPrompt?.body).toContain(
      "Pro is planned for memory exports from real review history"
    );

    for (const prompt of [noWatermarkPrompt, mistakePrompt, exportPrompt]) {
      expect(prompt?.body).toContain("Billing is not connected yet.");
      expect(prompt?.body).toContain("No checkout is live.");
      expect(prompt?.body).toContain("This records beta interest only.");
      expect(prompt?.body).toContain("This does not grant paid access.");
      expect(prompt?.body).toContain("No real paid entitlement is active.");
      expect(prompt?.body).not.toMatch(/included now|active now|available now/i);
    }
  });

  test("no checkout payment or billing route directories exist", () => {
    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }
  });

  test("no forbidden payment dependencies or analytics SDKs are present", () => {
    expectNoDependencyFragments(forbiddenPaymentDependencyFragments);
    expectNoDependencyFragments(forbiddenAnalyticsDependencyFragments);
  });

  test("#176 manual QA report still has P0 count zero and public paid beta No-Go", () => {
    const report = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md"
    );

    expect(report).toContain("P0 count: `0`");
    expect(report).toContain("Public paid beta: **No-Go**");
    expect(report).toContain("Public paid beta remains No-Go");
    expect(report).toContain("conditional owner-gated candidate only");
    expect(report).not.toMatch(forbiddenClaimPattern);
  });

  test("copy audit document includes required inventories patterns and boundaries", () => {
    const auditPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md"
    );
    const audit = readFileSync(auditPath, "utf8");
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(auditPath)).toBe(true);

    for (const section of [
      "## Executive Summary",
      "## Search Inventory",
      "## Copy Risk Classes",
      "## Approved Copy Patterns",
      "## Forbidden Copy Patterns",
      "## Route/Surface Inventory",
      "## P0/P1/P2 Copy Risk Summary",
      "## Owner-Gated Private/Manual Beta Language",
      "## Public Paid Beta No-Go Language",
      "## Explicit Safety Boundaries"
    ]) {
      expect(audit, section).toContain(section);
    }

    for (const phrase of approvedSafetyCopy) {
      expect(audit, phrase).toContain(phrase);
    }

    for (const phrase of [
      "Checkout enabled",
      "Billing connected",
      "Payment active",
      "Subscription active",
      "Paid access granted",
      "Paid entitlement granted",
      "Public beta launched",
      "Public paid beta is live",
      "Private beta launched",
      "IELTS/GRE full pack available",
      "AI mistake explanations included now"
    ]) {
      expect(audit, phrase).toContain(phrase);
    }

    expect(audit).toContain("P0 unsafe paid-access copy found in current runtime surfaces: `0`");
    expect(audit).toContain("No Webflow, Cloudflare Workers, auth, billing");
    expect(readme).toContain(
      "docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md"
    );
  });
});
