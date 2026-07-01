import { expect, test, type Page } from "@playwright/test";

test.use({
  colorScheme: "light",
  deviceScaleFactor: 1,
  locale: "en-US",
  timezoneId: "Asia/Seoul"
});

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const fixedPast = "2026-06-19T10:00:00.000Z";
const fixedNow = "2026-06-20T08:20:00.000Z";
const fixedFuture = "2026-07-20T10:00:00.000Z";

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const viewports = [
  { name: "desktop", width: 1440, height: 1100 },
  { name: "mobile", width: 390, height: 844 }
] as const;

const words = {
  dissonance: {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary"
  },
  abundance: {
    slug: "abundance",
    word: "Abundance",
    image: "https://cdn.visuallexicon.org/images/abundance.webp",
    definition: "A large quantity of something useful or valuable.",
    hub: "core-vocabulary"
  },
  resilient: {
    slug: "resilient",
    word: "Resilient",
    image: "https://cdn.visuallexicon.org/images/resilient.webp",
    definition: "Able to recover after pressure, shock, or difficulty.",
    hub: "workplace-english"
  },
  lucid: {
    slug: "lucid",
    word: "Lucid",
    image: "https://cdn.visuallexicon.org/images/lucid.webp",
    definition: "Clear and easy to understand.",
    hub: "academic-vocabulary"
  },
  obfuscate: {
    slug: "obfuscate",
    word: "Obfuscate",
    image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
    definition: "To make something unclear or difficult to understand.",
    hub: "academic-vocabulary"
  }
} as const;

async function clearStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedStorage(page: Page) {
  await clearStorage(page);

  await page.evaluate(
    ({ fixedPast, fixedFuture, words }) => {
      const savedWords = {
        dissonance: {
          ...words.dissonance,
          source: "word_page",
          savedAt: fixedPast
        },
        abundance: {
          ...words.abundance,
          source: "word_page",
          savedAt: fixedPast
        },
        resilient: {
          ...words.resilient,
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
          box: 0,
          mastery: "Weak",
          correct: 0,
          wrong: 2,
          streakCorrect: 0,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedPast,
          weakScore: 0.72,
          createdAt: fixedPast,
          updatedAt: fixedPast
        },
        abundance: {
          ...words.abundance,
          box: 1,
          mastery: "Learning",
          correct: 1,
          wrong: 0,
          streakCorrect: 1,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedPast,
          weakScore: 0,
          createdAt: fixedPast,
          updatedAt: fixedPast
        },
        resilient: {
          ...words.resilient,
          box: 2,
          mastery: "Strong",
          correct: 2,
          wrong: 0,
          streakCorrect: 2,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedPast,
          weakScore: 0,
          createdAt: fixedPast,
          updatedAt: fixedPast
        },
        obfuscate: {
          ...words.obfuscate,
          box: 5,
          mastery: "Mastered",
          correct: 5,
          wrong: 0,
          streakCorrect: 5,
          lastReviewedAt: fixedPast,
          nextDueAt: fixedFuture,
          weakScore: 0,
          createdAt: fixedPast,
          updatedAt: fixedPast
        }
      };
      const reviewEvents = [
        {
          sessionId: "s_visual_seed",
          slug: "dissonance",
          word: "Dissonance",
          hub: "academic-vocabulary",
          questionType: "due_review",
          selected: "Harmony",
          answer: "Dissonance",
          result: "wrong",
          responseMs: 1400,
          createdAt: fixedPast,
          boxAfter: 0,
          weakScoreAfter: 0.72
        }
      ];

      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
      localStorage.setItem("vlx_review_state_v1", JSON.stringify(reviewState));
      localStorage.setItem("vlx_review_events_v1", JSON.stringify(reviewEvents));
      localStorage.setItem("vlx_daily_stats_v1", JSON.stringify({}));
      localStorage.setItem("vlx_pack_progress_v1", JSON.stringify({}));
    },
    { fixedPast, fixedFuture, words }
  );
}

async function prepareVisualPage(
  page: Page,
  viewport: (typeof viewports)[number]
) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(${JSON.stringify(fixedNow)}).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }
        }

        FixedDate.UTC = RealDate.UTC;
        FixedDate.parse = RealDate.parse;
        Date = FixedDate;
      })();
    `
  });
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await seedStorage(page);
}

async function waitForVisualAssets(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {
    // Some interactions do not trigger navigation; the DOM/image waits below
    // are the source of truth for screenshot readiness.
  });

  await page.evaluate(async () => {
    const withTimeout = (promise: Promise<unknown>) =>
      Promise.race([
        promise,
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 5000);
        })
      ]);

    if ("fonts" in document) {
      await withTimeout(document.fonts.ready);
    }

    await Promise.all(
      Array.from(document.images).map((image) => {
        if (image.complete) {
          return;
        }

        return withTimeout(image.decode().catch(() => undefined));
      })
    );

    const backgroundUrls = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .map((element) => getComputedStyle(element).backgroundImage)
      .flatMap((backgroundImage) =>
        Array.from(backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)).map(
          (match) => match[1]
        )
      )
      .filter((url) => url && !url.startsWith("data:"));

    await Promise.all(
      Array.from(new Set(backgroundUrls)).map(
        (url) =>
          withTimeout(
            new Promise<void>((resolve) => {
              const image = new Image();

              image.onload = () => resolve();
              image.onerror = () => resolve();
              image.src = url;
            })
          )
      )
    );

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  });
}

async function capture(page: Page, name: string) {
  await page.addStyleTag({
    content: `
      html {
        scroll-behavior: auto !important;
      }
      *, *::before, *::after {
        animation: none !important;
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition: none !important;
        transition-duration: 0s !important;
      }
      .review-v2-summary__header > span {
        visibility: hidden !important;
      }
    `
  });
  await waitForVisualAssets(page);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: "disabled",
    fullPage: true,
    maxDiffPixelRatio: 0.02
  });
}

for (const viewport of viewports) {
  test.describe(`Figma parity screenshots ${viewport.name}`, () => {
    test(`captures dashboard ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard-v2-due-row")).toHaveCount(3);
      await capture(page, `figma-parity-dashboard-${viewport.name}`);
    });

    test(`captures save ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
        waitUntil: "networkidle"
      });
      await expect(page.locator(".save-v2-confirm")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Dissonance" })).toBeVisible();
      await capture(page, `figma-parity-save-${viewport.name}`);
    });

    test(`captures review question ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
        waitUntil: "networkidle"
      });
      await expect(page.locator(".review-v2-card")).toBeVisible();
      await capture(page, `figma-parity-review-question-${viewport.name}`);
    });

    test(`captures review feedback ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
        waitUntil: "networkidle"
      });
      await page.getByRole("button", { name: "Dissonance" }).click();
      await page.getByRole("button", { name: /I knew it/ }).click();
      await expect(page.locator(".review-v2-feedback")).toBeVisible();
      await capture(page, `figma-parity-review-feedback-${viewport.name}`);
    });

    test(`captures review summary ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
        waitUntil: "networkidle"
      });
      await page.getByRole("button", { name: "Dissonance" }).click();
      await page.getByRole("button", { name: /I knew it/ }).click();
      await page.getByRole("button", { name: "View summary" }).click();
      await expect(page.locator(".review-v2-summary")).toBeVisible();
      await capture(page, `figma-parity-review-summary-${viewport.name}`);
    });

    test(`captures saved queue ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/saved`, { waitUntil: "networkidle" });
      await expect(page.locator(".saved-v2-queue-hero")).toBeVisible();
      await capture(page, `figma-parity-saved-queue-${viewport.name}`);
    });

    test(`captures pricing ${viewport.name}`, async ({ page }) => {
      await prepareVisualPage(page, viewport);
      await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });
      await expect(page.locator(".pricing-v2-beta-hero")).toBeVisible();
      await capture(page, `figma-parity-pricing-${viewport.name}`);
    });
  });
}
