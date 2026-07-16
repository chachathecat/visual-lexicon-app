import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit as checkVercelRateLimit } from "@vercel/firewall";

import {
  VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET_ENV,
  VLX_ACCOUNT_LEARNING_IP_RATE_LIMIT_ID,
  VLX_ACCOUNT_LEARNING_OWNER_RATE_LIMIT_ID,
  createReadOnlyHeaders,
  readAccountLearningStagingReadAccess,
  readAuthenticatedPermanentOwner,
  type VlxAccountLearningReadAccess,
  type VlxAccountLearningReadEnv,
} from "@/lib/account-persistence/read-only-preview-digest/server";
import { createVlxSupabaseServerClient } from "@/lib/supabase/server";

import {
  VLX_ACCOUNT_LEARNING_APPLY_MAX_BODY_BYTES,
  VLX_ACCOUNT_LEARNING_APPLY_SCHEMA,
  VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA,
  VLX_ACCOUNT_LEARNING_IDEMPOTENCY_KEY_MAX_BYTES,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES,
  VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES,
  type VlxAccountLearningApplyInput,
  type VlxAccountLearningApplyResponse,
  type VlxAccountLearningHydrateResponse,
  type VlxAccountLearningVerticalSliceErrorCode,
} from "./contracts";
import {
  applySupabaseAccountLearningVerticalSlice,
  readSupabaseAccountLearningVerticalSlice,
} from "./supabase-adapter";
import {
  validateAccountLearningApplyInput,
  validateAccountLearningApplyResponse,
  validateAccountLearningHydrateResponse,
} from "./validator";

export const VLX_ACCOUNT_LEARNING_HYDRATE_MODE_ENV =
  "VLX_ACCOUNT_LEARNING_HYDRATE_MODE" as const;
export const VLX_ACCOUNT_LEARNING_WRITE_MODE_ENV =
  "VLX_ACCOUNT_LEARNING_WRITE_MODE" as const;
export const VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ENV =
  "VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH" as const;
export const VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_ENV =
  "VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY" as const;
export const VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID_ENV =
  "VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID" as const;
export const VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE =
  "staging_dissonance_vertical_slice" as const;
export const VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ALLOW_VALUE =
  "allow_reviewed_staging_sha" as const;

export const VLX_ACCOUNT_LEARNING_APPLY_IP_RATE_LIMIT_ID =
  VLX_ACCOUNT_LEARNING_IP_RATE_LIMIT_ID;
export const VLX_ACCOUNT_LEARNING_APPLY_OWNER_RATE_LIMIT_ID =
  VLX_ACCOUNT_LEARNING_OWNER_RATE_LIMIT_ID;
export const VLX_ACCOUNT_LEARNING_HYDRATE_IP_RATE_LIMIT_ID =
  VLX_ACCOUNT_LEARNING_IP_RATE_LIMIT_ID;
export const VLX_ACCOUNT_LEARNING_HYDRATE_OWNER_RATE_LIMIT_ID =
  VLX_ACCOUNT_LEARNING_OWNER_RATE_LIMIT_ID;
export const VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RETRY_AFTER_SECONDS = 60;
export const VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER =
  "X-VLX-Deployment-SHA" as const;
export const VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER =
  "X-VLX-Deployment-ID" as const;

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]{20,64}$/;
const ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export type VlxAccountLearningVerticalSliceRoute = "apply" | "hydrate";

export type VlxAccountLearningVerticalSliceAccess = {
  enabled: boolean;
  target: "isolated_staging" | "disabled";
  baseReadAccess: VlxAccountLearningReadAccess;
  hydrateModeMatched: boolean;
  writeModeMatched: boolean;
  killSwitchAllowsWrites: boolean;
  writeCapabilityConfigured: boolean;
  deploymentShaMatched: boolean;
  ownerAllowlistConfigured: boolean;
};

export type VlxAccountLearningVerticalSliceDependencies = {
  readAccess?: (
    route: VlxAccountLearningVerticalSliceRoute
  ) => VlxAccountLearningVerticalSliceAccess;
  createClient?: () => Promise<SupabaseClient | null>;
  applyEvidence?: typeof applySupabaseAccountLearningVerticalSlice;
  readEvidence?: typeof readSupabaseAccountLearningVerticalSlice;
  checkRateLimit?: typeof checkVercelRateLimit;
  cursorHmacSecret?: string | null;
  writeCapability?: string | null;
  deploymentSha?: string | null;
  deploymentId?: string | null;
  expectedOwnerAccountId?: string | null;
};

type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "MALFORMED_REQUEST" | "REQUEST_TOO_LARGE" };

export function readAccountLearningVerticalSliceAccess(
  route: VlxAccountLearningVerticalSliceRoute,
  env: VlxAccountLearningReadEnv = process.env
): VlxAccountLearningVerticalSliceAccess {
  const baseReadAccess = readAccountLearningStagingReadAccess(env);
  const hydrateModeMatched =
    env[VLX_ACCOUNT_LEARNING_HYDRATE_MODE_ENV] ===
    VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE;
  const writeModeMatched =
    env[VLX_ACCOUNT_LEARNING_WRITE_MODE_ENV] ===
    VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_MODE_VALUE;
  const killSwitchAllowsWrites =
    env[VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ENV] ===
    VLX_ACCOUNT_LEARNING_WRITE_KILL_SWITCH_ALLOW_VALUE;
  const writeCapability =
    env[VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_ENV] ?? "";
  const writeCapabilityConfigured =
    new TextEncoder().encode(writeCapability).byteLength >=
    VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES;
  const deploymentSha = env.VERCEL_GIT_COMMIT_SHA?.trim() ?? "";
  const deploymentShaMatched = COMMIT_SHA_PATTERN.test(deploymentSha);
  const expectedOwnerAccountId =
    env[VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID_ENV]?.trim() ?? "";
  const ownerAllowlistConfigured = ACCOUNT_ID_PATTERN.test(
    expectedOwnerAccountId
  );
  const enabled =
    baseReadAccess.enabled &&
    hydrateModeMatched &&
    deploymentShaMatched &&
    ownerAllowlistConfigured &&
    (route === "hydrate" ||
      (writeModeMatched &&
        killSwitchAllowsWrites &&
        writeCapabilityConfigured));

  return {
    enabled,
    target: enabled ? "isolated_staging" : "disabled",
    baseReadAccess,
    hydrateModeMatched,
    writeModeMatched,
    killSwitchAllowsWrites,
    writeCapabilityConfigured,
    deploymentShaMatched,
    ownerAllowlistConfigured,
  };
}

async function createDefaultClient() {
  const result = await createVlxSupabaseServerClient({
    cookieWriteMode: "disabled",
  });
  return result.status === "configured" ? result.client : null;
}

export function createAccountLearningVerticalSliceRouteHandler(
  route: VlxAccountLearningVerticalSliceRoute,
  {
    readAccess = (requestedRoute) =>
      readAccountLearningVerticalSliceAccess(requestedRoute),
    createClient = createDefaultClient,
    applyEvidence = applySupabaseAccountLearningVerticalSlice,
    readEvidence = readSupabaseAccountLearningVerticalSlice,
    checkRateLimit = checkVercelRateLimit,
    cursorHmacSecret,
    writeCapability,
    deploymentSha,
    deploymentId,
    expectedOwnerAccountId,
  }: VlxAccountLearningVerticalSliceDependencies = {}
) {
  return async function accountLearningVerticalSliceRouteHandler(
    request: Request
  ) {
    let access: VlxAccountLearningVerticalSliceAccess;

    try {
      access = readAccess(route);
    } catch {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    if (!hasValidAccess(route, access)) {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    const resolvedDeploymentSha =
      deploymentSha === undefined
        ? process.env.VERCEL_GIT_COMMIT_SHA ?? null
        : deploymentSha;
    const resolvedDeploymentId =
      deploymentId === undefined
        ? process.env.VERCEL_DEPLOYMENT_ID ?? null
        : deploymentId;
    if (
      !resolvedDeploymentSha ||
      !COMMIT_SHA_PATTERN.test(resolvedDeploymentSha) ||
      !resolvedDeploymentId ||
      !DEPLOYMENT_ID_PATTERN.test(resolvedDeploymentId)
    ) {
      return errorResponse("ROUTE_DISABLED", 503);
    }
    const deploymentAttestation = {
      sha: resolvedDeploymentSha,
      id: resolvedDeploymentId,
    };

    const rateLimitSecret =
      cursorHmacSecret === undefined
        ? process.env[VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET_ENV] ?? null
        : cursorHmacSecret;

    if (!hasStrongSecret(rateLimitSecret)) {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    const trustedIp = readTrustedVercelClientIp(request);
    if (!trustedIp) {
      return errorResponse("RATE_LIMIT_UNAVAILABLE", 503);
    }

    const ipLimit = await readDistributedRateLimit({
      checkRateLimit,
      rateLimitId:
        route === "apply"
          ? VLX_ACCOUNT_LEARNING_APPLY_IP_RATE_LIMIT_ID
          : VLX_ACCOUNT_LEARNING_HYDRATE_IP_RATE_LIMIT_ID,
      rateLimitKey: createRateLimitKey(rateLimitSecret, `${route}:ip`, trustedIp),
      request,
    });
    const ipLimitResponse = rateLimitResponse(ipLimit);
    if (ipLimitResponse) return ipLimitResponse;

    const validatedRequest =
      route === "apply"
        ? await readApplyRequest(request)
        : readHydrateRequest(request);

    if (!validatedRequest.ok) {
      return errorResponse(
        validatedRequest.code,
        statusForRequestError(validatedRequest.code)
      );
    }

    const client = await createClient().catch(() => null);
    if (!client) {
      return errorResponse("AUTH_UNAVAILABLE", 503);
    }

    const owner = await readAuthenticatedPermanentOwner(client);
    if (!owner.ok) {
      return owner.reason === "unavailable"
        ? errorResponse("AUTH_UNAVAILABLE", 503)
        : errorResponse("AUTH_REQUIRED", 401);
    }

    const resolvedExpectedOwnerAccountId =
      expectedOwnerAccountId === undefined
        ? process.env[
            VLX_ACCOUNT_LEARNING_EXPECTED_OWNER_ACCOUNT_ID_ENV
          ]?.trim() ?? null
        : expectedOwnerAccountId;

    if (
      !resolvedExpectedOwnerAccountId ||
      !ACCOUNT_ID_PATTERN.test(resolvedExpectedOwnerAccountId) ||
      owner.ownerAccountId !== resolvedExpectedOwnerAccountId
    ) {
      return errorResponse("AUTH_REQUIRED", 401);
    }

    const ownerLimit = await readDistributedRateLimit({
      checkRateLimit,
      rateLimitId:
        route === "apply"
          ? VLX_ACCOUNT_LEARNING_APPLY_OWNER_RATE_LIMIT_ID
          : VLX_ACCOUNT_LEARNING_HYDRATE_OWNER_RATE_LIMIT_ID,
      rateLimitKey: createRateLimitKey(
        rateLimitSecret,
        `${route}:owner`,
        owner.ownerAccountId
      ),
      request,
    });
    const ownerLimitResponse = rateLimitResponse(ownerLimit);
    if (ownerLimitResponse) return ownerLimitResponse;

    if (route === "hydrate") {
      const result = await readEvidence({
        client,
        expectedOwnerAccountId: owner.ownerAccountId,
      }).catch(() => null);

      if (!result) return errorResponse("EVIDENCE_UNAVAILABLE", 503);
      if (!result.ok) {
        return result.error.code === "invalid_provider_payload"
          ? errorResponse("INVALID_EVIDENCE_RESPONSE", 502)
          : result.error.code === "invalid_authenticated_session"
            ? errorResponse("AUTH_REQUIRED", 401)
            : errorResponse("EVIDENCE_UNAVAILABLE", 503);
      }
      if (result.ownerAccountId !== owner.ownerAccountId) {
        return errorResponse("INVALID_EVIDENCE_RESPONSE", 502);
      }

      const body: VlxAccountLearningHydrateResponse = {
        schemaVersion: VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA,
        route: "hydrate",
        ownerSource: "supabase_server_session",
        target: "isolated_staging",
        fixture: VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
        readOnly: true,
        bounded: true,
        items: result.data,
        counts: {
          savedWords: result.data.savedWords.length,
          reviewEvents: result.data.reviewEvents.length,
        },
        complete: { savedWords: true, reviewEvents: true },
        mutatesServer: false,
        mutatesBrowser: false,
        grantsPaidEntitlement: false,
        touchesBilling: false,
        touchesPackProgress: false,
      };

      return validatedResponse(
        body,
        validateAccountLearningHydrateResponse,
        deploymentAttestation
      );
    }

    if (!("input" in validatedRequest)) {
      return errorResponse("MALFORMED_REQUEST", 400);
    }

    const applyRequest = validatedRequest as {
      ok: true;
      input: VlxAccountLearningApplyInput;
      idempotencyKey: string;
    };

    const resolvedWriteCapability =
      writeCapability === undefined
        ? process.env[VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_ENV] ?? null
        : writeCapability;
    if (
      !resolvedWriteCapability ||
      !hasStrongSecret(resolvedWriteCapability) ||
      !resolvedDeploymentSha
    ) {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    const applyResult = await applyEvidence({
      client,
      expectedOwnerAccountId: owner.ownerAccountId,
      input: applyRequest.input,
      idempotencyKey: applyRequest.idempotencyKey,
      writeCapability: resolvedWriteCapability,
      deploymentSha: resolvedDeploymentSha,
    }).catch(() => null);

    if (!applyResult) return errorResponse("APPLY_UNAVAILABLE", 503);
    if (!applyResult.ok) {
      return applyResult.error.code === "invalid_authenticated_session"
        ? errorResponse("AUTH_REQUIRED", 401)
        : applyResult.error.code === "invalid_provider_payload"
          ? errorResponse("INVALID_EVIDENCE_RESPONSE", 502)
          : errorResponse("APPLY_UNAVAILABLE", 503);
    }
    if (applyResult.ownerAccountId !== owner.ownerAccountId) {
      return errorResponse("INVALID_EVIDENCE_RESPONSE", 502);
    }

    const outcome = applyResult.outcome;
    if (outcome.status === "disabled") {
      return errorResponse("ROUTE_DISABLED", 503);
    }
    if (outcome.status === "auth_required") {
      return errorResponse("AUTH_REQUIRED", 401);
    }
    if (outcome.status === "conflict") {
      return errorResponse("IDEMPOTENCY_CONFLICT", 409);
    }
    if (outcome.status === "scope_conflict") {
      return errorResponse("SCOPE_CONFLICT", 409);
    }

    if (
      !outcome.requestFingerprint ||
      outcome.savedWordsInserted === undefined ||
      outcome.reviewEventsInserted === undefined ||
      outcome.duplicateReviewEvents === undefined ||
      outcome.idempotencyRecordsInserted === undefined ||
      outcome.learningEvidenceMutated === undefined
    ) {
      return errorResponse("INVALID_EVIDENCE_RESPONSE", 502);
    }

    const body: VlxAccountLearningApplyResponse = {
      schemaVersion: VLX_ACCOUNT_LEARNING_APPLY_SCHEMA,
      route: "apply",
      ownerSource: "supabase_server_session",
      target: "isolated_staging",
      fixture: VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
      status: outcome.status,
      bounded: true,
      idempotency: {
        fingerprint: outcome.requestFingerprint,
        replayed: outcome.status === "replayed",
      },
      counts: {
        savedWordsInserted: outcome.savedWordsInserted,
        reviewEventsInserted: outcome.reviewEventsInserted,
        duplicateReviewEvents: outcome.duplicateReviewEvents,
        idempotencyRecordsInserted: outcome.idempotencyRecordsInserted,
      },
      mutatesServer: outcome.status === "committed",
      mutatesBrowser: false,
      mutatesLearningEvidence: outcome.learningEvidenceMutated,
      grantsPaidEntitlement: false,
      touchesBilling: false,
      touchesPackProgress: false,
    };

    return validatedResponse(
      body,
      validateAccountLearningApplyResponse,
      deploymentAttestation
    );
  };
}

function hasValidAccess(
  route: VlxAccountLearningVerticalSliceRoute,
  access: VlxAccountLearningVerticalSliceAccess
) {
  const base = access.baseReadAccess;
  return Boolean(
    access.enabled &&
      access.target === "isolated_staging" &&
      access.hydrateModeMatched &&
      access.deploymentShaMatched &&
      access.ownerAllowlistConfigured &&
      base.enabled &&
      base.target === "isolated_staging" &&
      base.expectedProjectRefMatched &&
      base.productionProjectRefExcluded &&
      base.dedicatedVercelProjectMatched &&
      base.expectedBranchMatched &&
      base.expectedCommitMatched &&
      base.canonicalRepositoryMatched &&
      base.vercelPlatformConfirmed &&
      base.productionRuntimeConfirmed &&
      base.hmacSecretConfigured &&
      (route === "hydrate" ||
        (access.writeModeMatched &&
          access.killSwitchAllowsWrites &&
          access.writeCapabilityConfigured))
  );
}

async function readApplyRequest(request: Request): Promise<
  | {
      ok: true;
      input: VlxAccountLearningApplyInput;
      idempotencyKey: string;
    }
  | { ok: false; code: VlxAccountLearningVerticalSliceErrorCode }
> {
  if (request.method !== "POST" || new URL(request.url).search.length > 0) {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }
  if (!hasSameOrigin(request)) {
    return { ok: false, code: "ORIGIN_NOT_ALLOWED" };
  }
  if (!isJsonContentType(request)) {
    return { ok: false, code: "UNSUPPORTED_MEDIA_TYPE" };
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey) {
    return { ok: false, code: "IDEMPOTENCY_KEY_REQUIRED" };
  }
  if (
    new TextEncoder().encode(idempotencyKey).byteLength >
      VLX_ACCOUNT_LEARNING_IDEMPOTENCY_KEY_MAX_BYTES ||
    idempotencyKey.length < 8 ||
    !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)
  ) {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }

  const json = await readBoundedJson(
    request,
    VLX_ACCOUNT_LEARNING_APPLY_MAX_BODY_BYTES
  );
  if (!json.ok) return json;

  const validated = validateAccountLearningApplyInput(json.value);
  if (!validated.ok) {
    return {
      ok: false,
      code:
        validated.reason === "fake_mastery"
          ? "FAKE_MASTERY_REJECTED"
          : validated.reason === "out_of_scope"
            ? "OUT_OF_SCOPE_FIELD"
            : "MALFORMED_REQUEST",
    };
  }

  return { ok: true, input: validated.value, idempotencyKey };
}

function readHydrateRequest(request: Request):
  | { ok: true }
  | { ok: false; code: VlxAccountLearningVerticalSliceErrorCode } {
  if (request.method !== "GET" || new URL(request.url).search.length > 0) {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }
  return { ok: true };
}

async function readBoundedJson(
  request: Request,
  maxBytes: number
): Promise<BoundedJsonResult> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    if (!/^\d+$/.test(contentLength)) {
      return { ok: false, code: "MALFORMED_REQUEST" };
    }
    if (Number(contentLength) > maxBytes) {
      return { ok: false, code: "REQUEST_TOO_LARGE" };
    }
  }
  if (!request.body) return { ok: false, code: "MALFORMED_REQUEST" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, code: "REQUEST_TOO_LARGE" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      value: JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes)
      ) as unknown,
    };
  } catch {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isJsonContentType(request: Request) {
  const value = request.headers.get("content-type")?.toLowerCase();
  return Boolean(
    value &&
      (value === "application/json" || value.startsWith("application/json;"))
  );
}

function hasStrongSecret(secret: string | null): secret is string {
  return Boolean(
    secret &&
      new TextEncoder().encode(secret).byteLength >=
        VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES
  );
}

function readTrustedVercelClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  return forwardedFor &&
    forwardedFor.length <= 64 &&
    !forwardedFor.includes(",") &&
    isIP(forwardedFor) !== 0
    ? forwardedFor
    : null;
}

function createRateLimitKey(secret: string, scope: string, value: string) {
  return `vlx-${createHmac("sha256", secret)
    .update("vlx-account-learning-vertical-slice-rate-limit-v1\u0000", "utf8")
    .update(scope, "utf8")
    .update("\u0000", "utf8")
    .update(value, "utf8")
    .digest("hex")}`;
}

async function readDistributedRateLimit({
  checkRateLimit,
  rateLimitId,
  rateLimitKey,
  request,
}: {
  checkRateLimit: typeof checkVercelRateLimit;
  rateLimitId: string;
  rateLimitKey: string;
  request: Request;
}): Promise<"allowed" | "limited" | "unavailable"> {
  try {
    const result = await checkRateLimit(rateLimitId, {
      request,
      rateLimitKey,
    });
    if (result.error) {
      return result.error === "blocked" ? "limited" : "unavailable";
    }
    return result.rateLimited ? "limited" : "allowed";
  } catch {
    return "unavailable";
  }
}

function rateLimitResponse(result: "allowed" | "limited" | "unavailable") {
  if (result === "allowed") return null;
  return result === "limited"
    ? errorResponse("RATE_LIMITED", 429, {
        "Retry-After": String(
          VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RETRY_AFTER_SECONDS
        ),
      })
    : errorResponse("RATE_LIMIT_UNAVAILABLE", 503);
}

function statusForRequestError(code: VlxAccountLearningVerticalSliceErrorCode) {
  if (code === "REQUEST_TOO_LARGE") return 413;
  if (code === "UNSUPPORTED_MEDIA_TYPE") return 415;
  if (code === "ORIGIN_NOT_ALLOWED") return 403;
  if (code === "FAKE_MASTERY_REJECTED") return 422;
  if (code === "OUT_OF_SCOPE_FIELD") return 400;
  return 400;
}

function validatedResponse<TValue>(
  value: TValue,
  validate: (input: unknown) => { ok: boolean },
  deployment: { sha: string; id: string }
) {
  if (!validate(value).ok) {
    return errorResponse("RESPONSE_BOUNDARY_FAILED", 500);
  }
  const serialized = JSON.stringify(value);
  if (
    new TextEncoder().encode(serialized).byteLength >
    VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_RESPONSE_MAX_BYTES
  ) {
    return errorResponse("RESPONSE_BOUNDARY_FAILED", 500);
  }
  return new Response(serialized, {
    status: 200,
    headers: {
      ...createVerticalSliceHeaders(),
      [VLX_ACCOUNT_LEARNING_DEPLOYMENT_SHA_HEADER]: deployment.sha,
      [VLX_ACCOUNT_LEARNING_DEPLOYMENT_ID_HEADER]: deployment.id,
    },
  });
}

function errorResponse(
  code: VlxAccountLearningVerticalSliceErrorCode,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return Response.json(
    { error: { code } },
    {
      status,
      headers: { ...createVerticalSliceHeaders(), ...extraHeaders },
    }
  );
}

export function createVerticalSliceHeaders() {
  return {
    ...createReadOnlyHeaders(),
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  };
}
