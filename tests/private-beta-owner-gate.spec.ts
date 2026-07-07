import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const ownerGatePath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
);

const requiredSections = [
  "## Executive Summary",
  "## Why This Follows #180",
  "## Current Track B Capability Inventory",
  "## Evidence From #175 Through #180",
  "## Route Inventory",
  "## LocalStorage Inventory",
  "## Pack Content Status",
  "## Extension Save -> Review Status",
  "## Accessibility/Performance/Keyboard/Manual QA Status",
  "## Real Vs Planned Summary",
  "## P0/P1/P2 Risk Summary",
  "## Owner Approval Checklist",
  "## Private/Manual Beta Recommendation",
  "## Public Paid Beta Recommendation",
  "## Safety Boundaries",
  "## Next Expansion Plan"
] as const;

const requiredCapabilities = [
  "Dashboard Today Memory Mission",
  "Review Session Focus Mode",
  "Saved Library Memory Queue",
  "Packs 30-Day Plan Surface",
  "Pricing / Paywall Outcome Copy",
  "Accessibility / Performance Release Gate",
  "Analytics Learning Funnel Dashboard",
  "Beta Readiness Audit",
  "Manual QA Execution Report",
  "Placeholder / Planned Beta Copy",
  "Keyboard QA Follow-up",
  "Exam Pack Content v1",
  "Extension Save -> Review Loop Alignment"
] as const;

const requiredRoutes = [
  "/dashboard",
  "/saved",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=extension",
  "/review",
  "/review?mode=saved",
  "/review?mode=due",
  "/review?mode=weak",
  "/review?mode=word&slug=dissonance",
  "/packs",
  "/packs/academic-vocabulary",
  "/packs/ielts-writing-vocabulary",
  "/packs/gre-visual-verbal",
  "/pricing",
  "/settings"
] as const;

const requiredStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
] as const;

const requiredEvidenceDocs = [
  "docs/TRACK_B_V3_BETA_READINESS_AUDIT.md",
  "docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md",
  "docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md",
  "docs/TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md",
  "docs/TRACK_B_EXAM_PACK_CONTENT_V1.md",
  "docs/TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md"
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

const forbiddenLaunchClaimPattern =
  /private beta launched|private beta is launched|private\/manual beta is launched|public paid beta launched|public paid beta is live|public paid beta is launched|public paid beta is go|public paid beta unblocked|paid access granted|paid entitlement granted/i;

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

test.describe("Track B private beta candidate owner gate", () => {
  test("owner gate doc exists and is linked from README", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(ownerGatePath), ownerGatePath).toBe(true);
    expect(readme).toContain("docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md");
  });

  test("owner gate doc includes required sections capabilities routes and storage keys", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );

    for (const section of requiredSections) {
      expect(doc, section).toContain(section);
    }

    for (const capability of requiredCapabilities) {
      expect(doc, capability).toContain(capability);
    }

    for (const route of requiredRoutes) {
      expect(doc, route).toContain(route);
    }

    for (const key of requiredStorageKeys) {
      expect(doc, key).toContain(key);
    }
  });

  test("evidence docs for #175 through #180 exist and are referenced", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );

    for (const evidenceDoc of requiredEvidenceDocs) {
      expect(existsSync(join(workspaceRoot, evidenceDoc)), evidenceDoc).toBe(
        true
      );
      expect(doc, evidenceDoc).toContain(evidenceDoc);
    }

    for (const prNumber of ["#175", "#176", "#177", "#178", "#179", "#180"]) {
      expect(doc, prNumber).toContain(prNumber);
    }
  });

  test("public paid beta remains No-Go and private manual beta remains owner-gated", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );

    expect(doc).toContain("Public paid beta remains No-Go");
    expect(doc).toContain(
      "Recommendation: **Public paid beta remains No-Go**"
    );
    expect(doc).toContain(
      "Private/manual beta is a conditional owner-gated candidate only"
    );
    expect(doc).toContain(
      "Recommendation: **conditional private/manual beta candidate, owner-gated only**"
    );
    expect(doc).toContain(
      "This document does not launch private/manual beta"
    );
    expect(doc).toContain(
      "This document must not be interpreted as a public paid beta unblock."
    );
    expect(doc).not.toMatch(forbiddenLaunchClaimPattern);
  });

  test("dependent docs keep launch and content safety posture", () => {
    const examPackDoc = readWorkspaceFile(
      "docs",
      "TRACK_B_EXAM_PACK_CONTENT_V1.md"
    );
    const extensionDoc = readWorkspaceFile(
      "docs",
      "TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md"
    );
    const keyboardDoc = readWorkspaceFile(
      "docs",
      "TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md"
    );
    const placeholderDoc = readWorkspaceFile(
      "docs",
      "TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md"
    );

    expect(examPackDoc).toContain("Public paid beta remains No-Go");
    expect(examPackDoc).toContain("Full IELTS Writing pack content is planned");
    expect(examPackDoc).toContain("Full GRE Visual Verbal pack content is planned");
    expect(examPackDoc).not.toMatch(/full IELTS\/GRE pack available/i);

    expect(extensionDoc).toContain(
      "Chrome extension rewrite"
    );
    expect(extensionDoc).toContain("Public paid beta remains No-Go");
    expect(extensionDoc).not.toMatch(/Chrome extension rewrite is complete/i);

    expect(keyboardDoc).toContain(
      "PR target | `#178 [Track B] Add v3 Keyboard QA Follow-up Report`"
    );
    expect(keyboardDoc).toContain("Public paid beta remains No-Go");

    expect(placeholderDoc).toContain(
      "P0 unsafe paid-access copy found in current runtime surfaces: `0`"
    );
    expect(placeholderDoc).toContain("Public paid beta: No-Go");
  });

  test("owner gate preserves real versus planned and fake progress boundaries", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );

    for (const phrase of [
      "Real now:",
      "Planned, not live:",
      "IELTS/GRE preview-only static content",
      "Full IELTS/GRE pack content and pack-specific review routes",
      "fake Mastered state",
      "fake pack progress",
      "not a paid-access grant"
    ]) {
      expect(doc, phrase).toContain(phrase);
    }

    expect(doc).not.toMatch(/full IELTS\/GRE content is live/i);
    expect(doc).not.toMatch(/IELTS\/GRE full pack available/i);
    expect(doc).not.toMatch(/fake mastery allowed/i);
    expect(doc).not.toMatch(/fake progress allowed/i);
  });

  test("no forbidden checkout billing payment routes remain absent", () => {
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

  test("no analytics SDK or tracking pixel dependencies exist", () => {
    expectNoDependencyFragments(forbiddenAnalyticsDependencyFragments);
  });
});
