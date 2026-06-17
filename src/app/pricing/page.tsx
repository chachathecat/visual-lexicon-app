import type { Metadata } from "next";
import Link from "next/link";

import {
  TrackBAppShell,
  TrackBPageHeader,
  TrackBSection,
  TrackBUpgradeNudge
} from "@/components/track-b";
import { UpgradePlaceholderButton } from "@/components/upgrade-placeholder-button";
import {
  VLX_PLAN_DEFINITIONS,
  type VlxPlanId
} from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Pricing"
};

const pricingPlanIds = ["free", "lite", "pro"] as const satisfies readonly VlxPlanId[];

const planSupportCopy = {
  free: {
    badge: "Start",
    heading: "Start the local memory loop.",
    supportingValue:
      "Save a word, review it, and keep memory state in this browser.",
    memoryBullets: [
      "Saved words become review items",
      "Short local review sessions",
      "No paid access or account sync"
    ],
    ctaLabel: "Continue local review"
  },
  lite: {
    badge: "Habit",
    heading: "Daily memory habit.",
    supportingValue:
      "Lite is for returning each day before saved words fade.",
    memoryBullets: [
      "Daily due review positioning",
      "Saved-word queue management",
      "Interest capture only in this beta"
    ],
    ctaLabel: "Preview Lite"
  },
  pro: {
    badge: "Exam",
    heading: "Weak-word repair and exam prep.",
    supportingValue:
      "Pro is for repairing repeated misses and preparing exam vocabulary from real review state.",
    memoryBullets: [
      "Weak-word repair from mistakes",
      "Exam prep guided by review state",
      "No fake paid access or checkout"
    ],
    ctaLabel: "Preview Pro"
  }
} as const satisfies Record<
  (typeof pricingPlanIds)[number],
  {
    badge: string;
    heading: string;
    supportingValue: string;
    memoryBullets: readonly string[];
    ctaLabel: string;
  }
>;

const examPacks = [
  {
    title: "Academic Vocabulary",
    href: "/packs/academic-vocabulary",
    status: "Preview ready",
    body:
      "Abstract words for essays, lectures, and exam reading passages, backed by the current pack preview data."
  },
  {
    title: "IELTS Writing",
    href: "/packs/ielts-writing-vocabulary",
    status: "Plan placeholder",
    body:
      "A writing-focused visual vocabulary plan for Task 1 and Task 2. The route stays honest while word data is pending."
  },
  {
    title: "GRE Visual Verbal",
    href: "/packs/gre-visual-verbal",
    status: "Plan placeholder",
    body:
      "A planned verbal prep path for abstract GRE words and mistake-prone choices, linked to the existing safe pack route."
  }
] as const;

const paywallTriggers = [
  {
    title: "Save limit",
    plan: "Lite",
    body:
      "Free starts the first saved-word habit. Lite is positioned for a larger visual review library."
  },
  {
    title: "Review limit",
    plan: "Lite",
    body:
      "Free previews the daily loop. Lite is positioned for learners who want due and weak review to continue."
  },
  {
    title: "Pack preview end",
    plan: "Pro",
    body:
      "Exam Pack previews lead back to Pro positioning for exam prep managed through review state."
  },
  {
    title: "Weak Sprint tools",
    plan: "Pro",
    body:
      "Weak-word repair belongs with Pro positioning. Local review state still decides which words are weak."
  }
] as const;

const trustNotes = [
  "Progress is based on review history, not saved-only counts.",
  "Due, Weak, and Mastered depend on local SRS state and answer events.",
  "Upgrade actions collect interest only and never grant paid access.",
  "No checkout, billing, subscription, payment provider, entitlement mutation, account sync, or AI call is connected."
] as const;

const faqs = [
  {
    question: "What is Weekly Reviewed Words?",
    answer:
      "Weekly Reviewed Words counts words answered in review during the current week. It is the north-star behavior because saved words matter only when they come back for active recall."
  },
  {
    question: "What is the difference between Free, Lite, and Pro?",
    answer:
      "Free starts the memory loop, Lite is the daily memory habit plan, and Pro is weak-word repair and exam prep."
  },
  {
    question: "Are downloads watermarked?",
    answer:
      "Free download surfaces should remain watermarked where downloads exist. No-watermark, high-res download, and export are supporting Pro values."
  },
  {
    question: "Are AI features available now or later?",
    answer:
      "AI mistake explanations are later. The current app does not call AI and does not present AI as available."
  },
  {
    question: "What happens to saved words?",
    answer:
      "Saved words stay in browser-local storage and should become review items. Account sync is not implemented in this PR."
  }
] as const;

function PlanCard({ planId }: { planId: (typeof pricingPlanIds)[number] }) {
  const plan = VLX_PLAN_DEFINITIONS[planId];
  const support = planSupportCopy[planId];
  const paidPreviewPlan =
    plan.id === "lite" || plan.id === "pro" ? plan.id : undefined;

  return (
    <article className="pricing-v2-plan-card" data-plan-id={plan.id}>
      <div className="pricing-v2-plan-card__topline">
        <span className="pricing-v2-plan-card__badge">{support.badge}</span>
        <span className="pricing-v2-plan-card__price">{plan.priceLabel}</span>
      </div>
      <div className="pricing-v2-plan-card__copy">
        <p className="track-b-eyebrow">{plan.label}</p>
        <h2>{support.heading}</h2>
        <p>{support.supportingValue}</p>
      </div>
      <ul className="pricing-v2-feature-list">
        {support.memoryBullets.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="pricing-v2-plan-card__note">{plan.availabilityNote}</p>
      {paidPreviewPlan ? (
        <UpgradePlaceholderButton
          className="track-b-button track-b-button--primary"
          label={support.ctaLabel}
          plan={paidPreviewPlan}
          interestOnly
          source="pricing_page"
        />
      ) : (
        <Link
          className="track-b-button track-b-button--primary"
          href="/dashboard"
        >
          {support.ctaLabel}
        </Link>
      )}
    </article>
  );
}

export default function PricingPage() {
  return (
    <TrackBAppShell
      currentPath="/pricing"
      topActions={
        <Link className="track-b-button track-b-button--quiet" href="/dashboard">
          Back to Today
        </Link>
      }
    >
      <TrackBPageHeader
        description="Collect upgrade interest only for memory management. No checkout, no paid access, and no subscription is connected."
        eyebrow="Pricing"
        meta={<span>Interest-only. Public paid beta remains No-Go.</span>}
        title="Pricing"
      />

      <TrackBSection
        description="Lite = daily memory habit. Pro = weak-word repair and exam prep. Buttons record local interest only."
        id="pricing-v2-plans"
        title="Choose the memory habit"
      >
        <div className="pricing-v2-plan-grid" aria-label="Pricing plans">
          {pricingPlanIds.map((planId) => (
            <PlanCard key={planId} planId={planId} />
          ))}
        </div>
      </TrackBSection>

      <TrackBSection
        actions={
          <Link className="track-b-button track-b-button--quiet" href="/packs">
            View all packs
          </Link>
        }
        description="Exam Packs are guided visual vocabulary plans. Pricing points learners to the existing safe pack routes without creating entitlement state."
        id="pricing-v2-exam-packs"
        title="Exam Packs"
      >
        <div className="pricing-v2-pack-grid">
          {examPacks.map((pack) => (
            <article className="pricing-v2-pack-card" key={pack.title}>
              <div className="pricing-v2-pack-card__topline">
                <span className="track-b-eyebrow">{pack.status}</span>
              </div>
              <h3>{pack.title}</h3>
              <p>{pack.body}</p>
              <Link
                aria-label={`Open ${pack.title} pack plan`}
                className="track-b-button track-b-button--quiet"
                href={pack.href}
              >
                View plan
              </Link>
            </article>
          ))}
        </div>
      </TrackBSection>

      <TrackBSection
        description="These prompts are explanation surfaces only. They point to pricing or record local upgrade interest without mutating entitlement state."
        id="pricing-v2-paywall-triggers"
        title="When upgrade prompts appear"
      >
        <div className="pricing-v2-trigger-grid">
          {paywallTriggers.map((trigger) => (
            <article className="pricing-v2-trigger-card" key={trigger.title}>
              <div className="pricing-v2-trigger-card__topline">
                <h3>{trigger.title}</h3>
                <span>{trigger.plan}</span>
              </div>
              <p>{trigger.body}</p>
              <Link
                className="pricing-v2-inline-link"
                href="/pricing"
                aria-label={`Review ${trigger.title} upgrade explanation on pricing`}
              >
                Pricing explanation
              </Link>
            </article>
          ))}
        </div>
      </TrackBSection>

      <TrackBUpgradeNudge
        action={{
          href: "/packs",
          label: "Open packs"
        }}
        badgeLabel="Trust"
        body="No payment provider, checkout, subscription, invoice, billing portal, entitlement mutation, account sync, or AI call is introduced here."
        title="Pricing stays separate from entitlements"
      />

      <TrackBSection
        description="Trust copy keeps the paid beta boundary clear while the memory loop remains local."
        id="pricing-v2-trust"
        title="Safety and progress"
      >
        <ul className="pricing-v2-check-list">
          {trustNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </TrackBSection>

      <TrackBSection
        description="Short answers for the current no-payment paid beta surface."
        id="pricing-v2-faq"
        title="FAQ"
      >
        <div className="pricing-v2-faq-list">
          {faqs.map((faq) => (
            <article className="pricing-v2-faq-item" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </TrackBSection>
    </TrackBAppShell>
  );
}
