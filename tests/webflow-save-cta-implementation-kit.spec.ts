import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();

const implementationKitPath = join(
  workspaceRoot,
  "docs",
  "TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md"
);

const requiredSections = [
  "## Executive Summary",
  "## Why This Follows #182",
  "## Track A / Track B Responsibility Split",
  "## Exact Webflow CTA Href Templates",
  "## Word Page Save CTA Snippet",
  "## Word Page Recall/Quiz CTA Snippet",
  "## Hub Page Train Deck CTA Snippet",
  "## Pack CTA Snippet If Appropriate",
  "## Source Attribution Rules",
  "## Slug Parity Checklist",
  "## Manual Webflow Application Checklist",
  "## Manual QA Checklist",
  "## Rollback Checklist",
  "## What Is Real Vs Planned",
  "## P0/P1/P2 Risk Summary",
  "## Safety Boundaries",
  "## Future Implementation Plan"
] as const;

const requiredUrlTemplates = [
  "https://app.visuallexicon.org/save?slug={slug}&source=word_page",
  "https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page",
  "https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page",
  "https://app.visuallexicon.org/packs/{packId}?source=hub_page"
] as const;

const requiredSnippetFragments = [
  '<a href="https://app.visuallexicon.org/save?slug={slug}&source=word_page">',
  '<a href="https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page">',
  '<a href="https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page">',
  '<a href="https://app.visuallexicon.org/packs/{packId}?source=hub_page">',
  "Replace `{slug}`",
  "Replace `{hubSlug}`",
  "Replace `{packId}`",
  "This snippet is a template only. It is not proof that production Webflow has"
] as const;

const requiredManualQaItems = [
  "Pick one Webflow word page such as Dissonance.",
  "Confirm slug matches Track B app static/pack data.",
  "Click Save CTA.",
  "Confirm app route opens.",
  "Confirm `vlx_saved_words_v1` contains the slug.",
  "Confirm `vlx_review_state_v1` contains the slug.",
  "Confirm no fake `vlx_review_events_v1` is created on save page load.",
  "Confirm no fake `vlx_daily_stats_v1` is created on save page load.",
  "Open `/review?mode=saved` and confirm review can start.",
  "Open `/review?mode=due` and confirm due route works when due.",
  "Open `/review?mode=word&slug=dissonance` and confirm focused review works.",
  "Confirm Webflow production can be rolled back by restoring previous CTA"
] as const;

const requiredRollbackItems = [
  "Record previous CTA hrefs before changing Webflow.",
  "Keep a pre-publish screenshot.",
  "Publish only after preview QA.",
  "Restore previous CTA hrefs if app route fails.",
  "Verify no Webflow CMS item mass update happened unintentionally.",
  "Verify no DNS, Worker, payment, auth, or deployment setting changed."
] as const;

const requiredSafetyAssertions = [
  "`docs/TRACK_A_TO_B_SAVE_CTA_BRIDGE.md` exists.",
  "`docs/TRACK_B_PRIVATE_BETA_OWNER_GATE.md` exists.",
  "Public paid beta remains No-Go.",
  "Private/manual beta remains owner-gated candidate only.",
  "No Webflow production edit claim.",
  "No private beta launch claim.",
  "No public paid beta unblock claim.",
  "No payment/checkout/billing route directories.",
  "No forbidden payment dependencies.",
  "No analytics SDK/tracking pixel dependencies."
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

test.describe("Track A Webflow Save CTA implementation kit", () => {
  test("implementation kit doc exists and is linked from README", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(implementationKitPath), implementationKitPath).toBe(true);
    expect(readme).toContain(
      "docs/TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md"
    );
  });

  test("implementation kit includes required sections templates and snippets", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md"
    );

    for (const section of requiredSections) {
      expect(doc, section).toContain(section);
    }

    for (const urlTemplate of requiredUrlTemplates) {
      expect(doc, urlTemplate).toContain(urlTemplate);
    }

    for (const snippetFragment of requiredSnippetFragments) {
      expect(doc, snippetFragment).toContain(snippetFragment);
    }
  });

  test("implementation kit includes manual QA rollback source and slug rules", () => {
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md"
    );

    for (const item of requiredManualQaItems) {
      expect(doc, item).toContain(item);
    }

    for (const item of requiredRollbackItems) {
      expect(doc, item).toContain(item);
    }

    for (const phrase of [
      "`source` is an attribution label only.",
      "`source` is not an authorization signal.",
      "`source` does not grant paid access.",
      "Confirm the Webflow word slug matches a Track B app word slug.",
      "Confirm `{slug}` is lower-case and hyphenated.",
      "Confirm `{packId}` matches an existing Track B pack route"
    ]) {
      expect(doc, phrase).toContain(phrase);
    }
  });

  test("implementation kit preserves required safety assertions", () => {
    const bridgePath = join(
      workspaceRoot,
      "docs",
      "TRACK_A_TO_B_SAVE_CTA_BRIDGE.md"
    );
    const ownerGatePath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_PRIVATE_BETA_OWNER_GATE.md"
    );
    const doc = readWorkspaceFile(
      "docs",
      "TRACK_A_WEBFLOW_SAVE_CTA_IMPLEMENTATION_KIT.md"
    );

    expect(existsSync(bridgePath), bridgePath).toBe(true);
    expect(existsSync(ownerGatePath), ownerGatePath).toBe(true);

    for (const assertion of requiredSafetyAssertions) {
      expect(doc, assertion).toContain(assertion);
    }

    expect(doc).toContain("Public paid beta remains No-Go.");
    expect(doc).toContain(
      "Private/manual beta remains owner-gated candidate only."
    );
    expect(doc).toContain("No Webflow production edit claim.");
    expect(doc).toContain("No private beta launch claim.");
    expect(doc).toContain("No public paid beta unblock claim.");
    expect(doc).not.toMatch(forbiddenLaunchClaimPattern);
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
