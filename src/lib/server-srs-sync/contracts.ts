import type { VlxReviewAnswerInput, VlxSavedWord } from "@/lib/srs/types";
import type {
  VlxPendingLocalQueueItem,
  VlxServerDailyStatsItem,
  VlxServerHydrationPayload,
  VlxServerPackProgress,
  VlxServerPackProgressStore,
  VlxServerReviewEvent,
  VlxServerReviewStateItem,
  VlxServerSavedWord,
  VlxServerSrsSyncEnvelope,
  VlxServerSrsSyncResponse,
  VlxServerSyncMutationResult
} from "@/lib/server-srs-sync/types";

export type VlxSaveWordRequest = VlxServerSrsSyncEnvelope<
  {
    savedWord: VlxSavedWord;
  },
  "save_word"
>;

export type VlxSaveWordResponse = VlxServerSrsSyncResponse<{
  savedWord: VlxServerSavedWord;
  reviewState: VlxServerReviewStateItem;
  created: boolean;
  reactivated: boolean;
  duplicate: boolean;
}>;

export type VlxArchiveWordRequest = VlxServerSrsSyncEnvelope<
  {
    slug: string;
    archivedAt: string;
    reason?: "user_unsave" | "account_merge_conflict" | "support_repair";
  },
  "archive_word"
>;

export type VlxArchiveWordResponse = VlxServerSrsSyncResponse<{
  savedWord: VlxServerSavedWord;
  archived: true;
  reviewStatePreserved: true;
}>;

export type VlxSubmitReviewEventRequest = VlxServerSrsSyncEnvelope<
  {
    event: VlxReviewAnswerInput & {
      eventId: string;
      sessionId: string;
      boxBefore?: number;
      boxAfter?: number;
      weakScoreBefore?: number;
      weakScoreAfter?: number;
      packId?: string;
    };
  },
  "submit_review_event"
>;

export type VlxSubmitReviewEventResponse = VlxServerSrsSyncResponse<{
  event: VlxServerReviewEvent;
  reviewState: VlxServerReviewStateItem;
  dailyStats: VlxServerDailyStatsItem;
  packProgress?: VlxServerPackProgress;
  duplicate: boolean;
}>;

export type VlxSyncPendingLocalQueueRequest = VlxServerSrsSyncEnvelope<
  {
    batchId: string;
    baseSyncCursor?: string;
    items: VlxPendingLocalQueueItem[];
  },
  "sync_pending_local_queue"
>;

export type VlxSyncPendingLocalQueueResponse = VlxServerSrsSyncResponse<{
  batchId: string;
  accepted: VlxServerSyncMutationResult[];
  rejected: VlxServerSyncMutationResult[];
  retryable: VlxServerSyncMutationResult[];
  hydrationRequired: boolean;
  syncCursor: string;
}>;

export type VlxHydrateAccountStateRequest = {
  userId: string;
  deviceId?: string;
  sinceCursor?: string;
  includeArchived?: boolean;
  includeEventsSince?: string;
};

export type VlxHydrateAccountStateResponse =
  VlxServerSrsSyncResponse<VlxServerHydrationPayload>;

export type VlxFetchDueQueueRequest = {
  userId: string;
  dueBy?: string;
  limit?: number;
  includeArchived?: false;
};

export type VlxFetchDueQueueResponse = VlxServerSrsSyncResponse<{
  dueBy: string;
  items: VlxServerReviewStateItem[];
}>;

export type VlxFetchWeakQueueRequest = {
  userId: string;
  limit?: number;
  includeArchived?: false;
};

export type VlxFetchWeakQueueResponse = VlxServerSrsSyncResponse<{
  items: VlxServerReviewStateItem[];
}>;

export type VlxFetchMasteredWordsRequest = {
  userId: string;
  limit?: number;
  cursor?: string;
};

export type VlxFetchMasteredWordsResponse = VlxServerSrsSyncResponse<{
  items: VlxServerReviewStateItem[];
  nextCursor?: string;
}>;

export type VlxFetchPackProgressRequest = {
  userId: string;
  packId?: string;
  includeArchived?: false;
};

export type VlxFetchPackProgressResponse = VlxServerSrsSyncResponse<{
  items: VlxServerPackProgressStore;
}>;
