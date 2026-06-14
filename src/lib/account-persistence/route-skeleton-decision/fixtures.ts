import {
  ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTES,
  ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENTS,
  ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD,
  ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATHS,
  ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS,
  ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITIONS,
  ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENTS,
  type AccountSyncRouteSkeletonApprovalRequirementId,
  type AccountSyncRouteSkeletonStopConditionId,
  type AccountSyncRouteSkeletonValidationRequirementId
} from "@/lib/account-persistence/route-skeleton-decision/route-skeleton-decision";
import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_IDS = [
  "preview",
  "apply",
  "digest",
  "audit"
] as const satisfies readonly VlxAccountSyncRouteId[];

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_ROUTE_PATHS = [
  "/api/account/sync/preview",
  "/api/account/sync/apply",
  "/api/account/sync/digest",
  "/api/account/sync/audit"
] as const satisfies readonly VlxAccountSyncRoutePath[];

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_FILE_PATHS = [
  "src/app/api/account/sync/preview/route.ts",
  "src/app/api/account/sync/apply/route.ts",
  "src/app/api/account/sync/digest/route.ts",
  "src/app/api/account/sync/audit/route.ts"
] as const;

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_APPROVAL_REQUIREMENT_IDS = [
  "separate_future_pr_required",
  "explicit_owner_approval_required",
  "owner_approval_in_pr_body_required",
  "route_file_scope_must_match_plan",
  "disabled_tests_required",
  "apply_no_mutation_tests_required",
  "preview_read_only_tests_required",
  "digest_audit_owner_only_tests_required",
  "no_go_gate_preserved_until_owner_changes_it"
] as const satisfies readonly AccountSyncRouteSkeletonApprovalRequirementId[];

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_STOP_CONDITION_IDS = [
  "route_file_created_without_owner_approval",
  "route_handler_created_in_this_pr",
  "middleware_added",
  "runtime_integration_added",
  "production_enablement_attempted",
  "apply_can_mutate",
  "preview_can_mutate",
  "digest_audit_unbounded_or_unredacted",
  "client_account_id_trusted",
  "provider_sdk_imported",
  "validation_dependency_imported",
  "database_provider_imported",
  "network_or_runtime_access_added",
  "production_data_accessed",
  "fake_mastery_accepted",
  "paid_entitlement_granted",
  "billing_payment_boundary_crossed"
] as const satisfies readonly AccountSyncRouteSkeletonStopConditionId[];

export const ACCOUNT_SYNC_ROUTE_SKELETON_EXPECTED_VALIDATION_REQUIREMENT_IDS = [
  "current_phase_design_only",
  "no_actual_route_files",
  "future_skeleton_not_allowed_by_this_pr",
  "future_planned_paths_design_data_only",
  "forbidden_paths_absent",
  "separate_pr_and_owner_approval_required",
  "disabled_by_default",
  "mock_gated",
  "apply_hard_disabled",
  "preview_read_only",
  "digest_audit_owner_only_bounded_redacted",
  "provider_sdk_imports_forbidden",
  "db_provider_sdk_imports_forbidden",
  "validation_dependency_imports_forbidden",
  "runtime_surface_access_forbidden",
  "production_data_forbidden",
  "paid_entitlement_and_billing_outside_sync",
  "fake_mastery_blocked",
  "client_account_id_not_ownership_proof",
  "final_verdict_design_only",
  "readme_and_doc_links"
] as const satisfies readonly AccountSyncRouteSkeletonValidationRequirementId[];

export const ACCOUNT_SYNC_ROUTE_SKELETON_MODULE_FILES = [
  "src/lib/account-persistence/route-skeleton-decision/route-skeleton-decision.ts",
  "src/lib/account-persistence/route-skeleton-decision/fixtures.ts",
  "src/lib/account-persistence/route-skeleton-decision/README.md"
] as const;

export const ACCOUNT_SYNC_ROUTE_SKELETON_DOC_FILES = [
  "docs/ACCOUNT_SYNC_ROUTE_SKELETON_DECISION.md",
  "README.md"
] as const;

export const ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_FIXTURE =
  ACCOUNT_SYNC_ROUTE_SKELETON_DECISION_RECORD;

export const ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLAN_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_FUTURE_FILE_PLANS;

export const ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTE_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_ALLOWED_FUTURE_ROUTES;

export const ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENT_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_APPROVAL_REQUIREMENTS;

export const ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITION_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_STOP_CONDITIONS;

export const ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENT_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_VALIDATION_REQUIREMENTS;

export const ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATH_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SKELETON_FORBIDDEN_PATHS;
