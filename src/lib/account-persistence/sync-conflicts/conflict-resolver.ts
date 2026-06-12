import { countSnapshotItems } from "@/lib/account-persistence/local-snapshot";
import type {
  VlxAccountSyncConflictCategory,
  VlxAccountSyncConflictResolutionPlan,
  VlxAccountSyncConflictResolverInput,
  VlxAccountSyncPackProgress,
  VlxAccountSyncResolution,
  VlxAccountSyncResolutionAction,
  VlxAccountSyncResolutionSeverity,
  VlxAccountSyncResolutionSummary,
  VlxAccountSyncResolutionTarget,
  VlxAccountSyncReviewEventEvidence,
  VlxAccountSyncReviewState,
  VlxAccountSyncSavedWord,
  VlxAccountSyncServerState
} from "@/lib/account-persistence/sync-conflicts/conflict-types";
import { applyReviewAnswer } from "@/lib/srs/engine";
import type {
  VlxReviewAnswerInput,
  VlxReviewEvent,
  VlxReviewStateItem
} from "@/lib/srs/types";
import type { VlxUpgradeInterestRecord } from "@/lib/upgrade/upgrade-interest";

const RESOLUTION_ACTIONS: readonly VlxAccountSyncResolutionAction[] = [
  "import_to_server",
  "keep_server",
  "merge_event_evidence",
  "recompute_from_events",
  "skip_audit_only",
  "reject_blocked",
  "attribution_only",
  "no_op_duplicate"
];

const MASTERY_WEIGHT: Record<VlxReviewStateItem["mastery"], number> = {
  New: 0,
  Learning: 1,
  Weak: -1,
  Strong: 3,
  Mastered: 5
};

type ResolutionInput = {
  planId: string;
  category: VlxAccountSyncConflictCategory;
  action: VlxAccountSyncResolutionAction;
  target: VlxAccountSyncResolutionTarget;
  severity?: VlxAccountSyncResolutionSeverity;
  reason: string;
  slug?: string;
  eventId?: string;
  idempotencyKey?: string;
  packId?: string;
  interestId?: string;
  payloadType?: VlxAccountSyncResolution["payloadType"];
  localEvidenceCount?: number;
  serverEvidenceCount?: number;
  eventIds?: readonly string[];
  proposedReviewState?: VlxReviewStateItem;
  preservesReviewState?: boolean;
  preservesWeakEvidence?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readOptionalStringProperty(value: unknown, key: string) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const fieldValue = value[key];

  return isNonEmptyString(fieldValue) ? fieldValue : undefined;
}

function toSortedEntries<TItem>(record: Record<string, TItem> = {}) {
  return Object.entries(record).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function toSortedEvents(events: readonly VlxAccountSyncReviewEventEvidence[]) {
  return [...events].sort((left, right) => {
    const byDate = left.createdAt.localeCompare(right.createdAt);

    if (byDate !== 0) {
      return byDate;
    }

    return left.eventId.localeCompare(right.eventId);
  });
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

function createReviewEventPayload(event: VlxAccountSyncReviewEventEvidence) {
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

function createReviewEventFingerprint(
  event: VlxAccountSyncReviewEventEvidence
) {
  return event.payloadFingerprint ?? stableSerialize(createReviewEventPayload(event));
}

function getIdempotencyKey(event: VlxAccountSyncReviewEventEvidence) {
  return isNonEmptyString(event.idempotencyKey)
    ? event.idempotencyKey
    : undefined;
}

function createEmptySummary(): VlxAccountSyncResolutionSummary {
  return RESOLUTION_ACTIONS.reduce<VlxAccountSyncResolutionSummary>(
    (summary, action) => ({
      ...summary,
      [action]: 0
    }),
    {
      import_to_server: 0,
      keep_server: 0,
      merge_event_evidence: 0,
      recompute_from_events: 0,
      skip_audit_only: 0,
      reject_blocked: 0,
      attribution_only: 0,
      no_op_duplicate: 0
    }
  );
}

function createResolution({
  planId,
  category,
  action,
  target,
  severity,
  reason,
  slug,
  eventId,
  idempotencyKey,
  packId,
  interestId,
  payloadType,
  localEvidenceCount,
  serverEvidenceCount,
  eventIds,
  proposedReviewState,
  preservesReviewState,
  preservesWeakEvidence
}: ResolutionInput): VlxAccountSyncResolution {
  const key =
    slug ?? eventId ?? idempotencyKey ?? packId ?? interestId ?? payloadType ?? target;

  return {
    resolutionId: `${planId}:${target}:${category}:${key}`,
    category,
    action,
    target,
    severity:
      severity ??
      (action === "reject_blocked"
        ? "blocked"
        : action === "skip_audit_only"
          ? "warning"
          : "info"),
    reason,
    slug,
    eventId,
    idempotencyKey,
    packId,
    interestId,
    payloadType,
    localEvidenceCount,
    serverEvidenceCount,
    eventIds,
    proposedReviewState,
    preservesReviewState: preservesReviewState ?? true,
    preservesWeakEvidence: preservesWeakEvidence ?? false,
    importsLocalMasteryLabel: false,
    grantsPaidEntitlement: false,
    mutatesRuntimeStorage: false,
    callsNetwork: false
  };
}

function createUnsupportedPayloadResolution({
  planId,
  payloadType,
  reason,
  slug,
  eventId,
  packId,
  interestId
}: {
  planId: string;
  payloadType: NonNullable<VlxAccountSyncResolution["payloadType"]>;
  reason: string;
  slug?: string;
  eventId?: string;
  packId?: string;
  interestId?: string;
}) {
  return createResolution({
    planId,
    category: "unsupported_payload",
    action: "reject_blocked",
    target: "payload",
    severity: "blocked",
    reason,
    slug,
    eventId,
    packId,
    interestId,
    payloadType,
    preservesReviewState: true
  });
}

function isValidSavedWord(value: unknown): value is VlxAccountSyncSavedWord {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    isNonEmptyString(value.savedAt)
  );
}

function isValidReviewEvent(
  value: unknown
): value is VlxAccountSyncReviewEventEvidence {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.eventId) &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    isNonEmptyString(value.questionType) &&
    isNonEmptyString(value.answer) &&
    (value.result === "correct" || value.result === "wrong") &&
    isFiniteNumber(value.responseMs) &&
    value.responseMs >= 0 &&
    isNonEmptyString(value.createdAt) &&
    isFiniteNumber(value.boxBefore) &&
    isFiniteNumber(value.boxAfter) &&
    isFiniteNumber(value.weakScoreBefore) &&
    isFiniteNumber(value.weakScoreAfter)
  );
}

function isValidReviewState(
  value: unknown
): value is VlxAccountSyncReviewState {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.word) &&
    isFiniteNumber(value.box) &&
    Number.isInteger(value.box) &&
    value.box >= 0 &&
    value.box <= 5 &&
    (value.mastery === "New" ||
      value.mastery === "Learning" ||
      value.mastery === "Weak" ||
      value.mastery === "Strong" ||
      value.mastery === "Mastered") &&
    isFiniteNumber(value.correct) &&
    isFiniteNumber(value.wrong) &&
    isFiniteNumber(value.streakCorrect) &&
    isFiniteNumber(value.weakScore) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.updatedAt)
  );
}

function isValidPackProgress(
  value: unknown
): value is VlxAccountSyncPackProgress {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.packId) &&
    isFiniteNumber(value.reviewedCount) &&
    isFiniteNumber(value.correctCount) &&
    (value.source === "packs_page" ||
      value.source === "pack_detail" ||
      value.source === "review")
  );
}

function isValidUpgradeInterest(
  value: unknown
): value is VlxUpgradeInterestRecord {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id) &&
    (value.plan === "lite" || value.plan === "pro") &&
    isNonEmptyString(value.source) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.pagePath)
  );
}

function toReviewAnswerInput(event: VlxReviewEvent): VlxReviewAnswerInput {
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

function recomputeReviewStateFromEvents({
  baseState,
  events
}: {
  baseState?: VlxReviewStateItem;
  events: readonly VlxAccountSyncReviewEventEvidence[];
}) {
  return toSortedEvents(events).reduce<VlxReviewStateItem | undefined>(
    (currentState, event) =>
      applyReviewAnswer(toReviewAnswerInput(event), {
        currentState,
        countSession: false
      }).state,
    baseState
  );
}

function stateStrengthScore(state: VlxReviewStateItem) {
  return (
    state.box * 100 +
    MASTERY_WEIGHT[state.mastery] * 20 +
    state.correct * 4 +
    state.streakCorrect * 2 -
    state.wrong * 8 -
    state.weakScore * 70
  );
}

function compareStateStrength(
  left: VlxReviewStateItem,
  right: VlxReviewStateItem
) {
  return stateStrengthScore(left) - stateStrengthScore(right);
}

function hasWeakEvidence(events: readonly VlxAccountSyncReviewEventEvidence[]) {
  return events.some((event) => event.result === "wrong");
}

function hasSufficientMasteryEvidence({
  proposedState,
  events
}: {
  proposedState?: VlxReviewStateItem;
  events: readonly VlxAccountSyncReviewEventEvidence[];
}) {
  const correctEvents = events.filter((event) => event.result === "correct");

  return (
    proposedState?.mastery === "Mastered" &&
    correctEvents.length >= 5 &&
    events.length >= 5
  );
}

function groupEventsBySlug(
  events: readonly VlxAccountSyncReviewEventEvidence[]
) {
  return events.reduce<Record<string, VlxAccountSyncReviewEventEvidence[]>>(
    (groups, event) => {
      groups[event.slug] = [...(groups[event.slug] ?? []), event];
      return groups;
    },
    {}
  );
}

function getPackId(event: VlxAccountSyncReviewEventEvidence) {
  return isNonEmptyString(event.packId) ? event.packId : undefined;
}

function normalizeServerState(
  serverState?: VlxAccountSyncServerState
): Required<
  Pick<
    VlxAccountSyncServerState,
    "savedWords" | "reviewState" | "reviewEvents" | "packProgress" | "upgradeInterest"
  >
> {
  return {
    savedWords: serverState?.savedWords ?? {},
    reviewState: serverState?.reviewState ?? {},
    reviewEvents: serverState?.reviewEvents ?? [],
    packProgress: serverState?.packProgress ?? {},
    upgradeInterest: serverState?.upgradeInterest ?? []
  };
}

export function resolveAccountSyncConflicts(
  input: VlxAccountSyncConflictResolverInput
): VlxAccountSyncConflictResolutionPlan {
  const planId =
    input.planId ??
    `account-sync-conflicts-${input.localSnapshot.snapshotId}-${input.accountId}`;
  const serverState = normalizeServerState(input.serverState);
  const localStores = input.localSnapshot.stores;
  const resolutions: VlxAccountSyncResolution[] = [];
  const serverSavedSlugs = new Set(Object.keys(serverState.savedWords));
  const serverReviewEventIds = new Set(
    serverState.reviewEvents.map((event) => event.eventId)
  );
  const serverEventsBySlug = groupEventsBySlug(serverState.reviewEvents);
  const serverIdempotency = new Map<string, string>();
  const mergeableLocalEvents: VlxAccountSyncReviewEventEvidence[] = [];
  const localReviewEventIds = new Set<string>();
  const localIdempotency = new Map<string, string>();

  for (const event of serverState.reviewEvents) {
    const idempotencyKey = getIdempotencyKey(event);

    if (idempotencyKey) {
      serverIdempotency.set(idempotencyKey, createReviewEventFingerprint(event));
    }
  }

  for (const [slug, savedWord] of toSortedEntries(localStores.savedWords)) {
    if (!isValidSavedWord(savedWord)) {
      resolutions.push(
        createUnsupportedPayloadResolution({
          planId,
          payloadType: "saved_word",
          reason: "Saved word payload must include slug, word, and savedAt.",
          slug
        })
      );
      continue;
    }

    if (serverSavedSlugs.has(slug)) {
      resolutions.push(
        createResolution({
          planId,
          category: "duplicate_saved_word",
          action: "no_op_duplicate",
          target: "saved_word",
          reason:
            "The saved word already exists on the server. Keep server review_state intact.",
          slug,
          preservesReviewState: true
        })
      );
      continue;
    }

    resolutions.push(
      createResolution({
        planId,
        category: "local_only_saved_word",
        action: "import_to_server",
        target: "saved_word",
        reason:
          "Local saved word is absent from server state and can be imported without resetting review_state.",
        slug,
        preservesReviewState: true
      })
    );
  }

  for (const slug of Object.keys(serverState.savedWords).sort()) {
    if (!localStores.savedWords[slug]) {
      resolutions.push(
        createResolution({
          planId,
          category: "server_only_saved_word",
          action: "keep_server",
          target: "saved_word",
          reason: "Saved word exists only on the server and remains authoritative.",
          slug,
          preservesReviewState: true
        })
      );
    }
  }

  toSortedEvents(localStores.reviewEvents).forEach((event) => {
    if (!isValidReviewEvent(event)) {
      resolutions.push(
        createUnsupportedPayloadResolution({
          planId,
          payloadType: "review_event",
          reason:
            "Review event payload must include eventId, sessionId, slug, result, timing, and SRS evidence fields.",
          eventId: readOptionalStringProperty(event as unknown, "eventId")
        })
      );
      return;
    }

    const idempotencyKey = getIdempotencyKey(event);
    const fingerprint = createReviewEventFingerprint(event);
    const existingServerFingerprint = idempotencyKey
      ? serverIdempotency.get(idempotencyKey)
      : undefined;
    const existingLocalFingerprint = idempotencyKey
      ? localIdempotency.get(idempotencyKey)
      : undefined;

    if (
      idempotencyKey &&
      existingServerFingerprint &&
      existingServerFingerprint !== fingerprint
    ) {
      resolutions.push(
        createResolution({
          planId,
          category: "idempotency_key_payload_conflict",
          action: "reject_blocked",
          target: "review_event",
          severity: "blocked",
          reason:
            "The idempotency key already exists with a different review-event payload.",
          slug: event.slug,
          eventId: event.eventId,
          idempotencyKey,
          preservesWeakEvidence: event.result === "wrong"
        })
      );
      return;
    }

    if (
      idempotencyKey &&
      existingLocalFingerprint &&
      existingLocalFingerprint !== fingerprint
    ) {
      resolutions.push(
        createResolution({
          planId,
          category: "idempotency_key_payload_conflict",
          action: "reject_blocked",
          target: "review_event",
          severity: "blocked",
          reason:
            "The local snapshot reused an idempotency key with a different review-event payload.",
          slug: event.slug,
          eventId: event.eventId,
          idempotencyKey,
          preservesWeakEvidence: event.result === "wrong"
        })
      );
      return;
    }

    if (idempotencyKey) {
      localIdempotency.set(idempotencyKey, fingerprint);
    }

    if (
      serverReviewEventIds.has(event.eventId) ||
      localReviewEventIds.has(event.eventId) ||
      Boolean(existingServerFingerprint)
    ) {
      resolutions.push(
        createResolution({
          planId,
          category: "duplicate_review_event",
          action: "no_op_duplicate",
          target: "review_event",
          reason:
            "Review event evidence already exists and must not advance SRS twice.",
          slug: event.slug,
          eventId: event.eventId,
          idempotencyKey,
          preservesWeakEvidence: event.result === "wrong"
        })
      );
      localReviewEventIds.add(event.eventId);
      return;
    }

    localReviewEventIds.add(event.eventId);
    mergeableLocalEvents.push(event);
    resolutions.push(
      createResolution({
        planId,
        category: "local_review_event_not_on_server",
        action: "merge_event_evidence",
        target: "review_event",
        reason:
          "Local review event is new evidence and should be merged before recomputing review state.",
        slug: event.slug,
        eventId: event.eventId,
        idempotencyKey,
        preservesWeakEvidence: event.result === "wrong"
      })
    );
  });

  const localEventsBySlug = groupEventsBySlug(mergeableLocalEvents);
  const reviewStateSlugs = new Set([
    ...Object.keys(localStores.reviewState),
    ...Object.keys(serverState.reviewState),
    ...mergeableLocalEvents.map((event) => event.slug)
  ]);

  for (const slug of [...reviewStateSlugs].sort()) {
    const localReviewState = localStores.reviewState[slug];
    const serverReviewState = serverState.reviewState[slug];
    const localEvents = localEventsBySlug[slug] ?? [];
    const serverEvents = serverEventsBySlug[slug] ?? [];

    if (localReviewState && !isValidReviewState(localReviewState)) {
      resolutions.push(
        createUnsupportedPayloadResolution({
          planId,
          payloadType: "review_state",
          reason:
            "Review state payload must include slug, word, box, mastery, counts, weakScore, and timestamps.",
          slug
        })
      );
      continue;
    }

    const proposedReviewState =
      localEvents.length > 0
        ? recomputeReviewStateFromEvents({
            baseState: serverReviewState,
            events: localEvents
          })
        : undefined;
    const allReviewEvents = [...serverEvents, ...localEvents];

    if (
      localReviewState &&
      (localReviewState.mastery === "Mastered" || localReviewState.box === 5) &&
      !hasSufficientMasteryEvidence({
        proposedState: proposedReviewState ?? serverReviewState,
        events: allReviewEvents
      })
    ) {
      resolutions.push(
        createResolution({
          planId,
          category: "fake_mastery_risk",
          action: "reject_blocked",
          target: "review_state",
          severity: "blocked",
          reason:
            "Local Mastered state cannot be imported from review_state alone; delayed review-event evidence is required.",
          slug,
          localEvidenceCount: localEvents.length,
          serverEvidenceCount: serverEvents.length,
          eventIds: allReviewEvents.map((event) => event.eventId),
          proposedReviewState,
          preservesWeakEvidence: hasWeakEvidence(localEvents)
        })
      );
      continue;
    }

    if (localEvents.length > 0 && proposedReviewState) {
      let category: VlxAccountSyncConflictCategory = "stale_review_state";

      if (serverReviewState) {
        const comparison = compareStateStrength(
          proposedReviewState,
          serverReviewState
        );

        category =
          comparison < 0
            ? "local_weaker_than_server"
            : comparison > 0
              ? "server_weaker_than_local"
              : "stale_review_state";
      } else if (localReviewState) {
        category =
          compareStateStrength(proposedReviewState, localReviewState) >= 0
            ? "local_stronger_than_server"
            : "stale_review_state";
      }

      resolutions.push(
        createResolution({
          planId,
          category,
          action: "recompute_from_events",
          target: "review_state",
          reason:
            "Review events are source-of-truth evidence, so review_state should be recomputed from merged events.",
          slug,
          localEvidenceCount: localEvents.length,
          serverEvidenceCount: serverEvents.length,
          eventIds: allReviewEvents.map((event) => event.eventId),
          proposedReviewState,
          preservesWeakEvidence: hasWeakEvidence(localEvents)
        })
      );
      continue;
    }

    if (localReviewState && serverReviewState) {
      const comparison = compareStateStrength(localReviewState, serverReviewState);
      const category: VlxAccountSyncConflictCategory =
        comparison > 0
          ? "local_stronger_than_server"
          : comparison < 0
            ? "server_stronger_than_local"
            : "stale_review_state";

      resolutions.push(
        createResolution({
          planId,
          category,
          action: "keep_server",
          target: "review_state",
          severity: category === "stale_review_state" ? "warning" : "info",
          reason:
            "Local review_state has no new review-event evidence, so server state is preserved.",
          slug,
          localEvidenceCount: 0,
          serverEvidenceCount: serverEvents.length,
          eventIds: serverEvents.map((event) => event.eventId),
          preservesWeakEvidence: false
        })
      );
      continue;
    }

    if (localReviewState && !serverReviewState) {
      resolutions.push(
        createResolution({
          planId,
          category: "stale_review_state",
          action: "skip_audit_only",
          target: "review_state",
          severity: "warning",
          reason:
            "Local review_state exists without review-event evidence and remains audit-only.",
          slug,
          localEvidenceCount: 0,
          serverEvidenceCount: 0,
          preservesWeakEvidence: localReviewState.mastery === "Weak"
        })
      );
    }
  }

  const eventPackIds = new Set(
    [...serverState.reviewEvents, ...mergeableLocalEvents]
      .map((event) => getPackId(event))
      .filter((packId): packId is string => Boolean(packId))
  );

  for (const [packId, packProgress] of toSortedEntries(localStores.packProgress)) {
    if (!isValidPackProgress(packProgress)) {
      resolutions.push(
        createUnsupportedPayloadResolution({
          planId,
          payloadType: "pack_progress",
          reason:
            "Pack progress payload must include packId, reviewedCount, correctCount, and source.",
          packId
        })
      );
      continue;
    }

    if (!eventPackIds.has(packId)) {
      resolutions.push(
        createResolution({
          planId,
          category: "pack_progress_without_event_evidence",
          action: "skip_audit_only",
          target: "pack_progress",
          severity: "warning",
          reason:
            "Pack progress without review-event evidence cannot update account progress.",
          packId,
          localEvidenceCount: 0,
          serverEvidenceCount: 0
        })
      );
      continue;
    }

    resolutions.push(
      createResolution({
        planId,
        category: "pack_progress_without_event_evidence",
        action: "recompute_from_events",
        target: "pack_progress",
        reason:
          "Pack progress has event evidence and should be recomputed by the backend adapter.",
        packId,
        localEvidenceCount: mergeableLocalEvents.filter(
          (event) => getPackId(event) === packId
        ).length,
        serverEvidenceCount: serverState.reviewEvents.filter(
          (event) => getPackId(event) === packId
        ).length
      })
    );
  }

  localStores.upgradeInterest.forEach((upgradeInterest) => {
    if (!isValidUpgradeInterest(upgradeInterest)) {
      resolutions.push(
        createUnsupportedPayloadResolution({
          planId,
          payloadType: "upgrade_interest",
          reason:
            "Upgrade interest payload must include id, plan, source, createdAt, and pagePath.",
          interestId: readOptionalStringProperty(upgradeInterest as unknown, "id")
        })
      );
      return;
    }

    resolutions.push(
      createResolution({
        planId,
        category: "upgrade_interest_attribution_only",
        action: "attribution_only",
        target: "upgrade_interest",
        reason:
          "Upgrade interest is attribution-only and must never create paid entitlement.",
        interestId: upgradeInterest.id,
        preservesReviewState: true
      })
    );
  });

  const summary = createEmptySummary();

  for (const resolution of resolutions) {
    summary[resolution.action] += 1;
  }

  const blockedCount = resolutions.filter(
    (resolution) => resolution.action === "reject_blocked"
  ).length;

  return {
    planId,
    accountId: input.accountId,
    snapshotId: input.localSnapshot.snapshotId,
    createdAt: input.createdAt ?? input.localSnapshot.capturedAt,
    status: blockedCount > 0 ? "blocked" : "preview_only",
    counts: countSnapshotItems(input.localSnapshot),
    resolutions,
    conflictCount: resolutions.length,
    blockedCount,
    summary,
    sourceOfTruth:
      mergeableLocalEvents.length > 0
        ? "review_events_first"
        : "server_preserved_when_local_evidence_missing",
    mutatesRuntimeStorage: false,
    callsNetwork: false,
    readsLocalStorage: false,
    readsProcessEnv: false,
    importsAuthProviderSdk: false,
    importsDatabaseSdk: false,
    importsPaymentSdk: false,
    grantsPaidEntitlement: false,
    paidEntitlementPolicy: "never_grant_from_conflict_resolution"
  };
}

export function findAccountSyncResolution(
  plan: VlxAccountSyncConflictResolutionPlan,
  category: VlxAccountSyncConflictCategory
) {
  return plan.resolutions.find(
    (resolution) => resolution.category === category
  );
}
