import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_BODY_BYTES,
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_REVIEW_EVENT_IDS,
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_SAVED_WORD_SLUGS,
} from "../src/lib/account-persistence/read-only-preview-digest/contracts";
import {
  createAccountLearningReadOnlyRouteHandler,
  readAccountLearningStagingReadAccess,
  readAuthenticatedPermanentOwner,
  type VlxAccountLearningReadDependencies,
} from "../src/lib/account-persistence/read-only-preview-digest/server";
import {
  readSupabaseAccountLearningSummary,
  type VlxAccountLearningEvidencePage,
} from "../src/lib/account-persistence/read-only-preview-digest/supabase-summary-adapter";
import { validateAccountLearningPreviewInput } from "../src/lib/account-persistence/read-only-preview-digest/validator";
import * as digestRoute from "../src/app/api/account/sync/digest/route";
import * as previewRoute from "../src/app/api/account/sync/preview/route";

const workspaceRoot = process.cwd();
const requestOrigin = "https://preview.visuallexicon.test";
const ownerAccountId = "6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b";
const otherAccountId = "74d2da4e-5947-49ef-a24d-659c5e95f08d";
const cursorHmacSecret = "test-only-cursor-secret-with-at-least-32-bytes";
const reviewedCommitSha = "1".repeat(40);

const matchingActivationEnv = {
  VLX_ACCOUNT_LEARNING_READ_MODE: "staging_read_only",
  VLX_ACCOUNT_LEARNING_EXPECTED_SUPABASE_PROJECT_REF: "vlxstaging",
  VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF: "vlxproduction",
  VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH:
    "release/account-read-only-staging-activation",
  VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA: reviewedCommitSha,
  VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET: cursorHmacSecret,
  NEXT_PUBLIC_SUPABASE_URL: "https://vlxstaging.supabase.co",
  NODE_ENV: "production",
  VERCEL_ENV: "preview",
  VERCEL: "1",
  VERCEL_GIT_REPO_OWNER: "chachathecat",
  VERCEL_GIT_REPO_SLUG: "visual-lexicon-app",
  VERCEL_GIT_COMMIT_REF: "release/account-read-only-staging-activation",
  VERCEL_GIT_COMMIT_SHA: reviewedCommitSha,
} as const;

const enabledAccess = {
  enabled: true,
  target: "isolated_staging",
  expectedProjectRefMatched: true,
  productionProjectRefExcluded: true,
  expectedBranchMatched: true,
  expectedCommitMatched: true,
  canonicalRepositoryMatched: true,
  vercelPlatformConfirmed: true,
  productionRuntimeConfirmed: true,
  hmacSecretConfigured: true,
} as const;

const validPreviewBody = {
  schemaVersion: 1,
  previewOnly: true,
  localEvidence: {
    savedWordSlugs: ["dissonance", "ephemeral"],
    reviewEventIds: ["review-event-1", "review-event-local-only"],
  },
} as const;

type QueryCall =
  | { kind: "getUser" }
  | { kind: "from"; table: string }
  | { kind: "select"; columns: string; countRequested: boolean }
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "order"; column: string; ascending: boolean }
  | { kind: "limit"; value: number };

function makeClient({
  user = { id: ownerAccountId, is_anonymous: false },
  authError = null,
  throwAuth = false,
  rowsByTable = {},
  errorByTable = {},
  throwQueryByTable = {},
}: {
  user?: { id: string; is_anonymous?: unknown } | null;
  authError?: unknown;
  throwAuth?: boolean;
  rowsByTable?: Record<string, unknown[]>;
  errorByTable?: Record<string, unknown>;
  throwQueryByTable?: Record<string, unknown>;
} = {}) {
  const calls: QueryCall[] = [];
  const client = {
    auth: {
      async getUser() {
        calls.push({ kind: "getUser" });

        if (throwAuth) {
          throw new Error("private thrown auth detail");
        }

        return {
          data: { user },
          error: authError,
        };
      },
    },
    from(table: string) {
      calls.push({ kind: "from", table });
      const builder = {
        select(columns: string, options?: { count?: string }) {
          calls.push({
            kind: "select",
            columns,
            countRequested: Boolean(options?.count),
          });
          return builder;
        },
        eq(column: string, value: unknown) {
          calls.push({ kind: "eq", column, value });
          return builder;
        },
        order(column: string, options: { ascending: boolean }) {
          calls.push({ kind: "order", column, ascending: options.ascending });
          return builder;
        },
        async limit(value: number) {
          calls.push({ kind: "limit", value });

          if (throwQueryByTable[table]) {
            throw throwQueryByTable[table];
          }

          return {
            data: rowsByTable[table] ?? [],
            error: errorByTable[table] ?? null,
          };
        },
      };

      return builder;
    },
  } as unknown as SupabaseClient;

  return { calls, client };
}

function makeEvidencePage(
  input: Partial<VlxAccountLearningEvidencePage> = {}
): VlxAccountLearningEvidencePage {
  return {
    ownerAccountId,
    savedWords: [
      {
        owner_account_id: ownerAccountId,
        slug: "dissonance",
        saved_at: "2026-07-14T06:00:00.000Z",
      },
    ],
    reviewEvents: [
      {
        owner_account_id: ownerAccountId,
        event_id: "review-event-1",
        created_at: "2026-07-14T06:10:00.000Z",
      },
    ],
    complete: {
      savedWords: true,
      reviewEvents: true,
    },
    ...input,
  };
}

function successfulSummary(data = makeEvidencePage()) {
  return {
    ok: true as const,
    data,
    bounded: true as const,
    mutatesServer: false as const,
    mutatesBrowser: false as const,
  };
}

function previewRequest(body: unknown = validPreviewBody, headers = {}) {
  return new Request(`${requestOrigin}/api/account/sync/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
      "x-forwarded-for": "203.0.113.10",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function digestRequest(search = "") {
  return new Request(`${requestOrigin}/api/account/sync/digest${search}`, {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function enabledHandler(
  route: "preview" | "digest",
  options: {
    client?: SupabaseClient;
    readSummary?: typeof readSupabaseAccountLearningSummary;
    createClient?: () => Promise<SupabaseClient | null>;
    cursorHmacSecret?: string | null;
    checkRateLimit?: VlxAccountLearningReadDependencies["checkRateLimit"];
  } = {}
) {
  const { client = makeClient().client } = options;

  return createAccountLearningReadOnlyRouteHandler(route, {
    readAccess: () => enabledAccess,
    createClient: options.createClient ?? (async () => client),
    readSummary: options.readSummary ?? (async () => successfulSummary()),
    checkRateLimit:
      options.checkRateLimit ?? (async () => ({ rateLimited: false })),
    cursorHmacSecret: options.cursorHmacSecret ?? cursorHmacSecret,
  });
}

function expectSecurityHeaders(response: Response) {
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("content-type")).toContain("application/json");
}

test.describe("account-owned learning persistence PR B", () => {
  test("actual preview and digest route exports remain disabled without staging activation env", async () => {
    const [previewResponse, digestResponse] = await Promise.all([
      previewRoute.POST(previewRequest()),
      digestRoute.GET(digestRequest()),
    ]);

    expect(previewResponse.status).toBe(503);
    expect(digestResponse.status).toBe(503);
    expect(await readJson(previewResponse)).toEqual({
      error: { code: "ROUTE_DISABLED" },
    });
    expect(await readJson(digestResponse)).toEqual({
      error: { code: "ROUTE_DISABLED" },
    });
    expectSecurityHeaders(previewResponse);
    expectSecurityHeaders(digestResponse);
  });

  test("disabled, malformed, or throwing access policies never create a client", async () => {
    let clientCreations = 0;
    const createClient = async () => {
      clientCreations += 1;
      return makeClient().client;
    };
    const policies: Array<
      () => ReturnType<typeof readAccountLearningStagingReadAccess>
    > = [
      () => ({ ...enabledAccess, target: "disabled" }),
      () => ({ ...enabledAccess, expectedProjectRefMatched: false }),
      () => ({ ...enabledAccess, productionProjectRefExcluded: false }),
      () => ({ ...enabledAccess, expectedBranchMatched: false }),
      () => ({ ...enabledAccess, expectedCommitMatched: false }),
      () => ({ ...enabledAccess, canonicalRepositoryMatched: false }),
      () => ({ ...enabledAccess, vercelPlatformConfirmed: false }),
      () => ({ ...enabledAccess, productionRuntimeConfirmed: false }),
      () => ({ ...enabledAccess, hmacSecretConfigured: false }),
      () => {
        throw new Error("private access configuration detail");
      },
    ];

    for (const readAccess of policies) {
      const response = await createAccountLearningReadOnlyRouteHandler(
        "digest",
        { readAccess, createClient }
      )(digestRequest());

      expect(response.status).toBe(503);
      expect(await readJson(response)).toEqual({
        error: { code: "ROUTE_DISABLED" },
      });
      expectSecurityHeaders(response);
    }

    expect(clientCreations).toBe(0);
  });

  test("staging activation pins a production runtime, canonical repo, reviewed commit, project, and branch", () => {
    const matching = readAccountLearningStagingReadAccess(
      matchingActivationEnv
    );

    expect(matching).toEqual({
      enabled: true,
      target: "isolated_staging",
      expectedProjectRefMatched: true,
      productionProjectRefExcluded: true,
      expectedBranchMatched: true,
      expectedCommitMatched: true,
      canonicalRepositoryMatched: true,
      vercelPlatformConfirmed: true,
      productionRuntimeConfirmed: true,
      hmacSecretConfigured: true,
    });

    for (const env of [
      {},
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_EXPECTED_SUPABASE_PROJECT_REF: "wrong-project",
      },
      {
        ...matchingActivationEnv,
        VERCEL_ENV: undefined,
      },
      {
        ...matchingActivationEnv,
        VERCEL_ENV: "production",
      },
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET: "too-short",
      },
      {
        ...matchingActivationEnv,
        VERCEL_GIT_COMMIT_REF: "feature/unapproved-preview",
      },
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH: "main",
        VERCEL_GIT_COMMIT_REF: "main",
      },
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF: "vlxstaging",
      },
      {
        ...matchingActivationEnv,
        VERCEL: undefined,
      },
      {
        ...matchingActivationEnv,
        NODE_ENV: "development",
      },
      {
        ...matchingActivationEnv,
        VERCEL_GIT_REPO_OWNER: "untrusted-fork",
      },
      {
        ...matchingActivationEnv,
        VERCEL_GIT_REPO_SLUG: "visual-lexicon-app-fork",
      },
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA: "2".repeat(40),
      },
      {
        ...matchingActivationEnv,
        VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA: "not-a-commit-sha",
      },
    ]) {
      expect(readAccountLearningStagingReadAccess(env).enabled).toBe(false);
    }
  });

  test("distributed IP and owner limits run in order with only HMAC-derived keys", async () => {
    const rateLimitCalls: Array<{ id: string; key: string }> = [];
    const response = await enabledHandler("digest", {
      checkRateLimit: async (id, options) => {
        rateLimitCalls.push({ id, key: options?.rateLimitKey ?? "" });
        return { rateLimited: false };
      },
    })(digestRequest());

    expect(response.status).toBe(200);
    expect(rateLimitCalls.map((call) => call.id)).toEqual([
      "vlx-account-learning-read-ip-v1",
      "vlx-account-learning-read-owner-v1",
    ]);
    expect(rateLimitCalls[0]?.key).toMatch(/^vlx-ip-[a-f0-9]{64}$/);
    expect(rateLimitCalls[1]?.key).toMatch(/^vlx-owner-[a-f0-9]{64}$/);
    expect(JSON.stringify(rateLimitCalls)).not.toContain("203.0.113.10");
    expect(JSON.stringify(rateLimitCalls)).not.toContain(ownerAccountId);
  });

  test("missing or unconfigured distributed limits fail closed and never read evidence", async () => {
    let clientCreations = 0;
    const createClient = async () => {
      clientCreations += 1;
      return makeClient().client;
    };
    const missingIpResponse = await enabledHandler("digest", {
      createClient,
    })(new Request(`${requestOrigin}/api/account/sync/digest`));
    const unconfiguredResponse = await enabledHandler("digest", {
      createClient,
      checkRateLimit: async () => ({
        rateLimited: false,
        error: "not-found",
      }),
    })(digestRequest());
    const unavailableResponse = await enabledHandler("digest", {
      createClient,
      checkRateLimit: async () => {
        throw new Error("private firewall detail");
      },
    })(digestRequest());

    for (const response of [
      missingIpResponse,
      unconfiguredResponse,
      unavailableResponse,
    ]) {
      expect(response.status).toBe(503);
      expect(await readJson(response)).toEqual({
        error: { code: "RATE_LIMIT_UNAVAILABLE" },
      });
      expectSecurityHeaders(response);
    }
    expect(clientCreations).toBe(0);
  });

  test("IP and owner limits return a redacted 429 before evidence reads", async () => {
    let clientCreations = 0;
    const ipLimited = await enabledHandler("digest", {
      createClient: async () => {
        clientCreations += 1;
        return makeClient().client;
      },
      checkRateLimit: async () => ({ rateLimited: true }),
    })(digestRequest());

    expect(ipLimited.status).toBe(429);
    expect(ipLimited.headers.get("retry-after")).toBe("60");
    expect(await readJson(ipLimited)).toEqual({
      error: { code: "RATE_LIMITED" },
    });
    expect(clientCreations).toBe(0);

    let checks = 0;
    let summaryCalls = 0;
    const ownerLimited = await enabledHandler("digest", {
      checkRateLimit: async () => {
        checks += 1;
        return { rateLimited: checks === 2 };
      },
      readSummary: async () => {
        summaryCalls += 1;
        return successfulSummary();
      },
    })(digestRequest());

    expect(ownerLimited.status).toBe(429);
    expect(ownerLimited.headers.get("retry-after")).toBe("60");
    expect(await readJson(ownerLimited)).toEqual({
      error: { code: "RATE_LIMITED" },
    });
    expect(checks).toBe(2);
    expect(summaryCalls).toBe(0);
  });

  test("preview derives owner from getUser on the same client and returns only bounded redacted counts", async () => {
    const { client } = makeClient();
    let summaryClient: unknown;
    let summaryOwner: unknown;
    const handler = enabledHandler("preview", {
      client,
      readSummary: async (input) => {
        summaryClient = input.client;
        summaryOwner = input.ownerAccountId;
        return successfulSummary();
      },
    });

    const response = await handler(previewRequest());
    const body = await readJson(response);
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expectSecurityHeaders(response);
    expect(summaryClient).toBe(client);
    expect(summaryOwner).toBe(ownerAccountId);
    expect(body).toMatchObject({
      schemaVersion: "vlx.account-learning.preview.v1",
      route: "preview",
      ownerSource: "supabase_server_session",
      readOnly: true,
      bounded: true,
      applyEnabled: false,
      evaluatedAt: expect.any(String),
      mutatesServer: false,
      mutatesBrowser: false,
      grantsPaidEntitlement: false,
      counts: {
        local: { savedWords: 2, reviewEvents: 2 },
        accountObserved: { savedWords: 1, reviewEvents: 1 },
        overlap: { savedWords: 1, reviewEvents: 1 },
        localNotSeenInAccountPage: { savedWords: 1, reviewEvents: 1 },
        accountOnlyObserved: { savedWords: 0, reviewEvents: 0 },
      },
      complete: { savedWords: true, reviewEvents: true },
      cursors: {
        algorithm: "hmac-sha256",
        reversible: false,
        savedWords: expect.stringMatching(/^hmac-sha256:[a-f0-9]{64}$/),
        reviewEvents: expect.stringMatching(/^hmac-sha256:[a-f0-9]{64}$/),
      },
    });

    for (const forbidden of [
      ownerAccountId,
      "dissonance",
      "ephemeral",
      "review-event-1",
      "review-event-local-only",
      "2026-07-14T06:00:00.000Z",
      "2026-07-14T06:10:00.000Z",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  test("digest has no query surface and returns observed counts, completeness, and hashed cursors", async () => {
    const handler = enabledHandler("digest", {
      readSummary: async () =>
        successfulSummary(
          makeEvidencePage({
            complete: { savedWords: false, reviewEvents: true },
          })
        ),
    });

    const response = await handler(digestRequest());
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      schemaVersion: "vlx.account-learning.digest.v1",
      route: "digest",
      readOnly: true,
      bounded: true,
      applyEnabled: false,
      evaluatedAt: expect.any(String),
      mutatesServer: false,
      mutatesBrowser: false,
      grantsPaidEntitlement: false,
      counts: { savedWords: 1, reviewEvents: 1 },
      complete: { savedWords: false, reviewEvents: true },
      cursors: {
        algorithm: "hmac-sha256",
        reversible: false,
        savedWords: null,
        reviewEvents: expect.stringMatching(/^hmac-sha256:[a-f0-9]{64}$/),
      },
    });

    for (const search of [
      `?accountId=${ownerAccountId}`,
      `?targetAccountId=${otherAccountId}`,
      "?cursor=private-cursor",
      "?limit=1",
    ]) {
      const rejected = await handler(digestRequest(search));
      expect(rejected.status, search).toBe(400);
      expect(await readJson(rejected)).toEqual({
        error: { code: "MALFORMED_REQUEST" },
      });
      expectSecurityHeaders(rejected);
    }

    const oversizedQuery = await handler(
      digestRequest(`?ignored=${"x".repeat(2_100)}`)
    );
    expect(oversizedQuery.status).toBe(413);
    expect(await readJson(oversizedQuery)).toEqual({
      error: { code: "REQUEST_TOO_LARGE" },
    });
    expectSecurityHeaders(oversizedQuery);
  });

  test("Zod edge rejects account selection, raw snapshots, duplicates, control characters, and excessive collections", async () => {
    const invalidInputs = [
      { ...validPreviewBody, accountId: ownerAccountId },
      { ...validPreviewBody, targetAccountId: ownerAccountId },
      { ...validPreviewBody, localSnapshot: { raw: "forbidden" } },
      {
        ...validPreviewBody,
        localEvidence: {
          ...validPreviewBody.localEvidence,
          savedWordSlugs: ["duplicate", "duplicate"],
        },
      },
      {
        ...validPreviewBody,
        localEvidence: {
          ...validPreviewBody.localEvidence,
          reviewEventIds: ["event\u0000hidden"],
        },
      },
      {
        ...validPreviewBody,
        localEvidence: {
          ...validPreviewBody.localEvidence,
          savedWordSlugs: Array.from(
            { length: VLX_ACCOUNT_LEARNING_PREVIEW_MAX_SAVED_WORD_SLUGS + 1 },
            (_, index) => `slug-${index}`
          ),
        },
      },
      {
        ...validPreviewBody,
        localEvidence: {
          ...validPreviewBody.localEvidence,
          reviewEventIds: Array.from(
            { length: VLX_ACCOUNT_LEARNING_PREVIEW_MAX_REVIEW_EVENT_IDS + 1 },
            (_, index) => `event-${index}`
          ),
        },
      },
    ];
    let clientCreated = false;
    const handler = enabledHandler("preview", {
      createClient: async () => {
        clientCreated = true;
        return makeClient().client;
      },
    });

    for (const input of invalidInputs) {
      const direct = validateAccountLearningPreviewInput(input);
      const response = await handler(previewRequest(input));

      expect(direct.ok, JSON.stringify(input).slice(0, 200)).toBe(false);
      expect(response.status).toBe(400);
      expect(await readJson(response)).toEqual({
        error: { code: "MALFORMED_REQUEST" },
      });
    }

    expect(clientCreated).toBe(false);
  });

  test("body byte limit, same-origin, and JSON media type reject before auth", async () => {
    let clientCreated = false;
    const handler = enabledHandler("preview", {
      createClient: async () => {
        clientCreated = true;
        return makeClient().client;
      },
    });
    const oversized = `{"padding":"${"x".repeat(
      VLX_ACCOUNT_LEARNING_PREVIEW_MAX_BODY_BYTES
    )}"}`;
    const oversizedResponse = await handler(previewRequest(oversized));
    const crossOriginResponse = await handler(
      previewRequest(validPreviewBody, { Origin: "https://attacker.test" })
    );
    const mediaTypeResponse = await handler(
      new Request(`${requestOrigin}/api/account/sync/preview`, {
        method: "POST",
        headers: {
          Origin: requestOrigin,
          "Content-Type": "text/plain",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify(validPreviewBody),
      })
    );

    expect(oversizedResponse.status).toBe(413);
    expect(await readJson(oversizedResponse)).toEqual({
      error: { code: "REQUEST_TOO_LARGE" },
    });
    expect(crossOriginResponse.status).toBe(403);
    expect(await readJson(crossOriginResponse)).toEqual({
      error: { code: "ORIGIN_NOT_ALLOWED" },
    });
    expect(mediaTypeResponse.status).toBe(415);
    expect(await readJson(mediaTypeResponse)).toEqual({
      error: { code: "UNSUPPORTED_MEDIA_TYPE" },
    });
    expect(clientCreated).toBe(false);
    expectSecurityHeaders(oversizedResponse);
    expectSecurityHeaders(crossOriginResponse);
    expectSecurityHeaders(mediaTypeResponse);

    const queryResponse = await handler(
      new Request(`${requestOrigin}/api/account/sync/preview?accountId=${ownerAccountId}`, {
        method: "POST",
        headers: {
          Origin: requestOrigin,
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify(validPreviewBody),
      })
    );
    expect(queryResponse.status).toBe(400);
    expect(await readJson(queryResponse)).toEqual({
      error: { code: "MALFORMED_REQUEST" },
    });
    expectSecurityHeaders(queryResponse);
  });

  test("invalid session evidence fails closed with one external auth code", async () => {
    const cases = [
      makeClient({ user: null }).client,
      makeClient({ user: { id: ownerAccountId, is_anonymous: true } }).client,
      makeClient({ user: { id: ownerAccountId } }).client,
      makeClient({
        user: { id: ownerAccountId, is_anonymous: "false" },
      }).client,
      makeClient({ authError: { code: "jwt_expired" } }).client,
      makeClient({ authError: { code: "session_revoked" } }).client,
      makeClient({ authError: { code: "bad_jwt" } }).client,
    ];
    let summaryCalls = 0;

    for (const client of cases) {
      const handler = enabledHandler("digest", {
        client,
        readSummary: async () => {
          summaryCalls += 1;
          return successfulSummary();
        },
      });
      const response = await handler(digestRequest());

      expect(response.status).toBe(401);
      expect(await readJson(response)).toEqual({
        error: { code: "AUTH_REQUIRED" },
      });
      expectSecurityHeaders(response);
    }

    expect(summaryCalls).toBe(0);
  });

  test("auth provider outages return a generic 503 without reading evidence", async () => {
    for (const client of [
      makeClient({ throwAuth: true }).client,
      makeClient({
        authError: {
          status: 503,
          code: "service_unavailable",
          message: "private provider detail",
        },
      }).client,
    ]) {
      let summaryCalled = false;
      const response = await enabledHandler("digest", {
        client,
        readSummary: async () => {
          summaryCalled = true;
          return successfulSummary();
        },
      })(digestRequest());

      expect(response.status).toBe(503);
      expect(await readJson(response)).toEqual({
        error: { code: "AUTH_UNAVAILABLE" },
      });
      expect(summaryCalled).toBe(false);
      expectSecurityHeaders(response);
    }
  });

  test("authoritative owner helper distinguishes internal session reasons but requires exact permanent-user evidence", async () => {
    await expect(
      readAuthenticatedPermanentOwner(makeClient().client)
    ).resolves.toEqual({ ok: true, ownerAccountId });
    await expect(
      readAuthenticatedPermanentOwner(
        makeClient({ authError: { code: "jwt_expired" } }).client
      )
    ).resolves.toEqual({ ok: false, reason: "expired" });
    await expect(
      readAuthenticatedPermanentOwner(
        makeClient({ authError: { code: "session_revoked" } }).client
      )
    ).resolves.toEqual({ ok: false, reason: "revoked" });
    await expect(
      readAuthenticatedPermanentOwner(
        makeClient({ user: { id: ownerAccountId } }).client
      )
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    await expect(
      readAuthenticatedPermanentOwner(makeClient({ throwAuth: true }).client)
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  test("provider edge selects only bounded marker pages without exact count or mutations", async () => {
    const savedRows = Array.from({ length: 501 }, (_, index) => ({
      owner_account_id: ownerAccountId,
      slug: `saved-${index.toString().padStart(3, "0")}`,
      saved_at: "2026-07-14T06:00:00.000Z",
    }));
    const reviewRows = Array.from({ length: 1_001 }, (_, index) => ({
      owner_account_id: ownerAccountId,
      event_id: `event-${index.toString().padStart(4, "0")}`,
      created_at: "2026-07-14T06:10:00.000Z",
    }));
    const { calls, client } = makeClient({
      rowsByTable: {
        account_saved_words: savedRows,
        account_review_events: reviewRows,
      },
    });
    const result = await readSupabaseAccountLearningSummary({
      client,
      ownerAccountId,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.code);
    }
    expect(result.data.savedWords).toHaveLength(500);
    expect(result.data.reviewEvents).toHaveLength(1_000);
    expect(result.data.complete).toEqual({
      savedWords: false,
      reviewEvents: false,
    });
    expect(calls).toEqual(
      expect.arrayContaining([
        {
          kind: "select",
          columns: "owner_account_id,slug,saved_at",
          countRequested: false,
        },
        {
          kind: "select",
          columns: "owner_account_id,event_id,created_at",
          countRequested: false,
        },
        { kind: "eq", column: "owner_account_id", value: ownerAccountId },
        { kind: "limit", value: 501 },
        { kind: "limit", value: 1_001 },
      ])
    );
  });

  test("cross-owner provider rows and provider failures are redacted integrity errors", async () => {
    const crossOwner = makeClient({
      rowsByTable: {
        account_saved_words: [
          {
            owner_account_id: otherAccountId,
            slug: "private-other-owner-slug",
            saved_at: "2026-07-14T06:00:00.000Z",
          },
        ],
        account_review_events: [],
      },
    });
    const crossOwnerResult = await readSupabaseAccountLearningSummary({
      client: crossOwner.client,
      ownerAccountId,
    });

    expect(crossOwnerResult).toMatchObject({
      ok: false,
      error: { code: "invalid_provider_payload" },
    });

    const partialFailureClient = makeClient({
      rowsByTable: {
        account_saved_words: [
          {
            owner_account_id: ownerAccountId,
            slug: "would-be-partial-success",
            saved_at: "2026-07-14T06:00:00.000Z",
          },
        ],
      },
      errorByTable: {
        account_review_events: {
          message: "private review provider detail",
        },
      },
    });
    const partialFailure = await readSupabaseAccountLearningSummary({
      client: partialFailureClient.client,
      ownerAccountId,
    });
    expect(partialFailure).toMatchObject({
      ok: false,
      error: { code: "provider_query_failed" },
    });
    expect(partialFailure).not.toHaveProperty("data");

    const handler = enabledHandler("digest", {
      readSummary: async () => ({
        ok: false,
        error: { code: "provider_query_failed" },
        bounded: true,
        mutatesServer: false,
        mutatesBrowser: false,
      }),
    });
    const response = await handler(digestRequest());
    const body = await readJson(response);

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE" } });
    expect(JSON.stringify(body)).not.toContain("private");
    expectSecurityHeaders(response);

    const thrown = await enabledHandler("digest", {
      readSummary: async () => {
        throw new Error("private thrown provider detail");
      },
    })(digestRequest());
    expect(thrown.status).toBe(503);
    expect(await readJson(thrown)).toEqual({
      error: { code: "EVIDENCE_UNAVAILABLE" },
    });
    expectSecurityHeaders(thrown);

    const invalid = await enabledHandler("digest", {
      readSummary: async () => ({
        ok: false,
        error: { code: "invalid_provider_payload" },
        bounded: true,
        mutatesServer: false,
        mutatesBrowser: false,
      }),
    })(digestRequest());
    expect(invalid.status).toBe(502);
    expect(await readJson(invalid)).toEqual({
      error: { code: "INVALID_EVIDENCE_RESPONSE" },
    });
    expectSecurityHeaders(invalid);
  });

  test("a weak runtime secret fails closed before rate limiting or provider access", async () => {
    const weakSecretHandler = enabledHandler("digest", {
      cursorHmacSecret: "too-short",
    });
    const weakSecretResponse = await weakSecretHandler(digestRequest());

    expect(weakSecretResponse.status).toBe(503);
    expect(await readJson(weakSecretResponse)).toEqual({
      error: { code: "ROUTE_DISABLED" },
    });
  });

  test("Zod is isolated at the validator edge and apply/audit stay absent and hard-disabled", () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, "package.json"), "utf8")
    ) as { dependencies: Record<string, string> };
    const serverText = readFileSync(
      join(
        workspaceRoot,
        "src/lib/account-persistence/read-only-preview-digest/server.ts"
      ),
      "utf8"
    );
    const adapterText = readFileSync(
      join(
        workspaceRoot,
        "src/lib/account-persistence/read-only-preview-digest/supabase-summary-adapter.ts"
      ),
      "utf8"
    );
    const validatorText = readFileSync(
      join(
        workspaceRoot,
        "src/lib/account-persistence/read-only-preview-digest/validator.ts"
      ),
      "utf8"
    );

    expect(packageJson.dependencies.zod).toBe("4.4.3");
    expect(packageJson.dependencies["@vercel/firewall"]).toBe("1.2.1");
    expect(validatorText).toContain('from "zod"');
    expect(serverText).not.toContain('from "zod"');
    expect(adapterText).not.toContain('from "zod"');
    expect(existsSync(join(workspaceRoot, "src/app/api/account/sync/apply"))).toBe(
      false
    );
    expect(existsSync(join(workspaceRoot, "src/app/api/account/sync/audit"))).toBe(
      false
    );

    expect(adapterText).not.toMatch(/\.(insert|upsert|update|delete|rpc)\s*\(/);
    expect(serverText).not.toMatch(/\.(insert|upsert|delete|rpc)\s*\(/);
    expect(serverText).not.toMatch(/\b(?:client|supabase)\.from\s*\(/);
    expect(serverText).toContain('cookieWriteMode: "disabled"');

    for (const text of [serverText, adapterText]) {
      expect(text).not.toMatch(/localStorage|sessionStorage/);
      expect(text).not.toMatch(/from ["'](?:stripe|paddle)|checkout|subscription/i);
    }
  });
});
