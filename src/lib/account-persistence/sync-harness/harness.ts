import type {
  VlxAccountId,
  VlxAccountStateDigest,
  VlxGuestDeviceSnapshot
} from "@/lib/account-persistence/types";
import { resolveAccountSyncConflicts } from "@/lib/account-persistence/sync-conflicts/conflict-resolver";
import type {
  VlxAccountSyncConflictResolutionPlan,
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type {
  VlxServerPersistenceAccountState,
  VlxServerPersistencePlanApplication,
  VlxServerPersistenceReason,
  VlxServerPersistenceResolutionPreview,
  VlxServerPersistenceResult
} from "@/lib/account-persistence/server-adapter/adapter-contract";
import {
  createInMemoryServerPersistenceAccountState,
  createInMemoryServerPersistenceAdapter,
  createInMemoryServerPersistenceStore
} from "@/lib/account-persistence/server-adapter/in-memory-adapter";

const DEFAULT_SYNC_HARNESS_NOW = "2026-06-11T12:00:00.000Z";

export type VlxServerPersistenceIntegrationHarnessInput = {
  accountId?: VlxAccountId | string;
  localSnapshot: VlxGuestDeviceSnapshot;
  initialServerState?: VlxServerPersistenceAccountState;
  now?: string;
  planId?: string;
  createdAt?: string;
  acceptedResolutionIds?: readonly string[];
};

export type VlxServerPersistenceIntegrationHarnessSafetyFlags = {
  disabledMockOnly: boolean;
  previewCanApply: boolean;
  planBlocked: boolean;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  readsLocalStorage: false;
  readsProcessEnv: false;
  importsAuthProviderSdk: false;
  importsDatabaseSdk: false;
  importsPaymentSdk: false;
  grantsPaidEntitlement: false;
  mutatesOnPreview: false;
  touchesWebflow: false;
  touchesCloudflare: false;
  touchesVercel: false;
  touchesDns: false;
  touchesProductionData: false;
  safeToApply: boolean;
};

export type VlxServerPersistenceIntegrationHarnessCounts = {
  plannedAccepted: number;
  plannedAuditOnly: number;
  plannedNoOp: number;
  plannedRejected: number;
  accepted: number;
  skipped: number;
  rejected: number;
  audit: number;
};

export type VlxServerPersistenceIntegrationHarnessApplyResult =
  | {
      attempted: true;
      result: VlxServerPersistenceResult<VlxServerPersistencePlanApplication>;
    }
  | {
      attempted: false;
      status: "skipped";
      reason: VlxServerPersistenceReason;
    };

export type VlxServerPersistenceIntegrationHarnessReport = {
  harnessStatus: "disabled_mock_only";
  accountId: VlxAccountId | string;
  snapshotId: string;
  createdAt: string;
  planStatus: VlxAccountSyncConflictResolutionPlan["status"];
  plan: VlxAccountSyncConflictResolutionPlan;
  previewResult: VlxServerPersistenceResult<VlxServerPersistenceResolutionPreview>;
  applyResult: VlxServerPersistenceIntegrationHarnessApplyResult;
  beforeDigest: VlxAccountStateDigest;
  afterDigest: VlxAccountStateDigest;
  counts: VlxServerPersistenceIntegrationHarnessCounts;
  safety: VlxServerPersistenceIntegrationHarnessSafetyFlags;
  serverStateBefore?: VlxServerPersistenceAccountState;
  serverStateAfter?: VlxServerPersistenceAccountState;
};

function accountKey(accountId: VlxAccountId | string) {
  return String(accountId);
}

function unwrapHarnessResult<TData>(
  result: VlxServerPersistenceResult<TData>,
  operation: string
): TData {
  if (!result.ok) {
    throw new Error(
      `Server persistence integration harness ${operation} failed: ${result.error.message}`
    );
  }

  return result.data;
}

function cloneServerAccountState(
  account: VlxServerPersistenceAccountState,
  accountId: VlxAccountId | string = account.accountId
): VlxServerPersistenceAccountState {
  return createInMemoryServerPersistenceAccountState({
    accountId,
    capturedAt: account.capturedAt,
    syncVersion: account.syncVersion,
    savedWords: account.savedWords,
    reviewState: account.reviewState,
    reviewEvents: account.reviewEvents,
    dailyStats: account.dailyStats,
    packProgress: account.packProgress,
    upgradeInterest: account.upgradeInterest,
    auditRecords: account.auditRecords,
    processedIdempotencyKeys: account.processedIdempotencyKeys
  });
}

function createSkippedApplyReason(
  plan: VlxAccountSyncConflictResolutionPlan,
  preview: VlxServerPersistenceResolutionPreview
): VlxServerPersistenceReason {
  return {
    code: "blocked_plan",
    message:
      "Integration harness did not apply the plan because preview/apply safety checks failed.",
    metadata: {
      planId: plan.planId,
      planStatus: plan.status,
      previewCanApply: preview.canApply,
      blockedResolutionIds: preview.rejectedResolutionIds
    }
  };
}

function createSafetyFlags({
  plan,
  preview,
  disabledMockOnly
}: {
  plan: VlxAccountSyncConflictResolutionPlan;
  preview: VlxServerPersistenceResolutionPreview;
  disabledMockOnly: boolean;
}): VlxServerPersistenceIntegrationHarnessSafetyFlags {
  const unsafe =
    plan.mutatesRuntimeStorage ||
    plan.callsNetwork ||
    plan.readsLocalStorage ||
    plan.readsProcessEnv ||
    plan.importsAuthProviderSdk ||
    plan.importsDatabaseSdk ||
    plan.importsPaymentSdk ||
    plan.grantsPaidEntitlement ||
    preview.mutatesOnPreview;

  return {
    disabledMockOnly,
    previewCanApply: preview.canApply,
    planBlocked: plan.status === "blocked",
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    readsLocalStorage: false,
    readsProcessEnv: false,
    importsAuthProviderSdk: false,
    importsDatabaseSdk: false,
    importsPaymentSdk: false,
    grantsPaidEntitlement: false,
    mutatesOnPreview: false,
    touchesWebflow: false,
    touchesCloudflare: false,
    touchesVercel: false,
    touchesDns: false,
    touchesProductionData: false,
    safeToApply:
      disabledMockOnly && preview.canApply && plan.status !== "blocked" && !unsafe
  };
}

function createCounts({
  preview,
  applyResult
}: {
  preview: VlxServerPersistenceResolutionPreview;
  applyResult: VlxServerPersistenceIntegrationHarnessApplyResult;
}): VlxServerPersistenceIntegrationHarnessCounts {
  if (applyResult.attempted && applyResult.result.ok) {
    return {
      plannedAccepted: preview.acceptedResolutionIds.length,
      plannedAuditOnly: preview.auditOnlyResolutionIds.length,
      plannedNoOp: preview.noOpResolutionIds.length,
      plannedRejected: preview.rejectedResolutionIds.length,
      accepted: applyResult.result.data.accepted.length,
      skipped: applyResult.result.data.skipped.length,
      rejected: applyResult.result.data.rejected.length,
      audit: applyResult.result.data.auditRecords.length
    };
  }

  return {
    plannedAccepted: preview.acceptedResolutionIds.length,
    plannedAuditOnly: preview.auditOnlyResolutionIds.length,
    plannedNoOp: preview.noOpResolutionIds.length,
    plannedRejected: preview.rejectedResolutionIds.length,
    accepted: 0,
    skipped: 0,
    rejected: preview.rejectedResolutionIds.length,
    audit: 0
  };
}

function getStoreAccountState(
  accounts: Record<string, VlxServerPersistenceAccountState>,
  accountId: VlxAccountId | string
) {
  const account = accounts[accountKey(accountId)];

  return account ? cloneServerAccountState(account) : undefined;
}

function toConflictResolverServerState(
  serverState: VlxAccountSyncServerState
): VlxAccountSyncServerState {
  return {
    ...serverState,
    // Adapter fingerprints include write metadata; the resolver compares event payloads.
    reviewEvents: (serverState.reviewEvents ?? []).map(
      ({ payloadFingerprint: _payloadFingerprint, ...event }) => event
    )
  };
}

export function runServerPersistenceIntegrationHarness(
  input: VlxServerPersistenceIntegrationHarnessInput
): VlxServerPersistenceIntegrationHarnessReport {
  const now = input.now ?? DEFAULT_SYNC_HARNESS_NOW;
  const accountId =
    input.accountId ??
    input.initialServerState?.accountId ??
    "server-persistence-integration-harness-user-1";
  const initialServerState = input.initialServerState
    ? cloneServerAccountState(input.initialServerState, accountId)
    : undefined;
  const store = createInMemoryServerPersistenceStore({
    accounts: initialServerState
      ? {
          [accountKey(accountId)]: initialServerState
        }
      : {}
  });
  const adapter = createInMemoryServerPersistenceAdapter({
    now,
    store
  });
  const serverStateBefore = getStoreAccountState(adapter.store.accounts, accountId);
  const beforeDigest = unwrapHarnessResult(
    adapter.getAccountStateDigest(accountId),
    "before digest"
  );
  const loadedServerState = unwrapHarnessResult(
    adapter.loadAccountSyncServerState(accountId),
    "load account state"
  );
  const plan = resolveAccountSyncConflicts({
    accountId,
    planId: input.planId,
    createdAt: input.createdAt ?? input.localSnapshot.capturedAt,
    localSnapshot: input.localSnapshot,
    serverState: toConflictResolverServerState(loadedServerState)
  });
  const planInput = {
    plan,
    localSnapshot: input.localSnapshot,
    acceptedResolutionIds: input.acceptedResolutionIds
  };
  const previewResult = adapter.previewApplyAccountSyncResolutionPlan(planInput);
  const preview = unwrapHarnessResult(previewResult, "preview plan");
  const safety = createSafetyFlags({
    plan,
    preview,
    disabledMockOnly:
      adapter.enabled === false && adapter.adapterStatus === "disabled_mock_only"
  });
  const applyResult: VlxServerPersistenceIntegrationHarnessApplyResult =
    safety.safeToApply
      ? {
          attempted: true,
          result: adapter.applyAccountSyncResolutionPlan(planInput)
        }
      : {
          attempted: false,
          status: "skipped",
          reason: createSkippedApplyReason(plan, preview)
        };
  const afterDigest = unwrapHarnessResult(
    adapter.getAccountStateDigest(accountId),
    "after digest"
  );
  const serverStateAfter = getStoreAccountState(adapter.store.accounts, accountId);

  return {
    harnessStatus: "disabled_mock_only",
    accountId,
    snapshotId: input.localSnapshot.snapshotId,
    createdAt: input.createdAt ?? input.localSnapshot.capturedAt,
    planStatus: plan.status,
    plan,
    previewResult,
    applyResult,
    beforeDigest,
    afterDigest,
    counts: createCounts({ preview, applyResult }),
    safety,
    serverStateBefore,
    serverStateAfter
  };
}
