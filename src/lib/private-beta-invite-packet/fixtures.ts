import {
  PRIVATE_BETA_INVITE_NEXT_PR_SEQUENCE,
  PRIVATE_BETA_INVITE_PACKET
} from "@/lib/private-beta-invite-packet/private-beta-invite-packet";
import type {
  PrivateBetaInvitePacket,
  PrivateBetaInviteSeverity
} from "@/lib/private-beta-invite-packet/private-beta-invite-packet";

export const PRIVATE_BETA_INVITE_PACKET_FIXTURE =
  PRIVATE_BETA_INVITE_PACKET satisfies PrivateBetaInvitePacket;

export const PRIVATE_BETA_REQUIRED_ELIGIBILITY_IDS = [
  "eligibility_owner_selected",
  "eligibility_accepts_manual_private_beta",
  "eligibility_tests_learning_loop",
  "eligibility_accepts_local_state_limit",
  "eligibility_can_report_issues"
] as const;

export const PRIVATE_BETA_REQUIRED_EXCLUSION_IDS = [
  "exclusion_needs_public_signup",
  "exclusion_needs_auto_entitlement",
  "exclusion_needs_real_account_sync",
  "exclusion_needs_public_payment_infrastructure",
  "exclusion_needs_public_sharing"
] as const;

export const PRIVATE_BETA_REQUIRED_CONSENT_IDS = [
  "consent_small_owner_controlled_private_beta",
  "consent_manual_invite_only",
  "consent_no_public_signup",
  "consent_no_public_paid_beta",
  "consent_manual_payment_no_auto_entitlement",
  "consent_local_state_browser_specific",
  "consent_beta_data_not_permanent",
  "consent_support_refund_privacy_received",
  "consent_issue_reporting_context",
  "consent_no_public_sharing"
] as const;

export const PRIVATE_BETA_REQUIRED_ONBOARDING_IDS = [
  "onboarding_confirm_consent",
  "onboarding_use_owner_access",
  "onboarding_use_same_browser",
  "onboarding_do_not_clear_site_data",
  "onboarding_start_dashboard"
] as const;

export const PRIVATE_BETA_REQUIRED_LIMITATION_IDS = [
  "limitation_small_owner_controlled_private_beta",
  "limitation_manual_invite_access",
  "limitation_no_public_signup",
  "limitation_no_public_paid_beta",
  "limitation_manual_payment_only",
  "limitation_no_automatic_entitlement",
  "limitation_local_state_account_sync",
  "limitation_beta_data_not_permanent",
  "limitation_support_refund_privacy_before_payment",
  "limitation_issue_reporting_context"
] as const;

export const PRIVATE_BETA_REQUIRED_SUPPORT_REFUND_PRIVACY_IDS = [
  "support_contact_placeholder_required",
  "support_response_window_placeholder_required",
  "refund_cancellation_wording_placeholder_required",
  "privacy_local_storage_note_placeholder_required"
] as const;

export const PRIVATE_BETA_REQUIRED_ISSUE_FIELDS = [
  "route",
  "device",
  "browser",
  "steps",
  "expected_behavior",
  "actual_behavior",
  "screenshot_or_video_when_possible"
] as const;

export const PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS = [87, 88, 89, 90] as const;

export const PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES = [
  "Private beta issue log template",
  "Private beta final owner signoff",
  "Private beta dry-run smoke evidence",
  "Owner-run private beta launch decision"
] as const;

export const PRIVATE_BETA_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Participant Eligibility",
  "Participant Exclusions",
  "Invitation Email Template",
  "Short DM Invitation Template",
  "Participant Consent Checklist",
  "Onboarding Instructions",
  "First Session Instructions",
  "What To Test",
  "What Not To Expect",
  "Known Limitations",
  "Local-State/Account-Sync Limitation Disclosure",
  "Manual Payment And No Automatic Entitlement Disclosure",
  "Support Contact Placeholder Requirement",
  "Refund/Cancellation Wording Placeholder Requirement",
  "Privacy/localStorage Disclosure",
  "Issue Reporting Instructions",
  "Screenshot/Video Evidence Guidance",
  "First 24-Hour Follow-Up Template",
  "7-Day Follow-Up Template",
  "Beta Closeout / Continuation Template",
  "No Public Sharing / No Public Signup Note",
  "Owner Approval Requirement Before Sending",
  "Recommended Next PR Sequence",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "emailsSentAllowed",
  "emailProviderIntegrationAllowed",
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
  "deploymentChangesAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "secretsTouchedAllowed",
  "productionDataMutationAllowed",
  "networkCallsAllowed",
  "browserStorageMutationAllowed",
  "npmAuditFixAllowed"
] as const;

export const PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "middleware.ts",
  "src/middleware.ts",
  "src/app/payment",
  "src/app/payments",
  "src/app/billing",
  "src/app/checkout",
  "src/app/auth",
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

export const PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@sendgrid/mail",
  "@mailchimp/mailchimp_transactional",
  "mailgun.js",
  "nodemailer",
  "resend",
  "@sentry/nextjs",
  "@sentry/browser",
  "posthog-js",
  "@datadog/browser-rum",
  "@datadog/browser-logs",
  "newrelic",
  "winston",
  "pino",
  "@supabase/supabase-js",
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

export const PRIVATE_BETA_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_MODULE_FILES = [
  "src/lib/private-beta-invite-packet/private-beta-invite-packet.ts",
  "src/lib/private-beta-invite-packet/fixtures.ts",
  "src/lib/private-beta-invite-packet/README.md"
] as const;

export const PRIVATE_BETA_DOC_FILES = [
  "docs/PRIVATE_BETA_INVITE_PACKET.md",
  "README.md",
  "src/lib/private-beta-invite-packet/README.md"
] as const;

export const PRIVATE_BETA_INVITE_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PrivateBetaInviteSeverity[];

export const PRIVATE_BETA_NEXT_PR_SEQUENCE_FIXTURES =
  PRIVATE_BETA_INVITE_NEXT_PR_SEQUENCE;
