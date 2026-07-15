import {
  PAID_BETA_BLOCKERS,
  PAID_BETA_FUNNEL_CHECKPOINTS,
  PAID_BETA_LAUNCH_GATES,
  PAID_BETA_LOCAL_STORAGE_KEY_INVENTORY,
  PAID_BETA_READINESS_AREA_IDS,
  PAID_BETA_READINESS_AUDIT,
  PAID_BETA_ROUTE_INVENTORY
} from "@/lib/paid-beta-readiness/paid-beta-readiness-audit";
import type { PaidBetaReadinessArea } from "@/lib/paid-beta-readiness/paid-beta-readiness-audit";

export const PAID_BETA_READINESS_EXPECTED_AREA_IDS = [
  "save_to_review_loop",
  "local_srs_state_events",
  "due_weak_mastered",
  "review_modes",
  "weak_words_sprint",
  "saved_library",
  "dashboard_mission",
  "pack_preview",
  "pack_progress",
  "paywall_triggers",
  "pricing_outcome_copy",
  "paid_beta_interest_capture",
  "extension_bridge",
  "multilingual_alias_search",
  "analytics_events",
  "accessibility",
  "mobile_responsiveness",
  "empty_loading_error_states",
  "manual_qa",
  "account_sync",
  "payment_path",
  "production_monitoring",
  "privacy_safety"
] as const satisfies readonly PaidBetaReadinessArea[];

export const PAID_BETA_READINESS_REQUIRED_ROUTES = [
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

export const PAID_BETA_READINESS_REQUIRED_LOCAL_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
] as const;

export const PAID_BETA_READINESS_REQUIRED_FUNNEL_CHECKPOINT_IDS = [
  "visitor_can_save_word",
  "saved_word_becomes_review_item",
  "review_session_writes_events_and_stats",
  "due_weak_mastered_real_state",
  "pack_preview_can_start_review",
  "pack_progress_real_answers_or_honest",
  "weak_sprint_real_weak_state",
  "pricing_explains_outcomes",
  "upgrade_interest_attribution_only",
  "no_paid_entitlement_granted",
  "no_real_checkout_implied",
  "extension_source_safe",
  "alias_search_source_attribution",
  "analytics_privacy_safe"
] as const;

export const PAID_BETA_READINESS_REQUIRED_P0_BLOCKER_IDS = [
  "no_real_account_server_sync_enabled",
  "no_real_payment_checkout_subscription_path",
  "no_production_entitlement_system",
  "no_production_monitoring_analytics_approval",
  "no_full_funnel_manual_qa_recorded",
  "no_privacy_legal_launch_review_recorded",
  "no_support_refund_failed_payment_flow",
  "no_public_launch_rollback_plan",
  "no_production_data_migration_backup_plan",
  "no_accessibility_audit_pass"
] as const;

export const PAID_BETA_READINESS_REQUIRED_P1_BLOCKER_IDS = [
  "mobile_qa_not_fully_evidenced",
  "empty_loading_error_state_checklist_incomplete",
  "pricing_copy_outcome_review_needed",
  "pack_content_depth_content_audit_needed",
  "extension_bridge_e2e_browser_qa_needed",
  "ko_ja_alias_coverage_review_needed",
  "analytics_taxonomy_launch_dashboard_mapping_needed"
] as const;

export const PAID_BETA_READINESS_REQUIRED_P2_BLOCKER_IDS = [
  "ui_polish_copy_improvements",
  "advanced_streak_calendar_polish",
  "more_pack_categories",
  "future_ai_mistake_explanation",
  "future_multilingual_concept_graph"
] as const;

export const PAID_BETA_READINESS_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
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
  "src/pages/payment",
  "src/pages/payments",
  "src/pages/billing",
  "src/pages/checkout"
] as const;

export const PAID_BETA_READINESS_FORBIDDEN_DIRECT_DEPENDENCIES = [
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
  "@clerk/nextjs",
  "next-auth",
  "better-auth",
  "stripe",
  "paddle",
  "@sentry/nextjs",
  "posthog-js",
  "@datadog/browser-rum",
  "newrelic",
  "zod",
  "yup",
  "valibot",
  "ajv"
] as const;

export const PAID_BETA_READINESS_MODULE_FILES = [
  "src/lib/paid-beta-readiness/paid-beta-readiness-audit.ts",
  "src/lib/paid-beta-readiness/fixtures.ts",
  "src/lib/paid-beta-readiness/README.md"
] as const;

export const PAID_BETA_READINESS_DOC_FILES = [
  "docs/PAID_BETA_READINESS_AUDIT.md",
  "README.md"
] as const;

export const PAID_BETA_READINESS_AUDIT_FIXTURE =
  PAID_BETA_READINESS_AUDIT;

export const PAID_BETA_READINESS_AREA_ID_FIXTURES =
  PAID_BETA_READINESS_AREA_IDS;

export const PAID_BETA_READINESS_ROUTE_FIXTURES =
  PAID_BETA_ROUTE_INVENTORY;

export const PAID_BETA_READINESS_LOCAL_STORAGE_FIXTURES =
  PAID_BETA_LOCAL_STORAGE_KEY_INVENTORY;

export const PAID_BETA_READINESS_FUNNEL_FIXTURES =
  PAID_BETA_FUNNEL_CHECKPOINTS;

export const PAID_BETA_READINESS_BLOCKER_FIXTURES = PAID_BETA_BLOCKERS;

export const PAID_BETA_READINESS_LAUNCH_GATE_FIXTURES =
  PAID_BETA_LAUNCH_GATES;
