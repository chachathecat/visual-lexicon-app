import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import {
  expect,
  test,
  type BrowserContext,
} from "@playwright/test";

import {
  VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
  VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
  VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  type VlxAccountLearningApplyInput,
} from "../src/lib/account-persistence/staging-vertical-slice/contracts";
import {
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER,
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER,
} from "../src/lib/account-persistence/staging-vertical-slice/server";

const goldenBaseUrl = process.env.VLX_PR_C_GOLDEN_BASE_URL;
const goldenStorageStatePath = process.env.VLX_PR_C_GOLDEN_STORAGE_STATE;
const goldenDeniedStorageStatePath =
  process.env.VLX_PR_C_GOLDEN_DENIED_STORAGE_STATE;
const goldenTarget = process.env.VLX_PR_C_GOLDEN_TARGET;
const goldenRunId = process.env.VLX_PR_C_GOLDEN_RUN_ID;
const goldenSavedAt = process.env.VLX_PR_C_GOLDEN_SAVED_AT;
const goldenExpectedSha = process.env.VLX_PR_C_GOLDEN_EXPECTED_SHA;
const goldenExpectedDeploymentId =
  process.env.VLX_PR_C_GOLDEN_EXPECTED_DEPLOYMENT_ID;
const goldenConfigurationPresent = Boolean(
  goldenBaseUrl ||
    goldenStorageStatePath ||
    goldenDeniedStorageStatePath ||
    goldenTarget ||
    goldenRunId ||
    goldenSavedAt ||
    goldenExpectedSha ||
    goldenExpectedDeploymentId
);
const goldenConfigurationComplete = Boolean(
  goldenBaseUrl &&
    goldenStorageStatePath &&
    goldenDeniedStorageStatePath &&
    goldenTarget === "isolated_track_b_staging_preview" &&
    goldenRunId &&
    goldenSavedAt &&
    goldenExpectedSha &&
    goldenExpectedDeploymentId
);
const goldenRunIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gitCommitShaPattern = /^[0-9a-f]{40}$/;
const vercelDeploymentIdPattern = /^dpl_[A-Za-z0-9]{20,64}$/;
const goldenTestTitle =
  "cross-account denial, one apply, replay, 409, fake-mastery denial, and independent Browser B hydration";
const goldenContextCleanupTimeoutMs = 10_000;

const learningKeys = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
] as const;

const packSentinel = '{"sentinel":{"reviewed":91}}';
const planSentinel = '{"planId":"sentinel-plan","paid":false}';
const upgradeInterestSentinel =
  '[{"source":"sentinel","grantsPaidEntitlement":false}]';

type StorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Strict" | "Lax" | "None";
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

function isStorageCookie(value: unknown): value is StorageState["cookies"][number] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const cookie = value as Record<string, unknown>;
  return (
    typeof cookie.name === "string" &&
    typeof cookie.value === "string" &&
    typeof cookie.domain === "string" &&
    typeof cookie.path === "string" &&
    typeof cookie.expires === "number" &&
    typeof cookie.httpOnly === "boolean" &&
    typeof cookie.secure === "boolean" &&
    (cookie.sameSite === "Strict" ||
      cookie.sameSite === "Lax" ||
      cookie.sameSite === "None")
  );
}

function readCookieOnlyStorageState(
  storageStatePath: string | undefined
): StorageState {
  if (!storageStatePath) {
    throw new Error("Golden storage-state path is not configured.");
  }

  const parsed = JSON.parse(
    readFileSync(storageStatePath, "utf8")
  ) as unknown;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Array.isArray((parsed as { cookies?: unknown }).cookies) ||
    !(parsed as { cookies: unknown[] }).cookies.every(isStorageCookie) ||
    !Array.isArray((parsed as { origins?: unknown }).origins) ||
    (parsed as { origins: unknown[] }).origins.length > 0
  ) {
    throw new Error("Golden storage state is malformed.");
  }

  const expectedHostname = new URL(goldenBaseUrl as string).hostname;
  const cookies = (parsed as { cookies: StorageState["cookies"] }).cookies;
  if (
    cookies.some(
      (cookie) => cookie.domain.replace(/^\./, "") !== expectedHostname
    )
  ) {
    throw new Error(
      "Golden storage state must contain only exact Preview-host cookies."
    );
  }

  return {
    cookies,
    origins: [],
  };
}

function readSupabaseAuthCookieFingerprint(storageState: StorageState) {
  const authCookies = storageState.cookies
    .filter((cookie) => /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/.test(cookie.name))
    .map((cookie) => `${cookie.name}:${cookie.value}`)
    .sort();

  return {
    configured: authCookies.length > 0,
    fingerprint:
      authCookies.length > 0
        ? createHash("sha256").update(authCookies.join("|")).digest("hex")
        : null,
  };
}

function createGoldenApplyInput(): VlxAccountLearningApplyInput {
  const savedAt = new Date(goldenSavedAt as string);
  const createdAt = new Date(savedAt.getTime() + 1_000);

  return {
    schemaVersion: 1,
    fixture: VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
    savedWord: {
      ...VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
      savedAt: savedAt.toISOString(),
    },
    reviewEvent: {
      eventId: `pr-c-event-${goldenRunId}`,
      sessionId: `pr-c-browser-${goldenRunId}`,
      ...VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
      responseMs: 3_000,
      createdAt: createdAt.toISOString(),
    },
  };
}

function safeFailureSummary(error: unknown) {
  if (!(error instanceof Error)) return "Non-Error failure";
  return `${error.name}: ${error.message}`.slice(0, 1_000);
}

async function closeContextWithDeadline(context: BrowserContext, index: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      context.close(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                `Browser context ${index + 1} cleanup exceeded ${goldenContextCleanupTimeoutMs}ms.`
              )
            ),
          goldenContextCleanupTimeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function closeContextsWithoutMaskingFlowFailure(
  contexts: BrowserContext[],
  flowFailure: unknown
) {
  const closeResults = await Promise.allSettled(
    contexts.map((context, index) => closeContextWithDeadline(context, index))
  );
  const cleanupFailures = closeResults.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : []
  );

  if (flowFailure !== null) {
    if (flowFailure instanceof Error && cleanupFailures.length > 0) {
      const cleanupSummary = cleanupFailures
        .map(safeFailureSummary)
        .join(" | ");
      flowFailure.message += `\nGolden cleanup failures: ${cleanupSummary}`;
      if (flowFailure.stack) {
        flowFailure.stack += `\nGolden cleanup failures: ${cleanupSummary}`;
      }
    }
    throw flowFailure;
  }

  if (cleanupFailures.length > 0) {
    throw new Error(
      `Golden cleanup failures: ${cleanupFailures
        .map(safeFailureSummary)
        .join(" | ")}`
    );
  }
}

async function installCleanBrowserBaseline(context: BrowserContext) {
  await context.addInitScript(
    ({ keys, pack, plan, upgradeInterest }) => {
      for (const key of keys) window.localStorage.removeItem(key);
      window.localStorage.setItem("vlx_pack_progress_v1", pack);
      window.localStorage.setItem("vlx_plan_state_v1", plan);
      window.localStorage.setItem("vlx_upgrade_interest_v1", upgradeInterest);
    },
    {
      keys: learningKeys,
      pack: packSentinel,
      plan: planSentinel,
      upgradeInterest: upgradeInterestSentinel,
    }
  );
}

function expectDeploymentAttestation(response: {
  headers(): Record<string, string>;
}) {
  expect(
    response.headers()[VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER.toLowerCase()]
  ).toBe(goldenExpectedSha);
  expect(
    response.headers()[VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER.toLowerCase()]
  ).toBe(goldenExpectedDeploymentId);
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test.skip(
  !goldenConfigurationPresent,
  "Run only against the explicitly configured isolated staging Preview."
);

test.describe("Track B PR C live staging golden flow", () => {
  test.describe.configure({ retries: 0, timeout: 120_000 });

  test.beforeAll(() => {
    expect(goldenConfigurationComplete).toBe(true);
    const target = new URL(goldenBaseUrl as string);
    expect(target.protocol).toBe("https:");
    expect(target.username).toBe("");
    expect(target.password).toBe("");
    expect(target.pathname).toBe("/");
    expect(target.search).toBe("");
    expect(target.hash).toBe("");
    expect(target.hostname).toMatch(
      /^visual-lexicon-app-staging-[a-z0-9-]+\.vercel\.app$/
    );
    expect(goldenRunId).toMatch(goldenRunIdPattern);
    expect(new Date(goldenSavedAt as string).toISOString()).toBe(goldenSavedAt);
    expect(goldenExpectedSha).toMatch(gitCommitShaPattern);
    expect(goldenExpectedDeploymentId).toMatch(vercelDeploymentIdPattern);
    const checkoutSha = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
    expect(checkoutSha).toBe(goldenExpectedSha);

    const repositoryRoot = realpathSync(process.cwd());
    const storageStatePaths = [
      goldenStorageStatePath as string,
      goldenDeniedStorageStatePath as string,
    ].map((storageStatePath) => realpathSync(resolve(storageStatePath)));

    for (const storageStatePath of storageStatePaths) {
      const repositoryRelativePath = relative(repositoryRoot, storageStatePath);
      const outsideRepository =
        repositoryRelativePath === ".." ||
        repositoryRelativePath.startsWith(`..${sep}`) ||
        isAbsolute(repositoryRelativePath);
      const insideIgnoredAuthDirectory =
        repositoryRelativePath.startsWith(`.playwright-auth${sep}`);
      expect(outsideRepository || insideIgnoredAuthDirectory).toBe(true);
    }

    expect(storageStatePaths[0] !== storageStatePaths[1]).toBe(true);
    const ownerAuthCookie = readSupabaseAuthCookieFingerprint(
      readCookieOnlyStorageState(goldenStorageStatePath)
    );
    const deniedAuthCookie = readSupabaseAuthCookieFingerprint(
      readCookieOnlyStorageState(goldenDeniedStorageStatePath)
    );
    expect(ownerAuthCookie.configured).toBe(true);
    expect(deniedAuthCookie.configured).toBe(true);
    expect(ownerAuthCookie.fingerprint !== deniedAuthCookie.fingerprint).toBe(
      true
    );
  });

  test(goldenTestTitle, async ({ browser }) => {
    const storageState = readCookieOnlyStorageState(goldenStorageStatePath);
    const deniedStorageState = readCookieOnlyStorageState(
      goldenDeniedStorageStatePath
    );
    const contexts: BrowserContext[] = [];
    let flowFailure: unknown = null;
    try {
      const browserA = await browser.newContext({
        baseURL: goldenBaseUrl,
        storageState,
      });
      contexts.push(browserA);
      const browserB = await browser.newContext({
        baseURL: goldenBaseUrl,
        storageState,
      });
      contexts.push(browserB);
      const browserDenied = await browser.newContext({
        baseURL: goldenBaseUrl,
        storageState: deniedStorageState,
      });
      contexts.push(browserDenied);

      await browserA.addInitScript(
        ({ key, runId, savedAt }) => {
          window.sessionStorage.setItem(
            key,
            JSON.stringify({ runId, savedAt })
          );
        },
        {
          key: VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY,
          runId: goldenRunId as string,
          savedAt: goldenSavedAt as string,
        }
      );
      await installCleanBrowserBaseline(browserB);

      const deniedPage = await browserDenied.newPage();
      const deniedDigestBefore = await deniedPage.request.get(
        new URL("/api/account/sync/digest", goldenBaseUrl).toString()
      );
      expect(deniedDigestBefore.status()).toBe(200);
      expect(await deniedDigestBefore.json()).toMatchObject({
        route: "digest",
        readOnly: true,
        bounded: true,
        counts: { savedWords: 0, reviewEvents: 0 },
        complete: { savedWords: true, reviewEvents: true },
        mutatesServer: false,
        mutatesBrowser: false,
        grantsPaidEntitlement: false,
      });
      const deniedOperatorPage = await deniedPage.goto(
        "/staging/account-learning"
      );
      expect(deniedOperatorPage?.status()).toBe(404);

      const deniedApplyResponse = await deniedPage.request.post(
        new URL("/api/account/sync/apply", goldenBaseUrl).toString(),
        {
          data: createGoldenApplyInput(),
          headers: {
            "Idempotency-Key": `pr-c-denied-${goldenRunId}`,
            Origin: new URL(goldenBaseUrl as string).origin,
          },
        }
      );
      expect(deniedApplyResponse.status()).toBe(401);
      expect(await deniedApplyResponse.json()).toEqual({
        error: { code: "AUTH_REQUIRED" },
      });

      const deniedHydrateResponse = await deniedPage.request.get(
        new URL("/api/account/sync/hydrate", goldenBaseUrl).toString()
      );
      expect(deniedHydrateResponse.status()).toBe(401);
      expect(await deniedHydrateResponse.json()).toEqual({
        error: { code: "AUTH_REQUIRED" },
      });

      const pageA = await browserA.newPage();
      await pageA.goto("/staging/account-learning");
      await expect(
        pageA.getByRole("heading", { name: "Golden-flow controls" })
      ).toBeVisible();

      const preflightResponse = await pageA.request.get(
        new URL("/api/account/sync/hydrate", goldenBaseUrl).toString()
      );
      expect(preflightResponse.status()).toBe(200);
      expectDeploymentAttestation(preflightResponse);
      expect(await preflightResponse.json()).toMatchObject({
        route: "hydrate",
        readOnly: true,
        bounded: true,
        counts: { savedWords: 0, reviewEvents: 0 },
        complete: { savedWords: true, reviewEvents: true },
        mutatesServer: false,
        mutatesBrowser: false,
        grantsPaidEntitlement: false,
        touchesBilling: false,
        touchesPackProgress: false,
      });

      const [commitResponse] = await Promise.all([
        pageA.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/apply" &&
            response.request().method() === "POST"
        ),
        pageA.getByRole("button", { name: "Apply canonical pair" }).click(),
      ]);
      expect(commitResponse.status()).toBe(200);
      expectDeploymentAttestation(commitResponse);
      const commitBody = (await commitResponse.json()) as Record<string, unknown>;
      expect(commitBody).toMatchObject({
        status: "committed",
        counts: {
          savedWordsInserted: 1,
          reviewEventsInserted: 1,
          duplicateReviewEvents: 0,
          idempotencyRecordsInserted: 1,
        },
        idempotency: { replayed: false },
        mutatesServer: true,
        mutatesLearningEvidence: true,
        grantsPaidEntitlement: false,
        touchesBilling: false,
        touchesPackProgress: false,
      });
      const commitFingerprint = (
        commitBody.idempotency as { fingerprint?: unknown }
      ).fingerprint;
      expect(commitFingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
      await expect(pageA.getByText("Committed once", { exact: true })).toBeVisible();

      const [replayResponse] = await Promise.all([
        pageA.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/apply" &&
            response.request().method() === "POST"
        ),
        pageA.getByRole("button", { name: "Prove replay" }).click(),
      ]);
      expect(replayResponse.status()).toBe(200);
      expectDeploymentAttestation(replayResponse);
      expect(await replayResponse.json()).toMatchObject({
        status: "replayed",
        counts: {
          savedWordsInserted: 0,
          reviewEventsInserted: 0,
          duplicateReviewEvents: 1,
          idempotencyRecordsInserted: 0,
        },
        idempotency: { fingerprint: commitFingerprint, replayed: true },
        mutatesServer: false,
        mutatesLearningEvidence: false,
      });
      await expect(pageA.getByText("Replay no-op", { exact: true })).toBeVisible();

      const [conflictResponse] = await Promise.all([
        pageA.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/apply" &&
            response.request().method() === "POST"
        ),
        pageA.getByRole("button", { name: "Prove 409 conflict" }).click(),
      ]);
      expect(conflictResponse.status()).toBe(409);
      expect(await conflictResponse.json()).toEqual({
        error: { code: "IDEMPOTENCY_CONFLICT" },
      });
      await expect(
        pageA.getByText("IDEMPOTENCY_CONFLICT", { exact: true })
      ).toBeVisible();

      const [fakeMasteryResponse] = await Promise.all([
        pageA.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/apply" &&
            response.request().method() === "POST"
        ),
        pageA.getByRole("button", { name: "Reject fake mastery" }).click(),
      ]);
      expect(fakeMasteryResponse.status()).toBe(422);
      expect(await fakeMasteryResponse.json()).toEqual({
        error: { code: "FAKE_MASTERY_REJECTED" },
      });
      await expect(
        pageA.getByText("FAKE_MASTERY_REJECTED", { exact: true })
      ).toBeVisible();

      const pageB = await browserB.newPage();
      await pageB.goto("/staging/account-learning");
      const [hydrateResponse] = await Promise.all([
        pageB.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/hydrate" &&
            response.request().method() === "GET"
        ),
        pageB.getByRole("button", { name: "Hydrate this browser" }).click(),
      ]);
      expect(hydrateResponse.status()).toBe(200);
      expectDeploymentAttestation(hydrateResponse);
      expect(await hydrateResponse.json()).toMatchObject({
        route: "hydrate",
        readOnly: true,
        bounded: true,
        counts: { savedWords: 1, reviewEvents: 1 },
        complete: { savedWords: true, reviewEvents: true },
        mutatesServer: false,
        mutatesBrowser: false,
        grantsPaidEntitlement: false,
        touchesBilling: false,
        touchesPackProgress: false,
      });
      await expect(pageB.getByText("Browser hydrated", { exact: true })).toBeVisible();

      const evidence = await pageB.evaluate(() => ({
        savedWords: JSON.parse(
          window.localStorage.getItem("vlx_saved_words_v1") ?? "null"
        ),
        reviewState: JSON.parse(
          window.localStorage.getItem("vlx_review_state_v1") ?? "null"
        ),
        reviewEvents: JSON.parse(
          window.localStorage.getItem("vlx_review_events_v1") ?? "null"
        ),
        dailyStats: JSON.parse(
          window.localStorage.getItem("vlx_daily_stats_v1") ?? "null"
        ),
        pack: window.localStorage.getItem("vlx_pack_progress_v1"),
        plan: window.localStorage.getItem("vlx_plan_state_v1"),
        upgradeInterest: window.localStorage.getItem(
          "vlx_upgrade_interest_v1"
        ),
        learningRaw: [
          window.localStorage.getItem("vlx_saved_words_v1"),
          window.localStorage.getItem("vlx_review_state_v1"),
          window.localStorage.getItem("vlx_review_events_v1"),
          window.localStorage.getItem("vlx_daily_stats_v1"),
        ],
      }));

      expect(Object.keys(evidence.savedWords)).toEqual(["dissonance"]);
      expect(evidence.reviewEvents).toHaveLength(1);
      expect(evidence.reviewState.dissonance).toMatchObject({
        box: 1,
        mastery: "Learning",
        correct: 1,
        wrong: 0,
      });
      const reviewDate = new Date(
        Date.parse(goldenSavedAt as string) + 1_000
      )
        .toISOString()
        .slice(0, 10);
      expect(evidence.dailyStats).toEqual({
        [reviewDate]: {
          date: reviewDate,
          reviewed: 1,
          correct: 1,
          wrong: 0,
          mastered: 0,
          weakAdded: 0,
          minutes: 0.05,
          sessions: 1,
        },
      });
      expect(evidence.pack).toBe(packSentinel);
      expect(evidence.plan).toBe(planSentinel);
      expect(evidence.upgradeInterest).toBe(upgradeInterestSentinel);

      const [secondHydrateResponse] = await Promise.all([
        pageB.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/account/sync/hydrate" &&
            response.request().method() === "GET"
        ),
        pageB.getByRole("button", { name: "Hydrate this browser" }).click(),
      ]);
      expect(secondHydrateResponse.status()).toBe(200);
      expectDeploymentAttestation(secondHydrateResponse);
      await expect(pageB.getByText("Hydration no-op", { exact: true })).toBeVisible();
      const afterReplay = await pageB.evaluate(() => ({
        learningRaw: [
          window.localStorage.getItem("vlx_saved_words_v1"),
          window.localStorage.getItem("vlx_review_state_v1"),
          window.localStorage.getItem("vlx_review_events_v1"),
          window.localStorage.getItem("vlx_daily_stats_v1"),
        ],
        pack: window.localStorage.getItem("vlx_pack_progress_v1"),
        plan: window.localStorage.getItem("vlx_plan_state_v1"),
        upgradeInterest: window.localStorage.getItem(
          "vlx_upgrade_interest_v1"
        ),
      }));
      expect(afterReplay.learningRaw).toEqual(evidence.learningRaw);
      expect(afterReplay.pack).toBe(packSentinel);
      expect(afterReplay.plan).toBe(planSentinel);
      expect(afterReplay.upgradeInterest).toBe(upgradeInterestSentinel);

      const deniedDigestAfter = await deniedPage.request.get(
        new URL("/api/account/sync/digest", goldenBaseUrl).toString()
      );
      expect(deniedDigestAfter.status()).toBe(200);
      expect(await deniedDigestAfter.json()).toMatchObject({
        route: "digest",
        readOnly: true,
        bounded: true,
        counts: { savedWords: 0, reviewEvents: 0 },
        complete: { savedWords: true, reviewEvents: true },
        mutatesServer: false,
        mutatesBrowser: false,
        grantsPaidEntitlement: false,
      });
    } catch (error) {
      flowFailure = error;
    }

    await closeContextsWithoutMaskingFlowFailure(contexts, flowFailure);
  });
});
