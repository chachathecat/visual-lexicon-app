import {
  buildAccountSyncDigest,
  buildAccountSyncPreviewPayload,
  type AccountSyncPreviewPayloadInput,
  type AccountSyncPreviewStorageInput
} from "@/lib/account-sync-preview-digest/account-sync-preview-digest";
import { VLX_PACK_PROGRESS_STORAGE_KEY } from "@/lib/packs/progress";
import { VLX_STORAGE_KEYS } from "@/lib/srs/types";
import { VLX_UPGRADE_INTEREST_STORAGE_KEY } from "@/lib/upgrade/upgrade-interest";

export const ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_REQUESTED_AT =
  "2026-06-15T09:00:00.000Z";

export const ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT =
  "2026-06-15T09:00:01.000Z";

export const ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT = {
  requestedAt: ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_REQUESTED_AT,
  previewOnly: true,
  clientStateDigest: "client-digest-fixture-v1",
  clientProvidedAccountId: "display-only-account-id",
  storageValues: {
    [VLX_STORAGE_KEYS.savedWords]: {
      dissonance: {
        slug: "dissonance",
        word: "Dissonance",
        image: "/images/dissonance.png",
        definition: "A lack of harmony among sounds or ideas.",
        hub: "academic-vocabulary",
        source: "word_page",
        savedAt: "2026-06-14T10:00:00.000Z"
      },
      lucid: {
        slug: "lucid",
        word: "Lucid",
        hub: "academic-vocabulary",
        source: "alias_search",
        savedAt: "2026-06-14T10:05:00.000Z"
      }
    },
    [VLX_STORAGE_KEYS.reviewState]: {
      dissonance: {
        slug: "dissonance",
        word: "Dissonance",
        image: "/images/dissonance.png",
        definition: "A lack of harmony among sounds or ideas.",
        hub: "academic-vocabulary",
        box: 1,
        mastery: "Learning",
        correct: 1,
        wrong: 1,
        streakCorrect: 1,
        lastReviewedAt: "2026-06-14T10:10:00.000Z",
        nextDueAt: "2026-06-15T10:10:00.000Z",
        weakScore: 0.32,
        avgResponseMs: 4200,
        lastQuestionType: "definition_to_word",
        createdAt: "2026-06-14T10:00:00.000Z",
        updatedAt: "2026-06-14T10:10:00.000Z"
      },
      lucid: {
        slug: "lucid",
        word: "Lucid",
        hub: "academic-vocabulary",
        box: 0,
        mastery: "New",
        correct: 0,
        wrong: 0,
        streakCorrect: 0,
        weakScore: 0,
        createdAt: "2026-06-14T10:05:00.000Z",
        updatedAt: "2026-06-14T10:05:00.000Z"
      }
    },
    [VLX_STORAGE_KEYS.reviewEvents]: [
      {
        eventId: "event_dissonance_001",
        sessionId: "session_preview_fixture",
        slug: "dissonance",
        word: "Dissonance",
        hub: "academic-vocabulary",
        questionType: "definition_to_word",
        selected: "Dissonance",
        answer: "Dissonance",
        result: "correct",
        responseMs: 4200,
        confidence: "knew",
        createdAt: "2026-06-14T10:10:00.000Z",
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0.5,
        weakScoreAfter: 0.32
      },
      {
        eventId: "event_lucid_001",
        sessionId: "session_preview_fixture",
        slug: "lucid",
        word: "Lucid",
        hub: "academic-vocabulary",
        questionType: "saved_review",
        selected: "Vague",
        answer: "Lucid",
        result: "wrong",
        responseMs: 8800,
        confidence: "forgot",
        createdAt: "2026-06-14T10:12:00.000Z",
        boxBefore: 1,
        boxAfter: 0,
        weakScoreBefore: 0.1,
        weakScoreAfter: 0.45
      }
    ],
    [VLX_STORAGE_KEYS.dailyStats]: {
      "2026-06-14": {
        date: "2026-06-14",
        reviewed: 2,
        correct: 1,
        wrong: 1,
        mastered: 0,
        weakAdded: 1,
        minutes: 3,
        sessions: 1
      }
    },
    [VLX_PACK_PROGRESS_STORAGE_KEY]: {
      "academic-vocabulary": {
        packId: "academic-vocabulary",
        startedAt: "2026-06-14T10:00:00.000Z",
        previewStartedAt: "2026-06-14T10:00:00.000Z",
        previewCompletedAt: "2026-06-14T10:15:00.000Z",
        lastReviewedAt: "2026-06-14T10:15:00.000Z",
        reviewedCount: 2,
        correctCount: 1,
        source: "review"
      }
    },
    [VLX_UPGRADE_INTEREST_STORAGE_KEY]: [
      {
        id: "upgrade_fixture_001",
        plan: "lite",
        source: "pricing_page",
        trigger: "pricing_preview",
        createdAt: "2026-06-14T10:20:00.000Z",
        pagePath: "/pricing"
      }
    ]
  }
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_MALFORMED_INPUT = {
  ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  storageValues: {
    ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT.storageValues,
    [VLX_STORAGE_KEYS.reviewEvents]: {
      not: "an array"
    }
  } as unknown as AccountSyncPreviewStorageInput
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_SENSITIVE_INPUT = {
  ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  storageValues: {
    ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT.storageValues,
    [VLX_STORAGE_KEYS.savedWords]: {
      ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT.storageValues[
        VLX_STORAGE_KEYS.savedWords
      ],
      tokenized: {
        slug: "tokenized",
        word: "Tokenized",
        savedAt: "2026-06-14T10:30:00.000Z",
        source: "manual",
        providerToken: "forbidden-provider-token"
      }
    }
  } as unknown as AccountSyncPreviewStorageInput
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_OVERSIZED_INPUT = {
  ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  storageValues: {
    ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT.storageValues,
    [VLX_STORAGE_KEYS.reviewEvents]: Array.from({ length: 101 }, (_, index) => ({
      eventId: `event_over_limit_${index}`,
      sessionId: "session_over_limit",
      slug: `word-${index}`,
      word: `Word ${index}`,
      questionType: "saved_review",
      answer: `Word ${index}`,
      result: "correct",
      responseMs: 3000,
      createdAt: "2026-06-14T11:00:00.000Z",
      boxBefore: 0,
      boxAfter: 1,
      weakScoreBefore: 0,
      weakScoreAfter: 0
    }))
  }
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_UNKNOWN_KEY_INPUT = {
  ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  storageValues: {
    ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT.storageValues,
    vlx_plan_state_v1: {
      plan: "pro"
    }
  }
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_NOT_PREVIEW_ONLY_INPUT = {
  ...ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT,
  previewOnly: false
} as const satisfies AccountSyncPreviewPayloadInput;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW =
  buildAccountSyncPreviewPayload(ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_INPUT);

export const ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_DIGEST = buildAccountSyncDigest({
  preview: ACCOUNT_SYNC_PREVIEW_DIGEST_VALID_PREVIEW,
  createdAt: ACCOUNT_SYNC_PREVIEW_DIGEST_FIXTURE_CREATED_AT
});

export const ACCOUNT_SYNC_PREVIEW_DIGEST_MODULE_FILES = [
  "src/lib/account-sync-preview-digest/account-sync-preview-digest.ts",
  "src/lib/account-sync-preview-digest/fixtures.ts",
  "src/lib/account-sync-preview-digest/README.md"
] as const;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_DOC_FILES = [
  "docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md",
  "README.md"
] as const;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_ACTUAL_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/middleware.ts",
  "src/app/account/sync",
  "src/app/sync"
] as const;

export const ACCOUNT_SYNC_PREVIEW_DIGEST_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@supabase/supabase-js",
  "@neondatabase/serverless",
  "@vercel/postgres",
  "firebase",
  "@firebase/app",
  "prisma",
  "@prisma/client",
  "drizzle-orm",
  "pg",
  "postgres",
  "mysql",
  "sqlite",
  "@clerk/nextjs",
  "next-auth",
  "better-auth",
  "stripe",
  "paddle",
  "@sentry/nextjs",
  "posthog-js",
  "@datadog/browser-rum",
  "newrelic",
  "openai",
  "@ai-sdk/openai"
] as const;
