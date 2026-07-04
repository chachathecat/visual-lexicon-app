import type { VlxUpgradePlan } from "@/lib/upgrade/upgrade-targets";
import { normalizeUpgradeSource } from "@/lib/upgrade/upgrade-targets";

export const VLX_UPGRADE_INTEREST_STORAGE_KEY =
  "vlx_upgrade_interest_v1" as const;

export type VlxUpgradeInterestRecord = {
  id: string;
  plan: VlxUpgradePlan;
  source: string;
  trigger?: string;
  createdAt: string;
  pagePath: string;
};

type UpgradeInterestInput = {
  plan: VlxUpgradePlan;
  source: unknown;
  trigger?: unknown;
  createdAt?: string;
  pagePath?: string;
};

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

function getCurrentPagePath() {
  if (typeof window === "undefined" || !window.location) {
    return "unknown";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function createInterestId() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `upgrade_${Date.now()}_${randomPart}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePlan(value: unknown): VlxUpgradePlan | null {
  return value === "lite" || value === "pro" || value === "exam_pack"
    ? value
    : null;
}

function normalizeTrigger(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, 96) : undefined;
}

function normalizeStoredRecord(
  value: unknown
): VlxUpgradeInterestRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const plan = normalizePlan(value.plan);

  if (!plan || typeof value.id !== "string" || typeof value.createdAt !== "string") {
    return null;
  }

  return {
    id: value.id,
    plan,
    source: normalizeUpgradeSource(value.source),
    trigger: normalizeTrigger(value.trigger),
    createdAt: value.createdAt,
    pagePath:
      typeof value.pagePath === "string" && value.pagePath.trim()
        ? value.pagePath
        : "unknown"
  };
}

export function readUpgradeInterestStore(): VlxUpgradeInterestRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(VLX_UPGRADE_INTEREST_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.flatMap((item) => {
      const record = normalizeStoredRecord(item);

      return record ? [record] : [];
    });
  } catch {
    return [];
  }
}

export function createUpgradeInterestRecord(
  input: UpgradeInterestInput
): VlxUpgradeInterestRecord {
  return {
    id: createInterestId(),
    plan: input.plan,
    source: normalizeUpgradeSource(input.source),
    trigger: normalizeTrigger(input.trigger),
    createdAt: input.createdAt ?? new Date().toISOString(),
    pagePath: input.pagePath ?? getCurrentPagePath()
  };
}

export function appendUpgradeInterest(
  input: UpgradeInterestInput
): VlxUpgradeInterestRecord {
  const record = createUpgradeInterestRecord(input);

  if (!canUseLocalStorage()) {
    return record;
  }

  try {
    const nextStore = [...readUpgradeInterestStore(), record];

    window.localStorage.setItem(
      VLX_UPGRADE_INTEREST_STORAGE_KEY,
      JSON.stringify(nextStore)
    );
  } catch {
    // Paid beta interest should never block the learning flow.
  }

  return record;
}
