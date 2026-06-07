"use client";

import { useEffect, useState } from "react";

import {
  readLocalPlanState,
  resolveEntitlement,
  VLX_PLAN_STATE_STORAGE_KEY,
  type VlxResolvedEntitlement
} from "@/lib/entitlements";

function formatLimit(value: number | "unlimited") {
  return value === "unlimited" ? "Unlimited" : String(value);
}

export function LocalPlanStatePanel() {
  const [entitlement, setEntitlement] = useState<VlxResolvedEntitlement>(() =>
    resolveEntitlement()
  );

  useEffect(() => {
    setEntitlement(resolveEntitlement(readLocalPlanState()));
  }, []);

  const { plan, state } = entitlement;

  return (
    <section className="settings-panel" aria-labelledby="local-plan-state">
      <div className="settings-panel__topline">
        <div>
          <span className="eyebrow">Entitlement</span>
          <h2 className="section-title" id="local-plan-state">
            Local plan state
          </h2>
        </div>
        <span className="tag">{plan.label}</span>
      </div>

      <p className="settings-panel__body">
        {plan.summary} This is a local skeleton, not a paid subscription record.
      </p>

      <dl className="detail-list">
        <div className="detail-row">
          <dt>Storage key</dt>
          <dd>{VLX_PLAN_STATE_STORAGE_KEY}</dd>
        </div>
        <div className="detail-row">
          <dt>Source</dt>
          <dd>{state.source}</dd>
        </div>
        <div className="detail-row">
          <dt>Saved words</dt>
          <dd>{formatLimit(plan.limits.savedWordsLimit)}</dd>
        </div>
        <div className="detail-row">
          <dt>Daily review</dt>
          <dd>{formatLimit(plan.limits.dailyReviewLimit)}</dd>
        </div>
        <div className="detail-row">
          <dt>Account sync</dt>
          <dd>{plan.limits.accountSync ? "Available" : "Not connected"}</dd>
        </div>
        <div className="detail-row">
          <dt>Billing</dt>
          <dd>{plan.availabilityNote}</dd>
        </div>
      </dl>
    </section>
  );
}
