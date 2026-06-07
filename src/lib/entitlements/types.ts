export const VLX_PLAN_STATE_STORAGE_KEY = "vlx_plan_state_v1" as const;
export const VLX_DEFAULT_PLAN_ID = "guest" as const;

export type VlxPlanId = "guest" | "free" | "lite" | "pro";
export type VlxPlanLimit = number | "unlimited";
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
