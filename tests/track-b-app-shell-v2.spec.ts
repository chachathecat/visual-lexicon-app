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

const trackBAppShellOwnedRoutes = [
  "/dashboard",
  "/packs",
  "/pricing",
  "/review",
  "/save",
  "/saved"
] as const;

const trackBAppShellRuntimeRoutes = [
  ...trackBAppShellOwnedRoutes,
  "/review/due",
  "/review/weak",
  "/review/weak-sprint"
] as const;

const requiredAccessibleRoutes = [
  "/",
  "/dashboard",
  "/save?slug=dissonance&source=word_page",
  "/review",
  "/saved",
  "/pricing"
] as const;

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

  test("keeps navigation aligned to the Figma Track B route set", () => {
    expect(trackBNavigationItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Save Word",
      "Review",
      "Queue",
      "Early Access"
    ]);
    expect(trackBNavigationItems.some((item) => item.label === "Packs")).toBe(
      false
    );
    expect(trackBNavigationItems.some((item) => item.id === "pricing")).toBe(
      true
    );

    const reviewItem = trackBNavigationItems.find((item) => item.id === "review");
    const saveItem = trackBNavigationItems.find((item) => item.id === "save");
    const pricingItem = trackBNavigationItems.find((item) => item.id === "pricing");

    expect(reviewItem).toBeDefined();
    expect(saveItem).toBeDefined();
    expect(pricingItem).toBeDefined();
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
        currentPath: "/save",
        item: saveItem!
      })
    ).toBe(true);
    expect(
      getTrackBNavItemIsActive({
        currentPath: "/pricing",
        item: pricingItem!
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
    expect(globalsCss).toContain("--vlx-track-b-bottom-nav-reserved");
    expect(globalsCss).toContain("env(safe-area-inset-bottom, 0px)");
    expect(globalsCss).toContain(
      "padding-bottom: var(--vlx-track-b-bottom-nav-reserved);"
    );
    expect(globalsCss).toContain(".track-b-shell__skip-link:focus");
    expect(globalsCss).toContain(":focus-visible");
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toContain(".track-b-bottom-nav");
  });

  test("keeps the legacy root shell out of routes that already own TrackBAppShell", () => {
    const rootLayout = readFileSync(
      join(workspaceRoot, "src", "app", "layout.tsx"),
      "utf8"
    );
    const legacyShell = readFileSync(
      join(workspaceRoot, "src", "components", "app-shell.tsx"),
      "utf8"
    );

    expect(rootLayout).toContain("<AppShell>{children}</AppShell>");
    expect(legacyShell).toContain("trackBAppShellRoutePrefixes");
    expect(legacyShell).toContain("return <>{children}</>;");
    expect(legacyShell).toContain("pathname.startsWith(`${prefix}/`)");

    for (const route of trackBAppShellOwnedRoutes) {
      expect(legacyShell).toContain(`"${route}"`);
    }
  });

  test("documents the foundation and links it from README", () => {
    const docPath = join(workspaceRoot, "docs", "TRACK_B_APP_SHELL_V2.md");
    const cleanupDocPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_SHELL_NAVIGATION_CLEANUP.md"
    );
    const reviewShellDocPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_REVIEW_SHELL_CONSISTENCY.md"
    );
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
    const cleanupDoc = readFileSync(cleanupDocPath, "utf8");
    const reviewShellDoc = readFileSync(reviewShellDocPath, "utf8");
    const salmonDoc = readFileSync(salmonDocPath, "utf8");
    const componentReadme = readFileSync(componentReadmePath, "utf8");

    expect(existsSync(docPath)).toBe(true);
    expect(existsSync(cleanupDocPath)).toBe(true);
    expect(existsSync(reviewShellDocPath)).toBe(true);
    expect(existsSync(salmonDocPath)).toBe(true);
    expect(existsSync(componentReadmePath)).toBe(true);
    expect(readme).toContain("docs/TRACK_B_APP_SHELL_V2.md");
    expect(readme).toContain("docs/TRACK_B_SHELL_NAVIGATION_CLEANUP.md");
    expect(readme).toContain("docs/TRACK_B_REVIEW_SHELL_CONSISTENCY.md");
    expect(readme).toContain("docs/TRACK_B_SALMON_BRAND_TOKENS.md");
    expect(doc).toContain("Today -> Save -> Review -> Queue -> Early Access");
    expect(doc).toContain("No payment, billing, subscription");
    expect(doc).toContain("#74 should use this foundation");
    expect(cleanupDoc).toContain("skip link is the first meaningful tab stop");
    expect(cleanupDoc).toContain("one `main` landmark");
    expect(cleanupDoc).toContain("Public paid beta remains **No-Go**");
    expect(reviewShellDoc).toContain("Review routes bypass the legacy root `AppShell`");
    expect(reviewShellDoc).toContain("Confidence still appears before feedback");
    expect(reviewShellDoc).toContain("Public paid beta remains **No-Go**");
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

test.describe("Track B shell navigation cleanup runtime contract", () => {
  for (const route of trackBAppShellRuntimeRoutes) {
    test(`${route} renders one Track B shell without the legacy primary nav`, async ({
      page
    }) => {
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator(".track-b-shell")).toHaveCount(1);
      await expect(page.locator(".app-shell")).toHaveCount(0);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(
        page.getByRole("navigation", { name: "Primary" })
      ).toHaveCount(0);
      await expect(
        page.getByRole("navigation", {
          name: "Track B learning navigation"
        })
      ).toHaveCount(1);
    });
  }

  test("makes the Track B skip link the first meaningful tab stop", async ({
    page
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const firstTabStopClassList = await page.evaluate(() => {
      const focusableSelector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
      ].join(",");

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => {
        const style = window.getComputedStyle(element);

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          !element.closest("[hidden], [inert]") &&
          element.tabIndex >= 0
        );
      });

      return Array.from(focusable[0]?.classList ?? []);
    });

    expect(firstTabStopClassList).toContain("track-b-shell__skip-link");

    const skipLink = page.locator(".track-b-shell__skip-link");
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });

  test("keeps mobile bottom navigation from consuming the main content padding", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    await expect(page.locator(".track-b-bottom-nav")).toBeVisible();

    const mobileSpacing = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>("#track-b-main");
      const bottomNav =
        document.querySelector<HTMLElement>(".track-b-bottom-nav");

      if (!main || !bottomNav) {
        return null;
      }

      const navRect = bottomNav.getBoundingClientRect();
      const mainStyles = window.getComputedStyle(main);

      return {
        mainPaddingBottom: Number.parseFloat(mainStyles.paddingBottom),
        navBottom: navRect.bottom,
        navHeight: navRect.height,
        viewportHeight: window.innerHeight
      };
    });

    expect(mobileSpacing).not.toBeNull();
    expect(mobileSpacing!.mainPaddingBottom).toBeGreaterThan(
      mobileSpacing!.navHeight
    );
    expect(mobileSpacing!.navBottom).toBeLessThanOrEqual(
      mobileSpacing!.viewportHeight
    );
  });

  test("keeps the required Track B routes accessible with one main landmark", async ({
    page
  }) => {
    for (const route of requiredAccessibleRoutes) {
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.getByRole("main"), route).toHaveCount(1);
      await expect(page.locator("body"), route).not.toContainText(
        "This page could not be found"
      );
    }
  });

  test("keeps the approved dashboard, save, and pricing shell CTAs intact", async ({
    page
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", {
        name: "Start review"
      })
    ).toHaveCount(1);

    await page.goto("/save?slug=dissonance&source=word_page", {
      waitUntil: "networkidle"
    });
    await expect(page.getByRole("link", { name: "Review now" })).toHaveAttribute(
      "href",
      "/review?mode=word&slug=dissonance&limit=5"
    );
    await expect(
      page.getByRole("link", { name: "Go to dashboard" })
    ).toHaveAttribute("href", "/dashboard");

    await page.goto("/pricing", { waitUntil: "networkidle" });
    await expect(
      page.getByText("No checkout is live.")
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Checkout");
    await expect(page.locator("body")).not.toContainText("Subscribe now");
  });
});
