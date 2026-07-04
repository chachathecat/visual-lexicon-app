export const VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION = 2 as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS = [
  "/dashboard",
  "/saved",
  "/save?slug=dissonance&source=word_page",
  "/save?slug=dissonance&source=alias_search",
  "/save?slug=dissonance&source=extension",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/packs",
  "/packs/academic-vocabulary",
  "/pricing",
  "/settings",
  "/word/dissonance"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1"
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES = [
  "Save creates review item",
  "Review updates state/events",
  "Due/Weak/Mastered remain honest",
  "Weak sprint uses real weak evidence",
  "Pack preview/progress remains honest",
  "Pricing upgrade interest records local beta interest only",
  "No checkout/payment/billing route exists",
  "Public paid beta remains No-Go",
  "Private/manual paid beta is gated"
] as const;

export type PaidBetaManualQaExecutionVersion =
  typeof VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION;

export type PaidBetaManualQaExecutionRoutePath =
  (typeof PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_PATHS)[number];

export type PaidBetaManualQaExecutionStorageKey =
  (typeof PAID_BETA_MANUAL_QA_EXECUTION_STORAGE_KEYS)[number];

export type PaidBetaManualQaExecutionQaSectionTitle =
  (typeof PAID_BETA_MANUAL_QA_EXECUTION_QA_SECTION_TITLES)[number];

export type PaidBetaManualQaExecutionVerdict =
  | "move_to_private_beta_gate"
  | "no_go_public_paid_beta";

export type PaidBetaManualQaExecutionRecommendation =
  | "Move to Private Beta Gate"
  | "Targeted hotfix PRs required"
  | "No-Go";

export type PaidBetaManualQaExecutionSeverity = "P0" | "P1" | "P2";

export type PaidBetaManualQaExecutionStatus =
  | "pass"
  | "gated"
  | "no_go"
  | "follow_up";

export type PaidBetaManualQaExecutionArea =
  | "dashboard"
  | "saved"
  | "save"
  | "review"
  | "packs"
  | "pricing"
  | "settings"
  | "word";

export type PaidBetaManualQaExecutionRouteCheck = {
  id: string;
  path: PaidBetaManualQaExecutionRoutePath;
  area: PaidBetaManualQaExecutionArea;
  result: "pass";
  evidence: readonly string[];
  mustRemainHonest: readonly string[];
};

export type PaidBetaManualQaExecutionStorageProbe = {
  key: PaidBetaManualQaExecutionStorageKey;
  expectedUse: string;
  evidenceCheck: string;
  productionSourceOfTruth: false;
  grantsPaidEntitlement: false;
  mustNotContain: readonly string[];
};

export type PaidBetaManualQaExecutionQaResultSection = {
  title: PaidBetaManualQaExecutionQaSectionTitle;
  status: PaidBetaManualQaExecutionStatus;
  evidence: readonly string[];
  releaseMeaning: string;
};

export type PaidBetaManualQaExecutionFinding = {
  id: string;
  severity: PaidBetaManualQaExecutionSeverity;
  title: string;
  status: "open" | "accepted_for_private_gate" | "future";
  blocksPrivateBetaGate: boolean;
  blocksPublicPaidBeta: boolean;
  evidence: string;
  recommendedAction: string;
};

export type PaidBetaManualQaExecutionValidationCommand = {
  command: string;
  required: true;
};

export type PaidBetaManualQaExecutionSafetyPolicy = {
  docsTestsOnly: true;
  runtimeUiChangesAllowed: false;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  webflowAllowed: false;
  cloudflareWorkersAllowed: false;
  authAllowed: false;
  billingPaymentCheckoutAllowed: false;
  dnsDeploymentSettingsAllowed: false;
  secretsAllowed: false;
  productionDataMutationAllowed: false;
  paymentSdkAllowed: false;
  publicPaidBetaUnblocked: false;
  fakeQaResultsAllowed: false;
  fakeMasteryAllowed: false;
  fakePaidAccessAllowed: false;
};

export type PaidBetaManualQaExecutionReport = {
  version: PaidBetaManualQaExecutionVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/paid-beta-manual-qa-execution";
  draftPullRequestTitle: "[Track B] Add paid beta manual QA execution report";
  reportDateKst: "2026-07-04";
  scope: "Post-merge Pricing / Paywall v2 and Paid Beta Readiness Audit manual QA execution";
  northStarMetric: "Weekly Reviewed Words";
  productFormula: "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit";
  privateBetaVerdict: "move_to_private_beta_gate";
  publicBetaVerdict: "no_go_public_paid_beta";
  privateBetaRecommendation: "Move to Private Beta Gate";
  publicBetaRecommendation: "No-Go";
  p0FindingCount: 0;
  p0FallbackRecommendation: "Targeted hotfix PRs required";
  testedEnvironment: {
    localBaseUrl: "http://127.0.0.1:3006";
    appServerCommand: "npm.cmd run dev -- --hostname 127.0.0.1 --port 3006";
    executionSpec: "tests/paid-beta-manual-qa-execution.spec.ts";
    dataBoundary: "browser-local storage only";
    productionDataUsed: false;
  };
  validationCommands: readonly PaidBetaManualQaExecutionValidationCommand[];
  routeChecks: readonly PaidBetaManualQaExecutionRouteCheck[];
  localStorageProbes: readonly PaidBetaManualQaExecutionStorageProbe[];
  qaResultSections: readonly PaidBetaManualQaExecutionQaResultSection[];
  findings: readonly PaidBetaManualQaExecutionFinding[];
  stopConditions: readonly string[];
  rollbackNotes: readonly string[];
  safetyPolicy: PaidBetaManualQaExecutionSafetyPolicy;
};

export const PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT =
  "move_to_private_beta_gate" as const satisfies PaidBetaManualQaExecutionVerdict;

export const PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT =
  "no_go_public_paid_beta" as const satisfies PaidBetaManualQaExecutionVerdict;

export const PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS = [
  { command: "npm.cmd run typecheck", required: true },
  { command: "npm.cmd run lint", required: true },
  { command: "npm.cmd run build", required: true },
  {
    command:
      "npm.cmd run test -- tests/paid-beta-manual-qa-execution.spec.ts --workers=1",
    required: true
  }
] as const satisfies readonly PaidBetaManualQaExecutionValidationCommand[];

export const PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS = [
  {
    id: "dashboard",
    path: "/dashboard",
    area: "dashboard",
    result: "pass",
    evidence: ["route loads", "Today Memory Mission reads local SRS stores"],
    mustRemainHonest: ["due count", "weak count", "mastered count", "streaks"]
  },
  {
    id: "saved",
    path: "/saved",
    area: "saved",
    result: "pass",
    evidence: ["route loads", "saved words read from local saved/review state"],
    mustRemainHonest: ["saved count", "mastery labels", "review history"]
  },
  {
    id: "save_word_page",
    path: "/save?slug=dissonance&source=word_page",
    area: "save",
    result: "pass",
    evidence: ["dissonance saved with source word_page", "review item created"],
    mustRemainHonest: ["mastery", "box", "weakScore", "review counts"]
  },
  {
    id: "save_alias_search",
    path: "/save?slug=dissonance&source=alias_search",
    area: "save",
    result: "pass",
    evidence: ["dissonance saved with source alias_search", "review item created"],
    mustRemainHonest: ["source attribution", "canonical slug", "review item"]
  },
  {
    id: "save_extension",
    path: "/save?slug=dissonance&source=extension",
    area: "save",
    result: "pass",
    evidence: ["dissonance saved with source extension", "review item created"],
    mustRemainHonest: ["app-side source tag", "review item", "no production data"]
  },
  {
    id: "review",
    path: "/review",
    area: "review",
    result: "pass",
    evidence: ["answer writes review event", "SRS state and daily stats update"],
    mustRemainHonest: ["event count", "box movement", "next due", "daily stats"]
  },
  {
    id: "review_due",
    path: "/review/due",
    area: "review",
    result: "pass",
    evidence: ["route loads", "due queue comes from nextDueAt/SRS state"],
    mustRemainHonest: ["due queue", "empty state", "mastery"]
  },
  {
    id: "review_weak",
    path: "/review/weak",
    area: "review",
    result: "pass",
    evidence: ["route loads", "weak queue comes from weakScore/mistakes"],
    mustRemainHonest: ["weak queue", "mistake record", "empty state"]
  },
  {
    id: "review_weak_sprint",
    path: "/review/weak-sprint",
    area: "review",
    result: "pass",
    evidence: ["weak sprint card appears only after weak evidence", "weak_review event writes"],
    mustRemainHonest: ["weak sprint candidates", "same SRS record", "no separate fake store"]
  },
  {
    id: "packs",
    path: "/packs",
    area: "packs",
    result: "pass",
    evidence: ["pack catalog loads", "planned packs stay honest"],
    mustRemainHonest: ["pack progress", "planned pack access", "paid access"]
  },
  {
    id: "academic_pack",
    path: "/packs/academic-vocabulary",
    area: "packs",
    result: "pass",
    evidence: ["pack detail loads", "preview start and completion write pack progress"],
    mustRemainHonest: ["preview progress", "reviewed count", "correct count"]
  },
  {
    id: "pricing",
    path: "/pricing",
    area: "pricing",
    result: "pass",
    evidence: ["Lite/Pro/Exam Pack interest writes local upgrade records"],
    mustRemainHonest: ["checkout", "subscription", "paid entitlement"]
  },
  {
    id: "settings",
    path: "/settings",
    area: "settings",
    result: "pass",
    evidence: ["settings route loads", "account sync and billing are disclosed as not connected"],
    mustRemainHonest: ["local plan preview", "billing state", "account sync"]
  },
  {
    id: "word_dissonance",
    path: "/word/dissonance",
    area: "word",
    result: "pass",
    evidence: ["word detail loads", "memory panel reads local review state"],
    mustRemainHonest: ["saved state", "mastery", "box", "weak score"]
  }
] as const satisfies readonly PaidBetaManualQaExecutionRouteCheck[];

export const PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES = [
  {
    key: "vlx_saved_words_v1",
    expectedUse: "Browser-local saved word records keyed by slug.",
    evidenceCheck: "dissonance exists after each save-source route.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "production user data"]
  },
  {
    key: "vlx_review_state_v1",
    expectedUse: "Browser-local SRS memory records for saved and reviewed words.",
    evidenceCheck: "save creates or preserves a dissonance review item.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake mastery", "paid access proof", "billing state"]
  },
  {
    key: "vlx_review_events_v1",
    expectedUse: "Browser-local review answer event list.",
    evidenceCheck: "answering review cards appends events with real results.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["payment data", "private payloads", "production account data"]
  },
  {
    key: "vlx_daily_stats_v1",
    expectedUse: "Browser-local daily review counters.",
    evidenceCheck: "reviewed count increases only after review answers.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake Weekly Reviewed Words", "paid access proof"]
  },
  {
    key: "vlx_pack_progress_v1",
    expectedUse: "Browser-local pack preview and review progress.",
    evidenceCheck: "Academic Vocabulary preview start/completion writes real counts.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake completion", "paid access proof", "billing state"]
  },
  {
    key: "vlx_plan_state_v1",
    expectedUse: "Browser-local plan preview/debug state only.",
    evidenceCheck: "pricing interest does not create a trusted paid plan state.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["paid access proof", "billing state", "subscription"]
  },
  {
    key: "vlx_upgrade_interest_v1",
    expectedUse: "Browser-local paid beta interest attribution.",
    evidenceCheck: "pricing CTAs record Lite/Pro/Exam Pack interest locally.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["payment data", "invoice", "subscription", "checkout session"]
  }
] as const satisfies readonly PaidBetaManualQaExecutionStorageProbe[];

export const PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS = [
  {
    title: "Save creates review item",
    status: "pass",
    evidence: [
      "word_page, alias_search, and extension save routes create dissonance in vlx_saved_words_v1.",
      "Each save source creates a New box 0 review item in vlx_review_state_v1 from a clean store."
    ],
    releaseMeaning: "The save action supports the review loop instead of stopping at saved-word collection."
  },
  {
    title: "Review updates state/events",
    status: "pass",
    evidence: [
      "/review answer appends vlx_review_events_v1.",
      "The same answer updates vlx_review_state_v1 and vlx_daily_stats_v1."
    ],
    releaseMeaning: "Active recall produces memory state and event evidence."
  },
  {
    title: "Due/Weak/Mastered remain honest",
    status: "pass",
    evidence: [
      "/review/due and /review/weak load from real SRS state.",
      "Save-only and early reviewed words are not marked Mastered."
    ],
    releaseMeaning: "Dashboard, saved, review, and word detail states stay derived from review evidence."
  },
  {
    title: "Weak sprint uses real weak evidence",
    status: "pass",
    evidence: [
      "A wrong answer increases weak evidence.",
      "/review/weak-sprint uses that same SRS record and writes weak_review events."
    ],
    releaseMeaning: "Weak Sprint remains repair-focused and does not invent a weak queue."
  },
  {
    title: "Pack preview/progress remains honest",
    status: "pass",
    evidence: [
      "Academic Vocabulary preview start writes vlx_pack_progress_v1 with zero reviewed/correct counts.",
      "Preview completion updates reviewedCount/correctCount from actual review events."
    ],
    releaseMeaning: "Packs support review behavior without fake completion or paid-pack access."
  },
  {
    title: "Pricing upgrade interest records local beta interest only",
    status: "pass",
    evidence: [
      "Lite, Pro, and Exam Pack CTAs write vlx_upgrade_interest_v1.",
      "Pricing interest does not create checkout, subscription, billing, or trusted plan state."
    ],
    releaseMeaning: "Pricing can collect beta intent without pretending payment is connected."
  },
  {
    title: "No checkout/payment/billing route exists",
    status: "pass",
    evidence: [
      "No src/app checkout, billing, payment, or payments route directories exist.",
      "No Stripe/Paddle/payment SDK dependency is present."
    ],
    releaseMeaning: "The app does not expose fake or real in-app checkout."
  },
  {
    title: "Public paid beta remains No-Go",
    status: "no_go",
    evidence: [
      "No checkout/payment/billing route exists.",
      "Account sync, server SRS authority, production monitoring, support, privacy, refund, rollback, and accessibility gates remain outside this QA pass."
    ],
    releaseMeaning: "This report must not be used as public paid beta launch approval."
  },
  {
    title: "Private/manual paid beta is gated",
    status: "gated",
    evidence: [
      "P0 finding count for this local QA scope is zero.",
      "The next decision is Private Beta Gate review, not public launch or checkout implementation."
    ],
    releaseMeaning: "Move to owner-controlled Private Beta Gate only while payment stays off-app/manual."
  }
] as const satisfies readonly PaidBetaManualQaExecutionQaResultSection[];

export const PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS = [
  {
    id: "p1_private_beta_gate_owner_signoff_required",
    severity: "P1",
    title: "Private Beta Gate needs owner sign-off before invites.",
    status: "open",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: true,
    evidence: "Manual/private beta is explicitly gated in the report.",
    recommendedAction:
      "Run owner gate review for invite list, support, refund, privacy, rollback, and manual entitlement operations."
  },
  {
    id: "p1_public_beta_account_sync_and_server_srs_missing",
    severity: "P1",
    title: "Public beta still needs account sync and server-side SRS authority.",
    status: "open",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: true,
    evidence: "All required learning stores remain browser-local.",
    recommendedAction:
      "Do not treat localStorage as public-beta production source of truth."
  },
  {
    id: "p1_public_beta_payment_monitoring_support_privacy_gates_open",
    severity: "P1",
    title: "Public beta payment, monitoring, support, privacy, refund, rollback, and accessibility gates remain open.",
    status: "open",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: true,
    evidence: "No checkout route exists and this PR does not implement production operations gates.",
    recommendedAction:
      "Keep public paid beta No-Go until those gates have separate approved evidence."
  },
  {
    id: "p1_extension_source_needs_real_extension_e2e",
    severity: "P1",
    title: "Extension source is app-route covered, but real extension E2E remains follow-up.",
    status: "open",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: true,
    evidence: "The execution spec covers /save?slug=dissonance&source=extension inside the app only.",
    recommendedAction:
      "Run browser extension E2E before claiming extension distribution readiness."
  },
  {
    id: "p2_richer_ielts_gre_pack_content",
    severity: "P2",
    title: "IELTS and GRE pack content still needs depth.",
    status: "future",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: false,
    evidence: "Academic Vocabulary is the only pack with preview words in this pass.",
    recommendedAction: "Audit richer IELTS/GRE content after private gate work."
  },
  {
    id: "p2_deeper_mobile_accessibility_polish",
    severity: "P2",
    title: "Deeper mobile and accessibility polish should continue.",
    status: "future",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: false,
    evidence: "This report verifies core route/function behavior, not a full a11y audit.",
    recommendedAction: "Run full mobile, keyboard, and screen-reader QA before public beta."
  },
  {
    id: "p2_future_ai_and_export_features_deferred",
    severity: "P2",
    title: "AI mistake explanation and export/download features remain deferred.",
    status: "future",
    blocksPrivateBetaGate: false,
    blocksPublicPaidBeta: false,
    evidence: "No AI tutor, no-watermark download, or export implementation is part of this QA pass.",
    recommendedAction:
      "Add those only after SRS, entitlement, and asset-delivery gates are approved."
  }
] as const satisfies readonly PaidBetaManualQaExecutionFinding[];

export const PAID_BETA_MANUAL_QA_EXECUTION_STOP_CONDITIONS = [
  "If a P0 finding appears, stop the Private Beta Gate recommendation and open targeted hotfix PRs instead.",
  "Stop if save does not create or preserve a review item.",
  "Stop if review answers do not create events, update review state, and update daily stats.",
  "Stop if Due, Weak, Mastered, pack progress, streaks, or paid access are faked.",
  "Stop before Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS, deployment settings, secrets, production data, R2 production objects, or real user data changes.",
  "Stop before adding checkout, payment SDKs, billing portals, invoices, subscriptions, or production entitlement grants.",
  "Stop before claiming public paid beta readiness."
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_ROLLBACK_NOTES = [
  "Revert docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md.",
  "Revert tests/paid-beta-manual-qa-execution.spec.ts.",
  "Revert the static paid-beta-manual-qa-execution helper files if included in the PR.",
  "No runtime app behavior, production data, payment, auth, Webflow, Cloudflare, DNS, or deployment rollback is required."
] as const;

export const PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY = {
  docsTestsOnly: true,
  runtimeUiChangesAllowed: false,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  webflowAllowed: false,
  cloudflareWorkersAllowed: false,
  authAllowed: false,
  billingPaymentCheckoutAllowed: false,
  dnsDeploymentSettingsAllowed: false,
  secretsAllowed: false,
  productionDataMutationAllowed: false,
  paymentSdkAllowed: false,
  publicPaidBetaUnblocked: false,
  fakeQaResultsAllowed: false,
  fakeMasteryAllowed: false,
  fakePaidAccessAllowed: false
} as const satisfies PaidBetaManualQaExecutionSafetyPolicy;

export const PAID_BETA_MANUAL_QA_EXECUTION_REPORT = {
  version: VISUAL_LEXICON_PAID_BETA_MANUAL_QA_EXECUTION_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/paid-beta-manual-qa-execution",
  draftPullRequestTitle: "[Track B] Add paid beta manual QA execution report",
  reportDateKst: "2026-07-04",
  scope:
    "Post-merge Pricing / Paywall v2 and Paid Beta Readiness Audit manual QA execution",
  northStarMetric: "Weekly Reviewed Words",
  productFormula:
    "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit",
  privateBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT,
  publicBetaVerdict: PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT,
  privateBetaRecommendation: "Move to Private Beta Gate",
  publicBetaRecommendation: "No-Go",
  p0FindingCount: 0,
  p0FallbackRecommendation: "Targeted hotfix PRs required",
  testedEnvironment: {
    localBaseUrl: "http://127.0.0.1:3006",
    appServerCommand: "npm.cmd run dev -- --hostname 127.0.0.1 --port 3006",
    executionSpec: "tests/paid-beta-manual-qa-execution.spec.ts",
    dataBoundary: "browser-local storage only",
    productionDataUsed: false
  },
  validationCommands: PAID_BETA_MANUAL_QA_EXECUTION_VALIDATION_COMMANDS,
  routeChecks: PAID_BETA_MANUAL_QA_EXECUTION_ROUTE_CHECKS,
  localStorageProbes: PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES,
  qaResultSections: PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS,
  findings: PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS,
  stopConditions: PAID_BETA_MANUAL_QA_EXECUTION_STOP_CONDITIONS,
  rollbackNotes: PAID_BETA_MANUAL_QA_EXECUTION_ROLLBACK_NOTES,
  safetyPolicy: PAID_BETA_MANUAL_QA_EXECUTION_SAFETY_POLICY
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

export function getManualQaStorageProbe(key: PaidBetaManualQaExecutionStorageKey) {
  return PAID_BETA_MANUAL_QA_EXECUTION_LOCAL_STORAGE_PROBES.find(
    (probe) => probe.key === key
  );
}

export function getQaResultSection(title: PaidBetaManualQaExecutionQaSectionTitle) {
  return PAID_BETA_MANUAL_QA_EXECUTION_QA_RESULT_SECTIONS.find(
    (section) => section.title === title
  );
}

export function getFindingsBySeverity(
  severity: PaidBetaManualQaExecutionSeverity
) {
  return PAID_BETA_MANUAL_QA_EXECUTION_FINDINGS.filter(
    (finding) => finding.severity === severity
  );
}

export function getP0Findings() {
  return getFindingsBySeverity("P0");
}

export function getP0FindingCount() {
  return getP0Findings().length;
}

export function getPrivateBetaVerdict() {
  return PAID_BETA_MANUAL_QA_EXECUTION_PRIVATE_VERDICT;
}

export function getPublicBetaVerdict() {
  return PAID_BETA_MANUAL_QA_EXECUTION_PUBLIC_VERDICT;
}
