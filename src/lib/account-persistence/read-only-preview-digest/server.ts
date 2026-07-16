import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit as checkVercelRateLimit } from "@vercel/firewall";

import { mapSupabaseAuthErrorToPrincipalStatus } from "@/lib/account-runtime/session";
import {
  createVlxSupabaseServerClient,
  readSupabaseProjectRef,
} from "@/lib/supabase/server";

import {
  VLX_ACCOUNT_LEARNING_APPLY_ENABLED,
  VLX_ACCOUNT_LEARNING_CURSOR_HMAC_MIN_SECRET_BYTES,
  VLX_ACCOUNT_LEARNING_DIGEST_MAX_QUERY_BYTES,
  VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA,
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_BODY_BYTES,
  VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA,
  VLX_ACCOUNT_LEARNING_REDACTION,
  VLX_ACCOUNT_LEARNING_RESPONSE_MAX_BYTES,
  type VlxAccountLearningDigestQuery,
  type VlxAccountLearningDigestResponse,
  type VlxAccountLearningPreviewInput,
  type VlxAccountLearningPreviewResponse,
  type VlxAccountLearningReadErrorCode,
  type VlxAccountLearningReadRoute,
} from "./contracts";
import {
  readSupabaseAccountLearningSummary,
  type VlxAccountLearningEvidencePage,
} from "./supabase-summary-adapter";
import {
  validateAccountLearningDigestQuery,
  validateAccountLearningDigestResponse,
  validateAccountLearningPreviewInput,
  validateAccountLearningPreviewResponse,
} from "./validator";

export const VLX_ACCOUNT_LEARNING_READ_MODE_ENV =
  "VLX_ACCOUNT_LEARNING_READ_MODE" as const;
export const VLX_ACCOUNT_LEARNING_EXPECTED_PROJECT_REF_ENV =
  "VLX_ACCOUNT_LEARNING_EXPECTED_SUPABASE_PROJECT_REF" as const;
export const VLX_ACCOUNT_LEARNING_PRODUCTION_PROJECT_REF_ENV =
  "VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF" as const;
export const VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET_ENV =
  "VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET" as const;
export const VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH_ENV =
  "VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH" as const;
export const VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA_ENV =
  "VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA" as const;
export const VLX_ACCOUNT_LEARNING_READ_MODE_VALUE =
  "staging_read_only" as const;
export const VLX_ACCOUNT_LEARNING_DEDICATED_STAGING_VERCEL_PROJECT_ID =
  "prj_GyX4jqA3zhSp2G4xvnP0yXIeayGb" as const;
export const VLX_ACCOUNT_LEARNING_IP_RATE_LIMIT_ID =
  "vlx-account-learning-read-ip-v1" as const;
export const VLX_ACCOUNT_LEARNING_OWNER_RATE_LIMIT_ID =
  "vlx-account-learning-read-owner-v1" as const;
export const VLX_ACCOUNT_LEARNING_RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

export const VLX_ACCOUNT_LEARNING_READ_CACHE_CONTROL = "private, no-store";
export const VLX_ACCOUNT_LEARNING_READ_VARY = "Cookie";

const SUPABASE_ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GIT_COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const VLX_CANONICAL_GIT_REPO_OWNER = "chachathecat";
const VLX_CANONICAL_GIT_REPO_SLUG = "visual-lexicon-app";

export type VlxAccountLearningReadEnv = Record<string, string | undefined>;

export type VlxAccountLearningReadAccess = {
  enabled: boolean;
  target: "isolated_staging" | "disabled";
  expectedProjectRefMatched: boolean;
  productionProjectRefExcluded: boolean;
  dedicatedVercelProjectMatched: boolean;
  expectedBranchMatched: boolean;
  expectedCommitMatched: boolean;
  canonicalRepositoryMatched: boolean;
  vercelPlatformConfirmed: boolean;
  productionRuntimeConfirmed: boolean;
  hmacSecretConfigured: boolean;
};

export type VlxAccountLearningReadDependencies = {
  readAccess?: () => VlxAccountLearningReadAccess;
  createClient?: () => Promise<SupabaseClient | null>;
  readSummary?: typeof readSupabaseAccountLearningSummary;
  checkRateLimit?: typeof checkVercelRateLimit;
  now?: () => Date;
  cursorHmacSecret?: string | null;
};

type VlxAuthenticatedOwnerResult =
  | { ok: true; ownerAccountId: string }
  | {
      ok: false;
      reason:
        | "anonymous"
        | "expired"
        | "revoked"
        | "invalid"
        | "unavailable";
    };

type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; code: "MALFORMED_REQUEST" | "REQUEST_TOO_LARGE" };

export function readAccountLearningStagingReadAccess(
  env: VlxAccountLearningReadEnv = process.env
): VlxAccountLearningReadAccess {
  const expectedProjectRef =
    env[VLX_ACCOUNT_LEARNING_EXPECTED_PROJECT_REF_ENV]?.trim();
  const actualProjectRef = env.NEXT_PUBLIC_SUPABASE_URL
    ? readSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL)
    : null;
  const expectedProjectRefMatched = Boolean(
    expectedProjectRef &&
      actualProjectRef &&
      expectedProjectRef === actualProjectRef
  );
  const productionProjectRef =
    env[VLX_ACCOUNT_LEARNING_PRODUCTION_PROJECT_REF_ENV]?.trim();
  const productionProjectRefExcluded = Boolean(
    productionProjectRef &&
      actualProjectRef &&
      productionProjectRef !== actualProjectRef
  );
  const dedicatedVercelProjectMatched =
    env.VERCEL_PROJECT_ID ===
    VLX_ACCOUNT_LEARNING_DEDICATED_STAGING_VERCEL_PROJECT_ID;
  const expectedBranch =
    env[VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH_ENV]?.trim();
  const actualBranch = env.VERCEL_GIT_COMMIT_REF?.trim();
  const expectedBranchMatched = Boolean(
    expectedBranch &&
      actualBranch &&
      actualBranch !== "main" &&
      expectedBranch === actualBranch
  );
  const expectedCommitSha =
    env[VLX_ACCOUNT_LEARNING_EXPECTED_GIT_COMMIT_SHA_ENV]?.trim();
  const actualCommitSha = env.VERCEL_GIT_COMMIT_SHA?.trim();
  const expectedCommitMatched = Boolean(
    expectedCommitSha &&
      actualCommitSha &&
      GIT_COMMIT_SHA_PATTERN.test(expectedCommitSha) &&
      expectedCommitSha === actualCommitSha
  );
  const canonicalRepositoryMatched =
    env.VERCEL_GIT_REPO_OWNER === VLX_CANONICAL_GIT_REPO_OWNER &&
    env.VERCEL_GIT_REPO_SLUG === VLX_CANONICAL_GIT_REPO_SLUG;
  const vercelPlatformConfirmed = env.VERCEL === "1";
  const productionRuntimeConfirmed = env.NODE_ENV === "production";
  const cursorHmacSecret =
    env[VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET_ENV] ?? null;
  const hmacSecretConfigured = hasStrongCursorHmacSecret(cursorHmacSecret);
  const enabled =
    env[VLX_ACCOUNT_LEARNING_READ_MODE_ENV] ===
      VLX_ACCOUNT_LEARNING_READ_MODE_VALUE &&
    expectedProjectRefMatched &&
    productionProjectRefExcluded &&
    dedicatedVercelProjectMatched &&
    expectedBranchMatched &&
    expectedCommitMatched &&
    canonicalRepositoryMatched &&
    vercelPlatformConfirmed &&
    productionRuntimeConfirmed &&
    env.VERCEL_ENV === "preview" &&
    hmacSecretConfigured;

  return {
    enabled,
    target: enabled ? "isolated_staging" : "disabled",
    expectedProjectRefMatched,
    productionProjectRefExcluded,
    dedicatedVercelProjectMatched,
    expectedBranchMatched,
    expectedCommitMatched,
    canonicalRepositoryMatched,
    vercelPlatformConfirmed,
    productionRuntimeConfirmed,
    hmacSecretConfigured,
  };
}

async function createDefaultClient() {
  const result = await createVlxSupabaseServerClient({
    cookieWriteMode: "disabled",
  });

  return result.status === "configured" ? result.client : null;
}

export function createAccountLearningReadOnlyRouteHandler(
  route: VlxAccountLearningReadRoute,
  {
    readAccess = readAccountLearningStagingReadAccess,
    createClient = createDefaultClient,
    readSummary = readSupabaseAccountLearningSummary,
    checkRateLimit = checkVercelRateLimit,
    now = () => new Date(),
    cursorHmacSecret,
  }: VlxAccountLearningReadDependencies = {}
) {
  return async function accountLearningReadOnlyRouteHandler(request: Request) {
    let access: VlxAccountLearningReadAccess;

    try {
      access = readAccess();
    } catch {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    if (
      !access.enabled ||
      access.target !== "isolated_staging" ||
      !access.expectedProjectRefMatched ||
      !access.productionProjectRefExcluded ||
      !access.dedicatedVercelProjectMatched ||
      !access.expectedBranchMatched ||
      !access.expectedCommitMatched ||
      !access.canonicalRepositoryMatched ||
      !access.vercelPlatformConfirmed ||
      !access.productionRuntimeConfirmed ||
      !access.hmacSecretConfigured
    ) {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    const resolvedCursorHmacSecret =
      cursorHmacSecret === undefined
        ? process.env[VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET_ENV] ?? null
        : cursorHmacSecret;

    if (!hasStrongCursorHmacSecret(resolvedCursorHmacSecret)) {
      return errorResponse("ROUTE_DISABLED", 503);
    }

    const trustedClientIp = readTrustedVercelClientIp(request);

    if (!trustedClientIp) {
      return errorResponse("RATE_LIMIT_UNAVAILABLE", 503);
    }

    const ipRateLimit = await readDistributedRateLimit({
      checkRateLimit,
      rateLimitId: VLX_ACCOUNT_LEARNING_IP_RATE_LIMIT_ID,
      rateLimitKey: createRateLimitKey(
        resolvedCursorHmacSecret,
        "ip",
        trustedClientIp
      ),
      request,
    });

    if (ipRateLimit === "unavailable") {
      return errorResponse("RATE_LIMIT_UNAVAILABLE", 503);
    }

    if (ipRateLimit === "limited") {
      return errorResponse("RATE_LIMITED", 429, {
        "Retry-After": String(
          VLX_ACCOUNT_LEARNING_RATE_LIMIT_RETRY_AFTER_SECONDS
        ),
      });
    }

    const validatedInput = await readAndValidateRouteInput(route, request);

    if (!validatedInput.ok) {
      const status =
        validatedInput.code === "REQUEST_TOO_LARGE"
          ? 413
          : validatedInput.code === "UNSUPPORTED_MEDIA_TYPE"
            ? 415
            : validatedInput.code === "ORIGIN_NOT_ALLOWED"
              ? 403
              : 400;

      return errorResponse(validatedInput.code, status);
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

    const ownerRateLimit = await readDistributedRateLimit({
      checkRateLimit,
      rateLimitId: VLX_ACCOUNT_LEARNING_OWNER_RATE_LIMIT_ID,
      rateLimitKey: createRateLimitKey(
        resolvedCursorHmacSecret,
        "owner",
        owner.ownerAccountId
      ),
      request,
    });

    if (ownerRateLimit === "unavailable") {
      return errorResponse("RATE_LIMIT_UNAVAILABLE", 503);
    }

    if (ownerRateLimit === "limited") {
      return errorResponse("RATE_LIMITED", 429, {
        "Retry-After": String(
          VLX_ACCOUNT_LEARNING_RATE_LIMIT_RETRY_AFTER_SECONDS
        ),
      });
    }

    const summary = await readSummary({
      client,
      ownerAccountId: owner.ownerAccountId,
    }).catch(() => null);

    if (!summary) {
      return errorResponse("EVIDENCE_UNAVAILABLE", 503);
    }

    if (!summary.ok) {
      return summary.error.code === "provider_query_failed"
        ? errorResponse("EVIDENCE_UNAVAILABLE", 503)
        : errorResponse("INVALID_EVIDENCE_RESPONSE", 502);
    }

    if (summary.data.ownerAccountId !== owner.ownerAccountId) {
      return errorResponse("INVALID_EVIDENCE_RESPONSE", 502);
    }

    let evaluatedAt: string;

    try {
      evaluatedAt = now().toISOString();
    } catch {
      return errorResponse("RESPONSE_BOUNDARY_FAILED", 500);
    }

    if (route === "preview") {
      return buildPreviewResponse({
        input: validatedInput.value as VlxAccountLearningPreviewInput,
        ownerAccountId: owner.ownerAccountId,
        evidence: summary.data,
        evaluatedAt,
        cursorHmacSecret: resolvedCursorHmacSecret,
      });
    }

    return buildDigestResponse({
      ownerAccountId: owner.ownerAccountId,
      evidence: summary.data,
      evaluatedAt,
      cursorHmacSecret: resolvedCursorHmacSecret,
    });
  };
}

export async function readAuthenticatedPermanentOwner(
  client: Pick<SupabaseClient, "auth">
): Promise<VlxAuthenticatedOwnerResult> {
  let authResponse;

  try {
    authResponse = await client.auth.getUser();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (authResponse.error) {
    if (isAuthProviderUnavailable(authResponse.error)) {
      return { ok: false, reason: "unavailable" };
    }

    const status = mapSupabaseAuthErrorToPrincipalStatus(authResponse.error);

    return {
      ok: false,
      reason:
        status === "anonymous" ||
        status === "expired" ||
        status === "revoked"
          ? status
          : "invalid",
    };
  }

  const user = authResponse.data.user;

  if (!user) {
    return { ok: false, reason: "anonymous" };
  }

  if (user.is_anonymous === true) {
    return { ok: false, reason: "anonymous" };
  }

  if (
    user.is_anonymous !== false ||
    typeof user.id !== "string" ||
    !SUPABASE_ACCOUNT_ID_PATTERN.test(user.id)
  ) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    ownerAccountId: user.id,
  };
}

function isAuthProviderUnavailable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  const status = candidate.status;
  const evidence = [candidate.name, candidate.code, candidate.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    (typeof status === "number" && status >= 500) ||
    /network|fetch|timeout|temporar|unavailable|connection/.test(evidence)
  );
}

function buildPreviewResponse({
  input,
  ownerAccountId,
  evidence,
  evaluatedAt,
  cursorHmacSecret,
}: {
  input: VlxAccountLearningPreviewInput;
  ownerAccountId: string;
  evidence: VlxAccountLearningEvidencePage;
  evaluatedAt: string;
  cursorHmacSecret: string | null;
}) {
  const accountSavedWordSlugs = new Set(
    evidence.savedWords.map((item) => item.slug)
  );
  const accountReviewEventIds = new Set(
    evidence.reviewEvents.map((item) => item.event_id)
  );
  const savedWordOverlap = input.localEvidence.savedWordSlugs.filter((slug) =>
    accountSavedWordSlugs.has(slug)
  ).length;
  const reviewEventOverlap = input.localEvidence.reviewEventIds.filter(
    (eventId) => accountReviewEventIds.has(eventId)
  ).length;
  const responseBody: VlxAccountLearningPreviewResponse = {
    schemaVersion: VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA,
    route: "preview",
    ownerSource: "supabase_server_session",
    readOnly: true,
    bounded: true,
    applyEnabled: VLX_ACCOUNT_LEARNING_APPLY_ENABLED,
    evaluatedAt,
    mutatesServer: false,
    mutatesBrowser: false,
    grantsPaidEntitlement: false,
    counts: {
      local: {
        savedWords: input.localEvidence.savedWordSlugs.length,
        reviewEvents: input.localEvidence.reviewEventIds.length,
      },
      accountObserved: {
        savedWords: evidence.savedWords.length,
        reviewEvents: evidence.reviewEvents.length,
      },
      overlap: {
        savedWords: savedWordOverlap,
        reviewEvents: reviewEventOverlap,
      },
      localNotSeenInAccountPage: {
        savedWords:
          input.localEvidence.savedWordSlugs.length - savedWordOverlap,
        reviewEvents:
          input.localEvidence.reviewEventIds.length - reviewEventOverlap,
      },
      accountOnlyObserved: {
        savedWords: evidence.savedWords.length - savedWordOverlap,
        reviewEvents: evidence.reviewEvents.length - reviewEventOverlap,
      },
    },
    complete: evidence.complete,
    cursors: createHashedCursors(ownerAccountId, evidence, cursorHmacSecret),
    redaction: VLX_ACCOUNT_LEARNING_REDACTION,
  };

  return validatedSuccessResponse(
    responseBody,
    validateAccountLearningPreviewResponse
  );
}

function hasStrongCursorHmacSecret(secret: string | null): secret is string {
  return Boolean(
    secret &&
      new TextEncoder().encode(secret).byteLength >=
        VLX_ACCOUNT_LEARNING_CURSOR_HMAC_MIN_SECRET_BYTES
  );
}

function readTrustedVercelClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();

  if (
    !forwardedFor ||
    forwardedFor.length > 64 ||
    forwardedFor.includes(",") ||
    isIP(forwardedFor) === 0
  ) {
    return null;
  }

  return forwardedFor;
}

function createRateLimitKey(
  secret: string,
  scope: "ip" | "owner",
  value: string
) {
  return `vlx-${scope}-${createHmac("sha256", secret)
    .update("vlx-account-learning-rate-limit-v1\u0000", "utf8")
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

function buildDigestResponse({
  ownerAccountId,
  evidence,
  evaluatedAt,
  cursorHmacSecret,
}: {
  ownerAccountId: string;
  evidence: VlxAccountLearningEvidencePage;
  evaluatedAt: string;
  cursorHmacSecret: string | null;
}) {
  const responseBody: VlxAccountLearningDigestResponse = {
    schemaVersion: VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA,
    route: "digest",
    ownerSource: "supabase_server_session",
    readOnly: true,
    bounded: true,
    applyEnabled: VLX_ACCOUNT_LEARNING_APPLY_ENABLED,
    evaluatedAt,
    mutatesServer: false,
    mutatesBrowser: false,
    grantsPaidEntitlement: false,
    counts: {
      savedWords: evidence.savedWords.length,
      reviewEvents: evidence.reviewEvents.length,
    },
    complete: evidence.complete,
    cursors: createHashedCursors(ownerAccountId, evidence, cursorHmacSecret),
    redaction: VLX_ACCOUNT_LEARNING_REDACTION,
  };

  return validatedSuccessResponse(
    responseBody,
    validateAccountLearningDigestResponse
  );
}

function createHashedCursors(
  ownerAccountId: string,
  evidence: VlxAccountLearningEvidencePage,
  cursorHmacSecret: string | null
) {
  const secretBytes = cursorHmacSecret
    ? new TextEncoder().encode(cursorHmacSecret)
    : null;
  const savedWord = evidence.savedWords.at(-1);
  const reviewEvent = evidence.reviewEvents.at(-1);
  const canHash = Boolean(
    secretBytes &&
      secretBytes.byteLength >=
        VLX_ACCOUNT_LEARNING_CURSOR_HMAC_MIN_SECRET_BYTES
  );

  return {
    algorithm: "hmac-sha256" as const,
    reversible: false as const,
    savedWords: canHash && evidence.complete.savedWords && savedWord
      ? hashCursor(
          cursorHmacSecret as string,
          ownerAccountId,
          "saved_word",
          `${savedWord.slug}\u0000${savedWord.saved_at}`
        )
      : null,
    reviewEvents: canHash && evidence.complete.reviewEvents && reviewEvent
      ? hashCursor(
          cursorHmacSecret as string,
          ownerAccountId,
          "review_event",
          `${reviewEvent.event_id}\u0000${reviewEvent.created_at}`
        )
      : null,
  };
}

function hashCursor(
  cursorHmacSecret: string,
  ownerAccountId: string,
  kind: string,
  marker: string
) {
  const digest = createHmac("sha256", cursorHmacSecret)
    .update("vlx-account-learning-cursor-v1\u0000", "utf8")
    .update(ownerAccountId, "utf8")
    .update("\u0000", "utf8")
    .update(kind, "utf8")
    .update("\u0000", "utf8")
    .update(marker, "utf8")
    .digest("hex");

  return `hmac-sha256:${digest}`;
}

async function readAndValidateRouteInput(
  route: VlxAccountLearningReadRoute,
  request: Request
): Promise<
  | {
      ok: true;
      value: VlxAccountLearningPreviewInput | VlxAccountLearningDigestQuery;
    }
  | {
      ok: false;
      code:
        | "MALFORMED_REQUEST"
        | "REQUEST_TOO_LARGE"
        | "UNSUPPORTED_MEDIA_TYPE"
        | "ORIGIN_NOT_ALLOWED";
    }
> {
  if (route === "preview") {
    if (request.method !== "POST") {
      return { ok: false, code: "MALFORMED_REQUEST" };
    }

    if (new URL(request.url).search.length > 0) {
      return { ok: false, code: "MALFORMED_REQUEST" };
    }

    if (!hasSameOrigin(request)) {
      return { ok: false, code: "ORIGIN_NOT_ALLOWED" };
    }

    if (!isJsonContentType(request)) {
      return { ok: false, code: "UNSUPPORTED_MEDIA_TYPE" };
    }

    const json = await readBoundedJson(
      request,
      VLX_ACCOUNT_LEARNING_PREVIEW_MAX_BODY_BYTES
    );

    if (!json.ok) {
      return json;
    }

    const validated = validateAccountLearningPreviewInput(json.value);

    return validated.ok
      ? { ok: true, value: validated.value }
      : { ok: false, code: "MALFORMED_REQUEST" };
  }

  if (request.method !== "GET") {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }

  const url = new URL(request.url);

  if (
    new TextEncoder().encode(url.search).byteLength >
    VLX_ACCOUNT_LEARNING_DIGEST_MAX_QUERY_BYTES
  ) {
    return { ok: false, code: "REQUEST_TOO_LARGE" };
  }

  const validated = validateAccountLearningDigestQuery(
    Array.from(url.searchParams.entries())
  );

  return validated.ok
    ? { ok: true, value: validated.value }
    : { ok: false, code: "MALFORMED_REQUEST" };
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

  if (!request.body) {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, code: "REQUEST_TOO_LARGE" };
      }

      chunks.push(value);
    }
  } catch {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    return {
      ok: true,
      value: JSON.parse(text) as unknown,
    };
  } catch {
    return { ok: false, code: "MALFORMED_REQUEST" };
  }
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase();

  return Boolean(
    contentType &&
      (contentType === "application/json" ||
        contentType.startsWith("application/json;"))
  );
}

function validatedSuccessResponse<TBody>(
  body: TBody,
  validate: (input: unknown) => { ok: boolean }
) {
  if (!validate(body).ok) {
    return errorResponse("RESPONSE_BOUNDARY_FAILED", 500);
  }

  const serialized = JSON.stringify(body);

  if (
    new TextEncoder().encode(serialized).byteLength >
    VLX_ACCOUNT_LEARNING_RESPONSE_MAX_BYTES
  ) {
    return errorResponse("RESPONSE_BOUNDARY_FAILED", 500);
  }

  return new Response(serialized, {
    status: 200,
    headers: createReadOnlyHeaders(),
  });
}

function errorResponse(
  code: VlxAccountLearningReadErrorCode,
  status: number,
  additionalHeaders: Record<string, string> = {}
) {
  return Response.json(
    {
      error: { code },
    },
    {
      status,
      headers: {
        ...createReadOnlyHeaders(),
        ...additionalHeaders,
      },
    }
  );
}

export function createReadOnlyHeaders() {
  return {
    "Cache-Control": VLX_ACCOUNT_LEARNING_READ_CACHE_CONTROL,
    Vary: VLX_ACCOUNT_LEARNING_READ_VARY,
    "X-Content-Type-Options": "nosniff",
    "Content-Type": "application/json; charset=utf-8",
  };
}
