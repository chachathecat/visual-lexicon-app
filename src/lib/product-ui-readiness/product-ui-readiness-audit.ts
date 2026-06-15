export const TRACK_B_PRODUCT_UI_READINESS_VERSION = 1 as const;

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

export type TrackBProductUiVerdict =
  | "conditional_manual_only_private_paid_beta"
  | "no_go_public_paid_beta";

export type TrackBProductUiSeverity = "P0" | "P1" | "P2";

export type TrackBProductUiRoutePath =
  (typeof TRACK_B_PRODUCT_UI_ROUTE_PATHS)[number];

export type TrackBProductUiAssessment =
  | "clear"
  | "adequate"
  | "partial"
  | "gap"
  | "blocked"
  | "not_applicable";

export type TrackBProductUiRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked"
  | "not_applicable";

export type TrackBProductUiReadinessStatus =
  | "conditional_manual_only"
  | "public_beta_blocked"
  | "needs_rebuild"
  | "future";

export type TrackBProductUiRouteCriteria = {
  primaryUserActionClarity: TrackBProductUiAssessment;
  cognitiveLoad: TrackBProductUiAssessment;
  hickFittsGestaltIssues: TrackBProductUiAssessment;
  saveReviewLoopClarity: TrackBProductUiAssessment;
  savedWordsBecomeReviewItems: TrackBProductUiAssessment;
  reviewUpdatesMemoryState: TrackBProductUiAssessment;
  dueWeakMasteredTruthfulness: TrackBProductUiAssessment;
  fakeMasteryRisk: TrackBProductUiRisk;
  paywallTriggerQuality: TrackBProductUiAssessment;
  pricingOutcomeClarity: TrackBProductUiAssessment;
  freeVsPaidValueClarity: TrackBProductUiAssessment;
  mobileReviewErgonomics: TrackBProductUiAssessment;
  accessibilityRisk: TrackBProductUiRisk;
  keyboardFocusScreenReaderRisk: TrackBProductUiRisk;
  performanceRisk: TrackBProductUiRisk;
  analyticsReadiness: TrackBProductUiAssessment;
  paidBetaReadiness: TrackBProductUiReadinessStatus;
  privacySupportAccountSyncPaymentBlockers: TrackBProductUiRisk;
};

export type TrackBProductUiRouteAudit = {
  path: TrackBProductUiRoutePath;
  label: string;
  primaryUserAction: string;
  currentRole: string;
  routeVerdict: TrackBProductUiReadinessStatus;
  criteria: TrackBProductUiRouteCriteria;
  strengths: readonly string[];
  risks: readonly string[];
  rebuildRecommendation: string;
  recommendedNextPr: 73 | 74 | 75 | 76 | 77 | 78 | 79;
};

export type TrackBProductUiFinding = {
  id: string;
  severity: TrackBProductUiSeverity;
  surface: TrackBProductUiRoutePath | "cross_route" | "safety";
  title: string;
  status: "open" | "accepted_for_manual_private_beta" | "future";
  blocksPrivatePaidBeta: boolean;
  blocksPublicPaidBeta: boolean;
  rationale: string;
  recommendedAction: string;
};

export type TrackBProductUiNextPr = {
  prNumber: 73 | 74 | 75 | 76 | 77 | 78 | 79;
  title: string;
  purpose: string;
  docsContractsTestsOnly: boolean;
  runtimeUiChangeExpected: boolean;
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

export type TrackBProductUiRebuildTarget = {
  surface: "dashboard" | "review_session" | "saved" | "packs" | "pricing";
  mustCenter: readonly string[];
  mustAvoid: readonly string[];
};

export type TrackBProductUiReadinessAudit = {
  version: TrackBProductUiReadinessVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/track-b-product-ui-readiness-audit";
  pullRequest: "#72 Track B Product/UI Readiness Audit";
  scope: "Track B product/UI readiness after PR #71";
  northStarMetric: "Weekly Reviewed Words";
  privatePaidBetaVerdict: TrackBProductUiVerdict;
  publicPaidBetaVerdict: TrackBProductUiVerdict;
  privatePaidBetaRecommendation: "Conditional / Manual-only";
  publicPaidBetaRecommendation: "No-Go";
  futureMentalModel: readonly [
    "Today",
    "Review",
    "Weak",
    "Packs",
    "Saved",
    "Progress"
  ];
  routeAudits: readonly TrackBProductUiRouteAudit[];
  findings: readonly TrackBProductUiFinding[];
  rebuildTargets: readonly TrackBProductUiRebuildTarget[];
  recommendedNextPrs: readonly TrackBProductUiNextPr[];
  safetyPolicy: TrackBProductUiSafetyPolicy;
  safetyBoundaries: readonly TrackBProductUiSafetyBoundary[];
  stopConditions: readonly string[];
  validationCommands: readonly string[];
};

const routeCriteriaDefaults = {
  primaryUserActionClarity: "partial",
  cognitiveLoad: "partial",
  hickFittsGestaltIssues: "partial",
  saveReviewLoopClarity: "partial",
  savedWordsBecomeReviewItems: "adequate",
  reviewUpdatesMemoryState: "adequate",
  dueWeakMasteredTruthfulness: "adequate",
  fakeMasteryRisk: "low",
  paywallTriggerQuality: "partial",
  pricingOutcomeClarity: "partial",
  freeVsPaidValueClarity: "partial",
  mobileReviewErgonomics: "partial",
  accessibilityRisk: "medium",
  keyboardFocusScreenReaderRisk: "medium",
  performanceRisk: "low",
  analyticsReadiness: "partial",
  paidBetaReadiness: "conditional_manual_only",
  privacySupportAccountSyncPaymentBlockers: "blocked"
} as const satisfies TrackBProductUiRouteCriteria;

export const TRACK_B_PRODUCT_UI_ROUTE_AUDITS = [
  {
    path: "/dashboard",
    label: "Dashboard",
    primaryUserAction: "Start today's review mission.",
    currentRole:
      "Mission surface with due, weak, new, mastered, hub progress, saved library, alias search, and contextual paywall prompts.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      cognitiveLoad: "partial",
      saveReviewLoopClarity: "adequate",
      dueWeakMasteredTruthfulness: "clear",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Today Memory Mission already prioritizes review over browsing.",
      "Due, Weak, New, and Mastered counts are derived from local SRS state.",
      "Mastered copy correctly says delayed recall is required."
    ],
    risks: [
      "Too many modules compete with Start Review on the first screen.",
      "Alias search, hub progress, saved library, metrics, and paywall prompts increase scan cost.",
      "Mobile/focus evidence is not recorded across the full dashboard workflow."
    ],
    rebuildRecommendation:
      "Rebuild as Today first: Memory Mission, Start due review, Due/Weak/New/Mastered, Continue pack, Recently saved, and only contextual upgrade prompts.",
    recommendedNextPr: 74
  },
  {
    path: "/review",
    label: "Review",
    primaryUserAction: "Answer one recall question and advance the memory state.",
    currentRole:
      "Mixed local review session from due, weak, saved, or starter cards with answer events and SRS updates.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      reviewUpdatesMemoryState: "clear",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      mobileReviewErgonomics: "partial",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Answers call the existing review state writer and append review events.",
      "The summary exposes weak added, moved forward, box changes, and next review messaging.",
      "Options are deterministic and avoid random easy distractors as the main contract."
    ],
    risks: [
      "The session header exposes many route choices before the learner answers.",
      "No explicit confidence control exists in the UI, even though confidence affects future SRS policy.",
      "Keyboard answer flow and screen-reader announcement quality need evidence."
    ],
    rebuildRecommendation:
      "Rebuild around one card, one question, answer, confidence, immediate feedback, event write, state update, and honest nextDueAt.",
    recommendedNextPr: 75
  },
  {
    path: "/review/due",
    label: "Due Review",
    primaryUserAction: "Review cards whose nextDueAt is due now.",
    currentRole:
      "Route alias for due-mode review using local SRS due dates and the shared session component.",
    routeVerdict: "conditional_manual_only",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "clear",
      reviewUpdatesMemoryState: "clear",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "not_applicable",
      pricingOutcomeClarity: "not_applicable",
      freeVsPaidValueClarity: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Due candidates are selected from real review state.",
      "The route preserves the shared event/state update path.",
      "Empty state does not fake due work."
    ],
    risks: [
      "Due mode still inherits the mixed session's header complexity.",
      "Manual QA must prove due dates are visible and understandable on mobile.",
      "Focus order after an answer needs evidence."
    ],
    rebuildRecommendation:
      "Keep due as the default Start Review target when dueCount is greater than zero, with minimal mode switching inside the session.",
    recommendedNextPr: 75
  },
  {
    path: "/review/weak",
    label: "Weak Review",
    primaryUserAction: "Practice words with mistakes or high weakScore.",
    currentRole:
      "Route alias for weak-mode review using Weak mastery, weakScore, wrong answers, and the shared session component.",
    routeVerdict: "conditional_manual_only",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "clear",
      reviewUpdatesMemoryState: "clear",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "adequate",
      pricingOutcomeClarity: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Weak candidates come from real mistakes and weakScore.",
      "Wrong answers keep reinforcing the same review state record.",
      "Dashboard and Saved can link learners into weak practice."
    ],
    risks: [
      "The difference between Weak Review and Weak Sprint is not yet crisp enough.",
      "Weak repair should make the mistake record more visible before future AI explanation.",
      "Small-screen answer ergonomics need proof."
    ],
    rebuildRecommendation:
      "Make Weak a clear repair queue with mistake count, weakScore, and a focused answer loop before any AI explanation.",
    recommendedNextPr: 75
  },
  {
    path: "/review/weak-sprint",
    label: "Weak Sprint",
    primaryUserAction: "Complete a short five-card weak-word sprint.",
    currentRole:
      "Focused sprint route that caps weak cards at five and writes to the same SRS state.",
    routeVerdict: "conditional_manual_only",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      reviewUpdatesMemoryState: "clear",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "adequate",
      pricingOutcomeClarity: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Sprint candidates are real weak words, not a fabricated challenge.",
      "The summary separates weak improved and still weak.",
      "The empty state is honest when no weak words exist."
    ],
    risks: [
      "This should feel like a repair mode, not a parallel quiz product.",
      "The five-card promise needs visible progress and tap-friendly controls on mobile.",
      "Paywall prompts must not appear before the learner understands why weak repair matters."
    ],
    rebuildRecommendation:
      "Keep the sprint small and focused: one weak card at a time, mistake context, answer, confidence, repair feedback, same state update.",
    recommendedNextPr: 75
  },
  {
    path: "/saved",
    label: "Saved Library",
    primaryUserAction: "Turn saved words into review queues.",
    currentRole:
      "Local saved-word library that displays review state, boxes, weak score, events, and links into saved/due/weak review.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "partial",
      saveReviewLoopClarity: "adequate",
      savedWordsBecomeReviewItems: "clear",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "not_applicable",
      pricingOutcomeClarity: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Saved records do not masquerade as mastered words.",
      "Review state fields appear only when the saved word has state.",
      "Saved, Due, and Weak CTAs point back to review behavior."
    ],
    risks: [
      "The page still reads like a bookmark list before it reads like a queue.",
      "No Due, Weak, New, Learning, Mastered, All segmentation exists yet.",
      "Dense cards can become hard to scan on mobile as saved count grows."
    ],
    rebuildRecommendation:
      "Rebuild as a review queue with tabs for Due, Weak, New, Learning, Mastered, and All.",
    recommendedNextPr: 76
  },
  {
    path: "/packs",
    label: "Packs",
    primaryUserAction: "Choose a learning path and continue a pack.",
    currentRole:
      "Starter pack catalog with Academic Vocabulary available and IELTS/GRE planned placeholders.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "partial",
      saveReviewLoopClarity: "partial",
      savedWordsBecomeReviewItems: "partial",
      reviewUpdatesMemoryState: "adequate",
      dueWeakMasteredTruthfulness: "adequate",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "partial",
      pricingOutcomeClarity: "partial",
      freeVsPaidValueClarity: "partial",
      analyticsReadiness: "partial"
    },
    strengths: [
      "Academic Vocabulary can route into a hub review with pack context.",
      "Planned IELTS/GRE packs are labeled honestly as unavailable.",
      "Pack progress is local and tied to review activity."
    ],
    risks: [
      "The surface is still closer to a catalog than a paid learning plan.",
      "Course promise, preview limits, paid plan value, and continue state need clearer hierarchy.",
      "Content depth and pack quality require audit before public paid claims."
    ],
    rebuildRecommendation:
      "Rebuild around Academic Vocabulary, IELTS Writing, and GRE Visual Verbal as course paths with free preview and paid full-plan framing.",
    recommendedNextPr: 77
  },
  {
    path: "/packs/[packId]",
    label: "Pack Detail",
    primaryUserAction: "Start or continue a specific pack preview.",
    currentRole:
      "Pack detail with preview words, metadata, progress summary, and review action.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      saveReviewLoopClarity: "partial",
      reviewUpdatesMemoryState: "adequate",
      dueWeakMasteredTruthfulness: "adequate",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "partial",
      pricingOutcomeClarity: "partial",
      freeVsPaidValueClarity: "partial",
      analyticsReadiness: "partial"
    },
    strengths: [
      "Available, empty, and placeholder states are distinguishable.",
      "Preview words are real pack data or honest empty states.",
      "Progress summary does not claim full course completion."
    ],
    risks: [
      "Pack detail needs a clearer course syllabus and next lesson model.",
      "Free preview versus paid plan boundaries need more direct copy.",
      "Large preview grids can distract from starting review."
    ],
    rebuildRecommendation:
      "Make each pack detail a course surface: outcome, next review, preview sample, locked plan, and honest progress.",
    recommendedNextPr: 77
  },
  {
    path: "/pricing",
    label: "Pricing",
    primaryUserAction: "Understand paid outcomes without creating paid access.",
    currentRole:
      "Outcome-oriented plan preview with Free, Lite, and Pro positioning and placeholder upgrade interest capture.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      cognitiveLoad: "adequate",
      hickFittsGestaltIssues: "adequate",
      saveReviewLoopClarity: "adequate",
      savedWordsBecomeReviewItems: "not_applicable",
      reviewUpdatesMemoryState: "not_applicable",
      dueWeakMasteredTruthfulness: "not_applicable",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "partial",
      pricingOutcomeClarity: "adequate",
      freeVsPaidValueClarity: "partial",
      mobileReviewErgonomics: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Plan outcomes already match the requested Free, Lite, and Pro mental model.",
      "Billing is explicitly disconnected.",
      "Upgrade clicks remain local interest, not entitlement."
    ],
    risks: [
      "The page still carries MVP disclaimers that are useful for safety but not a polished paid beta pitch.",
      "Free versus Lite versus Pro needs sharper outcome contrast at the moment of intent.",
      "Support, refund, account sync, and payment blockers remain outside this UI."
    ],
    rebuildRecommendation:
      "Sell outcomes: Free starts memory, Lite builds the daily habit, Pro repairs weak words and prepares for exams, with no fake paid access.",
    recommendedNextPr: 78
  },
  {
    path: "/save",
    label: "Save Confirmation",
    primaryUserAction: "Confirm a saved word is now queued for review.",
    currentRole:
      "Save landing surface that writes a local saved word, creates or preserves review state, and links to focused review.",
    routeVerdict: "conditional_manual_only",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "clear",
      cognitiveLoad: "adequate",
      hickFittsGestaltIssues: "adequate",
      saveReviewLoopClarity: "clear",
      savedWordsBecomeReviewItems: "clear",
      reviewUpdatesMemoryState: "adequate",
      dueWeakMasteredTruthfulness: "adequate",
      fakeMasteryRisk: "low",
      pricingOutcomeClarity: "not_applicable",
      freeVsPaidValueClarity: "partial",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Save creates or preserves the review item contract.",
      "Duplicate saves avoid duplicate queue entries.",
      "Unknown words do not create fake saved state."
    ],
    risks: [
      "Save success should make the next review action feel mandatory, not optional.",
      "Source labels are functional but not yet user-centered.",
      "Storage unavailable and error paths need manual QA evidence."
    ],
    rebuildRecommendation:
      "Keep save as a short confirmation that immediately points to focused review and the learner's queue.",
    recommendedNextPr: 75
  },
  {
    path: "/word/[slug]",
    label: "Word Detail",
    primaryUserAction: "Save or review this word using real memory state.",
    currentRole:
      "Static word page with visual metaphor, notes, and local memory state panel.",
    routeVerdict: "conditional_manual_only",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "adequate",
      cognitiveLoad: "adequate",
      saveReviewLoopClarity: "adequate",
      savedWordsBecomeReviewItems: "adequate",
      reviewUpdatesMemoryState: "adequate",
      dueWeakMasteredTruthfulness: "clear",
      fakeMasteryRisk: "low",
      paywallTriggerQuality: "not_applicable",
      pricingOutcomeClarity: "not_applicable",
      freeVsPaidValueClarity: "not_applicable",
      analyticsReadiness: "adequate"
    },
    strengths: [
      "Local memory state panel reads saved state, review state, and event count.",
      "Unsaved and saved states stay honest.",
      "Review this word uses the focused review route."
    ],
    risks: [
      "The top-level Review action can feel generic compared with Save to review or Review this word.",
      "Memory state fields need visual hierarchy for learners who do not understand SRS boxes.",
      "Screen-reader labels for visual metaphor and memory state need evidence."
    ],
    rebuildRecommendation:
      "Use word detail as a support surface for the loop: save, review this word, see honest memory state, then return to the active queue.",
    recommendedNextPr: 76
  },
  {
    path: "/settings",
    label: "Settings",
    primaryUserAction: "Understand local-only plan/preferences boundaries.",
    currentRole:
      "Local preference placeholder with plan preview and paywall trigger debugging surfaces.",
    routeVerdict: "needs_rebuild",
    criteria: {
      ...routeCriteriaDefaults,
      primaryUserActionClarity: "partial",
      cognitiveLoad: "partial",
      hickFittsGestaltIssues: "partial",
      saveReviewLoopClarity: "not_applicable",
      savedWordsBecomeReviewItems: "not_applicable",
      reviewUpdatesMemoryState: "not_applicable",
      dueWeakMasteredTruthfulness: "not_applicable",
      fakeMasteryRisk: "not_applicable",
      paywallTriggerQuality: "partial",
      pricingOutcomeClarity: "partial",
      freeVsPaidValueClarity: "partial",
      mobileReviewErgonomics: "not_applicable",
      analyticsReadiness: "partial"
    },
    strengths: [
      "The page explicitly avoids account, auth, billing, and payment settings.",
      "Local plan state is not treated as paid entitlement.",
      "Preference placeholders do not change product behavior."
    ],
    risks: [
      "Debug-like paywall trigger panels may not belong in a learner-facing paid beta UI.",
      "Account sync, support, privacy, data reset, and payment disclosures are still not productized.",
      "Settings should not become a path to fake paid access."
    ],
    rebuildRecommendation:
      "Keep settings quiet: local data disclosure, reset/export later, preferences later, no fake account or billing controls.",
    recommendedNextPr: 78
  }
] as const satisfies readonly TrackBProductUiRouteAudit[];

export const TRACK_B_PRODUCT_UI_FINDINGS = [
  {
    id: "p0_public_beta_account_sync_missing",
    severity: "P0",
    surface: "cross_route",
    title: "No real account/server sync for saved words, review state, or review events.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Weekly Reviewed Words, due queues, weak words, and progress are browser-local and cannot support public paid account expectations.",
    recommendedAction:
      "Keep this PR docs/contracts/tests only; use a separately approved account sync implementation after the UI rebuild sequence."
  },
  {
    id: "p0_public_beta_payment_entitlement_missing",
    severity: "P0",
    surface: "/pricing",
    title: "No real payment, checkout, subscription, billing, or entitlement path.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Pricing and paywall surfaces can capture interest only; they cannot sell or unlock paid access.",
    recommendedAction:
      "Keep public paid beta No-Go until billing, entitlement, support, refund, cancellation, and failed-payment operations are approved."
  },
  {
    id: "p0_full_route_manual_qa_missing",
    severity: "P0",
    surface: "cross_route",
    title: "No full-route product/UI manual QA report is recorded for this branch.",
    status: "open",
    blocksPrivatePaidBeta: true,
    blocksPublicPaidBeta: true,
    rationale:
      "The app may be usable for owner-run validation, but private invites need recorded evidence across save, review, weak, packs, pricing, mobile, and accessibility.",
    recommendedAction:
      "Run #79 Manual QA execution report before treating the UI rebuild as beta-ready."
  },
  {
    id: "p0_accessibility_keyboard_mobile_evidence_missing",
    severity: "P0",
    surface: "cross_route",
    title: "Accessibility, keyboard/focus, screen-reader, and mobile evidence is incomplete.",
    status: "open",
    blocksPrivatePaidBeta: true,
    blocksPublicPaidBeta: true,
    rationale:
      "The review loop depends on fast answer selection and feedback comprehension; inaccessible controls directly harm Weekly Reviewed Words.",
    recommendedAction:
      "Record keyboard, focus, labels, live-region behavior, contrast, and small-screen review QA before private invites."
  },
  {
    id: "p0_public_beta_privacy_support_rollback_missing",
    severity: "P0",
    surface: "safety",
    title: "Privacy, support, account recovery, data reset, and rollback operations are not launch-ready.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "A public paid beta needs support and privacy operations around learner memory state, not only product UI.",
    recommendedAction:
      "Keep public paid beta No-Go until support, disclosure, rollback, and production data operations are approved."
  },
  {
    id: "p1_dashboard_hierarchy_needs_today_first_rebuild",
    severity: "P1",
    surface: "/dashboard",
    title: "Dashboard hierarchy needs a stricter Today first rebuild.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "The current dashboard contains the right raw ingredients but gives too many secondary modules similar visual weight.",
    recommendedAction:
      "Ship #74 Dashboard v2 around Today's Memory Mission, Start due review, weak repair, continue pack, and recently saved."
  },
  {
    id: "p1_review_session_needs_confidence_and_focus",
    severity: "P1",
    surface: "/review",
    title: "Review session needs explicit confidence and less mode-switching inside the answer flow.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "The state update is real, but the future paid habit needs a more focused active recall loop and confidence signal.",
    recommendedAction:
      "Ship #75 Review Session v2 with one card, one question, answer, confidence, feedback, event write, state update, and nextDueAt."
  },
  {
    id: "p1_saved_page_needs_queue_tabs",
    severity: "P1",
    surface: "/saved",
    title: "Saved page needs queue tabs instead of a bookmark-list feel.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Saved is valuable only when it feeds review; the page should group Due, Weak, New, Learning, Mastered, and All.",
    recommendedAction:
      "Ship #76 Saved Library v2 as a review queue."
  },
  {
    id: "p1_packs_need_course_plan_model",
    severity: "P1",
    surface: "/packs",
    title: "Packs need a course/plan model instead of a catalog model.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Paid learners need paths like Academic Vocabulary, IELTS Writing, and GRE Visual Verbal with honest preview and plan boundaries.",
    recommendedAction:
      "Ship #77 Packs v2 with course outcomes, continue state, preview for free users, and full-plan framing for paid users."
  },
  {
    id: "p1_pricing_paywall_need_outcome_clarity",
    severity: "P1",
    surface: "/pricing",
    title: "Pricing and paywall triggers need sharper outcome clarity.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Free, Lite, and Pro have good draft outcomes, but public paid beta needs polished value, support, and no-checkout boundaries.",
    recommendedAction:
      "Ship #78 Pricing / Paywall v2 around memory outcomes, weak-word repair, exam prep, and honest no-fake-access constraints."
  },
  {
    id: "p1_analytics_taxonomy_needs_ui_mapping",
    severity: "P1",
    surface: "cross_route",
    title: "Analytics readiness needs a route-to-event mapping for Weekly Reviewed Words.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: true,
    rationale:
      "Local events exist, but the UI rebuild should preserve a clean path from save to review event to weekly reporting.",
    recommendedAction:
      "Define event expectations for Save, Review start, Answer, Complete, Weak repair, Pack preview, and Upgrade interest in the rebuild PRs."
  },
  {
    id: "p2_copy_density_and_debug_language_polish",
    severity: "P2",
    surface: "cross_route",
    title: "Copy density and MVP/debug language need polish.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    rationale:
      "Safety disclaimers are important but should be moved into the right contexts as the paid beta UI matures.",
    recommendedAction:
      "Trim explanatory copy after P0/P1 learning loop and safety evidence are in place."
  },
  {
    id: "p2_visual_cue_consistency_polish",
    severity: "P2",
    surface: "cross_route",
    title: "Visual cue styling needs consistency polish across cards, packs, and review.",
    status: "open",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    rationale:
      "The visual metaphor is core to the product, but current previews mix generated CSS cues, pack images, and placeholder states.",
    recommendedAction:
      "Standardize visual cue dimensions, loading, and alt/label patterns after the main rebuild sequence."
  },
  {
    id: "p2_future_progress_surface",
    severity: "P2",
    surface: "cross_route",
    title: "Progress should become a later surface after review habit proof.",
    status: "future",
    blocksPrivatePaidBeta: false,
    blocksPublicPaidBeta: false,
    rationale:
      "Progress is part of the future mental model, but dashboard/review/saved/packs must prove the loop first.",
    recommendedAction:
      "Do not add a new route group in this PR; defer Progress until real review history and account sync are ready."
  }
] as const satisfies readonly TrackBProductUiFinding[];

export const TRACK_B_PRODUCT_UI_REBUILD_TARGETS = [
  {
    surface: "dashboard",
    mustCenter: [
      "Today's Memory Mission",
      "Start due review",
      "Due / Weak / New / Mastered",
      "Continue pack",
      "Recently saved",
      "Contextual upgrade trigger only"
    ],
    mustAvoid: [
      "Saved Library dominance",
      "Fake streaks or fake progress",
      "Upgrade prompts without learning context"
    ]
  },
  {
    surface: "review_session",
    mustCenter: [
      "One card",
      "One question",
      "Image/definition/word recall",
      "Answer",
      "Confidence",
      "Immediate feedback",
      "review_state update",
      "review_events update",
      "Honest nextDueAt"
    ],
    mustAvoid: [
      "Fake mastery",
      "Random easy distractors as the primary method",
      "AI explanation before the SRS loop is stable"
    ]
  },
  {
    surface: "saved",
    mustCenter: ["Due", "Weak", "New", "Learning", "Mastered", "All"],
    mustAvoid: [
      "Bookmark-list framing",
      "Saved count as the success metric",
      "Mastery labels without review state"
    ]
  },
  {
    surface: "packs",
    mustCenter: [
      "Academic Vocabulary",
      "IELTS Writing",
      "GRE Visual Verbal",
      "Preview for free users",
      "Full plan for paid users"
    ],
    mustAvoid: [
      "Catalog-only layout",
      "Paid pack claims without content evidence",
      "Fake pack progress"
    ]
  },
  {
    surface: "pricing",
    mustCenter: [
      "Free: Start remembering your first words.",
      "Lite: Build a daily visual memory habit.",
      "Pro: Fix weak words and prepare for exams."
    ],
    mustAvoid: [
      "Quota-first selling",
      "Fake paid access",
      "Checkout implication before billing approval"
    ]
  }
] as const satisfies readonly TrackBProductUiRebuildTarget[];

export const TRACK_B_PRODUCT_UI_RECOMMENDED_NEXT_PRS = [
  {
    prNumber: 73,
    title: "Track B design tokens / app shell v2",
    purpose:
      "Set calmer premium layout, navigation, spacing, focus, and responsive foundations for the rebuild.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 74,
    title: "Dashboard v2: Today's Memory Mission",
    purpose:
      "Make Today the first screen and put review behavior above saved-library browsing.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 75,
    title: "Review Session v2",
    purpose:
      "Rebuild active recall around one card, confidence, feedback, review_state, review_events, and nextDueAt.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 76,
    title: "Saved Library v2",
    purpose:
      "Turn Saved into a review queue with Due, Weak, New, Learning, Mastered, and All.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 77,
    title: "Packs v2",
    purpose:
      "Reframe packs as course paths with honest preview and paid plan boundaries.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 78,
    title: "Pricing / Paywall v2",
    purpose:
      "Sell outcomes instead of quotas while preserving no-payment and no-fake-access boundaries.",
    docsContractsTestsOnly: false,
    runtimeUiChangeExpected: true
  },
  {
    prNumber: 79,
    title: "Manual QA execution report",
    purpose:
      "Record route, mobile, keyboard, focus, accessibility, privacy, and golden-flow evidence.",
    docsContractsTestsOnly: true,
    runtimeUiChangeExpected: false
  }
] as const satisfies readonly TrackBProductUiNextPr[];

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
    label: "No runtime UI changes in PR #72",
    allowed: false,
    note: "This PR records audit data, docs, and tests only."
  },
  {
    id: "no_api_routes_or_handlers",
    label: "No API routes, route handlers, or middleware",
    allowed: false,
    note: "Account sync and route handlers require separate explicit approval."
  },
  {
    id: "no_database_or_provider_sdk",
    label: "No database integrations or provider SDKs",
    allowed: false,
    note: "Supabase, Prisma, Drizzle, Neon, Firebase, and similar providers stay out of scope."
  },
  {
    id: "no_payment_billing_or_entitlement",
    label: "No payment, billing, checkout, subscription, or entitlement logic",
    allowed: false,
    note: "Pricing may describe outcomes but must not create paid access."
  },
  {
    id: "no_production_or_platform_mutation",
    label: "No Webflow, Cloudflare, Vercel, DNS, env, deployment, or production data mutation",
    allowed: false,
    note: "Track B local docs/contracts/tests only."
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
  "npm.cmd run test -- --workers=1"
] as const;

export const TRACK_B_PRODUCT_UI_READINESS_AUDIT = {
  version: TRACK_B_PRODUCT_UI_READINESS_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/track-b-product-ui-readiness-audit",
  pullRequest: "#72 Track B Product/UI Readiness Audit",
  scope: "Track B product/UI readiness after PR #71",
  northStarMetric: "Weekly Reviewed Words",
  privatePaidBetaVerdict: "conditional_manual_only_private_paid_beta",
  publicPaidBetaVerdict: "no_go_public_paid_beta",
  privatePaidBetaRecommendation: "Conditional / Manual-only",
  publicPaidBetaRecommendation: "No-Go",
  futureMentalModel: [
    "Today",
    "Review",
    "Weak",
    "Packs",
    "Saved",
    "Progress"
  ],
  routeAudits: TRACK_B_PRODUCT_UI_ROUTE_AUDITS,
  findings: TRACK_B_PRODUCT_UI_FINDINGS,
  rebuildTargets: TRACK_B_PRODUCT_UI_REBUILD_TARGETS,
  recommendedNextPrs: TRACK_B_PRODUCT_UI_RECOMMENDED_NEXT_PRS,
  safetyPolicy: TRACK_B_PRODUCT_UI_SAFETY_POLICY,
  safetyBoundaries: TRACK_B_PRODUCT_UI_SAFETY_BOUNDARIES,
  stopConditions: TRACK_B_PRODUCT_UI_STOP_CONDITIONS,
  validationCommands: TRACK_B_PRODUCT_UI_VALIDATION_COMMANDS
} as const satisfies TrackBProductUiReadinessAudit;

export function getTrackBProductUiAudit() {
  return TRACK_B_PRODUCT_UI_READINESS_AUDIT;
}

export function getRouteAuditByPath(path: TrackBProductUiRoutePath | string) {
  return TRACK_B_PRODUCT_UI_ROUTE_AUDITS.find((route) => route.path === path);
}

export function getFindingsBySeverity(severity: TrackBProductUiSeverity) {
  return TRACK_B_PRODUCT_UI_FINDINGS.filter(
    (finding) => finding.severity === severity
  );
}

export function getP0Blockers() {
  return getFindingsBySeverity("P0");
}

export function getRecommendedNextPrs() {
  return TRACK_B_PRODUCT_UI_RECOMMENDED_NEXT_PRS;
}

export function getSafetyBoundaryById(id: string) {
  return TRACK_B_PRODUCT_UI_SAFETY_BOUNDARIES.find(
    (boundary) => boundary.id === id
  );
}
