import {
  TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES,
  TRACK_B_SIMPLICITY_DEFERRED_FEATURES,
  TRACK_B_SIMPLICITY_FORBIDDEN_TOUCHPOINTS,
  TRACK_B_SIMPLICITY_RESET
} from "@/lib/track-b-simplicity-reset/track-b-simplicity-reset";
import type {
  TrackBSimplicityApprovedV0Route,
  TrackBSimplicityDeferredFeature,
  TrackBSimplifiedMentalModel
} from "@/lib/track-b-simplicity-reset/track-b-simplicity-reset";

export const TRACK_B_SIMPLICITY_REQUIRED_MENTAL_MODEL = [
  "Today",
  "Save",
  "Review",
  "Queue",
  "Upgrade interest"
] as const satisfies readonly TrackBSimplifiedMentalModel[];

export const TRACK_B_SIMPLICITY_REQUIRED_APPROVED_V0_ROUTES = [
  "/save",
  "/dashboard",
  "/review",
  "/saved",
  "/pricing"
] as const satisfies readonly TrackBSimplicityApprovedV0Route[];

export const TRACK_B_SIMPLICITY_REQUIRED_DEFERRED_FEATURE_IDS = [
  "weak_sprint",
  "ai_tutor",
  "real_checkout",
  "no_watermark_export",
  "external_participant_beta_validation"
] as const satisfies readonly TrackBSimplicityDeferredFeature["id"][];

export const TRACK_B_SIMPLICITY_REQUIRED_DASHBOARD_STATS = [
  "Due",
  "Weak",
  "New",
  "Reviewed this week"
] as const;

export const TRACK_B_SIMPLICITY_REQUIRED_CONFIDENCE_VALUES = [
  "knew",
  "guessed",
  "forgot"
] as const;

export const TRACK_B_SIMPLICITY_REQUIRED_NEXT_PR_NUMBERS = [
  94,
  95,
  96,
  97,
  98,
  99
] as const;

export const TRACK_B_SIMPLICITY_REQUIRED_FORBIDDEN_TOUCHPOINT_IDS = [
  "webflow",
  "cloudflare_workers",
  "vercel_settings",
  "dns",
  "deployment_settings",
  "billing",
  "payment",
  "checkout",
  "subscription",
  "auth_runtime",
  "provider_sdks",
  "secrets",
  "env_vars",
  "production_data",
  "api_routes",
  "route_handlers",
  "middleware",
  "npm_audit_fix"
] as const;

export const TRACK_B_SIMPLICITY_MODULE_FILES = [
  "src/lib/track-b-simplicity-reset/track-b-simplicity-reset.ts",
  "src/lib/track-b-simplicity-reset/fixtures.ts",
  "src/lib/track-b-simplicity-reset/README.md"
] as const;

export const TRACK_B_SIMPLICITY_DOC_FILES = [
  "docs/TRACK_B_SIMPLICITY_RESET.md",
  "README.md"
] as const;

export const TRACK_B_SIMPLICITY_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const TRACK_B_SIMPLICITY_CONTRACT_FIXTURE =
  TRACK_B_SIMPLICITY_RESET;

export const TRACK_B_SIMPLICITY_APPROVED_ROUTE_FIXTURES =
  TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES;

export const TRACK_B_SIMPLICITY_DEFERRED_FEATURE_FIXTURES =
  TRACK_B_SIMPLICITY_DEFERRED_FEATURES;

export const TRACK_B_SIMPLICITY_FORBIDDEN_TOUCHPOINT_FIXTURES =
  TRACK_B_SIMPLICITY_FORBIDDEN_TOUCHPOINTS;
