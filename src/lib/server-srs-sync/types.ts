import type { VlxPackProgress } from "@/lib/packs/progress";
import type {
  VlxDailyStatsItem,
  VlxDailyStatsStore,
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWord,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";

export const VLX_SERVER_SRS_SYNC_CONTRACT_VERSION = 1 as const;

export const VLX_SERVER_SRS_SYNC_LOCAL_CACHE_KEYS = {
  savedWords: VLX_STORAGE_KEYS.savedWords,
  reviewState: VLX_STORAGE_KEYS.reviewState,
  reviewEvents: VLX_STORAGE_KEYS.reviewEvents,
  dailyStats: VLX_STORAGE_KEYS.dailyStats,
  packProgress: "vlx_pack_progress_v1"
} as const;

export type VlxServerSrsSyncLocalCacheKey =
  (typeof VLX_SERVER_SRS_SYNC_LOCAL_CACHE_KEYS)[keyof typeof VLX_SERVER_SRS_SYNC_LOCAL_CACHE_KEYS];

export type VlxServerSrsSyncOperation =
  | "save_word"
  | "archive_word"
  | "submit_review_event"
  | "sync_pending_local_queue"
  | "hydrate_account_state"
  | "fetch_due_queue"
  | "fetch_weak_queue"
  | "fetch_mastered_words"
  | "fetch_pack_progress"
  | "upsert_pack_progress";

export type VlxServerSrsSyncSource =
  | "app"
  | "word_page"
  | "hub_page"
  | "extension"
  | "alias_search"
  | "exam_pack"
  | "local_storage_migration"
  | "offline_queue"
  | "support_repair";

export type VlxServerSrsSyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "retryable_error"
  | "rejected"
  | "conflict_resolved";

export type VlxServerSrsMaterializationSource =
  | "review_events"
  | "local_storage_migration"
  | "support_repair";

export type VlxServerSrsSyncErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "validation_error"
  | "idempotency_conflict"
  | "stale_client"
  | "conflict_requires_hydration"
  | "rate_limited"
  | "server_unavailable"
  | "unknown";

export type VlxServerSrsFieldErrors = Record<string, string[]>;

export type VlxServerSrsSyncError = {
  code: VlxServerSrsSyncErrorCode;
  message: string;
  retryable: boolean;
  status?: number;
  fieldErrors?: VlxServerSrsFieldErrors;
  retryAfterMs?: number;
  serverNow?: string;
};

export type VlxServerSrsSyncResponse<TData> =
  | {
      ok: true;
      data: TData;
      serverTime: string;
      syncCursor?: string;
      idempotencyKey?: string;
      duplicateOf?: string;
    }
  | {
      ok: false;
      error: VlxServerSrsSyncError;
      serverTime: string;
      idempotencyKey?: string;
    };

export type VlxServerSrsSyncEnvelope<
  TPayload,
  TOperation extends VlxServerSrsSyncOperation = VlxServerSrsSyncOperation
> = {
  clientMutationId: string;
  idempotencyKey: string;
  deviceId: string;
  userId?: string;
  operation: TOperation;
  localStorageKey?: VlxServerSrsSyncLocalCacheKey;
  payloadVersion: typeof VLX_SERVER_SRS_SYNC_CONTRACT_VERSION;
  clientCreatedAt: string;
  payload: TPayload;
};

export type VlxServerSavedWordSourceHistoryItem = {
  source: VlxServerSrsSyncSource;
  savedAt: string;
  clientMutationId?: string;
  deviceId?: string;
};

export type VlxServerSavedWord = VlxSavedWord & {
  userId: string;
  active: boolean;
  archivedAt?: string;
  lastSavedAt: string;
  sourceHistory?: VlxServerSavedWordSourceHistoryItem[];
  serverCreatedAt: string;
  serverUpdatedAt: string;
  version: number;
};

export type VlxServerSavedWordsStore = Record<string, VlxServerSavedWord>;

export type VlxServerReviewEvent = VlxReviewEvent & {
  userId: string;
  idempotencyKey: string;
  receivedAt: string;
  serverSequence: number;
  packId?: string;
  migrationBatchId?: string;
};

export type VlxServerReviewEventsStore = VlxServerReviewEvent[];

export type VlxServerReviewStateItem = VlxReviewStateItem & {
  userId: string;
  materializedFrom: VlxServerSrsMaterializationSource;
  lastEventId?: string;
  serverUpdatedAt: string;
  version: number;
  migrationBatchId?: string;
  conflictResolvedAt?: string;
};

export type VlxServerReviewStateStore = Record<
  string,
  VlxServerReviewStateItem
>;

export type VlxServerDailyStatsItem = VlxDailyStatsItem & {
  userId: string;
  timezone?: string;
  derivedFromEventIds?: string[];
  serverUpdatedAt: string;
};

export type VlxServerDailyStatsStore = Record<string, VlxServerDailyStatsItem>;

export type VlxServerPackProgress = VlxPackProgress & {
  userId: string;
  packVersion?: string;
  derivedFromEventIds?: string[];
  idempotencyKeys?: string[];
  serverUpdatedAt: string;
  version: number;
};

export type VlxServerPackProgressStore = Record<string, VlxServerPackProgress>;

export type VlxServerHydrationPayload = {
  userId: string;
  hydratedAt: string;
  syncCursor: string;
  savedWords: VlxServerSavedWordsStore;
  reviewState: VlxServerReviewStateStore;
  reviewEvents?: VlxServerReviewEventsStore;
  dailyStats: VlxServerDailyStatsStore;
  packProgress: VlxServerPackProgressStore;
};

export type VlxLocalFallbackSnapshot = {
  capturedAt: string;
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: VlxReviewEvent[];
  dailyStats: VlxDailyStatsStore;
  packProgress: Record<string, VlxPackProgress>;
};

export type VlxPendingLocalQueueItem<
  TPayload = unknown,
  TOperation extends VlxServerSrsSyncOperation = VlxServerSrsSyncOperation
> = VlxServerSrsSyncEnvelope<TPayload, TOperation> & {
  queueId: string;
  status: VlxServerSrsSyncStatus;
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastError?: VlxServerSrsSyncError;
  serverMutationId?: string;
};

export type VlxPendingLocalQueue = {
  schemaVersion: typeof VLX_SERVER_SRS_SYNC_CONTRACT_VERSION;
  deviceId: string;
  userId?: string;
  baseSyncCursor?: string;
  items: VlxPendingLocalQueueItem[];
};

export type VlxServerSyncMutationResult = {
  queueId: string;
  clientMutationId: string;
  idempotencyKey: string;
  operation: VlxServerSrsSyncOperation;
  status: Exclude<VlxServerSrsSyncStatus, "pending" | "syncing">;
  syncCursor?: string;
  serverMutationId?: string;
  duplicateOf?: string;
  error?: VlxServerSrsSyncError;
};

export type VlxServerSrsAccountState = {
  userId: string;
  savedWords: VlxServerSavedWordsStore;
  reviewState: VlxServerReviewStateStore;
  reviewEvents: VlxServerReviewEventsStore;
  dailyStats: VlxServerDailyStatsStore;
  packProgress: VlxServerPackProgressStore;
  syncCursor: string;
  updatedAt: string;
};

export type VlxServerSrsMigrationBatch = {
  migrationBatchId: string;
  userId: string;
  deviceId: string;
  startedAt: string;
  completedAt?: string;
  localSnapshot: VlxLocalFallbackSnapshot;
  results?: VlxServerSyncMutationResult[];
};
