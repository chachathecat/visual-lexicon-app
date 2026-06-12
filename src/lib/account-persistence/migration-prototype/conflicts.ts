import type { VlxPackProgress } from "@/lib/packs/progress";
import type {
  VlxReviewEvent,
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

export type VlxGuestMigrationConflictCategory =
  | "duplicate_saved_word"
  | "duplicate_review_event"
  | "stale_review_state"
  | "fake_mastery_risk"
  | "pack_progress_without_events"
  | "upgrade_interest_only"
  | "unsupported_payload";

type VlxGuestMigrationConflictBase = {
  category: VlxGuestMigrationConflictCategory;
  severity: "warning" | "error";
  reason: string;
};

export type VlxGuestMigrationDuplicateSavedWordConflict = {
  category: "duplicate_saved_word";
  slug: string;
  guestSavedWord: VlxSavedWord;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationDuplicateReviewEventConflict = {
  category: "duplicate_review_event";
  eventId: string;
  slug: string;
  guestReviewEvent: VlxReviewEvent;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationStaleReviewStateConflict = {
  category: "stale_review_state";
  slug: string;
  reviewState: VlxReviewStateItem;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationFakeMasteryRiskConflict = {
  category: "fake_mastery_risk";
  slug: string;
  mastery: VlxReviewStateItem["mastery"];
  warningSource:
    | "no_review_events"
    | "event_history_gap";
  reviewState: VlxReviewStateItem;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationPackProgressWithoutEventsConflict = {
  category: "pack_progress_without_events";
  packId: string;
  packProgress: VlxPackProgress;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationUpgradeInterestOnlyConflict = {
  category: "upgrade_interest_only";
  upgradeInterestIds: string[];
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationUnsupportedPayloadConflict = {
  category: "unsupported_payload";
  payloadType:
    | "saved_word"
    | "review_event"
    | "review_state"
    | "daily_stats"
    | "pack_progress"
    | "upgrade_interest";
  details: string;
  sourceValue: unknown;
} & VlxGuestMigrationConflictBase;

export type VlxGuestMigrationConflict =
  | VlxGuestMigrationDuplicateSavedWordConflict
  | VlxGuestMigrationDuplicateReviewEventConflict
  | VlxGuestMigrationStaleReviewStateConflict
  | VlxGuestMigrationFakeMasteryRiskConflict
  | VlxGuestMigrationPackProgressWithoutEventsConflict
  | VlxGuestMigrationUpgradeInterestOnlyConflict
  | VlxGuestMigrationUnsupportedPayloadConflict;

export type VlxMigrationConflictInput =
  | {
      category: "duplicate_saved_word";
      slug: string;
      guestSavedWord: VlxSavedWord;
    }
  | {
      category: "duplicate_review_event";
      eventId: string;
      slug: string;
      guestReviewEvent: VlxReviewEvent;
    }
  | {
      category: "stale_review_state";
      slug: string;
      reviewState: VlxReviewStateItem;
    }
  | {
      category: "fake_mastery_risk";
      slug: string;
      mastery: VlxReviewStateItem["mastery"];
      warningSource: "no_review_events" | "event_history_gap";
      reviewState: VlxReviewStateItem;
    }
  | {
      category: "pack_progress_without_events";
      packId: string;
      packProgress: VlxPackProgress;
    }
  | {
      category: "upgrade_interest_only";
      upgradeInterestIds: string[];
    }
  | {
      category: "unsupported_payload";
      payloadType:
        | "saved_word"
        | "review_event"
        | "review_state"
        | "daily_stats"
        | "pack_progress"
        | "upgrade_interest";
      details: string;
      sourceValue: unknown;
    };

export function classifyMigrationConflict(
  input: VlxMigrationConflictInput
): VlxGuestMigrationConflict {
  switch (input.category) {
    case "duplicate_saved_word":
      return {
        ...input,
        category: "duplicate_saved_word",
        severity: "warning",
        reason:
          "The same saved word already exists in account digest. Migration keeps account state."
      };
    case "duplicate_review_event":
      return {
        ...input,
        category: "duplicate_review_event",
        severity: "warning",
        reason:
          "The review event already exists or appears multiple times. It remains idempotent."
      };
    case "stale_review_state":
      return {
        ...input,
        category: "stale_review_state",
        severity: "warning",
        reason:
          "Review state exists without supporting review events or saved word evidence. Keep as audit-only."
      };
    case "fake_mastery_risk":
      return {
        ...input,
        category: "fake_mastery_risk",
        severity: "error",
        reason:
          "Mastery appears ahead of evidence and cannot be trusted as migration-only state."
      };
    case "pack_progress_without_events":
      return {
        ...input,
        category: "pack_progress_without_events",
        severity: "warning",
        reason:
          "Pack progress migration is flagged because there are no review events in this snapshot."
      };
    case "upgrade_interest_only":
      return {
        ...input,
        category: "upgrade_interest_only",
        severity: "warning",
        reason:
          "Snapshot has upgrade interest without learning state; migration is attribution only."
      };
    case "unsupported_payload":
      return {
        ...input,
        category: "unsupported_payload",
        severity: "error",
        reason: input.details
      };
    default: {
      const exhaustive: never = input;
      return exhaustive;
    }
  }
}
