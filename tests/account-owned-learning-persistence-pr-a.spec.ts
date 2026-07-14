import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountPrincipal } from "../src/lib/account-runtime/types";
import {
  VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED,
  VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED,
  VLX_ACCOUNT_REVIEW_EVENTS_MAX_LIMIT,
  VLX_ACCOUNT_REVIEW_EVENTS_TABLE,
  VLX_ACCOUNT_SAVED_WORDS_TABLE,
  createSupabaseStagingLearningEvidenceAdapter,
} from "../src/lib/account-persistence/supabase-staging/adapter";

const workspaceRoot = process.cwd();
const ownerAccountId = "6f3a6f4e-a0c8-4c6e-8e62-94cb1c922b6b";
const otherAccountId = "74d2da4e-5947-49ef-a24d-659c5e95f08d";

const principal: AccountPrincipal = {
  accountId: ownerAccountId,
  provider: "supabase",
};

type QueryCall =
  | { kind: "from"; table: string }
  | { kind: "select"; columns: string }
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "order"; column: string; ascending: boolean }
  | { kind: "limit"; value: number };

function createQueryClient({
  rowsByTable = {},
  errorByTable = {},
}: {
  rowsByTable?: Record<string, unknown[]>;
  errorByTable?: Record<string, unknown>;
} = {}) {
  const calls: QueryCall[] = [];

  const client = {
    from(table: string) {
      calls.push({ kind: "from", table });

      const builder = {
        select(columns: string) {
          calls.push({ kind: "select", columns });
          return builder;
        },
        eq(column: string, value: unknown) {
          calls.push({ kind: "eq", column, value });
          return builder;
        },
        order(column: string, options: { ascending: boolean }) {
          calls.push({
            kind: "order",
            column,
            ascending: options.ascending,
          });
          return builder;
        },
        async limit(value: number) {
          calls.push({ kind: "limit", value });
          return {
            data: rowsByTable[table] ?? [],
            error: errorByTable[table] ?? null,
          };
        },
      };

      return builder;
    },
  } as unknown as Pick<SupabaseClient, "from">;

  return { calls, client };
}

function readProjectFile(...parts: string[]) {
  return readFileSync(join(workspaceRoot, ...parts), "utf8");
}

test.describe("account-owned learning persistence PR A", () => {
  test("migration is staging-guarded, owner-scoped, forced-RLS, and read-only", () => {
    const sql = readProjectFile(
      "src",
      "lib",
      "account-persistence",
      "supabase-staging",
      "sql",
      "001_account_learning_evidence_up.sql"
    ).toLowerCase();

    expect(sql).toContain("current_setting('vlx.account_persistence_target', true)");
    expect(sql).toContain("is distinct from 'staging'");
    expect(sql).toContain("create table if not exists public.account_saved_words");
    expect(sql).toContain("create table if not exists public.account_review_events");
    expect(sql).toContain("primary key (owner_account_id, slug)");
    expect(sql).toContain("primary key (owner_account_id, event_id)");
    expect(sql).toContain("references auth.users (id)");
    expect(sql).toContain("force row level security");
    expect(sql).toContain("using ((select auth.uid()) = owner_account_id)");
    expect(sql).toContain("for select");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("revoke all on table public.account_saved_words from anon, authenticated");
    expect(sql).toContain("revoke all on table public.account_review_events from anon, authenticated");
    expect(sql).toContain("grant select on table public.account_saved_words to authenticated");
    expect(sql).toContain("grant select on table public.account_review_events to authenticated");
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)/);
    expect(sql).not.toContain("create policy account_saved_words_owner_insert");
    expect(sql).not.toContain("create policy account_review_events_owner_insert");
  });

  test("review events are immutable and rollback is narrow and staging-guarded", () => {
    const upSql = readProjectFile(
      "src",
      "lib",
      "account-persistence",
      "supabase-staging",
      "sql",
      "001_account_learning_evidence_up.sql"
    ).toLowerCase();
    const downSql = readProjectFile(
      "src",
      "lib",
      "account-persistence",
      "supabase-staging",
      "sql",
      "001_account_learning_evidence_down.sql"
    ).toLowerCase();

    expect(upSql).toContain("account_review_events is append-only");
    expect(upSql).toContain("before update or delete on public.account_review_events");
    expect(downSql).toContain("is distinct from 'staging'");
    expect(downSql).toContain("drop table if exists public.account_review_events");
    expect(downSql).toContain("drop table if exists public.account_saved_words");
    expect(downSql).toContain(
      "drop function if exists public.vlx_reject_account_review_event_mutation()"
    );
    expect(downSql).not.toMatch(/drop\s+(schema|database|role)/);
  });

  test("reads saved words with a server-principal owner filter and bounded columns", async () => {
    const { calls, client } = createQueryClient({
      rowsByTable: {
        [VLX_ACCOUNT_SAVED_WORDS_TABLE]: [
          {
            owner_account_id: ownerAccountId,
            slug: "dissonance",
            word: "Dissonance",
            image: null,
            definition: "A lack of harmony or agreement.",
            hub: "academic-vocabulary",
            source: "word_page",
            saved_at: "2026-07-14T06:00:00.000Z",
          },
        ],
      },
    });
    const adapter = createSupabaseStagingLearningEvidenceAdapter({ client });

    const result = await adapter.readOwnerSavedWords(principal, { limit: 25 });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.data).toEqual({
      ownerAccountId,
      items: [
        {
          slug: "dissonance",
          word: "Dissonance",
          definition: "A lack of harmony or agreement.",
          hub: "academic-vocabulary",
          source: "word_page",
          savedAt: "2026-07-14T06:00:00.000Z",
        },
      ],
      limit: 25,
      bounded: true,
    });
    expect(calls).toEqual(
      expect.arrayContaining([
        { kind: "from", table: VLX_ACCOUNT_SAVED_WORDS_TABLE },
        { kind: "eq", column: "owner_account_id", value: ownerAccountId },
        { kind: "limit", value: 25 },
      ])
    );
    expect(result).toMatchObject({
      runtimeConnected: false,
      mutationsEnabled: false,
      mutatesLearningState: false,
      productionDataAccessAllowed: false,
      grantsPaidEntitlement: false,
      touchesBilling: false,
    });
  });

  test("reads append-only review evidence without deriving mastery", async () => {
    const { calls, client } = createQueryClient({
      rowsByTable: {
        [VLX_ACCOUNT_REVIEW_EVENTS_TABLE]: [
          {
            owner_account_id: ownerAccountId,
            event_id: "review-event-1",
            session_id: "session-1",
            slug: "dissonance",
            word: "Dissonance",
            hub: "academic-vocabulary",
            question_type: "saved_review",
            selected: "Dissonance",
            answer: "Dissonance",
            result: "correct",
            response_ms: 4200,
            used_hint: false,
            confidence: "knew",
            created_at: "2026-07-14T06:10:00.000Z",
            box_before: 0,
            box_after: 1,
            weak_score_before: 0.2,
            weak_score_after: 0.04,
          },
        ],
      },
    });
    const adapter = createSupabaseStagingLearningEvidenceAdapter({ client });

    const result = await adapter.readOwnerReviewEvents(principal, { limit: 50 });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.data.items).toEqual([
      {
        eventId: "review-event-1",
        sessionId: "session-1",
        slug: "dissonance",
        word: "Dissonance",
        hub: "academic-vocabulary",
        questionType: "saved_review",
        selected: "Dissonance",
        answer: "Dissonance",
        result: "correct",
        responseMs: 4200,
        usedHint: false,
        confidence: "knew",
        createdAt: "2026-07-14T06:10:00.000Z",
        boxBefore: 0,
        boxAfter: 1,
        weakScoreBefore: 0.2,
        weakScoreAfter: 0.04,
      },
    ]);
    expect(calls).toEqual(
      expect.arrayContaining([
        { kind: "from", table: VLX_ACCOUNT_REVIEW_EVENTS_TABLE },
        { kind: "eq", column: "owner_account_id", value: ownerAccountId },
        { kind: "limit", value: 50 },
      ])
    );
  });

  test("rejects malformed principals and oversized reads before provider access", async () => {
    const { calls, client } = createQueryClient();
    const adapter = createSupabaseStagingLearningEvidenceAdapter({ client });

    const malformedPrincipal = await adapter.readOwnerSavedWords({
      accountId: "client-provided-account-id",
      provider: "supabase",
    });
    const invalidLimit = await adapter.readOwnerReviewEvents(principal, {
      limit: VLX_ACCOUNT_REVIEW_EVENTS_MAX_LIMIT + 1,
    });

    expect(malformedPrincipal).toMatchObject({
      ok: false,
      callsNetwork: false,
      error: { code: "invalid_server_principal" },
    });
    expect(invalidLimit).toMatchObject({
      ok: false,
      callsNetwork: false,
      error: { code: "invalid_limit" },
    });
    expect(calls).toHaveLength(0);
  });

  test("fails closed on cross-owner rows and redacts provider errors", async () => {
    const crossOwner = createQueryClient({
      rowsByTable: {
        [VLX_ACCOUNT_SAVED_WORDS_TABLE]: [
          {
            owner_account_id: otherAccountId,
            slug: "dissonance",
            word: "Dissonance",
            image: null,
            definition: null,
            hub: null,
            source: null,
            saved_at: "2026-07-14T06:00:00.000Z",
          },
        ],
      },
    });
    const providerFailure = createQueryClient({
      errorByTable: {
        [VLX_ACCOUNT_SAVED_WORDS_TABLE]: {
          message: "private provider payload must not escape",
          details: { token: "secret" },
        },
      },
    });

    const crossOwnerResult = await createSupabaseStagingLearningEvidenceAdapter({
      client: crossOwner.client,
    }).readOwnerSavedWords(principal);
    const providerFailureResult = await createSupabaseStagingLearningEvidenceAdapter({
      client: providerFailure.client,
    }).readOwnerSavedWords(principal);

    expect(crossOwnerResult).toMatchObject({
      ok: false,
      error: { code: "invalid_provider_payload", rowIndex: 0 },
    });
    expect(providerFailureResult).toMatchObject({
      ok: false,
      error: {
        code: "provider_query_failed",
        message: "The saved-word evidence query failed.",
      },
    });
    expect(JSON.stringify(providerFailureResult)).not.toContain("secret");
    expect(JSON.stringify(providerFailureResult)).not.toContain(
      "private provider payload"
    );
  });

  test("adapter surface remains read-only and disconnected", () => {
    const adapterText = readProjectFile(
      "src",
      "lib",
      "account-persistence",
      "supabase-staging",
      "adapter.ts"
    );
    const { client } = createQueryClient();
    const adapter = createSupabaseStagingLearningEvidenceAdapter({ client });

    expect(VLX_ACCOUNT_LEARNING_MUTATIONS_ENABLED).toBe(false);
    expect(VLX_ACCOUNT_LEARNING_PERSISTENCE_RUNTIME_CONNECTED).toBe(false);
    expect(adapter).toMatchObject({
      provider: "supabase_postgres",
      environment: "staging_only",
      runtimeConnected: false,
      mutationsEnabled: false,
    });
    expect(Object.keys(adapter).sort()).toEqual([
      "environment",
      "mutationsEnabled",
      "provider",
      "readOwnerReviewEvents",
      "readOwnerSavedWords",
      "runtimeConnected",
    ]);
    expect(adapterText).not.toMatch(/\.(insert|upsert|update|delete|rpc)\s*\(/);
    expect(adapterText).not.toContain("process.env");
    expect(adapterText).not.toContain("createVlxSupabaseServerClient");
  });
});
