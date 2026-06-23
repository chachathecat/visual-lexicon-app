import {
  ACCOUNT_SYNC_FINAL_OUTSTANDING_BLOCKERS,
  ACCOUNT_SYNC_FINAL_READINESS_GATE_IDS,
  ACCOUNT_SYNC_FINAL_READINESS_REVIEW,
  ACCOUNT_SYNC_FINAL_SAFETY_BOUNDARIES,
  ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY,
  type AccountSyncOutstandingBlockerId,
  type AccountSyncReadinessGateId,
  type AccountSyncSafetyBoundaryId
} from "@/lib/account-persistence/final-readiness/final-readiness-review";

export const ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_GATE_IDS = [
  "route_readiness",
  "auth_ownership",
  "durable_idempotency",
  "persistence_storage",
  "schema_validation",
  "payload_size_limits",
  "audit_logging",
  "privacy_redaction",
  "monitoring_alerting",
  "rollout_rollback",
  "kill_switch",
  "manual_qa",
  "provider_decision",
  "database_decision",
  "deployment_decision",
  "billing_payment_boundary",
  "paid_entitlement_boundary",
  "fake_mastery_block",
  "production_data_safety"
] as const satisfies readonly AccountSyncReadinessGateId[];

export const ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_BLOCKER_IDS = [
  "auth_provider_decision_outstanding",
  "database_persistence_decision_outstanding",
  "no_real_route_handlers",
  "runtime_schema_validation_implementation_outstanding",
  "production_rate_limiting_implementation_outstanding",
  "deployment_rollback_mechanism_outstanding",
  "monitoring_alerting_provider_outstanding",
  "manual_authenticated_qa_outstanding"
] as const satisfies readonly AccountSyncOutstandingBlockerId[];

export const ACCOUNT_SYNC_FINAL_READINESS_EXPECTED_SAFETY_BOUNDARY_IDS = [
  "no_fake_mastery",
  "no_paid_entitlement_grants",
  "no_billing_payment_sync",
  "no_raw_payload_exposure",
  "no_cross_account_ownership",
  "no_duplicate_srs_advancement"
] as const satisfies readonly AccountSyncSafetyBoundaryId[];

export const ACCOUNT_SYNC_FINAL_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "middleware.ts",
  "src/lib/account-persistence/final-readiness/route.ts",
  "src/lib/account-persistence/final-readiness/preview",
  "src/lib/account-persistence/final-readiness/apply",
  "src/lib/account-persistence/final-readiness/digest",
  "src/lib/account-persistence/final-readiness/audit"
] as const;

export const ACCOUNT_SYNC_FINAL_READINESS_MODULE_FILES = [
  "src/lib/account-persistence/final-readiness/final-readiness-review.ts",
  "src/lib/account-persistence/final-readiness/fixtures.ts",
  "src/lib/account-persistence/final-readiness/README.md"
] as const;

export const ACCOUNT_SYNC_FINAL_READINESS_REVIEW_FIXTURE =
  ACCOUNT_SYNC_FINAL_READINESS_REVIEW;

export const ACCOUNT_SYNC_FINAL_READINESS_GATE_ID_FIXTURES =
  ACCOUNT_SYNC_FINAL_READINESS_GATE_IDS;

export const ACCOUNT_SYNC_FINAL_READINESS_BLOCKER_FIXTURES =
  ACCOUNT_SYNC_FINAL_OUTSTANDING_BLOCKERS;

export const ACCOUNT_SYNC_FINAL_READINESS_POLICY_FIXTURE =
  ACCOUNT_SYNC_REAL_ROUTE_IMPLEMENTATION_POLICY;

export const ACCOUNT_SYNC_FINAL_READINESS_SAFETY_BOUNDARY_FIXTURES =
  ACCOUNT_SYNC_FINAL_SAFETY_BOUNDARIES;
