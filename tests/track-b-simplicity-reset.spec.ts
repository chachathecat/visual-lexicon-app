import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  TRACK_B_SIMPLICITY_RESET,
  TRACK_B_SIMPLICITY_RESET_VERSION,
  getApprovedV0Routes,
  getDashboardV0Rules,
  getDeferredFeatures,
  getNextSimplicityPRSequence,
  getPricingV0Rules,
  getReviewV0Rules,
  getSaveV0Rules,
  getSavedV0Rules,
  getSimplifiedMentalModel,
  getTrackBSimplicityReset,
  type TrackBSimplicityApprovedV0Route,
  type TrackBSimplicityConfidenceValue,
  type TrackBSimplicityDeferredFeature,
  type TrackBSimplicityForbiddenTouchpoint,
  type TrackBSimplicityNextPr,
  type TrackBSimplicityReset,
  type TrackBSimplicityResetVersion,
  type TrackBSimplifiedMentalModel
} from "../src/lib/track-b-simplicity-reset/track-b-simplicity-reset";
import {
  TRACK_B_SIMPLICITY_DOC_FILES,
  TRACK_B_SIMPLICITY_MODULE_FILES,
  TRACK_B_SIMPLICITY_REQUIRED_APPROVED_V0_ROUTES,
  TRACK_B_SIMPLICITY_REQUIRED_CONFIDENCE_VALUES,
  TRACK_B_SIMPLICITY_REQUIRED_DASHBOARD_STATS,
  TRACK_B_SIMPLICITY_REQUIRED_DEFERRED_FEATURE_IDS,
  TRACK_B_SIMPLICITY_REQUIRED_FORBIDDEN_TOUCHPOINT_IDS,
  TRACK_B_SIMPLICITY_REQUIRED_MENTAL_MODEL,
  TRACK_B_SIMPLICITY_REQUIRED_NEXT_PR_NUMBERS,
  TRACK_B_SIMPLICITY_RUNTIME_SCAN_DIRS
} from "../src/lib/track-b-simplicity-reset/fixtures";

const workspaceRoot = process.cwd();

type TrackBSimplicityTypeSurface = {
  version: TrackBSimplicityResetVersion;
  reset: TrackBSimplicityReset;
  mentalModel: TrackBSimplifiedMentalModel;
  approvedRoute: TrackBSimplicityApprovedV0Route;
  deferredFeature: TrackBSimplicityDeferredFeature;
  confidenceValue: TrackBSimplicityConfidenceValue;
  forbiddenTouchpoint: TrackBSimplicityForbiddenTouchpoint;
  nextPr: TrackBSimplicityNextPr;
};

const typeSmoke: TrackBSimplicityTypeSurface = {
  version: TRACK_B_SIMPLICITY_RESET_VERSION,
  reset: TRACK_B_SIMPLICITY_RESET,
  mentalModel: TRACK_B_SIMPLICITY_REQUIRED_MENTAL_MODEL[0],
  approvedRoute: TRACK_B_SIMPLICITY_REQUIRED_APPROVED_V0_ROUTES[0],
  deferredFeature: TRACK_B_SIMPLICITY_RESET.deferredFeatures[0],
  confidenceValue: TRACK_B_SIMPLICITY_REQUIRED_CONFIDENCE_VALUES[0],
  forbiddenTouchpoint: TRACK_B_SIMPLICITY_RESET.forbiddenTouchpoints[0],
  nextPr: TRACK_B_SIMPLICITY_RESET.nextSimplicityPRSequence[0]
};

function ids<TItem extends { id: string }>(items: readonly TItem[]) {
  return items.map((item) => item.id);
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

test.describe("Track B simplicity reset", () => {
  test("exports the required typed simplicity reset surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 1,
      reset: {
        branch: "release/track-b-simplicity-reset",
        pullRequest: "#93 Track B simplicity reset",
        northStar: "Weekly Reviewed Words"
      },
      mentalModel: "Today",
      approvedRoute: "/save",
      confidenceValue: "knew"
    });
    expect(getTrackBSimplicityReset()).toBe(TRACK_B_SIMPLICITY_RESET);
  });

  test("approved v0 routes are exactly the simplicity reset routes", () => {
    expect(getApprovedV0Routes()).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_APPROVED_V0_ROUTES
    ]);
    expect(TRACK_B_SIMPLICITY_RESET.approvedV0Routes).toEqual([
      "/save",
      "/dashboard",
      "/review",
      "/saved",
      "/pricing"
    ]);
  });

  test("simplified mental model is exactly Today Save Review Queue Upgrade interest", () => {
    expect(getSimplifiedMentalModel()).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_MENTAL_MODEL
    ]);
    expect(TRACK_B_SIMPLICITY_RESET.coreLoop).toEqual([
      "Save",
      "Review",
      "Memory state",
      "Return tomorrow"
    ]);
  });

  test("deferred features include weak sprint AI Tutor real checkout no-watermark export and external validation", () => {
    expect(ids(getDeferredFeatures())).toEqual(
      expect.arrayContaining([...TRACK_B_SIMPLICITY_REQUIRED_DEFERRED_FEATURE_IDS])
    );

    const labels = getDeferredFeatures().map((feature) => feature.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "weak sprint",
        "AI Tutor",
        "real checkout",
        "no-watermark export",
        "external participant beta validation"
      ])
    );
  });

  test("dashboard has one dominant CTA and only the approved supporting stats", () => {
    const dashboardRules = getDashboardV0Rules();

    expect(dashboardRules.dominantCtaRules).toEqual([
      "Review 5 words before they fade"
    ]);
    expect(dashboardRules.dominantCtaRules).toHaveLength(1);
    expect(dashboardRules.supportingStats).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_DASHBOARD_STATS
    ]);
    expect(dashboardRules.noisyParallelActionGridAllowed).toBe(false);
  });

  test("save result makes the saved word a review item", () => {
    expect(getSaveV0Rules()).toMatchObject({
      afterSaveMessage: "This word is now in your review queue.",
      primaryCta: "Review now",
      secondaryCta: "Go to dashboard",
      savedBecomesReviewItem: true,
      bookmarksFramingAllowed: false
    });
  });

  test("review stays focused and updates memory state", () => {
    expect(getReviewV0Rules()).toMatchObject({
      flow: [
        "one card",
        "one question",
        "answer",
        "confidence",
        "feedback",
        "next card",
        "summary"
      ],
      memoryStateUpdateRequired: true,
      eventWriteRequired: true,
      extraNavNoiseAllowed: false
    });
    expect(getReviewV0Rules().confidenceValues).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_CONFIDENCE_VALUES
    ]);
  });

  test("saved is defined as a review queue not bookmarks", () => {
    expect(getSavedV0Rules()).toEqual({
      definition: "Saved is a review queue, not bookmarks.",
      savedIsReviewQueue: true,
      savedIsBookmarks: false,
      tabsAndFiltersRole: "secondary"
    });
  });

  test("pricing remains interest-only with Lite and Pro outcomes", () => {
    expect(getPricingV0Rules()).toEqual({
      upgradeInterestOnly: true,
      realCheckout: false,
      fakePaidAccess: false,
      litePlanOutcome: "daily memory habit",
      proPlanOutcome: "weak-word repair and exam prep"
    });
  });

  test("beta validation and implementation statuses stay closed", () => {
    expect(TRACK_B_SIMPLICITY_RESET).toMatchObject({
      publicPaidBetaStatus: "no-go",
      publicPaidBetaLabel: "No-Go",
      privateBetaStatus: "owner-controlled/manual-only/conditional",
      externalParticipantValidationStatus: "not-started",
      externalParticipantValidationLabel: "Not Started",
      runtimeUiChanges: false,
      realCheckout: false,
      fakePaidAccess: false,
      fakeMastery: false,
      agentModeLocalhostDependency: false
    });
  });

  test("next simplicity PR sequence is #94 through #99", () => {
    expect(getNextSimplicityPRSequence().map((item) => item.prNumber)).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_NEXT_PR_NUMBERS
    ]);
    expect(getNextSimplicityPRSequence().map((item) => item.title)).toEqual([
      "Dashboard v0 simplification",
      "Save result page simplification",
      "Review session focus pass",
      "Saved queue simplification",
      "Pricing interest simplification",
      "Owner local smoke after simplification"
    ]);
  });

  test("forbidden integrations and touchpoints are explicitly listed", () => {
    expect(ids(TRACK_B_SIMPLICITY_RESET.forbiddenTouchpoints)).toEqual([
      ...TRACK_B_SIMPLICITY_REQUIRED_FORBIDDEN_TOUCHPOINT_IDS
    ]);

    for (const touchpoint of TRACK_B_SIMPLICITY_RESET.forbiddenTouchpoints) {
      expect(touchpoint.allowedInThisPr, touchpoint.id).toBe(false);
    }
  });

  test("core simplification surfaces do not introduce forbidden integrations", () => {
    const targetFiles = [
      "src/app/save/page.tsx",
      "src/components/views/save-landing-view.tsx",
      "src/app/review/page.tsx",
      "src/components/views/review-session-view.tsx",
      "src/app/saved/page.tsx",
      "src/components/views/saved-library-view.tsx",
      "src/app/pricing/page.tsx",
      "src/components/upgrade-placeholder-button.tsx"
    ];
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /from ["']@webflow\//,
      /from ["']@cloudflare\//,
      /from ["']@supabase\//,
      /from ["']@neondatabase\//,
      /from ["']@vercel\/postgres/,
      /from ["']firebase/,
      /from ["']@firebase\//,
      /from ["']prisma/,
      /from ["']@prisma\//,
      /from ["']drizzle/,
      /from ["']drizzle-orm/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /from ["']openai/,
      /from ["']ai/,
      /\bprocess\.env\b/,
      /\bmiddleware\b/
    ];

    for (const relativePath of targetFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("simplicity reset module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\b/,
      /\bprocess\.env\b/,
      /\blocalStorage\b/,
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

    for (const relativePath of TRACK_B_SIMPLICITY_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the simplicity reset", () => {
    for (const scanDir of TRACK_B_SIMPLICITY_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain("track-b-simplicity-reset");
        expect(fileText, relativePath).not.toContain("TRACK_B_SIMPLICITY");
      }
    }
  });

  test("contract helpers are pure static reads", () => {
    const { sideEffects, value } = withNoRuntimeSurfaceAccess(() => ({
      routes: getApprovedV0Routes(),
      mentalModel: getSimplifiedMentalModel(),
      dominantCta: getDashboardV0Rules().dominantCtaRules[0],
      confidenceValues: getReviewV0Rules().confidenceValues,
      pricingInterestOnly: getPricingV0Rules().upgradeInterestOnly
    }));

    expect(value).toEqual({
      routes: [...TRACK_B_SIMPLICITY_REQUIRED_APPROVED_V0_ROUTES],
      mentalModel: [...TRACK_B_SIMPLICITY_REQUIRED_MENTAL_MODEL],
      dominantCta: "Review 5 words before they fade",
      confidenceValues: [...TRACK_B_SIMPLICITY_REQUIRED_CONFIDENCE_VALUES],
      pricingInterestOnly: true
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and simplicity docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "TRACK_B_SIMPLICITY_RESET.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(workspaceRoot, "src", "lib", "track-b-simplicity-reset", "README.md"),
      "utf8"
    );

    expect(TRACK_B_SIMPLICITY_DOC_FILES).toEqual([
      "docs/TRACK_B_SIMPLICITY_RESET.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/TRACK_B_SIMPLICITY_RESET.md");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain(
      "Private beta: **owner-controlled/manual-only/conditional**"
    );
    expect(doc).toContain("External participant validation: **Not Started**");
    expect(doc).toContain("Review 5 words before they fade");
    expect(doc).toContain("#94 Dashboard v0 simplification");
    expect(doc).toContain("Recommended next PR: **#94 Dashboard v0 simplification**");
    expect(doc).toContain("no runtime UI implementation");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not wire into routes or components");
  });

  test("this contract does not add route handlers middleware or API directories", () => {
    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers).toEqual([]);
    expect(existsSync(join(workspaceRoot, "src", "app", "api"))).toBe(false);
    expect(existsSync(join(workspaceRoot, "src", "middleware.ts"))).toBe(false);
    expect(existsSync(join(workspaceRoot, "middleware.ts"))).toBe(false);
  });
});
