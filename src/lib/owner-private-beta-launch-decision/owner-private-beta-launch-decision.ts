export const VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION = 1 as const;

export type OwnerPrivateBetaLaunchDecisionVersion =
  typeof VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION;

export type OwnerPrivateBetaLaunchVerdict =
  | "Proceed / Conditional Manual Launch"
  | "No-Go";

export type OwnerPrivateBetaSafetyState = "Blocked" | "Allowed only after owner manually confirms checklist completion";

export type OwnerPrivateBetaSourcePrNumber =
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89;

export type OwnerPrivateBetaSeverity = "P0" | "P1" | "P2";

export type OwnerPrivateBetaRequiredVerdicts = {
  ownerControlledPrivateBeta: "Proceed / Conditional Manual Launch";
  publicPaidBeta: "No-Go";
  publicSignup: "Blocked";
  publicCheckout: "Blocked";
  automaticEntitlement: "Blocked";
  realAccountSync: "Blocked";
  productionDeploymentChanges: "Blocked";
  ownerInvitation: "Allowed only after owner manually confirms checklist completion";
};

export type OwnerPrivateBetaPriorGate = {
  id: string;
  prNumber: OwnerPrivateBetaSourcePrNumber;
  title: string;
  docPath: string;
  contractPath: string;
  requiredBeforeInvites: true;
  launchEvidence: string;
};

export type OwnerPrivateBetaAllowedCondition = {
  id: string;
  label: string;
  severity: OwnerPrivateBetaSeverity;
  requiredBeforeInvites: true;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaLimitation = {
  id: string;
  label: string;
  severity: OwnerPrivateBetaSeverity;
  requiredBeforeInvites: true;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaNoLaunchCondition = {
  id: string;
  label: string;
  severity: OwnerPrivateBetaSeverity;
  launchBlocked: true;
  reason: string;
  requiredOwnerAction: string;
};

export type OwnerPrivateBetaPublicBetaBlocker = {
  id: string;
  label: string;
  severity: OwnerPrivateBetaSeverity;
  status: "Blocked";
  reason: string;
  requiredBeforePublicBeta: string;
};

export type OwnerPrivateBetaParticipantCap = {
  minimum: 5;
  maximum: 20;
  hardCapBeforeReapproval: 20;
  manualRosterRequired: true;
  publicWaitlistOrSignupAllowed: false;
  ownerOnlyRoster: true;
};

export type OwnerPrivateBetaPolicy = {
  id: string;
  label: string;
  publicSignupAllowed: false;
  publicCheckoutAllowed: false;
  selfServeInvitesAllowed: false;
  participantCap: "5 to 20";
  ownerInvitesOnly: true;
  manualRosterRequired: true;
};

export type OwnerPrivateBetaManualPaymentPolicy = {
  id: string;
  label: string;
  paymentMode: "manual-or-payment-link-only";
  requiresPaymentRequestOwnerControl: true;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaEntitlementPolicy = {
  id: string;
  label: string;
  automaticEntitlementAllowed: false;
  entitlementMutationAllowed: false;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaLocalStateDisclosure = {
  id: string;
  label: string;
  localStateOnly: true;
  noRealAccountSync: true;
  redactedStorageEvidenceOnly: true;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaReadinessConfirmation = {
  id: string;
  label: string;
  requiredBeforeInvites: true;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaReviewPlanItem = {
  id: string;
  label: string;
  window:
    | "first_24_hours"
    | "first_7_days";
  severity: OwnerPrivateBetaSeverity;
  ownerEvidenceRequired: string;
};

export type OwnerPrivateBetaPostLaunchReviewPlan = {
  first24HourReview: readonly OwnerPrivateBetaReviewPlanItem[];
  first7DayReview: readonly OwnerPrivateBetaReviewPlanItem[];
};

export type OwnerPrivateBetaPauseRollbackCriterion = {
  id: string;
  label: string;
  severity: OwnerPrivateBetaSeverity;
  trigger: string;
  pauseInvites: true;
  pausePaymentRequests: boolean;
  ownerAction: string;
};

export type OwnerPrivateBetaSuccessMetric = {
  id: string;
  label: string;
  metricType: string;
  evidenceRequirement: string;
};

export type OwnerPrivateBetaFailureCriteria = {
  id: string;
  label: string;
  signal: string;
  requiredOwnerAction: string;
};

export type OwnerPrivateBetaNextPr = {
  prNumber: 91 | 92 | 93 | 94 | 95;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  productionDeploymentChangesAllowed: false;
};

export type OwnerPrivateBetaSafetyPolicy = {
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
  invitationSendingAllowed: false;
  emailProviderIntegrationAllowed: false;
  githubApiUsageAllowed: false;
  issueTrackerIntegrationAllowed: false;
};

export type OwnerPrivateBetaLaunchDecision = {
  version: OwnerPrivateBetaLaunchDecisionVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/owner-run-private-beta-launch-decision";
  pullRequest: "#90 Owner-run private beta launch decision";
  reportDateKst: "2026-06-17";
  scope: "Track B owner-run private beta launch decision before invitations";
  ownerControlledPrivateBetaVerdict: "Proceed / Conditional Manual Launch";
  publicPaidBetaVerdict: "No-Go";
  requiredVerdicts: OwnerPrivateBetaRequiredVerdicts;
  currentVerdicts: {
    ownerControlledPrivateBeta: "Proceed / Conditional Manual Launch";
    publicPaidBeta: "No-Go";
  };
  evidenceSummary: readonly OwnerPrivateBetaPriorGate[];
  priorGates: readonly OwnerPrivateBetaPriorGate[];
  launchAllowedConditions: readonly OwnerPrivateBetaAllowedCondition[];
  launchLimitations: readonly OwnerPrivateBetaLimitation[];
  noLaunchConditions: readonly OwnerPrivateBetaNoLaunchCondition[];
  publicBetaBlockers: readonly OwnerPrivateBetaPublicBetaBlocker[];
  participantCap: OwnerPrivateBetaParticipantCap;
  ownerInvitedOnlyPolicy: OwnerPrivateBetaPolicy;
  manualPaymentPolicy: OwnerPrivateBetaManualPaymentPolicy;
  noAutomaticEntitlementPolicy: OwnerPrivateBetaEntitlementPolicy;
  localStateAccountSyncDisclosure: OwnerPrivateBetaLocalStateDisclosure;
  supportRefundPrivacyReadiness: readonly OwnerPrivateBetaReadinessConfirmation[];
  issueLogReadiness: readonly OwnerPrivateBetaReadinessConfirmation[];
  dryRunEvidenceReadiness: readonly OwnerPrivateBetaReadinessConfirmation[];
  ownerFinalSignoffReadiness: readonly OwnerPrivateBetaReadinessConfirmation[];
  first24HourReviewPlan: readonly OwnerPrivateBetaReviewPlanItem[];
  first7DayReviewPlan: readonly OwnerPrivateBetaReviewPlanItem[];
  postLaunchReviewPlan: OwnerPrivateBetaPostLaunchReviewPlan;
  pauseRollbackCriteria: readonly OwnerPrivateBetaPauseRollbackCriterion[];
  privateBetaSuccessMetrics: readonly OwnerPrivateBetaSuccessMetric[];
  privateBetaFailureCriteria: readonly OwnerPrivateBetaFailureCriteria[];
  nextOwnerLaunchPRSequence: readonly OwnerPrivateBetaNextPr[];
  safetyPolicy: OwnerPrivateBetaSafetyPolicy;
};

export const OWNER_PRIVATE_BETA_LAUNCH_VERDICT =
  "Proceed / Conditional Manual Launch" as const satisfies OwnerPrivateBetaLaunchVerdict;

export const PUBLIC_BETA_LAUNCH_VERDICT = "No-Go" as const satisfies OwnerPrivateBetaLaunchVerdict;

export const OWNER_PRIVATE_BETA_REQUIRED_VERDICTS: OwnerPrivateBetaRequiredVerdicts = {
  ownerControlledPrivateBeta: OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
  publicPaidBeta: PUBLIC_BETA_LAUNCH_VERDICT,
  publicSignup: "Blocked",
  publicCheckout: "Blocked",
  automaticEntitlement: "Blocked",
  realAccountSync: "Blocked",
  productionDeploymentChanges: "Blocked",
  ownerInvitation:
    "Allowed only after owner manually confirms checklist completion"
};

export const OWNER_PRIVATE_BETA_PRIOR_GATE_EVIDENCE = [
  {
    id: "prior_gate_79_manual_qa",
    prNumber: 79,
    title: "Manual QA execution report",
    docPath: "docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md",
    contractPath: "src/lib/paid-beta-manual-qa-execution/paid-beta-manual-qa-execution.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Baseline manual QA route/state review, save/review functionality, local storage probe discipline, and pricing/paywall behavior."
  },
  {
    id: "prior_gate_80_private_beta_gate_prep",
    prNumber: 80,
    title: "Private beta gate prep",
    docPath: "docs/PRIVATE_BETA_GATE_PREP.md",
    contractPath: "src/lib/private-beta-gate/private-beta-gate.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Owner-invited launch model, controlled blockers, and pre-invite decision posture."
  },
  {
    id: "prior_gate_81_manual_payment_policy",
    prNumber: 81,
    title: "Manual payment / entitlement policy",
    docPath: "docs/MANUAL_PAYMENT_ENTITLEMENT_POLICY.md",
    contractPath: "src/lib/manual-payment-entitlement/manual-payment-entitlement.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Manual payment-only policy, manual entitlement record model, and no real checkout entitlement mutation."
  },
  {
    id: "prior_gate_82_account_sync_preview_digest",
    prNumber: 82,
    title: "Account sync preview/digest mock",
    docPath: "docs/ACCOUNT_SYNC_PREVIEW_DIGEST_MOCK.md",
    contractPath: "src/lib/account-sync-preview-digest/account-sync-preview-digest.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Preview/digest-only account-sync behavior and explicit local-state limitation."
  },
  {
    id: "prior_gate_83_monitoring_support_privacy_gate",
    prNumber: 83,
    title: "Monitoring, support, privacy beta gate",
    docPath: "docs/MONITORING_SUPPORT_PRIVACY_BETA_GATE.md",
    contractPath: "src/lib/beta-ops-gate/beta-ops-gate.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Support, privacy disclosure, refund/cancellation and incident boundaries for private beta."
  },
  {
    id: "prior_gate_84_private_beta_readiness_rerun",
    prNumber: 84,
    title: "Private beta readiness rerun",
    docPath: "docs/PRIVATE_BETA_READINESS_RERUN.md",
    contractPath:
      "src/lib/private-beta-readiness-rerun/private-beta-readiness-rerun.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Reaffirmed owner private beta Conditional / Manual-only verdict while public paid beta remains No-Go."
  },
  {
    id: "prior_gate_85_launch_checklist",
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    docPath: "docs/OWNER_RUN_PRIVATE_BETA_LAUNCH_CHECKLIST.md",
    contractPath:
      "src/lib/owner-beta-launch-checklist/owner-beta-launch-checklist.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Checklist for roster cap, launch preconditions, smoke checks, rollback, and review monitoring."
  },
  {
    id: "prior_gate_86_invite_packet",
    prNumber: 86,
    title: "Private beta invite packet / participant instructions",
    docPath: "docs/PRIVATE_BETA_INVITE_PACKET.md",
    contractPath: "src/lib/private-beta-invite-packet/private-beta-invite-packet.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Participant-facing policies and disclosures for invite-only scope, manual payment, no entitlement automation, and local-state boundary."
  },
  {
    id: "prior_gate_87_issue_log",
    prNumber: 87,
    title: "Private beta issue log template",
    docPath: "docs/PRIVATE_BETA_ISSUE_LOG_TEMPLATE.md",
    contractPath: "src/lib/private-beta-issue-log/private-beta-issue-log.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Issue severity, route, reproduction, and owner decision tracking contract."
  },
  {
    id: "prior_gate_88_final_signoff",
    prNumber: 88,
    title: "Private beta final owner signoff",
    docPath: "docs/PRIVATE_BETA_FINAL_OWNER_SIGNOFF.md",
    contractPath:
      "src/lib/private-beta-final-owner-signoff/private-beta-final-owner-signoff.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Final-owner signoff contract for no-launch policy, readiness, and private beta gating."
  },
  {
    id: "prior_gate_89_dry_run_smoke",
    prNumber: 89,
    title: "Private beta dry-run smoke evidence",
    docPath: "docs/PRIVATE_BETA_DRY_RUN_SMOKE_EVIDENCE.md",
    contractPath:
      "src/lib/private-beta-dry-run-smoke/private-beta-dry-run-smoke.ts",
    requiredBeforeInvites: true,
    launchEvidence:
      "Pre-invite smoke, storage, route, console, hydration, and mobile/keyboard evidence."
  }
] as const satisfies readonly OwnerPrivateBetaPriorGate[];

export const OWNER_PRIVATE_BETA_LAUNCH_ALLOWED_CONDITIONS = [
  {
    id: "allowed_after_prior_gates_complete",
    label: "Required prior gates #79 through #89 are complete.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired: "All prior gate artifacts and contracts are present and signed off by owner."
  },
  {
    id: "allowed_after_participant_cap_confirmed",
    label: "Participant cap is 5 to 20 manually selected participants.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner maintains a manual roster with 5 to 20 invited participants."
  },
  {
    id: "allowed_after_manual_payment_policy_confirmed",
    label: "Manual/payment-link-only handling is confirmed.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Invite and payment copy confirms manual handling and no automatic entitlement."
  },
  {
    id: "allowed_after_dry_run_complete",
    label: "Dry-run smoke evidence is available.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Route smoke, state probes, storage probes, and console/hydration evidence are confirmed."
  },
  {
    id: "allowed_after_final_signoff_confirmed",
    label: "Owner final signoff is confirmed after checklist completion.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner confirms all final-signoff readiness items before invitations."
  }
] as const satisfies readonly OwnerPrivateBetaAllowedCondition[];

export const OWNER_PRIVATE_BETA_LAUNCH_LIMITATIONS = [
  {
    id: "limitation_owner_invited_only",
    label:
      "Owner-invited-only access with no public signup, public checkout, or public waitlist.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "No public route, public self-serve invites, or signup forms are used."
  },
  {
    id: "limitation_manual_payment_or_payment_link_only",
    label: "Manual payment or payment-link-only request flow.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Payment can be requested, but access is not auto-granted by this app."
  },
  {
    id: "limitation_no_automatic_entitlement",
    label: "No automatic entitlement.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "No entitlement mutation, grant callbacks, or entitlement callbacks are implemented in this phase."
  },
  {
    id: "limitation_local_state_only",
    label: "Real account sync is not implemented.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Participants are informed saved words, state, and review events remain browser-local."
  },
  {
    id: "limitation_no_production_deployment_changes",
    label: "No production deployment/infrastructure change.",
    severity: "P0",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Launch decision scope is docs/contracts/tests only."
  }
] as const satisfies readonly OwnerPrivateBetaLimitation[];

export const OWNER_PRIVATE_BETA_NO_LAUNCH_CONDITIONS = [
  {
    id: "no_launch_blocked_public_signup_or_checkout",
    label: "Public signup or checkout is exposed.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Public signup or checkout changes scope from owner-run private beta to public paid beta.",
    requiredOwnerAction:
      "Remove public entry points and keep invite-only owner access."
  },
  {
    id: "no_launch_automatic_entitlement_active",
    label: "Automatic entitlement is active.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Automatic entitlement bypasses owner review and can grant access without manual control.",
    requiredOwnerAction:
      "Disable entitlement automation before any invite or payment request."
  },
  {
    id: "no_launch_real_account_sync_claimed",
    label: "Real account sync is claimed or enabled.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Participants can only rely on browser-local state in this phase.",
    requiredOwnerAction:
      "Remove claims and keep the explicit local-state limitation disclosure."
  },
  {
    id: "no_launch_production_deployment_change",
    label: "Production deployment or infrastructure change is introduced.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "This PR is docs/contracts/tests only. Production changes are outside the current decision scope.",
    requiredOwnerAction:
      "Remove production change and keep docs/contracts/tests scope for this PR."
  },
  {
    id: "no_launch_support_or_privacy_readiness_missing",
    label: "Support/refund/privacy readiness is incomplete.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "Support and privacy handling is required before manual payment and invite delivery.",
    requiredOwnerAction:
      "Complete support, refund, and privacy readiness confirmation before inviting."
  },
  {
    id: "no_launch_issue_log_or_signoff_missing",
    label: "Issue log readiness or owner signoff is incomplete.",
    severity: "P0",
    launchBlocked: true,
    reason:
      "No robust issue triage or owner signoff can create blind private beta risk.",
    requiredOwnerAction:
      "Complete issue log readiness and owner final signoff."
  },
  {
    id: "no_launch_public_beta_blockers_missing",
    label: "Public beta blockers are not enforced.",
    severity: "P0",
    launchBlocked: true,
    reason: "Public paid beta remains No-Go until production-readiness work is complete.",
    requiredOwnerAction:
      "Keep public beta blockers in place and re-review every blocker before scope expansion."
  }
] as const satisfies readonly OwnerPrivateBetaNoLaunchCondition[];

export const OWNER_PRIVATE_BETA_PUBLIC_BETA_BLOCKERS = [
  {
    id: "public_blocker_public_checkout",
    label: "Public checkout",
    severity: "P0",
    status: "Blocked",
    reason:
      "No payment SDK checkout, billing portal, invoice, or subscription flow is active.",
    requiredBeforePublicBeta:
      "Explicit public checkout strategy, billing/legal/operations, and production safety artifacts."
  },
  {
    id: "public_blocker_automatic_entitlement",
    label: "Automatic entitlement",
    severity: "P0",
    status: "Blocked",
    reason: "No automatic entitlement grant path is approved.",
    requiredBeforePublicBeta:
      "End-to-end entitlement model, audit trail, and rollback policy."
  },
  {
    id: "public_blocker_real_account_sync",
    label: "Real account sync",
    severity: "P0",
    status: "Blocked",
    reason: "Learning state remains browser-local in this phase.",
    requiredBeforePublicBeta:
      "Auth + persistence sync stack with migration, conflict handling, and privacy plan."
  },
  {
    id: "public_blocker_public_signup",
    label: "Public signup",
    severity: "P0",
    status: "Blocked",
    reason: "Public signup is outside owner-run private beta scope.",
    requiredBeforePublicBeta:
    "Approved public onboarding and production launch controls."
  },
  {
    id: "public_blocker_production_deployment_changes",
    label: "Production deployment changes",
    severity: "P0",
    status: "Blocked",
    reason: "Current launch decision is restricted to docs/contracts/tests.",
    requiredBeforePublicBeta:
      "Deployment readiness, monitoring, rollback, and release controls."
  }
] as const satisfies readonly OwnerPrivateBetaPublicBetaBlocker[];

export const OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY: OwnerPrivateBetaPolicy = {
  id: "policy_owner_invited_only",
  label: "Owner-invited-only access",
  publicSignupAllowed: false,
  publicCheckoutAllowed: false,
  selfServeInvitesAllowed: false,
  participantCap: "5 to 20",
  ownerInvitesOnly: true,
  manualRosterRequired: true
} as const satisfies OwnerPrivateBetaPolicy;

export const OWNER_PRIVATE_BETA_MANUAL_PAYMENT_POLICY: OwnerPrivateBetaManualPaymentPolicy = {
  id: "policy_manual_payment_or_payment_link_only",
  label: "Manual payment / payment-link-only",
  paymentMode: "manual-or-payment-link-only",
  requiresPaymentRequestOwnerControl: true,
  ownerEvidenceRequired:
    "Invites include a manual payment request path; no app-side payment mutation."
} as const satisfies OwnerPrivateBetaManualPaymentPolicy;

export const OWNER_PRIVATE_BETA_NO_AUTOMATIC_ENTITLEMENT_POLICY: OwnerPrivateBetaEntitlementPolicy = {
  id: "policy_no_automatic_entitlement",
  label: "No automatic entitlement",
  automaticEntitlementAllowed: false,
  entitlementMutationAllowed: false,
  ownerEvidenceRequired:
    "No automatic grant logic in UI, routes, routes handlers, auth hooks, or payment callbacks."
} as const satisfies OwnerPrivateBetaEntitlementPolicy;

export const OWNER_PRIVATE_BETA_LOCAL_STATE_ACCOUNT_SYNC_DISCLOSURE: OwnerPrivateBetaLocalStateDisclosure = {
  id: "disclosure_local_state_account_sync_limitation",
  label: "Local-state/account-sync limitation disclosure",
  localStateOnly: true,
  noRealAccountSync: true,
  redactedStorageEvidenceOnly: true,
  ownerEvidenceRequired:
    "Participants acknowledge browser-local state (`vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, `vlx_daily_stats_v1`) and no cross-device sync."
} as const satisfies OwnerPrivateBetaLocalStateDisclosure;

export const OWNER_PRIVATE_BETA_SUPPORT_REFUND_PRIVACY_READINESS = [
  {
    id: "readiness_support_contact",
    label: "Support contact and expected response",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Invite, issue, and payment copy points to one monitored support contact validated by owner."
  },
  {
    id: "readiness_refund_cancellation",
    label: "Refund and cancellation copy",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "owner-controlled payment request includes clear refund/cancellation policy before any payment request."
  },
  {
    id: "readiness_privacy_statement",
    label: "Privacy and local-state disclosure",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "owner-approved privacy copy explains local learning state, support message expectations, and redacted evidence constraints."
  }
] as const satisfies readonly OwnerPrivateBetaReadinessConfirmation[];

export const OWNER_PRIVATE_BETA_ISSUE_LOG_READINESS = [
  {
    id: "readiness_issue_log_template",
    label: "Issue log template ready",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Issue format includes route, severity, reproduction, browser/device, storage-key redaction, and decision status."
  }
] as const satisfies readonly OwnerPrivateBetaReadinessConfirmation[];

export const OWNER_PRIVATE_BETA_DRY_RUN_EVIDENCE_READINESS = [
  {
    id: "readiness_dry_run_smoke",
    label: "Dry-run smoke evidence ready",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "PR #89 smoke evidence is complete with routes, storage probes, console/hydration, and mobile/keyboard notes."
  }
] as const satisfies readonly OwnerPrivateBetaReadinessConfirmation[];

export const OWNER_PRIVATE_BETA_OWNER_FINAL_SIGNOFF_READINESS = [
  {
    id: "readiness_owner_final_signoff",
    label: "Owner final signoff complete",
    requiredBeforeInvites: true,
    ownerEvidenceRequired:
      "Owner confirms verdicts, prior gates, policies, readiness, and no-launch blockers before any invite."
  }
] as const satisfies readonly OwnerPrivateBetaReadinessConfirmation[];

export const OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN = [
  {
    id: "review_24h_invite_delivery_and_questions",
    label: "Invite delivery, acceptance, and questions check.",
    window: "first_24_hours",
    severity: "P1",
    ownerEvidenceRequired:
      "Record delivery/acceptance counts and clarification volume during the first 24 hours."
  },
  {
    id: "review_24h_blocking_issues",
    label: "Blocking issue scan.",
    window: "first_24_hours",
    severity: "P0",
    ownerEvidenceRequired:
      "Review support, route, storage, payment, privacy, console, hydration, and keyboard blockers."
  },
  {
    id: "review_24h_pause_or_continue",
    label: "Pause/continue decision.",
    window: "first_24_hours",
    severity: "P0",
    ownerEvidenceRequired:
      "Record explicit decision before inviting additional participants."
  }
] as const satisfies readonly OwnerPrivateBetaReviewPlanItem[];

export const OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN = [
  {
    id: "review_7d_learning_loop_signal",
    label: "Learning-loop signal review.",
    window: "first_7_days",
    severity: "P0",
    ownerEvidenceRequired:
      "Track saved words, review start/completion, weak-word return, and learning loop continuity."
  },
  {
    id: "review_7d_support_and_issues",
    label: "Support and issue pattern review.",
    window: "first_7_days",
    severity: "P0",
    ownerEvidenceRequired:
      "Summarize support load, P0/P1 issues, and payment/entitlement/policy confusion."
  },
  {
    id: "review_7d_cap_decision",
    label: "Continue/pause/stop decision.",
    window: "first_7_days",
    severity: "P0",
    ownerEvidenceRequired:
      "Decide continue, pause, or stop with explicit cap and blocker status."
  }
] as const satisfies readonly OwnerPrivateBetaReviewPlanItem[];

export const OWNER_PRIVATE_BETA_PAUSE_ROLLBACK_CRITERIA = [
  {
    id: "pause_save_review_broken",
    label: "Pause if save/review loop is broken.",
    severity: "P0",
    trigger:
      "Save does not create/maintain reviewed state or review answers do not write events/state.",
    pauseInvites: true,
    pausePaymentRequests: true,
    ownerAction:
      "Pause invites and payment requests, fix root cause, rerun smoke checks, and then resume."
  },
  {
    id: "pause_state_loss_or_sync_confusion",
    label: "Pause if repeated state-loss or sync assumptions appear.",
    severity: "P0",
    trigger:
      "Multiple participants report missing saved words/review state/events/stats or assume cross-device sync.",
    pauseInvites: true,
    pausePaymentRequests: true,
    ownerAction:
      "Pause recruitment, clarify local-state limitation, and rerun local storage validation."
  },
  {
    id: "pause_payment_entitlement_confusion",
    label: "Pause on payment/entitlement confusion.",
    severity: "P0",
    trigger: "Participants misunderstand manual payment or automatic entitlement behavior.",
    pauseInvites: true,
    pausePaymentRequests: true,
    ownerAction:
      "Pause new payment requests, correct copy, and rebrief participants."
  },
  {
    id: "pause_privacy_or_support_gap",
    label: "Pause on privacy/support readiness gaps.",
    severity: "P1",
    trigger: "Support, refund, or privacy guidance is missing for active issues.",
    pauseInvites: true,
    pausePaymentRequests: true,
    ownerAction:
      "Close gaps, update disclosures, and continue only after confirmation."
  }
] as const satisfies readonly OwnerPrivateBetaPauseRollbackCriterion[];

export const OWNER_PRIVATE_BETA_SUCCESS_METRICS = [
  {
    id: "metric_save_success",
    label: "Save success",
    metricType: "count",
    evidenceRequirement: "Saved-word attempts versus successful persisted records."
  },
  {
    id: "metric_review_start",
    label: "Review start",
    metricType: "count",
    evidenceRequirement: "Unique participant review session starts per day."
  },
  {
    id: "metric_review_completion",
    label: "Review completion",
    metricType: "completion rate",
    evidenceRequirement: "Review sessions with at least one completed answer."
  },
  {
    id: "metric_due_review_return",
    label: "Due review return",
    metricType: "return count",
    evidenceRequirement: "Return to due-list reviews after initial completion."
  },
  {
    id: "metric_weak_word_understanding",
    label: "Weak word understanding",
    metricType: "weak score trend",
    evidenceRequirement: "Weak words decrease after repeated correct recall."
  },
  {
    id: "metric_pack_preview_engagement",
    label: "Pack preview engagement",
    metricType: "engagement",
    evidenceRequirement: "Pack preview visits and CTA interactions per participant."
  },
  {
    id: "metric_pricing_comprehension",
    label: "Pricing comprehension",
    metricType: "clarity score",
    evidenceRequirement:
      "Participant questions are low and copy references manual/payment-link-only."
  },
  {
    id: "metric_issue_count_severity",
    label: "Issue count / severity",
    metricType: "operational signal",
    evidenceRequirement:
      "Issue count by severity and trend for P0/P1 over 24-hour and 7-day windows."
  },
  {
    id: "metric_weekly_reviewed_words",
    label: "Weekly Reviewed Words",
    metricType: "behavioral KPI",
    evidenceRequirement:
      "Weekly reviewed words are updated through real review activity, without inventing synthetic values."
  }
] as const satisfies readonly OwnerPrivateBetaSuccessMetric[];

export const OWNER_PRIVATE_BETA_FAILURE_CRITERIA = [
  {
    id: "failure_data_loss",
    label: "Data loss",
    signal:
      "Repeated missing local review/saved/metric state across sessions or browser refresh.",
    requiredOwnerAction:
      "Pause invites and payment requests and fix persistence and copy before resuming."
  },
  {
    id: "failure_save_or_review_broken",
    label: "Save/review loop broken",
    signal:
      "Save actions or review answers no longer produce review state/events or proper SRS progress.",
    requiredOwnerAction: "Pause and fix immediately."
  },
  {
    id: "failure_local_state_confusion_blocks_learning",
    label: "Local-state confusion blocks learning",
    signal:
      "Participants cannot continue due to misunderstandings about browser-local state or account sync.",
    requiredOwnerAction:
      "Rebrief participants and reinforce local-state limitations in all copy."
  },
  {
    id: "failure_payment_entitlement_misunderstanding",
    label: "Payment/entitlement misunderstanding",
    signal:
      "Participants assume payment instantly grants access or confusion persists around entitlement.",
    requiredOwnerAction: "Pause payment requests and clarify copy."
  },
  {
    id: "failure_privacy_or_support_issue",
    label: "Privacy/support issue",
    signal:
      "Privacy confusion, support backlog, or unresolved disputes reduce confidence.",
    requiredOwnerAction:
      "Halt expansion and resolve support/privacy handling before continuation."
  },
  {
    id: "failure_unresolved_p0",
    label: "Unresolved P0",
    signal: "Any unresolved P0 blocker after decision date.",
    requiredOwnerAction:
      "Keep beta paused until blocker is resolved and revalidated."
  },
  {
    id: "failure_repeated_p1_across_participants",
    label: "Repeated P1 issues across participants",
    signal:
      "Same P1 issue observed repeatedly in multiple participants.",
    requiredOwnerAction:
      "Pause and treat as launch condition blocker until stabilized."
  }
] as const satisfies readonly OwnerPrivateBetaFailureCriteria[];

export const OWNER_PRIVATE_BETA_NEXT_PR_SEQUENCE = [
  {
    prNumber: 91,
    title: "Owner-run private beta execution log",
    purpose: "Track every private beta execution action and decision in a timestamped owner-run log.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 92,
    title: "24-hour private beta review",
    purpose: "Complete the formal first-24-hour review decision and evidence summary.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 93,
    title: "7-day private beta review",
    purpose:
      "Complete week-one learning-loop and operations review before any expansion.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 94,
    title: "Private beta P0/P1 stabilization, if needed",
    purpose: "Stabilize launch blockers and unresolved P0/P1 issues.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  },
  {
    prNumber: 95,
    title: "Private beta learning-loop improvements",
    purpose:
      "Prioritize additional learning-loop enhancements after decision gates remain stable.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  }
] as const satisfies readonly OwnerPrivateBetaNextPr[];

export const OWNER_PRIVATE_BETA_PARTICIPANT_CAP = {
  minimum: 5,
  maximum: 20,
  hardCapBeforeReapproval: 20,
  manualRosterRequired: true,
  publicWaitlistOrSignupAllowed: false,
  ownerOnlyRoster: true
} as const satisfies OwnerPrivateBetaParticipantCap;

export const OWNER_PRIVATE_BETA_POST_LAUNCH_REVIEW_PLAN = {
  first24HourReview: OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN,
  first7DayReview: OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN
} as const satisfies OwnerPrivateBetaPostLaunchReviewPlan;

export const OWNER_PRIVATE_BETA_LAUNCH_DECISION: OwnerPrivateBetaLaunchDecision = {
  version: VISUAL_LEXICON_OWNER_PRIVATE_BETA_LAUNCH_DECISION_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/owner-run-private-beta-launch-decision",
  pullRequest: "#90 Owner-run private beta launch decision",
  reportDateKst: "2026-06-17",
  scope: "Track B owner-run private beta launch decision before invitations",
  ownerControlledPrivateBetaVerdict: OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
  publicPaidBetaVerdict: PUBLIC_BETA_LAUNCH_VERDICT,
  requiredVerdicts: OWNER_PRIVATE_BETA_REQUIRED_VERDICTS,
  currentVerdicts: {
    ownerControlledPrivateBeta: OWNER_PRIVATE_BETA_LAUNCH_VERDICT,
    publicPaidBeta: PUBLIC_BETA_LAUNCH_VERDICT
  },
  evidenceSummary: OWNER_PRIVATE_BETA_PRIOR_GATE_EVIDENCE,
  priorGates: OWNER_PRIVATE_BETA_PRIOR_GATE_EVIDENCE,
  launchAllowedConditions: OWNER_PRIVATE_BETA_LAUNCH_ALLOWED_CONDITIONS,
  launchLimitations: OWNER_PRIVATE_BETA_LAUNCH_LIMITATIONS,
  noLaunchConditions: OWNER_PRIVATE_BETA_NO_LAUNCH_CONDITIONS,
  publicBetaBlockers: OWNER_PRIVATE_BETA_PUBLIC_BETA_BLOCKERS,
  participantCap: OWNER_PRIVATE_BETA_PARTICIPANT_CAP,
  ownerInvitedOnlyPolicy: OWNER_PRIVATE_BETA_OWNER_INVITED_ONLY_POLICY,
  manualPaymentPolicy: OWNER_PRIVATE_BETA_MANUAL_PAYMENT_POLICY,
  noAutomaticEntitlementPolicy: OWNER_PRIVATE_BETA_NO_AUTOMATIC_ENTITLEMENT_POLICY,
  localStateAccountSyncDisclosure: OWNER_PRIVATE_BETA_LOCAL_STATE_ACCOUNT_SYNC_DISCLOSURE,
  supportRefundPrivacyReadiness: OWNER_PRIVATE_BETA_SUPPORT_REFUND_PRIVACY_READINESS,
  issueLogReadiness: OWNER_PRIVATE_BETA_ISSUE_LOG_READINESS,
  dryRunEvidenceReadiness: OWNER_PRIVATE_BETA_DRY_RUN_EVIDENCE_READINESS,
  ownerFinalSignoffReadiness: OWNER_PRIVATE_BETA_OWNER_FINAL_SIGNOFF_READINESS,
  first24HourReviewPlan: OWNER_PRIVATE_BETA_FIRST_24_HOUR_REVIEW_PLAN,
  first7DayReviewPlan: OWNER_PRIVATE_BETA_FIRST_7_DAY_REVIEW_PLAN,
  postLaunchReviewPlan: OWNER_PRIVATE_BETA_POST_LAUNCH_REVIEW_PLAN,
  pauseRollbackCriteria: OWNER_PRIVATE_BETA_PAUSE_ROLLBACK_CRITERIA,
  privateBetaSuccessMetrics: OWNER_PRIVATE_BETA_SUCCESS_METRICS,
  privateBetaFailureCriteria: OWNER_PRIVATE_BETA_FAILURE_CRITERIA,
  nextOwnerLaunchPRSequence: OWNER_PRIVATE_BETA_NEXT_PR_SEQUENCE,
  safetyPolicy: {
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
    npmAuditFixAllowed: false,
    invitationSendingAllowed: false,
    emailProviderIntegrationAllowed: false,
    githubApiUsageAllowed: false,
    issueTrackerIntegrationAllowed: false
  }
} as const satisfies OwnerPrivateBetaLaunchDecision;

export function getOwnerRunPrivateBetaLaunchDecision() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION;
}

export function getOwnerPrivateBetaVerdict() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.publicPaidBetaVerdict;
}

export function getPriorGateChecklist() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.priorGates;
}

export function getLaunchAllowedConditions() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.launchAllowedConditions;
}

export function getLaunchLimitations() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.launchLimitations;
}

export function getNoLaunchConditions() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.noLaunchConditions;
}

export function getPublicBetaBlockers() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.publicBetaBlockers;
}

export function getPrivateBetaSuccessMetrics() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.privateBetaSuccessMetrics;
}

export function getPrivateBetaFailureCriteria() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.privateBetaFailureCriteria;
}

export function getPostLaunchReviewPlan() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.postLaunchReviewPlan;
}

export function getNextOwnerLaunchPRSequence() {
  return OWNER_PRIVATE_BETA_LAUNCH_DECISION.nextOwnerLaunchPRSequence;
}
