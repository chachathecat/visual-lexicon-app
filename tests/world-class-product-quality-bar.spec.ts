import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  VISUAL_LEXICON_WORLD_CLASS_PRODUCT_QUALITY_BAR_VERSION,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_ACCESSIBILITY_REQUIREMENTS,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_PERFORMANCE_BUDGETS,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_PRIVATE_MANUAL_BETA_VERDICT,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_PUBLIC_PAID_BETA_VERDICT,
  WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS,
  getWorldClassProductQualityBar,
  getWorldClassProductQualityBarNextSequence,
  getWorldClassProductQualityBarP0Blockers,
  type WorldClassProductQualityBarReport
} from "../src/lib/world-class-product-quality-bar/world-class-product-quality-bar";

const workspaceRoot = process.cwd();

const requiredAnalyticsEvents = [
  "vlx_save_word_click",
  "vlx_quiz_start",
  "vlx_quiz_answer",
  "vlx_quiz_complete",
  "vlx_review_state_update",
  "vlx_due_review_start",
  "vlx_weak_review_start",
  "vlx_pack_preview_start",
  "vlx_pack_preview_complete",
  "vlx_paywall_view",
  "vlx_upgrade_click"
] as const;

const forbiddenPaymentDependencyPatterns = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy"
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

function readJson<TValue>(relativePath: string): TValue {
  return JSON.parse(readWorkspaceFile(relativePath)) as TValue;
}

function rootDependencyNames(relativePath: "package.json" | "package-lock.json") {
  const parsed = readJson<{
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
  }>(relativePath);
  const rootPackage =
    relativePath === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return Object.keys({
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  });
}

test.describe("world-class product quality bar static contract", () => {
  test("the quality bar report exists and is typed", () => {
    const report: WorldClassProductQualityBarReport =
      getWorldClassProductQualityBar();

    expect(report).toMatchObject({
      version: VISUAL_LEXICON_WORLD_CLASS_PRODUCT_QUALITY_BAR_VERSION,
      northStar: WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR,
      productFormula: WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA
    });
  });

  test("pins the north star and product formula", () => {
    expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR).toBe(
      "Weekly Reviewed Words"
    );

    for (const formulaPart of [
      "Visual metaphor",
      "Active recall",
      "Mistake record",
      "Spaced review",
      "Mastery status",
      "Paid habit"
    ]) {
      expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA).toContain(
        formulaPart
      );
    }
  });

  test("keeps paid beta verdicts gated", () => {
    const report = getWorldClassProductQualityBar();

    expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_PUBLIC_PAID_BETA_VERDICT).toBe(
      "no_go"
    );
    expect(report.verdicts.publicPaidBeta).toBe("no_go");
    expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_PRIVATE_MANUAL_BETA_VERDICT).toBe(
      "gate_review_required"
    );
    expect(report.verdicts.privateManualBeta).toBe("gate_review_required");
    expect(report.safety).toEqual({
      realPaymentEnabled: false,
      checkoutEnabled: false,
      paymentSdkEnabled: false,
      realPaidEntitlementEnabled: false,
      publicPaidBetaUnblocked: false
    });
  });

  test("requires the expected learning funnel analytics events", () => {
    expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS).toEqual([
      ...requiredAnalyticsEvents
    ]);
    expect(getWorldClassProductQualityBar().analyticsEvents).toEqual([
      ...requiredAnalyticsEvents
    ]);
  });

  test("includes accessibility requirements for review-critical surfaces", () => {
    const requirements =
      WORLD_CLASS_PRODUCT_QUALITY_BAR_ACCESSIBILITY_REQUIREMENTS.join(" ")
        .toLowerCase();

    for (const requiredTerm of [
      "keyboard",
      "focus",
      "screen reader",
      "reduced motion",
      "mobile one-hand review usability"
    ]) {
      expect(requirements).toContain(requiredTerm);
    }
  });

  test("pins performance budgets", () => {
    expect(WORLD_CLASS_PRODUCT_QUALITY_BAR_PERFORMANCE_BUDGETS).toEqual({
      lcpMs: 2500,
      inpMs: 200,
      cls: 0.1
    });
    expect(
      getWorldClassProductQualityBar().performanceBudgets.lcpMs
    ).toBeLessThanOrEqual(2500);
    expect(
      getWorldClassProductQualityBar().performanceBudgets.inpMs
    ).toBeLessThanOrEqual(200);
    expect(getWorldClassProductQualityBar().performanceBudgets.cls).toBeLessThanOrEqual(
      0.1
    );
  });

  test("P0 blockers cover fake state payment and beta unblock risks", () => {
    const blockers = getWorldClassProductQualityBarP0Blockers().join(" ");

    for (const requiredBlocker of [
      "Fake mastery",
      "Fake paid entitlement",
      "Broken Save -> Review item",
      "Broken review state/events",
      "Fake Due/Weak/Mastered",
      "Payment/checkout/billing route",
      "Public paid beta unblock"
    ]) {
      expect(blockers).toContain(requiredBlocker);
    }
  });

  test("recommended next sequence keeps runtime rebuilds ordered", () => {
    expect(getWorldClassProductQualityBarNextSequence()).toEqual(
      expect.arrayContaining([
        "Dashboard v3 Today Memory Mission",
        "Review Session v3 Focus Mode",
        "Saved Library v3 Memory Queue",
        "Packs v3 30-Day Plan Surface",
        "Pricing / Paywall v3 Outcome Copy"
      ])
    );
  });

  test("docs/WORLD_CLASS_PRODUCT_QUALITY_BAR.md exists and contains required language", () => {
    const docPath = join(
      workspaceRoot,
      "docs",
      "WORLD_CLASS_PRODUCT_QUALITY_BAR.md"
    );
    const doc = readFileSync(docPath, "utf8");

    expect(existsSync(docPath)).toBe(true);

    for (const requiredCopy of [
      "Weekly Reviewed Words",
      "Visual Memory Engine",
      "Save is not enough",
      "Review is not enough",
      "Do not fake mastery",
      "Public paid beta",
      "No-Go",
      "owner approval",
      "LCP",
      "INP",
      "CLS"
    ]) {
      expect(doc).toContain(requiredCopy);
    }
  });

  test("package files do not add forbidden payment dependencies", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencyNames = rootDependencyNames(fileName);

      for (const dependencyName of dependencyNames) {
        const normalizedDependencyName = dependencyName.toLowerCase();

        for (const forbiddenPattern of forbiddenPaymentDependencyPatterns) {
          expect(
            normalizedDependencyName,
            `${fileName} should not include payment dependency ${dependencyName}`
          ).not.toContain(forbiddenPattern);
        }
      }
    }
  });

  test("forbidden payment checkout and billing route directories are not created", () => {
    for (const relativePath of forbiddenRouteDirectories) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }
  });
});
