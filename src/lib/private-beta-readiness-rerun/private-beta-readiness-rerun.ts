export const VISUAL_LEXICON_PRIVATE_BETA_READINESS_RERUN_VERSION = 1 as const;

export type PrivateBetaReadinessRerunVersion =
  typeof VISUAL_LEXICON_PRIVATE_BETA_READINESS_RERUN_VERSION;

export type PrivateBetaReadinessRerunVerdict =
  | "Conditional / Manual-only"
  | "No-Go";

export type PrivateBetaReadinessRerunBlockedVerdict =
  | "Blocked"
  | "Blocked in current phase";

export type PrivateBetaReadinessRerunAllowedVerdict =
  "Allowed only if checklist is complete";

export type PrivateBetaReadinessRerunSeverity = "P0" | "P1" | "P2";

export type PrivateBetaReadinessRerunSourcePrNumber =
  | 79
  | 80
  | 81
  | 82
  | 83;

export type PrivateBetaReadinessRerunSourcePr = {
  prNumber: PrivateBetaReadinessRerunSourcePrNumber;
  title: string;
  docPath: string;
  contractPath: string;
  contribution: string;
  privateBetaImpact: string;
  publicBetaImpact: string;
};

export type PrivateBetaReadinessDelta = {
  id: string;
  sourcePr: `#${PrivateBetaReadinessRerunSourcePrNumber}`;
  area:
    | "manual_qa"
    | "private_gate"
    | "manual_payment_entitlement"
    | "account_sync_preview"
    | "monitoring_support_privacy";
  deltaSincePr79: string;
  ownerPrivateBetaEffect: "adds_required_evidence" | "clarifies_condition";
  publicBetaEffect: "keeps_no_go";
};

export type PrivateBetaReadinessGateStatus =
  | "ready_if_checklist_complete"
  | "conditional_manual_only"
  | "blocked"
  | "blocked_current_phase"
  | "no_go";

export type PrivateBetaReadinessGateMatrixRow = {
  id: string;
  sourcePr: `#${PrivateBetaReadinessRerunSourcePrNumber}`;
  gate: string;
  ownerControlledPrivateBetaStatus: PrivateBetaReadinessGateStatus;
  publicPaidBetaStatus: PrivateBetaReadinessGateStatus;
  evidenceRequired: string;
  ownerDecision: string;
};

export type PrivateBetaReadinessCondition = {
  id: string;
  label: string;
  severity: PrivateBetaReadinessRerunSeverity;
  requiredBeforeInvites: true;
  evidenceRequired: string;
};

export type PrivateBetaReadinessBlocker = {
  id: string;
  label: string;
  severity: PrivateBetaReadinessRerunSeverity;
  blocksOwnerControlledPrivateBeta: boolean;
  blocksPublicPaidBeta: boolean;
  ownerCanAcceptForManualPrivateBeta: boolean;
  requiredAction: string;
};

export type PrivateBetaReadinessChecklistItem = {
  id: string;
  label: string;
  requiredBeforeInvites: true;
  evidenceRequired: string;
};

export type PrivateBetaReadinessPublicBlocker = {
  id: string;
  label: string;
  severity: "P0";
  reasonPublicPaidBetaNoGo: string;
  ownerControlledPrivateBetaCanProceedManually: boolean;
};

export type PrivateBetaReadinessP1Requirement = {
  id: string;
  label: string;
  evidenceRequired: string;
  blocksPublicPaidBeta: true;
};

export type PrivateBetaReadinessP2Polish = {
  id: string;
  label: string;
  deferUntil: string;
};

export type PrivateBetaReadinessDecisionTableRow = {
  id: string;
  scenario: string;
  decision:
    | "launch_owner_private_beta"
    | "do_not_launch"
    | "pause_or_rollback";
  verdict:
    | PrivateBetaReadinessRerunVerdict
    | PrivateBetaReadinessRerunAllowedVerdict;
  rationale: string;
};

export type PrivateBetaReadinessNextPr = {
  prNumber: 85 | 86 | 87 | 88;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
};

export type PrivateBetaReadinessSafetyPolicy = {
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

export type PrivateBetaReadinessRerun = {
  version: PrivateBetaReadinessRerunVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/private-beta-readiness-rerun";
  pullRequest: "#84 Private beta readiness rerun";
  reportDateKst: "2026-06-16";
  scope: "Track B private beta readiness rerun after PRs #79-#83";
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  requiredVerdicts: {
    ownerControlledPrivateBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
    realCheckout: "Blocked";
    automaticEntitlement: "Blocked";
    realAccountSync: "Blocked";
    monitoringSdkIntegration: "Blocked in current phase";
    ownerRunInviteOnlyBeta: "Allowed only if checklist is complete";
  };
  consolidatedSourcePrs: readonly PrivateBetaReadinessRerunSourcePr[];
  readinessDeltaSincePr79: readonly PrivateBetaReadinessDelta[];
  gateMatrix: readonly PrivateBetaReadinessGateMatrixRow[];
  privateBetaAllowedConditions: readonly PrivateBetaReadinessCondition[];
  privateBetaBlockedConditions: readonly PrivateBetaReadinessBlocker[];
  publicBetaP0Blockers: readonly PrivateBetaReadinessPublicBlocker[];
  remainingP1Requirements: readonly PrivateBetaReadinessP1Requirement[];
  p2Polish: readonly PrivateBetaReadinessP2Polish[];
  ownerApprovalChecklist: readonly PrivateBetaReadinessChecklistItem[];
  manualQaEvidenceChecklist: readonly PrivateBetaReadinessChecklistItem[];
  paymentEntitlementChecklist: readonly PrivateBetaReadinessChecklistItem[];
  accountSyncLimitationChecklist: readonly PrivateBetaReadinessChecklistItem[];
  monitoringSupportPrivacyChecklist: readonly PrivateBetaReadinessChecklistItem[];
  incidentRollbackChecklist: readonly PrivateBetaReadinessChecklistItem[];
  launchDecisionTable: readonly PrivateBetaReadinessDecisionTableRow[];
  nextPrivateBetaReadinessPrSequence: readonly PrivateBetaReadinessNextPr[];
  safetyPolicy: PrivateBetaReadinessSafetyPolicy;
};

export const PRIVATE_BETA_READINESS_RERUN_OWNER_PRIVATE_VERDICT =
  "Conditional / Manual-only" as const satisfies PrivateBetaReadinessRerunVerdict;

export const PRIVATE_BETA_READINESS_RERUN_PUBLIC_VERDICT =
  "No-Go" as const satisfies PrivateBetaReadinessRerunVerdict;

export const PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS = {
  ownerControlledPrivateBeta: PRIVATE_BETA_READINESS_RERUN_OWNER_PRIVATE_VERDICT,
  publicPaidBeta: PRIVATE_BETA_READINESS_RERUN_PUBLIC_VERDICT,
  realCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  monitoringSdkIntegration: "Blocked in current phase",
  ownerRunInviteOnlyBeta: "Allowed only if checklist is complete"
} as const satisfies PrivateBetaReadinessRerun["requiredVerdicts"];

export const PRIVATE_BETA_READINESS_RERUN_SOURCE_PRS = [
  {
    prNumber: 79,
    title: "Manual QA execution report",
    docPath: "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
    contractPath:
      "src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution.ts",
    contribution:
      "Recorded local route, storage, console, hydration, mobile, keyboard, and paywall evidence for the Track B paid beta candidate.",
    privateBetaImpact:
      "Established Conditional / Manual-only as the private paid beta baseline.",
    publicBetaImpact:
      "Kept public paid beta No-Go because payment, account sync, monitoring, accessibility, and final support/privacy gates were incomplete."
  },
  {
    prNumber: 80,
    title: "Private beta gate prep",
    docPath: "docs/PRIVATE_BETA_GATE_PREP.md",
    contractPath: "src/lib/private-beta-gate/private-beta-gate.ts",
    contribution:
      "Defined owner-invited cohort limits, allowed conditions, blocked conditions, owner checklist, manual QA evidence, and rollback criteria.",
    privateBetaImpact:
      "Allowed only an owner-controlled 5 to 20 user private beta with completed checklist evidence.",
    publicBetaImpact:
      "Kept public paid beta No-Go until public P0 launch gates are closed."
  },
  {
    prNumber: 81,
    title: "Manual payment / entitlement policy",
    docPath: "docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md",
    contractPath:
      "src/lib/manual-payment-entitlement/manual-payment-entitlement.ts",
    contribution:
      "Defined payment-link-only/manual payment evidence, owner approval, refund/cancellation, support, revocation, and audit boundaries.",
    privateBetaImpact:
      "Permits manual payment only when owner approval and off-app entitlement records are complete.",
    publicBetaImpact:
      "Blocks public paid beta because no real checkout, subscription, billing portal, or automatic entitlement exists."
  },
  {
    prNumber: 82,
    title: "Account sync preview/digest mock",
    docPath: "docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md",
    contractPath:
      "src/lib/account-sync-preview-digest/account-sync-preview-digest.ts",
    contribution:
      "Defined preview and redacted digest contracts for local learning state without applying real sync or account writes.",
    privateBetaImpact:
      "Requires participant disclosure that learning state remains local and account sync is not implemented.",
    publicBetaImpact:
      "Blocks public paid beta because durable account sync, auth ownership, and server-backed learning state are missing."
  },
  {
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    docPath: "docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md",
    contractPath: "src/lib/beta-ops-gate/beta-ops-gate.ts",
    contribution:
      "Defined manual monitoring, route smoke, console/hydration capture, incident log, support, refund, cancellation, privacy, consent, and pause criteria.",
    privateBetaImpact:
      "Allows owner-run manual beta operations only when support, privacy, incident, and smoke checklists are complete.",
    publicBetaImpact:
      "Blocks public paid beta because production monitoring and alerting are not integrated."
  }
] as const satisfies readonly PrivateBetaReadinessRerunSourcePr[];

export const PRIVATE_BETA_READINESS_RERUN_DELTA = [
  {
    id: "delta_pr79_manual_qa_baseline",
    sourcePr: "#79",
    area: "manual_qa",
    deltaSincePr79:
      "Manual QA evidence remains the baseline, but later PRs added stricter owner, payment, account sync, and operations gates around it.",
    ownerPrivateBetaEffect: "adds_required_evidence",
    publicBetaEffect: "keeps_no_go"
  },
  {
    id: "delta_pr80_owner_gate",
    sourcePr: "#80",
    area: "private_gate",
    deltaSincePr79:
      "Private beta became explicitly owner-invited, capped at 5 to 20 users, and blocked by missing owner checklist evidence.",
    ownerPrivateBetaEffect: "clarifies_condition",
    publicBetaEffect: "keeps_no_go"
  },
  {
    id: "delta_pr81_manual_payment",
    sourcePr: "#81",
    area: "manual_payment_entitlement",
    deltaSincePr79:
      "Payment readiness is now manual/payment-link-only with no checkout, subscription, SDK, or automatic entitlement.",
    ownerPrivateBetaEffect: "clarifies_condition",
    publicBetaEffect: "keeps_no_go"
  },
  {
    id: "delta_pr82_account_sync_preview",
    sourcePr: "#82",
    area: "account_sync_preview",
    deltaSincePr79:
      "Account sync remains blocked; only a preview/digest mock exists, so participants must accept browser-local learning state.",
    ownerPrivateBetaEffect: "adds_required_evidence",
    publicBetaEffect: "keeps_no_go"
  },
  {
    id: "delta_pr83_manual_ops",
    sourcePr: "#83",
    area: "monitoring_support_privacy",
    deltaSincePr79:
      "Manual operations are now required before invites: smoke rerun, support contact, incident log, refund/cancellation copy, privacy copy, and pause criteria.",
    ownerPrivateBetaEffect: "adds_required_evidence",
    publicBetaEffect: "keeps_no_go"
  }
] as const satisfies readonly PrivateBetaReadinessDelta[];

export const PRIVATE_BETA_READINESS_RERUN_GATE_MATRIX = [
  {
    id: "gate_pr79_manual_qa",
    sourcePr: "#79",
    gate: "Manual QA evidence",
    ownerControlledPrivateBetaStatus: "conditional_manual_only",
    publicPaidBetaStatus: "no_go",
    evidenceRequired:
      "Fresh owner smoke rerun plus route, storage, console, hydration, mobile, keyboard, save, review, weak, packs, and pricing notes.",
    ownerDecision:
      "Rerun smoke checks before invites; stale or missing evidence blocks private beta."
  },
  {
    id: "gate_pr80_owner_private_gate",
    sourcePr: "#80",
    gate: "Owner-controlled private gate",
    ownerControlledPrivateBetaStatus: "ready_if_checklist_complete",
    publicPaidBetaStatus: "no_go",
    evidenceRequired:
      "Owner-approved 5 to 20 user roster, no public signup, owner approval, and rollback criteria.",
    ownerDecision:
      "Proceed only as invite-only manual beta; stop if public access appears."
  },
  {
    id: "gate_pr81_manual_payment_entitlement",
    sourcePr: "#81",
    gate: "Manual payment and entitlement",
    ownerControlledPrivateBetaStatus: "conditional_manual_only",
    publicPaidBetaStatus: "blocked",
    evidenceRequired:
      "Manual/payment-link evidence, owner approval, off-app entitlement record, refund/cancellation wording, and no app entitlement mutation.",
    ownerDecision:
      "Accept payment only manually; real checkout and automatic entitlement remain blocked."
  },
  {
    id: "gate_pr82_account_sync_preview",
    sourcePr: "#82",
    gate: "Account sync limitation",
    ownerControlledPrivateBetaStatus: "conditional_manual_only",
    publicPaidBetaStatus: "blocked",
    evidenceRequired:
      "Participant copy accepts browser-local state, no roaming progress, preview/digest only, and no apply/write operation.",
    ownerDecision:
      "Invite only users who accept local-state and no-account-sync limitations."
  },
  {
    id: "gate_pr83_monitoring_support_privacy",
    sourcePr: "#83",
    gate: "Monitoring, support, privacy operations",
    ownerControlledPrivateBetaStatus: "ready_if_checklist_complete",
    publicPaidBetaStatus: "blocked_current_phase",
    evidenceRequired:
      "Manual monitoring owner, incident log, support contact, privacy copy, refund/cancellation copy, console/hydration capture, and pause thresholds.",
    ownerDecision:
      "Run owner operations manually; monitoring SDK integration is blocked in current phase."
  }
] as const satisfies readonly PrivateBetaReadinessGateMatrixRow[];

export const PRIVATE_BETA_READINESS_RERUN_ALLOWED_CONDITIONS = [
  {
    id: "owner_invites_5_to_20_users_manually",
    label: "Owner invites 5 to 20 users manually.",
    severity: "P0",
    requiredBeforeInvites: true,
    evidenceRequired: "Owner-approved roster with invite dates and no public signup path."
  },
  {
    id: "payment_manual_or_payment_link_only",
    label: "Payment is manual/payment-link-only.",
    severity: "P0",
    requiredBeforeInvites: true,
    evidenceRequired: "Payment copy says the app has no connected checkout."
  },
  {
    id: "entitlement_manual_not_automatic",
    label: "Entitlement is manual and not automatic.",
    severity: "P0",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner uses an off-app record and no app code grants paid access."
  },
  {
    id: "users_accept_local_state_account_sync_limit",
    label: "Users accept local-state/account-sync limitation.",
    severity: "P1",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Invite copy says progress is local to one browser profile and account sync is not implemented."
  },
  {
    id: "support_contact_ready",
    label: "Support contact is ready.",
    severity: "P1",
    requiredBeforeInvites: true,
    evidenceRequired: "Invite, payment, and support copy include a monitored contact."
  },
  {
    id: "refund_cancellation_wording_ready",
    label: "Refund/cancellation wording is ready.",
    severity: "P1",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Payment or invite copy explains refund and cancellation handling."
  },
  {
    id: "manual_monitoring_and_incident_log_ready",
    label: "Manual monitoring and incident log are ready.",
    severity: "P1",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Issue log template, owner review cadence, and pause thresholds exist."
  },
  {
    id: "owner_reruns_smoke_checks",
    label: "Owner reruns smoke checks before inviting users.",
    severity: "P0",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Fresh route smoke notes include console error and hydration warning counts."
  },
  {
    id: "no_public_signup_or_checkout",
    label: "No public signup or public checkout exists.",
    severity: "P0",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Code and route review confirm no public signup, checkout, billing, subscription, invoice, or payment SDK path."
  }
] as const satisfies readonly PrivateBetaReadinessCondition[];

export const PRIVATE_BETA_READINESS_RERUN_BLOCKED_CONDITIONS = [
  {
    id: "manual_qa_missing_or_stale",
    label: "Manual QA evidence is missing or stale.",
    severity: "P0",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Rerun owner smoke and record evidence before invites."
  },
  {
    id: "public_signup_or_public_checkout_exists",
    label: "Public signup, public checkout, billing, subscription, or self-serve paid access exists.",
    severity: "P0",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Remove public/self-serve access and keep beta owner-invited."
  },
  {
    id: "automatic_entitlement_exists",
    label: "Automatic entitlement or app entitlement mutation exists.",
    severity: "P0",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Remove automatic access and return to owner manual records."
  },
  {
    id: "account_sync_limitation_not_accepted",
    label: "Participant copy does not disclose or accept local-state/account-sync limits.",
    severity: "P1",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Update invite and support copy before inviting users."
  },
  {
    id: "support_refund_privacy_not_ready",
    label: "Support, refund/cancellation, or privacy copy is not ready.",
    severity: "P1",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Prepare owner-approved participant copy before invites."
  },
  {
    id: "manual_monitoring_or_incident_log_missing",
    label: "Manual monitoring or incident log is missing.",
    severity: "P1",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Create incident log and owner review cadence before invites."
  },
  {
    id: "owner_approval_missing",
    label: "Owner approval is missing.",
    severity: "P0",
    blocksOwnerControlledPrivateBeta: true,
    blocksPublicPaidBeta: true,
    ownerCanAcceptForManualPrivateBeta: false,
    requiredAction: "Record owner signoff before any invite or payment request."
  }
] as const satisfies readonly PrivateBetaReadinessBlocker[];

export const PRIVATE_BETA_READINESS_RERUN_PUBLIC_P0_BLOCKERS = [
  {
    id: "p0_no_real_payment_integration",
    label: "No real payment integration.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "The app has no checkout, subscription, invoice, billing portal, or payment SDK.",
    ownerControlledPrivateBetaCanProceedManually: true
  },
  {
    id: "p0_no_real_account_sync",
    label: "No real account sync.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "Learning state remains browser-local and does not roam across accounts or devices.",
    ownerControlledPrivateBetaCanProceedManually: true
  },
  {
    id: "p0_no_automated_entitlement",
    label: "No automated entitlement.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "Paid access cannot be granted automatically from payment or local state.",
    ownerControlledPrivateBetaCanProceedManually: true
  },
  {
    id: "p0_no_production_monitoring_alerting",
    label: "No production monitoring/alerting.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "Monitoring is manual-only and no monitoring SDK or production alert response exists.",
    ownerControlledPrivateBetaCanProceedManually: true
  },
  {
    id: "p0_full_accessibility_audit_not_complete",
    label: "Full accessibility audit is not complete.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "Keyboard, focus, mobile, contrast, and assistive technology evidence is not complete for public launch.",
    ownerControlledPrivateBetaCanProceedManually: true
  },
  {
    id: "p0_privacy_support_refund_final_gate_not_complete",
    label: "Privacy/support/refund final production gate is not complete.",
    severity: "P0",
    reasonPublicPaidBetaNoGo:
      "Production-ready privacy, support coverage, refund, cancellation, and incident response are not finalized.",
    ownerControlledPrivateBetaCanProceedManually: true
  }
] as const satisfies readonly PrivateBetaReadinessPublicBlocker[];

export const PRIVATE_BETA_READINESS_RERUN_P1_REQUIREMENTS = [
  {
    id: "p1_owner_invite_packet",
    label: "Owner invite packet and participant instructions.",
    evidenceRequired:
      "Invite copy explains private/manual beta, support, local state, account sync limits, refund/cancellation, and issue reporting.",
    blocksPublicPaidBeta: true
  },
  {
    id: "p1_issue_log_template",
    label: "Private beta issue log template.",
    evidenceRequired:
      "Template captures issue id, route, severity, browser/device, reproduction, redacted local-state keys, owner decision, and status.",
    blocksPublicPaidBeta: true
  },
  {
    id: "p1_final_owner_signoff",
    label: "Final owner signoff.",
    evidenceRequired:
      "Owner confirms checklist completion, cohort cap, manual payment, no public checkout, no sync, and pause criteria.",
    blocksPublicPaidBeta: true
  },
  {
    id: "p1_accessibility_mobile_keyboard_smoke",
    label: "Accessibility, mobile, and keyboard smoke evidence.",
    evidenceRequired:
      "Fresh smoke confirms dashboard, save, review, saved, packs, pricing, and word routes are usable.",
    blocksPublicPaidBeta: true
  }
] as const satisfies readonly PrivateBetaReadinessP1Requirement[];

export const PRIVATE_BETA_READINESS_RERUN_P2_POLISH = [
  {
    id: "p2_copy_polish_after_first_cohort",
    label: "Private beta copy polish after the first cohort.",
    deferUntil: "After owner reviews support themes from the first 5 to 20 users."
  },
  {
    id: "p2_pack_depth_ielts_gre",
    label: "Richer IELTS/GRE pack depth.",
    deferUntil: "After the save-to-review habit loop is stable."
  },
  {
    id: "p2_dashboard_progress_polish",
    label: "Dashboard progress and streak polish.",
    deferUntil:
      "After weekly reviewed words behavior is observed from real private beta usage."
  },
  {
    id: "p2_future_ai_mistake_explanation",
    label: "Future AI mistake explanation.",
    deferUntil: "After the SRS loop, manual beta, and safety gates work."
  }
] as const satisfies readonly PrivateBetaReadinessP2Polish[];

export const PRIVATE_BETA_READINESS_RERUN_OWNER_CHECKLIST = [
  {
    id: "owner_approve_manual_only_verdict",
    label: "Approve Owner-controlled private beta as Conditional / Manual-only.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner signoff references PR #84 and confirms public paid beta remains No-Go."
  },
  {
    id: "owner_approve_5_to_20_roster",
    label: "Approve 5 to 20 manually invited users.",
    requiredBeforeInvites: true,
    evidenceRequired: "Roster exists outside the app and has no public signup path."
  },
  {
    id: "owner_approve_manual_payment",
    label: "Approve manual/payment-link-only payment flow.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Payment copy states no connected checkout and access is manually confirmed."
  },
  {
    id: "owner_approve_manual_entitlement",
    label: "Approve manual entitlement and no automatic access.",
    requiredBeforeInvites: true,
    evidenceRequired: "Off-app entitlement record requirements are ready."
  },
  {
    id: "owner_approve_local_state_disclosure",
    label: "Approve local-state/account-sync limitation disclosure.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Participant copy states review progress is local and account sync is not implemented."
  },
  {
    id: "owner_approve_support_privacy_refund",
    label: "Approve support, privacy, refund, and cancellation copy.",
    requiredBeforeInvites: true,
    evidenceRequired: "Participant-facing copy is ready before invites."
  },
  {
    id: "owner_approve_manual_monitoring",
    label: "Approve manual monitoring, issue log, and pause criteria.",
    requiredBeforeInvites: true,
    evidenceRequired: "Owner review cadence and incident log template are ready."
  },
  {
    id: "owner_confirm_no_public_launch",
    label: "Confirm no public signup, public checkout, or public paid beta.",
    requiredBeforeInvites: true,
    evidenceRequired: "Launch notes state this is invite-only and manual."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_MANUAL_QA_CHECKLIST = [
  {
    id: "qa_save_creates_review_state",
    label: "Save creates or preserves review state.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Record local saved word and review state probes after saving a word."
  },
  {
    id: "qa_review_writes_events",
    label: "Review answers create events and update memory state.",
    requiredBeforeInvites: true,
    evidenceRequired: "Record event count and SRS state delta after answering."
  },
  {
    id: "qa_due_weak_mastered_real_state",
    label: "Due, Weak, and Mastered derive from real review state.",
    requiredBeforeInvites: true,
    evidenceRequired: "Record selector evidence and no fake mastery claims."
  },
  {
    id: "qa_core_routes_load",
    label: "Core routes load before invites.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Smoke /dashboard, /review, /saved, /packs, /pricing, and save route."
  },
  {
    id: "qa_console_hydration_counts",
    label: "Console error and hydration warning counts are recorded.",
    requiredBeforeInvites: true,
    evidenceRequired: "Record counts for every smoke route, including zero."
  },
  {
    id: "qa_mobile_keyboard_smoke",
    label: "Mobile and keyboard smoke is complete.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Core save, review, pricing, saved, and packs flows are reachable."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_PAYMENT_ENTITLEMENT_CHECKLIST = [
  {
    id: "payment_manual_or_link_only",
    label: "Use manual/payment-link-only payment.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Payment evidence is an external reference only; no raw payment payload enters the app."
  },
  {
    id: "payment_no_checkout_sdk",
    label: "Confirm no checkout, payment SDK, subscription, billing portal, or invoice.",
    requiredBeforeInvites: true,
    evidenceRequired: "Code and dependency review show no real payment integration."
  },
  {
    id: "entitlement_owner_manual_record",
    label: "Keep entitlement in an owner manual record.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Manual record has participant, invite source, status, evidence reference, owner approval, review date, and notes."
  },
  {
    id: "entitlement_no_automatic_grant",
    label: "Confirm no automatic entitlement grant.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Upgrade interest, local plan state, payment links, or client data cannot grant paid access."
  },
  {
    id: "payment_refund_cancellation_ready",
    label: "Refund/cancellation wording is ready.",
    requiredBeforeInvites: true,
    evidenceRequired: "Participant copy explains how to request refund or cancellation."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_ACCOUNT_SYNC_CHECKLIST = [
  {
    id: "sync_real_account_sync_blocked",
    label: "Real account sync remains blocked.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Participant copy says progress does not roam across accounts or devices."
  },
  {
    id: "sync_preview_digest_only",
    label: "Account sync work is preview/digest only.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "No apply/write operation, auth ownership, database write, or server account mutation exists."
  },
  {
    id: "sync_local_state_disclosure",
    label: "Local-state limitation is disclosed.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Participant accepts one-browser local storage limitation before joining."
  },
  {
    id: "sync_no_entitlement_claim",
    label: "Account sync preview cannot grant entitlement.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Digest and preview copy exclude paid entitlement, provider tokens, secrets, and payment data."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_MONITORING_SUPPORT_PRIVACY_CHECKLIST = [
  {
    id: "ops_manual_monitoring_ready",
    label: "Manual monitoring owner and cadence are ready.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner reviews support and issue log at least daily during the initial cohort."
  },
  {
    id: "ops_incident_log_ready",
    label: "Incident log template is ready.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Log includes required fields and redacts localStorage values."
  },
  {
    id: "ops_support_contact_ready",
    label: "Support contact and response expectation are ready.",
    requiredBeforeInvites: true,
    evidenceRequired: "Invite and payment copy include the support contact."
  },
  {
    id: "ops_privacy_copy_ready",
    label: "Privacy copy is ready.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Copy explains local learning data, support messages, and external payment boundaries."
  },
  {
    id: "ops_monitoring_sdk_blocked",
    label: "Monitoring SDK integration is blocked in current phase.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "No Sentry, analytics, logging provider, env, or deployment integration is added."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_INCIDENT_ROLLBACK_CHECKLIST = [
  {
    id: "rollback_pause_invites_on_review_break",
    label: "Pause invites when save or review loop breaks.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner pause rule covers save not creating review state or review answers not writing events."
  },
  {
    id: "rollback_pause_on_state_loss_pattern",
    label: "Pause invites on repeated local state loss reports.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Incident log tracks browser, route, redacted localStorage keys, and owner decision."
  },
  {
    id: "rollback_pause_on_support_privacy_refund_gap",
    label: "Pause invites and payment requests on support, privacy, refund, or cancellation gaps.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner action states participant notification and copy correction."
  },
  {
    id: "rollback_pause_on_public_exposure",
    label: "Pause immediately if public signup, public checkout, or self-serve access appears.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Rollback notes return the launch to owner-controlled manual private beta only."
  },
  {
    id: "rollback_rerun_smoke_before_resume",
    label: "Rerun smoke checks before resuming beta.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner records route, console, hydration, and SRS evidence after a fix."
  }
] as const satisfies readonly PrivateBetaReadinessChecklistItem[];

export const PRIVATE_BETA_READINESS_RERUN_DECISION_TABLE = [
  {
    id: "decision_launch_owner_manual",
    scenario:
      "All owner, manual QA, payment, entitlement, account sync disclosure, support, privacy, monitoring, and rollback checklist items are complete.",
    decision: "launch_owner_private_beta",
    verdict: "Allowed only if checklist is complete",
    rationale:
      "Owner-controlled private beta may invite 5 to 20 users manually with no public signup or checkout."
  },
  {
    id: "decision_no_launch_missing_checklist",
    scenario:
      "Any required owner, manual QA, support, refund, privacy, local-state, incident, or smoke evidence is missing.",
    decision: "do_not_launch",
    verdict: "No-Go",
    rationale:
      "Missing required checklist evidence blocks even owner-controlled private beta."
  },
  {
    id: "decision_no_public_beta",
    scenario:
      "Public paid beta, public signup, real checkout, automatic entitlement, or public marketing launch is proposed.",
    decision: "do_not_launch",
    verdict: "No-Go",
    rationale:
      "Public paid beta remains blocked by payment, account sync, entitlement, monitoring, accessibility, and production support/privacy/refund P0s."
  },
  {
    id: "decision_pause_rollback",
    scenario:
      "Core review breaks, state loss repeats, support/privacy/refund gaps appear, or public/self-serve access leaks.",
    decision: "pause_or_rollback",
    verdict: "Conditional / Manual-only",
    rationale:
      "Pause invites and payment requests, correct the issue, notify affected participants, and rerun smoke checks before resuming."
  }
] as const satisfies readonly PrivateBetaReadinessDecisionTableRow[];

export const PRIVATE_BETA_READINESS_RERUN_NEXT_PR_SEQUENCE = [
  {
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    purpose:
      "Record final owner-controlled launch checklist, invite cap, smoke evidence slots, support coverage, and pause criteria.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false
  },
  {
    prNumber: 86,
    title: "Private beta invite packet / participant instructions",
    purpose:
      "Prepare participant-facing invite, support, local-state, manual payment, refund/cancellation, privacy, and issue-reporting copy.",
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
      "Create the owner-run issue log template with severity, route, reproduction, redaction, owner decision, status, and rollback fields.",
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
      "Capture final owner approval after checklist, invite packet, issue log, and smoke evidence are complete.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false
  }
] as const satisfies readonly PrivateBetaReadinessNextPr[];

export const PRIVATE_BETA_READINESS_RERUN_SAFETY_POLICY = {
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
} as const satisfies PrivateBetaReadinessSafetyPolicy;

export const PRIVATE_BETA_READINESS_RERUN = {
  version: VISUAL_LEXICON_PRIVATE_BETA_READINESS_RERUN_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/private-beta-readiness-rerun",
  pullRequest: "#84 Private beta readiness rerun",
  reportDateKst: "2026-06-16",
  scope: "Track B private beta readiness rerun after PRs #79-#83",
  ownerControlledPrivateBetaVerdict:
    PRIVATE_BETA_READINESS_RERUN_OWNER_PRIVATE_VERDICT,
  publicPaidBetaVerdict: PRIVATE_BETA_READINESS_RERUN_PUBLIC_VERDICT,
  requiredVerdicts: PRIVATE_BETA_READINESS_RERUN_REQUIRED_VERDICTS,
  consolidatedSourcePrs: PRIVATE_BETA_READINESS_RERUN_SOURCE_PRS,
  readinessDeltaSincePr79: PRIVATE_BETA_READINESS_RERUN_DELTA,
  gateMatrix: PRIVATE_BETA_READINESS_RERUN_GATE_MATRIX,
  privateBetaAllowedConditions:
    PRIVATE_BETA_READINESS_RERUN_ALLOWED_CONDITIONS,
  privateBetaBlockedConditions:
    PRIVATE_BETA_READINESS_RERUN_BLOCKED_CONDITIONS,
  publicBetaP0Blockers: PRIVATE_BETA_READINESS_RERUN_PUBLIC_P0_BLOCKERS,
  remainingP1Requirements: PRIVATE_BETA_READINESS_RERUN_P1_REQUIREMENTS,
  p2Polish: PRIVATE_BETA_READINESS_RERUN_P2_POLISH,
  ownerApprovalChecklist: PRIVATE_BETA_READINESS_RERUN_OWNER_CHECKLIST,
  manualQaEvidenceChecklist: PRIVATE_BETA_READINESS_RERUN_MANUAL_QA_CHECKLIST,
  paymentEntitlementChecklist:
    PRIVATE_BETA_READINESS_RERUN_PAYMENT_ENTITLEMENT_CHECKLIST,
  accountSyncLimitationChecklist:
    PRIVATE_BETA_READINESS_RERUN_ACCOUNT_SYNC_CHECKLIST,
  monitoringSupportPrivacyChecklist:
    PRIVATE_BETA_READINESS_RERUN_MONITORING_SUPPORT_PRIVACY_CHECKLIST,
  incidentRollbackChecklist:
    PRIVATE_BETA_READINESS_RERUN_INCIDENT_ROLLBACK_CHECKLIST,
  launchDecisionTable: PRIVATE_BETA_READINESS_RERUN_DECISION_TABLE,
  nextPrivateBetaReadinessPrSequence:
    PRIVATE_BETA_READINESS_RERUN_NEXT_PR_SEQUENCE,
  safetyPolicy: PRIVATE_BETA_READINESS_RERUN_SAFETY_POLICY
} as const satisfies PrivateBetaReadinessRerun;

export function getPrivateBetaReadinessRerun() {
  return PRIVATE_BETA_READINESS_RERUN;
}

export function getOwnerControlledPrivateBetaVerdict() {
  return PRIVATE_BETA_READINESS_RERUN.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return PRIVATE_BETA_READINESS_RERUN.publicPaidBetaVerdict;
}

export function getReadinessGateMatrix() {
  return PRIVATE_BETA_READINESS_RERUN.gateMatrix;
}

export function getPrivateBetaAllowedConditions() {
  return PRIVATE_BETA_READINESS_RERUN.privateBetaAllowedConditions;
}

export function getPrivateBetaBlockedConditions() {
  return PRIVATE_BETA_READINESS_RERUN.privateBetaBlockedConditions;
}

export function getPublicBetaP0Blockers() {
  return PRIVATE_BETA_READINESS_RERUN.publicBetaP0Blockers;
}

export function getOwnerLaunchChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.ownerApprovalChecklist;
}

export function getManualQaEvidenceChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.manualQaEvidenceChecklist;
}

export function getPaymentEntitlementChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.paymentEntitlementChecklist;
}

export function getAccountSyncLimitationChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.accountSyncLimitationChecklist;
}

export function getMonitoringSupportPrivacyChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.monitoringSupportPrivacyChecklist;
}

export function getIncidentRollbackChecklist() {
  return PRIVATE_BETA_READINESS_RERUN.incidentRollbackChecklist;
}

export function getLaunchDecisionTable() {
  return PRIVATE_BETA_READINESS_RERUN.launchDecisionTable;
}

export function getNextPrivateBetaReadinessPRSequence() {
  return PRIVATE_BETA_READINESS_RERUN.nextPrivateBetaReadinessPrSequence;
}

