import {
  MANUAL_PAYMENT_ALLOWED_PAYMENT_EVIDENCE_TYPES,
  MANUAL_PAYMENT_CONTRACT_SUITE,
  MANUAL_PAYMENT_ENTITLEMENT_VERDICT,
  MANUAL_PAYMENT_ENTITLEMENT_CONTRACT,
  MANUAL_PAYMENT_ENTITLEMENT_REQUIREMENTS,
  MANUAL_PAYMENT_ENTITLEMENT_BLOCKERS,
  PUBLIC_BETA_PAYMENT_VERDICT,
  ManualEntitlementRecord,
  ManualPaymentEvidenceType,
  ManualPaymentEntitlementPolicy,
  ManualPaymentPolicyVerdict
} from "@/lib/manual-payment-entitlement/manual-payment-entitlement";

export const MANUAL_PAYMENT_DOC_FILES = [
  "docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md",
  "README.md"
] as const;

export const MANUAL_PAYMENT_MODULE_FILES = [
  "src/lib/manual-payment-entitlement/manual-payment-entitlement.ts",
  "src/lib/manual-payment-entitlement/fixtures.ts",
  "src/lib/manual-payment-entitlement/README.md"
] as const;

export const MANUAL_PAYMENT_FORBIDDEN_DIRECT_DEPENDENCIES = [
  "stripe",
  "@stripe/stripe-js",
  "@stripe/react-stripe-js",
  "paddle",
  "@paddle/paddle-js",
  "paypal-checkout",
  "paypal-js"
] as const;

export const MANUAL_PAYMENT_FORBIDDEN_ACTUAL_PATHS = [
  "app/api",
  "pages/api",
  "src/app/api",
  "src/pages/api",
  "middleware.ts",
  "src/app/payment",
  "src/app/payments",
  "src/app/billing",
  "src/app/checkout",
  "src/pages/payment",
  "src/pages/payments",
  "src/pages/billing",
  "src/pages/checkout"
] as const;

export const MANUAL_PAYMENT_REVIEW_REQUIRED_POLICY_FIELDS = [
  "participantIdentifier",
  "inviteSource",
  "paymentStatus",
  "paymentEvidenceReference",
  "approvedPlanLabel",
  "approvalTimestamp",
  "approvedByOwner",
  "expirationOrReviewDate",
  "refundOrCancelStatus",
  "notes"
] as const;

export const MANUAL_PAYMENT_REQUIRED_VERDICTS = {
  privateBeta: MANUAL_PAYMENT_ENTITLEMENT_VERDICT as ManualPaymentPolicyVerdict,
  publicBeta: PUBLIC_BETA_PAYMENT_VERDICT as ManualPaymentPolicyVerdict
} satisfies {
  privateBeta: ManualPaymentPolicyVerdict;
  publicBeta: ManualPaymentPolicyVerdict;
};

export const MANUAL_PAYMENT_ENTITLEMENT_RECORD_FIXTURE: ManualEntitlementRecord = {
  participantIdentifier: "learner:alpha-lab-001",
  inviteSource: "manual_email",
  paymentStatus: "approved",
  paymentEvidenceReference: "doc://support-ticket/manual-payment/MPE-001",
  approvedPlanLabel: "beta_lite",
  approvalTimestamp: "2026-06-14T10:15:00Z",
  approvedByOwner: "owner:visuallexicon-ops",
  expirationOrReviewDate: "2026-07-14T23:59:59Z",
  refundOrCancelStatus: "pending",
  notes: "Manual preview access granted after payment link click confirmation."
};

export const MANUAL_PAYMENT_REQUIRED_NEXT_STEPS =
  MANUAL_PAYMENT_CONTRACT_SUITE.requiredNextPrSequence;

export const MANUAL_PAYMENT_REQUIRED_BLOCKERS = MANUAL_PAYMENT_ENTITLEMENT_BLOCKERS;

export const MANUAL_PAYMENT_REQUIREMENT_POLICY = {
  version: MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.version,
  verdicts: MANUAL_PAYMENT_REQUIRED_VERDICTS,
  policy: MANUAL_PAYMENT_ENTITLEMENT_CONTRACT as ManualPaymentEntitlementPolicy,
  requirements: MANUAL_PAYMENT_ENTITLEMENT_REQUIREMENTS,
  evidenceTypes: MANUAL_PAYMENT_ALLOWED_PAYMENT_EVIDENCE_TYPES as readonly ManualPaymentEvidenceType[]
} as const;

export const MANUAL_PAYMENT_PROHIBITED_RECORD_FIELDS = [
  "raw_card_number",
  "cvv",
  "provider_token",
  "provider_secret",
  "card_expiry",
  "card_last_four",
  "bank_account_number",
  "payment_method_secret",
  "full_payment_payload",
  "webhook_signature"
] as const;

export const MANUAL_PAYMENT_AUDIT_EVENTS = [
  "manual_entitlement_requested",
  "manual_entitlement_approved",
  "manual_entitlement_revoked",
  "refund_requested",
  "refund_completed",
  "cancellation_requested",
  "dispute_opened",
  "access_paused"
] as const;
