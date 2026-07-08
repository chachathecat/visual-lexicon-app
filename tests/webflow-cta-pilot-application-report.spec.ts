import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();

const reportPath = join(
  workspaceRoot,
  "docs",
  "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
);

const requiredSections = [
  "## Executive Summary",
  "## Why This Follows #184",
  "## Pilot Scope",
  "## Owner-Supplied Webflow Evidence Fields",
  "## Word Page CTA Evidence",
  "## Hub Page CTA Evidence",
  "## Before/After Href Inventory",
  "## Preview QA Checklist",
  "## Production Publish Status",
  "## App-Side Route QA Checklist",
  "## LocalStorage Evidence Checklist",
  "## Rollback Evidence Checklist",
  "## What Is Real Vs Planned",
  "## P0/P1/P2 Risk Summary",
  "## Safety Boundaries",
  "## Next Step Recommendation"
] as const;

const requiredPilotValues = [
  "Word page pilot:",
  "Dissonance",
  "Hub page pilot:",
  "Academic Vocabulary",
  "https://app.visuallexicon.org/save?slug=dissonance&source=word_page",
  "https://app.visuallexicon.org/review?mode=word&slug=dissonance&source=word_page",
  "https://app.visuallexicon.org/review?mode=hub&hub=academic-vocabulary&source=hub_page",
  "https://app.visuallexicon.org/packs/academic-vocabulary?source=hub_page"
] as const;

const requiredOwnerEvidenceFields = [
  "Webflow page URL",
  "Webflow preview URL if available",
  "CTA element name",
  "previous href",
  "new href",
  "before screenshot",
  "after screenshot",
  "publish status: not published / preview only / production published by owner",
  "rollback href",
  "QA timestamp",
  "owner initials or reviewer name"
] as const;

const requiredAppSideQaItems = [
  "Clear localStorage.",
  "Open `/save?slug=dissonance&source=word_page`.",
  "Confirm `vlx_saved_words_v1` contains dissonance.",
  "Confirm `vlx_review_state_v1` contains dissonance.",
  "Confirm no `vlx_review_events_v1` is created on save page load.",
  "Confirm no `vlx_daily_stats_v1` is created on save page load.",
  "Open `/review?mode=saved`.",
  "Open `/review?mode=due`.",
  "Open `/review?mode=word&slug=dissonance`.",
  "Open `/review?mode=hub&hub=academic-vocabulary&source=hub_page`.",
  "Open `/packs/academic-vocabulary?source=hub_page`."
] as const;

const requiredStorageEvidence = [
  "`vlx_saved_words_v1` exists.",
  "`vlx_saved_words_v1.dissonance.slug` is `dissonance`.",
  "`vlx_saved_words_v1.dissonance.word` is `Dissonance`.",
  "`vlx_saved_words_v1.dissonance.source` is `word_page` on first save.",
  "`vlx_review_state_v1` exists.",
  "`vlx_review_state_v1.dissonance.slug` is `dissonance`.",
  "`vlx_review_events_v1` is absent on save page load.",
  "`vlx_daily_stats_v1` is absent on save page load."
] as const;

const requiredSafetyAssertions = [
  "`docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.",
  "`docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md` exists.",
  "`docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.",
  "Public paid beta remains No-Go.",
  "Private/manual beta remains owner-gated candidate only.",
  "No Webflow production edit claim unless evidence is supplied.",
  "No private beta launch claim.",
  "No public paid beta unblock claim.",
  "No payment/checkout/billing route directories.",
  "No forbidden payment dependencies.",
  "No analytics SDK/tracking pixel dependencies."
] as const;

const requiredDependentDocs = [
  "docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md",
  "docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md",
  "docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
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

test.describe("Track A Webflow CTA pilot application report", () => {
  test("report doc exists and is linked from README", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(reportPath), reportPath).toBe(true);
    expect(readme).toContain(
      "docs/TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );
  });

  test("report includes required sections and pilot scope", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );

    for (const section of requiredSections) {
      expect(doc, section).toContain(section);
    }

    for (const pilotValue of requiredPilotValues) {
      expect(doc, pilotValue).toContain(pilotValue);
    }
  });

  test("report captures owner evidence placeholders and honest publish status", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );

    for (const evidenceField of requiredOwnerEvidenceFields) {
      expect(doc, evidenceField).toContain(evidenceField);
    }

    expect(doc).toContain("Pending owner evidence");
    expect(doc).toContain(
      "Owner evidence supplied in this handoff: none."
    );
    expect(doc).toContain("[PASTE OWNER EVIDENCE HERE]");
    expect(doc).toContain("If owner has not supplied Webflow screenshots/hrefs");
    expect(doc).toContain("This PR does not claim Webflow production was published.");
    expect(doc).toContain("This PR does not claim Track A production CTA is live.");
    expect(doc).toContain("Current production publish status: **Pending owner evidence**.");
    expect(doc).toContain(
      "Production may be marked `production published by owner` only when the owner"
    );
  });

  test("report includes app-side route QA and localStorage evidence checks", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );

    for (const qaItem of requiredAppSideQaItems) {
      expect(doc, qaItem).toContain(qaItem);
    }

    for (const storageItem of requiredStorageEvidence) {
      expect(doc, storageItem).toContain(storageItem);
    }
  });

  test("report preserves real versus planned and beta gate language", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );

    for (const phrase of [
      "Real now:",
      "Planned, not live:",
      "Owner-managed Webflow CTA application.",
      "Webflow evidence remains pending until the owner supplies screenshots",
      "Public paid beta remains No-Go.",
      "Private/manual beta remains owner-gated candidate only.",
      "Recommendation: keep public paid beta **No-Go**"
    ]) {
      expect(doc, phrase).toContain(phrase);
    }

    expect(doc).not.toMatch(forbiddenLaunchClaimPattern);
  });

  test("dependent docs exist and report preserves required safety assertions", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_CTA_PILOT_APPLICATION_REPORT.md"
    );

    for (const dependentDoc of requiredDependentDocs) {
      expect(existsSync(join(workspaceRoot, dependentDoc)), dependentDoc).toBe(
        true
      );
      expect(doc, dependentDoc).toContain(dependentDoc);
    }

    for (const assertion of requiredSafetyAssertions) {
      expect(doc, assertion).toContain(assertion);
    }

    expect(doc).toContain("Explicit safety confirmation for this report");
    expect(doc).toContain("no Webflow production edit by");
    expect(doc).toContain("Cloudflare Workers, auth, billing, payment");
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
