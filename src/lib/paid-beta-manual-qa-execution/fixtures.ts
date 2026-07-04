import {
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS,
  PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES,
  PAID_BETA_MANUAL_QA_EXECUTION_REPORT,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS,
  PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS,
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS
} from "@/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";
import type {
  PaidBetaManualQaExecutionRoutePath,
  PaidBetaManualQaExecutionSeverity,
  PaidBetaManualQaExecutionStorageKey
} from "@/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution";

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_ROUTES = [
  "/dashboard",
  "/saved",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=alias_search",
  "/save?slug=dissonance&source=extension",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings",
  "/word/dissonance"
] as const satisfies readonly PaidBetaManualQaExecutionRoutePath[];

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const satisfies readonly PaidBetaManualQaExecutionStorageKey[];

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_QA_SECTION_TITLES = [
  "Save creates review item",
  "Review updates state/events",
  "Due/Weak/Mastered remain honest",
  "Weak sprint uses real weak evidence",
  "Pack preview/progress remains honest",
  "Pricing upgrade interest records local beta interest only",
  "No checkout/payment/billing route exists",
  "Public paid beta remains No-Go",
  "Private/manual paid beta is gated"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- tests/paid-beta-manual-qa-execution.spec.ts --workers=1"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P0_IDS = [] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P1_IDS = [
  "p1_private_beta_gate_owner_signoff_required",
  "p1_public_beta_account_sync_and_server_srs_missing",
  "p1_public_beta_payment_monitoring_support_privacy_gates_open",
  "p1_extension_source_needs_real_extension_e2e"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_P2_IDS = [
  "p2_richer_ielts_gre_pack_content",
  "p2_deeper_mobile_accessibility_polish",
  "p2_future_ai_and_export_features_deferred"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "apiRoutesAllowed",
  "routeHandlersAllowed",
  "middlewareAllowed",
  "webflowAllowed",
  "cloudflareWorkersAllowed",
  "authAllowed",
  "billingPaymentCheckoutAllowed",
  "dnsDeploymentSettingsAllowed",
  "secretsAllowed",
  "productionDataMutationAllowed",
  "paymentSdkAllowed",
  "publicPaidBetaUnblocked",
  "fakeQaResultsAllowed",
  "fakeMasteryAllowed",
  "fakePaidAccessAllowed"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api/account",
  "src/app/api/admin",
  "src/app/api/billing",
  "src/app/api/checkout",
  "src/app/api/downloads",
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
  "firebase"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_ALLOWED_ROUTE_HANDLERS = [
  "src/app/api/me/entitlements/route.ts",
  "src/app/auth/confirm/route.ts"
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
  "Route Coverage",
  "localStorage Evidence Checks",
  "QA Result Sections",
  "P0 Findings",
  "P1 Findings",
  "P2 Findings",
  "Recommendation",
  "Stop Conditions",
  "Rollback Notes",
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

export const PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEY_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS;

export const PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLE_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES;

export const PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTION_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS;

export const PAID_BETA_MANUAL_QA_EXECUTION_FINDING_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS;

export const PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMAND_FIXTURES =
  PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS;
