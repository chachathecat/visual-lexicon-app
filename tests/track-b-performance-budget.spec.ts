import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const maxLocalVisualBytes = 500 * 1024;

const approvedLocalVisuals = [
  "abundance.png",
  "dissonance.png",
  "lucid.png",
  "obfuscate.png",
  "resilient.png"
] as const;

const approvedLocalVisualPaths = approvedLocalVisuals.map(
  (fileName) => `/vlx-word-visuals/${fileName}`
);
const googleFontsStylesheetHost = ["fonts", "googleapis", "com"].join(".");

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const fixedPast = "2026-06-19T10:00:00.000Z";
const fixedFuture = "2026-07-20T10:00:00.000Z";

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

const coreRoutes = [
  "/dashboard",
  "/save?slug=dissonance&source=word_page",
  "/review?mode=word&slug=dissonance&limit=1",
  "/saved",
  "/pricing"
] as const;

function readRepoFile(relativePath: string) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

async function seedPerformanceState(page: Page) {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ fixedFuture, fixedPast, storageKeys, words }) => {
      for (const key of storageKeys) {
        localStorage.removeItem(key);
      }

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

      localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
      localStorage.setItem("vlx_review_state_v1", JSON.stringify(reviewState));
      localStorage.setItem("vlx_review_events_v1", "[]");
      localStorage.setItem("vlx_daily_stats_v1", "{}");
      localStorage.setItem("vlx_pack_progress_v1", "{}");
    },
    { fixedFuture, fixedPast, storageKeys, words }
  );
}

test.describe("Track B performance budget", () => {
  test("keeps deterministic repository asset and font budgets", () => {
    const visualDir = path.join(rootDir, "public", "vlx-word-visuals");
    const visualFiles = fs
      .readdirSync(visualDir)
      .filter((fileName) => fileName.endsWith(".png"))
      .sort();

    expect(visualFiles).toEqual([...approvedLocalVisuals].sort());

    for (const fileName of visualFiles) {
      const stats = fs.statSync(path.join(visualDir, fileName));

      expect(stats.size, `${fileName} must stay under 500 KB`).toBeLessThanOrEqual(
        maxLocalVisualBytes
      );
    }

    const wordVisualsSource = readRepoFile("src/lib/word-visuals.ts");
    const localVisualReferences = Array.from(
      wordVisualsSource.matchAll(/["'](\/vlx-word-visuals\/[^"']+)["']/g),
      (match) => match[1]
    ).sort();

    expect(localVisualReferences).toEqual([...approvedLocalVisualPaths].sort());

    const globalsCss = readRepoFile("src/app/globals.css");

    expect(globalsCss).not.toContain(googleFontsStylesheetHost);
    expect(globalsCss).not.toMatch(
      new RegExp(
        `@import\\s+url\\(["']https:\\/\\/${googleFontsStylesheetHost.replaceAll(
          ".",
          "\\."
        )}`
      )
    );
  });

  test("keeps Figma parity and accessibility release gates wired", () => {
    const figmaSpec = readRepoFile("tests/figma-parity-screenshots.spec.ts");
    const accessibilitySpec = readRepoFile(
      "tests/track-b-accessibility-release-gate.spec.ts"
    );
    const snapshotDir = path.join(
      rootDir,
      "tests",
      "figma-parity-screenshots.spec.ts-snapshots"
    );
    const snapshotFiles = fs
      .readdirSync(snapshotDir)
      .filter((fileName) => fileName.endsWith(".png"));

    expect(figmaSpec).toContain("toHaveScreenshot");
    expect(snapshotFiles.length).toBeGreaterThanOrEqual(14);
    expect(accessibilitySpec).toContain("Track B accessibility release gate");
    expect(accessibilitySpec).toContain("320px reflow smoke has no horizontal overflow");
  });

  test("does not request a remote render-blocking font stylesheet", async ({
    page
  }) => {
    const remoteFontStylesheets: string[] = [];

    page.on("request", (request) => {
      if (
        request.resourceType() === "stylesheet" &&
        request.url().includes(googleFontsStylesheetHost)
      ) {
        remoteFontStylesheets.push(request.url());
      }
    });

    await seedPerformanceState(page);
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    expect(remoteFontStylesheets).toEqual([]);
  });

  test("uses approved local word visuals with stable rendered boxes", async ({
    page
  }) => {
    for (const route of [
      "/dashboard",
      "/save?slug=dissonance&source=word_page",
      "/review?mode=word&slug=dissonance&limit=1",
      "/saved"
    ]) {
      await seedPerformanceState(page);
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("img").first()).toBeVisible();

      const images = await page.locator("img").evaluateAll((elements) =>
        elements.map((element) => {
          const image = element as HTMLImageElement;
          const container = image.closest<HTMLElement>(".word-card__visual");
          const rect = image.getBoundingClientRect();
          const containerRect = container?.getBoundingClientRect();
          const containerStyle = container ? getComputedStyle(container) : null;
          const url = new URL(image.currentSrc || image.src, window.location.href);

          return {
            containerHeight: Math.round(containerRect?.height ?? 0),
            containerPosition: containerStyle?.position ?? "",
            containerWidth: Math.round(containerRect?.width ?? 0),
            height: Math.round(rect.height),
            loading: image.getAttribute("loading"),
            pathname: url.pathname,
            src: image.currentSrc || image.src,
            width: Math.round(rect.width)
          };
        })
      );

      expect(images.length, `${route} should render local word images`).toBeGreaterThan(0);

      for (const image of images) {
        expect(image.src, `${route} should not use CDN word images`).not.toContain(
          "cdn.visuallexicon.org"
        );
        expect(approvedLocalVisualPaths).toContain(image.pathname);
        expect(image.containerPosition).toBe("relative");
        expect(image.containerWidth).toBeGreaterThan(0);
        expect(image.containerHeight).toBeGreaterThan(0);
        expect(image.width).toBeGreaterThan(0);
        expect(image.height).toBeGreaterThan(0);
      }
    }
  });

  test("loads only active above-the-fold word visuals as priority", async ({
    page
  }) => {
    await seedPerformanceState(page);
    await page.goto("/review?mode=word&slug=dissonance&limit=1", {
      waitUntil: "networkidle"
    });

    await expect(page.locator(".review-v2-card__visual img")).toHaveAttribute(
      "fetchpriority",
      "high"
    );

    await seedPerformanceState(page);
    await page.goto("/saved", { waitUntil: "networkidle" });

    const queueImageLoading = await page.locator(".saved-v2-word-card img").evaluateAll(
      (images) => images.map((image) => image.getAttribute("loading"))
    );

    expect(queueImageLoading.length).toBeGreaterThan(0);
    expect(queueImageLoading.every((loading) => loading === "lazy")).toBe(true);
  });

  test("keeps core routes free of horizontal overflow at 320px", async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    for (const route of coreRoutes) {
      await seedPerformanceState(page);
      await page.goto(route, { waitUntil: "networkidle" });

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));

      expect(dimensions.scrollWidth, `${route} scrollWidth`).toBeLessThanOrEqual(
        dimensions.clientWidth + 1
      );
    }
  });

  test("does not record duplicate review events from rapid confidence clicks", async ({
    page
  }) => {
    await seedPerformanceState(page);
    await page.goto("/review?mode=word&slug=dissonance&limit=1", {
      waitUntil: "networkidle"
    });

    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: "I knew it" }).evaluate((button) => {
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    const reviewEventCount = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem("vlx_review_events_v1") ?? "[]")
        .length;
    });

    expect(reviewEventCount).toBe(1);
  });
});
