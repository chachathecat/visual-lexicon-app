export const VISUAL_LEXICON_PAID_BETA_READINESS_VERSION = 1 as const;

export type VisualLexiconPaidBetaReadinessVersion =
  typeof VISUAL_LEXICON_PAID_BETA_READINESS_VERSION;

export type PaidBetaReadinessVerdict =
  | "no_go"
  | "conditional_go"
  | "go"
  | "conditional_go_for_private_paid_beta_only"
  | "no_go_for_public_paid_beta";

export type PaidBetaReadinessArea =
  | "save_to_review_loop"
  | "local_srs_state_events"
  | "due_weak_mastered"
  | "review_modes"
  | "weak_words_sprint"
  | "saved_library"
  | "dashboard_mission"
  | "pack_preview"
  | "pack_progress"
  | "paywall_triggers"
  | "pricing_outcome_copy"
  | "paid_beta_interest_capture"
  | "extension_bridge"
  | "multilingual_alias_search"
  | "analytics_events"
  | "accessibility"
  | "mobile_responsiveness"
  | "empty_loading_error_states"
  | "manual_qa"
  | "account_sync"
  | "payment_path"
  | "production_monitoring"
  | "privacy_safety";

export type PaidBetaReadinessStatus =
  | "ready"
  | "private_beta_ready"
  | "conditional_private_beta_ready"
  | "manual_qa_required"
  | "needs_review"
  | "blocked"
  | "future";

export type PaidBetaReadinessSeverity = "P0" | "P1" | "P2";

export type PaidBetaRouteInventoryItem = {
  route: string;
  area: PaidBetaReadinessArea;
  label: string;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  currentBehavior: string;
  privateBetaReady: boolean;
  publicBetaReady: boolean;
  manualQaRequired: boolean;
  realStateRequired: boolean;
  fakeProgressAllowed: false;
  notes: string;
};

export type PaidBetaLocalStorageKeyInventoryItem = {
  key: string;
  area: PaidBetaReadinessArea;
  owner: string;
  storedShape: string;
  currentWriter: string;
  currentReaders: readonly string[];
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  productionSourceOfTruth: false;
  grantsPaidEntitlement: false;
  attributionOnly: boolean;
  migrationOrBackupRequiredBeforePublicBeta: boolean;
  notes: string;
};

export type PaidBetaTestInventoryItem = {
  suite: string;
  area: PaidBetaReadinessArea;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  coverage: string;
  requiredForPrivateBeta: boolean;
  requiredForPublicBeta: boolean;
  notes: string;
};

export type PaidBetaManualQARequirement = {
  id: string;
  area: PaidBetaReadinessArea;
  label: string;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  requiredBeforePrivateInvite: boolean;
  requiredBeforePublicBeta: boolean;
  evidenceRequired: string;
};

export type PaidBetaFunnelCheckpoint = {
  id: string;
  area: PaidBetaReadinessArea;
  label: string;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  privateBetaRequired: boolean;
  publicBetaRequired: boolean;
  privacySafe: boolean;
  passCondition: string;
};

export type PaidBetaRisk = {
  id: string;
  area: PaidBetaReadinessArea;
  severity: PaidBetaReadinessSeverity;
  title: string;
  status: "open" | "accepted_for_private_beta" | "closed";
  impactsPrivateBeta: boolean;
  impactsPublicBeta: boolean;
  mitigation: string;
};

export type PaidBetaBlocker = {
  id: string;
  area: PaidBetaReadinessArea;
  severity: PaidBetaReadinessSeverity;
  title: string;
  status: "open";
  blocksPrivateBeta: boolean;
  blocksPublicBeta: boolean;
  ownerApprovalRequired: boolean;
  evidenceRequired: string;
  nextAction: string;
};

export type PaidBetaLaunchGate = {
  id: string;
  area: PaidBetaReadinessArea;
  severity: PaidBetaReadinessSeverity;
  title: string;
  status: PaidBetaReadinessStatus;
  privateBetaAllowed: boolean;
  publicBetaAllowed: boolean;
  requiredBeforePublicBeta: boolean;
  evidenceRequired: string;
};

export type PaidBetaNextStep = {
  prNumber: 71;
  title: "Paid beta manual QA checklist runner or Product/UI readiness audit";
  docsContractsTestsOnly: true;
  realApiRouteImplementationRecommended: false;
  paymentImplementationRecommended: false;
  accountSyncImplementationRecommended: false;
  reason: string;
};

export type PaidBetaReadinessAreaAssessment = {
  area: PaidBetaReadinessArea;
  label: string;
  status: PaidBetaReadinessStatus;
  severity: PaidBetaReadinessSeverity;
  privateBetaAllowed: boolean;
  publicBetaAllowed: boolean;
  evidence: string;
  manualQaRequired: boolean;
  mustUseRealState: boolean;
  fakeMasteryAllowed: false;
};

export type PaidBetaReadinessSafetyPolicy = {
  docsContractsTestsOnly: true;
  noRuntimeBehaviorChange: true;
  apiRoutesAllowed: false;
  routeHandlersAllowed: false;
  middlewareAllowed: false;
  runtimeRouteOrComponentIntegrationAllowed: false;
  realAuthAllowed: false;
  databasePersistenceAllowed: false;
  providerSdkAllowed: false;
  validationDependencyAllowed: false;
  networkCallsAllowed: false;
  browserStorageAccessAllowed: false;
  environmentReadsAllowed: false;
  billingPaymentCheckoutAllowed: false;
  paidEntitlementGrantAllowed: false;
  productionDataAccessAllowed: false;
  migrationsAllowed: false;
  webflowCloudflareVercelDnsAllowed: false;
  fakeMasteryAllowed: false;
};

export type PaidBetaReadinessAudit = {
  visualLexiconPaidBetaReadinessVersion: VisualLexiconPaidBetaReadinessVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/paid-beta-readiness-audit";
  scope: "Track B learning app paid beta readiness";
  privateBetaVerdict: PaidBetaReadinessVerdict;
  publicBetaVerdict: PaidBetaReadinessVerdict;
  privateBetaRecommendation: string;
  publicBetaRecommendation: string;
  areaAssessments: readonly PaidBetaReadinessAreaAssessment[];
  routeInventory: readonly PaidBetaRouteInventoryItem[];
  localStorageKeyInventory: readonly PaidBetaLocalStorageKeyInventoryItem[];
  testInventory: readonly PaidBetaTestInventoryItem[];
  manualQaRequirements: readonly PaidBetaManualQARequirement[];
  funnelCheckpoints: readonly PaidBetaFunnelCheckpoint[];
  risks: readonly PaidBetaRisk[];
  blockers: readonly PaidBetaBlocker[];
  launchGates: readonly PaidBetaLaunchGate[];
  safetyPolicy: PaidBetaReadinessSafetyPolicy;
  nextStep: PaidBetaNextStep;
};

export const PAID_BETA_READINESS_AREA_IDS = [
  "save_to_review_loop",
  "local_srs_state_events",
  "due_weak_mastered",
  "review_modes",
  "weak_words_sprint",
  "saved_library",
  "dashboard_mission",
  "pack_preview",
  "pack_progress",
  "paywall_triggers",
  "pricing_outcome_copy",
  "paid_beta_interest_capture",
  "extension_bridge",
  "multilingual_alias_search",
  "analytics_events",
  "accessibility",
  "mobile_responsiveness",
  "empty_loading_error_states",
  "manual_qa",
  "account_sync",
  "payment_path",
  "production_monitoring",
  "privacy_safety"
] as const satisfies readonly PaidBetaReadinessArea[];

export const PAID_BETA_PRIVATE_VERDICT =
  "conditional_go_for_private_paid_beta_only" as const satisfies PaidBetaReadinessVerdict;

export const PAID_BETA_PUBLIC_VERDICT =
  "no_go_for_public_paid_beta" as const satisfies PaidBetaReadinessVerdict;

export const PAID_BETA_READINESS_AREA_ASSESSMENTS = [
  {
    area: "save_to_review_loop",
    label: "Save to review loop",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Save routes create or preserve saved-word records and review state, and existing tests cover duplicate preservation.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "local_srs_state_events",
    label: "Local SRS state and answer events",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Review answers update local SRS state, append answer events, and update daily stats in existing regression suites.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "due_weak_mastered",
    label: "Due, Weak, and Mastered truthfulness",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Selectors derive due, weak, and mastered states from review state and delayed recall rules; fake mastery remains forbidden.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "review_modes",
    label: "Review modes",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Mixed, due, weak, focused word, hub, and alias routes are represented by route contracts and tests.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "weak_words_sprint",
    label: "Weak words sprint",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Weak sprint candidates come from weak score, misses, and weak mastery, and answer events update the same SRS state.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "saved_library",
    label: "Saved library",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Saved library reads saved words, review state, and review event counts and has empty-state coverage.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "dashboard_mission",
    label: "Dashboard memory mission",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Dashboard prioritizes the memory mission and uses local state for due, weak, new saved, and mastered counts.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "pack_preview",
    label: "Pack preview",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Academic Vocabulary preview can start a hub review, while IELTS/GRE depth still needs content audit.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "pack_progress",
    label: "Pack progress",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Pack progress is recorded on preview start and completion from real review answers, not planned pack counts.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "paywall_triggers",
    label: "Paywall triggers",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Trigger contracts and UI prompts exist as local placeholders and do not grant entitlement.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "pricing_outcome_copy",
    label: "Pricing outcome copy",
    status: "needs_review",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Pricing explains no connected billing, but public beta copy needs outcome and support review.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "paid_beta_interest_capture",
    label: "Paid beta interest capture",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Upgrade interest remains attribution-only and cannot become a subscription or receipt.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "extension_bridge",
    label: "Extension bridge",
    status: "manual_qa_required",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "App-side extension source routes and helpers exist, but full browser extension QA is not evidenced here.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "multilingual_alias_search",
    label: "Multilingual alias search",
    status: "needs_review",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Known KO/JA aliases resolve to canonical slugs, but broader vocabulary coverage needs review.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "analytics_events",
    label: "Local analytics events",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Local dataLayer events are sanitized; production monitoring and launch dashboards are not approved.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "accessibility",
    label: "Accessibility audit",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "No full accessibility audit pass is recorded for the complete funnel.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "mobile_responsiveness",
    label: "Mobile responsiveness",
    status: "manual_qa_required",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Mobile QA is not fully evidenced across save, review, weak sprint, packs, pricing, and settings.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "empty_loading_error_states",
    label: "Empty, loading, and error states",
    status: "manual_qa_required",
    severity: "P1",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    evidence:
      "Existing empty states are covered in focused areas, but the full launch checklist is incomplete.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "manual_qa",
    label: "Manual QA record",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "No full-funnel manual QA pass has been recorded for this branch and route inventory.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "account_sync",
    label: "Account sync",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "Account sync remains design-only with no real API route implementation approved.",
    manualQaRequired: true,
    mustUseRealState: true,
    fakeMasteryAllowed: false
  },
  {
    area: "payment_path",
    label: "Payment path",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "No real checkout, billing, subscription, invoice, payment provider, or entitlement path exists.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "production_monitoring",
    label: "Production monitoring",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "No production monitoring, analytics dashboard approval, alerting, or launch support path is recorded.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  },
  {
    area: "privacy_safety",
    label: "Privacy and launch safety",
    status: "blocked",
    severity: "P0",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    evidence:
      "No privacy/legal launch review, public rollback plan, support/refund flow, or data migration and backup plan is recorded.",
    manualQaRequired: true,
    mustUseRealState: false,
    fakeMasteryAllowed: false
  }
] as const satisfies readonly PaidBetaReadinessAreaAssessment[];

export const PAID_BETA_ROUTE_INVENTORY = [
  {
    route: "/",
    area: "dashboard_mission",
    label: "Home dashboard",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Renders the Track B dashboard mission surface.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Counts must stay derived from saved and review state."
  },
  {
    route: "/dashboard",
    area: "dashboard_mission",
    label: "Dashboard",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior:
      "Shows Today Memory Mission, review CTAs, weak sprint access, alias search, and local progress.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Dashboard priority should remain review behavior, not library browsing."
  },
  {
    route: "/saved",
    area: "saved_library",
    label: "Saved library",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Reads saved words, SRS state, and review event counts.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Saved entries must not become fake mastered words."
  },
  {
    route: "/save?slug=dissonance&source=word_page",
    area: "save_to_review_loop",
    label: "Save from word page",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Saves a known word and creates or preserves its review item.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Source attribution should remain word_page on first save."
  },
  {
    route: "/save?slug=dissonance&source=alias_search",
    area: "multilingual_alias_search",
    label: "Save from alias search",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Saves a canonical known word with alias_search attribution.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Unknown aliases must not create fake words or review state."
  },
  {
    route: "/save?slug=dissonance&source=extension",
    area: "extension_bridge",
    label: "Save from extension source",
    status: "manual_qa_required",
    severity: "P1",
    currentBehavior: "Saves a known word with extension attribution on the app side.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "End-to-end extension browser QA remains P1."
  },
  {
    route: "/review",
    area: "review_modes",
    label: "Mixed review",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Starts a mixed review session and writes SRS events and stats.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Answers must write event, state, and daily stat evidence."
  },
  {
    route: "/review?mode=due",
    area: "due_weak_mastered",
    label: "Due review query mode",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Selects candidates due by review-state due dates.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Due state must come from next due timestamps."
  },
  {
    route: "/review/due",
    area: "due_weak_mastered",
    label: "Due review route alias",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Provides the approved route alias for due review.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Alias should stay behaviorally aligned with due query mode."
  },
  {
    route: "/review?mode=weak",
    area: "due_weak_mastered",
    label: "Weak review query mode",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Selects candidates by Weak mastery or weak score.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Weak state must come from wrong answers and weak score."
  },
  {
    route: "/review/weak",
    area: "due_weak_mastered",
    label: "Weak review route alias",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Provides the approved route alias for weak review.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Alias should stay behaviorally aligned with weak query mode."
  },
  {
    route: "/review?mode=word&slug=dissonance",
    area: "review_modes",
    label: "Focused word review",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Starts a focused review session for one known word.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Focused answers must update the same review state record."
  },
  {
    route: "/review?mode=hub&hub=academic-vocabulary&limit=10",
    area: "pack_preview",
    label: "Academic hub review",
    status: "private_beta_ready",
    severity: "P1",
    currentBehavior: "Starts a capped hub review for Academic Vocabulary.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Pack content depth remains a P1 audit item."
  },
  {
    route: "/review/weak-sprint",
    area: "weak_words_sprint",
    label: "Weak sprint",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Runs a five-card sprint from real weak local state.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Empty state must appear when no weak words exist."
  },
  {
    route: "/packs",
    area: "pack_preview",
    label: "Pack catalog",
    status: "private_beta_ready",
    severity: "P1",
    currentBehavior: "Shows available and planned pack preview surfaces.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Planned packs must stay honestly labeled."
  },
  {
    route: "/packs/academic-vocabulary",
    area: "pack_preview",
    label: "Academic Vocabulary pack",
    status: "private_beta_ready",
    severity: "P1",
    currentBehavior: "Shows pack detail and starts preview review.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Preview completion must write pack progress from review answers."
  },
  {
    route: "/pricing",
    area: "pricing_outcome_copy",
    label: "Pricing",
    status: "needs_review",
    severity: "P1",
    currentBehavior: "Explains Free, Lite, and Pro outcomes with no connected billing.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: false,
    fakeProgressAllowed: false,
    notes: "No real checkout or subscription should be implied."
  },
  {
    route: "/settings",
    area: "payment_path",
    label: "Settings",
    status: "private_beta_ready",
    severity: "P1",
    currentBehavior: "Shows local plan and placeholder panels without account or billing settings.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: false,
    fakeProgressAllowed: false,
    notes: "Local plan state is not paid entitlement."
  },
  {
    route: "/word/dissonance",
    area: "due_weak_mastered",
    label: "Word detail",
    status: "private_beta_ready",
    severity: "P0",
    currentBehavior: "Shows static word content with local memory state panel.",
    privateBetaReady: true,
    publicBetaReady: false,
    manualQaRequired: true,
    realStateRequired: true,
    fakeProgressAllowed: false,
    notes: "Memory state fields must come only from saved and review state."
  }
] as const satisfies readonly PaidBetaRouteInventoryItem[];

export const PAID_BETA_LOCAL_STORAGE_KEY_INVENTORY = [
  {
    key: "vlx_saved_words_v1",
    area: "save_to_review_loop",
    owner: "SRS storage",
    storedShape: "Record keyed by slug with saved word metadata and source.",
    currentWriter: "Save flow",
    currentReaders: ["dashboard", "saved", "review", "word detail"],
    status: "private_beta_ready",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: true,
    notes: "Save must create or preserve a review item for each saved word."
  },
  {
    key: "vlx_review_state_v1",
    area: "local_srs_state_events",
    owner: "SRS storage",
    storedShape:
      "Record keyed by slug with box, mastery, counts, streak, weak score, and due dates.",
    currentWriter: "Save and review flows",
    currentReaders: ["dashboard", "saved", "review", "weak sprint", "word detail"],
    status: "private_beta_ready",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: true,
    notes: "Due, Weak, and Mastered must be derived from this real state."
  },
  {
    key: "vlx_review_events_v1",
    area: "local_srs_state_events",
    owner: "SRS storage",
    storedShape: "Append-style answer event list with result and state-after fields.",
    currentWriter: "Review answer flow",
    currentReaders: ["dashboard", "saved", "word detail", "analytics tests"],
    status: "private_beta_ready",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: true,
    notes: "Every answer must append an event before public launch can be considered."
  },
  {
    key: "vlx_daily_stats_v1",
    area: "dashboard_mission",
    owner: "SRS stats",
    storedShape: "Daily reviewed, correct, wrong, mastered, weak, minute, and session counts.",
    currentWriter: "Review completion flow",
    currentReaders: ["dashboard", "review summary"],
    status: "private_beta_ready",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: true,
    notes: "Weekly Reviewed Words should be event-backed before public beta."
  },
  {
    key: "vlx_pack_progress_v1",
    area: "pack_progress",
    owner: "Pack progress",
    storedShape: "Record keyed by pack id with preview start, completion, and answer counts.",
    currentWriter: "Pack preview and review completion flows",
    currentReaders: ["packs", "dashboard", "review summary"],
    status: "private_beta_ready",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: true,
    notes: "Must not show planned or fake pack completion."
  },
  {
    key: "vlx_plan_state_v1",
    area: "payment_path",
    owner: "Local plan preview",
    storedShape: "Local guest/free/lite/pro preview state.",
    currentWriter: "Local settings and entitlement preview code",
    currentReaders: ["dashboard", "settings", "paywall surfaces"],
    status: "needs_review",
    severity: "P0",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: false,
    notes: "Must never be migrated or trusted as paid access proof."
  },
  {
    key: "vlx_upgrade_interest_v1",
    area: "paid_beta_interest_capture",
    owner: "Upgrade interest",
    storedShape: "Array of local interest records with plan, source, trigger, and page path.",
    currentWriter: "Pricing and paywall prompt CTAs",
    currentReaders: ["pricing", "paywall surfaces", "manual QA"],
    status: "private_beta_ready",
    severity: "P1",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: true,
    migrationOrBackupRequiredBeforePublicBeta: false,
    notes: "Interest capture is attribution-only and not a subscription."
  },
  {
    key: "vlx_pending_home_quiz",
    area: "review_modes",
    owner: "Optional transition state",
    storedShape: "Short-lived home quiz transition payload when present.",
    currentWriter: "Optional home quiz continuity",
    currentReaders: ["review"],
    status: "future",
    severity: "P2",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    attributionOnly: false,
    migrationOrBackupRequiredBeforePublicBeta: false,
    notes: "Optional key; not an account source of truth."
  }
] as const satisfies readonly PaidBetaLocalStorageKeyInventoryItem[];

export const PAID_BETA_TEST_INVENTORY = [
  {
    suite: "tests/mvp-smoke.spec.ts",
    area: "save_to_review_loop",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Save, local SRS write, dashboard loop, review events, and stats.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Must pass before any private invite."
  },
  {
    suite: "tests/review-state-regression.spec.ts",
    area: "local_srs_state_events",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Duplicate save preservation, SRS update rules, due, weak, and mastered selectors.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Guards fake mastery and state regression."
  },
  {
    suite: "tests/review-mode-routes.spec.ts",
    area: "review_modes",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Due, weak, word, hub, extension source, and weak sprint routes.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Includes answer writes and pack progress isolation."
  },
  {
    suite: "tests/saved-library.spec.ts",
    area: "saved_library",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Saved library state, empty state, links, and no fake mastery.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Supports saved-library audit evidence."
  },
  {
    suite: "tests/word-detail-memory-state.spec.ts",
    area: "due_weak_mastered",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Word detail memory panel after clear, save, seeded weak state, and saved-only state.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Static word content must not become fake memory state."
  },
  {
    suite: "tests/exam-pack-preview.spec.ts",
    area: "pack_progress",
    status: "private_beta_ready",
    severity: "P1",
    coverage: "Pack catalog, academic pack detail, preview start, progress completion, and planned pack honesty.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Content audit remains separate."
  },
  {
    suite: "tests/paywall-triggers.spec.ts",
    area: "paywall_triggers",
    status: "private_beta_ready",
    severity: "P1",
    coverage: "Trigger evaluator and no checkout/payment provider guard.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Triggers remain placeholders."
  },
  {
    suite: "tests/paywall-surfaces.spec.ts",
    area: "paid_beta_interest_capture",
    status: "private_beta_ready",
    severity: "P1",
    coverage: "Pricing and prompt interest capture plus configured external placeholder URL handling.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Interest does not grant access."
  },
  {
    suite: "tests/entitlements.spec.ts",
    area: "payment_path",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Local entitlement skeleton, billing disclaimer, and no payment route directories.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Local plan preview is not paid entitlement."
  },
  {
    suite: "tests/multilingual-alias-contract.spec.ts",
    area: "multilingual_alias_search",
    status: "needs_review",
    severity: "P1",
    coverage: "Alias resolver, known canonical slugs, alias search UI, and unknown no-action state.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Vocabulary breadth still needs review."
  },
  {
    suite: "tests/analytics-events.spec.ts",
    area: "analytics_events",
    status: "private_beta_ready",
    severity: "P1",
    coverage: "Sanitized local dataLayer events and no analytics/payment provider guard.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "Does not approve production monitoring."
  },
  {
    suite: "tests/paid-beta-readiness-audit.spec.ts",
    area: "manual_qa",
    status: "private_beta_ready",
    severity: "P0",
    coverage: "Static readiness contract, blockers, safety policy, docs links, and forbidden integration guards.",
    requiredForPrivateBeta: true,
    requiredForPublicBeta: true,
    notes: "This PR adds the audit contract suite."
  }
] as const satisfies readonly PaidBetaTestInventoryItem[];

export const PAID_BETA_MANUAL_QA_REQUIREMENTS = [
  {
    id: "clear_local_state",
    area: "manual_qa",
    label: "Clear all approved local storage keys before the run.",
    status: "manual_qa_required",
    severity: "P0",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Screenshot or notes showing empty dashboard, saved library, and word memory state."
  },
  {
    id: "save_sources",
    area: "save_to_review_loop",
    label: "Save word_page, alias_search, and extension source words.",
    status: "manual_qa_required",
    severity: "P0",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Saved records and review state records with source attribution."
  },
  {
    id: "review_answer_writes",
    area: "local_srs_state_events",
    label: "Answer review cards and confirm events, state, and daily stats mutate.",
    status: "manual_qa_required",
    severity: "P0",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Review event count, updated review state, and daily reviewed count."
  },
  {
    id: "weak_sprint",
    area: "weak_words_sprint",
    label: "Create a weak word from a miss and run weak sprint.",
    status: "manual_qa_required",
    severity: "P0",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Weak review event and same-record weak score update."
  },
  {
    id: "pack_preview_progress",
    area: "pack_progress",
    label: "Start and complete Academic Vocabulary preview.",
    status: "manual_qa_required",
    severity: "P1",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Pack progress start and completion with reviewed and correct counts."
  },
  {
    id: "pricing_interest",
    area: "paid_beta_interest_capture",
    label: "Click Lite and Pro pricing CTAs in no-payment mode.",
    status: "manual_qa_required",
    severity: "P1",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Two attribution-only upgrade interest records and no checkout behavior."
  },
  {
    id: "accessibility_mobile",
    area: "accessibility",
    label: "Run accessibility and mobile responsiveness checks across the funnel.",
    status: "blocked",
    severity: "P0",
    requiredBeforePrivateInvite: true,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Recorded pass for keyboard, focus, labels, contrast, small viewport layout, and no text overlap."
  }
] as const satisfies readonly PaidBetaManualQARequirement[];

export const PAID_BETA_FUNNEL_CHECKPOINTS = [
  {
    id: "visitor_can_save_word",
    area: "save_to_review_loop",
    label: "Visitor can save a word.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Known word save creates or preserves a saved record."
  },
  {
    id: "saved_word_becomes_review_item",
    area: "save_to_review_loop",
    label: "Saved word becomes review item.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Matching review state item exists after save."
  },
  {
    id: "review_session_writes_events_and_stats",
    area: "local_srs_state_events",
    label: "Review session writes events and stats.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Answer appends review event, updates review state, and increments daily stats."
  },
  {
    id: "due_weak_mastered_real_state",
    area: "due_weak_mastered",
    label: "Due, Weak, and Mastered are based on real local state.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "No fake mastery, fake weak state, or planned progress can appear."
  },
  {
    id: "pack_preview_can_start_review",
    area: "pack_preview",
    label: "Pack preview can start a review.",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Academic Vocabulary preview routes to a hub review with pack context."
  },
  {
    id: "pack_progress_real_answers_or_honest",
    area: "pack_progress",
    label: "Pack progress is real or honestly absent.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Progress counts come from review answers; planned packs show no fake counts."
  },
  {
    id: "weak_sprint_real_weak_state",
    area: "weak_words_sprint",
    label: "Weak sprint uses real weak state.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Sprint candidates come from misses, weak score, or Weak mastery."
  },
  {
    id: "pricing_explains_outcomes",
    area: "pricing_outcome_copy",
    label: "Pricing explains outcomes.",
    status: "needs_review",
    severity: "P1",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Copy says billing is not connected and avoids active paid access claims."
  },
  {
    id: "upgrade_interest_attribution_only",
    area: "paid_beta_interest_capture",
    label: "Upgrade interest is attribution-only.",
    status: "private_beta_ready",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Interest records cannot create entitlement, checkout, or subscription state."
  },
  {
    id: "no_paid_entitlement_granted",
    area: "payment_path",
    label: "No paid entitlement is granted.",
    status: "blocked",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Local plan preview and upgrade interest remain non-authoritative."
  },
  {
    id: "no_real_checkout_implied",
    area: "payment_path",
    label: "No real checkout is implied.",
    status: "blocked",
    severity: "P0",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "No checkout, billing, subscription, invoice, or payment provider path exists."
  },
  {
    id: "extension_source_safe",
    area: "extension_bridge",
    label: "Extension source can be represented safely.",
    status: "manual_qa_required",
    severity: "P1",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Extension source routes tag saves and review starts without unsafe payloads."
  },
  {
    id: "alias_search_source_attribution",
    area: "multilingual_alias_search",
    label: "Alias search saves with source attribution.",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Known aliases link to canonical saves with alias_search source."
  },
  {
    id: "analytics_privacy_safe",
    area: "analytics_events",
    label: "Analytics events avoid private payloads.",
    status: "private_beta_ready",
    severity: "P1",
    privateBetaRequired: true,
    publicBetaRequired: true,
    privacySafe: true,
    passCondition: "Local event payloads are sanitized and do not imply production monitoring approval."
  }
] as const satisfies readonly PaidBetaFunnelCheckpoint[];

export const PAID_BETA_BLOCKERS = [
  {
    id: "no_real_account_server_sync_enabled",
    area: "account_sync",
    severity: "P0",
    title: "No real account/server sync enabled.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved account sync implementation, manual QA, and rollback plan.",
    nextAction: "Keep account sync design-only; do not implement real API routes in this PR."
  },
  {
    id: "no_real_payment_checkout_subscription_path",
    area: "payment_path",
    severity: "P0",
    title: "No real payment/checkout/subscription path.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved billing architecture, provider integration, entitlement checks, and support policy.",
    nextAction: "Keep private beta no-payment and attribution-only."
  },
  {
    id: "no_production_entitlement_system",
    area: "payment_path",
    severity: "P0",
    title: "No production entitlement system.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Server-owned entitlement read model backed by approved billing path.",
    nextAction: "Do not treat local plan state or interest records as paid proof."
  },
  {
    id: "no_production_monitoring_analytics_approval",
    area: "production_monitoring",
    severity: "P0",
    title: "No production monitoring/analytics approval.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved launch dashboard, alert thresholds, and escalation plan.",
    nextAction: "Keep local analytics separate from production monitoring approval."
  },
  {
    id: "no_full_funnel_manual_qa_recorded",
    area: "manual_qa",
    severity: "P0",
    title: "No manual QA pass recorded for the full funnel.",
    status: "open",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalRequired: false,
    evidenceRequired: "Recorded pass across save, review, weak sprint, packs, pricing, accessibility, and mobile.",
    nextAction: "Run the manual QA checklist before invites."
  },
  {
    id: "no_privacy_legal_launch_review_recorded",
    area: "privacy_safety",
    severity: "P0",
    title: "No privacy/legal launch review recorded.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved privacy, disclosure, consent, data reset, and beta terms review.",
    nextAction: "Document privacy and legal sign-off before public beta."
  },
  {
    id: "no_support_refund_failed_payment_flow",
    area: "privacy_safety",
    severity: "P0",
    title: "No support/refund/failed-payment flow.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Published support, refund, cancellation, and failed-payment operating path.",
    nextAction: "Do not sell paid access until support and billing operations exist."
  },
  {
    id: "no_public_launch_rollback_plan",
    area: "privacy_safety",
    severity: "P0",
    title: "No public launch rollback plan.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Owner-approved rollback path for public paid beta surfaces.",
    nextAction: "Keep invite volume owner-run and reversible."
  },
  {
    id: "no_production_data_migration_backup_plan",
    area: "account_sync",
    severity: "P0",
    title: "No production data migration or backup plan.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved migration, backup, restore, and account ownership plan.",
    nextAction: "Do not migrate local stores into account data yet."
  },
  {
    id: "no_accessibility_audit_pass",
    area: "accessibility",
    severity: "P0",
    title: "No accessibility audit pass.",
    status: "open",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    ownerApprovalRequired: false,
    evidenceRequired: "Recorded keyboard, focus, labels, contrast, and responsive layout pass.",
    nextAction: "Run accessibility QA before invites and public launch."
  },
  {
    id: "mobile_qa_not_fully_evidenced",
    area: "mobile_responsiveness",
    severity: "P1",
    title: "Mobile QA not fully evidenced.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: false,
    evidenceRequired: "Small viewport pass for all required routes and flows.",
    nextAction: "Add mobile screenshots or checklist notes."
  },
  {
    id: "empty_loading_error_state_checklist_incomplete",
    area: "empty_loading_error_states",
    severity: "P1",
    title: "Empty/loading/error states need full checklist.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: false,
    evidenceRequired: "Route-by-route empty, loading, and error state checklist.",
    nextAction: "Complete Product/UI readiness audit."
  },
  {
    id: "pricing_copy_outcome_review_needed",
    area: "pricing_outcome_copy",
    severity: "P1",
    title: "Pricing copy may need outcome-based review.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Approved no-checkout copy and paid outcome wording.",
    nextAction: "Review pricing copy before any public beta."
  },
  {
    id: "pack_content_depth_content_audit_needed",
    area: "pack_preview",
    severity: "P1",
    title: "Pack content depth and IELTS/GRE/Academic completeness need content audit.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Content inventory and quality sign-off for paid pack claims.",
    nextAction: "Audit pack content before public beta."
  },
  {
    id: "extension_bridge_e2e_browser_qa_needed",
    area: "extension_bridge",
    severity: "P1",
    title: "Extension bridge needs end-to-end browser QA.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: false,
    evidenceRequired: "Browser extension QA proving source tagging and review routing.",
    nextAction: "Run extension QA after app-side checklist."
  },
  {
    id: "ko_ja_alias_coverage_review_needed",
    area: "multilingual_alias_search",
    severity: "P1",
    title: "KO/JA alias search needs broader vocabulary coverage review.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Alias coverage report and missing/misleading alias review.",
    nextAction: "Audit alias vocabulary breadth."
  },
  {
    id: "analytics_taxonomy_launch_dashboard_mapping_needed",
    area: "analytics_events",
    severity: "P1",
    title: "Analytics taxonomy needs launch dashboard mapping.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    ownerApprovalRequired: true,
    evidenceRequired: "Mapping from local event names to approved launch dashboard metrics.",
    nextAction: "Keep analytics local until production monitoring is approved."
  },
  {
    id: "ui_polish_copy_improvements",
    area: "dashboard_mission",
    severity: "P2",
    title: "UI polish and copy improvements.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    ownerApprovalRequired: false,
    evidenceRequired: "Product/UI polish pass.",
    nextAction: "Handle after P0/P1 gates."
  },
  {
    id: "advanced_streak_calendar_polish",
    area: "dashboard_mission",
    severity: "P2",
    title: "Advanced streak/calendar polish.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    ownerApprovalRequired: false,
    evidenceRequired: "Future streak/calendar design.",
    nextAction: "Keep out of readiness scope."
  },
  {
    id: "more_pack_categories",
    area: "pack_preview",
    severity: "P2",
    title: "More pack categories.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    ownerApprovalRequired: true,
    evidenceRequired: "Future pack roadmap.",
    nextAction: "Defer until paid beta learning loop is validated."
  },
  {
    id: "future_ai_mistake_explanation",
    area: "local_srs_state_events",
    severity: "P2",
    title: "Future AI mistake explanation.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    ownerApprovalRequired: true,
    evidenceRequired: "Separate AI tutor approval after SRS loop works.",
    nextAction: "Do not add AI functionality in this PR."
  },
  {
    id: "future_multilingual_concept_graph",
    area: "multilingual_alias_search",
    severity: "P2",
    title: "Future multilingual concept graph.",
    status: "open",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    ownerApprovalRequired: true,
    evidenceRequired: "Separate multilingual content and graph plan.",
    nextAction: "Keep multilingual page generation out of this PR."
  }
] as const satisfies readonly PaidBetaBlocker[];

export const PAID_BETA_RISKS = PAID_BETA_BLOCKERS.map((blocker) => ({
  id: blocker.id,
  area: blocker.area,
  severity: blocker.severity,
  title: blocker.title,
  status:
    blocker.blocksPrivateBeta || blocker.blocksPublicBeta
      ? "open"
      : "accepted_for_private_beta",
  impactsPrivateBeta: blocker.blocksPrivateBeta,
  impactsPublicBeta: blocker.blocksPublicBeta,
  mitigation: blocker.nextAction
})) as readonly PaidBetaRisk[];

export const PAID_BETA_LAUNCH_GATES = [
  {
    id: "private_owner_run_manual_beta",
    area: "manual_qa",
    severity: "P0",
    title: "Private paid beta is conditional/manual-only.",
    status: "conditional_private_beta_ready",
    privateBetaAllowed: true,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired:
      "Owner-run invite process, manual QA pass, no-payment copy, support channel, and local data disclosure."
  },
  {
    id: "public_paid_beta_no_go",
    area: "payment_path",
    severity: "P0",
    title: "Public paid beta remains No-Go.",
    status: "blocked",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired:
      "Account sync, payment path, entitlement, monitoring, privacy, support, accessibility, and rollback gates closed."
  },
  {
    id: "account_sync_design_only",
    area: "account_sync",
    severity: "P0",
    title: "Account sync remains design-only.",
    status: "blocked",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Separate approved account sync implementation and QA."
  },
  {
    id: "payment_billing_outside_scope",
    area: "payment_path",
    severity: "P0",
    title: "Payment and billing stay outside beta readiness.",
    status: "blocked",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Separate approved billing and entitlement implementation."
  },
  {
    id: "production_monitoring_not_approved",
    area: "production_monitoring",
    severity: "P0",
    title: "Production monitoring is not complete.",
    status: "blocked",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Approved analytics dashboard, alerting, and owner escalation."
  },
  {
    id: "accessibility_not_complete",
    area: "accessibility",
    severity: "P0",
    title: "Accessibility is not complete without evidence.",
    status: "blocked",
    privateBetaAllowed: false,
    publicBetaAllowed: false,
    requiredBeforePublicBeta: true,
    evidenceRequired: "Recorded accessibility audit pass."
  }
] as const satisfies readonly PaidBetaLaunchGate[];

export const PAID_BETA_READINESS_SAFETY_POLICY = {
  docsContractsTestsOnly: true,
  noRuntimeBehaviorChange: true,
  apiRoutesAllowed: false,
  routeHandlersAllowed: false,
  middlewareAllowed: false,
  runtimeRouteOrComponentIntegrationAllowed: false,
  realAuthAllowed: false,
  databasePersistenceAllowed: false,
  providerSdkAllowed: false,
  validationDependencyAllowed: false,
  networkCallsAllowed: false,
  browserStorageAccessAllowed: false,
  environmentReadsAllowed: false,
  billingPaymentCheckoutAllowed: false,
  paidEntitlementGrantAllowed: false,
  productionDataAccessAllowed: false,
  migrationsAllowed: false,
  webflowCloudflareVercelDnsAllowed: false,
  fakeMasteryAllowed: false
} as const satisfies PaidBetaReadinessSafetyPolicy;

export const PAID_BETA_NEXT_STEP = {
  prNumber: 71,
  title: "Paid beta manual QA checklist runner or Product/UI readiness audit",
  docsContractsTestsOnly: true,
  realApiRouteImplementationRecommended: false,
  paymentImplementationRecommended: false,
  accountSyncImplementationRecommended: false,
  reason:
    "The next PR should record manual QA or product/UI readiness evidence, not real API route, account sync, payment, or entitlement implementation."
} as const satisfies PaidBetaNextStep;

export const PAID_BETA_READINESS_AUDIT = {
  visualLexiconPaidBetaReadinessVersion:
    VISUAL_LEXICON_PAID_BETA_READINESS_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/paid-beta-readiness-audit",
  scope: "Track B learning app paid beta readiness",
  privateBetaVerdict: PAID_BETA_PRIVATE_VERDICT,
  publicBetaVerdict: PAID_BETA_PUBLIC_VERDICT,
  privateBetaRecommendation:
    "Conditional Go for controlled owner-run/private paid beta validation only, after manual QA evidence is recorded and no-payment/support/data-disclosure boundaries are explicit.",
  publicBetaRecommendation:
    "No-Go for public paid beta until account sync, payment path, entitlement, monitoring, privacy, accessibility, support, rollback, and migration gates are approved.",
  areaAssessments: PAID_BETA_READINESS_AREA_ASSESSMENTS,
  routeInventory: PAID_BETA_ROUTE_INVENTORY,
  localStorageKeyInventory: PAID_BETA_LOCAL_STORAGE_KEY_INVENTORY,
  testInventory: PAID_BETA_TEST_INVENTORY,
  manualQaRequirements: PAID_BETA_MANUAL_QA_REQUIREMENTS,
  funnelCheckpoints: PAID_BETA_FUNNEL_CHECKPOINTS,
  risks: PAID_BETA_RISKS,
  blockers: PAID_BETA_BLOCKERS,
  launchGates: PAID_BETA_LAUNCH_GATES,
  safetyPolicy: PAID_BETA_READINESS_SAFETY_POLICY,
  nextStep: PAID_BETA_NEXT_STEP
} as const satisfies PaidBetaReadinessAudit;

export function getPaidBetaReadinessArea(area: PaidBetaReadinessArea) {
  return PAID_BETA_READINESS_AREA_ASSESSMENTS.find(
    (assessment) => assessment.area === area
  );
}

export function getPaidBetaRouteInventoryItem(route: string) {
  return PAID_BETA_ROUTE_INVENTORY.find((item) => item.route === route);
}

export function getPaidBetaLocalStorageKeyInventoryItem(key: string) {
  return PAID_BETA_LOCAL_STORAGE_KEY_INVENTORY.find(
    (item) => item.key === key
  );
}

export function getPaidBetaFunnelCheckpoint(id: string) {
  return PAID_BETA_FUNNEL_CHECKPOINTS.find(
    (checkpoint) => checkpoint.id === id
  );
}

export function getPaidBetaBlocker(id: string) {
  return PAID_BETA_BLOCKERS.find((blocker) => blocker.id === id);
}

export function getPaidBetaLaunchGate(id: string) {
  return PAID_BETA_LAUNCH_GATES.find((gate) => gate.id === id);
}
