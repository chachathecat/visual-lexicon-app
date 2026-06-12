import { resolveAccountSyncConflicts } from "@/lib/account-persistence/sync-conflicts/conflict-resolver";
import type {
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import {
  SYNC_CONFLICT_FIXTURE_NOW,
  createSyncConflictServerState,
  createSyncConflictSnapshot,
  makeConflictPackProgress,
  makeConflictReviewEvent,
  makeConflictReviewState,
  makeConflictSavedWord,
  makeConflictUpgradeInterest
} from "@/lib/account-persistence/sync-conflicts/fixtures";
import type { VlxGuestDeviceSnapshot } from "@/lib/account-persistence/types";
import type { VlxServerPersistenceResolutionPlanInput } from "@/lib/account-persistence/server-adapter/adapter-contract";

export const SERVER_PERSISTENCE_ADAPTER_FIXTURE_NOW = SYNC_CONFLICT_FIXTURE_NOW;
export const SERVER_PERSISTENCE_ADAPTER_ACCOUNT_ID =
  "server-persistence-adapter-user-1";

export {
  createSyncConflictServerState as createServerPersistenceFixtureServerState,
  createSyncConflictSnapshot as createServerPersistenceFixtureSnapshot,
  makeConflictPackProgress as makeServerPersistenceFixturePackProgress,
  makeConflictReviewEvent as makeServerPersistenceFixtureReviewEvent,
  makeConflictReviewState as makeServerPersistenceFixtureReviewState,
  makeConflictSavedWord as makeServerPersistenceFixtureSavedWord,
  makeConflictUpgradeInterest as makeServerPersistenceFixtureUpgradeInterest
};

export function createServerPersistenceResolutionPlanInput({
  snapshot = createSyncConflictSnapshot(),
  serverState = createSyncConflictServerState(),
  accountId = SERVER_PERSISTENCE_ADAPTER_ACCOUNT_ID
}: {
  snapshot?: VlxGuestDeviceSnapshot;
  serverState?: VlxAccountSyncServerState;
  accountId?: string;
} = {}): VlxServerPersistenceResolutionPlanInput {
  return {
    plan: resolveAccountSyncConflicts({
      accountId,
      localSnapshot: snapshot,
      serverState
    }),
    localSnapshot: snapshot
  };
}
