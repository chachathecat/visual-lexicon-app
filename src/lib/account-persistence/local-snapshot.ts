import type {
  VlxAccountLocalStorageKey,
  VlxGuestDeviceSnapshot,
  VlxGuestSnapshotItemCounts,
  VlxGuestSnapshotStores,
  VlxGuestSnapshotSummary
} from "@/lib/account-persistence/types";
import {
  VLX_ACCOUNT_PERSISTENCE_CONTRACT_VERSION,
  VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS
} from "@/lib/account-persistence/types";

export type VlxCreateGuestSnapshotInput = Partial<VlxGuestSnapshotStores> & {
  capturedAt: string;
  snapshotId?: string;
  deviceId?: string;
  source?: VlxGuestDeviceSnapshot["source"];
};

function countRecordItems(record: Record<string, unknown>) {
  return Object.keys(record).length;
}

function cloneRecord<TItem>(record?: Record<string, TItem>): Record<string, TItem> {
  return record ? { ...record } : {};
}

export function createGuestSnapshotFromStores(
  input: VlxCreateGuestSnapshotInput
): VlxGuestDeviceSnapshot {
  const snapshotId =
    input.snapshotId ?? `guest-snapshot-${input.capturedAt.replace(/[^0-9]/g, "")}`;

  return {
    schemaVersion: VLX_ACCOUNT_PERSISTENCE_CONTRACT_VERSION,
    snapshotId,
    deviceId: input.deviceId,
    capturedAt: input.capturedAt,
    source: input.source ?? "guest_snapshot",
    storageKeys: VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS,
    stores: {
      savedWords: cloneRecord(input.savedWords),
      reviewState: cloneRecord(input.reviewState),
      reviewEvents: input.reviewEvents ? [...input.reviewEvents] : [],
      dailyStats: cloneRecord(input.dailyStats),
      packProgress: cloneRecord(input.packProgress),
      upgradeInterest: input.upgradeInterest ? [...input.upgradeInterest] : []
    }
  };
}

export function countSnapshotItems(
  snapshot: VlxGuestDeviceSnapshot
): VlxGuestSnapshotItemCounts {
  const savedWords = countRecordItems(snapshot.stores.savedWords);
  const reviewState = countRecordItems(snapshot.stores.reviewState);
  const reviewEvents = snapshot.stores.reviewEvents.length;
  const dailyStats = countRecordItems(snapshot.stores.dailyStats);
  const packProgress = countRecordItems(snapshot.stores.packProgress);
  const upgradeInterest = snapshot.stores.upgradeInterest.length;
  const totalLearningItems =
    savedWords + reviewState + reviewEvents + dailyStats + packProgress;

  return {
    savedWords,
    reviewState,
    reviewEvents,
    dailyStats,
    packProgress,
    upgradeInterest,
    totalLearningItems,
    totalItems: totalLearningItems + upgradeInterest
  };
}

export function hasGuestLearningState(snapshot: VlxGuestDeviceSnapshot) {
  return countSnapshotItems(snapshot).totalLearningItems > 0;
}

export function summarizeGuestSnapshot(
  snapshot: VlxGuestDeviceSnapshot
): VlxGuestSnapshotSummary {
  const counts = countSnapshotItems(snapshot);
  const hasLearningState = counts.totalLearningItems > 0;

  return {
    ...counts,
    snapshotId: snapshot.snapshotId,
    capturedAt: snapshot.capturedAt,
    hasLearningState,
    hasUpgradeInterestOnly: !hasLearningState && counts.upgradeInterest > 0,
    source: snapshot.source
  };
}

export function getAccountPersistenceLocalStorageKeys(): readonly VlxAccountLocalStorageKey[] {
  return Object.values(VLX_ACCOUNT_PERSISTENCE_LOCAL_STORAGE_KEYS);
}
