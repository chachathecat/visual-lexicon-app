import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { UpgradePlaceholderButton } from "@/components/upgrade-placeholder-button";
import {
  VLX_PLAN_DEFINITIONS,
  type VlxPlanId
} from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Pricing"
};

const pricingPlanIds = ["free", "lite", "pro"] as const satisfies readonly VlxPlanId[];

const outcomeSteps = [
  {
    title: "Save words you meet",
    body: "A saved visual word becomes a review item, not a static bookmark."
  },
  {
    title: "Review before forgetting",
    body: "The due queue keeps words coming back while recall still needs work."
  },
  {
    title: "Repair weak words",
    body: "Repeated misses stay visible so practice can focus on the fragile memories."
  },
  {
    title: "Continue exam packs",
    body: "Exam paths can build on saved words, review state, and mistake history."
  }
] as const;

export default function PricingPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Pricing"
        title="Turn visual words into remembered words."
        description="This local MVP pricing surface is for paid beta positioning around a visual memory habit, weak-word repair, and an exam pack path. Billing is not connected, and upgrade actions are placeholders."
      />

      <section className="section" aria-labelledby="pricing-outcomes">
        <div className="section-heading">
          <h2 className="section-title" id="pricing-outcomes">
            Outcomes before features
          </h2>
          <span className="section-note">
            The paid beta should prove memory behavior before checkout.
          </span>
        </div>
        <div className="card-grid card-grid--two">
          {outcomeSteps.map((step, index) => (
            <article className="empty-state" key={step.title}>
              <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-grid" aria-label="Plan previews">
        {pricingPlanIds.map((planId) => {
          const plan = VLX_PLAN_DEFINITIONS[planId];
          const paidPreviewPlan =
            plan.id === "lite" || plan.id === "pro" ? plan.id : undefined;

          return (
            <article className="plan-card" key={plan.id}>
              <div className="plan-card__topline">
                <span className="eyebrow">{plan.label}</span>
                <span className="tag">{plan.priceLabel}</span>
              </div>
              <h2 className="price">{plan.outcome}</h2>
              <p>{plan.summary}</p>
              <ul className="muted-list">
                {plan.featureBullets.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="plan-card__note">{plan.availabilityNote}</p>
              {paidPreviewPlan ? (
                <UpgradePlaceholderButton
                  label={`Preview ${plan.label}`}
                  plan={paidPreviewPlan}
                  source="pricing_page"
                />
              ) : (
                <Link className="button button--primary" href="/dashboard">
                  Continue local review
                </Link>
              )}
            </article>
          );
        })}
      </section>

      <section className="settings-panel" aria-labelledby="guest-plan-note">
        <h2 className="section-title" id="guest-plan-note">
          Local MVP billing disclaimer
        </h2>
        <p className="settings-panel__body">
          Billing is not connected. Upgrade clicks only record local interest and
          placeholder analytics through vlx_upgrade_click. No real subscription
          is created.
        </p>
      </section>
    </div>
  );
}
