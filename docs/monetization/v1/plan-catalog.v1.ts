/**
 * Visual Lexicon Track B canonical plan catalog v1.0
 * Effective: 2026-06-23
 *
 * IMPORTANT:
 * - The server is the authority for effective entitlements.
 * - localStorage, query strings, cookies, and client plan labels are never authorization.
 * - Promotional AI credits are additive grants, not Free/Lite plan capabilities.
 * - Watermark removal does not imply commercial rights.
 */

export type PlanId = "guest" | "free" | "lite" | "pro" | "educator";
export type PaidConsumerPlanId = "lite" | "pro";
export type AssetVariant = "watermarked" | "clean_standard" | "clean_hd";
export type LicenseScope =
  | "view_only"
  | "personal_noncommercial"
  | "personal_and_internal_noncommercial_asset_policy_applies"
  | "classroom_distribution_subject_to_asset_policy";

export interface MoneyPrice {
  monthly: number | null;
  annual: number | null;
}

export interface PlanEntitlements {
  ads: {
    publicPageUnitsMax: number;
    appNativeSlotsMax: number;
    reviewSession: false;
  };
  assets: {
    displayVariant: AssetVariant;
    cleanAssetUrlExposed: false;
  };
  downloads: {
    enabled: boolean;
    monthlyTotal: number;
    standardMonthly: number;
    hdMonthly: number;
    maxLongEdgePx: number;
    formats: readonly string[];
    batchSize: number;
  };
  learning: {
    savedWordsLimit: number | null;
    storageScope: "local_only" | "account_sync";
    dailyReviewCards: number | null;
    dueQueue: "sample" | "top_10" | "full" | "full_advanced_priority";
    historyDays: number | null;
    customDecks: number | null;
  };
  srs: {
    enabled: "sample" | "basic_5_box" | "full_5_box" | "full_5_box_advanced_priority";
    weakWords: "none" | "top_3_preview" | "full_list_basic_review" | "full_list_advanced";
    weakSprint: boolean;
    masteryTest: boolean;
  };
  questionTypes: readonly string[];
  packs: {
    hubAccess: "public_preview" | "starter" | "all_standard_hubs" | "all";
    examPreviewCards: number | null;
    examAccess: "none" | "purchased_only" | "all_while_active";
  };
  ai: {
    staticApprovedFeedback: true;
    personalizedMistakeExplanationsMonthly: number;
    confusionResolverMonthly: number;
    memoryHooksMonthly: number;
    dailyCoachPerDay: number;
  };
  support: "self_service" | "standard" | "priority";
  licenseScope: LicenseScope;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  publicPricingCard: boolean;
  position: string;
  price: { KRW: MoneyPrice; USD: MoneyPrice };
  entitlements: PlanEntitlements;
}

const noDownload = {
  enabled: false,
  monthlyTotal: 0,
  standardMonthly: 0,
  hdMonthly: 0,
  maxLongEdgePx: 0,
  formats: [] as const,
  batchSize: 0,
} as const;

export const PLAN_CATALOG: Readonly<Record<Exclude<PlanId, "educator">, PlanDefinition>> = {
  guest: {
    id: "guest",
    name: "Guest",
    publicPricingCard: false,
    position: "검색 유입자가 비주얼 기억 경험을 맛보는 상태",
    price: { KRW: { monthly: 0, annual: 0 }, USD: { monthly: 0, annual: 0 } },
    entitlements: {
      ads: { publicPageUnitsMax: 2, appNativeSlotsMax: 0, reviewSession: false },
      assets: { displayVariant: "watermarked", cleanAssetUrlExposed: false },
      downloads: noDownload,
      learning: { savedWordsLimit: 10, storageScope: "local_only", dailyReviewCards: 5, dueQueue: "sample", historyDays: 0, customDecks: 0 },
      srs: { enabled: "sample", weakWords: "none", weakSprint: false, masteryTest: false },
      questionTypes: ["image_to_word", "definition_to_word_demo"],
      packs: { hubAccess: "public_preview", examPreviewCards: 5, examAccess: "none" },
      ai: { staticApprovedFeedback: true, personalizedMistakeExplanationsMonthly: 0, confusionResolverMonthly: 0, memoryHooksMonthly: 0, dailyCoachPerDay: 0 },
      support: "self_service",
      licenseScope: "view_only",
    },
  },
  free: {
    id: "free",
    name: "Free",
    publicPricingCard: true,
    position: "첫 50개 단어를 저장하고 기본 복습 습관을 만드는 무료 계정",
    price: { KRW: { monthly: 0, annual: 0 }, USD: { monthly: 0, annual: 0 } },
    entitlements: {
      ads: { publicPageUnitsMax: 1, appNativeSlotsMax: 1, reviewSession: false },
      assets: { displayVariant: "watermarked", cleanAssetUrlExposed: false },
      downloads: noDownload,
      learning: { savedWordsLimit: 50, storageScope: "account_sync", dailyReviewCards: 10, dueQueue: "top_10", historyDays: 7, customDecks: 1 },
      srs: { enabled: "basic_5_box", weakWords: "top_3_preview", weakSprint: false, masteryTest: false },
      questionTypes: ["image_to_word", "definition_to_word"],
      packs: { hubAccess: "starter", examPreviewCards: 10, examAccess: "purchased_only" },
      ai: { staticApprovedFeedback: true, personalizedMistakeExplanationsMonthly: 0, confusionResolverMonthly: 0, memoryHooksMonthly: 0, dailyCoachPerDay: 0 },
      support: "self_service",
      licenseScope: "view_only",
    },
  },
  lite: {
    id: "lite",
    name: "Lite",
    publicPricingCard: true,
    position: "무광고·무워터마크·전체 기본 복습과 표준 다운로드",
    price: { KRW: { monthly: 7900, annual: 59000 }, USD: { monthly: 7.99, annual: 59.99 } },
    entitlements: {
      ads: { publicPageUnitsMax: 0, appNativeSlotsMax: 0, reviewSession: false },
      assets: { displayVariant: "clean_standard", cleanAssetUrlExposed: false },
      downloads: { enabled: true, monthlyTotal: 100, standardMonthly: 100, hdMonthly: 0, maxLongEdgePx: 1600, formats: ["jpg", "webp"], batchSize: 1 },
      learning: { savedWordsLimit: null, storageScope: "account_sync", dailyReviewCards: null, dueQueue: "full", historyDays: 90, customDecks: 5 },
      srs: { enabled: "full_5_box", weakWords: "full_list_basic_review", weakSprint: false, masteryTest: false },
      questionTypes: ["image_to_word", "definition_to_word", "word_to_image", "cloze"],
      packs: { hubAccess: "all_standard_hubs", examPreviewCards: 10, examAccess: "purchased_only" },
      ai: { staticApprovedFeedback: true, personalizedMistakeExplanationsMonthly: 0, confusionResolverMonthly: 0, memoryHooksMonthly: 0, dailyCoachPerDay: 0 },
      support: "standard",
      licenseScope: "personal_noncommercial",
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    publicPricingCard: true,
    position: "시험팩·약점 집중훈련·AI 오답치료·HD 출력",
    price: { KRW: { monthly: 14900, annual: 119000 }, USD: { monthly: 14.99, annual: 119.99 } },
    entitlements: {
      ads: { publicPageUnitsMax: 0, appNativeSlotsMax: 0, reviewSession: false },
      assets: { displayVariant: "clean_hd", cleanAssetUrlExposed: false },
      downloads: { enabled: true, monthlyTotal: 500, standardMonthly: 500, hdMonthly: 500, maxLongEdgePx: 3000, formats: ["jpg", "png", "pdf"], batchSize: 20 },
      learning: { savedWordsLimit: null, storageScope: "account_sync", dailyReviewCards: null, dueQueue: "full_advanced_priority", historyDays: null, customDecks: null },
      srs: { enabled: "full_5_box_advanced_priority", weakWords: "full_list_advanced", weakSprint: true, masteryTest: true },
      questionTypes: ["image_to_word", "definition_to_word", "word_to_image", "cloze", "confusable_pair", "weak_sprint", "mastery_test"],
      packs: { hubAccess: "all", examPreviewCards: null, examAccess: "all_while_active" },
      ai: { staticApprovedFeedback: true, personalizedMistakeExplanationsMonthly: 200, confusionResolverMonthly: 100, memoryHooksMonthly: 50, dailyCoachPerDay: 1 },
      support: "priority",
      licenseScope: "personal_and_internal_noncommercial_asset_policy_applies",
    },
  },
};

export const WELCOME_AI_PROMOTION = {
  id: "welcome_ai_demo",
  eligiblePlans: ["free", "lite"] as const,
  personalizedMistakeExplanationCredits: 3,
  cadence: "lifetime_once_per_account",
  showOnCorePricingTable: false,
} as const;

export type AdditiveGrant =
  | { kind: "pack"; packId: string; expiresAt: string | null }
  | { kind: "ai_credit"; feature: "mistake_explanation"; remaining: number; expiresAt: string | null }
  | { kind: "manual"; capability: string; reason: string; issuedBy: string; expiresAt: string | null };

export interface EffectiveEntitlementContext {
  plan: Exclude<PlanId, "educator">;
  purchases: readonly AdditiveGrant[];
  promotions: readonly AdditiveGrant[];
  manualGrants: readonly AdditiveGrant[];
}

export function getBasePlan(plan: Exclude<PlanId, "educator">): PlanDefinition {
  return PLAN_CATALOG[plan];
}

/**
 * This starter intentionally does not implement authorization merging.
 * Implement the resolver server-side with explicit tests for expiry,
 * idempotency, quota consumption, and plan monotonicity.
 */
export function describeEffectiveGrantSources(context: EffectiveEntitlementContext): readonly string[] {
  return [
    `plan:${context.plan}`,
    ...context.purchases.map((grant) => `${grant.kind}:purchase`),
    ...context.promotions.map((grant) => `${grant.kind}:promotion`),
    ...context.manualGrants.map((grant) => `${grant.kind}:manual`),
  ];
}
