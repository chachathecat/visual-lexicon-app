import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = process.cwd();
const contractPath = join(
  workspaceRoot,
  "docs",
  "PRICING_PAYWALL_V2_CONTRACT.md"
);
const sequencePath = join(
  workspaceRoot,
  "docs",
  "PRICING_PAYWALL_V2_IMPLEMENTATION_SEQUENCE.md"
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

test.describe("Pricing / Paywall v2 contract", () => {
  test("required plan positioning is explicit", () => {
    const contract = readFileSync(contractPath, "utf8");

    for (const requiredCopy of [
      "Free | Start remembering your first words.",
      "Lite | Build a daily visual memory habit.",
      "Pro | Fix weak words and prepare for exams.",
      "Exam Pack | Guided 30-day visual vocabulary plan.",
      "Exam Pack is a guided 30-day visual vocabulary plan",
    ]) {
      expect(contract, requiredCopy).toContain(requiredCopy);
    }
  });

  test("payment truth and beta interest rules are locked", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(squashWhitespace(contract));

    for (const requiredTerm of [
      "no real payment is connected yet",
      "upgrade actions are beta interest only",
      "upgrade interest capture is allowed only as beta interest / local evidence",
      "vlx_upgrade_interest_v1",
      "must not grant access",
      "no checkout, payment link, subscription, invoice, billing portal, payment sdk, webhook, paid plan grant, paid entitlement grant, or real payment provider integration",
    ]) {
      expect(normalizedContract, requiredTerm).toContain(requiredTerm);
    }

    for (const blockedClaim of [
      "do not say that a learner has paid access",
      "do not say that billing is connected",
      "do not say that a subscription is active",
      "do not say that a plan was purchased",
      "do not imply that exam pack can be bought inside the app",
    ]) {
      expect(normalizedContract, blockedClaim).toContain(blockedClaim);
    }
  });

  test("required paywall trigger IDs are defined", () => {
    const contract = readFileSync(contractPath, "utf8");
    const squashedContract = squashWhitespace(contract);
    const requiredTriggerIds = [
      "save_limit",
      "review_limit",
      "pack_preview_end",
      "weak_words_sprint_locked",
      "mastery_export_locked",
      "no_watermark_download",
      "mistake_explanation_locked",
    ];

    for (const triggerId of requiredTriggerIds) {
      expect(contract, triggerId).toContain(`\`${triggerId}\``);
    }

    expect(squashedContract).toContain(
      "Every trigger must include a safe `/pricing` comparison path or safe local beta interest capture."
    );
    expect(squashedContract).toContain(
      "Triggers must not write review events unless the learner answered in the review flow."
    );
  });

  test("evidence and beta gates prevent fake paid state", () => {
    const contract = readFileSync(contractPath, "utf8");
    const normalizedContract = normalize(contract);
    const squashedContract = squashWhitespace(contract);

    for (const storageKey of [
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1",
      "vlx_pack_progress_v1",
      "vlx_upgrade_interest_v1",
    ]) {
      expect(contract, storageKey).toContain(storageKey);
    }

    for (const gateTerm of [
      "Public paid beta remains blocked.",
      "Private/manual beta remains gated.",
      "account sync for saved words, review state, review events, and pack progress",
      "server-side SRS source of truth and entitlement enforcement",
      "approved payment provider decision and implementation",
      "support, privacy, data portability, rollback, accessibility, manual QA, and owner release approval",
    ]) {
      expect(squashedContract, gateTerm).toContain(gateTerm);
    }

    for (const fakeState of [
      "fake mastery",
      "fake weak state",
      "fake due state",
      "fake progress",
      "fake streak",
      "fake paid state",
      "fake exam pack access",
    ]) {
      expect(normalizedContract, fakeState).toContain(fakeState);
    }
  });

  test("safety boundaries block forbidden surfaces", () => {
    const contract = readFileSync(contractPath, "utf8");
    const sequence = readFileSync(sequencePath, "utf8");
    const combined = `${contract}\n${sequence}`;
    const normalizedCombined = normalize(combined);

    for (const requiredSafetyTerm of [
      "docs/tests only",
      "no runtime ui implementation",
      "no real payment",
      "no checkout route",
      "no payment sdk",
      "no billing route",
      "public paid beta remains blocked",
      "private/manual beta remains gated",
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
      "real user data",
    ]) {
      expect(combined, forbiddenSurface).toContain(forbiddenSurface);
    }
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
      "npm.cmd run test -- tests/pricing-paywall-v2-contract.spec.ts --workers=1",
    ];

    for (const command of requiredValidationCommands) {
      expect(sequence, command).toContain(command);
    }

    expect(packageJson.scripts).toMatchObject({
      typecheck: "tsc --noEmit",
      lint: "next lint",
      build: "next build",
      test: "playwright test",
    });
  });

  test("contract docs exist and README links them", () => {
    const readme = readWorkspaceFile("README.md");

    expect(existsSync(contractPath)).toBe(true);
    expect(existsSync(sequencePath)).toBe(true);
    expect(readme).toContain("docs/PRICING_PAYWALL_V2_CONTRACT.md");
    expect(readme).toContain(
      "docs/PRICING_PAYWALL_V2_IMPLEMENTATION_SEQUENCE.md"
    );
  });

  test("repository still has no payment SDK or checkout/billing route", () => {
    const packageJson = JSON.parse(readWorkspaceFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });

    for (const dependencyName of dependencyNames) {
      expect(dependencyName.toLowerCase()).not.toMatch(
        /stripe|paddle|portone|lemonsqueezy|lemon-squeezy/
      );
    }

    for (const routePath of [
      "src/app/payment",
      "src/app/payments",
      "src/app/billing",
      "src/app/checkout",
      "src/app/api/payment",
      "src/app/api/payments",
      "src/app/api/billing",
      "src/app/api/checkout",
    ]) {
      expect(existsSync(join(workspaceRoot, routePath))).toBe(false);
    }
  });
});
