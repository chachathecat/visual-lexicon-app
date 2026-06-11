# Billing Entitlement Architecture

Architecture date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document does
not implement real billing, add a payment provider SDK, create checkout,
process webhooks, create subscriptions, add payment links, add secrets, touch
Webflow, touch Cloudflare Workers, touch DNS, mutate production data, change
auth runtime behavior, deploy, or change current runtime app behavior.

## Goal

Define the production v1 billing and entitlement architecture that can later
support paid Visual Lexicon learning access without weakening the product loop:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> Weekly Reviewed Words
```

Billing should unlock account-bound learning capacity, pack access, and support
expectations. It must never fake mastery, due queues, weak words, pack progress,
or review outcomes.

## Non-Goals

- Do not choose a final billing provider as implemented.
- Do not install Stripe, Paddle, Lemon Squeezy, PortOne, or any payment SDK.
- Do not add checkout, billing portal, subscription, invoice, webhook, or
  payment-link runtime behavior.
- Do not add provider IDs, product IDs, price IDs, secrets, or environment
  variables.
- Do not change pricing CTAs beyond documentation.
- Do not claim paid launch, subscription support, refund support, or
  cross-device paid access is ready.

## Why Billing Must Wait

Billing should wait until auth/account persistence and server-side SRS sync are
validated because paid access must belong to an account and must gate real
learning state.

- Without account persistence, there is no durable owner for a subscription,
  pack purchase, refund, cancellation, or support case.
- Without server SRS sync, a paying learner could lose progress across devices
  or receive paid claims backed only by browser storage.
- Without append-only review events, support cannot diagnose whether Due, Weak,
  Mastered, pack progress, or Weekly Reviewed Words are real.
- Without server entitlement state, local plan state or upgrade-interest events
  could be mistaken for paid access.

The correct order is:

```txt
Auth/account persistence -> Server SRS sync -> Billing entitlement architecture
-> support/refund/legal copy -> deployment readiness -> real payment approval
```

## Release Types

| Release type | Payment posture | Entitlement posture | Required framing |
| --- | --- | --- | --- |
| Private beta | No real in-app payment. Manual invite or access only. | Local or manually assigned beta access. No paid entitlement claim. | Limited beta, local storage caveats, no production billing. |
| Paid open beta | Only if explicitly approved. External/manual payment path may be used with caveats. | Account-bound entitlements must exist before claiming paid access. | Beta access, limited support, refund policy, no full SaaS claim. |
| Production v1 | Real public paid service. | Server-side entitlement source of truth with provider-backed events. | Production service with account, sync, billing, support, refund, legal, and rollback systems. |

## Plan Model

| Plan or access type | Intended meaning | Entitlement requirements |
| --- | --- | --- |
| Guest | Browser-local trial of the memory loop. | No paid entitlement. Local state can unlock only guest surfaces. |
| Free | Account-bound starter learning tier. | Server account exists; free limits are server-defined. |
| Lite | Paid habit tier for full due review and weak-word practice. | Active server entitlement from subscription or approved manual beta grant. |
| Pro | Paid exam/advanced tier for packs, weak sprint, and future mistake explanations. | Active server entitlement with Pro feature flags and no fake AI claims. |
| Pack purchase | One-time account-bound access to a specific pack or pack bundle. | Server purchase entitlement tied to `userId + packId` and receipt/refund state. |
| Teacher/School future | Future classroom, seat, or organization access. | Separate organization and seat model. Do not force into individual subscriptions. |

Lite and Pro are product labels, not proof of payment. A plan label becomes real
only when a server entitlement snapshot says the user has access.

## Entitlement Principles

- Entitlements are account-bound and server-owned.
- Billing provider events are evidence, not the app's final read model.
- The app should read an internal `entitlement_snapshots` view for gating.
- Local storage can cache the last known entitlement for UI continuity, but it
  cannot grant paid access by itself.
- Upgrade interest is a lead signal, not an entitlement.
- A refund, chargeback, expired period, canceled access end, failed payment, or
  manual support revocation must be able to remove or downgrade access.
- Entitlements gate surfaces; they do not alter SRS truth.
- Pack access and subscription plan access must be separable.
- Every support mutation needs an audit reason and operator identity.

## Server-Side Entitlement Source Of Truth

Production v1 should use internal account-owned tables:

- `billing_customers`: maps `userId` to a provider customer reference or manual
  beta access record.
- `subscriptions`: current and historical subscription state.
- `subscription_events`: provider/manual event log.
- `pack_purchases`: account-bound one-time pack ownership state.
- `payment_receipts` or `invoices`: receipt records safe for support lookup.
- `refund_events`: refund, chargeback, dispute, and reversal history.
- `entitlement_snapshots`: current app read model for gating.
- `billing_audit_log`: support and system decisions.
- `upgrade_interest`: interest capture that remains non-entitling.

The app should gate against `entitlement_snapshots`, not directly against
provider checkout sessions, localStorage, or frontend plan state.

## Plan State Lifecycle

```txt
guest_local
  -> free_account
  -> trialing_or_beta_grant
  -> active_paid
  -> past_due_or_grace
  -> canceled_pending_period_end
  -> expired_or_revoked
  -> free_account
```

Rules:

- Guest state can become account state only through the auth migration path.
- Free account state is the default when no active entitlement exists.
- Trial or beta grants must have explicit start, end, source, and audit fields.
- Active paid access requires a subscription, pack purchase, or manual grant.
- Expired, refunded, charged back, or revoked access must downgrade surfaces
  without deleting learning data.

## Subscription Lifecycle

Expected states:

```txt
none -> pending_checkout -> trialing -> active -> past_due -> grace
-> canceled_pending_period_end -> canceled -> expired
```

Implementation requirements for a future PR:

- Create no subscription until the account identity is known.
- Accept provider state only from verified server-side events or admin repair.
- Use idempotency keys for subscription creation, updates, and support actions.
- Recompute entitlement snapshots from subscription events.
- Keep cancellation timing explicit: immediate revoke versus period-end access.
- Preserve learning data after downgrade unless account deletion is requested.

## One-Time Pack Purchase Lifecycle

Expected states:

```txt
none -> pending_payment -> active -> refunded_or_charged_back -> revoked
```

Rules:

- Pack entitlement is unique per `userId + packId`.
- Pack purchase does not imply Lite or Pro subscription.
- Subscription access to a pack and one-time purchase access must be modeled as
  separate entitlement sources.
- Refund or chargeback removes future access but should not delete legitimate
  review events already created from that pack.
- Pack progress must stay derived from review or pack events, not purchase
  state alone.

## Refund, Cancellation, Failed-Payment, And Expired-Plan Lifecycle

| Event | Entitlement effect | Learning data effect | Support requirement |
| --- | --- | --- | --- |
| Refund | Revoke refunded paid access unless policy says otherwise. | Preserve review state/events; do not fake pack progress. | Record refund reason, actor, receipt, and access effect. |
| Cancellation at period end | Keep access until paid-through date. | Preserve all learning data. | Show clear end date in account/support views. |
| Immediate cancellation | Revoke paid surfaces immediately. | Preserve all learning data. | Require explicit support/user action reason. |
| Failed payment | Move to `past_due` or grace based on policy. | Preserve all learning data. | Notify user and avoid silent data loss. |
| Expired plan | Downgrade to Free or Guest-accessible surfaces. | Preserve saved/review state subject to account policy. | Keep audit trail for why access ended. |
| Chargeback/dispute | Revoke or freeze paid access based on policy. | Preserve learning data; do not delete evidence. | Escalate to support workflow. |

## Entitlement Gating Surfaces

Gating should be server-driven for:

- Save limits and full saved library access.
- Due review queue size and unlimited review.
- Weak-word practice and weak sprint.
- Pro/exam pack access.
- Pack detail pages and review from paid packs.
- Mastery export or progress history if later shipped.
- Mistake explanation only after AI is separately approved and implemented.
- No-ads marker or premium positioning.
- Future teacher/school seats and class packs.

Gating must not affect:

- Whether a review answer writes an event.
- Whether real SRS state updates after an accepted review answer.
- Whether Due, Weak, and Mastered are derived from review state.
- Whether existing learning data is preserved after downgrade.

## What localStorage Can And Cannot Do

Allowed:

- Keep guest/local learning usable before account persistence exists.
- Cache the last known entitlement snapshot for display continuity.
- Record local upgrade interest while billing is not connected.
- Preserve local Save -> Review -> SRS behavior in private beta.

Not allowed:

- Prove an active subscription.
- Prove pack ownership.
- Override a server refund, cancellation, failed payment, or revocation.
- Grant cross-device paid access.
- Be migrated into paid access from `vlx_plan_state_v1`.
- Turn `vlx_upgrade_interest_v1` into a subscription or receipt.

## Migration From Placeholder Pricing And Interest Capture

Current pricing and paywall surfaces are placeholders. They may show planned
Lite/Pro labels, use optional external URLs, and record local upgrade interest.
The production migration should:

- Keep `vlx_upgrade_interest_v1` as interest history only.
- Import interest records as `upgrade_interest` rows after account persistence
  exists, with dedupe and anonymous-to-account attribution.
- Do not migrate `vlx_plan_state_v1` as paid proof.
- Replace placeholder CTA copy only after provider, support, refund, and legal
  copy are approved.
- Make existing pricing pages state clearly when billing is not connected.
- Add server entitlement snapshots before claiming paid access.

## Production Risks

- Local-only plan state could be mistaken for a real paid entitlement.
- Users could pay before account persistence exists and lose access mapping.
- Provider webhook retries could duplicate grants or revocations.
- Refund/cancel/support states could be undefined and create inconsistent
  access.
- Pack purchases could be confused with subscription access.
- Failed payment behavior could silently remove study access without support
  copy.
- Tax/VAT and Merchant of Record assumptions could be wrong for the operator.
- Pricing copy could claim subscription, pack ownership, or cross-device access
  before those systems exist.

## P0 / P1 / P2 Implementation Plan

### P0

- Approve billing architecture, data model, provider decision record, rollout
  plan, and release criteria.
- Keep real billing out of runtime.
- Define server entitlement snapshot contracts and status vocabulary.
- Define support/refund/cancellation policy requirements.
- Confirm auth and server SRS sync are prerequisites for paid launch.

### P1

- Add type-only contracts and mock entitlement fixtures in a disconnected path.
- Add tests for pure status derivation only if helpers are introduced.
- Draft legal/support/refund/cancellation copy.
- Decide provider after Korea/operator, MoR, tax, subscription, and pack
  purchase requirements are reviewed.
- Define feature flags for future test-mode checkout and webhook contracts.

### P2

- Implement test-mode provider integration only after explicit approval.
- Add webhook verification, idempotency, entitlement snapshot recomputation, and
  support/admin audit tests.
- Run entitlement QA across subscription, pack purchase, refund, cancel, failed
  payment, expired plan, and manual grant paths.
- Rehearse rollback and stop-sales before production payment is enabled.

## Rollback And Stop-Sales Strategy

Architecture-only rollback:

- Revert docs, README links, and type-only contracts.
- No data migration or production rollback is required.

Future billing rollback:

- Disable checkout creation with a server-side feature flag.
- Remove or hide paid CTAs that initiate payment.
- Continue honoring already-paid access according to policy while stopping new
  sales.
- Freeze entitlement snapshot recomputation only if it is corrupting access;
  otherwise continue processing refunds/cancellations.
- Preserve audit logs and provider events for repair.
- Publish user-facing status/support copy before resuming sales.

Stop-sales triggers:

- Entitlement snapshots grant paid access without provider/manual evidence.
- Refund, cancellation, failed-payment, or expiry states cannot be processed.
- Webhook verification or idempotency fails.
- Account persistence or server SRS sync is degraded enough to risk paid data.
- Pricing/legal/support copy is inaccurate.

## Recommendation

Do not implement real payment or paid launch until auth/account persistence,
server-side SRS sync, billing entitlement architecture, support/refund/legal
copy, and production deployment readiness are validated.
