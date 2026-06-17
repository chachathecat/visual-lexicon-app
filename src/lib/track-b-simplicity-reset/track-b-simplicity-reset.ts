export const TRACK_B_SIMPLICITY_RESET_VERSION = 1 as const;

export const TRACK_B_SIMPLIFIED_MENTAL_MODEL = [
  "Today",
  "Save",
  "Review",
  "Queue",
  "Upgrade interest"
] as const;

export const TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES = [
  "/save",
  "/dashboard",
  "/review",
  "/saved",
  "/pricing"
] as const;

export const TRACK_B_SIMPLICITY_CORE_LOOP = [
  "Save",
  "Review",
  "Memory state",
  "Return tomorrow"
] as const;

export const TRACK_B_SIMPLICITY_CONFIDENCE_VALUES = [
  "knew",
  "guessed",
  "forgot"
] as const;

export type TrackBSimplicityResetVersion =
  typeof TRACK_B_SIMPLICITY_RESET_VERSION;

export type TrackBSimplifiedMentalModel =
  (typeof TRACK_B_SIMPLIFIED_MENTAL_MODEL)[number];

export type TrackBSimplicityApprovedV0Route =
  (typeof TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES)[number];

export type TrackBSimplicityCoreLoop =
  (typeof TRACK_B_SIMPLICITY_CORE_LOOP)[number];

export type TrackBSimplicityConfidenceValue =
  (typeof TRACK_B_SIMPLICITY_CONFIDENCE_VALUES)[number];

export type TrackBSimplicityDeferredFeature = {
  id:
    | "review_weak"
    | "weak_sprint"
    | "packs"
    | "pack_detail"
    | "ai_tutor"
    | "mastery_test"
    | "no_watermark_export"
    | "real_checkout"
    | "external_participant_beta_validation";
  label: string;
  surface: string;
  category: "route" | "feature" | "validation";
  status: "de-emphasized" | "deferred";
  reason: string;
};

export type TrackBSimplicityDashboardV0Rules = {
  dominantCtaRules: readonly ["Review 5 words before you forget"];
  supportingStats: readonly ["Due", "Weak", "New", "Reviewed this week"];
  noisyParallelActionGridAllowed: false;
  todayFirst: true;
};

export type TrackBSimplicitySaveV0Rules = {
  afterSaveMessage: "This word is now in your review queue.";
  primaryCta: "Review now";
  secondaryCta: "Go to dashboard";
  savedBecomesReviewItem: true;
  bookmarksFramingAllowed: false;
};

export type TrackBSimplicityReviewV0Rules = {
  flow: readonly [
    "one card",
    "one question",
    "answer",
    "confidence",
    "feedback",
    "next card",
    "summary"
  ];
  confidenceValues: typeof TRACK_B_SIMPLICITY_CONFIDENCE_VALUES;
  memoryStateUpdateRequired: true;
  eventWriteRequired: true;
  extraNavNoiseAllowed: false;
};

export type TrackBSimplicitySavedV0Rules = {
  definition: "Saved is a review queue, not bookmarks.";
  savedIsReviewQueue: true;
  savedIsBookmarks: false;
  tabsAndFiltersRole: "secondary";
};

export type TrackBSimplicityPricingV0Rules = {
  upgradeInterestOnly: true;
  realCheckout: false;
  fakePaidAccess: false;
  litePlanOutcome: "daily memory habit";
  proPlanOutcome: "weak-word repair and exam prep";
};

export type TrackBSimplicityNextPr = {
  prNumber: 94 | 95 | 96 | 97 | 98 | 99;
  title: string;
  purpose: string;
  runtimeUiChangesExpected: boolean;
};

export type TrackBSimplicityForbiddenTouchpoint = {
  id:
    | "webflow"
    | "cloudflare_workers"
    | "vercel_settings"
    | "dns"
    | "deployment_settings"
    | "billing"
    | "payment"
    | "checkout"
    | "subscription"
    | "auth_runtime"
    | "provider_sdks"
    | "secrets"
    | "env_vars"
    | "production_data"
    | "api_routes"
    | "route_handlers"
    | "middleware"
    | "npm_audit_fix";
  label: string;
  allowedInThisPr: false;
};

export type TrackBSimplicityReset = {
  version: TrackBSimplicityResetVersion;
  repository: "chachathecat/visual-lexicon-app";
  branch: "release/track-b-simplicity-reset";
  pullRequest: "#93 Track B simplicity reset";
  scope: "Track B docs/contracts/tests-only simplicity reset";
  northStar: "Weekly Reviewed Words";
  coreProductIdentity: "Visual Lexicon turns difficult words users meet online into visual memory cards, then reviews them before they forget.";
  coreLoop: typeof TRACK_B_SIMPLICITY_CORE_LOOP;
  simplifiedMentalModel: typeof TRACK_B_SIMPLIFIED_MENTAL_MODEL;
  approvedV0Routes: typeof TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES;
  deferredFeatures: readonly TrackBSimplicityDeferredFeature[];
  dashboardV0Rules: TrackBSimplicityDashboardV0Rules;
  saveV0Rules: TrackBSimplicitySaveV0Rules;
  reviewV0Rules: TrackBSimplicityReviewV0Rules;
  savedV0Rules: TrackBSimplicitySavedV0Rules;
  pricingV0Rules: TrackBSimplicityPricingV0Rules;
  explicitNonGoals: readonly string[];
  nextSimplicityPRSequence: readonly TrackBSimplicityNextPr[];
  publicPaidBetaStatus: "no-go";
  publicPaidBetaLabel: "No-Go";
  privateBetaStatus: "owner-controlled/manual-only/conditional";
  externalParticipantValidationStatus: "not-started";
  externalParticipantValidationLabel: "Not Started";
  runtimeUiChanges: false;
  realCheckout: false;
  fakePaidAccess: false;
  fakeMastery: false;
  agentModeLocalhostDependency: false;
  forbiddenTouchpoints: readonly TrackBSimplicityForbiddenTouchpoint[];
};

export const TRACK_B_SIMPLICITY_DEFERRED_FEATURES = [
  {
    id: "review_weak",
    label: "weak review",
    surface: "/review/weak",
    category: "route",
    status: "de-emphasized",
    reason:
      "Weak-word repair remains important but should not split the v0 learner mental model."
  },
  {
    id: "weak_sprint",
    label: "weak sprint",
    surface: "/review/weak-sprint",
    category: "route",
    status: "de-emphasized",
    reason:
      "Weak sprint should wait until the focused review loop is simpler."
  },
  {
    id: "packs",
    label: "packs",
    surface: "/packs",
    category: "route",
    status: "deferred",
    reason:
      "Packs should not compete with Today, Save, Review, Queue, and Upgrade interest in v0."
  },
  {
    id: "pack_detail",
    label: "pack detail",
    surface: "/packs/[packId]",
    category: "route",
    status: "deferred",
    reason:
      "Pack detail needs a separate course-path simplification after the core loop is calm."
  },
  {
    id: "ai_tutor",
    label: "AI Tutor",
    surface: "AI Tutor",
    category: "feature",
    status: "deferred",
    reason:
      "AI explanation should come after the SRS loop works and wrong-answer records are stable."
  },
  {
    id: "mastery_test",
    label: "Mastery Test",
    surface: "Mastery Test",
    category: "feature",
    status: "deferred",
    reason:
      "Mastery cannot be faked and should not be promoted before delayed recall is proven."
  },
  {
    id: "no_watermark_export",
    label: "no-watermark export",
    surface: "no-watermark export",
    category: "feature",
    status: "deferred",
    reason:
      "Export value should not distract from repeat review behavior in v0."
  },
  {
    id: "real_checkout",
    label: "real checkout",
    surface: "real checkout",
    category: "feature",
    status: "deferred",
    reason:
      "Pricing can collect upgrade interest only; checkout requires a separate approved billing path."
  },
  {
    id: "external_participant_beta_validation",
    label: "external participant beta validation",
    surface: "external participant beta validation",
    category: "validation",
    status: "deferred",
    reason:
      "This reset must not claim external participant validation has happened."
  }
] as const satisfies readonly TrackBSimplicityDeferredFeature[];

export const TRACK_B_SIMPLICITY_DASHBOARD_V0_RULES = {
  dominantCtaRules: ["Review 5 words before you forget"],
  supportingStats: ["Due", "Weak", "New", "Reviewed this week"],
  noisyParallelActionGridAllowed: false,
  todayFirst: true
} as const satisfies TrackBSimplicityDashboardV0Rules;

export const TRACK_B_SIMPLICITY_SAVE_V0_RULES = {
  afterSaveMessage: "This word is now in your review queue.",
  primaryCta: "Review now",
  secondaryCta: "Go to dashboard",
  savedBecomesReviewItem: true,
  bookmarksFramingAllowed: false
} as const satisfies TrackBSimplicitySaveV0Rules;

export const TRACK_B_SIMPLICITY_REVIEW_V0_RULES = {
  flow: [
    "one card",
    "one question",
    "answer",
    "confidence",
    "feedback",
    "next card",
    "summary"
  ],
  confidenceValues: TRACK_B_SIMPLICITY_CONFIDENCE_VALUES,
  memoryStateUpdateRequired: true,
  eventWriteRequired: true,
  extraNavNoiseAllowed: false
} as const satisfies TrackBSimplicityReviewV0Rules;

export const TRACK_B_SIMPLICITY_SAVED_V0_RULES = {
  definition: "Saved is a review queue, not bookmarks.",
  savedIsReviewQueue: true,
  savedIsBookmarks: false,
  tabsAndFiltersRole: "secondary"
} as const satisfies TrackBSimplicitySavedV0Rules;

export const TRACK_B_SIMPLICITY_PRICING_V0_RULES = {
  upgradeInterestOnly: true,
  realCheckout: false,
  fakePaidAccess: false,
  litePlanOutcome: "daily memory habit",
  proPlanOutcome: "weak-word repair and exam prep"
} as const satisfies TrackBSimplicityPricingV0Rules;

export const TRACK_B_SIMPLICITY_EXPLICIT_NON_GOALS = [
  "no external beta claim",
  "no payment intent claim",
  "no retention claim",
  "no agent-mode localhost test dependency",
  "no new AI feature",
  "no runtime UI implementation",
  "no production integration change"
] as const;

export const TRACK_B_SIMPLICITY_NEXT_PR_SEQUENCE = [
  {
    prNumber: 94,
    title: "Dashboard v0 simplification",
    purpose:
      "Make Today the first surface with one dominant review CTA and four honest stats.",
    runtimeUiChangesExpected: true
  },
  {
    prNumber: 95,
    title: "Save result page simplification",
    purpose:
      "Make saved words clearly become review queue items with Review now as the primary action.",
    runtimeUiChangesExpected: true
  },
  {
    prNumber: 96,
    title: "Review session focus pass",
    purpose:
      "Focus the answer loop on one card, confidence, feedback, memory-state update, and summary.",
    runtimeUiChangesExpected: true
  },
  {
    prNumber: 97,
    title: "Saved queue simplification",
    purpose:
      "Reframe Saved as a review queue instead of a bookmark library.",
    runtimeUiChangesExpected: true
  },
  {
    prNumber: 98,
    title: "Pricing interest simplification",
    purpose:
      "Keep pricing interest-only while clarifying Lite and Pro learning outcomes.",
    runtimeUiChangesExpected: true
  },
  {
    prNumber: 99,
    title: "Owner local smoke after simplification",
    purpose:
      "Record owner-run local smoke evidence after the simplification sequence.",
    runtimeUiChangesExpected: false
  }
] as const satisfies readonly TrackBSimplicityNextPr[];

export const TRACK_B_SIMPLICITY_FORBIDDEN_TOUCHPOINTS = [
  {
    id: "webflow",
    label: "Webflow",
    allowedInThisPr: false
  },
  {
    id: "cloudflare_workers",
    label: "Cloudflare Workers",
    allowedInThisPr: false
  },
  {
    id: "vercel_settings",
    label: "Vercel settings",
    allowedInThisPr: false
  },
  {
    id: "dns",
    label: "DNS",
    allowedInThisPr: false
  },
  {
    id: "deployment_settings",
    label: "deployment settings",
    allowedInThisPr: false
  },
  {
    id: "billing",
    label: "billing",
    allowedInThisPr: false
  },
  {
    id: "payment",
    label: "payment",
    allowedInThisPr: false
  },
  {
    id: "checkout",
    label: "checkout",
    allowedInThisPr: false
  },
  {
    id: "subscription",
    label: "subscription",
    allowedInThisPr: false
  },
  {
    id: "auth_runtime",
    label: "auth runtime",
    allowedInThisPr: false
  },
  {
    id: "provider_sdks",
    label: "provider SDKs",
    allowedInThisPr: false
  },
  {
    id: "secrets",
    label: "secrets",
    allowedInThisPr: false
  },
  {
    id: "env_vars",
    label: "env vars",
    allowedInThisPr: false
  },
  {
    id: "production_data",
    label: "production data",
    allowedInThisPr: false
  },
  {
    id: "api_routes",
    label: "API routes",
    allowedInThisPr: false
  },
  {
    id: "route_handlers",
    label: "route handlers",
    allowedInThisPr: false
  },
  {
    id: "middleware",
    label: "middleware",
    allowedInThisPr: false
  },
  {
    id: "npm_audit_fix",
    label: "npm audit fix",
    allowedInThisPr: false
  }
] as const satisfies readonly TrackBSimplicityForbiddenTouchpoint[];

export const TRACK_B_SIMPLICITY_RESET = {
  version: TRACK_B_SIMPLICITY_RESET_VERSION,
  repository: "chachathecat/visual-lexicon-app",
  branch: "release/track-b-simplicity-reset",
  pullRequest: "#93 Track B simplicity reset",
  scope: "Track B docs/contracts/tests-only simplicity reset",
  northStar: "Weekly Reviewed Words",
  coreProductIdentity:
    "Visual Lexicon turns difficult words users meet online into visual memory cards, then reviews them before they forget.",
  coreLoop: TRACK_B_SIMPLICITY_CORE_LOOP,
  simplifiedMentalModel: TRACK_B_SIMPLIFIED_MENTAL_MODEL,
  approvedV0Routes: TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES,
  deferredFeatures: TRACK_B_SIMPLICITY_DEFERRED_FEATURES,
  dashboardV0Rules: TRACK_B_SIMPLICITY_DASHBOARD_V0_RULES,
  saveV0Rules: TRACK_B_SIMPLICITY_SAVE_V0_RULES,
  reviewV0Rules: TRACK_B_SIMPLICITY_REVIEW_V0_RULES,
  savedV0Rules: TRACK_B_SIMPLICITY_SAVED_V0_RULES,
  pricingV0Rules: TRACK_B_SIMPLICITY_PRICING_V0_RULES,
  explicitNonGoals: TRACK_B_SIMPLICITY_EXPLICIT_NON_GOALS,
  nextSimplicityPRSequence: TRACK_B_SIMPLICITY_NEXT_PR_SEQUENCE,
  publicPaidBetaStatus: "no-go",
  publicPaidBetaLabel: "No-Go",
  privateBetaStatus: "owner-controlled/manual-only/conditional",
  externalParticipantValidationStatus: "not-started",
  externalParticipantValidationLabel: "Not Started",
  runtimeUiChanges: false,
  realCheckout: false,
  fakePaidAccess: false,
  fakeMastery: false,
  agentModeLocalhostDependency: false,
  forbiddenTouchpoints: TRACK_B_SIMPLICITY_FORBIDDEN_TOUCHPOINTS
} as const satisfies TrackBSimplicityReset;

export function getTrackBSimplicityReset() {
  return TRACK_B_SIMPLICITY_RESET;
}

export function getSimplifiedMentalModel() {
  return TRACK_B_SIMPLIFIED_MENTAL_MODEL;
}

export function getApprovedV0Routes() {
  return TRACK_B_SIMPLICITY_APPROVED_V0_ROUTES;
}

export function getDeferredFeatures() {
  return TRACK_B_SIMPLICITY_DEFERRED_FEATURES;
}

export function getDashboardV0Rules() {
  return TRACK_B_SIMPLICITY_DASHBOARD_V0_RULES;
}

export function getSaveV0Rules() {
  return TRACK_B_SIMPLICITY_SAVE_V0_RULES;
}

export function getReviewV0Rules() {
  return TRACK_B_SIMPLICITY_REVIEW_V0_RULES;
}

export function getSavedV0Rules() {
  return TRACK_B_SIMPLICITY_SAVED_V0_RULES;
}

export function getPricingV0Rules() {
  return TRACK_B_SIMPLICITY_PRICING_V0_RULES;
}

export function getNextSimplicityPRSequence() {
  return TRACK_B_SIMPLICITY_NEXT_PR_SEQUENCE;
}
