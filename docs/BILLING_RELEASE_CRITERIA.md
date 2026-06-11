# Billing Release Criteria

Criteria date: 2026-06-11

Scope: strict go/no-go criteria for billing and entitlement release decisions.
This document does not authorize real payment, provider SDKs, checkout,
webhooks, subscriptions, payment links, billing portals, secrets, Webflow,
Cloudflare Worker changes, DNS changes, production data mutation, or deployment.

## No-Payment Private Beta

Go criteria:

- No real in-app payment exists.
- Access is manual invite/access only.
- Pricing and paywall surfaces clearly say billing is not connected.
- Local storage caveats are visible where relevant.
- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due, Weak, and Mastered are derived from real local review state.
- Support owner can handle beta access questions.
- Validation commands pass or failures are documented.

No-go criteria:

- Any real payment, checkout, payment link, subscription, or provider SDK is
  added without explicit approval.
- Copy implies active paid subscription support.
- Copy implies cross-device paid access before account entitlements exist.
- Local plan state is treated as paid proof.

## Paid Open Beta

Go criteria:

- Explicit approval exists for paid open beta.
- Account persistence is live enough to bind access to `userId`.
- Server SRS sync is validated for saved words, review events, review state,
  daily stats, and pack progress.
- Entitlement snapshots exist server-side.
- Payment path is external/manual or provider test-to-live approved with clear
  caveats.
- Refund, cancellation, failed-payment, support, and access-end behavior are
  documented.
- User-facing copy says beta and does not claim full production SaaS.
- Stop-sales and rollback procedure is written.

No-go criteria:

- Users can pay before account-bound entitlement exists.
- Refund/cancel/support workflow is undefined.
- Billing state is frontend-only or localStorage-only.
- Provider, tax/VAT, and support responsibilities are unassigned.

## Production Paid SaaS

Go criteria:

- Account creation, sign-in, sign-out, recovery, and session handling are live
  and tested.
- Server-side SRS sync is live and idempotent.
- Entitlement snapshots are server-side and recomputed from audited billing
  events.
- Billing provider is approved and implemented behind verified server events.
- Checkout, webhook, subscription, receipt, refund, cancellation,
  failed-payment, and expired-plan flows are tested.
- Legal copy, pricing copy, refund policy, cancellation policy, privacy policy,
  terms, support copy, and billing disclosures are approved.
- Analytics can report Weekly Reviewed Words and paid funnel behavior.
- Monitoring covers account, sync, billing, entitlement, review, pack, and
  deployment failures.
- Stop-sales and rollback have assigned owners and a rehearsed procedure.
- Manual production QA is recorded.

No-go criteria:

- Billing can grant access without server event evidence.
- Users can pay without durable account ownership.
- Due, Weak, Mastered, pack progress, or dashboard metrics can be faked.
- Refunds, cancellations, chargebacks, or failed payments do not update access.
- Required validation commands fail without explicit owner acceptance.

## Subscription Launch

Go criteria:

- Plan IDs, limits, and feature gates are approved.
- Subscription states are modeled: pending, trialing, active, past due, grace,
  canceled pending period end, canceled, unpaid, expired, and revoked.
- Webhook or provider event ingestion is verified and idempotent.
- Entitlement snapshots update from subscription events.
- Cancellation and renewal copy is accurate.
- Failed payment and grace policy is implemented and tested.
- Support can locate subscription, receipt, status, and access reason.

No-go criteria:

- Active access is inferred from a checkout redirect alone.
- Subscription state is stored only in localStorage.
- Cancellation at period end and immediate cancellation are not distinguished.
- Failed-payment behavior is undefined.

## One-Time Pack Launch

Go criteria:

- Pack purchase entitlement is unique per `userId + packId`.
- Pack purchase, refund, chargeback, revoke, and receipt states are modeled.
- Pack access is separable from Lite/Pro subscription access.
- Pack progress remains derived from pack actions and review events.
- Refund behavior preserves learning history while removing future access where
  policy requires.
- Support can locate purchase, receipt, refund, and entitlement state.

No-go criteria:

- Pack ownership is inferred from localStorage, URL params, preview completion,
  or pricing interest.
- Pack purchase grants full subscription access accidentally.
- Refunded pack access remains active without policy approval.
- Pack progress is faked from purchase state.

## Prohibited Claims

Do not claim:

- Active subscription support before real billing exists.
- Pack purchase ownership before account-bound pack entitlement exists.
- Cross-device paid access before account entitlements exist.
- Refund/cancel support before support workflow is defined.
- Production paid SaaS readiness before account, sync, billing, support,
  refund, legal, deployment, and monitoring systems are validated.
- AI Tutor or mistake explanations before a separate AI implementation is
  approved and shipped.
- Mastery, due counts, weak counts, streaks, or pack progress unless they come
  from real review state/events.

## Launch Decision Template

```txt
Decision: Go / No-Go / Conditional Go
Release type: Private beta / Paid open beta / Production paid SaaS
Launch owner:
Billing owner:
Support owner:
Rollback owner:
Provider:
MoR/tax owner:
Validation results:
Manual QA results:
Open P0 gaps:
Accepted P1 gaps:
Stop-sales triggers:
Rollback procedure:
Safety confirmation:
```

Safety confirmation must state whether Webflow, Cloudflare Workers, auth,
billing runtime, DNS, payment settings, secrets, production data, deployment
settings, real payment, checkout, webhooks, provider SDKs, AI Tutor
functionality, and multilingual page generation were touched.

## Recommendation

No-payment private beta can continue only with clear caveats. Paid open beta and
production paid SaaS should not launch until auth/account persistence,
server-side SRS sync, server-side entitlement snapshots, support/refund/legal
copy, and production deployment readiness are validated.
