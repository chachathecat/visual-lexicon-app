import {
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATES,
  PRIVATE_BETA_FINAL_OWNER_SIGNOFF
} from "@/lib/private-beta-final-owner-signoff/private-beta-final-owner-signoff";
import type {
  PrivateBetaFinalOwnerConfirmationCategory,
  PrivateBetaFinalOwnerSeverity,
  PrivateBetaFinalOwnerSignoff,
  PrivateBetaFinalOwnerSourcePrNumber
} from "@/lib/private-beta-final-owner-signoff/private-beta-final-owner-signoff";

export const PRIVATE_BETA_FINAL_OWNER_SIGNOFF_FIXTURE =
  PRIVATE_BETA_FINAL_OWNER_SIGNOFF satisfies PrivateBetaFinalOwnerSignoff;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_NUMBERS = [
  79,
  80,
  81,
  82,
  83,
  84,
  85,
  86,
  87
] as const satisfies readonly PrivateBetaFinalOwnerSourcePrNumber[];

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_TITLES = [
  "Manual QA execution report",
  "Private beta gate prep",
  "Manual payment / entitlement policy",
  "Account sync preview/digest mock",
  "Monitoring, support, privacy beta gate",
  "Private beta readiness rerun",
  "Owner-run private beta launch checklist",
  "Private beta invite packet",
  "Private beta issue log template"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_SIGNOFF_IDS = [
  "owner_signoff_current_verdicts",
  "owner_signoff_required_prior_gates_complete",
  "owner_signoff_participant_cap",
  "owner_signoff_invite_only",
  "owner_signoff_manual_payment_payment_link_only",
  "owner_signoff_no_automatic_entitlement",
  "owner_signoff_local_state_account_sync_limitation",
  "owner_signoff_support_contact",
  "owner_signoff_refund_cancellation_copy",
  "owner_signoff_privacy_local_storage_disclosure",
  "owner_signoff_issue_log_ready",
  "owner_signoff_smoke_test_ready",
  "owner_signoff_first_24_hour_review",
  "owner_signoff_first_7_day_review",
  "owner_signoff_public_beta_blockers",
  "owner_signoff_final_decision_table",
  "owner_signoff_no_forbidden_changes"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_CONFIRMATION_CATEGORIES = [
  "current_verdicts",
  "prior_gates",
  "participant_cap",
  "invite_only",
  "manual_payment_payment_link_only",
  "no_automatic_entitlement",
  "local_state_account_sync_limitation",
  "support_contact",
  "refund_cancellation",
  "privacy_local_storage_disclosure",
  "issue_log_readiness",
  "smoke_test_readiness",
  "first_24_hour_review",
  "first_7_day_review",
  "public_beta_blockers",
  "final_owner_decision",
  "no_forbidden_changes"
] as const satisfies readonly PrivateBetaFinalOwnerConfirmationCategory[];

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_OPERATIONAL_CONFIRMATION_IDS = [
  "confirmation_manual_payment_payment_link_only",
  "confirmation_no_automatic_entitlement",
  "confirmation_local_state_account_sync_limitation",
  "confirmation_support_contact",
  "confirmation_refund_cancellation_copy",
  "confirmation_privacy_local_storage_disclosure",
  "confirmation_issue_log_readiness",
  "confirmation_smoke_test_readiness",
  "confirmation_first_24_hour_review",
  "confirmation_first_7_day_review"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_LAUNCH_ALLOWED_IDS = [
  "allowed_only_after_final_owner_signoff_complete",
  "allowed_after_prior_gates_79_87_complete",
  "allowed_after_roster_cap_and_invite_only_confirmed",
  "allowed_after_manual_payment_and_no_entitlement_confirmed",
  "allowed_after_local_state_support_privacy_issue_log_ready",
  "allowed_after_smoke_24_hour_7_day_reviews_ready",
  "allowed_only_when_no_p0_p1_blockers_remain"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_NO_LAUNCH_IDS = [
  "no_launch_owner_signoff_incomplete",
  "no_launch_unresolved_p0_or_p1",
  "no_launch_public_signup_or_waitlist_exposed",
  "no_launch_real_checkout_or_billing_active",
  "no_launch_automatic_entitlement_active",
  "no_launch_real_account_sync_claimed_or_enabled",
  "no_launch_support_refund_privacy_or_local_storage_copy_missing",
  "no_launch_issue_log_or_smoke_readiness_missing",
  "no_launch_forbidden_integration_or_production_mutation"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_PAUSE_ROLLBACK_IDS = [
  "pause_on_broken_save_review_or_srs_loop",
  "pause_on_payment_entitlement_confusion",
  "pause_on_privacy_redaction_or_local_storage_gap",
  "pause_on_repeated_state_loss_or_account_sync_assumption",
  "pause_on_issue_log_support_or_review_cadence_gap",
  "pause_on_public_exposure_or_cap_breach"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_PUBLIC_BETA_BLOCKER_IDS = [
  "public_beta_blocker_real_checkout",
  "public_beta_blocker_automatic_entitlement",
  "public_beta_blocker_real_account_sync",
  "public_beta_blocker_public_signup",
  "public_beta_blocker_production_ops"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_DECISIONS = [
  "proceed_with_owner_controlled_private_beta",
  "delay_and_fix_p0_p1",
  "stop_and_keep_beta_closed"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_NUMBERS = [
  89,
  90
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_NEXT_PR_TITLES = [
  "Private beta dry-run smoke evidence",
  "Owner-run private beta launch decision"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Required Prior Gates",
  "Owner Final Signoff Checklist",
  "Launch Allowed Conditions",
  "No-Launch Conditions",
  "Pause/Rollback Conditions",
  "Participant Cap Confirmation",
  "Invite-Only Confirmation",
  "Manual Payment/Payment-Link-Only Confirmation",
  "No Automatic Entitlement Confirmation",
  "Local-State/Account-Sync Limitation Confirmation",
  "Support Contact Confirmation",
  "Refund/Cancellation Copy Confirmation",
  "Privacy/localStorage Disclosure Confirmation",
  "Issue Log Readiness Confirmation",
  "Smoke Test Readiness Confirmation",
  "First 24-Hour Review Confirmation",
  "First 7-Day Review Confirmation",
  "Final Decision Table",
  "Public Paid Beta Blocker Table",
  "Recommended Next PR Sequence",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "invitationSendingAllowed",
  "emailSendingAllowed",
  "emailProviderIntegrationAllowed",
  "githubIssueCreationAllowed",
  "githubApiUsageAllowed",
  "issueTrackerIntegrationAllowed",
  "monitoringSdkAllowed",
  "analyticsSdkAllowed",
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

export const PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_ACTUAL_PATHS = [
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

export const PRIVATE_BETA_FINAL_OWNER_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@octokit/rest",
  "octokit",
  "@actions/github",
  "probot",
  "@sendgrid/mail",
  "@mailchimp/mailchimp_transactional",
  "mailgun.js",
  "nodemailer",
  "resend",
  "@slack/web-api",
  "@slack/bolt",
  "discord.js",
  "@discordjs/rest",
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

export const PRIVATE_BETA_FINAL_OWNER_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_MODULE_FILES = [
  "src/lib/private-beta-final-owner-signoff/private-beta-final-owner-signoff.ts",
  "src/lib/private-beta-final-owner-signoff/fixtures.ts",
  "src/lib/private-beta-final-owner-signoff/README.md"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_DOC_FILES = [
  "docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md",
  "README.md",
  "src/lib/private-beta-final-owner-signoff/README.md"
] as const;

export const PRIVATE_BETA_FINAL_OWNER_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PrivateBetaFinalOwnerSeverity[];

export const PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATE_FIXTURES =
  PRIVATE_BETA_FINAL_OWNER_REQUIRED_PRIOR_GATES;
