import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const workspaceRoot = process.cwd();

const contractPath = join(
  workspaceRoot,
  "docs",
  "REVIEW_SESSION_V2_CONTRACT.md"
);
const sequencePath = join(
  workspaceRoot,
  "docs",
  "REVIEW_SESSION_V2_IMPLEMENTATION_SEQUENCE.md"
);

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

function normalize(text: string) {
  return text.toLowerCase();
}

function squashWhitespace(text: string) {
  return text.replace(/\s+/g, " ");
}

test.describe("Review Session v2 contract", () => {
  test("required contract terms are explicit", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(squashWhitespace(contract));
    const requiredTerms = [
      "one-card focus mode",
      "image_to_word",
      "definition_to_word",
      "saved review",
      "due review",
      "weak review",
      "responsems tracking",
      "correct/wrong event recording",
      "knew",
      "guessed",
      "forgot",
      "box update rules",
      "weakscore update rules",
      "nextdueat explanation",
      "session summary",
      "mobile ergonomics",
      "accessibility expectations"
    ];

    for (const term of requiredTerms) {
      expect(normalizedContract, term).toContain(term);
    }
  });

  test("required review storage keys are preserved without a competing session key", () => {
    const contract = readFileSync(contractPath, "utf8");
    const sequence = readFileSync(sequencePath, "utf8");
    const combined = `${contract}\n${sequence}`;
    const squashedContract = squashWhitespace(contract);

    for (const storageKey of [
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1"
    ]) {
      expect(combined, storageKey).toContain(storageKey);
    }

    expect(squashedContract).toContain(
      "must not invent a competing review, mastery, session, or SRS storage key"
    );
    expect(combined).not.toContain("vlx_review_session_v2");
    expect(combined).not.toContain("vlx_mastery_v2");
  });

  test("fake mastery random easy distractors and unsafe state inference stay blocked", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(contract);
    const squashedContract = squashWhitespace(contract);

    expect(normalizedContract).toContain("no fake mastery");
    expect(normalizedContract).toContain("no random easy distractors");
    expect(normalizedContract).toContain("missing/stale/unknown state fails safe");
    expect(squashedContract).toContain(
      "must never mark a word Mastered just because it was saved, viewed, answered once, or completed in a session"
    );
    expect(contract).toContain(
      "Box 5 / `Mastered` requires delayed recall evidence"
    );
    expect(contract).toContain(
      "The UI must not infer Due, Weak, Strong, or Mastered when evidence is absent"
    );
  });

  test("public paid beta remains blocked and forbidden surfaces stay out of scope", () => {
    const contract = readFileSync(contractPath, "utf8");
    const sequence = readFileSync(sequencePath, "utf8");
    const combined = `${contract}\n${sequence}`;

    expect(combined).toContain("public paid beta remains blocked");

    for (const forbiddenSurface of [
      "Webflow",
      "Cloudflare Workers",
      "auth",
      "billing",
      "payment",
      "DNS",
      "deployment",
      "secrets",
      "production data",
      "real user data"
    ]) {
      expect(combined, forbiddenSurface).toContain(forbiddenSurface);
    }
  });

  test("required validation commands are documented exactly", () => {
    const sequence = readFileSync(sequencePath, "utf8");
    const packageJson = JSON.parse(
      readWorkspaceFile("package.json")
    ) as { scripts: Record<string, string> };
    const requiredValidationCommands = [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/review-session-v2-contract.spec.ts --workers=1"
    ];

    for (const command of requiredValidationCommands) {
      expect(sequence, command).toContain(command);
    }

    expect(packageJson.scripts).toMatchObject({
      typecheck: "tsc --noEmit",
      lint: "next lint",
      build: "next build",
      test: "playwright test"
    });
  });

  test("implementation sequence keeps this PR docs and tests only", () => {
    const sequence = readFileSync(sequencePath, "utf8");
    const normalizedSequence = normalize(sequence);

    expect(normalizedSequence).toContain("docs/tests only");
    expect(sequence).toContain("must not rewrite the runtime review UI");
    expect(sequence).toContain("Do not change runtime behavior.");
  });

  test("README links the new contract docs", () => {
    const readme = readWorkspaceFile("README.md");

    expect(readme).toContain("docs/REVIEW_SESSION_V2_CONTRACT.md");
    expect(readme).toContain("docs/REVIEW_SESSION_V2_IMPLEMENTATION_SEQUENCE.md");
  });
});
