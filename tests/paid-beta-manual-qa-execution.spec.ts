import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  PAID_BETA_MANUAL_QA_EXECUTION_BROWSER_SMOKE_SUMMARY,
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
  PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY,
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS,
  VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  getFindingsBySeverity,
  getManualQaRouteCheckByPath,
  getManualQaRouteChecks,
  getP0Blockers,
  getPaidBetaManualQaExecutionReport,
  getPrivateBetaVerdict,
  getPublicBetaVerdict,
  getRecommendedNextPr,
  type PaidBetaManualQaExecutionFinding,
  type PaidBetaManualQaExecutionReport,
  type PaidBetaManualQaExecutionRouteCheck,
  type PaidBetaManualQaExecutionRoutePath,
  type PaidBetaManualQaExecutionSeverity,
  type PaidBetaManualQaExecutionStatus,
  type PaidBetaManualQaExecutionVerdict,
  type PaidBetaManualQaExecutionVersion
} from "../src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";
import {
  PAID_BETA_MANUAL_QA_EXECUTION_DOC_FILES,
  PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS,
  PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_DIRECT_DEPENDENCIES,
  PAID_BETA_MANUAL_QA_EXECUTION_MODULE_FILES,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_DOC_SECTIONS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS,
  PAID_BETA_MANUAL_QA_EXECUTION_RUNTIME_SCAN_DIRS,
  PAID_BETA_MANUAL_QA_EXECUTION_SEVERITIES
} from "../src/lib/paid-beta-manual-qa-execution/fixtures";

const workspaceRoot = process.cwd();

type ManualQaExecutionTypeSurface = {
  version: PaidBetaManualQaExecutionVersion;
  report: PaidBetaManualQaExecutionReport;
  routePath: PaidBetaManualQaExecutionRoutePath;
  routeCheck: PaidBetaManualQaExecutionRouteCheck;
  severity: PaidBetaManualQaExecutionSeverity;
  status: PaidBetaManualQaExecutionStatus;
  verdict: PaidBetaManualQaExecutionVerdict;
  finding: PaidBetaManualQaExecutionFinding;
};

const typeSmoke: ManualQaExecutionTypeSurface = {
  version: VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  report: PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  routePath: PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES[0],
  routeCheck: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS[0],
  severity: PAID_BETA_MANUAL_QA_EXECUTION_SEVERITIES[0],
  status: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS[0].betaDisposition,
  verdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  finding: PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS[0]
};

function routePaths() {
  return PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS.map((route) => route.path);
}

function findingIdsBySeverity(severity: PaidBetaManualQaExecutionSeverity) {
  return getFindingsBySeverity(severity).map((finding) => finding.id);
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

function withNoRuntimeSurfaceAccess<TValue>(callback: () => TValue) {
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

test.describe("paid beta manual QA execution report", () => {
  test("exports the required typed execution report surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      report: {
        branch: "release/manual-qa-execution-report",
        pullRequest: "#79 Manual QA execution report",
        reportDateKst: "2026-06-15",
        northStarMetric: "Weekly Reviewed Words"
      },
      routePath: "/",
      severity: "P0",
      verdict: "conditional_manual_only_private_paid_beta"
    });
  });

  test("sets private beta to Conditional / Manual-only and public beta to No-Go", () => {
    expect(getPaidBetaManualQaExecutionReport()).toBe(
      PAID_BETA_MANUAL_QA_EXECUTION_REPORT
    );
    expect(getPrivateBetaVerdict()).toBe(
      "conditional_manual_only_private_paid_beta"
    );
    expect(getPublicBetaVerdict()).toBe("no_go_public_paid_beta");
    expect(PAID_BETA_MANUAL_QA_EXECUTION_REPORT).toMatchObject({
      privateBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
      publicBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
      privateBetaRecommendation: "Conditional / Manual-only",
      publicBetaRecommendation: "No-Go"
    });
  });

  test("covers every requested manual QA route", () => {
    expect(routePaths()).toEqual([
      ...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES
    ]);
    expect(getManualQaRouteChecks()).toBe(
      PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS
    );

    for (const route of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES) {
      const check = getManualQaRouteCheckByPath(route);

      expect(check, route).toBeDefined();
      expect(check).toMatchObject({
        routeExistsInRepo: true,
        betaDisposition: "conditional_manual_only"
      });
      expect(check?.expectedEvidence.length, route).toBeGreaterThan(0);
      expect(check?.mustNotFake.length, route).toBeGreaterThan(0);
    }
  });

  test("requested dynamic word routes exist in the repo", () => {
    expect(existsSync(join(workspaceRoot, "src/app/word/[slug]/page.tsx"))).toBe(
      true
    );
    const wordData = readFileSync(join(workspaceRoot, "src/lib/mock-data.ts"), "utf8");

    expect(wordData).toContain('slug: "dissonance"');
    expect(wordData).toContain('slug: "obfuscate"');
  });

  test("records tested environment, clean local port, and browser smoke target", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_REPORT.testedEnvironment).toEqual({
      localServerPortUsed: 3021,
      localBaseUrl: "http://127.0.0.1:3021",
      dataBoundary: "local browser storage only",
      productionDataUsed: false
    });
    expect(PAID_BETA_MANUAL_QA_EXECUTION_BROWSER_SMOKE_SUMMARY).toMatchObject({
      cleanPort: 3021,
      baseUrl: "http://127.0.0.1:3021",
      routesSelected: ["/dashboard", "/review", "/saved", "/packs", "/pricing"],
      status: "pass",
      routeLoadStatus: "pass",
      consoleErrorCount: 0,
      hydrationWarningCount: 0
    });
  });

  test("includes required validation commands", () => {
    expect(
      PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS.map((item) => item.command)
    ).toEqual([...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS]);

    for (const command of PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS) {
      expect(command.required).toBe(true);
    }
  });

  test("classifies required P0 P1 and P2 findings", () => {
    expect(findingIdsBySeverity("P0")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS
    );
    expect(findingIdsBySeverity("P1")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS
    );
    expect(findingIdsBySeverity("P2")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS
    );
    expect(getP0Blockers().map((finding) => finding.id)).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS
    );

    for (const findingId of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS) {
      expect(
        PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS.find(
          (finding) => finding.id === findingId
        ),
        findingId
      ).toMatchObject({
        severity: "P0",
        blocksPublicPaidBeta: true
      });
    }
  });

  test("includes required localStorage probes and grants no paid entitlement", () => {
    expect(
      PAID_BETA_MANUAL_QA_EXECUTION_REPORT.localStorageProbes.map(
        (probe) => probe.key
      )
    ).toEqual([...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS]);

    for (const probe of PAID_BETA_MANUAL_QA_EXECUTION_REPORT.localStorageProbes) {
      expect(probe.productionSourceOfTruth, probe.key).toBe(false);
      expect(probe.grantsPaidEntitlement, probe.key).toBe(false);
      expect(probe.mustNotContain.length, probe.key).toBeGreaterThan(0);
    }
  });

  test("keeps safety boundaries explicit and closed", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY.docsContractsTestsOnly).toBe(
      true
    );

    for (const field of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS) {
      expect(PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY[field], field).toBe(
        false
      );
    }
  });

  test("no forbidden runtime paths or route handlers are created", () => {
    for (const relativePath of PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      "src/app/api/me/entitlements/route.ts",
      "src/app/auth/confirm/route.ts"
    ]);
  });

  test("no forbidden provider SDKs, auth, database, payment, or logging dependencies are added", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("static execution module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\b/,
      /\bprocess\.env\b/,
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
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PAID_BETA_MANUAL_QA_EXECUTION_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the execution report", () => {
    for (const scanDir of PAID_BETA_MANUAL_QA_EXECUTION_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "paid-beta-manual-qa-execution"
        );
        expect(fileText, relativePath).not.toContain(
          "PAID_BETA_MANUAL_QA_EXECUTION"
        );
      }
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoRuntimeSurfaceAccess(() => ({
      privateVerdict: getPrivateBetaVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      p0Ids: getP0Blockers().map((finding) => finding.id),
      pricingDisposition: getManualQaRouteCheckByPath("/pricing")?.betaDisposition,
      nextPr: getRecommendedNextPr()
    }));

    expect(value).toMatchObject({
      privateVerdict: "conditional_manual_only_private_paid_beta",
      publicVerdict: "no_go_public_paid_beta",
      p0Ids: [...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS],
      pricingDisposition: "conditional_manual_only",
      nextPr: {
        prNumber: 80,
        title: "Private beta gate prep",
        docsContractsTestsOnly: true,
        realAccountSyncRecommended: false,
        realPaymentRecommended: false
      }
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and execution docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "paid-beta-manual-qa-execution",
        "README.md"
      ),
      "utf8"
    );

    expect(PAID_BETA_MANUAL_QA_EXECUTION_DOC_FILES).toEqual([
      "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md");

    for (const section of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    expect(doc).toContain("Private paid beta: **Conditional / Manual-only**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("Real payment/checkout is not implemented.");
    expect(doc).toContain("Production account sync is not implemented.");
    expect(doc).toContain("Recommended next PR: **#80 Private beta gate prep**");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser probes");
  });
});
