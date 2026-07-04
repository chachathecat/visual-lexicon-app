import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const workspaceRoot = process.cwd();
const auditPath = join(workspaceRoot, "docs", "BETA_READINESS_AUDIT.md");
const manualQaPath = join(workspaceRoot, "docs", "PAID_BETA_MANUAL_QA.md");

const requiredSurfaces = [
  "/dashboard",
  "/saved",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/save?slug=dissonance&source=word_page",
  "/word/dissonance"
] as const;

const requiredLocalStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const requiredAuditSections = [
  "## Route Inventory",
  "## LocalStorage Key Inventory",
  "## Manual QA Checklist",
  "## P0/P1/P2 Risk List",
  "## Private/Manual Beta Gate",
  "## Public Paid Beta No-Go",
  "## No-Real-Payment Safety Statement"
] as const;

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

function readJsonFile<TValue>(...segments: string[]) {
  return JSON.parse(readWorkspaceFile(...segments)) as TValue;
}

test.describe("Track B beta readiness audit docs", () => {
  test("requested audit and manual QA docs exist and are linked from README", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(auditPath)).toBe(true);
    expect(existsSync(manualQaPath)).toBe(true);
    expect(readme).toContain("docs/BETA_READINESS_AUDIT.md");
    expect(readme).toContain("docs/PAID_BETA_MANUAL_QA.md");
  });

  test("audit declares docs/tests-only scope after the merged v2 surfaces", () => {
    const audit = readFileSync(auditPath, "utf8");

    for (const phrase of [
      "Review v2",
      "Saved Library v2",
      "Packs v2",
      "Pricing / Paywall v2",
      "docs/tests-only",
      "does not implement runtime UI"
    ]) {
      expect(audit, phrase).toContain(phrase);
    }

    for (const forbiddenSurface of [
      "Webflow",
      "Cloudflare production Workers",
      "auth",
      "billing",
      "payment settings",
      "secrets",
      "production data",
      "deployment settings"
    ]) {
      expect(audit, forbiddenSurface).toContain(forbiddenSurface);
    }
  });

  test("audit includes the required sections, route inventory, and manual QA cross-link", () => {
    const audit = readFileSync(auditPath, "utf8");

    for (const section of requiredAuditSections) {
      expect(audit, section).toContain(section);
    }

    for (const surface of requiredSurfaces) {
      expect(audit, surface).toContain(surface);
    }

    expect(audit).toContain("Use `docs/PAID_BETA_MANUAL_QA.md`");
    expect(audit).toContain("owner-run manual QA");
    expect(audit).toContain("Any P0 finding blocks even a private/manual paid beta");
  });

  test("localStorage inventory keeps SRS keys canonical and auxiliary beta keys non-entitlement", () => {
    const audit = readFileSync(auditPath, "utf8");

    for (const key of requiredLocalStorageKeys) {
      expect(audit, key).toContain(key);
    }

    expect(audit).toContain("Auxiliary beta key; not an SRS/mastery key.");
    expect(audit).toContain("Not a subscription, receipt, or entitlement record.");
    expect(audit).toContain("Attribution only; never grants paid access.");
  });

  test("private/manual gate, public No-Go, and no-real-payment safety remain explicit", () => {
    const audit = readFileSync(auditPath, "utf8");

    expect(audit).toContain(
      "Private/manual paid beta gate: Conditional candidate only."
    );
    expect(audit).toContain("Public paid beta remains **No-Go**.");
    expect(audit).toContain(
      "No real payment is added, approved, or recommended by this audit."
    );
    expect(audit).toContain("Do not add");
    expect(audit).toContain("checkout routes");
    expect(audit).toContain("payment provider SDKs");
    expect(audit).toContain("real paid entitlements");
  });

  test("manual QA doc covers every requested surface and no-payment evidence", () => {
    const manualQa = readFileSync(manualQaPath, "utf8");

    expect(manualQa).toContain("## Required Surface Coverage");

    for (const surface of requiredSurfaces) {
      expect(manualQa, surface).toContain(surface);
    }

    for (const key of requiredLocalStorageKeys) {
      expect(manualQa, key).toContain(key);
    }

    expect(manualQa).toContain("/review/due");
    expect(manualQa).toContain("/review/weak");
    expect(manualQa).toContain("/packs");
    expect(manualQa).toContain("No checkout is opened");
    expect(manualQa.toLowerCase()).toContain("no real payment route");
    expect(manualQa).toContain("No real payment route or production payment behavior exists");
  });

  test("validation command contract includes the required focused audit run", () => {
    const packageJson = readJsonFile<{
      scripts: Record<string, string>;
    }>("package.json");
    const requiredCommands = [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/beta-readiness-audit.spec.ts --workers=1"
    ];
    const combinedDocs = [
      readFileSync(auditPath, "utf8"),
      readFileSync(manualQaPath, "utf8")
    ].join("\n");

    for (const command of requiredCommands) {
      expect(combinedDocs, command).toContain(command);
    }

    expect(packageJson.scripts).toMatchObject({
      typecheck: "tsc --noEmit",
      lint: "next lint",
      build: "next build",
      test: "playwright test"
    });
  });
});
