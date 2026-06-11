export const VLX_BILLING_PLAN_IDS = [
  "guest",
  "free",
  "lite",
  "pro",
  "teacher_school_future"
] as const;

export const VLX_BILLING_ENTITLEMENT_STATUSES = [
  "none",
  "manual_beta",
  "trialing",
  "active",
  "past_due",
  "grace",
  "canceled_pending_period_end",
  "canceled",
  "expired",
  "refunded",
  "revoked"
] as const;

export const VLX_SUBSCRIPTION_STATUSES = [
  "none",
  "pending_checkout",
  "trialing",
  "active",
  "past_due",
  "grace",
  "canceled_pending_period_end",
  "canceled",
  "unpaid",
  "expired",
  "revoked"
] as const;

export const VLX_PACK_PURCHASE_STATUSES = [
  "none",
  "pending_payment",
  "active",
  "refunded",
  "charged_back",
  "revoked",
  "expired"
] as const;

export const VLX_BILLING_PROVIDER_KINDS = [
  "none",
  "manual_private_beta",
  "stripe",
  "paddle",
  "lemon_squeezy",
  "portone"
] as const;

export const VLX_BILLING_EVENT_TYPES = [
  "manual_access_granted",
  "manual_access_revoked",
  "checkout_started",
  "checkout_completed",
  "subscription_created",
  "subscription_updated",
  "subscription_canceled",
  "subscription_expired",
  "payment_succeeded",
  "payment_failed",
  "pack_purchase_completed",
  "refund_created",
  "chargeback_created",
  "entitlement_recomputed"
] as const;

export type VlxBillingPlanId = (typeof VLX_BILLING_PLAN_IDS)[number];

export type VlxBillingEntitlementStatus =
  (typeof VLX_BILLING_ENTITLEMENT_STATUSES)[number];

export type VlxSubscriptionStatus =
  (typeof VLX_SUBSCRIPTION_STATUSES)[number];

export type VlxPackPurchaseStatus =
  (typeof VLX_PACK_PURCHASE_STATUSES)[number];

export type VlxBillingProviderKind =
  (typeof VLX_BILLING_PROVIDER_KINDS)[number];

export type VlxBillingEventType = (typeof VLX_BILLING_EVENT_TYPES)[number];

export type VlxEntitlementFeatureKey =
  | "saved_words_limit"
  | "daily_review_limit"
  | "full_due_queue"
  | "weak_words"
  | "weak_sprint"
  | "exam_packs"
  | "pack_purchase"
  | "progress_history"
  | "mastery_export"
  | "mistake_explanation_placeholder"
  | "teacher_school_future";

export type VlxEntitlementLimitValue = number | "unlimited" | false;

export type VlxEntitlementFeatureMap = Partial<
  Record<VlxEntitlementFeatureKey, VlxEntitlementLimitValue>
>;

export type VlxBillingEntitlementSource =
  | {
      type: "manual_private_beta";
      manualGrantId: string;
    }
  | {
      type: "subscription";
      subscriptionId: string;
    }
  | {
      type: "pack_purchase";
      packPurchaseId: string;
      packId: string;
    };

export type VlxBillingEntitlementSnapshot = {
  id: string;
  userId: string;
  planId: VlxBillingPlanId;
  status: VlxBillingEntitlementStatus;
  provider: VlxBillingProviderKind;
  features: VlxEntitlementFeatureMap;
  sources: readonly VlxBillingEntitlementSource[];
  effectiveAt: string;
  expiresAt?: string;
  currentPeriodEnd?: string;
  lastBillingEventId?: string;
  snapshotReason:
    | "initial_free"
    | "manual_beta"
    | "subscription_event"
    | "pack_purchase_event"
    | "refund_or_chargeback"
    | "support_repair"
    | "expiration"
    | "migration";
  createdAt: string;
  updatedAt: string;
};

export type VlxBillingSubscriptionContract = {
  id: string;
  userId: string;
  provider: VlxBillingProviderKind;
  providerSubscriptionRef?: string;
  planId: Extract<VlxBillingPlanId, "lite" | "pro" | "teacher_school_future">;
  status: VlxSubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;
  endedAt?: string;
  graceEndsAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type VlxPackPurchaseContract = {
  id: string;
  userId: string;
  provider: VlxBillingProviderKind;
  providerPaymentRef?: string;
  packId: string;
  packVersion?: string;
  status: VlxPackPurchaseStatus;
  purchasedAt?: string;
  refundedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type VlxBillingEventContract = {
  id: string;
  userId: string;
  provider: VlxBillingProviderKind;
  providerEventRef?: string;
  eventType: VlxBillingEventType;
  targetType:
    | "billing_customer"
    | "subscription"
    | "pack_purchase"
    | "payment_receipt"
    | "refund"
    | "entitlement_snapshot";
  targetId?: string;
  occurredAt: string;
  receivedAt: string;
  idempotencyKey?: string;
  payloadHash?: string;
  createdAt: string;
};
