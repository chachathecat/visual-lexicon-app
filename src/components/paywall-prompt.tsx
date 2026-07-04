"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import {
  emitVlxEvent,
  VLX_ANALYTICS_EVENTS,
  type VlxAnalyticsUserState
} from "@/lib/analytics";
import type { VlxPaywallPrompt } from "@/lib/paywall";
import { appendUpgradeInterest } from "@/lib/upgrade/upgrade-interest";

function formatMetricLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatPlanLabel(plan: VlxPaywallPrompt["recommendedPlan"]) {
  return plan === "exam_pack" ? "Exam Pack" : plan;
}

type PaywallPromptProps = {
  prompt: VlxPaywallPrompt;
  userState?: VlxAnalyticsUserState;
};

export function PaywallPrompt({
  prompt,
  userState = "guest"
}: PaywallPromptProps) {
  const titleId = useId();
  const [clicked, setClicked] = useState(false);
  const metrics = Object.entries(prompt.reasonMetrics ?? {});

  useEffect(() => {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.paywallView, {
      plan: prompt.recommendedPlan,
      source: prompt.source
    });
  }, [prompt.id, prompt.recommendedPlan, prompt.source, userState]);

  function recordUpgradeClick() {
    emitVlxEvent(VLX_ANALYTICS_EVENTS.paywallInterest, {
      plan: prompt.recommendedPlan,
      source: prompt.source,
      trigger: prompt.id
    });

    appendUpgradeInterest({
      plan: prompt.recommendedPlan,
      source: prompt.source,
      trigger: prompt.id
    });
  }

  function handleUpgradeClick() {
    recordUpgradeClick();
    setClicked(true);
  }

  return (
    <section
      aria-labelledby={titleId}
      className="paywall-prompt"
      data-paywall-trigger={prompt.id}
    >
      <div className="paywall-prompt__body">
        <span className="eyebrow">{formatPlanLabel(prompt.recommendedPlan)}</span>
        <h2 className="section-title" id={titleId}>
          {prompt.title}
        </h2>
        <p>{prompt.body}</p>
        <p className="paywall-prompt__gate">
          Public paid beta remains blocked. Private/manual beta remains gated.
        </p>
        {metrics.length > 0 ? (
          <dl className="paywall-prompt__metrics" aria-label="Trigger reason">
            {metrics.map(([key, value]) => (
              <div key={key}>
                <dt>{formatMetricLabel(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="paywall-prompt__action">
        <button
          className="button button--primary"
          onClick={handleUpgradeClick}
          type="button"
        >
          {prompt.primaryCtaLabel}
        </button>
        {clicked ? (
          <p className="upgrade-placeholder__note" role="status">
            Paid beta interest noted locally. Billing is not connected yet.
          </p>
        ) : null}
        <Link className="button button--quiet" href="/pricing" prefetch={false}>
          Compare plans
        </Link>
      </div>
    </section>
  );
}
