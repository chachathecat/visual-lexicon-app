# Pricing / Paywall v2 Implementation Sequence

Status: planning sequence after the contract PR.

This sequence keeps Pricing / Paywall v2 implementation small, reviewable, and
aligned with Track B safety rules. The current PR is docs/tests only and must
not implement runtime UI.

## Preflight

Before runtime work starts:

1. Read `docs/PRICING_PAYWALL_V2_CONTRACT.md`.
2. Confirm the work stays inside Track B app code, docs, tests, and safe static
   data.
3. Confirm no Webflow, Cloudflare Workers, auth, billing, payment, DNS,
   deployment settings, secrets, production data, real user data, route handler,
   middleware, AI Tutor, provider SDK, checkout, subscription, invoice, billing
   portal, webhook, or real payment surface is required.
4. Confirm no real payment is connected yet.
5. Confirm upgrade interest capture is beta interest / local evidence only.
6. Confirm public paid beta remains blocked.
7. Confirm private/manual beta remains gated.

## Sequence

1. Contract guard PR
   - Add `docs/PRICING_PAYWALL_V2_CONTRACT.md`.
   - Add `docs/PRICING_PAYWALL_V2_IMPLEMENTATION_SEQUENCE.md`.
   - Add file-based tests that verify required plan positioning, trigger IDs,
     beta gates, validation commands, and safety boundaries.
   - Link the docs from `README.md` because they define the next Track B pricing
     and paywall contract before runtime implementation.
   - Do not change runtime behavior.

2. Existing pricing inventory
   - Map current `/pricing` copy and placeholders to Free, Lite, Pro, and Exam
     Pack contract language.
   - Preserve approved routes.
   - Preserve the current no-checkout, no-real-payment beta behavior.
   - Identify any copy that could imply billing is connected.

3. Plan copy alignment
   - Update runtime copy only in the future implementation PR.
   - Use the required positioning:
     - Free: Start remembering your first words.
     - Lite: Build a daily visual memory habit.
     - Pro: Fix weak words and prepare for exams.
     - Exam Pack: guided 30-day visual vocabulary plan.
   - Avoid claims that payment, subscriptions, AI Tutor, Exam Pack purchase, or
     live paid access is available.

4. Trigger model alignment
   - Represent these trigger IDs consistently:
     - `save_limit`
     - `review_limit`
     - `pack_preview_end`
     - `weak_words_sprint_locked`
     - `mastery_export_locked`
     - `no_watermark_download`
     - `mistake_explanation_locked`
   - Keep trigger copy tied to real local evidence.
   - If runtime trigger types still use transitional names, migrate them in a
     scoped implementation PR with tests.

5. Evidence read model
   - Read saved-word, review, daily, and pack progress evidence only from the
     approved local contracts.
   - Treat `vlx_upgrade_interest_v1` as beta interest / local evidence only.
   - Do not mutate review state, review events, daily stats, pack progress,
     account state, billing state, entitlement state, production data, or real
     user data from a paywall prompt.

6. Safe interest capture
   - Preserve local beta interest capture when no safe placeholder URL is
     configured.
   - Preserve the meaning of `Paid beta interest noted locally. Billing is not
     connected.`
   - Placeholder URLs, if configured, must remain beta interest destinations,
     not checkout or subscription destinations.
   - No real payment, payment SDK, checkout, invoice, billing portal, webhook,
     subscription, or paid entitlement grant is allowed.

7. Pricing and prompt implementation
   - Update `/pricing` and prompt copy in a future runtime PR only.
   - Keep Exam Pack as a guided 30-day visual vocabulary plan with honest
     preview and locked-state language.
   - Keep public paid beta blocked and private/manual beta gated in page and
     prompt copy where relevant.
   - Do not add large route groups.

8. Tests and manual QA
   - Add or update runtime tests for `/pricing`, safe local interest capture,
     safe placeholder URL behavior, all trigger IDs, and forbidden payment
     surfaces.
   - Run browser QA for `/pricing`, save limit, review limit, pack preview end,
     weak sprint locked, mastery export locked, no-watermark download, and
     mistake explanation locked flows.
   - Document manual QA notes, risk, rollback, and safety confirmation.

## Required Validation

Run these commands before finishing a Pricing / Paywall v2 contract or runtime
PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/pricing-paywall-v2-contract.spec.ts --workers=1
```

Runtime implementation PRs should also run the broader gates required by
`AGENTS.md` when behavior changes.

## Stop And Ask

Stop for explicit approval if the implementation requires any of these:

- Webflow publishing.
- Cloudflare production Worker changes.
- DNS changes.
- Payment, Paddle, Stripe, billing, invoice, checkout, subscription, billing
  portal, or webhook changes.
- Auth or login behavior changes.
- Production user data modification.
- Deleting R2 objects or CMS items.
- Exposing, moving, or requesting secrets.
- Deployment setting changes.
- Real user data changes.

If approval is not explicit, keep the work local to Track B app code, docs,
tests, and safe static data.
