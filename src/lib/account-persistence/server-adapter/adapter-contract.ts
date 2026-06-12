import type {
  VlxAccountId,
  VlxAccountStateDigest,
  VlxGuestDeviceSnapshot
} from "@/lib/account-persistence/types";
import type {
  VlxAccountSyncConflictCategory,
  VlxAccountSyncConflictResolutionPlan,
  VlxAccountSyncPackProgress,
  VlxAccountSyncResolution,
  VlxAccountSyncResolutionAction,
  VlxAccountSyncResolutionTarget,
  VlxAccountSyncReviewEventEvidence,
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type { VlxDailyStatsItem, VlxReviewStateItem, VlxSavedWord } from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

export const VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED = false as const;

export type VlxServerPersistenceAdapterStatus =
  | "disabled_mock_only"
  | "contract_only";

export type VlxServerPersistenceMutationKind =
  | "load_account_state"
  | "preview_resolution_plan"
  | "apply_resolution_plan"
  | "record_saved_word"
  | "record_review_event"
  | "record_upgrade_interest_attribution"
  | "record_sync_audit"
  | "get_account_state_digest";

export type VlxServerPersistenceOperationStatus =
  | "accepted"
  | "duplicate_noop"
  | "audit_only"
  | "blocked"
  | "rejected";

export type VlxServerPersistenceReasonCode =
  | "accepted"
  | "duplicate_saved_word"
  | "duplicate_review_event"
  | "audit_only"
  | "blocked_plan"
  | "idempotency_key_required"
  | "idempotency_payload_conflict"
  | "missing_payload_evidence"
  | "unsupported_resolution"
  | "invalid_payload";

export type VlxServerPersistenceReason = {
  code: VlxServerPersistenceReasonCode;
  message: string;
  metadata?: Record<string, string | number | boolean | null | readonly string[]>;
};

export type VlxServerPersistenceError = VlxServerPersistenceReason & {
  retryable: false;
};

type VlxServerPersistenceResultBase = {
  adapterStatus: VlxServerPersistenceAdapterStatus;
  mutationKind: VlxServerPersistenceMutationKind;
  status: VlxServerPersistenceOperationStatus;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  readsLocalStorage: false;
  readsProcessEnv: false;
  importsAuthProviderSdk: false;
  importsDatabaseSdk: false;
  importsPaymentSdk: false;
  grantsPaidEntitlement: false;
};

export type VlxServerPersistenceResult<TData> =
  | (VlxServerPersistenceResultBase & {
      ok: true;
      data: TData;
      reason: VlxServerPersistenceReason;
      idempotencyKey?: string;
      duplicateOf?: string;
    })
  | (VlxServerPersistenceResultBase & {
      ok: false;
      error: VlxServerPersistenceError;
      idempotencyKey?: string;
    });

export type VlxServerPersistenceEntitlement = {
  paid: false;
  source: "not_in_server_persistence_adapter";
};

export type VlxServerPersistenceDailyStatsItem = VlxDailyStatsItem & {
  derivedFromEventIds: string[];
  serverUpdatedAt: string;
};

export type VlxServerPersistencePackProgress = VlxAccountSyncPackProgress & {
  derivedFromEventIds: string[];
  idempotencyKeys: string[];
  serverUpdatedAt: string;
  version: number;
};

export type VlxServerPersistenceProcessedIdempotencyKey = {
  idempotencyKey: string;
  accountId: VlxAccountId | string;
  mutationKind: VlxServerPersistenceMutationKind;
  payloadFingerprint: string;
  processedAt: string;
  reason: VlxServerPersistenceReason;
};

export type VlxServerPersistenceAuditRecord = {
  auditId: string;
  accountId: VlxAccountId | string;
  createdAt: string;
  source:
    | "conflict_resolution_plan"
    | "adapter_operation"
    | "manual_contract_test";
  planId?: string;
  resolutionId?: string;
  category?: VlxAccountSyncConflictCategory;
  action?: VlxAccountSyncResolutionAction;
  target?: VlxAccountSyncResolutionTarget;
  status: Exclude<VlxServerPersistenceOperationStatus, "accepted">;
  reason: VlxServerPersistenceReason;
  grantsPaidEntitlement: false;
  callsNetwork: false;
};

export type VlxServerPersistenceAccountState = {
  accountId: VlxAccountId | string;
  capturedAt: string;
  syncCursor: string;
  savedWords: Record<string, VlxSavedWord>;
  reviewState: Record<string, VlxReviewStateItem>;
  reviewEvents: VlxAccountSyncReviewEventEvidence[];
  dailyStats: Record<string, VlxServerPersistenceDailyStatsItem>;
  packProgress: Record<string, VlxServerPersistencePackProgress>;
  upgradeInterest: VlxUpgradeInterestRecord[];
  auditRecords: VlxServerPersistenceAuditRecord[];
  processedIdempotencyKeys: Record<string, VlxServerPersistenceProcessedIdempotencyKey>;
  syncVersion: number;
  entitlement: VlxServerPersistenceEntitlement;
};

export type VlxServerPersistenceResolutionPlanInput = {
  plan: VlxAccountSyncConflictResolutionPlan;
  localSnapshot: VlxGuestDeviceSnapshot;
  acceptedResolutionIds?: readonly string[];
};

export type VlxServerPersistenceResolutionPreview = {
  planId: string;
  accountId: VlxAccountId | string;
  canApply: boolean;
  blockedReasons: readonly VlxServerPersistenceReason[];
  acceptedResolutionIds: readonly string[];
  auditOnlyResolutionIds: readonly string[];
  noOpResolutionIds: readonly string[];
  rejectedResolutionIds: readonly string[];
  plannedMutations: readonly {
    resolutionId: string;
    category: VlxAccountSyncConflictCategory;
    action: VlxAccountSyncResolutionAction;
    target: VlxAccountSyncResolutionTarget;
    status: VlxServerPersistenceOperationStatus;
    reason: VlxServerPersistenceReason;
  }[];
  mutatesOnPreview: false;
};

export type VlxServerPersistenceMutationRecord = {
  resolutionId?: string;
  category?: VlxAccountSyncConflictCategory;
  action?: VlxAccountSyncResolutionAction;
  target?: VlxAccountSyncResolutionTarget;
  status: VlxServerPersistenceOperationStatus;
  reason: VlxServerPersistenceReason;
  idempotencyKey?: string;
  duplicateOf?: string;
};

export type VlxServerPersistencePlanApplication = {
  planId: string;
  accountId: VlxAccountId | string;
  appliedAt: string;
  accepted: readonly VlxServerPersistenceMutationRecord[];
  skipped: readonly VlxServerPersistenceMutationRecord[];
  rejected: readonly VlxServerPersistenceMutationRecord[];
  auditRecords: readonly VlxServerPersistenceAuditRecord[];
  digest: VlxAccountStateDigest;
};

export type VlxServerPersistenceSavedWordWrite = {
  savedWord: VlxSavedWord;
  reviewState: VlxReviewStateItem;
  duplicate: boolean;
};

export type VlxServerPersistenceReviewEventWrite = {
  event: VlxAccountSyncReviewEventEvidence;
  reviewState: VlxReviewStateItem;
  dailyStats: VlxServerPersistenceDailyStatsItem;
  packProgress?: VlxServerPersistencePackProgress;
  duplicate: boolean;
};

export type VlxServerPersistenceUpgradeInterestWrite = {
  upgradeInterest: VlxUpgradeInterestRecord;
  duplicate: boolean;
  entitlement: VlxServerPersistenceEntitlement;
};

export type VlxServerPersistenceAdapter = {
  readonly enabled: typeof VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED;
  readonly adapterStatus: VlxServerPersistenceAdapterStatus;
  loadAccountSyncServerState(
    accountId: VlxAccountId | string
  ): VlxServerPersistenceResult<VlxAccountSyncServerState>;
  previewApplyAccountSyncResolutionPlan(
    plan: VlxServerPersistenceResolutionPlanInput
  ): VlxServerPersistenceResult<VlxServerPersistenceResolutionPreview>;
  applyAccountSyncResolutionPlan(
    plan: VlxServerPersistenceResolutionPlanInput
  ): VlxServerPersistenceResult<VlxServerPersistencePlanApplication>;
  recordSavedWord(
    accountId: VlxAccountId | string,
    savedWord: VlxSavedWord,
    idempotencyKey: string
  ): VlxServerPersistenceResult<VlxServerPersistenceSavedWordWrite>;
  recordReviewEvent(
    accountId: VlxAccountId | string,
    reviewEvent: VlxAccountSyncReviewEventEvidence,
    idempotencyKey: string
  ): VlxServerPersistenceResult<VlxServerPersistenceReviewEventWrite>;
  recordUpgradeInterestAttribution(
    accountId: VlxAccountId | string,
    upgradeInterest: VlxUpgradeInterestRecord
  ): VlxServerPersistenceResult<VlxServerPersistenceUpgradeInterestWrite>;
  recordSyncAudit(
    accountId: VlxAccountId | string,
    auditRecord: Omit<VlxServerPersistenceAuditRecord, "accountId">
  ): VlxServerPersistenceResult<VlxServerPersistenceAuditRecord>;
  getAccountStateDigest(
    accountId: VlxAccountId | string
  ): VlxServerPersistenceResult<VlxAccountStateDigest>;
};

export function assertServerPersistenceAdapterDisabledByDefault(
  enabled: boolean = VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED
): asserts enabled is false {
  if (enabled !== false) {
    throw new Error("Server persistence adapter must remain disabled by default.");
  }
}
