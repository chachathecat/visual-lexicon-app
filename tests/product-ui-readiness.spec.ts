import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const localChromePath = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
].find((path): path is string => Boolean(path && existsSync(path)));

if (localChromePath) {
  test.use({
    launchOptions: {
      executablePath: localChromePath
    }
  });
}

const storageKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

type ConsoleError = {
  location?: {
    url?: string;
  };
  text: string;
};

type SeedValues = {
  dailyStats?: Record<string, unknown>;
  packProgress?: Record<string, unknown>;
  reviewEvents?: unknown[];
  reviewState?: Record<string, unknown>;
  savedWords?: Record<string, unknown>;
};

const auditedRoutes = [
  {
    path: "/dashboard",
    waitForRole: {
      name: "Start review",
      role: "link" as const
    }
  },
  {
    path: "/review",
    waitForRole: {
      name: /A focused recall session for today's memory loop/i,
      role: "heading" as const
    }
  },
  {
    path: "/review/due",
    waitForRole: {
      name: /Review the cards due now/i,
      role: "heading" as const
    }
  },
  {
    path: "/review/weak",
    waitForRole: {
      name: /Repair fragile recall/i,
      role: "heading" as const
    }
  },
  {
    path: "/review/weak-sprint",
    waitForRole: {
      name: /A five-card sprint for fragile recall/i,
      role: "heading" as const
    }
  },
  {
    path: "/saved",
    waitForRole: {
      name: /Saved words that are ready to become memory/i,
      role: "heading" as const
    }
  },
  {
    path: "/packs",
    waitForRole: {
      name: "Packs",
      role: "heading" as const
    }
  },
  {
    path: "/packs/academic-vocabulary",
    waitForRole: {
      name: "Academic Vocabulary",
      role: "heading" as const
    }
  },
  {
    path: "/pricing",
    waitForRole: {
      name: "Pricing",
      role: "heading" as const
    }
  },
  {
    path: "/word/dissonance",
    waitForRole: {
      name: "Dissonance",
      role: "heading" as const
    }
  },
  {
    path: "/settings",
    waitForRole: {
      name: "Local learning preferences.",
      role: "heading" as const
    }
  }
] as const;

const trackBShellMobileRoutes = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings"
] as const;

const requiredAuditDocRoutes = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/word/dissonance",
  "/settings"
] as const;

const requiredAuditCriteria = [
  "primary user action clarity",
  "cognitive load",
  "Weekly Reviewed Words contribution",
  "Save -> Review loop clarity",
  "Due / Weak / Mastered truthfulness",
  "Paywall trigger placement",
  "Accessibility and mobile risks",
  "Fake mastery risk"
] as const;

const requiredRebuildSteps = [
  "Track B App Shell / Design Tokens",
  "Dashboard v2",
  "Review Session v2",
  "Saved Library v2",
  "Packs v2",
  "Pricing / Paywall v2",
  "Manual QA Execution Report",
  "Private Beta Gate"
] as const;

const wordOverflowDiagnosticSelectors = [
  ".sidebar",
  ".brand",
  ".nav-list",
  ".app-main",
  ".page",
  ".detail-grid"
] as const;

type WordOverflowDiagnostics = {
  clientWidth: number;
  geometry: Record<
    string,
    {
      bottom: number;
      clientWidth: number;
      height: number;
      left: number;
      right: number;
      scrollWidth: number;
      top: number;
      width: number;
    }
  >;
  overflowPx: number;
  scrollWidth: number;
};

function oneMinuteAgo() {
  return new Date(Date.now() - 60_000).toISOString();
}

function oneHourAgo() {
  return new Date(Date.now() - 60 * 60_000).toISOString();
}

function oneDayAgo() {
  return new Date(Date.now() - 24 * 60 * 60_000).toISOString();
}

function twoDaysAgo() {
  return new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
}

function threeDaysAgo() {
  return new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
}

function oneDayFromNow() {
  return new Date(Date.now() + 24 * 60 * 60_000).toISOString();
}

function thirtyDaysFromNow() {
  return new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
}

function makeSavedWord(overrides: Record<string, unknown> = {}) {
  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    source: "word_page",
    savedAt: oneHourAgo(),
    ...overrides
  };
}

function makeReviewStateItem(overrides: Record<string, unknown> = {}) {
  const createdAt =
    typeof overrides.createdAt === "string" ? overrides.createdAt : oneHourAgo();

  return {
    slug: "dissonance",
    word: "Dissonance",
    image: "https://cdn.visuallexicon.org/images/dissonance.webp",
    definition: "A clash between sounds, ideas, or feelings.",
    hub: "academic-vocabulary",
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    streakCorrect: 0,
    nextDueAt: oneMinuteAgo(),
    weakScore: 0,
    createdAt,
    updatedAt: createdAt,
    ...overrides
  };
}

function makeReadySeed(): SeedValues {
  return {
    savedWords: {
      dissonance: makeSavedWord(),
      obfuscate: makeSavedWord({
        slug: "obfuscate",
        word: "Obfuscate",
        definition: "To make something unclear or difficult to understand."
      }),
      lucid: makeSavedWord({
        slug: "lucid",
        word: "Lucid",
        definition: "Clear and easy to understand."
      })
    },
    reviewState: {
      dissonance: makeReviewStateItem({
        box: 1,
        mastery: "Learning",
        correct: 1,
        nextDueAt: oneMinuteAgo()
      }),
      obfuscate: makeReviewStateItem({
        slug: "obfuscate",
        word: "Obfuscate",
        definition: "To make something unclear or difficult to understand.",
        mastery: "Weak",
        correct: 1,
        wrong: 3,
        weakScore: 0.82,
        nextDueAt: oneDayFromNow()
      }),
      lucid: makeReviewStateItem({
        slug: "lucid",
        word: "Lucid",
        definition: "Clear and easy to understand.",
        box: 5,
        mastery: "Mastered",
        correct: 9,
        wrong: 0,
        streakCorrect: 6,
        weakScore: 0.04,
        nextDueAt: thirtyDaysFromNow()
      })
    },
    reviewEvents: [
      {
        eventId: "evt_product_ui_dissonance",
        sessionId: "s_product_ui",
        slug: "dissonance",
        word: "Dissonance",
        questionType: "due_review",
        selected: "Dissonance",
        answer: "Dissonance",
        result: "correct",
        responseMs: 1200,
        createdAt: oneDayAgo(),
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0,
        weakScoreAfter: 0
      },
      {
        eventId: "evt_product_ui_obfuscate",
        sessionId: "s_product_ui",
        slug: "obfuscate",
        word: "Obfuscate",
        questionType: "weak_review",
        selected: "Clarify",
        answer: "Obfuscate",
        result: "wrong",
        responseMs: 9000,
        createdAt: twoDaysAgo(),
        boxBefore: 1,
        boxAfter: 0,
        weakScoreBefore: 0.6,
        weakScoreAfter: 0.82
      }
    ],
    dailyStats: {}
  };
}

function isIgnoredConsoleError(error: ConsoleError) {
  const url = error.location?.url ?? "";

  return (
    url.includes("fonts.gstatic.com") ||
    url.endsWith("/favicon.ico") ||
    error.text.includes("favicon.ico")
  );
}

async function collectCriticalConsoleErrors(
  page: Page,
  callback: () => Promise<void>
) {
  const errors: ConsoleError[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push({
        location: message.location(),
        text: message.text()
      });
    }
  });
  page.on("pageerror", (error) => {
    errors.push({
      text: `PAGEERROR: ${error.message}`
    });
  });

  await callback();

  return errors.filter((error) => !isIgnoredConsoleError(error));
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keysToClear) => {
    for (const key of keysToClear) {
      localStorage.removeItem(key);
    }
  }, storageKeys);
}

async function seedVlxLocalStorage(page: Page, values: SeedValues = {}) {
  await clearVlxLocalStorage(page);

  await page.evaluate(
    ({ dailyStats, packProgress, reviewEvents, reviewState, savedWords }) => {
      localStorage.setItem(
        "vlx_saved_words_v1",
        JSON.stringify(savedWords ?? {})
      );
      localStorage.setItem(
        "vlx_review_state_v1",
        JSON.stringify(reviewState ?? {})
      );
      localStorage.setItem(
        "vlx_review_events_v1",
        JSON.stringify(reviewEvents ?? [])
      );
      localStorage.setItem(
        "vlx_daily_stats_v1",
        JSON.stringify(dailyStats ?? {})
      );
      localStorage.setItem(
        "vlx_pack_progress_v1",
        JSON.stringify(packProgress ?? {})
      );
    },
    values
  );
}

async function readLocalJson<T = unknown>(
  page: Page,
  key: (typeof storageKeys)[number]
): Promise<T | null> {
  return await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, key);
}

async function waitForRouteReady(
  page: Page,
  route: (typeof auditedRoutes)[number]
) {
  await page.getByRole(route.waitForRole.role, {
    name: route.waitForRole.name
  }).first().waitFor({
    state: "visible",
    timeout: 20000
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

  expect(overflow).toBeLessThanOrEqual(1);
}

async function getWordOverflowDiagnostics(
  page: Page
): Promise<WordOverflowDiagnostics> {
  return page.evaluate((selectors) => {
    const geometry: WordOverflowDiagnostics["geometry"] = {};

    for (const selector of selectors) {
      const element = document.querySelector(selector);

      if (!element) {
        continue;
      }

      const rect = element.getBoundingClientRect();

      geometry[selector] = {
        bottom: rect.bottom,
        clientWidth: element.clientWidth,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        scrollWidth: element.scrollWidth,
        top: rect.top,
        width: rect.width
      };
    }

    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;

    return {
      clientWidth,
      geometry,
      overflowPx: scrollWidth - clientWidth,
      scrollWidth
    };
  }, wordOverflowDiagnosticSelectors);
}

async function expectTabReaches(page: Page, target: Locator) {
  for (let index = 0; index < 30; index += 1) {
    if (await target.evaluate((node) => node === document.activeElement)) {
      await expect(target).toBeFocused();
      return;
    }

    await page.keyboard.press("Tab");
  }

  await expect(target).toBeFocused();
}

function savedTab(page: Page, tabId: string) {
  return page.locator(`#saved-v2-tab-${tabId}`);
}

function savedPanel(page: Page, tabId: string) {
  return page.locator(`#saved-v2-panel-${tabId}`);
}

function savedCard(page: Page, slug: string) {
  return page.locator(`[data-saved-word="${slug}"]`);
}

test.describe("Track B product/UI readiness rendered audit", () => {
  test("documents post-PR 154 audit scope, precedence, and rebuild sequence", () => {
    const auditReport = readFileSync(
      "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md",
      "utf8"
    );
    const rebuildSequence = readFileSync(
      "docs/TRACK_B_UI_REBUILD_SEQUENCE.md",
      "utf8"
    );

    expect(auditReport).toContain("Report version: 3");
    expect(auditReport).toContain("after merged PR #154");
    expect(auditReport).toContain(
      "673e48e9aedc7d0eb52ca1298603c260b482e23b"
    );
    expect(auditReport).toContain(
      "supersedes the previous rendered audit dated 2026-06-29"
    );
    expect(auditReport).toContain(
      "must not be treated as the current release gate"
    );
    expect(auditReport).toContain(
      "does not supersede canonical non-UI blockers"
    );
    expect(auditReport).toContain(
      "Private/manual beta: **Conditional / Manual-only**"
    );
    expect(auditReport).toContain("Public paid beta: **No-Go**");
    expect(auditReport).toContain(
      "**Docs/tests only; no runtime UI changes.**"
    );

    const normalizedAuditReport = auditReport.toLowerCase();

    for (const route of requiredAuditDocRoutes) {
      expect(auditReport, route).toContain(route);
    }

    for (const criterion of requiredAuditCriteria) {
      expect(normalizedAuditReport, criterion).toContain(
        criterion.toLowerCase()
      );
    }

    for (const severity of [
      "## P0 Issue List",
      "## P1 Issue List",
      "## P2 Issue List"
    ] as const) {
      expect(auditReport, severity).toContain(severity);
    }

    let previousStepIndex = -1;

    for (const step of requiredRebuildSteps) {
      const currentStepIndex = rebuildSequence.indexOf(step);

      expect(currentStepIndex, step).toBeGreaterThan(previousStepIndex);
      previousStepIndex = currentStepIndex;
    }

    expect(rebuildSequence).toContain(
      "Save must create or preserve review state."
    );
    expect(rebuildSequence).toContain(
      "Review answers must create events and update review state and daily stats."
    );
    expect(rebuildSequence).toContain(
      "Due, Weak, and Mastered must come from real review state."
    );
  });

  test("audited routes resolve, expose primary content, and avoid critical browser errors", async ({
    page
  }) => {
    test.setTimeout(60_000);

    await seedVlxLocalStorage(page, makeReadySeed());

    const criticalConsoleErrors = await collectCriticalConsoleErrors(
      page,
      async () => {
        for (const route of auditedRoutes) {
          const response = await page.goto(`${baseUrl}${route.path}`, {
            waitUntil: "domcontentloaded"
          });

          expect(response?.status(), route.path).toBeLessThan(400);
          await waitForRouteReady(page, route);
          await expect(
            page.locator("[data-nextjs-dialog], .nextjs-container-errors-header"),
            route.path
          ).toHaveCount(0);
        }
      }
    );

    expect(criticalConsoleErrors).toEqual([]);
  });

  test("Track B shell routes have no mobile horizontal overflow", async ({
    page
  }) => {
    test.setTimeout(60_000);

    await page.setViewportSize({ width: 390, height: 844 });
    await seedVlxLocalStorage(page, makeReadySeed());

    for (const route of trackBShellMobileRoutes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("VLX-AUDIT-P1-001 characterizes the current /word mobile overflow", async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedVlxLocalStorage(page, makeReadySeed());

    const criticalConsoleErrors = await collectCriticalConsoleErrors(
      page,
      async () => {
        const response = await page.goto(`${baseUrl}/word/dissonance`, {
          waitUntil: "domcontentloaded"
        });

        expect(response?.status()).toBeLessThan(400);
        await page
          .getByRole("heading", { level: 1, name: "Dissonance" })
          .waitFor({
            state: "visible",
            timeout: 20000
          });
        await expect(
          page.locator("[data-nextjs-dialog], .nextjs-container-errors-header")
        ).toHaveCount(0);
      }
    );

    expect(criticalConsoleErrors).toEqual([]);

    const diagnostics = await getWordOverflowDiagnostics(page);
    const diagnosticContext = JSON.stringify(diagnostics, null, 2);

    expect(diagnostics.clientWidth, diagnosticContext).toBe(390);
    expect(diagnostics.scrollWidth, diagnosticContext).toBeGreaterThan(
      diagnostics.clientWidth
    );
    expect(diagnostics.overflowPx, diagnosticContext).toBeGreaterThanOrEqual(250);
    expect(diagnostics.overflowPx, diagnosticContext).toBeLessThanOrEqual(270);

    // The separate runtime-fix PR must replace this characterization assertion
    // with expectNoHorizontalOverflow(page).
  });

  test("keyboard focus can reach principal learning actions", async ({ page }) => {
    await seedVlxLocalStorage(page, makeReadySeed());
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Start review" }).waitFor();
    await expectTabReaches(page, page.getByRole("link", { name: "Start review" }));

    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance`, {
      waitUntil: "domcontentloaded"
    });
    const answerButton = page.getByRole("button", { name: "Dissonance" });

    await answerButton.waitFor({ state: "visible" });
    await expectTabReaches(page, answerButton);

    await page.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });
    const pricingButton = page.getByRole("button", {
      name: "Note Lite interest - billing not connected yet"
    });

    await pricingButton.waitFor({ state: "visible" });
    await expectTabReaches(page, pricingButton);
  });

  test("save creates review state and one answer creates a real review event", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);

    const saveResponse = await page.goto(
      `${baseUrl}/save?slug=dissonance&source=word_page`,
      { waitUntil: "domcontentloaded" }
    );

    expect(saveResponse?.status()).toBe(200);
    await page.getByText("Added to your review queue").waitFor({
      state: "visible"
    });

    const savedWords = await readLocalJson<Record<string, Record<string, unknown>>>(
      page,
      "vlx_saved_words_v1"
    );
    const reviewState = await readLocalJson<Record<string, Record<string, unknown>>>(
      page,
      "vlx_review_state_v1"
    );

    expect(savedWords?.dissonance).toMatchObject({
      slug: "dissonance",
      source: "word_page"
    });
    expect(reviewState?.dissonance).toMatchObject({
      box: 0,
      mastery: "New",
      correct: 0,
      wrong: 0,
      weakScore: 0
    });

    await page.goto(`${baseUrl}/saved`, { waitUntil: "domcontentloaded" });
    await expect(
      savedCard(page, "dissonance").getByRole("heading", {
        name: "Dissonance"
      })
    ).toBeVisible();

    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance`, {
      waitUntil: "domcontentloaded"
    });
    await page.getByRole("button", { name: "Dissonance" }).click();
    await page.getByRole("button", { name: /I knew it/i }).click();

    await expect
      .poll(async () => {
        const events = await readLocalJson<unknown[]>(
          page,
          "vlx_review_events_v1"
        );

        return Array.isArray(events) ? events.length : 0;
      })
      .toBe(1);

    const afterAnswerState = await readLocalJson<
      Record<string, Record<string, unknown>>
    >(page, "vlx_review_state_v1");
    const events = await readLocalJson<Record<string, unknown>[]>(
      page,
      "vlx_review_events_v1"
    );
    const dailyStats = await readLocalJson<Record<string, { reviewed?: number }>>(
      page,
      "vlx_daily_stats_v1"
    );

    expect(afterAnswerState?.dissonance).toMatchObject({
      box: 1,
      mastery: "Learning",
      correct: 1,
      wrong: 0,
      lastQuestionType: "definition_to_word"
    });
    expect(typeof afterAnswerState?.dissonance?.nextDueAt).toBe("string");
    expect(events?.[0]).toMatchObject({
      slug: "dissonance",
      selected: "Dissonance",
      answer: "Dissonance",
      result: "correct",
      confidence: "knew",
      boxBefore: 0,
      boxAfter: 1,
      weakScoreAfter: 0
    });
    expect(
      Object.values(dailyStats ?? {}).reduce(
        (sum, value) =>
          sum + (typeof value.reviewed === "number" ? value.reviewed : 0),
        0
      )
    ).toBe(1);
  });

  test("Due, Weak, and Mastered displays match underlying review state", async ({
    page
  }) => {
    await seedVlxLocalStorage(page, makeReadySeed());

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Start review" }).waitFor();

    const bodyText = await page.locator("body").innerText();

    expect(bodyText).toMatch(/1\s+DUE NOW/);
    expect(bodyText).toMatch(/1\s+NEEDS WORK/);
    expect(bodyText).toMatch(/1\s+MASTERED/);

    await page.goto(`${baseUrl}/saved`, { waitUntil: "domcontentloaded" });

    await expect(savedTab(page, "due")).toContainText("1");
    await expect(savedPanel(page, "due")).toContainText("Dissonance");

    await savedTab(page, "weak").click();
    await expect(savedPanel(page, "weak")).toContainText("Obfuscate");

    await savedTab(page, "mastered").click();
    await expect(savedPanel(page, "mastered")).toContainText("Lucid");
    await expect(page.locator("body")).not.toContainText("Resilient");
  });

  test("Weekly Reviewed Words comes from real review events", async ({ page }) => {
    await seedVlxLocalStorage(page, {
      dailyStats: {},
      reviewEvents: [],
      reviewState: {},
      savedWords: {}
    });
    await page.goto(`${baseUrl}/packs`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Weekly Reviewed Words: 0 | Reviewed today: 0"))
      .toBeVisible();

    await seedVlxLocalStorage(page, {
      dailyStats: {},
      reviewEvents: [
        {
          eventId: "evt_weekly_dissonance_1",
          sessionId: "s_weekly",
          slug: "dissonance",
          word: "Dissonance",
          questionType: "due_review",
          answer: "Dissonance",
          result: "correct",
          responseMs: 1100,
          createdAt: oneDayAgo(),
          boxBefore: 0,
          boxAfter: 1,
          weakScoreBefore: 0,
          weakScoreAfter: 0
        },
        {
          eventId: "evt_weekly_dissonance_2",
          sessionId: "s_weekly",
          slug: "dissonance",
          word: "Dissonance",
          questionType: "due_review",
          answer: "Dissonance",
          result: "correct",
          responseMs: 1000,
          createdAt: threeDaysAgo(),
          boxBefore: 1,
          boxAfter: 2,
          weakScoreBefore: 0,
          weakScoreAfter: 0
        },
        {
          eventId: "evt_weekly_obfuscate",
          sessionId: "s_weekly",
          slug: "obfuscate",
          word: "Obfuscate",
          questionType: "weak_review",
          answer: "Obfuscate",
          result: "wrong",
          responseMs: 9000,
          createdAt: twoDaysAgo(),
          boxBefore: 1,
          boxAfter: 0,
          weakScoreBefore: 0.4,
          weakScoreAfter: 0.72
        }
      ],
      reviewState: {},
      savedWords: {}
    });
    await page.goto(`${baseUrl}/packs`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Weekly Reviewed Words: 2 | Reviewed today: 0"))
      .toBeVisible();
  });

  test("paywall prompts are absent before documented triggers", async ({ page }) => {
    await seedVlxLocalStorage(page, makeReadySeed());

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Start review" }).waitFor();
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
    await expect(page.locator(".track-b-upgrade-nudge")).toHaveCount(0);

    await seedVlxLocalStorage(page, {
      savedWords: {},
      reviewState: {},
      reviewEvents: [],
      dailyStats: {}
    });
    await page.goto(`${baseUrl}/save?slug=dissonance&source=word_page`, {
      waitUntil: "domcontentloaded"
    });
    await page.getByText("Added to your review queue").waitFor();
    await expect(page.locator("[data-paywall-trigger]")).toHaveCount(0);
  });
});
