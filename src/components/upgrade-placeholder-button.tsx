"use client";

import { useState } from "react";

import { emitVlxEvent, VLX_ANALYTICS_EVENTS } from "@/lib/analytics";
import { appendUpgradeInterest } from "@/lib/upgrade/upgrade-interest";
import {
  getUpgradeTarget,
  type VlxUpgradePlan
} from "@/lib/upgrade/upgrade-targets";

type UpgradePlaceholderButtonProps = {
  plan: VlxUpgradePlan;
  label: string;
  source: string;
  className?: string;
  interestOnly?: boolean;
  ariaLabel?: string;
  trigger?: string;
};

export function UpgradePlaceholderButton({
  ariaLabel,
  className = "button button--quiet",
  interestOnly = false,
  plan,
  label,
  source,
  trigger
}: UpgradePlaceholderButtonProps) {
  const [clicked, setClicked] = useState(false);
  const upgradeTarget = interestOnly ? null : getUpgradeTarget(plan, source);

  function recordUpgradeClick() {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.pricingInterest, {
      plan,
      source,
      trigger
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
          aria-label={ariaLabel}
          className={className}
          href={upgradeTarget}
          onClick={recordUpgradeClick}
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>
      ) : (
        <button
          aria-label={ariaLabel}
          className={className}
          onClick={handleClick}
          type="button"
        >
          {label}
        </button>
      )}
      {clicked ? (
        <p className="upgrade-placeholder__note" role="status">
          Paid beta interest noted locally. Billing is not connected yet.
        </p>
      ) : null}
    </div>
  );
}
