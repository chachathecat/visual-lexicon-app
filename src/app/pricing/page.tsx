import type { Metadata } from "next";
import Link from "next/link";

import { TrackBAppShell } from "@/components/track-b";
import { CheckIcon } from "@/components/track-b/icons";
import { UpgradePlaceholderButton } from "@/components/upgrade-placeholder-button";
import { VLX_PLAN_DEFINITIONS } from "@/lib/entitlements";
import type { VlxUpgradePlan } from "@/lib/upgrade/upgrade-targets";

export const metadata: Metadata = {
  title: "Pricing"
};

type PricingOption = {
  id: "free" | VlxUpgradePlan;
  name: string;
  cadence: string;
  outcome: string;
  detail: string;
  features: readonly string[];
  cta: string;
  ariaLabel?: string;
  primary?: boolean;
};

const tiers = [
  {
    id: "free",
    name: "Free",
    cadence: "$0 · Available now",
    outcome: VLX_PLAN_DEFINITIONS.free.outcome,
    detail: "Start a visual review habit with the words you save.",
    features: [
      "Save visual words for review",
      "Practice short active-recall sessions",
      "Track what's due, weak, and mastered"
    ],
    cta: "Start free review"
  },
  {
    id: "lite",
    name: "Lite",
    cadence: "Early access preview",
    outcome: VLX_PLAN_DEFINITIONS.lite.outcome,
    detail:
      "For learners who want saved words to keep moving through daily due and weak review.",
    features: [
      "Save more words as your library grows",
      "Keep daily due and weak-word practice moving",
      "Build a consistent review habit"
    ],
    cta: "I'm interested in Lite",
    ariaLabel: "I'm interested in Lite",
    primary: true
  },
  {
    id: "pro",
    name: "Pro",
    cadence: "Early access preview",
    outcome: VLX_PLAN_DEFINITIONS.pro.outcome,
    detail:
      "For learners using mistake history and weak state to repair recall before Academic, IELTS, and GRE work.",
    features: [
      "Repair weak words with focused practice",
      "Prepare with Academic, IELTS, and GRE packs",
      "Get clearer help with recurring mistakes"
    ],
    cta: "I'm interested in Pro",
    ariaLabel: "I'm interested in Pro"
  },
  {
    id: "exam_pack",
    name: "Exam Pack",
    cadence: "Add-on preview",
    outcome: "Follow a guided visual vocabulary plan.",
    detail:
      "A guided 30-day visual vocabulary plan tied to preview, review, mistakes, and weak repair.",
    features: [
      "Choose an Academic, IELTS, or GRE study path",
      "Move from preview to review and weak-word repair",
      "Follow a focused 30-day routine"
    ],
    cta: "I'm interested in Exam Pack",
    ariaLabel: "I'm interested in Exam Pack"
  }
] as const satisfies readonly PricingOption[];

function TierCard({ tier }: { tier: (typeof tiers)[number] }) {
  const isPrimary = "primary" in tier && tier.primary === true;
  const buttonClass = isPrimary
    ? "track-b-button track-b-button--primary"
    : "track-b-button track-b-button--quiet";

  return (
    <article
      className={`pricing-v2-plan-card${
        isPrimary ? " pricing-v2-plan-card--primary" : ""
      }`}
      data-plan-id={tier.id}
    >
      <div className="pricing-v2-plan-card__copy">
        <h2>{tier.name}</h2>
        <p className="pricing-v2-plan-card__tagline">{tier.outcome}</p>
        <p className="pricing-v2-plan-card__cadence">{tier.cadence}</p>
        <p className="pricing-v2-plan-card__detail">{tier.detail}</p>
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
        <Link className={buttonClass} href="/dashboard" prefetch={false}>
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
            Early access preview
          </div>
          <h1 id="pricing-v2-heading">Choose how you want to remember.</h1>
          <p>
            Start free today, or explore the plans we&apos;re shaping for deeper
            review and exam prep. Paid plans aren&apos;t available to purchase yet.
          </p>
        </header>

        <section className="pricing-v2-plan-grid" aria-label="Pricing options">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </section>

        <p
          aria-label="Early access terms"
          className="pricing-v2-note"
          role="note"
        >
          Lite, Pro, and Exam Pack are previews and aren&apos;t available to buy
          yet. Interest buttons save your preference on this device only—no
          payment is taken and no paid features are unlocked.
        </p>
      </div>
    </TrackBAppShell>
  );
}
