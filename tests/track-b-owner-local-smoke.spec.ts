import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const workspaceRoot = process.cwd();
const ownerSmokeDocPath = join(
  workspaceRoot,
  "docs",
  "TRACK_B_OWNER_LOCAL_SMOKE_AFTER_SIMPLIFICATION.md"
);

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(workspaceRoot, relativePath), "utf8");
}

test.describe("Track B owner local smoke after simplification record", () => {
  test("records the owner local smoke run and links it from README", () => {
    expect(existsSync(ownerSmokeDocPath)).toBe(true);

    const doc = readFileSync(ownerSmokeDocPath, "utf8");
    const readme = readWorkspaceFile("README.md");
    const docPath = "docs/TRACK_B_OWNER_LOCAL_SMOKE_AFTER_SIMPLIFICATION.md";

    expect(readme).toContain(docPath);
    expect(doc).toContain("Date of run | 2026-06-18");
    expect(doc).toContain("Local base URL used | `http://127.0.0.1:3007`");
    expect(doc).toContain("Save -> Review -> Memory state -> Return tomorrow");
    expect(doc).toContain(
      "Smoke result | Pass after `/save` copy and CTA labels were corrected in this PR."
    );
  });

  test("covers required routes, commands, localStorage keys, and smoke outcomes", () => {
    const doc = readFileSync(ownerSmokeDocPath, "utf8");

    for (const route of [
      "/save?slug=dissonance&source=word_page",
      "/review?mode=word&slug=dissonance&limit=5",
      "/dashboard",
      "/saved",
      "/pricing"
    ]) {
      expect(doc, route).toContain(route);
    }

    for (const command of [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/track-b-owner-local-smoke.spec.ts --workers=1",
      "npm.cmd run test -- tests/mvp-smoke.spec.ts tests/review-mode-routes.spec.ts tests/saved-library.spec.ts tests/paywall-surfaces.spec.ts tests/dashboard-v2.spec.ts --workers=1",
      "git diff --check"
    ]) {
      expect(doc, command).toContain(command);
    }

    for (const key of [
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1",
      "vlx_upgrade_interest_v1"
    ]) {
      expect(doc, key).toContain(key);
    }

    expect(doc).toContain("Passed after this PR's `/save` copy fix.");
    expect(doc).toContain("Passed after this PR's `/save` CTA fix.");
    expect(doc).toContain("Destination remains `/review?mode=word&slug=dissonance&limit=5`.");
    expect(doc).toContain("Destination remains `/dashboard`.");
    expect(doc).toContain("The original owner smoke blocker rendered:");
    expect(doc).toContain("`Start 5-card review`");
    expect(doc).toContain("`View dashboard`");
    expect(doc).toContain("This PR fixed that blocker");
  });

  test("keeps the safety boundary and final beta gate explicit", () => {
    const doc = readFileSync(ownerSmokeDocPath, "utf8");

    for (const safetySnippet of [
      "No real checkout",
      "No fake paid access",
      "No fake mastery",
      "No external participant validation claim",
      "No Webflow changes",
      "No Cloudflare Worker changes",
      "No Vercel settings, DNS, deployment settings, auth, payment, API route, route handler, middleware, secrets, env var, provider SDK, production data, or billing changes",
      "No AI feature added",
      "No `npm audit fix`"
    ]) {
      expect(doc, safetySnippet).toContain(safetySnippet);
    }

    expect(doc).toContain("| Public paid beta | No-Go |");
    expect(doc).toContain(
      "| Private beta | Owner-controlled/manual-only/conditional |"
    );
    expect(doc).toContain("| External participant validation | Not Started |");
    expect(doc).toContain("Public paid beta remains No-Go.");
  });
});
