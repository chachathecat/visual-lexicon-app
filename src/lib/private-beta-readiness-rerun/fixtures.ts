import {
  PRIVATE_BETA_READINESS_RERUN,
  PRIVATE_BETA_READINESS_RERUN_GATE_MATRIX,
  PRIVATE_BETA_READINESS_RERUN_NEXT_PR_SEQUENCE,
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS,
  PRIVATE_BETA_READINESS_RERUN_SOURCE_PRS
} from "@/lib/private-beta-readiness-rerun/private-beta-readiness-rerun";
import type {
  PrivateBetaReadinessRerun,
  PrivateBetaReadinessRerunSeverity,
  PrivateBetaReadinessRerunSourcePrNumber
} from "@/lib/private-beta-readiness-rerun/private-beta-readiness-rerun";

export const PRIVATE_BETA_READINESS_RERUN_FIXTURE =
  PRIVATE_BETA_READINESS_RERUN satisfies PrivateBetaReadinessRerun;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_NUMBERS = [
  79,
  80,
  81,
  82,
  83
] as const satisfies readonly PrivateBetaReadinessRerunSourcePrNumber[];

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_SOURCE_PR_LABELS = [
  "#79",
  "#80",
  "#81",
  "#82",
  "#83"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_ALLOWED_CONDITION_IDS = [
  "owner_invites_5_to_20_users_manually",
  "payment_manual_or_payment_link_only",
  "entitlement_manual_not_automatic",
  "users_accept_local_state_account_sync_limit",
  "support_contact_ready",
  "refund_cancellation_wording_ready",
  "manual_monitoring_and_incident_log_ready",
  "owner_reruns_smoke_checks",
  "no_public_signup_or_checkout"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_BLOCKED_CONDITION_IDS = [
  "manual_qa_missing_or_stale",
  "public_signup_or_public_checkout_exists",
  "automatic_entitlement_exists",
  "account_sync_limitation_not_accepted",
  "support_refund_privacy_not_ready",
  "manual_monitoring_or_incident_log_missing",
  "owner_approval_missing"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_PUBLIC_P0_IDS = [
  "p0_no_real_payment_integration",
  "p0_no_real_account_sync",
  "p0_no_automated_entitlement",
  "p0_no_production_monitoring_alerting",
  "p0_full_accessibility_audit_not_complete",
  "p0_privacy_support_refund_final_gate_not_complete"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_OWNER_CHECKLIST_IDS = [
  "owner_approve_manual_only_verdict",
  "owner_approve_5_to_20_roster",
  "owner_approve_manual_payment",
  "owner_approve_manual_entitlement",
  "owner_approve_local_state_disclosure",
  "owner_approve_support_privacy_refund",
  "owner_approve_manual_monitoring",
  "owner_confirm_no_public_launch"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_MANUAL_QA_IDS = [
  "qa_save_creates_review_state",
  "qa_review_writes_events",
  "qa_due_weak_mastered_real_state",
  "qa_core_routes_load",
  "qa_console_hydration_counts",
  "qa_mobile_keyboard_smoke"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_PAYMENT_ENTITLEMENT_IDS = [
  "payment_manual_or_link_only",
  "payment_no_checkout_sdk",
  "entitlement_owner_manual_record",
  "entitlement_no_automatic_grant",
  "payment_refund_cancellation_ready"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_ACCOUNT_SYNC_IDS = [
  "sync_real_account_sync_blocked",
  "sync_preview_digest_only",
  "sync_local_state_disclosure",
  "sync_no_entitlement_claim"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_MONITORING_SUPPORT_PRIVACY_IDS = [
  "ops_manual_monitoring_ready",
  "ops_incident_log_ready",
  "ops_support_contact_ready",
  "ops_privacy_copy_ready",
  "ops_monitoring_sdk_blocked"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_INCIDENT_ROLLBACK_IDS = [
  "rollback_pause_invites_on_review_break",
  "rollback_pause_on_state_loss_pattern",
  "rollback_pause_on_support_privacy_refund_gap",
  "rollback_pause_on_public_exposure",
  "rollback_rerun_smoke_before_resume"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_NUMBERS = [
  85,
  86,
  87,
  88
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_NEXT_PR_TITLES = [
  "Owner-run private beta launch checklist",
  "Private beta invite packet / participant instructions",
  "Private beta issue log template",
  "Private beta final owner signoff"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Readiness Delta Since #79",
  "Gate-By-Gate Matrix",
  "Private Beta Allowed Conditions",
  "Private Beta Blocked Conditions",
  "Public Beta P0 Blockers",
  "Remaining P1 Requirements",
  "P2 Polish",
  "Owner Approval Checklist",
  "Manual QA Evidence Checklist",
  "Payment/Entitlement Checklist",
  "Account Sync Limitation Checklist",
  "Monitoring/Support/Privacy Checklist",
  "Incident/Rollback Checklist",
  "Launch/No-Launch Decision Table",
  "Recommended Next PR Sequence",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_SAFETY_FIELDS = [
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

export const PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api/account/sync/apply",
  "src/app/api/account/sync/audit",
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

export const PRIVATE_BETA_READINESS_RERUN_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const PRIVATE_BETA_READINESS_RERUN_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_MODULE_FILES = [
  "src/lib/private-beta-readiness-rerun/private-beta-readiness-rerun.ts",
  "src/lib/private-beta-readiness-rerun/fixtures.ts",
  "src/lib/private-beta-readiness-rerun/README.md"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_DOC_FILES = [
  "docs/PRIVATE_BETA_READINESS_RERUN.md",
  "README.md"
] as const;

export const PRIVATE_BETA_READINESS_RERUN_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PrivateBetaReadinessRerunSeverity[];

export const PRIVATE_BETA_READINESS_RERUN_SOURCE_PR_FIXTURES =
  PRIVATE_BETA_READINESS_RERUN_SOURCE_PRS;

export const PRIVATE_BETA_READINESS_RERUN_GATE_MATRIX_FIXTURES =
  PRIVATE_BETA_READINESS_RERUN_GATE_MATRIX;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICT_FIXTURE =
  PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS;

export const PRIVATE_BETA_READINESS_RERUN_NEXT_PR_SEQUENCE_FIXTURES =
  PRIVATE_BETA_READINESS_RERUN_NEXT_PR_SEQUENCE;
