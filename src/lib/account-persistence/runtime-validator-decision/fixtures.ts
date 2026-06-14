import {
  ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MANUAL_QA_REQUIREMENTS,
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_NEXT_STEP,
  ACCOUNT_SYNC_SELECTED_RUNTIME_VALIDATOR_STRATEGIES,
  type AccountSyncRuntimeValidationInput,
  type AccountSyncRuntimeValidatorKind,
  type AccountSyncRuntimeValidatorManualQARequirement
} from "@/lib/account-persistence/runtime-validator-decision/runtime-validator-decision";

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_CANDIDATES = [
  "zod",
  "valibot",
  "arktype",
  "ajv_json_schema",
  "superstruct",
  "custom_no_dependency_validator",
  "type_guards_only",
  "mock_only_no_runtime_validator"
] as const satisfies readonly AccountSyncRuntimeValidatorKind[];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_SELECTED_STRATEGIES =
  ACCOUNT_SYNC_SELECTED_RUNTIME_VALIDATOR_STRATEGIES;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_EXPECTED_MANUAL_QA_IDS = [
  "preview_malformed_rejection",
  "apply_malformed_rejection_before_idempotency",
  "apply_missing_idempotency_key",
  "apply_missing_safe_intent",
  "digest_audit_bounded_query",
  "bounded_response_validation",
  "redacted_validation_errors",
  "forbidden_sensitive_fields",
  "fake_mastery_block",
  "no_billing_or_entitlement_mutation"
] as const satisfies readonly AccountSyncRuntimeValidatorManualQARequirement["id"][];

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_PREVIEW_INPUT = {
  routeId: "preview",
  payloadByteLength: 24_000,
  hasMalformedPayload: false,
  hasInvalidPayloadVersion: false
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT = {
  routeId: "apply",
  payloadByteLength: 64_000,
  reviewEventCount: 8,
  savedWordCount: 24,
  packProgressEntryCount: 3,
  upgradeInterestRecordCount: 1,
  hasMalformedPayload: false,
  hasInvalidPayloadVersion: false,
  missingIdempotencyKey: false,
  missingSafeApplyIntent: false
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MALFORMED_APPLY_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  hasMalformedPayload: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_IDEMPOTENCY_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  missingIdempotencyKey: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MISSING_SAFE_INTENT_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  missingSafeApplyIntent: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_APPLY_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  payloadByteLength: 200_000,
  reviewEventCount: 101,
  savedWordCount: 201,
  packProgressEntryCount: 51,
  upgradeInterestRecordCount: 11,
  hasMalformedPayload: true,
  missingIdempotencyKey: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_DIGEST_INPUT = {
  routeId: "digest",
  queryCursorByteLength: 2_049,
  responseSummaryByteLength: 32_769
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_OVERSIZED_AUDIT_INPUT = {
  routeId: "audit",
  queryCursorByteLength: 4_097,
  responseSummaryByteLength: 65_537
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_CLIENT_ACCOUNT_ID_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_PREVIEW_INPUT,
  hasClientProvidedAccountIdAsOwnershipProof: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_FAKE_MASTERY_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  hasFakeServerMasteryClaim: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_SENSITIVE_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  includesProviderTokens: true,
  includesProductionSecrets: true,
  includesBillingPaymentCheckoutSubscription: true,
  requestsPaidEntitlement: true,
  containsRawSensitivePayload: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_PACK_AUDIT_ONLY_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  hasPackProgressWithoutReviewEventEvidence: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_UPGRADE_INTEREST_INPUT = {
  ...ACCOUNT_SYNC_RUNTIME_VALIDATOR_VALID_APPLY_INPUT,
  hasUpgradeInterestRecords: true
} as const satisfies AccountSyncRuntimeValidationInput;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_ACTUAL_ROUTE_PATHS = [
  "app/api/account/sync",
  "pages/api/account/sync",
  "src/app/api/account/sync",
  "src/pages/api/account/sync",
  "middleware.ts",
  "src/middleware.ts",
  "src/lib/account-persistence/runtime-validator-decision/route.ts",
  "src/lib/account-persistence/runtime-validator-decision/preview",
  "src/lib/account-persistence/runtime-validator-decision/apply",
  "src/lib/account-persistence/runtime-validator-decision/digest",
  "src/lib/account-persistence/runtime-validator-decision/audit"
] as const;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MODULE_FILES = [
  "src/lib/account-persistence/runtime-validator-decision/runtime-validator-decision.ts",
  "src/lib/account-persistence/runtime-validator-decision/fixtures.ts",
  "src/lib/account-persistence/runtime-validator-decision/README.md"
] as const;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_FORBIDDEN_DIRECT_DEPENDENCIES =
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DEPENDENCY_POLICY.prohibitedDirectDependencyNames;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD_FIXTURE =
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_DECISION_RECORD;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATE_FIXTURES =
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_CANDIDATES;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_ROUTE_POLICY_FIXTURES =
  ACCOUNT_SYNC_RUNTIME_VALIDATION_ROUTE_POLICIES;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_MANUAL_QA_FIXTURES =
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_MANUAL_QA_REQUIREMENTS;

export const ACCOUNT_SYNC_RUNTIME_VALIDATOR_NEXT_STEP_FIXTURE =
  ACCOUNT_SYNC_RUNTIME_VALIDATOR_NEXT_STEP;
