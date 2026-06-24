import {
  ACCOUNT_STATES,
  ADDITIVE_PRODUCT_PACK_ENTITLEMENTS,
  CANONICAL_ENTITLEMENT_CATALOG,
  ENTITLEMENT_RESOLUTION_FORMULA,
  PRICING_VISIBLE_PLANS,
  WELCOME_AI_DEMO_CREDITS,
  getBasePlanEntitlements
} from "@/lib/entitlements/catalog";
import {
  CAPABILITIES,
  LIFECYCLE_STATES,
  LIMIT_KEYS,
  UNLIMITED,
  type ActiveGrantSummary,
  type AdditiveProductId,
  type Capability,
  type EntitlementLifecycleDecision,
  type EntitlementLifecycleInput,
  type EffectiveEntitlements,
  type LimitKey,
  type LimitValue,
  type ManualGrant,
  type OneTimePurchaseGrant,
  type PackEntitlement,
  type PlanId,
  type PromotionId,
  type PromotionGrant,
  type ResolveEffectiveEntitlementsInput,
  type UsageSnapshot
} from "@/lib/entitlements/types";

type MutableEffectiveState = {
  capabilities: Record<Capability, boolean>;
  limits: Record<LimitKey, LimitValue>;
  purchasedPacks: Set<PackEntitlement>;
  appliedPromotionIds: Set<string>;
  activeGrants: ActiveGrantSummary[];
  ignoredGrantIds: string[];
  sources: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTimestamp(label: string, value: string): number {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid entitlement timestamp for ${label}.`);
  }

  return timestamp;
}

function requireString(label: string, value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid entitlement input: ${label} must be a string.`);
  }

  return value;
}

function requireGrantId(grant: { grantId?: unknown }, label: string): string {
  return requireString(`${label}.grantId`, grant.grantId);
}

function requirePlanId(value: unknown): PlanId {
  if (
    typeof value !== "string" ||
    !ACCOUNT_STATES.includes(value as PlanId)
  ) {
    throw new Error("Invalid entitlement input: unknown accountState.");
  }

  return value as PlanId;
}

function requireAdditiveProductId(value: unknown): AdditiveProductId {
  if (
    typeof value !== "string" ||
    !(value in ADDITIVE_PRODUCT_PACK_ENTITLEMENTS)
  ) {
    throw new Error("Invalid entitlement input: unknown additive product.");
  }

  return value as AdditiveProductId;
}

function requirePromotionId(value: unknown): PromotionId {
  if (
    typeof value !== "string" ||
    !(value in CANONICAL_ENTITLEMENT_CATALOG.promotions)
  ) {
    throw new Error("Invalid entitlement input: unknown promotion.");
  }

  return value as PromotionId;
}

function requireCapability(value: unknown): Capability {
  if (typeof value !== "string" || !CAPABILITIES.includes(value as Capability)) {
    throw new Error("Invalid entitlement input: unknown capability.");
  }

  return value as Capability;
}

function requireLimitKey(value: unknown): LimitKey {
  if (typeof value !== "string" || !LIMIT_KEYS.includes(value as LimitKey)) {
    throw new Error("Invalid entitlement input: unknown limit key.");
  }

  return value as LimitKey;
}

function requireLimitValue(value: unknown): LimitValue {
  if (value === UNLIMITED) {
    return value;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Invalid entitlement input: limit values must be non-negative.");
  }

  return value;
}

function requirePackEntitlement(value: unknown): PackEntitlement {
  const knownPackEntitlements = new Set(
    Object.values(ADDITIVE_PRODUCT_PACK_ENTITLEMENTS).flat()
  );

  if (
    typeof value !== "string" ||
    !knownPackEntitlements.has(value as PackEntitlement)
  ) {
    throw new Error("Invalid entitlement input: unknown pack entitlement.");
  }

  return value as PackEntitlement;
}

function readArray<T>(label: string, value: unknown): readonly T[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Invalid entitlement input: ${label} must be an array.`);
  }

  return value as readonly T[];
}

function getPastDueGraceDays(): number {
  const policy = CANONICAL_ENTITLEMENT_CATALOG.lifecycle.past_due_grace;

  if (!isRecord(policy) || typeof policy.days !== "number") {
    throw new Error("Canonical entitlement lifecycle past_due_grace.days is invalid.");
  }

  return policy.days;
}

function requireLifecycleState(value: unknown) {
  if (
    typeof value !== "string" ||
    !LIFECYCLE_STATES.includes(value as EntitlementLifecycleInput["state"])
  ) {
    throw new Error("Invalid entitlement input: unknown lifecycle state.");
  }

  return value as EntitlementLifecycleInput["state"];
}

function fullLifecycleDecision(
  state: EntitlementLifecycleInput["state"],
  effectiveBasePlanId: PlanId,
  policy: EntitlementLifecycleDecision["policy"]
): EntitlementLifecycleDecision {
  return Object.freeze({
    state,
    effectiveBasePlanId,
    fullPlanEntitlements: true,
    cleanDownloadsAllowed: true,
    newAiCallsAllowed: true,
    paidProviderGrantsAllowed: true,
    supportReviewRequired: false,
    policy,
    learningDataPolicy: Object.freeze({
      preserve: true,
      mutation: "none_policy_only"
    })
  });
}

function restrictedLifecycleDecision(
  state: EntitlementLifecycleInput["state"],
  effectiveBasePlanId: PlanId,
  policy: EntitlementLifecycleDecision["policy"],
  overrides: Partial<
    Pick<
      EntitlementLifecycleDecision,
      | "fullPlanEntitlements"
      | "cleanDownloadsAllowed"
      | "newAiCallsAllowed"
      | "paidProviderGrantsAllowed"
      | "supportReviewRequired"
    >
  >
): EntitlementLifecycleDecision {
  return Object.freeze({
    state,
    effectiveBasePlanId,
    fullPlanEntitlements: false,
    cleanDownloadsAllowed: false,
    newAiCallsAllowed: true,
    paidProviderGrantsAllowed: true,
    supportReviewRequired: false,
    ...overrides,
    policy,
    learningDataPolicy: Object.freeze({
      preserve: true,
      mutation: "none_policy_only"
    })
  });
}

function resolveLifecycleDecision(
  accountState: PlanId,
  lifecycle: unknown,
  evaluatedAtMs: number
): EntitlementLifecycleDecision {
  if (lifecycle === undefined) {
    return fullLifecycleDecision(
      "active",
      accountState,
      "full_plan_entitlements"
    );
  }

  if (!isRecord(lifecycle)) {
    throw new Error("Invalid entitlement input: lifecycle must be an object.");
  }

  const state = requireLifecycleState(lifecycle.state);

  switch (state) {
    case "active":
      return fullLifecycleDecision(
        state,
        accountState,
        "full_plan_entitlements"
      );

    case "canceled_at_period_end": {
      const currentPeriodEnd = parseTimestamp(
        "lifecycle.currentPeriodEnd",
        requireString("lifecycle.currentPeriodEnd", lifecycle.currentPeriodEnd)
      );

      if (currentPeriodEnd > evaluatedAtMs) {
        return fullLifecycleDecision(
          state,
          accountState,
          "full_plan_entitlements_until_current_period_end"
        );
      }

      return restrictedLifecycleDecision(
        state,
        "free",
        "expired_fallback_to_free",
        {
          newAiCallsAllowed: true
        }
      );
    }

    case "past_due_grace": {
      const graceStartedAt = parseTimestamp(
        "lifecycle.graceStartedAt",
        requireString("lifecycle.graceStartedAt", lifecycle.graceStartedAt)
      );
      const graceEndsAt =
        lifecycle.graceEndsAt === undefined || lifecycle.graceEndsAt === null
          ? graceStartedAt + getPastDueGraceDays() * DAY_MS
          : parseTimestamp(
              "lifecycle.graceEndsAt",
              requireString("lifecycle.graceEndsAt", lifecycle.graceEndsAt)
            );

      if (graceEndsAt <= evaluatedAtMs) {
        return restrictedLifecycleDecision(
          state,
          "free",
          "expired_fallback_to_free",
          {
            newAiCallsAllowed: true
          }
        );
      }

      return restrictedLifecycleDecision(
        state,
        accountState,
        "past_due_grace_learning_only",
        {
          cleanDownloadsAllowed: false,
          newAiCallsAllowed: false
        }
      );
    }

    case "expired":
      return restrictedLifecycleDecision(
        state,
        "free",
        "expired_fallback_to_free",
        {
          newAiCallsAllowed: true
        }
      );

    case "refunded_or_chargeback":
      parseTimestamp(
        "lifecycle.verifiedAt",
        requireString("lifecycle.verifiedAt", lifecycle.verifiedAt)
      );

      return restrictedLifecycleDecision(
        state,
        "free",
        "refunded_or_chargeback_revoke_paid_grants",
        {
          newAiCallsAllowed: false,
          paidProviderGrantsAllowed: false,
          supportReviewRequired: true
        }
      );
  }
}

function isActiveGrant(
  expiresAt: string | null | undefined,
  evaluatedAtMs: number
): boolean {
  if (!expiresAt) {
    return true;
  }

  if (typeof expiresAt !== "string") {
    throw new Error("Invalid entitlement input: expiresAt must be a string.");
  }

  return parseTimestamp("expiresAt", expiresAt) > evaluatedAtMs;
}

function addLimit(
  limits: Record<LimitKey, LimitValue>,
  limitKey: LimitKey,
  addition: LimitValue
) {
  const current = limits[limitKey];

  if (current === UNLIMITED || addition === UNLIMITED) {
    limits[limitKey] = UNLIMITED;
    return;
  }

  limits[limitKey] = current + addition;
}

function requireManualGrantMetadata(grant: ManualGrant) {
  const requiredFields = [
    ["reason", grant.reason],
    ["issuedBy", grant.issuedBy],
    ["issuedAt", grant.issuedAt],
    ["expiresAt", grant.expiresAt],
    ["auditId", grant.auditId]
  ] as const;
  const missingFields = requiredFields
    .filter(([, value]) => typeof value !== "string" || value.trim().length === 0)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    throw new Error(
      `Manual entitlement grant ${grant.grantId || "<unknown>"} is missing audit metadata: ${missingFields.join(
        ", "
      )}.`
    );
  }

  parseTimestamp("manualGrant.issuedAt", grant.issuedAt);
  parseTimestamp("manualGrant.expiresAt", grant.expiresAt);
}

function applyPackGrant(
  state: MutableEffectiveState,
  packEntitlement: PackEntitlement
) {
  state.purchasedPacks.add(packEntitlement);
  state.capabilities[packEntitlement] = true;
}

function applyOneTimePurchase(
  state: MutableEffectiveState,
  grant: OneTimePurchaseGrant,
  evaluatedAtMs: number,
  providerGrantsAllowed: boolean
) {
  if (!isRecord(grant)) {
    throw new Error("Invalid entitlement input: oneTimePurchase must be an object.");
  }

  const grantId = requireGrantId(grant, "oneTimePurchase");
  const productId = requireAdditiveProductId(grant.productId);
  parseTimestamp(
    "oneTimePurchase.purchasedAt",
    requireString("oneTimePurchase.purchasedAt", grant.purchasedAt)
  );

  if (!providerGrantsAllowed) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  if (!isActiveGrant(grant.expiresAt, evaluatedAtMs)) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  for (const packEntitlement of ADDITIVE_PRODUCT_PACK_ENTITLEMENTS[
    productId
  ]) {
    applyPackGrant(state, packEntitlement);
  }

  state.activeGrants.push({
    source: "one_time_purchase",
    grantId,
    expiresAt: grant.expiresAt ?? null
  });
  state.sources.push(`one_time_purchase:${grantId}:${productId}`);
}

function applyPromotion(
  state: MutableEffectiveState,
  grant: PromotionGrant,
  accountState: PlanId,
  evaluatedAtMs: number,
  providerGrantsAllowed: boolean
) {
  if (!isRecord(grant)) {
    throw new Error("Invalid entitlement input: promotion must be an object.");
  }

  const grantId = requireGrantId(grant, "promotion");
  const promotionId = requirePromotionId(grant.promotionId);
  parseTimestamp(
    "promotion.issuedAt",
    requireString("promotion.issuedAt", grant.issuedAt)
  );

  if (!providerGrantsAllowed) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  if (!isActiveGrant(grant.expiresAt, evaluatedAtMs)) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  const promotion = CANONICAL_ENTITLEMENT_CATALOG.promotions[promotionId];

  if (!promotion.applies_to.includes(accountState)) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  if (state.appliedPromotionIds.has(promotionId)) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  if (promotionId === "welcome_ai_demo") {
    addLimit(
      state.limits,
      "ai.personalized_mistake_explanation_lifetime_credits",
      WELCOME_AI_DEMO_CREDITS
    );
    state.capabilities["ai.promotional_mistake_explanation_credits"] = true;
  }

  state.appliedPromotionIds.add(promotionId);
  state.activeGrants.push({
    source: "promotion",
    grantId,
    expiresAt: grant.expiresAt ?? null
  });
  state.sources.push(`promotion:${grantId}:${promotionId}`);
}

function applyManualGrant(
  state: MutableEffectiveState,
  grant: ManualGrant,
  evaluatedAtMs: number
) {
  if (!isRecord(grant)) {
    throw new Error("Invalid entitlement input: manualGrant must be an object.");
  }

  const grantId = requireGrantId(grant, "manualGrant");
  requireManualGrantMetadata(grant);

  if (!isActiveGrant(grant.expiresAt, evaluatedAtMs)) {
    state.ignoredGrantIds.push(grantId);
    return;
  }

  for (const capability of readArray<Capability>(
    "manualGrant.capabilities",
    grant.capabilities
  )) {
    state.capabilities[requireCapability(capability)] = true;
  }

  for (const packEntitlement of readArray<PackEntitlement>(
    "manualGrant.packEntitlements",
    grant.packEntitlements
  )) {
    applyPackGrant(state, requirePackEntitlement(packEntitlement));
  }

  if (grant.limits !== undefined && !isRecord(grant.limits)) {
    throw new Error("Invalid entitlement input: manualGrant.limits must be an object.");
  }

  for (const [limitKey, grantLimit] of Object.entries(grant.limits ?? {})) {
    addLimit(
      state.limits,
      requireLimitKey(limitKey),
      requireLimitValue(grantLimit)
    );
  }

  state.activeGrants.push({
    source: "manual",
    grantId,
    expiresAt: grant.expiresAt
  });
  state.sources.push(`manual:${grant.auditId}`);
}

function blockPastDueNewPaidUse(state: MutableEffectiveState) {
  state.capabilities["downloads.standard"] = false;
  state.capabilities["downloads.hd"] = false;
  state.capabilities["downloads.batch"] = false;
  state.limits["downloads.monthly_total"] = 0;
  state.limits["downloads.standard_monthly"] = 0;
  state.limits["downloads.hd_monthly"] = 0;
  state.limits["downloads.batch_size"] = 0;

  state.capabilities["ai.monthly_personalized_mistake_explanations"] = false;
  state.capabilities["ai.monthly_confusion_resolver"] = false;
  state.capabilities["ai.monthly_memory_hooks"] = false;
  state.capabilities["ai.daily_coach"] = false;
  state.capabilities["ai.promotional_mistake_explanation_credits"] = false;
  state.limits["ai.personalized_mistake_explanations_monthly"] = 0;
  state.limits["ai.confusion_resolver_monthly"] = 0;
  state.limits["ai.memory_hooks_monthly"] = 0;
  state.limits["ai.daily_coach_per_day"] = 0;
  state.limits["ai.personalized_mistake_explanation_lifetime_credits"] = 0;
}

export function resolveEffectiveEntitlements(
  input: ResolveEffectiveEntitlementsInput
): EffectiveEntitlements {
  if (!isRecord(input)) {
    throw new Error("Invalid entitlement input: input must be an object.");
  }

  const accountState = requirePlanId(input.accountState);
  const evaluatedAt = requireString("evaluatedAt", input.evaluatedAt);
  const evaluatedAtMs = parseTimestamp("evaluatedAt", evaluatedAt);
  const lifecycle = resolveLifecycleDecision(
    accountState,
    input.lifecycle,
    evaluatedAtMs
  );
  const basePlan = getBasePlanEntitlements(lifecycle.effectiveBasePlanId);
  const state: MutableEffectiveState = {
    capabilities: { ...basePlan.capabilities },
    limits: { ...basePlan.limits },
    purchasedPacks: new Set<PackEntitlement>(),
    activeGrants: [],
    ignoredGrantIds: [],
    sources: [
      `base_plan:${lifecycle.effectiveBasePlanId}`,
      `lifecycle:${lifecycle.state}`
    ],
    appliedPromotionIds: new Set<string>()
  };
  const oneTimePurchases = readArray<OneTimePurchaseGrant>(
    "oneTimePurchases",
    input.oneTimePurchases
  );
  const promotions = readArray<PromotionGrant>("promotions", input.promotions);
  const manualGrants = readArray<ManualGrant>(
    "manualGrants",
    input.manualGrants
  );

  for (const purchase of oneTimePurchases) {
    applyOneTimePurchase(
      state,
      purchase,
      evaluatedAtMs,
      lifecycle.paidProviderGrantsAllowed
    );
  }

  for (const promotion of promotions) {
    applyPromotion(
      state,
      promotion,
      lifecycle.effectiveBasePlanId,
      evaluatedAtMs,
      lifecycle.paidProviderGrantsAllowed
    );
  }

  for (const manualGrant of manualGrants) {
    applyManualGrant(state, manualGrant, evaluatedAtMs);
  }

  if (lifecycle.policy === "past_due_grace_learning_only") {
    blockPastDueNewPaidUse(state);
  }

  return Object.freeze({
    accountState,
    planId: lifecycle.effectiveBasePlanId,
    evaluatedAt,
    lifecycle,
    pricingVisiblePlans: PRICING_VISIBLE_PLANS,
    capabilities: Object.freeze(state.capabilities),
    limits: Object.freeze(state.limits),
    purchasedPacks: Object.freeze(Array.from(state.purchasedPacks).sort()),
    activeGrants: Object.freeze([...state.activeGrants]),
    ignoredGrantIds: Object.freeze([...state.ignoredGrantIds]),
    sources: Object.freeze([...state.sources]),
    assetPolicy: Object.freeze({
      commercialRightsAreNotImpliedByWatermarkRemoval:
        CANONICAL_ENTITLEMENT_CATALOG.asset_policy
          .commercial_rights_are_not_implied_by_watermark_removal,
      perAssetRightsFieldRequired:
        CANONICAL_ENTITLEMENT_CATALOG.asset_policy
          .per_asset_rights_field_required
    }),
    resolutionFormula: ENTITLEMENT_RESOLUTION_FORMULA
  });
}

export function can(
  entitlements: EffectiveEntitlements,
  capability: Capability
): boolean {
  return entitlements.capabilities[capability] ?? false;
}

export function limit(
  entitlements: EffectiveEntitlements,
  limitKey: LimitKey
): LimitValue {
  return entitlements.limits[limitKey];
}

export function remaining(
  entitlements: EffectiveEntitlements,
  limitKey: LimitKey,
  usage: UsageSnapshot
): LimitValue {
  const allowance = limit(entitlements, limitKey);

  if (allowance === UNLIMITED) {
    return UNLIMITED;
  }

  const used = usage[limitKey] ?? 0;
  const normalizedUsage = Number.isFinite(used) ? Math.max(0, used) : 0;

  return Math.max(0, allowance - normalizedUsage);
}
