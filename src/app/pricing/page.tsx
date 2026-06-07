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

export default function PricingPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Pricing"
        title="Choose the memory loop you need."
        description="Free, Lite, and Pro are shown as entitlement shells only. No billing provider, checkout, or active subscription is connected in this local MVP."
      />

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
          Guest access remains local
        </h2>
        <p className="settings-panel__body">
          Guest mode keeps browser-only state, a five-card sample, and no account
          sync. Upgrades are placeholders until real billing and account
          entitlements are added deliberately.
        </p>
      </section>
    </div>
  );
}
