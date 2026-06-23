export const VISUAL_LEXICON_PAID_BETA_MANUAL_QA_VERSION = 1 as const;

export type PaidBetaManualQaVersion =
  typeof VISUAL_LEXICON_PAID_BETA_MANUAL_QA_VERSION;

export type PaidBetaManualQaPhase =
  | "setup"
  | "save_sources"
  | "review_srs"
  | "packs"
  | "pricing_paywall"
  | "dashboard_settings"
  | "mobile_accessibility_privacy"
  | "verdict";

export type PaidBetaManualQaSeverity = "P0" | "P1" | "P2";

export type PaidBetaManualQaResultStatus =
  | "not_run"
  | "pass"
  | "fail"
  | "blocked"
  | "needs_retest";

export type PaidBetaManualQaVerdict =
  | "conditional_go_for_private_paid_beta_owner_run_only"
  | "no_go_for_public_paid_beta";

export type PaidBetaManualQaRouteTarget = {
  id: string;
  path: string;
  label: string;
  phase: PaidBetaManualQaPhase;
  purpose: string;
  manualOnly: true;
  requiresAuth: false;
  requiresPayment: false;
  requiresProductionData: false;
};

export type PaidBetaManualQaStorageProbe = {
  key: string;
  label: string;
  phase: PaidBetaManualQaPhase;
  expectedUse: string;
  expectedManualCheck: string;
  productionSourceOfTruth: false;
  grantsPaidEntitlement: false;
  mustNotContain: readonly string[];
};

export type PaidBetaManualQaConsoleProbe = {
  id: string;
  label: string;
  phase: PaidBetaManualQaPhase;
  snippet: string;
  verifies: string;
  safeToPasteInDevtools: true;
  executesInModule: false;
};

export type PaidBetaManualQaDeviceProfile = {
  id: string;
  label: string;
  viewport: string;
  required: boolean;
  notes: string;
};

export type PaidBetaManualQaBrowserProfile = {
  id: string;
  label: string;
  required: boolean;
  notes: string;
};

export type PaidBetaManualQaExpectedResult = {
  id: string;
  text: string;
  mustRecordEvidence: boolean;
  linkedStopConditionIds: readonly string[];
};

export type PaidBetaManualQaEvidence = {
  id: string;
  label: string;
  format: string;
  required: boolean;
};

export type PaidBetaManualQaStep = {
  order: number;
  action: string;
  expectedResultIds: readonly string[];
  evidenceIds: readonly string[];
};

export type PaidBetaManualQaStopCondition = {
  id: string;
  severity: PaidBetaManualQaSeverity;
  title: string;
  blocksPrivateBeta: boolean;
  blocksPublicBeta: boolean;
  evidenceRequired: string;
  response: string;
};

export type PaidBetaManualQaScenario = {
  id: string;
  title: string;
  phase: PaidBetaManualQaPhase;
  route: string;
  routeTargetId: string;
  severity: PaidBetaManualQaSeverity;
  objective: string;
  steps: readonly PaidBetaManualQaStep[];
  expectedResults: readonly PaidBetaManualQaExpectedResult[];
  evidence: readonly PaidBetaManualQaEvidence[];
  stopConditionIds: readonly string[];
  storageProbeKeys: readonly string[];
  consoleProbeIds: readonly string[];
  deviceProfileIds: readonly string[];
  browserProfileIds: readonly string[];
};

export type PaidBetaManualQaNextStep = {
  prNumber: 72;
  title: "Product/UI readiness audit or Manual QA execution report template";
  docsContractsTestsOnly: true;
  realApiRouteImplementationRecommended: false;
  paymentImplementationRecommended: false;
  accountSyncImplementationRecommended: false;
  reason: string;
};

export type PaidBetaManualQaContract = {
  visualLexiconPaidBetaManualQaVersion: PaidBetaManualQaVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/paid-beta-manual-qa-checklist";
  scope: "Track B paid beta owner-run manual QA checklist";
  privateBetaVerdict: PaidBetaManualQaVerdict;
  publicBetaVerdict: PaidBetaManualQaVerdict;
  privateBetaProtocol: string;
  publicBetaWarning: string;
  phases: readonly PaidBetaManualQaPhase[];
  routeTargets: readonly PaidBetaManualQaRouteTarget[];
  storageProbes: readonly PaidBetaManualQaStorageProbe[];
  consoleProbes: readonly PaidBetaManualQaConsoleProbe[];
  deviceProfiles: readonly PaidBetaManualQaDeviceProfile[];
  browserProfiles: readonly PaidBetaManualQaBrowserProfile[];
  scenarios: readonly PaidBetaManualQaScenario[];
  stopConditions: readonly PaidBetaManualQaStopCondition[];
  nextStep: PaidBetaManualQaNextStep;
};

export const PAID_BETA_MANUAL_QA_PHASES = [
  "setup",
  "save_sources",
  "review_srs",
  "packs",
  "pricing_paywall",
  "dashboard_settings",
  "mobile_accessibility_privacy",
  "verdict"
] as const satisfies readonly PaidBetaManualQaPhase[];

export const PAID_BETA_MANUAL_QA_PRIVATE_VERDICT =
  "conditional_go_for_private_paid_beta_owner_run_only" as const satisfies PaidBetaManualQaVerdict;

export const PAID_BETA_MANUAL_QA_PUBLIC_VERDICT =
  "no_go_for_public_paid_beta" as const satisfies PaidBetaManualQaVerdict;

export const PAID_BETA_MANUAL_QA_ROUTE_TARGETS = [
  {
    id: "home",
    path: "/",
    label: "Home dashboard",
    phase: "dashboard_settings",
    purpose: "Confirm first-load dashboard and memory mission behavior.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    phase: "dashboard_settings",
    purpose: "Confirm Today Memory Mission and review CTAs use real state.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "saved",
    path: "/saved",
    label: "Saved library",
    phase: "save_sources",
    purpose: "Confirm saved words support review entry without fake mastery.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "save_word_page",
    path: "/save?slug=dissonance&source=word_page",
    label: "Save from word page",
    phase: "save_sources",
    purpose: "Confirm a known word page save creates or preserves review state.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "save_alias_search",
    path: "/save?slug=dissonance&source=alias_search",
    label: "Save from alias search",
    phase: "save_sources",
    purpose: "Confirm alias search routes to a known canonical slug.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "save_extension",
    path: "/save?slug=dissonance&source=extension",
    label: "Save from extension source",
    phase: "save_sources",
    purpose: "Confirm extension source attribution can create a review item.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review",
    path: "/review",
    label: "Mixed review",
    phase: "review_srs",
    purpose: "Confirm mixed review writes events, state, and daily stats.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review_due",
    path: "/review?mode=due",
    label: "Due review",
    phase: "review_srs",
    purpose: "Confirm due candidates come from SRS due dates.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review_weak",
    path: "/review?mode=weak",
    label: "Weak review",
    phase: "review_srs",
    purpose: "Confirm weak candidates come from weak score or Weak mastery.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review_word",
    path: "/review?mode=word&slug=dissonance",
    label: "Focused word review",
    phase: "review_srs",
    purpose: "Confirm focused word review updates the same SRS record.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review_hub",
    path: "/review?mode=hub&hub=academic-vocabulary&limit=10",
    label: "Hub review",
    phase: "review_srs",
    purpose: "Confirm hub review supports pack-preview learning.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "review_weak_sprint",
    path: "/review/weak-sprint",
    label: "Weak sprint",
    phase: "review_srs",
    purpose: "Confirm sprint candidates are real weak words.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "packs",
    path: "/packs",
    label: "Pack catalog",
    phase: "packs",
    purpose: "Confirm pack cards do not fake unavailable progress.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "academic_pack",
    path: "/packs/academic-vocabulary",
    label: "Academic Vocabulary pack",
    phase: "packs",
    purpose: "Confirm preview start and progress continuation behavior.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "pricing",
    path: "/pricing",
    label: "Pricing",
    phase: "pricing_paywall",
    purpose: "Confirm pricing captures interest without checkout or entitlement.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    phase: "dashboard_settings",
    purpose: "Confirm plan state is local preview only.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  },
  {
    id: "word_dissonance",
    path: "/word/dissonance",
    label: "Word detail",
    phase: "save_sources",
    purpose: "Confirm word memory panel reflects real local state.",
    manualOnly: true,
    requiresAuth: false,
    requiresPayment: false,
    requiresProductionData: false
  }
] as const satisfies readonly PaidBetaManualQaRouteTarget[];

export const PAID_BETA_MANUAL_QA_STORAGE_PROBES = [
  {
    key: "vlx_saved_words_v1",
    label: "Saved words",
    phase: "save_sources",
    expectedUse: "Stores saved word records keyed by slug.",
    expectedManualCheck:
      "Confirm dissonance exists after save and includes safe source attribution.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_review_state_v1",
    label: "Review state",
    phase: "review_srs",
    expectedUse: "Stores SRS records for saved and reviewed words.",
    expectedManualCheck:
      "Confirm saved words become review items and mastery changes only after review evidence.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_review_events_v1",
    label: "Review events",
    phase: "review_srs",
    expectedUse: "Stores answer events from active recall sessions.",
    expectedManualCheck:
      "Confirm event count increases after each answered review card.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_daily_stats_v1",
    label: "Daily stats",
    phase: "review_srs",
    expectedUse: "Stores local daily reviewed-word counts and session stats.",
    expectedManualCheck:
      "Confirm stats update after review answers and do not fake weekly reviewed words.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_pack_progress_v1",
    label: "Pack progress",
    phase: "packs",
    expectedUse: "Stores local pack preview and review progress.",
    expectedManualCheck:
      "Confirm progress advances only from preview start or review answers.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_plan_state_v1",
    label: "Plan state",
    phase: "pricing_paywall",
    expectedUse: "Stores local plan preview state only.",
    expectedManualCheck:
      "Confirm it is not treated as paid entitlement or subscription proof.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  },
  {
    key: "vlx_upgrade_interest_v1",
    label: "Upgrade interest",
    phase: "pricing_paywall",
    expectedUse: "Stores attribution-only upgrade interest.",
    expectedManualCheck:
      "Confirm interest capture never grants paid access or real checkout state.",
    productionSourceOfTruth: false,
    grantsPaidEntitlement: false,
    mustNotContain: ["secrets", "provider tokens", "payment data", "raw private payloads"]
  }
] as const satisfies readonly PaidBetaManualQaStorageProbe[];

export const PAID_BETA_MANUAL_QA_CONSOLE_PROBES = [
  {
    id: "list_vlx_local_storage_keys",
    label: "List VLX localStorage keys",
    phase: "setup",
    snippet: "Object.keys(localStorage).filter((key) => key.startsWith('vlx_')).sort()",
    verifies: "Only approved VLX keys are present during the pass.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_saved_words",
    label: "Inspect saved words",
    phase: "save_sources",
    snippet: "JSON.parse(localStorage.getItem('vlx_saved_words_v1') || '{}')",
    verifies: "Saved words include the expected slug and safe source metadata.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_review_state_dissonance",
    label: "Inspect review state for dissonance",
    phase: "review_srs",
    snippet: "JSON.parse(localStorage.getItem('vlx_review_state_v1') || '{}').dissonance",
    verifies: "Dissonance has a real SRS item with box, mastery, counts, and due state.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_review_events_count",
    label: "Inspect review events count",
    phase: "review_srs",
    snippet: "(JSON.parse(localStorage.getItem('vlx_review_events_v1') || '[]')).length",
    verifies: "Review answer count increases after active recall.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_daily_stats",
    label: "Inspect daily stats",
    phase: "review_srs",
    snippet: "JSON.parse(localStorage.getItem('vlx_daily_stats_v1') || '{}')",
    verifies: "Daily stats reflect answered review cards.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_pack_progress",
    label: "Inspect pack progress",
    phase: "packs",
    snippet: "JSON.parse(localStorage.getItem('vlx_pack_progress_v1') || '{}')",
    verifies: "Pack progress is tied to preview or review evidence.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "inspect_upgrade_interest",
    label: "Inspect upgrade interest",
    phase: "pricing_paywall",
    snippet: "JSON.parse(localStorage.getItem('vlx_upgrade_interest_v1') || '[]')",
    verifies: "Upgrade interest is attribution-only.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "confirm_no_paid_entitlement_from_interest",
    label: "Confirm no paid entitlement is granted by upgrade interest",
    phase: "pricing_paywall",
    snippet:
      "({ interest: JSON.parse(localStorage.getItem('vlx_upgrade_interest_v1') || '[]'), planState: JSON.parse(localStorage.getItem('vlx_plan_state_v1') || '{}') })",
    verifies: "Interest records do not become subscription, receipt, or paid access state.",
    safeToPasteInDevtools: true,
    executesInModule: false
  },
  {
    id: "confirm_saved_only_no_fake_mastery",
    label: "Confirm saved-only word does not show fake mastery",
    phase: "review_srs",
    snippet:
      "JSON.parse(localStorage.getItem('vlx_review_state_v1') || '{}').dissonance?.mastery",
    verifies: "A saved-only word remains New or Learning until review evidence exists.",
    safeToPasteInDevtools: true,
    executesInModule: false
  }
] as const satisfies readonly PaidBetaManualQaConsoleProbe[];

export const PAID_BETA_MANUAL_QA_DEVICE_PROFILES = [
  {
    id: "desktop",
    label: "Desktop",
    viewport: "1440x900",
    required: true,
    notes: "Primary owner-run QA viewport for route, console, and evidence capture."
  },
  {
    id: "mobile",
    label: "Mobile",
    viewport: "390x844",
    required: true,
    notes: "Required for dashboard, save, review, pricing, settings, and accessibility checks."
  }
] as const satisfies readonly PaidBetaManualQaDeviceProfile[];

export const PAID_BETA_MANUAL_QA_BROWSER_PROFILES = [
  {
    id: "chromium",
    label: "Chromium",
    required: true,
    notes: "Required browser for deterministic owner-run QA and DevTools probes."
  },
  {
    id: "webkit_or_firefox_spot_check",
    label: "WebKit or Firefox spot check",
    required: false,
    notes: "Optional P1 cross-browser pass after P0 private-beta checks pass."
  }
] as const satisfies readonly PaidBetaManualQaBrowserProfile[];

export const PAID_BETA_MANUAL_QA_STOP_CONDITIONS = [
  {
    id: "save_missing_review_item",
    severity: "P0",
    title: "Save does not create review item.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Route, screenshot, saved-word store, and review-state probe.",
    response: "Stop private beta launch until the save-to-review contract is fixed."
  },
  {
    id: "review_answer_missing_event",
    severity: "P0",
    title: "Review answer does not write review event.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Review route, answer action, and before/after review event count.",
    response: "Stop private beta launch until review answers append events."
  },
  {
    id: "review_answer_missing_state_update",
    severity: "P0",
    title: "Review answer does not update review state.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Before/after SRS state for the reviewed slug.",
    response: "Stop private beta launch until review answers update memory state."
  },
  {
    id: "fake_counts_not_state_derived",
    severity: "P0",
    title: "Due, Weak, or Mastered counts are fake or not state-derived.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Dashboard/review screenshots and review-state probe.",
    response: "Stop launch until counts are derived from real review state."
  },
  {
    id: "save_only_word_mastered",
    severity: "P0",
    title: "Save-only word appears Mastered.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Saved-word route, review state, and word detail screenshot.",
    response: "Stop launch until mastery requires delayed recall evidence."
  },
  {
    id: "upgrade_interest_grants_paid_entitlement",
    severity: "P0",
    title: "Upgrade interest grants paid entitlement.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Pricing action, upgrade-interest store, plan-state store, and UI copy.",
    response: "Stop launch until interest remains attribution-only."
  },
  {
    id: "pricing_implies_real_checkout",
    severity: "P0",
    title: "Pricing implies real checkout when none exists.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Pricing screenshot and clicked CTA result.",
    response: "Stop launch until no-checkout copy is explicit."
  },
  {
    id: "pack_progress_without_review_evidence",
    severity: "P0",
    title: "Pack progress advances without review evidence and is not marked audit-only.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Pack route screenshot and pack-progress probe.",
    response: "Stop launch until pack progress is real or honestly absent."
  },
  {
    id: "weak_sprint_uses_fake_weak_words",
    severity: "P0",
    title: "Weak Sprint uses fake weak words.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Weak sprint route, state probe, and answer evidence.",
    response: "Stop launch until sprint candidates come from weak state."
  },
  {
    id: "alias_search_missing_slug",
    severity: "P0",
    title: "Alias search points to missing slug.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Alias search action, save route, and word route result.",
    response: "Stop launch until alias links resolve to real canonical words."
  },
  {
    id: "extension_source_save_fails",
    severity: "P0",
    title: "Extension source save fails.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Extension source route and saved/review state probes.",
    response: "Stop launch until extension-source saves create review items."
  },
  {
    id: "local_storage_private_or_secret_payload",
    severity: "P0",
    title:
      "LocalStorage stores secrets, provider tokens, payment data, or raw private payloads.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "List of keys and redacted values showing unsafe payload shape.",
    response: "Stop launch until local storage contains only approved local learning data."
  },
  {
    id: "core_route_crash",
    severity: "P0",
    title:
      "App crashes on dashboard, review, saved, packs, pricing, settings, or word route.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Route, console error, and screenshot.",
    response: "Stop launch until the crashing route is fixed."
  },
  {
    id: "mobile_review_unusable",
    severity: "P0",
    title: "Mobile review flow is unusable.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Mobile viewport screenshot and blocked action.",
    response: "Stop launch until mobile review can be completed."
  },
  {
    id: "keyboard_navigation_blocks_core_flow",
    severity: "P0",
    title: "Accessibility keyboard navigation blocks core save/review flow.",
    blocksPrivateBeta: true,
    blocksPublicBeta: true,
    evidenceRequired: "Keyboard-only route notes and blocked element.",
    response: "Stop launch until keyboard save/review flow is usable."
  },
  {
    id: "ambiguous_cta_copy",
    severity: "P1",
    title: "Ambiguous CTA copy.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Route screenshot and copy note.",
    response: "Record as P1 and polish before public beta."
  },
  {
    id: "incomplete_empty_loading_error_state",
    severity: "P1",
    title: "Incomplete empty/loading/error state.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Route screenshot and state description.",
    response: "Record as P1 and fix before public beta."
  },
  {
    id: "weak_mobile_layout",
    severity: "P1",
    title: "Weak mobile layout.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Mobile screenshot and affected route.",
    response: "Record as P1 unless it blocks mobile review, then escalate to P0."
  },
  {
    id: "pack_copy_needs_polish",
    severity: "P1",
    title: "Pack copy needs polish.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Pack route screenshot and copy note.",
    response: "Record as P1 and handle in Product/UI readiness."
  },
  {
    id: "pricing_outcome_copy_needs_polish",
    severity: "P1",
    title: "Pricing outcome copy needs polish.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Pricing screenshot and copy note.",
    response: "Record as P1 unless it implies checkout, then escalate to P0."
  },
  {
    id: "analytics_event_naming_not_mapped",
    severity: "P1",
    title: "Analytics event naming not fully mapped.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Event names and missing dashboard mapping.",
    response: "Record as P1 for production monitoring work."
  },
  {
    id: "alias_search_coverage_too_small",
    severity: "P1",
    title: "Alias search coverage is too small.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Missing alias examples and expected canonical slugs.",
    response: "Record as P1 for content coverage."
  },
  {
    id: "extension_bridge_not_browser_tested",
    severity: "P1",
    title: "Extension bridge not yet browser-tested end-to-end.",
    blocksPrivateBeta: false,
    blocksPublicBeta: true,
    evidenceRequired: "Browser extension QA gap note.",
    response: "Record as P1 and keep extension invite scope controlled."
  },
  {
    id: "visual_polish",
    severity: "P2",
    title: "Visual polish.",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    evidenceRequired: "Screenshot and polish note.",
    response: "Record as P2 after P0/P1 launch blockers."
  },
  {
    id: "more_pack_categories",
    severity: "P2",
    title: "More pack categories.",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    evidenceRequired: "Requested category note.",
    response: "Record as P2 future roadmap."
  },
  {
    id: "more_detailed_streak_calendar",
    severity: "P2",
    title: "More detailed streak/calendar.",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    evidenceRequired: "Dashboard note.",
    response: "Record as P2 future dashboard polish."
  },
  {
    id: "future_ai_explanation",
    severity: "P2",
    title: "Future AI explanation.",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    evidenceRequired: "Future idea note.",
    response: "Record as P2 and keep AI out until SRS loop is proven."
  },
  {
    id: "future_multilingual_expansion",
    severity: "P2",
    title: "Future multilingual expansion.",
    blocksPrivateBeta: false,
    blocksPublicBeta: false,
    evidenceRequired: "Future expansion note.",
    response: "Record as P2 and do not add multilingual page generation here."
  }
] as const satisfies readonly PaidBetaManualQaStopCondition[];

export const PAID_BETA_MANUAL_QA_SCENARIOS = [
  {
    id: "clean_guest_first_visit",
    title: "Clean guest first visit",
    phase: "setup",
    route: "/",
    routeTargetId: "home",
    severity: "P0",
    objective:
      "Start from a clean local guest state and confirm the app loads without production dependencies.",
    steps: [
      {
        order: 1,
        action: "Clear approved VLX localStorage keys and open `/`.",
        expectedResultIds: ["home_loads_cleanly"],
        evidenceIds: ["desktop_screenshot", "vlx_keys_before"]
      },
      {
        order: 2,
        action: "Open DevTools and run the VLX key listing snippet.",
        expectedResultIds: ["only_approved_keys_present"],
        evidenceIds: ["console_probe_output"]
      }
    ],
    expectedResults: [
      {
        id: "home_loads_cleanly",
        text: "The home dashboard loads with no auth, payment, API, or production-data requirement.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["core_route_crash"]
      },
      {
        id: "only_approved_keys_present",
        text: "Only approved VLX local learning keys are present after reset.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["local_storage_private_or_secret_payload"]
      }
    ],
    evidence: [
      {
        id: "desktop_screenshot",
        label: "Desktop screenshot",
        format: "Screenshot of `/` after reset.",
        required: true
      },
      {
        id: "vlx_keys_before",
        label: "VLX keys after reset",
        format: "Console output from list_vlx_local_storage_keys.",
        required: true
      },
      {
        id: "console_probe_output",
        label: "Console probe output",
        format: "Copied console result with no secrets.",
        required: true
      }
    ],
    stopConditionIds: ["core_route_crash", "local_storage_private_or_secret_payload"],
    storageProbeKeys: [],
    consoleProbeIds: ["list_vlx_local_storage_keys"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "save_word_from_word_page",
    title: "Save word from word page",
    phase: "save_sources",
    route: "/word/dissonance",
    routeTargetId: "word_dissonance",
    severity: "P0",
    objective:
      "Confirm a word-page save creates or preserves saved-word and review-state records.",
    steps: [
      {
        order: 1,
        action: "Open `/word/dissonance`, use the save action, then open the word-page save route if needed.",
        expectedResultIds: ["word_page_save_visible"],
        evidenceIds: ["word_page_screenshot"]
      },
      {
        order: 2,
        action: "Run saved-word and review-state console probes.",
        expectedResultIds: ["saved_word_has_review_item"],
        evidenceIds: ["saved_words_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "word_page_save_visible",
        text: "The word page reflects a saved state without fake mastery.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_only_word_mastered"]
      },
      {
        id: "saved_word_has_review_item",
        text: "Dissonance appears in both saved words and review state.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_missing_review_item"]
      }
    ],
    evidence: [
      {
        id: "word_page_screenshot",
        label: "Word page saved screenshot",
        format: "Screenshot of `/word/dissonance` after save.",
        required: true
      },
      {
        id: "saved_words_probe",
        label: "Saved words probe",
        format: "Output from inspect_saved_words.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      }
    ],
    stopConditionIds: ["save_missing_review_item", "save_only_word_mastered"],
    storageProbeKeys: ["vlx_saved_words_v1", "vlx_review_state_v1"],
    consoleProbeIds: ["inspect_saved_words", "inspect_review_state_dissonance"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "save_word_from_alias_search",
    title: "Save word from alias search",
    phase: "save_sources",
    route: "/save?slug=dissonance&source=alias_search",
    routeTargetId: "save_alias_search",
    severity: "P0",
    objective:
      "Confirm alias-search save routes to the canonical dissonance slug and review item.",
    steps: [
      {
        order: 1,
        action:
          "Open the alias save route directly; DashboardV2 currently exposes no learner-facing alias-search UI.",
        expectedResultIds: ["alias_save_resolves_slug"],
        evidenceIds: ["alias_route_screenshot"]
      },
      {
        order: 2,
        action: "Inspect saved words and review state for dissonance.",
        expectedResultIds: ["alias_save_creates_review_item"],
        evidenceIds: ["saved_words_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "alias_save_resolves_slug",
        text: "Alias save lands on a real canonical dissonance record.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["alias_search_missing_slug"]
      },
      {
        id: "alias_save_creates_review_item",
        text: "Alias save creates or preserves the same review-state item.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_missing_review_item"]
      }
    ],
    evidence: [
      {
        id: "alias_route_screenshot",
        label: "Alias save screenshot",
        format: "Screenshot after alias save.",
        required: true
      },
      {
        id: "saved_words_probe",
        label: "Saved words probe",
        format: "Output from inspect_saved_words.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      }
    ],
    stopConditionIds: ["alias_search_missing_slug", "save_missing_review_item"],
    storageProbeKeys: ["vlx_saved_words_v1", "vlx_review_state_v1"],
    consoleProbeIds: ["inspect_saved_words", "inspect_review_state_dissonance"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "save_word_from_extension_source",
    title: "Save word from extension source",
    phase: "save_sources",
    route: "/save?slug=dissonance&source=extension",
    routeTargetId: "save_extension",
    severity: "P0",
    objective:
      "Confirm app-side extension source saves work without requiring extension secrets or production data.",
    steps: [
      {
        order: 1,
        action: "Open `/save?slug=dissonance&source=extension` from a clean state.",
        expectedResultIds: ["extension_save_route_loads"],
        evidenceIds: ["extension_save_screenshot"]
      },
      {
        order: 2,
        action: "Inspect saved words and review state.",
        expectedResultIds: ["extension_save_creates_review_item"],
        evidenceIds: ["saved_words_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "extension_save_route_loads",
        text: "Extension source is accepted as app-side attribution and does not request private payloads.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["extension_source_save_fails"]
      },
      {
        id: "extension_save_creates_review_item",
        text: "Extension save creates or preserves a review item for dissonance.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_missing_review_item"]
      }
    ],
    evidence: [
      {
        id: "extension_save_screenshot",
        label: "Extension save screenshot",
        format: "Screenshot after extension source save.",
        required: true
      },
      {
        id: "saved_words_probe",
        label: "Saved words probe",
        format: "Output from inspect_saved_words.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      }
    ],
    stopConditionIds: ["extension_source_save_fails", "save_missing_review_item"],
    storageProbeKeys: ["vlx_saved_words_v1", "vlx_review_state_v1"],
    consoleProbeIds: ["inspect_saved_words", "inspect_review_state_dissonance"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "saved_library_review_entry",
    title: "Saved library review entry",
    phase: "save_sources",
    route: "/saved",
    routeTargetId: "saved",
    severity: "P0",
    objective:
      "Confirm the saved library supports review entry and does not dominate or fake the learning loop.",
    steps: [
      {
        order: 1,
        action: "Open `/saved` after saving dissonance.",
        expectedResultIds: ["saved_library_lists_saved_word"],
        evidenceIds: ["saved_library_screenshot"]
      },
      {
        order: 2,
        action: "Use the saved entry review affordance.",
        expectedResultIds: ["saved_library_routes_to_review"],
        evidenceIds: ["review_route_note"]
      }
    ],
    expectedResults: [
      {
        id: "saved_library_lists_saved_word",
        text: "Saved library lists dissonance with honest local memory state.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_only_word_mastered"]
      },
      {
        id: "saved_library_routes_to_review",
        text: "Saved entry can lead into active recall review.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["core_route_crash"]
      }
    ],
    evidence: [
      {
        id: "saved_library_screenshot",
        label: "Saved library screenshot",
        format: "Screenshot of `/saved`.",
        required: true
      },
      {
        id: "review_route_note",
        label: "Review route note",
        format: "Route reached from saved entry.",
        required: true
      }
    ],
    stopConditionIds: ["save_only_word_mastered", "core_route_crash"],
    storageProbeKeys: ["vlx_saved_words_v1", "vlx_review_state_v1"],
    consoleProbeIds: ["inspect_saved_words", "confirm_saved_only_no_fake_mastery"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "review_due_session",
    title: "Due review session",
    phase: "review_srs",
    route: "/review?mode=due",
    routeTargetId: "review_due",
    severity: "P0",
    objective: "Confirm due review candidates and answer writes come from real SRS state.",
    steps: [
      {
        order: 1,
        action: "Open `/review?mode=due` with at least one due saved word.",
        expectedResultIds: ["due_review_uses_state"],
        evidenceIds: ["review_screenshot"]
      },
      {
        order: 2,
        action: "Answer one review card and inspect review events, state, and daily stats.",
        expectedResultIds: ["review_answer_writes_state"],
        evidenceIds: ["events_count_probe", "review_state_probe", "daily_stats_probe"]
      }
    ],
    expectedResults: [
      {
        id: "due_review_uses_state",
        text: "Due review uses due SRS records instead of fake cards.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["fake_counts_not_state_derived"]
      },
      {
        id: "review_answer_writes_state",
        text: "Answer creates an event, updates review state, and updates daily stats.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "review_answer_missing_event",
          "review_answer_missing_state_update"
        ]
      }
    ],
    evidence: [
      {
        id: "review_screenshot",
        label: "Due review screenshot",
        format: "Screenshot of due review card.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Before/after inspect_review_events_count output.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Before/after inspect_review_state_dissonance output.",
        required: true
      },
      {
        id: "daily_stats_probe",
        label: "Daily stats probe",
        format: "Output from inspect_daily_stats.",
        required: true
      }
    ],
    stopConditionIds: [
      "fake_counts_not_state_derived",
      "review_answer_missing_event",
      "review_answer_missing_state_update"
    ],
    storageProbeKeys: [
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1"
    ],
    consoleProbeIds: [
      "inspect_review_state_dissonance",
      "inspect_review_events_count",
      "inspect_daily_stats"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "review_weak_session",
    title: "Weak review session",
    phase: "review_srs",
    route: "/review?mode=weak",
    routeTargetId: "review_weak",
    severity: "P0",
    objective: "Confirm weak review uses weak score, misses, or Weak mastery.",
    steps: [
      {
        order: 1,
        action: "Create or use a weak word by answering wrong, then open `/review?mode=weak`.",
        expectedResultIds: ["weak_review_uses_state"],
        evidenceIds: ["weak_review_screenshot", "review_state_probe"]
      },
      {
        order: 2,
        action: "Answer a weak review card and inspect event/state updates.",
        expectedResultIds: ["weak_review_writes_state"],
        evidenceIds: ["events_count_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "weak_review_uses_state",
        text: "Weak review presents real weak candidates.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["fake_counts_not_state_derived"]
      },
      {
        id: "weak_review_writes_state",
        text: "Weak review answer writes an event and updates the same state record.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "review_answer_missing_event",
          "review_answer_missing_state_update"
        ]
      }
    ],
    evidence: [
      {
        id: "weak_review_screenshot",
        label: "Weak review screenshot",
        format: "Screenshot showing weak review card or honest empty state.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Before/after inspect_review_events_count output.",
        required: true
      }
    ],
    stopConditionIds: [
      "fake_counts_not_state_derived",
      "review_answer_missing_event",
      "review_answer_missing_state_update"
    ],
    storageProbeKeys: ["vlx_review_state_v1", "vlx_review_events_v1"],
    consoleProbeIds: ["inspect_review_state_dissonance", "inspect_review_events_count"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "review_word_focused_session",
    title: "Focused word review session",
    phase: "review_srs",
    route: "/review?mode=word&slug=dissonance",
    routeTargetId: "review_word",
    severity: "P0",
    objective: "Confirm a focused word review updates the matching slug only.",
    steps: [
      {
        order: 1,
        action: "Open focused review for dissonance.",
        expectedResultIds: ["focused_review_loads_word"],
        evidenceIds: ["focused_review_screenshot"]
      },
      {
        order: 2,
        action: "Answer the card and inspect the dissonance event/state.",
        expectedResultIds: ["focused_review_writes_state"],
        evidenceIds: ["events_count_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "focused_review_loads_word",
        text: "Focused review shows dissonance and no unrelated fake card.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["core_route_crash"]
      },
      {
        id: "focused_review_writes_state",
        text: "Focused review writes a review event and updates dissonance state.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "review_answer_missing_event",
          "review_answer_missing_state_update"
        ]
      }
    ],
    evidence: [
      {
        id: "focused_review_screenshot",
        label: "Focused review screenshot",
        format: "Screenshot of focused word card.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Before/after inspect_review_events_count output.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      }
    ],
    stopConditionIds: [
      "core_route_crash",
      "review_answer_missing_event",
      "review_answer_missing_state_update"
    ],
    storageProbeKeys: ["vlx_review_state_v1", "vlx_review_events_v1"],
    consoleProbeIds: ["inspect_review_events_count", "inspect_review_state_dissonance"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "review_hub_session",
    title: "Hub review session",
    phase: "review_srs",
    route: "/review?mode=hub&hub=academic-vocabulary&limit=10",
    routeTargetId: "review_hub",
    severity: "P0",
    objective: "Confirm hub review supports Academic Vocabulary without fake progress.",
    steps: [
      {
        order: 1,
        action: "Open Academic Vocabulary hub review.",
        expectedResultIds: ["hub_review_loads"],
        evidenceIds: ["hub_review_screenshot"]
      },
      {
        order: 2,
        action: "Answer one hub card and inspect review events and pack progress.",
        expectedResultIds: ["hub_review_writes_evidence"],
        evidenceIds: ["events_count_probe", "pack_progress_probe"]
      }
    ],
    expectedResults: [
      {
        id: "hub_review_loads",
        text: "Hub review loads known Academic Vocabulary content.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["core_route_crash"]
      },
      {
        id: "hub_review_writes_evidence",
        text: "Hub review answer writes review evidence before progress is credited.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "review_answer_missing_event",
          "pack_progress_without_review_evidence"
        ]
      }
    ],
    evidence: [
      {
        id: "hub_review_screenshot",
        label: "Hub review screenshot",
        format: "Screenshot of hub review route.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Output from inspect_review_events_count.",
        required: true
      },
      {
        id: "pack_progress_probe",
        label: "Pack progress probe",
        format: "Output from inspect_pack_progress.",
        required: true
      }
    ],
    stopConditionIds: [
      "core_route_crash",
      "review_answer_missing_event",
      "pack_progress_without_review_evidence"
    ],
    storageProbeKeys: ["vlx_review_events_v1", "vlx_pack_progress_v1"],
    consoleProbeIds: ["inspect_review_events_count", "inspect_pack_progress"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "weak_words_sprint",
    title: "Weak words sprint",
    phase: "review_srs",
    route: "/review/weak-sprint",
    routeTargetId: "review_weak_sprint",
    severity: "P0",
    objective: "Confirm Weak Sprint uses real weak words and writes answer evidence.",
    steps: [
      {
        order: 1,
        action: "Create a weak word through a wrong answer, then open `/review/weak-sprint`.",
        expectedResultIds: ["weak_sprint_uses_real_weak_word"],
        evidenceIds: ["weak_sprint_screenshot", "review_state_probe"]
      },
      {
        order: 2,
        action: "Answer a sprint card and inspect events/state.",
        expectedResultIds: ["weak_sprint_writes_review_evidence"],
        evidenceIds: ["events_count_probe", "review_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "weak_sprint_uses_real_weak_word",
        text: "Weak Sprint candidates come from real weak state.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["weak_sprint_uses_fake_weak_words"]
      },
      {
        id: "weak_sprint_writes_review_evidence",
        text: "Weak Sprint answer writes review event and updates SRS state.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "review_answer_missing_event",
          "review_answer_missing_state_update"
        ]
      }
    ],
    evidence: [
      {
        id: "weak_sprint_screenshot",
        label: "Weak Sprint screenshot",
        format: "Screenshot of sprint card or honest empty state.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Output from inspect_review_events_count.",
        required: true
      }
    ],
    stopConditionIds: [
      "weak_sprint_uses_fake_weak_words",
      "review_answer_missing_event",
      "review_answer_missing_state_update"
    ],
    storageProbeKeys: ["vlx_review_state_v1", "vlx_review_events_v1"],
    consoleProbeIds: ["inspect_review_state_dissonance", "inspect_review_events_count"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "pack_preview_start",
    title: "Pack preview start",
    phase: "packs",
    route: "/packs/academic-vocabulary",
    routeTargetId: "academic_pack",
    severity: "P0",
    objective: "Confirm Academic Vocabulary preview can start review and record honest start state.",
    steps: [
      {
        order: 1,
        action: "Open `/packs/academic-vocabulary` and start preview.",
        expectedResultIds: ["pack_preview_starts_review"],
        evidenceIds: ["pack_detail_screenshot"]
      },
      {
        order: 2,
        action: "Inspect pack progress after preview start.",
        expectedResultIds: ["pack_progress_start_is_honest"],
        evidenceIds: ["pack_progress_probe"]
      }
    ],
    expectedResults: [
      {
        id: "pack_preview_starts_review",
        text: "Preview start routes into hub review for Academic Vocabulary.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["core_route_crash"]
      },
      {
        id: "pack_progress_start_is_honest",
        text: "Pack progress records preview start without fake reviewed counts.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pack_progress_without_review_evidence"]
      }
    ],
    evidence: [
      {
        id: "pack_detail_screenshot",
        label: "Pack detail screenshot",
        format: "Screenshot before or after preview start.",
        required: true
      },
      {
        id: "pack_progress_probe",
        label: "Pack progress probe",
        format: "Output from inspect_pack_progress.",
        required: true
      }
    ],
    stopConditionIds: ["core_route_crash", "pack_progress_without_review_evidence"],
    storageProbeKeys: ["vlx_pack_progress_v1"],
    consoleProbeIds: ["inspect_pack_progress"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "pack_preview_completion",
    title: "Pack preview completion",
    phase: "packs",
    route: "/review?mode=hub&hub=academic-vocabulary&limit=10",
    routeTargetId: "review_hub",
    severity: "P0",
    objective: "Confirm preview completion derives from review answers.",
    steps: [
      {
        order: 1,
        action: "Complete a short Academic Vocabulary hub review pass.",
        expectedResultIds: ["pack_completion_has_review_events"],
        evidenceIds: ["events_count_probe"]
      },
      {
        order: 2,
        action: "Inspect pack progress after completion.",
        expectedResultIds: ["pack_completion_progress_is_real"],
        evidenceIds: ["pack_progress_probe"]
      }
    ],
    expectedResults: [
      {
        id: "pack_completion_has_review_events",
        text: "Preview completion has corresponding review answer events.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["review_answer_missing_event"]
      },
      {
        id: "pack_completion_progress_is_real",
        text: "Reviewed/correct counts are tied to answered cards.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pack_progress_without_review_evidence"]
      }
    ],
    evidence: [
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Before/after inspect_review_events_count output.",
        required: true
      },
      {
        id: "pack_progress_probe",
        label: "Pack progress probe",
        format: "Output from inspect_pack_progress.",
        required: true
      }
    ],
    stopConditionIds: ["review_answer_missing_event", "pack_progress_without_review_evidence"],
    storageProbeKeys: ["vlx_review_events_v1", "vlx_pack_progress_v1"],
    consoleProbeIds: ["inspect_review_events_count", "inspect_pack_progress"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "pack_progress_continuation",
    title: "Pack progress continuation",
    phase: "packs",
    route: "/packs",
    routeTargetId: "packs",
    severity: "P1",
    objective: "Confirm pack catalog/detail displays honest continuation after preview evidence.",
    steps: [
      {
        order: 1,
        action: "Open `/packs` after preview activity.",
        expectedResultIds: ["pack_catalog_shows_honest_progress"],
        evidenceIds: ["pack_catalog_screenshot"]
      },
      {
        order: 2,
        action: "Open `/packs/academic-vocabulary` again and inspect progress.",
        expectedResultIds: ["pack_detail_continuation_is_honest"],
        evidenceIds: ["pack_detail_screenshot", "pack_progress_probe"]
      }
    ],
    expectedResults: [
      {
        id: "pack_catalog_shows_honest_progress",
        text: "Pack catalog does not overstate progress for planned or unreviewed packs.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pack_progress_without_review_evidence"]
      },
      {
        id: "pack_detail_continuation_is_honest",
        text: "Academic Vocabulary progress matches local pack progress evidence.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pack_progress_without_review_evidence"]
      }
    ],
    evidence: [
      {
        id: "pack_catalog_screenshot",
        label: "Pack catalog screenshot",
        format: "Screenshot of `/packs`.",
        required: true
      },
      {
        id: "pack_detail_screenshot",
        label: "Pack detail screenshot",
        format: "Screenshot of Academic Vocabulary pack detail.",
        required: true
      },
      {
        id: "pack_progress_probe",
        label: "Pack progress probe",
        format: "Output from inspect_pack_progress.",
        required: true
      }
    ],
    stopConditionIds: ["pack_progress_without_review_evidence", "pack_copy_needs_polish"],
    storageProbeKeys: ["vlx_pack_progress_v1"],
    consoleProbeIds: ["inspect_pack_progress"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "pricing_interest_capture",
    title: "Pricing interest capture",
    phase: "pricing_paywall",
    route: "/pricing",
    routeTargetId: "pricing",
    severity: "P0",
    objective: "Confirm pricing records interest only and does not imply real checkout.",
    steps: [
      {
        order: 1,
        action: "Open `/pricing`, read the plan CTAs, and click Lite or Pro interest.",
        expectedResultIds: ["pricing_copy_no_checkout"],
        evidenceIds: ["pricing_screenshot"]
      },
      {
        order: 2,
        action: "Inspect upgrade interest and plan state.",
        expectedResultIds: ["interest_is_attribution_only"],
        evidenceIds: ["upgrade_interest_probe", "plan_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "pricing_copy_no_checkout",
        text: "Pricing clearly avoids real checkout, subscription, billing, or entitlement claims.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pricing_implies_real_checkout"]
      },
      {
        id: "interest_is_attribution_only",
        text: "Upgrade interest does not grant paid entitlement.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      }
    ],
    evidence: [
      {
        id: "pricing_screenshot",
        label: "Pricing screenshot",
        format: "Screenshot of pricing copy and CTA result.",
        required: true
      },
      {
        id: "upgrade_interest_probe",
        label: "Upgrade interest probe",
        format: "Output from inspect_upgrade_interest.",
        required: true
      },
      {
        id: "plan_state_probe",
        label: "Plan state probe",
        format: "Output from confirm_no_paid_entitlement_from_interest.",
        required: true
      }
    ],
    stopConditionIds: [
      "pricing_implies_real_checkout",
      "upgrade_interest_grants_paid_entitlement"
    ],
    storageProbeKeys: ["vlx_upgrade_interest_v1", "vlx_plan_state_v1"],
    consoleProbeIds: [
      "inspect_upgrade_interest",
      "confirm_no_paid_entitlement_from_interest"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "paywall_trigger_save_limit",
    title: "Paywall trigger save limit",
    phase: "pricing_paywall",
    route: "/dashboard",
    routeTargetId: "dashboard",
    severity: "P1",
    objective: "Confirm save-limit paywall copy is a local placeholder and not paid access.",
    steps: [
      {
        order: 1,
        action: "Drive or inspect a save-limit paywall prompt from dashboard/saved flow.",
        expectedResultIds: ["save_limit_prompt_is_clear"],
        evidenceIds: ["paywall_prompt_screenshot"]
      },
      {
        order: 2,
        action: "Confirm any CTA records interest only.",
        expectedResultIds: ["save_limit_interest_only"],
        evidenceIds: ["upgrade_interest_probe"]
      }
    ],
    expectedResults: [
      {
        id: "save_limit_prompt_is_clear",
        text: "Save-limit prompt explains local paid beta interest without checkout.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["ambiguous_cta_copy", "pricing_implies_real_checkout"]
      },
      {
        id: "save_limit_interest_only",
        text: "CTA records interest only and grants no entitlement.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      }
    ],
    evidence: [
      {
        id: "paywall_prompt_screenshot",
        label: "Paywall prompt screenshot",
        format: "Screenshot of save-limit prompt.",
        required: true
      },
      {
        id: "upgrade_interest_probe",
        label: "Upgrade interest probe",
        format: "Output from inspect_upgrade_interest.",
        required: true
      }
    ],
    stopConditionIds: [
      "ambiguous_cta_copy",
      "pricing_implies_real_checkout",
      "upgrade_interest_grants_paid_entitlement"
    ],
    storageProbeKeys: ["vlx_upgrade_interest_v1"],
    consoleProbeIds: ["inspect_upgrade_interest"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "paywall_trigger_review_limit",
    title: "Paywall trigger review limit",
    phase: "pricing_paywall",
    route: "/review",
    routeTargetId: "review",
    severity: "P1",
    objective: "Confirm review-limit paywall copy does not block evidence or imply entitlement.",
    steps: [
      {
        order: 1,
        action: "Drive or inspect a review-limit paywall prompt from review flow.",
        expectedResultIds: ["review_limit_prompt_is_clear"],
        evidenceIds: ["paywall_prompt_screenshot"]
      },
      {
        order: 2,
        action: "Confirm any CTA records interest only.",
        expectedResultIds: ["review_limit_interest_only"],
        evidenceIds: ["upgrade_interest_probe"]
      }
    ],
    expectedResults: [
      {
        id: "review_limit_prompt_is_clear",
        text: "Review-limit prompt explains local paid beta interest without checkout.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["ambiguous_cta_copy", "pricing_implies_real_checkout"]
      },
      {
        id: "review_limit_interest_only",
        text: "CTA records interest only and grants no entitlement.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      }
    ],
    evidence: [
      {
        id: "paywall_prompt_screenshot",
        label: "Paywall prompt screenshot",
        format: "Screenshot of review-limit prompt.",
        required: true
      },
      {
        id: "upgrade_interest_probe",
        label: "Upgrade interest probe",
        format: "Output from inspect_upgrade_interest.",
        required: true
      }
    ],
    stopConditionIds: [
      "ambiguous_cta_copy",
      "pricing_implies_real_checkout",
      "upgrade_interest_grants_paid_entitlement"
    ],
    storageProbeKeys: ["vlx_upgrade_interest_v1"],
    consoleProbeIds: ["inspect_upgrade_interest"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "dashboard_mission_counts",
    title: "Dashboard mission counts",
    phase: "dashboard_settings",
    route: "/dashboard",
    routeTargetId: "dashboard",
    severity: "P0",
    objective: "Confirm Today Memory Mission counts come from saved/review state.",
    steps: [
      {
        order: 1,
        action: "Open `/dashboard` after save and review activity.",
        expectedResultIds: ["dashboard_counts_match_state"],
        evidenceIds: ["dashboard_screenshot", "review_state_probe"]
      },
      {
        order: 2,
        action: "Compare due, weak, mastered, and reviewed counts with local stores.",
        expectedResultIds: ["dashboard_no_fake_mastery"],
        evidenceIds: ["daily_stats_probe", "events_count_probe"]
      }
    ],
    expectedResults: [
      {
        id: "dashboard_counts_match_state",
        text: "Dashboard mission counts are state-derived.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["fake_counts_not_state_derived"]
      },
      {
        id: "dashboard_no_fake_mastery",
        text: "Dashboard does not mark save-only words Mastered.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_only_word_mastered"]
      }
    ],
    evidence: [
      {
        id: "dashboard_screenshot",
        label: "Dashboard screenshot",
        format: "Screenshot of Today Memory Mission.",
        required: true
      },
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      },
      {
        id: "daily_stats_probe",
        label: "Daily stats probe",
        format: "Output from inspect_daily_stats.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Output from inspect_review_events_count.",
        required: true
      }
    ],
    stopConditionIds: ["fake_counts_not_state_derived", "save_only_word_mastered"],
    storageProbeKeys: [
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1"
    ],
    consoleProbeIds: [
      "inspect_review_state_dissonance",
      "inspect_daily_stats",
      "inspect_review_events_count"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "settings_plan_state_safety",
    title: "Settings plan state safety",
    phase: "dashboard_settings",
    route: "/settings",
    routeTargetId: "settings",
    severity: "P0",
    objective: "Confirm settings never treats local plan state as paid entitlement.",
    steps: [
      {
        order: 1,
        action: "Open `/settings` and inspect plan state messaging.",
        expectedResultIds: ["settings_plan_copy_safe"],
        evidenceIds: ["settings_screenshot"]
      },
      {
        order: 2,
        action: "Run entitlement safety console probe.",
        expectedResultIds: ["settings_no_paid_entitlement"],
        evidenceIds: ["plan_state_probe"]
      }
    ],
    expectedResults: [
      {
        id: "settings_plan_copy_safe",
        text: "Settings copy presents local plan preview only.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      },
      {
        id: "settings_no_paid_entitlement",
        text: "Local plan and interest records do not prove paid access.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      }
    ],
    evidence: [
      {
        id: "settings_screenshot",
        label: "Settings screenshot",
        format: "Screenshot of plan-state panel.",
        required: true
      },
      {
        id: "plan_state_probe",
        label: "Plan state probe",
        format: "Output from confirm_no_paid_entitlement_from_interest.",
        required: true
      }
    ],
    stopConditionIds: ["upgrade_interest_grants_paid_entitlement"],
    storageProbeKeys: ["vlx_plan_state_v1", "vlx_upgrade_interest_v1"],
    consoleProbeIds: ["confirm_no_paid_entitlement_from_interest"],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "mobile_dashboard_review_flow",
    title: "Mobile dashboard review flow",
    phase: "mobile_accessibility_privacy",
    route: "/dashboard",
    routeTargetId: "dashboard",
    severity: "P0",
    objective: "Confirm mobile users can move from dashboard to review and answer a card.",
    steps: [
      {
        order: 1,
        action: "Set mobile viewport, open `/dashboard`, and start review.",
        expectedResultIds: ["mobile_dashboard_cta_usable"],
        evidenceIds: ["mobile_dashboard_screenshot"]
      },
      {
        order: 2,
        action: "Answer one review card on mobile and inspect event/state updates.",
        expectedResultIds: ["mobile_review_answer_usable"],
        evidenceIds: ["mobile_review_screenshot", "events_count_probe"]
      }
    ],
    expectedResults: [
      {
        id: "mobile_dashboard_cta_usable",
        text: "Mobile dashboard CTAs are visible and usable.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["mobile_review_unusable"]
      },
      {
        id: "mobile_review_answer_usable",
        text: "Mobile review can be completed and writes evidence.",
        mustRecordEvidence: true,
        linkedStopConditionIds: [
          "mobile_review_unusable",
          "review_answer_missing_event",
          "review_answer_missing_state_update"
        ]
      }
    ],
    evidence: [
      {
        id: "mobile_dashboard_screenshot",
        label: "Mobile dashboard screenshot",
        format: "390x844 screenshot of dashboard.",
        required: true
      },
      {
        id: "mobile_review_screenshot",
        label: "Mobile review screenshot",
        format: "390x844 screenshot of review card.",
        required: true
      },
      {
        id: "events_count_probe",
        label: "Review events count",
        format: "Before/after inspect_review_events_count output.",
        required: true
      }
    ],
    stopConditionIds: [
      "mobile_review_unusable",
      "review_answer_missing_event",
      "review_answer_missing_state_update",
      "weak_mobile_layout"
    ],
    storageProbeKeys: ["vlx_review_state_v1", "vlx_review_events_v1"],
    consoleProbeIds: ["inspect_review_events_count"],
    deviceProfileIds: ["mobile"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "empty_state_review_no_due",
    title: "Empty state review no due",
    phase: "mobile_accessibility_privacy",
    route: "/review?mode=due",
    routeTargetId: "review_due",
    severity: "P1",
    objective: "Confirm no-due review state is honest and useful.",
    steps: [
      {
        order: 1,
        action: "Use a clean or not-due state and open `/review?mode=due`.",
        expectedResultIds: ["no_due_empty_state_honest"],
        evidenceIds: ["empty_state_screenshot"]
      },
      {
        order: 2,
        action: "Confirm the empty state offers a safe next action.",
        expectedResultIds: ["empty_state_has_next_action"],
        evidenceIds: ["empty_state_note"]
      }
    ],
    expectedResults: [
      {
        id: "no_due_empty_state_honest",
        text: "No-due state does not invent review cards.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["fake_counts_not_state_derived"]
      },
      {
        id: "empty_state_has_next_action",
        text: "Empty state gives a useful, non-misleading next action.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["incomplete_empty_loading_error_state"]
      }
    ],
    evidence: [
      {
        id: "empty_state_screenshot",
        label: "Empty state screenshot",
        format: "Screenshot of no-due review state.",
        required: true
      },
      {
        id: "empty_state_note",
        label: "Empty state note",
        format: "Short note on next action.",
        required: true
      }
    ],
    stopConditionIds: [
      "fake_counts_not_state_derived",
      "incomplete_empty_loading_error_state"
    ],
    storageProbeKeys: ["vlx_review_state_v1"],
    consoleProbeIds: ["inspect_review_state_dissonance"],
    deviceProfileIds: ["desktop", "mobile"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "no_fake_mastery_after_save_only",
    title: "No fake mastery after save only",
    phase: "verdict",
    route: "/word/dissonance",
    routeTargetId: "word_dissonance",
    severity: "P0",
    objective: "Confirm save-only state never appears Mastered.",
    steps: [
      {
        order: 1,
        action: "From clean state, save dissonance but do not answer delayed review.",
        expectedResultIds: ["saved_only_not_mastered"],
        evidenceIds: ["review_state_probe", "word_page_screenshot"]
      },
      {
        order: 2,
        action: "Run fake-mastery console probe.",
        expectedResultIds: ["mastery_requires_review_evidence"],
        evidenceIds: ["fake_mastery_probe"]
      }
    ],
    expectedResults: [
      {
        id: "saved_only_not_mastered",
        text: "Saved-only dissonance is New or Learning, not Mastered.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_only_word_mastered"]
      },
      {
        id: "mastery_requires_review_evidence",
        text: "Mastery requires delayed recall evidence.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["save_only_word_mastered"]
      }
    ],
    evidence: [
      {
        id: "review_state_probe",
        label: "Review state probe",
        format: "Output from inspect_review_state_dissonance.",
        required: true
      },
      {
        id: "word_page_screenshot",
        label: "Word page screenshot",
        format: "Screenshot of memory state panel.",
        required: true
      },
      {
        id: "fake_mastery_probe",
        label: "Fake mastery probe",
        format: "Output from confirm_saved_only_no_fake_mastery.",
        required: true
      }
    ],
    stopConditionIds: ["save_only_word_mastered"],
    storageProbeKeys: ["vlx_saved_words_v1", "vlx_review_state_v1"],
    consoleProbeIds: [
      "inspect_review_state_dissonance",
      "confirm_saved_only_no_fake_mastery"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "no_paid_entitlement_from_interest",
    title: "No paid entitlement from interest",
    phase: "verdict",
    route: "/pricing",
    routeTargetId: "pricing",
    severity: "P0",
    objective: "Confirm interest capture cannot become paid access.",
    steps: [
      {
        order: 1,
        action: "Click pricing interest CTA.",
        expectedResultIds: ["interest_recorded_without_checkout"],
        evidenceIds: ["pricing_screenshot"]
      },
      {
        order: 2,
        action: "Run entitlement safety console probe.",
        expectedResultIds: ["interest_not_entitlement"],
        evidenceIds: ["entitlement_probe"]
      }
    ],
    expectedResults: [
      {
        id: "interest_recorded_without_checkout",
        text: "Interest can be recorded without checkout, receipt, or subscription.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["pricing_implies_real_checkout"]
      },
      {
        id: "interest_not_entitlement",
        text: "Interest and plan state do not grant paid entitlement.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["upgrade_interest_grants_paid_entitlement"]
      }
    ],
    evidence: [
      {
        id: "pricing_screenshot",
        label: "Pricing screenshot",
        format: "Screenshot after interest CTA.",
        required: true
      },
      {
        id: "entitlement_probe",
        label: "Entitlement safety probe",
        format: "Output from confirm_no_paid_entitlement_from_interest.",
        required: true
      }
    ],
    stopConditionIds: [
      "pricing_implies_real_checkout",
      "upgrade_interest_grants_paid_entitlement"
    ],
    storageProbeKeys: ["vlx_upgrade_interest_v1", "vlx_plan_state_v1"],
    consoleProbeIds: [
      "inspect_upgrade_interest",
      "confirm_no_paid_entitlement_from_interest"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  },
  {
    id: "local_storage_privacy_probe",
    title: "Local storage privacy probe",
    phase: "mobile_accessibility_privacy",
    route: "/dashboard",
    routeTargetId: "dashboard",
    severity: "P0",
    objective: "Confirm approved localStorage keys do not contain secrets or private payloads.",
    steps: [
      {
        order: 1,
        action: "Run the VLX key listing snippet after the full manual pass.",
        expectedResultIds: ["storage_keys_approved"],
        evidenceIds: ["vlx_keys_after"]
      },
      {
        order: 2,
        action: "Inspect each required store shape and redact values in notes.",
        expectedResultIds: ["storage_values_privacy_safe"],
        evidenceIds: ["storage_probe_notes"]
      }
    ],
    expectedResults: [
      {
        id: "storage_keys_approved",
        text: "Only approved VLX local learning keys are present.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["local_storage_private_or_secret_payload"]
      },
      {
        id: "storage_values_privacy_safe",
        text: "Stores contain no secrets, provider tokens, payment data, or raw private payloads.",
        mustRecordEvidence: true,
        linkedStopConditionIds: ["local_storage_private_or_secret_payload"]
      }
    ],
    evidence: [
      {
        id: "vlx_keys_after",
        label: "VLX keys after pass",
        format: "Output from list_vlx_local_storage_keys.",
        required: true
      },
      {
        id: "storage_probe_notes",
        label: "Storage probe notes",
        format: "Redacted notes for each required key.",
        required: true
      }
    ],
    stopConditionIds: ["local_storage_private_or_secret_payload"],
    storageProbeKeys: [
      "vlx_saved_words_v1",
      "vlx_review_state_v1",
      "vlx_review_events_v1",
      "vlx_daily_stats_v1",
      "vlx_pack_progress_v1",
      "vlx_plan_state_v1",
      "vlx_upgrade_interest_v1"
    ],
    consoleProbeIds: [
      "list_vlx_local_storage_keys",
      "inspect_saved_words",
      "inspect_review_state_dissonance",
      "inspect_review_events_count",
      "inspect_daily_stats",
      "inspect_pack_progress",
      "inspect_upgrade_interest"
    ],
    deviceProfileIds: ["desktop"],
    browserProfileIds: ["chromium"]
  }
] as const satisfies readonly PaidBetaManualQaScenario[];

export const PAID_BETA_MANUAL_QA_NEXT_STEP = {
  prNumber: 72,
  title: "Product/UI readiness audit or Manual QA execution report template",
  docsContractsTestsOnly: true,
  realApiRouteImplementationRecommended: false,
  paymentImplementationRecommended: false,
  accountSyncImplementationRecommended: false,
  reason:
    "The next PR should add a Product/UI readiness audit or an owner-run manual QA execution report template, not real API route implementation."
} as const satisfies PaidBetaManualQaNextStep;

export const PAID_BETA_MANUAL_QA_CONTRACT = {
  visualLexiconPaidBetaManualQaVersion:
    VISUAL_LEXICON_PAID_BETA_MANUAL_QA_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/paid-beta-manual-qa-checklist",
  scope: "Track B paid beta owner-run manual QA checklist",
  privateBetaVerdict: PAID_BETA_MANUAL_QA_PRIVATE_VERDICT,
  publicBetaVerdict: PAID_BETA_MANUAL_QA_PUBLIC_VERDICT,
  privateBetaProtocol:
    "Private paid beta remains conditional and owner-run only after all P0 manual QA scenarios pass with evidence and payment stays manual/off-app.",
  publicBetaWarning:
    "Public paid beta remains No-Go until account sync, payment, production monitoring, privacy/legal, accessibility, and support gates are cleared.",
  phases: PAID_BETA_MANUAL_QA_PHASES,
  routeTargets: PAID_BETA_MANUAL_QA_ROUTE_TARGETS,
  storageProbes: PAID_BETA_MANUAL_QA_STORAGE_PROBES,
  consoleProbes: PAID_BETA_MANUAL_QA_CONSOLE_PROBES,
  deviceProfiles: PAID_BETA_MANUAL_QA_DEVICE_PROFILES,
  browserProfiles: PAID_BETA_MANUAL_QA_BROWSER_PROFILES,
  scenarios: PAID_BETA_MANUAL_QA_SCENARIOS,
  stopConditions: PAID_BETA_MANUAL_QA_STOP_CONDITIONS,
  nextStep: PAID_BETA_MANUAL_QA_NEXT_STEP
} as const satisfies PaidBetaManualQaContract;

export function getPaidBetaManualQaScenario(id: string) {
  return PAID_BETA_MANUAL_QA_SCENARIOS.find((scenario) => scenario.id === id);
}

export function getPaidBetaManualQaRouteTarget(path: string) {
  return PAID_BETA_MANUAL_QA_ROUTE_TARGETS.find(
    (routeTarget) => routeTarget.path === path
  );
}

export function getPaidBetaManualQaStorageProbe(key: string) {
  return PAID_BETA_MANUAL_QA_STORAGE_PROBES.find((probe) => probe.key === key);
}

export function getPaidBetaManualQaConsoleProbe(id: string) {
  return PAID_BETA_MANUAL_QA_CONSOLE_PROBES.find((probe) => probe.id === id);
}

export function getPaidBetaManualQaStopCondition(id: string) {
  return PAID_BETA_MANUAL_QA_STOP_CONDITIONS.find(
    (condition) => condition.id === id
  );
}
