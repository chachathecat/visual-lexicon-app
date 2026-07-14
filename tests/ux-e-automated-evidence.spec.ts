import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

test.use({
  colorScheme: "light",
  deviceScaleFactor: 1,
  locale: "en-US",
  timezoneId: "Asia/Seoul"
});

const fixedNow = "2026-07-14T04:00:00.000Z";
const fixedPast = "2026-07-13T04:00:00.000Z";
const fixedFuture = "2026-08-14T04:00:00.000Z";

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

const primaryRoutes = [
  {
    path: "/dashboard",
    readyHeading: /Today(?:'|’|&apos;)s Memory Mission/i
  },
  {
    path: "/save?slug=dissonance&source=word_page",
    readyHeading: "Dissonance"
  },
  {
    path: "/review?mode=word&slug=dissonance&limit=1",
    readyHeading: "Review one word in focus."
  },
  {
    path: "/saved",
    readyHeading: "Saved Library"
  },
  {
    path: "/pricing",
    readyHeading: "Choose how you want to remember."
  },
  {
    path: "/packs",
    readyHeading: "Packs"
  }
] as const;

type AxeViolation = {
  help: string;
  helpUrl: string;
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical" | null;
  nodes: Array<{
    target: string[];
  }>;
};

type OverflowDiagnostics = {
  bodyScrollWidth: number;
  clientWidth: number;
  documentScrollWidth: number;
  offenders: Array<{
    left: number;
    name: string;
    right: number;
  }>;
};

const seededWord = {
  slug: "dissonance",
  word: "Dissonance",
  definition: "A clash between sounds, ideas, or feelings.",
  hub: "academic-vocabulary",
  source: "word_page",
  savedAt: fixedPast
} as const;

async function installFixedClock(page: Page) {
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
}

async function seedPrimaryRouteState(page: Page) {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ fixedFuture, fixedPast, seededWord, storageKeys }) => {
      for (const key of storageKeys) {
        localStorage.removeItem(key);
      }

      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify({ dissonance: seededWord })
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify({
          dissonance: {
            ...seededWord,
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
            updatedAt: fixedFuture
          }
        })
      );
      localStorage.setItem("vlx_review_events_v1", "[]");
      localStorage.setItem("vlx_daily_stats_v1", "{}");
      localStorage.setItem("vlx_pack_progress_v1", "{}");
    },
    { fixedFuture, fixedPast, seededWord, storageKeys }
  );
}

async function prepareSeededPage(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await installFixedClock(page);
  await seedPrimaryRouteState(page);
}

async function openPrimaryRoute(
  page: Page,
  route: (typeof primaryRoutes)[number]
) {
  const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

  expect(response?.status(), route.path).toBeLessThan(400);
  await page
    .getByRole("heading", { level: 1, name: route.readyHeading })
    .waitFor({ state: "attached", timeout: 20_000 });
  await expect(
    page.locator("[data-nextjs-dialog], .nextjs-container-errors-header"),
    route.path
  ).toHaveCount(0);
}

async function runAxe(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ content: axe.source });

  return page.evaluate(async () => {
    const axeRuntime = (
      window as typeof window & {
        axe: {
          run: (
            context: Document,
            options: { resultTypes: string[] }
          ) => Promise<{ violations: AxeViolation[] }>;
        };
      }
    ).axe;
    const result = await axeRuntime.run(document, {
      resultTypes: ["violations"]
    });

    return result.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious"
    );
  });
}

function formatAxeFailure(
  route: string,
  viewport: string,
  violation: AxeViolation
) {
  const targets = violation.nodes
    .slice(0, 3)
    .flatMap((node) => node.target)
    .join(", ");

  return `${viewport} ${route}: ${violation.id} (${violation.impact}) — ${violation.help}; ${targets}; ${violation.helpUrl}`;
}

async function getOverflowDiagnostics(page: Page): Promise<OverflowDiagnostics> {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const offenders = Array.from(document.body.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          left: Math.round(rect.left * 10) / 10,
          name:
            element.id ||
            element.classList.item(0) ||
            element.tagName.toLocaleLowerCase(),
          right: Math.round(rect.right * 10) / 10
        };
      })
      .filter((element) => element.left < -1 || element.right > clientWidth + 1)
      .slice(0, 5);

    return {
      bodyScrollWidth: document.body.scrollWidth,
      clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      offenders
    };
  });
}

async function expectNoHorizontalOverflow(page: Page, context: string) {
  const diagnostics = await getOverflowDiagnostics(page);
  const message = `${context}: ${JSON.stringify(diagnostics)}`;

  expect(diagnostics.documentScrollWidth, message).toBeLessThanOrEqual(
    diagnostics.clientWidth + 1
  );
  expect(diagnostics.bodyScrollWidth, message).toBeLessThanOrEqual(
    diagnostics.clientWidth + 1
  );
}

function makeFiftySavedWords() {
  return Object.fromEntries(
    Array.from({ length: 50 }, (_, index) => {
      const ordinal = String(index + 1).padStart(2, "0");
      const slug = `evidence-word-${ordinal}`;

      return [
        slug,
        {
          slug,
          word: `Evidence Word ${ordinal}`,
          definition: `Deterministic saved-word evidence item ${ordinal}.`,
          hub: "ux-e-evidence",
          source: "word_page",
          savedAt: fixedPast
        }
      ];
    })
  );
}

async function seedFiftySavedWords(page: Page) {
  await page.evaluate((savedWords) => {
    localStorage.setItem("vlx_saved_words_v1", JSON.stringify(savedWords));
    localStorage.setItem("vlx_review_state_v1", "{}");
    localStorage.setItem("vlx_review_events_v1", "[]");
    localStorage.setItem("vlx_daily_stats_v1", "{}");
  }, makeFiftySavedWords());
}

async function assertStableFiftyWordQueue(page: Page, viewportWidth: number) {
  await page.goto("/saved", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { level: 1, name: "Saved Library" })
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("#saved-v2-tab-all").click();

  const cards = page.locator("[data-saved-word]");
  const visuals = cards.locator('[role="img"]');
  const actions = cards.locator(".saved-v2-word-card__actions a");

  await expect(cards).toHaveCount(50);
  await expect(visuals).toHaveCount(50);
  await expect(actions).toHaveCount(100);
  await expect(page.locator("#saved-v2-tab-all")).toHaveAttribute(
    "aria-selected",
    "true"
  );

  const geometry = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const card = element.getBoundingClientRect();
      const visual = element.querySelector('[role="img"]')?.getBoundingClientRect();
      const controls = Array.from(
        element.querySelectorAll(".saved-v2-word-card__actions a")
      ).map((control) => control.getBoundingClientRect());

      return {
        card: { left: card.left, right: card.right },
        controls: controls.map((control) => ({
          height: control.height,
          left: control.left,
          right: control.right,
          width: control.width
        })),
        visual: visual
          ? { height: visual.height, width: visual.width }
          : undefined
      };
    })
  );
  const unstable = geometry.filter(
    (item) =>
      item.card.left < -1 ||
      item.card.right > viewportWidth + 1 ||
      !item.visual ||
      item.visual.height <= 0 ||
      item.visual.width <= 0 ||
      item.controls.length !== 2 ||
      item.controls.some(
        (control) =>
          control.height < 44 ||
          control.width < 44 ||
          control.left < -1 ||
          control.right > viewportWidth + 1
      )
  );

  expect(unstable, `${viewportWidth}px unstable queue geometry`).toEqual([]);
  await expectNoHorizontalOverflow(page, `${viewportWidth}px 50-word queue`);
}

test.describe("UX-E automated evidence proxy", () => {
  for (const viewport of [
    { height: 844, name: "390x844", width: 390 },
    { height: 900, name: "1440x900", width: 1440 }
  ] as const) {
    test(`axe serious and critical violations are zero at ${viewport.name}`, async ({
      page
    }) => {
      test.setTimeout(120_000);
      await prepareSeededPage(page, viewport.width, viewport.height);

      const failures: string[] = [];

      for (const route of primaryRoutes) {
        await openPrimaryRoute(page, route);
        const violations = await runAxe(page);

        failures.push(
          ...violations.map((violation) =>
            formatAxeFailure(route.path, viewport.name, violation)
          )
        );
      }

      expect(failures, failures.join("\n")).toEqual([]);
    });
  }

  test("1280 at 200% equivalent has one main, one h1, and no horizontal overflow", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await prepareSeededPage(page, 640, 900);

    for (const route of primaryRoutes) {
      await openPrimaryRoute(page, route);
      await expect(page.locator("main"), `${route.path} main count`).toHaveCount(1);
      await expect(page.locator("h1"), `${route.path} h1 count`).toHaveCount(1);
      await expectNoHorizontalOverflow(
        page,
        `${route.path} 640 CSS px (1280 at 200% proxy)`
      );
    }
  });

  test("real 50-word All queue remains stable at 390px and 320px", async ({
    page
  }) => {
    test.setTimeout(90_000);
    await prepareSeededPage(page, 390, 844);
    await seedFiftySavedWords(page);

    for (const viewport of [
      { height: 844, width: 390 },
      { height: 700, width: 320 }
    ] as const) {
      await page.setViewportSize(viewport);
      await assertStableFiftyWordQueue(page, viewport.width);
    }
  });
});
