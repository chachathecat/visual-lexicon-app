import type {
  VlxLocalPlanState,
  VlxPlanDefinition,
  VlxPlanId,
  VlxResolvedEntitlement
} from "@/lib/entitlements/types";
import {
  VLX_DEFAULT_PLAN_ID,
  VLX_PLAN_STATE_STORAGE_KEY
} from "@/lib/entitlements/types";

export const VLX_PLAN_DEFINITIONS = {
  guest: {
    id: "guest",
    label: "Guest",
    priceLabel: "Local preview",
    summary:
      "A browser-only starter path for trying the memory loop before account sync exists.",
    outcome: "Try a five-card sample and keep state in this browser.",
    availabilityNote: "No account sync and no paid subscription.",
    featureBullets: [
      "Local-only review state",
      "Five-card sample sessions",
      "No account sync"
    ],
    limits: {
      localOnlyState: true,
      sampleCardLimit: 5,
      savedWordsLimit: 5,
      dailyReviewLimit: 5,
      accountSync: false,
      starterDecks: "sample",
      dueQueue: "sample",
      weakWords: false,
      noAdsMarker: false,
      examPacks: false,
      weakSprint: false,
      mistakeExplanation: "none",
      progressHistory: "none"
    }
  },
  free: {
    id: "free",
    label: "Free",
    priceLabel: "$0",
    summary:
      "Save a focused starter set, review a basic daily queue, and keep progress in this browser while the MVP stays local.",
    outcome: "Start remembering your first saved words.",
    availabilityNote: "Local MVP. No billing or active subscription is connected.",
    featureBullets: [
      "Save up to 50 visual words",
      "Preview the daily review loop with 10 local review cards",
      "Watermarked downloads where download surfaces apply"
    ],
    limits: {
      localOnlyState: true,
      savedWordsLimit: 50,
      dailyReviewLimit: 10,
      accountSync: false,
      starterDecks: "basic",
      dueQueue: "sample",
      weakWords: false,
      noAdsMarker: false,
      examPacks: false,
      weakSprint: false,
      mistakeExplanation: "none",
      progressHistory: "none"
    }
  },
  lite: {
    id: "lite",
    label: "Lite",
    priceLabel: "Planned",
    summary:
      "For learners who want saved words to keep moving through due and weak review every day.",
    outcome: "Build a daily visual memory habit.",
    availabilityNote: "Paid beta placeholder. Billing is not connected.",
    featureBullets: [
      "Expanded save and review capacity for paid beta positioning",
      "Due and weak review emphasis",
      "Planned no-ad experience once paid beta copy is approved"
    ],
    limits: {
      localOnlyState: true,
      savedWordsLimit: "unlimited",
      dailyReviewLimit: "unlimited",
      accountSync: false,
      starterDecks: "full",
      dueQueue: "full",
      weakWords: true,
      noAdsMarker: true,
      examPacks: false,
      weakSprint: false,
      mistakeExplanation: "none",
      progressHistory: "none"
    }
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceLabel: "Planned",
    summary:
      "For learners using memory state to repair repeated misses and follow guided exam vocabulary plans.",
    outcome: "Fix weak words and prepare for Academic / IELTS / GRE vocabulary.",
    availabilityNote: "Paid beta placeholder. No real subscription is created.",
    featureBullets: [
      "Everything in Lite",
      "Exam Packs and Weak Sprint positioning",
      "AI mistake explanation later, plus no-watermark download and export support"
    ],
    limits: {
      localOnlyState: true,
      savedWordsLimit: "unlimited",
      dailyReviewLimit: "unlimited",
      accountSync: false,
      starterDecks: "full",
      dueQueue: "full",
      weakWords: true,
      noAdsMarker: true,
      examPacks: true,
      weakSprint: true,
      mistakeExplanation: "placeholder",
      progressHistory: "placeholder"
    }
  }
} as const satisfies Record<VlxPlanId, VlxPlanDefinition>;

export const DEFAULT_VLX_PLAN_STATE = {
  plan: VLX_DEFAULT_PLAN_ID,
  source: "local"
} satisfies VlxLocalPlanState;

function canUseLocalStorage() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isVlxPlanId(value: unknown): value is VlxPlanId {
  return typeof value === "string" && value in VLX_PLAN_DEFINITIONS;
}

function readStoredPlanState(): unknown {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  const rawValue = window.localStorage.getItem(VLX_PLAN_STATE_STORAGE_KEY);

  if (!rawValue) {
    return undefined;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function normalizePlanState(value: unknown): VlxLocalPlanState | undefined {
  if (isVlxPlanId(value)) {
    return {
      plan: value,
      source: "local"
    };
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const candidatePlan = value.plan ?? value.planId;

  if (!isVlxPlanId(candidatePlan)) {
    return undefined;
  }

  return {
    plan: candidatePlan,
    source: "local",
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : undefined
  };
}

export function readLocalPlanState(): VlxLocalPlanState {
  return normalizePlanState(readStoredPlanState()) ?? DEFAULT_VLX_PLAN_STATE;
}

export function getPlanDefinition(planId: VlxPlanId): VlxPlanDefinition {
  return VLX_PLAN_DEFINITIONS[planId];
}

export function resolveEntitlement(
  input: VlxLocalPlanState | VlxPlanId = readLocalPlanState()
): VlxResolvedEntitlement {
  const state =
    typeof input === "string"
      ? {
          plan: input,
          source: "local" as const
        }
      : input;
  const plan = getPlanDefinition(state.plan);

  return {
    state,
    plan,
    storageKey: VLX_PLAN_STATE_STORAGE_KEY,
    isDefault: state.plan === VLX_DEFAULT_PLAN_ID,
    isPaidPreview: state.plan === "lite" || state.plan === "pro"
  };
}
