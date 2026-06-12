import type {
  AccountSyncAuthContext,
  AccountSyncTargetAccount
} from "@/lib/account-persistence/auth-ownership/auth-ownership-boundary";

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_OWNER_ACCOUNT_ID =
  "account-sync-auth-owner-1";

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_OTHER_ACCOUNT_ID =
  "account-sync-auth-owner-2";

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_NOW = "2026-06-12T00:00:00.000Z";

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT = {
  accountSyncAuthContractVersion: 1,
  kind: "authenticated",
  providerKind: "mock_contract_session",
  sessionId: "session-account-sync-auth-owner-1",
  sessionStatus: "active",
  subjectId: "subject-account-sync-auth-owner-1",
  accountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OWNER_ACCOUNT_ID,
  accountStatus: "active",
  planState: "paid",
  ownershipVerified: true,
  verifiedOwnershipLevel: "server_session_owner",
  derivedFromServerSession: true,
  implementsRealAuth: false
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_STRICT_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  verifiedOwnershipLevel: "strict_mutation_owner"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_PRIVACY_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  verifiedOwnershipLevel: "privacy_safe_owner"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_ANONYMOUS_CONTEXT = {
  accountSyncAuthContractVersion: 1,
  kind: "anonymous",
  providerKind: "mock_contract_session",
  sessionStatus: "missing",
  accountStatus: "missing",
  planState: "unknown",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none",
  derivedFromServerSession: false,
  implementsRealAuth: false
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_ACCOUNT_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  accountId: undefined,
  accountStatus: "missing",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_MISSING_SESSION_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  sessionId: undefined,
  sessionStatus: "missing",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_EXPIRED_SESSION_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  sessionStatus: "expired",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_REVOKED_SESSION_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  sessionStatus: "revoked",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_UNSUPPORTED_PROVIDER_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  providerKind: "unsupported_provider",
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_AMBIGUOUS_SUBJECT_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  alternateSubjectIds: ["subject-account-sync-auth-owner-2"],
  ownershipVerified: false,
  verifiedOwnershipLevel: "none"
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_UNVERIFIED_CONTEXT = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_AUTHENTICATED_CONTEXT,
  ownershipVerified: false,
  verifiedOwnershipLevel: "none",
  derivedFromServerSession: false
} as const satisfies AccountSyncAuthContext;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET = {
  targetAccountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OWNER_ACCOUNT_ID,
  serverLoadedAccountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OWNER_ACCOUNT_ID,
  targetAccountStatus: "active",
  containsFakeLocalMasteryClaim: false,
  hasDelayedReviewEventEvidence: false,
  requestsPaidEntitlementGrant: false,
  includesBillingPaymentState: false,
  containsRawGuestSnapshot: false,
  containsSensitivePayload: false
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_CROSS_ACCOUNT_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  targetAccountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OTHER_ACCOUNT_ID,
  serverLoadedAccountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OTHER_ACCOUNT_ID
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_CLIENT_ONLY_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  targetAccountId: undefined,
  serverLoadedAccountId: undefined,
  clientProvidedAccountId: ACCOUNT_SYNC_AUTH_OWNERSHIP_OWNER_ACCOUNT_ID
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_FAKE_MASTERY_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  containsFakeLocalMasteryClaim: true,
  hasDelayedReviewEventEvidence: false
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_PAID_ENTITLEMENT_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  requestsPaidEntitlementGrant: true
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_BILLING_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  includesBillingPaymentState: true
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_RAW_AUDIT_TARGET = {
  ...ACCOUNT_SYNC_AUTH_OWNERSHIP_SAME_ACCOUNT_TARGET,
  containsRawGuestSnapshot: true,
  containsSensitivePayload: true
} as const satisfies AccountSyncTargetAccount;

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "src/lib/account-persistence/auth-ownership/route.ts",
  "src/lib/account-persistence/auth-ownership/preview",
  "src/lib/account-persistence/auth-ownership/apply",
  "src/lib/account-persistence/auth-ownership/digest",
  "src/lib/account-persistence/auth-ownership/audit"
] as const;
