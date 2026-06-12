import {
  VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  type VlxAccountSyncApplyRouteRequest
} from "@/lib/account-persistence/api-route-design/route-contracts";
import {
  ACCOUNT_SYNC_APPLY_ROUTE_REQUEST_FIXTURE,
  ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE
} from "@/lib/account-persistence/api-route-design/fixtures";
import type {
  VlxAccountSyncMockAuthState,
  VlxAccountSyncMockHandlerContext,
  VlxAccountSyncMockRequest
} from "@/lib/account-persistence/api-handler-harness/handler-contracts";
import {
  FAKE_MASTERED_HARNESS_SNAPSHOT,
  SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  UPGRADE_INTEREST_ONLY_HARNESS_SNAPSHOT,
  createSyncHarnessInitialServerState,
  makeSyncHarnessReviewState,
  makeSyncHarnessSavedWord
} from "@/lib/account-persistence/sync-harness/fixtures";
import type {
  VlxServerPersistenceAccountState,
  VlxServerPersistenceAuditRecord
} from "@/lib/account-persistence/server-adapter/adapter-contract";

export const ACCOUNT_SYNC_API_HANDLER_HARNESS_REQUEST_ID =
  "account-sync-api-handler-harness-request-1";

export const ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY =
  "idem-account-sync-api-handler-harness-apply-1";

export const ACCOUNT_SYNC_API_HANDLER_HARNESS_FAKE_MASTERY_IDEMPOTENCY_KEY =
  "idem-account-sync-api-handler-harness-fake-mastery-1";

export const ACCOUNT_SYNC_API_HANDLER_HARNESS_UPGRADE_IDEMPOTENCY_KEY =
  "idem-account-sync-api-handler-harness-upgrade-1";

export const ACCOUNT_SYNC_API_HANDLER_MOCK_AUTH_STATE = {
  kind: "mock_authenticated",
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  authenticatedAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  implementsRealAuth: false,
  boundary: "future_auth_boundary_mock_only"
} as const satisfies VlxAccountSyncMockAuthState;

export const ACCOUNT_SYNC_API_HANDLER_MOCK_ANONYMOUS_STATE = {
  kind: "mock_anonymous",
  implementsRealAuth: false,
  boundary: "future_auth_boundary_mock_only"
} as const satisfies VlxAccountSyncMockAuthState;

export function createAccountSyncApiHandlerMockContext(
  input: Partial<VlxAccountSyncMockHandlerContext> = {}
): VlxAccountSyncMockHandlerContext {
  return {
    accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
    mockAuthState: ACCOUNT_SYNC_API_HANDLER_MOCK_AUTH_STATE,
    ...input
  };
}

export const ACCOUNT_SYNC_API_HANDLER_PREVIEW_REQUEST_FIXTURE = {
  method: "POST",
  path: "/api/account/sync/preview",
  requestId: ACCOUNT_SYNC_API_HANDLER_HARNESS_REQUEST_ID,
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  body: ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE
} as const satisfies VlxAccountSyncMockRequest<
  typeof ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE
>;

export const ACCOUNT_SYNC_API_HANDLER_APPLY_REQUEST_FIXTURE = {
  method: "POST",
  path: "/api/account/sync/apply",
  requestId: "account-sync-api-handler-harness-apply-request-1",
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY,
  body: {
    ...ACCOUNT_SYNC_APPLY_ROUTE_REQUEST_FIXTURE,
    idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_IDEMPOTENCY_KEY
  }
} as const satisfies VlxAccountSyncMockRequest<VlxAccountSyncApplyRouteRequest>;

export const ACCOUNT_SYNC_API_HANDLER_DIGEST_REQUEST_FIXTURE = {
  method: "GET",
  path: "/api/account/sync/digest",
  requestId: "account-sync-api-handler-harness-digest-request-1",
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID
} as const satisfies VlxAccountSyncMockRequest;

export const ACCOUNT_SYNC_API_HANDLER_AUDIT_REQUEST_FIXTURE = {
  method: "GET",
  path: "/api/account/sync/audit",
  requestId: "account-sync-api-handler-harness-audit-request-1",
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID
} as const satisfies VlxAccountSyncMockRequest;

export const ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_BODY = {
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  mode: "apply_snapshot_after_revalidation",
  idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_FAKE_MASTERY_IDEMPOTENCY_KEY,
  localSnapshot: FAKE_MASTERED_HARNESS_SNAPSHOT,
  clientConfirmation: {
    confirmed: true,
    confirmedAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
    acknowledgesPreviewMayBeRebuilt: true,
    acknowledgesNoPaidEntitlementGrant: true
  }
} as const satisfies VlxAccountSyncApplyRouteRequest;

export const ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_REQUEST_FIXTURE = {
  method: "POST",
  path: "/api/account/sync/apply",
  requestId: "account-sync-api-handler-harness-fake-mastery-request-1",
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_FAKE_MASTERY_IDEMPOTENCY_KEY,
  body: ACCOUNT_SYNC_API_HANDLER_FAKE_MASTERY_APPLY_BODY
} as const satisfies VlxAccountSyncMockRequest<VlxAccountSyncApplyRouteRequest>;

export const ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_BODY = {
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  mode: "apply_snapshot_after_revalidation",
  idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_UPGRADE_IDEMPOTENCY_KEY,
  localSnapshot: UPGRADE_INTEREST_ONLY_HARNESS_SNAPSHOT,
  clientConfirmation: {
    confirmed: true,
    confirmedAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
    acknowledgesPreviewMayBeRebuilt: true,
    acknowledgesNoPaidEntitlementGrant: true
  }
} as const satisfies VlxAccountSyncApplyRouteRequest;

export const ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_REQUEST_FIXTURE = {
  method: "POST",
  path: "/api/account/sync/apply",
  requestId: "account-sync-api-handler-harness-upgrade-request-1",
  createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
  accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  idempotencyKey: ACCOUNT_SYNC_API_HANDLER_HARNESS_UPGRADE_IDEMPOTENCY_KEY,
  body: ACCOUNT_SYNC_API_HANDLER_UPGRADE_APPLY_BODY
} as const satisfies VlxAccountSyncMockRequest<VlxAccountSyncApplyRouteRequest>;

export const ACCOUNT_SYNC_API_HANDLER_DIGEST_SERVER_STATE =
  createSyncHarnessInitialServerState({
    savedWords: {
      dissonance: makeSyncHarnessSavedWord()
    },
    reviewState: {
      dissonance: makeSyncHarnessReviewState()
    }
  });

export function createAccountSyncApiHandlerAuditRecord(
  index: number
): VlxServerPersistenceAuditRecord {
  return {
    auditId: `audit-account-sync-api-handler-harness-${index}`,
    accountId: SERVER_PERSISTENCE_SYNC_HARNESS_ACCOUNT_ID,
    createdAt: SERVER_PERSISTENCE_SYNC_HARNESS_FIXTURE_NOW,
    source: "conflict_resolution_plan",
    planId: "account-sync-api-handler-harness-plan-1",
    resolutionId: `account-sync-api-handler-harness-resolution-${index}`,
    category: "pack_progress_without_event_evidence",
    action: "skip_audit_only",
    target: "pack_progress",
    status: "audit_only",
    reason: {
      code: "audit_only",
      message:
        "Audit handler harness summary fixture omits raw payloads and sensitive state.",
      metadata: {
        index
      }
    },
    grantsPaidEntitlement: false,
    callsNetwork: false
  };
}

export function createAccountSyncApiHandlerAuditServerState(
  count = 25
): VlxServerPersistenceAccountState {
  return createSyncHarnessInitialServerState({
    auditRecords: Array.from({ length: count }, (_, index) =>
      createAccountSyncApiHandlerAuditRecord(index + 1)
    )
  });
}
