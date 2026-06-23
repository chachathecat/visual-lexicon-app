import {
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS,
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN,
  type AccountSyncImplementationSequenceStepId,
  type AccountSyncImplementationSpikeGateId,
  type AccountSyncImplementationSpikeStopConditionId
} from "@/lib/account-persistence/implementation-spike-plan/implementation-spike-plan";
import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_IDS = [
  "preview",
  "apply",
  "digest",
  "audit"
] as const satisfies readonly VlxAccountSyncRouteId[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_ROUTE_PATHS = [
  "/api/account/sync/preview",
  "/api/account/sync/apply",
  "/api/account/sync/digest",
  "/api/account/sync/audit"
] as const satisfies readonly VlxAccountSyncRoutePath[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_GATE_IDS = [
  "owner_approval_and_no_go_to_go",
  "disabled_by_default",
  "mock_boundary_before_provider_integration",
  "auth_adapter_boundary",
  "db_adapter_boundary",
  "validator_adapter_boundary",
  "durable_idempotency",
  "audit_redaction",
  "monitoring",
  "kill_switch",
  "rollback",
  "manual_qa",
  "shadow_mode_no_mutation",
  "production_data_safety",
  "billing_payment_boundary",
  "paid_entitlement_boundary",
  "fake_mastery_block",
  "srs_event_source_of_truth"
] as const satisfies readonly AccountSyncImplementationSpikeGateId[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_STOP_CONDITION_IDS = [
  "auth_ambiguity",
  "cross_account_risk",
  "validation_leakage",
  "raw_payload_exposure",
  "idempotency_conflict",
  "fake_mastery_acceptance",
  "paid_entitlement_mutation",
  "billing_payment_boundary_crossed",
  "missing_rollback",
  "missing_kill_switch",
  "production_data_access",
  "monitoring_failure",
  "provider_code_in_sync_core",
  "shadow_mode_mutation"
] as const satisfies readonly AccountSyncImplementationSpikeStopConditionId[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_SEQUENCE_IDS = [
  "reconfirm_owner_approval_and_no_go_to_go_criteria",
  "future_provider_neutral_route_skeleton_pr",
  "future_disabled_mock_only_route_skeleton",
  "future_runtime_validator_adapter_pr",
  "future_auth_adapter_pr",
  "future_persistence_adapter_pr",
  "future_durable_idempotency_storage_pr",
  "future_audit_redaction_writer_pr",
  "future_monitoring_and_kill_switch_pr",
  "internal_staff_only_qa",
  "shadow_mode_no_mutation",
  "preview_read_only_enablement_after_gates",
  "apply_enablement_after_explicit_owner_approval"
] as const satisfies readonly AccountSyncImplementationSequenceStepId[];

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_MANUAL_QA_FLOW_IDS = [
  "preview_read_only",
  "apply_disabled",
  "digest_owner_only_bounded",
  "audit_owner_only_redacted",
  "shadow_mode_no_mutation",
  "idempotency_replay",
  "idempotency_conflict",
  "kill_switch",
  "rollback",
  "fake_mastery",
  "paid_entitlement_boundary",
  "billing_payment_boundary",
  "production_data_safety"
] as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/lib/account-persistence/implementation-spike-plan/route.ts",
  "src/lib/account-persistence/implementation-spike-plan/preview",
  "src/lib/account-persistence/implementation-spike-plan/apply",
  "src/lib/account-persistence/implementation-spike-plan/digest",
  "src/lib/account-persistence/implementation-spike-plan/audit"
] as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MODULE_FILES = [
  "src/lib/account-persistence/implementation-spike-plan/implementation-spike-plan.ts",
  "src/lib/account-persistence/implementation-spike-plan/fixtures.ts",
  "src/lib/account-persistence/implementation-spike-plan/README.md"
] as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_DOC_FILES = [
  "docs/ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN.md",
  "README.md"
] as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "zod",
  "yup",
  "valibot",
  "arktype",
  "ajv",
  "superstruct",
  "joi",
  "io-ts",
  "runtypes",
  "class-validator",
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
  "@auth/core",
  "next-auth",
  "better-auth",
  "stripe",
  "paddle",
  "@sentry/nextjs",
  "posthog-node",
  "@datadog/browser-rum",
  "newrelic",
  "winston",
  "pino"
] as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_EXPECTED_PACKAGE_MANIFEST = {
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
    typecheck: "tsc --noEmit",
    lint: "next lint",
    test: "playwright test",
    "test:paywall": "playwright test tests/paywall-triggers.spec.ts tests/paywall-surfaces.spec.ts",
    "test:e2e": "playwright test",
    "test:mvp": "playwright test tests/mvp-smoke.spec.ts",
    "test:review": "playwright test tests/review-state-regression.spec.ts tests/review-mode-routes.spec.ts",
    "test:packs": "playwright test tests/exam-pack-preview.spec.ts"
  },
  dependencies: {
    "@supabase/ssr": "^0.12.0",
    "@supabase/supabase-js": "^2.108.2",
    next: "^14.2.35",
    react: "18.3.1",
    "react-dom": "18.3.1"
  },
  devDependencies: {
    "@playwright/test": "^1.60.0",
    "@types/node": "20.14.2",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    eslint: "8.57.0",
    "eslint-config-next": "^14.2.35",
    typescript: "5.4.5"
  }
} as const;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN_FIXTURE =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_PLAN;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLAN_FIXTURES =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_ROUTE_PLANS;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATE_FIXTURES =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_GATES;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITION_FIXTURES =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_STOP_CONDITIONS;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE_FIXTURES =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_SEQUENCE;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN_FIXTURE =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_VALIDATION_PLAN;

export const ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN_FIXTURE =
  ACCOUNT_SYNC_IMPLEMENTATION_SPIKE_MANUAL_QA_PLAN;
