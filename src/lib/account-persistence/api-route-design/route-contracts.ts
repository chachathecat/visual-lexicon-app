import type {
  VlxAccountId,
  VlxAccountStateDigest,
  VlxGuestDeviceSnapshot
} from "@/lib/account-persistence/types";
import type { VlxAccountSyncConflictResolutionPlan } from "@/lib/account-persistence/sync-conflicts/conflict-types";
import type {
  VlxServerPersistenceAuditRecord,
  VlxServerPersistencePlanApplication,
  VlxServerPersistenceResolutionPreview
} from "@/lib/account-persistence/server-adapter/adapter-contract";

export const VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION = 1 as const;

export type VlxAccountSyncRouteId = "preview" | "apply" | "digest" | "audit";

export type VlxAccountSyncRouteMethod = "GET" | "POST";

export type VlxAccountSyncRoutePath =
  | "/api/account/sync/preview"
  | "/api/account/sync/apply"
  | "/api/account/sync/digest"
  | "/api/account/sync/audit";

export type VlxAccountSyncRouteImplementationStatus =
  "design_only_blocked_from_runtime";

export type VlxAccountSyncRouteRequestBodyKind =
  | "guest_snapshot"
  | "previewed_plan_or_guest_snapshot_with_confirmation"
  | "none";

export type VlxAccountSyncRouteResponseBodyKind =
  | "conflict_plan_adapter_preview_safety_digest"
  | "application_counts_audit_digest"
  | "account_state_digest"
  | "sync_audit_summaries";

export type VlxAccountSyncRouteSafetyPolicy = {
  designOnly: true;
  createsApiRoutes: false;
  createsRouteHandlers: false;
  createsMiddleware: false;
  createsRuntimeClients: false;
  mutatesRuntimeStorage: false;
  usesFetch: false;
  usesNetwork: false;
  usesLocalStorage: false;
  readsProcessEnv: false;
  importsAuthProviderSdk: false;
  importsDatabaseSdk: false;
  importsPaymentSdk: false;
  touchesWebflow: false;
  touchesCloudflare: false;
  touchesVercel: false;
  touchesDns: false;
  touchesProductionData: false;
  implementsAuth: false;
  implementsDatabasePersistence: false;
  implementsBilling: false;
  previewIsReadOnly: true;
  applyRequiresIdempotencyKey: true;
  applyRequiresTransactionLikeCommit: true;
  applyRejectsBlockedPlans: true;
  sameIdempotencyKeyDifferentPayloadRejected: true;
  reviewEventsSourceOfTruth: true;
  reviewStateRecomputedFromEventEvidence: true;
  duplicateSavesPreserveReviewState: true;
  duplicateReviewEventsDoNotAdvanceSrs: true;
  packProgressWithoutEventEvidenceAuditOnly: true;
  upgradeInterestAttributionOnly: true;
  blocksFakeMastery: true;
  neverGrantsPaidEntitlement: true;
  billingPaymentSubscriptionCheckoutOutsideSync: true;
  requiresFutureAuthBoundary: true;
  requiresFutureRateLimit: true;
  requiresFuturePayloadSizeLimit: true;
  requiresFutureSchemaValidation: true;
  requiresFutureAuditLogging: true;
  requiresFutureCsrfSessionProtection: true;
};

export type VlxAccountSyncRouteDefinition = {
  routeId: VlxAccountSyncRouteId;
  method: VlxAccountSyncRouteMethod;
  path: VlxAccountSyncRoutePath;
  purpose: string;
  requestBody: VlxAccountSyncRouteRequestBodyKind;
  responseBody: VlxAccountSyncRouteResponseBodyKind;
  mutating: boolean;
  readOnly: boolean;
  implementationStatus: VlxAccountSyncRouteImplementationStatus;
  blockedFromImplementationInThisPr: true;
  routeHandlerFileAllowed: false;
  runtimeIntegrationAllowed: false;
  requiresAccountSyncPayloadVersion: boolean;
  requiresIdempotencyKey: boolean;
  requiresClientConfirmation: boolean;
  requiresFutureAuthBoundary: true;
  requiresFutureRateLimit: true;
  requiresFuturePayloadSizeLimit: true;
  requiresFutureSchemaValidation: true;
  requiresFutureAuditLogging: true;
  requiresFutureCsrfSessionProtection: boolean;
  returnsFullSensitiveState: false;
  grantsPaidEntitlement: false;
  futureTransactionLikeCommitRequired: boolean;
  rejectsBlockedPlans: boolean;
};

export type VlxAccountSyncRouteErrorCode =
  | "validation_error"
  | "future_auth_required"
  | "future_rate_limited"
  | "future_payload_too_large"
  | "blocked_plan"
  | "idempotency_key_required"
  | "idempotency_payload_conflict"
  | "not_implemented_design_only";

export type VlxAccountSyncRouteError<
  TRouteId extends VlxAccountSyncRouteId = VlxAccountSyncRouteId
> = {
  ok: false;
  route: TRouteId;
  code: VlxAccountSyncRouteErrorCode;
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
  idempotencyKey?: string;
  safeToRetryWithSameIdempotencyKey?: boolean;
};

export type VlxAccountSyncPreviewRouteRequest = {
  accountSyncPayloadVersion: typeof VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION;
  localSnapshot: VlxGuestDeviceSnapshot;
  clientStateDigest?: VlxAccountStateDigest;
  requestedAt: string;
  previewOnly: true;
};

type VlxAccountSyncApplyRouteRequestBase = {
  accountSyncPayloadVersion: typeof VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION;
  idempotencyKey: string;
  clientConfirmation: {
    confirmed: true;
    confirmedAt: string;
    acceptedResolutionIds?: readonly string[];
    acknowledgesPreviewMayBeRebuilt: true;
    acknowledgesNoPaidEntitlementGrant: true;
  };
};

export type VlxAccountSyncApplyRouteRequest =
  | (VlxAccountSyncApplyRouteRequestBase & {
      mode: "apply_previewed_plan";
      previewedPlan: VlxAccountSyncConflictResolutionPlan;
      localSnapshot?: VlxGuestDeviceSnapshot;
    })
  | (VlxAccountSyncApplyRouteRequestBase & {
      mode: "apply_snapshot_after_revalidation";
      localSnapshot: VlxGuestDeviceSnapshot;
      previewedPlan?: VlxAccountSyncConflictResolutionPlan;
    });

export type VlxAccountSyncAuditSummary = Pick<
  VlxServerPersistenceAuditRecord,
  | "auditId"
  | "accountId"
  | "createdAt"
  | "source"
  | "planId"
  | "resolutionId"
  | "category"
  | "action"
  | "target"
  | "status"
  | "reason"
  | "grantsPaidEntitlement"
  | "callsNetwork"
> & {
  containsRawSensitivePayload: false;
};

export type VlxAccountSyncPreviewRouteResponse =
  | {
      ok: true;
      route: "preview";
      accountSyncPayloadVersion: typeof VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION;
      plan: VlxAccountSyncConflictResolutionPlan;
      preview: VlxServerPersistenceResolutionPreview;
      safety: VlxAccountSyncRouteSafetyPolicy;
      digest: VlxAccountStateDigest;
      mutatedServerState: false;
    }
  | VlxAccountSyncRouteError<"preview">;

export type VlxAccountSyncApplyRouteResponse =
  | {
      ok: true;
      route: "apply";
      accountSyncPayloadVersion: typeof VLX_ACCOUNT_SYNC_API_ROUTE_CONTRACT_VERSION;
      idempotencyKey: string;
      applicationStatus: "accepted" | "skipped" | "rejected";
      counts: {
        accepted: number;
        skipped: number;
        rejected: number;
        audit: number;
      };
      digest: VlxAccountStateDigest;
      auditSummaries: readonly VlxAccountSyncAuditSummary[];
      application?: VlxServerPersistencePlanApplication;
      safety: VlxAccountSyncRouteSafetyPolicy;
      transactionPolicy: "future_transaction_like_commit_required";
    }
  | VlxAccountSyncRouteError<"apply">;

export type VlxAccountSyncDigestRouteResponse =
  | {
      ok: true;
      route: "digest";
      accountId: VlxAccountId | string;
      digest: VlxAccountStateDigest;
      containsFullSensitiveState: false;
      ownerOnlyAfterAuth: true;
    }
  | VlxAccountSyncRouteError<"digest">;

export type VlxAccountSyncAuditRouteResponse =
  | {
      ok: true;
      route: "audit";
      accountId: VlxAccountId | string;
      auditSummaries: readonly VlxAccountSyncAuditSummary[];
      containsRawSensitivePayloads: false;
      ownerOnlyAfterAuth: true;
    }
  | VlxAccountSyncRouteError<"audit">;

export const VLX_ACCOUNT_SYNC_ROUTE_SAFETY_POLICY = {
  designOnly: true,
  createsApiRoutes: false,
  createsRouteHandlers: false,
  createsMiddleware: false,
  createsRuntimeClients: false,
  mutatesRuntimeStorage: false,
  usesFetch: false,
  usesNetwork: false,
  usesLocalStorage: false,
  readsProcessEnv: false,
  importsAuthProviderSdk: false,
  importsDatabaseSdk: false,
  importsPaymentSdk: false,
  touchesWebflow: false,
  touchesCloudflare: false,
  touchesVercel: false,
  touchesDns: false,
  touchesProductionData: false,
  implementsAuth: false,
  implementsDatabasePersistence: false,
  implementsBilling: false,
  previewIsReadOnly: true,
  applyRequiresIdempotencyKey: true,
  applyRequiresTransactionLikeCommit: true,
  applyRejectsBlockedPlans: true,
  sameIdempotencyKeyDifferentPayloadRejected: true,
  reviewEventsSourceOfTruth: true,
  reviewStateRecomputedFromEventEvidence: true,
  duplicateSavesPreserveReviewState: true,
  duplicateReviewEventsDoNotAdvanceSrs: true,
  packProgressWithoutEventEvidenceAuditOnly: true,
  upgradeInterestAttributionOnly: true,
  blocksFakeMastery: true,
  neverGrantsPaidEntitlement: true,
  billingPaymentSubscriptionCheckoutOutsideSync: true,
  requiresFutureAuthBoundary: true,
  requiresFutureRateLimit: true,
  requiresFuturePayloadSizeLimit: true,
  requiresFutureSchemaValidation: true,
  requiresFutureAuditLogging: true,
  requiresFutureCsrfSessionProtection: true
} as const satisfies VlxAccountSyncRouteSafetyPolicy;

export const VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview",
    purpose:
      "Accept a guest snapshot, load authenticated account state in the future, build a conflict plan, preview adapter application, and return safety plus digest without mutation.",
    requestBody: "guest_snapshot",
    responseBody: "conflict_plan_adapter_preview_safety_digest",
    mutating: false,
    readOnly: true,
    implementationStatus: "design_only_blocked_from_runtime",
    blockedFromImplementationInThisPr: true,
    routeHandlerFileAllowed: false,
    runtimeIntegrationAllowed: false,
    requiresAccountSyncPayloadVersion: true,
    requiresIdempotencyKey: false,
    requiresClientConfirmation: false,
    requiresFutureAuthBoundary: true,
    requiresFutureRateLimit: true,
    requiresFuturePayloadSizeLimit: true,
    requiresFutureSchemaValidation: true,
    requiresFutureAuditLogging: true,
    requiresFutureCsrfSessionProtection: true,
    returnsFullSensitiveState: false,
    grantsPaidEntitlement: false,
    futureTransactionLikeCommitRequired: false,
    rejectsBlockedPlans: false
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply",
    purpose:
      "Accept a previewed plan or guest snapshot with confirmation, revalidate account identity in the future, verify the plan, reject blocked plans, and apply idempotently only inside a transaction-like boundary.",
    requestBody: "previewed_plan_or_guest_snapshot_with_confirmation",
    responseBody: "application_counts_audit_digest",
    mutating: true,
    readOnly: false,
    implementationStatus: "design_only_blocked_from_runtime",
    blockedFromImplementationInThisPr: true,
    routeHandlerFileAllowed: false,
    runtimeIntegrationAllowed: false,
    requiresAccountSyncPayloadVersion: true,
    requiresIdempotencyKey: true,
    requiresClientConfirmation: true,
    requiresFutureAuthBoundary: true,
    requiresFutureRateLimit: true,
    requiresFuturePayloadSizeLimit: true,
    requiresFutureSchemaValidation: true,
    requiresFutureAuditLogging: true,
    requiresFutureCsrfSessionProtection: true,
    returnsFullSensitiveState: false,
    grantsPaidEntitlement: false,
    futureTransactionLikeCommitRequired: true,
    rejectsBlockedPlans: true
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest",
    purpose:
      "Return owner-only account state digest metadata for saved words, review events, review state, pack progress, upgrade interest attribution, and sync cursor without full sensitive state.",
    requestBody: "none",
    responseBody: "account_state_digest",
    mutating: false,
    readOnly: true,
    implementationStatus: "design_only_blocked_from_runtime",
    blockedFromImplementationInThisPr: true,
    routeHandlerFileAllowed: false,
    runtimeIntegrationAllowed: false,
    requiresAccountSyncPayloadVersion: false,
    requiresIdempotencyKey: false,
    requiresClientConfirmation: false,
    requiresFutureAuthBoundary: true,
    requiresFutureRateLimit: true,
    requiresFuturePayloadSizeLimit: true,
    requiresFutureSchemaValidation: true,
    requiresFutureAuditLogging: true,
    requiresFutureCsrfSessionProtection: false,
    returnsFullSensitiveState: false,
    grantsPaidEntitlement: false,
    futureTransactionLikeCommitRequired: false,
    rejectsBlockedPlans: false
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit",
    purpose:
      "Return latest owner-only sync audit summaries without raw sensitive payloads, production secrets, or full account state.",
    requestBody: "none",
    responseBody: "sync_audit_summaries",
    mutating: false,
    readOnly: true,
    implementationStatus: "design_only_blocked_from_runtime",
    blockedFromImplementationInThisPr: true,
    routeHandlerFileAllowed: false,
    runtimeIntegrationAllowed: false,
    requiresAccountSyncPayloadVersion: false,
    requiresIdempotencyKey: false,
    requiresClientConfirmation: false,
    requiresFutureAuthBoundary: true,
    requiresFutureRateLimit: true,
    requiresFuturePayloadSizeLimit: true,
    requiresFutureSchemaValidation: true,
    requiresFutureAuditLogging: true,
    requiresFutureCsrfSessionProtection: false,
    returnsFullSensitiveState: false,
    grantsPaidEntitlement: false,
    futureTransactionLikeCommitRequired: false,
    rejectsBlockedPlans: false
  }
] as const satisfies readonly VlxAccountSyncRouteDefinition[];

export function getVlxAccountSyncRouteDefinition(routeId: VlxAccountSyncRouteId) {
  return VLX_ACCOUNT_SYNC_ROUTE_DEFINITIONS.find(
    (definition) => definition.routeId === routeId
  );
}
