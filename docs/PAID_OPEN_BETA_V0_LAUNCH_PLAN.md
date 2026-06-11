# Visual Lexicon Paid Open Beta v0 Launch Plan

## Launch scope: paid open beta v0 / founding beta pass

This is the first external paid opening of Track B as **Visual Lexicon Founding Beta Pass**.
It is a **limited beta access program**, not a full subscription launch.

Planned release shape:

- Scope: Track B local-learning app only (web app at `app.visuallexicon.org` shell).
- Access model: one-time beta pass for limited cohorts (10 → 30 → 50 buyers).
- Distribution: manual sales + manual activation for MVP stability.
- Billing behavior: payment can be captured externally only. No active billing/subscription management exists in-app.
- Data/privacy posture: learning state remains local to browser storage and is not permanently account-bound in this phase.

## Why this is not a full subscription

This launch is intentionally positioned as beta access:

- It is a limited-capacity pass with an explicit “founding beta” message.
- There is no account-level active entitlement check inside the product.
- No recurring billing, billing portal, cancellation UI, or subscription resume flow is included.
- No guarantee of permanent progress or cross-device sync is promised.
- Core feature set is intentionally constrained to the already shipped local SRS MVP surfaces.

## What users get now

- Save words into local study set.
- Review loop based on local SRS memory state.
- Due/Weak/Mastered derivation from real local review state.
- Visual recall prompts and weak-word reinforcement path.
- Pack previews and local pack progress tracking.
- Dashboard memory mission with study pacing signals.
- Weak Words Sprint as a guided practice pattern.
- Beta feedback capture surfaces for product prioritization.
- Founding Beta Pass access and support handling for first cohorts.

## What is not included in v0

- No real in-app billing, subscription, invoice, or checkout flow.
- No Webflow publishing or external landing CMS dependency in this repository.
- No account sync, no cross-device state migration, no permanent cloud storage.
- No AI Tutor (or other post-SRS assistant features).
- No multilingual pack generation pipeline.
- No production analytics instrumentation or external BI dashboards.
- No completed exam pack claims (IELTS/GRE paid pack delivery commitments).
- No “active Pro” messaging or auto-entitlement statements.

## Required buyer disclosures

Every buyer-facing surface for this launch must include the following:

- This is **beta access**, not a full subscription.
- Billing/subscription is not connected inside the app.
- Progress is stored locally in the browser.
- Progress may reset during beta.
- AI Tutor is not included yet.
- Multilingual packs are not fully launched yet.
- Exam packs are preview/beta content.
- No permanent account sync is promised.
- Support is available for manual activation and beta issues only.

## Pricing recommendation

- Product name: **Visual Lexicon Founding Beta Pass**.
- Initial offer: **$19 USD one-time** OR **₩29,000 one-time**.
- Suggested purchase window: 30–60 days of beta access with clear date-limited messaging.
- Recommendation:
  - Show pricing as one-time beta access in all pages and emails.
  - Use the exact wording “Founding Beta Pass” and “limited availability.”
  - Add a short note that product evolution, quotas, and exact pricing can change in later beta phases.
- Regional variants:
  - Default display in KRW for KR users, USD fallback for international.

## Draft refund/support policy

- Refund window: 7 calendar days from purchase for documented payment errors or material access failures.
- Immediate eligibility for refund:
  - No access granted after confirmed payment.
  - Duplicate purchase for same email/identity with no value delivered.
  - Critical blocking bug preventing any review or deck loading for >24 hours after manual access.
- Refund exclusion:
  - Change of mind after successful access and at least one day of use.
  - Non-critical feature requests or “missing future feature” expectations.
- Support workflow:
  - Manual ticket triage and confirmation within one business day.
  - Owner-level final approval required for all refunds.
- Dispute handling:
  - Maintain payment record references and buyer contact history.
  - Clearly state that in-bot behavior is beta, browser-local, and may change before public launch.

## Access workflow

1. Buyer completes payment via external link/payment page.
2. Owner confirms payment details in manual tracking sheet.
3. Owner enables access by sending beta link + instructions.
4. Owner sends required disclosures and support path.
5. Buyer confirms first login and first review flow on day of access.
6. Optional follow-up with week-one retention prompt.

Notes:

- Access remains manual in v0.
- Access workflow should be idempotent (re-send access pack link if buyer does not receive initial message).
- Any technical issue is treated as beta support, not entitlement incident.

## Feedback workflow

- Capture first-touch feedback within 24 hours of purchase.
- Collect:
  - first review experience
  - where user got stuck
  - whether Save → Review → Due/Weak/Mastered behavior works on device
  - payment-to-access gap
- Channel:
  - dedicated support inbox + tracking sheet.
- Weekly review:
  - categorize by bug / friction / missing feature / pricing clarity / support friction.
  - label high-impact blockers for immediate triage.

## Stop conditions

Stop sales immediately if any condition occurs:

- Security or privacy incident linked to local storage flow.
- More than 20% of buyers report blocked review due to app runtime errors for 24+ hours.
- Repeated payment confirmation confusion due to unsupported beta framing.
- More than 2 duplicate access incidents in a 24-hour period from manual activation process.
- Any evidence of false “full subscription” expectations set in support messages.

## Launch checklist

- Finalize and publish three doc artifacts:
  - `docs/PAID_OPEN_BETA_V0_LAUNCH_PLAN.md`
  - `docs/PAID_OPEN_BETA_V0_COPY.md`
  - `docs/PAID_OPEN_BETA_V0_OPERATIONS.md`
- Confirm copy contains required disclosures in English and Korean.
- Prepare and validate payment links + UTM/source tracking fields (external).
- Confirm manual access template and no hidden billing assumptions.
- Run final repository readiness checks (`typecheck`, `lint`, `build`, `test`).
- Verify app still uses local save/review-only and no runtime billing/auth behavior.
- Confirm support inbox and owner escalation path are live.
- Start with cohort cap at 10 buyers and lock sales at threshold.
- Publish buyer guidance and release status in team notes.

## Owner sign-off checklist

- [ ] The product is explicitly communicated as “Founding Beta Pass”.
- [ ] No copy uses “subscription”, “active plan”, “lifetime account”, “sync”, or equivalent promises.
- [ ] Required disclosures are present in all channels.
- [ ] Pricing is one-time and beta-scoped.
- [ ] Refund + support policies are published.
- [ ] Manual workflow tested for at least one onboarding and one refund edge case.
- [ ] Cohort caps (10 → 30 → 50) and stop-sales logic are configured.
- [ ] QA safety confirmation recorded (no checkout/payment/auth/deployment/Cloudflare/Webflow changes).

## Success metrics for first 10, 30, and 50 buyers

### First 10 buyers (founding cohort)

- Target: 80% first-login completion
- Target: 70% complete at least 1 review session in 72 hours
- Target: 60% mark at least 3 Weak Words Sprint attempts in week 1
- Target: 100% disclosed issues responded within 24 hours

### First 30 buyers (stability cohort)

- Target: 60% weekly review completion among active buyers
- Target: 40% show at least one Weak Words Sprint and at least one deck progress change
- Target: Support volume under 1.5 tickets per 10 buyers/week
- Target: 90% access confirmation without follow-up needed
- Target: <10% requests tied to unclear beta framing

### First 50 buyers (controlled scale cohort)

- Target: 50% weekly review completion among active buyers
- Target: 35% retention into week 2 review loop
- Target: <2 critical production issues/week (any critical issue defined as blocked review flow for 24h+ for >10% users)
- Target: Support + refund handling turnaround within 1 business day median
- Target: At least 30% of users provide explicit product feedback
- Decision gate: proceed to next beta phase only after post-cohort review and sign-off on framing, stability, and support burden.
