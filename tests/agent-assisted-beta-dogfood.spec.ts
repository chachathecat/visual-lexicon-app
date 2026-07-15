import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  AGENT_ASSISTED_DOGFOOD_FINDINGS,
  AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT,
  AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT,
  AGENT_ASSISTED_DOGFOOD_VERDICT,
  AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD,
  VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION,
  getAgentAssistedPrivateBetaDogfood,
  getDogfoodComprehensionChecks,
  getDogfoodFindings,
  getDogfoodJourneyChecks,
  getDogfoodMonetizationChecks,
  getDogfoodPersonas,
  getDogfoodVerdict,
  getNextDogfoodPRSequence,
  getPublicBetaVerdict,
  getRealUserValidationStatus,
  type AgentAssistedDogfoodFinding,
  type AgentAssistedDogfoodJourneyCheck,
  type AgentAssistedPrivateBetaDogfood,
  type AgentAssistedPrivateBetaDogfoodVersion
} from "../src/lib/agent-assisted-beta-dogfood/agent-assisted-beta-dogfood";
import {
  AGENT_ASSISTED_DOGFOOD_DOC_LINK_TEXTS,
  AGENT_ASSISTED_DOGFOOD_FORBIDDEN_ACTUAL_PATHS,
  AGENT_ASSISTED_DOGFOOD_FORBIDDEN_DIRECT_DEPENDENCIES,
  AGENT_ASSISTED_DOGFOOD_FORBIDDEN_RAW_DATA_KEYS,
  AGENT_ASSISTED_DOGFOOD_FORBIDDEN_SECRET_VALUE_PATTERNS,
  AGENT_ASSISTED_DOGFOOD_MODULE_FILES,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_COMPREHENSION_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_FILES,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_SECTIONS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_FINDING_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_PATHS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_MONETIZATION_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_NUMBERS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_TITLES,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_P0_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_P1_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_P2_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_IDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_LABELS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_SAFETY_FIELDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_STORAGE_KEYS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_VALIDATION_COMMANDS,
  AGENT_ASSISTED_DOGFOOD_REQUIRED_VERDICTS,
  AGENT_ASSISTED_DOGFOOD_RUNTIME_SCAN_DIRS
} from "../src/lib/agent-assisted-beta-dogfood/fixtures";

const workspaceRoot = process.cwd();

type AgentAssistedDogfoodTypeSurface = {
  version: AgentAssistedPrivateBetaDogfoodVersion;
  report: AgentAssistedPrivateBetaDogfood;
  journey: AgentAssistedDogfoodJourneyCheck;
  finding: AgentAssistedDogfoodFinding;
};

const typeSmoke: AgentAssistedDogfoodTypeSurface = {
  version: VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION,
  report: AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD,
  journey: getDogfoodJourneyChecks()[0],
  finding: AGENT_ASSISTED_DOGFOOD_FINDINGS[0]
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), "utf8")) as TValue;
}

function readRootPackageDependencies(fileName: "package.json" | "package-lock.json") {
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
  const rootPackage = fileName === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return {
    ...(rootPackage?.dependencies ?? {}),
    ...(rootPackage?.devDependencies ?? {}),
    ...(rootPackage?.optionalDependencies ?? {}),
    ...(rootPackage?.peerDependencies ?? {})
  };
}

function collectFiles(relativeDir: string): string[] {
  const absoluteDir = join(workspaceRoot, relativeDir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);

    if (statSync(absolutePath).isDirectory()) {
      return collectFiles(relativePath);
    }

    return [relativePath];
  });
}

function collectObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      key,
      ...collectObjectKeys(child)
    ]);
  }

  return [];
}

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");

  let fetchAccessed = false;
  let windowAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get() {
      windowAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    }
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, "env", {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      }
    });
  }

  try {
    const value = callback();

    return {
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      },
      value
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("agent-assisted private beta dogfood", () => {
  test("exports the required typed dogfood report surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      report: {
        branch: "release/agent-assisted-private-beta-dogfood",
        pullRequest: "#92 Agent-assisted private beta dogfood report",
        reportDateKst: "2026-06-17",
        dogfoodVerdict: "Completed"
      },
      journey: {
        id: "public_entry_expectation",
        path: "/"
      },
      finding: {
        severity: "P0"
      }
    });
  });

  test("dogfood does not replace real user beta", () => {
    const report = getAgentAssistedPrivateBetaDogfood();

    expect(report.warning).toContain("does not replace real user beta");
    expect(report.warning).toContain("real user comprehension");
    expect(report.realUserValidationStatus).toBe("Not Started");
    expect(getRealUserValidationStatus()).toBe("Not Started");
    expect(report.zeroUserMetrics.realParticipantValidationStarted).toBe(false);
    expect(report.zeroUserMetrics.retentionClaimed).toBe(false);
    expect(report.zeroUserMetrics.paymentIntentClaimed).toBe(false);
    expect(report.zeroUserMetrics.realUserComprehensionClaimed).toBe(false);
    expect(report.zeroUserMetrics.privateBetaExecutionStarted).toBe(false);
  });

  test("current verdicts remain honest", () => {
    const report = getAgentAssistedPrivateBetaDogfood();

    expect(report.currentVerdicts).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_VERDICTS);
    expect(report.currentVerdicts.ownerControlledPrivateBeta).toBe(
      "Proceed / Conditional Manual Launch"
    );
    expect(report.currentVerdicts.publicPaidBeta).toBe("No-Go");
    expect(report.currentVerdicts.realParticipantValidation).toBe("Not Started");
    expect(report.currentVerdicts.agentAssistedDogfood).toBe("Completed");
    expect(getDogfoodVerdict()).toBe(AGENT_ASSISTED_DOGFOOD_VERDICT);
    expect(getPublicBetaVerdict()).toBe(AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT);
    expect(AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT).toBe(
      "Proceed / Conditional Manual Launch"
    );
  });

  test("invited, accepted, payment, and entitlement counts remain zero", () => {
    const metrics = getAgentAssistedPrivateBetaDogfood().zeroUserMetrics;

    expect(metrics.invitedParticipantCount).toBe(0);
    expect(metrics.acceptedParticipantCount).toBe(0);
    expect(metrics.paymentConfirmedCount).toBe(0);
    expect(metrics.manualEntitlementRecordedCount).toBe(0);
    expect(metrics.realInvitationsSent).toBe(false);
    expect(metrics.realUserValidationEvidence).toBe(
      "none - dogfood simulation only"
    );
  });

  test("required personas exist", () => {
    const personas = getDogfoodPersonas();

    expect(ids(personas)).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_IDS);
    expect(personas.map((persona) => persona.label)).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_LABELS
    ]);

    for (const persona of personas) {
      expect(persona.startingIntent.length).toBeGreaterThan(0);
      expect(persona.successSignalToValidateWithRealUsersLater).toContain("real");
      expect(persona.cannotClaimFromDogfood.length).toBeGreaterThan(0);
    }
  });

  test("required journeys exist", () => {
    const journeys = getDogfoodJourneyChecks();

    expect(ids(journeys)).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_IDS);
    expect(journeys.map((journey) => journey.path)).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_PATHS
    ]);
    expect(journeys[0].label).toBe("public entry expectation");

    for (const journey of journeys) {
      expect(journey.personaFit.length).toBeGreaterThan(0);
      expect(journey.expectedUserQuestion.length).toBeGreaterThan(0);
      expect(journey.learningLoopExpectation.length).toBeGreaterThan(0);
      expect(journey.evidenceBoundary).toMatch(/Agent|Dogfood|Static|Checklist/i);
      expect(journey.mustNotClaim.length).toBeGreaterThan(0);
    }

    expect(existsSync(join(workspaceRoot, "src", "app", "review", "weak-sprint", "page.tsx"))).toBe(true);
    expect(existsSync(join(workspaceRoot, "src", "app", "save", "page.tsx"))).toBe(true);
  });

  test("comprehension checks exist", () => {
    const checks = getDogfoodComprehensionChecks();

    expect(ids(checks)).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_COMPREHENSION_IDS);
    expect(checks.map((check) => check.question)).toEqual([
      "Does the primary CTA make sense?",
      "Does the user understand saved words become review cards?",
      "Does review feel like active recall?",
      "Does feedback explain memory-state consequences?",
      "Does Saved feel like a review queue?",
      "Do Packs feel like guided learning plans?",
      "Does Pricing sell outcomes rather than quotas?"
    ]);

    for (const check of checks) {
      expect(check.expectedAnswer.length).toBeGreaterThan(0);
      expect(check.realUserEvidenceRequiredLater).toBe(true);
    }
  });

  test("monetization checks exist and forbid fake checkout or fake paid access", () => {
    const checks = getDogfoodMonetizationChecks();

    expect(ids(checks)).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_MONETIZATION_IDS);
    expect(checks.map((check) => check.label)).toEqual([
      "Free value clarity",
      "Lite habit value clarity",
      "Pro exam/weak-word value clarity",
      "no-watermark/export as supporting value",
      "no fake checkout",
      "no fake paid access"
    ]);

    for (const check of checks) {
      expect(check.expectedOutcome.length).toBeGreaterThan(0);
      expect(check.noFakeCheckout).toBe(true);
      expect(check.noFakePaidAccess).toBe(true);
    }
  });

  test("storage and console smoke checklists are redacted and ready", () => {
    const report = getAgentAssistedPrivateBetaDogfood();

    expect(report.localStorageProbeChecklist.map((probe) => probe.key)).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_STORAGE_KEYS
    ]);

    for (const probe of report.localStorageProbeChecklist) {
      expect(probe.redactedOnly).toBe(true);
      expect(probe.rawValueCaptured).toBe(false);
      expect(probe.grantsPaidAccess).toBe(false);
      expect(probe.storesSecrets).toBe(false);
    }

    expect(report.consoleHydrationSmokeChecklist).toMatchObject({
      status: "Ready to Run",
      expectedConsoleErrorCount: 0,
      expectedHydrationWarningCount: 0,
      actualCountsRecorded: false
    });
  });

  test("no fake user metrics or raw data are present", () => {
    const report = getAgentAssistedPrivateBetaDogfood();
    const allKeys = collectObjectKeys(report);
    const serializedReport = JSON.stringify(report);

    expect(serializedReport).not.toContain("retentionConfirmed");
    expect(serializedReport).not.toContain("paymentIntentConfirmed");
    expect(serializedReport).not.toContain("realUserComprehensionConfirmed");
    expect(serializedReport).not.toMatch(/\b\d{13,19}\b/);

    for (const forbiddenKey of AGENT_ASSISTED_DOGFOOD_FORBIDDEN_RAW_DATA_KEYS) {
      expect(allKeys, forbiddenKey).not.toContain(forbiddenKey);
    }

    for (const patternText of AGENT_ASSISTED_DOGFOOD_FORBIDDEN_SECRET_VALUE_PATTERNS) {
      expect(serializedReport, patternText).not.toMatch(new RegExp(patternText, "i"));
    }
  });

  test("findings are classified into P0/P1/P2 buckets", () => {
    const findings = getDogfoodFindings();

    expect(ids(findings)).toEqual(AGENT_ASSISTED_DOGFOOD_REQUIRED_FINDING_IDS);
    expect(ids(findings.filter((finding) => finding.severity === "P0"))).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_P0_IDS
    ]);
    expect(ids(findings.filter((finding) => finding.severity === "P1"))).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_P1_IDS
    ]);
    expect(ids(findings.filter((finding) => finding.severity === "P2"))).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_P2_IDS
    ]);

    for (const finding of findings) {
      expect(finding.title.length).toBeGreaterThan(0);
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.recommendation.length).toBeGreaterThan(0);
    }
  });

  test("recommendation and next PR sequence are present", () => {
    const report = getAgentAssistedPrivateBetaDogfood();
    const sequence = getNextDogfoodPRSequence();

    expect(report.recommendation).toMatchObject({
      decision: "Proceed to real Batch 1 invite",
      recommendedNextPr: "#93 Owner-run invite batch 1 execution log"
    });
    expect(sequence.map((item) => item.prNumber)).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(sequence.map((item) => item.title)).toEqual([
      ...AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(sequence[0]).toMatchObject({
      prNumber: 93,
      title: "Owner-run invite batch 1 execution log",
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      productionDeploymentChangesAllowed: false
    });
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of AGENT_ASSISTED_DOGFOOD_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );
    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/account/sync/apply/route.ts",
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/hydrate/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of AGENT_ASSISTED_DOGFOOD_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not include ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }

    for (const scanDir of AGENT_ASSISTED_DOGFOOD_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");
        expect(fileText, relativePath).not.toContain("agent-assisted-beta-dogfood");
        expect(fileText, relativePath).not.toContain(
          "AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD"
        );
      }
    }
  });

  test("module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/
    ];

    for (const relativePath of AGENT_ASSISTED_DOGFOOD_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      dogfoodVerdict: getDogfoodVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      realUserValidationStatus: getRealUserValidationStatus(),
      personaIds: getDogfoodPersonas().map((persona) => persona.id),
      journeyPaths: getDogfoodJourneyChecks().map((journey) => journey.path),
      comprehensionIds: getDogfoodComprehensionChecks().map((check) => check.id),
      monetizationIds: getDogfoodMonetizationChecks().map((check) => check.id),
      findingIds: getDogfoodFindings().map((finding) => finding.id),
      nextPrNumbers: getNextDogfoodPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      dogfoodVerdict: "Completed",
      publicVerdict: "No-Go",
      realUserValidationStatus: "Not Started",
      personaIds: [...AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_IDS],
      journeyPaths: [...AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_PATHS],
      comprehensionIds: [
        ...AGENT_ASSISTED_DOGFOOD_REQUIRED_COMPREHENSION_IDS
      ],
      monetizationIds: [...AGENT_ASSISTED_DOGFOOD_REQUIRED_MONETIZATION_IDS],
      findingIds: [...AGENT_ASSISTED_DOGFOOD_REQUIRED_FINDING_IDS],
      nextPrNumbers: [...AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_NUMBERS]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and docs links exist", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "agent-assisted-beta-dogfood", "README.md"),
      "utf8"
    );

    for (const relativePath of AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    for (const linkText of AGENT_ASSISTED_DOGFOOD_DOC_LINK_TEXTS) {
      expect(readme).toContain(linkText);
    }

    for (const section of AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_SECTIONS) {
      expect(doc, `missing section ${section}`).toContain(section);
    }

    expect(doc).toContain("Owner-controlled private beta: **Proceed / Conditional Manual Launch**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Real participant validation: **Not Started**");
    expect(doc).toContain("Agent-assisted dogfood: **Completed**");
    expect(doc).toContain("invitedParticipantCount | `0`");
    expect(doc).toContain("acceptedParticipantCount | `0`");
    expect(doc).toContain("paymentConfirmedCount | `0`");
    expect(doc).toContain("manualEntitlementRecordedCount | `0`");
    expect(doc).toContain("#93 Owner-run invite batch 1 execution log");
    expect(moduleReadme).toContain("pure static TypeScript");
    expect(moduleReadme).toContain("does not replace real participant evidence");
  });

  test("validation commands are documented", () => {
    expect(AGENT_ASSISTED_DOGFOOD_REQUIRED_VALIDATION_COMMANDS).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1",
      "git diff --check"
    ]);
  });

  test("safety policy keeps scope strictly closed", () => {
    const safetyPolicy = getAgentAssistedPrivateBetaDogfood().safetyPolicy;

    expect(safetyPolicy.docsContractsTestsOnly).toBe(true);
    for (const field of AGENT_ASSISTED_DOGFOOD_REQUIRED_SAFETY_FIELDS) {
      expect(safetyPolicy[field], field).toBe(false);
    }
  });
});
