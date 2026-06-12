import {
  VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS,
  VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
  getVlxAccountSyncRouteDefinition,
  type VlxAccountSyncApplyRouteRequest,
  type VlxAccountSyncAuditSummary,
  type VlxAccountSyncRouteId
} from "@/lib/account-persistence/api-route-design/route-contracts";
import type {
  VlxAccountId,
  VlxAccountStateDigest,
  VlxGuestDeviceSnapshot
} from "@/lib/account-persistence/types";
import type {
  VlxAccountSyncMockAuthState,
  VlxAccountSyncMockHandlerContext,
  VlxAccountSyncMockHandlerError,
  VlxAccountSyncMockHandlerErrorCode,
  VlxAccountSyncMockHandlerErrorResponse,
  VlxAccountSyncMockHandlerResponse,
  VlxAccountSyncMockHandlerSuccessResponse,
  VlxAccountSyncMockIdempotencyLedger,
  VlxAccountSyncMockRequest,
  VlxAccountSyncMockResponseBody,
  VlxAccountSyncPreviewMockBody,
  VlxAccountSyncApplyMockBody,
  VlxAccountSyncDigestMockBody,
  VlxAccountSyncAuditMockBody,
  VlxAccountSyncMockHandlerRegistry
} from "@/lib/account-persistence/api-handler-harness/handler-contracts";
import { runServerPersistenceIntegrationHarness } from "@/lib/account-persistence/sync-harness/harness";
import {
  createInMemoryServerPersistenceAdapter,
  createInMemoryServerPersistenceStore
} from "@/lib/account-persistence/server-adapter/in-memory-adapter";
import type {
  VlxServerPersistenceAccountState,
  VlxServerPersistenceAuditRecord,
  VlxServerPersistenceReason
} from "@/lib/account-persistence/server-adapter/adapter-contract";

const DEFAULT_AUDIT_SUMMARY_LIMIT = 20;

type MockAuthCheck =
  | {
      ok: true;
      accountId: VlxAccountId | string;
      mockAuthState: Extract<
        VlxAccountSyncMockAuthState,
        { kind: "mock_authenticated" }
      >;
    }
  | {
      ok: false;
      response: VlxAccountSyncMockHandlerErrorResponse;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? String(value);
}

function createErrorResponse({
  request,
  route,
  status,
  code,
  message,
  accountId,
  accountDigest,
  counts,
  blockedReasons,
  idempotencyKey,
  fieldErrors,
  nextMockIdempotencyLedger,
  safeToRetryWithSameIdempotencyKey = false
}: {
  request: VlxAccountSyncMockRequest;
  route: VlxAccountSyncRouteId | "unknown";
  status: number;
  code: VlxAccountSyncMockHandlerErrorCode;
  message: string;
  accountId?: VlxAccountId | string;
  accountDigest?: VlxAccountStateDigest;
  counts?: {
    accepted: number;
    skipped: number;
    rejected: number;
    audit: number;
  };
  blockedReasons?: readonly VlxServerPersistenceReason[];
  idempotencyKey?: string;
  fieldErrors?: Record<string, string[]>;
  nextMockIdempotencyLedger?: VlxAccountSyncMockIdempotencyLedger;
  safeToRetryWithSameIdempotencyKey?: boolean;
}): VlxAccountSyncMockHandlerErrorResponse {
  const error: VlxAccountSyncMockHandlerError = {
    code,
    message,
    retryable: false,
    route,
    requestId: request.requestId,
    fieldErrors,
    idempotencyKey,
    safeToRetryWithSameIdempotencyKey,
    blockedReasons
  };

  return {
    status,
    ok: false,
    route,
    requestId: request.requestId,
    createdAt: request.createdAt,
    accountId,
    accountDigest,
    counts,
    blockedReasons,
    safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
    noNetwork: true,
    noRuntime: true,
    nextMockIdempotencyLedger,
    error
  };
}

function createSuccessResponse<TBody extends VlxAccountSyncMockResponseBody>({
  request,
  route,
  status,
  body,
  accountId,
  accountDigest,
  counts,
  blockedReasons,
  nextMockIdempotencyLedger
}: {
  request: VlxAccountSyncMockRequest;
  route: VlxAccountSyncRouteId;
  status: number;
  body: TBody;
  accountId: VlxAccountId | string;
  accountDigest?: VlxAccountStateDigest;
  counts?: {
    accepted: number;
    skipped: number;
    rejected: number;
    audit: number;
  };
  blockedReasons?: readonly VlxServerPersistenceReason[];
  nextMockIdempotencyLedger?: VlxAccountSyncMockIdempotencyLedger;
}): VlxAccountSyncMockHandlerSuccessResponse<TBody> {
  return {
    status,
    ok: true,
    route,
    requestId: request.requestId,
    createdAt: request.createdAt,
    accountId,
    accountDigest,
    counts,
    blockedReasons,
    safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
    noNetwork: true,
    noRuntime: true,
    nextMockIdempotencyLedger,
    body
  };
}

function validateRoute(
  routeId: VlxAccountSyncRouteId,
  request: VlxAccountSyncMockRequest
) {
  const requestedRoute = VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS.find(
    (definition) => definition.path === request.path
  );

  if (!requestedRoute || requestedRoute.routeId !== routeId) {
    return createErrorResponse({
      request,
      route: "unknown",
      status: 404,
      code: "route_not_found",
      message: "Mock account sync handler route was not found."
    });
  }

  const definition = getVlxAccountSyncRouteDefinition(routeId);

  if (!definition || request.method !== definition.method) {
    return createErrorResponse({
      request,
      route: routeId,
      status: 405,
      code: "method_not_allowed",
      message: "Mock account sync handler method is not allowed for this route."
    });
  }

  return undefined;
}

function getMockAuthState(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
) {
  return context?.mockAuthState ?? request.mockAuthState;
}

function requireMockAuthenticatedContext(
  route: VlxAccountSyncRouteId,
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
): MockAuthCheck {
  const mockAuthState = getMockAuthState(request, context);

  if (!mockAuthState || mockAuthState.kind !== "mock_authenticated") {
    return {
      ok: false,
      response: createErrorResponse({
        request,
        route,
        status: 401,
        code: "auth_required_future_boundary",
        message:
          "Mock authenticated context is required; real auth remains a future boundary."
      })
    };
  }

  const requestedAccountId =
    request.accountId ?? context?.accountId ?? mockAuthState.accountId;

  if (String(requestedAccountId) !== String(mockAuthState.accountId)) {
    return {
      ok: false,
      response: createErrorResponse({
        request,
        route,
        status: 400,
        code: "invalid_request",
        message: "Mock request accountId must match the mock authenticated account.",
        accountId: requestedAccountId,
        fieldErrors: {
          accountId: ["account_mismatch"]
        }
      })
    };
  }

  return {
    ok: true,
    accountId: requestedAccountId,
    mockAuthState
  };
}

function getPayloadVersions(request: VlxAccountSyncMockRequest) {
  const versions: number[] = [];

  if (typeof request.accountSyncPayloadVersion === "number") {
    versions.push(request.accountSyncPayloadVersion);
  }

  if (
    isRecord(request.body) &&
    typeof request.body.accountSyncPayloadVersion === "number"
  ) {
    versions.push(request.body.accountSyncPayloadVersion);
  }

  return versions;
}

function hasValidPayloadVersion(request: VlxAccountSyncMockRequest) {
  const versions = getPayloadVersions(request);

  return (
    versions.length > 0 &&
    versions.every(
      (version) => version === VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION
    )
  );
}

function isGuestSnapshot(value: unknown): value is VlxGuestDeviceSnapshot {
  return (
    isRecord(value) &&
    typeof value.snapshotId === "string" &&
    typeof value.capturedAt === "string" &&
    isRecord(value.stores)
  );
}

function getLocalSnapshotFromBody(
  body: unknown
): VlxGuestDeviceSnapshot | undefined {
  if (!isRecord(body) || !isGuestSnapshot(body.localSnapshot)) {
    return undefined;
  }

  return body.localSnapshot;
}

function getInitialServerState(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
) {
  return context?.initialServerState ?? request.initialServerState;
}

function getLedger(context?: VlxAccountSyncMockHandlerContext) {
  return context?.mockIdempotencyLedger ?? {};
}

function getApplyIdempotencyKey(request: VlxAccountSyncMockRequest) {
  const bodyKey = isRecord(request.body) ? request.body.idempotencyKey : undefined;
  const requestKey = request.idempotencyKey;

  if (
    typeof bodyKey === "string" &&
    typeof requestKey === "string" &&
    bodyKey !== requestKey
  ) {
    return {
      ok: false as const,
      key: undefined,
      mismatch: true
    };
  }

  const key = typeof requestKey === "string" ? requestKey : bodyKey;

  return {
    ok: true as const,
    key: typeof key === "string" ? key : undefined,
    mismatch: false
  };
}

function createApplyPayloadFingerprint({
  accountId,
  idempotencyKey,
  body
}: {
  accountId: VlxAccountId | string;
  idempotencyKey: string;
  body: VlxAccountSyncApplyRouteRequest;
}) {
  return stableSerialize({
    route: "apply",
    accountId: String(accountId),
    idempotencyKey,
    body: {
      ...body,
      idempotencyKey
    }
  });
}

function toAuditSummary(
  record: VlxServerPersistenceAuditRecord
): VlxAccountSyncAuditSummary {
  return {
    auditId: record.auditId,
    accountId: record.accountId,
    createdAt: record.createdAt,
    source: record.source,
    planId: record.planId,
    resolutionId: record.resolutionId,
    category: record.category,
    action: record.action,
    target: record.target,
    status: record.status,
    reason: record.reason,
    grantsPaidEntitlement: false,
    callsNetwork: false,
    containsRawSensitivePayload: false
  };
}

function toAuditSummaries(
  records: readonly VlxServerPersistenceAuditRecord[] | undefined,
  limit: number
) {
  return (records ?? []).slice(-limit).map(toAuditSummary);
}

function parseAuditLimit(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
) {
  const raw = request.query?.limit ?? context?.maxAuditSummaries;
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : DEFAULT_AUDIT_SUMMARY_LIMIT;

  if (!Number.isFinite(value)) {
    return DEFAULT_AUDIT_SUMMARY_LIMIT;
  }

  return Math.max(0, Math.min(DEFAULT_AUDIT_SUMMARY_LIMIT, Math.floor(value)));
}

function readDigestFromMockServerState({
  accountId,
  now,
  initialServerState
}: {
  accountId: VlxAccountId | string;
  now: string;
  initialServerState?: VlxServerPersistenceAccountState;
}) {
  const store = createInMemoryServerPersistenceStore({
    accounts: initialServerState
      ? {
          [String(accountId)]: initialServerState
        }
      : {}
  });
  const adapter = createInMemoryServerPersistenceAdapter({
    now,
    store
  });
  const result = adapter.getAccountStateDigest(accountId);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}

function runHarnessSafely({
  request,
  route,
  accountId,
  localSnapshot,
  initialServerState,
  acceptedResolutionIds,
  planId
}: {
  request: VlxAccountSyncMockRequest;
  route: "preview" | "apply";
  accountId: VlxAccountId | string;
  localSnapshot: VlxGuestDeviceSnapshot;
  initialServerState?: VlxServerPersistenceAccountState;
  acceptedResolutionIds?: readonly string[];
  planId?: string;
}) {
  try {
    return {
      ok: true as const,
      report: runServerPersistenceIntegrationHarness({
        accountId,
        localSnapshot,
        initialServerState,
        acceptedResolutionIds,
        now: request.createdAt,
        createdAt: request.createdAt,
        planId: planId ?? `${request.requestId}:${route}`
      })
    };
  } catch (error) {
    return {
      ok: false as const,
      response: createErrorResponse({
        request,
        route,
        status: 400,
        code: "invalid_request",
        message:
          error instanceof Error
            ? error.message
            : "Mock account sync handler request was invalid."
      })
    };
  }
}

export function handleAccountSyncPreviewMock(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
): VlxAccountSyncMockHandlerResponse<VlxAccountSyncPreviewMockBody> {
  const routeError = validateRoute("preview", request);

  if (routeError) {
    return routeError;
  }

  const auth = requireMockAuthenticatedContext("preview", request, context);

  if (!auth.ok) {
    return auth.response;
  }

  if (!hasValidPayloadVersion(request)) {
    return createErrorResponse({
      request,
      route: "preview",
      status: 400,
      code: "invalid_payload_version",
      message: "Preview mock handler requires accountSyncPayloadVersion 1.",
      accountId: auth.accountId
    });
  }

  const localSnapshot = getLocalSnapshotFromBody(request.body);

  if (!localSnapshot || !isRecord(request.body) || request.body.previewOnly !== true) {
    return createErrorResponse({
      request,
      route: "preview",
      status: 400,
      code: "invalid_request",
      message: "Preview mock handler requires a preview route request body.",
      accountId: auth.accountId
    });
  }

  const harness = runHarnessSafely({
    request,
    route: "preview",
    accountId: auth.accountId,
    localSnapshot,
    initialServerState: getInitialServerState(request, context)
  });

  if (!harness.ok) {
    return harness.response;
  }

  if (!harness.report.previewResult.ok) {
    return createErrorResponse({
      request,
      route: "preview",
      status: 400,
      code: "invalid_request",
      message: harness.report.previewResult.error.message,
      accountId: auth.accountId,
      accountDigest: harness.report.beforeDigest
    });
  }

  const body: VlxAccountSyncPreviewMockBody = {
    ok: true,
    route: "preview",
    accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
    plan: harness.report.plan,
    preview: harness.report.previewResult.data,
    safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
    digest: harness.report.afterDigest,
    mutatedServerState: false,
    harnessStatus: "disabled_mock_only",
    currentDigest: harness.report.beforeDigest,
    projectedDigest: harness.report.afterDigest,
    noPaidEntitlementGranted: true
  };

  return createSuccessResponse({
    request,
    route: "preview",
    status: 200,
    body,
    accountId: auth.accountId,
    accountDigest: body.digest,
    blockedReasons: body.preview.blockedReasons
  });
}

export function handleAccountSyncApplyMock(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
): VlxAccountSyncMockHandlerResponse<VlxAccountSyncApplyMockBody> {
  const routeError = validateRoute("apply", request);

  if (routeError) {
    return routeError;
  }

  const auth = requireMockAuthenticatedContext("apply", request, context);

  if (!auth.ok) {
    return auth.response;
  }

  if (!hasValidPayloadVersion(request)) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "invalid_payload_version",
      message: "Apply mock handler requires accountSyncPayloadVersion 1.",
      accountId: auth.accountId
    });
  }

  if (!isRecord(request.body)) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "invalid_request",
      message: "Apply mock handler requires an apply route request body.",
      accountId: auth.accountId
    });
  }

  const idempotency = getApplyIdempotencyKey(request);

  if (!idempotency.ok) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "invalid_request",
      message: "Apply mock idempotency key must match in request and body.",
      accountId: auth.accountId,
      fieldErrors: {
        idempotencyKey: ["idempotency_key_mismatch"]
      }
    });
  }

  if (!idempotency.key || idempotency.key.trim().length === 0) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "missing_idempotency_key",
      message: "Apply mock handler requires an idempotencyKey.",
      accountId: auth.accountId
    });
  }

  const applyBody = request.body as VlxAccountSyncApplyRouteRequest;

  if (
    !applyBody.clientConfirmation?.confirmed ||
    applyBody.clientConfirmation.acknowledgesNoPaidEntitlementGrant !== true
  ) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "paid_entitlement_confirmation_required",
      message:
        "Apply mock handler requires explicit confirmation that sync will not grant paid entitlement.",
      accountId: auth.accountId,
      idempotencyKey: idempotency.key
    });
  }

  const localSnapshot = getLocalSnapshotFromBody(applyBody);

  if (!localSnapshot) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "invalid_request",
      message: "Apply mock handler requires local snapshot evidence.",
      accountId: auth.accountId,
      idempotencyKey: idempotency.key
    });
  }

  const ledger = getLedger(context);
  const payloadFingerprint = createApplyPayloadFingerprint({
    accountId: auth.accountId,
    idempotencyKey: idempotency.key,
    body: applyBody
  });
  const existingRecord = ledger[idempotency.key];

  if (existingRecord) {
    if (existingRecord.payloadFingerprint !== payloadFingerprint) {
      return createErrorResponse({
        request,
        route: "apply",
        status: 409,
        code: "idempotency_payload_conflict",
        message:
          "Apply mock idempotencyKey was already used with a different payload.",
        accountId: auth.accountId,
        accountDigest: existingRecord.accountDigest,
        counts: existingRecord.counts,
        idempotencyKey: idempotency.key,
        nextMockIdempotencyLedger: ledger
      });
    }

    if (existingRecord.responseBody) {
      const body: VlxAccountSyncApplyMockBody = {
        ...existingRecord.responseBody,
        idempotency: {
          key: idempotency.key,
          outcome: "replayed",
          samePayloadReplay: true
        }
      };

      return createSuccessResponse({
        request,
        route: "apply",
        status: existingRecord.responseStatus,
        body,
        accountId: auth.accountId,
        accountDigest: existingRecord.accountDigest,
        counts: existingRecord.counts,
        nextMockIdempotencyLedger: ledger
      });
    }

    return createErrorResponse({
      request,
      route: "apply",
      status: existingRecord.responseStatus,
      code: existingRecord.responseError?.code ?? "blocked_plan",
      message:
        existingRecord.responseError?.message ??
        "Apply mock idempotency replay returned a stored blocked plan.",
      accountId: auth.accountId,
      accountDigest: existingRecord.accountDigest,
      counts: existingRecord.counts,
      idempotencyKey: idempotency.key,
      blockedReasons: existingRecord.responseError?.blockedReasons,
      nextMockIdempotencyLedger: ledger
    });
  }

  const previewedPlan =
    applyBody.mode === "apply_previewed_plan" ? applyBody.previewedPlan : undefined;
  const harness = runHarnessSafely({
    request,
    route: "apply",
    accountId: auth.accountId,
    localSnapshot,
    initialServerState: getInitialServerState(request, context),
    acceptedResolutionIds:
      context?.acceptedResolutionIds ??
      applyBody.clientConfirmation.acceptedResolutionIds,
    planId: previewedPlan?.planId
  });

  if (!harness.ok) {
    return harness.response;
  }

  const preview = harness.report.previewResult.ok
    ? harness.report.previewResult.data
    : undefined;
  const blockedReasons = preview?.blockedReasons ?? [];

  if (
    previewedPlan?.status === "blocked" ||
    harness.report.planStatus === "blocked" ||
    !preview?.canApply
  ) {
    const blockedResponse = createErrorResponse({
      request,
      route: "apply",
      status: 409,
      code: "blocked_plan",
      message: "Apply mock handler rejected a blocked account sync plan.",
      accountId: auth.accountId,
      accountDigest: harness.report.afterDigest,
      counts: {
        accepted: 0,
        skipped: 0,
        rejected: blockedReasons.length || harness.report.counts.rejected,
        audit: 0
      },
      idempotencyKey: idempotency.key,
      blockedReasons
    });
    const nextLedger = {
      ...ledger,
      [idempotency.key]: {
        idempotencyKey: idempotency.key,
        payloadFingerprint,
        recordedAt: request.createdAt,
        status: "stored_blocked" as const,
        responseStatus: blockedResponse.status,
        responseError: blockedResponse.error,
        accountDigest: blockedResponse.accountDigest,
        counts: blockedResponse.counts
      }
    };

    return {
      ...blockedResponse,
      nextMockIdempotencyLedger: nextLedger
    };
  }

  if (!harness.report.applyResult.attempted || !harness.report.applyResult.result.ok) {
    return createErrorResponse({
      request,
      route: "apply",
      status: 400,
      code: "invalid_request",
      message: "Apply mock handler could not apply the mock harness plan.",
      accountId: auth.accountId,
      accountDigest: harness.report.afterDigest,
      idempotencyKey: idempotency.key
    });
  }

  const application = harness.report.applyResult.result.data;
  const counts = {
    accepted: harness.report.counts.accepted,
    skipped: harness.report.counts.skipped,
    rejected: harness.report.counts.rejected,
    audit: harness.report.counts.audit
  };
  const body: VlxAccountSyncApplyMockBody = {
    ok: true,
    route: "apply",
    accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
    idempotencyKey: idempotency.key,
    applicationStatus: "accepted",
    counts,
    digest: application.digest,
    auditSummaries: toAuditSummaries(application.auditRecords, DEFAULT_AUDIT_SUMMARY_LIMIT),
    application,
    safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
    transactionPolicy: "future_transaction_like_commit_required",
    harnessStatus: "disabled_mock_only",
    idempotency: {
      key: idempotency.key,
      outcome: "recorded",
      samePayloadReplay: false
    },
    noPaidEntitlementGranted: true
  };
  const nextLedger = {
    ...ledger,
    [idempotency.key]: {
      idempotencyKey: idempotency.key,
      payloadFingerprint,
      recordedAt: request.createdAt,
      status: "stored_success" as const,
      responseStatus: 200,
      responseBody: body,
      accountDigest: body.digest,
      counts
    }
  };

  return createSuccessResponse({
    request,
    route: "apply",
    status: 200,
    body,
    accountId: auth.accountId,
    accountDigest: body.digest,
    counts,
    nextMockIdempotencyLedger: nextLedger
  });
}

export function handleAccountSyncDigestMock(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
): VlxAccountSyncMockHandlerResponse<VlxAccountSyncDigestMockBody> {
  const routeError = validateRoute("digest", request);

  if (routeError) {
    return routeError;
  }

  const auth = requireMockAuthenticatedContext("digest", request, context);

  if (!auth.ok) {
    return auth.response;
  }

  let digest: VlxAccountStateDigest;

  try {
    digest = readDigestFromMockServerState({
      accountId: auth.accountId,
      now: request.createdAt,
      initialServerState: getInitialServerState(request, context)
    });
  } catch (error) {
    return createErrorResponse({
      request,
      route: "digest",
      status: 400,
      code: "invalid_request",
      message:
        error instanceof Error
          ? error.message
          : "Digest mock handler request was invalid.",
      accountId: auth.accountId
    });
  }

  const body: VlxAccountSyncDigestMockBody = {
    ok: true,
    route: "digest",
    accountId: auth.accountId,
    digest,
    containsFullSensitiveState: false,
    ownerOnlyAfterAuth: true,
    digestOnly: true,
    exposesFullSensitiveState: false
  };

  return createSuccessResponse({
    request,
    route: "digest",
    status: 200,
    body,
    accountId: auth.accountId,
    accountDigest: digest
  });
}

export function handleAccountSyncAuditMock(
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
): VlxAccountSyncMockHandlerResponse<VlxAccountSyncAuditMockBody> {
  const routeError = validateRoute("audit", request);

  if (routeError) {
    return routeError;
  }

  const auth = requireMockAuthenticatedContext("audit", request, context);

  if (!auth.ok) {
    return auth.response;
  }

  const maxSummaries = parseAuditLimit(request, context);
  const initialServerState = getInitialServerState(request, context);
  const auditSummaries = toAuditSummaries(
    initialServerState?.auditRecords,
    maxSummaries
  );
  const body: VlxAccountSyncAuditMockBody = {
    ok: true,
    route: "audit",
    accountId: auth.accountId,
    auditSummaries,
    containsRawSensitivePayloads: false,
    ownerOnlyAfterAuth: true,
    bounded: true,
    maxSummaries,
    exposesRawSensitivePayloads: false
  };

  return createSuccessResponse({
    request,
    route: "audit",
    status: 200,
    body,
    accountId: auth.accountId
  });
}

export const VLX_ACCOUNT_SYNC_MOCK_HANDLER_REGISTRY = {
  preview: handleAccountSyncPreviewMock,
  apply: handleAccountSyncApplyMock,
  digest: handleAccountSyncDigestMock,
  audit: handleAccountSyncAuditMock
} as const satisfies VlxAccountSyncMockHandlerRegistry;
