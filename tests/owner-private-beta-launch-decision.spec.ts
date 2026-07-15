import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  OWNER_PRIVATE_BETA_LAUNCH_DECISION,
  OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
  PUBLIC_BETA_LAUNCH_VERDICT,
  VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION,
  getOwnerPrivateBetaVerdict,
  getOwnerRunPrivateBetaLaunchDecision,
  getNoLaunchConditions,
  getPostLaunchReviewPlan,
  getPostLaunchReviewPlan as getPostLaunchReviewPlanAlias,
  getPrivateBetaFailureCriteria,
  getPrivateBetaSuccessMetrics,
  getPriorGateChecklist,
  getPublicBetaBlockers,
  getPublicBetaVerdict,
  getLaunchLimitations,
  getLaunchAllowedConditions,
  getNextOwnerLaunchPRSequence,
  type OwnerPrivateBetaLaunchDecision,
  type OwnerPrivateBetaReviewPlanItem
} from "../src/lib/owner-private-beta-launch-decision/owner-private-beta-launch-decision";
import {
  OWNER_PRIVATE_BETA_DOC_LINK_TEXTS,
  OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS,
  OWNER_PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES,
  OWNER_PRIVATE_BETA_MODULE_FILES,
  OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS,
  OWNER_PRIVATE_BETA_REQUIRED_LIMITATION_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS,
  OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES,
  OWNER_PRIVATE_BETA_REQUIRED_NO_LAUNCH_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_POST_LAUNCH_PLAN_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_PRIOR_GATE_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_PUBLIC_BETA_BLOCKER_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_LABELS,
  OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_NUMBERS,
  OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_FAILURE_CRITERIA_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_OWNER_SIGNOFF_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_READINESS_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_ISSUE_LOG_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_DRY_RUN_IDS,
  OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES,
  OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS,
  OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS,
  OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS,
  OWNER_PRIVATE_BETA_SAFETY_FIELDS
} from "../src/lib/owner-private-beta-launch-decision/fixtures";

const workspaceRoot = process.cwd();

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(readFileSync(join(workspaceRoot, relativePath), "utf8")) as TValue;
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

type OwnerPrivateBetaLaunchDecisionSurface = {
  version: number;
  decision: OwnerPrivateBetaLaunchDecision;
  priorGate: ReturnType<typeof getPriorGateChecklist>[number];
  nextPr: ReturnType<typeof getNextOwnerLaunchPRSequence>[number];
};

const typeSmoke: OwnerPrivateBetaLaunchDecisionSurface = {
  version: VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION,
  decision: OWNER_PRIVATE_BETA_LAUNCH_DECISION,
  priorGate: getPriorGateChecklist()[0],
  nextPr: getNextOwnerLaunchPRSequence()[0]
};

test.describe("owner private beta launch decision", () => {
  test("exports the required typed decision surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      decision: {
        branch: "release/owner-run-private-beta-launch-decision",
        pullRequest: "#90 Owner-run private beta launch decision",
        reportDateKst: "2026-06-17",
        ownerControlledPrivateBetaVerdict: "Proceed / Conditional Manual Launch",
        publicPaidBetaVerdict: "No-Go"
      }
    });
    expect(typeSmoke.nextPr.prNumber).toBe(91);
    expect(typeSmoke.nextPr.title).toBe("Owner-run private beta execution log");
    expect(typeSmoke.priorGate.prNumber).toBe(79);
  });

  test("owner-controlled verdict is proceed/manual and public paid verdict is no-go", () => {
    expect(getOwnerRunPrivateBetaLaunchDecision().requiredVerdicts.ownerControlledPrivateBeta).toBe(
      OWNER_PRIVATE_BETA_LAUNCH_VERDICT
    );
    expect(getOwnerRunPrivateBetaLaunchDecision().requiredVerdicts.publicPaidBeta).toBe(
      PUBLIC_BETA_LAUNCH_VERDICT
    );
    expect(getOwnerPrivateBetaVerdict()).toBe("Proceed / Conditional Manual Launch");
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.publicSignup).toBe("Blocked");
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.publicCheckout).toBe("Blocked");
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.automaticEntitlement).toBe("Blocked");
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.realAccountSync).toBe("Blocked");
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.productionDeploymentChanges).toBe(
      "Blocked"
    );
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.requiredVerdicts.ownerInvitation).toBe(
      "Allowed only after owner manually confirms checklist completion"
    );
  });

  test("prior gates include PR #79 through #89", () => {
    const sourceNumbers = getPriorGateChecklist().map((item) => item.prNumber);
    expect(sourceNumbers).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_NUMBERS]);
    expect(ids(getPriorGateChecklist())).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_PRIOR_GATE_IDS]);

    const labels = getPriorGateChecklist().map((item) => `#${item.prNumber}`);
    for (const expectedLabel of OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_LABELS) {
      expect(labels).toContain(expectedLabel);
    }

    for (const item of getPriorGateChecklist()) {
      expect(item.requiredBeforeInvites).toBe(true);
      expect(item.launchEvidence.length).toBeGreaterThan(0);
    }
  });

  test("participant cap and owner-invited-only policy exist", () => {
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.participantCap).toMatchObject({
      minimum: 5,
      maximum: 20,
      hardCapBeforeReapproval: 20,
      manualRosterRequired: true
    });

    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.ownerInvitedOnlyPolicy).toMatchObject({
      publicSignupAllowed: false,
      publicCheckoutAllowed: false,
      selfServeInvitesAllowed: false,
      ownerInvitesOnly: true,
      participantCap: "5 to 20"
    });
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.ownerInvitedOnlyPolicy.manualRosterRequired).toBe(true);
  });

  test("manual/payment-link-only policy exists", () => {
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.manualPaymentPolicy).toMatchObject({
      paymentMode: "manual-or-payment-link-only",
      requiresPaymentRequestOwnerControl: true
    });
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.manualPaymentPolicy.label).toContain("Manual");
  });

  test("no automatic entitlement policy exists", () => {
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.noAutomaticEntitlementPolicy).toMatchObject({
      automaticEntitlementAllowed: false,
      entitlementMutationAllowed: false
    });
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.noAutomaticEntitlementPolicy.label).toContain(
      "No automatic entitlement"
    );
  });

  test("local-state/account-sync limitation exists", () => {
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.localStateAccountSyncDisclosure).toMatchObject({
      localStateOnly: true,
      noRealAccountSync: true,
      redactedStorageEvidenceOnly: true
    });
    expect(OWNER_PRIVATE_BETA_LAUNCH_DECISION.localStateAccountSyncDisclosure.ownerEvidenceRequired).toContain(
      "vlx_saved_words_v1"
    );
  });

  test("support/refund/privacy confirmation exists", () => {
    expect(ids(OWNER_PRIVATE_BETA_LAUNCH_DECISION.supportRefundPrivacyReadiness)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_READINESS_IDS
    ]);
    for (const readiness of OWNER_PRIVATE_BETA_LAUNCH_DECISION.supportRefundPrivacyReadiness) {
      expect(readiness.requiredBeforeInvites).toBe(true);
      expect(readiness.ownerEvidenceRequired).toContain("owner");
    }
  });

  test("issue log, dry-run and owner signoff readiness exists", () => {
    expect(ids(OWNER_PRIVATE_BETA_LAUNCH_DECISION.issueLogReadiness)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_ISSUE_LOG_IDS
    ]);
    expect(ids(OWNER_PRIVATE_BETA_LAUNCH_DECISION.dryRunEvidenceReadiness)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_DRY_RUN_IDS
    ]);
    expect(ids(OWNER_PRIVATE_BETA_LAUNCH_DECISION.ownerFinalSignoffReadiness)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_OWNER_SIGNOFF_IDS
    ]);
  });

  test("success metrics include required signals and weekly reviewed words", () => {
    const successMetrics = getPrivateBetaSuccessMetrics();

    expect(successMetrics.map((metric) => metric.id)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS
    ]);
    const metricLabels = successMetrics.map((metric) => metric.label).join(" ");
    expect(metricLabels).toContain("Save success");
    expect(metricLabels).toContain("Review start");
    expect(metricLabels).toContain("Review completion");
    expect(metricLabels).toContain("Due review return");
    expect(metricLabels).toContain("Weak word understanding");
    expect(metricLabels).toContain("Pack preview engagement");
    expect(metricLabels).toContain("Pricing comprehension");
    expect(metricLabels).toContain("Issue count / severity");
    expect(metricLabels).toContain("Weekly Reviewed Words");
  });

  test("failure criteria include required blockers", () => {
    const failureCriteria = getPrivateBetaFailureCriteria();

    expect(failureCriteria.map((criterion) => criterion.id)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_FAILURE_CRITERIA_IDS
    ]);
    const failureLabels = failureCriteria.map((criterion) => criterion.label).join(" ");
    expect(failureLabels).toContain("Data loss");
    expect(failureLabels).toContain("Save/review loop broken");
    expect(failureLabels).toContain("Local-state confusion blocks learning");
    expect(failureLabels).toContain("Payment/entitlement misunderstanding");
    expect(failureLabels).toContain("Privacy/support issue");
    expect(failureLabels).toContain("Unresolved P0");
    expect(failureLabels).toContain("Repeated P1");
  });

  test("public beta blockers and no-launch conditions exist", () => {
    expect(ids(getPublicBetaBlockers())).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_PUBLIC_BETA_BLOCKER_IDS]);
    expect(ids(getNoLaunchConditions())).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_NO_LAUNCH_IDS]);

    for (const blocker of getPublicBetaBlockers()) {
      expect(blocker.status).toBe("Blocked");
      expect(blocker.requiredBeforePublicBeta.length).toBeGreaterThan(0);
    }

    for (const condition of getNoLaunchConditions()) {
      expect(condition.launchBlocked).toBe(true);
      expect(condition.requiredOwnerAction.length).toBeGreaterThan(0);
    }
  });

  test("launch and review limits include 24-hour and 7-day review plans", () => {
    const launchLimitations = getLaunchLimitations();
    const launchAllowed = getLaunchAllowedConditions();
    expect(ids(launchLimitations)).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_LIMITATION_IDS]);
    expect(launchAllowed.length).toBeGreaterThan(0);

    for (const condition of launchAllowed) {
      expect(condition.requiredBeforeInvites).toBe(true);
      expect(condition.ownerEvidenceRequired).toContain("");
    }

    const postLaunch = getPostLaunchReviewPlanAlias();
    expect(postLaunch.first24HourReview.map((item) => item.id)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS
    ]);
    expect(postLaunch.first7DayReview.map((item) => item.id)).toEqual([
      ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS
    ]);
    expect(
      [...postLaunch.first24HourReview, ...postLaunch.first7DayReview].map((item) => item.id)
    ).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_POST_LAUNCH_PLAN_IDS]);
  });

  test("recommended next-owner launch PR sequence is present", () => {
    const sequence = getNextOwnerLaunchPRSequence();

    expect(sequence.map((item) => item.prNumber)).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]);
    expect(sequence.map((item) => item.title)).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES]);
    expect(sequence[0]).toMatchObject({
      prNumber: 91,
      title: "Owner-run private beta execution log",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false
    });
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS) {
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

      for (const dependencyName of OWNER_PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not include ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
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

    for (const relativePath of OWNER_PRIVATE_BETA_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      verdict: getOwnerPrivateBetaVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      gates: getPriorGateChecklist().map((item) => item.prNumber),
      limitations: getLaunchLimitations().map((item) => item.id),
      noLaunch: getNoLaunchConditions().map((item) => item.id),
      postReview: getPostLaunchReviewPlan().first24HourReview.map((item) => item.id),
      blockers: getPublicBetaBlockers().map((item) => item.id),
      nextPrs: getNextOwnerLaunchPRSequence().map((item) => item.prNumber)
    }));

    expect(value.verdict).toBe("Proceed / Conditional Manual Launch");
    expect(value.publicVerdict).toBe("No-Go");
    expect(value.gates).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_NUMBERS]);
    expect(value.limitations).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_LIMITATION_IDS]);
    expect(value.noLaunch).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_NO_LAUNCH_IDS]);
    expect(value.postReview).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS]);
    expect(value.blockers).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_PUBLIC_BETA_BLOCKER_IDS]);
    expect(value.nextPrs).toEqual([...OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS]);
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
      join(workspaceRoot, "docs", "OWNER_RUN_PRIVATE_BETA_LAUNCH_DECISION.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "owner-private-beta-launch-decision", "README.md"),
      "utf8"
    );

    for (const relativePath of OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    for (const link of OWNER_PRIVATE_BETA_DOC_LINK_TEXTS) {
      expect(readme).toContain(link);
    }

    for (const section of OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS) {
      expect(doc, `missing section ${section}`).toContain(section);
    }

    expect(doc).toContain("Owner-controlled private beta: **Proceed / Conditional Manual Launch**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Weekly Reviewed Words");
    expect(moduleReadme).toContain("pure static TypeScript");
  });

  test("validation commands are documented", () => {
    expect(OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1",
      "git diff --check"
    ]);

    expect(OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS).toEqual(["src/app", "src/components"]);
  });

  test("safety policy keeps scope strictly closed", () => {
    const safetyPolicy = OWNER_PRIVATE_BETA_LAUNCH_DECISION.safetyPolicy;

    expect(safetyPolicy.docsContractsTestsOnly).toBe(true);
    for (const field of OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS) {
      expect(safetyPolicy[field], field).toBe(false);
    }
  });
});
