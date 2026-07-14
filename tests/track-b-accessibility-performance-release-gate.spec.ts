import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();
const fixedPast = "2026-06-19T10:00:00.000Z";
const fixedFuture = "2026-07-20T10:00:00.000Z";
const academicPreviewReviewHref =
  "/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview";

const releaseGateRoutes = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings"
] as const;

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const forbiddenRouteDirectories = [
  "src/app/checkout",
  "src/app/billing",
  "src/app/payment",
  "src/app/payments",
  "src/app/api/checkout",
  "src/app/api/billing",
  "src/app/api/payment",
  "src/app/api/payments"
] as const;

const forbiddenDependencyFragments = [
  "stripe",
  "paddle",
  "lemon",
  "lemonsqueezy",
  "lemon-squeezy"
] as const;

const approvedRuntimeDependencies = [
  "@supabase/ssr",
  "@supabase/supabase-js",
  "next",
  "react",
  "react-dom"
] as const;

const forbiddenPaidAccessClaims =
  /checkout enabled|billing connected|billing active|payment active|paid access granted|paid entitlement granted|subscription active|subscription is active|public paid beta is live|public paid beta launched|public paid beta is launched|public beta launched/i;

const words = {
  dissonance: {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary"
  },
  obfuscate: {
    slug: "obfuscate",
    word: "Obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    hub: "academic-vocabulary"
  },
  lucid: {
    slug: "lucid",
    word: "Lucid",
    image: "https://cdn.visuallexicon.org/images/lucid.webp",
    definition: "Clear and easy to understand.",
    hub: "academic-vocabulary"
  },
  premature: {
    slug: "premature",
    word: "Premature",
    image: "https://cdn.visuallexicon.org/images/lucid.webp",
    definition: "Marked as mastered before delayed recall evidence.",
    hub: "academic-vocabulary"
  }
} as const;

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedReleaseGateState(page: Page) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ fixedFuture, fixedPast, words }) => {
      const savedWords = {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt: fixedPast
        },
        obfuscate: {
          ...words.obfuscate,
          source: "word_page",
          savedAt: fixedPast
        },
        lucid: {
          ...words.lucid,
          source: "word_page",
          savedAt: fixedPast
        }
      };
      const reviewState = {
        dissonance: {
          ...words.dissonance,
          box: 1,
          mastery: "Learning",
          correct: 1,
          wrong: 0,
          streakCorrect: 1,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedPast,
          weakScore: 0,
          avgResponseMs: 900,
          lastQuestionType: "due_review",
          createdAt: fixedPast,
          updatedAt: fixedPast
        },
        obfuscate: {
          ...words.obfuscate,
          box: 0,
          mastery: "Weak",
          correct: 1,
          wrong: 2,
          streakCorrect: 0,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedFuture,
          weakScore: 0.72,
          avgResponseMs: 2400,
          lastQuestionType: "weak_review",
          createdAt: fixedPast,
          updatedAt: fixedPast
        },
        lucid: {
          ...words.lucid,
          box: 5,
          mastery: "Mastered",
          correct: 6,
          wrong: 0,
          streakCorrect: 6,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedFuture,
          weakScore: 0,
          avgResponseMs: 820,
          lastQuestionType: "due_review",
          createdAt: fixedPast,
          updatedAt: fixedPast
        }
      };
      const reviewEvents = [
        {
          sessionId: "s_release_gate_due",
          slug: "dissonance",
          word: "Dissonance",
          hub: "academic-vocabulary",
          questionType: "due_review",
          selected: "Dissonance",
          answer: "Dissonance",
          result: "correct",
          responseMs: 900,
          createdAt: fixedPast,
          boxAfter: 1,
          weakScoreAfter: 0
        },
        {
          sessionId: "s_release_gate_weak",
          slug: "obfuscate",
          word: "Obfuscate",
          hub: "academic-vocabulary",
          questionType: "weak_review",
          selected: "Clarify",
          answer: "Obfuscate",
          result: "wrong",
          responseMs: 2400,
          createdAt: fixedPast,
          boxAfter: 0,
          weakScoreAfter: 0.72
        }
      ];

      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
      localStorage.setItem("vlx_review_state_v1", JSON.stringify(reviewState));
      localStorage.setItem("vlx_review_events_v1", JSON.stringify(reviewEvents));
      localStorage.setItem(
        "vlx_daily_stats_v1",
        JSON.stringify({
          "2026-06-19": {
            date: "2026-06-19",
            reviewed: 2,
            correct: 1,
            wrong: 1,
            mastered: 0,
            weakAdded: 1,
            minutes: 1,
            sessions: 1
          }
        })
      );
      localStorage.setItem("vlx_pack_progress_v1", JSON.stringify({}));
    },
    { fixedFuture, fixedPast, words }
  );
}

async function seedFakeMasteryState(page: Page) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ fixedFuture, fixedPast, words }) => {
      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify({
          lucid: {
            ...words.lucid,
            source: "word_page",
            savedAt: fixedPast
          },
          premature: {
            ...words.premature,
            source: "word_page",
            savedAt: fixedPast
          }
        })
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify({
          lucid: {
            ...words.lucid,
            box: 5,
            mastery: "Mastered",
            correct: 6,
            wrong: 0,
            streakCorrect: 6,
            lastReviewedAt: fixedPast,
            nextDueAt: fixedFuture,
            weakScore: 0,
            createdAt: fixedPast,
            updatedAt: fixedPast
          },
          premature: {
            ...words.premature,
            box: 4,
            mastery: "Mastered",
            correct: 4,
            wrong: 0,
            streakCorrect: 4,
            lastReviewedAt: fixedPast,
            nextDueAt: fixedFuture,
            weakScore: 0,
            createdAt: fixedPast,
            updatedAt: fixedPast
          }
        })
      );
      localStorage.setItem("vlx_review_events_v1", JSON.stringify([]));
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));
    },
    { fixedFuture, fixedPast, words }
  );
}

async function seedPaywallTriggerState(page: Page) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ fixedPast, words }) => {
      const savedWords = Object.fromEntries(
        Array.from({ length: 51 }, (_, index) => {
          const slug = `saved-${index + 1}`;

          return [
            slug,
            {
              ...words.dissonance,
              slug,
              word: `Saved ${index + 1}`,
              source: "word_page",
              savedAt: fixedPast
            }
          ];
        })
      );

      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
      localStorage.setItem("vlx_review_state_v1", JSON.stringify({}));
      localStorage.setItem("vlx_review_events_v1", JSON.stringify([]));
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));
      localStorage.setItem("vlx_pack_progress_v1", JSON.stringify({}));
    },
    { fixedPast, words }
  );
}

test.describe("Track B accessibility / performance release gate", () => {
  for (const route of releaseGateRoutes) {
    test(`route smoke remains unblocked: ${route}`, async ({ page }) => {
      await seedReleaseGateState(page);

      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "networkidle"
      });

      expect(response?.status(), route).toBe(200);
      await expect(page.getByRole("main"), route).toHaveCount(1);
      await expect(page.locator("main h1"), route).toHaveCount(1);
      await expect(page.locator("body"), route).not.toContainText(
        "This page could not be found"
      );
      await expect(page.locator("body"), route).not.toContainText(
        "Application error"
      );
    });
  }

  test("primary CTAs and review actions have accessible names", async ({ page }) => {
    await seedReleaseGateState(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start due review" })
    ).toHaveAttribute("href", "/review/due");

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start due review" })
    ).toHaveAttribute("href", "/review/due");
    await expect(
      page.getByRole("link", { name: "Review Dissonance" })
    ).toHaveAttribute("href", "/review/due");

    await page.goto(`${baseUrl}/review/due`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Dissonance" })).toBeEnabled();
    await page.getByRole("button", { name: "Dissonance" }).click();
    await expect(page.getByRole("button", { name: "I knew it" })).toBeEnabled();

    await seedReleaseGateState(page);
    await page.goto(`${baseUrl}/review/weak`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Obfuscate" })).toBeEnabled();

    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start free review" })
    ).toHaveAttribute("href", "/dashboard");
    await expect(
      page.getByRole("button", {
        name: "I'm interested in Lite"
      })
    ).toBeVisible();

    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Start Academic preview" })
    ).toHaveAttribute("href", "/packs/academic-vocabulary");
    await expect(
      page.getByRole("link", { name: "Start preview Academic Vocabulary" }).first()
    ).toHaveAttribute("href", academicPreviewReviewHref);

    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });
    await expect(
      page.getByRole("link", { name: "Start preview Academic Vocabulary" })
    ).toHaveAttribute("href", academicPreviewReviewHref);
  });

  test("/pricing early-access copy remains clear and interest-only", async ({
    page
  }) => {
    await seedReleaseGateState(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).toContain("Early access preview");
    expect(bodyText).toContain("Paid plans aren't available to purchase yet");
    expect(bodyText).toContain("no payment is taken");
    expect(bodyText).toContain("no paid features are unlocked");
    expect(bodyText).not.toMatch(/no-go|owner approval|entitlement|paywall/i);
    expect(bodyText).not.toMatch(forbiddenPaidAccessClaims);

    await page
      .getByRole("button", {
        name: "I'm interested in Lite"
      })
      .click();
    await expect(page.locator(".upgrade-placeholder__note")).toContainText(
      "Interest saved on this device. No charge was made"
    );

    const localPlanState = await page.evaluate(() =>
      localStorage.getItem("vlx_plan_state_v1")
    );

    expect(localPlanState).toBeNull();
  });

  test("settings paywall prompt stays accessible and interest-only", async ({
    page
  }) => {
    await seedPaywallTriggerState(page);
    await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });

    const prompt = page.locator("[data-paywall-trigger='save_limit']").first();

    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText("Public paid beta remains No-Go");

    const interestButton = prompt.getByRole("button", {
      name: "Note Lite interest - billing not connected yet"
    });

    await expect(interestButton).toBeEnabled();
    await interestButton.click();
    await expect(prompt.getByRole("status")).toContainText(
      "Paid beta interest noted locally. Billing is not connected yet."
    );

    const localPlanState = await page.evaluate(() =>
      localStorage.getItem("vlx_plan_state_v1")
    );
    const upgradeInterest = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("vlx_upgrade_interest_v1") ?? "[]")
    );

    expect(localPlanState).toBeNull();
    expect(Array.isArray(upgradeInterest)).toBe(true);
    expect(upgradeInterest).toEqual([
      expect.objectContaining({
        plan: "lite",
        source: "settings_save_limit",
        trigger: "save_limit"
      })
    ]);
  });

  test("Mastered counts ignore fake mastery without box 5 delayed recall", async ({
    page
  }) => {
    await seedFakeMasteryState(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });

    await expect(page.getByLabel("Mastered: 1")).toBeVisible();
    await expect(page.getByLabel("Mastered: 2")).toHaveCount(0);

    await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: /Mastered/ }).click();

    const masteredPanel = page.locator("#saved-v2-panel-mastered");

    await expect(masteredPanel).toContainText("Lucid");
    await expect(masteredPanel).not.toContainText("Premature");
  });

  test("forbidden payment routes and dependencies are absent", () => {
    for (const routeDirectory of forbiddenRouteDirectories) {
      expect(
        existsSync(join(workspaceRoot, routeDirectory)),
        routeDirectory
      ).toBe(false);
    }

    const packageJson = JSON.parse(readWorkspaceFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const runtimeDependencies = Object.keys(packageJson.dependencies ?? {}).sort();
    const allDependencyNames = Object.keys({
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {})
    });

    expect(runtimeDependencies).toEqual([...approvedRuntimeDependencies].sort());

    for (const dependencyName of allDependencyNames) {
      const normalizedName = dependencyName.toLowerCase();

      expect(
        forbiddenDependencyFragments.some((fragment) =>
          normalizedName.includes(fragment)
        ),
        dependencyName
      ).toBe(false);
    }
  });

  test("release gate docs, visual parity, and safety terms stay wired", () => {
    const docPath = join(
      workspaceRoot,
      "docs",
      "TRACK_B_ACCESSIBILITY_PERFORMANCE_RELEASE_GATE.md"
    );
    const snapshotDir = join(
      workspaceRoot,
      "tests",
      "figma-parity-screenshots.spec.ts-snapshots"
    );
    const doc = readFileSync(docPath, "utf8");
    const normalizedDoc = doc.toLowerCase();
    const readme = readWorkspaceFile("README.md");
    const figmaSpec = readWorkspaceFile("tests", "figma-parity-screenshots.spec.ts");
    const snapshotFiles = readdirSync(snapshotDir).filter((fileName) =>
      fileName.endsWith(".png")
    );

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain(
      "docs/TRACK_B_ACCESSIBILITY_PERFORMANCE_RELEASE_GATE.md"
    );
    expect(normalizedDoc).toContain("keyboard navigation");
    expect(normalizedDoc).toContain("visible focus states");
    expect(normalizedDoc).toContain("accessible names for primary ctas");
    expect(normalizedDoc).toContain("status and summary text");
    expect(normalizedDoc).toContain("no inaccessible paywall prompt");
    expect(normalizedDoc).toContain("mobile one-hand review ergonomics");
    expect(normalizedDoc).toContain("build must pass");
    expect(normalizedDoc).toContain("route smoke must pass");
    expect(normalizedDoc).toContain("no heavy new runtime dependency");
    expect(normalizedDoc).toContain("no public paid beta safety regression");
    expect(doc).toContain("Visual screenshot parity");
    expect(doc).toContain("No Webflow, Cloudflare Workers, auth, billing");
    expect(figmaSpec).toContain("toHaveScreenshot");
    expect(snapshotFiles.length).toBeGreaterThanOrEqual(14);
  });
});
