import type {
  VlxDailyStatsItem,
  VlxDailyStatsStore,
  VlxReviewStateItem,
  VlxReviewStateStore,
  VlxSavedWordsStore
} from "@/lib/srs/types";
import type { VlxPackProgressStore } from "@/lib/packs/progress";
import type { VlxUpgradeInterestStore } from "@/lib/account-persistence/types";
import type {
  VlxAccountId,
  VlxAccountProfile,
  VlxAccountSessionSnapshot
} from "@/lib/account-persistence/types";
import type {
  VlxAccountMergeOperation,
  VlxAccountMergePreviewResult
} from "@/lib/account-persistence/merge-contracts";

const MOCK_NOW = "2026-06-11T00:00:00.000Z";

export type VlxMockEntitlementState = {
  paid: false;
  source: "not_in_mock_contract";
};

export type VlxMockAccountStore = {
  accountProfile: VlxAccountProfile;
  savedWords: VlxSavedWordsStore;
  reviewState: VlxReviewStateStore;
  reviewEvents: import("@/lib/srs/types").VlxReviewEventsStore;
  dailyStats: VlxDailyStatsStore;
  packProgress: VlxPackProgressStore;
  upgradeInterest: VlxUpgradeInterestStore;
  appliedMergeBatchIds: string[];
  entitlement: VlxMockEntitlementState;
};

export type VlxCreateMockAccountProfileInput = Partial<
  Omit<
    VlxAccountProfile,
    "accountId" | "providerKind" | "persistenceStatus" | "storageSource"
  >
> & {
  accountId?: string;
};

function toMockAccountId(value: string): VlxAccountId {
  return value as VlxAccountId;
}

function cloneRecord<TItem>(record?: Record<string, TItem>): Record<string, TItem> {
  return record ? { ...record } : {};
}

function chooseReviewStateWithMoreEvidence(
  current: VlxReviewStateItem | undefined,
  incoming: VlxReviewStateItem
) {
  if (!current) {
    return incoming;
  }

  const currentEvidence = current.correct + current.wrong;
  const incomingEvidence = incoming.correct + incoming.wrong;

  if (incomingEvidence > currentEvidence) {
    return incoming;
  }

  return current;
}

function mergeDailyStats(
  current: VlxDailyStatsItem | undefined,
  incoming: VlxDailyStatsItem
): VlxDailyStatsItem {
  if (!current) {
    return incoming;
  }

  return {
    ...current,
    reviewed: current.reviewed + incoming.reviewed,
    correct: current.correct + incoming.correct,
    wrong: current.wrong + incoming.wrong,
    mastered: current.mastered + incoming.mastered,
    weakAdded: current.weakAdded + incoming.weakAdded,
    minutes: current.minutes + incoming.minutes,
    sessions: current.sessions + incoming.sessions
  };
}

function applyOperation(
  store: VlxMockAccountStore,
  operation: VlxAccountMergeOperation
) {
  switch (operation.kind) {
    case "import_saved_word":
    case "resolve_duplicate_saved_word":
      store.savedWords[operation.slug] =
        store.savedWords[operation.slug] ?? operation.savedWord;
      break;
    case "import_review_event":
      if (
        !store.reviewEvents.some(
          (event) => event.eventId === operation.eventId
        )
      ) {
        store.reviewEvents.push(operation.event);
      }
      break;
    case "skip_duplicate_review_event":
      break;
    case "import_review_state":
    case "resolve_review_state_conflict":
      store.reviewState[operation.slug] = chooseReviewStateWithMoreEvidence(
        store.reviewState[operation.slug],
        operation.reviewState
      );
      break;
    case "import_daily_stats":
      store.dailyStats[operation.date] = mergeDailyStats(
        store.dailyStats[operation.date],
        operation.dailyStats
      );
      break;
    case "import_pack_progress":
    case "resolve_pack_progress_conflict":
      store.packProgress[operation.packId] =
        store.packProgress[operation.packId] ?? operation.packProgress;
      break;
    case "attribute_upgrade_interest":
      if (
        !store.upgradeInterest.some(
          (record) => record.id === operation.interestId
        )
      ) {
        store.upgradeInterest.push(operation.upgradeInterest);
      }
      break;
    default: {
      const exhaustive: never = operation;
      return exhaustive;
    }
  }
}

function refreshDigest(store: VlxMockAccountStore): VlxAccountProfile {
  return {
    ...store.accountProfile,
    updatedAt: MOCK_NOW,
    accountStateDigest: {
      savedWordSlugs: Object.keys(store.savedWords).sort(),
      reviewStateSlugs: Object.keys(store.reviewState).sort(),
      reviewEventIds: store.reviewEvents.map((event) => event.eventId),
      dailyStatDates: Object.keys(store.dailyStats).sort(),
      packIds: Object.keys(store.packProgress).sort(),
      upgradeInterestIds: store.upgradeInterest.map((record) => record.id),
      capturedAt: MOCK_NOW
    }
  };
}

// Non-production mock only. This is not auth, not account persistence, and not
// connected to any route, provider SDK, database SDK, fetch call, or storage API.
export function createMockAccountProfile(
  input: VlxCreateMockAccountProfileInput = {}
): VlxAccountProfile {
  return {
    accountId: toMockAccountId(input.accountId ?? "mock-account-1"),
    providerKind: "mock_memory",
    providerSubjectId: input.providerSubjectId ?? "mock-subject-1",
    email: input.email,
    displayName: input.displayName ?? "Mock Learner",
    createdAt: input.createdAt ?? MOCK_NOW,
    updatedAt: input.updatedAt ?? MOCK_NOW,
    persistenceStatus: "mock_memory_only",
    storageSource: "mock_memory",
    accountStateDigest: input.accountStateDigest
  };
}

// Non-production mock only. The session deliberately has no token surface.
export function createMockAccountSession(
  account: VlxAccountProfile = createMockAccountProfile(),
  capturedAt = MOCK_NOW
): VlxAccountSessionSnapshot {
  return {
    sessionId: `mock-session-${account.accountId}`,
    account,
    providerKind: "mock_memory",
    capturedAt,
    authenticatedAt: capturedAt,
    persistenceStatus: "mock_memory_only",
    storageSource: "mock_memory",
    hasAccessToken: false
  };
}

// Non-production mock only. This store exists for contract tests and planning.
export function createMockAccountStore(
  input: Partial<
    Omit<VlxMockAccountStore, "appliedMergeBatchIds" | "entitlement">
  > = {}
): VlxMockAccountStore {
  return {
    accountProfile: input.accountProfile ?? createMockAccountProfile(),
    savedWords: cloneRecord(input.savedWords),
    reviewState: cloneRecord(input.reviewState),
    reviewEvents: input.reviewEvents ? [...input.reviewEvents] : [],
    dailyStats: cloneRecord(input.dailyStats),
    packProgress: cloneRecord(input.packProgress),
    upgradeInterest: input.upgradeInterest ? [...input.upgradeInterest] : [],
    appliedMergeBatchIds: [],
    entitlement: {
      paid: false,
      source: "not_in_mock_contract"
    }
  };
}

// Non-production mock only. This applies a preview plan to memory, not to auth,
// browser storage, a database, billing, or production data.
export function applyMockMergePlan(
  store: VlxMockAccountStore,
  plan: VlxAccountMergePreviewResult
): VlxMockAccountStore {
  const nextStore: VlxMockAccountStore = {
    accountProfile: store.accountProfile,
    savedWords: cloneRecord(store.savedWords),
    reviewState: cloneRecord(store.reviewState),
    reviewEvents: [...store.reviewEvents],
    dailyStats: cloneRecord(store.dailyStats),
    packProgress: cloneRecord(store.packProgress),
    upgradeInterest: [...store.upgradeInterest],
    appliedMergeBatchIds: [...store.appliedMergeBatchIds, plan.batchId],
    entitlement: {
      paid: false,
      source: "not_in_mock_contract"
    }
  };

  plan.operations.forEach((operation) => applyOperation(nextStore, operation));
  nextStore.accountProfile = refreshDigest(nextStore);

  return nextStore;
}
