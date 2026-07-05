export const VISUAL_LEXICON_WORLD_CLASS_PRODUCT_QUALITY_BAR_VERSION =
  "1.0.0" as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR =
  "Weekly Reviewed Words" as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA =
  "Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit" as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_PUBLIC_PAID_BETA_VERDICT =
  "no_go" as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_PRIVATE_MANUAL_BETA_VERDICT =
  "gate_review_required" as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS = [
  "vlx_save_word_click",
  "vlx_quiz_start",
  "vlx_quiz_answer",
  "vlx_quiz_complete",
  "vlx_review_state_update",
  "vlx_due_review_start",
  "vlx_weak_review_start",
  "vlx_pack_preview_start",
  "vlx_pack_preview_complete",
  "vlx_paywall_view",
  "vlx_upgrade_click"
] as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_ACCESSIBILITY_REQUIREMENTS = [
  "Keyboard navigation reaches every meaningful control.",
  "Visible focus state is present for interactive controls.",
  "Semantic labels describe buttons, links, form fields, cards, review feedback, and navigation landmarks.",
  "Screen reader status messages announce review answer feedback, save state, queue completion, errors, and async changes.",
  "Reduced motion is respected for animated transitions and progress feedback.",
  "Mobile one-hand review usability supports answer selection, confidence marking, and next-card movement.",
  "No keyboard trap exists in menus, dialogs, review cards, or paywall surfaces."
] as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_PERFORMANCE_BUDGETS = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1
} as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_P0_BLOCKER_DEFINITIONS = [
  "Broken Save -> Review item: save does not create or preserve review state.",
  "Broken review state/events: review answers do not create events and update memory state.",
  "Fake Due/Weak/Mastered: learning status is fabricated or not derived from review evidence.",
  "Fake mastery: mastered appears without delayed recall evidence.",
  "Fake weak evidence: Weak Sprint uses anything other than real weak review evidence.",
  "Fake pack progress: pack progress is fabricated or detached from preview, completion, and review evidence.",
  "Payment/checkout/billing route appears without explicit owner approval.",
  "Fake paid entitlement appears before real entitlement is authorized and implemented.",
  "Public paid beta unblock appears while public paid beta remains No-Go."
] as const;

export const WORLD_CLASS_PRODUCT_QUALITY_BAR_RECOMMENDED_NEXT_SEQUENCE = [
  "Dashboard v3 Today Memory Mission",
  "Review Session v3 Focus Mode",
  "Saved Library v3 Memory Queue",
  "Packs v3 30-Day Plan Surface",
  "Pricing / Paywall v3 Outcome Copy",
  "Accessibility and Performance Release Gate",
  "Analytics Learning Funnel Dashboard"
] as const;

export type WorldClassProductQualityBarPublicPaidBetaVerdict =
  typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_PUBLIC_PAID_BETA_VERDICT;

export type WorldClassProductQualityBarPrivateManualBetaVerdict =
  typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_PRIVATE_MANUAL_BETA_VERDICT;

export type WorldClassProductQualityBarAnalyticsEvent =
  (typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS)[number];

export type WorldClassProductQualityBarReport = {
  version: typeof VISUAL_LEXICON_WORLD_CLASS_PRODUCT_QUALITY_BAR_VERSION;
  northStar: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR;
  productFormula: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA;
  verdicts: {
    publicPaidBeta: WorldClassProductQualityBarPublicPaidBetaVerdict;
    privateManualBeta: WorldClassProductQualityBarPrivateManualBetaVerdict;
  };
  analyticsEvents: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS;
  accessibilityRequirements: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_ACCESSIBILITY_REQUIREMENTS;
  performanceBudgets: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_PERFORMANCE_BUDGETS;
  p0Blockers: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_P0_BLOCKER_DEFINITIONS;
  recommendedNextSequence: typeof WORLD_CLASS_PRODUCT_QUALITY_BAR_RECOMMENDED_NEXT_SEQUENCE;
  safety: {
    realPaymentEnabled: false;
    checkoutEnabled: false;
    paymentSdkEnabled: false;
    realPaidEntitlementEnabled: false;
    publicPaidBetaUnblocked: false;
  };
};

export function getWorldClassProductQualityBar(): WorldClassProductQualityBarReport {
  return {
    version: VISUAL_LEXICON_WORLD_CLASS_PRODUCT_QUALITY_BAR_VERSION,
    northStar: WORLD_CLASS_PRODUCT_QUALITY_BAR_NORTH_STAR,
    productFormula: WORLD_CLASS_PRODUCT_QUALITY_BAR_PRODUCT_FORMULA,
    verdicts: {
      publicPaidBeta: WORLD_CLASS_PRODUCT_QUALITY_BAR_PUBLIC_PAID_BETA_VERDICT,
      privateManualBeta:
        WORLD_CLASS_PRODUCT_QUALITY_BAR_PRIVATE_MANUAL_BETA_VERDICT
    },
    analyticsEvents: WORLD_CLASS_PRODUCT_QUALITY_BAR_REQUIRED_ANALYTICS_EVENTS,
    accessibilityRequirements:
      WORLD_CLASS_PRODUCT_QUALITY_BAR_ACCESSIBILITY_REQUIREMENTS,
    performanceBudgets: WORLD_CLASS_PRODUCT_QUALITY_BAR_PERFORMANCE_BUDGETS,
    p0Blockers: WORLD_CLASS_PRODUCT_QUALITY_BAR_P0_BLOCKER_DEFINITIONS,
    recommendedNextSequence:
      WORLD_CLASS_PRODUCT_QUALITY_BAR_RECOMMENDED_NEXT_SEQUENCE,
    safety: {
      realPaymentEnabled: false,
      checkoutEnabled: false,
      paymentSdkEnabled: false,
      realPaidEntitlementEnabled: false,
      publicPaidBetaUnblocked: false
    }
  };
}

export function getWorldClassProductQualityBarP0Blockers() {
  return WORLD_CLASS_PRODUCT_QUALITY_BAR_P0_BLOCKER_DEFINITIONS;
}

export function getWorldClassProductQualityBarNextSequence() {
  return WORLD_CLASS_PRODUCT_QUALITY_BAR_RECOMMENDED_NEXT_SEQUENCE;
}
