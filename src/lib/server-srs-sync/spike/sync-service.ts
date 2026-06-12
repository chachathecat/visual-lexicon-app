import { createReviewItemFromSavedWord } from "@/lib/srs/engine";
import type {
  VlxDailyStatsItem,
  VlxReviewAnswerInput,
  VlxReviewStateItem,
  VlxSavedWord
} from "@/lib/srs/types";
import {
  selectDueReviewState,
  selectMasteredReviewState,
  selectWeakReviewState
} from "@/lib/server-srs-sync/selectors";
import type {
  VlxArchiveWordRequest,
  VlxArchiveWordResponse,
  VlxFetchDueQueueResponse,
  VlxFetchMasteredWordsResponse,
  VlxFetchWeakQueueResponse,
  VlxHydrateAccountStateResponse,
  VlxSaveWordRequest,
  VlxSaveWordResponse,
  VlxSubmitReviewEventRequest,
  VlxSubmitReviewEventResponse,
  VlxSyncPendingLocalQueueRequest,
  VlxSyncPendingLocalQueueResponse
} from "@/lib/server-srs-sync/contracts";
import type {
  VlxPendingLocalQueueItem,
  VlxServerDailyStatsItem,
  VlxServerPackProgress,
  VlxServerReviewEvent,
  VlxServerReviewStateItem,
  VlxServerSavedWord,
  VlxServerSrsSyncEnvelope,
  VlxServerSrsSyncError,
  VlxServerSrsSyncOperation,
  VlxServerSrsSyncResponse,
  VlxServerSrsSyncSource,
  VlxServerSyncMutationResult
} from "@/lib/server-srs-sync/types";
import {
  createInMemoryServerSrsSyncStore,
  type VlxInMemoryServerSrsSyncStore
} from "@/lib/server-srs-sync/spike/in-memory-store";
import {
  reduceServerReviewEvent,
  type VlxServerSrsReducerInput
} from "@/lib/server-srs-sync/spike/srs-reducer";

const DEFAULT_SPIKE_NOW = "2026-06-11T00:00:00.000Z";

type SpikeWriteEnvelope = VlxServerSrsSyncEnvelope<
  unknown,
  VlxServerSrsSyncOperation
>;

type ResponseData<TResponse> = TResponse extends {
  ok: true;
  data: infer TData;
}
  ? TData
  : never;

type CreateInMemoryServerSrsSyncServiceOptions = {
  now?: string;
  store?: VlxInMemoryServerSrsSyncStore;
};

function userScopedKey(userId: string, value: string) {
  return `${userId}:${value}`;
}

function getDateKey(value: string) {
  return value.slice(0, 10);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function createSyncCursor(store: VlxInMemoryServerSrsSyncStore) {
  return `spike-${store.syncVersion}`;
}

function advanceSyncCursor(store: VlxInMemoryServerSrsSyncStore) {
  store.syncVersion += 1;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? String(value);
}

function createIdempotencyPayloadFingerprint(envelope: SpikeWriteEnvelope) {
  return stableSerialize({
    operation: envelope.operation,
    payload: envelope.payload,
    payloadVersion: envelope.payloadVersion,
    userId: envelope.userId
  });
}

function normalizeServerSource(
  source: VlxSavedWord["source"]
): VlxServerSrsSyncSource {
  switch (source) {
    case "word_page":
    case "hub_page":
    case "extension":
    case "alias_search":
    case "app":
    case "exam_pack":
      return source;
    default:
      return "app";
  }
}

function createError(
  code: VlxServerSrsSyncError["code"],
  message: string,
  retryable = false
): VlxServerSrsSyncError {
  return {
    code,
    message,
    retryable
  };
}

function okResponse<TData>({
  data,
  serverTime,
  syncCursor,
  idempotencyKey,
  duplicateOf
}: {
  data: TData;
  serverTime: string;
  syncCursor?: string;
  idempotencyKey?: string;
  duplicateOf?: string;
}): VlxServerSrsSyncResponse<TData> {
  return {
    ok: true,
    data,
    serverTime,
    syncCursor,
    idempotencyKey,
    duplicateOf
  };
}

function errorResponse<TData>({
  error,
  serverTime,
  idempotencyKey
}: {
  error: VlxServerSrsSyncError;
  serverTime: string;
  idempotencyKey?: string;
}): VlxServerSrsSyncResponse<TData> {
  return {
    ok: false,
    error,
    serverTime,
    idempotencyKey
  };
}

function getProcessedResponse<TData>(
  store: VlxInMemoryServerSrsSyncStore,
  envelope: SpikeWriteEnvelope,
  serverTime: string
): VlxServerSrsSyncResponse<TData> | undefined {
  const processed = store.processedIdempotencyKeys[envelope.idempotencyKey];

  if (!processed) {
    return undefined;
  }

  if (
    processed.payloadFingerprint !==
    createIdempotencyPayloadFingerprint(envelope)
  ) {
    return errorResponse({
      error: createError(
        "idempotency_conflict",
        "Idempotency key was already used with a different payload."
      ),
      serverTime,
      idempotencyKey: envelope.idempotencyKey
    });
  }

  return {
    ...processed.response,
    duplicateOf: processed.idempotencyKey
  } as VlxServerSrsSyncResponse<TData>;
}

function rememberResponse<TData>(
  store: VlxInMemoryServerSrsSyncStore,
  envelope: SpikeWriteEnvelope,
  response: VlxServerSrsSyncResponse<TData>,
  processedAt: string
) {
  store.processedIdempotencyKeys[envelope.idempotencyKey] = {
    idempotencyKey: envelope.idempotencyKey,
    operation: envelope.operation,
    userId: envelope.userId,
    payloadFingerprint: createIdempotencyPayloadFingerprint(envelope),
    processedAt,
    response: response as VlxServerSrsSyncResponse<unknown>
  };
}

function validateWriteEnvelope(
  envelope: SpikeWriteEnvelope,
  expectedOperation: VlxServerSrsSyncOperation,
  serverTime: string
): VlxServerSrsSyncResponse<never> | null {
  if (!isNonEmptyString(envelope.idempotencyKey)) {
    return errorResponse({
      error: createError(
        "validation_error",
        "Server SRS sync spike writes require an idempotencyKey."
      ),
      serverTime
    });
  }

  if (!isNonEmptyString(envelope.userId)) {
    return errorResponse({
      error: createError("unauthenticated", "A spike userId is required."),
      serverTime,
      idempotencyKey: envelope.idempotencyKey
    });
  }

  if (envelope.operation !== expectedOperation) {
    return errorResponse({
      error: createError(
        "validation_error",
        `Expected ${expectedOperation} but received ${envelope.operation}.`
      ),
      serverTime,
      idempotencyKey: envelope.idempotencyKey
    });
  }

  return null;
}

function toServerSavedWord({
  savedWord,
  userId,
  now,
  existing
}: {
  savedWord: VlxSavedWord;
  userId: string;
  now: string;
  existing?: VlxServerSavedWord;
}): VlxServerSavedWord {
  return {
    ...savedWord,
    userId,
    active: true,
    archivedAt: undefined,
    lastSavedAt: savedWord.savedAt,
    sourceHistory: [
      ...(existing?.sourceHistory ?? []),
      {
        source: normalizeServerSource(savedWord.source),
        savedAt: savedWord.savedAt
      }
    ],
    serverCreatedAt: existing?.serverCreatedAt ?? now,
    serverUpdatedAt: now,
    version: (existing?.version ?? 0) + 1
  };
}

function toInitialServerReviewState(
  savedWord: VlxSavedWord,
  userId: string,
  createdAt: string
): VlxServerReviewStateItem {
  const reviewState = createReviewItemFromSavedWord(savedWord, createdAt);

  return {
    ...reviewState,
    userId,
    materializedFrom: "local_storage_migration",
    serverUpdatedAt: createdAt,
    version: 1
  };
}

function toServerReviewState({
  reviewState,
  userId,
  now,
  eventId,
  existing
}: {
  reviewState: VlxReviewStateItem;
  userId: string;
  now: string;
  eventId: string;
  existing?: VlxServerReviewStateItem;
}): VlxServerReviewStateItem {
  return {
    ...reviewState,
    userId,
    materializedFrom: "review_events",
    lastEventId: eventId,
    serverUpdatedAt: now,
    version: (existing?.version ?? 0) + 1
  };
}

function toServerDailyStats({
  dailyStats,
  userId,
  now,
  eventId,
  existing
}: {
  dailyStats: VlxDailyStatsItem;
  userId: string;
  now: string;
  eventId: string;
  existing?: VlxServerDailyStatsItem;
}): VlxServerDailyStatsItem {
  return {
    ...dailyStats,
    userId,
    derivedFromEventIds: [...(existing?.derivedFromEventIds ?? []), eventId],
    serverUpdatedAt: now
  };
}

function isValidReviewEventInput(
  event: VlxSubmitReviewEventRequest["payload"]["event"]
) {
  return (
    isNonEmptyString(event.eventId) &&
    isNonEmptyString(event.sessionId) &&
    isNonEmptyString(event.slug) &&
    isNonEmptyString(event.word) &&
    isNonEmptyString(event.answer) &&
    isNonEmptyString(event.createdAt) &&
    (event.result === "correct" || event.result === "wrong") &&
    Number.isFinite(event.responseMs) &&
    event.responseMs >= 0
  );
}

function filterRecordByUser<TItem extends { userId: string }>(
  record: Record<string, TItem>,
  userId: string,
  keySelector: (item: TItem) => string
) {
  return Object.values(record).reduce<Record<string, TItem>>((items, item) => {
    if (item.userId === userId) {
      items[keySelector(item)] = item;
    }

    return items;
  }, {});
}

function findReviewEventById(
  store: VlxInMemoryServerSrsSyncStore,
  userId: string,
  eventId: string
) {
  return store.reviewEvents.find(
    (event) => event.userId === userId && event.eventId === eventId
  );
}

function createFallbackDailyStats(
  userId: string,
  createdAt: string,
  now: string
): VlxServerDailyStatsItem {
  return {
    userId,
    date: getDateKey(createdAt),
    reviewed: 0,
    correct: 0,
    wrong: 0,
    mastered: 0,
    weakAdded: 0,
    minutes: 0,
    sessions: 0,
    derivedFromEventIds: [],
    serverUpdatedAt: now
  };
}

function upsertPackProgressFromReviewEvent({
  store,
  userId,
  event,
  now,
  idempotencyKey
}: {
  store: VlxInMemoryServerSrsSyncStore;
  userId: string;
  event: VlxServerSrsReducerInput & { packId?: string };
  now: string;
  idempotencyKey: string;
}) {
  if (!event.packId) {
    return undefined;
  }

  const key = userScopedKey(userId, event.packId);
  const existing = store.packProgress[key];
  const packProgress: VlxServerPackProgress = {
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
    userId,
    derivedFromEventIds: [
      ...(existing?.derivedFromEventIds ?? []),
      event.eventId
    ],
    idempotencyKeys: [...(existing?.idempotencyKeys ?? []), idempotencyKey],
    serverUpdatedAt: now,
    version: (existing?.version ?? 0) + 1
  };

  store.packProgress[key] = packProgress;

  return packProgress;
}

function toMutationResult(
  item: VlxPendingLocalQueueItem,
  status: VlxServerSyncMutationResult["status"],
  error?: VlxServerSrsSyncError,
  duplicateOf?: string
): VlxServerSyncMutationResult {
  return {
    queueId: item.queueId,
    clientMutationId: item.clientMutationId,
    idempotencyKey: item.idempotencyKey,
    operation: item.operation,
    status,
    serverMutationId: `spike-${item.queueId}`,
    duplicateOf,
    error
  };
}

export function createInMemoryServerSrsSyncService(
  options: CreateInMemoryServerSrsSyncServiceOptions = {}
) {
  const store = options.store ?? createInMemoryServerSrsSyncStore();
  const serverTime = options.now ?? DEFAULT_SPIKE_NOW;

  function saveWord(envelope: VlxSaveWordRequest): VlxSaveWordResponse {
    const invalid = validateWriteEnvelope(
      envelope,
      "save_word",
      serverTime
    );

    if (invalid) {
      return invalid;
    }

    const processed = getProcessedResponse<ResponseData<VlxSaveWordResponse>>(
      store,
      envelope,
      serverTime
    );

    if (processed) {
      return processed;
    }

    const savedWord = envelope.payload.savedWord;

    if (!isNonEmptyString(savedWord.slug) || !isNonEmptyString(savedWord.word)) {
      const response = errorResponse<ResponseData<VlxSaveWordResponse>>({
        error: createError("validation_error", "Saved word slug and word are required."),
        serverTime,
        idempotencyKey: envelope.idempotencyKey
      });
      rememberResponse(store, envelope, response, serverTime);
      return response;
    }

    const userId = envelope.userId as string;
    const key = userScopedKey(userId, savedWord.slug);
    const existingSavedWord = store.savedWords[key];
    const existingReviewState = store.reviewState[key];
    const duplicate = Boolean(existingSavedWord?.active);
    const reactivated = Boolean(existingSavedWord && !existingSavedWord.active);
    const serverSavedWord =
      duplicate && existingSavedWord
        ? existingSavedWord
        : toServerSavedWord({
            savedWord,
            userId,
            now: serverTime,
            existing: existingSavedWord
          });
    const reviewState =
      existingReviewState ??
      toInitialServerReviewState(savedWord, userId, savedWord.savedAt);

    if (!duplicate) {
      store.savedWords[key] = serverSavedWord;
    }

    if (!existingReviewState) {
      store.reviewState[key] = reviewState;
    }

    if (!duplicate || !existingReviewState) {
      advanceSyncCursor(store);
    }

    const response = okResponse<ResponseData<VlxSaveWordResponse>>({
      data: {
        savedWord: serverSavedWord,
        reviewState,
        created: !existingSavedWord,
        reactivated,
        duplicate
      },
      serverTime,
      syncCursor: createSyncCursor(store),
      idempotencyKey: envelope.idempotencyKey
    });

    rememberResponse(store, envelope, response, serverTime);

    return response;
  }

  function archiveWord(
    envelope: VlxArchiveWordRequest
  ): VlxArchiveWordResponse {
    const invalid = validateWriteEnvelope(
      envelope,
      "archive_word",
      serverTime
    );

    if (invalid) {
      return invalid;
    }

    const processed = getProcessedResponse<ResponseData<VlxArchiveWordResponse>>(
      store,
      envelope,
      serverTime
    );

    if (processed) {
      return processed;
    }

    const userId = envelope.userId as string;
    const key = userScopedKey(userId, envelope.payload.slug);
    const existingSavedWord = store.savedWords[key];

    if (!existingSavedWord) {
      const response = errorResponse<ResponseData<VlxArchiveWordResponse>>({
        error: createError("validation_error", "Saved word does not exist."),
        serverTime,
        idempotencyKey: envelope.idempotencyKey
      });
      rememberResponse(store, envelope, response, serverTime);
      return response;
    }

    const savedWord: VlxServerSavedWord = {
      ...existingSavedWord,
      active: false,
      archivedAt: envelope.payload.archivedAt,
      serverUpdatedAt: serverTime,
      version: existingSavedWord.version + 1
    };

    store.savedWords[key] = savedWord;
    advanceSyncCursor(store);

    const response = okResponse<ResponseData<VlxArchiveWordResponse>>({
      data: {
        savedWord,
        archived: true,
        reviewStatePreserved: true
      },
      serverTime,
      syncCursor: createSyncCursor(store),
      idempotencyKey: envelope.idempotencyKey
    });

    rememberResponse(store, envelope, response, serverTime);

    return response;
  }

  function submitReviewEvent(
    envelope: VlxSubmitReviewEventRequest
  ): VlxSubmitReviewEventResponse {
    const invalid = validateWriteEnvelope(
      envelope,
      "submit_review_event",
      serverTime
    );

    if (invalid) {
      return invalid;
    }

    const processed = getProcessedResponse<
      ResponseData<VlxSubmitReviewEventResponse>
    >(
      store,
      envelope,
      serverTime
    );

    if (processed) {
      return processed;
    }

    const eventInput = envelope.payload.event;

    if (!isValidReviewEventInput(eventInput)) {
      const response = errorResponse<
        ResponseData<VlxSubmitReviewEventResponse>
      >({
        error: createError("validation_error", "Review event payload is invalid."),
        serverTime,
        idempotencyKey: envelope.idempotencyKey
      });
      rememberResponse(store, envelope, response, serverTime);
      return response;
    }

    const userId = envelope.userId as string;
    const reducerInput: VlxServerSrsReducerInput = {
      ...eventInput,
      eventId: eventInput.eventId as string,
      sessionId: eventInput.sessionId as string,
      createdAt: eventInput.createdAt as string
    };
    const duplicateEvent = findReviewEventById(
      store,
      userId,
      reducerInput.eventId
    );

    if (duplicateEvent) {
      const key = userScopedKey(userId, duplicateEvent.slug);
      const dateKey = userScopedKey(userId, getDateKey(duplicateEvent.createdAt));
      const response = okResponse<ResponseData<VlxSubmitReviewEventResponse>>({
        data: {
          event: duplicateEvent,
          reviewState: store.reviewState[key],
          dailyStats:
            store.dailyStats[dateKey] ??
            createFallbackDailyStats(userId, duplicateEvent.createdAt, serverTime),
          packProgress: duplicateEvent.packId
            ? store.packProgress[userScopedKey(userId, duplicateEvent.packId)]
            : undefined,
          duplicate: true
        },
        serverTime,
        syncCursor: createSyncCursor(store),
        idempotencyKey: envelope.idempotencyKey,
        duplicateOf: duplicateEvent.idempotencyKey
      });

      rememberResponse(store, envelope, response, serverTime);

      return response;
    }

    const key = userScopedKey(userId, reducerInput.slug);
    const dateKey = userScopedKey(userId, getDateKey(reducerInput.createdAt));
    const previousReviewState = store.reviewState[key];
    const previousDailyStats = store.dailyStats[dateKey];
    const reduced = reduceServerReviewEvent(
      reducerInput,
      previousReviewState,
      previousDailyStats
    );
    const reviewState = toServerReviewState({
      reviewState: reduced.reviewState,
      userId,
      now: serverTime,
      eventId: reducerInput.eventId,
      existing: previousReviewState
    });
    const dailyStats = toServerDailyStats({
      dailyStats: reduced.dailyStats,
      userId,
      now: serverTime,
      eventId: reducerInput.eventId,
      existing: previousDailyStats
    });
    const serverEvent: VlxServerReviewEvent = {
      ...reduced.event,
      userId,
      idempotencyKey: envelope.idempotencyKey,
      receivedAt: serverTime,
      serverSequence: store.reviewEvents.length + 1,
      packId: eventInput.packId
    };
    const packProgress = upsertPackProgressFromReviewEvent({
      store,
      userId,
      event: {
        ...reducerInput,
        packId: eventInput.packId
      },
      now: serverTime,
      idempotencyKey: envelope.idempotencyKey
    });

    store.reviewEvents.push(serverEvent);
    store.reviewState[key] = reviewState;
    store.dailyStats[dateKey] = dailyStats;
    advanceSyncCursor(store);

    const response = okResponse<ResponseData<VlxSubmitReviewEventResponse>>({
      data: {
        event: serverEvent,
        reviewState,
        dailyStats,
        packProgress,
        duplicate: false
      },
      serverTime,
      syncCursor: createSyncCursor(store),
      idempotencyKey: envelope.idempotencyKey
    });

    rememberResponse(store, envelope, response, serverTime);

    return response;
  }

  function hydrateAccountState(userId: string): VlxHydrateAccountStateResponse {
    return okResponse({
      data: {
        userId,
        hydratedAt: serverTime,
        syncCursor: createSyncCursor(store),
        savedWords: filterRecordByUser(
          store.savedWords,
          userId,
          (item) => item.slug
        ),
        reviewState: filterRecordByUser(
          store.reviewState,
          userId,
          (item) => item.slug
        ),
        reviewEvents: store.reviewEvents.filter(
          (event) => event.userId === userId
        ),
        dailyStats: filterRecordByUser(
          store.dailyStats,
          userId,
          (item) => item.date
        ),
        packProgress: filterRecordByUser(
          store.packProgress,
          userId,
          (item) => item.packId
        )
      },
      serverTime,
      syncCursor: createSyncCursor(store)
    });
  }

  function fetchDueQueue(userId: string): VlxFetchDueQueueResponse {
    const dueBy = serverTime;
    const reviewState = filterRecordByUser(
      store.reviewState,
      userId,
      (item) => item.slug
    );

    return okResponse({
      data: {
        dueBy,
        items: selectDueReviewState(reviewState, dueBy)
      },
      serverTime,
      syncCursor: createSyncCursor(store)
    });
  }

  function fetchWeakQueue(userId: string): VlxFetchWeakQueueResponse {
    const reviewState = filterRecordByUser(
      store.reviewState,
      userId,
      (item) => item.slug
    );

    return okResponse({
      data: {
        items: selectWeakReviewState(reviewState)
      },
      serverTime,
      syncCursor: createSyncCursor(store)
    });
  }

  function fetchMasteredWords(userId: string): VlxFetchMasteredWordsResponse {
    const reviewState = filterRecordByUser(
      store.reviewState,
      userId,
      (item) => item.slug
    );

    return okResponse({
      data: {
        items: selectMasteredReviewState(reviewState)
      },
      serverTime,
      syncCursor: createSyncCursor(store)
    });
  }

  function syncPendingLocalQueue(
    envelope: VlxSyncPendingLocalQueueRequest
  ): VlxSyncPendingLocalQueueResponse {
    const invalid = validateWriteEnvelope(
      envelope,
      "sync_pending_local_queue",
      serverTime
    );

    if (invalid) {
      return invalid;
    }

    const processed =
      getProcessedResponse<ResponseData<VlxSyncPendingLocalQueueResponse>>(
        store,
        envelope,
        serverTime
      );

    if (processed) {
      return processed;
    }

    const accepted: VlxServerSyncMutationResult[] = [];
    const rejected: VlxServerSyncMutationResult[] = [];
    const retryable: VlxServerSyncMutationResult[] = [];

    for (const item of envelope.payload.items) {
      if (item.status === "retryable_error" || item.nextRetryAt) {
        retryable.push(
          toMutationResult(
            item,
            "retryable_error",
            item.lastError ??
              createError("server_unavailable", "Queued item is retryable.", true)
          )
        );
        continue;
      }

      const itemWithUser = {
        ...item,
        userId: item.userId ?? (envelope.userId as string)
      };
      let itemResponse: VlxServerSrsSyncResponse<unknown>;

      switch (item.operation) {
        case "save_word":
          itemResponse = saveWord(itemWithUser as VlxSaveWordRequest);
          break;
        case "archive_word":
          itemResponse = archiveWord(itemWithUser as VlxArchiveWordRequest);
          break;
        case "submit_review_event":
          itemResponse = submitReviewEvent(
            itemWithUser as VlxSubmitReviewEventRequest
          );
          break;
        default:
          itemResponse = errorResponse({
            error: createError(
              "validation_error",
              `Operation ${item.operation} is not supported by the spike queue.`
            ),
            serverTime,
            idempotencyKey: item.idempotencyKey
          });
      }

      if (itemResponse.ok) {
        accepted.push(
          toMutationResult(
            item,
            itemResponse.duplicateOf ? "conflict_resolved" : "synced",
            undefined,
            itemResponse.duplicateOf
          )
        );
      } else if (itemResponse.error.retryable) {
        retryable.push(toMutationResult(item, "retryable_error", itemResponse.error));
      } else {
        rejected.push(toMutationResult(item, "rejected", itemResponse.error));
      }
    }

    const response = okResponse<ResponseData<VlxSyncPendingLocalQueueResponse>>({
      data: {
        batchId: envelope.payload.batchId,
        accepted,
        rejected,
        retryable,
        hydrationRequired: false,
        syncCursor: createSyncCursor(store)
      },
      serverTime,
      syncCursor: createSyncCursor(store),
      idempotencyKey: envelope.idempotencyKey
    });

    rememberResponse(store, envelope, response, serverTime);

    return response;
  }

  return {
    store,
    saveWord,
    archiveWord,
    submitReviewEvent,
    hydrateAccountState,
    fetchDueQueue,
    fetchWeakQueue,
    fetchMasteredWords,
    syncPendingLocalQueue
  };
}
