import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_READINESS_RERUN,
  PRIVATE_BETA_READINESS_RERUN_OWNER_PRIVATE_VERDICT,
  PRIVATE_BETA_READINESS_RERUN_PUBLIC_VERDICT,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS,
  PRIVATE_BETA_READINESS_RERUN_SAFETY_POLICY,
  VISUAL_LEXICON_PRIVATE_BETA_READINESS_RERUN_VERSION,
  getAccountSyncLimitationChecklist,
  getIncidentRollbackChecklist,
  getLaunchDecisionTable,
  getManualQaEvidenceChecklist,
  getMonitoringSupportPrivacyChecklist,
  getNextPrivateBetaReadinessPRSequence,
  getOwnerControlledPrivateBetaVerdict,
  getOwnerLaunchChecklist,
  getPaymentEntitlementChecklist,
  getPrivateBetaAllowedConditions,
  getPrivateBetaBlockedConditions,
  getPrivateBetaReadinessRerun,
  getPublicBetaP0Blockers,
  getPublicBetaVerdict,
  getReadinessGateMatrix,
  type PrivateBetaReadinessBlocker,
  type PrivateBetaReadinessChecklistItem,
  type PrivateBetaReadinessCondition,
  type PrivateBetaReadinessDecisionTableRow,
  type PrivateBetaReadinessGateMatrixRow,
  type PrivateBetaReadinessNextPr,
  type PrivateBetaReadinessPublicBlocker,
  type PrivateBetaReadinessRerun,
  type PrivateBetaReadinessRerunSeverity,
  type PrivateBetaReadinessRerunSourcePr,
  type PrivateBetaReadinessRerunVerdict,
  type PrivateBetaReadinessRerunVersion
} from "../src/lib/private-beta-readiness-rerun/private-beta-readiness-rerun";
import {
  PRIVATE_BETA_READINESS_RERUN_DOC_FILES,
  PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_READINESS_RERUN_MODULE_FILES,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_ACCOUNT_SYNC_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_ALLOWED_CONDITION_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_BLOCKED_CONDITION_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_INCIDENT_ROLLBACK_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_MANUAL_QA_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_MONITORING_SUPPORT_PRIVACY_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_NUMBERS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_TITLES,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_OWNER_CHECKLIST_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_PAYMENT_ENTITLEMENT_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_PUBLIC_P0_IDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_LABELS,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_NUMBERS,
  PRIVATE_BETA_READINESS_RERUN_RUNTIME_SCAN_DIRS,
  PRIVATE_BETA_READINESS_RERUN_SEVERITIES
} from "../src/lib/private-beta-readiness-rerun/fixtures";

const workspaceRoot = process.cwd();

type ReadinessRerunTypeSurface = {
  version: PrivateBetaReadinessRerunVersion;
  report: PrivateBetaReadinessRerun;
  verdict: PrivateBetaReadinessRerunVerdict;
  sourcePr: PrivateBetaReadinessRerunSourcePr;
  gateRow: PrivateBetaReadinessGateMatrixRow;
  condition: PrivateBetaReadinessCondition;
  blocker: PrivateBetaReadinessBlocker;
  publicBlocker: PrivateBetaReadinessPublicBlocker;
  checklistItem: PrivateBetaReadinessChecklistItem;
  decision: PrivateBetaReadinessDecisionTableRow;
  nextPr: PrivateBetaReadinessNextPr;
  severity: PrivateBetaReadinessRerunSeverity;
};

const typeSmoke: ReadinessRerunTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_READINESS_RERUN_VERSION,
  report: PRIVATE_BETA_READINESS_RERUN,
  verdict: PRIVATE_BETA_READINESS_RERUN_OWNER_PRIVATE_VERDICT,
  sourcePr: PRIVATE_BETA_READINESS_RERUN.consolidatedSourcePrs[0],
  gateRow: PRIVATE_BETA_READINESS_RERUN.gateMatrix[0],
  condition: PRIVATE_BETA_READINESS_RERUN.privateBetaAllowedConditions[0],
  blocker: PRIVATE_BETA_READINESS_RERUN.privateBetaBlockedConditions[0],
  publicBlocker: PRIVATE_BETA_READINESS_RERUN.publicBetaP0Blockers[0],
  checklistItem: PRIVATE_BETA_READINESS_RERUN.ownerApprovalChecklist[0],
  decision: PRIVATE_BETA_READINESS_RERUN.launchDecisionTable[0],
  nextPr: PRIVATE_BETA_READINESS_RERUN.nextPrivateBetaReadinessPrSequence[0],
  severity: PRIVATE_BETA_READINESS_RERUN_SEVERITIES[0]
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), "utf8")
  ) as TValue;
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
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
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

function withNoExternalSideEffects<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "env"
  );
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
      value,
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      }
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

test.describe("private beta readiness rerun", () => {
  test("exports the required typed readiness rerun surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      report: {
        branch: "release/private-beta-readiness-rerun",
        pullRequest: "#84 Private beta readiness rerun",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      sourcePr: {
        prNumber: 79
      },
      severity: "P0"
    });
  });

  test("sets private beta verdict to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPrivateBetaReadinessRerun()).toBe(PRIVATE_BETA_READINESS_RERUN);
    expect(getOwnerControlledPrivateBetaVerdict()).toBe(
      "Conditional / Manual-only"
    );
    expect(getPublicBetaVerdict()).toBe("No-Go");
    expect(PRIVATE_BETA_READINESS_RERUN_PUBLIC_VERDICT).toBe("No-Go");
    expect(PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS).toEqual({
      ownerControlledPrivateBeta: "Conditional / Manual-only",
      publicPaidBeta: "No-Go",
      realCheckout: "Blocked",
      automaticEntitlement: "Blocked",
      realAccountSync: "Blocked",
      monitoringSdkIntegration: "Blocked in current phase",
      ownerRunInviteOnlyBeta: "Allowed only if checklist is complete"
    });
  });

  test("gate matrix includes PRs #79 #80 #81 #82 and #83", () => {
    expect(
      PRIVATE_BETA_READINESS_RERUN.consolidatedSourcePrs.map(
        (item) => item.prNumber
      )
    ).toEqual([...PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_NUMBERS]);
    expect(getReadinessGateMatrix().map((item) => item.sourcePr)).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_LABELS
    ]);

    for (const row of getReadinessGateMatrix()) {
      expect(row.evidenceRequired.length, row.id).toBeGreaterThan(0);
      expect(row.ownerDecision.length, row.id).toBeGreaterThan(0);
    }
  });

  test("allowed private beta conditions exist and are required before invites", () => {
    expect(ids(getPrivateBetaAllowedConditions())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_ALLOWED_CONDITION_IDS
    ]);

    for (const condition of getPrivateBetaAllowedConditions()) {
      expect(condition.requiredBeforeInvites, condition.id).toBe(true);
      expect(condition.evidenceRequired.length, condition.id).toBeGreaterThan(0);
    }
  });

  test("blocked private beta conditions exist", () => {
    expect(ids(getPrivateBetaBlockedConditions())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_BLOCKED_CONDITION_IDS
    ]);

    for (const condition of getPrivateBetaBlockedConditions()) {
      expect(condition.blocksOwnerControlledPrivateBeta, condition.id).toBe(true);
      expect(condition.ownerCanAcceptForManualPrivateBeta, condition.id).toBe(false);
    }
  });

  test("public beta P0 blockers exist", () => {
    expect(ids(getPublicBetaP0Blockers())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_PUBLIC_P0_IDS
    ]);

    for (const blocker of getPublicBetaP0Blockers()) {
      expect(blocker.severity, blocker.id).toBe("P0");
      expect(blocker.reasonPublicPaidBetaNoGo.length, blocker.id).toBeGreaterThan(
        0
      );
    }
  });

  test("owner checklist exists", () => {
    expect(ids(getOwnerLaunchChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_OWNER_CHECKLIST_IDS
    ]);

    for (const item of getOwnerLaunchChecklist()) {
      expect(item.requiredBeforeInvites, item.id).toBe(true);
      expect(item.evidenceRequired.length, item.id).toBeGreaterThan(0);
    }
  });

  test("manual QA evidence checklist exists", () => {
    expect(ids(getManualQaEvidenceChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_MANUAL_QA_IDS
    ]);
  });

  test("payment and entitlement checklist exists", () => {
    expect(ids(getPaymentEntitlementChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_PAYMENT_ENTITLEMENT_IDS
    ]);
    expect(getPaymentEntitlementChecklist().map((item) => item.label).join(" ")).toContain(
      "no automatic entitlement"
    );
  });

  test("account sync limitation checklist exists", () => {
    expect(ids(getAccountSyncLimitationChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_ACCOUNT_SYNC_IDS
    ]);
    expect(getAccountSyncLimitationChecklist().map((item) => item.label).join(" ")).toContain(
      "Real account sync remains blocked"
    );
  });

  test("monitoring support privacy checklist exists", () => {
    expect(ids(getMonitoringSupportPrivacyChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_MONITORING_SUPPORT_PRIVACY_IDS
    ]);
    expect(
      getMonitoringSupportPrivacyChecklist().map((item) => item.label).join(" ")
    ).toContain("Monitoring SDK integration is blocked");
  });

  test("rollback and incident checklist exists", () => {
    expect(ids(getIncidentRollbackChecklist())).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_INCIDENT_ROLLBACK_IDS
    ]);
    expect(getIncidentRollbackChecklist().length).toBeGreaterThanOrEqual(5);
  });

  test("launch decision table and next PR sequence exist", () => {
    expect(getLaunchDecisionTable().map((item) => item.decision)).toEqual([
      "launch_owner_private_beta",
      "do_not_launch",
      "do_not_launch",
      "pause_or_rollback"
    ]);
    expect(getNextPrivateBetaReadinessPRSequence().map((item) => item.prNumber)).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextPrivateBetaReadinessPRSequence().map((item) => item.title)).toEqual([
      ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_TITLES
    ]);
    expect(getNextPrivateBetaReadinessPRSequence()[0]).toMatchObject({
      prNumber: 85,
      title: "Owner-run private beta launch checklist",
      docsContractsTestsOnlyRecommended: true,
      realCheckoutAllowed: false,
      automaticEntitlementAllowed: false,
      realAccountSyncAllowed: false,
      monitoringSdkAllowed: false
    });
  });

  test("safety policy keeps docs contracts tests scope closed", () => {
    expect(PRIVATE_BETA_READINESS_RERUN_SAFETY_POLICY.docsContractsTestsOnly).toBe(
      true
    );

    for (const field of PRIVATE_BETA_READINESS_RERUN_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_READINESS_RERUN_SAFETY_POLICY[field], field).toBe(
        false
      );
    }
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("readiness rerun module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\.localStorage\b/,
      /\blocalStorage\.getItem\b/,
      /\blocalStorage\.setItem\b/,
      /\bprocess\.env\b/,
      /from ["']@sentry\//,
      /from ["']posthog-js/,
      /from ["']@datadog\//,
      /from ["']newrelic/,
      /from ["']winston/,
      /from ["']pino/,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']pg/,
      /from ["']postgres/,
      /from ["']mysql/,
      /from ["']sqlite/,
      /from ["']@cloudflare\/d1/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']openai/,
      /from ["']@ai-sdk\/openai/,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PRIVATE_BETA_READINESS_RERUN_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the readiness rerun", () => {
    for (const scanDir of PRIVATE_BETA_READINESS_RERUN_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "private-beta-readiness-rerun"
        );
        expect(fileText, relativePath).not.toContain(
          "PRIVATE_BETA_READINESS_RERUN"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      privateVerdict: getOwnerControlledPrivateBetaVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      gateSources: getReadinessGateMatrix().map((item) => item.sourcePr),
      allowedIds: ids(getPrivateBetaAllowedConditions()),
      blockedIds: ids(getPrivateBetaBlockedConditions()),
      p0Ids: ids(getPublicBetaP0Blockers()),
      nextPrNumbers: getNextPrivateBetaReadinessPRSequence().map(
        (item) => item.prNumber
      )
    }));

    expect(value).toEqual({
      privateVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      gateSources: [...PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_LABELS],
      allowedIds: [
        ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_ALLOWED_CONDITION_IDS
      ],
      blockedIds: [
        ...PRIVATE_BETA_READINESS_RERUN_REQUIRED_BLOCKED_CONDITION_IDS
      ],
      p0Ids: [...PRIVATE_BETA_READINESS_RERUN_REQUIRED_PUBLIC_P0_IDS],
      nextPrNumbers: [...PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_NUMBERS]
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
      join(workspaceRoot, "docs", "PRIVATE_BETA_READINESS_RERUN.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "private-beta-readiness-rerun",
        "README.md"
      ),
      "utf8"
    );

    for (const relativePath of PRIVATE_BETA_READINESS_RERUN_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(true);
    }

    expect(readme).toContain(
      "[Private Beta Readiness Rerun](docs/PRIVATE_BETA_READINESS_RERUN.md)"
    );

    for (const section of PRIVATE_BETA_READINESS_RERUN_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("Owner-controlled private beta: **Conditional / Manual-only**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Real checkout: **Blocked**");
    expect(doc).toContain("Automatic entitlement: **Blocked**");
    expect(doc).toContain("Real account sync: **Blocked**");
    expect(doc).toContain("Monitoring SDK integration: **Blocked in current phase**");
    expect(doc).toContain(
      "Recommended next PR: **#85 Owner-run private beta launch checklist**"
    );
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser");
  });
});
