import type { Metadata } from "next";
import Link from "next/link";

import { TrackBAppShell } from "@/components/track-b";
import { CheckIcon } from "@/components/track-b/icons";
import { UpgradePlaceholderButton } from "@/components/upgrade-placeholder-button";

export const metadata: Metadata = {
  title: "Early Access"
};

const tiers = [
  {
    id: "free",
    name: "Preview",
    cadence: "Free to start",
    tagline: "Try the core memory loop.",
    features: [
      "Save up to 30 words",
      "Visual memory cards",
      "Basic spaced review",
      "Due state tracking"
    ],
    cta: "Request preview access",
    ariaLabel: undefined,
    primary: false
  },
  {
    id: "lite",
    name: "Daily",
    cadence: "Beta - pricing TBD",
    tagline: "Build a daily memory habit.",
    features: [
      "Unlimited saved words",
      "Daily review reminders",
      "Weak word detection",
      "Weekly memory summary",
      "Priority review queue"
    ],
    cta: "Join the waitlist",
    ariaLabel: "Join paid beta",
    primary: true
  },
  {
    id: "pro",
    name: "Scholar",
    cadence: "Beta - pricing TBD",
    tagline: "Prepare for exams. Fix weak words.",
    features: [
      "Everything in Daily",
      "Exam-mode timed review",
      "Deep-dive on weak words",
      "Confidence tracking over time",
      "Early access to new features"
    ],
    cta: "Request early access",
    ariaLabel: undefined,
    primary: false
  }
] as const;

function TierCard({ tier }: { tier: (typeof tiers)[number] }) {
  const buttonClass = tier.primary
    ? "track-b-button track-b-button--primary"
    : "track-b-button track-b-button--quiet";

  return (
    <article
      className={`pricing-v2-plan-card${
        tier.primary ? " pricing-v2-plan-card--primary" : ""
      }`}
      data-plan-id={tier.id}
    >
      <div className="pricing-v2-plan-card__copy">
        <h2>{tier.name}</h2>
        <p className="pricing-v2-plan-card__tagline">{tier.tagline}</p>
        <p className="pricing-v2-plan-card__cadence">{tier.cadence}</p>
      </div>
      <ul className="pricing-v2-feature-list">
        {tier.features.map((feature) => (
          <li key={feature}>
            <span aria-hidden="true">
              <CheckIcon size={9} strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>
      {tier.id === "free" ? (
        <Link className={buttonClass} href="/dashboard">
          {tier.cta}
        </Link>
      ) : (
        <UpgradePlaceholderButton
          ariaLabel={tier.ariaLabel}
          className={buttonClass}
          interestOnly
          label={tier.cta}
          plan={tier.id}
          source="pricing_page"
        />
      )}
    </article>
  );
}

export default function PricingPage() {
  return (
    <TrackBAppShell activeItemId="pricing" currentPath="/pricing">
      <div className="pricing-v2-page">
        <header
          className="pricing-v2-beta-hero"
          aria-labelledby="pricing-v2-heading"
        >
          <div className="pricing-v2-beta-hero__pill">
            <span aria-hidden="true" />
            Paid beta - not publicly available
          </div>
          <h1 id="pricing-v2-heading">Early access</h1>
          <p>
            Visual Lexicon is invite-only during beta. Leave your interest and
            we&apos;ll reach out before we open spots.
          </p>
        </header>

        <section className="pricing-v2-plan-grid" aria-label="Early access tiers">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </section>

        <p className="pricing-v2-note">
          Visual Lexicon is collecting paid beta interest only. No checkout is
          live. No pricing is final. Submitting does not create an account or
          charge a card.
        </p>
      </div>
    </TrackBAppShell>
  );
}
