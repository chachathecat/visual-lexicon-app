import {
  PRIVATE_BETA_GATE,
  PRIVATE_BETA_GATE_NEXT_PR_SEQUENCE,
  PRIVATE_BETA_GATE_POLICIES,
  PRIVATE_BETA_GATE_PUBLIC_P0_BLOCKERS,
  PRIVATE_BETA_GATE_ROLLBACK_CRITERIA
} from "@/lib/private-beta-gate/private-beta-gate";
import type {
  PrivateBetaGatePolicyId,
  PrivateBetaGateSeverity
} from "@/lib/private-beta-gate/private-beta-gate";

export const PRIVATE_BETA_GATE_REQUIRED_POLICY_IDS = [
  "owner_invited_only",
  "manual_or_payment_link_only",
  "manual_entitlement_no_mutation",
  "no_public_signup",
  "public_paid_beta_no_go",
  "no_real_checkout",
  "no_automatic_paid_access",
  "account_sync_limitation_disclosure",
  "single_browser_local_state_limitation",
  "support_contact_required",
  "refund_cancellation_copy_required",
  "privacy_copy_required",
  "monitoring_minimum_required",
  "issue_reporting_process_required",
  "rollback_pause_criteria_required",
  "owner_approval_before_production_launch"
] as const satisfies readonly PrivateBetaGatePolicyId[];

export const PRIVATE_BETA_GATE_REQUIRED_ALLOWED_CONDITION_IDS = [
  "cohort_5_to_20_owner_invited",
  "manual_qa_evidence_recorded",
  "payment_manual_or_link_only",
  "no_automatic_entitlement",
  "local_state_disclosed",
  "support_privacy_refund_ready",
  "monitoring_owner_assigned",
  "owner_approval_recorded"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_BLOCKED_CONDITION_IDS = [
  "missing_manual_qa_evidence",
  "open_public_signup_or_self_serve",
  "real_checkout_or_payment_sdk_present",
  "automatic_entitlement_grant_present",
  "support_refund_privacy_copy_missing",
  "monitoring_issue_reporting_missing",
  "owner_approval_missing"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_PUBLIC_P0_IDS = [
  "p0_real_payment_billing_entitlement_missing",
  "p0_account_sync_missing",
  "p0_production_monitoring_missing",
  "p0_privacy_support_refund_gate_missing",
  "p0_accessibility_gate_missing",
  "p0_public_launch_qa_missing"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_P1_IDS = [
  "p1_owner_roster_and_invite_log",
  "p1_account_sync_local_state_disclosure",
  "p1_manual_payment_entitlement_policy",
  "p1_support_refund_privacy_copy",
  "p1_monitoring_issue_log",
  "p1_accessibility_mobile_smoke"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_P2_IDS = [
  "p2_pack_content_depth",
  "p2_dashboard_progress_polish",
  "p2_onboarding_copy_polish",
  "p2_future_ai_mistake_explanation"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_NUMBERS = [
  81,
  82,
  83,
  84,
  85
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_NEXT_PR_TITLES = [
  "Manual payment / entitlement policy",
  "Account sync preview/digest mock",
  "Monitoring, support, privacy beta gate",
  "Private beta readiness rerun",
  "Owner-run private beta launch checklist"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Launch Allowed Conditions",
  "Launch Blocked Conditions",
  "P0 Blockers For Public Beta",
  "P1 Requirements Before Private Beta",
  "P2 Polish",
  "Participant Cap Recommendation",
  "Owner Checklist",
  "Manual QA Evidence Requirements",
  "Monitoring Checklist",
  "Support / Refund / Privacy Checklist",
  "Rollback Plan",
  "Next PR Sequence",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "apiRoutesAllowed",
  "routeHandlersAllowed",
  "middlewareAllowed",
  "authIntegrationAllowed",
  "databaseProviderAllowed",
  "providerSdkAllowed",
  "paymentBillingCheckoutAllowed",
  "entitlementMutationAllowed",
  "accountSyncAllowed",
  "aiCallsAllowed",
  "environmentVariableChangesAllowed",
  "deploymentChangesAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "productionDataMutationAllowed",
  "networkCallsAllowed",
  "browserStorageAccessAllowed",
  "npmAuditFixAllowed"
] as const;

export const PRIVATE_BETA_GATE_FORBIDDEN_ACTUAL_PATHS = [
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
  "src/pages/payment",
  "src/pages/payments",
  "src/pages/billing",
  "src/pages/checkout",
  "prisma",
  "drizzle",
  "migrations",
  "supabase",
  "firebase"
] as const;

export const PRIVATE_BETA_GATE_FORBIDDEN_DIRECT_DEPENDENCIES = [
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
  "@sentry/nextjs",
  "posthog-js",
  "@datadog/browser-rum",
  "newrelic",
  "winston",
  "pino"
] as const;

export const PRIVATE_BETA_GATE_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_GATE_MODULE_FILES = [
  "src/lib/private-beta-gate/private-beta-gate.ts",
  "src/lib/private-beta-gate/fixtures.ts",
  "src/lib/private-beta-gate/README.md"
] as const;

export const PRIVATE_BETA_GATE_DOC_FILES = [
  "docs/PRIVATE_BETA_GATE_PREP.md",
  "README.md"
] as const;

export const PRIVATE_BETA_GATE_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PrivateBetaGateSeverity[];

export const PRIVATE_BETA_GATE_FIXTURE = PRIVATE_BETA_GATE;

export const PRIVATE_BETA_GATE_POLICY_FIXTURES =
  PRIVATE_BETA_GATE_POLICIES;

export const PRIVATE_BETA_GATE_PUBLIC_P0_FIXTURES =
  PRIVATE_BETA_GATE_PUBLIC_P0_BLOCKERS;

export const PRIVATE_BETA_GATE_ROLLBACK_CRITERIA_FIXTURES =
  PRIVATE_BETA_GATE_ROLLBACK_CRITERIA;

export const PRIVATE_BETA_GATE_NEXT_PR_SEQUENCE_FIXTURES =
  PRIVATE_BETA_GATE_NEXT_PR_SEQUENCE;
