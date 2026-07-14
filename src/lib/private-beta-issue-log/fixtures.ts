import {
  PRIVATE_BETA_ISSUE_LOG_NEXT_PR_SEQUENCE,
  PRIVATE_BETA_ISSUE_LOG_TEMPLATE
} from "@/lib/private-beta-issue-log/private-beta-issue-log";
import type {
  PrivateBetaIssueFeatureArea,
  PrivateBetaIssueFieldKey,
  PrivateBetaIssueLogTemplate,
  PrivateBetaIssueSeverity,
  PrivateBetaIssueStatus,
  PrivateBetaRedactionBlockedDataType
} from "@/lib/private-beta-issue-log/private-beta-issue-log";

export const PRIVATE_BETA_ISSUE_LOG_TEMPLATE_FIXTURE =
  PRIVATE_BETA_ISSUE_LOG_TEMPLATE satisfies PrivateBetaIssueLogTemplate;

export const PRIVATE_BETA_REQUIRED_ISSUE_FIELD_KEYS = [
  "issueId",
  "reportedAt",
  "participantAlias",
  "participantContactRedacted",
  "route",
  "featureArea",
  "severity",
  "status",
  "title",
  "description",
  "expectedBehavior",
  "actualBehavior",
  "reproductionSteps",
  "browser",
  "device",
  "viewport",
  "localStorageKeysInvolved",
  "redactedLocalStateSummary",
  "screenshotOrVideoReference",
  "paymentRelated",
  "entitlementRelated",
  "accountSyncRelated",
  "dataLossRisk",
  "ownerDecision",
  "assignedOwner",
  "nextAction",
  "resolvedAt",
  "resolutionNotes"
] as const satisfies readonly PrivateBetaIssueFieldKey[];

export const PRIVATE_BETA_ISSUE_SEVERITIES = [
  "P0",
  "P1",
  "P2"
] as const satisfies readonly PrivateBetaIssueSeverity[];

export const PRIVATE_BETA_ISSUE_STATUSES = [
  "new",
  "triaged",
  "investigating",
  "waiting-on-participant",
  "fixed",
  "wont-fix-for-beta",
  "duplicate",
  "resolved",
  "beta-blocker"
] as const satisfies readonly PrivateBetaIssueStatus[];

export const PRIVATE_BETA_REQUIRED_ROUTE_VALUES = [
  "/",
  "/dashboard",
  "/saved",
  "/review",
  "/review/due",
  "/review/weak",
  "/packs",
  "/packs/[packId]",
  "/word/[slug]",
  "/pricing",
  "/settings",
  "off-app/manual-payment-or-support",
  "unknown"
] as const;

export const PRIVATE_BETA_REQUIRED_LOCAL_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1"
] as const;

export const PRIVATE_BETA_REQUIRED_FEATURE_AREAS = [
  "payment_entitlement",
  "account_sync_local_state",
  "review_srs",
  "pack_pricing_paywall",
  "support_refund_privacy",
  "route_navigation",
  "browser_device_accessibility",
  "content_copy"
] as const satisfies readonly PrivateBetaIssueFeatureArea[];

export const PRIVATE_BETA_REQUIRED_REDACTION_BLOCKS = [
  "raw_payment_data",
  "provider_tokens",
  "secrets",
  "raw_email_address",
  "raw_local_storage_dump",
  "unredacted_personal_screenshot"
] as const satisfies readonly PrivateBetaRedactionBlockedDataType[];

export const PRIVATE_BETA_REQUIRED_TRIAGE_IDS = [
  "triage_assign_issue_id",
  "triage_confirm_redaction",
  "triage_classify_feature_route_severity",
  "triage_capture_reproduction_context",
  "triage_probe_local_state_safely",
  "triage_decide_pause_or_continue"
] as const;

export const PRIVATE_BETA_REQUIRED_ROLLBACK_TRIGGER_IDS = [
  "pause_on_broken_save_or_review",
  "pause_on_payment_or_entitlement_confusion",
  "pause_on_privacy_or_redaction_gap",
  "pause_on_repeated_state_loss",
  "pause_on_repeated_route_mobile_accessibility_break"
] as const;

export const PRIVATE_BETA_REQUIRED_DUPLICATE_IDS = [
  "duplicate_link_original_issue",
  "duplicate_preserve_new_evidence",
  "duplicate_do_not_close_original"
] as const;

export const PRIVATE_BETA_REQUIRED_ESCALATION_IDS = [
  "escalate_p0_immediately",
  "escalate_repeated_p1",
  "escalate_waiting_more_than_48_hours",
  "escalate_before_final_signoff"
] as const;

export const PRIVATE_BETA_REQUIRED_CLOSEOUT_IDS = [
  "closeout_required_fields_complete",
  "closeout_redaction_confirmed",
  "closeout_p0_p1_decision_recorded",
  "closeout_resume_or_stop_decision_ready"
] as const;

export const PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS = [88, 89, 90] as const;

export const PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES = [
  "Private beta final owner signoff",
  "Private beta dry-run smoke evidence",
  "Owner-run private beta launch decision"
] as const;

export const PRIVATE_BETA_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Issue Intake Fields",
  "Severity Levels",
  "Status Lifecycle",
  "Route Taxonomy",
  "Reproduction Steps Template",
  "Browser / Device Fields",
  "localStorage Probe Fields",
  "Screenshot / Video Evidence Fields",
  "Participant Privacy / Redaction Rules",
  "Payment / Entitlement Issue Classification",
  "Account Sync / Local-State Issue Classification",
  "Review / SRS Issue Classification",
  "Pack / Pricing / Paywall Issue Classification",
  "Support / Refund / Privacy Issue Classification",
  "Owner Triage Checklist",
  "Owner Decision Field",
  "Rollback / Pause Trigger Mapping",
  "Duplicate Issue Handling",
  "Unresolved Issue Escalation",
  "First 24-Hour And 7-Day Review Usage",
  "Closeout Criteria",
  "Recommended Next PR Sequence",
  "Safety Confirmation"
] as const;

export const PRIVATE_BETA_REQUIRED_SAFETY_FIELDS = [
  "runtimeUiChangesAllowed",
  "githubIssueCreationAllowed",
  "githubApiUsageAllowed",
  "issueTrackerIntegrationAllowed",
  "monitoringSdkAllowed",
  "analyticsSdkAllowed",
  "emailSlackDiscordIntegrationAllowed",
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

export const PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS = [
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

export const PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const PRIVATE_BETA_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const PRIVATE_BETA_MODULE_FILES = [
  "src/lib/private-beta-issue-log/private-beta-issue-log.ts",
  "src/lib/private-beta-issue-log/fixtures.ts",
  "src/lib/private-beta-issue-log/README.md"
] as const;

export const PRIVATE_BETA_DOC_FILES = [
  "docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md",
  "README.md",
  "src/lib/private-beta-issue-log/README.md"
] as const;

export const PRIVATE_BETA_ISSUE_NEXT_PR_SEQUENCE_FIXTURES =
  PRIVATE_BETA_ISSUE_LOG_NEXT_PR_SEQUENCE;
