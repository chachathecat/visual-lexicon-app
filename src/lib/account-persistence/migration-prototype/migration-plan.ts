import type { VlxSavedWord, VlxReviewEvent, VlxReviewStateItem } from "@/lib/srs/types";
import type { VlxDailyStatsItem } from "@/lib/srs/types";
import type { VlxPackProgress } from "@/lib/packs/progress";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";
import { summarizeGuestSnapshot } from "@/lib/account-persistence/local-snapshot";
import {
  VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS,
  type VlxAccountId,
  type VlxAccountProfile,
  type VlxGuestDeviceSnapshot,
  type VlxGuestSnapshotSummary,
} from "@/lib/account-persistence/types";
import {
  classifyMigrationConflict,
  type VlxGuestMigrationConflict,
} from "@/lib/account-persistence/migration-prototype/conflicts";

type VlxMigrationStoreKey =
  (typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS)[keyof typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS];

export type VlxGuestToAccountMigrationOperationKind =
  | "import_review_event"
  | "import_saved_word"
  | "import_review_state"
  | "import_daily_stats"
  | "import_pack_progress"
  | "import_upgrade_interest";

type VlxGuestToAccountMigrationOperationBase<
  TKind extends VlxGuestToAccountMigrationOperationKind,
  TStorageKey extends VlxMigrationStoreKey
> = {
  operationId: string;
  kind: TKind;
  accountId: VlxAccountId;
  storageKey: TStorageKey;
  previewOnly: true;
  idempotencyKey: string;
};

export type VlxImportReviewEventOperation = VlxGuestToAccountMigrationOperationBase<
  "import_review_event",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewEvents
> & {
  eventId: string;
  slug: string;
  event: VlxReviewEvent;
};

export type VlxImportSavedWordOperation = VlxGuestToAccountMigrationOperationBase<
  "import_saved_word",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.savedWords
> & {
  slug: string;
  savedWord: VlxSavedWord;
};

export type VlxImportReviewStateOperation = VlxGuestToAccountMigrationOperationBase<
  "import_review_state",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewState
> & {
  slug: string;
  reviewState: VlxReviewStateItem;
  hasSupportingReviewEvents: boolean;
  hasSupportingSavedWord: boolean;
  materializedFromGuestSnapshot: true;
};

export type VlxImportDailyStatsOperation = VlxGuestToAccountMigrationOperationBase<
  "import_daily_stats",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.dailyStats
> & {
  date: string;
  dailyStats: VlxDailyStatsItem;
};

export type VlxImportPackProgressOperation = VlxGuestToAccountMigrationOperationBase<
  "import_pack_progress",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.packProgress
> & {
  packId: string;
  packProgress: VlxPackProgress;
};

export type VlxImportUpgradeInterestOperation = VlxGuestToAccountMigrationOperationBase<
  "import_upgrade_interest",
  typeof VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.upgradeInterest
> & {
  interestId: string;
  upgradeInterest: VlxUpgradeInterestRecord;
  attributionOnly: true;
};

export type VlxGuestToAccountMigrationOperation =
  | VlxImportReviewEventOperation
  | VlxImportSavedWordOperation
  | VlxImportReviewStateOperation
  | VlxImportDailyStatsOperation
  | VlxImportPackProgressOperation
  | VlxImportUpgradeInterestOperation;

export type VlxGuestToAccountMigrationPlan = {
  batchId: string;
  accountId: VlxAccountId;
  accountProfile: VlxAccountProfile;
  snapshotId: string;
  createdAt: string;
  status: "preview_only" | "blocked";
  operations: readonly VlxGuestToAccountMigrationOperation[];
  conflictCount: number;
  conflicts: readonly VlxGuestMigrationConflict[];
  counts: VlxGuestSnapshotSummary;
  canApplyInMemory: true;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  implementsAuth: false;
};

function toSortedEntries<TItem>(record: Record<string, TItem>) {
  return Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
}

type VlxGuestMigrationReviewEvent = VlxReviewEvent & {
  createdAt: string;
};

function toSortedEvents(items: VlxGuestMigrationReviewEvent[]) {
  return [...items].sort((left, right) => {
    const byDate = left.createdAt.localeCompare(right.createdAt);
    if (byDate !== 0) {
      return byDate;
    }
    return left.eventId.localeCompare(right.eventId);
  });
}

function hasPlainObjectShape(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function createOperationBase<
  TKind extends VlxGuestToAccountMigrationOperationKind,
  TStorageKey extends VlxMigrationStoreKey
>({
  kind,
  storageKey,
  accountId,
  snapshotId,
  operationKey,
}: {
  kind: TKind;
  storageKey: TStorageKey;
  accountId: VlxAccountId;
  snapshotId: string;
  operationKey: string;
}): VlxGuestToAccountMigrationOperationBase<TKind, TStorageKey> {
  return {
    operationId: `${snapshotId}:${kind}:${operationKey}`,
    kind,
    accountId,
    storageKey,
    previewOnly: true,
    idempotencyKey: `migration:${snapshotId}:${kind}:${operationKey}`,
  };
}

function isValidSavedWord(value: unknown): value is VlxSavedWord {
  return (
    hasPlainObjectShape(value) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    isNonEmptyString(value.savedAt)
  );
}

function isValidReviewEvent(value: unknown): value is VlxReviewEvent {
  return (
    hasPlainObjectShape(value) &&
    isNonEmptyString(value.eventId) &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    isNonEmptyString(value.answer) &&
    isNonEmptyString(value.createdAt) &&
    (value.result === "correct" || value.result === "wrong") &&
    hasNumber(value.responseMs) &&
    value.responseMs >= 0
  );
}

function isValidReviewState(value: unknown): value is VlxReviewStateItem {
  return (
    hasPlainObjectShape(value) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    Number.isInteger(value.box) &&
    Number.isFinite(value.correct) &&
    Number.isFinite(value.wrong) &&
    Number.isFinite(value.streakCorrect) &&
    Number.isFinite(value.weakScore)
  );
}

function addConflict(
  conflicts: VlxGuestMigrationConflict[],
  input:
    | Parameters<typeof classifyMigrationConflict>[0]
) {
  conflicts.push(classifyMigrationConflict(input));
}

function isPlanBlocked(conflicts: readonly VlxGuestMigrationConflict[]) {
  return conflicts.some(
    (conflict) =>
      conflict.category === "unsupported_payload" ||
      conflict.category === "fake_mastery_risk"
  );
}

function isPackProgressWithoutEventEvidence(
  snapshot: VlxGuestDeviceSnapshot
) {
  return snapshot.stores.reviewEvents.length === 0;
}

export function createGuestToAccountMigrationPlan(
  snapshot: VlxGuestDeviceSnapshot,
  accountProfile: VlxAccountProfile
): VlxGuestToAccountMigrationPlan {
  const accountId = accountProfile.accountId;
  const existingSavedSlugs = new Set(
    accountProfile.accountStateDigest?.savedWordSlugs ?? []
  );
  const existingReviewEventIds = new Set(
    accountProfile.accountStateDigest?.reviewEventIds ?? []
  );
  const existingReviewStateSlugs = new Set(
    accountProfile.accountStateDigest?.reviewStateSlugs ?? []
  );
  const existingUpgradeInterestIds = new Set(
    accountProfile.accountStateDigest?.upgradeInterestIds ?? []
  );

  const conflicts: VlxGuestMigrationConflict[] = [];
  const operations: VlxGuestToAccountMigrationOperation[] = [];
  const seenReviewEventIds = new Set<string>();
  const seenReviewEventSlugs = new Set<string>();
  const seenUpgradeInterestIds = new Set<string>();

  toSortedEvents(snapshot.stores.reviewEvents).forEach((event, index) => {
    if (!isValidReviewEvent(event)) {
      addConflict(conflicts, {
        category: "unsupported_payload",
        payloadType: "review_event",
        details: "Invalid review event payload shape.",
        sourceValue: event,
      });
      return;
    }

    if (
      existingReviewEventIds.has(event.eventId) ||
      seenReviewEventIds.has(event.eventId)
    ) {
      addConflict(conflicts, {
        category: "duplicate_review_event",
        eventId: event.eventId,
        slug: event.slug,
        guestReviewEvent: event,
      });
    }

    seenReviewEventIds.add(event.eventId);
    seenReviewEventSlugs.add(event.slug);

    operations.push({
      ...createOperationBase({
        kind: "import_review_event",
        storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewEvents,
        accountId,
        snapshotId: snapshot.snapshotId,
        operationKey: `${index}:${event.eventId}`,
      }),
      eventId: event.eventId,
      slug: event.slug,
      event,
    });
  });

  toSortedEntries(snapshot.stores.savedWords).forEach(([slug, savedWord]) => {
    if (!isValidSavedWord(savedWord)) {
      addConflict(conflicts, {
        category: "unsupported_payload",
        payloadType: "saved_word",
        details: "Invalid saved word payload shape.",
        sourceValue: savedWord,
      });
      return;
    }

    if (existingSavedSlugs.has(slug)) {
      addConflict(conflicts, {
        category: "duplicate_saved_word",
        slug,
        guestSavedWord: savedWord,
      });
    }

    operations.push({
      ...createOperationBase({
        kind: "import_saved_word",
        storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.savedWords,
        accountId,
        snapshotId: snapshot.snapshotId,
        operationKey: slug,
      }),
      slug,
      savedWord,
    });
  });

  toSortedEntries(snapshot.stores.reviewState).forEach(([slug, reviewState]) => {
    if (!isValidReviewState(reviewState)) {
      addConflict(conflicts, {
        category: "unsupported_payload",
        payloadType: "review_state",
        details: "Invalid review state payload shape.",
        sourceValue: reviewState,
      });
      return;
    }

    const hasSupportingReviewEvents = seenReviewEventSlugs.has(slug);
    const hasSupportingSavedWord =
      Boolean(snapshot.stores.savedWords[slug]) ||
      existingSavedSlugs.has(slug);

    if (!hasSupportingReviewEvents && !hasSupportingSavedWord) {
      addConflict(conflicts, {
        category: "stale_review_state",
        slug,
        reviewState,
      });
    }

    if (
      reviewState.mastery === "Mastered" &&
      !hasSupportingReviewEvents &&
      !existingReviewStateSlugs.has(slug)
    ) {
      addConflict(conflicts, {
        category: "fake_mastery_risk",
        slug,
        mastery: reviewState.mastery,
        warningSource: "no_review_events",
        reviewState,
      });
    }

    operations.push({
      ...createOperationBase({
        kind: "import_review_state",
        storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.reviewState,
        accountId,
        snapshotId: snapshot.snapshotId,
        operationKey: slug,
      }),
      slug,
      reviewState,
      hasSupportingReviewEvents,
      hasSupportingSavedWord,
      materializedFromGuestSnapshot: true,
    });
  });

  toSortedEntries(snapshot.stores.dailyStats).forEach(([date, dailyStats]) => {
    if (!hasPlainObjectShape(dailyStats)) {
      addConflict(conflicts, {
        category: "unsupported_payload",
        payloadType: "daily_stats",
        details: "Invalid daily stats payload shape.",
        sourceValue: dailyStats,
      });
      return;
    }

    operations.push({
      ...createOperationBase({
        kind: "import_daily_stats",
        storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.dailyStats,
        accountId,
        snapshotId: snapshot.snapshotId,
        operationKey: date,
      }),
      date,
      dailyStats,
    });
  });

  toSortedEntries(snapshot.stores.packProgress).forEach(
    ([packId, packProgress]) => {
      if (!hasPlainObjectShape(packProgress)) {
        addConflict(conflicts, {
          category: "unsupported_payload",
          payloadType: "pack_progress",
          details: "Invalid pack progress payload shape.",
          sourceValue: packProgress,
        });
        return;
      }

      if (isPackProgressWithoutEventEvidence(snapshot)) {
        addConflict(conflicts, {
          category: "pack_progress_without_events",
          packId,
          packProgress,
        });
      }

      operations.push({
        ...createOperationBase({
          kind: "import_pack_progress",
          storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.packProgress,
          accountId,
          snapshotId: snapshot.snapshotId,
          operationKey: packId,
        }),
        packId,
        packProgress,
      });
    }
  );

  snapshot.stores.upgradeInterest.forEach((upgradeInterest) => {
    if (!hasPlainObjectShape(upgradeInterest)) {
      addConflict(conflicts, {
        category: "unsupported_payload",
        payloadType: "upgrade_interest",
        details: "Invalid upgrade interest payload shape.",
        sourceValue: upgradeInterest,
      });
      return;
    }

    if (
      existingUpgradeInterestIds.has(upgradeInterest.id) ||
      seenUpgradeInterestIds.has(upgradeInterest.id)
    ) {
      addConflict(conflicts, {
        category: "upgrade_interest_only",
        upgradeInterestIds: [upgradeInterest.id],
      });
    }

    seenUpgradeInterestIds.add(upgradeInterest.id);

    operations.push({
      ...createOperationBase({
        kind: "import_upgrade_interest",
        storageKey: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS.upgradeInterest,
        accountId,
        snapshotId: snapshot.snapshotId,
        operationKey: upgradeInterest.id,
      }),
      interestId: upgradeInterest.id,
      upgradeInterest,
      attributionOnly: true,
    });
  });

  const counts = summarizeGuestSnapshot(snapshot);

  if (counts.totalLearningItems === 0 && snapshot.stores.upgradeInterest.length > 0) {
    addConflict(conflicts, {
      category: "upgrade_interest_only",
      upgradeInterestIds: snapshot.stores.upgradeInterest.map((item) => item.id),
    });
  }

  return {
    batchId: `guest-migration-${snapshot.snapshotId}:${accountId}`,
    accountId,
    accountProfile,
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.capturedAt,
    status: isPlanBlocked(conflicts) ? "blocked" : "preview_only",
    operations,
    conflictCount: conflicts.length,
    conflicts,
    counts,
    canApplyInMemory: true,
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    implementsAuth: false,
  };
}

export function summarizeGuestToAccountMigrationPlan(
  plan: VlxGuestToAccountMigrationPlan
) {
  const byKind = new Map<VlxGuestToAccountMigrationOperationKind, number>();

  for (const operation of plan.operations) {
    byKind.set(operation.kind, (byKind.get(operation.kind) ?? 0) + 1);
  }

  return [
    `batch=${plan.batchId}`,
    `status=${plan.status}`,
    `operations=${plan.operations.length}`,
    `conflicts=${plan.conflictCount}`,
    `reviewEvents=${byKind.get("import_review_event") ?? 0}`,
    `savedWords=${byKind.get("import_saved_word") ?? 0}`,
    `reviewStates=${byKind.get("import_review_state") ?? 0}`,
    `dailyStats=${byKind.get("import_daily_stats") ?? 0}`,
    `packProgress=${byKind.get("import_pack_progress") ?? 0}`,
    `upgradeInterest=${byKind.get("import_upgrade_interest") ?? 0}`,
  ].join(", ");
}

export function hasMigrationWork(plan: VlxGuestToAccountMigrationPlan): boolean {
  return plan.operations.length > 0;
}
