import {
  TRACK_B_PRODUCT_UI_FINDINGS,
  TRACK_B_PRODUCT_UI_READINESS_AUDIT,
  TRACK_B_PRODUCT_UI_ROUTE_AUDITS,
  TRACK_B_PRODUCT_UI_ROUTE_PATHS
} from "@/lib/product-ui-readiness/product-ui-readiness-audit";
import type {
  TrackBProductUiRoutePath,
  TrackBProductUiSeverity
} from "@/lib/product-ui-readiness/product-ui-readiness-audit";

export const TRACK_B_PRODUCT_UI_REQUIRED_ROUTE_PATHS = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/[packId]",
  "/pricing",
  "/save",
  "/word/[slug]",
  "/settings"
] as const satisfies readonly TrackBProductUiRoutePath[];

export const TRACK_B_PRODUCT_UI_REQUIRED_P0_FINDING_IDS = [
  "p0_public_beta_account_sync_missing",
  "p0_public_beta_payment_entitlement_missing",
  "p0_full_route_manual_qa_missing",
  "p0_accessibility_keyboard_mobile_evidence_missing",
  "p0_public_beta_privacy_support_rollback_missing"
] as const;

export const TRACK_B_PRODUCT_UI_REQUIRED_P1_FINDING_IDS = [
  "p1_dashboard_hierarchy_needs_today_first_rebuild",
  "p1_review_session_needs_confidence_and_focus",
  "p1_saved_page_needs_queue_tabs",
  "p1_packs_need_course_plan_model",
  "p1_pricing_paywall_need_outcome_clarity",
  "p1_analytics_taxonomy_needs_ui_mapping"
] as const;

export const TRACK_B_PRODUCT_UI_REQUIRED_P2_FINDING_IDS = [
  "p2_copy_density_and_debug_language_polish",
  "p2_visual_cue_consistency_polish",
  "p2_future_progress_surface"
] as const;

export const TRACK_B_PRODUCT_UI_REQUIRED_NEXT_PR_NUMBERS = [
  73,
  74,
  75,
  76,
  77,
  78,
  79
] as const;

export const TRACK_B_PRODUCT_UI_REQUIRED_SAFETY_BOUNDARY_IDS = [
  "no_runtime_ui_changes",
  "no_api_routes_or_handlers",
  "no_database_or_provider_sdk",
  "no_payment_billing_or_entitlement",
  "no_production_or_platform_mutation",
  "no_fake_mastery_or_fake_paid_access"
] as const;

export const TRACK_B_PRODUCT_UI_FORBIDDEN_ACTUAL_PATHS = [
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
  "src/pages/checkout"
] as const;

export const TRACK_B_PRODUCT_UI_FORBIDDEN_DIRECT_DEPENDENCIES = [
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
  "paddle"
] as const;

export const TRACK_B_PRODUCT_UI_MODULE_FILES = [
  "src/lib/product-ui-readiness/product-ui-readiness-audit.ts",
  "src/lib/product-ui-readiness/fixtures.ts",
  "src/lib/product-ui-readiness/README.md"
] as const;

export const TRACK_B_PRODUCT_UI_DOC_FILES = [
  "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md",
  "README.md"
] as const;

export const TRACK_B_PRODUCT_UI_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly TrackBProductUiSeverity[];

export const TRACK_B_PRODUCT_UI_AUDIT_FIXTURE =
  TRACK_B_PRODUCT_UI_READINESS_AUDIT;

export const TRACK_B_PRODUCT_UI_ROUTE_PATH_FIXTURES =
  TRACK_B_PRODUCT_UI_ROUTE_PATHS;

export const TRACK_B_PRODUCT_UI_ROUTE_AUDIT_FIXTURES =
  TRACK_B_PRODUCT_UI_ROUTE_AUDITS;

export const TRACK_B_PRODUCT_UI_FINDING_FIXTURES =
  TRACK_B_PRODUCT_UI_FINDINGS;
