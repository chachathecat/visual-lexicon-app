import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountPrincipal } from "@/lib/account-runtime/types";
import type { VlxAccountSyncReviewEventEvidence } from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type {
  VlxQuestionType,
  VlxReviewConfidence,
  VlxReviewResult,
  VlxSavedWord,
  VlxSavedWordSource,
} from "@/lib/srs/types";

export const VLX_ACCOUNT_LEARNING_PERSISTENCE_ENVIRONMENT =
  "staging_only" as const;
export const VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED = false as const;
export const VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED = false as const;

export const VLX_ACCOUNT_SAVED_WORDS_TABLE = "account_saved_words" as const;
export const VLX_ACCOUNT_REVIEW_EVENTS_TABLE = "account_review_events" as const;

export const VLX_ACCOUNT_SAVED_WORDS_DEFAULT_LIMIT = 200;
export const VLX_ACCOUNT_SAVED_WORDS_MAX_LIMIT = 500;
export const VLX_ACCOUNT_REVIEW_EVENTS_DEFAULT_LIMIT = 500;
export const VLX_ACCOUNT_REVIEW_EVENTS_MAX_LIMIT = 1_000;

const SAVED_WORD_COLUMNS = [
  "owner_account_id",
  "slug",
  "word",
  "image",
  "definition",
  "hub",
  "source",
  "saved_at",
].join(",");

const REVIEW_EVENT_COLUMNS = [
  "owner_account_id",
  "event_id",
  "session_id",
  "slug",
  "word",
  "hub",
  "question_type",
  "selected",
  "answer",
  "result",
  "response_ms",
  "used_hint",
  "confidence",
  "created_at",
  "box_before",
  "box_after",
  "weak_score_before",
  "weak_score_after",
].join(",");

const SUPABASE_ACCOUNT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAVED_WORD_SOURCES = new Set<VlxSavedWordSource>([
  "word_page",
  "hub_page",
  "extension",
  "alias_search",
  "app",
  "exam_pack",
  "manual",
]);

const QUESTION_TYPES = new Set<VlxQuestionType>([
  "image_to_word",
  "definition_to_word",
  "word_to_image",
  "cloze",
  "confusable_pair",
  "saved_review",
  "due_review",
  "weak_review",
  "exam_pack",
]);

const REVIEW_RESULTS = new Set<VlxReviewResult>(["correct", "wrong"]);
const REVIEW_CONFIDENCE = new Set<VlxReviewConfidence>([
  "knew",
  "guessed",
  "forgot",
]);

export type VlxSupabaseStagingReadErrorCode =
  | "invalid_server_principal"
  | "invalid_limit"
  | "provider_query_failed"
  | "invalid_provider_payload";

export type VlxSupabaseStagingReadError = {
  code: VlxSupabaseStagingReadErrorCode;
  message: string;
  retryable: boolean;
  rowIndex?: number;
};

type VlxSupabaseStagingResultMetadata = {
  environment: typeof VLX_ACCOUNT_LEARNING_PERSISTENCE_ENVIRONMENT;
  runtimeConnected: typeof VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED;
  mutationsEnabled: typeof VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED;
  mutatesLearningState: false;
  productionDataAccessAllowed: false;
  grantsPaidEntitlement: false;
  touchesBilling: false;
};

export type VlxSupabaseStagingReadResult<TData> =
  | (VlxSupabaseStagingResultMetadata & {
      ok: true;
      data: TData;
      callsNetwork: true;
    })
  | (VlxSupabaseStagingResultMetadata & {
      ok: false;
      error: VlxSupabaseStagingReadError;
      callsNetwork: boolean;
    });

export type VlxSupabaseStagingSavedWordsPage = {
  ownerAccountId: string;
  items: VlxSavedWord[];
  limit: number;
  bounded: true;
};

export type VlxSupabaseStagingReviewEventsPage = {
  ownerAccountId: string;
  items: VlxAccountSyncReviewEventEvidence[];
  limit: number;
  bounded: true;
};

export type VlxSupabaseStagingLearningEvidenceAdapter = {
  readonly provider: "supabase_postgres";
  readonly environment: typeof VLX_ACCOUNT_LEARNING_PERSISTENCE_ENVIRONMENT;
  readonly runtimeConnected: typeof VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED;
  readonly mutationsEnabled: typeof VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED;
  readOwnerSavedWords(
    principal: AccountPrincipal,
    options?: { limit?: number }
  ): Promise<VlxSupabaseStagingReadResult<VlxSupabaseStagingSavedWordsPage>>;
  readOwnerReviewEvents(
    principal: AccountPrincipal,
    options?: { limit?: number }
  ): Promise<VlxSupabaseStagingReadResult<VlxSupabaseStagingReviewEventsPage>>;
};

type VlxSupabaseReadClient = Pick<SupabaseClient, "from">;

type SavedWordRow = {
  owner_account_id: string;
  slug: string;
  word: string;
  image: string | null;
  definition: string | null;
  hub: string | null;
  source: VlxSavedWordSource | null;
  saved_at: string;
};

type ReviewEventRow = {
  owner_account_id: string;
  event_id: string;
  session_id: string;
  slug: string;
  word: string;
  hub: string | null;
  question_type: VlxQuestionType;
  selected: string | null;
  answer: string;
  result: VlxReviewResult;
  response_ms: number;
  used_hint: boolean | null;
  confidence: VlxReviewConfidence | null;
  created_at: string;
  box_before: number;
  box_after: number;
  weak_score_before: number;
  weak_score_after: number;
};

function resultMetadata(): VlxSupabaseStagingResultMetadata {
  return {
    environment: VLX_ACCOUNT_LEARNING_PERSISTENCE_ENVIRONMENT,
    runtimeConnected: VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED,
    mutationsEnabled: VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED,
    mutatesLearningState: false,
    productionDataAccessAllowed: false,
    grantsPaidEntitlement: false,
    touchesBilling: false,
  };
}

function rejected<TData>({
  code,
  message,
  retryable,
  callsNetwork,
  rowIndex,
}: VlxSupabaseStagingReadError & {
  callsNetwork: boolean;
}): VlxSupabaseStagingReadResult<TData> {
  return {
    ok: false,
    ...resultMetadata(),
    callsNetwork,
    error: {
      code,
      message,
      retryable,
      rowIndex,
    },
  };
}

function accepted<TData>(data: TData): VlxSupabaseStagingReadResult<TData> {
  return {
    ok: true,
    ...resultMetadata(),
    callsNetwork: true,
    data,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBoundedString(
  value: unknown,
  { min = 0, max }: { min?: number; max: number }
): value is string {
  return (
    typeof value === "string" &&
    value.length >= min &&
    value.length <= max
  );
}

function isNullableBoundedString(
  value: unknown,
  max: number
): value is string | null {
  return value === null || isBoundedString(value, { max });
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  );
}

function hasValidPrincipal(principal: AccountPrincipal) {
  return (
    principal.provider === "supabase" &&
    SUPABASE_ACCOUNT_ID_PATTERN.test(principal.accountId)
  );
}

function readLimit({
  requested,
  fallback,
  maximum,
}: {
  requested: number | undefined;
  fallback: number;
  maximum: number;
}) {
  const limit = requested ?? fallback;

  return Number.isInteger(limit) && limit >= 1 && limit <= maximum
    ? limit
    : null;
}

function parseSavedWordRow(
  value: unknown,
  ownerAccountId: string
): SavedWordRow | null {
  if (!isPlainRecord(value)) {
    return null;
  }

  const source = value.source;

  if (
    value.owner_account_id !== ownerAccountId ||
    !isBoundedString(value.slug, { min: 1, max: 200 }) ||
    !isBoundedString(value.word, { min: 1, max: 300 }) ||
    !isNullableBoundedString(value.image, 2_048) ||
    !isNullableBoundedString(value.definition, 4_000) ||
    !isNullableBoundedString(value.hub, 200) ||
    !(source === null || (typeof source === "string" && SAVED_WORD_SOURCES.has(source as VlxSavedWordSource))) ||
    !isIsoTimestamp(value.saved_at)
  ) {
    return null;
  }

  return value as SavedWordRow;
}

function parseReviewEventRow(
  value: unknown,
  ownerAccountId: string
): ReviewEventRow | null {
  if (!isPlainRecord(value)) {
    return null;
  }

  const questionType = value.question_type;
  const result = value.result;
  const confidence = value.confidence;
  const validBox = (box: unknown) =>
    Number.isInteger(box) && Number(box) >= 0 && Number(box) <= 5;
  const validWeakScore = (score: unknown) =>
    typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 1;

  if (
    value.owner_account_id !== ownerAccountId ||
    !isBoundedString(value.event_id, { min: 1, max: 200 }) ||
    !isBoundedString(value.session_id, { min: 1, max: 200 }) ||
    !isBoundedString(value.slug, { min: 1, max: 200 }) ||
    !isBoundedString(value.word, { min: 1, max: 300 }) ||
    !isNullableBoundedString(value.hub, 200) ||
    !(typeof questionType === "string" && QUESTION_TYPES.has(questionType as VlxQuestionType)) ||
    !isNullableBoundedString(value.selected, 2_000) ||
    !isBoundedString(value.answer, { min: 1, max: 2_000 }) ||
    !(typeof result === "string" && REVIEW_RESULTS.has(result as VlxReviewResult)) ||
    !Number.isInteger(value.response_ms) ||
    Number(value.response_ms) < 0 ||
    Number(value.response_ms) > 3_600_000 ||
    !(value.used_hint === null || typeof value.used_hint === "boolean") ||
    !(confidence === null || (typeof confidence === "string" && REVIEW_CONFIDENCE.has(confidence as VlxReviewConfidence))) ||
    !isIsoTimestamp(value.created_at) ||
    !validBox(value.box_before) ||
    !validBox(value.box_after) ||
    !validWeakScore(value.weak_score_before) ||
    !validWeakScore(value.weak_score_after)
  ) {
    return null;
  }

  return value as ReviewEventRow;
}

function toSavedWord(row: SavedWordRow): VlxSavedWord {
  return {
    slug: row.slug,
    word: row.word,
    image: row.image ?? undefined,
    definition: row.definition ?? undefined,
    hub: row.hub ?? undefined,
    source: row.source ?? undefined,
    savedAt: row.saved_at,
  };
}

function toReviewEvent(row: ReviewEventRow): VlxAccountSyncReviewEventEvidence {
  return {
    eventId: row.event_id,
    sessionId: row.session_id,
    slug: row.slug,
    word: row.word,
    hub: row.hub ?? undefined,
    questionType: row.question_type,
    selected: row.selected ?? undefined,
    answer: row.answer,
    result: row.result,
    responseMs: row.response_ms,
    usedHint: row.used_hint ?? undefined,
    confidence: row.confidence ?? undefined,
    createdAt: row.created_at,
    boxBefore: row.box_before,
    boxAfter: row.box_after,
    weakScoreBefore: row.weak_score_before,
    weakScoreAfter: row.weak_score_after,
  };
}

export function createSupabaseStagingLearningEvidenceAdapter({
  client,
}: {
  client: VlxSupabaseReadClient;
}): VlxSupabaseStagingLearningEvidenceAdapter {
  return {
    provider: "supabase_postgres",
    environment: VLX_ACCOUNT_LEARNING_PERSISTENCE_ENVIRONMENT,
    runtimeConnected: VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED,
    mutationsEnabled: VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED,

    async readOwnerSavedWords(principal, options = {}) {
      if (!hasValidPrincipal(principal)) {
        return rejected({
          code: "invalid_server_principal",
          message: "A verified Supabase server principal is required.",
          retryable: false,
          callsNetwork: false,
        });
      }

      const limit = readLimit({
        requested: options.limit,
        fallback: VLX_ACCOUNT_SAVED_WORDS_DEFAULT_LIMIT,
        maximum: VLX_ACCOUNT_SAVED_WORDS_MAX_LIMIT,
      });

      if (!limit) {
        return rejected({
          code: "invalid_limit",
          message: "Saved-word reads must use the approved bounded limit.",
          retryable: false,
          callsNetwork: false,
        });
      }

      const { data, error } = await client
        .from(VLX_ACCOUNT_SAVED_WORDS_TABLE)
        .select(SAVED_WORD_COLUMNS)
        .eq("owner_account_id", principal.accountId)
        .order("saved_at", { ascending: true })
        .order("slug", { ascending: true })
        .limit(limit);

      if (error) {
        return rejected({
          code: "provider_query_failed",
          message: "The saved-word evidence query failed.",
          retryable: true,
          callsNetwork: true,
        });
      }

      if (!Array.isArray(data)) {
        return rejected({
          code: "invalid_provider_payload",
          message: "The saved-word evidence response was invalid.",
          retryable: false,
          callsNetwork: true,
        });
      }

      const items: VlxSavedWord[] = [];

      for (const [rowIndex, value] of data.entries()) {
        const row = parseSavedWordRow(value, principal.accountId);

        if (!row) {
          return rejected({
            code: "invalid_provider_payload",
            message: "The saved-word evidence response was invalid.",
            retryable: false,
            callsNetwork: true,
            rowIndex,
          });
        }

        items.push(toSavedWord(row));
      }

      return accepted({
        ownerAccountId: principal.accountId,
        items,
        limit,
        bounded: true,
      });
    },

    async readOwnerReviewEvents(principal, options = {}) {
      if (!hasValidPrincipal(principal)) {
        return rejected({
          code: "invalid_server_principal",
          message: "A verified Supabase server principal is required.",
          retryable: false,
          callsNetwork: false,
        });
      }

      const limit = readLimit({
        requested: options.limit,
        fallback: VLX_ACCOUNT_REVIEW_EVENTS_DEFAULT_LIMIT,
        maximum: VLX_ACCOUNT_REVIEW_EVENTS_MAX_LIMIT,
      });

      if (!limit) {
        return rejected({
          code: "invalid_limit",
          message: "Review-event reads must use the approved bounded limit.",
          retryable: false,
          callsNetwork: false,
        });
      }

      const { data, error } = await client
        .from(VLX_ACCOUNT_REVIEW_EVENTS_TABLE)
        .select(REVIEW_EVENT_COLUMNS)
        .eq("owner_account_id", principal.accountId)
        .order("created_at", { ascending: true })
        .order("event_id", { ascending: true })
        .limit(limit);

      if (error) {
        return rejected({
          code: "provider_query_failed",
          message: "The review-event evidence query failed.",
          retryable: true,
          callsNetwork: true,
        });
      }

      if (!Array.isArray(data)) {
        return rejected({
          code: "invalid_provider_payload",
          message: "The review-event evidence response was invalid.",
          retryable: false,
          callsNetwork: true,
        });
      }

      const items: VlxAccountSyncReviewEventEvidence[] = [];

      for (const [rowIndex, value] of data.entries()) {
        const row = parseReviewEventRow(value, principal.accountId);

        if (!row) {
          return rejected({
            code: "invalid_provider_payload",
            message: "The review-event evidence response was invalid.",
            retryable: false,
            callsNetwork: true,
            rowIndex,
          });
        }

        items.push(toReviewEvent(row));
      }

      return accepted({
        ownerAccountId: principal.accountId,
        items,
        limit,
        bounded: true,
      });
    },
  };
}
