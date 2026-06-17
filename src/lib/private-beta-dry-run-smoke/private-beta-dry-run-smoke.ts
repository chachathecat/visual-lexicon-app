export const VISUAL_LEXICON_PRIVATE_BETA_DRY_RUN_SMOKE_VERSION = 1 as const;

export type PrivateBetaDryRunSmokeVersion =
  typeof VISUAL_LEXICON_PRIVATE_BETA_DRY_RUN_SMOKE_VERSION;

export type PrivateBetaDryRunSmokeVerdict =
  | "Conditional / Manual-only"
  | "No-Go"
  | "Blocked until #90 launch decision";

export type PrivateBetaDryRunSmokeSeverity = "P0" | "P1" | "P2";

export type PrivateBetaDryRunSmokeDisposition =
  | "pass"
  | "manual_retest_required"
  | "blocked";

export const PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_PATHS = [
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

export type PrivateBetaDryRunSmokeRoutePath =
  (typeof PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_PATHS)[number];

export const PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_KEYS = [
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_pending_home_quiz"
] as const;

export type PrivateBetaDryRunSmokeStorageKey =
  (typeof PRIVATE_BETA_DRY_RUN_SMOKE_STORAGE_KEYS)[number];

export type PrivateBetaDryRunSmokeRouteSmokeCheck = {
  id: string;
  path: PrivateBetaDryRunSmokeRoutePath;
  routeExistsInRepo: true;
  smokeExpectation: string;
  manualQaFocus: string;
  evidence: readonly string[];
  mustNotFake: readonly string[];
  disposition: PrivateBetaDryRunSmokeDisposition;
};

export type PrivateBetaDryRunSmokeStorageProbe = {
  key: PrivateBetaDryRunSmokeStorageKey;
  expectedUse: string;
  qaCheck: string;
  productionSourceOfTruth: false;
  grantsPaidEntitlement: false;
  mustNotContain: readonly string[];
};

export type PrivateBetaDryRunSmokeConsoleHydrationEvidence = {
  cleanPort: 3030;
  baseUrl: "http://127.0.0.1:3030";
  consoleErrorCount: number;
  hydrationWarningCount: number;
  routesChecked: readonly PrivateBetaDryRunSmokeRoutePath[];
  routeLoadStatus: "pass" | "manual_retest_required";
  riskMitigation: string;
};

export type PrivateBetaDryRunSmokeMobileKeyboardAccessibilityEvidence = {
  status: "pass" | "manual_retest_required";
  mobileViewport: "390x844";
  keyboardRouteCoverage: readonly [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing",
    "/save?slug=dissonance&source=word_page"
  ];
  accessibilityChecks: readonly string[];
  overlapAndFocusNotes: string;
};

export type PrivateBetaDryRunSmokeFinding = {
  id: string;
  severity: PrivateBetaDryRunSmokeSeverity;
  title: string;
  blocksOwnerControlledPrivateBeta: boolean;
  blocksPublicPaidBeta: boolean;
  status:
    | "accepted_for_manual_private_beta"
    | "open"
    | "future";
  evidenceRequired: string;
  recommendedAction: string;
};

export type PrivateBetaDryRunSmokeDecision = {
  id: string;
  scenario: string;
  ownerControlledPrivateBetaDecision: "blocked";
  publicPaidBetaDecision: "no_go";
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  rationale: string;
  requiredAction: string;
};

export type PrivateBetaDryRunSmokeNextPr = {
  prNumber: 90;
  title: "Owner-run private beta launch decision";
  docsContractsTestsOnlyRecommended: true;
  realCheckoutAllowed: false;
  automaticEntitlementAllowed: false;
  realAccountSyncAllowed: false;
  productionDeploymentChangesAllowed: false;
};

export type PrivateBetaDryRunSmokeSafetyPolicy = {
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
  productionDataMutationAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  secretsTouchedAllowed: false;
  networkCallsAllowed: false;
  browserStorageMutationAllowed: false;
  npmAuditFixAllowed: false;
  deploymentChangesAllowed: false;
};

export type PrivateBetaDryRunSmokeEvidence = {
  version: PrivateBetaDryRunSmokeVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/private-beta-dry-run-smoke";
  pullRequest: "#89 Private beta dry-run smoke evidence";
  reportDateKst: "2026-06-16";
  scope: "Track B dry-run smoke evidence before owner invitations";
  testedEnvironment: {
    localServerPortUsed: 3030;
    localBaseUrl: "http://127.0.0.1:3030";
    dataBoundary: "local browser storage only";
    productionDataUsed: false;
  };
  ownerControlledPrivateBetaVerdict: "Conditional / Manual-only";
  publicPaidBetaVerdict: "No-Go";
  requiredVerdicts: {
    ownerControlledPrivateBeta: "Conditional / Manual-only";
    publicPaidBeta: "No-Go";
    sendInvitations: "Blocked until #90 launch decision";
    publicCheckout: "Blocked";
    automaticEntitlement: "Blocked";
    realAccountSync: "Blocked";
    productionDeploymentChanges: "Blocked";
  };
  routeSmokeEvidence: readonly PrivateBetaDryRunSmokeRouteSmokeCheck[];
  localStorageProbes: readonly PrivateBetaDryRunSmokeStorageProbe[];
  consoleHydrationEvidence: PrivateBetaDryRunSmokeConsoleHydrationEvidence;
  mobileKeyboardAccessibilityEvidence: PrivateBetaDryRunSmokeMobileKeyboardAccessibilityEvidence;
  findings: readonly PrivateBetaDryRunSmokeFinding[];
  dryRunDecision: PrivateBetaDryRunSmokeDecision;
  nextDryRunPRSequence: readonly PrivateBetaDryRunSmokeNextPr[];
  safetyPolicy: PrivateBetaDryRunSmokeSafetyPolicy;
};

export const PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT =
  "Conditional / Manual-only" as const satisfies PrivateBetaDryRunSmokeVerdict;

export const PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT =
  "No-Go" as const satisfies PrivateBetaDryRunSmokeVerdict;

export const PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_SMOKE_CHECKS = [
  {
    id: "home",
    path: "/",
    routeExistsInRepo: true,
    smokeExpectation: "Loads the Track B home surface without visible 404.",
    manualQaFocus: "Home route does not introduce fake review or paid access states.",
    evidence: ["route-load check", "screenshot", "dashboard entrypoint check"],
    mustNotFake: ["mastery", "real paid access", "checkout behavior"],
    disposition: "manual_retest_required"
  },
  {
    id: "dashboard",
    path: "/dashboard",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Today Memory Mission and core cards.",
    manualQaFocus:
      "Due/Weak/New/Learning/Mastered states come from real review state.",
    evidence: ["dashboard screenshot", "review state probe"],
    mustNotFake: ["fake due", "fake weak", "fake mastery"],
    disposition: "manual_retest_required"
  },
  {
    id: "review",
    path: "/review",
    routeExistsInRepo: true,
    smokeExpectation: "Loads review flow.",
    manualQaFocus:
      "Answering a card creates a review event and updates SRS state.",
    evidence: ["review action note", "state/event delta"],
    mustNotFake: ["review events", "box movement", "nextDueAt"],
    disposition: "manual_retest_required"
  },
  {
    id: "review_due",
    path: "/review/due",
    routeExistsInRepo: true,
    smokeExpectation: "Loads due review or honest empty state.",
    manualQaFocus:
      "Due cards derive from `nextDueAt` in review state; no precomputed queue.",
    evidence: ["due-route screenshot", "state probe"],
    mustNotFake: ["due queue", "empty-state bypass"],
    disposition: "manual_retest_required"
  },
  {
    id: "review_weak",
    path: "/review/weak",
    routeExistsInRepo: true,
    smokeExpectation: "Loads weak review or empty state.",
    manualQaFocus:
      "Weak list derives from weakScore or Weak mastery state without synthetic labels.",
    evidence: ["weak-route screenshot", "weak score check"],
    mustNotFake: ["fake weak cards", "fake mistakes"],
    disposition: "manual_retest_required"
  },
  {
    id: "review_weak_sprint",
    path: "/review/weak-sprint",
    routeExistsInRepo: true,
    smokeExpectation: "Loads weak sprint flow.",
    manualQaFocus: "Sprint route shares the same real review records.",
    evidence: ["weak-sprint screenshot", "event/state delta"],
    mustNotFake: ["separate fake sprint state"],
    disposition: "manual_retest_required"
  },
  {
    id: "saved",
    path: "/saved",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Saved Library.",
    manualQaFocus:
      "Saved words, tabs, and summaries match `vlx_saved_words_v1` and `vlx_review_state_v1`.",
    evidence: ["saved screenshot", "state/events unchanged probe"],
    mustNotFake: ["saved tab counts", "mastery"],
    disposition: "manual_retest_required"
  },
  {
    id: "packs",
    path: "/packs",
    routeExistsInRepo: true,
    smokeExpectation: "Loads Packs catalog.",
    manualQaFocus:
      "Pack preview/progress evidence is sourced from approved local keys.",
    evidence: ["packs screenshot", "pack-progress local probe"],
    mustNotFake: ["fake pack completion", "pack unlock claims"],
    disposition: "manual_retest_required"
  },
  {
    id: "academic_pack",
    path: "/packs/academic-vocabulary",
    routeExistsInRepo: true,
    smokeExpectation: "Loads academic pack detail.",
    manualQaFocus:
      "Pack progress and CTA behavior align with local evidence only.",
    evidence: ["pack detail screenshot", "cta-route check"],
    mustNotFake: ["fake progress", "free upgrade claim"],
    disposition: "manual_retest_required"
  },
  {
    id: "pricing",
    path: "/pricing",
    routeExistsInRepo: true,
    smokeExpectation: "Loads pricing surface.",
    manualQaFocus:
      "Pricing communicates manual payment and does not create entitlement.",
    evidence: ["pricing screenshot", "upgrade interest probe"],
    mustNotFake: ["checkout", "subscription", "entitlement mutation"],
    disposition: "manual_retest_required"
  },
  {
    id: "save_route",
    path: "/save?slug=dissonance&source=word_page",
    routeExistsInRepo: true,
    smokeExpectation: "Loads save route and records local saved word.",
    manualQaFocus:
      "Save creates or preserves review state and does not grant fake mastery.",
    evidence: [
      "save screenshot",
      "saved words state probe",
      "review state probe"
    ],
    mustNotFake: ["fake mastery", "fake progress", "entitlement"],
    disposition: "manual_retest_required"
  },
  {
    id: "word_dissonance",
    path: "/word/dissonance",
    routeExistsInRepo: true,
    smokeExpectation: "Loads word detail route.",
    manualQaFocus:
      "Word detail memory panel reflects actual local review state.",
    evidence: ["word screenshot", "memory panel check"],
    mustNotFake: ["fake memory panel", "fake review state"],
    disposition: "manual_retest_required"
  },
  {
    id: "word_obfuscate",
    path: "/word/obfuscate",
    routeExistsInRepo: true,
    smokeExpectation: "Loads alternate word detail route.",
    manualQaFocus:
      "Alternate word route remains consistent with local storage-backed review state.",
    evidence: ["word screenshot", "weak/memory state check"],
    mustNotFake: ["fake weak score", "fake mastery"],
    disposition: "manual_retest_required"
  }
] as const satisfies readonly PrivateBetaDryRunSmokeRouteSmokeCheck[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_LOCAL_STORAGE_PROBES = [
  {
    key: "vlx_saved_words_v1",
    expectedUse: "Saved word records by slug.",
    qaCheck:
      "Dissonance appears after save with no fabricated IDs or hidden payloads.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: [
      "secrets",
      "provider tokens",
      "payment payloads",
      "raw storage dumps"
    ]
  },
  {
    key: "vlx_review_state_v1",
    expectedUse: "SRS memory state for saved/reviewed words.",
    qaCheck:
      "box, mastery, and due fields update only via review answers and SRS rules.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake mastery", "fake due date", "entitlement proof"]
  },
  {
    key: "vlx_review_events_v1",
    expectedUse: "Review answer event log.",
    qaCheck: "Event count increases after review answer actions.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["payment references", "billing state", "subscriptions"]
  },
  {
    key: "vlx_daily_stats_v1",
    expectedUse: "Local daily review activity counters.",
    qaCheck: "Stats advance on real review answers only.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake weekly reviewed words", "fake streaks"]
  },
  {
    key: "vlx_pack_progress_v1",
    expectedUse: "Pack progress tracker for preview and start history.",
    qaCheck: "Pack state is tied to pack interactions and local actions.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["fake completion", "entitlement proof", "paid access"]
  },
  {
    key: "vlx_pending_home_quiz",
    expectedUse: "Optional transition key.",
    qaCheck: "Cannot replace review state or override SRS memory.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["replace review state", "fake mastery"]
  }
] as const satisfies readonly PrivateBetaDryRunSmokeStorageProbe[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE = {
  cleanPort: 3030,
  baseUrl: "http://127.0.0.1:3030",
  consoleErrorCount: 0,
  hydrationWarningCount: 0,
  routesChecked: [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing"
  ],
  routeLoadStatus: "pass",
  riskMitigation:
    "Use a clean local port (3030) and fresh browser profile so stale server artifacts do not mask route failures."
} as const satisfies PrivateBetaDryRunSmokeConsoleHydrationEvidence;

export const PRIVATE_BETA_DRY_RUN_SMOKE_MOBILE_KEYBOARD_ACCESSIBILITY_EVIDENCE = {
  status: "manual_retest_required",
  mobileViewport: "390x844",
  keyboardRouteCoverage: [
    "/dashboard",
    "/review",
    "/saved",
    "/packs",
    "/pricing",
    "/save?slug=dissonance&source=word_page"
  ],
  accessibilityChecks: [
    "route navigation works in narrow viewport",
    "focus states are visible on save, review, answer, pricing controls",
    "core keyboard interactions are reachable for dashboard/review/pricing controls",
    "no color-only critical status in Due/Weak/Mastered indicators"
  ],
  overlapAndFocusNotes:
    "Confirm no overlap in mobile review/save cards and all focused controls are readable."
} as const satisfies PrivateBetaDryRunSmokeMobileKeyboardAccessibilityEvidence;

export const PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS = [
  {
    id: "p0_real_checkout_not_implemented",
    severity: "P0",
    title: "Real checkout is not implemented.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "accepted_for_manual_private_beta",
    evidenceRequired:
      "Pricing and route smoke evidence confirms no checkout/subscription path in core flow.",
    recommendedAction:
      "Keep manual payment link flow and do not add real checkout in this phase."
  },
  {
    id: "p0_real_account_sync_not_implemented",
    severity: "P0",
    title: "Real account sync is not implemented.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "open",
    evidenceRequired: "Participants are disclosed that learning state is local.",
    recommendedAction:
      "Keep manual private beta with explicit local-state limitation until future sync work."
  },
  {
    id: "p0_automatic_entitlement_not_implemented",
    severity: "P0",
    title: "Automatic entitlement is not implemented.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "open",
    evidenceRequired: "No entitlement mutation in app logic or localStorage schema.",
    recommendedAction:
      "Continue manual/off-app entitlement handling and avoid automatic grant pathways."
  },
  {
    id: "p0_production_deployment_changes_blocked",
    severity: "P0",
    title: "Production deployment or infrastructure changes are blocked.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "open",
    evidenceRequired:
      "Repo-local static contracts and no route handlers/API changes are recorded.",
    recommendedAction:
      "Keep docs/contracts/tests only for this PR sequence."
  },
  {
    id: "p1_console_hydration_and_route_smoke_evidence_pending",
    severity: "P1",
    title: "Core route smoke and console/hydration evidence should be repeated pre-invite.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "open",
    evidenceRequired: "Fresh manual smoke records before owner invitations are sent.",
    recommendedAction:
      "Rerun the route, storage, console, hydration, mobile, keyboard checks on clean profile."
  },
  {
    id: "p1_accessibility_polish_pending",
    severity: "P1",
    title:
      "Full accessibility review is deferred until after owner launch readiness.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: true,
    status: "future",
    evidenceRequired:
      "Accessibility smoke completed and expanded after owner launch.",
    recommendedAction: "Run full accessibility audit before any public rollout."
  },
  {
    id: "p2_pack_progress_and_polish",
    severity: "P2",
    title:
      "Packs, mobile polish, and future AI tutor behavior can evolve after this scope.",
    blocksOwnerControlledPrivateBeta: false,
    blocksPublicPaidBeta: false,
    status: "future",
    evidenceRequired: "No launch dependency; these remain polish improvements.",
    recommendedAction:
      "Prioritize these after stable private beta review loop and launch decision."
  }
] as const satisfies readonly PrivateBetaDryRunSmokeFinding[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_DECISION = {
  id: "decision_private_beta_launch_blocked_until_pr90",
  scenario:
    "Owner wants to send owner-only invites before a final launch decision is recorded.",
  ownerControlledPrivateBetaDecision: "blocked",
  publicPaidBetaDecision: "no_go",
  ownerControlledPrivateBetaVerdict: PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  publicPaidBetaVerdict: PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
  rationale:
    "Dry-run evidence is still manual evidence collection, so owner invitations stay blocked until PR #90.",
  requiredAction: "Complete PR #90 launch decision before inviting users."
} as const satisfies PrivateBetaDryRunSmokeDecision;

export const PRIVATE_BETA_DRY_RUN_SMOKE_NEXT_PR_SEQUENCE = [
  {
    prNumber: 90,
    title: "Owner-run private beta launch decision",
    docsContractsTestsOnlyRecommended: true,
    realCheckoutAllowed: false,
    automaticEntitlementAllowed: false,
    realAccountSyncAllowed: false,
    productionDeploymentChangesAllowed: false
  }
] as const satisfies readonly PrivateBetaDryRunSmokeNextPr[];

export const PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY = {
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
  productionDataMutationAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  secretsTouchedAllowed: false,
  networkCallsAllowed: false,
  browserStorageMutationAllowed: false,
  npmAuditFixAllowed: false,
  deploymentChangesAllowed: false
} as const satisfies PrivateBetaDryRunSmokeSafetyPolicy;

export const PRIVATE_BETA_DRY_RUN_SMOKE = {
  version: VISUAL_LEXICON_PRIVATE_BETA_DRY_RUN_SMOKE_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/private-beta-dry-run-smoke",
  pullRequest: "#89 Private beta dry-run smoke evidence",
  reportDateKst: "2026-06-16",
  scope: "Track B dry-run smoke evidence before owner invitations",
  testedEnvironment: {
    localServerPortUsed: 3030,
    localBaseUrl: "http://127.0.0.1:3030",
    dataBoundary: "local browser storage only",
    productionDataUsed: false
  },
  ownerControlledPrivateBetaVerdict: PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
  publicPaidBetaVerdict: PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
  requiredVerdicts: {
    ownerControlledPrivateBeta:
      PRIVATE_BETA_DRY_RUN_SMOKE_OWNER_VERDICT,
    publicPaidBeta: PRIVATE_BETA_DRY_RUN_SMOKE_PUBLIC_VERDICT,
    sendInvitations: "Blocked until #90 launch decision",
    publicCheckout: "Blocked",
    automaticEntitlement: "Blocked",
    realAccountSync: "Blocked",
    productionDeploymentChanges: "Blocked"
  },
  routeSmokeEvidence: PRIVATE_BETA_DRY_RUN_SMOKE_ROUTE_SMOKE_CHECKS,
  localStorageProbes: PRIVATE_BETA_DRY_RUN_SMOKE_LOCAL_STORAGE_PROBES,
  consoleHydrationEvidence:
    PRIVATE_BETA_DRY_RUN_SMOKE_CONSOLE_HYDRATION_EVIDENCE,
  mobileKeyboardAccessibilityEvidence:
    PRIVATE_BETA_DRY_RUN_SMOKE_MOBILE_KEYBOARD_ACCESSIBILITY_EVIDENCE,
  findings: PRIVATE_BETA_DRY_RUN_SMOKE_FINDINGS,
  dryRunDecision: PRIVATE_BETA_DRY_RUN_SMOKE_DECISION,
  nextDryRunPRSequence: PRIVATE_BETA_DRY_RUN_SMOKE_NEXT_PR_SEQUENCE,
  safetyPolicy: PRIVATE_BETA_DRY_RUN_SMOKE_SAFETY_POLICY
} as const satisfies PrivateBetaDryRunSmokeEvidence;

export function getPrivateBetaDryRunSmokeEvidence() {
  return PRIVATE_BETA_DRY_RUN_SMOKE;
}

export function getDryRunVerdict() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.ownerControlledPrivateBetaVerdict;
}

export function getPublicBetaVerdict() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.publicPaidBetaVerdict;
}

export function getRouteSmokeEvidence() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.routeSmokeEvidence;
}

export function getLocalStorageProbeEvidence() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.localStorageProbes;
}

export function getConsoleHydrationEvidence() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.consoleHydrationEvidence;
}

export function getDryRunFindings() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.findings;
}

export function getDryRunDecision() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.dryRunDecision;
}

export function getNextDryRunPRSequence() {
  return PRIVATE_BETA_DRY_RUN_SMOKE.nextDryRunPRSequence;
}
