import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

const RUNWAY_DOCS = [
  "docs/goals/track-b-private-paid-beta-runway.md",
  "docs/factory/track-b-goal-lanes.md",
  "docs/factory/track-b-owner-approval-gates.md"
];

const EXPECTED_LANES = [
  "Lane A: Factory / Owner Command Center",
  "Lane B: Core Learning UX",
  "Lane C: Revenue Surface",
  "Lane D: QA / Extension / Analytics"
];

const EXPECTED_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1"
];

const REQUIRED_BLOCKED_SURFACES = [
  "Webflow",
  "Cloudflare production Workers",
  "billing",
  "payment",
  "DNS",
  "deployment",
  "secrets",
  "production data",
  "real user data",
  "R2 production objects",
  "public paid beta",
  "private/manual beta",
  "auto-merge"
];

const REQUIRED_ALLOWED_SURFACES = [
  "Track B docs",
  "Track B tests",
  "safe mock/static data"
];

function readDoc(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function allDocsText() {
  return RUNWAY_DOCS.map(readDoc).join("\n\n");
}

test.describe("Track B goal runway docs", () => {
  test("required runway docs exist and are non-empty markdown", () => {
    for (const path of RUNWAY_DOCS) {
      const absolutePath = join(process.cwd(), path);
      const text = readDoc(path);

      expect(existsSync(absolutePath), path).toBe(true);
      expect(text, path).toMatch(/^# .+/);
      expect(text.length, path).toBeGreaterThan(1000);
    }
  });

  test("runway defines the North Star and product formula", () => {
    const text = allDocsText();

    expect(text).toContain("Weekly Reviewed Words");
    expect(text).toContain(
      "Save -> Review -> SRS state/events -> Due/Weak/Mastered -> Packs/Paywall -> Private beta"
    );
    expect(text).toContain(
      "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit"
    );
  });

  test("runway defines the four approved PR lanes", () => {
    const text = allDocsText();

    for (const lane of EXPECTED_LANES) {
      expect(text, lane).toContain(lane);
    }
  });

  test("runway defines P0, P1, and P2 risk levels and learning gates", () => {
    const text = allDocsText();

    expect(text).toContain("P0 Risk");
    expect(text).toContain("P1 Risk");
    expect(text).toContain("P2 Risk");
    expect(text).toContain("Save creates or preserves review state");
    expect(text).toContain("Review answers create events and update memory state");
    expect(text).toContain("Due, Weak, and Mastered");
    expect(text).toContain("fake mastery");
  });

  test("all docs define validation commands including the targeted contract test", () => {
    for (const path of RUNWAY_DOCS) {
      const text = readDoc(path);

      expect(text, path).toContain("## Validation Commands");

      for (const command of EXPECTED_COMMANDS) {
        expect(text, `${path} missing ${command}`).toContain(command);
      }
    }
  });

  test("allowed and blocked surfaces are explicit", () => {
    const text = allDocsText();

    expect(text).toContain("Allowed Vs Blocked Surfaces");

    for (const surface of REQUIRED_ALLOWED_SURFACES) {
      expect(text, `missing allowed surface ${surface}`).toContain(surface);
    }

    for (const surface of REQUIRED_BLOCKED_SURFACES) {
      expect(text, `missing blocked surface ${surface}`).toContain(surface);
    }
  });

  test("merge order and owner approval requirements are explicit", () => {
    for (const path of RUNWAY_DOCS) {
      const text = readDoc(path);

      expect(text, path).toContain("## Merge Order");
      expect(text, path).toContain("## Owner Approval Requirements");
      expect(text, path).toContain("Explicit owner approval");
    }
  });

  test("stop conditions block unsafe launch, payment, and fake-learning work", () => {
    const text = allDocsText();

    for (const path of RUNWAY_DOCS) {
      expect(readDoc(path), path).toContain("## Stop Conditions");
    }

    expect(text).toContain("validation fails");
    expect(text).toContain("runtime behavior changes without focused tests");
    expect(text).toContain("fake mastery");
    expect(text).toContain("charge users");
    expect(text).toContain("invite participants");
    expect(text).toContain("grant real entitlements");
  });

  test("runway does not authorize launch, real payment, or auto-merge", () => {
    const text = allDocsText();

    expect(text).toContain("does not launch private/manual beta");
    expect(text).toContain("does not unblock public paid beta");
    expect(text).toContain("does not add real payment");
    expect(text).toContain("real payment");
    expect(text).toContain("Do not auto-merge");
  });

  test("README links the canonical runway docs", () => {
    const readme = readDoc("README.md");

    for (const path of RUNWAY_DOCS) {
      expect(readme, `README missing ${path}`).toContain(path);
    }
  });
});
