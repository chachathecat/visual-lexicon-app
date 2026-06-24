import {
  OWNER_BETA_LAUNCH_CHECKLIST,
  OWNER_BETA_LAUNCH_SOURCE_GATES,
  OWNER_BETA_NEXT_PR_SEQUENCE
} from "@/lib/owner-beta-launch-checklist/owner-beta-launch-checklist";
import type {
  OwnerBetaLaunchChecklist,
  OwnerBetaLaunchSeverity,
  OwnerBetaLaunchSourcePrNumber
} from "@/lib/owner-beta-launch-checklist/owner-beta-launch-checklist";

export const OWNER_BETA_LAUNCH_CHECKLIST_FIXTURE =
  OWNER_BETA_LAUNCH_CHECKLIST satisfies OwnerBetaLaunchChecklist;

export const OWNER_BETA_REQUIRED_SOURCE_PR_NUMBERS = [
  79,
  80,
  81,
  82,
  83,
  84
] as const satisfies readonly OwnerBetaLaunchSourcePrNumber[];

export const OWNER_BETA_REQUIRED_SOURCE_PR_LABELS = [
  "#79",
  "#80",
  "#81",
  "#82",
  "#83",
  "#84"
] as const;

export const OWNER_BETA_REQUIRED_PRECONDITION_IDS = [
  "precondition_pr79_manual_qa_report_exists",
  "precondition_pr80_private_beta_gate_exists",
  "precondition_pr81_manual_payment_policy_exists",
  "precondition_pr82_account_sync_mock_exists",
  "precondition_pr83_monitoring_support_privacy_gate_exists",
  "precondition_pr84_readiness_rerun_exists",
  "precondition_owner_reruns_smoke_checks",
  "precondition_support_contact_ready",
  "precondition_refund_cancellation_copy_ready",
  "precondition_privacy_local_state_copy_ready",
  "precondition_participant_cap_enforced_manually",
  "precondition_no_public_signup_or_checkout_exposed"
] as const;

export const OWNER_BETA_REQUIRED_NO_LAUNCH_IDS = [
  "no_launch_public_checkout_active",
  "no_launch_automatic_entitlement_active",
  "no_launch_real_account_sync_assumed",
  "no_launch_support_refund_privacy_copy_missing",
  "no_launch_monitoring_incident_log_missing",
  "no_launch_route_smoke_fails",
  "no_launch_console_hydration_errors_unresolved",
  "no_launch_owner_not_approved",
  "no_launch_participant_communication_incomplete"
] as const;

export const OWNER_BETA_REQUIRED_OWNER_SIGNOFF_IDS = [
  "owner_signoff_approve_current_verdicts",
  "owner_signoff_confirm_preconditions_complete",
  "owner_signoff_approve_roster_cap",
  "owner_signoff_approve_participant_copy",
  "owner_signoff_approve_smoke_evidence",
  "owner_signoff_accept_pause_rules",
  "owner_signoff_confirm_no_forbidden_changes"
] as const;

export const OWNER_BETA_REQUIRED_SELECTION_IDS = [
  "selection_known_manual_participants",
  "selection_cap_5_to_20",
  "selection_accepts_local_state",
  "selection_does_not_require_account_sync",
  "selection_can_report_issues"
] as const;

export const OWNER_BETA_REQUIRED_COMMUNICATION_IDS = [
  "communication_private_manual_beta_notice",
  "communication_invite_only_policy",
  "communication_local_state_account_sync_limitation",
  "communication_manual_payment_payment_link_only",
  "communication_no_automatic_entitlement",
  "communication_support_contact",
  "communication_refund_cancellation",
  "communication_privacy_copy",
  "communication_issue_reporting",
  "communication_pause_rollback"
] as const;

export const OWNER_BETA_REQUIRED_SMOKE_IDS = [
  "smoke_route_home",
  "smoke_route_dashboard",
  "smoke_route_review",
  "smoke_route_review_due",
  "smoke_route_review_weak",
  "smoke_route_saved",
  "smoke_route_packs",
  "smoke_route_word",
  "smoke_route_pricing_no_checkout",
  "smoke_console_hydration_counts",
  "smoke_local_storage_probe",
  "smoke_mobile_keyboard"
] as const;

export const OWNER_BETA_REQUIRED_LOCAL_STORAGE_PROBE_IDS = [
  "probe_saved_words_key",
  "probe_review_state_key",
  "probe_review_events_key",
  "probe_daily_stats_key"
] as const;

export const OWNER_BETA_REQUIRED_LOCAL_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1"
] as const;

export const OWNER_BETA_REQUIRED_INCIDENT_ROLLBACK_IDS = [
  "rollback_pause_review_loop_break",
  "rollback_pause_state_loss_pattern",
  "rollback_pause_console_hydration_blocker",
  "rollback_pause_support_refund_privacy_gap",
  "rollback_pause_public_exposure",
  "rollback_rerun_smoke_before_resume"
] as const;

export const OWNER_BETA_REQUIRED_POST_INVITE_MONITORING_IDS = [
  "monitor_daily_support_and_issue_log",
  "monitor_weekly_reviewed_words_signal",
  "monitor_payment_support_privacy_reports"
] as const;

export const OWNER_BETA_REQUIRED_FIRST_24_HOUR_IDS = [
  "first_24_review_invite_delivery",
  "first_24_review_blocking_issues",
  "first_24_review_pause_decision"
] as const;

export const OWNER_BETA_REQUIRED_FIRST_7_DAY_IDS = [
  "first_7_day_review_learning_loop",
  "first_7_day_review_operational_load",
  "first_7_day_review_cap_and_next_step"
] as const;

export const OWNER_BETA_REQUIRED_CONTINUATION_DECISION_IDS = [
  "decision_continue_private_beta",
  "decision_pause_private_beta",
  "decision_stop_private_beta"
] as const;

export const OWNER_BETA_REQUIRED_NEXT_PR_NUMBERS = [86, 87, 88] as const;

export const OWNER_BETA_REQUIRED_NEXT_PR_TITLES = [
  "Private beta invite packet / participant instructions",
  "Private beta issue log template",
  "Private beta final owner signoff"
] as const;

export const OWNER_BETA_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Launch Preconditions",
  "No-Launch Conditions",
  "Owner Final Signoff Checklist",
  "Participant Selection Checklist",
  "Invite-Only Policy",
  "Participant Cap",
  "Participant Communication Checklist",
  "Local-State/Account-Sync Limitation Disclosure",
  "Manual Payment And No Automatic Entitlement Disclosure",
  "Support, Refund, Cancellation, And Privacy Copy Checklist",
  "Smoke Test Checklist",
  "Console/Hydration Error Checklist",
  "localStorage Probe Checklist",
  "Manual Incident Log Checklist",
  "Rollback/Pause Checklist",
  "Post-Invite Monitoring Checklist",
  "First 24-Hour Review Checklist",
  "First 7-Day Review Checklist",
  "Final Beta Continuation/Stop Decision Checklist",
  "Recommended Next PR Sequence",
  "Safety Confirmation"
] as const;

export const OWNER_BETA_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "apiRoutesAllowed",
  "routeHandlersAllowed",
  "middlewareAllowed",
  "authIntegrationAllowed",
  "databaseProviderAllowed",
  "providerSdkAllowed",
  "paymentBillingCheckoutAllowed",
  "entitlementMutationAllowed",
  "automaticEntitlementAllowed",
  "accountSyncAllowed",
  "realAccountSyncAllowed",
  "monitoringSdkAllowed",
  "analyticsSdkAllowed",
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

export const OWNER_BETA_FORBIDDEN_ACTUAL_PATHS = [
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

export const OWNER_BETA_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const OWNER_BETA_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const OWNER_BETA_MODULE_FILES = [
  "src/lib/owner-beta-launch-checklist/owner-beta-launch-checklist.ts",
  "src/lib/owner-beta-launch-checklist/fixtures.ts",
  "src/lib/owner-beta-launch-checklist/README.md"
] as const;

export const OWNER_BETA_DOC_FILES = [
  "docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md",
  "README.md"
] as const;

export const OWNER_BETA_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly OwnerBetaLaunchSeverity[];

export const OWNER_BETA_SOURCE_GATE_FIXTURES =
  OWNER_BETA_LAUNCH_SOURCE_GATES;

export const OWNER_BETA_NEXT_PR_SEQUENCE_FIXTURES =
  OWNER_BETA_NEXT_PR_SEQUENCE;
