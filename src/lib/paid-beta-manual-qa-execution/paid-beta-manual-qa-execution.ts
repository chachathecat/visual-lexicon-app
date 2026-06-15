export const VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION = 1 as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS = [
  "/",
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/save?slug=dissonance&source=word_page",
  "/word/dissonance",
  "/word/obfuscate"
] as const;

export type PaidBetaManualQaExecutionVersion =
  typeof VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION;

export type PaidBetaManualQaExecutionVerdict =
  | "conditional_manual_only_private_paid_beta"
  | "no_go_public_paid_beta";

export type PaidBetaManualQaExecutionRecommendation =
  | "Conditional / Manual-only"
  | "No-Go";

export type PaidBetaManualQaExecutionSeverity = "P0" | "P1" | "P2";

export type PaidBetaManualQaExecutionRoutePath =
  (typeof PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS)[number];

export type PaidBetaManualQaExecutionStatus =
  | "pass"
  | "conditional_manual_only"
  | "manual_retest_required"
  | "blocked";

export type PaidBetaManualQaExecutionArea =
  | "today"
  | "review"
  | "weak"
  | "packs"
  | "saved"
  | "pricing"
  | "save"
  | "word";

export type PaidBetaManualQaExecutionRouteCheck = {
  id: string;
  path: PaidBetaManualQaExecutionRoutePath;
  label: string;
  area: PaidBetaManualQaExecutionArea;
  routeExistsInRepo: true;
  smokeExpectation: string;
  manualQaFocus: string;
  betaDisposition: PaidBetaManualQaExecutionStatus;
  expectedEvidence: readonly string[];
  mustNotFake: readonly string[];
};

export type PaidBetaManualQaExecutionStorageProbe = {
  key:
    | "vlx_saved_words_v1"
    | "vlx_review_state_v1"
    | "vlx_review_events_v1"
    | "vlx_daily_stats_v1"
    | "vlx_pack_progress_v1"
    | "vlx_upgrade_interest_v1"
    | "vlx_plan_state_v1"
    | "vlx_pending_home_quiz";
  expectedUse: string;
  qaCheck: string;
  productionSourceOfTruth: false;
  grantsPaidEntitlement: false;
  mustNotContain: readonly string[];
};

export type PaidBetaManualQaExecutionChecklist = {
  id: string;
  label: string;
  status: PaidBetaManualQaExecutionStatus;
  checks: readonly string[];
};

export type PaidBetaManualQaExecutionFinding = {
  id: string;
  severity: PaidBetaManualQaExecutionSeverity;
  title: string;
  status: "open" | "accepted_for_manual_private_beta" | "future";
  blocksPrivatePaidBeta: boolean;
  blocksPublicPaidBeta: boolean;
  evidenceRequired: string;
  recommendedAction: string;
};

export type PaidBetaManualQaExecutionValidationCommand = {
  command: string;
  required: true;
};

export type PaidBetaManualQaExecutionBrowserSmokeSummary = {
  cleanPort: 3021;
  baseUrl: "http://127.0.0.1:3021";
  status: "pass";
  routesSelected: readonly [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing"
  ];
  routeLoadStatus: "pass";
  consoleErrorCount: 0;
  hydrationWarningCount: 0;
  staleServerRiskMitigation: string;
};

export type PaidBetaManualQaExecutionSafetyPolicy = {
  docsContractsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  authAllowed: false;
  databaseProviderAllowed: false;
  paymentBillingCheckoutAllowed: false;
  environmentVariableChangesAllowed: false;
  productionDataMutationAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  fakeMasteryAllowed: false;
  fakePaidAccessAllowed: false;
  networkCallsAllowed: false;
  browserStorageWritesAllowed: false;
};

export type PaidBetaManualQaExecutionNextPr = {
  prNumber: 80;
  title: "Private beta gate prep";
  docsContractsTestsOnly: true;
  realAccountSyncRecommended: false;
  realPaymentRecommended: false;
  reason: string;
  alternate: "Account sync disabled route skeleton";
};

export type PaidBetaManualQaExecutionReport = {
  version: PaidBetaManualQaExecutionVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/manual-qa-execution-report";
  pullRequest: "#79 Manual QA execution report";
  reportDateKst: "2026-06-15";
  scope: "Integrated Track B paid beta candidate after PRs #70-#78";
  northStarMetric: "Weekly Reviewed Words";
  productFormula: "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit";
  futureMentalModel: readonly [
    "Today",
    "Review",
    "Weak",
    "Packs",
    "Saved",
    "Progress"
  ];
  privateBetaVerdict: PaidBetaManualQaExecutionVerdict;
  publicBetaVerdict: PaidBetaManualQaExecutionVerdict;
  privateBetaRecommendation: "Conditional / Manual-only";
  publicBetaRecommendation: "No-Go";
  testedEnvironment: {
    localServerPortUsed: 3021;
    localBaseUrl: "http://127.0.0.1:3021";
    dataBoundary: "local browser storage only";
    productionDataUsed: false;
  };
  validationCommands: readonly PaidBetaManualQaExecutionValidationCommand[];
  browserSmokeSummary: PaidBetaManualQaExecutionBrowserSmokeSummary;
  routeChecks: readonly PaidBetaManualQaExecutionRouteCheck[];
  localStorageProbes: readonly PaidBetaManualQaExecutionStorageProbe[];
  consoleHydrationChecklist: PaidBetaManualQaExecutionChecklist;
  mobileKeyboardAccessibilityChecklist: PaidBetaManualQaExecutionChecklist;
  paywallTriggerChecklist: PaidBetaManualQaExecutionChecklist;
  findings: readonly PaidBetaManualQaExecutionFinding[];
  stopConditions: readonly string[];
  rollbackNotes: readonly string[];
  safetyPolicy: PaidBetaManualQaExecutionSafetyPolicy;
  recommendedNextPr: PaidBetaManualQaExecutionNextPr;
};

export const PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT =
  "conditional_manual_only_private_paid_beta" as const satisfies PaidBetaManualQaExecutionVerdict;

export const PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT =
  "no_go_public_paid_beta" as const satisfies PaidBetaManualQaExecutionVerdict;

export const PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS = [
  { command: "npm.cmd run typecheck", required: true },
  { command: "npm.cmd run lint", required: true },
  { command: "npm.cmd run build", required: true },
  { command: "npm.cmd run test -- --workers=1", required: true },
  { command: "git diff --check", required: true }
] as const satisfies readonly PaidBetaManualQaExecutionValidationCommand[];

export const PAID_BETA_MANUAL_QA_EXECUTION_BROWSER_SMOKE_SUMMARY = {
  cleanPort: 3021,
  baseUrl: "http://127.0.0.1:3021",
  status: "pass",
  routesSelected: ["/dashboard", "/review", "/saved", "/packs", "/pricing"],
  routeLoadStatus: "pass",
  consoleErrorCount: 0,
  hydrationWarningCount: 0,
  staleServerRiskMitigation:
    "Use a clean port such as 3021 before invites so stale dev servers do not hide route or hydration failures."
} as const satisfies PaidBetaManualQaExecutionBrowserSmokeSummary;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS = [
  {
    id: "home",
    path: "/",
    label: "Home",
    area: "today",
    routeExistsInRepo: true,
    smokeExpectation: "Loads the Track B home surface without visible 404.",
    manualQaFocus: "Entry point keeps review loop framing and safe navigation.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["route load note", "screenshot"],
    mustNotFake: ["review progress", "paid access"]
  },
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    area: "today",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Today Memory Mission.",
    manualQaFocus:
      "Due, Weak, New, Learning, and Mastered values are honest; dashboard does not mutate review state/events.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["dashboard screenshot", "review state before/after probe"],
    mustNotFake: ["due count", "weak count", "mastery", "streaks"]
  },
  {
    id: "review",
    path: "/review",
    label: "Review Session",
    area: "review",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Review Session v2.",
    manualQaFocus:
      "Answering a card writes a review event and updates SRS state through the existing review flow.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["answer action note", "review event count", "state delta"],
    mustNotFake: ["review event", "box movement", "next due feedback"]
  },
  {
    id: "review_due",
    path: "/review/due",
    label: "Due Review",
    area: "review",
    routeExistsInRepo: true,
    smokeExpectation: "Loads due review or honest empty state.",
    manualQaFocus: "Due cards come from real nextDueAt / review state.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["due route screenshot", "review state probe"],
    mustNotFake: ["due queue", "empty state"]
  },
  {
    id: "review_weak",
    path: "/review/weak",
    label: "Weak Review",
    area: "weak",
    routeExistsInRepo: true,
    smokeExpectation: "Loads weak review or honest empty state.",
    manualQaFocus:
      "Weak cards come from real mistakes, Weak mastery, or weakScore.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["weak route screenshot", "weakScore probe"],
    mustNotFake: ["weak queue", "mistake record"]
  },
  {
    id: "review_weak_sprint",
    path: "/review/weak-sprint",
    label: "Weak Sprint",
    area: "weak",
    routeExistsInRepo: true,
    smokeExpectation: "Loads weak sprint or honest empty state.",
    manualQaFocus: "Sprint uses the same SRS records; no fake weak queue.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["sprint screenshot", "before/after review events"],
    mustNotFake: ["weak sprint candidates", "separate sprint mastery"]
  },
  {
    id: "saved",
    path: "/saved",
    label: "Saved Library",
    area: "saved",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Saved Library v2.",
    manualQaFocus:
      "Due / Weak / New / Learning / Mastered / All tabs exist; page is read-only for review state/events.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["tab screenshot", "state/events unchanged probe"],
    mustNotFake: ["saved count", "mastery", "review history"]
  },
  {
    id: "packs",
    path: "/packs",
    label: "Packs",
    area: "packs",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Packs v2.",
    manualQaFocus:
      "Academic, IELTS, and GRE states are honest; unavailable packs do not fake progress.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["pack catalog screenshot", "pack progress probe"],
    mustNotFake: ["IELTS progress", "GRE progress", "paid pack access"]
  },
  {
    id: "academic_pack",
    path: "/packs/academic-vocabulary",
    label: "Academic Vocabulary Pack",
    area: "packs",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Academic Vocabulary detail.",
    manualQaFocus:
      "Preview CTAs route to safe review/pricing paths and pack progress is evidence-based.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["pack detail screenshot", "safe CTA route note"],
    mustNotFake: ["pack completion", "full paid plan access"]
  },
  {
    id: "pricing",
    path: "/pricing",
    label: "Pricing",
    area: "pricing",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Pricing / Paywall v2.",
    manualQaFocus:
      "Free/Lite/Pro outcomes are present; no checkout, payment SDK, or entitlement mutation.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["pricing screenshot", "upgrade interest probe"],
    mustNotFake: ["checkout", "subscription", "entitlement"]
  },
  {
    id: "save_dissonance_word_page",
    path: "/save?slug=dissonance&source=word_page",
    label: "Save Dissonance From Word Page",
    area: "save",
    routeExistsInRepo: true,
    smokeExpectation: "Loads save confirmation.",
    manualQaFocus:
      "Creates or preserves saved word and review state through existing save behavior only; no fake mastery.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["save route screenshot", "saved words probe", "review state probe"],
    mustNotFake: ["mastery", "review evidence"]
  },
  {
    id: "word_dissonance",
    path: "/word/dissonance",
    label: "Dissonance Word Detail",
    area: "word",
    routeExistsInRepo: true,
    smokeExpectation: "Loads existing word detail route.",
    manualQaFocus: "Memory state panel reflects local review state honestly.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["word detail screenshot", "memory panel probe"],
    mustNotFake: ["saved state", "mastery"]
  },
  {
    id: "word_obfuscate",
    path: "/word/obfuscate",
    label: "Obfuscate Word Detail",
    area: "word",
    routeExistsInRepo: true,
    smokeExpectation: "Loads existing word detail route.",
    manualQaFocus:
      "Weak-state example remains tied to real review state and not fake progress.",
    betaDisposition: "conditional_manual_only",
    expectedEvidence: ["word detail screenshot", "weak state note"],
    mustNotFake: ["weak score", "mastery", "pack progress"]
  }
] as const satisfies readonly PaidBetaManualQaExecutionRouteCheck[];

export const PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES = [
  {
    key: "vlx_saved_words_v1",
    expectedUse: "Saved words keyed by slug.",
    qaCheck: "dissonance exists after save and source is safe.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_review_state_v1",
    expectedUse: "SRS records for saved/reviewed words.",
    qaCheck: "Save creates or preserves review item; mastery does not jump to Mastered.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake mastery", "entitlement proof", "account tokens"]
  },
  {
    key: "vlx_review_events_v1",
    expectedUse: "Review answer events.",
    qaCheck: "Event count increases after an answer.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["payment data", "private payloads", "production account data"]
  },
  {
    key: "vlx_daily_stats_v1",
    expectedUse: "Local daily review counts.",
    qaCheck: "Stats update only after review answers.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake Weekly Reviewed Words"]
  },
  {
    key: "vlx_pack_progress_v1",
    expectedUse: "Local pack preview/review progress.",
    qaCheck: "Progress ties to preview start or review evidence.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake completion", "paid access proof"]
  },
  {
    key: "vlx_upgrade_interest_v1",
    expectedUse: "Local upgrade interest attribution.",
    qaCheck: "Lite/Pro interest records do not grant access.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["payment data", "invoices", "subscriptions"]
  },
  {
    key: "vlx_plan_state_v1",
    expectedUse: "Local plan preview/debug state only.",
    qaCheck: "Does not become entitlement or subscription proof.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["paid access proof", "billing state"]
  },
  {
    key: "vlx_pending_home_quiz",
    expectedUse: "Optional transition key.",
    qaCheck: "Does not compete with SRS state or mastery.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["review state replacement", "fake mastery"]
  }
] as const satisfies readonly PaidBetaManualQaExecutionStorageProbe[];

export const PAID_BETA_MANUAL_QA_EXECUTION_CONSOLE_HYDRATION_CHECKLIST = {
  id: "console_hydration",
  label: "Console and hydration smoke",
  status: "manual_retest_required",
  checks: [
    "Record console error count on dashboard, review, saved, packs, and pricing.",
    "Record hydration warning count on the same route set.",
    "Treat visible 404, route crash, hydration mismatch, or persistent console errors in the core loop as P0.",
    "Use clean port 3021 to reduce stale server risk."
  ]
} as const satisfies PaidBetaManualQaExecutionChecklist;

export const PAID_BETA_MANUAL_QA_EXECUTION_MOBILE_KEYBOARD_ACCESSIBILITY_CHECKLIST = {
  id: "mobile_keyboard_accessibility",
  label: "Mobile, keyboard, and accessibility smoke",
  status: "manual_retest_required",
  checks: [
    "Use a mobile viewport around 390x844.",
    "Start review from dashboard and answer at least one card.",
    "Confirm visible focus states on dashboard, saved, review, packs, pricing, save, and word detail surfaces.",
    "Confirm keyboard navigation reaches core save, review, answer, and pricing interest controls.",
    "Confirm no color-only critical state and no mobile overlap in core flows."
  ]
} as const satisfies PaidBetaManualQaExecutionChecklist;

export const PAID_BETA_MANUAL_QA_EXECUTION_PAYWALL_TRIGGER_CHECKLIST = {
  id: "paywall_triggers",
  label: "Pricing and paywall trigger smoke",
  status: "conditional_manual_only",
  checks: [
    "Pricing includes Free, Lite, and Pro cards.",
    "Outcome copy includes Start remembering your first words.",
    "Outcome copy includes Build a daily visual memory habit.",
    "Outcome copy includes Fix weak words and prepare for exams.",
    "Upgrade interest remains local-only and grants no entitlement.",
    "No checkout, payment SDK, billing portal, invoice, or subscription appears."
  ]
} as const satisfies PaidBetaManualQaExecutionChecklist;

export const PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS = [
  {
    id: "p0_real_payment_checkout_not_implemented",
    severity: "P0",
    title: "Real payment/checkout is not implemented.",
    status: "accepted_for_manual_private_beta",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Pricing/paywall probe showing no checkout, SDK, subscription, or entitlement.",
    recommendedAction:
      "Keep private beta payment manual/off-app; do not add payment implementation without explicit approval."
  },
  {
    id: "p0_production_account_sync_not_implemented",
    severity: "P0",
    title: "Production account sync is not implemented.",
    status: "accepted_for_manual_private_beta",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Local storage probe and account-sync disclosure.",
    recommendedAction:
      "Keep private beta owner-run and disclose browser-local memory state."
  },
  {
    id: "p0_monitoring_alerting_not_implemented",
    severity: "P0",
    title: "Monitoring/alerting is not implemented.",
    status: "accepted_for_manual_private_beta",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Launch operations checklist noting no production alerting.",
    recommendedAction:
      "Do not run public paid beta until production monitoring and alert response exist."
  },
  {
    id: "p0_privacy_support_refund_gate_incomplete",
    severity: "P0",
    title: "Privacy/support/refund final gate is not complete.",
    status: "accepted_for_manual_private_beta",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Owner-run support/refund/privacy notes before any invite.",
    recommendedAction:
      "Prepare manual support, refund, privacy, and data-disclosure policy before private invites."
  },
  {
    id: "p0_full_accessibility_audit_incomplete",
    severity: "P0",
    title: "Full accessibility audit is not complete.",
    status: "accepted_for_manual_private_beta",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Mobile and keyboard smoke evidence plus full audit gap note.",
    recommendedAction:
      "Run full accessibility audit before public paid beta; stop private beta if core review is unusable."
  },
  {
    id: "p0_public_paid_beta_no_go",
    severity: "P0",
    title: "Public paid beta remains No-Go.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "This report and unresolved public launch gates.",
    recommendedAction:
      "Do not claim public paid readiness until account sync, payment, monitoring, accessibility, privacy/support/refund, and launch QA gates close."
  },
  {
    id: "p1_private_beta_owner_oversight_required",
    severity: "P1",
    title: "Private paid beta can proceed only manually and with owner oversight.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Owner-run invite and evidence log.",
    recommendedAction: "Use #80 Private beta gate prep before invites."
  },
  {
    id: "p1_account_sync_preview_digest_needed",
    severity: "P1",
    title: "Account sync preview/digest is still needed.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Account sync boundary note.",
    recommendedAction: "Document disabled account-sync state before implementing sync."
  },
  {
    id: "p1_manual_payment_entitlement_policy_needed",
    severity: "P1",
    title: "Manual payment / entitlement policy is still needed.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Manual entitlement policy and support path.",
    recommendedAction: "Define owner-run payment and access policy outside the app."
  },
  {
    id: "p1_qa_evidence_repeat_before_public_launch",
    severity: "P1",
    title: "QA evidence should be repeated before any public launch.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    evidenceRequired: "Fresh route, storage, mobile, keyboard, and console evidence.",
    recommendedAction: "Repeat full manual QA after every launch-gate PR."
  },
  {
    id: "p2_richer_ielts_gre_pack_data",
    severity: "P2",
    title: "Richer pack data for IELTS/GRE.",
    status: "future",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    evidenceRequired: "Content plan and pack QA.",
    recommendedAction: "Add richer IELTS/GRE data after the loop gates are stable."
  },
  {
    id: "p2_deeper_mobile_polish",
    severity: "P2",
    title: "Deeper mobile polish.",
    status: "future",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    evidenceRequired: "Mobile screenshots and focus notes.",
    recommendedAction: "Polish after core mobile review remains usable."
  },
  {
    id: "p2_future_ai_mistake_explanation",
    severity: "P2",
    title: "Future AI mistake explanation.",
    status: "future",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    evidenceRequired: "SRS loop pass before AI work.",
    recommendedAction: "Do not add AI tutor behavior before review events and SRS are stable."
  },
  {
    id: "p2_future_no_watermark_download_export",
    severity: "P2",
    title: "Future no-watermark/download/export implementation.",
    status: "future",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    evidenceRequired: "Future paid feature requirements.",
    recommendedAction: "Defer export/download paid features until entitlement exists."
  }
] as const satisfies readonly PaidBetaManualQaExecutionFinding[];

export const PAID_BETA_MANUAL_QA_EXECUTION_STOP_CONDITIONS = [
  "Stop before Webflow publishing, Cloudflare Worker changes, DNS, deployment, Vercel, or production setting changes.",
  "Stop before payment, billing, invoice, checkout, subscription, or entitlement implementation.",
  "Stop before auth, account sync API routes, database providers, migrations, or production user data mutation.",
  "Stop before secrets, API keys, passwords, tokens, billing credentials, or env var changes.",
  "Stop if save does not create or preserve a review item.",
  "Stop if review answers do not write events and update memory state.",
  "Stop if Due, Weak, Mastered, pack progress, streaks, or paid access are fake.",
  "Stop if mobile or keyboard review is unusable.",
  "Stop if console or hydration failures affect the core loop."
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROLLBACK_NOTES = [
  "Revert the execution report doc.",
  "Revert the static paid-beta-manual-qa-execution module.",
  "Revert the paid beta manual QA execution contract test.",
  "Revert README link additions.",
  "No production systems or runtime app behavior require rollback."
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  authAllowed: false,
  databaseProviderAllowed: false,
  paymentBillingCheckoutAllowed: false,
  environmentVariableChangesAllowed: false,
  productionDataMutationAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  fakeMasteryAllowed: false,
  fakePaidAccessAllowed: false,
  networkCallsAllowed: false,
  browserStorageWritesAllowed: false
} as const satisfies PaidBetaManualQaExecutionSafetyPolicy;

export const PAID_BETA_MANUAL_QA_EXECUTION_NEXT_PR = {
  prNumber: 80,
  title: "Private beta gate prep",
  docsContractsTestsOnly: true,
  realAccountSyncRecommended: false,
  realPaymentRecommended: false,
  reason:
    "The report keeps private paid beta conditional and manual-only, so the next safest step is owner-run invite gating, manual entitlement policy, support/privacy/refund checklist, and repeat-QA evidence without adding real checkout or account sync.",
  alternate: "Account sync disabled route skeleton"
} as const satisfies PaidBetaManualQaExecutionNextPr;

export const PAID_BETA_MANUAL_QA_EXECUTION_REPORT = {
  version: VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/manual-qa-execution-report",
  pullRequest: "#79 Manual QA execution report",
  reportDateKst: "2026-06-15",
  scope: "Integrated Track B paid beta candidate after PRs #70-#78",
  northStarMetric: "Weekly Reviewed Words",
  productFormula:
    "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit",
  futureMentalModel: ["Today", "Review", "Weak", "Packs", "Saved", "Progress"],
  privateBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  publicBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
  privateBetaRecommendation: "Conditional / Manual-only",
  publicBetaRecommendation: "No-Go",
  testedEnvironment: {
    localServerPortUsed: 3021,
    localBaseUrl: "http://127.0.0.1:3021",
    dataBoundary: "local browser storage only",
    productionDataUsed: false
  },
  validationCommands: PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS,
  browserSmokeSummary: PAID_BETA_MANUAL_QA_EXECUTION_BROWSER_SMOKE_SUMMARY,
  routeChecks: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  localStorageProbes: PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES,
  consoleHydrationChecklist:
    PAID_BETA_MANUAL_QA_EXECUTION_CONSOLE_HYDRATION_CHECKLIST,
  mobileKeyboardAccessibilityChecklist:
    PAID_BETA_MANUAL_QA_EXECUTION_MOBILE_KEYBOARD_ACCESSIBILITY_CHECKLIST,
  paywallTriggerChecklist:
    PAID_BETA_MANUAL_QA_EXECUTION_PAYWALL_TRIGGER_CHECKLIST,
  findings: PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  stopConditions: PAID_BETA_MANUAL_QA_EXECUTION_STOP_CONDITIONS,
  rollbackNotes: PAID_BETA_MANUAL_QA_EXECUTION_ROLLBACK_NOTES,
  safetyPolicy: PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY,
  recommendedNextPr: PAID_BETA_MANUAL_QA_EXECUTION_NEXT_PR
} as const satisfies PaidBetaManualQaExecutionReport;

export function getPaidBetaManualQaExecutionReport() {
  return PAID_BETA_MANUAL_QA_EXECUTION_REPORT;
}

export function getManualQaRouteChecks() {
  return PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS;
}

export function getManualQaRouteCheckByPath(
  path: PaidBetaManualQaExecutionRoutePath | string
) {
  return PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS.find(
    (routeCheck) => routeCheck.path === path
  );
}

export function getFindingsBySeverity(
  severity: PaidBetaManualQaExecutionSeverity
) {
  return PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS.filter(
    (finding) => finding.severity === severity
  );
}

export function getP0Blockers() {
  return getFindingsBySeverity("P0");
}

export function getPrivateBetaVerdict() {
  return PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT;
}

export function getPublicBetaVerdict() {
  return PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT;
}

export function getRecommendedNextPr() {
  return PAID_BETA_MANUAL_QA_EXECUTION_NEXT_PR;
}
