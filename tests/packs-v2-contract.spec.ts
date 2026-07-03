import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const workspaceRoot = process.cwd();
const contractPath = join(workspaceRoot, "docs", "PACKS_V2_CONTRACT.md");
const sequencePath = join(
  workspaceRoot,
  "docs",
  "PACKS_V2_IMPLEMENTATION_SEQUENCE.md"
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

test.describe("Packs v2 contract", () => {
  test("required product contract terms are explicit", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(squashWhitespace(contract));
    const requiredTerms = [
      "packs are learning plans, not a generic catalog",
      "academic vocabulary pack",
      "ielts writing pack",
      "gre verbal pack",
      "home/core demo pack",
      "free preview count",
      "pro/full-pack locked state",
      "honest placeholder copy",
      "vlx_pack_progress_v1",
      "preview review cta",
      "continue pack cta",
      "weak review from pack mistakes",
      "no fake pack progress",
      "no fake word counts",
      "no real payment"
    ];

    for (const term of requiredTerms) {
      expect(normalizedContract, term).toContain(term);
    }
  });

  test("canonical packs and placeholder copy are locked", () => {
    const contract = readFileSync(contractPath, "utf8");

    for (const packName of [
      "Academic Vocabulary pack",
      "IELTS Writing pack",
      "GRE Verbal pack",
      "Home/Core demo pack"
    ]) {
      expect(contract, packName).toContain(packName);
    }

    for (const placeholderCopy of [
      "Pack data is not available yet.",
      "Word count pending",
      "Free preview pending",
      "Progress cannot be computed until this pack has word data.",
      "Preview review is unavailable until preview words exist."
    ]) {
      expect(contract, placeholderCopy).toContain(placeholderCopy);
    }

    expect(contract).toContain(
      "Full pack access is planned for Pro. Payment is not connected in this beta."
    );
  });

  test("progress storage and CTA rules preserve real learning evidence", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(contract);
    const squashedContract = squashWhitespace(contract);

    for (const storageKey of [
      "vlx_pack_progress_v1",
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1"
    ]) {
      expect(contract, storageKey).toContain(storageKey);
    }

    for (const field of [
      "packId: string",
      "previewStartedAt?: string",
      "previewCompletedAt?: string",
      "reviewedCount: number",
      "correctCount: number",
      'source: "packs_page" | "pack_detail" | "review"'
    ]) {
      expect(contract, field).toContain(field);
    }

    expect(squashedContract).toContain(
      "Starting a preview may write `previewStartedAt` to `vlx_pack_progress_v1`, but must not write review state or review events until the learner answers in the review flow."
    );
    expect(squashedContract).toContain(
      "Continue pack CTA appears only from visible `vlx_pack_progress_v1` evidence."
    );
    expect(normalizedContract).toContain(
      "weak review must not select arbitrary saved words or random pack words"
    );
  });

  test("safety boundaries block fake access and forbidden integrations", () => {
    const contract = readFileSync(contractPath, "utf8");
    const sequence = readFileSync(sequencePath, "utf8");
    const combined = `${contract}\n${sequence}`;
    const normalizedCombined = normalize(combined);

    for (const requiredSafetyTerm of [
      "docs/tests only",
      "no runtime ui implementation",
      "no fake pack progress",
      "no fake word counts",
      "no real payment",
      "public paid beta remains blocked"
    ]) {
      expect(normalizedCombined, requiredSafetyTerm).toContain(
        requiredSafetyTerm
      );
    }

    for (const forbiddenSurface of [
      "Webflow",
      "Cloudflare Workers",
      "auth",
      "billing",
      "payment",
      "DNS",
      "deployment settings",
      "secrets",
      "production data",
      "real user data"
    ]) {
      expect(combined, forbiddenSurface).toContain(forbiddenSurface);
    }

    expect(normalizedCombined).toContain("checkout");
    expect(normalizedCombined).toContain("payment sdk");
    expect(normalizedCombined).toContain("no fake mastery");
  });

  test("required validation commands are documented exactly", () => {
    const sequence = readFileSync(sequencePath, "utf8");
    const packageJson = JSON.parse(readWorkspaceFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const requiredValidationCommands = [
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- tests/packs-v2-contract.spec.ts --workers=1"
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

  test("contract docs exist and README links them", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(contractPath)).toBe(true);
    expect(existsSync(sequencePath)).toBe(true);
    expect(readme).toContain("docs/PACKS_V2_CONTRACT.md");
    expect(readme).toContain("docs/PACKS_V2_IMPLEMENTATION_SEQUENCE.md");
  });
});
