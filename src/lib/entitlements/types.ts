export const UNLIMITED = "unlimited" as const;

export type PlanId = "guest" | "free" | "lite" | "pro" | "educator";
export type AccountState = PlanId;
export type PricingVisiblePlanId = Extract<PlanId, "free" | "lite" | "pro">;
export type PaidConsumerPlanId = Extract<PlanId, "lite" | "pro">;
export type PromotionId = "welcome_ai_demo";
export const LIFECYCLE_STATES = [
  "active",
  "canceled_at_period_end",
  "past_due_grace",
  "expired",
  "refunded_or_chargeback"
] as const;

export type EntitlementLifecycleState = (typeof LIFECYCLE_STATES)[number];
export type AdditiveProductId =
  | "exam_pack_academic"
  | "exam_pack_ielts"
  | "exam_pack_gre"
  | "exam_pack_bundle";
export type PackEntitlement =
  | "pack:academic"
  | "pack:ielts-writing"
  | "pack:gre-verbal";

export const CAPABILITIES = [
  "ads.public_page_units",
  "ads.app_native_slots",
  "assets.watermarked",
  "assets.clean_standard",
  "assets.clean_hd",
  "downloads.standard",
  "downloads.hd",
  "downloads.batch",
  "learning.save_words",
  "learning.account_sync",
  "learning.local_only_storage",
  "learning.daily_review",
  "learning.due_queue_sample",
  "learning.due_queue_top_10",
  "learning.due_queue_full",
  "learning.due_queue_advanced_priority",
  "learning.history",
  "learning.custom_decks",
  "srs.sample",
  "srs.basic_5_box",
  "srs.full_5_box",
  "srs.advanced_priority",
  "srs.weak_words_preview",
  "srs.weak_words_full",
  "srs.weak_sprint",
  "srs.mastery_test",
  "question.image_to_word",
  "question.definition_to_word",
  "question.word_to_image",
  "question.cloze",
  "question.confusable_pair",
  "question.weak_sprint",
  "question.mastery_test",
  "packs.public_preview",
  "packs.starter",
  "packs.standard_hubs",
  "packs.all_hubs",
  "packs.purchased_exam_access",
  "packs.all_exam_access",
  "pack:academic",
  "pack:ielts-writing",
  "pack:gre-verbal",
  "ai.static_approved_feedback",
  "ai.monthly_personalized_mistake_explanations",
  "ai.monthly_confusion_resolver",
  "ai.monthly_memory_hooks",
  "ai.daily_coach",
  "ai.promotional_mistake_explanation_credits",
  "support.self_service",
  "support.standard",
  "support.priority",
  "classroom.seats",
  "classroom.class_decks",
  "classroom.assignments",
  "classroom.student_progress",
  "classroom.csv_roster",
  "classroom.printable_answer_keys"
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const LIMIT_KEYS = [
  "downloads.monthly_total",
  "downloads.standard_monthly",
  "downloads.hd_monthly",
  "downloads.max_long_edge_px",
  "downloads.batch_size",
  "learning.saved_words",
  "learning.daily_review_cards",
  "learning.history_days",
  "learning.custom_decks",
  "packs.exam_preview_cards",
  "ai.personalized_mistake_explanations_monthly",
  "ai.confusion_resolver_monthly",
  "ai.memory_hooks_monthly",
  "ai.daily_coach_per_day",
  "ai.personalized_mistake_explanation_lifetime_credits",
  "classroom.seats"
] as const;

export type LimitKey = (typeof LIMIT_KEYS)[number];
export type LimitValue = number | typeof UNLIMITED;
export type CapabilityRecord = Readonly<Record<Capability, boolean>>;
export type LimitRecord = Readonly<Record<LimitKey, LimitValue>>;

export type CurrencyCode = "KRW" | "USD";
export type MoneyPrice = {
  monthly: number | null;
  annual: number | null;
};

export type AssetVariant = "watermarked" | "clean_standard" | "clean_hd";
export type LicenseScope =
  | "view_only"
  | "personal_noncommercial"
  | "personal_and_internal_noncommercial_asset_policy_applies"
  | "classroom_distribution_subject_to_asset_policy";

export type CanonicalStandardPlanEntitlements = {
  ads: {
    public_page_units_max: number;
    app_native_slots_max: number;
    review_session: boolean;
  };
  assets: {
    display_variant: AssetVariant;
    clean_asset_url_exposed: boolean;
  };
  downloads: {
    enabled: boolean;
    monthly_total: number;
    standard_monthly?: number;
    hd_monthly?: number;
    max_long_edge_px: number;
    formats: readonly string[];
    batch_size?: number;
  };
  learning: {
    saved_words_limit: number | null;
    storage_scope: "local_only" | "account_sync";
    daily_review_cards: number | null;
    due_queue: "sample" | "top_10" | "full" | "full_advanced_priority";
    history_days: number | null;
    custom_decks: number | null;
  };
  srs: {
    enabled: "sample" | "basic_5_box" | "full_5_box" | "full_5_box_advanced_priority";
    weak_words: "none" | "top_3_preview" | "full_list_basic_review" | "full_list_advanced";
    weak_sprint: boolean;
    mastery_test: boolean;
  };
  question_types: readonly string[];
  packs: {
    hub_access: "public_preview" | "starter" | "all_standard_hubs" | "all";
    exam_preview_cards: number | null;
    exam_access: "none" | "purchased_only" | "all_while_active";
  };
  ai: {
    static_approved_feedback: boolean;
    personalized_mistake_explanations_monthly: number;
    confusion_resolver_monthly: number;
    memory_hooks_monthly: number;
    daily_coach_per_day: number;
  };
  support: "self_service" | "standard" | "priority";
  license_scope: LicenseScope;
};

export type CanonicalEducatorEntitlements = {
  inherits: "pro";
  classroom_seats: number;
  downloads_monthly: number;
  class_decks: boolean;
  assignments: boolean;
  student_progress: boolean;
  csv_roster: boolean;
  printable_answer_keys: boolean;
  license_scope: LicenseScope;
};

export type CanonicalPlanEntitlements =
  | CanonicalStandardPlanEntitlements
  | CanonicalEducatorEntitlements;

export type CanonicalPlanDefinition = {
  name: string;
  is_public_plan: boolean;
  price: Record<CurrencyCode, MoneyPrice>;
  positioning: string;
  entitlements: CanonicalPlanEntitlements;
};

export type CanonicalAdditiveProduct = {
  type: "one_time_pack";
  price_KRW: number;
  price_USD: number;
  entitlement?: PackEntitlement;
  entitlements?: readonly PackEntitlement[];
  updates_months: number;
};

export type CanonicalPromotion = {
  applies_to: readonly AccountState[];
  grant: {
    personalized_mistake_explanation_credits: number;
  };
  period: "lifetime_once_per_account";
  pricing_table_visible: boolean;
  note: string;
};

export type CanonicalPlanEntitlementsDocument = {
  version: string;
  effective_from: string;
  currency_display: Record<CurrencyCode, string>;
  pricing_page_visible_plans: readonly PricingVisiblePlanId[];
  account_states: readonly AccountState[];
  inheritance_order: readonly Exclude<PlanId, "educator">[];
  plans: Record<PlanId, CanonicalPlanDefinition>;
  additive_products: Record<AdditiveProductId, CanonicalAdditiveProduct>;
  promotions: Record<PromotionId, CanonicalPromotion>;
  resolution: {
    formula: "base_plan + active_one_time_purchases + active_promotions + audited_manual_grants";
    server_authoritative: boolean;
    client_plan_state_trusted: boolean;
    manual_grants_require: readonly string[];
  };
  lifecycle: Record<string, unknown>;
  asset_policy: {
    commercial_rights_are_not_implied_by_watermark_removal: boolean;
    per_asset_rights_field_required: boolean;
    fields: readonly string[];
  };
};

export type NormalizedPlanDefinition = {
  id: PlanId;
  name: string;
  publicPricingCard: boolean;
  positioning: string;
  price: Record<CurrencyCode, MoneyPrice>;
  capabilities: CapabilityRecord;
  limits: LimitRecord;
  licenseScope: LicenseScope;
};

export type OneTimePurchaseGrant = {
  grantId: string;
  productId: AdditiveProductId;
  purchasedAt: string;
  expiresAt?: string | null;
};

export type PromotionGrant = {
  grantId: string;
  promotionId: PromotionId;
  issuedAt: string;
  expiresAt?: string | null;
};

export type ManualGrant = {
  grantId: string;
  reason: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  auditId: string;
  capabilities?: readonly Capability[];
  limits?: Readonly<Partial<Record<LimitKey, LimitValue>>>;
  packEntitlements?: readonly PackEntitlement[];
};

export type UsageSnapshot = Readonly<Partial<Record<LimitKey, number>>>;

export type EntitlementLifecycleInput = {
  state: EntitlementLifecycleState;
  currentPeriodEnd?: string | null;
  graceStartedAt?: string | null;
  graceEndsAt?: string | null;
  verifiedAt?: string | null;
};

export type EntitlementLifecycleDecision = {
  state: EntitlementLifecycleState;
  effectiveBasePlanId: PlanId;
  fullPlanEntitlements: boolean;
  cleanDownloadsAllowed: boolean;
  newAiCallsAllowed: boolean;
  paidProviderGrantsAllowed: boolean;
  supportReviewRequired: boolean;
  policy:
    | "full_plan_entitlements"
    | "full_plan_entitlements_until_current_period_end"
    | "past_due_grace_learning_only"
    | "expired_fallback_to_free"
    | "refunded_or_chargeback_revoke_paid_grants";
  learningDataPolicy: {
    preserve: true;
    mutation: "none_policy_only";
  };
};

export type ResolveEffectiveEntitlementsInput = {
  accountState: AccountState;
  evaluatedAt: string;
  lifecycle?: EntitlementLifecycleInput;
  oneTimePurchases?: readonly OneTimePurchaseGrant[];
  promotions?: readonly PromotionGrant[];
  manualGrants?: readonly ManualGrant[];
};

export type ActiveGrantSummary = {
  source: "one_time_purchase" | "promotion" | "manual";
  grantId: string;
  expiresAt: string | null;
};

export type EffectiveEntitlements = {
  accountState: AccountState;
  planId: PlanId;
  evaluatedAt: string;
  lifecycle: EntitlementLifecycleDecision;
  pricingVisiblePlans: readonly PricingVisiblePlanId[];
  capabilities: CapabilityRecord;
  limits: LimitRecord;
  purchasedPacks: readonly PackEntitlement[];
  activeGrants: readonly ActiveGrantSummary[];
  ignoredGrantIds: readonly string[];
  sources: readonly string[];
  assetPolicy: {
    commercialRightsAreNotImpliedByWatermarkRemoval: boolean;
    perAssetRightsFieldRequired: boolean;
  };
  resolutionFormula: CanonicalPlanEntitlementsDocument["resolution"]["formula"];
};

export const VLX_PLAN_STATE_STORAGE_KEY = "vlx_plan_state_v1" as const;
export const VLX_DEFAULT_PLAN_ID = "guest" as const;

export type VlxPlanId = Exclude<PlanId, "educator">;
export type VlxPlanLimit = LimitValue;
export type VlxPlaceholderFeature = "none" | "placeholder";

export type VlxPlanFeatureLimits = {
  localOnlyState: boolean;
  sampleCardLimit?: number;
  savedWordsLimit: VlxPlanLimit;
  dailyReviewLimit: VlxPlanLimit;
  accountSync: boolean;
  starterDecks: "sample" | "basic" | "full";
  dueQueue: "sample" | "full";
  weakWords: boolean;
  noAdsMarker: boolean;
  examPacks: boolean;
  weakSprint: boolean;
  mistakeExplanation: VlxPlaceholderFeature;
  progressHistory: VlxPlaceholderFeature;
};

export type VlxPlanDefinition = {
  id: VlxPlanId;
  label: string;
  priceLabel: string;
  summary: string;
  outcome: string;
  availabilityNote: string;
  featureBullets: readonly string[];
  limits: VlxPlanFeatureLimits;
};

export type VlxLocalPlanState = {
  plan: VlxPlanId;
  source: "local";
  updatedAt?: string;
};

export type VlxResolvedEntitlement = {
  state: VlxLocalPlanState;
  plan: VlxPlanDefinition;
  storageKey: typeof VLX_PLAN_STATE_STORAGE_KEY;
  isDefault: boolean;
  isPaidPreview: boolean;
};
