import {
  AGENT_ASSISTED_DOGFOOD_COMPREHENSION_CHECKS,
  AGENT_ASSISTED_DOGFOOD_FINDINGS,
  AGENT_ASSISTED_DOGFOOD_JOURNEY_CHECKS,
  AGENT_ASSISTED_DOGFOOD_JOURNEY_PATHS,
  AGENT_ASSISTED_DOGFOOD_LOCAL_STORAGE_PROBES,
  AGENT_ASSISTED_DOGFOOD_MONETIZATION_CHECKS,
  AGENT_ASSISTED_DOGFOOD_NEXT_PR_SEQUENCE,
  AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT,
  AGENT_ASSISTED_DOGFOOD_PERSONA_LABELS,
  AGENT_ASSISTED_DOGFOOD_PERSONAS,
  AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT,
  AGENT_ASSISTED_DOGFOOD_REAL_USER_VALIDATION_STATUS,
  AGENT_ASSISTED_DOGFOOD_STORAGE_KEYS,
  AGENT_ASSISTED_DOGFOOD_VERDICT,
  AGENT_ASSISTED_DOGFOOD_ZERO_USER_METRICS,
  AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD,
  VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION,
  type AgentAssistedDogfoodJourneyPath,
  type AgentAssistedDogfoodSafetyPolicy,
  type AgentAssistedPrivateBetaDogfood,
  type AgentAssistedPrivateBetaDogfoodVersion
} from "@/lib/agent-assisted-beta-dogfood/agent-assisted-beta-dogfood";

export const AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_FIXTURE =
  AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD satisfies AgentAssistedPrivateBetaDogfood;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_VERDICTS = {
  ownerControlledPrivateBeta: AGENT_ASSISTED_DOGFOOD_OWNER_VERDICT,
  publicPaidBeta: AGENT_ASSISTED_DOGFOOD_PUBLIC_VERDICT,
  realParticipantValidation:
    AGENT_ASSISTED_DOGFOOD_REAL_USER_VALIDATION_STATUS,
  agentAssistedDogfood: AGENT_ASSISTED_DOGFOOD_VERDICT
} as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_ZERO_USER_COUNTS =
  AGENT_ASSISTED_DOGFOOD_ZERO_USER_METRICS;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_LABELS = [
  ...AGENT_ASSISTED_DOGFOOD_PERSONA_LABELS
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_PERSONA_IDS =
  AGENT_ASSISTED_DOGFOOD_PERSONAS.map((persona) => persona.id);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_PATHS = [
  ...AGENT_ASSISTED_DOGFOOD_JOURNEY_PATHS
] as const satisfies readonly AgentAssistedDogfoodJourneyPath[];

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_JOURNEY_IDS =
  AGENT_ASSISTED_DOGFOOD_JOURNEY_CHECKS.map((check) => check.id);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_COMPREHENSION_IDS =
  AGENT_ASSISTED_DOGFOOD_COMPREHENSION_CHECKS.map((check) => check.id);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_MONETIZATION_IDS =
  AGENT_ASSISTED_DOGFOOD_MONETIZATION_CHECKS.map((check) => check.id);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_STORAGE_KEYS = [
  ...AGENT_ASSISTED_DOGFOOD_STORAGE_KEYS
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_FINDING_IDS =
  AGENT_ASSISTED_DOGFOOD_FINDINGS.map((finding) => finding.id);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_P0_IDS = [
  "p0_public_paid_beta_remains_no_go",
  "p0_real_user_validation_not_started"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_P1_IDS = [
  "p1_pre_invite_browser_smoke_ready_to_run",
  "p1_comprehension_requires_real_people"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_P2_IDS = [
  "p2_pricing_outcome_copy_watch"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_NUMBERS =
  AGENT_ASSISTED_DOGFOOD_NEXT_PR_SEQUENCE.map((item) => item.prNumber);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_NEXT_PR_TITLES =
  AGENT_ASSISTED_DOGFOOD_NEXT_PR_SEQUENCE.map((item) => item.title);

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_SECTIONS = [
  "Executive Summary",
  "Current Verdicts",
  "Warning",
  "Tested Personas",
  "Journey Checks",
  "Comprehension Checks",
  "Monetization Checks",
  "Zero-User Honesty Rules",
  "localStorage Probe Checklist",
  "Console / Hydration Smoke Checklist",
  "Issue Log Entries",
  "P0 / P1 / P2 Findings",
  "Recommendation",
  "Next PR Sequence",
  "Validation Commands",
  "Safety Confirmation"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_DOC_FILES = [
  "docs/AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.md",
  "src/lib/agent-assisted-beta-dogfood/README.md",
  "README.md"
] as const;

export const AGENT_ASSISTED_DOGFOOD_DOC_LINK_TEXTS = [
  "[Agent-Assisted Private Beta Dogfood Report](docs/AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD.md)"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npm.cmd run test -- --workers=1",
  "git diff --check"
] as const;

export const AGENT_ASSISTED_DOGFOOD_MODULE_FILES = [
  "src/lib/agent-assisted-beta-dogfood/agent-assisted-beta-dogfood.ts",
  "src/lib/agent-assisted-beta-dogfood/fixtures.ts",
  "src/lib/agent-assisted-beta-dogfood/README.md"
] as const;

export const AGENT_ASSISTED_DOGFOOD_RUNTIME_SCAN_DIRS = [
  "src/app",
  "src/components"
] as const;

export const AGENT_ASSISTED_DOGFOOD_FORBIDDEN_ACTUAL_PATHS = [
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

export const AGENT_ASSISTED_DOGFOOD_FORBIDDEN_DIRECT_DEPENDENCIES = [
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

export const AGENT_ASSISTED_DOGFOOD_FORBIDDEN_RAW_DATA_KEYS = [
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
  "password",
  "accessToken",
  "refreshToken",
  "cardNumber",
  "billingAddress"
] as const;

export const AGENT_ASSISTED_DOGFOOD_FORBIDDEN_SECRET_VALUE_PATTERNS = [
  "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}",
  "\\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+",
  "\\bwhsec_[A-Za-z0-9]+",
  "\\b(?:access|refresh|id)_token\\b",
  "\\b(?:password|secret|api_key)\\s*[:=]"
] as const;

export const AGENT_ASSISTED_DOGFOOD_REQUIRED_SAFETY_FIELDS = [
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
  "emailSendingAllowed",
  "emailProviderIntegrationAllowed"
] as const satisfies readonly (keyof AgentAssistedDogfoodSafetyPolicy)[];

export const AGENT_ASSISTED_DOGFOOD_VERSION =
  VISUAL_LEXICON_AGENT_ASSISTED_PRIVATE_BETA_DOGFOOD_VERSION satisfies AgentAssistedPrivateBetaDogfoodVersion;
