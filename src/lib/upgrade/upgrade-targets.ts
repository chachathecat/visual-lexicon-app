import type { VlxPlanId } from "@/lib/entitlements";

export type VlxUpgradePlan = Extract<VlxPlanId, "lite" | "pro">;

const UNKNOWN_UPGRADE_SOURCE = "unknown";

function getConfiguredUpgradeUrl(plan: VlxUpgradePlan) {
  const planUrl =
    plan === "lite"
      ? process.env.NEXT_PUBLIC_LITE_PAYMENT_URL
      : process.env.NEXT_PUBLIC_PRO_PAYMENT_URL;

  return planUrl?.trim() || process.env.NEXT_PUBLIC_PAID_BETA_FORM_URL?.trim();
}

function parseExternalHttpUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function normalizeUpgradeSource(source: unknown) {
  if (typeof source !== "string") {
    return UNKNOWN_UPGRADE_SOURCE;
  }

  const normalized = source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);

  return normalized || UNKNOWN_UPGRADE_SOURCE;
}

export function hasConfiguredUpgradeUrl(plan: VlxUpgradePlan) {
  return Boolean(parseExternalHttpUrl(getConfiguredUpgradeUrl(plan)));
}

export function getUpgradeTarget(
  plan: VlxUpgradePlan,
  source: unknown
): string | null {
  const url = parseExternalHttpUrl(getConfiguredUpgradeUrl(plan));

  if (!url) {
    return null;
  }

  url.searchParams.set("plan", plan);
  url.searchParams.set("source", normalizeUpgradeSource(source));

  return url.toString();
}
