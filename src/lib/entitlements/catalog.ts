import canonicalCatalogJson from "../../../docs/monetization/v1/vlx-plan-entitlements.v1.json";

import {
  CAPABILITIES,
  LIMIT_KEYS,
  UNLIMITED,
  type AdditiveProductId,
  type CanonicalEducatorEntitlements,
  type CanonicalPlanEntitlementsDocument,
  type CanonicalStandardPlanEntitlements,
  type Capability,
  type CapabilityRecord,
  type EntitlementLifecycleState,
  type LimitKey,
  type LimitRecord,
  type LimitValue,
  type NormalizedPlanDefinition,
  type PackEntitlement,
  type PlanId,
  type PricingVisiblePlanId
} from "@/lib/entitlements/types";

export const CANONICAL_ENTITLEMENT_CATALOG =
  canonicalCatalogJson as CanonicalPlanEntitlementsDocument;

export const ENTITLEMENT_RESOLUTION_FORMULA =
  CANONICAL_ENTITLEMENT_CATALOG.resolution.formula;

export const ACCOUNT_STATES =
  CANONICAL_ENTITLEMENT_CATALOG.account_states as readonly PlanId[];

export const PRICING_VISIBLE_PLANS =
  CANONICAL_ENTITLEMENT_CATALOG.pricing_page_visible_plans as readonly PricingVisiblePlanId[];

export const INHERITANCE_ORDER =
  CANONICAL_ENTITLEMENT_CATALOG.inheritance_order;

export const ENTITLEMENT_LIFECYCLE_POLICIES =
  CANONICAL_ENTITLEMENT_CATALOG.lifecycle as Readonly<
    Record<EntitlementLifecycleState, unknown>
  >;

export const ADDITIVE_PRODUCT_PACK_ENTITLEMENTS = Object.freeze(
  Object.fromEntries(
    Object.entries(CANONICAL_ENTITLEMENT_CATALOG.additive_products).map(
      ([productId, product]) => [
        productId,
        product.entitlements ?? (product.entitlement ? [product.entitlement] : [])
      ]
    )
  )
) as Readonly<Record<AdditiveProductId, readonly PackEntitlement[]>>;

export const WELCOME_AI_DEMO_CREDITS =
  CANONICAL_ENTITLEMENT_CATALOG.promotions.welcome_ai_demo.grant
    .personalized_mistake_explanation_credits;

function hasInheritedEntitlements(
  entitlements:
    | CanonicalStandardPlanEntitlements
    | CanonicalEducatorEntitlements
): entitlements is CanonicalEducatorEntitlements {
  return "inherits" in entitlements;
}

function createCapabilityRecord(defaultValue = false): Record<Capability, boolean> {
  return Object.fromEntries(
    CAPABILITIES.map((capability) => [capability, defaultValue])
  ) as Record<Capability, boolean>;
}

function createLimitRecord(defaultValue: LimitValue = 0): Record<LimitKey, LimitValue> {
  return Object.fromEntries(
    LIMIT_KEYS.map((limitKey) => [limitKey, defaultValue])
  ) as Record<LimitKey, LimitValue>;
}

function normalizeLimit(value: number | null | undefined): LimitValue {
  return value === null ? UNLIMITED : value ?? 0;
}

function isPositiveLimit(value: LimitValue): boolean {
  return value === UNLIMITED || value > 0;
}

function hasQuestionType(
  entitlements: CanonicalStandardPlanEntitlements,
  questionType: string
) {
  return entitlements.question_types.includes(questionType);
}

function normalizeStandardCapabilities(
  entitlements: CanonicalStandardPlanEntitlements
): CapabilityRecord {
  const capabilities = createCapabilityRecord();
  const savedWordsLimit = normalizeLimit(entitlements.learning.saved_words_limit);
  const dailyReviewLimit = normalizeLimit(entitlements.learning.daily_review_cards);
  const historyLimit = normalizeLimit(entitlements.learning.history_days);
  const customDeckLimit = normalizeLimit(entitlements.learning.custom_decks);

  capabilities["ads.public_page_units"] =
    entitlements.ads.public_page_units_max > 0;
  capabilities["ads.app_native_slots"] =
    entitlements.ads.app_native_slots_max > 0;
  capabilities["assets.watermarked"] =
    entitlements.assets.display_variant === "watermarked";
  capabilities["assets.clean_standard"] =
    entitlements.assets.display_variant === "clean_standard" ||
    entitlements.assets.display_variant === "clean_hd";
  capabilities["assets.clean_hd"] =
    entitlements.assets.display_variant === "clean_hd";
  capabilities["downloads.standard"] =
    entitlements.downloads.enabled &&
    (entitlements.downloads.monthly_total > 0 ||
      (entitlements.downloads.standard_monthly ?? 0) > 0);
  capabilities["downloads.hd"] =
    entitlements.downloads.enabled &&
    (entitlements.downloads.hd_monthly ?? 0) > 0;
  capabilities["downloads.batch"] =
    entitlements.downloads.enabled &&
    (entitlements.downloads.batch_size ?? 0) > 1;

  capabilities["learning.save_words"] = isPositiveLimit(savedWordsLimit);
  capabilities["learning.account_sync"] =
    entitlements.learning.storage_scope === "account_sync";
  capabilities["learning.local_only_storage"] =
    entitlements.learning.storage_scope === "local_only";
  capabilities["learning.daily_review"] = isPositiveLimit(dailyReviewLimit);
  capabilities["learning.history"] = isPositiveLimit(historyLimit);
  capabilities["learning.custom_decks"] = isPositiveLimit(customDeckLimit);

  const dueQueue = entitlements.learning.due_queue;
  capabilities["learning.due_queue_sample"] = true;
  capabilities["learning.due_queue_top_10"] =
    dueQueue === "top_10" ||
    dueQueue === "full" ||
    dueQueue === "full_advanced_priority";
  capabilities["learning.due_queue_full"] =
    dueQueue === "full" || dueQueue === "full_advanced_priority";
  capabilities["learning.due_queue_advanced_priority"] =
    dueQueue === "full_advanced_priority";

  const srsEnabled = entitlements.srs.enabled;
  capabilities["srs.sample"] = true;
  capabilities["srs.basic_5_box"] =
    srsEnabled === "basic_5_box" ||
    srsEnabled === "full_5_box" ||
    srsEnabled === "full_5_box_advanced_priority";
  capabilities["srs.full_5_box"] =
    srsEnabled === "full_5_box" ||
    srsEnabled === "full_5_box_advanced_priority";
  capabilities["srs.advanced_priority"] =
    srsEnabled === "full_5_box_advanced_priority";

  const weakWords = entitlements.srs.weak_words;
  capabilities["srs.weak_words_preview"] =
    weakWords === "top_3_preview" ||
    weakWords === "full_list_basic_review" ||
    weakWords === "full_list_advanced";
  capabilities["srs.weak_words_full"] =
    weakWords === "full_list_basic_review" ||
    weakWords === "full_list_advanced";
  capabilities["srs.weak_sprint"] = entitlements.srs.weak_sprint;
  capabilities["srs.mastery_test"] = entitlements.srs.mastery_test;

  capabilities["question.image_to_word"] = hasQuestionType(
    entitlements,
    "image_to_word"
  );
  capabilities["question.definition_to_word"] =
    hasQuestionType(entitlements, "definition_to_word") ||
    hasQuestionType(entitlements, "definition_to_word_demo");
  capabilities["question.word_to_image"] = hasQuestionType(
    entitlements,
    "word_to_image"
  );
  capabilities["question.cloze"] = hasQuestionType(entitlements, "cloze");
  capabilities["question.confusable_pair"] = hasQuestionType(
    entitlements,
    "confusable_pair"
  );
  capabilities["question.weak_sprint"] = hasQuestionType(
    entitlements,
    "weak_sprint"
  );
  capabilities["question.mastery_test"] = hasQuestionType(
    entitlements,
    "mastery_test"
  );

  const hubAccess = entitlements.packs.hub_access;
  capabilities["packs.public_preview"] = true;
  capabilities["packs.starter"] =
    hubAccess === "starter" ||
    hubAccess === "all_standard_hubs" ||
    hubAccess === "all";
  capabilities["packs.standard_hubs"] =
    hubAccess === "all_standard_hubs" || hubAccess === "all";
  capabilities["packs.all_hubs"] = hubAccess === "all";
  capabilities["packs.purchased_exam_access"] =
    entitlements.packs.exam_access === "purchased_only" ||
    entitlements.packs.exam_access === "all_while_active";
  capabilities["packs.all_exam_access"] =
    entitlements.packs.exam_access === "all_while_active";

  capabilities["ai.static_approved_feedback"] =
    entitlements.ai.static_approved_feedback;
  capabilities["ai.monthly_personalized_mistake_explanations"] =
    entitlements.ai.personalized_mistake_explanations_monthly > 0;
  capabilities["ai.monthly_confusion_resolver"] =
    entitlements.ai.confusion_resolver_monthly > 0;
  capabilities["ai.monthly_memory_hooks"] =
    entitlements.ai.memory_hooks_monthly > 0;
  capabilities["ai.daily_coach"] = entitlements.ai.daily_coach_per_day > 0;

  capabilities["support.self_service"] = true;
  capabilities["support.standard"] =
    entitlements.support === "standard" || entitlements.support === "priority";
  capabilities["support.priority"] = entitlements.support === "priority";

  return Object.freeze(capabilities);
}

function normalizeStandardLimits(
  entitlements: CanonicalStandardPlanEntitlements
): LimitRecord {
  const limits = createLimitRecord();

  limits["downloads.monthly_total"] = entitlements.downloads.monthly_total;
  limits["downloads.standard_monthly"] =
    entitlements.downloads.standard_monthly ?? entitlements.downloads.monthly_total;
  limits["downloads.hd_monthly"] = entitlements.downloads.hd_monthly ?? 0;
  limits["downloads.max_long_edge_px"] = entitlements.downloads.max_long_edge_px;
  limits["downloads.batch_size"] = entitlements.downloads.batch_size ?? 0;
  limits["learning.saved_words"] = normalizeLimit(
    entitlements.learning.saved_words_limit
  );
  limits["learning.daily_review_cards"] = normalizeLimit(
    entitlements.learning.daily_review_cards
  );
  limits["learning.history_days"] = normalizeLimit(
    entitlements.learning.history_days
  );
  limits["learning.custom_decks"] = normalizeLimit(
    entitlements.learning.custom_decks
  );
  limits["packs.exam_preview_cards"] = normalizeLimit(
    entitlements.packs.exam_preview_cards
  );
  limits["ai.personalized_mistake_explanations_monthly"] =
    entitlements.ai.personalized_mistake_explanations_monthly;
  limits["ai.confusion_resolver_monthly"] =
    entitlements.ai.confusion_resolver_monthly;
  limits["ai.memory_hooks_monthly"] = entitlements.ai.memory_hooks_monthly;
  limits["ai.daily_coach_per_day"] = entitlements.ai.daily_coach_per_day;
  limits["ai.personalized_mistake_explanation_lifetime_credits"] = 0;

  return Object.freeze(limits);
}

function cloneCapabilityRecord(record: CapabilityRecord): Record<Capability, boolean> {
  return { ...record };
}

function cloneLimitRecord(record: LimitRecord): Record<LimitKey, LimitValue> {
  return { ...record };
}

function normalizePlan(planId: PlanId): NormalizedPlanDefinition {
  const plan = CANONICAL_ENTITLEMENT_CATALOG.plans[planId];
  const rawEntitlements = plan.entitlements;

  if (hasInheritedEntitlements(rawEntitlements)) {
    const inheritedPlan = normalizePlan(rawEntitlements.inherits);
    const capabilities = cloneCapabilityRecord(inheritedPlan.capabilities);
    const limits = cloneLimitRecord(inheritedPlan.limits);

    capabilities["classroom.seats"] = rawEntitlements.classroom_seats > 0;
    capabilities["classroom.class_decks"] = rawEntitlements.class_decks;
    capabilities["classroom.assignments"] = rawEntitlements.assignments;
    capabilities["classroom.student_progress"] =
      rawEntitlements.student_progress;
    capabilities["classroom.csv_roster"] = rawEntitlements.csv_roster;
    capabilities["classroom.printable_answer_keys"] =
      rawEntitlements.printable_answer_keys;

    limits["downloads.monthly_total"] = rawEntitlements.downloads_monthly;
    limits["downloads.standard_monthly"] = rawEntitlements.downloads_monthly;
    limits["downloads.hd_monthly"] = rawEntitlements.downloads_monthly;
    limits["classroom.seats"] = rawEntitlements.classroom_seats;

    return Object.freeze({
      id: planId,
      name: plan.name,
      publicPricingCard: plan.is_public_plan,
      positioning: plan.positioning,
      price: plan.price,
      capabilities: Object.freeze(capabilities),
      limits: Object.freeze(limits),
      licenseScope: rawEntitlements.license_scope
    });
  }

  return Object.freeze({
    id: planId,
    name: plan.name,
    publicPricingCard: plan.is_public_plan,
    positioning: plan.positioning,
    price: plan.price,
    capabilities: normalizeStandardCapabilities(rawEntitlements),
    limits: normalizeStandardLimits(rawEntitlements),
    licenseScope: rawEntitlements.license_scope
  });
}

export const PLAN_CATALOG = Object.freeze(
  Object.fromEntries(
    ACCOUNT_STATES.map((planId) => [planId, normalizePlan(planId)])
  )
) as Readonly<Record<PlanId, NormalizedPlanDefinition>>;

export function getBasePlanEntitlements(
  planId: PlanId
): NormalizedPlanDefinition {
  return PLAN_CATALOG[planId];
}
