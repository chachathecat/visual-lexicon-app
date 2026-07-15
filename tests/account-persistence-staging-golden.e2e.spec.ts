import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import {
  expect,
  test,
  type BrowserContext,
} from "@playwright/test";

import { VLX_ACCOUNT_LEARNING_GOLDEN_SEED_SESSION_KEY } from "../src/lib/account-persistence/staging-vertical-slice/contracts";
import {
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER,
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER,
} from "../src/lib/account-persistence/staging-vertical-slice/server";

const goldenBaseUrl = process.env.VLX_PR_C_GOLDEN_BASE_URL;
const goldenStorageStatePath = process.env.VLX_PR_C_GOLDEN_STORAGE_STATE;
const goldenTarget = process.env.VLX_PR_C_GOLDEN_TARGET;
const goldenRunId = process.env.VLX_PR_C_GOLDEN_RUN_ID;
const goldenSavedAt = process.env.VLX_PR_C_GOLDEN_SAVED_AT;
const goldenExpectedSha = process.env.VLX_PR_C_GOLDEN_EXPECTED_SHA;
const goldenExpectedDeploymentId =
  process.env.VLX_PR_C_GOLDEN_EXPECTED_DEPLOYMENT_ID;
const goldenConfigurationPresent = Boolean(
  goldenBaseUrl ||
    goldenStorageStatePath ||
    goldenTarget ||
    goldenRunId ||
    goldenSavedAt ||
    goldenExpectedSha ||
    goldenExpectedDeploymentId
);
const goldenConfigurationComplete = Boolean(
  goldenBaseUrl &&
    goldenStorageStatePath &&
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

function readCookieOnlyStorageState(): StorageState {
  if (!goldenStorageStatePath) {
    throw new Error("Golden storage-state path is not configured.");
  }

  const parsed = JSON.parse(
    readFileSync(goldenStorageStatePath, "utf8")
  ) as unknown;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    !Array.isArray((parsed as { cookies?: unknown }).cookies) ||
    !(parsed as { cookies: unknown[] }).cookies.every(isStorageCookie)
  ) {
    throw new Error("Golden storage state is malformed.");
  }

  return {
    cookies: (parsed as { cookies: StorageState["cookies"] }).cookies,
    origins: [],
  };
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
    const storageStatePath = realpathSync(
      resolve(goldenStorageStatePath as string)
    );
    const repositoryRelativePath = relative(repositoryRoot, storageStatePath);
    const outsideRepository =
      repositoryRelativePath === ".." ||
      repositoryRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(repositoryRelativePath);
    const insideIgnoredAuthDirectory =
      repositoryRelativePath.startsWith(`.playwright-auth${sep}`);
    expect(outsideRepository || insideIgnoredAuthDirectory).toBe(true);
  });

  test("one apply, replay, 409, fake-mastery denial, and independent Browser B hydration", async ({
    browser,
  }) => {
    const storageState = readCookieOnlyStorageState();
    const browserA = await browser.newContext({
      baseURL: goldenBaseUrl,
      storageState,
    });
    const browserB = await browser.newContext({
      baseURL: goldenBaseUrl,
      storageState,
    });

    try {
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
    } finally {
      await Promise.all([browserA.close(), browserB.close()]);
    }
  });
});
