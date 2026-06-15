export const MANUAL_PAYMENT_ENTITLEMENT_POLICY_VERSION = 1 as const;

export type ManualPaymentEntitlementPolicyVersion =
  typeof MANUAL_PAYMENT_ENTITLEMENT_POLICY_VERSION;

export type ManualPaymentPolicyVerdict =
  | "conditional_manual_only"
  | "no_go"
  | "blocked";

export type ManualPaymentEvidenceType =
  | "manual_payment_link_confirmation"
  | "manual_bank_transfer_receipt"
  | "manual_invoice_reference"
  | "manual_ticket_reference"
  | "manual_support_note";

export type ManualInviteSource =
  | "manual_email"
  | "manual_form"
  | "owner_invite_link"
  | "owner_admin_panel"
  | "support_followup";

export type ManualPaymentPlanLabel = "beta_lite" | "beta_pro";

export type ManualPaymentStatus =
  | "pending"
  | "approved"
  | "expired"
  | "refunded"
  | "canceled"
  | "disputed"
  | "revoked";

export type ManualEntitlementRecord = {
  participantIdentifier: string;
  inviteSource: ManualInviteSource;
  paymentStatus: ManualPaymentStatus;
  paymentEvidenceReference: string;
  approvedPlanLabel: ManualPaymentPlanLabel;
  approvalTimestamp: string;
  approvedByOwner: string;
  expirationOrReviewDate: string;
  refundOrCancelStatus: ManualPaymentStatus;
  notes: string;
};

export type ManualEntitlementRequirementField = {
  key: keyof ManualEntitlementRecord;
  required: true;
  privateBoundary: "local_only" | "owner_only";
  reason: string;
};

export type ManualPaymentEvidencePolicy = {
  allowedEvidenceTypes: readonly ManualPaymentEvidenceType[];
  allowProviderTokens: false;
  requireEvidenceReference: true;
  metadataOnlyStorage: true;
  redactionRequiredForExternalReferences: true;
};

export type ManualPaymentGrantPolicy = {
  automaticEntitlementByAppCodeBlocked: true;
  manualGrantRequired: true;
  productionUserDataMutationBlocked: true;
  localPlanStateIsNotEntitlement: true;
  reviewOnlyAgainstManualRecord: true;
  reason: string;
};

export type ManualPaymentRefundCancellationPolicy = {
  supportsRefundTracking: true;
  supportsCancellationTracking: true;
  preserveLearningState: true;
  accessRevocationModes: readonly ("immediate" | "period_end")[];
  disputeHandling: string;
  failureState: string;
  evidenceRequiredForManualRestore: true;
  supportEscalationRequiredBeforeReactivation: true;
};

export type ManualPaymentOwnerApproval = {
  required: true;
  requiredReviewerRoles: readonly ("owner" | "admin")[];
  steps: readonly string[];
  minimumEvidenceForApproval: number;
  auditRecordRequiredBeforeAccess: true;
};

export type ManualPaymentAuditTrail = {
  required: true;
  events: readonly string[];
  immutableRecordRequired: true;
  recordsMustExcludeSensitivePaymentPayloads: true;
  recordsMustExcludeProviderTokens: true;
  recordsMustExcludeRawCardData: true;
  reason: string;
};

export type ManualPaymentPrivacyBoundary = {
  noProductionUserDataMutation: true;
  noBrowserStorageSecrets: true;
  participantCommunicationRequiredBeforeInvite: true;
  noCrossDeviceEntitlementClaim: true;
  storageScope: "manual_record_only_for_audit";
  supportBoundary: string;
};

export type ManualPaymentSupportRequirement = {
  supportEmail: string;
  supportDiscord?: string;
  supportSla: string;
  mustEscalatePaymentDisputes: true;
  mustEscalateRefundOrCancelCases: true;
  requiredDisputeEvidence: readonly string[];
};

export type ManualPaymentRevocationPolicy = {
  immediateRevocationAllowed: true;
  periodEndRevocationAllowed: true;
  requiresOwnerRecord: true;
  preserveLocalLearningState: true;
  notifyParticipantBeforePause: true;
  pauseReasonExamples: readonly string[];
};

export type ManualPaymentRollbackPolicy = {
  privateBetaPauseTriggers: readonly string[];
  rollbackRequiredActions: readonly string[];
  noExternalSystemRollbackByDefault: true;
  reason: string;
};

export type ManualPaymentIntegrationBlocker = {
  integration: string;
  blocked: true;
  reason: string;
};

export type ManualPaymentPrStep = {
  prNumber: number;
  title: string;
  docsContractsTestsOnly: true;
  realPaymentImplementationRecommended: false;
};

export type ManualPaymentEntitlementPolicy = {
  version: ManualPaymentEntitlementPolicyVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/manual-payment-entitlement-policy";
  privateBetaVerdict: ManualPaymentPolicyVerdict;
  publicBetaVerdict: ManualPaymentPolicyVerdict;
  privateBetaPaymentMode: "manual_only";
  paymentLinkOnlyAllowed: true;
  noPublicCheckout: true;
  noAutomaticRecurringBilling: true;
  manualPayment: {
    allowedInviteSources: readonly ManualInviteSource[];
    paymentMode: "manual_only_with_payment_link_evidence";
    autoGrantBlocked: true;
    providerSdkBlocked: true;
  };
  paymentEvidence: ManualPaymentEvidencePolicy;
  entitlementGrant: ManualPaymentGrantPolicy;
  refundCancellation: ManualPaymentRefundCancellationPolicy;
  ownerApproval: ManualPaymentOwnerApproval;
  support: ManualPaymentSupportRequirement;
  revocation: ManualPaymentRevocationPolicy;
  privacyBoundary: ManualPaymentPrivacyBoundary;
  auditTrail: ManualPaymentAuditTrail;
  rollbackPolicy: ManualPaymentRollbackPolicy;
  implementationScope: {
    docsContractsTestsOnly: true;
    noRuntimeBehaviorChange: true;
    noRouteHandlers: true;
    noApiRoutes: true;
    noMiddleware: true;
    noAuth: true;
    noDatabaseWrites: true;
    noNetwork: true;
    noBrowserStorageExecution: true;
    noEnvReads: true;
    noPaymentProviderSdk: true;
  };
  blockedPaymentIntegrations: readonly ManualPaymentIntegrationBlocker[];
};

export type ManualPaymentContractSuite = {
  privateBetaPaymentPolicy: {
    mode: "manual_only";
    ownerApprovalRequired: true;
    paymentLinkAllowed: true;
    checkoutBlocked: true;
    recurringBillingBlocked: true;
    paymentModeDescription: string;
  };
  manualEntitlementRequirements: {
    requiredFields: readonly ManualEntitlementRequirementField[];
    allowedEvidenceTypes: readonly ManualPaymentEvidenceType[];
    prohibitedFields: readonly string[];
  };
  requiredNextPrSequence: readonly ManualPaymentPrStep[];
};

export const MANUAL_PAYMENT_ENTITLEMENT_VERDICT: ManualPaymentPolicyVerdict =
  "conditional_manual_only" as const;

export const PUBLIC_BETA_PAYMENT_VERDICT: ManualPaymentPolicyVerdict = "no_go" as const;

export const MANUAL_PAYMENT_ENTITLEMENT_REQUIREMENTS: readonly ManualEntitlementRequirementField[] = [
  {
    key: "participantIdentifier",
    required: true,
    privateBoundary: "owner_only",
    reason:
      "Required to map a manual payment record to one invited participant before access."
  },
  {
    key: "inviteSource",
    required: true,
    privateBoundary: "owner_only",
    reason:
      "Required to preserve invite traceability and owner audit boundaries."
  },
  {
    key: "paymentStatus",
    required: true,
    privateBoundary: "owner_only",
    reason: "Required to avoid automatic access when status is not active."
  },
  {
    key: "paymentEvidenceReference",
    required: true,
    privateBoundary: "local_only",
    reason:
      "Required evidence pointer without storing raw payment payloads or secrets."
  },
  {
    key: "approvedPlanLabel",
    required: true,
    privateBoundary: "owner_only",
    reason:
      "Required to choose beta_lite or beta_pro entitlement policy explicitly."
  },
  {
    key: "approvalTimestamp",
    required: true,
    privateBoundary: "local_only",
    reason:
      "Required to prove approval timing and support auditability."
  },
  {
    key: "approvedByOwner",
    required: true,
    privateBoundary: "owner_only",
    reason: "Required to capture owner identity for manual grant decisions."
  },
  {
    key: "expirationOrReviewDate",
    required: true,
    privateBoundary: "local_only",
    reason:
      "Required to enforce periodic re-checks and pause conditions."
  },
  {
    key: "refundOrCancelStatus",
    required: true,
    privateBoundary: "owner_only",
    reason:
      "Required to revoke or preserve access based on refund/cancel lifecycle."
  },
  {
    key: "notes",
    required: true,
    privateBoundary: "owner_only",
    reason:
      "Required for support handoff and future audit reasoning."
  }
] as const;

export const MANUAL_PAYMENT_ALLOWED_PAYMENT_EVIDENCE_TYPES = [
  "manual_payment_link_confirmation",
  "manual_bank_transfer_receipt",
  "manual_invoice_reference",
  "manual_ticket_reference",
  "manual_support_note"
] as const satisfies readonly ManualPaymentEvidenceType[];

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

export const MANUAL_PAYMENT_ENTITLEMENT_BLOCKERS = [
  {
    integration: "stripe",
    blocked: true,
    reason:
      "No payment provider SDK is permitted in docs/contracts scope."
  },
  {
    integration: "paddle",
    blocked: true,
    reason:
      "No payment provider SDK is permitted in docs/contracts scope."
  },
  {
    integration: "paypal",
    blocked: true,
    reason:
      "No payment provider SDK is permitted in docs/contracts scope."
  }
] as const satisfies readonly ManualPaymentIntegrationBlocker[];

export const MANUAL_PAYMENT_NEXT_PR_SEQUENCE = [
  {
    prNumber: 82,
    title: "Account sync preview/digest mock",
    docsContractsTestsOnly: true,
    realPaymentImplementationRecommended: false
  },
  {
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    docsContractsTestsOnly: true,
    realPaymentImplementationRecommended: false
  },
  {
    prNumber: 84,
    title: "Private beta readiness rerun",
    docsContractsTestsOnly: true,
    realPaymentImplementationRecommended: false
  },
  {
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    docsContractsTestsOnly: true,
    realPaymentImplementationRecommended: false
  }
] as const satisfies readonly ManualPaymentPrStep[];

export const MANUAL_PAYMENT_ENTITLEMENT_CONTRACT = {
  version: MANUAL_PAYMENT_ENTITLEMENT_POLICY_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/manual-payment-entitlement-policy",
  privateBetaVerdict: MANUAL_PAYMENT_ENTITLEMENT_VERDICT,
  publicBetaVerdict: PUBLIC_BETA_PAYMENT_VERDICT,
  privateBetaPaymentMode: "manual_only",
  paymentLinkOnlyAllowed: true,
  noPublicCheckout: true,
  noAutomaticRecurringBilling: true,
  manualPayment: {
    allowedInviteSources: [
      "manual_email",
      "manual_form",
      "owner_invite_link",
      "owner_admin_panel",
      "support_followup"
    ],
    paymentMode: "manual_only_with_payment_link_evidence",
    autoGrantBlocked: true,
    providerSdkBlocked: true
  },
  paymentEvidence: {
    allowedEvidenceTypes: MANUAL_PAYMENT_ALLOWED_PAYMENT_EVIDENCE_TYPES,
    allowProviderTokens: false,
    requireEvidenceReference: true,
    metadataOnlyStorage: true,
    redactionRequiredForExternalReferences: true
  },
  entitlementGrant: {
    automaticEntitlementByAppCodeBlocked: true,
    manualGrantRequired: true,
    productionUserDataMutationBlocked: true,
    localPlanStateIsNotEntitlement: true,
    reviewOnlyAgainstManualRecord: true,
    reason:
      "No automatic paid entitlement from local state, upgrade interest, paid event hints, or client data."
  },
  refundCancellation: {
    supportsRefundTracking: true,
    supportsCancellationTracking: true,
    preserveLearningState: true,
    accessRevocationModes: ["immediate", "period_end"],
    disputeHandling:
      "Disputes pause access until support and owner review complete.",
    failureState:
      "Refund, cancellation, or dispute states downgrade or revoke access while keeping local review history.",
    evidenceRequiredForManualRestore: true,
    supportEscalationRequiredBeforeReactivation: true
  },
  ownerApproval: {
    required: true,
    requiredReviewerRoles: ["owner", "admin"],
    steps: [
      "Verify participant identity and invite source.",
      "Validate allowed payment evidence reference.",
      "Approve plan (beta_lite or beta_pro) and set status.",
      "Record approval timestamp, reviewer, and review window.",
      "Create audit note and support contact."
    ],
    minimumEvidenceForApproval: 2,
    auditRecordRequiredBeforeAccess: true
  },
  support: {
    supportEmail: "support@visuallexicon.org",
    supportDiscord: "https://discord.gg/visuallexicon",
    supportSla: "business_hours_initial_response_within_two_business_days",
    mustEscalatePaymentDisputes: true,
    mustEscalateRefundOrCancelCases: true,
    requiredDisputeEvidence: [
      "evidence_reference",
      "participant_statement",
      "support_contact_log",
      "owner_decision_id"
    ]
  },
  revocation: {
    immediateRevocationAllowed: true,
    periodEndRevocationAllowed: true,
    requiresOwnerRecord: true,
    preserveLocalLearningState: true,
    notifyParticipantBeforePause: true,
    pauseReasonExamples: [
      "refund_processed",
      "dispute_opened",
      "owner_audit_override",
      "payment_reference_expired",
      "cancellation_requested"
    ]
  },
  privacyBoundary: {
    noProductionUserDataMutation: true,
    noBrowserStorageSecrets: true,
    participantCommunicationRequiredBeforeInvite: true,
    noCrossDeviceEntitlementClaim: true,
    storageScope: "manual_record_only_for_audit",
    supportBoundary:
      "No production auth, DB, account persistence, or deployment data changes in this PR."
  },
  auditTrail: {
    required: true,
    events: [
      "manual_entitlement_requested",
      "manual_entitlement_approved",
      "manual_entitlement_revoked",
      "refund_requested",
      "refund_completed",
      "cancellation_requested",
      "dispute_opened",
      "access_paused"
    ],
    immutableRecordRequired: true,
    recordsMustExcludeSensitivePaymentPayloads: true,
    recordsMustExcludeProviderTokens: true,
    recordsMustExcludeRawCardData: true,
    reason:
      "Every manual access lifecycle action must be auditable without payment secrets."
  },
  rollbackPolicy: {
    privateBetaPauseTriggers: [
      "manual_access_without_owner_approval",
      "missing_manual_entitlement_record",
      "evidence_reference_invalid_or_missing",
      "unsupported_payment_integration_detected",
      "refund_or_dispute_handling_gap"
    ],
    rollbackRequiredActions: [
      "Stop new invites immediately.",
      "Publish a pause notice to participants.",
      "Correct owner approval and evidence process.",
      "Fix access revocation and rollback conditions.",
      "Re-run manual review before resuming invites."
    ],
    noExternalSystemRollbackByDefault: true,
    reason:
      "Only docs/contracts and local policy rollback is required at this stage."
  },
  implementationScope: {
    docsContractsTestsOnly: true,
    noRuntimeBehaviorChange: true,
    noRouteHandlers: true,
    noApiRoutes: true,
    noMiddleware: true,
    noAuth: true,
    noDatabaseWrites: true,
    noNetwork: true,
    noBrowserStorageExecution: true,
    noEnvReads: true,
    noPaymentProviderSdk: true
  },
  blockedPaymentIntegrations: MANUAL_PAYMENT_ENTITLEMENT_BLOCKERS
} as const satisfies ManualPaymentEntitlementPolicy;

export const MANUAL_PAYMENT_CONTRACT_SUITE = {
  privateBetaPaymentPolicy: {
    mode: "manual_only",
    ownerApprovalRequired: true,
    paymentLinkAllowed: true,
    checkoutBlocked: true,
    recurringBillingBlocked: true,
    paymentModeDescription:
      "Owner-only manual grant workflow with optional payment-link evidence capture."
  },
  manualEntitlementRequirements: {
    requiredFields: MANUAL_PAYMENT_ENTITLEMENT_REQUIREMENTS,
    allowedEvidenceTypes: MANUAL_PAYMENT_ALLOWED_PAYMENT_EVIDENCE_TYPES,
    prohibitedFields: MANUAL_PAYMENT_PROHIBITED_RECORD_FIELDS
  },
  requiredNextPrSequence: MANUAL_PAYMENT_NEXT_PR_SEQUENCE
} as const satisfies ManualPaymentContractSuite;

export function getManualPaymentEntitlementPolicy(): ManualPaymentEntitlementPolicy {
  return MANUAL_PAYMENT_ENTITLEMENT_CONTRACT;
}

export function getPrivateBetaPaymentPolicy() {
  return MANUAL_PAYMENT_CONTRACT_SUITE.privateBetaPaymentPolicy;
}

export function getManualEntitlementRequirements() {
  return {
    requiredFields: MANUAL_PAYMENT_CONTRACT_SUITE.manualEntitlementRequirements.requiredFields,
    allowedEvidenceTypes:
      MANUAL_PAYMENT_CONTRACT_SUITE.manualEntitlementRequirements.allowedEvidenceTypes,
    prohibitedFields:
      MANUAL_PAYMENT_CONTRACT_SUITE.manualEntitlementRequirements.prohibitedFields
  };
}

export function getBlockedPaymentIntegrations() {
  return MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.blockedPaymentIntegrations.map(
    (entry) => entry.integration
  );
}

export function getRefundCancellationPolicy() {
  return MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.refundCancellation;
}

export function getOwnerApprovalChecklist() {
  return {
    required: MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.ownerApproval.required,
    steps: MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.ownerApproval.steps,
    minimumEvidenceForApproval:
      MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.ownerApproval.minimumEvidenceForApproval,
    requiredReviewerRoles:
      MANUAL_PAYMENT_ENTITLEMENT_CONTRACT.ownerApproval.requiredReviewerRoles
  };
}

export function getNextManualPaymentPRSequence() {
  return MANUAL_PAYMENT_CONTRACT_SUITE.requiredNextPrSequence;
}
