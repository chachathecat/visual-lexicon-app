import {
  ACCOUNT_SYNC_AUDIT_EVENT_TYPES,
  ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT,
  ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE,
  ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES,
  decideAccountSyncAuditWrite,
  decideAccountSyncRedaction,
  type AccountSyncAuditEventType,
  type AccountSyncAuditWriteDecisionInput
} from "@/lib/account-persistence/audit-redaction/audit-redaction-policy";

export const ACCOUNT_SYNC_AUDIT_REDACTION_OWNER_ACCOUNT_ID =
  "account-sync-audit-owner-1";

export const ACCOUNT_SYNC_AUDIT_REDACTION_OTHER_ACCOUNT_ID =
  "account-sync-audit-owner-2";

export const ACCOUNT_SYNC_AUDIT_REDACTION_NOW = "2026-06-12T00:00:00.000Z";

export const ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_EVENT_TYPES = [
  "preview_requested",
  "preview_rejected",
  "apply_requested",
  "apply_replayed",
  "apply_accepted",
  "apply_blocked",
  "apply_rejected",
  "apply_conflict",
  "digest_requested",
  "digest_rejected",
  "audit_requested",
  "audit_rejected",
  "schema_rejected",
  "payload_too_large",
  "ownership_rejected",
  "idempotency_conflict",
  "fake_mastery_blocked",
  "paid_entitlement_ignored",
  "billing_payload_rejected"
] as const satisfies readonly AccountSyncAuditEventType[];

export const ACCOUNT_SYNC_AUDIT_REDACTION_EXPECTED_FORBIDDEN_FIELDS = [
  "rawGuestSnapshot",
  "rawServerPayload",
  "rawReviewEvents",
  "rawSavedWords",
  "providerToken",
  "sessionToken",
  "refreshToken",
  "apiKey",
  "secret",
  "env",
  "paymentMethod",
  "checkoutSession",
  "subscriptionPayload",
  "billingPortalPayload",
  "invoicePayload",
  "productionCredential",
  "fullAccountState"
] as const;

export const ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT = {
  ownerScoped: true,
  ownerAccessVerified: true,
  schemaValidated: true,
  payloadWithinLimit: true,
  idempotencyValidated: true
} as const;

export const ACCOUNT_SYNC_AUDIT_REDACTION_PREVIEW_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "preview_requested",
  idempotencyValidated: false
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_ACCEPTED_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_accepted"
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_REPLAYED_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_replayed"
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_BLOCKED_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_blocked"
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_REJECTED_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_rejected"
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_CONFLICT_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_conflict",
  sameKeyDifferentFingerprint: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_FAKE_MASTERY_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "fake_mastery_blocked",
  containsFakeMasteryClaim: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_UPGRADE_INTEREST_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "paid_entitlement_ignored",
  hasUpgradeInterest: true,
  requestsPaidEntitlementGrant: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_PACK_AUDIT_ONLY_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "apply_blocked",
  hasPackProgressWithoutReviewEventEvidence: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_CROSS_ACCOUNT_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "ownership_rejected",
  ownerAccessVerified: false,
  crossAccountAttempt: true,
  containsRawServerPayload: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "schema_rejected",
  schemaValidated: false,
  malformedPayload: true,
  containsRawGuestSnapshot: true,
  containsRawServerPayload: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_INPUT = {
  ...ACCOUNT_SYNC_AUDIT_REDACTION_BASE_WRITE_INPUT,
  eventType: "idempotency_conflict",
  idempotencyValidated: false,
  sameKeyDifferentFingerprint: true,
  containsRawServerPayload: true
} as const satisfies AccountSyncAuditWriteDecisionInput;

export const ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_EVENT_INPUTS = [
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_ACCEPTED_INPUT,
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_REPLAYED_INPUT,
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_BLOCKED_INPUT,
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_REJECTED_INPUT,
  ACCOUNT_SYNC_AUDIT_REDACTION_APPLY_CONFLICT_INPUT
] as const;

export const ACCOUNT_SYNC_AUDIT_REDACTION_PREVIEW_DECISION =
  decideAccountSyncAuditWrite(ACCOUNT_SYNC_AUDIT_REDACTION_PREVIEW_INPUT);

export const ACCOUNT_SYNC_AUDIT_REDACTION_FAKE_MASTERY_DECISION =
  decideAccountSyncAuditWrite(ACCOUNT_SYNC_AUDIT_REDACTION_FAKE_MASTERY_INPUT);

export const ACCOUNT_SYNC_AUDIT_REDACTION_UPGRADE_INTEREST_DECISION =
  decideAccountSyncAuditWrite(
    ACCOUNT_SYNC_AUDIT_REDACTION_UPGRADE_INTEREST_INPUT
  );

export const ACCOUNT_SYNC_AUDIT_REDACTION_PACK_AUDIT_ONLY_DECISION =
  decideAccountSyncAuditWrite(
    ACCOUNT_SYNC_AUDIT_REDACTION_PACK_AUDIT_ONLY_INPUT
  );

export const ACCOUNT_SYNC_AUDIT_REDACTION_CROSS_ACCOUNT_DECISION =
  decideAccountSyncAuditWrite(ACCOUNT_SYNC_AUDIT_REDACTION_CROSS_ACCOUNT_INPUT);

export const ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_DECISION =
  decideAccountSyncAuditWrite(ACCOUNT_SYNC_AUDIT_REDACTION_MALFORMED_INPUT);

export const ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_DECISION =
  decideAccountSyncAuditWrite(
    ACCOUNT_SYNC_AUDIT_REDACTION_IDEMPOTENCY_CONFLICT_INPUT
  );

export const ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_FIELD_DECISIONS =
  ACCOUNT_SYNC_FORBIDDEN_AUDIT_FIELD_NAMES.map((fieldName) =>
    decideAccountSyncRedaction(fieldName)
  );

export const ACCOUNT_SYNC_AUDIT_REDACTION_RAW_GUEST_DECISION =
  decideAccountSyncRedaction("rawGuestSnapshot");

export const ACCOUNT_SYNC_AUDIT_REDACTION_RAW_SERVER_DECISION =
  decideAccountSyncRedaction("rawServerPayload");

export const ACCOUNT_SYNC_AUDIT_REDACTION_PROVIDER_TOKEN_DECISION =
  decideAccountSyncRedaction("providerToken");

export const ACCOUNT_SYNC_AUDIT_REDACTION_SECRET_DECISION =
  decideAccountSyncRedaction("productionCredential");

export const ACCOUNT_SYNC_AUDIT_REDACTION_BILLING_DECISION =
  decideAccountSyncRedaction("checkoutSession");

export const ACCOUNT_SYNC_AUDIT_REDACTION_FULL_STATE_DECISION =
  decideAccountSyncRedaction("fullAccountState");

export const ACCOUNT_SYNC_AUDIT_REDACTION_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/lib/account-persistence/audit-redaction/route.ts",
  "src/lib/account-persistence/audit-redaction/preview",
  "src/lib/account-persistence/audit-redaction/apply",
  "src/lib/account-persistence/audit-redaction/digest",
  "src/lib/account-persistence/audit-redaction/audit"
] as const;

export const ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT_FIXTURE =
  ACCOUNT_SYNC_AUDIT_REDACTION_CONTRACT;

export const ACCOUNT_SYNC_AUDIT_REDACTION_EVENT_TYPE_FIXTURES =
  ACCOUNT_SYNC_AUDIT_EVENT_TYPES;

export const ACCOUNT_SYNC_AUDIT_REDACTION_SUMMARY_SHAPE_FIXTURE =
  ACCOUNT_SYNC_AUDIT_SUMMARY_SHAPE;
