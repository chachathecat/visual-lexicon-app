import {
  ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES,
  ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES,
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT,
  type AccountSyncPayloadLimitId,
  type AccountSyncValidationInput
} from "@/lib/account-persistence/schema-payload/schema-payload-contract";
import type { VlxAccountSyncRouteId } from "@/lib/account-persistence/api-route-design/route-contracts";

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_ROUTES = [
  {
    routeId: "preview",
    method: "POST",
    path: "/api/account/sync/preview"
  },
  {
    routeId: "apply",
    method: "POST",
    path: "/api/account/sync/apply"
  },
  {
    routeId: "digest",
    method: "GET",
    path: "/api/account/sync/digest"
  },
  {
    routeId: "audit",
    method: "GET",
    path: "/api/account/sync/audit"
  }
] as const satisfies readonly {
  routeId: VlxAccountSyncRouteId;
  method: "GET" | "POST";
  path: string;
}[];

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_EXPECTED_LIMITS = {
  preview_request_body: 98_304,
  apply_request_body: 163_840,
  digest_query_cursor: 2_048,
  audit_query_cursor: 4_096,
  digest_response_summary: 32_768,
  audit_response_summary: 65_536,
  review_events_per_apply: 100,
  saved_words_per_apply: 200,
  pack_progress_entries_per_apply: 50,
  upgrade_interest_records_per_apply: 10
} as const satisfies Record<AccountSyncPayloadLimitId, number>;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_PREVIEW_INPUT = {
  routeId: "preview",
  payloadByteLength: 32_000,
  hasMalformedPayload: false,
  hasInvalidPayloadVersion: false,
  hasClientProvidedAccountIdAsOwnershipProof: false
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT = {
  routeId: "apply",
  payloadByteLength: 64_000,
  reviewEventCount: 12,
  savedWordCount: 18,
  packProgressEntryCount: 2,
  upgradeInterestRecordCount: 1,
  hasMalformedPayload: false,
  hasInvalidPayloadVersion: false,
  missingIdempotencyKey: false,
  missingClientConfirmation: false,
  hasReviewEventEvidence: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_MALFORMED_APPLY_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  hasMalformedPayload: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_IDEMPOTENCY_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  missingIdempotencyKey: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_MISSING_CONFIRMATION_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  missingClientConfirmation: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_CLIENT_ACCOUNT_ID_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_PREVIEW_INPUT,
  hasClientProvidedAccountIdAsOwnershipProof: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_FAKE_SERVER_MASTERY_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  hasFakeServerMasteryClaim: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_LOCAL_MASTERED_CLAIM_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  hasLocalMasteredClientClaim: true,
  hasReviewEventEvidence: false
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_SENSITIVE_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  includesProviderTokens: true,
  includesProductionCredentials: true,
  includesBillingPaymentCheckoutSubscription: true,
  requestsPaidEntitlement: true,
  containsRawSensitivePayload: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_PACK_AUDIT_ONLY_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  hasReviewEventEvidence: false,
  hasPackProgressWithoutReviewEventEvidence: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_UPGRADE_INTEREST_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  hasUpgradeInterestRecords: true
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_APPLY_INPUT = {
  ...ACCOUNT_SYNC_SCHEMA_PAYLOAD_VALID_APPLY_INPUT,
  payloadByteLength: 200_000,
  reviewEventCount: 101,
  savedWordCount: 201,
  packProgressEntryCount: 51,
  upgradeInterestRecordCount: 11
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_DIGEST_INPUT = {
  routeId: "digest",
  queryCursorByteLength: 2_049,
  responseSummaryByteLength: 32_769
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_OVERSIZED_AUDIT_INPUT = {
  routeId: "audit",
  queryCursorByteLength: 4_097,
  responseSummaryByteLength: 65_537
} as const satisfies AccountSyncValidationInput;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/middleware.ts",
  "src/lib/account-persistence/schema-payload/route.ts",
  "src/lib/account-persistence/schema-payload/preview",
  "src/lib/account-persistence/schema-payload/apply",
  "src/lib/account-persistence/schema-payload/digest",
  "src/lib/account-persistence/schema-payload/audit"
] as const;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_FORBIDDEN_VALIDATION_DEPENDENCIES = [
  "zod",
  "yup",
  "valibot",
  "ajv"
] as const;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT_FIXTURE =
  ACCOUNT_SYNC_SCHEMA_PAYLOAD_CONTRACT;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_ROUTE_POLICY_FIXTURES =
  ACCOUNT_SYNC_ROUTE_SCHEMA_POLICIES;

export const ACCOUNT_SYNC_SCHEMA_PAYLOAD_LIMIT_POLICY_FIXTURES =
  ACCOUNT_SYNC_PAYLOAD_LIMIT_POLICIES;
