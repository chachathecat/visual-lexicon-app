import {
  PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE,
  PRIVATE_BETA_DRY_RUN_SMOKE_DECISION,
  PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS,
  PRIVATE_BETA_DRY_RUN_SMOKE_LOCAL_STORAGE_PROBES,
  PRIVATE_BETA_DRY_RUN_SMOKE_MOBILE_KEYBOARD_ACCESSIBILITY_EVIDENCE,
  PRIVATE_BETA_DRY_RUN_SMOKE_NEXT_PR_SEQUENCE,
  PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
  PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_PATHS,
  PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_SMOKE_CHECKS,
  PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY,
  PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_KEYS,
} from "@/lib/private-beta-dry-run-smoke/private-beta-dry-run-smoke";
import type {
  PrivateBetaDryRunSmokeFinding,
  PrivateBetaDryRunSmokeNextPr,
  PrivateBetaDryRunSmokeRoutePath,
  PrivateBetaDryRunSmokeRouteSmokeCheck,
  PrivateBetaDryRunSmokeSafetyPolicy,
  PrivateBetaDryRunSmokeStorageProbe
} from "@/lib/private-beta-dry-run-smoke/private-beta-dry-run-smoke";

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_ROUTES = [
  ...PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_PATHS
] as const satisfies readonly PrivateBetaDryRunSmokeRoutePath[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "git diff --check"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_STORAGE_KEYS = [
  ...PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_KEYS
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P0_IDS = [
  "p0_real_checkout_not_implemented",
  "p0_real_account_sync_not_implemented",
  "p0_automatic_entitlement_not_implemented",
  "p0_production_deployment_changes_blocked"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P1_IDS = [
  "p1_console_hydration_and_route_smoke_evidence_pending",
  "p1_accessibility_polish_pending"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_P2_IDS = [
  "p2_pack_progress_and_polish"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_SAFETY_FIELDS = [
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
  "productionDataMutationAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "secretsTouchedAllowed",
  "networkCallsAllowed",
  "browserStorageMutationAllowed",
  "npmAuditFixAllowed",
  "deploymentChangesAllowed"
] as const satisfies readonly (keyof PrivateBetaDryRunSmokeSafetyPolicy)[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "src/app/payments",
  "src/app/checkout",
  "src/app/billing",
  "src/app/payment",
  "src/middleware.ts",
  "prisma",
  "drizzle",
  "migrations",
  "supabase",
  "firebase"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@supabase/supabase-js",
  "@neondatabase/serverless",
  "@vercel/postgres",
  "@clerk/nextjs",
  "next-auth",
  "better-auth",
  "firebase",
  "@firebase/app",
  "prisma",
  "@prisma/client",
  "drizzle",
  "drizzle-orm",
  "pg",
  "postgres",
  "mysql",
  "sqlite",
  "@cloudflare/d1",
  "@cloudflare/workers-types",
  "@supabase/supabase-js",
  "stripe",
  "paddle",
  "openai",
  "@ai-sdk/openai",
  "@sentry/nextjs",
  "posthog-js",
  "@datadog/browser-rum",
  "newrelic",
  "winston",
  "pino"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_MODULE_FILES = [
  "src/lib/private-beta-dry-run-smoke/private-beta-dry-run-smoke.ts",
  "src/lib/private-beta-dry-run-smoke/fixtures.ts",
  "src/lib/private-beta-dry-run-smoke/README.md"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_DOC_FILES = [
  "docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md",
  "README.md"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Test Environment",
  "Validation Commands",
  "Route Smoke Evidence",
  "localStorage Probe Checklist",
  "Console / Hydration Checklist",
  "Mobile / Keyboard / Accessibility Smoke",
  "Findings",
  "Dry-Run Decision",
  "Rollback / Pause Readiness",
  "Next PR",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_DOC_VERDICTS = {
  ownerControlledPrivateBeta: "Conditional / Manual-only",
  publicPaidBeta: "No-Go",
  sendInvitations: "Blocked until #90 launch decision",
  publicCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  productionDeploymentChanges: "Blocked"
} as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_CHECK_FIXTURES = [
  ...PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_SMOKE_CHECKS
] as const satisfies readonly PrivateBetaDryRunSmokeRouteSmokeCheck[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_PROBE_FIXTURES = [
  ...PRIVATE_BETA_DRY_RUN_SMOKE_LOCAL_STORAGE_PROBES
] as const satisfies readonly PrivateBetaDryRunSmokeStorageProbe[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_FIXTURE = [
  PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE
] as const;

export const PRIVATE_BETA_DRY_RUN_SMOKE_ACCESSIBILITY_FIXTURE =
  PRIVATE_BETA_DRY_RUN_SMOKE_MOBILE_KEYBOARD_ACCESSIBILITY_EVIDENCE;

export const PRIVATE_BETA_DRY_RUN_SMOKE_FINDING_FIXTURES =
  PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS as readonly PrivateBetaDryRunSmokeFinding[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_NEXT_PR_SEQUENCE_FIXTURES =
  PRIVATE_BETA_DRY_RUN_SMOKE_NEXT_PR_SEQUENCE as readonly PrivateBetaDryRunSmokeNextPr[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_DECISION_FIXTURE =
  PRIVATE_BETA_DRY_RUN_SMOKE_DECISION;

export const PRIVATE_BETA_DRY_RUN_SMOKE_REQUIRED_VERDICTS = {
  ownerControlledPrivateBeta: PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  publicPaidBeta: PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
  sendInvitations: "Blocked until #90 launch decision",
  publicCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  productionDeploymentChanges: "Blocked"
} as const;
