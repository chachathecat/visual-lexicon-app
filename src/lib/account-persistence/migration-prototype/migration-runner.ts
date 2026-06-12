import type {
  VlxSaveWordRequest,
  VlxSubmitReviewEventRequest,
} from "@/lib/server-srs-sync/contracts";
import {
  VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
  type VlxServerSrsSyncResponse,
} from "@/lib/server-srs-sync/types";
import type { createInMemoryServerSrsSyncService } from "@/lib/server-srs-sync/spike/sync-service";
import type { VlxGuestToAccountMigrationPlan } from "@/lib/account-persistence/migration-prototype/migration-plan";
import {
  type VlxGuestMigrationConflict,
} from "@/lib/account-persistence/migration-prototype/conflicts";

type VlxAccountMigrationService = Pick<
  ReturnType<typeof createInMemoryServerSrsSyncService>,
  "saveWord" | "submitReviewEvent" | "store"
>;

type MigrationSummaryBase = {
  operationId: string;
  idempotencyKey: string;
  kind:
    | "import_review_event"
    | "import_saved_word"
    | "import_review_state"
    | "import_daily_stats"
    | "import_pack_progress"
    | "import_upgrade_interest";
  status: VlxGuestMigrationRunDecision;
  reason?: string;
};

type MigrationSummaryWithDuplicate = MigrationSummaryBase & {
  duplicate?: boolean;
};

export type VlxGuestMigrationRunDecision = "accepted" | "rejected" | "skipped";

export type VlxGuestMigrationRunSummaryItem =
  | (MigrationSummaryWithDuplicate & {
      operationId: string;
      kind: "import_review_event" | "import_saved_word";
      status: VlxGuestMigrationRunDecision;
      storeMutation?: string;
    })
  | (MigrationSummaryBase & {
      operationId: string;
      kind:
        | "import_review_state"
        | "import_daily_stats"
        | "import_pack_progress"
        | "import_upgrade_interest";
      status: VlxGuestMigrationRunDecision;
      storeMutation?: string;
      reason: string;
    });

export type VlxGuestMigrationRunResult = {
  batchId: string;
  accountId: string;
  createdAt: string;
  totalOperations: number;
  accepted: VlxGuestMigrationRunSummaryItem[];
  rejected: VlxGuestMigrationRunSummaryItem[];
  skipped: VlxGuestMigrationRunSummaryItem[];
  conflictCount: number;
  conflicts: readonly VlxGuestMigrationConflict[];
};

type VlxSafeRequestError = VlxServerSrsSyncResponse<unknown>;

function toErrorReason(response: VlxSafeRequestError) {
  if (response.ok) {
    return undefined;
  }

  return response.error.message;
}

function isReviewStateConflict(operationKind: string) {
  return (
    operationKind === "import_daily_stats" ||
    operationKind === "import_pack_progress" ||
    operationKind === "import_upgrade_interest"
  );
}

function toSaveRequest({
  accountId,
  operation,
  createdAt,
}: {
  accountId: string;
  createdAt: string;
  operation: Extract<
    VlxGuestToAccountMigrationPlan["operations"][number],
    { kind: "import_saved_word" }
  >;
}): VlxSaveWordRequest {
  return {
    clientMutationId: `guest-migration:${operation.operationId}:save`,
    idempotencyKey: operation.idempotencyKey,
    deviceId: "guest-migration-prototype",
    userId: accountId,
    operation: "save_word",
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: createdAt,
    payload: {
      savedWord: operation.savedWord,
    },
  };
}

function toReviewEventRequest({
  accountId,
  operation,
  createdAt,
}: {
  accountId: string;
  createdAt: string;
  operation: Extract<
    VlxGuestToAccountMigrationPlan["operations"][number],
    { kind: "import_review_event" }
  >;
}): VlxSubmitReviewEventRequest {
  return {
    clientMutationId: `guest-migration:${operation.operationId}:review`,
    idempotencyKey: operation.idempotencyKey,
    deviceId: "guest-migration-prototype",
    userId: accountId,
    operation: "submit_review_event",
    payloadVersion: VLX_SERVER_SRS_SYNC_CONTRACT_VERSION,
    clientCreatedAt: createdAt,
    payload: {
      event: operation.event,
    },
  };
}

function classifySkippedReviewStateReason(operation: {
  slug: string;
  hasSupportingReviewEvents: boolean;
  hasSupportingSavedWord: boolean;
}) {
  if (operation.hasSupportingReviewEvents || operation.hasSupportingSavedWord) {
    return `Review state for ${operation.slug} is materialized from guest snapshot only and not writeable in spike.`; // keep as migration evidence only.
  }

  return `Review state for ${operation.slug} is stale without review-event evidence and remains audit-only.`;
}

function isFakeMasteryConflict(
  conflicts: readonly VlxGuestMigrationConflict[]
): Set<string> {
  type FakeMasteryConflict = Extract<
    VlxGuestMigrationConflict,
    { category: "fake_mastery_risk" }
  >;

  return new Set(
    conflicts
      .filter(
        (conflict): conflict is FakeMasteryConflict =>
          conflict.category === "fake_mastery_risk"
      )
      .map((conflict) => conflict.slug)
  );
}

export function runGuestToAccountMigrationPlan(
  plan: VlxGuestToAccountMigrationPlan,
  service: VlxAccountMigrationService
): VlxGuestMigrationRunResult {
  const accepted: VlxGuestMigrationRunSummaryItem[] = [];
  const rejected: VlxGuestMigrationRunSummaryItem[] = [];
  const skipped: VlxGuestMigrationRunSummaryItem[] = [];
  const fakeMasteryRiskSlugs = isFakeMasteryConflict(plan.conflicts);

  for (const operation of plan.operations) {
    if (operation.kind === "import_review_event") {
      const response = service.submitReviewEvent(
        toReviewEventRequest({
          accountId: plan.accountId,
          createdAt: plan.createdAt,
          operation,
        })
      );

      if (!response.ok) {
        rejected.push({
          operationId: operation.operationId,
          idempotencyKey: operation.idempotencyKey,
          kind: operation.kind,
          status: "rejected",
          reason: toErrorReason(response) ?? "review event rejected",
          storeMutation: `review-events:${operation.slug}`,
        });

        continue;
      }

      accepted.push({
        operationId: operation.operationId,
        idempotencyKey: operation.idempotencyKey,
        kind: operation.kind,
        status: "accepted",
        duplicate: response.data.duplicate,
        storeMutation: `review-events:${operation.slug}`,
      });

      continue;
    }

    if (operation.kind === "import_saved_word") {
      const response = service.saveWord(
        toSaveRequest({
          accountId: plan.accountId,
          createdAt: plan.createdAt,
          operation,
        })
      );

      if (!response.ok) {
        rejected.push({
          operationId: operation.operationId,
          idempotencyKey: operation.idempotencyKey,
          kind: operation.kind,
          status: "rejected",
          reason: toErrorReason(response) ?? "save word rejected",
          storeMutation: `saved-word:${operation.slug}`,
        });

        continue;
      }

      accepted.push({
        operationId: operation.operationId,
        idempotencyKey: operation.idempotencyKey,
        kind: operation.kind,
        status: "accepted",
        duplicate: response.data.duplicate,
        storeMutation: `saved-word:${operation.slug}`,
      });

      continue;
    }

    if (operation.kind === "import_review_state") {
      if (fakeMasteryRiskSlugs.has(operation.slug)) {
        skipped.push({
          operationId: operation.operationId,
          idempotencyKey: operation.idempotencyKey,
          kind: operation.kind,
          status: "skipped",
          reason:
            "Blocked by fake_mastery_risk: this review state cannot be trusted without review-event evidence.",
        });

        continue;
      }

      skipped.push({
        operationId: operation.operationId,
        idempotencyKey: operation.idempotencyKey,
        kind: operation.kind,
        status: "skipped",
        reason: classifySkippedReviewStateReason(operation),
      });

      continue;
    }

    if (isReviewStateConflict(operation.kind)) {
      skipped.push({
        operationId: operation.operationId,
        idempotencyKey: operation.idempotencyKey,
        kind: operation.kind,
        status: "skipped",
        reason:
          operation.kind === "import_upgrade_interest"
            ? "Upgrade interest is attribution-only in prototype mode."
            : `Prototype cannot mutate durable account snapshot for ${operation.kind} without backend sync ownership.`,
        storeMutation: `${operation.kind}:${operation.kind === "import_upgrade_interest" ? operation.interestId : "skipped"}`,
      });

      continue;
    }
  }

  return {
    batchId: plan.batchId,
    accountId: plan.accountId,
    createdAt: plan.createdAt,
    totalOperations: plan.operations.length,
    accepted,
    rejected,
    skipped,
    conflictCount: plan.conflicts.length,
    conflicts: plan.conflicts,
  };
}
