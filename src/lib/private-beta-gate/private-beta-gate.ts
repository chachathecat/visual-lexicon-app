export const VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION = "1.0.0" as const;

export const PRIVATE_BETA_GATE_SOURCE_PR = 165 as const;

export const PRIVATE_BETA_GATE_SOURCE_MERGE_SHA =
  "79b2c50214a69c530a875556667b06c1c8f629e0" as const;

export const PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_VERDICT = "no_go" as const;

export const PRIVATE_BETA_GATE_PRIVATE_MANUAL_BETA_VERDICT =
  "gate_review_required" as const;

export const PRIVATE_BETA_GATE_REQUIRED_P0_COUNT = 0 as const;

export const PRIVATE_BETA_GATE_OWNER_APPROVAL_REQUIRED = true as const;

export const PRIVATE_BETA_GATE_REAL_PAYMENT_ENABLED = false as const;

export const PRIVATE_BETA_GATE_CHECKOUT_ENABLED = false as const;

export const PRIVATE_BETA_GATE_PAYMENT_SDK_ENABLED = false as const;

export const PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_UNBLOCKED = false as const;

export const PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS = [
  "vlx_save_word_click",
  "vlx_quiz_start",
  "vlx_quiz_answer",
  "vlx_quiz_complete",
  "vlx_review_state_update",
  "vlx_due_review_start",
  "vlx_weak_review_start",
  "vlx_pack_preview_start",
  "vlx_pack_preview_complete",
  "vlx_paywall_view",
  "vlx_upgrade_click"
] as const;

export const PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST = [
  "Support email or support channel is defined.",
  "Refund wording is defined before any owner-run manual payment.",
  "Privacy copy is reviewed.",
  "Data deletion wording is reviewed.",
  "Known limitations are disclosed.",
  "LocalStorage-only limitations are disclosed where relevant.",
  "No production data mutation is allowed.",
  "No secrets appear in frontend code."
] as const;

export const PRIVATE_BETA_GATE_STOP_CONDITIONS = [
  "Any P0 appears.",
  "Save stops creating a review item.",
  "Review stops updating state/events.",
  "Due/Weak/Mastered become fake or misleading, including fake mastery.",
  "Pack progress becomes fake.",
  "A payment/checkout/billing route appears without owner approval.",
  "Public paid beta launch copy appears.",
  "Private beta is represented as launched without owner approval.",
  "Support/refund/privacy checklist is incomplete."
] as const;

export const PRIVATE_BETA_GATE_REQUIRED_CONDITIONS = [
  "#165 P0 finding count is zero.",
  "Owner approval is recorded.",
  "Invite list is manually controlled.",
  "Access is manual-only.",
  "Payment, if any, is handled outside the app by the owner.",
  "No in-app checkout.",
  "No in-app billing portal.",
  "No payment SDK.",
  "No fake paid entitlement.",
  "No public launch copy.",
  "Support/refund/privacy checklist is reviewed.",
  "Manual QA evidence is complete.",
  "Known P1/P2 limitations are documented.",
  "Analytics readiness is checked.",
  "Stop conditions are clear."
] as const;

export const PRIVATE_BETA_GATE_P0_REQUIREMENTS = [
  "Save creates review item.",
  "Review updates state/events.",
  "Due/Weak/Mastered remain honest.",
  "Weak sprint uses real weak evidence.",
  "Pack preview/progress remains honest.",
  "Pricing upgrade interest records local beta interest only.",
  "No checkout/payment/billing route exists.",
  "Public paid beta remains No-Go.",
  "Private/manual paid beta remains gated until owner approval."
] as const;

export const PRIVATE_BETA_GATE_P1_EXAMPLES = [
  "Extension source needs real extension E2E.",
  "Public beta account sync/server SRS is missing.",
  "Public beta payment/monitoring/support/privacy gates remain open.",
  "Owner sign-off still needed."
] as const;

export const PRIVATE_BETA_GATE_P2_EXAMPLES = [
  "IELTS/GRE content depth.",
  "Mobile/accessibility polish.",
  "Future AI mistake explanation.",
  "Future export/download improvements.",
  "Future full multilingual pages."
] as const;

export type PrivateBetaGatePublicPaidBetaVerdict =
  typeof PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_VERDICT;

export type PrivateBetaGatePrivateManualBetaVerdict =
  typeof PRIVATE_BETA_GATE_PRIVATE_MANUAL_BETA_VERDICT;

export type PrivateBetaGateAnalyticsEvent =
  (typeof PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS)[number];

export type PrivateBetaGateReport = {
  version: typeof VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION;
  source: {
    pr: typeof PRIVATE_BETA_GATE_SOURCE_PR;
    mergeSha: typeof PRIVATE_BETA_GATE_SOURCE_MERGE_SHA;
    evidenceFile: "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md";
  };
  verdicts: {
    publicPaidBeta: PrivateBetaGatePublicPaidBetaVerdict;
    privateManualBeta: PrivateBetaGatePrivateManualBetaVerdict;
    privateManualBetaLaunched: false;
  };
  requiredP0Count: typeof PRIVATE_BETA_GATE_REQUIRED_P0_COUNT;
  ownerApprovalRequired: typeof PRIVATE_BETA_GATE_OWNER_APPROVAL_REQUIRED;
  safety: {
    realPaymentEnabled: typeof PRIVATE_BETA_GATE_REAL_PAYMENT_ENABLED;
    checkoutEnabled: typeof PRIVATE_BETA_GATE_CHECKOUT_ENABLED;
    paymentSdkEnabled: typeof PRIVATE_BETA_GATE_PAYMENT_SDK_ENABLED;
    publicPaidBetaUnblocked: typeof PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_UNBLOCKED;
    realPaidEntitlementEnabled: false;
  };
  requiredConditions: typeof PRIVATE_BETA_GATE_REQUIRED_CONDITIONS;
  p0Requirements: typeof PRIVATE_BETA_GATE_P0_REQUIREMENTS;
  p1Examples: typeof PRIVATE_BETA_GATE_P1_EXAMPLES;
  p2Examples: typeof PRIVATE_BETA_GATE_P2_EXAMPLES;
  analyticsEvents: typeof PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS;
  supportRefundPrivacyChecklist: typeof PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST;
  stopConditions: typeof PRIVATE_BETA_GATE_STOP_CONDITIONS;
};

export function getPrivateBetaGateReport(): PrivateBetaGateReport {
  return {
    version: VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
    source: {
      pr: PRIVATE_BETA_GATE_SOURCE_PR,
      mergeSha: PRIVATE_BETA_GATE_SOURCE_MERGE_SHA,
      evidenceFile: "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md"
    },
    verdicts: {
      publicPaidBeta: PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_VERDICT,
      privateManualBeta: PRIVATE_BETA_GATE_PRIVATE_MANUAL_BETA_VERDICT,
      privateManualBetaLaunched: false
    },
    requiredP0Count: PRIVATE_BETA_GATE_REQUIRED_P0_COUNT,
    ownerApprovalRequired: PRIVATE_BETA_GATE_OWNER_APPROVAL_REQUIRED,
    safety: {
      realPaymentEnabled: PRIVATE_BETA_GATE_REAL_PAYMENT_ENABLED,
      checkoutEnabled: PRIVATE_BETA_GATE_CHECKOUT_ENABLED,
      paymentSdkEnabled: PRIVATE_BETA_GATE_PAYMENT_SDK_ENABLED,
      publicPaidBetaUnblocked: PRIVATE_BETA_GATE_PUBLIC_PAID_BETA_UNBLOCKED,
      realPaidEntitlementEnabled: false
    },
    requiredConditions: PRIVATE_BETA_GATE_REQUIRED_CONDITIONS,
    p0Requirements: PRIVATE_BETA_GATE_P0_REQUIREMENTS,
    p1Examples: PRIVATE_BETA_GATE_P1_EXAMPLES,
    p2Examples: PRIVATE_BETA_GATE_P2_EXAMPLES,
    analyticsEvents: PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS,
    supportRefundPrivacyChecklist:
      PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST,
    stopConditions: PRIVATE_BETA_GATE_STOP_CONDITIONS
  };
}

export function getPrivateBetaGateStopConditions() {
  return PRIVATE_BETA_GATE_STOP_CONDITIONS;
}

export function getPrivateBetaGateAnalyticsEvents() {
  return PRIVATE_BETA_GATE_REQUIRED_ANALYTICS_EVENTS;
}
