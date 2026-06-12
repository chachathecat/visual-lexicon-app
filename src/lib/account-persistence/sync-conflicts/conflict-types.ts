import type { VlxPackProgress } from "@/lib/packs/progress";
import type {
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";
import type {
  VlxAccountId,
  VlxGuestDeviceSnapshot,
  VlxGuestSnapshotItemCounts
} from "@/lib/account-persistence/types";

export type VlxAccountSyncConflictCategory =
  | "local_only_saved_word"
  | "server_only_saved_word"
  | "duplicate_saved_word"
  | "local_review_event_not_on_server"
  | "duplicate_review_event"
  | "idempotency_key_payload_conflict"
  | "local_stronger_than_server"
  | "server_stronger_than_local"
  | "local_weaker_than_server"
  | "server_weaker_than_local"
  | "fake_mastery_risk"
  | "stale_review_state"
  | "pack_progress_without_event_evidence"
  | "upgrade_interest_attribution_only"
  | "unsupported_payload";

export type VlxAccountSyncResolutionAction =
  | "import_to_server"
  | "keep_server"
  | "merge_event_evidence"
  | "recompute_from_events"
  | "skip_audit_only"
  | "reject_blocked"
  | "attribution_only"
  | "no_op_duplicate";

export type VlxAccountSyncResolutionTarget =
  | "saved_word"
  | "review_event"
  | "review_state"
  | "pack_progress"
  | "upgrade_interest"
  | "payload";

export type VlxAccountSyncResolutionSeverity =
  | "info"
  | "warning"
  | "blocked";

export type VlxAccountSyncReviewEventEvidence = VlxReviewEvent & {
  idempotencyKey?: string;
  payloadFingerprint?: string;
  packId?: string;
};

export type VlxAccountSyncSavedWord = VlxSavedWord;

export type VlxAccountSyncReviewState = VlxReviewStateItem;

export type VlxAccountSyncPackProgress = VlxPackProgress & {
  derivedFromEventIds?: readonly string[];
  idempotencyKeys?: readonly string[];
};

export type VlxAccountSyncServerState = {
  accountId?: VlxAccountId | string;
  capturedAt?: string;
  syncCursor?: string;
  savedWords?: Record<string, VlxAccountSyncSavedWord>;
  reviewState?: Record<string, VlxAccountSyncReviewState>;
  reviewEvents?: readonly VlxAccountSyncReviewEventEvidence[];
  packProgress?: Record<string, VlxAccountSyncPackProgress>;
  upgradeInterest?: readonly VlxUpgradeInterestRecord[];
  entitlement?: {
    paid: false;
    source: string;
  };
};

export type VlxAccountSyncConflictResolverInput = {
  accountId: VlxAccountId | string;
  planId?: string;
  createdAt?: string;
  localSnapshot: VlxGuestDeviceSnapshot;
  serverState?: VlxAccountSyncServerState;
};

export type VlxAccountSyncResolution = {
  resolutionId: string;
  category: VlxAccountSyncConflictCategory;
  action: VlxAccountSyncResolutionAction;
  target: VlxAccountSyncResolutionTarget;
  severity: VlxAccountSyncResolutionSeverity;
  reason: string;
  slug?: string;
  eventId?: string;
  idempotencyKey?: string;
  packId?: string;
  interestId?: string;
  payloadType?:
    | "saved_word"
    | "review_event"
    | "review_state"
    | "pack_progress"
    | "upgrade_interest"
    | "billing_placeholder";
  localEvidenceCount?: number;
  serverEvidenceCount?: number;
  eventIds?: readonly string[];
  proposedReviewState?: VlxReviewStateItem;
  preservesReviewState: boolean;
  preservesWeakEvidence: boolean;
  importsLocalMasteryLabel: false;
  grantsPaidEntitlement: false;
  mutatesRuntimeStorage: false;
  callsNetwork: false;
};

export type VlxAccountSyncResolutionSummary = Record<
  VlxAccountSyncResolutionAction,
  number
>;

export type VlxAccountSyncConflictResolutionPlan = {
  planId: string;
  accountId: VlxAccountId | string;
  snapshotId: string;
  createdAt: string;
  status: "preview_only" | "blocked";
  counts: VlxGuestSnapshotItemCounts;
  resolutions: readonly VlxAccountSyncResolution[];
  conflictCount: number;
  blockedCount: number;
  summary: VlxAccountSyncResolutionSummary;
  sourceOfTruth:
    | "review_events_first"
    | "server_preserved_when_local_evidence_missing";
  mutatesRuntimeStorage: false;
  callsNetwork: false;
  readsLocalStorage: false;
  readsProcessEnv: false;
  importsAuthProviderSdk: false;
  importsDatabaseSdk: false;
  importsPaymentSdk: false;
  grantsPaidEntitlement: false;
  paidEntitlementPolicy: "never_grant_from_conflict_resolution";
};
