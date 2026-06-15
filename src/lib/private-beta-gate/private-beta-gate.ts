export const VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION = 1 as const;

export type VisualLexiconPrivateBetaGateVersion =
  typeof VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION;

export type PrivateBetaGateVerdict = "Conditional / Manual-only" | "No-Go";

export type PrivateBetaGateBetaType = "owner-controlled private beta";

export type PrivateBetaGateSeverity = "P0" | "P1" | "P2";

export type PrivateBetaGatePolicyStatus =
  | "required"
  | "allowed_with_owner_control"
  | "blocked"
  | "disclosure_required";

export type PrivateBetaGatePolicyId =
  | "owner_invited_only"
  | "manual_or_payment_link_only"
  | "manual_entitlement_no_mutation"
  | "no_public_signup"
  | "public_paid_beta_no_go"
  | "no_real_checkout"
  | "no_automatic_paid_access"
  | "account_sync_limitation_disclosure"
  | "single_browser_local_state_limitation"
  | "support_contact_required"
  | "refund_cancellation_copy_required"
  | "privacy_copy_required"
  | "monitoring_minimum_required"
  | "issue_reporting_process_required"
  | "rollback_pause_criteria_required"
  | "owner_approval_before_production_launch";

export type PrivateBetaGatePolicy = {
  id: PrivateBetaGatePolicyId;
  label: string;
  status: PrivateBetaGatePolicyStatus;
  severity: PrivateBetaGateSeverity;
  requiredBeforePrivateBeta: boolean;
  requiredBeforePublicBeta: boolean;
  implementationAllowedInThisPr: false;
  summary: string;
  evidenceRequired: string;
};

export type PrivateBetaGateCondition = {
  id: string;
  label: string;
  severity: PrivateBetaGateSeverity;
  evidenceRequired: string;
};

export type PrivateBetaGateBlocker = {
  id: string;
  label: string;
  severity: PrivateBetaGateSeverity;
  blocksPrivateBeta: boolean;
  blocksPublicBeta: boolean;
  ownerApprovalCanAcceptForPrivateBeta: boolean;
  nextAction: string;
};

export type PrivateBetaGateChecklistItem = {
  id: string;
  label: string;
  requiredBeforeInvites: boolean;
  evidenceRequired: string;
};

export type PrivateBetaGateQaEvidenceRequirement = {
  id: string;
  area: string;
  requiredEvidence: string;
  blocksPrivateBetaIfMissing: boolean;
};

export type PrivateBetaGateMonitoringItem = {
  id: string;
  label: string;
  minimumRequirement: string;
  blocksPrivateBetaIfMissing: boolean;
};

export type PrivateBetaGateSupportPrivacyItem = {
  id: string;
  label: string;
  minimumCopyRequirement: string;
  blocksPrivateBetaIfMissing: boolean;
};

export type PrivateBetaGateRollbackCriterion = {
  id: string;
  severity: PrivateBetaGateSeverity;
  trigger: string;
  ownerAction: string;
};

export type PrivateBetaGateNextPr = {
  prNumber: 81 | 82 | 83 | 84 | 85;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: boolean;
  realPaymentImplementationAllowed: false;
  realAccountSyncImplementationAllowed: false;
};

export type PrivateBetaGateSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  authIntegrationAllowed: false;
  databaseProviderAllowed: false;
  providerSdkAllowed: false;
  paymentBillingCheckoutAllowed: false;
  entitlementMutationAllowed: false;
  accountSyncAllowed: false;
  aiCallsAllowed: false;
  environmentVariableChangesAllowed: false;
  deploymentChangesAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  productionDataMutationAllowed: false;
  networkCallsAllowed: false;
  browserStorageAccessAllowed: false;
  npmAuditFixAllowed: false;
};

export type PrivateBetaGate = {
  version: VisualLexiconPrivateBetaGateVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/private-beta-gate-prep";
  pullRequest: "#80 Private beta gate prep";
  scope: "Track B owner-controlled private beta gate";
  betaType: PrivateBetaGateBetaType;
  privateBetaVerdict: "Conditional / Manual-only";
  publicBetaVerdict: "No-Go";
  currentVerdicts: {
    privatePaidBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
  };
  cohortCap: {
    recommendedInitialMin: 5;
    recommendedInitialMax: 20;
    hardCapBeforeReapproval: 20;
    recommendation: "5 to 20 users";
    ownerControlled: true;
    conservative: true;
  };
  participantProfile: {
    allowed: readonly string[];
    excluded: readonly string[];
  };
  manualInviteProcess: readonly string[];
  policies: readonly PrivateBetaGatePolicy[];
  launchAllowedConditions: readonly PrivateBetaGateCondition[];
  launchBlockedConditions: readonly PrivateBetaGateBlocker[];
  publicBetaP0Blockers: readonly PrivateBetaGateBlocker[];
  privateBetaP1Requirements: readonly PrivateBetaGateCondition[];
  p2Polish: readonly PrivateBetaGateCondition[];
  ownerChecklist: readonly PrivateBetaGateChecklistItem[];
  manualQaEvidenceRequirements: readonly PrivateBetaGateQaEvidenceRequirement[];
  monitoringChecklist: readonly PrivateBetaGateMonitoringItem[];
  supportRefundPrivacyChecklist: readonly PrivateBetaGateSupportPrivacyItem[];
  issueReportingProcess: readonly string[];
  rollbackCriteria: readonly PrivateBetaGateRollbackCriterion[];
  rollbackPlan: readonly string[];
  ownerApprovalRequirement: {
    requiredBeforePrivateInvites: true;
    requiredBeforeAnyProductionFacingLaunch: true;
    requiredBeforePublicPaidBeta: true;
    summary: string;
  };
  nextPrivateBetaPrSequence: readonly PrivateBetaGateNextPr[];
  safetyPolicy: PrivateBetaGateSafetyPolicy;
};

export const PRIVATE_BETA_GATE_PRIVATE_VERDICT =
  "Conditional / Manual-only" as const satisfies PrivateBetaGateVerdict;

export const PRIVATE_BETA_GATE_PUBLIC_VERDICT =
  "No-Go" as const satisfies PrivateBetaGateVerdict;

export const PRIVATE_BETA_GATE_POLICIES = [
  {
    id: "owner_invited_only",
    label: "Owner-invited only",
    status: "required",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Every participant must be directly invited by the owner from a tracked roster.",
    evidenceRequired: "Owner-approved invite roster and invite copy."
  },
  {
    id: "manual_or_payment_link_only",
    label: "Manual or payment-link-only payment policy",
    status: "allowed_with_owner_control",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Payment may be handled manually or through an owner-controlled external payment link until real billing exists.",
    evidenceRequired:
      "Payment-link copy states that access is manual and the app has no connected checkout."
  },
  {
    id: "manual_entitlement_no_mutation",
    label: "Manual entitlement policy without app mutation",
    status: "required",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "The owner may keep an external participant/access ledger, but this PR must not mutate app entitlement state.",
    evidenceRequired:
      "Manual entitlement notes describe the off-app ledger and explicitly forbid app entitlement mutation."
  },
  {
    id: "no_public_signup",
    label: "No public signup",
    status: "blocked",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "The private beta must not expose open signup, self-serve onboarding, or public invite forms.",
    evidenceRequired: "QA confirms no public signup path is launched."
  },
  {
    id: "public_paid_beta_no_go",
    label: "Public paid beta remains No-Go",
    status: "blocked",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Public paid beta cannot launch until real payment, account sync, monitoring, privacy/support/refund, and accessibility gates are cleared.",
    evidenceRequired: "Owner sign-off that the launch is private only."
  },
  {
    id: "no_real_checkout",
    label: "No real checkout",
    status: "blocked",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "This PR must not add checkout, billing portal, invoice, subscription, payment SDK, or payment route behavior.",
    evidenceRequired: "Code review and tests confirm no checkout integration exists."
  },
  {
    id: "no_automatic_paid_access",
    label: "No automatic paid access",
    status: "blocked",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "No payment event, link click, local plan preview, or interest record may automatically grant paid access.",
    evidenceRequired: "Manual policy states owner-only access confirmation."
  },
  {
    id: "account_sync_limitation_disclosure",
    label: "Account sync limitation disclosure",
    status: "disclosure_required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Participants must be told that account sync is not implemented and progress does not roam across accounts.",
    evidenceRequired: "Invite/support copy includes account sync limitation wording."
  },
  {
    id: "single_browser_local_state_limitation",
    label: "Single-browser local-state limitation",
    status: "disclosure_required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Participants must be told that review state is tied to one browser profile until account sync exists.",
    evidenceRequired: "Invite/support copy includes local-state limitation wording."
  },
  {
    id: "support_contact_required",
    label: "Support contact required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Every invite must include a monitored support contact for access, learning-state, billing-link, and cancellation issues.",
    evidenceRequired: "Support contact is present in invite, receipt, and beta notes."
  },
  {
    id: "refund_cancellation_copy_required",
    label: "Refund and cancellation wording required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Payment-link or manual payment copy must explain refund and cancellation handling before any money is accepted.",
    evidenceRequired: "Owner-approved refund and cancellation copy."
  },
  {
    id: "privacy_copy_required",
    label: "Privacy copy required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Participants must receive plain-language privacy copy covering local learning data, support messages, and payment-link processing boundaries.",
    evidenceRequired: "Privacy copy is approved before invites."
  },
  {
    id: "monitoring_minimum_required",
    label: "Monitoring minimum required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Owner must maintain a manual issue log, daily review of participant reports, and launch-stop thresholds.",
    evidenceRequired: "Monitoring checklist is assigned to an owner before invites."
  },
  {
    id: "issue_reporting_process_required",
    label: "Issue reporting process required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Participants need a clear way to report broken review, lost state, payment-link, accessibility, and refund issues.",
    evidenceRequired: "Issue-reporting instructions appear in invite and support copy."
  },
  {
    id: "rollback_pause_criteria_required",
    label: "Rollback and pause criteria required",
    status: "required",
    severity: "P1",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "Owner must pause invites and payment links when core learning, support, privacy, or payment-link issues cross thresholds.",
    evidenceRequired: "Rollback criteria are acknowledged before invites."
  },
  {
    id: "owner_approval_before_production_launch",
    label: "Owner approval before production-facing launch",
    status: "required",
    severity: "P0",
    requiredBeforePrivateBeta: true,
    requiredBeforePublicBeta: true,
    implementationAllowedInThisPr: false,
    summary:
      "No production-facing launch, public paid beta, Webflow change, deployment change, or self-serve paid access can happen without explicit owner approval.",
    evidenceRequired: "Owner approval is recorded outside this static contract."
  }
] as const satisfies readonly PrivateBetaGatePolicy[];

export const PRIVATE_BETA_GATE_ALLOWED_CONDITIONS = [
  {
    id: "cohort_5_to_20_owner_invited",
    label: "Initial cohort is 5 to 20 owner-invited users.",
    severity: "P0",
    evidenceRequired: "Owner-approved roster with no public signup path."
  },
  {
    id: "manual_qa_evidence_recorded",
    label: "Manual QA evidence is recorded before invites.",
    severity: "P0",
    evidenceRequired:
      "Fresh save, review, weak, packs, pricing, mobile, keyboard, and storage evidence."
  },
  {
    id: "payment_manual_or_link_only",
    label: "Payment remains manual or payment-link-only.",
    severity: "P0",
    evidenceRequired:
      "No checkout integration; manual payment copy includes refund/cancellation terms."
  },
  {
    id: "no_automatic_entitlement",
    label: "No automatic entitlement is granted.",
    severity: "P0",
    evidenceRequired:
      "Owner uses an off-app ledger and does not mutate app entitlement state."
  },
  {
    id: "local_state_disclosed",
    label: "Account sync and single-browser local-state limits are disclosed.",
    severity: "P1",
    evidenceRequired: "Invite and support copy includes limitation wording."
  },
  {
    id: "support_privacy_refund_ready",
    label: "Support, privacy, refund, and cancellation copy are ready.",
    severity: "P1",
    evidenceRequired: "Owner-approved support/refund/privacy checklist."
  },
  {
    id: "monitoring_owner_assigned",
    label: "Manual monitoring owner is assigned.",
    severity: "P1",
    evidenceRequired:
      "Issue log, daily review cadence, and pause thresholds are documented."
  },
  {
    id: "owner_approval_recorded",
    label: "Owner approval is recorded before private invites.",
    severity: "P0",
    evidenceRequired: "Owner sign-off references this gate and manual QA evidence."
  }
] as const satisfies readonly PrivateBetaGateCondition[];

export const PRIVATE_BETA_GATE_BLOCKED_CONDITIONS = [
  {
    id: "missing_manual_qa_evidence",
    label: "Manual QA evidence is missing or stale.",
    severity: "P0",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Run and record the private beta manual QA evidence."
  },
  {
    id: "open_public_signup_or_self_serve",
    label: "Open signup, self-serve paid access, or public invite form exists.",
    severity: "P0",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Remove public access paths and keep invites owner-controlled."
  },
  {
    id: "real_checkout_or_payment_sdk_present",
    label: "Real checkout, payment SDK, billing portal, or subscription path is present.",
    severity: "P0",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Move payment implementation to a separately approved billing PR."
  },
  {
    id: "automatic_entitlement_grant_present",
    label: "Automatic paid access or entitlement mutation exists.",
    severity: "P0",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Remove automatic access grant behavior from this gate scope."
  },
  {
    id: "support_refund_privacy_copy_missing",
    label: "Support, refund, cancellation, or privacy copy is missing.",
    severity: "P1",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Prepare and approve the participant-facing operating copy."
  },
  {
    id: "monitoring_issue_reporting_missing",
    label: "Monitoring and issue reporting process is missing.",
    severity: "P1",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Assign owner review cadence and issue log before invites."
  },
  {
    id: "owner_approval_missing",
    label: "Owner approval is missing.",
    severity: "P0",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: false,
    nextAction: "Record explicit owner approval before production-facing launch."
  }
] as const satisfies readonly PrivateBetaGateBlocker[];

export const PRIVATE_BETA_GATE_PUBLIC_P0_BLOCKERS = [
  {
    id: "p0_real_payment_billing_entitlement_missing",
    label: "Real payment, billing, and entitlement system is not implemented.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Clear billing architecture, checkout, entitlement, refund, and support gates before public beta."
  },
  {
    id: "p0_account_sync_missing",
    label: "Account sync and server-backed learning state are not implemented.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Clear account sync, migration, backup, restore, and data ownership gates before public beta."
  },
  {
    id: "p0_production_monitoring_missing",
    label: "Production monitoring and alerting are not implemented.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Clear monitoring, analytics dashboard, alert thresholds, and incident response gates before public beta."
  },
  {
    id: "p0_privacy_support_refund_gate_missing",
    label: "Privacy, support, refund, and cancellation gate is not complete.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Clear privacy copy, support coverage, cancellation, refund, failed-payment, and data disclosure gates before public beta."
  },
  {
    id: "p0_accessibility_gate_missing",
    label: "Accessibility gate is not complete.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Clear keyboard, focus, labels, contrast, responsive, and assistive technology evidence before public beta."
  },
  {
    id: "p0_public_launch_qa_missing",
    label: "Fresh public launch QA and rollback evidence are missing.",
    severity: "P0",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalCanAcceptForPrivateBeta: true,
    nextAction:
      "Rerun manual QA, document rollback, and get owner approval before public paid beta."
  }
] as const satisfies readonly PrivateBetaGateBlocker[];

export const PRIVATE_BETA_GATE_P1_REQUIREMENTS = [
  {
    id: "p1_owner_roster_and_invite_log",
    label: "Owner roster and invite log are ready.",
    severity: "P1",
    evidenceRequired: "Roster includes invite date, participant profile, and support contact."
  },
  {
    id: "p1_account_sync_local_state_disclosure",
    label: "Account sync and local-state disclosures are in participant copy.",
    severity: "P1",
    evidenceRequired: "Copy says progress is tied to one browser profile."
  },
  {
    id: "p1_manual_payment_entitlement_policy",
    label: "Manual payment and manual entitlement policy is approved.",
    severity: "P1",
    evidenceRequired:
      "Policy explains payment-link-only/manual payment and no automatic paid access."
  },
  {
    id: "p1_support_refund_privacy_copy",
    label: "Support, refund, cancellation, and privacy copy is approved.",
    severity: "P1",
    evidenceRequired: "Participant-facing copy is ready before invites."
  },
  {
    id: "p1_monitoring_issue_log",
    label: "Monitoring and issue log process is ready.",
    severity: "P1",
    evidenceRequired: "Owner review cadence and escalation thresholds are documented."
  },
  {
    id: "p1_accessibility_mobile_smoke",
    label: "Mobile and keyboard accessibility smoke evidence is recorded.",
    severity: "P1",
    evidenceRequired:
      "Evidence shows core save and review flows are usable on mobile and keyboard."
  }
] as const satisfies readonly PrivateBetaGateCondition[];

export const PRIVATE_BETA_GATE_P2_POLISH = [
  {
    id: "p2_pack_content_depth",
    label: "Richer IELTS/GRE pack content and copy polish.",
    severity: "P2",
    evidenceRequired: "Future content audit after private loop validation."
  },
  {
    id: "p2_dashboard_progress_polish",
    label: "Dashboard progress and streak polish.",
    severity: "P2",
    evidenceRequired: "Future polish pass after real weekly review behavior is observed."
  },
  {
    id: "p2_onboarding_copy_polish",
    label: "Onboarding and invite copy polish.",
    severity: "P2",
    evidenceRequired: "Future copy pass after support themes are known."
  },
  {
    id: "p2_future_ai_mistake_explanation",
    label: "Future AI mistake explanation.",
    severity: "P2",
    evidenceRequired: "Separate AI approval only after the SRS loop works."
  }
] as const satisfies readonly PrivateBetaGateCondition[];

export const PRIVATE_BETA_GATE_OWNER_CHECKLIST = [
  {
    id: "owner_approve_gate",
    label: "Approve this private beta gate and cohort cap.",
    requiredBeforeInvites: true,
    evidenceRequired: "Owner sign-off references PR #80."
  },
  {
    id: "owner_prepare_roster",
    label: "Prepare owner-invited roster for 5 to 20 users.",
    requiredBeforeInvites: true,
    evidenceRequired: "Roster exists outside the app and excludes unsupported participants."
  },
  {
    id: "owner_run_manual_qa",
    label: "Run manual QA evidence from a clean browser profile.",
    requiredBeforeInvites: true,
    evidenceRequired: "Manual QA report includes save, review, weak, packs, pricing, mobile, keyboard, and storage evidence."
  },
  {
    id: "owner_approve_payment_policy",
    label: "Approve manual payment or payment-link-only policy.",
    requiredBeforeInvites: true,
    evidenceRequired: "Copy states no connected checkout and no automatic paid access."
  },
  {
    id: "owner_approve_support_privacy_refund",
    label: "Approve support, privacy, refund, and cancellation copy.",
    requiredBeforeInvites: true,
    evidenceRequired: "Participant copy includes support contact and refund/cancellation wording."
  },
  {
    id: "owner_set_monitoring_cadence",
    label: "Set monitoring cadence and issue triage owner.",
    requiredBeforeInvites: true,
    evidenceRequired: "Owner owns daily issue review and pause decisions."
  },
  {
    id: "owner_confirm_no_public_launch",
    label: "Confirm public paid beta remains No-Go.",
    requiredBeforeInvites: true,
    evidenceRequired: "Launch notes say this is private, manual, and owner-controlled only."
  }
] as const satisfies readonly PrivateBetaGateChecklistItem[];

export const PRIVATE_BETA_GATE_MANUAL_QA_EVIDENCE_REQUIREMENTS = [
  {
    id: "qa_save_creates_review_item",
    area: "save_to_review",
    requiredEvidence: "Save creates or preserves a review item.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "qa_review_writes_events",
    area: "review",
    requiredEvidence: "Review answers write events and update memory state.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "qa_due_weak_mastered_real_state",
    area: "srs_selectors",
    requiredEvidence: "Due, Weak, and Mastered derive from real review state.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "qa_pricing_no_checkout",
    area: "pricing",
    requiredEvidence: "Pricing exposes no checkout, subscription, invoice, billing portal, or automatic entitlement.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "qa_mobile_keyboard_accessible_core_loop",
    area: "accessibility",
    requiredEvidence: "Mobile and keyboard smoke covers dashboard, save, review, saved, packs, and pricing.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "qa_local_state_disclosure_matches_behavior",
    area: "account_sync_limitation",
    requiredEvidence: "QA notes confirm progress is local to one browser profile.",
    blocksPrivateBetaIfMissing: true
  }
] as const satisfies readonly PrivateBetaGateQaEvidenceRequirement[];

export const PRIVATE_BETA_GATE_MONITORING_CHECKLIST = [
  {
    id: "monitor_issue_log",
    label: "Issue log",
    minimumRequirement:
      "Owner keeps a single issue log for broken review, lost state, support, payment-link, refund, privacy, and accessibility reports.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "monitor_daily_review",
    label: "Daily owner review",
    minimumRequirement:
      "Owner reviews issue log and support inbox at least daily during the initial cohort.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "monitor_learning_loop_health",
    label: "Learning-loop health",
    minimumRequirement:
      "Owner samples participant reports for save-to-review success, review completion, weak-word returns, and Weekly Reviewed Words signals.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "monitor_pause_thresholds",
    label: "Pause thresholds",
    minimumRequirement:
      "Owner pauses invites/payment links if core review breaks, support cannot respond, or refund/privacy issues appear.",
    blocksPrivateBetaIfMissing: true
  }
] as const satisfies readonly PrivateBetaGateMonitoringItem[];

export const PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST = [
  {
    id: "support_contact",
    label: "Support contact",
    minimumCopyRequirement:
      "Invite and payment-link copy include a monitored support contact.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "refund_cancellation",
    label: "Refund and cancellation",
    minimumCopyRequirement:
      "Payment copy explains how to request a refund or cancel beta participation.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "privacy_local_learning_data",
    label: "Privacy copy",
    minimumCopyRequirement:
      "Participant copy explains local learning data, support messages, and external payment-link processor boundaries.",
    blocksPrivateBetaIfMissing: true
  },
  {
    id: "account_sync_limitation",
    label: "Account sync limitation",
    minimumCopyRequirement:
      "Copy explains that account sync is not implemented and review progress is tied to one browser profile.",
    blocksPrivateBetaIfMissing: true
  }
] as const satisfies readonly PrivateBetaGateSupportPrivacyItem[];

export const PRIVATE_BETA_GATE_ISSUE_REPORTING_PROCESS = [
  "Invite copy gives participants one support contact and asks them to include browser, route, word, and what they expected.",
  "Owner classifies reports as P0 learning-loop break, P1 support/payment/privacy/accessibility issue, or P2 polish.",
  "Owner responds to P0/P1 reports before adding more participants.",
  "Owner pauses invites and payment links when rollback criteria are met."
] as const;

export const PRIVATE_BETA_GATE_ROLLBACK_CRITERIA = [
  {
    id: "rollback_review_loop_broken",
    severity: "P0",
    trigger:
      "Save no longer creates or preserves review items, or review answers stop writing events and state.",
    ownerAction: "Pause invites and payment links; fix and rerun manual QA."
  },
  {
    id: "rollback_fake_progress_or_paid_access",
    severity: "P0",
    trigger:
      "Due, Weak, Mastered, pack progress, streaks, or paid access are fake or misleading.",
    ownerAction: "Pause beta, remove misleading copy, and rerun gate checks."
  },
  {
    id: "rollback_support_or_refund_unhandled",
    severity: "P1",
    trigger:
      "Support, refund, cancellation, or privacy requests cannot be answered within the owner-defined cadence.",
    ownerAction: "Pause new invites until operations recover."
  },
  {
    id: "rollback_accessibility_core_loop_unusable",
    severity: "P0",
    trigger:
      "Mobile or keyboard users cannot complete save or review in the core loop.",
    ownerAction: "Pause invites and fix usability before continuing."
  },
  {
    id: "rollback_public_exposure",
    severity: "P0",
    trigger:
      "Private beta surfaces become public signup, public paid beta, or self-serve paid access.",
    ownerAction:
      "Immediately pause public exposure and return to owner-invited private beta only."
  }
] as const satisfies readonly PrivateBetaGateRollbackCriterion[];

export const PRIVATE_BETA_GATE_ROLLBACK_PLAN = [
  "Pause new invites immediately.",
  "Pause or remove external payment links until the issue is resolved.",
  "Notify affected participants through the support contact.",
  "Record the issue, owner action, and retest evidence in the beta issue log.",
  "Rerun manual QA before reopening the cohort.",
  "Keep public paid beta No-Go until all public P0 gates are closed."
] as const;

export const PRIVATE_BETA_GATE_NEXT_PR_SEQUENCE = [
  {
    prNumber: 81,
    title: "Manual payment / entitlement policy",
    purpose:
      "Define manual payment, payment-link copy, refund/cancellation wording, and off-app entitlement ledger boundaries.",
    docsContractsTestsOnlyRecommended: true,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  },
  {
    prNumber: 82,
    title: "Account sync preview/digest mock",
    purpose:
      "Show the account-sync limitation and digest expectations without implementing sync, auth, routes, or database writes.",
    docsContractsTestsOnlyRecommended: true,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  },
  {
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    purpose:
      "Finalize owner support contact, privacy copy, issue reporting, manual monitoring, and pause thresholds.",
    docsContractsTestsOnlyRecommended: true,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  },
  {
    prNumber: 84,
    title: "Private beta readiness rerun",
    purpose:
      "Rerun manual QA and update evidence after #81-#83 without adding runtime integrations.",
    docsContractsTestsOnlyRecommended: true,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  },
  {
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    purpose:
      "Record final owner checklist, cohort roster readiness, launch pause criteria, and support coverage.",
    docsContractsTestsOnlyRecommended: true,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  }
] as const satisfies readonly PrivateBetaGateNextPr[];

export const PRIVATE_BETA_GATE_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  authIntegrationAllowed: false,
  databaseProviderAllowed: false,
  providerSdkAllowed: false,
  paymentBillingCheckoutAllowed: false,
  entitlementMutationAllowed: false,
  accountSyncAllowed: false,
  aiCallsAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  productionDataMutationAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  npmAuditFixAllowed: false
} as const satisfies PrivateBetaGateSafetyPolicy;

export const PRIVATE_BETA_GATE = {
  version: VISUAL_LEXICON_PRIVATE_BETA_GATE_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/private-beta-gate-prep",
  pullRequest: "#80 Private beta gate prep",
  scope: "Track B owner-controlled private beta gate",
  betaType: "owner-controlled private beta",
  privateBetaVerdict: PRIVATE_BETA_GATE_PRIVATE_VERDICT,
  publicBetaVerdict: PRIVATE_BETA_GATE_PUBLIC_VERDICT,
  currentVerdicts: {
    privatePaidBeta: PRIVATE_BETA_GATE_PRIVATE_VERDICT,
    publicPaidBeta: PRIVATE_BETA_GATE_PUBLIC_VERDICT
  },
  cohortCap: {
    recommendedInitialMin: 5,
    recommendedInitialMax: 20,
    hardCapBeforeReapproval: 20,
    recommendation: "5 to 20 users",
    ownerControlled: true,
    conservative: true
  },
  participantProfile: {
    allowed: [
      "Known learners personally invited by the owner.",
      "Participants who understand this is an early private beta with local learning-state limitations.",
      "Participants willing to report review, weak-word, support, payment-link, and accessibility issues.",
      "Participants who can use one browser profile for the initial learning loop."
    ],
    excluded: [
      "Public self-serve signups.",
      "Organizations or classrooms needing account sync, admin controls, invoices, or guaranteed data portability.",
      "Users who require production-grade payment receipts, subscriptions, or automatic entitlement.",
      "Users who require multi-device progress sync before joining.",
      "Users who should not rely on an owner-operated support/refund process."
    ]
  },
  manualInviteProcess: [
    "Owner selects participants from the allowed profile.",
    "Owner sends invite copy with support, privacy, refund/cancellation, account-sync, and local-state disclosures.",
    "Owner tracks acceptance and optional payment-link/manual payment state in an off-app roster.",
    "Owner confirms access manually and does not rely on app entitlement mutation.",
    "Owner stops at 20 users until the next approval checkpoint."
  ],
  policies: PRIVATE_BETA_GATE_POLICIES,
  launchAllowedConditions: PRIVATE_BETA_GATE_ALLOWED_CONDITIONS,
  launchBlockedConditions: PRIVATE_BETA_GATE_BLOCKED_CONDITIONS,
  publicBetaP0Blockers: PRIVATE_BETA_GATE_PUBLIC_P0_BLOCKERS,
  privateBetaP1Requirements: PRIVATE_BETA_GATE_P1_REQUIREMENTS,
  p2Polish: PRIVATE_BETA_GATE_P2_POLISH,
  ownerChecklist: PRIVATE_BETA_GATE_OWNER_CHECKLIST,
  manualQaEvidenceRequirements: PRIVATE_BETA_GATE_MANUAL_QA_EVIDENCE_REQUIREMENTS,
  monitoringChecklist: PRIVATE_BETA_GATE_MONITORING_CHECKLIST,
  supportRefundPrivacyChecklist:
    PRIVATE_BETA_GATE_SUPPORT_REFUND_PRIVACY_CHECKLIST,
  issueReportingProcess: PRIVATE_BETA_GATE_ISSUE_REPORTING_PROCESS,
  rollbackCriteria: PRIVATE_BETA_GATE_ROLLBACK_CRITERIA,
  rollbackPlan: PRIVATE_BETA_GATE_ROLLBACK_PLAN,
  ownerApprovalRequirement: {
    requiredBeforePrivateInvites: true,
    requiredBeforeAnyProductionFacingLaunch: true,
    requiredBeforePublicPaidBeta: true,
    summary:
      "Owner approval is mandatory before private invites and again before any production-facing launch or public paid beta."
  },
  nextPrivateBetaPrSequence: PRIVATE_BETA_GATE_NEXT_PR_SEQUENCE,
  safetyPolicy: PRIVATE_BETA_GATE_SAFETY_POLICY
} as const satisfies PrivateBetaGate;

export function getPrivateBetaGate() {
  return PRIVATE_BETA_GATE;
}

export function getPrivateBetaVerdict() {
  return PRIVATE_BETA_GATE.privateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return PRIVATE_BETA_GATE.publicBetaVerdict;
}

export function getPrivateBetaAllowedConditions() {
  return PRIVATE_BETA_GATE.launchAllowedConditions;
}

export function getPrivateBetaBlockedConditions() {
  return PRIVATE_BETA_GATE.launchBlockedConditions;
}

export function getPublicBetaP0Blockers() {
  return PRIVATE_BETA_GATE.publicBetaP0Blockers;
}

export function getOwnerChecklist() {
  return PRIVATE_BETA_GATE.ownerChecklist;
}

export function getRollbackCriteria() {
  return PRIVATE_BETA_GATE.rollbackCriteria;
}

export function getNextPrivateBetaPRSequence() {
  return PRIVATE_BETA_GATE.nextPrivateBetaPrSequence;
}

export function getPrivateBetaGatePolicy(id: PrivateBetaGatePolicyId | string) {
  return PRIVATE_BETA_GATE_POLICIES.find((policy) => policy.id === id);
}
