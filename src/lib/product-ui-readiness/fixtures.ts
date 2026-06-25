import {
  TRACK_B_PRODUCT_UI_FINDINGS,
  TRACK_B_PRODUCT_UI_READINESS_AUDIT,
  TRACK_B_PRODUCT_UI_ROUTE_AUDITS,
  TRACK_B_PRODUCT_UI_ROUTE_PATHS,
  TRACK_B_PRODUCT_UI_SOURCE_METADATA
} from "@/lib/product-ui-readiness/product-ui-readiness-audit";
import type {
  TrackBProductUiRoutePath,
  TrackBProductUiSeverity,
  TrackBProductUiSourceMetadata
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

export const TRACK_B_PRODUCT_UI_EXPECTED_SOURCE_METADATA = {
  reportType: "rendered-application evidence audit",
  reportVersion: 2,
  sourcePr: "#119",
  auditedCommit: "13141144a18e7192435b035478f2b0e7f469300f",
  auditDate: "2026-06-24"
} as const satisfies TrackBProductUiSourceMetadata;

export const TRACK_B_PRODUCT_UI_EXPECTED_CONFIRMED_FINDING_IDS = {
  P0: ["VLX-AUDIT-P0-001"],
  P1: ["VLX-AUDIT-P1-001", "VLX-AUDIT-P1-002"],
  P2: ["VLX-AUDIT-P2-001", "VLX-AUDIT-P2-002"]
} as const satisfies Record<TrackBProductUiSeverity, readonly string[]>;

export const TRACK_B_PRODUCT_UI_EXPECTED_SUSPECTED_FINDING_IDS = {
  P0: [],
  P1: ["VLX-AUDIT-RISK-002"],
  P2: ["VLX-AUDIT-RISK-001"]
} as const satisfies Record<TrackBProductUiSeverity, readonly string[]>;

export const TRACK_B_PRODUCT_UI_PRIVATE_P0_BLOCKER_IDS = [] as const;

export const TRACK_B_PRODUCT_UI_PUBLIC_P0_BLOCKER_IDS = [
  "VLX-AUDIT-P0-001"
] as const;

export const TRACK_B_PRODUCT_UI_PUBLIC_P0_REQUIRED_THEMES = [
  "payment/billing",
  "account sync",
  "support/refund/operational readiness"
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
  "src/lib/product-ui-readiness/fixtures.ts"
] as const;

export const TRACK_B_PRODUCT_UI_DOC_FILES = [
  "docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md"
] as const;

export const TRACK_B_PRODUCT_UI_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly TrackBProductUiSeverity[];

export const TRACK_B_PRODUCT_UI_AUDIT_FIXTURE =
  TRACK_B_PRODUCT_UI_READINESS_AUDIT;

export const TRACK_B_PRODUCT_UI_SOURCE_METADATA_FIXTURE =
  TRACK_B_PRODUCT_UI_SOURCE_METADATA;

export const TRACK_B_PRODUCT_UI_ROUTE_PATH_FIXTURES =
  TRACK_B_PRODUCT_UI_ROUTE_PATHS;

export const TRACK_B_PRODUCT_UI_ROUTE_AUDIT_FIXTURES =
  TRACK_B_PRODUCT_UI_ROUTE_AUDITS;

export const TRACK_B_PRODUCT_UI_FINDING_FIXTURES =
  TRACK_B_PRODUCT_UI_FINDINGS;
