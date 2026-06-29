import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const workspaceRoot = process.cwd();

function readRepoFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

const auditDocPath = "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md";
const sequenceDocPath = "docs/TRACK_B_UI_REBUILD_SEQUENCE.md";

const requiredAuditSections = [
  "## Executive Summary",
  "## Current Product Status",
  "## Route Inventory",
  "## Core Funnel Inventory",
  "## LocalStorage And State Inventory",
  "## Screen-By-Screen Audit",
  "## Placeholder And Planned Feature Inventory",
  "## P0 Issue List",
  "## P1 Issue List",
  "## P2 Issue List",
  "## Go / No-Go Recommendation",
  "## Private / Manual Beta Readiness",
  "## Public Paid Beta Readiness",
  "## Accessibility And Mobile Risk",
  "## Performance And Loading-State Risk",
  "## Analytics And Event Coverage",
  "## Recommended Next PR Sequence",
  "## Safety Confirmation"
] as const;

const requiredRoutes = [
  "/",
  "/dashboard",
  "/saved",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=alias_search",
  "/save?slug=dissonance&source=extension",
  "/review",
  "/review?mode=due",
  "/review?mode=weak",
  "/review/due",
  "/review/weak",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings",
  "/word/dissonance"
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

const rebuildSequence = [
  "Dashboard v2 - Today's Memory Mission",
  "Review Session v2 - focused memory loop",
  "Saved Library v2 - Due/Weak/New/Mastered queue",
  "Packs v2 - 30-day plan/product cards",
  "Pricing/Paywall v2 - outcome-based conversion",
  "Manual QA execution report",
  "Private beta gate"
] as const;

test.describe("Track B product/UI readiness docs", () => {
  test("audit doc covers required sections, routes, storage, and verdicts", () => {
    const auditDoc = readRepoFile(auditDocPath);

    for (const section of requiredAuditSections) {
      expect(auditDoc, section).toContain(section);
    }

    for (const route of requiredRoutes) {
      expect(auditDoc, route).toContain(route);
    }

    for (const key of requiredStorageKeys) {
      expect(auditDoc, key).toContain(key);
    }

    expect(auditDoc).toContain("Private paid beta: **Conditional / Manual-only**");
    expect(auditDoc).toContain("Public paid beta: **No-Go**");
    expect(auditDoc).toContain("Public paid beta remains No-Go");
    expect(auditDoc).toContain("No runtime UI changes");
  });

  test("audit doc preserves public paid beta blockers and forbidden-scope statements", () => {
    const auditDoc = readRepoFile(auditDocPath);
    const normalizedAuditDoc = auditDoc.replace(/\s+/g, " ");

    expect(auditDoc).toContain("No real checkout");
    expect(auditDoc).toContain("server-authoritative entitlements");
    expect(auditDoc).toContain("canonical monetization JSON");
    expect(auditDoc).toContain("support, refund/cancellation, privacy");
    expect(auditDoc).toContain("This audit PR does not implement FCT-070 or ACC-010.");
    expect(auditDoc).toContain("This audit PR does not enable auto-merge.");
    expect(auditDoc).toContain("This audit PR does not change roadmap statuses.");
    for (const forbiddenScope of [
      "payment",
      "billing",
      "account sync",
      "production deployment",
      "Webflow",
      "Cloudflare Worker",
      "R2 production object",
      "DNS",
      "secrets",
      "provider settings",
      "middleware",
      "production data changes"
    ] as const) {
      expect(normalizedAuditDoc, forbiddenScope).toContain(forbiddenScope);
    }
  });

  test("rebuild sequence doc keeps the requested order and non-goals explicit", () => {
    const sequenceDoc = readRepoFile(sequenceDocPath);
    let previousIndex = -1;

    for (const step of rebuildSequence) {
      const currentIndex = sequenceDoc.indexOf(step);

      expect(currentIndex, step).toBeGreaterThan(previousIndex);
      previousIndex = currentIndex;
    }

    expect(sequenceDoc).toContain("Save must create or preserve review state.");
    expect(sequenceDoc).toContain(
      "Review answers must create events and update review state and daily stats."
    );
    expect(sequenceDoc).toContain(
      "Due, Weak, and Mastered must come from real review state."
    );
    expect(sequenceDoc).toContain("Real payment, checkout, billing");
    expect(sequenceDoc).toContain("Real account sync");
    expect(sequenceDoc).toContain("FCT-070");
    expect(sequenceDoc).toContain("ACC-010");
  });

  test("README links both product/UI readiness docs", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain(auditDocPath);
    expect(readme).toContain(sequenceDocPath);
    expect(readme).toContain("[Track B Product/UI Readiness Audit]");
    expect(readme).toContain("[Track B UI Rebuild Sequence]");
  });
});
