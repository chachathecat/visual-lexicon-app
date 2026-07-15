import { z } from "zod";

import {
  VLX_ACCOUNT_LEARNING_APPLY_INPUT_VERSION,
  VLX_ACCOUNT_LEARNING_APPLY_SCHEMA,
  VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT,
  VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD,
  VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT,
  VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA,
  VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE,
  type VlxAccountLearningApplyInput,
  type VlxAccountLearningApplyProviderOutcome,
  type VlxAccountLearningApplyResponse,
  type VlxAccountLearningHydrateResponse,
  type VlxAccountLearningVerticalSliceValidationResult,
} from "./contracts";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const FINGERPRINT_PATTERN = /^sha256:[a-f0-9]{64}$/;
const OPAQUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

const FAKE_MASTERY_KEYS = new Set([
  "mastery",
  "mastered",
  "reviewState",
  "review_state",
]);
const OUT_OF_SCOPE_KEYS = new Set([
  "accountId",
  "account_id",
  "ownerAccountId",
  "owner_account_id",
  "billing",
  "billingState",
  "payment",
  "paymentState",
  "subscription",
  "entitlement",
  "entitlements",
  "paidEntitlement",
  "packProgress",
  "pack_progress",
]);

const timestampSchema = z.iso.datetime({ offset: true });
const boundedText = (maximum: number) =>
  z
    .string()
    .min(1)
    .max(maximum)
    .refine((value) => value.trim() === value)
    .refine((value) => !CONTROL_CHARACTER_PATTERN.test(value));
const opaqueIdSchema = boundedText(200).regex(OPAQUE_ID_PATTERN);

const savedWordSchema = z.strictObject({
  slug: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.slug),
  word: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.word),
  image: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.image),
  definition: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.definition),
  hub: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.hub),
  source: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_SAVED_WORD.source),
  savedAt: timestampSchema,
});

const reviewEventSchema = z.strictObject({
  eventId: opaqueIdSchema,
  sessionId: opaqueIdSchema,
  slug: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.slug),
  word: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.word),
  hub: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.hub),
  questionType: z.literal(
    VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.questionType
  ),
  selected: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.selected),
  answer: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.answer),
  result: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.result),
  responseMs: z.number().int().min(1).max(5_000),
  usedHint: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.usedHint),
  confidence: z.literal(
    VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.confidence
  ),
  createdAt: timestampSchema,
  boxBefore: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.boxBefore),
  boxAfter: z.literal(VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.boxAfter),
  weakScoreBefore: z.literal(
    VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.weakScoreBefore
  ),
  weakScoreAfter: z.literal(
    VLX_ACCOUNT_LEARNING_CANONICAL_REVIEW_EVENT.weakScoreAfter
  ),
});

const applyInputSchema = z
  .strictObject({
    schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_APPLY_INPUT_VERSION),
    fixture: z.literal(VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE),
    savedWord: savedWordSchema,
    reviewEvent: reviewEventSchema,
  })
  .superRefine((value, context) => {
    if (Date.parse(value.savedWord.savedAt) > Date.parse(value.reviewEvent.createdAt)) {
      context.addIssue({
        code: "custom",
        path: ["savedWord", "savedAt"],
        message: "The saved word cannot be newer than its review event.",
      });
    }
  });

const providerOutcomeSchema = z.strictObject({
  status: z.enum([
    "committed",
    "replayed",
    "conflict",
    "disabled",
    "auth_required",
    "scope_conflict",
  ]),
  requestFingerprint: z.string().regex(FINGERPRINT_PATTERN).optional(),
  savedWordsInserted: z.number().int().min(0).max(1).optional(),
  reviewEventsInserted: z.number().int().min(0).max(1).optional(),
  duplicateReviewEvents: z.number().int().min(0).max(1).optional(),
  idempotencyRecordsInserted: z.number().int().min(0).max(1).optional(),
  learningEvidenceMutated: z.boolean().optional(),
}).superRefine((value, context) => {
  const detailValues = [
    value.requestFingerprint,
    value.savedWordsInserted,
    value.reviewEventsInserted,
    value.duplicateReviewEvents,
    value.idempotencyRecordsInserted,
    value.learningEvidenceMutated,
  ];

  if (
    value.status === "conflict" ||
    value.status === "disabled" ||
    value.status === "auth_required" ||
    value.status === "scope_conflict"
  ) {
    if (detailValues.some((detail) => detail !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "Non-success outcomes must not include mutation details.",
      });
    }
    return;
  }

  if (detailValues.some((detail) => detail === undefined)) {
    context.addIssue({
      code: "custom",
      message: "Success outcomes require complete mutation details.",
    });
    return;
  }

  if (value.status === "replayed") {
    if (
      value.savedWordsInserted !== 0 ||
      value.reviewEventsInserted !== 0 ||
      value.duplicateReviewEvents !== 1 ||
      value.idempotencyRecordsInserted !== 0 ||
      value.learningEvidenceMutated !== false
    ) {
      context.addIssue({
        code: "custom",
        message: "A replay must be an exact mutation-free no-op.",
      });
    }
    return;
  }

  if (
    value.idempotencyRecordsInserted !== 1 ||
    value.reviewEventsInserted! + value.duplicateReviewEvents! !== 1 ||
    value.learningEvidenceMutated !==
      (value.savedWordsInserted === 1 || value.reviewEventsInserted === 1)
  ) {
    context.addIssue({
      code: "custom",
      message: "A commit must describe one atomic canonical receipt outcome.",
    });
  }
});

const applyResponseSchema = z.strictObject({
  schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_APPLY_SCHEMA),
  route: z.literal("apply"),
  ownerSource: z.literal("supabase_server_session"),
  target: z.literal("isolated_staging"),
  fixture: z.literal(VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE),
  status: z.enum(["committed", "replayed"]),
  bounded: z.literal(true),
  idempotency: z.strictObject({
    fingerprint: z.string().regex(FINGERPRINT_PATTERN),
    replayed: z.boolean(),
  }),
  counts: z.strictObject({
    savedWordsInserted: z.number().int().min(0).max(1),
    reviewEventsInserted: z.number().int().min(0).max(1),
    duplicateReviewEvents: z.number().int().min(0).max(1),
    idempotencyRecordsInserted: z.number().int().min(0).max(1),
  }),
  mutatesServer: z.boolean(),
  mutatesBrowser: z.literal(false),
  mutatesLearningEvidence: z.boolean(),
  grantsPaidEntitlement: z.literal(false),
  touchesBilling: z.literal(false),
  touchesPackProgress: z.literal(false),
}).superRefine((value, context) => {
  if (value.status === "replayed") {
    if (
      !value.idempotency.replayed ||
      value.counts.savedWordsInserted !== 0 ||
      value.counts.reviewEventsInserted !== 0 ||
      value.counts.duplicateReviewEvents !== 1 ||
      value.counts.idempotencyRecordsInserted !== 0 ||
      value.mutatesServer ||
      value.mutatesLearningEvidence
    ) {
      context.addIssue({
        code: "custom",
        message: "A replay response must be an exact mutation-free no-op.",
      });
    }
    return;
  }

  if (
    value.idempotency.replayed ||
    value.counts.idempotencyRecordsInserted !== 1 ||
    value.counts.reviewEventsInserted +
      value.counts.duplicateReviewEvents !==
      1 ||
    !value.mutatesServer ||
    value.mutatesLearningEvidence !==
      (value.counts.savedWordsInserted === 1 ||
        value.counts.reviewEventsInserted === 1)
  ) {
    context.addIssue({
      code: "custom",
      message: "A commit response must preserve the atomic outcome invariants.",
    });
  }
});

const hydrateResponseSchema = z.strictObject({
  schemaVersion: z.literal(VLX_ACCOUNT_LEARNING_HYDRATE_SCHEMA),
  route: z.literal("hydrate"),
  ownerSource: z.literal("supabase_server_session"),
  target: z.literal("isolated_staging"),
  fixture: z.literal(VLX_ACCOUNT_LEARNING_VERTICAL_SLICE_FIXTURE),
  readOnly: z.literal(true),
  bounded: z.literal(true),
  items: z.strictObject({
    savedWords: z.array(savedWordSchema).max(VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT),
    reviewEvents: z.array(reviewEventSchema).max(VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT),
  }),
  counts: z.strictObject({
    savedWords: z.number().int().min(0).max(VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT),
    reviewEvents: z.number().int().min(0).max(VLX_ACCOUNT_LEARNING_HYDRATE_ITEM_LIMIT),
  }),
  complete: z.strictObject({
    savedWords: z.literal(true),
    reviewEvents: z.literal(true),
  }),
  mutatesServer: z.literal(false),
  mutatesBrowser: z.literal(false),
  grantsPaidEntitlement: z.literal(false),
  touchesBilling: z.literal(false),
  touchesPackProgress: z.literal(false),
});

function inspectBlockedKeys(value: unknown): "fake_mastery" | "out_of_scope" | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const blocked = inspectBlockedKeys(item);
      if (blocked) return blocked;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FAKE_MASTERY_KEYS.has(key)) return "fake_mastery";
    if (OUT_OF_SCOPE_KEYS.has(key)) return "out_of_scope";

    const blocked = inspectBlockedKeys(child);
    if (blocked) return blocked;
  }

  const event = (value as Record<string, unknown>).reviewEvent;
  if (event && typeof event === "object" && !Array.isArray(event)) {
    const candidate = event as Record<string, unknown>;
    if (
      candidate.boxBefore !== undefined && candidate.boxBefore !== 0 ||
      candidate.boxAfter !== undefined && candidate.boxAfter !== 1 ||
      candidate.weakScoreBefore !== undefined && candidate.weakScoreBefore !== 0 ||
      candidate.weakScoreAfter !== undefined && candidate.weakScoreAfter !== 0
    ) {
      return "fake_mastery";
    }
  }

  return null;
}

export function validateAccountLearningApplyInput(
  input: unknown
): VlxAccountLearningVerticalSliceValidationResult<VlxAccountLearningApplyInput> {
  const blocked = inspectBlockedKeys(input);

  if (blocked) {
    return { ok: false, reason: blocked };
  }

  const result = applyInputSchema.safeParse(input);

  return result.success
    ? { ok: true, value: result.data as VlxAccountLearningApplyInput }
    : { ok: false, reason: "malformed" };
}

export function validateAccountLearningApplyProviderOutcome(
  input: unknown
): VlxAccountLearningVerticalSliceValidationResult<VlxAccountLearningApplyProviderOutcome> {
  const result = providerOutcomeSchema.safeParse(input);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, reason: "malformed" };
}

export function validateAccountLearningApplyResponse(input: unknown) {
  const result = applyResponseSchema.safeParse(input);
  return result.success
    ? ({ ok: true, value: result.data } as const)
    : ({ ok: false, reason: "malformed" } as const);
}

export function validateAccountLearningHydrateResponse(input: unknown) {
  const result = hydrateResponseSchema.safeParse(input);
  return result.success
    ? ({ ok: true, value: result.data } as {
        ok: true;
        value: VlxAccountLearningHydrateResponse;
      })
    : ({ ok: false, reason: "malformed" } as const);
}

export function isValidAccountLearningApplyResponse(
  input: unknown
): input is VlxAccountLearningApplyResponse {
  return applyResponseSchema.safeParse(input).success;
}
