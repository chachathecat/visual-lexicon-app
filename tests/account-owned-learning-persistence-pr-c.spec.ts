import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";

import * as applyRoute from "../src/app/api/account/sync/apply/route";
import * as hydrateRoute from "../src/app/api/account/sync/hydrate/route";
import {
  VLX_ACCOUNT_LEARNING_APPLY_MAX_BODY_BYTES,
  VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
  VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  type VlxAccountLearningApplyInput,
} from "../src/lib/account-persistence/staging-vertical-slice/contracts";
import {
  VLX_ACCOUNT_LEARNING_DEDICATED_STAGING_VERCEL_PROJECT_ID,
} from "../src/lib/account-persistence/read-only-preview-digest/server";
import {
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER,
  VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE,
  VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ALLOW_VALUE,
  createAccountLearningVerticalSliceRouteHandler,
  readAccountLearningVerticalSliceAccess,
  type VlxAccountLearningVerticalSliceAccess,
} from "../src/lib/account-persistence/staging-vertical-slice/server";
import {
  VLX_ACCOUNT_LEARNING_APPLY_RPC,
  applySupabaseAccountLearningVerticalSlice,
} from "../src/lib/account-persistence/staging-vertical-slice/supabase-adapter";
import { validateAccountLearningApplyInput } from "../src/lib/account-persistence/staging-vertical-slice/validator";

const origin = "https://pr-c.visuallexicon.test";
const ownerAccountId = "6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b";
const otherAccountId = "74d2da4e-5947-49ef-a24d-659c5e95f08d";
const sha = "1".repeat(40);
const deploymentId = `dpl_${"A".repeat(24)}`;
const secret = "test-only-secret-that-is-longer-than-thirty-two-bytes";

const validInput: VlxAccountLearningApplyInput = {
  schemaVersion: 1,
  fixture: VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  savedWord: {
    ...VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
    savedAt: "2026-07-15T09:00:00.000Z",
  },
  reviewEvent: {
    eventId: "pr-c-event-001",
    sessionId: "pr-c-session-001",
    ...VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
    responseMs: 4200,
    createdAt: "2026-07-15T09:05:00.000Z",
  },
};

const baseReadAccess = {
  enabled: true,
  target: "isolated_staging",
  expectedProjectRefMatched: true,
  productionProjectRefExcluded: true,
  dedicatedVercelProjectMatched: true,
  expectedBranchMatched: true,
  expectedCommitMatched: true,
  canonicalRepositoryMatched: true,
  vercelPlatformConfirmed: true,
  productionRuntimeConfirmed: true,
  hmacSecretConfigured: true,
} as const;

const enabledAccess: VlxAccountLearningVerticalSliceAccess = {
  enabled: true,
  target: "isolated_staging",
  baseReadAccess,
  hydrateModeMatched: true,
  writeModeMatched: true,
  killSwitchAllowsWrites: true,
  writeCapabilityConfigured: true,
  deploymentShaMatched: true,
  ownerAllowlistConfigured: true,
};

function makeClient({
  user = { id: ownerAccountId, is_anonymous: false },
  authError = null,
}: {
  user?: { id: string; is_anonymous?: unknown } | null;
  authError?: unknown;
} = {}) {
  return {
    auth: {
      async getUser() {
        return { data: { user }, error: authError };
      },
    },
  } as unknown as SupabaseClient;
}

function applyRequest(
  body: unknown = validInput,
  {
    idempotencyKey = "pr-c-idempotency-001",
    requestOrigin = origin,
    contentType = "application/json",
  }: {
    idempotencyKey?: string | null;
    requestOrigin?: string;
    contentType?: string;
  } = {}
) {
  const headers = new Headers({
    Origin: requestOrigin,
    "Content-Type": contentType,
    "x-forwarded-for": "203.0.113.42",
  });
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  return new Request(`${origin}/api/account/sync/apply`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function hydrateRequest(search = "") {
  return new Request(`${origin}/api/account/sync/hydrate${search}`, {
    headers: { "x-forwarded-for": "203.0.113.42" },
  });
}

function enabledHandler(
  route: "apply" | "hydrate",
  overrides: Parameters<
    typeof createAccountLearningVerticalSliceRouteHandler
  >[1] = {}
) {
  return createAccountLearningVerticalSliceRouteHandler(route, {
    readAccess: () => enabledAccess,
    createClient: async () => makeClient(),
    checkRateLimit: async () => ({ rateLimited: false }),
    cursorHmacSecret: secret,
    writeCapability: secret,
    deploymentSha: sha,
    deploymentId,
    expectedOwnerAccountId: ownerAccountId,
    ...overrides,
  });
}

function expectSecurityHeaders(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("x-frame-options")).toBe("DENY");
}

test.describe("account-owned learning persistence PR C", () => {
  test("golden runner has an explicit one-shot live timeout without retries", () => {
    const goldenSpec = readFileSync(
      join(
        process.cwd(),
        "tests",
        "account-persistence-staging-golden.e2e.spec.ts"
      ),
      "utf8"
    );

    expect(goldenSpec).toContain(
      "test.describe.configure({ retries: 0, timeout: 120_000 });"
    );
    expect(goldenSpec).toContain("VLX_PR_C_GOLDEN_DENIED_STORAGE_STATE");
    expect(goldenSpec).toContain("Promise.allSettled(");
    expect(goldenSpec).toContain("closeContextWithDeadline(");
    expect(goldenSpec).toContain("Golden cleanup failures:");
    expect(goldenSpec).toContain('error: { code: "AUTH_REQUIRED" }');
  });

  test("activation SQL pins the hosted identity boundary and scopes its post-grant handle", () => {
    const sqlRoot = join(
      process.cwd(),
      "src",
      "lib",
      "account-persistence",
      "supabase-staging",
      "sql"
    );
    const enableSql = readFileSync(
      join(sqlRoot, "002_account_learning_apply_enable.sql"),
      "utf8"
    );
    const rollbackSql = readFileSync(
      join(sqlRoot, "002_account_learning_apply_operational_rollback.sql"),
      "utf8"
    );

    for (const sql of [enableSql, rollbackSql]) {
      expect(sql).toContain("octet_length(helper.prosrc) = 2450");
      expect(sql).toContain(
        "f25c2dad95890745c3f0fbc3807e7a415f48829425a8660f08c2163a88967267"
      );
      expect(sql).toContain("octet_length(internal.prosrc) = 14817");
      expect(sql).toContain(
        "f3f25dc5a8278862e356f2c93d130589674942d8b6fc50963b2d8475b0c838fd"
      );

      const operatorGuard = sql.indexOf(
        "if current_user is distinct from 'postgres' then"
      );
      const privateObjectResolution = sql.indexOf(
        "control_object := to_regclass("
      );
      expect(operatorGuard).toBeGreaterThan(-1);
      expect(privateObjectResolution).toBeGreaterThan(operatorGuard);
      expect(sql.slice(0, operatorGuard)).not.toContain("regclass := to_regclass");
      expect(sql.slice(0, operatorGuard)).not.toContain(
        "regprocedure := to_regprocedure"
      );
    }

    expect(enableSql).toContain(
      "when operator.rolsuper then 'vlx_account_learning_writer'::regrole::oid"
    );
    expect(enableSql).toContain(
      "else operator.oid\n  end\n  into wrapper_authenticated_grantor"
    );

    const wrapperGrantEnd = enableSql.indexOf(
      "to authenticated\ngranted by postgres;"
    );
    expect(wrapperGrantEnd).toBeGreaterThan(-1);
    const postGrantGuard = enableSql.slice(wrapperGrantEnd);
    expect(postGrantGuard).toContain(
      "declare\n  request_identity_helper regprocedure :="
    );
    expect(
      postGrantGuard.match(/request_identity_helper regprocedure :=/g)
    ).toHaveLength(1);
  });

  test("actual apply and hydrate exports fail closed without staging activation", async () => {
    const [apply, hydrate] = await Promise.all([
      applyRoute.POST(applyRequest()),
      hydrateRoute.GET(hydrateRequest()),
    ]);

    expect(apply.status).toBe(503);
    expect(hydrate.status).toBe(503);
    expect(await apply.json()).toEqual({ error: { code: "ROUTE_DISABLED" } });
    expect(await hydrate.json()).toEqual({ error: { code: "ROUTE_DISABLED" } });
    expectSecurityHeaders(apply);
    expectSecurityHeaders(hydrate);
  });

  test("requires exact Preview project, branch, SHA, modes, capability, and kill-switch state", () => {
    const env = {
      VLX_ACCOUNT_LEARNING_READ_MODE: "staging_read_only",
      VLX_ACCOUNT_LEARNING_EXPECTED_SUPABASE_PROJECT_REF: "vlxstaging",
      VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF: "vlxproduction",
      VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH:
        "release/account-persistence-pr-c-staging",
      VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA: sha,
      VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET: secret,
      VLX_ACCOUNT_LEARNING_HYDRATE_MODE:
        VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE,
      VLX_ACCOUNT_LEARNING_WRITE_MODE:
        VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE,
      VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH:
        VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ALLOW_VALUE,
      VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY: secret,
      VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID: ownerAccountId,
      NEXT_PUBLIC_SUPABASE_URL: "https://vlxstaging.supabase.co",
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      VERCEL: "1",
      VERCEL_PROJECT_ID:
        VLX_ACCOUNT_LEARNING_DEDICATED_STAGING_VERCEL_PROJECT_ID,
      VERCEL_GIT_REPO_OWNER: "chachathecat",
      VERCEL_GIT_REPO_SLUG: "visual-lexicon-app",
      VERCEL_GIT_COMMIT_REF: "release/account-persistence-pr-c-staging",
      VERCEL_GIT_COMMIT_SHA: sha,
    };

    expect(readAccountLearningVerticalSliceAccess("apply", env).enabled).toBe(
      true
    );
    expect(
      readAccountLearningVerticalSliceAccess("hydrate", env).enabled
    ).toBe(true);

    const killed = {
      ...env,
      VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH: "halted",
    };
    expect(readAccountLearningVerticalSliceAccess("apply", killed).enabled).toBe(
      false
    );
    expect(
      readAccountLearningVerticalSliceAccess("hydrate", killed).enabled
    ).toBe(true);

    for (const candidate of [
      { ...env, VERCEL_ENV: "production" },
      { ...env, VERCEL_PROJECT_ID: undefined },
      { ...env, VERCEL_PROJECT_ID: "prj_wrongDedicatedStagingProject000" },
      { ...env, VERCEL_GIT_COMMIT_REF: "main" },
      { ...env, VERCEL_GIT_COMMIT_SHA: "2".repeat(40) },
      { ...env, VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY: "too-short" },
      { ...env, VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID: "not-a-uuid" },
      {
        ...env,
        VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF: "vlxstaging",
      },
    ]) {
      expect(
        readAccountLearningVerticalSliceAccess("apply", candidate).enabled
      ).toBe(false);
    }
  });

  test("strictly accepts only the canonical one-word one-event payload", () => {
    expect(validateAccountLearningApplyInput(validInput)).toEqual({
      ok: true,
      value: validInput,
    });

    for (const invalid of [
      { ...validInput, accountId: ownerAccountId },
      { ...validInput, entitlement: { paid: true } },
      { ...validInput, packProgress: { complete: true } },
      {
        ...validInput,
        reviewState: { dissonance: { mastery: "Mastered", box: 5 } },
      },
      {
        ...validInput,
        reviewEvent: { ...validInput.reviewEvent, boxAfter: 5 },
      },
      {
        ...validInput,
        reviewEvent: { ...validInput.reviewEvent, slug: "other" },
      },
      {
        ...validInput,
        reviewEvent: { ...validInput.reviewEvent, responseMs: 5_001 },
      },
    ]) {
      expect(validateAccountLearningApplyInput(invalid).ok).toBe(false);
    }
  });

  test("rejects malformed, oversized, cross-origin, missing-key, fake mastery, and out-of-scope data before auth", async () => {
    let clientCreations = 0;
    const handler = enabledHandler("apply", {
      createClient: async () => {
        clientCreations += 1;
        return makeClient();
      },
    });
    const cases: Array<[Request, number, string]> = [
      [applyRequest(validInput, { idempotencyKey: null }), 400, "IDEMPOTENCY_KEY_REQUIRED"],
      [applyRequest(validInput, { requestOrigin: "https://attacker.test" }), 403, "ORIGIN_NOT_ALLOWED"],
      [applyRequest(validInput, { contentType: "text/plain" }), 415, "UNSUPPORTED_MEDIA_TYPE"],
      [applyRequest("{"), 400, "MALFORMED_REQUEST"],
      [
        applyRequest({
          ...validInput,
          reviewState: { dissonance: { mastery: "Mastered", box: 5 } },
        }),
        422,
        "FAKE_MASTERY_REJECTED",
      ],
      [
        applyRequest({ ...validInput, billing: { paid: true } }),
        400,
        "OUT_OF_SCOPE_FIELD",
      ],
      [
        applyRequest(`{"padding":"${"x".repeat(
          VLX_ACCOUNT_LEARNING_APPLY_MAX_BODY_BYTES
        )}"}`),
        413,
        "REQUEST_TOO_LARGE",
      ],
    ];

    for (const [request, status, code] of cases) {
      const response = await handler(request);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: { code } });
    }
    expect(clientCreations).toBe(0);
  });

  test("commits once, replays without mutation, and maps conflicts without leaking payloads", async () => {
    const committed = await enabledHandler("apply", {
      applyEvidence: async () => ({
        ok: true,
        ownerAccountId,
        callsNetwork: true,
        outcome: {
          status: "committed",
          requestFingerprint: `sha256:${"a".repeat(64)}`,
          savedWordsInserted: 1,
          reviewEventsInserted: 1,
          duplicateReviewEvents: 0,
          idempotencyRecordsInserted: 1,
          learningEvidenceMutated: true,
        },
      }),
    })(applyRequest());
    const replayed = await enabledHandler("apply", {
      applyEvidence: async () => ({
        ok: true,
        ownerAccountId,
        callsNetwork: true,
        outcome: {
          status: "replayed",
          requestFingerprint: `sha256:${"a".repeat(64)}`,
          savedWordsInserted: 0,
          reviewEventsInserted: 0,
          duplicateReviewEvents: 1,
          idempotencyRecordsInserted: 0,
          learningEvidenceMutated: false,
        },
      }),
    })(applyRequest());
    const conflict = await enabledHandler("apply", {
      applyEvidence: async () => ({
        ok: true,
        ownerAccountId,
        callsNetwork: true,
        outcome: { status: "conflict" },
      }),
    })(applyRequest());
    const impossibleCommit = await enabledHandler("apply", {
      applyEvidence: async () => ({
        ok: true,
        ownerAccountId,
        callsNetwork: true,
        outcome: {
          status: "committed",
          requestFingerprint: `sha256:${"a".repeat(64)}`,
          savedWordsInserted: 1,
          reviewEventsInserted: 1,
          duplicateReviewEvents: 1,
          idempotencyRecordsInserted: 0,
          learningEvidenceMutated: false,
        },
      }),
    })(applyRequest());

    expect(committed.status).toBe(200);
    expect(committed.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER)).toBe(
      sha
    );
    expect(committed.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER)).toBe(
      deploymentId
    );
    expect(await committed.json()).toMatchObject({
      status: "committed",
      counts: { savedWordsInserted: 1, reviewEventsInserted: 1 },
      mutatesServer: true,
      mutatesLearningEvidence: true,
      grantsPaidEntitlement: false,
      touchesBilling: false,
      touchesPackProgress: false,
    });
    expect(replayed.status).toBe(200);
    expect(replayed.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER)).toBe(
      sha
    );
    expect(replayed.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER)).toBe(
      deploymentId
    );
    expect(await replayed.json()).toMatchObject({
      status: "replayed",
      idempotency: { replayed: true },
      mutatesServer: false,
      mutatesLearningEvidence: false,
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({
      error: { code: "IDEMPOTENCY_CONFLICT" },
    });
    expect(impossibleCommit.status).toBe(500);
    expect(await impossibleCommit.json()).toEqual({
      error: { code: "RESPONSE_BOUNDARY_FAILED" },
    });
  });

  test("RPC adapter rebinds the owner, passes no owner/mastery/box field, and disables SDK retries", async () => {
    const calls: Array<{ kind: string; value?: unknown }> = [];
    const client = {
      auth: {
        async getUser() {
          calls.push({ kind: "getUser" });
          return {
            data: { user: { id: ownerAccountId, is_anonymous: false } },
            error: null,
          };
        },
      },
      rpc(name: string, params: Record<string, unknown>) {
        calls.push({ kind: "rpc", value: { name, params } });
        return {
          async retry(enabled: boolean) {
            calls.push({ kind: "retry", value: enabled });
            return {
              data: {
                status: "committed",
                requestFingerprint: `sha256:${"b".repeat(64)}`,
                savedWordsInserted: 1,
                reviewEventsInserted: 1,
                duplicateReviewEvents: 0,
                idempotencyRecordsInserted: 1,
                learningEvidenceMutated: true,
              },
              error: null,
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    const result = await applySupabaseAccountLearningVerticalSlice({
      client,
      expectedOwnerAccountId: ownerAccountId,
      input: validInput,
      idempotencyKey: "pr-c-idempotency-001",
      writeCapability: secret,
      deploymentSha: sha,
    });

    expect(result.ok).toBe(true);
    const rpcCall = calls.find((call) => call.kind === "rpc")?.value as {
      name: string;
      params: Record<string, unknown>;
    };
    expect(rpcCall.name).toBe(VLX_ACCOUNT_LEARNING_APPLY_RPC);
    expect(rpcCall.params).not.toHaveProperty("owner_account_id");
    expect(rpcCall.params).not.toHaveProperty("account_id");
    expect(JSON.stringify(rpcCall.params)).not.toMatch(/master|box|billing|entitlement|pack/i);
    expect(calls).toContainEqual({ kind: "retry", value: false });

    const crossOwner = await applySupabaseAccountLearningVerticalSlice({
      client,
      expectedOwnerAccountId: otherAccountId,
      input: validInput,
      idempotencyKey: "pr-c-idempotency-001",
      writeCapability: secret,
      deploymentSha: sha,
    });
    expect(crossOwner).toMatchObject({
      ok: false,
      error: { code: "invalid_authenticated_session" },
    });

    const invalidProviderClient = {
      ...client,
      rpc() {
        return {
          async retry() {
            return {
              data: {
                status: "replayed",
                requestFingerprint: `sha256:${"b".repeat(64)}`,
                savedWordsInserted: 0,
                reviewEventsInserted: 1,
                duplicateReviewEvents: 0,
                idempotencyRecordsInserted: 0,
                learningEvidenceMutated: true,
              },
              error: null,
            };
          },
        };
      },
    } as unknown as SupabaseClient;
    const invalidProvider = await applySupabaseAccountLearningVerticalSlice({
      client: invalidProviderClient,
      expectedOwnerAccountId: ownerAccountId,
      input: validInput,
      idempotencyKey: "pr-c-idempotency-002",
      writeCapability: secret,
      deploymentSha: sha,
    });
    expect(invalidProvider).toMatchObject({
      ok: false,
      error: { code: "invalid_provider_payload" },
    });
  });

  test("hydrates only bounded owner evidence and never exposes an account identifier", async () => {
    const empty = await enabledHandler("hydrate", {
      readEvidence: async () => ({
        ok: true,
        ownerAccountId,
        bounded: true,
        data: { savedWords: [], reviewEvents: [] },
      }),
    })(hydrateRequest());
    const populated = await enabledHandler("hydrate", {
      readEvidence: async () => ({
        ok: true,
        ownerAccountId,
        bounded: true,
        data: {
          savedWords: [validInput.savedWord],
          reviewEvents: [validInput.reviewEvent],
        },
      }),
    })(hydrateRequest());

    expect(empty.status).toBe(200);
    expect(empty.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER)).toBe(
      sha
    );
    expect(empty.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER)).toBe(
      deploymentId
    );
    expect(await empty.json()).toMatchObject({
      counts: { savedWords: 0, reviewEvents: 0 },
    });
    expect(populated.status).toBe(200);
    expect(populated.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER)).toBe(
      sha
    );
    expect(populated.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER)).toBe(
      deploymentId
    );
    const body = await populated.json();
    expect(body).toMatchObject({
      route: "hydrate",
      readOnly: true,
      bounded: true,
      counts: { savedWords: 1, reviewEvents: 1 },
      mutatesServer: false,
      mutatesBrowser: false,
    });
    expect(JSON.stringify(body)).not.toContain(ownerAccountId);
    expect(JSON.stringify(body)).not.toMatch(/email|token|provider/i);

    const badQuery = await enabledHandler("hydrate")(hydrateRequest("?accountId=x"));
    expect(badQuery.status).toBe(400);
    expect(await badQuery.json()).toEqual({
      error: { code: "MALFORMED_REQUEST" },
    });
  });

  test("fails closed when an adapter returns evidence for a different owner", async () => {
    const mismatchedApply = await enabledHandler("apply", {
      applyEvidence: async () => ({
        ok: true,
        ownerAccountId: otherAccountId,
        callsNetwork: true,
        outcome: {
          status: "committed",
          requestFingerprint: `sha256:${"c".repeat(64)}`,
          savedWordsInserted: 1,
          reviewEventsInserted: 1,
          duplicateReviewEvents: 0,
          idempotencyRecordsInserted: 1,
          learningEvidenceMutated: true,
        },
      }),
    })(applyRequest());
    const mismatchedHydrate = await enabledHandler("hydrate", {
      readEvidence: async () => ({
        ok: true,
        ownerAccountId: otherAccountId,
        bounded: true,
        data: {
          savedWords: [validInput.savedWord],
          reviewEvents: [validInput.reviewEvent],
        },
      }),
    })(hydrateRequest());

    expect(mismatchedApply.status).toBe(502);
    expect(await mismatchedApply.json()).toEqual({
      error: { code: "INVALID_EVIDENCE_RESPONSE" },
    });
    expect(mismatchedHydrate.status).toBe(502);
    expect(await mismatchedHydrate.json()).toEqual({
      error: { code: "INVALID_EVIDENCE_RESPONSE" },
    });
  });

  test("fails closed before auth when deployment attestation metadata is absent or malformed", async () => {
    let clientCreations = 0;
    for (const overrides of [
      { deploymentId: null },
      { deploymentId: "dpl_too-short" },
      { deploymentId: "deployment_not_vercel" },
      { deploymentSha: null },
      { deploymentSha: "not-a-sha" },
    ]) {
      const response = await enabledHandler("apply", {
        ...overrides,
        createClient: async () => {
          clientCreations += 1;
          return makeClient();
        },
      })(applyRequest());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: { code: "ROUTE_DISABLED" },
      });
      expect(response.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER)).toBe(
        null
      );
      expect(response.headers.get(VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER)).toBe(
        null
      );
    }
    expect(clientCreations).toBe(0);
  });

  test("anonymous and cross-account sessions never reach apply or hydrate storage", async () => {
    let applyCalls = 0;
    let hydrateCalls = 0;
    for (const user of [
      null,
      { id: ownerAccountId, is_anonymous: true },
      { id: ownerAccountId },
    ]) {
      const apply = await enabledHandler("apply", {
        createClient: async () => makeClient({ user }),
        applyEvidence: async () => {
          applyCalls += 1;
          throw new Error("must not be called");
        },
      })(applyRequest());
      const hydrate = await enabledHandler("hydrate", {
        createClient: async () => makeClient({ user }),
        readEvidence: async () => {
          hydrateCalls += 1;
          throw new Error("must not be called");
        },
      })(hydrateRequest());
      expect(apply.status).toBe(401);
      expect(hydrate.status).toBe(401);
    }

    const crossAccountApply = await enabledHandler("apply", {
      createClient: async () => makeClient({
        user: { id: otherAccountId, is_anonymous: false },
      }),
      applyEvidence: async () => {
        applyCalls += 1;
        throw new Error("must not be called");
      },
    })(applyRequest());
    const crossAccountHydrate = await enabledHandler("hydrate", {
      createClient: async () => makeClient({
        user: { id: otherAccountId, is_anonymous: false },
      }),
      readEvidence: async () => {
        hydrateCalls += 1;
        throw new Error("must not be called");
      },
    })(hydrateRequest());
    expect(crossAccountApply.status).toBe(401);
    expect(crossAccountHydrate.status).toBe(401);
    expect(applyCalls).toBe(0);
    expect(hydrateCalls).toBe(0);
  });
});
