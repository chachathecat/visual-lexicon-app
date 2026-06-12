import type {
  VlxAccountSyncRouteId,
  VlxAccountSyncRouteMethod,
  VlxAccountSyncRoutePath
} from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_AUTH_OWNERSHIP_CONTRACT_VERSION = 1 as const;

export type AccountSyncAuthProviderKind =
  | "mock_contract_session"
  | "unsupported_provider";

export type AccountSyncSessionStatus =
  | "active"
  | "missing"
  | "expired"
  | "revoked";

export type AccountSyncAccountStatus =
  | "active"
  | "missing"
  | "deleted"
  | "blocked";

export type AccountSyncPlanState = "unknown" | "free" | "paid";

export type AccountSyncVerifiedOwnershipLevel =
  | "none"
  | "server_session_owner"
  | "privacy_safe_owner"
  | "strict_mutation_owner";

export type AccountSyncAuthContext = {
  accountSyncAuthContractVersion: typeof ACCOUNT_SYNC_AUTH_OWNERSHIP_CONTRACT_VERSION;
  kind: "anonymous" | "authenticated";
  providerKind: AccountSyncAuthProviderKind;
  sessionId?: string;
  sessionStatus: AccountSyncSessionStatus;
  subjectId?: string;
  alternateSubjectIds?: readonly string[];
  accountId?: string;
  accountStatus: AccountSyncAccountStatus;
  planState: AccountSyncPlanState;
  ownershipVerified: boolean;
  verifiedOwnershipLevel: AccountSyncVerifiedOwnershipLevel;
  derivedFromServerSession: boolean;
  implementsRealAuth: false;
};

export type AccountSyncTargetAccount = {
  targetAccountId?: string;
  serverLoadedAccountId?: string;
  clientProvidedAccountId?: string;
  targetAccountStatus: AccountSyncAccountStatus;
  containsFakeLocalMasteryClaim: boolean;
  hasDelayedReviewEventEvidence: boolean;
  requestsPaidEntitlementGrant: boolean;
  includesBillingPaymentState: boolean;
  containsRawGuestSnapshot: boolean;
  containsSensitivePayload: boolean;
};

export type AccountSyncOwnershipFailureReason =
  | "anonymous"
  | "missing_account"
  | "missing_session"
  | "expired_session"
  | "revoked_session"
  | "unsupported_provider"
  | "ambiguous_subject"
  | "missing_target_account"
  | "client_account_id_not_trusted"
  | "cross_account_access"
  | "deleted_account"
  | "blocked_account"
  | "ownership_not_verified"
  | "insufficient_route_policy"
  | "fake_mastery_not_accepted"
  | "paid_entitlement_outside_sync"
  | "billing_payment_outside_sync"
  | "privacy_response_not_bounded";

export type AccountSyncRouteOwnershipPolicy = {
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  mutating: boolean;
  requiredOwnershipLevel: AccountSyncVerifiedOwnershipLevel;
  policyRank: number;
  requiresAuthenticatedServerSession: true;
  requiresServerDerivedOwner: true;
  requiresTargetAccount: true;
  requiresOwnerTargetMatch: true;
  allowsClientProvidedAccountIdAsOwnershipProof: false;
  rejectsAnonymous: true;
  rejectsCrossAccountAccess: true;
  rejectsUnsupportedProvider: true;
  rejectsAmbiguousSubject: true;
  rejectsUnverifiedOwnership: true;
  applyRequiresStrictestPolicy: boolean;
  requiresPrivacySafeBoundedResponse: boolean;
  allowsRawGuestSnapshots: false;
  exposesSensitivePayloads: false;
  acceptsFakeLocalMastery: false;
  reviewEventsRemainSourceOfTruth: true;
  canGrantPaidEntitlement: false;
  billingPaymentOutsideSync: true;
};

export type AccountSyncOwnershipDecision = {
  ok: boolean;
  status: "accepted" | "rejected";
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  accountOwnerAccountId?: string;
  targetAccountId?: string;
  clientProvidedAccountId?: string;
  failureReasons: readonly AccountSyncOwnershipFailureReason[];
  policy: AccountSyncRouteOwnershipPolicy;
  ownerDerivedFromServerSession: boolean;
  clientAccountIdTrustedAsOwner: false;
  grantsPaidEntitlement: false;
  acceptsFakeMastery: false;
  reviewEventsRemainSourceOfTruth: true;
  billingPaymentOutsideSync: true;
  designOnly: true;
  implementsRealAuth: false;
};

export const ACCOUNT_SYNC_SUPPORTED_AUTH_PROVIDER_KINDS = [
  "mock_contract_session"
] as const satisfies readonly AccountSyncAuthProviderKind[];

export const ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK = {
  none: 0,
  server_session_owner: 10,
  privacy_safe_owner: 20,
  strict_mutation_owner: 30
} as const satisfies Record<AccountSyncVerifiedOwnershipLevel, number>;

export const ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    mutating: false,
    requiredOwnershipLevel: "server_session_owner",
    policyRank: ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK.server_session_owner,
    requiresAuthenticatedServerSession: true,
    requiresServerDerivedOwner: true,
    requiresTargetAccount: true,
    requiresOwnerTargetMatch: true,
    allowsClientProvidedAccountIdAsOwnershipProof: false,
    rejectsAnonymous: true,
    rejectsCrossAccountAccess: true,
    rejectsUnsupportedProvider: true,
    rejectsAmbiguousSubject: true,
    rejectsUnverifiedOwnership: true,
    applyRequiresStrictestPolicy: false,
    requiresPrivacySafeBoundedResponse: false,
    allowsRawGuestSnapshots: false,
    exposesSensitivePayloads: false,
    acceptsFakeLocalMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    mutating: true,
    requiredOwnershipLevel: "strict_mutation_owner",
    policyRank: ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK.strict_mutation_owner,
    requiresAuthenticatedServerSession: true,
    requiresServerDerivedOwner: true,
    requiresTargetAccount: true,
    requiresOwnerTargetMatch: true,
    allowsClientProvidedAccountIdAsOwnershipProof: false,
    rejectsAnonymous: true,
    rejectsCrossAccountAccess: true,
    rejectsUnsupportedProvider: true,
    rejectsAmbiguousSubject: true,
    rejectsUnverifiedOwnership: true,
    applyRequiresStrictestPolicy: true,
    requiresPrivacySafeBoundedResponse: false,
    allowsRawGuestSnapshots: false,
    exposesSensitivePayloads: false,
    acceptsFakeLocalMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    mutating: false,
    requiredOwnershipLevel: "privacy_safe_owner",
    policyRank: ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK.privacy_safe_owner,
    requiresAuthenticatedServerSession: true,
    requiresServerDerivedOwner: true,
    requiresTargetAccount: true,
    requiresOwnerTargetMatch: true,
    allowsClientProvidedAccountIdAsOwnershipProof: false,
    rejectsAnonymous: true,
    rejectsCrossAccountAccess: true,
    rejectsUnsupportedProvider: true,
    rejectsAmbiguousSubject: true,
    rejectsUnverifiedOwnership: true,
    applyRequiresStrictestPolicy: false,
    requiresPrivacySafeBoundedResponse: true,
    allowsRawGuestSnapshots: false,
    exposesSensitivePayloads: false,
    acceptsFakeLocalMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    mutating: false,
    requiredOwnershipLevel: "privacy_safe_owner",
    policyRank: ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK.privacy_safe_owner,
    requiresAuthenticatedServerSession: true,
    requiresServerDerivedOwner: true,
    requiresTargetAccount: true,
    requiresOwnerTargetMatch: true,
    allowsClientProvidedAccountIdAsOwnershipProof: false,
    rejectsAnonymous: true,
    rejectsCrossAccountAccess: true,
    rejectsUnsupportedProvider: true,
    rejectsAmbiguousSubject: true,
    rejectsUnverifiedOwnership: true,
    applyRequiresStrictestPolicy: false,
    requiresPrivacySafeBoundedResponse: true,
    allowsRawGuestSnapshots: false,
    exposesSensitivePayloads: false,
    acceptsFakeLocalMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    canGrantPaidEntitlement: false,
    billingPaymentOutsideSync: true
  }
] as const satisfies readonly AccountSyncRouteOwnershipPolicy[];

function getTargetAccountId(targetAccount: AccountSyncTargetAccount) {
  return targetAccount.targetAccountId ?? targetAccount.serverLoadedAccountId;
}

function hasSupportedProvider(providerKind: AccountSyncAuthProviderKind) {
  return (
    ACCOUNT_SYNC_SUPPORTED_AUTH_PROVIDER_KINDS as readonly AccountSyncAuthProviderKind[]
  ).includes(providerKind);
}

function hasAmbiguousSubject(authContext: AccountSyncAuthContext) {
  return (
    !authContext.subjectId ||
    Boolean(authContext.alternateSubjectIds?.length)
  );
}

function hasSufficientPolicyLevel(
  authContext: AccountSyncAuthContext,
  policy: AccountSyncRouteOwnershipPolicy
) {
  return (
    ACCOUNT_SYNC_OWNERSHIP_LEVEL_RANK[authContext.verifiedOwnershipLevel] >=
    policy.policyRank
  );
}

function createOwnershipDecision({
  authContext,
  targetAccount,
  policy,
  failureReasons
}: {
  authContext: AccountSyncAuthContext;
  targetAccount: AccountSyncTargetAccount;
  policy: AccountSyncRouteOwnershipPolicy;
  failureReasons: readonly AccountSyncOwnershipFailureReason[];
}): AccountSyncOwnershipDecision {
  const targetAccountId = getTargetAccountId(targetAccount);
  const ok = failureReasons.length === 0;

  return {
    ok,
    status: ok ? "accepted" : "rejected",
    routeId: policy.routeId,
    method: policy.method,
    path: policy.path,
    accountOwnerAccountId: authContext.accountId,
    targetAccountId,
    clientProvidedAccountId: targetAccount.clientProvidedAccountId,
    failureReasons,
    policy,
    ownerDerivedFromServerSession: authContext.derivedFromServerSession,
    clientAccountIdTrustedAsOwner: false,
    grantsPaidEntitlement: false,
    acceptsFakeMastery: false,
    reviewEventsRemainSourceOfTruth: true,
    billingPaymentOutsideSync: true,
    designOnly: true,
    implementsRealAuth: false
  };
}

export function getAccountSyncRouteOwnershipPolicy(
  routeId: VlxAccountSyncRouteId
) {
  return ACCOUNT_SYNC_ROUTE_OWNERSHIP_POLICIES.find(
    (policy) => policy.routeId === routeId
  );
}

export function decideAccountSyncOwnership({
  routeId,
  authContext,
  targetAccount
}: {
  routeId: VlxAccountSyncRouteId;
  authContext: AccountSyncAuthContext;
  targetAccount: AccountSyncTargetAccount;
}): AccountSyncOwnershipDecision {
  const policy = getAccountSyncRouteOwnershipPolicy(routeId);

  if (!policy) {
    throw new Error(`Missing account sync ownership policy for route: ${routeId}`);
  }

  const failureReasons: AccountSyncOwnershipFailureReason[] = [];

  if (authContext.kind === "anonymous") {
    failureReasons.push("anonymous");

    return createOwnershipDecision({
      authContext,
      targetAccount,
      policy,
      failureReasons
    });
  }

  if (!hasSupportedProvider(authContext.providerKind)) {
    failureReasons.push("unsupported_provider");
  }

  if (!authContext.sessionId || authContext.sessionStatus === "missing") {
    failureReasons.push("missing_session");
  } else if (authContext.sessionStatus === "expired") {
    failureReasons.push("expired_session");
  } else if (authContext.sessionStatus === "revoked") {
    failureReasons.push("revoked_session");
  }

  if (hasAmbiguousSubject(authContext)) {
    failureReasons.push("ambiguous_subject");
  }

  if (!authContext.accountId || authContext.accountStatus === "missing") {
    failureReasons.push("missing_account");
  } else if (authContext.accountStatus === "deleted") {
    failureReasons.push("deleted_account");
  } else if (authContext.accountStatus === "blocked") {
    failureReasons.push("blocked_account");
  }

  const targetAccountId = getTargetAccountId(targetAccount);

  if (!targetAccountId) {
    failureReasons.push("missing_target_account");

    if (targetAccount.clientProvidedAccountId) {
      failureReasons.push("client_account_id_not_trusted");
    }
  } else if (
    authContext.accountId &&
    String(targetAccountId) !== String(authContext.accountId)
  ) {
    failureReasons.push("cross_account_access");
  }

  if (targetAccount.targetAccountStatus === "deleted") {
    failureReasons.push("deleted_account");
  } else if (targetAccount.targetAccountStatus === "blocked") {
    failureReasons.push("blocked_account");
  }

  if (!authContext.ownershipVerified || !authContext.derivedFromServerSession) {
    failureReasons.push("ownership_not_verified");
  }

  if (!hasSufficientPolicyLevel(authContext, policy)) {
    failureReasons.push("insufficient_route_policy");
  }

  if (
    targetAccount.containsFakeLocalMasteryClaim &&
    !targetAccount.hasDelayedReviewEventEvidence
  ) {
    failureReasons.push("fake_mastery_not_accepted");
  }

  if (targetAccount.requestsPaidEntitlementGrant) {
    failureReasons.push("paid_entitlement_outside_sync");
  }

  if (targetAccount.includesBillingPaymentState) {
    failureReasons.push("billing_payment_outside_sync");
  }

  if (
    policy.requiresPrivacySafeBoundedResponse &&
    (targetAccount.containsRawGuestSnapshot || targetAccount.containsSensitivePayload)
  ) {
    failureReasons.push("privacy_response_not_bounded");
  }

  return createOwnershipDecision({
    authContext,
    targetAccount,
    policy,
    failureReasons: Array.from(new Set(failureReasons))
  });
}
