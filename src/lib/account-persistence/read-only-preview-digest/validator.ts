import { z } from "zod";

import {
  VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA,
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_REVIEW_EVENT_IDS,
  VLX_ACCOUNT_LEARNING_PREVIEW_MAX_SAVED_WORD_SLUGS,
  VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA,
  VLX_ACCOUNT_LEARNING_READ_SCHEMA_VERSION,
  VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT,
  VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT,
  type VlxAccountLearningDigestQuery,
  type VlxAccountLearningDigestResponse,
  type VlxAccountLearningPreviewInput,
  type VlxAccountLearningPreviewResponse,
  type VlxAccountLearningValidationIssue,
  type VlxAccountLearningValidationResult,
} from "./contracts";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const HASHED_CURSOR_PATTERN = /^hmac-sha256:[a-f0-9]{64}$/;
const accountIdSchema = z.uuid();
const timestampSchema = z.iso.datetime({ offset: true });
const countSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

function boundedOpaqueIdentifier(maximumLength: number) {
  return z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value.trim() === value)
    .refine((value) => !CONTROL_CHARACTER_PATTERN.test(value));
}

function uniqueArray<TSchema extends z.ZodType<string>>(
  itemSchema: TSchema,
  maximumItems: number
) {
  return z
    .array(itemSchema)
    .max(maximumItems)
    .superRefine((items, context) => {
      if (new Set(items).size !== items.length) {
        context.addIssue({
          code: "custom",
          message: "Duplicate identifiers are not allowed.",
        });
      }
    });
}

const previewInputSchema = z.strictObject({
  schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_READ_SCHEMA_VERSION),
  previewOnly: z.literal(true),
  localEvidence: z.strictObject({
    savedWordSlugs: uniqueArray(
      boundedOpaqueIdentifier(200),
      VLX_ACCOUNT_LEARNING_PREVIEW_MAX_SAVED_WORD_SLUGS
    ),
    reviewEventIds: uniqueArray(
      boundedOpaqueIdentifier(200),
      VLX_ACCOUNT_LEARNING_PREVIEW_MAX_REVIEW_EVENT_IDS
    ),
  }),
});

const digestQuerySchema = z.strictObject({});

const savedWordSummaryRowSchema = z.strictObject({
  owner_account_id: accountIdSchema,
  slug: boundedOpaqueIdentifier(200),
  saved_at: timestampSchema,
});

const reviewEventSummaryRowSchema = z.strictObject({
  owner_account_id: accountIdSchema,
  event_id: boundedOpaqueIdentifier(200),
  created_at: timestampSchema,
});

const redactionSchema = z.strictObject({
  containsAccountId: z.literal(false),
  containsSavedWordSlugs: z.literal(false),
  containsReviewEventIds: z.literal(false),
  containsWords: z.literal(false),
  containsAnswers: z.literal(false),
  containsProviderPayload: z.literal(false),
  containsAuthMaterial: z.literal(false),
});

const countsSchema = z.strictObject({
  savedWords: countSchema,
  reviewEvents: countSchema,
});

const completenessSchema = z.strictObject({
  savedWords: z.boolean(),
  reviewEvents: z.boolean(),
});

const hashedCursorsSchema = z.strictObject({
  algorithm: z.literal("hmac-sha256"),
  reversible: z.literal(false),
  savedWords: z.string().regex(HASHED_CURSOR_PATTERN).nullable(),
  reviewEvents: z.string().regex(HASHED_CURSOR_PATTERN).nullable(),
});

const previewResponseSchema = z.strictObject({
  schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_PREVIEW_SCHEMA),
  route: z.literal("preview"),
  ownerSource: z.literal("supabase_server_session"),
  readOnly: z.literal(true),
  bounded: z.literal(true),
  applyEnabled: z.literal(false),
  evaluatedAt: timestampSchema,
  mutatesServer: z.literal(false),
  mutatesBrowser: z.literal(false),
  grantsPaidEntitlement: z.literal(false),
  counts: z.strictObject({
    local: countsSchema,
    accountObserved: countsSchema,
    overlap: countsSchema,
    localNotSeenInAccountPage: countsSchema,
    accountOnlyObserved: countsSchema,
  }),
  complete: completenessSchema,
  cursors: hashedCursorsSchema,
  redaction: redactionSchema,
});

const digestResponseSchema = z.strictObject({
  schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_DIGEST_SCHEMA),
  route: z.literal("digest"),
  ownerSource: z.literal("supabase_server_session"),
  readOnly: z.literal(true),
  bounded: z.literal(true),
  applyEnabled: z.literal(false),
  evaluatedAt: timestampSchema,
  mutatesServer: z.literal(false),
  mutatesBrowser: z.literal(false),
  grantsPaidEntitlement: z.literal(false),
  counts: countsSchema,
  complete: completenessSchema,
  cursors: hashedCursorsSchema,
  redaction: redactionSchema,
});

function normalizeIssueCode(
  code: string
): VlxAccountLearningValidationIssue["code"] {
  switch (code) {
    case "invalid_type":
      return "invalid_type";
    case "too_big":
      return "too_big";
    case "unrecognized_keys":
      return "unrecognized_key";
    default:
      return "invalid_value";
  }
}

function normalizeZodResult<TValue>(
  result: z.ZodSafeParseResult<TValue>
): VlxAccountLearningValidationResult<TValue> {
  if (result.success) {
    return {
      ok: true,
      value: result.data,
    };
  }

  return {
    ok: false,
    issues: result.error.issues.slice(0, 8).map((issue) => ({
      path:
        issue.path.length === 0
          ? "$"
          : `$.${issue.path.map(String).join(".")}`,
      code: normalizeIssueCode(issue.code),
      rawValueIncluded: false,
    })),
  };
}

export function validateAccountLearningPreviewInput(
  input: unknown
): VlxAccountLearningValidationResult<VlxAccountLearningPreviewInput> {
  return normalizeZodResult(previewInputSchema.safeParse(input));
}

export function validateAccountLearningDigestQuery(
  entries: readonly (readonly [string, string])[]
): VlxAccountLearningValidationResult<VlxAccountLearningDigestQuery> {
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of entries) {
    const previous = query[key];
    query[key] = previous
      ? Array.isArray(previous)
        ? [...previous, value]
        : [previous, value]
      : value;
  }

  return normalizeZodResult(digestQuerySchema.safeParse(query));
}

export function validateSavedWordSummaryRows(input: unknown) {
  return normalizeZodResult(
    z
      .array(savedWordSummaryRowSchema)
      .max(VLX_ACCOUNT_LEARNING_SERVER_SAVED_WORD_LIMIT + 1)
      .safeParse(input)
  );
}

export function validateReviewEventSummaryRows(input: unknown) {
  return normalizeZodResult(
    z
      .array(reviewEventSummaryRowSchema)
      .max(VLX_ACCOUNT_LEARNING_SERVER_REVIEW_EVENT_LIMIT + 1)
      .safeParse(input)
  );
}

export function validateAccountLearningPreviewResponse(input: unknown) {
  return normalizeZodResult(
    previewResponseSchema.safeParse(input)
  ) as VlxAccountLearningValidationResult<VlxAccountLearningPreviewResponse>;
}

export function validateAccountLearningDigestResponse(input: unknown) {
  return normalizeZodResult(
    digestResponseSchema.safeParse(input)
  ) as VlxAccountLearningValidationResult<VlxAccountLearningDigestResponse>;
}
