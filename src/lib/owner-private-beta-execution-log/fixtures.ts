import {
  OWNER_PRIVATE_BETA_BATCH_METADATA,
  OWNER_PRIVATE_BETA_EXECUTION_OWNER_VERDICT,
  OWNER_PRIVATE_BETA_EXECUTION_PUBLIC_VERDICT,
  OWNER_PRIVATE_BETA_EXECUTION_STATE,
  OWNER_PRIVATE_BETA_EXECUTION_STATES,
  OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN,
  OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN,
  OWNER_PRIVATE_BETA_INVITE_EXECUTION_CHECKLIST,
  OWNER_PRIVATE_BETA_NEXT_EXECUTION_LOG_PR_SEQUENCE,
  OWNER_PRIVATE_BETA_PARTICIPANT_COMMUNICATION_CONFIRMATIONS,
  OWNER_PRIVATE_BETA_PARTICIPANT_REDACTION_RULES,
  OWNER_PRIVATE_BETA_PAUSE_ROLLBACK_TRIGGER_MAPPING,
  OWNER_PRIVATE_BETA_SUCCESS_METRICS,
  OWNER_PRIVATE_BETA_SUPPORT_PRIVACY_PAYMENT_CONFIRMATIONS,
  OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG,
  VISUAL_LEXICON_OWNER_PRIVATE_BETA_EXECUTION_LOG_VERSION,
  type OwnerPrivateBetaBatchMetadata,
  type OwnerPrivateBetaExecutionLog,
  type OwnerPrivateBetaExecutionLogVersion,
  type OwnerPrivateBetaExecutionSafetyPolicy,
  type OwnerPrivateBetaExecutionState
} from "@/lib/owner-private-beta-execution-log/owner-private-beta-execution-log";

export const OWNER_PRIVATE_BETA_EXECUTION_LOG_FIXTURE =
  OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG satisfies OwnerPrivateBetaExecutionLog;

export const OWNER_PRIVATE_BETA_BATCH_ZERO_FIXTURE =
  OWNER_PRIVATE_BETA_BATCH_METADATA satisfies OwnerPrivateBetaBatchMetadata;

export const OWNER_PRIVATE_BETA_REQUIRED_VERDICTS = {
  ownerControlledPrivateBeta: OWNER_PRIVATE_BETA_EXECUTION_OWNER_VERDICT,
  publicPaidBeta: OWNER_PRIVATE_BETA_EXECUTION_PUBLIC_VERDICT,
  publicSignup: "Blocked",
  publicCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  productionDeploymentChanges: "Blocked"
} as const;

export const OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATE =
  OWNER_PRIVATE_BETA_EXECUTION_STATE satisfies OwnerPrivateBetaExecutionState;

export const OWNER_PRIVATE_BETA_ALLOWED_ZERO_COUNT_STATES = [
  "Not Started",
  "Ready to Execute"
] as const satisfies readonly OwnerPrivateBetaExecutionState[];

export const OWNER_PRIVATE_BETA_REQUIRED_EXECUTION_STATES = [
  ...OWNER_PRIVATE_BETA_EXECUTION_STATES
] as const satisfies readonly OwnerPrivateBetaExecutionState[];

export const OWNER_PRIVATE_BETA_BATCH_ZERO_COUNT_KEYS = [
  "invitedParticipantCount",
  "acceptedParticipantCount",
  "declinedParticipantCount",
  "paymentRequestedCount",
  "paymentConfirmedCount",
  "manualEntitlementRecordedCount"
] as const satisfies readonly (keyof OwnerPrivateBetaBatchMetadata)[];

export const OWNER_PRIVATE_BETA_REQUIRED_PARTICIPANT_CAP = {
  minimum: 5,
  maximum: 20
} as const;

export const OWNER_PRIVATE_BETA_REQUIRED_REDACTION_RULE_IDS =
  OWNER_PRIVATE_BETA_PARTICIPANT_REDACTION_RULES.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_INVITE_CHECKLIST_IDS =
  OWNER_PRIVATE_BETA_INVITE_EXECUTION_CHECKLIST.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_COMMUNICATION_CONFIRMATION_IDS =
  OWNER_PRIVATE_BETA_PARTICIPANT_COMMUNICATION_CONFIRMATIONS.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_PRIVACY_PAYMENT_IDS =
  OWNER_PRIVATE_BETA_SUPPORT_PRIVACY_PAYMENT_CONFIRMATIONS.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_PAUSE_ROLLBACK_IDS =
  OWNER_PRIVATE_BETA_PAUSE_ROLLBACK_TRIGGER_MAPPING.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS =
  OWNER_PRIVATE_BETA_SUCCESS_METRICS.map((metric) => metric.id);

export const OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_LABELS = [
  "Save success",
  "Review start",
  "Review completion",
  "Due review return",
  "Weak word understanding",
  "Pack preview engagement",
  "Pricing comprehension",
  "Issue count/severity",
  "Weekly Reviewed Words"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS =
  OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS =
  OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN.map((item) => item.id);

export const OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS =
  OWNER_PRIVATE_BETA_NEXT_EXECUTION_LOG_PR_SEQUENCE.map((item) => item.prNumber);

export const OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES =
  OWNER_PRIVATE_BETA_NEXT_EXECUTION_LOG_PR_SEQUENCE.map((item) => item.title);

export const OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Execution State",
  "Batch Metadata",
  "Participant Redaction Rules",
  "Invite Execution Checklist",
  "Participant Communication Confirmation",
  "Support / Refund / Privacy Confirmation",
  "Local-State / Account-Sync Limitation Confirmation",
  "Manual Payment / No Automatic Entitlement Confirmation",
  "Smoke Check Confirmation Before Invite",
  "Issue Log Reference",
  "First 24-Hour Review Plan",
  "First 7-Day Review Plan",
  "Pause/Rollback Trigger Mapping",
  "Owner Decision Notes",
  "Private Beta Success Metrics",
  "Next PR Sequence",
  "Validation Commands",
  "Safety Confirmation"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES = [
  "docs/OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG.md",
  "src/lib/owner-private-beta-execution-log/README.md",
  "README.md"
] as const;

export const OWNER_PRIVATE_BETA_DOC_LINK_TEXTS = [
  "[Owner-Run Private Beta Execution Log](docs/OWNER_RUN_PRIVATE_BETA_EXECUTION_LOG.md)"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "git diff --check"
] as const;

export const OWNER_PRIVATE_BETA_MODULE_FILES = [
  "src/lib/owner-private-beta-execution-log/owner-private-beta-execution-log.ts",
  "src/lib/owner-private-beta-execution-log/fixtures.ts",
  "src/lib/owner-private-beta-execution-log/README.md"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS = [
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

export const OWNER_PRIVATE_BETA_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "@octokit/rest",
  "octokit",
  "@actions/github",
  "@sendgrid/mail",
  "@mailchimp/mailchimp_transactional",
  "mailgun.js",
  "nodemailer",
  "resend",
  "@slack/web-api",
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
  "stripe",
  "paddle",
  "openai",
  "@ai-sdk/openai",
  "@clerk/nextjs",
  "next-auth",
  "better-auth"
] as const;

export const OWNER_PRIVATE_BETA_FORBIDDEN_RAW_DATA_KEYS = [
  "email",
  "emails",
  "emailAddress",
  "phone",
  "phoneNumber",
  "fullName",
  "participantName",
  "participantNames",
  "paymentToken",
  "paymentSecret",
  "paymentPayload",
  "providerToken",
  "apiKey",
  "secret",
  "password",
  "accessToken",
  "refreshToken",
  "cardNumber",
  "billingAddress"
] as const;

export const OWNER_PRIVATE_BETA_FORBIDDEN_SECRET_VALUE_PATTERNS = [
  "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}",
  "\\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+",
  "\\bwhsec_[A-Za-z0-9]+",
  "\\b(?:access|refresh|id)_token\\b",
  "\\b(?:password|secret|api_key)\\s*[:=]"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS = [
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
  "deploymentChangesAllowed",
  "webflowCloudflareVercelDnsChangesAllowed",
  "secretsTouchedAllowed",
  "productionDataMutationAllowed",
  "networkCallsAllowed",
  "browserStorageMutationAllowed",
  "npmAuditFixAllowed",
  "invitationSendingAllowed",
  "emailProviderIntegrationAllowed",
  "issueTrackerIntegrationAllowed"
] as const satisfies readonly (keyof OwnerPrivateBetaExecutionSafetyPolicy)[];

export const OWNER_PRIVATE_BETA_VERSION =
  VISUAL_LEXICON_OWNER_PRIVATE_BETA_EXECUTION_LOG_VERSION satisfies OwnerPrivateBetaExecutionLogVersion;
