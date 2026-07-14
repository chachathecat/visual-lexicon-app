import { expect, test, type Page } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const learningStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1"
] as const;

const learnerFacingInternalTerms =
  /nextDueAt|weakScore|\bBox [0-5]\b|box 5|real local|local saved-word storage|stale review state|no review state/i;
const reviewInternalTerms =
  /\bBox\b|weak score|weakScore|real weak queue count|\bSRS\b|memory state updated|local storage|vlx_|rollback|malformed/i;

async function seedDueWord(page: Page) {
  const now = new Date();
  const savedAt = new Date(now.getTime() - 60 * 60_000).toISOString();
  const nextDueAt = new Date(now.getTime() - 60_000).toISOString();

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ keys, dueAt, saved }) => {
      keys.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify({
          dissonance: {
            slug: "dissonance",
            word: "Dissonance",
            definition: "A clash between sounds, ideas, or feelings.",
            hub: "academic-vocabulary",
            source: "word_page",
            savedAt: saved
          }
        })
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify({
          dissonance: {
            slug: "dissonance",
            word: "Dissonance",
            definition: "A clash between sounds, ideas, or feelings.",
            hub: "academic-vocabulary",
            box: 1,
            mastery: "Learning",
            correct: 1,
            wrong: 0,
            streakCorrect: 1,
            nextDueAt: dueAt,
            weakScore: 0,
            createdAt: saved,
            updatedAt: saved
          }
        })
      );
      localStorage.setItem("vlx_review_events_v1", "[]");
      localStorage.setItem("vlx_daily_stats_v1", "{}");
      localStorage.setItem("vlx_pack_progress_v1", "{}");
    },
    { keys: learningStorageKeys, dueAt: nextDueAt, saved: savedAt }
  );
}

test.describe("World-class UX acceptance", () => {
  test("keeps the learner shell and dashboard focused on one next action", async ({
    page
  }) => {
    await seedDueWord(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("navigation", { name: "Track B learning navigation" })
    ).not.toContainText(/Components|Tokens/);
    await expect(
      page.locator(".track-b-shell__main .track-b-button--primary")
    ).toHaveCount(1);

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(learnerFacingInternalTerms);
  });

  test("shows the mobile dashboard action without a viewport-height spacer", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedDueWord(page);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });

    const cta = page.locator(".dashboard-v3-primary-cta");
    await expect(cta).toBeVisible();

    const [ctaBox, missionBox] = await Promise.all([
      cta.boundingBox(),
      page.locator(".dashboard-v3-mission").boundingBox()
    ]);

    expect(ctaBox).not.toBeNull();
    expect(missionBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(844);
    expect(missionBox!.height).toBeLessThan(720);
  });

  test("keeps Saved summaries compact and card metadata learner-facing", async ({
    page
  }) => {
    await seedDueWord(page);
    await page.goto(`${baseUrl}/saved`, { waitUntil: "domcontentloaded" });

    await expect(page.locator(".saved-v2-state-card")).toHaveCount(3);
    await expect(
      page.locator('[data-saved-word="dissonance"] .saved-v2-token')
    ).toHaveCount(3);
    await expect(
      page.locator('[data-saved-word="dissonance"]')
    ).toContainText("Ready to review");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(learnerFacingInternalTerms);
  });

  test("keeps Review feedback and summary in learner language", async ({
    page
  }) => {
    await seedDueWord(page);
    await page.goto(`${baseUrl}/review/due?limit=1`, {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: "I knew it" }).click();

    const feedback = page.locator(".review-v2-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("Memory status");
    expect(await feedback.innerText()).not.toMatch(reviewInternalTerms);

    await page.getByRole("button", { name: "View summary" }).click();

    const summary = page.locator(".review-v2-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Needs practice");
    expect(await summary.innerText()).not.toMatch(reviewInternalTerms);
  });
});
