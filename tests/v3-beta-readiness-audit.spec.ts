import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();

const auditPath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_V3_BETA_READINESS_AUDIT.md"
);
const manualQaPath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_V3_MANUAL_QA_SCRIPT.md"
);
const manualQaExecutionPath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md"
);

const requiredRoutes = [
  "/",
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=extension",
  "/word/dissonance"
] as const;

const requiredStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const requiredAnalyticsFields = [
  "Weekly Reviewed Words",
  "savedWordCount",
  "saveToReviewRate",
  "dueWordCount",
  "weakWordCount",
  "masteredWordCount",
  "reviewEventCount",
  "reviewCompletionCount",
  "weakWordRepairCount",
  "packPreviewStartedCount",
  "packPreviewCompletedCount",
  "upgradeInterestCount",
  "corruptPayloadKeys",
  "safetyFlags"
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

const forbiddenDependencyFragments = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy",
  "segment",
  "mixpanel",
  "amplitude",
  "posthog",
  "plausible",
  "rudderstack"
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

test.describe("Track B v3 beta readiness audit", () => {
  test("docs exist", () => {
    expect(existsSync(auditPath), auditPath).toBe(true);
    expect(existsSync(manualQaPath), manualQaPath).toBe(true);
    expect(existsSync(manualQaExecutionPath), manualQaExecutionPath).toBe(true);
  });

  test("audit includes P0 P1 and P2 risk sections", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");

    expect(audit).toContain("## P0 Risk List");
    expect(audit).toContain("## P1 Risk List");
    expect(audit).toContain("## P2 Risk List");
    expect(audit).toContain("Save -> review item creation");
    expect(audit).toContain("No fake mastery");
  });

  test("audit distinguishes private manual beta from public paid beta", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");

    expect(audit).toContain("Private/manual beta:");
    expect(audit).toContain("conditional owner-gated candidate only");
    expect(audit).toContain("Private/manual beta remains owner-gated");
    expect(audit).toContain("Public paid beta:");
    expect(audit).toContain("Public paid beta remains No-Go");
    expect(audit).toContain("This audit must not be interpreted as a public paid beta unblock.");
  });

  test("route inventory mentions required routes", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");

    for (const route of requiredRoutes) {
      expect(audit, route).toContain(route);
    }
  });

  test("localStorage inventory mentions required keys", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");
    const manualQa = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_MANUAL_QA_SCRIPT.md"
    ).replace(/\r\n/g, "\n");

    for (const key of requiredStorageKeys) {
      expect(audit, key).toContain(key);
      expect(manualQa, key).toContain(key);
    }
  });

  test("#174 analytics snapshot metrics are represented", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");

    for (const field of requiredAnalyticsFields) {
      expect(audit, field).toContain(field);
    }

    expect(audit).toContain("local/readiness-only");
    expect(audit).toContain("does not send analytics");
  });

  test("manual QA script includes Save Review Events Daily Stats Packs Pricing path", () => {
    const manualQa = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_MANUAL_QA_SCRIPT.md"
    ).replace(/\r\n/g, "\n");

    expect(manualQa).toContain(
      "Save -> Review -> Events -> Daily Stats -> Packs ->\nPricing path"
    );

    for (const phrase of [
      "Clear LocalStorage",
      "/save?slug=dissonance&source=word_page",
      "/review/due",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1",
      "/review/weak",
      "/packs",
      "/packs/academic-vocabulary",
      "/pricing",
      "vlx_upgrade_interest_v1",
      "Confirm No Checkout Payment Or Billing Route",
      "Mobile Smoke",
      "Keyboard Navigation Smoke",
      "Console Error Smoke"
    ]) {
      expect(manualQa, phrase).toContain(phrase);
    }
  });

  test("manual QA execution report records results and safety boundaries", () => {
    const report = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md"
    );

    for (const section of [
      "Executive Summary",
      "Environment",
      "Commit under test",
      "Date/Time Of QA",
      "Local Test Setup",
      "Browser Used",
      "Validation Commands",
      "Manual QA Steps",
      "Evidence Summary",
      "Console Error Summary",
      "Mobile Smoke Summary",
      "Keyboard Navigation Smoke Summary",
      "P0/P1/P2 Result",
      "Private/Manual Beta Recommendation",
      "Public Paid Beta Recommendation",
      "Safety Confirmation"
    ]) {
      expect(report, section).toContain(section);
    }

    for (const status of [
      "PASS",
      "PASS WITH NOTE",
      "FAIL",
      "BLOCKED",
      "NOT RUN"
    ]) {
      expect(report, status).toContain(status);
    }

    expect(report).toContain("P0 count: `0`");
    expect(report).toContain("Public paid beta remains No-Go");
    expect(report).toContain("conditional owner-gated candidate only");
    expect(report).toContain("No Webflow, Cloudflare Workers, auth, billing");
    expect(report).toContain("payment SDK, real entitlement, analytics SDK");
    expect(report).not.toMatch(/public paid beta (is )?(live|launched)/i);
    expect(report).not.toMatch(/paid access granted/i);
  });

  test("no forbidden payment checkout or billing route directories exist", () => {
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

  test("all forbidden dependency fragments remain absent", () => {
    expectNoDependencyFragments(forbiddenDependencyFragments);
  });

  test("public paid beta remains No-Go", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");
    const manualQa = readWorkspaceFile("docs", "TRACK_B_V3_MANUAL_QA_SCRIPT.md");

    expect(audit).toContain("Recommendation: **Public paid beta remains No-Go**");
    expect(manualQa).toContain("Public paid beta remains No-Go");
    expect(`${audit}\n${manualQa}`).not.toMatch(/public paid beta is go/i);
    expect(`${audit}\n${manualQa}`).not.toMatch(/public paid beta launched/i);
  });

  test("private manual beta remains owner-gated", () => {
    const audit = readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md");
    const manualQa = readWorkspaceFile("docs", "TRACK_B_V3_MANUAL_QA_SCRIPT.md");

    expect(audit).toContain("owner-gated only");
    expect(audit).toContain("Private/manual beta remains owner-gated");
    expect(manualQa).toContain("Private/manual beta remains owner-gated");
    expect(`${audit}\n${manualQa}`).not.toMatch(/private beta is launched/i);
    expect(`${audit}\n${manualQa}`).not.toMatch(/private\/manual beta is launched/i);
  });

  test("fake mastery and fake entitlement claims remain forbidden", () => {
    const combinedDocs = [
      readWorkspaceFile("docs", "TRACK_B_V3_BETA_READINESS_AUDIT.md"),
      readWorkspaceFile("docs", "TRACK_B_V3_MANUAL_QA_SCRIPT.md")
    ].join("\n");

    expect(combinedDocs).toContain("No fake mastery");
    expect(combinedDocs).toContain("No fake paid entitlement");
    expect(combinedDocs).not.toMatch(/fake mastery (is )?allowed/i);
    expect(combinedDocs).not.toMatch(/fake paid entitlement (is )?allowed/i);
    expect(combinedDocs).not.toMatch(/real paid entitlement (is )?active/i);
    expect(combinedDocs).not.toMatch(/paid entitlement granted/i);
    expect(combinedDocs).not.toMatch(/paid access granted/i);
  });

  test("README links the v3 audit and manual QA docs", () => {
    const readme = readWorkspaceFile("README.md");

    expect(readme).toContain("docs/TRACK_B_V3_BETA_READINESS_AUDIT.md");
    expect(readme).toContain("docs/TRACK_B_V3_MANUAL_QA_SCRIPT.md");
    expect(readme).toContain("docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md");
  });
});
