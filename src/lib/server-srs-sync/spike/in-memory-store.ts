import type {
  VlxServerDailyStatsStore,
  VlxServerPackProgressStore,
  VlxServerReviewEventsStore,
  VlxServerReviewStateStore,
  VlxServerSavedWordsStore,
  VlxServerSrsSyncOperation,
  VlxServerSrsSyncResponse
} from "@/lib/server-srs-sync/types";

export type VlxInMemoryProcessedIdempotencyKey = {
  idempotencyKey: string;
  operation: VlxServerSrsSyncOperation;
  userId?: string;
  payloadFingerprint: string;
  processedAt: string;
  response: VlxServerSrsSyncResponse<unknown>;
};

export type VlxInMemoryServerSrsSyncStore = {
  savedWords: VlxServerSavedWordsStore;
  reviewState: VlxServerReviewStateStore;
  reviewEvents: VlxServerReviewEventsStore;
  dailyStats: VlxServerDailyStatsStore;
  packProgress: VlxServerPackProgressStore;
  processedIdempotencyKeys: Record<string, VlxInMemoryProcessedIdempotencyKey>;
  syncVersion: number;
  entitlement: {
    paid: false;
    source: "not_in_server_srs_sync_spike";
  };
};

export function createInMemoryServerSrsSyncStore(
  input: Partial<
    Omit<
      VlxInMemoryServerSrsSyncStore,
      "processedIdempotencyKeys" | "syncVersion" | "entitlement"
    >
  > = {}
): VlxInMemoryServerSrsSyncStore {
  return {
    savedWords: input.savedWords ? { ...input.savedWords } : {},
    reviewState: input.reviewState ? { ...input.reviewState } : {},
    reviewEvents: input.reviewEvents ? [...input.reviewEvents] : [],
    dailyStats: input.dailyStats ? { ...input.dailyStats } : {},
    packProgress: input.packProgress ? { ...input.packProgress } : {},
    processedIdempotencyKeys: {},
    syncVersion: 0,
    entitlement: {
      paid: false,
      source: "not_in_server_srs_sync_spike"
    }
  };
}
