import {
  VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
  type VlxAccountSyncApplyRouteRequest,
  type VlxAccountSyncApplyRouteResponse,
  type VlxAccountSyncAuditRouteResponse,
  type VlxAccountSyncAuditSummary,
  type VlxAccountSyncDigestRouteResponse,
  type VlxAccountSyncPreviewRouteRequest,
  type VlxAccountSyncPreviewRouteResponse
} from "@/lib/account-persistence/api-route-design/route-contracts";
import { resolveAccountSyncConflicts } from "@/lib/account-persistence/sync-conflicts/conflict-resolver";
import {
  LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  SYNC_CONFLICT_FIXTURE_NOW
} from "@/lib/account-persistence/sync-conflicts/fixtures";
import type { VlxAccountStateDigest } from "@/lib/account-persistence/types";
import type { VlxServerPersistenceResolutionPreview } from "@/lib/account-persistence/server-adapter/adapter-contract";

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID =
  "account-sync-api-route-design-user-1";

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_IDEMPOTENCY_KEY =
  "idem-account-sync-api-route-design-apply-1";

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_DIGEST = {
  savedWordSlugs: ["dissonance"],
  reviewStateSlugs: ["dissonance"],
  reviewEventIds: [],
  dailyStatDates: [],
  packIds: [],
  upgradeInterestIds: [],
  syncCursor: "account-sync-api-route-design-cursor-1",
  capturedAt: SYNC_CONFLICT_FIXTURE_NOW
} as const satisfies VlxAccountStateDigest;

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN = resolveAccountSyncConflicts({
  accountId: ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID,
  planId: "account-sync-api-route-design-plan-1",
  createdAt: SYNC_CONFLICT_FIXTURE_NOW,
  localSnapshot: LOCAL_ONLY_SAVED_WORD_SNAPSHOT
});

const ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION =
  ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN.resolutions[0];

if (!ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION) {
  throw new Error("Account sync API route design fixture requires one resolution.");
}

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_PREVIEW = {
  planId: ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN.planId,
  accountId: ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID,
  canApply: true,
  blockedReasons: [],
  acceptedResolutionIds: [
    ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.resolutionId
  ],
  auditOnlyResolutionIds: [],
  noOpResolutionIds: [],
  rejectedResolutionIds: [],
  plannedMutations: [
    {
      resolutionId: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.resolutionId,
      category: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.category,
      action: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.action,
      target: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.target,
      status: "accepted",
      reason: {
        code: "accepted",
        message: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.reason,
        metadata: {
          routeDesignOnly: true,
          slug: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.slug ?? null
        }
      }
    }
  ],
  mutatesOnPreview: false
} as const satisfies VlxServerPersistenceResolutionPreview;

export const ACCOUNT_SYNC_API_ROUTE_DESIGN_AUDIT_SUMMARY = {
  auditId: "audit-account-sync-api-route-design-1",
  accountId: ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID,
  createdAt: SYNC_CONFLICT_FIXTURE_NOW,
  source: "manual_contract_test",
  planId: ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN.planId,
  resolutionId: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.resolutionId,
  category: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.category,
  action: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.action,
  target: ACCOUNT_SYNC_API_ROUTE_DESIGN_RESOLUTION.target,
  status: "audit_only",
  reason: {
    code: "audit_only",
    message:
      "API route design fixture records audit summary shape without raw payloads."
  },
  grantsPaidEntitlement: false,
  callsNetwork: false,
  containsRawSensitivePayload: false
} as const satisfies VlxAccountSyncAuditSummary;

export const ACCOUNT_SYNC_PREVIEW_ROUTE_REQUEST_FIXTURE = {
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  localSnapshot: LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  clientStateDigest: {
    savedWordSlugs: ["dissonance"],
    capturedAt: SYNC_CONFLICT_FIXTURE_NOW
  },
  requestedAt: SYNC_CONFLICT_FIXTURE_NOW,
  previewOnly: true
} as const satisfies VlxAccountSyncPreviewRouteRequest;

export const ACCOUNT_SYNC_PREVIEW_ROUTE_RESPONSE_FIXTURE = {
  ok: true,
  route: "preview",
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  plan: ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN,
  preview: ACCOUNT_SYNC_API_ROUTE_DESIGN_PREVIEW,
  safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
  digest: ACCOUNT_SYNC_API_ROUTE_DESIGN_DIGEST,
  mutatedServerState: false
} as const satisfies VlxAccountSyncPreviewRouteResponse;

export const ACCOUNT_SYNC_APPLY_ROUTE_REQUEST_FIXTURE = {
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  mode: "apply_previewed_plan",
  idempotencyKey: ACCOUNT_SYNC_API_ROUTE_DESIGN_IDEMPOTENCY_KEY,
  previewedPlan: ACCOUNT_SYNC_API_ROUTE_DESIGN_PLAN,
  localSnapshot: LOCAL_ONLY_SAVED_WORD_SNAPSHOT,
  clientConfirmation: {
    confirmed: true,
    confirmedAt: SYNC_CONFLICT_FIXTURE_NOW,
    acceptedResolutionIds:
      ACCOUNT_SYNC_API_ROUTE_DESIGN_PREVIEW.acceptedResolutionIds,
    acknowledgesPreviewMayBeRebuilt: true,
    acknowledgesNoPaidEntitlementGrant: true
  }
} as const satisfies VlxAccountSyncApplyRouteRequest;

export const ACCOUNT_SYNC_APPLY_ROUTE_RESPONSE_FIXTURE = {
  ok: true,
  route: "apply",
  accountSyncPayloadVersion: VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION,
  idempotencyKey: ACCOUNT_SYNC_API_ROUTE_DESIGN_IDEMPOTENCY_KEY,
  applicationStatus: "accepted",
  counts: {
    accepted: 1,
    skipped: 0,
    rejected: 0,
    audit: 0
  },
  digest: ACCOUNT_SYNC_API_ROUTE_DESIGN_DIGEST,
  auditSummaries: [ACCOUNT_SYNC_API_ROUTE_DESIGN_AUDIT_SUMMARY],
  safety: VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY,
  transactionPolicy: "future_transaction_like_commit_required"
} as const satisfies VlxAccountSyncApplyRouteResponse;

export const ACCOUNT_SYNC_DIGEST_ROUTE_RESPONSE_FIXTURE = {
  ok: true,
  route: "digest",
  accountId: ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID,
  digest: ACCOUNT_SYNC_API_ROUTE_DESIGN_DIGEST,
  containsFullSensitiveState: false,
  ownerOnlyAfterAuth: true
} as const satisfies VlxAccountSyncDigestRouteResponse;

export const ACCOUNT_SYNC_AUDIT_ROUTE_RESPONSE_FIXTURE = {
  ok: true,
  route: "audit",
  accountId: ACCOUNT_SYNC_API_ROUTE_DESIGN_ACCOUNT_ID,
  auditSummaries: [ACCOUNT_SYNC_API_ROUTE_DESIGN_AUDIT_SUMMARY],
  containsRawSensitivePayloads: false,
  ownerOnlyAfterAuth: true
} as const satisfies VlxAccountSyncAuditRouteResponse;
