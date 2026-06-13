import {
  ACCOUNT_SYNC_ALERT_POLICIES,
  ACCOUNT_SYNC_KILL_SWITCH_POLICY,
  ACCOUNT_SYNC_MANUAL_QA_REQUIREMENTS,
  ACCOUNT_SYNC_MONITORING_METRICS,
  ACCOUNT_SYNC_PRODUCTION_ENABLEMENT_GATES,
  ACCOUNT_SYNC_RECOVERY_RUNBOOK,
  ACCOUNT_SYNC_ROLLBACK_POLICY,
  ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION,
  ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT,
  ACCOUNT_SYNC_ROLLOUT_PHASES,
  type AccountSyncApplyDisableMode,
  type AccountSyncManualQARequirement,
  type AccountSyncMetricName,
  type AccountSyncRolloutPhase
} from "@/lib/account-persistence/rollout-gate/rollout-gate-contract";

export const ACCOUNT_SYNC_ROLLOUT_EXPECTED_PHASES = [
  "design_only",
  "local_contracts",
  "mocked_handler_harness",
  "internal_preview_only",
  "staff_only_apply_disabled",
  "limited_apply_shadow_mode",
  "limited_apply_enabled",
  "production_enabled",
  "rollback_required",
  "disabled"
] as const satisfies readonly AccountSyncRolloutPhase[];

export const ACCOUNT_SYNC_ROLLOUT_EXPECTED_METRICS = [
  "account_sync_preview_requested",
  "account_sync_preview_rejected",
  "account_sync_apply_requested",
  "account_sync_apply_accepted",
  "account_sync_apply_replayed",
  "account_sync_apply_blocked",
  "account_sync_apply_rejected",
  "account_sync_apply_conflict",
  "account_sync_schema_rejected",
  "account_sync_payload_too_large",
  "account_sync_ownership_rejected",
  "account_sync_idempotency_conflict",
  "account_sync_fake_mastery_blocked",
  "account_sync_paid_entitlement_ignored",
  "account_sync_billing_payload_rejected",
  "account_sync_digest_requested",
  "account_sync_digest_rejected",
  "account_sync_audit_requested",
  "account_sync_audit_rejected",
  "account_sync_latency_p95",
  "account_sync_error_rate",
  "account_sync_kill_switch_active"
] as const satisfies readonly AccountSyncMetricName[];

export const ACCOUNT_SYNC_ROLLOUT_EXPECTED_APPLY_DISABLE_MODES = [
  "apply_route_not_created",
  "mutating_apply_disabled",
  "shadow_mode_no_mutation",
  "read_only_diagnostics_only",
  "full_account_sync_disabled"
] as const satisfies readonly AccountSyncApplyDisableMode[];

export const ACCOUNT_SYNC_ROLLOUT_EXPECTED_MANUAL_QA_IDS = [
  "preview",
  "apply",
  "digest",
  "audit",
  "kill_switch",
  "rollback",
  "idempotency_replay",
  "blocked_plans",
  "fake_mastery",
  "paid_entitlement_boundary",
  "privacy_redaction"
] as const satisfies readonly AccountSyncManualQARequirement["id"][];

export const ACCOUNT_SYNC_ROLLOUT_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/middleware.ts",
  "src/lib/account-persistence/rollout-gate/route.ts",
  "src/lib/account-persistence/rollout-gate/preview",
  "src/lib/account-persistence/rollout-gate/apply",
  "src/lib/account-persistence/rollout-gate/digest",
  "src/lib/account-persistence/rollout-gate/audit"
] as const;

export const ACCOUNT_SYNC_ROLLOUT_MODULE_FILES = [
  "src/lib/account-persistence/rollout-gate/rollout-gate-contract.ts",
  "src/lib/account-persistence/rollout-gate/fixtures.ts"
] as const;

export const ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT_FIXTURE =
  ACCOUNT_SYNC_ROLLOUT_GATE_CONTRACT;

export const ACCOUNT_SYNC_ROLLOUT_PHASE_FIXTURES =
  ACCOUNT_SYNC_ROLLOUT_PHASES;

export const ACCOUNT_SYNC_PRODUCTION_ENABLEMENT_GATE_FIXTURES =
  ACCOUNT_SYNC_PRODUCTION_ENABLEMENT_GATES;

export const ACCOUNT_SYNC_KILL_SWITCH_POLICY_FIXTURE =
  ACCOUNT_SYNC_KILL_SWITCH_POLICY;

export const ACCOUNT_SYNC_MONITORING_METRIC_FIXTURES =
  ACCOUNT_SYNC_MONITORING_METRICS;

export const ACCOUNT_SYNC_ALERT_POLICY_FIXTURES = ACCOUNT_SYNC_ALERT_POLICIES;

export const ACCOUNT_SYNC_ROLLBACK_POLICY_FIXTURE =
  ACCOUNT_SYNC_ROLLBACK_POLICY;

export const ACCOUNT_SYNC_RECOVERY_RUNBOOK_FIXTURES =
  ACCOUNT_SYNC_RECOVERY_RUNBOOK;

export const ACCOUNT_SYNC_MANUAL_QA_REQUIREMENT_FIXTURES =
  ACCOUNT_SYNC_MANUAL_QA_REQUIREMENTS;

export const ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION_FIXTURE =
  ACCOUNT_SYNC_ROLLOUT_FINAL_DECISION;
