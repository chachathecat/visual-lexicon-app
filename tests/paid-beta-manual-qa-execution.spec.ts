import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { basename, join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import {
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES,
  PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
  PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS,
  PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES,
  PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS,
  PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY,
  PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS,
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS,
  VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  getFindingsBySeverity,
  getManualQaRouteCheckByPath,
  getManualQaRouteChecks,
  getManualQaStorageProbe,
  getP0FindingCount,
  getP0Findings,
  getPaidBetaManualQaExecutionReport,
  getPrivateBetaVerdict,
  getPublicBetaVerdict,
  getQaResultSection,
  type PaidBetaManualQaExecutionFinding,
  type PaidBetaManualQaExecutionQaResultSection,
  type PaidBetaManualQaExecutionQaSectionTitle,
  type PaidBetaManualQaExecutionReport,
  type PaidBetaManualQaExecutionRouteCheck,
  type PaidBetaManualQaExecutionRoutePath,
  type PaidBetaManualQaExecutionSeverity,
  type PaidBetaManualQaExecutionStatus,
  type PaidBetaManualQaExecutionStorageKey,
  type PaidBetaManualQaExecutionStorageProbe,
  type PaidBetaManualQaExecutionVerdict,
  type PaidBetaManualQaExecutionVersion
} from "../src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";
import {
  PAID_BETA_MANUAL_QA_EXECUTION_ALLOWED_ROUTE_HANDLERS,
  PAID_BETA_MANUAL_QA_EXECUTION_DOC_FILES,
  PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS,
  PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_DIRECT_DEPENDENCIES,
  PAID_BETA_MANUAL_QA_EXECUTION_MODULE_FILES,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_DOC_SECTIONS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS,
  PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS,
  PAID_BETA_MANUAL_QA_EXECUTION_RUNTIME_SCAN_DIRS,
  PAID_BETA_MANUAL_QA_EXECUTION_SEVERITIES
} from "../src/lib/paid-beta-manual-qa-execution/fixtures";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

const workspaceRoot = process.cwd();

type ManualQaExecutionTypeSurface = {
  version: PaidBetaManualQaExecutionVersion;
  report: PaidBetaManualQaExecutionReport;
  routePath: PaidBetaManualQaExecutionRoutePath;
  routeCheck: PaidBetaManualQaExecutionRouteCheck;
  storageKey: PaidBetaManualQaExecutionStorageKey;
  storageProbe: PaidBetaManualQaExecutionStorageProbe;
  sectionTitle: PaidBetaManualQaExecutionQaSectionTitle;
  resultSection: PaidBetaManualQaExecutionQaResultSection;
  severity: PaidBetaManualQaExecutionSeverity;
  status: PaidBetaManualQaExecutionStatus;
  verdict: PaidBetaManualQaExecutionVerdict;
  finding: PaidBetaManualQaExecutionFinding;
};

const typeSmoke: ManualQaExecutionTypeSurface = {
  version: VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  report: PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  routePath: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS[0],
  routeCheck: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS[0],
  storageKey: PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS[0],
  storageProbe: PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES[0],
  sectionTitle: PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES[0],
  resultSection: PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS[0],
  severity: PAID_BETA_MANUAL_QA_EXECUTION_SEVERITIES[0],
  status: PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS[0].status,
  verdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  finding: PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS[0]
};

type SavedWordStore = Record<string, Record<string, unknown>>;
type ReviewStateStore = Record<string, Record<string, unknown>>;
type ReviewEvent = Record<string, unknown>;
type DailyStatsStore = Record<string, { reviewed?: number }>;
type PackProgressStore = Record<string, Record<string, unknown>>;

function routePaths() {
  return PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS.map((route) => route.path);
}

function storageKeys() {
  return PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES.map(
    (probe) => probe.key
  );
}

function sectionTitles() {
  return PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS.map(
    (section) => section.title
  );
}

function findingIdsBySeverity(severity: PaidBetaManualQaExecutionSeverity) {
  return getFindingsBySeverity(severity).map((finding) => finding.id);
}

function readJsonFile<TValue>(relativePath: string): TValue {
  return JSON.parse(
    readFileSync(join(workspaceRoot, relativePath), "utf8")
  ) as TValue;
}

function readRootPackageDependencies(fileName: "package.json" | "package-lock.json") {
  const parsed = readJsonFile<{
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    packages?: Record<
      string,
      {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        optionalDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      }
    >;
  }>(fileName);
  const rootPackage = fileName === "package-lock.json" ? parsed.packages?.[""] : parsed;

  return {
    ...rootPackage?.dependencies,
    ...rootPackage?.devDependencies,
    ...rootPackage?.optionalDependencies,
    ...rootPackage?.peerDependencies
  };
}

function collectFiles(relativeDir: string): string[] {
  const absoluteDir = join(workspaceRoot, relativeDir);

  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir).flatMap((entry) => {
    const absolutePath = join(absoluteDir, entry);
    const relativePath = join(relativeDir, entry);

    if (statSync(absolutePath).isDirectory()) {
      return collectFiles(relativePath);
    }

    return [relativePath];
  });
}

async function clearVlxLocalStorage(page: Page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }

    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  }, PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS);
}

async function readLocalJson<T = unknown>(
  page: Page,
  key: string
): Promise<T | null> {
  return await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, key);
}

async function answerCurrentCard(page: Page, result: "correct" | "wrong") {
  await expect(page.locator(".review-session")).toBeVisible({ timeout: 15000 });

  const answer = (await page.locator("#review-session-title").innerText()).trim();
  const optionLabels = (await page.locator(".review-option").allInnerTexts()).map(
    (label) => label.trim()
  );
  const selected =
    result === "correct"
      ? answer
      : optionLabels.find((label) => label !== answer) ?? optionLabels[0];

  expect(selected).toBeTruthy();
  await page.getByRole("button", { name: selected, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "How did that recall feel?" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: result === "correct" ? /I knew it/i : /I forgot/i })
    .click();
  await expect(page.locator(".review-feedback")).toBeVisible();
}

async function completeReviewSession(page: Page) {
  let answeredCards = 0;

  for (let index = 0; index < 20; index += 1) {
    await answerCurrentCard(page, "correct");
    answeredCards += 1;

    const nextButton = page.getByRole("button", {
      name: /Next card|View summary/i
    });

    await expect(nextButton).toBeVisible();

    const buttonLabel = await nextButton.innerText();

    await nextButton.click();

    if (/View summary/i.test(buttonLabel)) {
      break;
    }
  }

  await expect(
    page.getByRole("heading", { name: "Session summary" })
  ).toBeVisible();

  return answeredCards;
}

async function expectSaveCreatesReviewItem(
  page: Page,
  source: "word_page" | "alias_search" | "extension"
) {
  await clearVlxLocalStorage(page);
  await page.goto(`${baseUrl}/save?slug=dissonance&source=${source}`, {
    waitUntil: "networkidle"
  });

  await expect(page.getByRole("heading", { name: "Dissonance" })).toBeVisible();
  await expect
    .poll(async () => {
      const reviewState = await readLocalJson<ReviewStateStore>(
        page,
        "vlx_review_state_v1"
      );

      return Boolean(reviewState?.dissonance);
    })
    .toBe(true);

  const savedWords = await readLocalJson<SavedWordStore>(
    page,
    "vlx_saved_words_v1"
  );
  const reviewState = await readLocalJson<ReviewStateStore>(
    page,
    "vlx_review_state_v1"
  );

  expect(savedWords?.dissonance).toMatchObject({
    slug: "dissonance",
    word: "Dissonance",
    source
  });
  expect(reviewState?.dissonance).toMatchObject({
    slug: "dissonance",
    word: "Dissonance",
    box: 0,
    mastery: "New",
    correct: 0,
    wrong: 0,
    weakScore: 0
  });
}

function withNoRuntimeSurfaceAccess<TValue>(callback: () => TValue) {
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "fetch"
  );
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window"
  );
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "env"
  );
  let fetchAccessed = false;
  let windowAccessed = false;
  let localStorageAccessed = false;
  let processEnvAccessed = false;

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    get() {
      fetchAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    get() {
      windowAccessed = true;
      return undefined;
    }
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      localStorageAccessed = true;
      return undefined;
    }
  });

  if (originalProcessEnvDescriptor?.configurable) {
    Object.defineProperty(process, "env", {
      configurable: true,
      get() {
        processEnvAccessed = true;
        return originalProcessEnvDescriptor.value;
      }
    });
  }

  try {
    const value = callback();

    return {
      value,
      sideEffects: {
        fetchAccessed,
        windowAccessed,
        localStorageAccessed,
        processEnvAccessed
      }
    };
  } finally {
    if (originalFetchDescriptor) {
      Object.defineProperty(globalThis, "fetch", originalFetchDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }

    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLocalStorageDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }

    if (originalProcessEnvDescriptor?.configurable) {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  }
}

test.describe("paid beta manual QA execution report contract", () => {
  test("exports the required typed execution report surface", () => {
    expect(typeSmoke).toMatchObject({
      version: 2,
      report: {
        branch: "release/paid-beta-manual-qa-execution",
        draftPullRequestTitle:
          "[Track B] Add paid beta manual QA execution report",
        reportDateKst: "2026-07-04",
        northStarMetric: "Weekly Reviewed Words",
        p0FindingCount: 0
      },
      routePath: "/dashboard",
      storageKey: "vlx_saved_words_v1",
      sectionTitle: "Save creates review item",
      severity: "P0",
      verdict: "move_to_private_beta_gate"
    });
  });

  test("sets P0 to zero, recommends Private Beta Gate, and keeps public beta No-Go", () => {
    expect(getPaidBetaManualQaExecutionReport()).toBe(
      PAID_BETA_MANUAL_QA_EXECUTION_REPORT
    );
    expect(getPrivateBetaVerdict()).toBe("move_to_private_beta_gate");
    expect(getPublicBetaVerdict()).toBe("no_go_public_paid_beta");
    expect(getP0Findings()).toEqual([]);
    expect(getP0FindingCount()).toBe(0);
    expect(PAID_BETA_MANUAL_QA_EXECUTION_REPORT).toMatchObject({
      privateBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
      publicBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
      privateBetaRecommendation: "Move to Private Beta Gate",
      p0FallbackRecommendation: "Targeted hotfix PRs required",
      publicBetaRecommendation: "No-Go"
    });
  });

  test("covers every requested manual QA route exactly", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES
    );
    expect(routePaths()).toEqual([...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES]);
    expect(getManualQaRouteChecks()).toBe(
      PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS
    );

    for (const route of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES) {
      const check = getManualQaRouteCheckByPath(route);

      expect(check, route).toBeDefined();
      expect(check).toMatchObject({
        path: route,
        result: "pass"
      });
      expect(check?.evidence.length, route).toBeGreaterThan(0);
      expect(check?.mustRemainHonest.length, route).toBeGreaterThan(0);
    }
  });

  test("includes required localStorage probes and grants no paid entitlement", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS
    );
    expect(storageKeys()).toEqual([
      ...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS
    ]);

    for (const key of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS) {
      const probe = getManualQaStorageProbe(key);

      expect(probe, key).toBeDefined();
      expect(probe).toMatchObject({
        key,
        productionSourceOfTruth: false,
        grantsPaidEntitlement: false
      });
      expect(probe?.mustNotContain.length, key).toBeGreaterThan(0);
    }
  });

  test("includes every required QA result section", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES
    );
    expect(sectionTitles()).toEqual([
      ...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES
    ]);

    for (const title of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES) {
      const section = getQaResultSection(title);

      expect(section, title).toBeDefined();
      expect(section?.evidence.length, title).toBeGreaterThan(0);
      expect(section?.releaseMeaning, title).toBeTruthy();
    }

    expect(getQaResultSection("Public paid beta remains No-Go")).toMatchObject({
      status: "no_go"
    });
    expect(getQaResultSection("Private/manual paid beta is gated")).toMatchObject({
      status: "gated"
    });
  });

  test("classifies P0 P1 and P2 findings for this execution scope", () => {
    expect(findingIdsBySeverity("P0")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS
    );
    expect(findingIdsBySeverity("P1")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS
    );
    expect(findingIdsBySeverity("P2")).toEqual(
      PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS
    );

    for (const finding of PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS) {
      expect(finding.blocksPrivateBetaGate, finding.id).toBe(false);
      expect(finding.evidence, finding.id).toBeTruthy();
      expect(finding.recommendedAction, finding.id).toBeTruthy();
    }
  });

  test("includes required validation commands", () => {
    expect(
      PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS.map((item) => item.command)
    ).toEqual([...PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS]);

    for (const command of PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS) {
      expect(command.required).toBe(true);
    }
  });

  test("keeps safety boundaries explicit and closed", () => {
    expect(PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY.docsTestsOnly).toBe(true);

    for (const field of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS) {
      expect(PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY[field], field).toBe(
        false
      );
    }
  });

  test("helpers are pure static reads", () => {
    const { sideEffects, value } = withNoRuntimeSurfaceAccess(() => ({
      privateVerdict: getPrivateBetaVerdict(),
      publicVerdict: getPublicBetaVerdict(),
      p0Count: getP0FindingCount(),
      pricingDisposition: getManualQaRouteCheckByPath("/pricing")?.result,
      pricingInterestSection: getQaResultSection(
        "Pricing upgrade interest records local beta interest only"
      )?.status
    }));

    expect(value).toEqual({
      privateVerdict: "move_to_private_beta_gate",
      publicVerdict: "no_go_public_paid_beta",
      p0Count: 0,
      pricingDisposition: "pass",
      pricingInterestSection: "pass"
    });
    expect(sideEffects).toEqual({
      fetchAccessed: false,
      windowAccessed: false,
      localStorageAccessed: false,
      processEnvAccessed: false
    });
  });

  test("README and execution docs are linked and explicit", () => {
    const readme = readFileSync(join(workspaceRoot, "README.md"), "utf8");
    const doc = readFileSync(
      join(workspaceRoot, "docs", "PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md"),
      "utf8"
    );
    const moduleReadme = readFileSync(
      join(
        workspaceRoot,
        "src",
        "lib",
        "paid-beta-manual-qa-execution",
        "README.md"
      ),
      "utf8"
    );

    expect(PAID_BETA_MANUAL_QA_EXECUTION_DOC_FILES).toEqual([
      "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
      "README.md"
    ]);
    expect(readme).toContain("docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md");

    for (const section of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_DOC_SECTIONS) {
      expect(doc, section).toContain(section);
    }

    for (const title of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES) {
      expect(doc, title).toContain(title);
    }

    expect(doc).toContain("P0 count: `0`");
    expect(doc).toContain("Private paid beta: **Move to Private Beta Gate**");
    expect(doc).toContain("Public paid beta: **No-Go**");
    expect(doc).toContain("If P0 rises above zero, replace this recommendation with targeted hotfix PRs.");
    expect(moduleReadme).toContain("pure static TypeScript data");
    expect(moduleReadme).toContain("does not execute browser probes");
  });
});

test.describe("paid beta manual QA browser execution", () => {
  test.setTimeout(120000);

  test("requested routes load without visible app 404s", async ({ page }) => {
    for (const route of PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES) {
      if (route.startsWith("/save?")) {
        await clearVlxLocalStorage(page);
      }

      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "domcontentloaded"
      });

      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator("body"), route).not.toContainText(
        "This page could not be found"
      );
    }
  });

  test("save routes create review items for word_page alias_search and extension sources", async ({
    page
  }) => {
    await expectSaveCreatesReviewItem(page, "word_page");
    await expectSaveCreatesReviewItem(page, "alias_search");
    await expectSaveCreatesReviewItem(page, "extension");
  });

  test("review updates state events daily stats and honest due weak mastered state", async ({
    page
  }) => {
    await expectSaveCreatesReviewItem(page, "word_page");

    await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" });
    await answerCurrentCard(page, "correct");

    let events = await readLocalJson<ReviewEvent[]>(page, "vlx_review_events_v1");
    let reviewState = await readLocalJson<ReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );
    let dailyStats = await readLocalJson<DailyStatsStore>(
      page,
      "vlx_daily_stats_v1"
    );
    let reviewedCount = Object.values(dailyStats ?? {}).reduce(
      (sum, item) => sum + (typeof item.reviewed === "number" ? item.reviewed : 0),
      0
    );

    expect(events).toHaveLength(1);
    expect(events?.[0]).toMatchObject({
      slug: "dissonance",
      result: "correct"
    });
    expect(typeof events?.[0]?.responseMs).toBe("number");
    expect(reviewState?.dissonance?.correct).toBe(1);
    expect(reviewState?.dissonance?.mastery).not.toBe("Mastered");
    expect(reviewedCount).toBeGreaterThan(0);

    await page.goto(`${baseUrl}/review/due`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("fake");

    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
      waitUntil: "networkidle"
    });
    await answerCurrentCard(page, "wrong");

    events = await readLocalJson<ReviewEvent[]>(page, "vlx_review_events_v1");
    reviewState = await readLocalJson<ReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );
    dailyStats = await readLocalJson<DailyStatsStore>(
      page,
      "vlx_daily_stats_v1"
    );
    reviewedCount = Object.values(dailyStats ?? {}).reduce(
      (sum, item) => sum + (typeof item.reviewed === "number" ? item.reviewed : 0),
      0
    );

    expect(events).toHaveLength(2);
    expect(reviewState?.dissonance?.wrong).toBe(1);
    expect(Number(reviewState?.dissonance?.weakScore)).toBeGreaterThan(0);
    expect(reviewState?.dissonance?.mastery).not.toBe("Mastered");
    expect(reviewedCount).toBeGreaterThan(1);

    await page.goto(`${baseUrl}/review/weak`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".review-session")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Dissonance" })).toBeVisible();

    await page.goto(`${baseUrl}/word/dissonance`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("Weak");
    await expect(page.locator("body")).not.toContainText("paid access granted");
  });

  test("weak sprint uses real weak evidence and writes weak review events", async ({
    page
  }) => {
    await expectSaveCreatesReviewItem(page, "word_page");

    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
      waitUntil: "networkidle"
    });
    await answerCurrentCard(page, "wrong");
    await page.goto(`${baseUrl}/review?mode=word&slug=dissonance&limit=1`, {
      waitUntil: "networkidle"
    });
    await answerCurrentCard(page, "wrong");

    const weakStateBefore = await readLocalJson<ReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );

    expect(weakStateBefore?.dissonance?.mastery).toBe("Weak");
    expect(Number(weakStateBefore?.dissonance?.weakScore)).toBeGreaterThan(0);

    await page.goto(`${baseUrl}/review/weak-sprint`, {
      waitUntil: "networkidle"
    });
    await expect(
      page.getByRole("heading", { name: /A five-card sprint for fragile recall/i })
    ).toBeVisible();
    await answerCurrentCard(page, "correct");

    const events = await readLocalJson<ReviewEvent[]>(page, "vlx_review_events_v1");
    const reviewState = await readLocalJson<ReviewStateStore>(
      page,
      "vlx_review_state_v1"
    );
    const weakEvents = (events ?? []).filter(
      (event) => event.questionType === "weak_review"
    );

    expect(weakEvents.length).toBeGreaterThan(0);
    expect(weakEvents.at(-1)).toMatchObject({
      slug: "dissonance",
      questionType: "weak_review"
    });
    expect(reviewState?.dissonance?.lastQuestionType).toBe("weak_review");
  });

  test("pack preview progress comes from preview start and real review answers", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/packs`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Packs" })
    ).toBeVisible();
    await expect(page.locator("body")).toContainText("No local pack progress yet");

    await page.goto(`${baseUrl}/packs/academic-vocabulary`, {
      waitUntil: "networkidle"
    });
    await page
      .getByRole("link", { name: "Start preview Academic Vocabulary" })
      .click();
    await expect(page).toHaveURL(
      /\/review\?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview$/
    );

    let progress = await readLocalJson<PackProgressStore>(
      page,
      "vlx_pack_progress_v1"
    );

    expect(progress?.["academic-vocabulary"]).toMatchObject({
      packId: "academic-vocabulary",
      source: "pack_detail",
      reviewedCount: 0,
      correctCount: 0
    });

    const answeredCards = await completeReviewSession(page);
    const events = await readLocalJson<ReviewEvent[]>(page, "vlx_review_events_v1");
    const correctCount = (events ?? []).filter(
      (event) => event.result === "correct"
    ).length;

    progress = await readLocalJson<PackProgressStore>(
      page,
      "vlx_pack_progress_v1"
    );

    expect(events).toHaveLength(answeredCards);
    expect(progress?.["academic-vocabulary"]).toMatchObject({
      source: "review",
      reviewedCount: answeredCards,
      correctCount
    });
    expect(typeof progress?.["academic-vocabulary"]?.previewCompletedAt).toBe(
      "string"
    );
  });

  test("pricing records local interest only and settings keep beta gated", async ({
    page
  }) => {
    await clearVlxLocalStorage(page);
    await page.goto(`${baseUrl}/pricing`, { waitUntil: "networkidle" });

    const pricingUrl = page.url();

    await expect(page.locator("body")).toContainText(
      "Paid plans aren't available to purchase yet"
    );
    await expect(page.locator("body")).toContainText("no payment is taken");

    for (const label of [
      "I'm interested in Lite",
      "I'm interested in Pro",
      "I'm interested in Exam Pack"
    ]) {
      await page.getByRole("button", { name: label }).click();
    }

    await expect(page).toHaveURL(pricingUrl);
    await expect(
      page.getByText("Interest saved on this device. No charge was made")
    ).toHaveCount(3);

    const interestRecords = await readLocalJson<ReviewEvent[]>(
      page,
      "vlx_upgrade_interest_v1"
    );
    const planState = await readLocalJson(page, "vlx_plan_state_v1");

    expect(interestRecords).toHaveLength(3);
    expect(interestRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ plan: "lite", source: "pricing_page" }),
        expect.objectContaining({ plan: "pro", source: "pricing_page" }),
        expect.objectContaining({ plan: "exam_pack", source: "pricing_page" })
      ])
    );
    expect(planState).toBeNull();

    await page.goto(`${baseUrl}/settings`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.locator("body")).toContainText("Account Sync");
    await expect(page.locator("body")).toContainText("Not connected");
    await expect(page.locator("body")).toContainText("Billing");
    await expect(page.locator("body")).toContainText("Not configured");
  });
});

test.describe("paid beta manual QA safety guards", () => {
  test("no forbidden runtime paths or checkout billing routes are created", () => {
    for (const relativePath of PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS) {
      expect(existsSync(join(workspaceRoot, relativePath)), relativePath).toBe(false);
    }

    const appRouteHandlers = collectFiles("src/app").filter(
      (relativePath) => basename(relativePath) === "route.ts"
    );

    expect(appRouteHandlers.map((path) => path.split("\\").join("/"))).toEqual([
      ...PAID_BETA_MANUAL_QA_EXECUTION_ALLOWED_ROUTE_HANDLERS
    ]);
  });

  test("no forbidden provider SDKs auth database payment or logging dependencies are added", () => {
    for (const fileName of ["package.json", "package-lock.json"] as const) {
      const dependencies = readRootPackageDependencies(fileName);

      for (const dependencyName of PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_DIRECT_DEPENDENCIES) {
        expect(
          dependencies,
          `${fileName} should not add ${dependencyName}`
        ).not.toHaveProperty(dependencyName);
      }
    }
  });

  test("static execution module files contain no runtime integration patterns", () => {
    const forbiddenPatterns = [
      /\bNextRequest\b/,
      /\bNextResponse\b/,
      /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      /\bfetch\s*\(/,
      /\bwindow\b/,
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
      /from ["']@cloudflare\/d1/,
      /from ["']@clerk\//,
      /from ["']@auth\//,
      /from ["']next-auth/,
      /from ["']better-auth/,
      /from ["']stripe/,
      /from ["']paddle/,
      /\bcreateRouteHandler\b/
    ];

    for (const relativePath of PAID_BETA_MANUAL_QA_EXECUTION_MODULE_FILES) {
      const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

      for (const forbiddenPattern of forbiddenPatterns) {
        expect(fileText, `${relativePath} matched ${forbiddenPattern}`).not.toMatch(
          forbiddenPattern
        );
      }
    }
  });

  test("runtime app routes and components do not import the execution report", () => {
    for (const scanDir of PAID_BETA_MANUAL_QA_EXECUTION_RUNTIME_SCAN_DIRS) {
      for (const relativePath of collectFiles(scanDir)) {
        if (!/\.(ts|tsx)$/.test(relativePath)) {
          continue;
        }

        const fileText = readFileSync(join(workspaceRoot, relativePath), "utf8");

        expect(fileText, relativePath).not.toContain(
          "paid-beta-manual-qa-execution"
        );
        expect(fileText, relativePath).not.toContain(
          "PAID_BETA_MANUAL_QA_EXECUTION"
        );
      }
    }
  });
});
