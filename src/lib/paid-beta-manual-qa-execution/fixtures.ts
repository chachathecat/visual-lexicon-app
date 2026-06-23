import {
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS,
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS
} from "@/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";
import type {
  PaidBetaManualQaExecutionRoutePath,
  PaidBetaManualQaExecutionSeverity
} from "@/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES = [
  "/",
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/save?slug=dissonance&source=word_page",
  "/word/dissonance",
  "/word/obfuscate"
] as const satisfies readonly PaidBetaManualQaExecutionRoutePath[];

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "git diff --check"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_upgrade_interest_v1",
  "vlx_plan_state_v1",
  "vlx_pending_home_quiz"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS = [
  "p0_real_payment_checkout_not_implemented",
  "p0_production_account_sync_not_implemented",
  "p0_monitoring_alerting_not_implemented",
  "p0_privacy_support_refund_gate_incomplete",
  "p0_full_accessibility_audit_incomplete",
  "p0_public_paid_beta_no_go"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS = [
  "p1_private_beta_owner_oversight_required",
  "p1_account_sync_preview_digest_needed",
  "p1_manual_payment_entitlement_policy_needed",
  "p1_qa_evidence_repeat_before_public_launch"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS = [
  "p2_richer_ielts_gre_pack_data",
  "p2_deeper_mobile_polish",
  "p2_future_ai_mistake_explanation",
  "p2_future_no_watermark_download_export"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "apiRoutesAllowed",
  "routeHandlersAllowed",
  "middlewareAllowed",
  "authAllowed",
  "databaseProviderAllowed",
  "paymentBillingCheckoutAllowed",
  "environmentVariableChangesAllowed",
  "productionDataMutationAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "fakeMasteryAllowed",
  "fakePaidAccessAllowed",
  "networkCallsAllowed",
  "browserStorageWritesAllowed"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api",
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

export const PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const PAID_BETA_MANUAL_QA_EXECUTION_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_MODULE_FILES = [
  "src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution.ts",
  "src/lib/paid-beta-manual-qa-execution/fixtures.ts",
  "src/lib/paid-beta-manual-qa-execution/README.md"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_DOC_FILES = [
  "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
  "README.md"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Tested Environment",
  "Validation Commands",
  "Browser Smoke Summary",
  "Route-By-Route QA Matrix",
  "localStorage Probe Checklist",
  "Console / Hydration Error Checklist",
  "Mobile / Keyboard / Accessibility Smoke Checklist",
  "Paywall Trigger Checklist",
  "P0 Blockers",
  "P1 Issues",
  "P2 Polish",
  "Stop Conditions",
  "Rollback Notes",
  "Recommended Next PRs",
  "Safety Confirmation"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PaidBetaManualQaExecutionSeverity[];

export const PAID_BETA_MANUAL_QA_EXECUTION_REPORT_FIXTURE =
  PAID_BETA_MANUAL_QA_EXECUTION_REPORT;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATH_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECK_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS;

export const PAID_BETA_MANUAL_QA_EXECUTION_FINDING_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS;

export const PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMAND_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS;
