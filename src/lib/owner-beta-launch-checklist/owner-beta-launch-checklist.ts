export const VISUAL_LEXICON_OWNER_BETA_LAUNCH_CHECKLIST_VERSION = 1 as const;

export type OwnerBetaLaunchChecklistVersion =
  typeof VISUAL_LEXICON_OWNER_BETA_LAUNCH_CHECKLIST_VERSION;

export type OwnerBetaLaunchVerdict =
  | "Conditional / Manual-only"
  | "No-Go";

export type OwnerBetaLaunchSeverity = "P0" | "P1" | "P2";

export type OwnerBetaLaunchSourcePrNumber = 79 | 80 | 81 | 82 | 83 | 84;

export type OwnerBetaLaunchSourceGate = {
  prNumber: OwnerBetaLaunchSourcePrNumber;
  title: string;
  docPath: string;
  contractPath: string;
  requiredBeforeInvites: true;
  launchChecklistContribution: string;
};

export type OwnerBetaLaunchPrecondition = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  source: `#${OwnerBetaLaunchSourcePrNumber}` | "owner";
  requiredBeforeInvites: true;
  blocksLaunchIfMissing: true;
  ownerEvidenceRequired: string;
};

export type OwnerBetaNoLaunchCondition = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  launchBlocked: true;
  reason: string;
  requiredOwnerAction: string;
};

export type OwnerBetaChecklistItem = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  requiredBeforeInvites: true;
  ownerEvidenceRequired: string;
};

export type OwnerBetaInviteOnlyPolicy = {
  id: "owner_invite_only_manual_private_beta";
  label: string;
  publicSignupAllowed: false;
  publicCheckoutAllowed: false;
  selfServeInvitesAllowed: false;
  ownerSelectedParticipantsOnly: true;
  participantCap: "5 to 20";
  manualRosterRequired: true;
  ownerApprovalRequiredBeforeInvites: true;
  summary: string;
};

export type OwnerBetaParticipantCap = {
  minimum: 5;
  maximum: 20;
  hardCapBeforeReapproval: 20;
  recommendation: "5 to 20 manually selected participants";
  manualEnforcementRequired: true;
  publicWaitlistOrSignupAllowed: false;
};

export type OwnerBetaParticipantCommunicationType =
  | "private_beta_notice"
  | "invite_only_policy"
  | "local_state_account_sync"
  | "manual_payment"
  | "no_automatic_entitlement"
  | "support_contact"
  | "refund_cancellation"
  | "privacy"
  | "issue_reporting"
  | "pause_rollback";

export type OwnerBetaParticipantCommunicationItem = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  type: OwnerBetaParticipantCommunicationType;
  requiredBeforeInvites: true;
  requiredBeforePaymentRequest: boolean;
  copyRequirement: string;
  ownerEvidenceRequired: string;
};

export type OwnerBetaSmokeTestCategory =
  | "route_smoke"
  | "learning_loop"
  | "console_hydration"
  | "local_storage_probe"
  | "mobile_keyboard";

export type OwnerBetaSmokeTestItem = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  category: OwnerBetaSmokeTestCategory;
  requiredBeforeInvites: true;
  route?: string;
  ownerEvidenceRequired: string;
};

export type OwnerBetaLocalStorageProbeItem = {
  id: string;
  label: string;
  storageKey:
    | "vlx_saved_words_v1"
    | "vlx_review_state_v1"
    | "vlx_review_events_v1"
    | "vlx_daily_stats_v1";
  requiredBeforeInvites: true;
  recordKeyPresenceOnly: true;
  rawValueLoggingAllowed: false;
  ownerEvidenceRequired: string;
};

export type OwnerBetaIncidentRollbackItem = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  trigger: string;
  ownerAction: string;
  blocksNewInvites: true;
  blocksPaymentRequests: boolean;
};

export type OwnerBetaPostInviteMonitoringItem = {
  id: string;
  label: string;
  severity: OwnerBetaLaunchSeverity;
  cadence: "daily" | "first_24_hours" | "first_7_days" | "decision_checkpoint";
  requiredAfterInvites: true;
  ownerEvidenceRequired: string;
};

export type OwnerBetaContinuationDecisionItem = {
  id: string;
  label: string;
  decision: "continue" | "pause" | "stop";
  requiredBeforeExpandingCohort: true;
  decisionEvidenceRequired: string;
};

export type OwnerBetaNextPr = {
  prNumber: 86 | 87 | 88;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
};

export type OwnerBetaLaunchSafetyPolicy = {
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
  automaticEntitlementAllowed: false;
  accountSyncAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
  analyticsSdkAllowed: false;
  aiCallsAllowed: false;
  environmentVariableChangesAllowed: false;
  deploymentChangesAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  secretsTouchedAllowed: false;
  productionDataMutationAllowed: false;
  networkCallsAllowed: false;
  browserStorageMutationAllowed: false;
  npmAuditFixAllowed: false;
};

export type OwnerBetaLaunchChecklist = {
  version: OwnerBetaLaunchChecklistVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/owner-run-private-beta-launch-checklist";
  pullRequest: "#85 Owner-run private beta launch checklist";
  reportDateKst: "2026-06-16";
  scope: "Track B owner-run private beta launch checklist";
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  currentVerdicts: {
    ownerControlledPrivateBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
  };
  sourceGates: readonly OwnerBetaLaunchSourceGate[];
  participantCap: OwnerBetaParticipantCap;
  inviteOnlyPolicy: OwnerBetaInviteOnlyPolicy;
  launchPreconditions: readonly OwnerBetaLaunchPrecondition[];
  noLaunchConditions: readonly OwnerBetaNoLaunchCondition[];
  ownerFinalSignoffChecklist: readonly OwnerBetaChecklistItem[];
  participantSelectionChecklist: readonly OwnerBetaChecklistItem[];
  participantCommunicationChecklist: readonly OwnerBetaParticipantCommunicationItem[];
  smokeTestChecklist: readonly OwnerBetaSmokeTestItem[];
  localStorageProbeChecklist: readonly OwnerBetaLocalStorageProbeItem[];
  incidentRollbackChecklist: readonly OwnerBetaIncidentRollbackItem[];
  postInviteMonitoringChecklist: readonly OwnerBetaPostInviteMonitoringItem[];
  first24HourReviewChecklist: readonly OwnerBetaPostInviteMonitoringItem[];
  first7DayReviewChecklist: readonly OwnerBetaPostInviteMonitoringItem[];
  continuationStopDecisionChecklist: readonly OwnerBetaContinuationDecisionItem[];
  nextOwnerBetaPRSequence: readonly OwnerBetaNextPr[];
  safetyPolicy: OwnerBetaLaunchSafetyPolicy;
};

export const OWNER_BETA_LAUNCH_VERDICT =
  "Conditional / Manual-only" as const satisfies OwnerBetaLaunchVerdict;

export const PUBLIC_BETA_LAUNCH_VERDICT =
  "No-Go" as const satisfies OwnerBetaLaunchVerdict;

export const OWNER_BETA_LAUNCH_SOURCE_GATES = [
  {
    prNumber: 79,
    title: "Manual QA execution report",
    docPath: "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
    contractPath:
      "src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Baseline manual QA evidence for routes, save, review, storage, console, hydration, mobile, keyboard, packs, pricing, and paywall checks."
  },
  {
    prNumber: 80,
    title: "Private beta gate prep",
    docPath: "docs/PRIVATE_BETA_GATE_PREP.md",
    contractPath: "src/lib/private-beta-gate/private-beta-gate.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Owner-invited cohort cap, private/manual verdict, launch blockers, owner approval, and rollback boundaries."
  },
  {
    prNumber: 81,
    title: "Manual payment / entitlement policy",
    docPath: "docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md",
    contractPath:
      "src/lib/manual-payment-entitlement/manual-payment-entitlement.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Manual/payment-link-only boundary, manual entitlement record, no checkout, no automatic grant, refund, cancellation, support, and audit policy."
  },
  {
    prNumber: 82,
    title: "Account sync preview/digest mock",
    docPath: "docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md",
    contractPath:
      "src/lib/account-sync-preview-digest/account-sync-preview-digest.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Preview/digest-only account sync boundary and participant disclosure that learning state remains browser-local."
  },
  {
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    docPath: "docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md",
    contractPath: "src/lib/beta-ops-gate/beta-ops-gate.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Manual monitoring, support contact, privacy copy, refund/cancellation copy, incident log, console/hydration capture, and pause criteria."
  },
  {
    prNumber: 84,
    title: "Private beta readiness rerun",
    docPath: "docs/PRIVATE_BETA_READINESS_RERUN.md",
    contractPath:
      "src/lib/private-beta-readiness-rerun/private-beta-readiness-rerun.ts",
    requiredBeforeInvites: true,
    launchChecklistContribution:
      "Consolidated #79-#83 readiness verdict that keeps owner-controlled private beta Conditional / Manual-only and public paid beta No-Go."
  }
] as const satisfies readonly OwnerBetaLaunchSourceGate[];

export const OWNER_BETA_PARTICIPANT_CAP = {
  minimum: 5,
  maximum: 20,
  hardCapBeforeReapproval: 20,
  recommendation: "5 to 20 manually selected participants",
  manualEnforcementRequired: true,
  publicWaitlistOrSignupAllowed: false
} as const satisfies OwnerBetaParticipantCap;

export const OWNER_BETA_INVITE_ONLY_POLICY = {
  id: "owner_invite_only_manual_private_beta",
  label: "Owner invite-only manual private beta",
  publicSignupAllowed: false,
  publicCheckoutAllowed: false,
  selfServeInvitesAllowed: false,
  ownerSelectedParticipantsOnly: true,
  participantCap: "5 to 20",
  manualRosterRequired: true,
  ownerApprovalRequiredBeforeInvites: true,
  summary:
    "Only the owner may select and invite 5 to 20 participants from a manual roster. No public signup, public checkout, public invite form, self-serve payment, or automatic entitlement may be exposed."
} as const satisfies OwnerBetaInviteOnlyPolicy;

export const OWNER_BETA_LAUNCH_PRECONDITIONS = [
  {
    id: "precondition_pr79_manual_qa_report_exists",
    label: "#79 manual QA report exists.",
    severity: "P0",
    source: "#79",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md exists and remains the manual QA evidence baseline."
  },
  {
    id: "precondition_pr80_private_beta_gate_exists",
    label: "#80 private beta gate exists.",
    severity: "P0",
    source: "#80",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/PRIVATE_BETA_GATE_PREP.md exists and owner-controlled private beta remains Conditional / Manual-only."
  },
  {
    id: "precondition_pr81_manual_payment_policy_exists",
    label: "#81 manual payment/entitlement policy exists.",
    severity: "P0",
    source: "#81",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md exists before any payment request."
  },
  {
    id: "precondition_pr82_account_sync_mock_exists",
    label: "#82 account sync preview/digest mock exists.",
    severity: "P0",
    source: "#82",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md exists and does not claim real account sync."
  },
  {
    id: "precondition_pr83_monitoring_support_privacy_gate_exists",
    label: "#83 monitoring/support/privacy gate exists.",
    severity: "P0",
    source: "#83",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md exists with manual incident, support, refund, privacy, and pause criteria."
  },
  {
    id: "precondition_pr84_readiness_rerun_exists",
    label: "#84 readiness rerun exists.",
    severity: "P0",
    source: "#84",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Confirm docs/PRIVATE_BETA_READINESS_RERUN.md exists and public paid beta remains No-Go."
  },
  {
    id: "precondition_owner_reruns_smoke_checks",
    label: "Owner reruns smoke checks before sending invitations.",
    severity: "P0",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Record fresh route smoke, save/review state, local storage probes, console errors, and hydration warnings immediately before invites."
  },
  {
    id: "precondition_support_contact_ready",
    label: "Support contact is ready.",
    severity: "P1",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Invite, payment request, and support copy all name the same monitored support contact and response expectation."
  },
  {
    id: "precondition_refund_cancellation_copy_ready",
    label: "Refund/cancellation copy is ready before payment request.",
    severity: "P0",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Owner-approved payment request wording explains refund and cancellation handling before any payment link is sent."
  },
  {
    id: "precondition_privacy_local_state_copy_ready",
    label: "Privacy/local-state/account-sync limitation copy is ready.",
    severity: "P0",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Participant copy explains browser-local learning state, no real account sync, support message handling, and external payment boundaries."
  },
  {
    id: "precondition_participant_cap_enforced_manually",
    label: "Participant cap is enforced manually.",
    severity: "P0",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Manual roster contains 5 to 20 selected participants and stops at 20 until reapproval."
  },
  {
    id: "precondition_no_public_signup_or_checkout_exposed",
    label: "No public signup or public checkout is exposed.",
    severity: "P0",
    source: "owner",
    requiredBeforeInvites: true,
    blocksLaunchIfMissing: true,
    ownerEvidenceRequired:
      "Owner verifies no public signup, checkout, billing, subscription, invoice, payment SDK, or automatic entitlement path is live."
  }
] as const satisfies readonly OwnerBetaLaunchPrecondition[];

export const OWNER_BETA_NO_LAUNCH_CONDITIONS = [
  {
    id: "no_launch_public_checkout_active",
    label: "Public checkout is active.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Public checkout would convert this from manual owner-run beta into public paid beta, which remains No-Go.",
    requiredOwnerAction:
      "Remove or pause checkout exposure and return to manual/payment-link-only beta."
  },
  {
    id: "no_launch_automatic_entitlement_active",
    label: "Automatic entitlement is active.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Automatic entitlement is not approved and can grant paid access without owner review.",
    requiredOwnerAction:
      "Remove automatic access and use only an owner-controlled manual record."
  },
  {
    id: "no_launch_real_account_sync_assumed",
    label: "Real account sync is assumed but not implemented.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Participants cannot rely on account roaming, backup, restore, or server-backed learning state.",
    requiredOwnerAction:
      "Correct participant copy and invite only users who accept local-state limits."
  },
  {
    id: "no_launch_support_refund_privacy_copy_missing",
    label: "Support/refund/privacy copy is missing.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Participants need support contact, refund, cancellation, privacy, and local-state copy before joining or paying.",
    requiredOwnerAction:
      "Prepare and approve the participant-facing copy before any invite or payment request."
  },
  {
    id: "no_launch_monitoring_incident_log_missing",
    label: "Monitoring/incident log is missing.",
    severity: "P1",
    launchBlocked: true,
    reason:
      "Owner cannot safely triage broken review, lost state, support, payment, privacy, or refund reports without a manual log.",
    requiredOwnerAction:
      "Create the issue log template and owner review cadence before inviting users."
  },
  {
    id: "no_launch_route_smoke_fails",
    label: "Route smoke fails.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Participants must be able to reach dashboard, save, review, saved, packs, pricing, and core word routes.",
    requiredOwnerAction:
      "Fix the failing route and rerun smoke checks before invitations."
  },
  {
    id: "no_launch_console_hydration_errors_unresolved",
    label: "Console/hydration errors are unresolved.",
    severity: "P1",
    launchBlocked: true,
    reason:
      "Blocking console errors or hydration warnings can hide route, review-state, or UI breakage.",
    requiredOwnerAction:
      "Resolve or explicitly owner-accept nonblocking findings with evidence before inviting users."
  },
  {
    id: "no_launch_owner_not_approved",
    label: "Owner has not approved launch.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "The launch is owner-controlled and cannot proceed without explicit final owner signoff.",
    requiredOwnerAction:
      "Complete the final signoff checklist and record the owner decision."
  },
  {
    id: "no_launch_participant_communication_incomplete",
    label: "Participant communication is incomplete.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Invitees must understand manual beta status, local-state limits, no account sync, manual payment, no automatic entitlement, support, refund, cancellation, privacy, and issue reporting.",
    requiredOwnerAction:
      "Complete participant copy and acceptance evidence before inviting users."
  }
] as const satisfies readonly OwnerBetaNoLaunchCondition[];

export const OWNER_BETA_FINAL_SIGNOFF_CHECKLIST = [
  {
    id: "owner_signoff_approve_current_verdicts",
    label:
      "Approve Owner-controlled private beta as Conditional / Manual-only and public paid beta as No-Go.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner final signoff cites these verdicts and does not authorize public paid beta."
  },
  {
    id: "owner_signoff_confirm_preconditions_complete",
    label: "Confirm every launch precondition is complete.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner checklist marks all preconditions complete with evidence references."
  },
  {
    id: "owner_signoff_approve_roster_cap",
    label: "Approve the 5 to 20 participant roster.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Manual roster has selected participants, invite status, and cap count no higher than 20."
  },
  {
    id: "owner_signoff_approve_participant_copy",
    label: "Approve participant communication copy.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Invite packet includes support, refund/cancellation, privacy, local-state, manual payment, no automatic entitlement, and issue-reporting wording."
  },
  {
    id: "owner_signoff_approve_smoke_evidence",
    label: "Approve final smoke, console, hydration, and local-state evidence.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Fresh smoke run has no unresolved launch blockers and records local storage key presence only."
  },
  {
    id: "owner_signoff_accept_pause_rules",
    label: "Accept rollback and pause rules.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner agrees to pause invites and payment requests when P0/P1 criteria are met."
  },
  {
    id: "owner_signoff_confirm_no_forbidden_changes",
    label: "Confirm no forbidden integrations or production changes were introduced.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Code review confirms no runtime UI change, API route, route handler, middleware, auth, DB, payment, account sync, monitoring SDK, AI call, env change, deployment, secrets, or production data mutation."
  }
] as const satisfies readonly OwnerBetaChecklistItem[];

export const OWNER_BETA_PARTICIPANT_SELECTION_CHECKLIST = [
  {
    id: "selection_known_manual_participants",
    label: "Select only known participants manually chosen by the owner.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Roster source is owner-selected, not public signup, public checkout, or public invite form."
  },
  {
    id: "selection_cap_5_to_20",
    label: "Keep the cohort between 5 and 20 participants.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Roster count is at least 5 and no more than 20 before invitations are sent."
  },
  {
    id: "selection_accepts_local_state",
    label: "Invite participants who accept browser-local learning state.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Participants accept that saved words, review state, review events, and daily stats are tied to one browser profile."
  },
  {
    id: "selection_does_not_require_account_sync",
    label: "Exclude participants who require real account sync.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Roster notes exclude users who need cross-device progress, backup, restore, admin controls, or durable account state."
  },
  {
    id: "selection_can_report_issues",
    label: "Select participants willing to report review and support issues.",
    severity: "P1",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Invite acceptance includes issue-reporting instructions and support contact."
  }
] as const satisfies readonly OwnerBetaChecklistItem[];

export const OWNER_BETA_PARTICIPANT_COMMUNICATION_CHECKLIST = [
  {
    id: "communication_private_manual_beta_notice",
    label: "Private/manual beta notice.",
    severity: "P0",
    type: "private_beta_notice",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Tell participants this is an owner-run private beta, not a public paid beta.",
    ownerEvidenceRequired:
      "Invite copy says access is private, manual, and owner-controlled."
  },
  {
    id: "communication_invite_only_policy",
    label: "Invite-only policy.",
    severity: "P0",
    type: "invite_only_policy",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "State that there is no public signup, public checkout, public invite form, or self-serve paid access.",
    ownerEvidenceRequired:
      "Invite and payment copy both describe owner-selected access only."
  },
  {
    id: "communication_local_state_account_sync_limitation",
    label: "Local-state/account-sync limitation disclosure.",
    severity: "P0",
    type: "local_state_account_sync",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Explain that saved words, review state, review events, and daily stats stay in one browser profile and real account sync is not implemented.",
    ownerEvidenceRequired:
      "Participant copy includes the local-state and no-account-sync limitation before invite acceptance."
  },
  {
    id: "communication_manual_payment_payment_link_only",
    label: "Manual payment/payment-link-only disclosure.",
    severity: "P0",
    type: "manual_payment",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Explain that any beta payment is manual or payment-link-only and the app has no connected checkout.",
    ownerEvidenceRequired:
      "Payment request copy states no checkout, subscription, billing portal, invoice, or payment SDK is connected."
  },
  {
    id: "communication_no_automatic_entitlement",
    label: "No automatic entitlement disclosure.",
    severity: "P0",
    type: "no_automatic_entitlement",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Explain that payment or link clicks do not automatically grant app access; owner confirmation is required.",
    ownerEvidenceRequired:
      "Payment and invite copy say access is manually confirmed by the owner."
  },
  {
    id: "communication_support_contact",
    label: "Support contact checklist.",
    severity: "P0",
    type: "support_contact",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Give participants one monitored support contact and a response expectation for beta issues.",
    ownerEvidenceRequired:
      "Invite, payment request, and issue-reporting copy all use the same support contact."
  },
  {
    id: "communication_refund_cancellation",
    label: "Refund/cancellation wording checklist.",
    severity: "P0",
    type: "refund_cancellation",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Explain how to request a refund, cancellation, or pause of beta participation before any payment request.",
    ownerEvidenceRequired:
      "Owner-approved refund/cancellation wording is ready before payment links are sent."
  },
  {
    id: "communication_privacy_copy",
    label: "Privacy copy checklist.",
    severity: "P0",
    type: "privacy",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Explain local learning data, support messages, external payment boundaries, and that secrets/payment payloads are not collected by the app.",
    ownerEvidenceRequired:
      "Privacy copy is included in invite or pre-payment communication."
  },
  {
    id: "communication_issue_reporting",
    label: "Issue-reporting checklist.",
    severity: "P1",
    type: "issue_reporting",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: false,
    copyRequirement:
      "Tell participants how to report route, save, review, weak-word, local-state, payment, support, privacy, refund, cancellation, mobile, and keyboard issues.",
    ownerEvidenceRequired:
      "Invite copy asks for route, browser/device, reproduction steps, and screenshot/video when available."
  },
  {
    id: "communication_pause_rollback",
    label: "Pause/rollback notice.",
    severity: "P1",
    type: "pause_rollback",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    copyRequirement:
      "Tell participants the owner may pause invites, payment requests, or access while resolving private beta incidents.",
    ownerEvidenceRequired:
      "Invite copy includes owner pause criteria and participant notification expectations."
  }
] as const satisfies readonly OwnerBetaParticipantCommunicationItem[];

export const OWNER_BETA_SMOKE_TEST_CHECKLIST = [
  {
    id: "smoke_route_home",
    label: "Home route loads.",
    severity: "P1",
    category: "route_smoke",
    route: "/",
    requiredBeforeInvites: true,
    ownerEvidenceRequired: "Record pass/fail and visible blocking issues."
  },
  {
    id: "smoke_route_dashboard",
    label: "Dashboard route loads Today Memory Mission.",
    severity: "P0",
    category: "route_smoke",
    route: "/dashboard",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Dashboard loads and the memory mission reflects real local review state."
  },
  {
    id: "smoke_route_review",
    label: "Review route starts active recall.",
    severity: "P0",
    category: "learning_loop",
    route: "/review",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Review can answer at least one prompt and updates review events and memory state."
  },
  {
    id: "smoke_route_review_due",
    label: "Due review route loads from real due state.",
    severity: "P0",
    category: "learning_loop",
    route: "/review/due",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Due list derives from review state and does not fake mastery or progress."
  },
  {
    id: "smoke_route_review_weak",
    label: "Weak review route loads from real weak state.",
    severity: "P0",
    category: "learning_loop",
    route: "/review/weak",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Weak words derive from review state and repeated mistakes."
  },
  {
    id: "smoke_route_saved",
    label: "Saved route loads and supports review entry.",
    severity: "P0",
    category: "learning_loop",
    route: "/saved",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Saved words can move into review and preserve review state."
  },
  {
    id: "smoke_route_packs",
    label: "Packs routes load.",
    severity: "P1",
    category: "route_smoke",
    route: "/packs",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Packs and at least one pack detail route load without provider secrets."
  },
  {
    id: "smoke_route_word",
    label: "Word detail route loads.",
    severity: "P1",
    category: "route_smoke",
    route: "/word/dissonance",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Word detail shows memory state and can preserve a saved review item."
  },
  {
    id: "smoke_route_pricing_no_checkout",
    label: "Pricing route exposes no public checkout.",
    severity: "P0",
    category: "route_smoke",
    route: "/pricing",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Pricing has no checkout, subscription, billing portal, invoice, payment SDK, or automatic entitlement path."
  },
  {
    id: "smoke_console_hydration_counts",
    label: "Console/hydration error checklist.",
    severity: "P0",
    category: "console_hydration",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Record browser console error counts and hydration warning counts for every smoke route, including zero."
  },
  {
    id: "smoke_local_storage_probe",
    label: "localStorage probe checklist.",
    severity: "P0",
    category: "local_storage_probe",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Record only approved local storage key presence/counts after save and review. Do not paste raw values."
  },
  {
    id: "smoke_mobile_keyboard",
    label: "Mobile and keyboard smoke checklist.",
    severity: "P1",
    category: "mobile_keyboard",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Core save, review, pricing, saved, packs, and support copy are reachable on mobile and by keyboard."
  }
] as const satisfies readonly OwnerBetaSmokeTestItem[];

export const OWNER_BETA_LOCAL_STORAGE_PROBE_CHECKLIST = [
  {
    id: "probe_saved_words_key",
    label: "Saved words key presence.",
    storageKey: "vlx_saved_words_v1",
    requiredBeforeInvites: true,
    recordKeyPresenceOnly: true,
    rawValueLoggingAllowed: false,
    ownerEvidenceRequired:
      "After saving a word, record whether the approved key exists and the item count if needed."
  },
  {
    id: "probe_review_state_key",
    label: "Review state key presence.",
    storageKey: "vlx_review_state_v1",
    requiredBeforeInvites: true,
    recordKeyPresenceOnly: true,
    rawValueLoggingAllowed: false,
    ownerEvidenceRequired:
      "After save and review, record whether the approved review state key exists and includes the tested slug."
  },
  {
    id: "probe_review_events_key",
    label: "Review events key presence.",
    storageKey: "vlx_review_events_v1",
    requiredBeforeInvites: true,
    recordKeyPresenceOnly: true,
    rawValueLoggingAllowed: false,
    ownerEvidenceRequired:
      "After answering a review prompt, record that a review event was appended without pasting event payload values."
  },
  {
    id: "probe_daily_stats_key",
    label: "Daily stats key presence.",
    storageKey: "vlx_daily_stats_v1",
    requiredBeforeInvites: true,
    recordKeyPresenceOnly: true,
    rawValueLoggingAllowed: false,
    ownerEvidenceRequired:
      "After review completion, record whether daily stats update from real review activity."
  }
] as const satisfies readonly OwnerBetaLocalStorageProbeItem[];

export const OWNER_BETA_INCIDENT_ROLLBACK_CHECKLIST = [
  {
    id: "rollback_pause_review_loop_break",
    label: "Pause when save or review loop breaks.",
    severity: "P0",
    trigger:
      "Save stops creating or preserving review state, or review answers stop writing events and memory state.",
    ownerAction:
      "Pause invites and payment requests, record incident, fix locally, and rerun smoke before resuming.",
    blocksNewInvites: true,
    blocksPaymentRequests: true
  },
  {
    id: "rollback_pause_state_loss_pattern",
    label: "Pause on repeated local-state loss reports.",
    severity: "P0",
    trigger:
      "Multiple participants report lost saved words, review state, review events, or daily stats.",
    ownerAction:
      "Pause invites, inspect copy and affected routes, and update local-state guidance before resuming.",
    blocksNewInvites: true,
    blocksPaymentRequests: false
  },
  {
    id: "rollback_pause_console_hydration_blocker",
    label: "Pause on unresolved console/hydration blockers.",
    severity: "P1",
    trigger:
      "Required smoke routes fail or show blocking console errors or hydration warnings.",
    ownerAction:
      "Stop new invites until the route is fixed and fresh smoke evidence is recorded.",
    blocksNewInvites: true,
    blocksPaymentRequests: false
  },
  {
    id: "rollback_pause_support_refund_privacy_gap",
    label: "Pause on support, refund, cancellation, or privacy gaps.",
    severity: "P0",
    trigger:
      "Support contact is unavailable, refund/cancellation wording is missing, or privacy/local-state copy is unclear.",
    ownerAction:
      "Pause invites and payment requests, correct copy, and notify affected participants.",
    blocksNewInvites: true,
    blocksPaymentRequests: true
  },
  {
    id: "rollback_pause_public_exposure",
    label: "Pause immediately on public or self-serve exposure.",
    severity: "P0",
    trigger:
      "Public signup, public checkout, self-serve payment, automatic entitlement, real account sync, auth, API route, middleware, monitoring SDK, AI call, env change, deployment change, secret exposure, or production data mutation appears.",
    ownerAction:
      "Remove the exposure from this PR, stop invitations, and return to owner-controlled manual private beta only.",
    blocksNewInvites: true,
    blocksPaymentRequests: true
  },
  {
    id: "rollback_rerun_smoke_before_resume",
    label: "Rerun smoke checks before resuming.",
    severity: "P0",
    trigger: "Any P0 or P1 pause condition was fixed.",
    ownerAction:
      "Record a fresh route, console, hydration, local-state, and SRS smoke rerun before resuming invites.",
    blocksNewInvites: true,
    blocksPaymentRequests: true
  }
] as const satisfies readonly OwnerBetaIncidentRollbackItem[];

export const OWNER_BETA_POST_INVITE_MONITORING_CHECKLIST = [
  {
    id: "monitor_daily_support_and_issue_log",
    label: "Review support and issue log daily.",
    severity: "P1",
    cadence: "daily",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Owner reviews participant reports, support messages, and incident status at least daily."
  },
  {
    id: "monitor_weekly_reviewed_words_signal",
    label: "Monitor Weekly Reviewed Words signal manually.",
    severity: "P1",
    cadence: "daily",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Owner looks for evidence that participants save words and return to review, without inventing dashboard metrics."
  },
  {
    id: "monitor_payment_support_privacy_reports",
    label: "Monitor payment, support, refund, cancellation, and privacy reports.",
    severity: "P0",
    cadence: "daily",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Owner checks whether any participant reports confusion or disputes about manual payment, entitlement, support, privacy, or local-state limits."
  }
] as const satisfies readonly OwnerBetaPostInviteMonitoringItem[];

export const OWNER_BETA_FIRST_24_HOUR_REVIEW_CHECKLIST = [
  {
    id: "first_24_review_invite_delivery",
    label: "First 24-hour review: invite delivery and acceptance.",
    severity: "P1",
    cadence: "first_24_hours",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Record how many selected participants received, accepted, or asked clarifying questions about the invite."
  },
  {
    id: "first_24_review_blocking_issues",
    label: "First 24-hour review: blocking issue scan.",
    severity: "P0",
    cadence: "first_24_hours",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Check support and issue log for broken review, state loss, payment, refund, privacy, support, console, hydration, mobile, or keyboard blockers."
  },
  {
    id: "first_24_review_pause_decision",
    label: "First 24-hour review: pause decision.",
    severity: "P0",
    cadence: "first_24_hours",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Record continue or pause decision before inviting additional participants."
  }
] as const satisfies readonly OwnerBetaPostInviteMonitoringItem[];

export const OWNER_BETA_FIRST_7_DAY_REVIEW_CHECKLIST = [
  {
    id: "first_7_day_review_learning_loop",
    label: "First 7-day review: learning-loop signal.",
    severity: "P0",
    cadence: "first_7_days",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Review whether participants saved words, completed review sessions, revisited weak words, and reported useful recall behavior."
  },
  {
    id: "first_7_day_review_operational_load",
    label: "First 7-day review: operational load.",
    severity: "P1",
    cadence: "first_7_days",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Review support volume, issue severity, response timing, refund/cancellation requests, and privacy questions."
  },
  {
    id: "first_7_day_review_cap_and_next_step",
    label: "First 7-day review: cap and next step.",
    severity: "P0",
    cadence: "first_7_days",
    requiredAfterInvites: true,
    ownerEvidenceRequired:
      "Decide whether to continue within the 20 participant cap, pause, or stop beta."
  }
] as const satisfies readonly OwnerBetaPostInviteMonitoringItem[];

export const OWNER_BETA_CONTINUATION_STOP_DECISION_CHECKLIST = [
  {
    id: "decision_continue_private_beta",
    label: "Continue private beta within cap.",
    decision: "continue",
    requiredBeforeExpandingCohort: true,
    decisionEvidenceRequired:
      "No P0 blockers remain, support is manageable, review loop is working, local-state copy is accepted, and cohort stays at or below 20."
  },
  {
    id: "decision_pause_private_beta",
    label: "Pause private beta.",
    decision: "pause",
    requiredBeforeExpandingCohort: true,
    decisionEvidenceRequired:
      "Any P0/P1 launch blocker needs correction, but owner expects to resume after fix and smoke rerun."
  },
  {
    id: "decision_stop_private_beta",
    label: "Stop private beta.",
    decision: "stop",
    requiredBeforeExpandingCohort: true,
    decisionEvidenceRequired:
      "Core review, local-state, support, payment, refund, privacy, or safety issues make the beta unsuitable to continue."
  }
] as const satisfies readonly OwnerBetaContinuationDecisionItem[];

export const OWNER_BETA_NEXT_PR_SEQUENCE = [
  {
    prNumber: 86,
    title: "Private beta invite packet / participant instructions",
    purpose:
      "Create participant-facing invite, local-state, manual payment, no automatic entitlement, support, refund/cancellation, privacy, issue-reporting, and pause wording.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false
  },
  {
    prNumber: 87,
    title: "Private beta issue log template",
    purpose:
      "Create the owner-run incident log template for route, severity, reproduction, device, redacted local-state keys, owner decision, status, and rollback tracking.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false
  },
  {
    prNumber: 88,
    title: "Private beta final owner signoff",
    purpose:
      "Record final owner approval after checklist, invite packet, issue log, participant roster, and smoke evidence are complete.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false
  }
] as const satisfies readonly OwnerBetaNextPr[];

export const OWNER_BETA_LAUNCH_SAFETY_POLICY = {
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
  automaticEntitlementAllowed: false,
  accountSyncAllowed: false,
  realAccountSyncAllowed: false,
  monitoringSdkAllowed: false,
  analyticsSdkAllowed: false,
  aiCallsAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  secretsTouchedAllowed: false,
  productionDataMutationAllowed: false,
  networkCallsAllowed: false,
  browserStorageMutationAllowed: false,
  npmAuditFixAllowed: false
} as const satisfies OwnerBetaLaunchSafetyPolicy;

export const OWNER_BETA_LAUNCH_CHECKLIST = {
  version: VISUAL_LEXICON_OWNER_BETA_LAUNCH_CHECKLIST_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/owner-run-private-beta-launch-checklist",
  pullRequest: "#85 Owner-run private beta launch checklist",
  reportDateKst: "2026-06-16",
  scope: "Track B owner-run private beta launch checklist",
  ownerControlledPrivateBetaVerdict: OWNER_BETA_LAUNCH_VERDICT,
  publicPaidBetaVerdict: PUBLIC_BETA_LAUNCH_VERDICT,
  currentVerdicts: {
    ownerControlledPrivateBeta: OWNER_BETA_LAUNCH_VERDICT,
    publicPaidBeta: PUBLIC_BETA_LAUNCH_VERDICT
  },
  sourceGates: OWNER_BETA_LAUNCH_SOURCE_GATES,
  participantCap: OWNER_BETA_PARTICIPANT_CAP,
  inviteOnlyPolicy: OWNER_BETA_INVITE_ONLY_POLICY,
  launchPreconditions: OWNER_BETA_LAUNCH_PRECONDITIONS,
  noLaunchConditions: OWNER_BETA_NO_LAUNCH_CONDITIONS,
  ownerFinalSignoffChecklist: OWNER_BETA_FINAL_SIGNOFF_CHECKLIST,
  participantSelectionChecklist: OWNER_BETA_PARTICIPANT_SELECTION_CHECKLIST,
  participantCommunicationChecklist:
    OWNER_BETA_PARTICIPANT_COMMUNICATION_CHECKLIST,
  smokeTestChecklist: OWNER_BETA_SMOKE_TEST_CHECKLIST,
  localStorageProbeChecklist: OWNER_BETA_LOCAL_STORAGE_PROBE_CHECKLIST,
  incidentRollbackChecklist: OWNER_BETA_INCIDENT_ROLLBACK_CHECKLIST,
  postInviteMonitoringChecklist: OWNER_BETA_POST_INVITE_MONITORING_CHECKLIST,
  first24HourReviewChecklist: OWNER_BETA_FIRST_24_HOUR_REVIEW_CHECKLIST,
  first7DayReviewChecklist: OWNER_BETA_FIRST_7_DAY_REVIEW_CHECKLIST,
  continuationStopDecisionChecklist:
    OWNER_BETA_CONTINUATION_STOP_DECISION_CHECKLIST,
  nextOwnerBetaPRSequence: OWNER_BETA_NEXT_PR_SEQUENCE,
  safetyPolicy: OWNER_BETA_LAUNCH_SAFETY_POLICY
} as const satisfies OwnerBetaLaunchChecklist;

export function getOwnerBetaLaunchChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST;
}

export function getOwnerBetaLaunchVerdict() {
  return OWNER_BETA_LAUNCH_CHECKLIST.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return OWNER_BETA_LAUNCH_CHECKLIST.publicPaidBetaVerdict;
}

export function getLaunchPreconditions() {
  return OWNER_BETA_LAUNCH_CHECKLIST.launchPreconditions;
}

export function getNoLaunchConditions() {
  return OWNER_BETA_LAUNCH_CHECKLIST.noLaunchConditions;
}

export function getOwnerFinalSignoffChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.ownerFinalSignoffChecklist;
}

export function getParticipantCommunicationChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.participantCommunicationChecklist;
}

export function getSmokeTestChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.smokeTestChecklist;
}

export function getIncidentRollbackChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.incidentRollbackChecklist;
}

export function getPostInviteMonitoringChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.postInviteMonitoringChecklist;
}

export function getNextOwnerBetaPRSequence() {
  return OWNER_BETA_LAUNCH_CHECKLIST.nextOwnerBetaPRSequence;
}

export function getParticipantSelectionChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.participantSelectionChecklist;
}

export function getLocalStorageProbeChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.localStorageProbeChecklist;
}

export function getFirst24HourReviewChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.first24HourReviewChecklist;
}

export function getFirst7DayReviewChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.first7DayReviewChecklist;
}

export function getContinuationStopDecisionChecklist() {
  return OWNER_BETA_LAUNCH_CHECKLIST.continuationStopDecisionChecklist;
}
