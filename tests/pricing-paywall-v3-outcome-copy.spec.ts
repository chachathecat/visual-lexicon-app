import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluateExamPackPreviewEndPaywall,
  evaluateMasteryExportLockedPaywall,
  evaluateMistakeExplanationLockedPaywall,
  evaluateNoWatermarkDownloadPaywall,
  evaluateReviewLimitPaywall,
  evaluateSaveLimitPaywall,
  evaluateWeakWordsSprintLockedPaywall
} from "../src/lib/paywall";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();

const forbiddenRoutePaths = [
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

const forbiddenRealEntitlementClaims =
  /checkout enabled|billing connected|subscription active|public paid beta launched|public beta launched|paid entitlement granted|paid access granted|payment active/i;

function readWorkspaceFile(...segments: string[]) {
  return readFileSync(join(workspaceRoot, ...segments), "utf8");
}

test.describe("Pricing / Paywall v3 outcome copy", () => {
  test("/pricing loads with outcome-first heading", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator(".track-b-shell")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Choose how you want to remember."
      })
    ).toBeVisible();
  });

  test("plan cards lead with v3 memory outcomes", async ({ page }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    await expect(page.locator('[data-plan-id="free"]')).toContainText(
      "Start remembering your first saved words."
    );
    await expect(page.locator('[data-plan-id="lite"]')).toContainText(
      "Build a daily visual memory habit."
    );
    await expect(page.locator('[data-plan-id="pro"]')).toContainText(
      "Fix weak words and prepare for Academic / IELTS / GRE vocabulary."
    );
    await expect(page.locator('[data-plan-id="exam_pack"]')).toContainText(
      "Follow a guided visual vocabulary plan."
    );
  });

  test("pricing safety copy keeps public paid beta No-Go and owner-gated", async ({
    page
  }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).toMatch(/public paid beta no-go/i);
    expect(bodyText).toContain("Public paid beta remains No-Go");
    expect(bodyText).toContain("Private/manual beta requires owner approval");
    expect(bodyText).toContain("No real paid entitlement is active");
    expect(bodyText).not.toMatch(forbiddenRealEntitlementClaims);
  });

  test("no checkout payment or billing routes are added", () => {
    for (const routePath of forbiddenRoutePaths) {
      expect(existsSync(join(workspaceRoot, routePath)), routePath).toBe(false);
    }
  });

  test("no forbidden payment dependencies are added", () => {
    const packageJson = JSON.parse(readWorkspaceFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    });

    for (const dependencyName of dependencyNames) {
      const normalizedName = dependencyName.toLowerCase();

      expect(
        forbiddenDependencyFragments.some((fragment) =>
          normalizedName.includes(fragment)
        ),
        dependencyName
      ).toBe(false);
    }
  });

  test("paywall prompts use value moments without implying real entitlement", () => {
    const prompts = [
      evaluateSaveLimitPaywall({
        plan: "free",
        savedCount: 50,
        source: "save_confirmation"
      }),
      evaluateReviewLimitPaywall({
        plan: "guest",
        dailyReviewedCount: 10,
        source: "review_session"
      }),
      evaluateExamPackPreviewEndPaywall({
        plan: "lite",
        packId: "academic-vocabulary",
        previewCompleted: true,
        source: "pack_preview"
      }),
      evaluateWeakWordsSprintLockedPaywall({
        plan: "lite",
        weakCount: 3,
        source: "weak_sprint"
      }),
      evaluateMasteryExportLockedPaywall({
        plan: "lite",
        masteredCount: 2,
        source: "mastery_export"
      }),
      evaluateNoWatermarkDownloadPaywall({
        plan: "free",
        slug: "lucid",
        source: "word_download"
      }),
      evaluateMistakeExplanationLockedPaywall({
        plan: "free",
        wrongCount: 2,
        slug: "dissonance",
        source: "review_feedback"
      })
    ];

    expect(prompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "save_limit",
          recommendedPlan: "lite",
          body: expect.stringContaining(
            "Your memory library is full. Lite is planned for expanded saved words and daily review capacity."
          )
        }),
        expect.objectContaining({
          id: "review_limit",
          recommendedPlan: "lite",
          body: expect.stringContaining(
            "You rescued today's free cards. Lite is planned for keeping daily review moving before words fade."
          )
        }),
        expect.objectContaining({
          id: "pack_preview_end",
          recommendedPlan: "pro",
          primaryCtaLabel: "Note Pro interest - billing not connected yet",
          body: expect.stringContaining(
            "You started the 30-day Academic plan. Pro guided pack access is planned for a future owner-gated beta."
          )
        }),
        expect.objectContaining({
          id: "weak_words_sprint_locked",
          recommendedPlan: "pro",
          body: expect.stringContaining(
            "You have weak words waiting. Pro is planned for focused weak-word practice after owner approval."
          )
        }),
        expect.objectContaining({
          id: "no_watermark_download",
          body: expect.stringContaining(
            "No-watermark export is planned for a future approved implementation."
          )
        }),
        expect.objectContaining({
          id: "mistake_explanation_locked",
          body: expect.stringContaining(
            "AI mistake explanations are planned for a future approved implementation after the SRS loop works."
          )
        })
      ])
    );

    for (const prompt of prompts) {
      expect(prompt).toBeTruthy();
      expect(prompt?.body).toContain("Billing is not connected yet");
      expect(prompt?.body).toContain("No checkout is live");
      expect(prompt?.body).toContain("No real paid entitlement is active");
      expect(prompt?.body).toContain("does not grant paid access");
      expect(prompt?.body).not.toMatch(forbiddenRealEntitlementClaims);
    }
  });
});
