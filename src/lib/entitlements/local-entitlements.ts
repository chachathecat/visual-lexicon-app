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
      "A starter habit for saving a focused set of visual words and reviewing them daily.",
    outcome: "Build a real review habit with basic starter decks.",
    availabilityNote: "Local MVP only. No billing or subscription is active.",
    featureBullets: [
      "Save up to 50 words",
      "Review up to 10 words per day",
      "Use basic starter decks"
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
      "For learners who want the full review queue without exam or AI surfaces.",
    outcome: "Turn every saved word into unlimited due and weak-word review.",
    availabilityNote: "Placeholder only. Billing is not connected.",
    featureBullets: [
      "Unlimited saved words",
      "Unlimited review with the full due queue",
      "Weak words and no-ads marker"
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
      "For exam-focused learners who need targeted practice and richer memory diagnostics.",
    outcome: "Add exam packs, weak sprints, and future mistake explanations.",
    availabilityNote: "Placeholder only. Billing is not connected.",
    featureBullets: [
      "Everything in Lite",
      "Exam packs and weak sprint placeholder",
      "Mistake explanation and progress history placeholders"
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
