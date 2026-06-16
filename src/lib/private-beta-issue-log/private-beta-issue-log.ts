export const VISUAL_LEXICON_PRIVATE_BETA_ISSUE_LOG_VERSION = 1 as const;

export type PrivateBetaIssueLogVersion =
  typeof VISUAL_LEXICON_PRIVATE_BETA_ISSUE_LOG_VERSION;

export type PrivateBetaIssueLogVerdict =
  | "Conditional / Manual-only"
  | "No-Go";

export type PrivateBetaIssueSeverity = "P0" | "P1" | "P2";

export type PrivateBetaIssueStatus =
  | "new"
  | "triaged"
  | "investigating"
  | "waiting-on-participant"
  | "fixed"
  | "wont-fix-for-beta"
  | "duplicate"
  | "resolved"
  | "beta-blocker";

export type PrivateBetaIssueRoute =
  | "/"
  | "/dashboard"
  | "/saved"
  | "/review"
  | "/review/due"
  | "/review/weak"
  | "/packs"
  | "/packs/[packId]"
  | "/word/[slug]"
  | "/pricing"
  | "/settings"
  | "off-app/manual-payment-or-support"
  | "unknown";

export type PrivateBetaIssueFeatureArea =
  | "payment_entitlement"
  | "account_sync_local_state"
  | "review_srs"
  | "pack_pricing_paywall"
  | "support_refund_privacy"
  | "route_navigation"
  | "browser_device_accessibility"
  | "content_copy";

export type PrivateBetaApprovedLocalStorageKey =
  | "vlx_saved_words_v1"
  | "vlx_review_state_v1"
  | "vlx_review_events_v1"
  | "vlx_daily_stats_v1";

export type PrivateBetaIssueFieldKey =
  | "issueId"
  | "reportedAt"
  | "participantAlias"
  | "participantContactRedacted"
  | "route"
  | "featureArea"
  | "severity"
  | "status"
  | "title"
  | "description"
  | "expectedBehavior"
  | "actualBehavior"
  | "reproductionSteps"
  | "browser"
  | "device"
  | "viewport"
  | "localStorageKeysInvolved"
  | "redactedLocalStateSummary"
  | "screenshotOrVideoReference"
  | "paymentRelated"
  | "entitlementRelated"
  | "accountSyncRelated"
  | "dataLossRisk"
  | "ownerDecision"
  | "assignedOwner"
  | "nextAction"
  | "resolvedAt"
  | "resolutionNotes";

export type PrivateBetaOwnerDecision =
  | "pending-owner-triage"
  | "continue-monitoring"
  | "fix-before-more-invites"
  | "pause-private-beta"
  | "pause-payment-requests"
  | "mark-beta-blocker"
  | "duplicate-existing-issue"
  | "wont-fix-for-beta"
  | "resolved-no-change"
  | "resolved-with-doc-or-code-change"
  | "escalate-to-next-pr";

export type PrivateBetaRedactionBlockedDataType =
  | "raw_payment_data"
  | "provider_tokens"
  | "secrets"
  | "raw_email_address"
  | "raw_local_storage_dump"
  | "unredacted_personal_screenshot";

export type PrivateBetaIssueIntakeField = {
  key: PrivateBetaIssueFieldKey;
  label: string;
  required: true;
  redactionRequired: boolean;
  description: string;
};

export type PrivateBetaIssueSeverityLevel = {
  severity: PrivateBetaIssueSeverity;
  label: string;
  blocksLaunchIfUnresolved: boolean;
  description: string;
  examples: readonly string[];
};

export type PrivateBetaIssueStatusLifecycleItem = {
  status: PrivateBetaIssueStatus;
  label: string;
  description: string;
  terminal: boolean;
  betaBlocking: boolean;
};

export type PrivateBetaIssueRouteTaxonomyItem = {
  id: string;
  route: PrivateBetaIssueRoute;
  label: string;
  expectedFeatureAreas: readonly PrivateBetaIssueFeatureArea[];
  ownerEvidenceHint: string;
};

export type PrivateBetaReproductionStepTemplate = {
  id: string;
  label: string;
  required: true;
  prompt: string;
};

export type PrivateBetaBrowserDeviceField = {
  key: "browser" | "device" | "viewport";
  required: true;
  examples: readonly string[];
  description: string;
};

export type PrivateBetaLocalStorageProbeField = {
  storageKey: PrivateBetaApprovedLocalStorageKey;
  label: string;
  allowedProbeFields: readonly (
    | "key_present"
    | "item_count_only"
    | "slug_or_word_count_when_non_sensitive"
    | "last_updated_time_bucket"
  )[];
  rawValueLoggingAllowed: false;
  participantValueCaptureAllowed: false;
  redactionRequired: true;
  description: string;
};

export type PrivateBetaScreenshotVideoEvidenceField = {
  key: "screenshotOrVideoReference";
  required: true;
  allowedEvidence: readonly string[];
  redactionRequired: true;
  rawPersonalOrPaymentDataAllowed: false;
  description: string;
};

export type PrivateBetaRedactionRule = {
  id: string;
  label: string;
  blockedDataTypes: readonly PrivateBetaRedactionBlockedDataType[];
  publicDocsAllowed: false;
  requiredReplacement: string;
  ownerAction: string;
};

export type PrivateBetaIssueFeatureClassification = {
  id: PrivateBetaIssueFeatureArea;
  label: string;
  defaultSeverity: PrivateBetaIssueSeverity;
  flags: {
    paymentRelated: boolean;
    entitlementRelated: boolean;
    accountSyncRelated: boolean;
    dataLossRisk: boolean;
  };
  examples: readonly string[];
  ownerAction: string;
};

export type PrivateBetaOwnerTriageChecklistItem = {
  id: string;
  label: string;
  requiredForNewIssue: true;
  blocksCloseoutIfMissing: true;
  ownerEvidenceRequired: string;
};

export type PrivateBetaOwnerDecisionOption = {
  decision: PrivateBetaOwnerDecision;
  label: string;
  whenToUse: string;
};

export type PrivateBetaRollbackPauseTrigger = {
  id: string;
  severity: PrivateBetaIssueSeverity;
  issueSignals: readonly string[];
  ownerAction: string;
  pauseInvites: boolean;
  pausePaymentRequests: boolean;
  markBetaBlocker: boolean;
  requiredBeforeResume: string;
};

export type PrivateBetaIssueProcedureItem = {
  id: string;
  label: string;
  required: true;
  ownerAction: string;
};

export type PrivateBetaIssueReviewUsage = {
  id: string;
  cadence: "first_24_hours" | "first_7_days";
  required: true;
  ownerAction: string;
  evidenceRequired: string;
};

export type PrivateBetaIssueLogNextPr = {
  prNumber: 88 | 89 | 90;
  title: string;
  purpose: string;
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  monitoringSdkAllowed: false;
  issueTrackerIntegrationAllowed: false;
};

export type PrivateBetaIssueLogSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  githubIssueCreationAllowed: false;
  githubApiUsageAllowed: false;
  issueTrackerIntegrationAllowed: false;
  monitoringSdkAllowed: false;
  analyticsSdkAllowed: false;
  emailSlackDiscordIntegrationAllowed: false;
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

export type PrivateBetaIssueRecord = {
  issueId: string;
  reportedAt: string;
  participantAlias: string;
  participantContactRedacted: string;
  route: PrivateBetaIssueRoute;
  featureArea: PrivateBetaIssueFeatureArea;
  severity: PrivateBetaIssueSeverity;
  status: PrivateBetaIssueStatus;
  title: string;
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproductionSteps: readonly string[];
  browser: string;
  device: string;
  viewport: string;
  localStorageKeysInvolved: readonly PrivateBetaApprovedLocalStorageKey[];
  redactedLocalStateSummary: string;
  screenshotOrVideoReference: string;
  paymentRelated: boolean;
  entitlementRelated: boolean;
  accountSyncRelated: boolean;
  dataLossRisk: boolean;
  ownerDecision: PrivateBetaOwnerDecision;
  assignedOwner: string;
  nextAction: string;
  resolvedAt: string | null;
  resolutionNotes: string;
};

export type PrivateBetaIssueLogTemplate = {
  version: PrivateBetaIssueLogVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/private-beta-issue-log-template";
  pullRequest: "#87 Private beta issue log template";
  reportDateKst: "2026-06-16";
  scope: "Track B owner-controlled private beta issue log template";
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  currentVerdicts: {
    ownerControlledPrivateBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
  };
  executiveSummary: readonly string[];
  requiredIssueFields: readonly PrivateBetaIssueFieldKey[];
  issueIntakeFields: readonly PrivateBetaIssueIntakeField[];
  severityLevels: readonly PrivateBetaIssueSeverityLevel[];
  statusLifecycle: readonly PrivateBetaIssueStatusLifecycleItem[];
  routeTaxonomy: readonly PrivateBetaIssueRouteTaxonomyItem[];
  reproductionStepsTemplate: readonly PrivateBetaReproductionStepTemplate[];
  browserDeviceFields: readonly PrivateBetaBrowserDeviceField[];
  localStorageProbeFields: readonly PrivateBetaLocalStorageProbeField[];
  screenshotVideoEvidenceFields:
    readonly PrivateBetaScreenshotVideoEvidenceField[];
  redactionRules: readonly PrivateBetaRedactionRule[];
  featureAreaClassifications:
    readonly PrivateBetaIssueFeatureClassification[];
  ownerTriageChecklist: readonly PrivateBetaOwnerTriageChecklistItem[];
  ownerDecisionOptions: readonly PrivateBetaOwnerDecisionOption[];
  rollbackPauseTriggerMapping: readonly PrivateBetaRollbackPauseTrigger[];
  duplicateIssueHandling: readonly PrivateBetaIssueProcedureItem[];
  unresolvedIssueEscalation: readonly PrivateBetaIssueProcedureItem[];
  first24HourReviewUsage: PrivateBetaIssueReviewUsage;
  sevenDayReviewUsage: PrivateBetaIssueReviewUsage;
  closeoutCriteria: readonly PrivateBetaIssueProcedureItem[];
  emptyIssueRecord: PrivateBetaIssueRecord;
  nextIssueLogPRSequence: readonly PrivateBetaIssueLogNextPr[];
  safetyPolicy: PrivateBetaIssueLogSafetyPolicy;
};

export const PRIVATE_BETA_ISSUE_LOG_VERDICT =
  "Conditional / Manual-only" as const satisfies PrivateBetaIssueLogVerdict;

export const PUBLIC_BETA_ISSUE_LOG_VERDICT =
  "No-Go" as const satisfies PrivateBetaIssueLogVerdict;

export const PRIVATE_BETA_ISSUE_LOG_EXECUTIVE_SUMMARY = [
  "This template is the owner-run issue log for a small Visual Lexicon Track B private beta.",
  "The owner-controlled private beta remains Conditional / Manual-only, and public paid beta remains No-Go.",
  "Issue records must classify severity, route, feature area, redacted evidence, owner decision, and pause or rollback impact without creating external issues automatically."
] as const;

export const PRIVATE_BETA_REQUIRED_ISSUE_FIELDS = [
  "issueId",
  "reportedAt",
  "participantAlias",
  "participantContactRedacted",
  "route",
  "featureArea",
  "severity",
  "status",
  "title",
  "description",
  "expectedBehavior",
  "actualBehavior",
  "reproductionSteps",
  "browser",
  "device",
  "viewport",
  "localStorageKeysInvolved",
  "redactedLocalStateSummary",
  "screenshotOrVideoReference",
  "paymentRelated",
  "entitlementRelated",
  "accountSyncRelated",
  "dataLossRisk",
  "ownerDecision",
  "assignedOwner",
  "nextAction",
  "resolvedAt",
  "resolutionNotes"
] as const satisfies readonly PrivateBetaIssueFieldKey[];

export const PRIVATE_BETA_ISSUE_INTAKE_FIELDS = [
  {
    key: "issueId",
    label: "Issue ID",
    required: true,
    redactionRequired: false,
    description:
      "Stable owner-assigned ID such as VLX-BETA-0001. Do not use participant names in the ID."
  },
  {
    key: "reportedAt",
    label: "Reported at",
    required: true,
    redactionRequired: false,
    description: "ISO timestamp when the owner received the report."
  },
  {
    key: "participantAlias",
    label: "Participant alias",
    required: true,
    redactionRequired: true,
    description:
      "Owner-safe alias such as participant-003. Do not use a public name."
  },
  {
    key: "participantContactRedacted",
    label: "Participant contact, redacted",
    required: true,
    redactionRequired: true,
    description:
      "Reference a redacted contact handle or owner-private roster row, not a raw email address."
  },
  {
    key: "route",
    label: "Route",
    required: true,
    redactionRequired: false,
    description: "Use the approved route taxonomy or off-app manual channel."
  },
  {
    key: "featureArea",
    label: "Feature area",
    required: true,
    redactionRequired: false,
    description:
      "Classify as payment/entitlement, local state, review/SRS, pack/pricing/paywall, support/refund/privacy, route, accessibility, or copy."
  },
  {
    key: "severity",
    label: "Severity",
    required: true,
    redactionRequired: false,
    description: "P0, P1, or P2 based on launch impact and learner risk."
  },
  {
    key: "status",
    label: "Status",
    required: true,
    redactionRequired: false,
    description: "Lifecycle status from new through resolved or beta-blocker."
  },
  {
    key: "title",
    label: "Title",
    required: true,
    redactionRequired: true,
    description: "Short issue title with no personal data."
  },
  {
    key: "description",
    label: "Description",
    required: true,
    redactionRequired: true,
    description:
      "Concise report summary with personal, payment, and raw storage details removed."
  },
  {
    key: "expectedBehavior",
    label: "Expected behavior",
    required: true,
    redactionRequired: false,
    description: "What the participant or owner expected to happen."
  },
  {
    key: "actualBehavior",
    label: "Actual behavior",
    required: true,
    redactionRequired: true,
    description:
      "What happened instead, with sensitive content summarized rather than pasted."
  },
  {
    key: "reproductionSteps",
    label: "Reproduction steps",
    required: true,
    redactionRequired: true,
    description:
      "Numbered steps that let the owner reproduce the issue without exposing secrets or raw participant data."
  },
  {
    key: "browser",
    label: "Browser",
    required: true,
    redactionRequired: false,
    description: "Browser name and version when available."
  },
  {
    key: "device",
    label: "Device",
    required: true,
    redactionRequired: false,
    description: "Device, OS, and input mode when relevant."
  },
  {
    key: "viewport",
    label: "Viewport",
    required: true,
    redactionRequired: false,
    description: "Viewport size or breakpoint such as mobile, tablet, desktop."
  },
  {
    key: "localStorageKeysInvolved",
    label: "localStorage keys involved",
    required: true,
    redactionRequired: false,
    description:
      "Only approved Visual Lexicon storage keys; record key presence or counts, not raw values."
  },
  {
    key: "redactedLocalStateSummary",
    label: "Redacted local-state summary",
    required: true,
    redactionRequired: true,
    description:
      "Summarize state symptoms, key presence, and counts without raw localStorage dumps."
  },
  {
    key: "screenshotOrVideoReference",
    label: "Screenshot or video reference",
    required: true,
    redactionRequired: true,
    description:
      "Reference a manually redacted screenshot/video filename or private owner note."
  },
  {
    key: "paymentRelated",
    label: "Payment related",
    required: true,
    redactionRequired: false,
    description:
      "True when the issue touches manual payment, payment copy, refund, cancellation, or payment-link confusion."
  },
  {
    key: "entitlementRelated",
    label: "Entitlement related",
    required: true,
    redactionRequired: false,
    description:
      "True when the issue touches access, manual entitlement, or no automatic grant expectations."
  },
  {
    key: "accountSyncRelated",
    label: "Account sync related",
    required: true,
    redactionRequired: false,
    description:
      "True when the issue touches local-state limits, cross-device expectations, backup, restore, or account sync assumptions."
  },
  {
    key: "dataLossRisk",
    label: "Data loss risk",
    required: true,
    redactionRequired: false,
    description:
      "True when saved words, review state, review events, or daily stats could be lost or misrepresented."
  },
  {
    key: "ownerDecision",
    label: "Owner decision",
    required: true,
    redactionRequired: false,
    description:
      "Current owner decision: continue, fix, pause, duplicate, beta-blocker, resolved, or escalate."
  },
  {
    key: "assignedOwner",
    label: "Assigned owner",
    required: true,
    redactionRequired: false,
    description: "Owner or responsible role; do not list participant contact."
  },
  {
    key: "nextAction",
    label: "Next action",
    required: true,
    redactionRequired: true,
    description: "Concrete next step and evidence needed before status changes."
  },
  {
    key: "resolvedAt",
    label: "Resolved at",
    required: true,
    redactionRequired: false,
    description:
      "ISO timestamp when resolved; leave null in the typed template until resolved."
  },
  {
    key: "resolutionNotes",
    label: "Resolution notes",
    required: true,
    redactionRequired: true,
    description:
      "Final result, validation evidence, and participant notification note with sensitive data removed."
  }
] as const satisfies readonly PrivateBetaIssueIntakeField[];

export const PRIVATE_BETA_ISSUE_SEVERITY_LEVELS = [
  {
    severity: "P0",
    label: "Launch blocker",
    blocksLaunchIfUnresolved: true,
    description:
      "Blocks launch, risks data loss, creates payment/entitlement confusion, raises privacy concerns, or means a participant cannot review/save.",
    examples: [
      "cannot save a word",
      "cannot answer review",
      "review answers do not update memory state",
      "raw personal or payment data exposed",
      "participant believes payment grants automatic entitlement"
    ]
  },
  {
    severity: "P1",
    label: "Major private beta risk",
    blocksLaunchIfUnresolved: true,
    description:
      "Major learning loop break, repeated route errors, broken paywall explanation, or severe mobile/accessibility issue.",
    examples: [
      "repeated route errors on /dashboard or /review",
      "weak review does not derive from real state",
      "paywall copy implies public checkout",
      "mobile layout blocks review submission"
    ]
  },
  {
    severity: "P2",
    label: "Non-blocking polish",
    blocksLaunchIfUnresolved: false,
    description:
      "Polish, confusing copy, non-blocking layout issue, or minor empty-state issue.",
    examples: [
      "wording is mildly confusing",
      "spacing issue that does not block action",
      "minor empty-state copy improvement"
    ]
  }
] as const satisfies readonly PrivateBetaIssueSeverityLevel[];

export const PRIVATE_BETA_ISSUE_STATUS_LIFECYCLE = [
  {
    status: "new",
    label: "New",
    description: "Report has been received but not triaged.",
    terminal: false,
    betaBlocking: false
  },
  {
    status: "triaged",
    label: "Triaged",
    description: "Severity, route, feature area, and redaction status are set.",
    terminal: false,
    betaBlocking: false
  },
  {
    status: "investigating",
    label: "Investigating",
    description: "Owner is reproducing or gathering missing evidence.",
    terminal: false,
    betaBlocking: false
  },
  {
    status: "waiting-on-participant",
    label: "Waiting on participant",
    description:
      "Owner needs redacted steps, device/browser context, or evidence from the participant.",
    terminal: false,
    betaBlocking: false
  },
  {
    status: "fixed",
    label: "Fixed",
    description: "Fix or doc update is ready and awaiting verification.",
    terminal: false,
    betaBlocking: false
  },
  {
    status: "wont-fix-for-beta",
    label: "Won't fix for beta",
    description:
      "Owner explicitly accepts this as non-blocking for the private beta.",
    terminal: true,
    betaBlocking: false
  },
  {
    status: "duplicate",
    label: "Duplicate",
    description: "Issue points to an existing issue ID and inherits its outcome.",
    terminal: true,
    betaBlocking: false
  },
  {
    status: "resolved",
    label: "Resolved",
    description:
      "Owner verified the issue is closed, documented, and safe for the beta decision.",
    terminal: true,
    betaBlocking: false
  },
  {
    status: "beta-blocker",
    label: "Beta blocker",
    description:
      "Issue blocks more invites, payment requests, or beta continuation until resolved.",
    terminal: false,
    betaBlocking: true
  }
] as const satisfies readonly PrivateBetaIssueStatusLifecycleItem[];

export const PRIVATE_BETA_ISSUE_ROUTE_TAXONOMY = [
  {
    id: "route_home",
    route: "/",
    label: "Home",
    expectedFeatureAreas: ["route_navigation", "content_copy"],
    ownerEvidenceHint: "Record whether the home route loads and links into Track B."
  },
  {
    id: "route_dashboard",
    route: "/dashboard",
    label: "Dashboard",
    expectedFeatureAreas: ["review_srs", "route_navigation"],
    ownerEvidenceHint:
      "Record Today Memory Mission behavior and whether state-derived counts look credible."
  },
  {
    id: "route_saved",
    route: "/saved",
    label: "Saved library",
    expectedFeatureAreas: ["review_srs", "account_sync_local_state"],
    ownerEvidenceHint:
      "Record saved-word visibility and whether saved words remain reviewable."
  },
  {
    id: "route_review",
    route: "/review",
    label: "Review",
    expectedFeatureAreas: ["review_srs"],
    ownerEvidenceHint:
      "Record active-recall prompt, answer result, event write, and memory-state update."
  },
  {
    id: "route_review_due",
    route: "/review/due",
    label: "Due review",
    expectedFeatureAreas: ["review_srs"],
    ownerEvidenceHint: "Record whether due words derive from real nextDueAt state."
  },
  {
    id: "route_review_weak",
    route: "/review/weak",
    label: "Weak review",
    expectedFeatureAreas: ["review_srs"],
    ownerEvidenceHint:
      "Record whether weak words derive from real weakScore and mistake history."
  },
  {
    id: "route_packs",
    route: "/packs",
    label: "Packs",
    expectedFeatureAreas: ["pack_pricing_paywall", "route_navigation"],
    ownerEvidenceHint: "Record pack list visibility and no provider-secret exposure."
  },
  {
    id: "route_pack_detail",
    route: "/packs/[packId]",
    label: "Pack detail",
    expectedFeatureAreas: ["pack_pricing_paywall", "review_srs"],
    ownerEvidenceHint: "Record pack preview, progress, and review entry behavior."
  },
  {
    id: "route_word_detail",
    route: "/word/[slug]",
    label: "Word detail",
    expectedFeatureAreas: ["review_srs", "account_sync_local_state"],
    ownerEvidenceHint: "Record save behavior and memory-state panel behavior."
  },
  {
    id: "route_pricing",
    route: "/pricing",
    label: "Pricing",
    expectedFeatureAreas: [
      "pack_pricing_paywall",
      "payment_entitlement",
      "support_refund_privacy"
    ],
    ownerEvidenceHint:
      "Record whether copy stays manual/payment-link-only and avoids checkout claims."
  },
  {
    id: "route_settings",
    route: "/settings",
    label: "Settings",
    expectedFeatureAreas: ["support_refund_privacy", "account_sync_local_state"],
    ownerEvidenceHint:
      "Record whether privacy/local-state support copy is clear and non-misleading."
  },
  {
    id: "route_off_app_manual",
    route: "off-app/manual-payment-or-support",
    label: "Off-app manual payment or support",
    expectedFeatureAreas: ["payment_entitlement", "support_refund_privacy"],
    ownerEvidenceHint:
      "Record only redacted owner notes for manual support, refund, privacy, or payment-link reports."
  },
  {
    id: "route_unknown",
    route: "unknown",
    label: "Unknown route",
    expectedFeatureAreas: ["route_navigation"],
    ownerEvidenceHint: "Use only until the owner can identify the affected route."
  }
] as const satisfies readonly PrivateBetaIssueRouteTaxonomyItem[];

export const PRIVATE_BETA_REPRODUCTION_STEPS_TEMPLATE = [
  {
    id: "repro_starting_context",
    label: "Starting context",
    required: true,
    prompt:
      "Which owner-approved access path, route, browser profile, and starting state were used?"
  },
  {
    id: "repro_actions",
    label: "Actions",
    required: true,
    prompt:
      "List each click, navigation, save, review answer, pack action, or settings change in order."
  },
  {
    id: "repro_expected",
    label: "Expected behavior",
    required: true,
    prompt: "What should have happened according to the beta instructions?"
  },
  {
    id: "repro_actual",
    label: "Actual behavior",
    required: true,
    prompt: "What happened instead, without pasting personal data or raw storage?"
  },
  {
    id: "repro_repeatability",
    label: "Repeatability",
    required: true,
    prompt:
      "Did it happen once, every time, after refresh, after a new session, or after clearing site data?"
  }
] as const satisfies readonly PrivateBetaReproductionStepTemplate[];

export const PRIVATE_BETA_BROWSER_DEVICE_FIELDS = [
  {
    key: "browser",
    required: true,
    examples: ["Chrome 126", "Safari 18", "Firefox 127", "Edge 126"],
    description: "Record browser and version when available."
  },
  {
    key: "device",
    required: true,
    examples: ["iPhone 15 iOS", "Android phone", "Windows laptop", "MacBook"],
    description: "Record OS, device class, and input mode when relevant."
  },
  {
    key: "viewport",
    required: true,
    examples: ["390x844", "768x1024", "1440x900", "mobile breakpoint"],
    description:
      "Record viewport dimensions or breakpoint for layout, keyboard, and accessibility issues."
  }
] as const satisfies readonly PrivateBetaBrowserDeviceField[];

export const PRIVATE_BETA_LOCAL_STORAGE_PROBE_FIELDS = [
  {
    storageKey: "vlx_saved_words_v1",
    label: "Saved words",
    allowedProbeFields: [
      "key_present",
      "item_count_only",
      "slug_or_word_count_when_non_sensitive",
      "last_updated_time_bucket"
    ],
    rawValueLoggingAllowed: false,
    participantValueCaptureAllowed: false,
    redactionRequired: true,
    description:
      "Record whether saved words exist and counts changed; do not paste saved word payloads."
  },
  {
    storageKey: "vlx_review_state_v1",
    label: "Review state",
    allowedProbeFields: [
      "key_present",
      "item_count_only",
      "slug_or_word_count_when_non_sensitive",
      "last_updated_time_bucket"
    ],
    rawValueLoggingAllowed: false,
    participantValueCaptureAllowed: false,
    redactionRequired: true,
    description:
      "Record whether memory state exists and count changes after save/review; do not paste state JSON."
  },
  {
    storageKey: "vlx_review_events_v1",
    label: "Review events",
    allowedProbeFields: [
      "key_present",
      "item_count_only",
      "last_updated_time_bucket"
    ],
    rawValueLoggingAllowed: false,
    participantValueCaptureAllowed: false,
    redactionRequired: true,
    description:
      "Record whether event count increases after answering; do not paste answer event payloads."
  },
  {
    storageKey: "vlx_daily_stats_v1",
    label: "Daily stats",
    allowedProbeFields: [
      "key_present",
      "item_count_only",
      "last_updated_time_bucket"
    ],
    rawValueLoggingAllowed: false,
    participantValueCaptureAllowed: false,
    redactionRequired: true,
    description:
      "Record whether daily stats update from review activity; do not paste full stats payloads."
  }
] as const satisfies readonly PrivateBetaLocalStorageProbeField[];

export const PRIVATE_BETA_SCREENSHOT_VIDEO_EVIDENCE_FIELDS = [
  {
    key: "screenshotOrVideoReference",
    required: true,
    allowedEvidence: [
      "redacted screenshot filename",
      "redacted video filename",
      "owner-private evidence note",
      "not provided"
    ],
    redactionRequired: true,
    rawPersonalOrPaymentDataAllowed: false,
    description:
      "Evidence may show visible issue symptoms only after personal, payment, and raw storage data are manually redacted."
  }
] as const satisfies readonly PrivateBetaScreenshotVideoEvidenceField[];

export const PRIVATE_BETA_ISSUE_REDACTION_RULES = [
  {
    id: "redact_raw_payment_data",
    label: "No raw payment data",
    blockedDataTypes: ["raw_payment_data"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use paymentRelated: true and a short redacted summary such as payment-link confusion.",
    ownerAction:
      "Remove card, invoice, receipt, account, transaction, or provider details before adding evidence."
  },
  {
    id: "redact_provider_tokens",
    label: "No provider tokens",
    blockedDataTypes: ["provider_tokens"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use a redacted note that provider credentials or tokens were not captured.",
    ownerAction:
      "Delete token-bearing evidence from public docs and keep provider credentials outside this repo."
  },
  {
    id: "redact_secrets",
    label: "No secrets",
    blockedDataTypes: ["secrets"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use a generic secret-redacted note with no key, token, cookie, or credential values.",
    ownerAction:
      "Stop triage and remove the secret from any issue evidence before continuing."
  },
  {
    id: "redact_raw_email_address",
    label: "No raw email address in public docs",
    blockedDataTypes: ["raw_email_address"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use participantAlias and participantContactRedacted instead of a raw contact.",
    ownerAction:
      "Replace emails with participant aliases or owner-private roster references."
  },
  {
    id: "redact_raw_local_storage_dump",
    label: "No raw localStorage dump",
    blockedDataTypes: ["raw_local_storage_dump"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use approved key names, key presence, item counts, and redacted symptom summary only.",
    ownerAction:
      "Delete raw browser storage dumps from public docs and keep only redacted summaries."
  },
  {
    id: "redact_personal_screenshot_or_video",
    label: "No unredacted personal/payment screenshots or videos",
    blockedDataTypes: ["unredacted_personal_screenshot"],
    publicDocsAllowed: false,
    requiredReplacement:
      "Use a manually redacted screenshot/video reference or owner-private note.",
    ownerAction:
      "Blur or crop visible personal, support, payment, account, and browser data before referencing evidence."
  }
] as const satisfies readonly PrivateBetaRedactionRule[];

export const PRIVATE_BETA_FEATURE_AREA_CLASSIFICATIONS = [
  {
    id: "payment_entitlement",
    label: "Payment / entitlement",
    defaultSeverity: "P0",
    flags: {
      paymentRelated: true,
      entitlementRelated: true,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: [
      "manual payment copy is unclear",
      "participant expects automatic entitlement",
      "refund or cancellation path is unclear"
    ],
    ownerAction:
      "Pause payment requests for affected participants until manual/payment-link-only and no-automatic-entitlement copy is corrected."
  },
  {
    id: "account_sync_local_state",
    label: "Account sync / local state",
    defaultSeverity: "P0",
    flags: {
      paymentRelated: false,
      entitlementRelated: false,
      accountSyncRelated: true,
      dataLossRisk: true
    },
    examples: [
      "participant expects cross-device progress",
      "saved words vanish after profile change",
      "local-state limitation copy is missing"
    ],
    ownerAction:
      "Confirm no real account sync is promised and record only redacted local-state key presence/counts."
  },
  {
    id: "review_srs",
    label: "Review / SRS",
    defaultSeverity: "P0",
    flags: {
      paymentRelated: false,
      entitlementRelated: false,
      accountSyncRelated: false,
      dataLossRisk: true
    },
    examples: [
      "review answers do not create events",
      "Due or Weak does not derive from real state",
      "mastery appears fake or premature"
    ],
    ownerAction:
      "Treat broken save, review, due, weak, event write, or memory-state update as a beta blocker until fixed."
  },
  {
    id: "pack_pricing_paywall",
    label: "Pack / pricing / paywall",
    defaultSeverity: "P1",
    flags: {
      paymentRelated: true,
      entitlementRelated: true,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: [
      "pack preview misstates access",
      "pricing copy implies public paid beta",
      "paywall explanation is broken"
    ],
    ownerAction:
      "Correct copy before more invites if participants may misunderstand access, pricing, or payment boundaries."
  },
  {
    id: "support_refund_privacy",
    label: "Support / refund / privacy",
    defaultSeverity: "P0",
    flags: {
      paymentRelated: true,
      entitlementRelated: false,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: [
      "support contact is missing",
      "refund terms are unclear",
      "privacy/localStorage disclosure is missing"
    ],
    ownerAction:
      "Pause invites or payment requests until support, refund, cancellation, and privacy copy is clear."
  },
  {
    id: "route_navigation",
    label: "Route / navigation",
    defaultSeverity: "P1",
    flags: {
      paymentRelated: false,
      entitlementRelated: false,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: ["route does not load", "navigation traps participant", "404 on approved route"],
    ownerAction:
      "Classify as P0 if the route blocks save, review, pricing clarity, support, or privacy."
  },
  {
    id: "browser_device_accessibility",
    label: "Browser / device / accessibility",
    defaultSeverity: "P1",
    flags: {
      paymentRelated: false,
      entitlementRelated: false,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: [
      "mobile review button is unreachable",
      "keyboard cannot submit answer",
      "severe viewport overlap"
    ],
    ownerAction:
      "Record browser, device, viewport, and whether the issue blocks the learning loop."
  },
  {
    id: "content_copy",
    label: "Content / copy",
    defaultSeverity: "P2",
    flags: {
      paymentRelated: false,
      entitlementRelated: false,
      accountSyncRelated: false,
      dataLossRisk: false
    },
    examples: ["minor confusing copy", "empty-state wording needs polish"],
    ownerAction:
      "Fix or accept for beta based on whether copy creates payment, privacy, account-sync, or review confusion."
  }
] as const satisfies readonly PrivateBetaIssueFeatureClassification[];

export const PRIVATE_BETA_OWNER_TRIAGE_CHECKLIST = [
  {
    id: "triage_assign_issue_id",
    label: "Assign stable issue ID and redacted participant alias.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "Issue has issueId, reportedAt, participantAlias, and participantContactRedacted."
  },
  {
    id: "triage_confirm_redaction",
    label: "Confirm report and evidence are redacted.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "No raw payment data, provider tokens, secrets, raw email, raw localStorage dump, or unredacted personal screenshot remains."
  },
  {
    id: "triage_classify_feature_route_severity",
    label: "Classify route, feature area, severity, and status.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "Route taxonomy, featureArea, severity, and status fields are filled."
  },
  {
    id: "triage_capture_reproduction_context",
    label: "Capture reproduction, browser, device, viewport, and redacted evidence.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "Reproduction steps, browser/device fields, and evidence reference are present or explicitly not provided."
  },
  {
    id: "triage_probe_local_state_safely",
    label: "Probe local state safely when relevant.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "Approved storage key names and redacted key presence/counts are recorded when state is involved."
  },
  {
    id: "triage_decide_pause_or_continue",
    label: "Record owner decision and pause/rollback impact.",
    requiredForNewIssue: true,
    blocksCloseoutIfMissing: true,
    ownerEvidenceRequired:
      "ownerDecision, assignedOwner, nextAction, and rollback/pause trigger review are complete."
  }
] as const satisfies readonly PrivateBetaOwnerTriageChecklistItem[];

export const PRIVATE_BETA_OWNER_DECISION_OPTIONS = [
  {
    decision: "pending-owner-triage",
    label: "Pending owner triage",
    whenToUse: "Use immediately after intake before severity and route are confirmed."
  },
  {
    decision: "continue-monitoring",
    label: "Continue monitoring",
    whenToUse: "Use for non-blocking P2 reports that do not confuse payment, privacy, account sync, or review."
  },
  {
    decision: "fix-before-more-invites",
    label: "Fix before more invites",
    whenToUse: "Use for P0/P1 issues that do not require stopping existing participant access."
  },
  {
    decision: "pause-private-beta",
    label: "Pause private beta",
    whenToUse: "Use when invites or participant access should stop until the issue is resolved."
  },
  {
    decision: "pause-payment-requests",
    label: "Pause payment requests",
    whenToUse: "Use when payment, refund, support, privacy, or entitlement copy is unclear."
  },
  {
    decision: "mark-beta-blocker",
    label: "Mark beta blocker",
    whenToUse: "Use when the issue must be resolved before launch, continuation, or expansion."
  },
  {
    decision: "duplicate-existing-issue",
    label: "Duplicate existing issue",
    whenToUse: "Use when this report maps to an existing issue ID."
  },
  {
    decision: "wont-fix-for-beta",
    label: "Won't fix for beta",
    whenToUse: "Use only when owner explicitly accepts the risk as non-blocking for this beta."
  },
  {
    decision: "resolved-no-change",
    label: "Resolved with no change",
    whenToUse: "Use when evidence shows the report is not reproducible or already covered."
  },
  {
    decision: "resolved-with-doc-or-code-change",
    label: "Resolved with doc or code change",
    whenToUse: "Use after a verified change resolves the issue."
  },
  {
    decision: "escalate-to-next-pr",
    label: "Escalate to next PR",
    whenToUse: "Use when the issue requires explicit owner signoff or dry-run evidence."
  }
] as const satisfies readonly PrivateBetaOwnerDecisionOption[];

export const PRIVATE_BETA_ROLLBACK_PAUSE_TRIGGER_MAPPING = [
  {
    id: "pause_on_broken_save_or_review",
    severity: "P0",
    issueSignals: [
      "cannot save a word",
      "saved word does not become reviewable",
      "review answer does not create event",
      "memory state does not update"
    ],
    ownerAction:
      "Pause invites and payment requests, mark beta-blocker, fix, and rerun save/review smoke before resuming.",
    pauseInvites: true,
    pausePaymentRequests: true,
    markBetaBlocker: true,
    requiredBeforeResume:
      "Fresh evidence that save creates or preserves review state and review answers write events."
  },
  {
    id: "pause_on_payment_or_entitlement_confusion",
    severity: "P0",
    issueSignals: [
      "participant believes payment grants automatic entitlement",
      "copy implies checkout or subscription",
      "refund/cancellation path is unclear"
    ],
    ownerAction:
      "Pause payment requests, correct manual/payment-link-only and no automatic entitlement copy, and notify affected participants.",
    pauseInvites: false,
    pausePaymentRequests: true,
    markBetaBlocker: true,
    requiredBeforeResume:
      "Owner-approved support, refund, cancellation, payment, and entitlement copy is updated."
  },
  {
    id: "pause_on_privacy_or_redaction_gap",
    severity: "P0",
    issueSignals: [
      "raw payment data captured",
      "provider token exposed",
      "secret exposed",
      "raw localStorage dump pasted",
      "unredacted personal screenshot referenced"
    ],
    ownerAction:
      "Pause triage, remove sensitive evidence from public docs, and continue only with redacted summaries.",
    pauseInvites: true,
    pausePaymentRequests: true,
    markBetaBlocker: true,
    requiredBeforeResume:
      "Evidence is redacted and owner confirms no secrets, raw payment data, or raw storage dumps remain."
  },
  {
    id: "pause_on_repeated_state_loss",
    severity: "P0",
    issueSignals: [
      "multiple participants report lost saved words",
      "review state disappears",
      "daily stats reset unexpectedly",
      "account sync was assumed"
    ],
    ownerAction:
      "Pause expansion, review local-state copy, and clarify no real account sync before inviting more participants.",
    pauseInvites: true,
    pausePaymentRequests: false,
    markBetaBlocker: true,
    requiredBeforeResume:
      "Local-state limitation copy is corrected and smoke evidence covers approved storage keys."
  },
  {
    id: "pause_on_repeated_route_mobile_accessibility_break",
    severity: "P1",
    issueSignals: [
      "same approved route fails repeatedly",
      "mobile layout blocks review",
      "keyboard flow cannot complete review",
      "paywall explanation is unreadable"
    ],
    ownerAction:
      "Stop additional invites until route/mobile/accessibility evidence is fixed or owner-accepted.",
    pauseInvites: true,
    pausePaymentRequests: false,
    markBetaBlocker: false,
    requiredBeforeResume:
      "Fresh route, mobile, and keyboard smoke notes show the issue is fixed or accepted as non-blocking."
  }
] as const satisfies readonly PrivateBetaRollbackPauseTrigger[];

export const PRIVATE_BETA_DUPLICATE_ISSUE_HANDLING = [
  {
    id: "duplicate_link_original_issue",
    label: "Link original issue ID",
    required: true,
    ownerAction:
      "Set status to duplicate, add the original issue ID to resolutionNotes, and inherit severity from the original unless the new report increases impact."
  },
  {
    id: "duplicate_preserve_new_evidence",
    label: "Preserve new redacted evidence",
    required: true,
    ownerAction:
      "Keep only new redacted route, browser/device, reproduction, or local-state evidence that improves the original issue."
  },
  {
    id: "duplicate_do_not_close_original",
    label: "Do not close the original early",
    required: true,
    ownerAction:
      "The original issue remains open until its own closeout criteria are met."
  }
] as const satisfies readonly PrivateBetaIssueProcedureItem[];

export const PRIVATE_BETA_UNRESOLVED_ISSUE_ESCALATION = [
  {
    id: "escalate_p0_immediately",
    label: "Escalate P0 immediately",
    required: true,
    ownerAction:
      "Mark beta-blocker, pause affected invites/payment requests, and require owner decision before continuation."
  },
  {
    id: "escalate_repeated_p1",
    label: "Escalate repeated P1 issues",
    required: true,
    ownerAction:
      "If the same P1 pattern repeats across participants or routes, treat it as beta-blocking until fixed or owner-accepted."
  },
  {
    id: "escalate_waiting_more_than_48_hours",
    label: "Escalate stale participant follow-up",
    required: true,
    ownerAction:
      "If waiting-on-participant blocks a beta decision for more than 48 hours, owner decides whether to close, keep monitoring, or pause."
  },
  {
    id: "escalate_before_final_signoff",
    label: "Escalate unresolved issues before final signoff",
    required: true,
    ownerAction:
      "Every unresolved P0/P1 must be listed in the owner final signoff decision before PR #88."
  }
] as const satisfies readonly PrivateBetaIssueProcedureItem[];

export const PRIVATE_BETA_FIRST_24_HOUR_REVIEW_USAGE = {
  id: "first_24_hour_issue_log_review",
  cadence: "first_24_hours",
  required: true,
  ownerAction:
    "Review all new issues from the first day, count P0/P1/P2 by feature area, and decide whether to continue, pause, or stop more invites.",
  evidenceRequired:
    "Issue counts, unresolved beta blockers, support/payment/privacy concerns, and owner continue/pause decision."
} as const satisfies PrivateBetaIssueReviewUsage;

export const PRIVATE_BETA_SEVEN_DAY_REVIEW_USAGE = {
  id: "seven_day_issue_log_review",
  cadence: "first_7_days",
  required: true,
  ownerAction:
    "Review the first week of issue patterns against Weekly Reviewed Words, learning-loop health, support load, state-loss risk, and payment/privacy clarity.",
  evidenceRequired:
    "Open/closed counts, repeated issue patterns, unresolved P0/P1 list, review behavior notes, and owner continuation decision."
} as const satisfies PrivateBetaIssueReviewUsage;

export const PRIVATE_BETA_CLOSEOUT_CRITERIA = [
  {
    id: "closeout_required_fields_complete",
    label: "Required fields complete",
    required: true,
    ownerAction:
      "Every issue has all required fields present, including resolvedAt and resolutionNotes when closed."
  },
  {
    id: "closeout_redaction_confirmed",
    label: "Redaction confirmed",
    required: true,
    ownerAction:
      "Resolution notes confirm no raw payment data, provider tokens, secrets, raw emails, raw localStorage dumps, or unredacted evidence remain."
  },
  {
    id: "closeout_p0_p1_decision_recorded",
    label: "P0/P1 decision recorded",
    required: true,
    ownerAction:
      "All P0/P1 issues have ownerDecision, rollback/pause impact, verification evidence, and participant notification notes as needed."
  },
  {
    id: "closeout_resume_or_stop_decision_ready",
    label: "Resume or stop decision ready",
    required: true,
    ownerAction:
      "Issue log supports the owner decision to continue, pause, stop, or proceed to PR #88 final signoff."
  }
] as const satisfies readonly PrivateBetaIssueProcedureItem[];

export const PRIVATE_BETA_EMPTY_ISSUE_RECORD = {
  issueId: "VLX-BETA-0000",
  reportedAt: "2026-06-16T00:00:00.000Z",
  participantAlias: "participant-000",
  participantContactRedacted: "[owner-private roster reference]",
  route: "/dashboard",
  featureArea: "review_srs",
  severity: "P2",
  status: "new",
  title: "Template issue title",
  description: "Template description with personal details removed.",
  expectedBehavior: "Describe the expected private beta behavior.",
  actualBehavior: "Describe the actual behavior with sensitive data removed.",
  reproductionSteps: [
    "Open the owner-approved private beta app.",
    "Visit the affected route.",
    "Perform the action that produced the issue."
  ],
  browser: "Browser name and version",
  device: "Device, OS, and input mode",
  viewport: "Viewport size or breakpoint",
  localStorageKeysInvolved: [],
  redactedLocalStateSummary:
    "Record approved key presence/counts only; no raw localStorage values.",
  screenshotOrVideoReference: "not provided",
  paymentRelated: false,
  entitlementRelated: false,
  accountSyncRelated: false,
  dataLossRisk: false,
  ownerDecision: "pending-owner-triage",
  assignedOwner: "owner",
  nextAction: "Classify severity, route, feature area, and pause impact.",
  resolvedAt: null,
  resolutionNotes: ""
} as const satisfies PrivateBetaIssueRecord;

export const PRIVATE_BETA_ISSUE_LOG_NEXT_PR_SEQUENCE = [
  {
    prNumber: 88,
    title: "Private beta final owner signoff",
    purpose:
      "Record final owner approval after invite packet, issue log, participant roster, support/refund/privacy copy, and safety checks are ready.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    issueTrackerIntegrationAllowed: false
  },
  {
    prNumber: 89,
    title: "Private beta dry-run smoke evidence",
    purpose:
      "Record no-participant owner smoke checks, route coverage, console/hydration counts, and local-state notes.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    issueTrackerIntegrationAllowed: false
  },
  {
    prNumber: 90,
    title: "Owner-run private beta launch decision",
    purpose:
      "Record final launch, pause, or no-launch decision for the owner-controlled private beta cohort.",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    monitoringSdkAllowed: false,
    issueTrackerIntegrationAllowed: false
  }
] as const satisfies readonly PrivateBetaIssueLogNextPr[];

export const PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  githubIssueCreationAllowed: false,
  githubApiUsageAllowed: false,
  issueTrackerIntegrationAllowed: false,
  monitoringSdkAllowed: false,
  analyticsSdkAllowed: false,
  emailSlackDiscordIntegrationAllowed: false,
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
  aiCallsAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  secretsTouchedAllowed: false,
  productionDataMutationAllowed: false,
  networkCallsAllowed: false,
  browserStorageMutationAllowed: false,
  npmAuditFixAllowed: false
} as const satisfies PrivateBetaIssueLogSafetyPolicy;

export const PRIVATE_BETA_ISSUE_LOG_TEMPLATE = {
  version: VISUAL_LEXICON_PRIVATE_BETA_ISSUE_LOG_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/private-beta-issue-log-template",
  pullRequest: "#87 Private beta issue log template",
  reportDateKst: "2026-06-16",
  scope: "Track B owner-controlled private beta issue log template",
  ownerControlledPrivateBetaVerdict: PRIVATE_BETA_ISSUE_LOG_VERDICT,
  publicPaidBetaVerdict: PUBLIC_BETA_ISSUE_LOG_VERDICT,
  currentVerdicts: {
    ownerControlledPrivateBeta: PRIVATE_BETA_ISSUE_LOG_VERDICT,
    publicPaidBeta: PUBLIC_BETA_ISSUE_LOG_VERDICT
  },
  executiveSummary: PRIVATE_BETA_ISSUE_LOG_EXECUTIVE_SUMMARY,
  requiredIssueFields: PRIVATE_BETA_REQUIRED_ISSUE_FIELDS,
  issueIntakeFields: PRIVATE_BETA_ISSUE_INTAKE_FIELDS,
  severityLevels: PRIVATE_BETA_ISSUE_SEVERITY_LEVELS,
  statusLifecycle: PRIVATE_BETA_ISSUE_STATUS_LIFECYCLE,
  routeTaxonomy: PRIVATE_BETA_ISSUE_ROUTE_TAXONOMY,
  reproductionStepsTemplate: PRIVATE_BETA_REPRODUCTION_STEPS_TEMPLATE,
  browserDeviceFields: PRIVATE_BETA_BROWSER_DEVICE_FIELDS,
  localStorageProbeFields: PRIVATE_BETA_LOCAL_STORAGE_PROBE_FIELDS,
  screenshotVideoEvidenceFields: PRIVATE_BETA_SCREENSHOT_VIDEO_EVIDENCE_FIELDS,
  redactionRules: PRIVATE_BETA_ISSUE_REDACTION_RULES,
  featureAreaClassifications: PRIVATE_BETA_FEATURE_AREA_CLASSIFICATIONS,
  ownerTriageChecklist: PRIVATE_BETA_OWNER_TRIAGE_CHECKLIST,
  ownerDecisionOptions: PRIVATE_BETA_OWNER_DECISION_OPTIONS,
  rollbackPauseTriggerMapping: PRIVATE_BETA_ROLLBACK_PAUSE_TRIGGER_MAPPING,
  duplicateIssueHandling: PRIVATE_BETA_DUPLICATE_ISSUE_HANDLING,
  unresolvedIssueEscalation: PRIVATE_BETA_UNRESOLVED_ISSUE_ESCALATION,
  first24HourReviewUsage: PRIVATE_BETA_FIRST_24_HOUR_REVIEW_USAGE,
  sevenDayReviewUsage: PRIVATE_BETA_SEVEN_DAY_REVIEW_USAGE,
  closeoutCriteria: PRIVATE_BETA_CLOSEOUT_CRITERIA,
  emptyIssueRecord: PRIVATE_BETA_EMPTY_ISSUE_RECORD,
  nextIssueLogPRSequence: PRIVATE_BETA_ISSUE_LOG_NEXT_PR_SEQUENCE,
  safetyPolicy: PRIVATE_BETA_ISSUE_LOG_SAFETY_POLICY
} as const satisfies PrivateBetaIssueLogTemplate;

export function getPrivateBetaIssueLogTemplate() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE;
}

export function getPrivateBetaIssueLogVerdict() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.publicPaidBetaVerdict;
}

export function getIssueIntakeFields() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.issueIntakeFields;
}

export function getIssueSeverityLevels() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.severityLevels;
}

export function getIssueStatusLifecycle() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.statusLifecycle;
}

export function getIssueRouteTaxonomy() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.routeTaxonomy;
}

export function getIssueRedactionRules() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.redactionRules;
}

export function getIssueFeatureAreaClassifications() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.featureAreaClassifications;
}

export function getOwnerTriageChecklist() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.ownerTriageChecklist;
}

export function getRollbackPauseTriggerMapping() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.rollbackPauseTriggerMapping;
}

export function getNextIssueLogPRSequence() {
  return PRIVATE_BETA_ISSUE_LOG_TEMPLATE.nextIssueLogPRSequence;
}
