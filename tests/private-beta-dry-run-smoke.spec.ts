import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PRIVATE_BETA_DRY_RUN_SMOKE,
  PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE,
  PRIVATE_BETA_DRY_RUN_SMOKE_DECISION,
  PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS,
  PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
  PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY,
  VISUAL_LEXICON_PRIVATE_BETA_DRY_RUN_SMOKE_VERSION,
  getConsoleHydrationEvidence,
  getDryRunDecision,
  getDryRunFindings,
  getDryRunVerdict,
  getLocalStorageProbeEvidence,
  getNextDryRunPRSequence,
  getPrivateBetaDryRunSmokeEvidence,
  getPublicBetaVerdict,
  getRouteSmokeEvidence,
  type PrivateBetaDryRunSmokeFinding,
  type PrivateBetaDryRunSmokeRouteSmokeCheck,
  type PrivateBetaDryRunSmokeRoutePath,
  type PrivateBetaDryRunSmokeSafetyPolicy,
  type PrivateBetaDryRunSmokeStorageProbe,
  type PrivateBetaDryRunSmokeVersion
} from "../src/lib/private-beta-dry-run-smoke/private-beta-dry-run-smoke";
import {
  PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_FIXTURE,
  PRIVATE_BETA_DRY_RUN_SMOKE_DOC_FILES,
  PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_ACTUAL_PATHS,
  PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_DIRECT_DEPENDENCIES,
  PRIVATE_BETA_DRY_RUN_SMOKE_MODULE_FILES,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_DOC_SECTIONS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P0_IDS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P1_IDS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P2_IDS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_ROUTES,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_SAFETY_FIELDS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_STORAGE_KEYS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VALIDATION_COMMANDS,
  PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VERDICTS,
  PRIVATE_BETA_DRY_RUN_SMOKE_RUNTIME_SCAN_DIRS,
  PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_CHECK_FIXTURES,
  PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_PROBE_FIXTURES
} from "../src/lib/private-beta-dry-run-smoke/fixtures";

const workspaceRoot = process.cwd();

type PrivateBetaDryRunSmokeTypeSurface = {
  version: PrivateBetaDryRunSmokeVersion;
  evidence: typeof PRIVATE_BETA_DRY_RUN_SMOKE;
  routeCheck: PrivateBetaDryRunSmokeRouteSmokeCheck;
  storageProbe: PrivateBetaDryRunSmokeStorageProbe;
  finding: PrivateBetaDryRunSmokeFinding;
  decision: typeof PRIVATE_BETA_DRY_RUN_SMOKE_DECISION;
  verdict: typeof PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT;
  safetyPolicy: PrivateBetaDryRunSmokeSafetyPolicy;
};

const typeSmoke: PrivateBetaDryRunSmokeTypeSurface = {
  version: VISUAL_LEXICON_PRIVATE_BETA_DRY_RUN_SMOKE_VERSION,
  evidence: PRIVATE_BETA_DRY_RUN_SMOKE,
  routeCheck: PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_CHECK_FIXTURES[0],
  storageProbe: PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_PROBE_FIXTURES[0],
  finding: PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS[0],
  decision: PRIVATE_BETA_DRY_RUN_SMOKE_DECISION,
  verdict: PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  safetyPolicy: PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY
};

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

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
}

test.describe("private beta dry-run smoke evidence", () => {
  test("exports the required typed smoke surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      evidence: {
        branch: "release/private-beta-dry-run-smoke",
        pullRequest: "#89 Private beta dry-run smoke evidence",
        reportDateKst: "2026-06-16"
      },
      verdict: "Conditional / Manual-only",
      safetyPolicy: {
        docsContractsTestsOnly: true
      }
    });
  });

  test("verdicts are captured and owner invitations remain blocked", () => {
    const evidence = getPrivateBetaDryRunSmokeEvidence();

    expect(evidence.requiredVerdicts).toEqual(PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VERDICTS);
    expect(evidence.ownerControlledPrivateBetaVerdict).toBe("Conditional / Manual-only");
    expect(evidence.publicPaidBetaVerdict).toBe("No-Go");
    expect(getDryRunVerdict()).toBe(PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT);
    expect(getPublicBetaVerdict()).toBe(PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT);
    expect(evidence.requiredVerdicts.sendInvitations).toBe(
      "Blocked until #90 launch decision"
    );
  });

  test("verification commands and route smoke checklist include required routes", () => {
    expect(PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VALIDATION_COMMANDS).toEqual([
      "npm.cmd run typecheck",
      "npm.cmd run lint",
      "npm.cmd run build",
      "npm.cmd run test -- --workers=1",
      "git diff --check"
    ]);

    const routeSmokeChecks = getRouteSmokeEvidence();
    expect(routeSmokeChecks.map((item) => item.path)).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_ROUTES
    );
    expect(routeSmokeChecks).toEqual(PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_CHECK_FIXTURES);

    for (const routeCheck of routeSmokeChecks) {
      expect(routeCheck.routeExistsInRepo).toBe(true);
      expect(routeCheck.path).toBeTruthy();
      expect(routeCheck.smokeExpectation).toContain("Loads");
      expect(routeCheck.manualQaFocus.length).toBeGreaterThan(0);
      expect(routeCheck.evidence.length).toBeGreaterThan(0);
      expect(routeCheck.mustNotFake.length).toBeGreaterThan(0);
      expect(["pass", "manual_retest_required"]).toContain(routeCheck.disposition);
    }

    expect(["pass", "manual_retest_required"]).toContain(routeSmokeChecks[0].disposition);
    expect(existsSync(join(workspaceRoot, "src", "app", "word", "[slug]", "page.tsx"))).toBe(true);
  });

  test("localStorage probe checklist includes required keys", () => {
    const storageProbes = getLocalStorageProbeEvidence();
    expect(storageProbes.map((item) => item.key)).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_STORAGE_KEYS
    );
    expect(storageProbes).toEqual(PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_PROBE_FIXTURES);

    for (const probe of storageProbes) {
      expect(probe.expectedUse.length).toBeGreaterThan(0);
      expect(probe.qaCheck.length).toBeGreaterThan(0);
      expect(probe.productionSourceOfTruth).toBe(false);
      expect(probe.grantsPaidEntitlement).toBe(false);
      expect(probe.mustNotContain.length).toBeGreaterThan(0);
    }
  });

  test("console/hydration evidence exists", () => {
    const evidence = getConsoleHydrationEvidence();

    expect(evidence).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_FIXTURE[0]
    );
    expect(evidence).toEqual(PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE);
    expect(evidence.consoleErrorCount).toBeGreaterThanOrEqual(0);
    expect(evidence.hydrationWarningCount).toBeGreaterThanOrEqual(0);
    expect(["pass", "manual_retest_required"]).toContain(evidence.routeLoadStatus);
    expect(evidence.baseUrl).toBe("http://127.0.0.1:3030");
  });

  test("dry-run decision and next-pr sequence are present", () => {
    const decision = getDryRunDecision();

    expect(decision.ownerControlledPrivateBetaDecision).toBe("blocked");
    expect(decision.publicPaidBetaDecision).toBe("no_go");
    expect(decision.ownerControlledPrivateBetaVerdict).toBe("Conditional / Manual-only");
    expect(decision.publicPaidBetaVerdict).toBe("No-Go");
    expect(decision.requiredAction).toContain("PR #90");
    expect(getNextDryRunPRSequence()).toEqual([
      {
        prNumber: 90,
        title: "Owner-run private beta launch decision",
        docsContractsTestsOnlyRecommended: true,
        realCheckoutAllowed: false,
        automaticEntitlementAllowed: false,
        realAccountSyncAllowed: false,
        productionDeploymentChangesAllowed: false
      }
    ]);
  });

  test("findings are classified into P0/P1/P2 buckets", () => {
    const findings = getDryRunFindings();
    expect(ids(findings.filter((item) => item.severity === "P0"))).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P0_IDS
    );
    expect(ids(findings.filter((item) => item.severity === "P1"))).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P1_IDS
    );
    expect(ids(findings.filter((item) => item.severity === "P2"))).toEqual(
      PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P2_IDS
    );

    for (const finding of findings) {
      expect(finding.title).toBeTruthy();
      expect(finding.evidenceRequired).toBeTruthy();
      expect(finding.recommendedAction).toBeTruthy();
      expect(
        ["open", "future", "accepted_for_manual_private_beta"]
      ).toContain(finding.status);
    }
  });

  test("README and smoke evidence docs include required links and verdict text", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "private-beta-dry-run-smoke", "README.md"),
      "utf8"
    );

    for (const relativePath of PRIVATE_BETA_DRY_RUN_SMOKE_DOC_FILES) {
      expect(existsSync(join(workspaceRoot, relativePath))).toBe(true);
    }

    for (const section of PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_DOC_SECTIONS) {
      expect(doc).toContain(section);
    }

    expect(readme).toContain(
      "[Private Beta Dry-Run Smoke Evidence](docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md)"
    );
    expect(doc).toContain("Owner-controlled private beta: **Conditional / Manual-only**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Send invitations: **Blocked until #90 launch decision**");
    expect(doc).toContain("Public checkout: **Blocked**");
    expect(doc).toContain("Automatic entitlement: **Blocked**");
    expect(doc).toContain("Real account sync: **Blocked**");
    expect(doc).toContain("Production deployment changes: **Blocked**");
    expect(doc).toContain("Issue log readiness");
    expect(doc).toContain("Invite packet readiness");
    expect(doc).toContain("Support/refund/privacy readiness");
    expect(doc).toContain("Manual payment & no automatic entitlement confirmation");
    expect(doc).toContain("Account sync/local-state limitation confirmation");

    expect(moduleReadme).toContain("pure static TypeScript");
    expect(moduleReadme).toContain("state without executing the app at runtime");
  });

  test("forbidden integrations are not introduced", () => {
    for (const relativePath of PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath))).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );
    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/account/sync/digest/route.ts",
      "src/app/api/account/sync/preview/route.ts",
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);

    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not include ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }

    for (const scanDir of PRIVATE_BETA_DRY_RUN_SMOKE_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");
        expect(fileText, relativePath).not.toContain("private-beta-dry-run-smoke");
        expect(fileText, relativePath).not.toContain("PRIVATE_BETA_DRY_RUN_SMOKE");
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

    for (const relativePath of PRIVATE_BETA_DRY_RUN_SMOKE_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoExternalSideEffects(() => ({
      ownerVerdict: getDryRunVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      routePaths: getRouteSmokeEvidence().map((item) => item.path),
      storageKeys: getLocalStorageProbeEvidence().map((item) => item.key),
      findingIds: getDryRunFindings().map((item) => item.id),
      nextPrNumbers: getNextDryRunPRSequence().map((item) => item.prNumber)
    }));

    expect(value).toEqual({
      ownerVerdict: "Conditional / Manual-only",
      publicVerdict: "No-Go",
      routePaths: [...PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_ROUTES],
      storageKeys: [...PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_STORAGE_KEYS],
      findingIds: [
        ...PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P0_IDS,
        ...PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P1_IDS,
        ...PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P2_IDS
      ],
      nextPrNumbers: [90]
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("safety policy keeps scope strictly closed", () => {
    expect(PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY).toMatchObject({
      docsContractsTestsOnly: true,
      runtimeUiChangesAllowed: false,
      apiRoutesAllowed: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      productionDataMutationAllowed: false,
      webflowCloudflareVercelDnsChangesAllowed: false,
      deploymentChangesAllowed: false
    });

    for (const field of PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_SAFETY_FIELDS) {
      expect(PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY[field]).toBe(false);
    }
  });
});
