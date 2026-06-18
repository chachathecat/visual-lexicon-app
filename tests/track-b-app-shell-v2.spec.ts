import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import {
  TRACK_B_APP_SHELL_V2_VERSION,
  TrackBAppShell,
  TrackBBottomNav,
  TrackBEmptyState,
  TrackBFocusPanel,
  TrackBMetricCard,
  TrackBPageHeader,
  TrackBPrimaryActionCard,
  TrackBProgressBadge,
  TrackBSection,
  TrackBStatusBadge,
  TrackBUpgradeNudge,
  getTrackBNavItemIsActive,
  trackBAppShellV2Contract,
  trackBDesignTokens,
  trackBNavigationItems,
  type TrackBStatusTone
} from "../src/components/track-b";

const workspaceRoot = process.cwd();

const componentExports = {
  TrackBAppShell,
  TrackBPageHeader,
  TrackBPrimaryActionCard,
  TrackBMetricCard,
  TrackBProgressBadge,
  TrackBStatusBadge,
  TrackBEmptyState,
  TrackBSection,
  TrackBBottomNav,
  TrackBFocusPanel,
  TrackBUpgradeNudge
};

const requiredStatusTones = [
  "due",
  "weak",
  "new",
  "learning",
  "mastered"
] satisfies TrackBStatusTone[];

const trackBModuleFiles = [
  "src/components/track-b/app-shell.tsx",
  "src/components/track-b/contracts.ts",
  "src/components/track-b/index.ts",
  "src/components/track-b/layout-primitives.tsx",
  "src/components/track-b/learning-primitives.tsx",
  "src/components/track-b/tokens.ts",
  "src/components/track-b/utils.ts"
];

test.describe("Track B app shell v2 foundation", () => {
  test("exports the required component and contract surface", () => {
    expect(TRACK_B_APP_SHELL_V2_VERSION).toBe(1);

    for (const [exportName, exportedValue] of Object.entries(componentExports)) {
      expect(typeof exportedValue, exportName).toBe("function");
    }

    expect(trackBAppShellV2Contract).toMatchObject({
      version: 1,
      branch: "release/track-b-app-shell-v2",
      pullRequest: "#73 Track B design tokens / app shell v2",
      northStarMetric: "Weekly Reviewed Words",
      safetyBoundaries: {
        routeIntegrationInThisPr: false,
        apiRoutesAllowed: false,
        routeHandlersAllowed: false,
        middlewareAllowed: false,
        authBillingPaymentChangesAllowed: false,
        providerSdkAllowed: false,
        productionDataMutationAllowed: false,
        fakeMasteryAllowed: false,
        fakePaidAccessAllowed: false
      }
    });
  });

  test("defines the required design token groups and status tones", () => {
    expect(Object.keys(trackBDesignTokens)).toEqual([
      "spacing",
      "radius",
      "typography",
      "border",
      "shadow",
      "focusRing",
      "statusTones",
      "motion"
    ]);

    expect(trackBDesignTokens.spacing).toMatchObject({
      xs: "var(--vlx-track-b-space-xs)",
      md: "var(--vlx-track-b-space-md)",
      xl: "var(--vlx-track-b-space-xl)"
    });
    expect(trackBDesignTokens.radius).toHaveProperty("md");
    expect(trackBDesignTokens.typography).toHaveProperty("display");
    expect(trackBDesignTokens.border).toHaveProperty("subtle");
    expect(trackBDesignTokens.shadow).toHaveProperty("panel");
    expect(trackBDesignTokens.focusRing).toHaveProperty("outline");
    expect(trackBDesignTokens.motion).toHaveProperty("steady");

    for (const tone of requiredStatusTones) {
      expect(trackBDesignTokens.statusTones[tone], tone).toMatchObject({
        label: expect.any(String),
        cssClass: expect.stringContaining(`--${tone}`),
        foreground: expect.stringContaining("--vlx-track-b-status"),
        background: expect.stringContaining("--vlx-track-b-status")
      });
    }
  });

  test("keeps navigation aligned to the Track B learning model without adding a Progress route", () => {
    expect(trackBNavigationItems.map((item) => item.label)).toEqual([
      "Today",
      "Review",
      "Weak",
      "Packs",
      "Saved",
      "Progress"
    ]);
    expect(trackBNavigationItems.find((item) => item.id === "progress")).toMatchObject({
      href: "/dashboard#progress"
    });

    const reviewItem = trackBNavigationItems.find((item) => item.id === "review");
    const weakItem = trackBNavigationItems.find((item) => item.id === "weak");

    expect(reviewItem).toBeDefined();
    expect(weakItem).toBeDefined();
    expect(
      getTrackBNavItemIsActive({
        currentPath: "/review/due",
        item: reviewItem!
      })
    ).toBe(true);
    expect(
      getTrackBNavItemIsActive({
        currentPath: "/review/weak",
        item: reviewItem!
      })
    ).toBe(false);
    expect(
      getTrackBNavItemIsActive({
        currentPath: "/review/weak",
        item: weakItem!
      })
    ).toBe(true);
  });

  test("adds namespaced CSS variables, focus states, and reduced-motion handling", () => {
    const globalsCss = readFileSync(
      join(workspaceRoot, "src", "app", "globals.css"),
      "utf8"
    );

    for (const cssToken of [
      "--vlx-track-b-space-xs",
      "--vlx-track-b-radius-md",
      "--vlx-track-b-type-display",
      "--vlx-track-b-canvas",
      "--vlx-track-b-salmon",
      "--vlx-track-b-coral-deep",
      "--vlx-track-b-salmon-mist",
      "--vlx-track-b-warm-border",
      "--vlx-track-b-border-subtle",
      "--vlx-track-b-shadow-panel",
      "--vlx-track-b-focus-outline",
      "--vlx-track-b-status-due-bg",
      "--vlx-track-b-status-weak-bg",
      "--vlx-track-b-status-new-bg",
      "--vlx-track-b-status-learning-bg",
      "--vlx-track-b-status-mastered-bg",
      "--vlx-track-b-motion-steady"
    ]) {
      expect(globalsCss, cssToken).toContain(cssToken);
    }

    expect(globalsCss).toContain(
      "--vlx-track-b-accent: var(--vlx-track-b-coral-deep);"
    );
    expect(globalsCss).toContain(
      "--vlx-track-b-focus-outline: 2px solid var(--vlx-track-b-coral-deep);"
    );
    expect(globalsCss).toContain(".track-b-shell__skip-link:focus");
    expect(globalsCss).toContain(":focus-visible");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toContain(".track-b-bottom-nav");
  });

  test("documents the foundation and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_APP_SHELL_V2.md");
    const salmonDocPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_SALMON_BRAND_TOKENS.md"
    );
    const componentReadmePath = join(
      workspaceRoot,
      "src",
      "components",
      "track-b",
      "README.md"
    );
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(docPath, "utf8");
    const salmonDoc = readFileSync(salmonDocPath, "utf8");
    const componentReadme = readFileSync(componentReadmePath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(existsSync(salmonDocPath)).toBe(true);
    expect(existsSync(componentReadmePath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_APP_SHELL_V2.md");
    expect(readme).toContain("docs/TRACK_B_SALMON_BRAND_TOKENS.md");
    expect(doc).toContain("Today -> Review -> Weak -> Packs -> Saved -> Progress");
    expect(doc).toContain("No payment, billing, subscription");
    expect(doc).toContain("#74 should use this foundation");
    expect(salmonDoc).toContain("--vlx-track-b-coral-deep");
    expect(salmonDoc).toContain("Do not use light salmon");
    expect(salmonDoc).toContain("Shell/navigation cleanup");
    expect(salmonDoc).toContain("Public paid beta remains **No-Go**");
    expect(componentReadme).toContain("TrackBAppShell");
    expect(componentReadme).toContain("Status badges communicate text labels");
  });

  test("keeps Track B foundation modules free of runtime integrations", () => {
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

    for (const relativePath of trackBModuleFiles) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });
});
