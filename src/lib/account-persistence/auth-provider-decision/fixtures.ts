import {
  ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD,
  ACCOUNT_SYNC_AUTH_PROVIDER_NEXT_STEP,
  ACCOUNT_SYNC_REJECTED_AUTH_STATES,
  ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS,
  ACCOUNT_SYNC_SELECTED_AUTH_STRATEGIES,
  type AccountSyncAuthProviderKind,
  type AccountSyncAuthProviderManualQARequirement,
  type AccountSyncNormalizedAuthPrincipal
} from "@/lib/account-persistence/auth-provider-decision/auth-provider-decision";

export const ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_CANDIDATES = [
  "existing_account_session_boundary",
  "clerk",
  "authjs",
  "supabase_auth",
  "firebase_auth",
  "custom_backend_session"
] as const satisfies readonly Exclude<
  AccountSyncAuthProviderKind,
  "unsupported_provider"
>[];

export const ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_STRATEGIES =
  ACCOUNT_SYNC_SELECTED_AUTH_STRATEGIES;

export const ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_REJECTED_STATES =
  ACCOUNT_SYNC_REJECTED_AUTH_STATES;

export const ACCOUNT_SYNC_AUTH_PROVIDER_EXPECTED_MANUAL_QA_IDS = [
  "preview_owner_session",
  "apply_revalidation",
  "digest_owner_only_bounded",
  "audit_owner_only_redacted",
  "cross_account_rejection",
  "rejected_auth_states",
  "plan_context_readonly",
  "fake_mastery_block"
] as const satisfies readonly AccountSyncAuthProviderManualQARequirement["id"][];

export const ACCOUNT_SYNC_AUTH_PROVIDER_NOW = "2026-06-13T00:00:00.000Z";

export const ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID =
  "account-sync-auth-provider-owner-1";

export const ACCOUNT_SYNC_AUTH_PROVIDER_OTHER_ACCOUNT_ID =
  "account-sync-auth-provider-owner-2";

export const ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL = {
  accountSyncAuthProviderDecisionVersion: 1,
  authenticatedAccountId: ACCOUNT_SYNC_AUTH_PROVIDER_OWNER_ACCOUNT_ID,
  providerKind: "existing_account_session_boundary",
  providerSubject: "subject-account-sync-auth-provider-owner-1",
  providerSubjectAmbiguous: false,
  sessionId: "session-account-sync-auth-provider-owner-1",
  sessionIssuedAt: "2026-06-13T00:00:00.000Z",
  sessionExpiresAt: "2026-06-14T00:00:00.000Z",
  sessionRevoked: false,
  accountStatus: "active",
  emailVerified: true,
  assuranceLevel: "server_session",
  planContextReadonly: {
    planState: "paid",
    source: "existing_account_session",
    readonly: true,
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true
  },
  ownershipSource: "authenticated_server_session",
  derivedFromAuthenticatedServerSession: true,
  clientProvidedAccountIdTrustedAsOwnershipProof: false
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_MISSING_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  authenticatedAccountId: "",
  sessionId: "",
  accountStatus: "missing",
  assuranceLevel: "none",
  ownershipSource: "none",
  derivedFromAuthenticatedServerSession: false
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_EXPIRED_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  sessionExpiresAt: "2026-06-12T00:00:00.000Z",
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_REVOKED_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  sessionRevoked: true,
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_AMBIGUOUS_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  providerSubjectAmbiguous: true,
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_UNSUPPORTED_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  providerKind: "unsupported_provider",
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_DELETED_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  accountStatus: "deleted",
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_BLOCKED_PRINCIPAL = {
  ...ACCOUNT_SYNC_AUTH_PROVIDER_ACTIVE_PRINCIPAL,
  accountStatus: "blocked",
  assuranceLevel: "none"
} as const satisfies AccountSyncNormalizedAuthPrincipal;

export const ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_PRINCIPAL_FIELDS = [
  "providerToken",
  "refreshToken",
  "sessionSecret",
  "apiKey",
  "rawProviderPayload",
  "billingPayload",
  "paymentPayload",
  "checkoutPayload",
  "subscriptionPayload",
  "productionCredential"
] as const;

export const ACCOUNT_SYNC_AUTH_PROVIDER_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "middleware.ts",
  "src/lib/account-persistence/auth-provider-decision/route.ts",
  "src/lib/account-persistence/auth-provider-decision/preview",
  "src/lib/account-persistence/auth-provider-decision/apply",
  "src/lib/account-persistence/auth-provider-decision/digest",
  "src/lib/account-persistence/auth-provider-decision/audit"
] as const;

export const ACCOUNT_SYNC_AUTH_PROVIDER_MODULE_FILES = [
  "src/lib/account-persistence/auth-provider-decision/auth-provider-decision.ts",
  "src/lib/account-persistence/auth-provider-decision/fixtures.ts",
  "src/lib/account-persistence/auth-provider-decision/README.md"
] as const;

export const ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD_FIXTURE =
  ACCOUNT_SYNC_AUTH_PROVIDER_DECISION_RECORD;

export const ACCOUNT_SYNC_AUTH_PROVIDER_ROUTE_REQUIREMENT_FIXTURES =
  ACCOUNT_SYNC_ROUTE_AUTH_REQUIREMENTS;

export const ACCOUNT_SYNC_AUTH_PROVIDER_NEXT_STEP_FIXTURE =
  ACCOUNT_SYNC_AUTH_PROVIDER_NEXT_STEP;
