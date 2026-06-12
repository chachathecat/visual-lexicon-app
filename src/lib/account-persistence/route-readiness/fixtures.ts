import {
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_BLOCKERS,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_FINAL_VERDICT,
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_ROUTES,
  type VlxAccountSyncRouteImplementationGateId,
  type VlxAccountSyncRouteReadinessBlocker
} from "@/lib/account-persistence/route-readiness/readiness-gates";
import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_ROUTES = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview"
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply"
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest"
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit"
  }
] as const;

export const ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_GATE_IDS = {
  preview: [
    "auth_ownership_check",
    "schema_validation",
    "payload_size_limit",
    "rate_limit",
    "no_mutation_guarantee",
    "preview_audit_policy",
    "no_paid_entitlement_guarantee"
  ],
  apply: [
    "auth_ownership_check",
    "schema_validation",
    "payload_size_limit",
    "rate_limit",
    "csrf_session_protection",
    "idempotency_key_validation",
    "durable_idempotency_storage",
    "transaction_like_commit",
    "blocked_plan_rejection",
    "event_derived_srs_recomputation",
    "audit_logging",
    "rollback_strategy",
    "no_paid_entitlement_guarantee"
  ],
  digest: [
    "auth_ownership_check",
    "rate_limit",
    "bounded_response",
    "no_full_sensitive_state",
    "no_raw_payloads",
    "no_production_secrets",
    "privacy_redaction_policy",
    "sensitive_payload_exclusion"
  ],
  audit: [
    "auth_ownership_check",
    "bounded_response",
    "no_raw_guest_snapshots",
    "no_raw_server_payloads",
    "no_provider_tokens",
    "no_production_secrets",
    "privacy_redaction_policy",
    "sensitive_payload_exclusion"
  ]
} as const satisfies Record<
  VlxAccountSyncRouteId,
  readonly VlxAccountSyncRouteImplementationGateId[]
>;

export const ACCOUNT_SYNC_ROUTE_READINESS_EXPECTED_P0_BLOCKER_IDS = [
  "no_real_auth_ownership_boundary",
  "no_real_database_persistence_adapter",
  "no_durable_idempotency_store",
  "no_transaction_rollback_strategy",
  "no_production_schema_validation",
  "no_payload_size_limits",
  "no_route_rate_limiting",
  "no_audit_retention_redaction_policy",
  "no_deployment_rollback_plan",
  "no_monitoring_alerting_plan"
] as const satisfies readonly VlxAccountSyncRouteReadinessBlocker["id"][];

export const ACCOUNT_SYNC_ROUTE_READINESS_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "src/lib/account-persistence/route-readiness/route.ts",
  "src/lib/account-persistence/route-readiness/preview",
  "src/lib/account-persistence/route-readiness/apply",
  "src/lib/account-persistence/route-readiness/digest",
  "src/lib/account-persistence/route-readiness/audit"
] as const;

export const ACCOUNT_SYNC_ROUTE_READINESS_AUDIT_FIXTURE =
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_AUDIT;

export const ACCOUNT_SYNC_ROUTE_READINESS_NO_GO_FIXTURE =
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_FINAL_VERDICT;

export const ACCOUNT_SYNC_ROUTE_READINESS_BLOCKER_FIXTURES =
  VLX_ACCOUNT_SYNC_ROUTE_READINESS_BLOCKERS;

export function getAccountSyncRouteReadinessFixture(routeId: VlxAccountSyncRouteId) {
  return VLX_ACCOUNT_SYNC_ROUTE_READINESS_ROUTES.find(
    (route) => route.routeId === routeId
  );
}
