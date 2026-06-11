import type { VlxPackProgress } from "@/lib/packs/progress";
import type {
  VlxDailyStatsItem,
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";
import { countSnapshotItems } from "@/lib/account-persistence/local-snapshot";
import type {
  VlxAccountId,
  VlxAccountLocalStorageKey,
  VlxAccountMergeBatch,
  VlxAccountProfile,
  VlxGuestDeviceSnapshot,
  VlxGuestSnapshotItemCounts
} from "@/lib/account-persistence/types";
import { VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS } from "@/lib/account-persistence/types";

export type VlxAccountMergeOperationKind =
  | "import_saved_word"
  | "resolve_duplicate_saved_word"
  | "import_review_event"
  | "skip_duplicate_review_event"
  | "import_review_state"
  | "resolve_review_state_conflict"
  | "import_daily_stats"
  | "import_pack_progress"
  | "resolve_pack_progress_conflict"
  | "attribute_upgrade_interest";

export type VlxAccountMergeConflictCategory =
  | "duplicate_saved_word"
  | "review_state_conflict"
  | "review_event_import_conflict"
  | "pack_progress_conflict"
  | "upgrade_interest_attribution_conflict";

type VlxAccountMergeOperationBase<
  TKind extends VlxAccountMergeOperationKind,
  TStorageKey extends VlxAccountLocalStorageKey
> = {
  operationId: string;
  kind: TKind;
  accountId: VlxAccountId;
  storageKey: TStorageKey;
  previewOnly: true;
  synthesizesMastery: false;
  grantsPaidEntitlement: false;
};

export type VlxImportSavedWordOperation = VlxAccountMergeOperationBase<
  "import_saved_word" | "resolve_duplicate_saved_word",
  "vlx_saved_words_v1"
> & {
  slug: string;
  savedWord: VlxSavedWord;
};

export type VlxReviewEventImportOperation = VlxAccountMergeOperationBase<
  "import_review_event" | "skip_duplicate_review_event",
  "vlx_review_events_v1"
> & {
  eventId: string;
  slug: string;
  event: VlxReviewEvent;
};

export type VlxReviewStateImportOperation = VlxAccountMergeOperationBase<
  "import_review_state" | "resolve_review_state_conflict",
  "vlx_review_state_v1"
> & {
  slug: string;
  reviewState: VlxReviewStateItem;
  materializedAfterReviewEvents: true;
};

export type VlxDailyStatsImportOperation = VlxAccountMergeOperationBase<
  "import_daily_stats",
  "vlx_daily_stats_v1"
> & {
  date: string;
  dailyStats: VlxDailyStatsItem;
};

export type VlxPackProgressImportOperation = VlxAccountMergeOperationBase<
  "import_pack_progress" | "resolve_pack_progress_conflict",
  "vlx_pack_progress_v1"
> & {
  packId: string;
  packProgress: VlxPackProgress;
};

export type VlxUpgradeInterestAttributionOperation =
  VlxAccountMergeOperationBase<
    "attribute_upgrade_interest",
    "vlx_upgrade_interest_v1"
  > & {
    interestId: string;
    upgradeInterest: VlxUpgradeInterestRecord;
    attributionOnly: true;
  };

export type VlxAccountMergeOperation =
  | VlxImportSavedWordOperation
  | VlxReviewEventImportOperation
  | VlxReviewStateImportOperation
  | VlxDailyStatsImportOperation
  | VlxPackProgressImportOperation
  | VlxUpgradeInterestAttributionOperation;

export type VlxDuplicateSaveConflict = {
  category: "duplicate_saved_word";
  slug: string;
  guestSavedWord: VlxSavedWord;
  accountSlug: string;
  resolution: "dedupe_by_slug_preview";
};

export type VlxReviewStateConflict = {
  category: "review_state_conflict";
  slug: string;
  guestReviewState: VlxReviewStateItem;
  accountSlug: string;
  resolution: "requires_server_reducer_or_support_review";
};

export type VlxReviewEventImportConflict = {
  category: "review_event_import_conflict";
  eventId: string;
  slug: string;
  guestReviewEvent: VlxReviewEvent;
  resolution: "skip_duplicate_event_id_preview";
};

export type VlxPackProgressConflict = {
  category: "pack_progress_conflict";
  packId: string;
  guestPackProgress: VlxPackProgress;
  resolution: "requires_server_pack_progress_policy";
};

export type VlxUpgradeInterestAttributionConflict = {
  category: "upgrade_interest_attribution_conflict";
  interestId: string;
  guestUpgradeInterest: VlxUpgradeInterestRecord;
  resolution: "attribute_without_entitlement_preview";
};

export type VlxAccountMergeConflict =
  | VlxDuplicateSaveConflict
  | VlxReviewStateConflict
  | VlxReviewEventImportConflict
  | VlxPackProgressConflict
  | VlxUpgradeInterestAttributionConflict;

export type VlxAccountMergePreviewResult =
  VlxAccountMergeBatch<VlxAccountMergeOperation> & {
    counts: VlxGuestSnapshotItemCounts;
    conflicts: readonly VlxAccountMergeConflict[];
    canApplyToMockAdapter: boolean;
    mutatesRuntimeStorage: false;
    callsNetwork: false;
    implementsAuth: false;
  };

function createOperationBase<
  TKind extends VlxAccountMergeOperationKind,
  TStorageKey extends VlxAccountLocalStorageKey
>(
  kind: TKind,
  storageKey: TStorageKey,
  accountId: VlxAccountId,
  operationKey: string
): VlxAccountMergeOperationBase<TKind, TStorageKey> {
  return {
    operationId: `${kind}:${operationKey}`,
    kind,
    accountId,
    storageKey,
    previewOnly: true,
    synthesizesMastery: false,
    grantsPaidEntitlement: false
  };
}

function toSortedEntries<TItem>(record: Record<string, TItem>) {
  return Object.entries(record).sort(([firstKey], [secondKey]) =>
    firstKey.localeCompare(secondKey)
  );
}

export function createAccountMergePlan(
  snapshot: VlxGuestDeviceSnapshot,
  accountProfile: VlxAccountProfile
): VlxAccountMergePreviewResult {
  const accountId = accountProfile.accountId;
  const digest = accountProfile.accountStateDigest;
  const existingSavedSlugs = new Set(digest?.savedWordSlugs ?? []);
  const existingReviewStateSlugs = new Set(digest?.reviewStateSlugs ?? []);
  const existingReviewEventIds = new Set(digest?.reviewEventIds ?? []);
  const existingPackIds = new Set(digest?.packIds ?? []);
  const existingUpgradeInterestIds = new Set(
    digest?.upgradeInterestIds ?? []
  );
  const operations: VlxAccountMergeOperation[] = [];
  const conflicts: VlxAccountMergeConflict[] = [];

  for (const [slug, savedWord] of toSortedEntries(snapshot.stores.savedWords)) {
    const isDuplicate = existingSavedSlugs.has(slug);

    if (isDuplicate) {
      conflicts.push({
        category: "duplicate_saved_word",
        slug,
        guestSavedWord: savedWord,
        accountSlug: slug,
        resolution: "dedupe_by_slug_preview"
      });
    }

    operations.push({
      ...createOperationBase(
        isDuplicate ? "resolve_duplicate_saved_word" : "import_saved_word",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.savedWords,
        accountId,
        slug
      ),
      slug,
      savedWord
    });
  }

  snapshot.stores.reviewEvents.forEach((event, index) => {
    const isDuplicate = existingReviewEventIds.has(event.eventId);

    if (isDuplicate) {
      conflicts.push({
        category: "review_event_import_conflict",
        eventId: event.eventId,
        slug: event.slug,
        guestReviewEvent: event,
        resolution: "skip_duplicate_event_id_preview"
      });
    }

    operations.push({
      ...createOperationBase(
        isDuplicate ? "skip_duplicate_review_event" : "import_review_event",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewEvents,
        accountId,
        `${index}:${event.eventId}`
      ),
      eventId: event.eventId,
      slug: event.slug,
      event
    });
  });

  for (const [slug, reviewState] of toSortedEntries(
    snapshot.stores.reviewState
  )) {
    const hasAccountReviewState = existingReviewStateSlugs.has(slug);

    if (hasAccountReviewState) {
      conflicts.push({
        category: "review_state_conflict",
        slug,
        guestReviewState: reviewState,
        accountSlug: slug,
        resolution: "requires_server_reducer_or_support_review"
      });
    }

    operations.push({
      ...createOperationBase(
        hasAccountReviewState
          ? "resolve_review_state_conflict"
          : "import_review_state",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewState,
        accountId,
        slug
      ),
      slug,
      reviewState,
      materializedAfterReviewEvents: true
    });
  }

  for (const [date, dailyStats] of toSortedEntries(snapshot.stores.dailyStats)) {
    operations.push({
      ...createOperationBase(
        "import_daily_stats",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.dailyStats,
        accountId,
        date
      ),
      date,
      dailyStats
    });
  }

  for (const [packId, packProgress] of toSortedEntries(
    snapshot.stores.packProgress
  )) {
    const hasAccountPackProgress = existingPackIds.has(packId);

    if (hasAccountPackProgress) {
      conflicts.push({
        category: "pack_progress_conflict",
        packId,
        guestPackProgress: packProgress,
        resolution: "requires_server_pack_progress_policy"
      });
    }

    operations.push({
      ...createOperationBase(
        hasAccountPackProgress
          ? "resolve_pack_progress_conflict"
          : "import_pack_progress",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.packProgress,
        accountId,
        packId
      ),
      packId,
      packProgress
    });
  }

  snapshot.stores.upgradeInterest.forEach((upgradeInterest) => {
    const isDuplicate =
      existingUpgradeInterestIds.has(upgradeInterest.id) ||
      operations.some(
        (operation) =>
          operation.kind === "attribute_upgrade_interest" &&
          operation.interestId === upgradeInterest.id
      );

    if (isDuplicate) {
      conflicts.push({
        category: "upgrade_interest_attribution_conflict",
        interestId: upgradeInterest.id,
        guestUpgradeInterest: upgradeInterest,
        resolution: "attribute_without_entitlement_preview"
      });
    }

    operations.push({
      ...createOperationBase(
        "attribute_upgrade_interest",
        VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.upgradeInterest,
        accountId,
        upgradeInterest.id
      ),
      interestId: upgradeInterest.id,
      upgradeInterest,
      attributionOnly: true
    });
  });

  return {
    batchId: `merge-preview-${snapshot.snapshotId}-${accountId}`,
    status: conflicts.length > 0 ? "ready_for_review" : "preview_only",
    accountId,
    accountProfile,
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.capturedAt,
    operations,
    conflictCount: conflicts.length,
    counts: countSnapshotItems(snapshot),
    conflicts,
    canApplyToMockAdapter: true,
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    implementsAuth: false
  };
}
