export const TRACK_B_PRODUCT_UI_READINESS_VERSION = 2 as const;

export const TRACK_B_PRODUCT_UI_ROUTE_PATHS = [
  "/dashboard",
  "/review",
  "/review/due",
  "/review/weak",
  "/review/weak-sprint",
  "/saved",
  "/packs",
  "/packs/[packId]",
  "/pricing",
  "/save",
  "/word/[slug]",
  "/settings"
] as const;

export type TrackBProductUiReadinessVersion =
  typeof TRACK_B_PRODUCT_UI_READINESS_VERSION;

export type TrackBProductUiAudience = "private" | "public";

export type TrackBProductUiVerdict =
  | "conditional_manual_only_private_paid_beta"
  | "no_go_public_paid_beta";

export type TrackBProductUiSeverity = "P0" | "P1" | "P2";

export type TrackBProductUiFindingStatus = "confirmed" | "suspected";

export type TrackBProductUiConfidence = "High" | "Medium";

export type TrackBProductUiRoutePath =
  (typeof TRACK_B_PRODUCT_UI_ROUTE_PATHS)[number];

export type TrackBProductUiFindingSurface =
  | TrackBProductUiRoutePath
  | "cross_route"
  | "local_environment";

export type TrackBProductUiReadinessStatus =
  | "clear_for_private_manual_beta"
  | "accepted_private_beta_risk"
  | "public_beta_blocked";

export type TrackBProductUiSourceMetadata = {
  reportType: "rendered-application evidence audit";
  reportVersion: 2;
  sourcePr: "#119";
  auditedCommit: "13141144a18e7192435b035478f2b0e7f469300f";
  auditDate: "2026-06-24";
};

export type TrackBProductUiFindingCounts = {
  confirmed: Record<TrackBProductUiSeverity, number>;
  suspected: Record<TrackBProductUiSeverity, number>;
};

export type TrackBProductUiBetaSummary = {
  verdict: TrackBProductUiVerdict;
  label: "Conditional / Manual-only" | "No-Go";
  recommendation:
    | "A Conditional Go for owner-managed, invite-only use"
    | "Public paid beta remains No-Go";
  confirmedP0BlockerIds: readonly string[];
};

export type TrackBProductUiRouteAudit = {
  path: TrackBProductUiRoutePath;
  label: string;
  primaryUserAction: string;
  renderedEvidence: string;
  routeVerdict: TrackBProductUiReadinessStatus;
  confirmedIssueIds: readonly string[];
  suspectedRiskIds: readonly string[];
  acceptedPrivateBetaRisks: readonly string[];
  publicBetaBlockers: readonly string[];
  recommendation: string;
};

export type TrackBProductUiFinding = {
  id: string;
  severity: TrackBProductUiSeverity;
  status: TrackBProductUiFindingStatus;
  surface: readonly TrackBProductUiFindingSurface[];
  title: string;
  blocksPrivatePaidBeta: boolean;
  blocksPublicPaidBeta: boolean;
  themes: readonly string[];
  evidence: string;
  betaImpact: string;
  recommendedAction: string;
  confidence: TrackBProductUiConfidence;
};

export type TrackBProductUiSafetyPolicy = {
  docsContractsTestsOnly: true;
  noRuntimeUiChanges: true;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  databaseIntegrationsAllowed: false;
  providerSdkAllowed: false;
  authBillingPaymentChangesAllowed: false;
  productionDataMutationAllowed: false;
  environmentVariableChangesAllowed: false;
  deploymentChangesAllowed: false;
  webflowCloudflareVercelDnsChangesAllowed: false;
  fakeMasteryAllowed: false;
  fakePaidAccessAllowed: false;
  networkCallsAllowed: false;
  browserStorageWritesAllowed: false;
};

export type TrackBProductUiSafetyBoundary = {
  id: string;
  label: string;
  allowed: boolean;
  note: string;
};

export type TrackBProductUiReadinessAudit = {
  version: TrackBProductUiReadinessVersion;
  repository: "chachathecat/visual-lexicon-app";
  source: TrackBProductUiSourceMetadata;
  contractBranch: "fix/product-ui-readiness-contract-v2";
  scope: "Track B product/UI readiness contract reconciled to PR #119 rendered evidence after PR #120 merge";
  northStarMetric: "Weekly Reviewed Words";
  privatePaidBetaVerdict: TrackBProductUiVerdict;
  publicPaidBetaVerdict: TrackBProductUiVerdict;
  privatePaidBetaRecommendation: "Conditional / Manual-only";
  publicPaidBetaRecommendation: "No-Go";
  privatePaidBeta: TrackBProductUiBetaSummary;
  publicPaidBeta: TrackBProductUiBetaSummary;
  findingCounts: TrackBProductUiFindingCounts;
  routeAudits: readonly TrackBProductUiRouteAudit[];
  findings: readonly TrackBProductUiFinding[];
  safetyPolicy: TrackBProductUiSafetyPolicy;
  safetyBoundaries: readonly TrackBProductUiSafetyBoundary[];
  stopConditions: readonly string[];
  validationCommands: readonly string[];
};

export const TRACK_B_PRODUCT_UI_SOURCE_METADATA = {
  reportType: "rendered-application evidence audit",
  reportVersion: 2,
  sourcePr: "#119",
  auditedCommit: "13141144a18e7192435b035478f2b0e7f469300f",
  auditDate: "2026-06-24"
} as const satisfies TrackBProductUiSourceMetadata;

export const TRACK_B_PRODUCT_UI_FINDING_COUNTS = {
  confirmed: {
    P0: 1,
    P1: 2,
    P2: 2
  },
  suspected: {
    P0: 0,
    P1: 1,
    P2: 1
  }
} as const satisfies TrackBProductUiFindingCounts;

export const TRACK_B_PRODUCT_UI_ROUTE_AUDITS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    primaryUserAction: "Start today's review mission.",
    renderedEvidence:
      "Rendered 200 on desktop and mobile; Start review link visible; mobile overflow measured at 0px.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "External font failures were local restricted-browser noise, not a confirmed production asset failure."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep dashboard Today-first and preserve real SRS-derived review counts."
  },
  {
    path: "/review",
    label: "Review",
    primaryUserAction: "Answer a focused recall card.",
    renderedEvidence:
      "Rendered 200; answer flow writes review event and state; review cards expose live-region and progress semantics.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-001"],
    acceptedPrivateBetaRisks: [
      "Screen-reader behavior was not tested with assistive technology."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep confidence-before-feedback and the event/state write path."
  },
  {
    path: "/review/due",
    label: "Due Review",
    primaryUserAction: "Review cards due now.",
    renderedEvidence:
      "Rendered 200; direct route uses the shared review session and due candidates from real review state.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-001"],
    acceptedPrivateBetaRisks: [
      "Due explanation copy still needs broader learner-scenario review."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation: "Keep due review as the default Start review target."
  },
  {
    path: "/review/weak",
    label: "Weak Review",
    primaryUserAction: "Repair fragile recall.",
    renderedEvidence:
      "Rendered 200; weak candidates come from real mistakes and weakScore state.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-001"],
    acceptedPrivateBetaRisks: [
      "Future mistake explanations remain locked until the SRS loop is stable."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Preserve state-derived weak queues before adding any AI explanation."
  },
  {
    path: "/review/weak-sprint",
    label: "Weak Sprint",
    primaryUserAction: "Complete a short weak-word sprint.",
    renderedEvidence:
      "Rendered 200; sprint route caps weak review at five cards and uses the same state update path.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-001"],
    acceptedPrivateBetaRisks: [
      "More mobile tap-target evidence would be useful after copy polish."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation: "Keep Weak Sprint small and tied to real weak words."
  },
  {
    path: "/saved",
    label: "Saved Library",
    primaryUserAction: "Turn saved words into review queue actions.",
    renderedEvidence:
      "Rendered 200; Review now, Needs another pass, and Held in memory sections appear after hydration.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "Large-library empty and dense states still need further manual QA."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation: "Keep Saved as queue-first, not bookmark-first."
  },
  {
    path: "/packs",
    label: "Packs",
    primaryUserAction: "Choose a learning plan and start or continue review.",
    renderedEvidence:
      "Rendered 200; Weekly Reviewed Words is derived from real review-event activity.",
    routeVerdict: "accepted_private_beta_risk",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-002"],
    acceptedPrivateBetaRisks: [
      "IELTS and GRE plans are placeholders and must remain unavailable and honest."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep unavailable pack placeholders out of paid claims until content exists."
  },
  {
    path: "/packs/[packId]",
    label: "Pack Detail",
    primaryUserAction: "Start or inspect a specific pack plan.",
    renderedEvidence:
      "/packs/academic-vocabulary rendered 200 with real pack data from the preview catalog.",
    routeVerdict: "accepted_private_beta_risk",
    confirmedIssueIds: [],
    suspectedRiskIds: ["VLX-AUDIT-RISK-002"],
    acceptedPrivateBetaRisks: [
      "Paid/full-plan boundaries still need public-beta content audit."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation: "Preserve free preview and honest unavailable states."
  },
  {
    path: "/pricing",
    label: "Pricing",
    primaryUserAction: "Express paid beta interest without checkout.",
    renderedEvidence:
      "Rendered 200; Lite and Pro are interest-only and the page states no checkout is live.",
    routeVerdict: "public_beta_blocked",
    confirmedIssueIds: ["VLX-AUDIT-P0-001"],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "Pricing TBD copy is acceptable only for owner-managed manual beta."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep interest-only until approved billing, support, and account gates exist."
  },
  {
    path: "/save",
    label: "Save Confirmation",
    primaryUserAction: "Confirm a saved word is now queued for review.",
    renderedEvidence:
      "Rendered save flow creates or preserves review state and routes to focused review.",
    routeVerdict: "clear_for_private_manual_beta",
    confirmedIssueIds: [],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "Storage-unavailable and error paths still need manual QA evidence."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep save confirmation pointed at immediate focused review."
  },
  {
    path: "/word/[slug]",
    label: "Word Detail",
    primaryUserAction: "Save or review a specific word with memory context.",
    renderedEvidence:
      "/word/dissonance rendered 200; mobile 390px viewport measured 259px horizontal overflow.",
    routeVerdict: "accepted_private_beta_risk",
    confirmedIssueIds: ["VLX-AUDIT-P1-001", "VLX-AUDIT-P1-002"],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "Mobile learners can hit horizontal overflow on the legacy word-detail shell.",
      "The obvious Review action starts generic review while focused review is inside the memory panel."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Move word detail into the Track B shell or fix legacy shell width, then make the primary action focused."
  },
  {
    path: "/settings",
    label: "Settings",
    primaryUserAction: "Understand local account, plan, and local-only boundaries.",
    renderedEvidence:
      "Rendered 200; Account Sync is Not connected and Billing is Not configured.",
    routeVerdict: "public_beta_blocked",
    confirmedIssueIds: ["VLX-AUDIT-P0-001", "VLX-AUDIT-P2-002"],
    suspectedRiskIds: [],
    acceptedPrivateBetaRisks: [
      "Learner-facing plan and paywall diagnostics are tolerated only for owner-managed manual beta."
    ],
    publicBetaBlockers: ["VLX-AUDIT-P0-001"],
    recommendation:
      "Keep honest local-only disclosures and hide diagnostics before broader beta."
  }
] as const satisfies readonly TrackBProductUiRouteAudit[];

export const TRACK_B_PRODUCT_UI_FINDINGS = [
  {
    id: "VLX-AUDIT-P0-001",
    severity: "P0",
    status: "confirmed",
    surface: ["/pricing", "/settings", "cross_route"],
    title:
      "Public paid beta lacks payment/billing, account sync, support/refund, and operational readiness.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    themes: [
      "payment/billing",
      "account sync",
      "support/refund/operational readiness"
    ],
    evidence:
      "Pricing is interest-only; Settings shows Account Sync Not connected and Billing Not configured.",
    betaImpact:
      "Public paid users cannot buy, recover, sync, or manage paid access; owner-managed private beta can continue with explicit local-only expectations.",
    recommendedAction:
      "Keep public paid beta No-Go until approved billing, account, support, refund, privacy, monitoring, and rollback gates pass.",
    confidence: "High"
  },
  {
    id: "VLX-AUDIT-P1-001",
    severity: "P1",
    status: "confirmed",
    surface: ["/word/[slug]"],
    title: "/word/[slug] mobile horizontal overflow.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["mobile layout", "word detail"],
    evidence:
      "/word/dissonance at 390 x 844 measured document width overflow of 259px from legacy shell elements.",
    betaImpact:
      "Mobile learners can accidentally pan horizontally on a word detail page; accepted for private manual beta.",
    recommendedAction:
      "Move word detail into the Track B shell or fix the legacy responsive width.",
    confidence: "High"
  },
  {
    id: "VLX-AUDIT-P1-002",
    severity: "P1",
    status: "confirmed",
    surface: ["/word/[slug]"],
    title: "/word/[slug] generic primary Review action.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["primary action", "focused review"],
    evidence:
      "The header Review link points to generic review while focused word review is available only inside the memory panel.",
    betaImpact:
      "The most obvious Review action may start generic review instead of this word; accepted for private manual beta.",
    recommendedAction:
      "Make the word-detail primary action focused on reviewing or saving that word.",
    confidence: "Medium"
  },
  {
    id: "VLX-AUDIT-P2-001",
    severity: "P2",
    status: "confirmed",
    surface: ["/dashboard", "/packs", "local_environment"],
    title: "Local font/favicon console noise.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["local QA noise", "assets"],
    evidence:
      "The rendered audit saw restricted-browser font failures and a local favicon 404 while app content still rendered.",
    betaImpact: "Cosmetic local QA noise; no private beta blocker.",
    recommendedAction:
      "Self-host fonts or tolerate the local restriction; add a favicon if desired.",
    confidence: "Medium"
  },
  {
    id: "VLX-AUDIT-P2-002",
    severity: "P2",
    status: "confirmed",
    surface: ["/settings"],
    title: "Learner-facing Settings diagnostics.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["settings polish", "diagnostics"],
    evidence:
      "Settings renders local plan and paywall trigger diagnostic panels.",
    betaImpact:
      "Acceptable for owner-run private beta, but not polished enough for broader paid beta.",
    recommendedAction:
      "Hide diagnostics behind an owner/debug mode before broader beta.",
    confidence: "High"
  },
  {
    id: "VLX-AUDIT-RISK-001",
    severity: "P2",
    status: "suspected",
    surface: ["/review", "/review/due", "/review/weak", "/review/weak-sprint"],
    title: "Screen-reader behavior not tested with assistive technology.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["accessibility", "assistive technology"],
    evidence:
      "Review has semantic evidence, but no NVDA, VoiceOver, or equivalent screen-reader run was performed.",
    betaImpact:
      "Accepted risk for owner-managed private beta; must be manually tested before expansion.",
    recommendedAction:
      "Run assistive-technology QA through answer, confidence, feedback, and summary.",
    confidence: "Medium"
  },
  {
    id: "VLX-AUDIT-RISK-002",
    severity: "P1",
    status: "suspected",
    surface: ["/packs", "/packs/[packId]"],
    title: "Unavailable IELTS/GRE pack public-content risk.",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    themes: ["pack content", "public paid claims"],
    evidence:
      "IELTS and GRE plans are placeholders in pack preview data and were not audited as sellable content.",
    betaImpact:
      "Private beta can continue while placeholders stay honest; public paid claims must not include unavailable plans.",
    recommendedAction:
      "Keep placeholders unavailable or scope them out until content is ready.",
    confidence: "Medium"
  }
] as const satisfies readonly TrackBProductUiFinding[];

export const TRACK_B_PRODUCT_UI_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  noRuntimeUiChanges: true,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  databaseIntegrationsAllowed: false,
  providerSdkAllowed: false,
  authBillingPaymentChangesAllowed: false,
  productionDataMutationAllowed: false,
  environmentVariableChangesAllowed: false,
  deploymentChangesAllowed: false,
  webflowCloudflareVercelDnsChangesAllowed: false,
  fakeMasteryAllowed: false,
  fakePaidAccessAllowed: false,
  networkCallsAllowed: false,
  browserStorageWritesAllowed: false
} as const satisfies TrackBProductUiSafetyPolicy;

export const TRACK_B_PRODUCT_UI_SAFETY_BOUNDARIES = [
  {
    id: "no_runtime_ui_changes",
    label: "No runtime UI changes",
    allowed: false,
    note: "This contract reconciliation is limited to static data, tests, and documentation."
  },
  {
    id: "no_api_routes_or_handlers",
    label: "No API routes, route handlers, or middleware",
    allowed: false,
    note: "Account sync requires separate explicit approval."
  },
  {
    id: "no_database_or_provider_sdk",
    label: "No database integrations or provider SDKs",
    allowed: false,
    note: "Provider-backed state remains outside this contract reconciliation."
  },
  {
    id: "no_payment_billing_or_entitlement",
    label: "No payment, billing, checkout, subscription, or entitlement logic",
    allowed: false,
    note: "Pricing may record interest only and must not create paid access."
  },
  {
    id: "no_production_or_platform_mutation",
    label:
      "No Webflow, Cloudflare, Vercel, DNS, env, deployment, or production data mutation",
    allowed: false,
    note: "This task must not touch production systems or platform settings."
  },
  {
    id: "no_fake_mastery_or_fake_paid_access",
    label: "No fake mastery or fake paid access",
    allowed: false,
    note: "Due, Weak, Mastered, and paid state must remain honest."
  }
] as const satisfies readonly TrackBProductUiSafetyBoundary[];

export const TRACK_B_PRODUCT_UI_STOP_CONDITIONS = [
  "Stop and ask for approval before Webflow publishing, Cloudflare Worker changes, DNS changes, deployment changes, or production setting changes.",
  "Stop and ask for approval before payment, billing, checkout, subscription, invoice, or entitlement implementation.",
  "Stop and ask for approval before auth, account sync API routes, database providers, migrations, or production data mutation.",
  "Stop if a proposed UI would imply fake mastery, fake paid access, fake pack progress, or fake streaks.",
  "Stop if a rebuild would add large route groups beyond the approved Track B route set."
] as const;

export const TRACK_B_PRODUCT_UI_VALIDATION_COMMANDS = [
  "npm.cmd run typecheck",
  "npm.cmd run lint",
  "npm.cmd run build",
  "npx.cmd playwright test tests/product-ui-readiness-audit.spec.ts --workers=1",
  "npx.cmd playwright test tests/product-ui-readiness.spec.ts --workers=1",
  "npm.cmd run test -- --workers=1"
] as const;

export const TRACK_B_PRODUCT_UI_READINESS_AUDIT = {
  version: TRACK_B_PRODUCT_UI_READINESS_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  source: TRACK_B_PRODUCT_UI_SOURCE_METADATA,
  contractBranch: "fix/product-ui-readiness-contract-v2",
  scope:
    "Track B product/UI readiness contract reconciled to PR #119 rendered evidence after PR #120 merge",
  northStarMetric: "Weekly Reviewed Words",
  privatePaidBetaVerdict: "conditional_manual_only_private_paid_beta",
  publicPaidBetaVerdict: "no_go_public_paid_beta",
  privatePaidBetaRecommendation: "Conditional / Manual-only",
  publicPaidBetaRecommendation: "No-Go",
  privatePaidBeta: {
    verdict: "conditional_manual_only_private_paid_beta",
    label: "Conditional / Manual-only",
    recommendation: "A Conditional Go for owner-managed, invite-only use",
    confirmedP0BlockerIds: []
  },
  publicPaidBeta: {
    verdict: "no_go_public_paid_beta",
    label: "No-Go",
    recommendation: "Public paid beta remains No-Go",
    confirmedP0BlockerIds: ["VLX-AUDIT-P0-001"]
  },
  findingCounts: TRACK_B_PRODUCT_UI_FINDING_COUNTS,
  routeAudits: TRACK_B_PRODUCT_UI_ROUTE_AUDITS,
  findings: TRACK_B_PRODUCT_UI_FINDINGS,
  safetyPolicy: TRACK_B_PRODUCT_UI_SAFETY_POLICY,
  safetyBoundaries: TRACK_B_PRODUCT_UI_SAFETY_BOUNDARIES,
  stopConditions: TRACK_B_PRODUCT_UI_STOP_CONDITIONS,
  validationCommands: TRACK_B_PRODUCT_UI_VALIDATION_COMMANDS
} as const satisfies TrackBProductUiReadinessAudit;

function assertAudience(
  audience: TrackBProductUiAudience
): asserts audience is TrackBProductUiAudience {
  if (audience !== "private" && audience !== "public") {
    throw new Error('getP0Blockers requires audience "private" or "public".');
  }
}

export function getTrackBProductUiAudit() {
  return TRACK_B_PRODUCT_UI_READINESS_AUDIT;
}

export function getRouteAuditByPath(path: TrackBProductUiRoutePath | string) {
  return TRACK_B_PRODUCT_UI_ROUTE_AUDITS.find((route) => route.path === path);
}

export function getFindingById(id: string) {
  return TRACK_B_PRODUCT_UI_FINDINGS.find((finding) => finding.id === id);
}

export function getFindingsBySeverity(severity: TrackBProductUiSeverity) {
  return TRACK_B_PRODUCT_UI_FINDINGS.filter(
    (finding) => finding.severity === severity
  );
}

export function getConfirmedFindingsBySeverity(
  severity: TrackBProductUiSeverity
) {
  return TRACK_B_PRODUCT_UI_FINDINGS.filter(
    (finding) =>
      finding.severity === severity && finding.status === "confirmed"
  );
}

export function getSuspectedFindingsBySeverity(
  severity: TrackBProductUiSeverity
) {
  return TRACK_B_PRODUCT_UI_FINDINGS.filter(
    (finding) =>
      finding.severity === severity && finding.status === "suspected"
  );
}

export function getP0Blockers(audience: TrackBProductUiAudience) {
  assertAudience(audience);

  return TRACK_B_PRODUCT_UI_FINDINGS.filter((finding) => {
    if (finding.severity !== "P0" || finding.status !== "confirmed") {
      return false;
    }

    return audience === "private"
      ? finding.blocksPrivatePaidBeta
      : finding.blocksPublicPaidBeta;
  });
}

export function getSafetyBoundaryById(id: string) {
  return TRACK_B_PRODUCT_UI_SAFETY_BOUNDARIES.find(
    (boundary) => boundary.id === id
  );
}
