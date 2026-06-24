import {
  OWNER_PRIVATE_BETA_LAUNCH_DECISION,
  VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION,
  OWNER_PRIVATE_BETA_LAUNCH_LIMITATIONS,
  OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
  OWNER_PRIVATE_BETA_NO_AUTOMATIC_ENTITLEMENT_POLICY,
  OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY,
  OWNER_PRIVATE_BETA_PARTICIPANT_CAP,
  OWNER_PRIVATE_BETA_PRIOR_GATE_EVIDENCE,
  OWNER_PRIVATE_BETA_PUBLIC_BETA_BLOCKERS,
  OWNER_PRIVATE_BETA_SUCCESS_METRICS,
  OWNER_PRIVATE_BETA_FAILURE_CRITERIA,
  OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN,
  OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN,
  OWNER_PRIVATE_BETA_NEXT_PR_SEQUENCE,
  OWNER_PRIVATE_BETA_DRY_RUN_EVIDENCE_READINESS,
  OWNER_PRIVATE_BETA_ISSUE_LOG_READINESS,
  OWNER_PRIVATE_BETA_SUPPORT_REFUND_PRIVACY_READINESS,
  OWNER_PRIVATE_BETA_OWNER_FINAL_SIGNOFF_READINESS,
  type OwnerPrivateBetaSourcePrNumber,
  type OwnerPrivateBetaLaunchDecision,
  type OwnerPrivateBetaSeverity,
  type OwnerPrivateBetaLaunchDecisionVersion,
  type OwnerPrivateBetaRequiredVerdicts
} from "@/lib/owner-private-beta-launch-decision/owner-private-beta-launch-decision";

export const OWNER_PRIVATE_BETA_LAUNCH_DECISION_FIXTURE =
  OWNER_PRIVATE_BETA_LAUNCH_DECISION satisfies OwnerPrivateBetaLaunchDecision;

export const OWNER_PRIVATE_BETA_REQUIRED_VERDICT = {
  ownerControlledPrivateBeta: OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
  publicPaidBeta: "No-Go",
  publicSignup: "Blocked",
  publicCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  productionDeploymentChanges: "Blocked",
  ownerInvitation:
    "Allowed only after owner manually confirms checklist completion"
} as const satisfies OwnerPrivateBetaRequiredVerdicts;

export const OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_NUMBERS = [
  79,
  80,
  81,
  82,
  83,
  84,
  85,
  86,
  87,
  88,
  89
] as const satisfies readonly OwnerPrivateBetaSourcePrNumber[];

export const OWNER_PRIVATE_BETA_REQUIRED_SOURCE_PR_LABELS = [
  "#79",
  "#80",
  "#81",
  "#82",
  "#83",
  "#84",
  "#85",
  "#86",
  "#87",
  "#88",
  "#89"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_PRIOR_GATE_IDS = OWNER_PRIVATE_BETA_PRIOR_GATE_EVIDENCE.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_PARTICIPANT_CAP = [
  OWNER_PRIVATE_BETA_PARTICIPANT_CAP.minimum,
  OWNER_PRIVATE_BETA_PARTICIPANT_CAP.maximum
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_OWNER_INVITED_ONLY_FLAGS = [
  OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY.publicSignupAllowed,
  OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY.publicCheckoutAllowed,
  OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY.ownerInvitesOnly
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_NO_AUTOMATIC_ENTITLEMENT_FLAG =
  OWNER_PRIVATE_BETA_NO_AUTOMATIC_ENTITLEMENT_POLICY.automaticEntitlementAllowed;

export const OWNER_PRIVATE_BETA_REQUIRED_NO_LAUNCH_IDS = [
  "no_launch_blocked_public_signup_or_checkout",
  "no_launch_automatic_entitlement_active",
  "no_launch_real_account_sync_claimed",
  "no_launch_production_deployment_change",
  "no_launch_support_or_privacy_readiness_missing",
  "no_launch_issue_log_or_signoff_missing",
  "no_launch_public_beta_blockers_missing"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_PUBLIC_BETA_BLOCKER_IDS = OWNER_PRIVATE_BETA_PUBLIC_BETA_BLOCKERS.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_SUPPORT_READINESS_IDS = [
  "readiness_support_contact",
  "readiness_refund_cancellation",
  "readiness_privacy_statement"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_ISSUE_LOG_IDS = OWNER_PRIVATE_BETA_ISSUE_LOG_READINESS.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_DRY_RUN_IDS = OWNER_PRIVATE_BETA_DRY_RUN_EVIDENCE_READINESS.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_OWNER_SIGNOFF_IDS = OWNER_PRIVATE_BETA_OWNER_FINAL_SIGNOFF_READINESS.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS = OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS = OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_POST_LAUNCH_PLAN_IDS = [
  ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_24H_IDS,
  ...OWNER_PRIVATE_BETA_REQUIRED_REVIEW_7D_IDS
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_LIMITATION_IDS = OWNER_PRIVATE_BETA_LAUNCH_LIMITATIONS.map(
  (item) => item.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_SUCCESS_METRIC_IDS = OWNER_PRIVATE_BETA_SUCCESS_METRICS.map(
  (metric) => metric.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_FAILURE_CRITERIA_IDS = OWNER_PRIVATE_BETA_FAILURE_CRITERIA.map(
  (criterion) => criterion.id
);

export const OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_NUMBERS = OWNER_PRIVATE_BETA_NEXT_PR_SEQUENCE.map(
  (item) => item.prNumber
);

export const OWNER_PRIVATE_BETA_REQUIRED_NEXT_PR_TITLES = OWNER_PRIVATE_BETA_NEXT_PR_SEQUENCE.map(
  (item) => item.title
);

export const OWNER_PRIVATE_BETA_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Decision Date",
  "Evidence Summary",
  "Required Prior Gates",
  "Launch Allowed Conditions",
  "Launch Limitations",
  "No-Launch Conditions",
  "Public Beta Blockers",
  "Participant Cap",
  "Owner-Invited-Only Policy",
  "Manual Payment / Payment-Link-Only Policy",
  "No Automatic Entitlement",
  "Local-State / Account-Sync Limitation Disclosure",
  "Support, Refund, Privacy Readiness",
  "Issue Log Readiness",
  "Dry-Run Evidence Readiness",
  "Owner Final Signoff Readiness",
  "First 24-Hour Review Plan",
  "First 7-Day Review Plan",
  "Pause/Rollback Criteria",
  "Private Beta Success Metrics",
  "Private Beta Failure Criteria",
  "Recommended Post-Launch PR Sequence",
  "Safety Confirmation"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_DOC_FILES = [
  "docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_DECISION.md",
  "src/lib/owner-private-beta-launch-decision/README.md",
  "README.md"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "git diff --check"
] as const;

export const OWNER_PRIVATE_BETA_FORBIDDEN_ACTUAL_PATHS = [
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
  "src/app/account/sync",
  "src/app/sync",
  "src/pages/payment",
  "src/pages/payments",
  "src/pages/billing",
  "src/pages/checkout",
  "src/pages/auth",
  "prisma",
  "drizzle",
  "migrations"
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

export const OWNER_PRIVATE_BETA_REQUIRED_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const OWNER_PRIVATE_BETA_MODULE_FILES = [
  "src/lib/owner-private-beta-launch-decision/owner-private-beta-launch-decision.ts",
  "src/lib/owner-private-beta-launch-decision/fixtures.ts",
  "src/lib/owner-private-beta-launch-decision/README.md"
] as const;

export const OWNER_PRIVATE_BETA_SAFETY_FIELDS = [
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
  "githubApiUsageAllowed",
  "issueTrackerIntegrationAllowed"
] as const;

export const OWNER_PRIVATE_BETA_REQUIRED_SAFETY_FIELDS = OWNER_PRIVATE_BETA_SAFETY_FIELDS;

export const OWNER_PRIVATE_BETA_DOC_LINK_TEXTS = [
  "[Owner-Run Private Beta Launch Decision](docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_DECISION.md)"
] as const;

export const OWNER_PRIVATE_BETA_SEVERITIES = ["P0", "P1", "P2"] as const satisfies readonly OwnerPrivateBetaSeverity[];

export const OWNER_PRIVATE_BETA_VERSION = VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION satisfies OwnerPrivateBetaLaunchDecisionVersion;
