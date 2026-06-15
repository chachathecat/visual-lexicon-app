import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  TRACK_B_PRODUCT_UI_READINESS_AUDIT,
  TRACK_B_PRODUCT_UI_READINESS_VERSION,
  TRACK_B_PRODUCT_UI_SAFETY_POLICY,
  getFindingsBySeverity,
  getP0Blockers,
  getRecommendedNextPrs,
  getRouteAuditByPath,
  getSafetyBoundaryById,
  getTrackBProductUiAudit,
  type TrackBProductUiFinding,
  type TrackBProductUiReadinessAudit,
  type TrackBProductUiReadinessVersion,
  type TrackBProductUiRouteAudit,
  type TrackBProductUiRoutePath,
  type TrackBProductUiSeverity,
  type TrackBProductUiVerdict
} from "../src/lib/product-ui-readiness/product-ui-readiness-audit";
import {
  TRACK_B_PRODUCT_UI_DOC_FILES,
  TRACK_B_PRODUCT_UI_FORBIDDEN_ACTUAL_PATHS,
  TRACK_B_PRODUCT_UI_FORBIDDEN_DIRECT_DEPENDENCIES,
  TRACK_B_PRODUCT_UI_MODULE_FILES,
  TRACK_B_PRODUCT_UI_REQUIRED_NEXT_PR_NUMBERS,
  TRACK_B_PRODUCT_UI_REQUIRED_P0_FINDING_IDS,
  TRACK_B_PRODUCT_UI_REQUIRED_P1_FINDING_IDS,
  TRACK_B_PRODUCT_UI_REQUIRED_P2_FINDING_IDS,
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
  audit: TrackBProductUiReadinessAudit;
};

const typeSmoke: ProductUiReadinessTypeSurface = {
  version: TRACK_B_PRODUCT_UI_READINESS_VERSION,
  verdict: TRACK_B_PRODUCT_UI_READINESS_AUDIT.publicPaidBetaVerdict,
  severity: TRACK_B_PRODUCT_UI_SEVERITIES[0],
  routePath: TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS[0],
  routeAudit: TRACK_B_PRODUCT_UI_READINESS_AUDIT.routeAudits[0],
  finding: TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings[0],
  audit: TRACK_B_PRODUCT_UI_READINESS_AUDIT
};

function routePaths() {
  return TRACK_B_PRODUCT_UI_READINESS_AUDIT.routeAudits.map(
    (route) => route.path
  );
}

function findingIdsBySeverity(severity: TrackBProductUiSeverity) {
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

function withNoRuntimeSurfaceAccess<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
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
  let windowAccessed = false;
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

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("Track B product/UI readiness audit", () => {
  test("exports the required typed audit surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      verdict: "no_go_public_paid_beta",
      severity: "P0",
      routePath: "/dashboard",
      audit: {
        branch: "release/track-b-product-ui-readiness-audit",
        pullRequest: "#72 Track B Product/UI Readiness Audit",
        northStarMetric: "Weekly Reviewed Words"
      }
    });
  });

  test("sets private beta to Conditional / Manual-only and public beta to No-Go", () => {
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT).toMatchObject({
      privatePaidBetaVerdict: "conditional_manual_only_private_paid_beta",
      publicPaidBetaVerdict: "no_go_public_paid_beta",
      privatePaidBetaRecommendation: "Conditional / Manual-only",
      publicPaidBetaRecommendation: "No-Go"
    });
    expect(getTrackBProductUiAudit()).toBe(TRACK_B_PRODUCT_UI_READINESS_AUDIT);
  });

  test("covers every requested Track B route surface", () => {
    expect(routePaths()).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS])
    );

    for (const routePath of TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS) {
      const route = getRouteAuditByPath(routePath);

      expect(route, routePath).toBeDefined();
      expect(route?.primaryUserAction, routePath).toBeTruthy();
      expect(route?.rebuildRecommendation, routePath).toBeTruthy();
      expect(route?.criteria.fakeMasteryRisk, routePath).not.toBe("high");
      expect(route?.criteria.privacySupportAccountSyncPaymentBlockers, routePath).toBe(
        "blocked"
      );
    }
  });

  test("route audits include the required product/UI criteria", () => {
    const requiredCriteriaKeys = [
      "primaryUserActionClarity",
      "cognitiveLoad",
      "hickFittsGestaltIssues",
      "saveReviewLoopClarity",
      "savedWordsBecomeReviewItems",
      "reviewUpdatesMemoryState",
      "dueWeakMasteredTruthfulness",
      "fakeMasteryRisk",
      "paywallTriggerQuality",
      "pricingOutcomeClarity",
      "freeVsPaidValueClarity",
      "mobileReviewErgonomics",
      "accessibilityRisk",
      "keyboardFocusScreenReaderRisk",
      "performanceRisk",
      "analyticsReadiness",
      "paidBetaReadiness",
      "privacySupportAccountSyncPaymentBlockers"
    ] as const;

    for (const route of TRACK_B_PRODUCT_UI_READINESS_AUDIT.routeAudits) {
      for (const key of requiredCriteriaKeys) {
        expect(route.criteria, `${route.path} missing ${key}`).toHaveProperty(key);
      }
    }
  });

  test("classifies required P0 P1 and P2 findings", () => {
    expect(findingIdsBySeverity("P0")).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_REQUIRED_P0_FINDING_IDS])
    );
    expect(findingIdsBySeverity("P1")).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_REQUIRED_P1_FINDING_IDS])
    );
    expect(findingIdsBySeverity("P2")).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_REQUIRED_P2_FINDING_IDS])
    );

    for (const findingId of TRACK_B_PRODUCT_UI_REQUIRED_P0_FINDING_IDS) {
      expect(
        TRACK_B_PRODUCT_UI_READINESS_AUDIT.findings.find(
          (finding) => finding.id === findingId
        ),
        findingId
      ).toMatchObject({
        severity: "P0",
        status: "open",
        blocksPublicPaidBeta: true
      });
    }

    expect(getP0Blockers().map((finding) => finding.id)).toEqual(
      expect.arrayContaining([...TRACK_B_PRODUCT_UI_REQUIRED_P0_FINDING_IDS])
    );
  });

  test("recommends the requested future mental model and next PR sequence", () => {
    expect(TRACK_B_PRODUCT_UI_READINESS_AUDIT.futureMentalModel).toEqual([
      "Today",
      "Review",
      "Weak",
      "Packs",
      "Saved",
      "Progress"
    ]);

    expect(getRecommendedNextPrs().map((nextPr) => nextPr.prNumber)).toEqual(
      TRACK_B_PRODUCT_UI_REQUIRED_NEXT_PR_NUMBERS
    );
    expect(getRecommendedNextPrs().map((nextPr) => nextPr.title)).toEqual([
      "Track B design tokens / app shell v2",
      "Dashboard v2: Today's Memory Mission",
      "Review Session v2",
      "Saved Library v2",
      "Packs v2",
      "Pricing / Paywall v2",
      "Manual QA execution report"
    ]);
  });

  test("captures the required rebuild targets", () => {
    expect(
      TRACK_B_PRODUCT_UI_READINESS_AUDIT.rebuildTargets.find(
        (target) => target.surface === "dashboard"
      )
    ).toMatchObject({
      mustCenter: expect.arrayContaining([
        "Today's Memory Mission",
        "Start due review",
        "Due / Weak / New / Mastered",
        "Continue pack",
        "Recently saved",
        "Contextual upgrade trigger only"
      ])
    });

    expect(
      TRACK_B_PRODUCT_UI_READINESS_AUDIT.rebuildTargets.find(
        (target) => target.surface === "review_session"
      )
    ).toMatchObject({
      mustCenter: expect.arrayContaining([
        "One card",
        "One question",
        "Answer",
        "Confidence",
        "review_state update",
        "review_events update",
        "Honest nextDueAt"
      ]),
      mustAvoid: expect.arrayContaining(["Fake mastery"])
    });

    expect(
      TRACK_B_PRODUCT_UI_READINESS_AUDIT.rebuildTargets.find(
        (target) => target.surface === "pricing"
      )
    ).toMatchObject({
      mustCenter: [
        "Free: Start remembering your first words.",
        "Lite: Build a daily visual memory habit.",
        "Pro: Fix weak words and prepare for exams."
      ]
    });
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
      p0Count: getP0Blockers().length,
      fakeMasteryAllowed:
        getTrackBProductUiAudit().safetyPolicy.fakeMasteryAllowed
    }));

    expect(value).toEqual({
      publicVerdict: "no_go_public_paid_beta",
      dashboardPrimaryAction: "Start today's review mission.",
      p0Count: getP0Blockers().length,
      fakeMasteryAllowed: false
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and audit docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const auditDoc = readFileSync(
      join(workspaceRoot, "docs", "TRACK_B_PRODUCT_UI_READINESS_AUDIT.md"),
      "utf8"
    );

    expect(TRACK_B_PRODUCT_UI_DOC_FILES).toEqual([
      "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md");
    expect(auditDoc).toContain("Private paid beta: **Conditional / Manual-only**");
    expect(auditDoc).toContain("Public paid beta: **No-Go**");
    expect(auditDoc).toContain("#73 Track B design tokens / app shell v2");
    expect(auditDoc).toContain("#79 Manual QA execution report");
    expect(auditDoc).toContain("No runtime UI changes");
  });
});
