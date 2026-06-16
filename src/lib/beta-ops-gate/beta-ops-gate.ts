export const VISUAL_LEXICON_BETA_OPS_GATE_VERSION = 1 as const;

export type VisualLexiconBetaOpsGateVersion =
  typeof VISUAL_LEXICON_BETA_OPS_GATE_VERSION;

export type BetaOpsGateSeverity = "P0" | "P1" | "P2";

export type BetaOpsPrivateVerdict = "Conditional / Manual-only";

export type BetaOpsPublicVerdict = "No-Go";

export type BetaOpsBlockedVerdict = "Blocked" | "Blocked in this PR";

export type BetaOpsAllowedVerdict = "Allowed when checklist is complete";

export type BetaOpsGateVerdicts = {
  privatePaidBeta: BetaOpsPrivateVerdict;
  publicPaidBeta: BetaOpsPublicVerdict;
  realMonitoringSdkIntegration: "Blocked in this PR";
  realAnalyticsSdkIntegration: "Blocked in this PR";
  realPaymentIntegration: "Blocked";
  realAccountSync: "Blocked";
  ownerControlledManualBetaOps: BetaOpsAllowedVerdict;
};

export type BetaOpsRequirementStatus =
  | "required"
  | "blocked"
  | "disclosure_required"
  | "allowed_when_checklist_complete";

export type BetaOpsRouteSmokePath =
  | "/dashboard"
  | "/review"
  | "/saved"
  | "/packs"
  | "/pricing"
  | "/save?slug=dissonance&source=word_page";

export type BetaOpsMonitoringRequirementId =
  | "manual_monitoring_only"
  | "owner_run_smoke_before_invites"
  | "route_smoke_matrix_required"
  | "console_hydration_capture_required"
  | "manual_issue_log_required"
  | "daily_owner_review_required"
  | "stale_dev_server_mitigation_required";

export type BetaOpsMonitoringRequirement = {
  id: BetaOpsMonitoringRequirementId;
  label: string;
  severity: BetaOpsGateSeverity;
  status: "required";
  manualOnly: true;
  requiredBeforeInvites: true;
  blocksPrivateBetaIfMissing: true;
  requirement: string;
  evidenceRequired: string;
};

export type BetaOpsRouteSmokeRequirement = {
  route: BetaOpsRouteSmokePath;
  label: string;
  requiredBeforeInvites: true;
  recordConsoleErrorCount: true;
  recordHydrationWarningCount: true;
  evidenceRequired: string;
};

export type BetaOpsConsoleHydrationCaptureId =
  | "console_error_count"
  | "hydration_warning_count"
  | "route_load_result"
  | "screenshot_or_video_reference"
  | "stale_dev_server_mitigation";

export type BetaOpsConsoleHydrationCaptureRequirement = {
  id: BetaOpsConsoleHydrationCaptureId;
  label: string;
  requiredBeforeInvites: true;
  recordForEachSmokeRoute: boolean;
  evidenceRequired: string;
};

export type BetaOpsIncidentStatus =
  | "open"
  | "triaged"
  | "paused"
  | "resolved"
  | "wont_fix";

export type BetaOpsIncidentLogEntry = {
  issueId: string;
  participantIdOrAlias: string;
  route: string;
  severity: BetaOpsGateSeverity;
  reproductionSteps: readonly string[];
  browserDevice: string;
  localStorageKeysInvolvedRedacted: readonly string[];
  screenshotVideoReference: string;
  ownerDecision: string;
  status: BetaOpsIncidentStatus;
  resolvedTimestamp: string;
};

export type BetaOpsIncidentLogFieldKey = keyof BetaOpsIncidentLogEntry;

export type BetaOpsIncidentLogField = {
  key: BetaOpsIncidentLogFieldKey;
  label: string;
  required: true;
  redactionRequired?: true;
  notes: string;
};

export type BetaOpsIncidentLogRequirements = {
  manualLogRequired: true;
  requiredBeforeInvites: true;
  requiredFields: readonly BetaOpsIncidentLogField[];
  statusWorkflow: readonly BetaOpsIncidentStatus[];
  localStorageRedaction: {
    recordKeyNamesOnly: true;
    redactValues: true;
    rawLocalStorageDumpsForbidden: true;
  };
  participantIdentifierPolicy: {
    allowAlias: true;
    avoidUnneededPersonalData: true;
  };
};

export type BetaOpsSupportPrivacyRequirementId =
  | "support_contact_defined"
  | "support_response_expectation_defined"
  | "issue_reporting_process_defined"
  | "refund_cancellation_copy_ready"
  | "privacy_copy_ready"
  | "local_state_disclosure_ready"
  | "account_sync_limitation_disclosure_ready"
  | "manual_payment_disclosure_ready"
  | "no_automatic_entitlement_disclosure_ready"
  | "no_raw_payment_data_collected_in_app"
  | "no_provider_tokens_or_secrets_stored"
  | "private_manual_beta_notice_ready"
  | "public_signup_and_public_paid_beta_blocked";

export type BetaOpsSupportPrivacyRequirement = {
  id: BetaOpsSupportPrivacyRequirementId;
  label: string;
  severity: BetaOpsGateSeverity;
  status: BetaOpsRequirementStatus;
  requiredBeforeInvites: true;
  requiredBeforePaymentRequest: boolean;
  blocksPrivateBetaIfMissing: true;
  requirement: string;
  evidenceRequired: string;
};

export type BetaOpsIssueReportingStep = {
  id: string;
  label: string;
  participantInstruction: string;
  ownerAction: string;
};

export type BetaOpsParticipantConsentChecklistItem = {
  id: string;
  label: string;
  requiredBeforeInvites: true;
  consentEvidenceRequired: string;
};

export type BetaOpsOwnerChecklistItem = {
  id: string;
  label: string;
  requiredBeforeInvites: true;
  evidenceRequired: string;
};

export type BetaOpsPauseRollbackCriterion = {
  id: string;
  severity: BetaOpsGateSeverity;
  trigger: string;
  ownerAction: string;
  blocksNewInvites: true;
};

export type BetaOpsOperationalRisk = {
  id: string;
  severity: BetaOpsGateSeverity;
  risk: string;
  mitigation: string;
  publicBetaBlocker: boolean;
};

export type BetaOpsBlockedIntegration = {
  id:
    | "real_monitoring_sdk"
    | "real_analytics_sdk"
    | "real_payment_integration"
    | "real_account_sync"
    | "auth_integration"
    | "database_provider"
    | "api_routes_or_route_handlers"
    | "middleware"
    | "ai_calls"
    | "deployment_or_env_changes";
  label: string;
  verdict: BetaOpsBlockedVerdict;
  implementationAllowedInThisPr: false;
  reason: string;
};

export type BetaOpsNextPR = {
  prNumber: 84 | 85;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realMonitoringSdkImplementationAllowed: false;
  realPaymentImplementationAllowed: false;
  realAccountSyncImplementationAllowed: false;
};

export type BetaOpsSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  monitoringSdkAllowed: false;
  analyticsSdkAllowed: false;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  authIntegrationAllowed: false;
  databaseProviderAllowed: false;
  providerSdkAllowed: false;
  paymentBillingCheckoutAllowed: false;
  entitlementMutationAllowed: false;
  accountSyncAllowed: false;
  realAccountSyncAllowed: false;
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

export type BetaOpsGate = {
  version: VisualLexiconBetaOpsGateVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/monitoring-support-privacy-beta-gate";
  pullRequest: "#83 Monitoring, support, privacy beta gate";
  scope: "Track B monitoring support privacy beta operations gate";
  privateBetaOperationalReadinessVerdict: BetaOpsPrivateVerdict;
  publicBetaOperationalReadinessVerdict: BetaOpsPublicVerdict;
  verdicts: BetaOpsGateVerdicts;
  monitoringMinimumRequirements: readonly BetaOpsMonitoringRequirement[];
  browserSmokeRequirements: readonly BetaOpsRouteSmokeRequirement[];
  consoleHydrationCaptureRequirements: readonly BetaOpsConsoleHydrationCaptureRequirement[];
  incidentLogRequirements: BetaOpsIncidentLogRequirements;
  supportPrivacyRequirements: readonly BetaOpsSupportPrivacyRequirement[];
  issueReportingProcess: readonly BetaOpsIssueReportingStep[];
  betaParticipantConsentChecklist: readonly BetaOpsParticipantConsentChecklistItem[];
  ownerApprovalChecklist: readonly BetaOpsOwnerChecklistItem[];
  pauseRollbackCriteria: readonly BetaOpsPauseRollbackCriterion[];
  operationalRisks: readonly BetaOpsOperationalRisk[];
  blockedIntegrations: readonly BetaOpsBlockedIntegration[];
  nextPRSequence: readonly BetaOpsNextPR[];
  safetyPolicy: BetaOpsSafetyPolicy;
};

export const BETA_OPS_PRIVATE_VERDICT =
  "Conditional / Manual-only" as const satisfies BetaOpsPrivateVerdict;

export const BETA_OPS_PUBLIC_VERDICT =
  "No-Go" as const satisfies BetaOpsPublicVerdict;

export const BETA_OPS_VERDICTS = {
  privatePaidBeta: BETA_OPS_PRIVATE_VERDICT,
  publicPaidBeta: BETA_OPS_PUBLIC_VERDICT,
  realMonitoringSdkIntegration: "Blocked in this PR",
  realAnalyticsSdkIntegration: "Blocked in this PR",
  realPaymentIntegration: "Blocked",
  realAccountSync: "Blocked",
  ownerControlledManualBetaOps: "Allowed when checklist is complete"
} as const satisfies BetaOpsGateVerdicts;

export const BETA_OPS_MONITORING_MINIMUM_REQUIREMENTS = [
  {
    id: "manual_monitoring_only",
    label: "Manual monitoring only",
    severity: "P0",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "This PR defines manual monitoring requirements only and must not add a real monitoring or analytics SDK.",
    evidenceRequired:
      "Code review and dependency scan show no monitoring SDK, analytics SDK, route handler, or provider integration."
  },
  {
    id: "owner_run_smoke_before_invites",
    label: "Owner-run smoke before invites",
    severity: "P0",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Owner records fresh browser smoke evidence before any invited private beta participant receives access.",
    evidenceRequired:
      "Smoke run timestamp, route outcomes, console error counts, hydration warning counts, and owner decision."
  },
  {
    id: "route_smoke_matrix_required",
    label: "Route smoke matrix",
    severity: "P1",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Smoke checks must cover dashboard, review, saved, packs, pricing, and the save landing route.",
    evidenceRequired:
      "Manual QA log includes each required route and result."
  },
  {
    id: "console_hydration_capture_required",
    label: "Console and hydration capture",
    severity: "P1",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Each smoke route records console error count and hydration warning count.",
    evidenceRequired:
      "Manual QA log includes counts for every route, including zero counts."
  },
  {
    id: "manual_issue_log_required",
    label: "Manual issue log",
    severity: "P1",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Owner maintains a single incident log with required fields, severity, status, and redacted local-state notes.",
    evidenceRequired:
      "Issue log template exists with required fields before invites."
  },
  {
    id: "daily_owner_review_required",
    label: "Daily owner review",
    severity: "P1",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Owner reviews support messages and the incident log at least daily during the initial cohort.",
    evidenceRequired:
      "Owner names the review cadence and escalation owner in beta ops notes."
  },
  {
    id: "stale_dev_server_mitigation_required",
    label: "Stale dev server mitigation",
    severity: "P2",
    status: "required",
    manualOnly: true,
    requiredBeforeInvites: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Local QA notes must mitigate stale dev servers by restarting the server before smoke evidence is recorded.",
    evidenceRequired:
      "QA notes include dev server command, port, restart time, and base URL."
  }
] as const satisfies readonly BetaOpsMonitoringRequirement[];

export const BETA_OPS_BROWSER_SMOKE_REQUIREMENTS = [
  {
    route: "/dashboard",
    label: "Dashboard memory mission",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Dashboard loads, Today Memory Mission is visible, and no blocking console or hydration errors are recorded."
  },
  {
    route: "/review",
    label: "Review entry",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Review entry loads and can start the active-recall loop from local state."
  },
  {
    route: "/saved",
    label: "Saved library",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Saved library loads and supports navigation back into review."
  },
  {
    route: "/packs",
    label: "Packs",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Packs route loads local/static pack previews without network secrets or provider calls."
  },
  {
    route: "/pricing",
    label: "Pricing",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Pricing route shows manual beta/payment-link limitations and no checkout or automatic entitlement path."
  },
  {
    route: "/save?slug=dissonance&source=word_page",
    label: "Save landing",
    requiredBeforeInvites: true,
    recordConsoleErrorCount: true,
    recordHydrationWarningCount: true,
    evidenceRequired:
      "Save route creates or preserves local review state for dissonance and can continue into review."
  }
] as const satisfies readonly BetaOpsRouteSmokeRequirement[];

export const BETA_OPS_CONSOLE_HYDRATION_CAPTURE_REQUIREMENTS = [
  {
    id: "console_error_count",
    label: "Console error count",
    requiredBeforeInvites: true,
    recordForEachSmokeRoute: true,
    evidenceRequired:
      "Record the number of browser console errors for every required smoke route, including zero."
  },
  {
    id: "hydration_warning_count",
    label: "Hydration warning count",
    requiredBeforeInvites: true,
    recordForEachSmokeRoute: true,
    evidenceRequired:
      "Record the number of hydration warnings for every required smoke route, including zero."
  },
  {
    id: "route_load_result",
    label: "Route load result",
    requiredBeforeInvites: true,
    recordForEachSmokeRoute: true,
    evidenceRequired:
      "Record pass/fail, HTTP/browser load result, and blocking visual issues for each route."
  },
  {
    id: "screenshot_or_video_reference",
    label: "Screenshot or video reference",
    requiredBeforeInvites: true,
    recordForEachSmokeRoute: false,
    evidenceRequired:
      "Attach a screenshot or video reference when a route fails, shows visible layout breakage, or needs owner review."
  },
  {
    id: "stale_dev_server_mitigation",
    label: "Stale dev server mitigation",
    requiredBeforeInvites: true,
    recordForEachSmokeRoute: false,
    evidenceRequired:
      "Before smoke checks, restart the local dev server and record the command, port, base URL, and timestamp."
  }
] as const satisfies readonly BetaOpsConsoleHydrationCaptureRequirement[];

export const BETA_OPS_INCIDENT_LOG_FIELDS = [
  {
    key: "issueId",
    label: "Issue id",
    required: true,
    notes: "Stable owner-assigned id for support and rollback tracking."
  },
  {
    key: "participantIdOrAlias",
    label: "Participant id or alias",
    required: true,
    notes: "Use an alias when possible; avoid collecting unnecessary personal data."
  },
  {
    key: "route",
    label: "Route",
    required: true,
    notes: "Route or screen where the issue occurred."
  },
  {
    key: "severity",
    label: "Severity",
    required: true,
    notes: "Classify as P0, P1, or P2."
  },
  {
    key: "reproductionSteps",
    label: "Reproduction steps",
    required: true,
    notes: "Steps must be specific enough for owner rerun."
  },
  {
    key: "browserDevice",
    label: "Browser/device",
    required: true,
    notes: "Browser, device, viewport, and operating system when known."
  },
  {
    key: "localStorageKeysInvolvedRedacted",
    label: "localStorage keys involved, redacted",
    required: true,
    redactionRequired: true,
    notes:
      "Record key names only; redact values and never paste raw localStorage dumps."
  },
  {
    key: "screenshotVideoReference",
    label: "Screenshot/video reference if available",
    required: true,
    notes: "Use 'none_available' when no artifact exists."
  },
  {
    key: "ownerDecision",
    label: "Owner decision",
    required: true,
    notes: "Decision to fix, pause, monitor, reject, or defer."
  },
  {
    key: "status",
    label: "Status",
    required: true,
    notes: "One of open, triaged, paused, resolved, or wont_fix."
  },
  {
    key: "resolvedTimestamp",
    label: "Resolved timestamp",
    required: true,
    notes: "Use 'unresolved' until closed."
  }
] as const satisfies readonly BetaOpsIncidentLogField[];

export const BETA_OPS_INCIDENT_LOG_REQUIREMENTS = {
  manualLogRequired: true,
  requiredBeforeInvites: true,
  requiredFields: BETA_OPS_INCIDENT_LOG_FIELDS,
  statusWorkflow: ["open", "triaged", "paused", "resolved", "wont_fix"],
  localStorageRedaction: {
    recordKeyNamesOnly: true,
    redactValues: true,
    rawLocalStorageDumpsForbidden: true
  },
  participantIdentifierPolicy: {
    allowAlias: true,
    avoidUnneededPersonalData: true
  }
} as const satisfies BetaOpsIncidentLogRequirements;

export const BETA_OPS_SUPPORT_PRIVACY_REQUIREMENTS = [
  {
    id: "support_contact_defined",
    label: "Support contact defined",
    severity: "P0",
    status: "required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "A monitored support contact must be defined before beta invites or payment requests.",
    evidenceRequired:
      "Invite, payment request, and support copy include the same support contact."
  },
  {
    id: "support_response_expectation_defined",
    label: "Support response expectation",
    severity: "P1",
    status: "required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participant copy states the expected support response window for private/manual beta.",
    evidenceRequired:
      "Owner-approved copy includes an initial response expectation."
  },
  {
    id: "issue_reporting_process_defined",
    label: "Issue reporting process",
    severity: "P1",
    status: "required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: false,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants know how to report route, review-state, payment, support, privacy, and refund issues.",
    evidenceRequired:
      "Invite/support copy asks for route, browser/device, reproduction steps, and screenshot/video when available."
  },
  {
    id: "refund_cancellation_copy_ready",
    label: "Refund and cancellation copy",
    severity: "P0",
    status: "required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Refund and cancellation wording must be ready before any payment request.",
    evidenceRequired:
      "Payment request copy explains how to request refund or cancellation and who handles it."
  },
  {
    id: "privacy_copy_ready",
    label: "Privacy copy",
    severity: "P0",
    status: "required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participant privacy copy must be ready before invites and payment requests.",
    evidenceRequired:
      "Copy explains local learning state, support messages, external payment handling, and beta limits."
  },
  {
    id: "local_state_disclosure_ready",
    label: "localStorage/local-state disclosure",
    severity: "P1",
    status: "disclosure_required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: false,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants must know review progress and saved words are stored locally in the browser for this beta.",
    evidenceRequired:
      "Copy names local-state limitations and warns that clearing browser data can remove local progress."
  },
  {
    id: "account_sync_limitation_disclosure_ready",
    label: "Account sync limitation disclosure",
    severity: "P1",
    status: "disclosure_required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: false,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants must know real account sync is not implemented and progress does not roam across accounts/devices.",
    evidenceRequired:
      "Copy states account sync is preview/planning only and real sync remains blocked."
  },
  {
    id: "manual_payment_disclosure_ready",
    label: "Manual payment disclosure",
    severity: "P0",
    status: "disclosure_required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants must know payment, if requested, is manual or owner-controlled payment-link only.",
    evidenceRequired:
      "Payment copy says the app has no checkout, subscription, billing portal, or invoice system."
  },
  {
    id: "no_automatic_entitlement_disclosure_ready",
    label: "No automatic entitlement disclosure",
    severity: "P0",
    status: "disclosure_required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants must know no payment link, local plan state, or app event automatically grants paid access.",
    evidenceRequired:
      "Copy states access is owner-confirmed manually and not automatically granted by the app."
  },
  {
    id: "no_raw_payment_data_collected_in_app",
    label: "No raw payment data in app",
    severity: "P0",
    status: "blocked",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "The app must not collect raw payment data, card data, bank data, provider payloads, or webhook payloads.",
    evidenceRequired:
      "Code review and copy confirm payment data is outside the app."
  },
  {
    id: "no_provider_tokens_or_secrets_stored",
    label: "No provider tokens or secrets stored",
    severity: "P0",
    status: "blocked",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Provider tokens, secrets, API keys, auth sessions, and payment credentials must not be stored.",
    evidenceRequired:
      "Code review confirms no token/secret storage and no env var changes."
  },
  {
    id: "private_manual_beta_notice_ready",
    label: "Private/manual beta notice",
    severity: "P1",
    status: "disclosure_required",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Participants must know this is a private, owner-controlled, manual beta.",
    evidenceRequired:
      "Invite and payment copy explicitly say private/manual beta."
  },
  {
    id: "public_signup_and_public_paid_beta_blocked",
    label: "Public signup and public paid beta blocked",
    severity: "P0",
    status: "blocked",
    requiredBeforeInvites: true,
    requiredBeforePaymentRequest: true,
    blocksPrivateBetaIfMissing: true,
    requirement:
      "Public signup and public paid beta remain blocked until later gates clear.",
    evidenceRequired:
      "Owner approval notes state public paid beta is No-Go."
  }
] as const satisfies readonly BetaOpsSupportPrivacyRequirement[];

export const BETA_OPS_ISSUE_REPORTING_PROCESS = [
  {
    id: "participant_reports_support_contact",
    label: "Participant uses support contact",
    participantInstruction:
      "Send the support contact the route, browser/device, what happened, expected behavior, and screenshot/video when available.",
    ownerAction:
      "Create or update the incident log entry with severity, route, owner decision, status, and redacted local-state notes."
  },
  {
    id: "owner_triages_severity",
    label: "Owner triages severity",
    participantInstruction:
      "Flag broken review, lost state, refund/cancellation, privacy, or access issues as urgent.",
    ownerAction:
      "Classify P0/P1/P2 before inviting more participants; pause immediately for P0 triggers."
  },
  {
    id: "owner_records_resolution",
    label: "Owner records resolution",
    participantInstruction:
      "Confirm whether the issue is fixed or still visible after the owner response.",
    ownerAction:
      "Record owner decision, status, resolved timestamp, and retest evidence before closing."
  },
  {
    id: "owner_escalates_pause",
    label: "Owner escalates pause",
    participantInstruction:
      "Stop relying on the affected workflow until the owner confirms it is safe.",
    ownerAction:
      "Pause invites/payment requests when pause or rollback criteria are met."
  }
] as const satisfies readonly BetaOpsIssueReportingStep[];

export const BETA_OPS_PARTICIPANT_CONSENT_CHECKLIST = [
  {
    id: "consent_private_manual_beta",
    label: "Participant understands this is a private/manual beta.",
    requiredBeforeInvites: true,
    consentEvidenceRequired: "Invite acceptance or owner note confirms understanding."
  },
  {
    id: "consent_local_state_limit",
    label: "Participant understands local-state limitations.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Participant copy says progress is local to a browser profile."
  },
  {
    id: "consent_account_sync_missing",
    label: "Participant understands real account sync is not implemented.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Participant copy says progress does not roam across accounts/devices."
  },
  {
    id: "consent_manual_payment_no_auto_access",
    label: "Participant understands manual payment and no automatic entitlement.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Payment copy says access is manually confirmed by the owner."
  },
  {
    id: "consent_support_refund_privacy",
    label: "Participant receives support, refund/cancellation, and privacy copy.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Invite or payment request includes support contact, refund/cancellation wording, and privacy copy."
  },
  {
    id: "consent_issue_reporting",
    label: "Participant knows how to report issues.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Invite copy explains what to include in bug/support reports."
  },
  {
    id: "consent_pause_rollback",
    label: "Participant understands beta access may pause during incidents.",
    requiredBeforeInvites: true,
    consentEvidenceRequired:
      "Beta copy says owner may pause invites, payment links, or access while resolving issues."
  }
] as const satisfies readonly BetaOpsParticipantConsentChecklistItem[];

export const BETA_OPS_OWNER_APPROVAL_CHECKLIST = [
  {
    id: "owner_approve_private_manual_verdict",
    label: "Approve Private paid beta as Conditional / Manual-only.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner sign-off references PR #83 and confirms public paid beta remains No-Go."
  },
  {
    id: "owner_run_required_route_smoke",
    label: "Run required browser smoke routes.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner records pass/fail, console error count, hydration warning count, and evidence for every required route."
  },
  {
    id: "owner_restart_local_dev_server",
    label: "Mitigate stale dev server before local QA.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner records dev server restart command, port, base URL, and timestamp before smoke checks."
  },
  {
    id: "owner_prepare_incident_log",
    label: "Prepare manual incident log.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Incident log template includes every required field and redaction rule."
  },
  {
    id: "owner_define_support_contact_response",
    label: "Define support contact and response expectation.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Participant copy includes support contact and expected response window."
  },
  {
    id: "owner_approve_refund_cancellation_privacy_copy",
    label: "Approve refund/cancellation and privacy copy.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Copy covers local state, account-sync limits, manual payment, no automatic entitlement, and refund/cancellation path."
  },
  {
    id: "owner_confirm_no_forbidden_integrations",
    label: "Confirm forbidden integrations remain absent.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Code review confirms no monitoring SDK, analytics SDK, API routes, auth, DB, payment, account sync, AI calls, env changes, or deployments."
  },
  {
    id: "owner_accept_pause_rollback_criteria",
    label: "Accept pause and rollback criteria.",
    requiredBeforeInvites: true,
    evidenceRequired:
      "Owner records that P0/P1 pause criteria will stop invites and payment requests."
  }
] as const satisfies readonly BetaOpsOwnerChecklistItem[];

export const BETA_OPS_PAUSE_ROLLBACK_CRITERIA = [
  {
    id: "pause_review_loop_broken",
    severity: "P0",
    trigger:
      "Save no longer creates or preserves review items, or review answers stop writing events and memory state.",
    ownerAction:
      "Pause new invites and payment requests; fix locally; rerun required smoke and review-state checks.",
    blocksNewInvites: true
  },
  {
    id: "pause_local_state_loss_pattern",
    severity: "P0",
    trigger:
      "Multiple participants report lost saved words, review state, or review events without a clear local-browser explanation.",
    ownerAction:
      "Pause invites, inspect local-state copy and affected routes, and update participant guidance before resuming.",
    blocksNewInvites: true
  },
  {
    id: "pause_console_or_hydration_blocker",
    severity: "P1",
    trigger:
      "Required smoke routes show blocking console errors, hydration warnings, or route load failures.",
    ownerAction:
      "Stop inviting users until the route is fixed and a fresh smoke rerun is recorded.",
    blocksNewInvites: true
  },
  {
    id: "pause_support_unresponsive",
    severity: "P1",
    trigger:
      "The owner cannot meet the stated support response expectation for P0/P1 reports.",
    ownerAction:
      "Pause invites and payment requests until support coverage is restored.",
    blocksNewInvites: true
  },
  {
    id: "pause_refund_cancellation_or_privacy_gap",
    severity: "P0",
    trigger:
      "Refund/cancellation wording, privacy copy, or local-state/account-sync disclosure is missing, disputed, or confusing to participants.",
    ownerAction:
      "Pause payment requests and invites; correct participant-facing copy; confirm affected participants were informed.",
    blocksNewInvites: true
  },
  {
    id: "pause_public_or_self_serve_exposure",
    severity: "P0",
    trigger:
      "Private beta becomes public signup, public paid beta, self-serve checkout, automatic entitlement, or public invite access.",
    ownerAction:
      "Immediately stop public exposure and return to owner-controlled manual private beta only.",
    blocksNewInvites: true
  },
  {
    id: "pause_forbidden_integration_detected",
    severity: "P0",
    trigger:
      "Monitoring SDK, analytics SDK, auth, DB/provider SDK, API route, route handler, middleware, payment, account sync, AI, env, deployment, secrets, or production data changes appear in this PR.",
    ownerAction:
      "Remove the forbidden integration from this PR and move any approved implementation to a separate explicitly authorized PR.",
    blocksNewInvites: true
  }
] as const satisfies readonly BetaOpsPauseRollbackCriterion[];

export const BETA_OPS_OPERATIONAL_RISKS = [
  {
    id: "p0_public_paid_beta_without_ops",
    severity: "P0",
    risk:
      "Public paid beta launches without monitoring, support, refund, privacy, payment, and account-sync gates.",
    mitigation:
      "Keep public paid beta No-Go; require future public launch gates and owner approval.",
    publicBetaBlocker: true
  },
  {
    id: "p0_learning_state_loss",
    severity: "P0",
    risk:
      "Participants lose local saved words, review events, or SRS state and cannot recover through account sync.",
    mitigation:
      "Disclose local-state limits, monitor issue reports, and pause when repeated state-loss reports appear.",
    publicBetaBlocker: true
  },
  {
    id: "p0_refund_privacy_gap",
    severity: "P0",
    risk:
      "Participants pay or join without clear refund, cancellation, privacy, local-state, or account-sync limitations.",
    mitigation:
      "Require owner-approved copy before any invite or payment request.",
    publicBetaBlocker: true
  },
  {
    id: "p1_console_hydration_escape",
    severity: "P1",
    risk:
      "Console errors or hydration warnings escape manual QA and break core beta routes.",
    mitigation:
      "Record console error and hydration warning counts on each required smoke route.",
    publicBetaBlocker: false
  },
  {
    id: "p1_support_response_delay",
    severity: "P1",
    risk:
      "Owner cannot respond to P0/P1 support reports within the stated beta expectation.",
    mitigation:
      "Pause invites and payment requests until support coverage is restored.",
    publicBetaBlocker: false
  },
  {
    id: "p1_stale_dev_server_evidence",
    severity: "P1",
    risk:
      "Local QA evidence is recorded against a stale dev server and does not match current code.",
    mitigation:
      "Restart the dev server before smoke checks and record command, port, base URL, and timestamp.",
    publicBetaBlocker: false
  },
  {
    id: "p2_copy_polish",
    severity: "P2",
    risk:
      "Private beta copy is technically complete but not yet polished for a larger audience.",
    mitigation:
      "Keep copy owner-reviewed for private beta; polish before public paid beta.",
    publicBetaBlocker: false
  }
] as const satisfies readonly BetaOpsOperationalRisk[];

export const BETA_OPS_BLOCKED_INTEGRATIONS = [
  {
    id: "real_monitoring_sdk",
    label: "Real monitoring SDK integration",
    verdict: "Blocked in this PR",
    implementationAllowedInThisPr: false,
    reason:
      "This PR defines minimum manual monitoring only; production monitoring belongs in a separately approved implementation PR."
  },
  {
    id: "real_analytics_sdk",
    label: "Real analytics SDK integration",
    verdict: "Blocked in this PR",
    implementationAllowedInThisPr: false,
    reason:
      "No analytics SDK or event transport is allowed in this docs/contracts/tests gate."
  },
  {
    id: "real_payment_integration",
    label: "Real payment integration",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "Payment, checkout, subscription, invoice, billing portal, and entitlement mutation remain out of scope."
  },
  {
    id: "real_account_sync",
    label: "Real account sync",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "Account sync remains preview/planning only and must not read, write, or mutate account data in this PR."
  },
  {
    id: "auth_integration",
    label: "Auth integration",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "No auth provider, login behavior, session handling, or account ownership integration is allowed."
  },
  {
    id: "database_provider",
    label: "Database/provider SDK",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "No database, hosted storage, provider SDK, or production data write is allowed."
  },
  {
    id: "api_routes_or_route_handlers",
    label: "API routes or route handlers",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "No API routes, app route handlers, or server mutation surfaces are part of this gate."
  },
  {
    id: "middleware",
    label: "Middleware",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "No routing middleware, auth middleware, or edge behavior is allowed."
  },
  {
    id: "ai_calls",
    label: "AI calls",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "AI tutor or provider calls remain blocked until the SRS loop and beta ops gates are complete."
  },
  {
    id: "deployment_or_env_changes",
    label: "Deployment or env changes",
    verdict: "Blocked",
    implementationAllowedInThisPr: false,
    reason:
      "No deployment settings, env vars, secrets, DNS, Webflow, Cloudflare, Vercel, or production data changes are allowed."
  }
] as const satisfies readonly BetaOpsBlockedIntegration[];

export const BETA_OPS_NEXT_PR_SEQUENCE = [
  {
    prNumber: 84,
    title: "Private beta readiness rerun",
    purpose:
      "Rerun manual QA and evidence after #81-#83 without adding runtime integrations.",
    docsContractsTestsOnlyRecommended: true,
    realMonitoringSdkImplementationAllowed: false,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  },
  {
    prNumber: 85,
    title: "Owner-run private beta launch checklist",
    purpose:
      "Record final owner checklist, cohort readiness, issue-log readiness, support coverage, and launch pause criteria.",
    docsContractsTestsOnlyRecommended: true,
    realMonitoringSdkImplementationAllowed: false,
    realPaymentImplementationAllowed: false,
    realAccountSyncImplementationAllowed: false
  }
] as const satisfies readonly BetaOpsNextPR[];

export const BETA_OPS_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  monitoringSdkAllowed: false,
  analyticsSdkAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  authIntegrationAllowed: false,
  databaseProviderAllowed: false,
  providerSdkAllowed: false,
  paymentBillingCheckoutAllowed: false,
  entitlementMutationAllowed: false,
  accountSyncAllowed: false,
  realAccountSyncAllowed: false,
  aiCallsAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  secretsTouchedAllowed: false,
  productionDataMutationAllowed: false,
  networkCallsAllowed: false,
  browserStorageMutationAllowed: false,
  npmAuditFixAllowed: false
} as const satisfies BetaOpsSafetyPolicy;

export const BETA_OPS_GATE = {
  version: VISUAL_LEXICON_BETA_OPS_GATE_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/monitoring-support-privacy-beta-gate",
  pullRequest: "#83 Monitoring, support, privacy beta gate",
  scope: "Track B monitoring support privacy beta operations gate",
  privateBetaOperationalReadinessVerdict: BETA_OPS_PRIVATE_VERDICT,
  publicBetaOperationalReadinessVerdict: BETA_OPS_PUBLIC_VERDICT,
  verdicts: BETA_OPS_VERDICTS,
  monitoringMinimumRequirements: BETA_OPS_MONITORING_MINIMUM_REQUIREMENTS,
  browserSmokeRequirements: BETA_OPS_BROWSER_SMOKE_REQUIREMENTS,
  consoleHydrationCaptureRequirements:
    BETA_OPS_CONSOLE_HYDRATION_CAPTURE_REQUIREMENTS,
  incidentLogRequirements: BETA_OPS_INCIDENT_LOG_REQUIREMENTS,
  supportPrivacyRequirements: BETA_OPS_SUPPORT_PRIVACY_REQUIREMENTS,
  issueReportingProcess: BETA_OPS_ISSUE_REPORTING_PROCESS,
  betaParticipantConsentChecklist: BETA_OPS_PARTICIPANT_CONSENT_CHECKLIST,
  ownerApprovalChecklist: BETA_OPS_OWNER_APPROVAL_CHECKLIST,
  pauseRollbackCriteria: BETA_OPS_PAUSE_ROLLBACK_CRITERIA,
  operationalRisks: BETA_OPS_OPERATIONAL_RISKS,
  blockedIntegrations: BETA_OPS_BLOCKED_INTEGRATIONS,
  nextPRSequence: BETA_OPS_NEXT_PR_SEQUENCE,
  safetyPolicy: BETA_OPS_SAFETY_POLICY
} as const satisfies BetaOpsGate;

export function getBetaOpsGate() {
  return BETA_OPS_GATE;
}

export function getPrivateBetaOpsVerdict() {
  return BETA_OPS_GATE.privateBetaOperationalReadinessVerdict;
}

export function getPublicBetaOpsVerdict() {
  return BETA_OPS_GATE.publicBetaOperationalReadinessVerdict;
}

export function getMonitoringMinimumRequirements() {
  return BETA_OPS_GATE.monitoringMinimumRequirements;
}

export function getBrowserSmokeRequirements() {
  return BETA_OPS_GATE.browserSmokeRequirements;
}

export function getConsoleHydrationCaptureRequirements() {
  return BETA_OPS_GATE.consoleHydrationCaptureRequirements;
}

export function getSupportPrivacyRequirements() {
  return BETA_OPS_GATE.supportPrivacyRequirements;
}

export function getIncidentLogRequirements() {
  return BETA_OPS_GATE.incidentLogRequirements;
}

export function getIssueReportingProcess() {
  return BETA_OPS_GATE.issueReportingProcess;
}

export function getBetaParticipantConsentChecklist() {
  return BETA_OPS_GATE.betaParticipantConsentChecklist;
}

export function getPauseRollbackCriteria() {
  return BETA_OPS_GATE.pauseRollbackCriteria;
}

export function getOwnerBetaOpsChecklist() {
  return BETA_OPS_GATE.ownerApprovalChecklist;
}

export function getOperationalRisks() {
  return BETA_OPS_GATE.operationalRisks;
}

export function getBlockedBetaOpsIntegrations() {
  return BETA_OPS_GATE.blockedIntegrations;
}

export function getNextBetaOpsPRSequence() {
  return BETA_OPS_GATE.nextPRSequence;
}
