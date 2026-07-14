import type { SupabaseClient } from "@supabase/supabase-js";

import {
  VLX_ACCOUNT_REVIEW_EVENTS_TABLE,
  VLX_ACCOUNT_SAVED_WORDS_TABLE,
} from "@/lib/account-persistence/supabase-staging/adapter";

import {
  VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT,
  VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT,
} from "./contracts";
import {
  validateReviewEventSummaryRows,
  validateSavedWordSummaryRows,
} from "./validator";

const SAVED_WORD_SUMMARY_COLUMNS = "owner_account_id,slug,saved_at";
const REVIEW_EVENT_SUMMARY_COLUMNS =
  "owner_account_id,event_id,created_at";

export type VlxAccountLearningSummaryReadClient = Pick<
  SupabaseClient,
  "auth" | "from"
>;

export type VlxAccountLearningSavedWordMarker = {
  owner_account_id: string;
  slug: string;
  saved_at: string;
};

export type VlxAccountLearningReviewEventMarker = {
  owner_account_id: string;
  event_id: string;
  created_at: string;
};

export type VlxAccountLearningEvidencePage = {
  ownerAccountId: string;
  savedWords: readonly VlxAccountLearningSavedWordMarker[];
  reviewEvents: readonly VlxAccountLearningReviewEventMarker[];
  complete: {
    savedWords: boolean;
    reviewEvents: boolean;
  };
};

export type VlxAccountLearningEvidenceReadResult =
  | {
      ok: true;
      data: VlxAccountLearningEvidencePage;
      bounded: true;
      mutatesServer: false;
      mutatesBrowser: false;
    }
  | {
      ok: false;
      error: {
        code: "provider_query_failed" | "invalid_provider_payload";
      };
      bounded: true;
      mutatesServer: false;
      mutatesBrowser: false;
    };

function rejected(
  code: "provider_query_failed" | "invalid_provider_payload"
): VlxAccountLearningEvidenceReadResult {
  return {
    ok: false,
    error: { code },
    bounded: true,
    mutatesServer: false,
    mutatesBrowser: false,
  };
}

export async function readSupabaseAccountLearningSummary({
  client,
  ownerAccountId,
}: {
  client: VlxAccountLearningSummaryReadClient;
  ownerAccountId: string;
}): Promise<VlxAccountLearningEvidenceReadResult> {
  let savedWordsResponse;
  let reviewEventsResponse;

  try {
    [savedWordsResponse, reviewEventsResponse] = await Promise.all([
      client
        .from(VLX_ACCOUNT_SAVED_WORDS_TABLE)
        .select(SAVED_WORD_SUMMARY_COLUMNS)
        .eq("owner_account_id", ownerAccountId)
        .order("saved_at", { ascending: true })
        .order("slug", { ascending: true })
        .limit(VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT + 1),
      client
        .from(VLX_ACCOUNT_REVIEW_EVENTS_TABLE)
        .select(REVIEW_EVENT_SUMMARY_COLUMNS)
        .eq("owner_account_id", ownerAccountId)
        .order("created_at", { ascending: true })
        .order("event_id", { ascending: true })
        .limit(VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT + 1),
    ]);
  } catch {
    return rejected("provider_query_failed");
  }

  if (savedWordsResponse.error || reviewEventsResponse.error) {
    return rejected("provider_query_failed");
  }

  const savedRows = validateSavedWordSummaryRows(savedWordsResponse.data);
  const reviewRows = validateReviewEventSummaryRows(reviewEventsResponse.data);

  if (!savedRows.ok || !reviewRows.ok) {
    return rejected("invalid_provider_payload");
  }

  if (
    savedRows.value.some((row) => row.owner_account_id !== ownerAccountId) ||
    reviewRows.value.some((row) => row.owner_account_id !== ownerAccountId) ||
    new Set(savedRows.value.map((row) => row.slug)).size !==
      savedRows.value.length ||
    new Set(reviewRows.value.map((row) => row.event_id)).size !==
      reviewRows.value.length
  ) {
    return rejected("invalid_provider_payload");
  }

  const savedWordsComplete =
    savedRows.value.length <= VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT;
  const reviewEventsComplete =
    reviewRows.value.length <= VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT;

  return {
    ok: true,
    data: {
      ownerAccountId,
      savedWords: savedRows.value.slice(
        0,
        VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT
      ),
      reviewEvents: reviewRows.value.slice(
        0,
        VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT
      ),
      complete: {
        savedWords: savedWordsComplete,
        reviewEvents: reviewEventsComplete,
      },
    },
    bounded: true,
    mutatesServer: false,
    mutatesBrowser: false,
  };
}

export const VLX_ACCOUNT_LEARNING_SUMMARY_QUERY_POLICY = {
  savedWordColumns: SAVED_WORD_SUMMARY_COLUMNS,
  reviewEventColumns: REVIEW_EVENT_SUMMARY_COLUMNS,
  savedWordRows: VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT + 1,
  reviewEventRows: VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT + 1,
  ownerFilterRequired: true,
  exactCountAllowed: false,
  rawLearningPayloadSelected: false,
  mutatingMethodsExposed: false,
} as const;
