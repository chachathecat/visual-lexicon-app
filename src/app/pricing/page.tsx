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
    cadence: "$0 local starter",
    outcome: VLX_PLAN_DEFINITIONS.free.outcome,
    detail:
      "Start with a focused browser-local memory loop before any paid beta access exists.",
    features: [
      "Save the first visual words into local review",
      "Practice short active-recall sessions",
      "See Due, Weak, and Mastered only from real review state"
    ],
    cta: "Start free review"
  },
  {
    id: "lite",
    name: "Lite",
    cadence: "Paid beta interest",
    outcome: VLX_PLAN_DEFINITIONS.lite.outcome,
    detail:
      "For learners who want saved words to keep moving through daily due and weak review.",
    features: [
      "Expanded save and review capacity positioning",
      "Daily due queue and weak-word habit emphasis",
      "No active subscription or paid entitlement is created"
    ],
    cta: "Note Lite interest - billing not connected yet",
    ariaLabel: "Note Lite interest - billing not connected yet",
    primary: true
  },
  {
    id: "pro",
    name: "Pro",
    cadence: "Paid beta interest",
    outcome: VLX_PLAN_DEFINITIONS.pro.outcome,
    detail:
      "For learners using mistake history and weak state to repair recall before exams.",
    features: [
      "Weak Sprint and mastery export positioning",
      "Exam-prep review and pack access planning",
      "Mistake explanations later, after the SRS loop works"
    ],
    cta: "Note Pro interest - billing not connected yet",
    ariaLabel: "Note Pro interest - billing not connected yet"
  },
  {
    id: "exam_pack",
    name: "Exam Pack",
    cadence: "Planned add-on interest",
    outcome: "Follow a guided visual vocabulary plan.",
    detail:
      "A guided 30-day visual vocabulary plan tied to preview, review, mistakes, and weak repair.",
    features: [
      "Academic Vocabulary, IELTS Writing, and GRE Visual Verbal positioning",
      "Preview continues to real review evidence before any unlock",
      "No in-app purchase or full-pack access is active"
    ],
    cta: "Note Exam Pack interest - billing not connected yet",
    ariaLabel: "Note Exam Pack interest - billing not connected yet"
  }
] as const satisfies readonly PricingOption[];

const paywallReasons = [
  {
    id: "save_limit",
    title: "Save limit",
    body: "You reached the free saved-word limit from local saved-word evidence."
  },
  {
    id: "review_limit",
    title: "Review limit",
    body: "You reached today's free review limit from local daily review evidence."
  },
  {
    id: "pack_preview_end",
    title: "Pack preview end",
    body: "You completed a real pack preview and full-pack access is still gated."
  },
  {
    id: "weak_words_sprint_locked",
    title: "Weak Sprint locked",
    body: "You have weak words from review misses or weakScore."
  },
  {
    id: "mastery_export_locked",
    title: "Mastery export locked",
    body: "You asked to use mastery evidence outside the app."
  },
  {
    id: "no_watermark_download",
    title: "No-watermark download",
    body: "You asked for a clean visual download before asset delivery is approved."
  },
  {
    id: "mistake_explanation_locked",
    title: "Mistake explanation locked",
    body: "You made a wrong answer that may support a future explanation."
  }
] as const;

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
            Public paid beta blocked
          </div>
          <h1 id="pricing-v2-heading">Pricing</h1>
          <p>
            Build a visual memory habit before words fade. Billing is not
            connected yet, and upgrade actions record beta interest only.
          </p>
        </header>

        <section className="pricing-v2-plan-grid" aria-label="Pricing options">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </section>

        <section
          className="pricing-v2-trigger-panel"
          aria-labelledby="pricing-v2-trigger-heading"
        >
          <div>
            <span className="eyebrow">Why paywalls appear</span>
            <h2 className="section-title" id="pricing-v2-trigger-heading">
              Paywalls follow learning evidence.
            </h2>
          </div>
          <div className="pricing-v2-trigger-grid">
            {paywallReasons.map((reason) => (
              <article data-paywall-reason={reason.id} key={reason.id}>
                <h3>{reason.title}</h3>
                <p>{reason.body}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="pricing-v2-note">
          Visual Lexicon is collecting paid beta interest only. Billing is not
          connected yet. No checkout is live. No pricing is final, public paid
          beta remains blocked, and private/manual beta remains gated.
        </p>
      </div>
    </TrackBAppShell>
  );
}
