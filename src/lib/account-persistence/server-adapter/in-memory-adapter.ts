import { applyReviewAnswer, createReviewItemFromSavedWord } from "@/lib/srs/engine";
import type { VlxAccountId, VlxAccountStateDigest } from "@/lib/account-persistence/types";
import type {
  VlxAccountSyncConflictResolutionPlan,
  VlxAccountSyncResolution,
  VlxAccountSyncReviewEventEvidence,
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import {
  VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED,
  type VlxServerPersistenceAccountState,
  type VlxServerPersistenceAdapter,
  type VlxServerPersistenceAuditRecord,
  type VlxServerPersistenceDailyStatsItem,
  type VlxServerPersistenceError,
  type VlxServerPersistenceMutationKind,
  type VlxServerPersistenceMutationRecord,
  type VlxServerPersistenceOperationStatus,
  type VlxServerPersistencePackProgress,
  type VlxServerPersistencePlanApplication,
  type VlxServerPersistenceReason,
  type VlxServerPersistenceReasonCode,
  type VlxServerPersistenceResolutionPlanInput,
  type VlxServerPersistenceResolutionPreview,
  type VlxServerPersistenceResult,
  type VlxServerPersistenceReviewEventWrite,
  type VlxServerPersistenceSavedWordWrite,
  type VlxServerPersistenceUpgradeInterestWrite
} from "@/lib/account-persistence/server-adapter/adapter-contract";
import type { VlxReviewAnswerInput, VlxReviewStateItem, VlxSavedWord } from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

const DEFAULT_ADAPTER_NOW = "2026-06-11T00:00:00.000Z";

export type VlxInMemoryServerPersistenceStore = {
  accounts: Record<string, VlxServerPersistenceAccountState>;
};

export type VlxCreateInMemoryServerPersistenceAdapterOptions = {
  now?: string;
  store?: VlxInMemoryServerPersistenceStore;
};

function accountKey(accountId: VlxAccountId | string) {
  return String(accountId);
}

function cloneRecord<TItem>(record?: Record<string, TItem>): Record<string, TItem> {
  return record ? { ...record } : {};
}

function cloneArray<TItem>(items?: readonly TItem[]): TItem[] {
  return items ? [...items] : [];
}

function createReason(
  code: VlxServerPersistenceReasonCode,
  message: string,
  metadata?: VlxServerPersistenceReason["metadata"]
): VlxServerPersistenceReason {
  return {
    code,
    message,
    metadata
  };
}

function createResultBase(
  mutationKind: VlxServerPersistenceMutationKind,
  status: VlxServerPersistenceOperationStatus
) {
  return {
    adapterStatus: "disabled_mock_only" as const,
    mutationKind,
    status,
    mutatesRuntimeStorage: false as const,
    callsNetwork: false as const,
    readsLocalStorage: false as const,
    readsProcessEnv: false as const,
    importsAuthProviderSdk: false as const,
    importsDatabaseSdk: false as const,
    importsPaymentSdk: false as const,
    grantsPaidEntitlement: false as const
  };
}

function okResult<TData>({
  mutationKind,
  status,
  data,
  reason,
  idempotencyKey,
  duplicateOf
}: {
  mutationKind: VlxServerPersistenceMutationKind;
  status: Exclude<VlxServerPersistenceOperationStatus, "blocked" | "rejected">;
  data: TData;
  reason: VlxServerPersistenceReason;
  idempotencyKey?: string;
  duplicateOf?: string;
}): VlxServerPersistenceResult<TData> {
  return {
    ok: true,
    ...createResultBase(mutationKind, status),
    data,
    reason,
    idempotencyKey,
    duplicateOf
  };
}

function errorResult<TData>({
  mutationKind,
  status,
  error,
  idempotencyKey
}: {
  mutationKind: VlxServerPersistenceMutationKind;
  status: "blocked" | "rejected";
  error: VlxServerPersistenceError;
  idempotencyKey?: string;
}): VlxServerPersistenceResult<TData> {
  return {
    ok: false,
    ...createResultBase(mutationKind, status),
    error,
    idempotencyKey
  };
}

function createError(
  code: VlxServerPersistenceReasonCode,
  message: string,
  metadata?: VlxServerPersistenceReason["metadata"]
): VlxServerPersistenceError {
  return {
    ...createReason(code, message, metadata),
    retryable: false
  };
}

function createSyncCursor(syncVersion: number) {
  return `server-persistence-adapter-${syncVersion}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? String(value);
}

function normalizeReviewEventPayload(event: VlxAccountSyncReviewEventEvidence) {
  return {
    eventId: event.eventId,
    sessionId: event.sessionId,
    slug: event.slug,
    word: event.word,
    hub: event.hub,
    questionType: event.questionType,
    selected: event.selected,
    answer: event.answer,
    result: event.result,
    responseMs: event.responseMs,
    usedHint: event.usedHint,
    confidence: event.confidence,
    createdAt: event.createdAt,
    boxBefore: event.boxBefore,
    boxAfter: event.boxAfter,
    weakScoreBefore: event.weakScoreBefore,
    weakScoreAfter: event.weakScoreAfter,
    packId: event.packId
  };
}

function createSavedWordFingerprint(accountId: VlxAccountId | string, savedWord: VlxSavedWord) {
  return stableSerialize({
    accountId,
    mutationKind: "record_saved_word",
    savedWord
  });
}

function createReviewEventFingerprint(
  accountId: VlxAccountId | string,
  event: VlxAccountSyncReviewEventEvidence
) {
  return stableSerialize({
    accountId,
    mutationKind: "record_review_event",
    event: normalizeReviewEventPayload(event)
  });
}

function advanceAccount(account: VlxServerPersistenceAccountState, now: string) {
  account.syncVersion += 1;
  account.syncCursor = createSyncCursor(account.syncVersion);
  account.capturedAt = now;
}

function createDigest(account?: VlxServerPersistenceAccountState): VlxAccountStateDigest {
  if (!account) {
    return {
      savedWordSlugs: [],
      reviewStateSlugs: [],
      reviewEventIds: [],
      dailyStatDates: [],
      packIds: [],
      upgradeInterestIds: [],
      syncCursor: createSyncCursor(0),
      capturedAt: DEFAULT_ADAPTER_NOW
    };
  }

  return {
    savedWordSlugs: Object.keys(account.savedWords).sort(),
    reviewStateSlugs: Object.keys(account.reviewState).sort(),
    reviewEventIds: account.reviewEvents.map((event) => event.eventId),
    dailyStatDates: Object.keys(account.dailyStats).sort(),
    packIds: Object.keys(account.packProgress).sort(),
    upgradeInterestIds: account.upgradeInterest.map((record) => record.id),
    syncCursor: account.syncCursor,
    capturedAt: account.capturedAt
  };
}

function createEmptyServerState(
  accountId: VlxAccountId | string,
  now: string
): VlxAccountSyncServerState {
  return {
    accountId,
    capturedAt: now,
    syncCursor: createSyncCursor(0),
    savedWords: {},
    reviewState: {},
    reviewEvents: [],
    packProgress: {},
    upgradeInterest: [],
    entitlement: {
      paid: false,
      source: "not_in_server_persistence_adapter"
    }
  };
}

function toSyncServerState(
  accountId: VlxAccountId | string,
  account: VlxServerPersistenceAccountState | undefined,
  now: string
): VlxAccountSyncServerState {
  if (!account) {
    return createEmptyServerState(accountId, now);
  }

  return {
    accountId,
    capturedAt: account.capturedAt,
    syncCursor: account.syncCursor,
    savedWords: cloneRecord(account.savedWords),
    reviewState: cloneRecord(account.reviewState),
    reviewEvents: account.reviewEvents.map((event) => ({ ...event })),
    packProgress: cloneRecord(account.packProgress),
    upgradeInterest: cloneArray(account.upgradeInterest),
    entitlement: account.entitlement
  };
}

export function createInMemoryServerPersistenceAccountState({
  accountId = "server-persistence-account-1",
  capturedAt = DEFAULT_ADAPTER_NOW,
  syncVersion = 0,
  savedWords,
  reviewState,
  reviewEvents,
  dailyStats,
  packProgress,
  upgradeInterest,
  auditRecords,
  processedIdempotencyKeys
}: Partial<Omit<VlxServerPersistenceAccountState, "accountId" | "entitlement" | "syncCursor">> & {
  accountId?: VlxAccountId | string;
} = {}): VlxServerPersistenceAccountState {
  return {
    accountId,
    capturedAt,
    syncCursor: createSyncCursor(syncVersion),
    savedWords: cloneRecord(savedWords),
    reviewState: cloneRecord(reviewState),
    reviewEvents: cloneArray(reviewEvents),
    dailyStats: cloneRecord(dailyStats),
    packProgress: cloneRecord(packProgress),
    upgradeInterest: cloneArray(upgradeInterest),
    auditRecords: cloneArray(auditRecords),
    processedIdempotencyKeys: cloneRecord(processedIdempotencyKeys),
    syncVersion,
    entitlement: {
      paid: false,
      source: "not_in_server_persistence_adapter"
    }
  };
}

export function createInMemoryServerPersistenceStore(
  input: Partial<VlxInMemoryServerPersistenceStore> = {}
): VlxInMemoryServerPersistenceStore {
  return {
    accounts: input.accounts ? { ...input.accounts } : {}
  };
}

function cloneAccountState(
  account: VlxServerPersistenceAccountState
): VlxServerPersistenceAccountState {
  return createInMemoryServerPersistenceAccountState({
    accountId: account.accountId,
    capturedAt: account.capturedAt,
    syncVersion: account.syncVersion,
    savedWords: account.savedWords,
    reviewState: account.reviewState,
    reviewEvents: account.reviewEvents,
    dailyStats: account.dailyStats,
    packProgress: account.packProgress,
    upgradeInterest: account.upgradeInterest,
    auditRecords: account.auditRecords,
    processedIdempotencyKeys: account.processedIdempotencyKeys
  });
}

function ensureAccountState(
  store: VlxInMemoryServerPersistenceStore,
  accountId: VlxAccountId | string,
  now: string
) {
  const key = accountKey(accountId);

  if (!store.accounts[key]) {
    store.accounts[key] = createInMemoryServerPersistenceAccountState({
      accountId,
      capturedAt: now
    });
  }

  return store.accounts[key];
}

function rememberIdempotencyKey({
  account,
  accountId,
  mutationKind,
  idempotencyKey,
  payloadFingerprint,
  processedAt,
  reason
}: {
  account: VlxServerPersistenceAccountState;
  accountId: VlxAccountId | string;
  mutationKind: VlxServerPersistenceMutationKind;
  idempotencyKey: string;
  payloadFingerprint: string;
  processedAt: string;
  reason: VlxServerPersistenceReason;
}) {
  account.processedIdempotencyKeys[idempotencyKey] = {
    idempotencyKey,
    accountId,
    mutationKind,
    payloadFingerprint,
    processedAt,
    reason
  };
}

function validateIdempotencyKey(
  idempotencyKey: string,
  mutationKind: VlxServerPersistenceMutationKind
) {
  if (typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
    return undefined;
  }

  return errorResult<never>({
    mutationKind,
    status: "rejected",
    error: createError(
      "idempotency_key_required",
      "Server persistence adapter writes require an idempotencyKey."
    )
  });
}

function getProcessedIdempotencyResult<TData>({
  account,
  mutationKind,
  idempotencyKey,
  payloadFingerprint,
  data,
  duplicateOf
}: {
  account: VlxServerPersistenceAccountState;
  mutationKind: VlxServerPersistenceMutationKind;
  idempotencyKey: string;
  payloadFingerprint: string;
  data: TData;
  duplicateOf?: string;
}): VlxServerPersistenceResult<TData> | undefined {
  const processed = account.processedIdempotencyKeys[idempotencyKey];

  if (!processed) {
    return undefined;
  }

  if (processed.payloadFingerprint !== payloadFingerprint) {
    return errorResult({
      mutationKind,
      status: "rejected",
      error: createError(
        "idempotency_payload_conflict",
        "Idempotency key was already used with a different payload.",
        {
          idempotencyKey,
          processedMutationKind: processed.mutationKind
        }
      ),
      idempotencyKey
    });
  }

  const duplicateReasonCode =
    processed.reason.code !== "accepted"
      ? processed.reason.code
      : mutationKind === "record_saved_word"
        ? "duplicate_saved_word"
        : "duplicate_review_event";

  return okResult({
    mutationKind,
    status: "duplicate_noop",
    data,
    reason: createReason(
      duplicateReasonCode,
      "Duplicate idempotency retry was accepted as a no-op.",
      {
        idempotencyKey
      }
    ),
    idempotencyKey,
    duplicateOf: duplicateOf ?? idempotencyKey
  });
}

function toReviewAnswerInput(
  event: VlxAccountSyncReviewEventEvidence
): VlxReviewAnswerInput {
  return {
    eventId: event.eventId,
    sessionId: event.sessionId,
    slug: event.slug,
    word: event.word,
    hub: event.hub,
    questionType: event.questionType,
    selected: event.selected,
    answer: event.answer,
    result: event.result,
    responseMs: event.responseMs,
    usedHint: event.usedHint,
    confidence: event.confidence,
    createdAt: event.createdAt
  };
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function upsertPackProgressFromEvent({
  account,
  event,
  idempotencyKey,
  now
}: {
  account: VlxServerPersistenceAccountState;
  event: VlxAccountSyncReviewEventEvidence;
  idempotencyKey: string;
  now: string;
}) {
  if (!event.packId) {
    return undefined;
  }

  const existing = account.packProgress[event.packId];

  if (existing?.derivedFromEventIds.includes(event.eventId)) {
    return existing;
  }

  const packProgress: VlxServerPersistencePackProgress = {
    packId: event.packId,
    startedAt: existing?.startedAt ?? now,
    lastOpenedAt: existing?.lastOpenedAt,
    previewStartedAt: existing?.previewStartedAt,
    previewCompletedAt: existing?.previewCompletedAt,
    lastReviewedAt: event.createdAt,
    reviewedCount: (existing?.reviewedCount ?? 0) + 1,
    correctCount:
      (existing?.correctCount ?? 0) + (event.result === "correct" ? 1 : 0),
    source: "review",
    derivedFromEventIds: [...(existing?.derivedFromEventIds ?? []), event.eventId],
    idempotencyKeys: [...(existing?.idempotencyKeys ?? []), idempotencyKey],
    serverUpdatedAt: now,
    version: (existing?.version ?? 0) + 1
  };

  account.packProgress[event.packId] = packProgress;

  return packProgress;
}

function recordSavedWordInState({
  account,
  accountId,
  savedWord,
  idempotencyKey,
  now
}: {
  account: VlxServerPersistenceAccountState;
  accountId: VlxAccountId | string;
  savedWord: VlxSavedWord;
  idempotencyKey: string;
  now: string;
}): VlxServerPersistenceResult<VlxServerPersistenceSavedWordWrite> {
  const invalid = validateIdempotencyKey(idempotencyKey, "record_saved_word");

  if (invalid) {
    return invalid;
  }

  if (!savedWord.slug || !savedWord.word || !savedWord.savedAt) {
    return errorResult({
      mutationKind: "record_saved_word",
      status: "rejected",
      error: createError(
        "invalid_payload",
        "Saved word payload must include slug, word, and savedAt.",
        {
          slug: savedWord.slug ?? null
        }
      ),
      idempotencyKey
    });
  }

  const fingerprint = createSavedWordFingerprint(accountId, savedWord);
  const existingSavedWord = account.savedWords[savedWord.slug];
  const existingReviewState = account.reviewState[savedWord.slug];
  const duplicate = Boolean(existingSavedWord);
  const reviewState =
    existingReviewState ?? createReviewItemFromSavedWord(savedWord, savedWord.savedAt);
  const duplicateData: VlxServerPersistenceSavedWordWrite = {
    savedWord: existingSavedWord ?? savedWord,
    reviewState,
    duplicate: true
  };
  const processed = getProcessedIdempotencyResult({
    account,
    mutationKind: "record_saved_word",
    idempotencyKey,
    payloadFingerprint: fingerprint,
    data: duplicateData
  });

  if (processed) {
    return processed;
  }

  if (duplicate) {
    const reason = createReason(
      "duplicate_saved_word",
      "Saved word already exists; duplicate save is a no-op and review_state is preserved.",
      {
        slug: savedWord.slug
      }
    );

    rememberIdempotencyKey({
      account,
      accountId,
      mutationKind: "record_saved_word",
      idempotencyKey,
      payloadFingerprint: fingerprint,
      processedAt: now,
      reason
    });

    return okResult({
      mutationKind: "record_saved_word",
      status: "duplicate_noop",
      data: duplicateData,
      reason,
      idempotencyKey,
      duplicateOf: savedWord.slug
    });
  }

  account.savedWords[savedWord.slug] = savedWord;

  if (!existingReviewState) {
    account.reviewState[savedWord.slug] = reviewState;
  }

  advanceAccount(account, now);

  const reason = createReason(
    "accepted",
    "Saved word was recorded in the in-memory server persistence adapter.",
    {
      slug: savedWord.slug
    }
  );

  rememberIdempotencyKey({
    account,
    accountId,
    mutationKind: "record_saved_word",
    idempotencyKey,
    payloadFingerprint: fingerprint,
    processedAt: now,
    reason
  });

  return okResult({
    mutationKind: "record_saved_word",
    status: "accepted",
    data: {
      savedWord,
      reviewState,
      duplicate: false
    },
    reason,
    idempotencyKey
  });
}

function recordReviewEventInState({
  account,
  accountId,
  reviewEvent,
  idempotencyKey,
  now
}: {
  account: VlxServerPersistenceAccountState;
  accountId: VlxAccountId | string;
  reviewEvent: VlxAccountSyncReviewEventEvidence;
  idempotencyKey: string;
  now: string;
}): VlxServerPersistenceResult<VlxServerPersistenceReviewEventWrite> {
  const invalid = validateIdempotencyKey(idempotencyKey, "record_review_event");

  if (invalid) {
    return invalid;
  }

  if (
    !reviewEvent.eventId ||
    !reviewEvent.sessionId ||
    !reviewEvent.slug ||
    !reviewEvent.word ||
    !reviewEvent.createdAt ||
    (reviewEvent.result !== "correct" && reviewEvent.result !== "wrong")
  ) {
    return errorResult({
      mutationKind: "record_review_event",
      status: "rejected",
      error: createError(
        "invalid_payload",
        "Review event payload must include eventId, sessionId, slug, word, result, and createdAt.",
        {
          eventId: reviewEvent.eventId ?? null
        }
      ),
      idempotencyKey
    });
  }

  const eventWithIdempotency: VlxAccountSyncReviewEventEvidence = {
    ...reviewEvent,
    idempotencyKey
  };
  const fingerprint = createReviewEventFingerprint(accountId, eventWithIdempotency);
  const existingEvent = account.reviewEvents.find(
    (event) => event.eventId === reviewEvent.eventId
  );
  const existingState = account.reviewState[reviewEvent.slug];
  const responseReviewState =
    existingState ??
    createReviewItemFromSavedWord(
      {
        slug: reviewEvent.slug,
        word: reviewEvent.word,
        hub: reviewEvent.hub,
        savedAt: reviewEvent.createdAt,
        source: "app"
      },
      reviewEvent.createdAt
    );
  const existingDailyStats =
    account.dailyStats[dateKey(reviewEvent.createdAt)] ??
    ({
      date: dateKey(reviewEvent.createdAt),
      reviewed: 0,
      correct: 0,
      wrong: 0,
      mastered: 0,
      weakAdded: 0,
      minutes: 0,
      sessions: 0,
      derivedFromEventIds: [],
      serverUpdatedAt: now
    } satisfies VlxServerPersistenceDailyStatsItem);
  const processed = getProcessedIdempotencyResult({
    account,
    mutationKind: "record_review_event",
    idempotencyKey,
    payloadFingerprint: fingerprint,
    data: {
      event: existingEvent ?? eventWithIdempotency,
      reviewState: responseReviewState,
      dailyStats: existingDailyStats,
      packProgress: reviewEvent.packId
        ? account.packProgress[reviewEvent.packId]
        : undefined,
      duplicate: true
    } as VlxServerPersistenceReviewEventWrite,
    duplicateOf: existingEvent?.idempotencyKey
  });

  if (processed) {
    return processed;
  }

  if (existingEvent) {
    const reason = createReason(
      "duplicate_review_event",
      "Review event evidence already exists and must not advance SRS twice.",
      {
        eventId: reviewEvent.eventId
      }
    );

    rememberIdempotencyKey({
      account,
      accountId,
      mutationKind: "record_review_event",
      idempotencyKey,
      payloadFingerprint: fingerprint,
      processedAt: now,
      reason
    });

    return okResult({
      mutationKind: "record_review_event",
      status: "duplicate_noop",
      data: {
        event: existingEvent,
        reviewState: responseReviewState,
        dailyStats: existingDailyStats,
        packProgress: reviewEvent.packId
          ? account.packProgress[reviewEvent.packId]
          : undefined,
        duplicate: true
      },
      reason,
      idempotencyKey,
      duplicateOf: existingEvent.idempotencyKey
    });
  }

  const reducerOutput = applyReviewAnswer(toReviewAnswerInput(reviewEvent), {
    currentState: existingState,
    dailyStats: existingDailyStats,
    countSession: true
  });
  const event: VlxAccountSyncReviewEventEvidence = {
    ...reducerOutput.event,
    idempotencyKey,
    payloadFingerprint: fingerprint,
    packId: reviewEvent.packId
  };
  const dailyStats: VlxServerPersistenceDailyStatsItem = {
    ...reducerOutput.dailyStats,
    derivedFromEventIds: [
      ...(existingDailyStats.derivedFromEventIds ?? []),
      event.eventId
    ],
    serverUpdatedAt: now
  };
  const packProgress = upsertPackProgressFromEvent({
    account,
    event,
    idempotencyKey,
    now
  });

  account.reviewEvents.push(event);
  account.reviewState[event.slug] = reducerOutput.state;
  account.dailyStats[dailyStats.date] = dailyStats;
  advanceAccount(account, now);

  const reason = createReason(
    "accepted",
    "Review event evidence was recorded and review_state was recomputed from evidence.",
    {
      eventId: event.eventId,
      slug: event.slug
    }
  );

  rememberIdempotencyKey({
    account,
    accountId,
    mutationKind: "record_review_event",
    idempotencyKey,
    payloadFingerprint: fingerprint,
    processedAt: now,
    reason
  });

  return okResult({
    mutationKind: "record_review_event",
    status: "accepted",
    data: {
      event,
      reviewState: reducerOutput.state,
      dailyStats,
      packProgress,
      duplicate: false
    },
    reason,
    idempotencyKey
  });
}

function recordUpgradeInterestInState({
  account,
  upgradeInterest,
  now
}: {
  account: VlxServerPersistenceAccountState;
  upgradeInterest: VlxUpgradeInterestRecord;
  now: string;
}): VlxServerPersistenceResult<VlxServerPersistenceUpgradeInterestWrite> {
  if (!upgradeInterest.id || !upgradeInterest.createdAt || !upgradeInterest.pagePath) {
    return errorResult({
      mutationKind: "record_upgrade_interest_attribution",
      status: "rejected",
      error: createError(
        "invalid_payload",
        "Upgrade interest payload must include id, createdAt, and pagePath.",
        {
          interestId: upgradeInterest.id ?? null
        }
      )
    });
  }

  const duplicate = account.upgradeInterest.some(
    (record) => record.id === upgradeInterest.id
  );
  const reason = createReason(
    duplicate ? "audit_only" : "accepted",
    duplicate
      ? "Upgrade interest attribution already exists and remains attribution-only."
      : "Upgrade interest was recorded as attribution-only; paid entitlement is unchanged.",
    {
      interestId: upgradeInterest.id
    }
  );

  if (!duplicate) {
    account.upgradeInterest.push(upgradeInterest);
    advanceAccount(account, now);
  }

  return okResult({
    mutationKind: "record_upgrade_interest_attribution",
    status: duplicate ? "duplicate_noop" : "accepted",
    data: {
      upgradeInterest,
      duplicate,
      entitlement: account.entitlement
    },
    reason,
    duplicateOf: duplicate ? upgradeInterest.id : undefined
  });
}

function recordSyncAuditInState({
  account,
  accountId,
  auditRecord,
  now
}: {
  account: VlxServerPersistenceAccountState;
  accountId: VlxAccountId | string;
  auditRecord: Omit<VlxServerPersistenceAuditRecord, "accountId">;
  now: string;
}): VlxServerPersistenceResult<VlxServerPersistenceAuditRecord> {
  const record: VlxServerPersistenceAuditRecord = {
    ...auditRecord,
    accountId,
    createdAt: auditRecord.createdAt || now,
    grantsPaidEntitlement: false,
    callsNetwork: false
  };

  account.auditRecords.push(record);
  advanceAccount(account, now);

  return okResult({
    mutationKind: "record_sync_audit",
    status: "audit_only",
    data: record,
    reason: record.reason
  });
}

function hasAcceptedResolution(
  input: VlxServerPersistenceResolutionPlanInput,
  resolution: VlxAccountSyncResolution
) {
  return (
    !input.acceptedResolutionIds ||
    input.acceptedResolutionIds.includes(resolution.resolutionId)
  );
}

function getResolutionStatus(
  resolution: VlxAccountSyncResolution
): VlxServerPersistenceOperationStatus {
  switch (resolution.action) {
    case "reject_blocked":
      return "blocked";
    case "skip_audit_only":
    case "keep_server":
      return "audit_only";
    case "no_op_duplicate":
      return "duplicate_noop";
    case "import_to_server":
    case "merge_event_evidence":
    case "recompute_from_events":
    case "attribution_only":
      return "accepted";
    default: {
      const exhaustive: never = resolution.action;
      return exhaustive;
    }
  }
}

function getResolutionReason(
  resolution: VlxAccountSyncResolution,
  status: VlxServerPersistenceOperationStatus
) {
  const code: VlxServerPersistenceReasonCode =
    status === "blocked"
      ? "blocked_plan"
      : status === "audit_only"
        ? "audit_only"
        : status === "duplicate_noop"
          ? resolution.target === "saved_word"
            ? "duplicate_saved_word"
            : "duplicate_review_event"
          : "accepted";

  return createReason(code, resolution.reason, {
    resolutionId: resolution.resolutionId,
    category: resolution.category,
    target: resolution.target
  });
}

function createAuditRecordForResolution({
  plan,
  resolution,
  status,
  reason,
  now
}: {
  plan: VlxAccountSyncConflictResolutionPlan;
  resolution: VlxAccountSyncResolution;
  status: Exclude<VlxServerPersistenceOperationStatus, "accepted">;
  reason: VlxServerPersistenceReason;
  now: string;
}): Omit<VlxServerPersistenceAuditRecord, "accountId"> {
  return {
    auditId: `server-adapter-audit:${plan.planId}:${resolution.resolutionId}`,
    createdAt: now,
    source: "conflict_resolution_plan",
    planId: plan.planId,
    resolutionId: resolution.resolutionId,
    category: resolution.category,
    action: resolution.action,
    target: resolution.target,
    status,
    reason,
    grantsPaidEntitlement: false,
    callsNetwork: false
  };
}

function createMutationRecord(
  resolution: VlxAccountSyncResolution,
  status: VlxServerPersistenceOperationStatus,
  reason: VlxServerPersistenceReason,
  idempotencyKey?: string,
  duplicateOf?: string
): VlxServerPersistenceMutationRecord {
  return {
    resolutionId: resolution.resolutionId,
    category: resolution.category,
    action: resolution.action,
    target: resolution.target,
    status,
    reason,
    idempotencyKey,
    duplicateOf
  };
}

function createPreview(
  input: VlxServerPersistenceResolutionPlanInput
): VlxServerPersistenceResolutionPreview {
  const blockedReasons: VlxServerPersistenceReason[] = [];
  const acceptedResolutionIds: string[] = [];
  const auditOnlyResolutionIds: string[] = [];
  const noOpResolutionIds: string[] = [];
  const rejectedResolutionIds: string[] = [];
  const plannedMutations: Array<
    VlxServerPersistenceResolutionPreview["plannedMutations"][number]
  > = [];

  for (const resolution of input.plan.resolutions) {
    if (!hasAcceptedResolution(input, resolution)) {
      continue;
    }

    const status = getResolutionStatus(resolution);
    const reason = getResolutionReason(resolution, status);

    if (status === "blocked") {
      blockedReasons.push(reason);
      rejectedResolutionIds.push(resolution.resolutionId);
    } else if (status === "audit_only") {
      auditOnlyResolutionIds.push(resolution.resolutionId);
    } else if (status === "duplicate_noop") {
      noOpResolutionIds.push(resolution.resolutionId);
    } else {
      acceptedResolutionIds.push(resolution.resolutionId);
    }

    plannedMutations.push({
      resolutionId: resolution.resolutionId,
      category: resolution.category,
      action: resolution.action,
      target: resolution.target,
      status,
      reason
    });
  }

  return {
    planId: input.plan.planId,
    accountId: input.plan.accountId,
    canApply: input.plan.status !== "blocked" && blockedReasons.length === 0,
    blockedReasons,
    acceptedResolutionIds,
    auditOnlyResolutionIds,
    noOpResolutionIds,
    rejectedResolutionIds,
    plannedMutations,
    mutatesOnPreview: false
  };
}

function findSnapshotReviewEvent(
  input: VlxServerPersistenceResolutionPlanInput,
  resolution: VlxAccountSyncResolution
) {
  return input.localSnapshot.stores.reviewEvents.find(
    (event) => event.eventId === resolution.eventId
  ) as VlxAccountSyncReviewEventEvidence | undefined;
}

function applyResolutionToState({
  workingAccount,
  input,
  resolution,
  now
}: {
  workingAccount: VlxServerPersistenceAccountState;
  input: VlxServerPersistenceResolutionPlanInput;
  resolution: VlxAccountSyncResolution;
  now: string;
}): VlxServerPersistenceMutationRecord {
  const status = getResolutionStatus(resolution);
  const reason = getResolutionReason(resolution, status);

  if (status === "blocked") {
    return createMutationRecord(resolution, "blocked", reason);
  }

  if (status === "audit_only" || status === "duplicate_noop") {
    const audit = recordSyncAuditInState({
      account: workingAccount,
      accountId: input.plan.accountId,
      auditRecord: createAuditRecordForResolution({
        plan: input.plan,
        resolution,
        status,
        reason,
        now
      }),
      now
    });

    return createMutationRecord(
      resolution,
      status,
      audit.ok ? audit.data.reason : reason
    );
  }

  if (resolution.action === "import_to_server" && resolution.target === "saved_word") {
    const slug = resolution.slug;
    const savedWord = slug ? input.localSnapshot.stores.savedWords[slug] : undefined;

    if (!slug || !savedWord) {
      return createMutationRecord(
        resolution,
        "rejected",
        createReason(
          "missing_payload_evidence",
          "Accepted saved-word resolution did not include matching snapshot evidence.",
          {
            resolutionId: resolution.resolutionId
          }
        )
      );
    }

    const idempotencyKey = `${input.plan.planId}:${resolution.resolutionId}`;
    const result = recordSavedWordInState({
      account: workingAccount,
      accountId: input.plan.accountId,
      savedWord,
      idempotencyKey,
      now
    });

    return result.ok
      ? createMutationRecord(
          resolution,
          result.status,
          result.reason,
          result.idempotencyKey,
          result.duplicateOf
        )
      : createMutationRecord(resolution, result.status, result.error, idempotencyKey);
  }

  if (
    resolution.action === "merge_event_evidence" &&
    resolution.target === "review_event"
  ) {
    const event = findSnapshotReviewEvent(input, resolution);

    if (!event) {
      return createMutationRecord(
        resolution,
        "rejected",
        createReason(
          "missing_payload_evidence",
          "Accepted review-event resolution did not include matching snapshot evidence.",
          {
            resolutionId: resolution.resolutionId,
            eventId: resolution.eventId ?? null
          }
        )
      );
    }

    const idempotencyKey =
      resolution.idempotencyKey ??
      event.idempotencyKey ??
      `${input.plan.planId}:${resolution.resolutionId}`;
    const result = recordReviewEventInState({
      account: workingAccount,
      accountId: input.plan.accountId,
      reviewEvent: event,
      idempotencyKey,
      now
    });

    return result.ok
      ? createMutationRecord(
          resolution,
          result.status,
          result.reason,
          result.idempotencyKey,
          result.duplicateOf
        )
      : createMutationRecord(resolution, result.status, result.error, idempotencyKey);
  }

  if (resolution.action === "attribution_only" && resolution.target === "upgrade_interest") {
    const upgradeInterest = input.localSnapshot.stores.upgradeInterest.find(
      (record) => record.id === resolution.interestId
    );

    if (!upgradeInterest) {
      return createMutationRecord(
        resolution,
        "rejected",
        createReason(
          "missing_payload_evidence",
          "Accepted upgrade-interest resolution did not include matching snapshot attribution.",
          {
            resolutionId: resolution.resolutionId,
            interestId: resolution.interestId ?? null
          }
        )
      );
    }

    const result = recordUpgradeInterestInState({
      account: workingAccount,
      upgradeInterest,
      now
    });

    return result.ok
      ? createMutationRecord(
          resolution,
          result.status,
          result.reason,
          undefined,
          result.duplicateOf
        )
      : createMutationRecord(resolution, result.status, result.error);
  }

  if (resolution.action === "recompute_from_events") {
    const audit = recordSyncAuditInState({
      account: workingAccount,
      accountId: input.plan.accountId,
      auditRecord: createAuditRecordForResolution({
        plan: input.plan,
        resolution,
        status: "audit_only",
        reason,
        now
      }),
      now
    });

    return createMutationRecord(
      resolution,
      audit.ok ? "audit_only" : "rejected",
      audit.ok ? audit.data.reason : reason
    );
  }

  return createMutationRecord(
    resolution,
    "rejected",
    createReason(
      "unsupported_resolution",
      "Resolution action is not supported by the mock server persistence adapter.",
      {
        resolutionId: resolution.resolutionId,
        action: resolution.action,
        target: resolution.target
      }
    )
  );
}

export function createInMemoryServerPersistenceAdapter(
  options: VlxCreateInMemoryServerPersistenceAdapterOptions = {}
): VlxServerPersistenceAdapter & { store: VlxInMemoryServerPersistenceStore } {
  const store = options.store ?? createInMemoryServerPersistenceStore();
  const now = options.now ?? DEFAULT_ADAPTER_NOW;

  function loadAccountSyncServerState(accountId: VlxAccountId | string) {
    return okResult({
      mutationKind: "load_account_state",
      status: "accepted",
      data: toSyncServerState(accountId, store.accounts[accountKey(accountId)], now),
      reason: createReason(
        "accepted",
        "Account sync server state was loaded from the in-memory mock adapter."
      )
    });
  }

  function getAccountStateDigest(accountId: VlxAccountId | string) {
    const account = store.accounts[accountKey(accountId)];
    const digest = account
      ? createDigest(account)
      : {
          ...createDigest(undefined),
          capturedAt: now
        };

    return okResult({
      mutationKind: "get_account_state_digest",
      status: "accepted",
      data: digest,
      reason: createReason(
        "accepted",
        "Account state digest was derived from the in-memory mock adapter."
      )
    });
  }

  function previewApplyAccountSyncResolutionPlan(
    input: VlxServerPersistenceResolutionPlanInput
  ) {
    return okResult({
      mutationKind: "preview_resolution_plan",
      status: "accepted",
      data: createPreview(input),
      reason: createReason(
        "accepted",
        "Resolution plan was previewed without mutating in-memory state."
      )
    });
  }

  function applyAccountSyncResolutionPlan(
    input: VlxServerPersistenceResolutionPlanInput
  ) {
    const preview = createPreview(input);

    if (!preview.canApply) {
      return errorResult<VlxServerPersistencePlanApplication>({
        mutationKind: "apply_resolution_plan",
        status: "blocked",
        error: createError(
          "blocked_plan",
          "Blocked conflict-resolution plans are not applied to server state.",
          {
            planId: input.plan.planId,
            blockedResolutionIds: preview.rejectedResolutionIds
          }
        )
      });
    }

    const key = accountKey(input.plan.accountId);
    const baseAccount =
      store.accounts[key] ??
      createInMemoryServerPersistenceAccountState({
        accountId: input.plan.accountId,
        capturedAt: now
      });
    const workingAccount = cloneAccountState(baseAccount);
    const accepted: VlxServerPersistenceMutationRecord[] = [];
    const skipped: VlxServerPersistenceMutationRecord[] = [];
    const rejected: VlxServerPersistenceMutationRecord[] = [];
    const startingAuditCount = workingAccount.auditRecords.length;

    for (const resolution of input.plan.resolutions) {
      if (!hasAcceptedResolution(input, resolution)) {
        continue;
      }

      const record = applyResolutionToState({
        workingAccount,
        input,
        resolution,
        now
      });

      if (record.status === "rejected" || record.status === "blocked") {
        rejected.push(record);
        break;
      }

      if (record.status === "accepted") {
        accepted.push(record);
      } else {
        skipped.push(record);
      }
    }

    if (rejected.length > 0) {
      return errorResult<VlxServerPersistencePlanApplication>({
        mutationKind: "apply_resolution_plan",
        status: "rejected",
        error: {
          ...rejected[0].reason,
          retryable: false
        }
      });
    }

    store.accounts[key] = workingAccount;

    return okResult({
      mutationKind: "apply_resolution_plan",
      status: "accepted",
      data: {
        planId: input.plan.planId,
        accountId: input.plan.accountId,
        appliedAt: now,
        accepted,
        skipped,
        rejected,
        auditRecords: workingAccount.auditRecords.slice(startingAuditCount),
        digest: createDigest(workingAccount)
      },
      reason: createReason(
        "accepted",
        "Resolution plan was applied to the in-memory mock adapter."
      )
    });
  }

  function recordSavedWord(
    accountId: VlxAccountId | string,
    savedWord: VlxSavedWord,
    idempotencyKey: string
  ) {
    return recordSavedWordInState({
      account: ensureAccountState(store, accountId, now),
      accountId,
      savedWord,
      idempotencyKey,
      now
    });
  }

  function recordReviewEvent(
    accountId: VlxAccountId | string,
    reviewEvent: VlxAccountSyncReviewEventEvidence,
    idempotencyKey: string
  ) {
    return recordReviewEventInState({
      account: ensureAccountState(store, accountId, now),
      accountId,
      reviewEvent,
      idempotencyKey,
      now
    });
  }

  function recordUpgradeInterestAttribution(
    accountId: VlxAccountId | string,
    upgradeInterest: VlxUpgradeInterestRecord
  ) {
    return recordUpgradeInterestInState({
      account: ensureAccountState(store, accountId, now),
      upgradeInterest,
      now
    });
  }

  function recordSyncAudit(
    accountId: VlxAccountId | string,
    auditRecord: Omit<VlxServerPersistenceAuditRecord, "accountId">
  ) {
    return recordSyncAuditInState({
      account: ensureAccountState(store, accountId, now),
      accountId,
      auditRecord,
      now
    });
  }

  return {
    enabled: VLX_SERVER_PERSISTENCE_ADAPTER_ENABLED,
    adapterStatus: "disabled_mock_only",
    store,
    loadAccountSyncServerState,
    previewApplyAccountSyncResolutionPlan,
    applyAccountSyncResolutionPlan,
    recordSavedWord,
    recordReviewEvent,
    recordUpgradeInterestAttribution,
    recordSyncAudit,
    getAccountStateDigest
  };
}
