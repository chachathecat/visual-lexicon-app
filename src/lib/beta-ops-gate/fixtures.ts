import {
  BETA_OPS_GATE,
  BETA_OPS_INCIDENT_LOG_FIELDS,
  BETA_OPS_NEXT_PR_SEQUENCE,
  BETA_OPS_PAUSE_ROLLBACK_CRITERIA,
  BETA_OPS_SUPPORT_PRIVACY_REQUIREMENTS,
  type BetaOpsGate,
  type BetaOpsGateSeverity,
  type BetaOpsIncidentLogEntry,
  type BetaOpsIncidentLogFieldKey,
  type BetaOpsMonitoringRequirementId,
  type BetaOpsRouteSmokePath,
  type BetaOpsSupportPrivacyRequirementId
} from "@/lib/beta-ops-gate/beta-ops-gate";

export const BETA_OPS_GATE_FIXTURE = BETA_OPS_GATE satisfies BetaOpsGate;

export const BETA_OPS_REQUIRED_MONITORING_REQUIREMENT_IDS = [
  "manual_monitoring_only",
  "owner_run_smoke_before_invites",
  "route_smoke_matrix_required",
  "console_hydration_capture_required",
  "manual_issue_log_required",
  "daily_owner_review_required",
  "stale_dev_server_mitigation_required"
] as const satisfies readonly BetaOpsMonitoringRequirementId[];

export const BETA_OPS_REQUIRED_ROUTE_SMOKE_PATHS = [
  "/dashboard",
  "/review",
  "/saved",
  "/packs",
  "/pricing",
  "/save?slug=dissonance&source=word_page"
] as const satisfies readonly BetaOpsRouteSmokePath[];

export const BETA_OPS_REQUIRED_CONSOLE_HYDRATION_CAPTURE_IDS = [
  "console_error_count",
  "hydration_warning_count",
  "route_load_result",
  "screenshot_or_video_reference",
  "stale_dev_server_mitigation"
] as const;

export const BETA_OPS_REQUIRED_INCIDENT_LOG_FIELD_KEYS = [
  "issueId",
  "participantIdOrAlias",
  "route",
  "severity",
  "reproductionSteps",
  "browserDevice",
  "localStorageKeysInvolvedRedacted",
  "screenshotVideoReference",
  "ownerDecision",
  "status",
  "resolvedTimestamp"
] as const satisfies readonly BetaOpsIncidentLogFieldKey[];

export const BETA_OPS_REQUIRED_SUPPORT_PRIVACY_REQUIREMENT_IDS = [
  "support_contact_defined",
  "support_response_expectation_defined",
  "issue_reporting_process_defined",
  "refund_cancellation_copy_ready",
  "privacy_copy_ready",
  "local_state_disclosure_ready",
  "account_sync_limitation_disclosure_ready",
  "manual_payment_disclosure_ready",
  "no_automatic_entitlement_disclosure_ready",
  "no_raw_payment_data_collected_in_app",
  "no_provider_tokens_or_secrets_stored",
  "private_manual_beta_notice_ready",
  "public_signup_and_public_paid_beta_blocked"
] as const satisfies readonly BetaOpsSupportPrivacyRequirementId[];

export const BETA_OPS_REQUIRED_PARTICIPANT_CONSENT_IDS = [
  "consent_private_manual_beta",
  "consent_local_state_limit",
  "consent_account_sync_missing",
  "consent_manual_payment_no_auto_access",
  "consent_support_refund_privacy",
  "consent_issue_reporting",
  "consent_pause_rollback"
] as const;

export const BETA_OPS_REQUIRED_OWNER_CHECKLIST_IDS = [
  "owner_approve_private_manual_verdict",
  "owner_run_required_route_smoke",
  "owner_restart_local_dev_server",
  "owner_prepare_incident_log",
  "owner_define_support_contact_response",
  "owner_approve_refund_cancellation_privacy_copy",
  "owner_confirm_no_forbidden_integrations",
  "owner_accept_pause_rollback_criteria"
] as const;

export const BETA_OPS_REQUIRED_PAUSE_ROLLBACK_IDS = [
  "pause_review_loop_broken",
  "pause_local_state_loss_pattern",
  "pause_console_or_hydration_blocker",
  "pause_support_unresponsive",
  "pause_refund_cancellation_or_privacy_gap",
  "pause_public_or_self_serve_exposure",
  "pause_forbidden_integration_detected"
] as const;

export const BETA_OPS_REQUIRED_BLOCKED_INTEGRATION_IDS = [
  "real_monitoring_sdk",
  "real_analytics_sdk",
  "real_payment_integration",
  "real_account_sync",
  "auth_integration",
  "database_provider",
  "api_routes_or_route_handlers",
  "middleware",
  "ai_calls",
  "deployment_or_env_changes"
] as const;

export const BETA_OPS_REQUIRED_NEXT_PR_NUMBERS = [84, 85] as const;

export const BETA_OPS_REQUIRED_NEXT_PR_TITLES = [
  "Private beta readiness rerun",
  "Owner-run private beta launch checklist"
] as const;

export const BETA_OPS_DOC_FILES = [
  "docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md",
  "README.md"
] as const;

export const BETA_OPS_MODULE_FILES = [
  "src/lib/beta-ops-gate/beta-ops-gate.ts",
  "src/lib/beta-ops-gate/fixtures.ts",
  "src/lib/beta-ops-gate/README.md"
] as const;

export const BETA_OPS_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "middleware.ts",
  "src/app/payment",
  "src/app/payments",
  "src/app/billing",
  "src/app/checkout",
  "src/app/account/sync",
  "src/app/sync",
  "src/pages/payment",
  "src/pages/payments",
  "src/pages/billing",
  "src/pages/checkout",
  "src/pages/auth",
  "prisma",
  "drizzle",
  "migrations",
  "supabase",
  "firebase"
] as const;

export const BETA_OPS_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@sentry/nextjs",
  "@sentry/browser",
  "posthog-js",
  "@datadog/browser-rum",
  "@datadog/browser-logs",
  "newrelic",
  "winston",
  "pino",
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
  "@cloudflare/d1",
  "@cloudflare/workers-types",
  "wrangler",
  "@clerk/nextjs",
  "next-auth",
  "better-auth",
  "stripe",
  "paddle",
  "openai",
  "@ai-sdk/openai"
] as const;

export const BETA_OPS_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const BETA_OPS_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "monitoringSdkAllowed",
  "analyticsSdkAllowed",
  "apiRoutesAllowed",
  "routeHandlersAllowed",
  "middlewareAllowed",
  "authIntegrationAllowed",
  "databaseProviderAllowed",
  "providerSdkAllowed",
  "paymentBillingCheckoutAllowed",
  "entitlementMutationAllowed",
  "accountSyncAllowed",
  "realAccountSyncAllowed",
  "aiCallsAllowed",
  "environmentVariableChangesAllowed",
  "deploymentChangesAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "secretsTouchedAllowed",
  "productionDataMutationAllowed",
  "networkCallsAllowed",
  "browserStorageMutationAllowed",
  "npmAuditFixAllowed"
] as const;

export const BETA_OPS_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Required Verdicts",
  "Monitoring Minimum Requirements",
  "Required Browser Smoke Routes",
  "Console And Hydration Capture",
  "Manual Incident Log Requirements",
  "Support, Refund, Cancellation, And Privacy Requirements",
  "Participant Consent Checklist",
  "Owner Approval Checklist",
  "Pause And Rollback Criteria",
  "Operational Risks",
  "Next PR Sequence",
  "Safety Confirmation"
] as const;

export const BETA_OPS_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly BetaOpsGateSeverity[];

export const BETA_OPS_INCIDENT_LOG_FIELDS_FIXTURE =
  BETA_OPS_INCIDENT_LOG_FIELDS;

export const BETA_OPS_SUPPORT_PRIVACY_REQUIREMENTS_FIXTURE =
  BETA_OPS_SUPPORT_PRIVACY_REQUIREMENTS;

export const BETA_OPS_PAUSE_ROLLBACK_CRITERIA_FIXTURE =
  BETA_OPS_PAUSE_ROLLBACK_CRITERIA;

export const BETA_OPS_NEXT_PR_SEQUENCE_FIXTURE = BETA_OPS_NEXT_PR_SEQUENCE;

export const BETA_OPS_INCIDENT_LOG_ENTRY_FIXTURE = {
  issueId: "beta-ops-001",
  participantIdOrAlias: "participant-alpha",
  route: "/review",
  severity: "P1",
  reproductionSteps: [
    "Open /review from a clean private beta browser profile.",
    "Answer the first prompt incorrectly.",
    "Check whether the next review item appears."
  ],
  browserDevice: "Chrome 125 on Windows desktop, 1440x900",
  localStorageKeysInvolvedRedacted: [
    "vlx_review_state_v1",
    "vlx_review_events_v1"
  ],
  screenshotVideoReference: "none_available",
  ownerDecision: "Monitor after rerun; pause if reproduced by another user.",
  status: "triaged",
  resolvedTimestamp: "unresolved"
} as const satisfies BetaOpsIncidentLogEntry;
