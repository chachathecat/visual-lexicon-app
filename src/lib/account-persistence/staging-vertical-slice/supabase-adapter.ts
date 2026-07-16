import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseStagingLearningEvidenceAdapter } from "@/lib/account-persistence/supabase-staging/adapter";

import {
  VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
  VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
  VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT,
  VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES,
  type VlxAccountLearningApplyInput,
  type VlxAccountLearningApplyProviderOutcome,
} from "./contracts";
import { validateAccountLearningApplyProviderOutcome } from "./validator";

export const VLX_ACCOUNT_LEARNING_APPLY_RPC =
  "vlx_account_learning_apply" as const;

const ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

export type VlxAccountLearningApplyAdapterErrorCode =
  | "invalid_configuration"
  | "invalid_authenticated_session"
  | "provider_call_failed"
  | "invalid_provider_payload";

export type VlxAccountLearningApplyAdapterResult =
  | {
      ok: true;
      ownerAccountId: string;
      outcome: VlxAccountLearningApplyProviderOutcome;
      callsNetwork: true;
    }
  | {
      ok: false;
      error: { code: VlxAccountLearningApplyAdapterErrorCode };
      callsNetwork: boolean;
    };

export type VlxAccountLearningHydrationPage = {
  savedWords: VlxAccountLearningApplyInput["savedWord"][];
  reviewEvents: VlxAccountLearningApplyInput["reviewEvent"][];
};

export type VlxAccountLearningHydrationAdapterResult =
  | {
      ok: true;
      ownerAccountId: string;
      data: VlxAccountLearningHydrationPage;
      bounded: true;
    }
  | {
      ok: false;
      error: {
        code:
          | "invalid_authenticated_session"
          | "provider_query_failed"
          | "invalid_provider_payload";
      };
      bounded: true;
    };

type ApplyClient = Pick<SupabaseClient, "auth" | "rpc">;
type HydrateClient = Pick<SupabaseClient, "auth" | "from">;

function hasStrongCapability(value: string) {
  return new TextEncoder().encode(value).byteLength >=
    VLX_ACCOUNT_LEARNING_WRITE_CAPABILITY_MIN_BYTES;
}

async function readExpectedOwner(
  client: Pick<SupabaseClient, "auth">,
  expectedOwnerAccountId: string
) {
  try {
    const response = await client.auth.getUser();
    const user = response.data.user;

    return !response.error &&
      user?.id === expectedOwnerAccountId &&
      user.is_anonymous === false &&
      ACCOUNT_ID_PATTERN.test(expectedOwnerAccountId)
      ? expectedOwnerAccountId
      : null;
  } catch {
    return null;
  }
}

export async function applySupabaseAccountLearningVerticalSlice({
  client,
  expectedOwnerAccountId,
  input,
  idempotencyKey,
  writeCapability,
  deploymentSha,
}: {
  client: ApplyClient;
  expectedOwnerAccountId: string;
  input: VlxAccountLearningApplyInput;
  idempotencyKey: string;
  writeCapability: string;
  deploymentSha: string;
}): Promise<VlxAccountLearningApplyAdapterResult> {
  if (
    !hasStrongCapability(writeCapability) ||
    !COMMIT_SHA_PATTERN.test(deploymentSha)
  ) {
    return {
      ok: false,
      error: { code: "invalid_configuration" },
      callsNetwork: false,
    };
  }

  const ownerAccountId = await readExpectedOwner(
    client,
    expectedOwnerAccountId
  );

  if (!ownerAccountId) {
    return {
      ok: false,
      error: { code: "invalid_authenticated_session" },
      callsNetwork: true,
    };
  }

  let response: { data: unknown; error: unknown };

  try {
    response = await client
      .rpc(VLX_ACCOUNT_LEARNING_APPLY_RPC, {
        p_idempotency_key: idempotencyKey,
        p_write_capability: writeCapability,
        p_deployment_sha: deploymentSha,
        p_saved_at: input.savedWord.savedAt,
        p_event_id: input.reviewEvent.eventId,
        p_session_id: input.reviewEvent.sessionId,
        p_created_at: input.reviewEvent.createdAt,
        p_response_ms: input.reviewEvent.responseMs,
      })
      .retry(false);
  } catch {
    return {
      ok: false,
      error: { code: "provider_call_failed" },
      callsNetwork: true,
    };
  }

  if (response.error) {
    return {
      ok: false,
      error: { code: "provider_call_failed" },
      callsNetwork: true,
    };
  }

  const parsed = validateAccountLearningApplyProviderOutcome(response.data);

  if (!parsed.ok) {
    return {
      ok: false,
      error: { code: "invalid_provider_payload" },
      callsNetwork: true,
    };
  }

  return {
    ok: true,
    ownerAccountId,
    outcome: parsed.value,
    callsNetwork: true,
  };
}

function isCanonicalSavedWord(
  value: VlxAccountLearningHydrationPage["savedWords"][number]
) {
  return (
    value.slug === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.slug &&
    value.word === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.word &&
    value.image === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.image &&
    value.definition === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.definition &&
    value.hub === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.hub &&
    value.source === VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.source
  );
}

function isCanonicalReviewEvent(
  value: VlxAccountLearningHydrationPage["reviewEvents"][number]
) {
  return (
    value.slug === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.slug &&
    value.word === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.word &&
    value.hub === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.hub &&
    value.questionType ===
      VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.questionType &&
    value.selected === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.selected &&
    value.answer === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.answer &&
    value.result === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.result &&
    value.usedHint === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.usedHint &&
    value.confidence ===
      VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.confidence &&
    value.boxBefore === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.boxBefore &&
    value.boxAfter === VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.boxAfter &&
    value.weakScoreBefore ===
      VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.weakScoreBefore &&
    value.weakScoreAfter ===
      VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.weakScoreAfter
  );
}

export async function readSupabaseAccountLearningVerticalSlice({
  client,
  expectedOwnerAccountId,
}: {
  client: HydrateClient;
  expectedOwnerAccountId: string;
}): Promise<VlxAccountLearningHydrationAdapterResult> {
  const adapter = createSupabaseStagingLearningEvidenceAdapter({
    client: client as Pick<SupabaseClient, "auth" | "from">,
  });
  const [savedWords, reviewEvents] = await Promise.all([
    adapter.readOwnerSavedWords({
      limit: VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT + 1,
    }),
    adapter.readOwnerReviewEvents({
      limit: VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT + 1,
    }),
  ]);

  if (!savedWords.ok || !reviewEvents.ok) {
    const providerFailure = [savedWords, reviewEvents].some(
      (result) =>
        !result.ok && result.error.code === "provider_query_failed"
    );
    const invalidPayload = [savedWords, reviewEvents].some(
      (result) =>
        !result.ok && result.error.code === "invalid_provider_payload"
    );

    return {
      ok: false,
      error: {
        code: providerFailure
          ? "provider_query_failed"
          : invalidPayload
            ? "invalid_provider_payload"
            : "invalid_authenticated_session",
      },
      bounded: true,
    };
  }

  if (
    savedWords.data.ownerAccountId !== expectedOwnerAccountId ||
    reviewEvents.data.ownerAccountId !== expectedOwnerAccountId ||
    savedWords.data.items.length > VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT ||
    reviewEvents.data.items.length > VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT ||
    savedWords.data.items.length !== reviewEvents.data.items.length
  ) {
    return {
      ok: false,
      error: { code: "invalid_provider_payload" },
      bounded: true,
    };
  }

  const canonicalSavedWords = savedWords.data.items as VlxAccountLearningHydrationPage["savedWords"];
  const canonicalReviewEvents = reviewEvents.data.items as VlxAccountLearningHydrationPage["reviewEvents"];

  if (
    canonicalSavedWords.some((item) => !isCanonicalSavedWord(item)) ||
    canonicalReviewEvents.some((item) => !isCanonicalReviewEvent(item))
  ) {
    return {
      ok: false,
      error: { code: "invalid_provider_payload" },
      bounded: true,
    };
  }

  return {
    ok: true,
    ownerAccountId: expectedOwnerAccountId,
    data: {
      savedWords: [...canonicalSavedWords],
      reviewEvents: [...canonicalReviewEvents],
    },
    bounded: true,
  };
}
