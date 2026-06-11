export const PRODUCTION_ANALYTICS_EVENT_NAMES = [
  "app_page_view",
  "save_word",
  "review_start",
  "review_answer",
  "review_complete",
  "due_queue_view",
  "weak_queue_view",
  "mastered_view",
  "pack_preview_start",
  "pack_preview_complete",
  "pack_review_start",
  "pack_review_complete",
  "pricing_interest",
  "paywall_view",
  "upgrade_interest",
  "alias_search",
  "extension_save_source",
  "extension_review_source",
  "auth_future",
  "billing_future",
  "sync_future",
  "error_incident"
] as const;

export const PRODUCTION_ANALYTICS_SOURCES = [
  "client",
  "server",
  "derived"
] as const;

export const PRODUCTION_ANALYTICS_ENVIRONMENTS = [
  "local",
  "staging",
  "production"
] as const;

export const PRODUCTION_ANALYTICS_PRIVACY_CLASSES = [
  "public_content",
  "product_usage",
  "pseudonymous_identifier",
  "account_identifier",
  "sensitive_operational",
  "forbidden"
] as const;

export const PRODUCTION_ANALYTICS_METRIC_NAMES = [
  "weekly_reviewed_words",
  "active_reviewing_learners",
  "save_to_first_review_rate",
  "first_to_second_review_rate",
  "due_review_completion_rate",
  "weak_word_recovery_rate",
  "mastery_with_delayed_recall_rate",
  "pack_preview_completion_rate",
  "pack_review_completion_rate",
  "pricing_interest_rate",
  "paywall_to_upgrade_interest_rate",
  "extension_save_to_review_rate",
  "alias_search_match_rate",
  "sync_success_rate",
  "billing_entitlement_reconciliation_rate",
  "incident_rate"
] as const;

export const PRODUCTION_ANALYTICS_DASHBOARD_NAMES = [
  "north_star_weekly_reviewed_words",
  "activation_funnel",
  "save_to_first_review_funnel",
  "first_review_to_second_review_funnel",
  "due_review_completion",
  "weak_word_recovery",
  "mastery_quality",
  "pack_preview_and_pack_progress",
  "pricing_paywall_interest",
  "extension_source_funnel",
  "multilingual_alias_search_funnel",
  "future_billing_funnel",
  "future_auth_sync_health",
  "error_and_incident_reporting"
] as const;

export type ProductionAnalyticsEventName =
  (typeof PRODUCTION_ANALYTICS_EVENT_NAMES)[number];

export type ProductionAnalyticsSourceOfTruth =
  (typeof PRODUCTION_ANALYTICS_SOURCES)[number];

export type ProductionAnalyticsEnvironment =
  (typeof PRODUCTION_ANALYTICS_ENVIRONMENTS)[number];

export type ProductionAnalyticsPrivacyClass =
  (typeof PRODUCTION_ANALYTICS_PRIVACY_CLASSES)[number];

export type ProductionAnalyticsMetricName =
  (typeof PRODUCTION_ANALYTICS_METRIC_NAMES)[number];

export type ProductionAnalyticsDashboardName =
  (typeof PRODUCTION_ANALYTICS_DASHBOARD_NAMES)[number];

export type ProductionAnalyticsReviewMode =
  | "mixed"
  | "saved"
  | "due"
  | "weak"
  | "weak_sprint"
  | "word"
  | "pack"
  | "extension";

export type ProductionAnalyticsReviewResult = "correct" | "wrong";

export type ProductionAnalyticsMastery =
  | "New"
  | "Learning"
  | "Weak"
  | "Strong"
  | "Mastered";

export type ProductionAnalyticsPlan = "guest" | "free" | "lite" | "pro";

export type ProductionAnalyticsUserState =
  | "anonymous"
  | "guest"
  | "free_account"
  | "trial_or_beta"
  | "active_paid"
  | "past_due"
  | "canceled"
  | "expired"
  | "refunded"
  | "revoked";

export type ProductionAnalyticsAliasLanguage =
  | "ko"
  | "ja"
  | "en"
  | "unknown";

export type ProductionAnalyticsAliasResult = "matched" | "no_match";

export type ProductionAnalyticsSaveResult =
  | "saved"
  | "duplicate"
  | "reactivated"
  | "rejected"
  | "storage_error";

export type ProductionAnalyticsSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type ProductionAnalyticsCanAffect = "mastery" | "entitlement";

export type ProductionAnalyticsBasePayload = {
  readonly eventName: ProductionAnalyticsEventName;
  readonly eventId: string;
  readonly occurredAt: string;
  readonly sourceOfTruth: ProductionAnalyticsSourceOfTruth;
  readonly environment: ProductionAnalyticsEnvironment;
  readonly schemaVersion: 1;
  readonly anonymousId?: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly deviceId?: string;
};

export type ProductionAnalyticsAppPageViewPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "app_page_view";
    readonly route: string;
    readonly referrerCategory?: string;
    readonly userState?: ProductionAnalyticsUserState;
    readonly plan?: ProductionAnalyticsPlan;
    readonly source?: string;
  };

export type ProductionAnalyticsSaveWordPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "save_word";
    readonly slug: string;
    readonly word: string;
    readonly result: ProductionAnalyticsSaveResult;
    readonly source: string;
    readonly hub?: string;
    readonly packId?: string;
    readonly route?: string;
    readonly duplicate?: boolean;
    readonly hasReviewState?: boolean;
    readonly idempotencyKey?: string;
  };

export type ProductionAnalyticsReviewStartPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "review_start";
    readonly mode: ProductionAnalyticsReviewMode;
    readonly source?: string;
    readonly route?: string;
    readonly queueSize?: number;
    readonly dueCount?: number;
    readonly weakCount?: number;
    readonly packId?: string;
  };

export type ProductionAnalyticsReviewAnswerPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "review_answer";
    readonly sessionId: string;
    readonly slug: string;
    readonly word: string;
    readonly questionType: string;
    readonly answer: string;
    readonly result: ProductionAnalyticsReviewResult;
    readonly responseMs: number;
    readonly boxAfter: number;
    readonly weakScoreAfter: number;
    readonly selected?: string;
    readonly hub?: string;
    readonly packId?: string;
    readonly source?: string;
    readonly boxBefore?: number;
    readonly weakScoreBefore?: number;
    readonly masteryBefore?: ProductionAnalyticsMastery;
    readonly masteryAfter?: ProductionAnalyticsMastery;
    readonly usedHint?: boolean;
    readonly confidence?: "knew" | "guessed" | "forgot";
    readonly idempotencyKey?: string;
  };

export type ProductionAnalyticsReviewCompletePayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "review_complete";
    readonly sessionId: string;
    readonly mode: ProductionAnalyticsReviewMode;
    readonly reviewedCount: number;
    readonly correctCount?: number;
    readonly wrongCount?: number;
    readonly dueCount?: number;
    readonly weakCount?: number;
    readonly packId?: string;
    readonly durationMs?: number;
    readonly source?: string;
  };

export type ProductionAnalyticsQueueViewPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "due_queue_view" | "weak_queue_view";
    readonly route?: string;
    readonly source?: string;
    readonly userState?: ProductionAnalyticsUserState;
    readonly plan?: ProductionAnalyticsPlan;
    readonly dueCount?: number;
    readonly weakCount?: number;
    readonly oldestDueAt?: string;
    readonly averageWeakScore?: number;
  };

export type ProductionAnalyticsMasteredViewPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "mastered_view";
    readonly masteredCount: number;
    readonly route?: string;
    readonly source?: string;
    readonly plan?: ProductionAnalyticsPlan;
    readonly hasDelayedRecallEvidence?: boolean;
  };

export type ProductionAnalyticsPackPreviewPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "pack_preview_start" | "pack_preview_complete";
    readonly packId: string;
    readonly source?: string;
    readonly route?: string;
    readonly packSource?: "r2" | "mock" | "fallback" | "unavailable";
    readonly wordCount?: number;
    readonly previewedCount?: number;
    readonly durationMs?: number;
    readonly saveCount?: number;
    readonly reviewIntent?: boolean;
    readonly plan?: ProductionAnalyticsPlan;
    readonly locked?: boolean;
  };

export type ProductionAnalyticsPackReviewPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "pack_review_start" | "pack_review_complete";
    readonly packId: string;
    readonly mode?: ProductionAnalyticsReviewMode;
    readonly queueSize?: number;
    readonly reviewedCount?: number;
    readonly correctCount?: number;
    readonly wrongCount?: number;
    readonly masteredCount?: number;
    readonly weakCount?: number;
    readonly completionPercent?: number;
    readonly durationMs?: number;
    readonly source?: string;
    readonly plan?: ProductionAnalyticsPlan;
  };

export type ProductionAnalyticsPricingPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "pricing_interest" | "paywall_view" | "upgrade_interest";
    readonly plan?: ProductionAnalyticsPlan;
    readonly source?: string;
    readonly route?: string;
    readonly trigger?: string;
    readonly surface?: string;
    readonly reason?: string;
    readonly paywallReason?: string;
    readonly packId?: string;
    readonly userState?: ProductionAnalyticsUserState;
    readonly externalUrlConfigured?: boolean;
    readonly localOnlyRecorded?: boolean;
  };

export type ProductionAnalyticsAliasSearchPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "alias_search";
    readonly queryLanguage: ProductionAnalyticsAliasLanguage;
    readonly result: ProductionAnalyticsAliasResult;
    readonly matchedSlug?: string;
    readonly source?: string;
    readonly route?: string;
    readonly queryHash?: string;
    readonly queryLengthBucket?: "1-2" | "3-5" | "6-10" | "11+";
  };

export type ProductionAnalyticsExtensionSourcePayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "extension_save_source" | "extension_review_source";
    readonly source: string;
    readonly extensionSurface?: string;
    readonly slug?: string;
    readonly word?: string;
    readonly hub?: string;
    readonly result?: ProductionAnalyticsSaveResult;
    readonly handoffId?: string;
    readonly sourceCategory?: string;
    readonly mode?: ProductionAnalyticsReviewMode;
    readonly packId?: string;
    readonly queueSize?: number;
  };

export type ProductionAnalyticsAuthFuturePayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "auth_future";
    readonly authEventType:
      | "signup_attempt"
      | "signup_complete"
      | "signin_attempt"
      | "signin_complete"
      | "signout"
      | "session_refresh"
      | "guest_migration_start"
      | "guest_migration_complete"
      | "account_export"
      | "account_delete"
      | "recovery_attempt";
    readonly result?: "success" | "failure" | "blocked";
    readonly providerCategory?: string;
    readonly migrationBatchId?: string;
    readonly errorCode?: string;
  };

export type ProductionAnalyticsBillingFuturePayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "billing_future";
    readonly billingEventType:
      | "checkout_start"
      | "checkout_complete"
      | "trial_start"
      | "subscription_active"
      | "past_due"
      | "canceled"
      | "expired"
      | "refunded"
      | "disputed"
      | "entitlement_recomputed"
      | "entitlement_revoked";
    readonly plan?: ProductionAnalyticsPlan;
    readonly entitlementState?: ProductionAnalyticsUserState;
    readonly providerEventId?: string;
    readonly manualAuditId?: string;
    readonly periodEnd?: string;
    readonly packId?: string;
    readonly result?: "success" | "failure" | "pending";
    readonly reasonCode?: string;
  };

export type ProductionAnalyticsSyncFuturePayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "sync_future";
    readonly syncEventType:
      | "hydrate_start"
      | "hydrate_complete"
      | "mutation_accept"
      | "mutation_reject"
      | "batch_accept"
      | "batch_retryable"
      | "stale_client"
      | "conflict_requires_hydration";
    readonly result: "success" | "failure" | "retryable" | "blocked";
    readonly batchId?: string;
    readonly syncCursor?: string;
    readonly acceptedCount?: number;
    readonly rejectedCount?: number;
    readonly retryableCount?: number;
    readonly errorCode?: string;
  };

export type ProductionAnalyticsErrorIncidentPayload =
  ProductionAnalyticsBasePayload & {
    readonly eventName: "error_incident";
    readonly severity: ProductionAnalyticsSeverity;
    readonly surface: string;
    readonly errorCode: string;
    readonly route?: string;
    readonly operation?: string;
    readonly slug?: string;
    readonly packId?: string;
    readonly retryable?: boolean;
    readonly incidentId?: string;
    readonly affectedCount?: number;
  };

export type ProductionAnalyticsEventPayload =
  | ProductionAnalyticsAppPageViewPayload
  | ProductionAnalyticsSaveWordPayload
  | ProductionAnalyticsReviewStartPayload
  | ProductionAnalyticsReviewAnswerPayload
  | ProductionAnalyticsReviewCompletePayload
  | ProductionAnalyticsQueueViewPayload
  | ProductionAnalyticsMasteredViewPayload
  | ProductionAnalyticsPackPreviewPayload
  | ProductionAnalyticsPackReviewPayload
  | ProductionAnalyticsPricingPayload
  | ProductionAnalyticsAliasSearchPayload
  | ProductionAnalyticsExtensionSourcePayload
  | ProductionAnalyticsAuthFuturePayload
  | ProductionAnalyticsBillingFuturePayload
  | ProductionAnalyticsSyncFuturePayload
  | ProductionAnalyticsErrorIncidentPayload;

export type ProductionAnalyticsFieldContract = {
  readonly name: string;
  readonly privacyClass: ProductionAnalyticsPrivacyClass;
  readonly required: boolean;
  readonly notes?: string;
};

export type ProductionAnalyticsEventContract = {
  readonly eventName: ProductionAnalyticsEventName;
  readonly purpose: string;
  readonly sourceOfTruth: ProductionAnalyticsSourceOfTruth;
  readonly fields: readonly ProductionAnalyticsFieldContract[];
  readonly canAffect: readonly ProductionAnalyticsCanAffect[];
  readonly idempotencyNotes: string;
  readonly privacyNotes: string;
};

export type ProductionAnalyticsDashboardContract = {
  readonly dashboardName: ProductionAnalyticsDashboardName;
  readonly metricNames: readonly ProductionAnalyticsMetricName[];
  readonly eventNames: readonly ProductionAnalyticsEventName[];
  readonly goNoGoUse: string;
};
