export {
  ACCOUNT_STATES,
  ADDITIVE_PRODUCT_PACK_ENTITLEMENTS,
  CANONICAL_ENTITLEMENT_CATALOG,
  ENTITLEMENT_LIFECYCLE_POLICIES,
  ENTITLEMENT_RESOLUTION_FORMULA,
  INHERITANCE_ORDER,
  PLAN_CATALOG,
  PRICING_VISIBLE_PLANS,
  WELCOME_AI_DEMO_CREDITS,
  getBasePlanEntitlements
} from "@/lib/entitlements/catalog";
export {
  can,
  limit,
  remaining,
  resolveEffectiveEntitlements
} from "@/lib/entitlements/resolver";
export {
  CAPABILITIES,
  LIFECYCLE_STATES,
  LIMIT_KEYS,
  UNLIMITED
} from "@/lib/entitlements/types";
export {
  DEFAULT_VLX_PLAN_STATE,
  getPlanDefinition,
  isVlxPlanId,
  readLocalPlanState,
  resolveEntitlement,
  VLX_PLAN_DEFINITIONS
} from "@/lib/entitlements/local-entitlements";
export {
  VLX_DEFAULT_PLAN_ID,
  VLX_PLAN_STATE_STORAGE_KEY
} from "@/lib/entitlements/types";
export type * from "@/lib/entitlements/types";
