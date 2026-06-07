"use client";

import { useState } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import type { VlxPlanId } from "@/lib/entitlements";

type PaidPreviewPlan = Extract<VlxPlanId, "lite" | "pro">;

type UpgradePlaceholderButtonProps = {
  plan: PaidPreviewPlan;
  label: string;
  source: string;
};

export function UpgradePlaceholderButton({
  plan,
  label,
  source
}: UpgradePlaceholderButtonProps) {
  const [clicked, setClicked] = useState(false);

  function handleClick() {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.upgradeClick, {
      plan,
      source,
      userState: "guest"
    });
    setClicked(true);
  }

  return (
    <div className="upgrade-placeholder">
      <button
        className="button button--quiet"
        onClick={handleClick}
        type="button"
      >
        {label}
      </button>
      {clicked ? (
        <p className="upgrade-placeholder__note" role="status">
          Upgrade interest noted locally. Billing is not connected.
        </p>
      ) : null}
    </div>
  );
}
