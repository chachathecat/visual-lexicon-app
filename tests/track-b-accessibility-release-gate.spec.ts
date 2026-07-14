import { expect, test, type Locator, type Page } from "@playwright/test";

const approvedStorageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1"
] as const;

const cleanupStorageKeys = [
  ...approvedStorageKeys,
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const fixedPast = "2026-06-19T10:00:00.000Z";
const fixedFuture = "2026-07-20T10:00:00.000Z";

const dissonance = {
  slug: "dissonance",
  word: "Dissonance",
  image: "https://cdn.visuallexicon.org/images/dissonance.webp",
  definition: "A clash between sounds, ideas, or feelings.",
  hub: "academic-vocabulary"
} as const;

const seededRoutes = [
  "/dashboard",
  "/save?slug=dissonance&source=word_page",
  "/review?mode=word&slug=dissonance&limit=1",
  "/saved",
  "/pricing"
] as const;

async function seedCoreLoopState(page: Page) {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ cleanupStorageKeys, dissonance, fixedFuture, fixedPast }) => {
      for (const key of cleanupStorageKeys) {
        localStorage.removeItem(key);
      }

      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify({
          dissonance: {
            ...dissonance,
            source: "word_page",
            savedAt: fixedPast
          }
        })
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify({
          dissonance: {
            ...dissonance,
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
            slug: "obfuscate",
            word: "Obfuscate",
            image: "https://cdn.visuallexicon.org/images/obfuscate.webp",
            definition: "To make something unclear or difficult to understand.",
            hub: "academic-vocabulary",
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
        })
      );
      localStorage.setItem("vlx_review_events_v1", "[]");
      localStorage.setItem("vlx_daily_stats_v1", "{}");
    },
    { cleanupStorageKeys, dissonance, fixedFuture, fixedPast }
  );
}

async function activeLabel(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;

    return (
      active?.getAttribute("aria-label") ||
      active?.textContent?.replace(/\s+/g, " ").trim() ||
      active?.tagName ||
      ""
    );
  });
}

async function isFocused(locator: Locator) {
  return locator.first().evaluate((element) => element === document.activeElement);
}

async function tabUntilFocused(page: Page, locator: Locator, maxTabs = 60) {
  await locator.first().waitFor({ state: "attached" });

  if (await isFocused(locator)) {
    return;
  }

  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");

    if (await isFocused(locator)) {
      return;
    }
  }

  throw new Error(`Expected focus on target, last focus was ${await activeLabel(page)}`);
}

async function expectVisibleFocus(page: Page) {
  const focusStyle = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;

    if (!active) {
      return null;
    }

    const style = getComputedStyle(active);

    return {
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    };
  });

  expect(focusStyle).not.toBeNull();
  expect(
    focusStyle?.outlineStyle !== "none" ||
      focusStyle?.outlineWidth !== "0px" ||
      focusStyle?.boxShadow !== "none"
  ).toBeTruthy();
}

function maxDurationMs(value: string) {
  return Math.max(
    ...value.split(",").map((part) => {
      const duration = part.trim();

      if (duration.endsWith("ms")) {
        return Number.parseFloat(duration);
      }

      if (duration.endsWith("s")) {
        return Number.parseFloat(duration) * 1000;
      }

      return 0;
    })
  );
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectMinimumTargetSize(locator: Locator, minimumSize = 44) {
  const targets = await locator.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();

      return {
        height: Math.round(rect.height),
        label:
          element.getAttribute("aria-label") ||
          element.textContent?.replace(/\s+/g, " ").trim() ||
          element.tagName,
        width: Math.round(rect.width)
      };
    })
  );

  expect(targets.length).toBeGreaterThan(0);
  expect(
    targets.filter(
      (target) => target.width < minimumSize || target.height < minimumSize
    )
  ).toEqual([]);
}

test.describe("Track B accessibility release gate", () => {
  test("keyboard-only dashboard to review feedback to summary flow", async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedCoreLoopState(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const startReview = page.getByRole("link", {
      name: /start due review/i
    });
    await tabUntilFocused(page, startReview);
    await expectVisibleFocus(page);
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/review\/due/);
    const correctAnswer = page.getByRole("button", { name: "Dissonance" });
    await tabUntilFocused(page, correctAnswer);
    await page.keyboard.press("Space");

    const knewIt = page.getByRole("button", { name: "I knew it" });
    await tabUntilFocused(page, knewIt);
    await page.keyboard.press("Enter");

    const summaryButton = page.getByRole("button", { name: "View summary" });
    await expect.poll(() => isFocused(summaryButton)).toBe(true);
    await expectVisibleFocus(page);
    await page.keyboard.press("Enter");

    await expect(page.locator(".review-v2-summary")).toBeVisible();
    await expect
      .poll(() => isFocused(page.locator(".review-v2-summary__header h3")))
      .toBe(true);
  });

  test("desktop focus order starts with skip, brand, then primary navigation", async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedCoreLoopState(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });

    await tabUntilFocused(
      page,
      page.getByRole("link", { name: "Skip to learning content" }),
      3
    );
    await tabUntilFocused(
      page,
      page.getByRole("link", { name: "Visual Lexicon Today dashboard" }),
      3
    );
    await tabUntilFocused(
      page,
      page.getByRole("link", { name: "Dashboard memory mission" }),
      3
    );
    await tabUntilFocused(page, page.getByRole("link", { name: "Save Word" }), 3);
    await tabUntilFocused(
      page,
      page.getByRole("link", { name: "Review words" }),
      3
    );

    await expectVisibleFocus(page);
  });

  test("mobile focus is not obscured by the bottom navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedCoreLoopState(page);
    await page.goto("/saved", { waitUntil: "networkidle" });

    for (let index = 0; index < 18; index += 1) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(20);

      const overlap = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        const bottomNav = document.querySelector(".track-b-bottom-nav");

        if (!active || !bottomNav) {
          return null;
        }

        const style = getComputedStyle(active);
        const rect = active.getBoundingClientRect();
        const navRect = bottomNav.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          hidden:
            active.tagName === "BODY" ||
            !active.matches(
              'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
            ) ||
            rect.width === 0 ||
            rect.height === 0 ||
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0",
          inBottomNav: Boolean(active.closest(".track-b-bottom-nav")),
          navTop: navRect.top,
          top: rect.top
        };
      });

      if (!overlap || overlap.hidden || overlap.inBottomNav) {
        continue;
      }

      expect(overlap.top).toBeGreaterThanOrEqual(0);
      expect(overlap.bottom).toBeLessThanOrEqual(overlap.navTop - 1);
    }
  });

  test("save success is announced with a single polite status region", async ({
    page
  }) => {
    await seedCoreLoopState(page);
    await page.goto("/save?slug=dissonance&source=word_page", {
      waitUntil: "networkidle"
    });

    const liveRegion = page.getByTestId("save-live-region");

    await expect(liveRegion).toHaveAttribute("role", "status");
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");
    await expect(liveRegion).toContainText("Dissonance");
    await expect(liveRegion).toContainText("Memory state");
    await expect(page.locator('[role="status"]')).toHaveCount(1);
  });

  test("Review v2 feedback announcements remain singular and state-aware", async ({
    page
  }) => {
    await seedCoreLoopState(page);
    await page.goto("/review?mode=word&slug=dissonance&limit=1", {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: "I knew it" }).click();

    const liveRegion = page.getByTestId("review-live-region");
    await expect(liveRegion).toHaveAttribute("role", "status");
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");
    await expect(liveRegion).toContainText(/Correct.*Dissonance/i);
    await expect(liveRegion).toContainText("Memory state updated");
    await expect(page.locator('[role="status"]')).toHaveCount(1);

    await seedCoreLoopState(page);
    await page.goto("/review?mode=word&slug=dissonance&limit=1", {
      waitUntil: "networkidle"
    });

    await page
      .locator(".review-options button")
      .filter({ hasNotText: "Dissonance" })
      .first()
      .click();
    await page.getByRole("button", { name: "I forgot" }).click();

    await expect(page.getByTestId("review-live-region")).toContainText(
      /Wrong.*Dissonance/i
    );
    await expect(page.getByTestId("review-live-region")).toContainText(
      "Memory state updated"
    );
    await expect(page.locator('[role="status"]')).toHaveCount(1);
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ] as const) {
    test(`Review v2 interactive targets remain at least 44 by 44 pixels on ${viewport.name}`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await seedCoreLoopState(page);
      await page.goto("/review?mode=word&slug=dissonance&limit=1", {
        waitUntil: "networkidle"
      });

      await expectMinimumTargetSize(page.locator(".review-options button"));

      await page.getByRole("button", { name: "Dissonance" }).click();
      await expectMinimumTargetSize(
        page.locator(".review-v2-confidence__buttons button")
      );

      await page.getByRole("button", { name: "I knew it" }).click();
      await expectMinimumTargetSize(
        page.getByRole("button", { name: "View summary" })
      );

      await page.getByRole("button", { name: "View summary" }).click();
      await expectMinimumTargetSize(
        page.locator(".review-v2-summary .track-b-action-row").locator("a, button")
      );
    });
  }

  for (const route of seededRoutes) {
    test(`heading and landmark contract: ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await seedCoreLoopState(page);
      await page.goto(route, { waitUntil: "networkidle" });

      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.getByRole("navigation").first()).toBeAttached();

      const headingLevels = await page
        .locator("main h1, main h2, main h3, main h4, main h5, main h6")
        .evaluateAll((headings) =>
          headings.map((heading) => Number(heading.tagName.slice(1)))
        );

      expect(headingLevels[0]).toBe(1);

      for (let index = 1; index < headingLevels.length; index += 1) {
        expect(headingLevels[index] - headingLevels[index - 1]).toBeLessThanOrEqual(
          1
        );
      }
    });
  }

  test("learning image alt contracts are exposed through named image roles", async ({
    page
  }) => {
    for (const route of [
      "/dashboard",
      "/save?slug=dissonance&source=word_page",
      "/review?mode=word&slug=dissonance&limit=1",
      "/saved"
    ]) {
      await seedCoreLoopState(page);
      await page.goto(route, { waitUntil: "networkidle" });

      await expect(
        page.getByRole("img", { name: /Visual cue for Dissonance/i }).first()
      ).toBeVisible();

      const nativeImageAlts = await page.locator("img").evaluateAll((images) =>
        images.map((image) => image.getAttribute("alt"))
      );

      expect(nativeImageAlts.every((alt) => alt === "")).toBe(true);
    }
  });

  test("320px reflow smoke has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    for (const route of seededRoutes) {
      await seedCoreLoopState(page);
      await page.goto(route, { waitUntil: "networkidle" });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("200 percent zoom equivalent reflow smoke has no horizontal overflow", async ({
    page
  }) => {
    await page.setViewportSize({ width: 720, height: 900 });

    for (const route of seededRoutes) {
      await seedCoreLoopState(page);
      await page.goto(route, { waitUntil: "networkidle" });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("reduced-motion smoke removes route transition duration", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seedCoreLoopState(page);
    await page.goto("/review?mode=word&slug=dissonance&limit=1", {
      waitUntil: "networkidle"
    });

    const transitionDuration = await page
      .locator(".review-options button")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);

    expect(maxDurationMs(transitionDuration)).toBeLessThanOrEqual(1);
  });

  test("interactive targets meet WCAG 2.2 minimum dimensions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of seededRoutes) {
      await seedCoreLoopState(page);
      await page.goto(route, { waitUntil: "networkidle" });

      const undersized = await page.evaluate(() => {
        const targets = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
          )
        );

        return targets
          .filter((target) => {
            const style = getComputedStyle(target);

            return (
              target.getClientRects().length > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              style.opacity !== "0" &&
              !target.hasAttribute("disabled") &&
              target.getAttribute("aria-hidden") !== "true"
            );
          })
          .map((target) => {
            const rect = target.getBoundingClientRect();

            return {
              height: Math.round(rect.height),
              label:
                target.getAttribute("aria-label") ||
                target.textContent?.replace(/\s+/g, " ").trim() ||
                target.tagName,
              tag: target.tagName,
              width: Math.round(rect.width)
            };
          })
          .filter((target) => target.width < 24 || target.height < 24);
      });

      expect(undersized, `${route} undersized targets`).toEqual([]);
    }
  });
});
