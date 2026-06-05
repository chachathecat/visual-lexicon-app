import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Pricing"
};

const plans = [
  {
    name: "Free",
    price: "$0",
    notes: ["Sample review", "Local-only saved words", "Basic memory status"]
  },
  {
    name: "Lite",
    price: "Later",
    notes: ["Unlimited saved words", "Due and weak queues", "Weekly review habit"]
  },
  {
    name: "Pro",
    price: "Later",
    notes: ["Exam pack previews", "Advanced weak-word practice", "AI explanations later"]
  }
];

export default function PricingPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Pricing"
        title="Plan shells without payment logic."
        description="This route keeps future Lite and Pro surfaces visible while avoiding billing implementation."
      />

      <section className="pricing-grid" aria-label="Plan previews">
        {plans.map((plan) => (
          <article className="plan-card" key={plan.name}>
            <span className="eyebrow">{plan.name}</span>
            <h3 className="price">{plan.price}</h3>
            <ul className="muted-list">
              {plan.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
