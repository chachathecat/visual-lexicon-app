"use client";

import { useState } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import type { VlxPlanId } from "@/lib/entitlements";
import { appendUpgradeInterest } from "@/lib/upgrade/upgrade-interest";
import { getUpgradeTarget } from "@/lib/upgrade/upgrade-targets";

type PaidPreviewPlan = Extract<VlxPlanId, "lite" | "pro">;

type UpgradePlaceholderButtonProps = {
  plan: PaidPreviewPlan;
  label: string;
  source: string;
  trigger?: string;
};

export function UpgradePlaceholderButton({
  plan,
  label,
  source,
  trigger
}: UpgradePlaceholderButtonProps) {
  const [clicked, setClicked] = useState(false);
  const upgradeTarget = getUpgradeTarget(plan, source);

  function recordUpgradeClick() {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.upgradeClick, {
      plan,
      source,
      userState: "guest"
    });

    appendUpgradeInterest({
      plan,
      source,
      trigger
    });
  }

  function handleClick() {
    recordUpgradeClick();
    setClicked(true);
  }

  return (
    <div className="upgrade-placeholder">
      {upgradeTarget ? (
        <a
          className="button button--quiet"
          href={upgradeTarget}
          onClick={recordUpgradeClick}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>
      ) : (
        <button
          className="button button--quiet"
          onClick={handleClick}
          type="button"
        >
          {label}
        </button>
      )}
      {clicked ? (
        <p className="upgrade-placeholder__note" role="status">
          Paid beta interest noted locally. Billing is not connected.
        </p>
      ) : null}
    </div>
  );
}
