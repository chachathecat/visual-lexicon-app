import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_GATE_CHECKOUT_ENABLED,
  PRIVATE_BETA_GATE_OWNER_APPROVAL_REQUIRED,
  PRIVATE_BETA_GATE_PAYMENT_SDK_ENABLED,
  PRIVATE_BETA_GATE_PRIVATE_MANUAL_BETA_VERDICT,
  PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_UNBLOCKED,
  PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_VERDICT,
  PRIVATE_BETA_GATE_REAL_PAYMENT_ENABLED,
  PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS,
  PRIVATE_BETA_GATE_REQUIRED_P0_COUNT,
  PRIVATE_BETA_GATE_SOURCE_MERGE_SHA,
  PRIVATE_BETA_GATE_SOURCE_PR,
  PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST,
  VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
  getPrivateBetaGateAnalyticsEvents,
  getPrivateBetaGateReport,
  getPrivateBetaGateStopConditions,
  type PrivateBetaGateReport
} from "../src/lib/private-beta-gate/private-beta-gate";

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

function readJson<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), "utf8")
  ) as TValue;
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
  const rootPackage = relativePath === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return Object.keys({
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  });
}

test.describe("private beta gate static contract", () => {
  test("the private beta gate report exists and is typed", () => {
    const report: PrivateBetaGateReport = getPrivateBetaGateReport();

    expect(report).toMatchObject({
      version: VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
      source: {
        pr: PRIVATE_BETA_GATE_SOURCE_PR,
        mergeSha: PRIVATE_BETA_GATE_SOURCE_MERGE_SHA
      }
    });
  });

  test("pins source evidence to PR #165 and the merged QA report commit", () => {
    expect(PRIVATE_BETA_GATE_SOURCE_PR).toBe(165);
    expect(PRIVATE_BETA_GATE_SOURCE_MERGE_SHA).toBe(
      "79b2c50214a69c530a875556667b06c1c8f629e0"
    );
    expect(getPrivateBetaGateReport().source.evidenceFile).toBe(
      "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md"
    );
  });

  test("keeps launch verdicts and owner approval gate closed", () => {
    const report = getPrivateBetaGateReport();

    expect(PRIVATE_BETA_GATE_REQUIRED_P0_COUNT).toBe(0);
    expect(report.requiredP0Count).toBe(0);
    expect(PRIVATE_BETA_GATE_OWNER_APPROVAL_REQUIRED).toBe(true);
    expect(report.ownerApprovalRequired).toBe(true);
    expect(PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_VERDICT).toBe("no_go");
    expect(PRIVATE_BETA_GATE_PRIVATE_MANUAL_BETA_VERDICT).toBe(
      "gate_review_required"
    );
    expect(report.verdicts).toMatchObject({
      publicPaidBeta: "no_go",
      privateManualBeta: "gate_review_required",
      privateManualBetaLaunched: false
    });
  });

  test("keeps payment checkout SDK entitlement and public beta unblock disabled", () => {
    const report = getPrivateBetaGateReport();

    expect(PRIVATE_BETA_GATE_REAL_PAYMENT_ENABLED).toBe(false);
    expect(PRIVATE_BETA_GATE_CHECKOUT_ENABLED).toBe(false);
    expect(PRIVATE_BETA_GATE_PAYMENT_SDK_ENABLED).toBe(false);
    expect(PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_UNBLOCKED).toBe(false);
    expect(report.safety).toEqual({
      realPaymentEnabled: false,
      checkoutEnabled: false,
      paymentSdkEnabled: false,
      publicPaidBetaUnblocked: false,
      realPaidEntitlementEnabled: false
    });
  });

  test("requires the expected analytics readiness events", () => {
    expect(PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS).toEqual([
      ...requiredAnalyticsEvents
    ]);
    expect(getPrivateBetaGateAnalyticsEvents()).toEqual([
      ...requiredAnalyticsEvents
    ]);
  });

  test("has support refund and privacy checklist items", () => {
    expect(PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST.length).toBeGreaterThan(
      0
    );

    for (const item of PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST) {
      expect(item.trim().length).toBeGreaterThan(0);
    }
  });

  test("stop conditions cover P0 payment checkout fake mastery and public beta launch risks", () => {
    const stopConditions = getPrivateBetaGateStopConditions().join(" ");

    expect(stopConditions).toContain("P0");
    expect(stopConditions).toContain("payment/checkout");
    expect(stopConditions).toContain("fake mastery");
    expect(stopConditions).toContain("Public paid beta launch");
  });

  test("docs/PRIVATE_BETA_GATE.md exists and contains required gate language", () => {
    const docPath = join(workspaceRoot, "docs", "PRIVATE_BETA_GATE.md");
    const doc = readFileSync(docPath, "utf8");
    const normalizedDoc = doc.toLowerCase();

    expect(existsSync(docPath)).toBe(true);
    expect(doc).toContain("Public paid beta");
    expect(doc).toContain("No-Go");
    expect(doc).toContain("Private/manual");
    expect(normalizedDoc).toContain("owner approval");
    expect(normalizedDoc).toContain("no checkout");
    expect(normalizedDoc).toContain("no payment sdk");
    expect(normalizedDoc).toContain("no real payment");
    expect(doc).toContain("P0");
    expect(normalizedDoc).toContain("support");
    expect(normalizedDoc).toContain("refund");
    expect(normalizedDoc).toContain("privacy");
  });

  test("package files do not add Stripe Paddle Lemon Squeezy or payment SDK dependencies", () => {
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

  test("forbidden checkout billing and payment route directories are not created", () => {
    for (const relativePath of forbiddenRouteDirectories) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(
        false
      );
    }
  });
});
