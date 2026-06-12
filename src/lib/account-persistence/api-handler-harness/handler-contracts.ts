import type {
  VlxAccountSyncApplyRouteRequest,
  VlxAccountSyncApplyRouteResponse,
  VlxAccountSyncAuditRouteResponse,
  VlxAccountSyncAuditSummary,
  VlxAccountSyncDigestRouteResponse,
  VlxAccountSyncPreviewRouteRequest,
  VlxAccountSyncPreviewRouteResponse,
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath,
  VlxAccountSyncRouteSafetyPolicy
} from "@/lib/account-persistence/api-route-design/route-contracts";
import type {
  VlxAccountId,
  VlxAccountStateDigest
} from "@/lib/account-persistence/types";
import type { VlxAccountSyncConflictResolutionPlan } from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type {
  VlxServerPersistenceAccountState,
  VlxServerPersistenceReason
} from "@/lib/account-persistence/server-adapter/adapter-contract";

export type VlxAccountSyncMockAuthState =
  | {
      kind: "mock_authenticated";
      accountId: VlxAccountId | string;
      authenticatedAt: string;
      implementsRealAuth: false;
      boundary: "future_auth_boundary_mock_only";
    }
  | {
      kind: "mock_anonymous";
      implementsRealAuth: false;
      boundary: "future_auth_boundary_mock_only";
    };

export type VlxAccountSyncMockRequest<TBody = unknown> = {
  method: VlxAccountSyncRouteMethod | string;
  path: VlxAccountSyncRoutePath | string;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined>;
  accountId?: VlxAccountId | string;
  mockAuthState?: VlxAccountSyncMockAuthState;
  idempotencyKey?: string;
  requestId: string;
  createdAt: string;
  accountSyncPayloadVersion?: number;
  initialServerState?: VlxServerPersistenceAccountState;
};

export type VlxAccountSyncPreviewMockRequest =
  VlxAccountSyncMockRequest<VlxAccountSyncPreviewRouteRequest>;

export type VlxAccountSyncApplyMockRequest =
  VlxAccountSyncMockRequest<VlxAccountSyncApplyRouteRequest>;

export type VlxAccountSyncDigestMockRequest = VlxAccountSyncMockRequest;

export type VlxAccountSyncAuditMockRequest = VlxAccountSyncMockRequest;

export type VlxAccountSyncMockHandlerErrorCode =
  | "method_not_allowed"
  | "route_not_found"
  | "auth_required_future_boundary"
  | "invalid_payload_version"
  | "missing_idempotency_key"
  | "paid_entitlement_confirmation_required"
  | "blocked_plan"
  | "invalid_request"
  | "idempotency_payload_conflict";

export type VlxAccountSyncMockHandlerError = {
  code: VlxAccountSyncMockHandlerErrorCode;
  message: string;
  retryable: boolean;
  route: VlxAccountSyncRouteId | "unknown";
  requestId: string;
  fieldErrors?: Record<string, string[]>;
  idempotencyKey?: string;
  safeToRetryWithSameIdempotencyKey?: boolean;
  blockedReasons?: readonly VlxServerPersistenceReason[];
};

export type VlxAccountSyncApplyMockCounts = {
  accepted: number;
  skipped: number;
  rejected: number;
  audit: number;
};

export type VlxAccountSyncPreviewMockBody = Extract<
  VlxAccountSyncPreviewRouteResponse,
  { ok: true }
> & {
  harnessStatus: "disabled_mock_only";
  currentDigest: VlxAccountStateDigest;
  projectedDigest: VlxAccountStateDigest;
  noPaidEntitlementGranted: true;
};

export type VlxAccountSyncApplyMockBody = Extract<
  VlxAccountSyncApplyRouteResponse,
  { ok: true }
> & {
  harnessStatus: "disabled_mock_only";
  idempotency: {
    key: string;
    outcome: "recorded" | "replayed";
    samePayloadReplay: boolean;
  };
  noPaidEntitlementGranted: true;
};

export type VlxAccountSyncDigestMockBody = Extract<
  VlxAccountSyncDigestRouteResponse,
  { ok: true }
> & {
  digestOnly: true;
  exposesFullSensitiveState: false;
};

export type VlxAccountSyncAuditMockBody = Extract<
  VlxAccountSyncAuditRouteResponse,
  { ok: true }
> & {
  bounded: true;
  maxSummaries: number;
  exposesRawSensitivePayloads: false;
};

export type VlxAccountSyncMockResponseBody =
  | VlxAccountSyncPreviewMockBody
  | VlxAccountSyncApplyMockBody
  | VlxAccountSyncDigestMockBody
  | VlxAccountSyncAuditMockBody;

export type VlxAccountSyncMockIdempotencyRecord = {
  idempotencyKey: string;
  payloadFingerprint: string;
  recordedAt: string;
  status: "stored_success" | "stored_blocked";
  responseStatus: number;
  responseBody?: VlxAccountSyncApplyMockBody;
  responseError?: VlxAccountSyncMockHandlerError;
  accountDigest?: VlxAccountStateDigest;
  counts?: VlxAccountSyncApplyMockCounts;
};

export type VlxAccountSyncMockIdempotencyLedger = Record<
  string,
  VlxAccountSyncMockIdempotencyRecord
>;

export type VlxAccountSyncMockHandlerContext = {
  accountId?: VlxAccountId | string;
  mockAuthState?: VlxAccountSyncMockAuthState;
  initialServerState?: VlxServerPersistenceAccountState;
  mockIdempotencyLedger?: VlxAccountSyncMockIdempotencyLedger;
  acceptedResolutionIds?: readonly string[];
  maxAuditSummaries?: number;
};

export type VlxAccountSyncMockHandlerResponseBase = {
  status: number;
  ok: boolean;
  route: VlxAccountSyncRouteId | "unknown";
  requestId: string;
  createdAt: string;
  accountId?: VlxAccountId | string;
  accountDigest?: VlxAccountStateDigest;
  counts?: VlxAccountSyncApplyMockCounts;
  blockedReasons?: readonly VlxServerPersistenceReason[];
  safety: VlxAccountSyncRouteSafetyPolicy;
  noNetwork: true;
  noRuntime: true;
  nextMockIdempotencyLedger?: VlxAccountSyncMockIdempotencyLedger;
};

export type VlxAccountSyncMockHandlerSuccessResponse<
  TBody extends VlxAccountSyncMockResponseBody
> = VlxAccountSyncMockHandlerResponseBase & {
  ok: true;
  body: TBody;
  error?: undefined;
};

export type VlxAccountSyncMockHandlerErrorResponse =
  VlxAccountSyncMockHandlerResponseBase & {
    ok: false;
    body?: undefined;
    error: VlxAccountSyncMockHandlerError;
  };

export type VlxAccountSyncMockHandlerResponse<
  TBody extends VlxAccountSyncMockResponseBody = VlxAccountSyncMockResponseBody
> =
  | VlxAccountSyncMockHandlerSuccessResponse<TBody>
  | VlxAccountSyncMockHandlerErrorResponse;

export type VlxAccountSyncMockHandler = (
  request: VlxAccountSyncMockRequest,
  context?: VlxAccountSyncMockHandlerContext
) => VlxAccountSyncMockHandlerResponse;

export type VlxAccountSyncMockHandlerRegistry = Record<
  VlxAccountSyncRouteId,
  VlxAccountSyncMockHandler
>;

export type VlxAccountSyncApplyMockRouteInput = {
  localSnapshot: VlxAccountSyncApplyRouteRequest["localSnapshot"];
  previewedPlan?: VlxAccountSyncConflictResolutionPlan;
};

export type VlxAccountSyncMockAuditSummary = VlxAccountSyncAuditSummary;
