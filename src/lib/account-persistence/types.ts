import type { VlxPackProgressStore } from "@/lib/packs/progress";
import type {
  VlxDailyStatsStore,
  VlxReviewEventsStore,
  VlxReviewStateStore,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_PACK_PROGRESS_STORAGE_KEY } from "@/lib/packs/progress";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";
import { VLX_UPGRADE_INTEREST_STORAGE_KEY } from "@/lib/upgrade/upgrade-interest";

declare const vlxAccountIdBrand: unique symbol;

export const VLX_ACCOUNT_PERSISTENCE_CONTRACT_VERSION = 1 as const;

export const VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS = {
  savedWords: VLX_STORAGE_KEYS.savedWords,
  reviewState: VLX_STORAGE_KEYS.reviewState,
  reviewEvents: VLX_STORAGE_KEYS.reviewEvents,
  dailyStats: VLX_STORAGE_KEYS.dailyStats,
  packProgress: VLX_PACK_PROGRESS_STORAGE_KEY,
  upgradeInterest: VLX_UPGRADE_INTEREST_STORAGE_KEY
} as const;

export type VlxAccountLocalStorageKey =
  (typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS)[keyof typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS];

export type VlxAccountProviderKind =
  | "supabase_planned"
  | "existing_backend_audit"
  | "mock_memory"
  | "undecided";

export type VlxAccountId = string & {
  readonly [vlxAccountIdBrand]: "VlxAccountId";
};

export type VlxAccountStorageSource =
  | VlxAccountLocalStorageKey
  | "guest_snapshot"
  | "mock_memory"
  | "planned_account_server"
  | "manual_export";

export type VlxAccountPersistenceStatus =
  | "planning_contract_only"
  | "guest_local_only"
  | "mock_memory_only"
  | "provider_not_connected"
  | "server_persistence_not_implemented";

export type VlxAccountStateDigest = {
  savedWordSlugs?: readonly string[];
  reviewStateSlugs?: readonly string[];
  reviewEventIds?: readonly string[];
  dailyStatDates?: readonly string[];
  packIds?: readonly string[];
  upgradeInterestIds?: readonly string[];
  syncCursor?: string;
  capturedAt?: string;
};

export type VlxAccountProfile = {
  accountId: VlxAccountId;
  providerKind: VlxAccountProviderKind;
  providerSubjectId?: string;
  email?: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  persistenceStatus: VlxAccountPersistenceStatus;
  storageSource: VlxAccountStorageSource;
  accountStateDigest?: VlxAccountStateDigest;
};

export type VlxAccountSessionSnapshot = {
  sessionId: string;
  account: VlxAccountProfile;
  providerKind: VlxAccountProviderKind;
  capturedAt: string;
  authenticatedAt?: string;
  expiresAt?: string;
  persistenceStatus: VlxAccountPersistenceStatus;
  storageSource: VlxAccountStorageSource;
  hasAccessToken: false;
};

export type VlxUpgradeInterestStore = VlxUpgradeInterestRecord[];

export type VlxGuestSnapshotStores = {
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEventsStore;
  dailyStats: VlxDailyStatsStore;
  packProgress: VlxPackProgressStore;
  upgradeInterest: VlxUpgradeInterestStore;
};

export type VlxGuestDeviceSnapshot = {
  schemaVersion: typeof VLX_ACCOUNT_PERSISTENCE_CONTRACT_VERSION;
  snapshotId: string;
  deviceId?: string;
  capturedAt: string;
  source: Extract<VlxAccountStorageSource, "guest_snapshot" | "mock_memory">;
  storageKeys: typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS;
  stores: VlxGuestSnapshotStores;
};

export type VlxGuestSnapshotItemCounts = {
  savedWords: number;
  reviewState: number;
  reviewEvents: number;
  dailyStats: number;
  packProgress: number;
  upgradeInterest: number;
  totalLearningItems: number;
  totalItems: number;
};

export type VlxGuestSnapshotSummary = VlxGuestSnapshotItemCounts & {
  snapshotId: string;
  capturedAt: string;
  hasLearningState: boolean;
  hasUpgradeInterestOnly: boolean;
  source: VlxGuestDeviceSnapshot["source"];
};

export type VlxAccountMergeStatus =
  | "preview_only"
  | "ready_for_review"
  | "applied_to_mock_memory"
  | "blocked"
  | "rejected";

export type VlxAccountMergeBatch<TOperation = unknown> = {
  batchId: string;
  status: VlxAccountMergeStatus;
  accountId: VlxAccountId;
  accountProfile: VlxAccountProfile;
  snapshotId: string;
  createdAt: string;
  operations: readonly TOperation[];
  conflictCount: number;
  appliedAt?: string;
};

export type VlxAccountExportRequest = {
  requestId: string;
  accountId: VlxAccountId;
  requestedAt: string;
  includeSources: readonly VlxAccountStorageSource[];
  includeReviewEvents: boolean;
  includeUpgradeInterest: boolean;
  status: "requested" | "ready" | "failed";
};

export type VlxAccountDeleteRequest = {
  requestId: string;
  accountId: VlxAccountId;
  requestedAt: string;
  reason?: "user_request" | "support_request" | "test_cleanup";
  deleteLocalSnapshot: boolean;
  status: "requested" | "verified" | "completed" | "failed";
};

export type VlxAccountPersistenceErrorCode =
  | "not_implemented"
  | "provider_not_connected"
  | "validation_error"
  | "merge_conflict"
  | "mock_only"
  | "unknown";

export type VlxAccountPersistenceError = {
  code: VlxAccountPersistenceErrorCode;
  message: string;
  retryable: boolean;
  storageSource?: VlxAccountStorageSource;
  fieldErrors?: Record<string, string[]>;
};

export type VlxAccountPersistenceResult<TData> =
  | {
      ok: true;
      data: TData;
      status: VlxAccountPersistenceStatus;
      storageSource: VlxAccountStorageSource;
    }
  | {
      ok: false;
      error: VlxAccountPersistenceError;
      status: VlxAccountPersistenceStatus;
      storageSource: VlxAccountStorageSource;
    };
