import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  TRACK_B_PRODUCT_UI_FINDING_COUNTS,
  TRACK_B_PRODUCT_UI_READINESS_AUDIT,
  TRACK_B_PRODUCT_UI_READINESS_VERSION,
  TRACK_B_PRODUCT_UI_SAFETY_POLICY,
  TRACK_B_PRODUCT_UI_SOURCE_METADATA,
  getConfirmedFindingsBySeverity,
  getFindingById,
  getFindingsBySeverity,
  getP0Blockers,
  getRouteAuditByPath,
  getSafetyBoundaryById,
  getSuspectedFindingsBySeverity,
  getTrackBProductUiAudit,
  type TrackBProductUiAudience,
  type TrackBProductUiFinding,
  type TrackBProductUiFindingStatus,
  type TrackBProductUiReadinessAudit,
  type TrackBProductUiReadinessVersion,
  type TrackBProductUiRouteAudit,
  type TrackBProductUiRoutePath,
  type TrackBProductUiSeverity,
  type TrackBProductUiSourceMetadata,
  type TrackBProductUiVerdict
} from "../src/lib/product-ui-readiness/product-ui-readiness-audit";
import {
  TRACK_B_PRODUCT_UI_DOC_FILES,
  TRACK_B_PRODUCT_UI_EXPECTED_CONFIRMED_FINDING_IDS,
  TRACK_B_PRODUCT_UI_EXPECTED_SOURCE_METADATA,
  TRACK_B_PRODUCT_UI_EXPECTED_SUSPECTED_FINDING_IDS,
  TRACK_B_PRODUCT_UI_FORBIDDEN_ACTUAL_PATHS,
  TRACK_B_PRODUCT_UI_FORBIDDEN_DIRECT_DEPENDENCIES,
  TRACK_B_PRODUCT_UI_MODULE_FILES,
  TRACK_B_PRODUCT_UI_PRIVATE_P0_BLOCKER_IDS,
  TRACK_B_PRODUCT_UI_PUBLIC_P0_BLOCKER_IDS,
  TRACK_B_PRODUCT_UI_PUBLIC_P0_REQUIRED_THEMES,
  TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS,
  TRACK_B_PRODUCT_UI_REQUIRED_SAFETY_BOUNDARY_IDS,
  TRACK_B_PRODUCT_UI_SEVERITIES
} from "../src/lib/product-ui-readiness/fixtures";

const workspaceRoot = process.cwd();

type ProductUiReadinessTypeSurface = {
  version: TrackBProductUiReadinessVersion;
  verdict: TrackBProductUiVerdict;
  severity: TrackBProductUiSeverity;
  routePath: TrackBProductUiRoutePath;
  routeAudit: TrackBProductUiRouteAudit;
  finding: TrackBProductUiFinding;
  findingStatus: TrackBProductUiFindingStatus;
  source: TrackBProductUiSourceMetadata;
  audience: TrackBProductUiAudience;
  audit: TrackBProductUiReadinessAudit;
};

const typeSmoke: ProductUiReadinessTypeSurface = {
  version: TRACK_B_PRODUCT_UI_READINESS_VERSION,
  verdict: TRACK_B_PRODUCT_UI_READINESS_AUDIT.publicPaidBetaVerdict,
  severity: TRACK_B_PRODUCT_UI_SEVERITIES[0],
  routePath: TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS[0],
  routeAudit: TRACK_B_PRODUCT_UI_READINESS_AUDIT.routeAudits[0],
  finding: TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings[0],
  findingStatus: TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings[0].status,
  source: TRACK_B_PRODUCT_UI_SOURCE_METADATA,
  audience: "private",
  audit: TRACK_B_PRODUCT_UI_READINESS_AUDIT
};

function routePaths() {
  return TRACK_B_PRODUCT_UI_READINESS_AUDIT.routeAudits.map(
    (route) => route.path
  );
}

function findingIdsByStatusAndSeverity(
  status: TrackBProductUiFindingStatus,
  severity: TrackBProductUiSeverity
) {
  return TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings
    .filter((finding) => finding.status === status && finding.severity === severity)
    .map((finding) => finding.id);
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

function withNoRuntimeSurfaceAccess<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  const originalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "env"
  );
  let fetchAccessed = false;
  let storageAccessed = false;
  let windowAccessed = false;
  let processEnvAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return undefined;
    }
  });

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      storageAccessed = true;
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
        storageAccessed,
        windowAccessed,
        processEnvAccessed
      }
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalStorageDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("Track B product/UI readiness audit contract", () => {
  test("exports v2 with exact source metadata", () => {
    expect(typeSmoke).toMatchObject({
      version: 2,
      verdict: "no_go_public_paid_beta",
      severity: "P0",
      routePath: "/dashboard",
      findingStatus: "confirmed",
      audience: "private"
    });
    expect(TRACK_B_PRODUCT_UI_READINESS_VERSION).toBe(2);
    expect(TRACK_B_PRODUCT_UI_SOURCE_METADATA).toEqual(
      TRACK_B_PRODUCT_UI_EXPECTED_SOURCE_METADATA
    );
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT.source).toEqual({
      reportType: "rendered-application evidence audit",
      reportVersion: 2,
      sourcePr: "#119",
      auditedCommit: "13141144a18e7192435b035478f2b0e7f469300f",
      auditDate: "2026-06-24"
    });
  });

  test("sets private beta and public beta verdicts exactly", () => {
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT.privatePaidBeta).toEqual({
      verdict: "conditional_manual_only_private_paid_beta",
      label: "Conditional / Manual-only",
      recommendation: "A Conditional Go for owner-managed, invite-only use",
      confirmedP0BlockerIds: []
    });
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT.publicPaidBeta).toEqual({
      verdict: "no_go_public_paid_beta",
      label: "No-Go",
      recommendation: "Public paid beta remains No-Go",
      confirmedP0BlockerIds: ["VLX-AUDIT-P0-001"]
    });
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT).toMatchObject({
      privatePaidBetaVerdict: "conditional_manual_only_private_paid_beta",
      publicPaidBetaVerdict: "no_go_public_paid_beta",
      privatePaidBetaRecommendation: "Conditional / Manual-only",
      publicPaidBetaRecommendation: "No-Go"
    });
    expect(getTrackBProductUiAudit()).toBe(TRACK_B_PRODUCT_UI_READINESS_AUDIT);
  });

  test("covers every audited Track B route without stale rebuild verdicts", () => {
    expect(routePaths()).toEqual(TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS);

    for (const routePath of TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS) {
      const route = getRouteAuditByPath(routePath);

      expect(route, routePath).toBeDefined();
      expect(route?.primaryUserAction, routePath).toBeTruthy();
      expect(route?.renderedEvidence, routePath).toBeTruthy();
      expect(route?.recommendation, routePath).toBeTruthy();
      expect(route?.routeVerdict, routePath).not.toBe(
        ["needs", "rebuild"].join("_")
      );
    }

    expect(getRouteAuditByPath("/word/[slug]")).toMatchObject({
      routeVerdict: "accepted_private_beta_risk",
      confirmedIssueIds: ["VLX-AUDIT-P1-001", "VLX-AUDIT-P1-002"]
    });
    expect(getRouteAuditByPath("/pricing")).toMatchObject({
      routeVerdict: "public_beta_blocked",
      publicBetaBlockers: ["VLX-AUDIT-P0-001"]
    });
    expect(getRouteAuditByPath("/settings")).toMatchObject({
      routeVerdict: "public_beta_blocked",
      publicBetaBlockers: ["VLX-AUDIT-P0-001"]
    });
  });

  test("matches the rendered audit finding counts and exact issue IDs", () => {
    expect(TRACK_B_PRODUCT_UI_FINDING_COUNTS).toEqual({
      confirmed: {
        P0: 1,
        P1: 2,
        P2: 2
      },
      suspected: {
        P0: 0,
        P1: 1,
        P2: 1
      }
    });
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT.findingCounts).toEqual(
      TRACK_B_PRODUCT_UI_FINDING_COUNTS
    );

    for (const severity of TRACK_B_PRODUCT_UI_SEVERITIES) {
      expect(findingIdsByStatusAndSeverity("confirmed", severity)).toEqual(
        TRACK_B_PRODUCT_UI_EXPECTED_CONFIRMED_FINDING_IDS[severity]
      );
      expect(findingIdsByStatusAndSeverity("suspected", severity)).toEqual(
        TRACK_B_PRODUCT_UI_EXPECTED_SUSPECTED_FINDING_IDS[severity]
      );
      expect(getConfirmedFindingsBySeverity(severity).map((finding) => finding.id))
        .toEqual(TRACK_B_PRODUCT_UI_EXPECTED_CONFIRMED_FINDING_IDS[severity]);
      expect(getSuspectedFindingsBySeverity(severity).map((finding) => finding.id))
        .toEqual(TRACK_B_PRODUCT_UI_EXPECTED_SUSPECTED_FINDING_IDS[severity]);
    }

    expect(getFindingsBySeverity("P0").map((finding) => finding.id)).toEqual([
      "VLX-AUDIT-P0-001"
    ]);
    expect(getFindingsBySeverity("P1").map((finding) => finding.id)).toEqual([
      "VLX-AUDIT-P1-001",
      "VLX-AUDIT-P1-002",
      "VLX-AUDIT-RISK-002"
    ]);
    expect(getFindingsBySeverity("P2").map((finding) => finding.id)).toEqual([
      "VLX-AUDIT-P2-001",
      "VLX-AUDIT-P2-002",
      "VLX-AUDIT-RISK-001"
    ]);
  });

  test("uses explicit private and public P0 blocker semantics", () => {
    expect(getP0Blockers("private").map((finding) => finding.id)).toEqual(
      TRACK_B_PRODUCT_UI_PRIVATE_P0_BLOCKER_IDS
    );
    expect(getP0Blockers("public").map((finding) => finding.id)).toEqual(
      TRACK_B_PRODUCT_UI_PUBLIC_P0_BLOCKER_IDS
    );
    expect(() => (getP0Blockers as unknown as () => unknown)()).toThrow(
      'getP0Blockers requires audience "private" or "public".'
    );

    const publicP0 = getFindingById("VLX-AUDIT-P0-001");

    expect(publicP0).toMatchObject({
      severity: "P0",
      status: "confirmed",
      blocksPrivatePaidBeta: false,
      blocksPublicPaidBeta: true
    });
    expect(publicP0?.themes).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_PUBLIC_P0_REQUIRED_THEMES])
    );
  });

  test("keeps suspected risks out of confirmed private-beta P0 findings", () => {
    expect(getFindingById("VLX-AUDIT-RISK-001")).toMatchObject({
      severity: "P2",
      status: "suspected",
      blocksPrivatePaidBeta: false,
      blocksPublicPaidBeta: false
    });
    expect(getFindingById("VLX-AUDIT-RISK-002")).toMatchObject({
      severity: "P1",
      status: "suspected",
      blocksPrivatePaidBeta: false,
      blocksPublicPaidBeta: false
    });

    const promotedScreenReaderP0 = TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings.find(
      (finding) =>
        finding.title.toLowerCase().includes("screen-reader") &&
        finding.status === "confirmed" &&
        finding.severity === "P0"
    );

    expect(promotedScreenReaderP0).toBeUndefined();
    expect(getP0Blockers("private")).toEqual([]);
  });

  test("keeps safety boundaries explicit", () => {
    expect(TRACK_B_PRODUCT_UI_SAFETY_POLICY).toMatchObject({
      docsContractsTestsOnly: true,
      noRuntimeUiChanges: true,
      apiRoutesAllowed: false,
      routeHandlersAllowed: false,
      middlewareAllowed: false,
      databaseIntegrationsAllowed: false,
      providerSdkAllowed: false,
      authBillingPaymentChangesAllowed: false,
      productionDataMutationAllowed: false,
      environmentVariableChangesAllowed: false,
      deploymentChangesAllowed: false,
      webflowCloudflareVercelDnsChangesAllowed: false,
      fakeMasteryAllowed: false,
      fakePaidAccessAllowed: false,
      networkCallsAllowed: false,
      browserStorageWritesAllowed: false
    });

    for (const boundaryId of TRACK_B_PRODUCT_UI_REQUIRED_SAFETY_BOUNDARY_IDS) {
      expect(getSafetyBoundaryById(boundaryId), boundaryId).toMatchObject({
        allowed: false
      });
    }
  });

  test("does not add actual API routes, route handlers, middleware, or payment route directories", () => {
    for (const relativePath of TRACK_B_PRODUCT_UI_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }
  });

  test("does not add forbidden provider or payment dependencies", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of TRACK_B_PRODUCT_UI_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("product/UI readiness module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\b/,
      /\bwindow\b/,
      /\blocalStorage\b/,
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
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/
    ];

    for (const relativePath of TRACK_B_PRODUCT_UI_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("audit helpers are pure static reads", () => {
    const { sideEffects, value } = withNoRuntimeSurfaceAccess(() => ({
      publicVerdict: getTrackBProductUiAudit().publicPaidBetaVerdict,
      dashboardPrimaryAction: getRouteAuditByPath("/dashboard")?.primaryUserAction,
      privateP0Ids: getP0Blockers("private").map((finding) => finding.id),
      publicP0Ids: getP0Blockers("public").map((finding) => finding.id),
      confirmedP1Count: getConfirmedFindingsBySeverity("P1").length,
      suspectedP2Count: getSuspectedFindingsBySeverity("P2").length,
      fakeMasteryAllowed:
        getTrackBProductUiAudit().safetyPolicy.fakeMasteryAllowed
    }));

    expect(value).toEqual({
      publicVerdict: "no_go_public_paid_beta",
      dashboardPrimaryAction: "Start today's review mission.",
      privateP0Ids: [],
      publicP0Ids: ["VLX-AUDIT-P0-001"],
      confirmedP1Count: 2,
      suspectedP2Count: 1,
      fakeMasteryAllowed: false
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      storageAccessed: false,
      windowAccessed: false,
      processEnvAccessed: false
    });
  });

  test("typed contract and audit document agree", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const auditDoc = readFileSync(
      join(workspaceRoot, "docs", "TRACK_B_PRODUCT_UI_READINESS_AUDIT.md"),
      "utf8"
    );

    expect(TRACK_B_PRODUCT_UI_DOC_FILES).toEqual([
      "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md"
    ]);
    expect(readme).toContain("docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md");
    expect(auditDoc).toContain("Report type: rendered-application evidence audit");
    expect(auditDoc).toContain("Report version: 2");
    expect(auditDoc).toContain("Source PR: #119");
    expect(auditDoc).toContain(
      "Audited commit: 13141144a18e7192435b035478f2b0e7f469300f"
    );
    expect(auditDoc).toContain("Audit date: 2026-06-24");
    expect(auditDoc).toContain("Typed contract v2 is reconciled");
    expect(auditDoc).toContain("Private P0 blockers: 0");
    expect(auditDoc).toContain("Public P0 blockers: 1");
    expect(auditDoc).toContain("Confirmed P0 findings: 1");
    expect(auditDoc).toContain("Confirmed P1 findings: 2");
    expect(auditDoc).toContain("Confirmed P2 findings: 2");
    expect(auditDoc).toContain("Suspected P1 risks: 1");
    expect(auditDoc).toContain("Suspected P2 risks: 1");

    for (const finding of TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings) {
      expect(auditDoc, finding.id).toContain(finding.id);
    }
  });

  test("contract and source audit doc do not present stale v1 PR metadata as current work", () => {
    const contractText = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "product-ui-readiness",
        "product-ui-readiness-audit.ts"
      ),
      "utf8"
    );
    const auditDoc = readFileSync(
      join(workspaceRoot, "docs", "TRACK_B_PRODUCT_UI_READINESS_AUDIT.md"),
      "utf8"
    );

    for (const text of [contractText, auditDoc]) {
      expect(text).not.toMatch(/PR #7[1-9]\b/);
      expect(text).not.toMatch(/#7[1-9]\b/);
      expect(text).not.toMatch(/typed\s+v1/);
      expect(text).not.toContain(
        ["static typed product/UI readiness baseline", "v1"].join(" ")
      );
      expect(text).not.toContain(
        ["must not be used as the current automated", "release gate"].join(" ")
      );
    }
  });
});
