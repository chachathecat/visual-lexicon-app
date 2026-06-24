import {
  PAID_BETA_MANUAL_QA_CONSOLE_PROBES,
  PAID_BETA_MANUAL_QA_CONTRACT,
  PAID_BETA_MANUAL_QA_ROUTE_TARGETS,
  PAID_BETA_MANUAL_QA_SCENARIOS,
  PAID_BETA_MANUAL_QA_STOP_CONDITIONS,
  PAID_BETA_MANUAL_QA_STORAGE_PROBES
} from "@/lib/paid-beta-manual-qa/paid-beta-manual-qa";

export const PAID_BETA_MANUAL_QA_REQUIRED_SCENARIO_IDS = [
  "clean_guest_first_visit",
  "save_word_from_word_page",
  "save_word_from_alias_search",
  "save_word_from_extension_source",
  "saved_library_review_entry",
  "review_due_session",
  "review_weak_session",
  "review_word_focused_session",
  "review_hub_session",
  "weak_words_sprint",
  "pack_preview_start",
  "pack_preview_completion",
  "pack_progress_continuation",
  "pricing_interest_capture",
  "paywall_trigger_save_limit",
  "paywall_trigger_review_limit",
  "dashboard_mission_counts",
  "settings_plan_state_safety",
  "mobile_dashboard_review_flow",
  "empty_state_review_no_due",
  "no_fake_mastery_after_save_only",
  "no_paid_entitlement_from_interest",
  "local_storage_privacy_probe"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_ROUTES = [
  "/",
  "/dashboard",
  "/saved",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=alias_search",
  "/save?slug=dissonance&source=extension",
  "/review",
  "/review?mode=due",
  "/review?mode=weak",
  "/review?mode=word&slug=dissonance",
  "/review?mode=hub&hub=academic-vocabulary&limit=10",
  "/review/weak-sprint",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings",
  "/word/dissonance"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_CONSOLE_PROBE_IDS = [
  "list_vlx_local_storage_keys",
  "inspect_saved_words",
  "inspect_review_state_dissonance",
  "inspect_review_events_count",
  "inspect_daily_stats",
  "inspect_pack_progress",
  "inspect_upgrade_interest",
  "confirm_no_paid_entitlement_from_interest",
  "confirm_saved_only_no_fake_mastery"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_P0_STOP_CONDITION_IDS = [
  "save_missing_review_item",
  "review_answer_missing_event",
  "review_answer_missing_state_update",
  "fake_counts_not_state_derived",
  "save_only_word_mastered",
  "upgrade_interest_grants_paid_entitlement",
  "pricing_implies_real_checkout",
  "pack_progress_without_review_evidence",
  "weak_sprint_uses_fake_weak_words",
  "alias_search_missing_slug",
  "extension_source_save_fails",
  "local_storage_private_or_secret_payload",
  "core_route_crash",
  "mobile_review_unusable",
  "keyboard_navigation_blocks_core_flow"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_P1_STOP_CONDITION_IDS = [
  "ambiguous_cta_copy",
  "incomplete_empty_loading_error_state",
  "weak_mobile_layout",
  "pack_copy_needs_polish",
  "pricing_outcome_copy_needs_polish",
  "analytics_event_naming_not_mapped",
  "alias_search_coverage_too_small",
  "extension_bridge_not_browser_tested"
] as const;

export const PAID_BETA_MANUAL_QA_REQUIRED_P2_STOP_CONDITION_IDS = [
  "visual_polish",
  "more_pack_categories",
  "more_detailed_streak_calendar",
  "future_ai_explanation",
  "future_multilingual_expansion"
] as const;

export const PAID_BETA_MANUAL_QA_FORBIDDEN_ACTUAL_PATHS = [
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

export const PAID_BETA_MANUAL_QA_FORBIDDEN_DIRECT_DEPENDENCIES = [
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
  "pino",
  "@logtail/node",
  "zod",
  "yup",
  "valibot",
  "ajv",
  "joi",
  "superstruct"
] as const;

export const PAID_BETA_MANUAL_QA_RUNTIME_INTEGRATION_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PAID_BETA_MANUAL_QA_MODULE_FILES = [
  "src/lib/paid-beta-manual-qa/paid-beta-manual-qa.ts",
  "src/lib/paid-beta-manual-qa/fixtures.ts",
  "src/lib/paid-beta-manual-qa/README.md"
] as const;

export const PAID_BETA_MANUAL_QA_DOC_FILES = [
  "docs/PAID_BETA_MANUAL_QA_CHECKLIST.md",
  "README.md"
] as const;

export const PAID_BETA_MANUAL_QA_CONTRACT_FIXTURE =
  PAID_BETA_MANUAL_QA_CONTRACT;

export const PAID_BETA_MANUAL_QA_SCENARIO_FIXTURES =
  PAID_BETA_MANUAL_QA_SCENARIOS;

export const PAID_BETA_MANUAL_QA_ROUTE_FIXTURES =
  PAID_BETA_MANUAL_QA_ROUTE_TARGETS;

export const PAID_BETA_MANUAL_QA_STORAGE_FIXTURES =
  PAID_BETA_MANUAL_QA_STORAGE_PROBES;

export const PAID_BETA_MANUAL_QA_CONSOLE_FIXTURES =
  PAID_BETA_MANUAL_QA_CONSOLE_PROBES;

export const PAID_BETA_MANUAL_QA_STOP_CONDITION_FIXTURES =
  PAID_BETA_MANUAL_QA_STOP_CONDITIONS;
