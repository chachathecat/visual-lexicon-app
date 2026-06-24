import {
  ACCOUNT_SYNC_DB_NEXT_STEP,
  ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD,
  ACCOUNT_SYNC_DB_TABLE_DESIGNS,
  ACCOUNT_SYNC_SELECTED_DB_STRATEGIES,
  type AccountSyncDbManualQARequirement,
  type AccountSyncDbProviderKind,
  type AccountSyncPersistenceTableGroup
} from "@/lib/account-persistence/db-persistence-decision/db-persistence-decision";

export const ACCOUNT_SYNC_DB_EXPECTED_PROVIDER_CANDIDATES = [
  "existing_account_backend",
  "postgres_compatible",
  "supabase_postgres",
  "neon_postgres",
  "vercel_postgres",
  "cloudflare_d1",
  "firebase_firestore",
  "custom_backend_storage",
  "in_memory_mock_only"
] as const satisfies readonly AccountSyncDbProviderKind[];

export const ACCOUNT_SYNC_DB_EXPECTED_SELECTED_STRATEGIES =
  ACCOUNT_SYNC_SELECTED_DB_STRATEGIES;

export const ACCOUNT_SYNC_DB_EXPECTED_TABLE_GROUPS = [
  "account_sync_idempotency_records",
  "account_sync_audit_summaries",
  "account_review_events",
  "account_review_state",
  "account_daily_stats",
  "account_saved_words",
  "account_pack_progress",
  "account_sync_operation_locks",
  "account_sync_cursors"
] as const satisfies readonly AccountSyncPersistenceTableGroup[];

export const ACCOUNT_SYNC_DB_EXPECTED_APPLY_TRANSACTION_GROUPS = [
  "account_sync_idempotency_records",
  "account_review_events",
  "account_review_state",
  "account_daily_stats",
  "account_saved_words",
  "account_pack_progress",
  "account_sync_audit_summaries"
] as const satisfies readonly AccountSyncPersistenceTableGroup[];

export const ACCOUNT_SYNC_DB_EXPECTED_MANUAL_QA_IDS = [
  "owner_scoped_preview_load",
  "owner_scoped_apply_write",
  "cross_account_rejection",
  "idempotency_replay",
  "idempotency_conflict",
  "duplicate_review_event_noop",
  "fake_mastery_block",
  "audit_digest_bounded_owner_only",
  "rollback_recovery",
  "no_billing_entitlement_mutation"
] as const satisfies readonly AccountSyncDbManualQARequirement["id"][];

export const ACCOUNT_SYNC_DB_OWNER_ACCOUNT_ID =
  "account-sync-db-owner-1";

export const ACCOUNT_SYNC_DB_OTHER_ACCOUNT_ID =
  "account-sync-db-owner-2";

export const ACCOUNT_SYNC_DB_IDEMPOTENCY_UNIQUE_FIELDS = [
  "ownerAccountId",
  "routeId",
  "idempotencyKey"
] as const;

export const ACCOUNT_SYNC_DB_REVIEW_EVENT_UNIQUE_FIELDS = [
  "ownerAccountId",
  "eventId"
] as const;

export const ACCOUNT_SYNC_DB_REVIEW_STATE_UNIQUE_FIELDS = [
  "ownerAccountId",
  "slug"
] as const;

export const ACCOUNT_SYNC_DB_SAVED_WORD_UNIQUE_FIELDS = [
  "ownerAccountId",
  "slug"
] as const;

export const ACCOUNT_SYNC_DB_DAILY_STATS_UNIQUE_FIELDS = [
  "ownerAccountId",
  "date"
] as const;

export const ACCOUNT_SYNC_DB_PACK_PROGRESS_UNIQUE_FIELDS = [
  "ownerAccountId",
  "packId"
] as const;

export const ACCOUNT_SYNC_DB_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "app/api",
  "pages/api",
  "src/app/api/account",
  "src/app/api/admin",
  "src/app/api/billing",
  "src/app/api/checkout",
  "src/app/api/downloads",
  "src/app/api/me/usage",
  "src/app/api/payment",
  "src/app/api/payments",
  "src/app/api/packs",
  "src/app/api/usage",
  "src/pages/api",
  "middleware.ts",
  "src/lib/account-persistence/db-persistence-decision/route.ts",
  "src/lib/account-persistence/db-persistence-decision/preview",
  "src/lib/account-persistence/db-persistence-decision/apply",
  "src/lib/account-persistence/db-persistence-decision/digest",
  "src/lib/account-persistence/db-persistence-decision/audit"
] as const;

export const ACCOUNT_SYNC_DB_FORBIDDEN_SCHEMA_AND_MIGRATION_PATHS = [
  "prisma",
  "drizzle",
  "supabase",
  "migrations",
  "src/db",
  "src/database",
  "db",
  "database",
  "schema.prisma",
  "drizzle.config.ts",
  "supabase.sql"
] as const;

export const ACCOUNT_SYNC_DB_MODULE_FILES = [
  "src/lib/account-persistence/db-persistence-decision/db-persistence-decision.ts",
  "src/lib/account-persistence/db-persistence-decision/fixtures.ts",
  "src/lib/account-persistence/db-persistence-decision/README.md"
] as const;

export const ACCOUNT_SYNC_DB_DECISION_RECORD_FIXTURE =
  ACCOUNT_SYNC_DB_PERSISTENCE_DECISION_RECORD;

export const ACCOUNT_SYNC_DB_TABLE_FIXTURES =
  ACCOUNT_SYNC_DB_TABLE_DESIGNS;

export const ACCOUNT_SYNC_DB_NEXT_STEP_FIXTURE =
  ACCOUNT_SYNC_DB_NEXT_STEP;
