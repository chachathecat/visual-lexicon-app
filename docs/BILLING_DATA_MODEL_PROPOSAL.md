# Billing Data Model Proposal

Proposal date: 2026-06-11

Scope: planning only. This document proposes production v1 billing and
entitlement entities for Visual Lexicon Track B. It does not create database
migrations, add provider SDKs, add checkout, process webhooks, add secrets,
change runtime behavior, mutate production data, or deploy.

## Model Principles

- `userId` from account persistence owns entitlements.
- Provider records are evidence; internal entitlement snapshots are the app read
  model.
- Billing state must not overwrite learning state.
- Refunds, cancellations, chargebacks, failed payments, and manual grants must
  be auditable.
- Local storage and upgrade interest are migration signals only.
- No table stores card numbers, payment credentials, secrets, or raw provider
  payloads beyond approved, redacted audit fields.

## `billing_customers`

| Field | Proposal |
| --- | --- |
| Purpose | Maps a Track B account to the billing provider customer or manual beta billing identity. |
| Key fields | `id`, `userId`, `provider`, `providerCustomerRef`, `manualAccessRef`, `emailHash`, `country`, `currency`, `createdAt`, `updatedAt`, `deletedAt`. |
| Unique constraints | `userId + provider`; provider customer references unique per provider when present. |
| Indexes | `userId`, `provider + providerCustomerRef`, `createdAt`, `deletedAt`. |
| Privacy/retention notes | Store provider references, not card details. Retain as required for receipts, refunds, chargebacks, tax, and support. |
| Relationship to auth/account persistence | Requires stable `userId`; must be created only after account identity exists. |
| Relationship to server SRS sync | Does not affect SRS state; only gates access to learning surfaces through entitlement snapshots. |
| Migration risk | Anonymous or local interest records can be linked to the wrong account if identity is not validated. |
| Prohibited shortcuts | Do not use email alone as account ownership. Do not store payment credentials. Do not create customer rows from `vlx_plan_state_v1`. |

## `subscriptions`

| Field | Proposal |
| --- | --- |
| Purpose | Durable record of recurring plan state for Lite, Pro, or future paid tiers. |
| Key fields | `id`, `userId`, `billingCustomerId`, `provider`, `providerSubscriptionRef`, `planId`, `status`, `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`, `cancelAtPeriodEnd`, `canceledAt`, `endedAt`, `graceEndsAt`, `createdAt`, `updatedAt`. |
| Unique constraints | Provider subscription reference unique per provider; at most one current paid plan per user unless multi-plan support is explicitly designed. |
| Indexes | `userId + status`, `provider + providerSubscriptionRef`, `status + currentPeriodEnd`, `planId + status`. |
| Privacy/retention notes | Keep minimal provider references and lifecycle timestamps. Retention may differ from learning data because billing records support legal and tax obligations. |
| Relationship to auth/account persistence | Subscription cannot grant access without a valid account owner. Account deletion requires a billing-retention policy instead of silent deletion. |
| Relationship to server SRS sync | Subscription can unlock review capacity but cannot create, modify, or fake review state/events. |
| Migration risk | Importing local placeholder Lite/Pro state as a subscription would create fake paid access. |
| Prohibited shortcuts | Do not infer active subscription from checkout redirect, pricing click, upgrade interest, or localStorage. |

## `subscription_events`

| Field | Proposal |
| --- | --- |
| Purpose | Append-only event log for subscription changes from provider webhooks, test-mode events, manual grants, and support repairs. |
| Key fields | `id`, `userId`, `subscriptionId`, `provider`, `providerEventRef`, `eventType`, `eventStatus`, `occurredAt`, `receivedAt`, `idempotencyKey`, `payloadHash`, `actorType`, `actorId`, `createdAt`. |
| Unique constraints | `provider + providerEventRef`; optional `provider + idempotencyKey`. |
| Indexes | `subscriptionId + occurredAt`, `userId + occurredAt`, `eventType + occurredAt`, `receivedAt`. |
| Privacy/retention notes | Store redacted payload summaries and hashes, not full sensitive provider payloads unless approved. |
| Relationship to auth/account persistence | Events must resolve to a known `userId` before provisioning access, except quarantined unmatched events. |
| Relationship to server SRS sync | Event history can explain why a review surface was gated, but it must not mutate SRS state. |
| Migration risk | Duplicate webhook retries can duplicate state transitions if provider event IDs are not unique. |
| Prohibited shortcuts | Do not update entitlements from unverifiable client events. Do not overwrite history in place. |

## `entitlement_snapshots`

| Field | Proposal |
| --- | --- |
| Purpose | Current server-side app read model used to decide which surfaces a user can access. |
| Key fields | `id`, `userId`, `planId`, `status`, `features`, `limits`, `source`, `sourceRefs`, `effectiveAt`, `expiresAt`, `lastEventId`, `snapshotReason`, `createdAt`, `updatedAt`. |
| Unique constraints | One current snapshot per `userId`; optional unique `userId + source + sourceRef` for source-specific snapshots. |
| Indexes | `userId + updatedAt`, `status + expiresAt`, `planId + status`, `source + updatedAt`. |
| Privacy/retention notes | Contains access metadata, not payment credentials. Include in account export as entitlement history/read model where policy requires. |
| Relationship to auth/account persistence | Read by account-owned app sessions after auth; anonymous guests get no server snapshot. |
| Relationship to server SRS sync | Gates queues, pack access, and limits while preserving review events and state as the SRS source of truth. |
| Migration risk | Snapshot recomputation bugs can over-grant or under-grant access. |
| Prohibited shortcuts | Do not let the frontend write snapshots. Do not derive snapshots from `vlx_plan_state_v1` or `vlx_upgrade_interest_v1`. |

## `pack_purchases`

| Field | Proposal |
| --- | --- |
| Purpose | Account-bound one-time ownership or access grants for specific packs or bundles. |
| Key fields | `id`, `userId`, `billingCustomerId`, `packId`, `packVersion`, `provider`, `providerPaymentRef`, `status`, `purchasedAt`, `refundedAt`, `revokedAt`, `expiresAt`, `createdAt`, `updatedAt`. |
| Unique constraints | Active purchase unique on `userId + packId`; provider payment reference unique per provider. |
| Indexes | `userId + status`, `userId + packId`, `packId + status`, `status + updatedAt`. |
| Privacy/retention notes | Keep receipt references and access status; do not store payment method details. |
| Relationship to auth/account persistence | Requires stable account ownership; guest purchase is not allowed for production. |
| Relationship to server SRS sync | Unlocks pack content/review entry, but pack progress remains derived from pack actions and review events. |
| Migration risk | Treating static pack preview completion as purchase can create fake ownership. |
| Prohibited shortcuts | Do not grant pack ownership from URL params, localStorage, or pricing page clicks. |

## `payment_receipts`

| Field | Proposal |
| --- | --- |
| Purpose | Support-safe record of invoice, order, or receipt evidence for subscriptions and one-time pack purchases. |
| Key fields | `id`, `userId`, `billingCustomerId`, `provider`, `providerReceiptRef`, `providerInvoiceRef`, `subscriptionId`, `packPurchaseId`, `amount`, `currency`, `taxAmount`, `status`, `paidAt`, `voidedAt`, `createdAt`, `updatedAt`. |
| Unique constraints | Provider receipt/invoice reference unique per provider. |
| Indexes | `userId + paidAt`, `provider + providerReceiptRef`, `status + paidAt`, `subscriptionId`, `packPurchaseId`. |
| Privacy/retention notes | Store amounts and receipt references only. Do not store card PAN, CVC, bank credentials, or raw payment credentials. |
| Relationship to auth/account persistence | Receipts must resolve to an account for app access and support. |
| Relationship to server SRS sync | Receipt can explain entitlement access but cannot alter review state, pack progress, or mastery. |
| Migration risk | Receipts from external/manual payment paths can be hard to reconcile without account IDs and idempotency keys. |
| Prohibited shortcuts | Do not use receipt existence alone as access when refund/chargeback/revocation state exists. |

## `refund_events`

| Field | Proposal |
| --- | --- |
| Purpose | Append-only record of refunds, chargebacks, disputes, reversals, and support compensation events. |
| Key fields | `id`, `userId`, `paymentReceiptId`, `subscriptionId`, `packPurchaseId`, `provider`, `providerRefundRef`, `eventType`, `amount`, `currency`, `reason`, `accessEffect`, `occurredAt`, `receivedAt`, `actorType`, `actorId`, `createdAt`. |
| Unique constraints | Provider refund/dispute reference unique per provider; support action idempotency key unique when present. |
| Indexes | `userId + occurredAt`, `paymentReceiptId`, `eventType + occurredAt`, `accessEffect + occurredAt`. |
| Privacy/retention notes | Refund reason may be sensitive support data. Keep concise controlled values and separate private notes if needed. |
| Relationship to auth/account persistence | Refund handling must map to account ownership and support history. |
| Relationship to server SRS sync | Refund can remove future pack or paid feature access; it must not delete review events created while access was valid. |
| Migration risk | External/manual refunds can leave entitlement snapshots stale if not entered into the audit path. |
| Prohibited shortcuts | Do not delete subscriptions or purchases to represent refunds. Do not silently erase audit history. |

## `billing_audit_log`

| Field | Proposal |
| --- | --- |
| Purpose | Immutable internal audit trail for entitlement decisions, support actions, manual grants, repairs, and safety overrides. |
| Key fields | `id`, `userId`, `targetType`, `targetId`, `action`, `reason`, `beforeHash`, `afterHash`, `actorType`, `actorId`, `requestId`, `createdAt`. |
| Unique constraints | Optional `requestId` uniqueness for idempotent support tools. |
| Indexes | `userId + createdAt`, `targetType + targetId`, `actorType + actorId + createdAt`, `action + createdAt`. |
| Privacy/retention notes | Avoid secrets and full provider payloads. Keep enough detail for compliance, support, and rollback. |
| Relationship to auth/account persistence | Audit rows attach to account IDs and support operator identities. |
| Relationship to server SRS sync | Can record entitlement-related support decisions but should not directly repair SRS state; SRS repairs need their own audit path. |
| Migration risk | Manual grants without audit create unsupported paid access. |
| Prohibited shortcuts | Do not allow unaudited admin writes. Do not mutate audit rows after creation. |

## `upgrade_interest`

| Field | Proposal |
| --- | --- |
| Purpose | Product/marketing signal from pricing and paywall CTAs before billing exists. |
| Key fields | `id`, `userId`, `anonymousId`, `plan`, `source`, `trigger`, `pagePath`, `clientCreatedAt`, `serverReceivedAt`, `idempotencyKey`, `createdAt`. |
| Unique constraints | `userId + idempotencyKey` or `anonymousId + idempotencyKey` when provided. |
| Indexes | `userId + createdAt`, `anonymousId + createdAt`, `plan + createdAt`, `source + createdAt`. |
| Privacy/retention notes | Treat as interest/lead data. Include account-linked rows in export/delete according to policy. |
| Relationship to auth/account persistence | Can be anonymous first, then linked to `userId` through an explicit migration/attribution path. |
| Relationship to server SRS sync | No impact on review state, due queues, pack progress, or mastery. |
| Migration risk | Duplicate guest-to-account imports can overcount interest. |
| Prohibited shortcuts | Do not use interest as subscription, receipt, pack purchase, or paid access proof. |

## Cross-Entity Relationships

- `billing_customers.userId` references account persistence.
- `subscriptions.billingCustomerId` references `billing_customers`.
- `subscription_events.subscriptionId` appends state changes for
  `subscriptions`.
- `payment_receipts` reference a subscription, pack purchase, or both when a
  provider model requires it.
- `refund_events` reference receipts and update entitlement recomputation.
- `pack_purchases` create pack-specific entitlement sources.
- `entitlement_snapshots` are recomputed from subscriptions, pack purchases,
  refund events, manual grants, and audit-approved repairs.
- `upgrade_interest` is intentionally outside the entitlement source chain.

## Migration Notes

- Do not migrate `vlx_plan_state_v1` into paid access.
- Import `vlx_upgrade_interest_v1` only as `upgrade_interest`.
- Manual/private beta access should be represented as a clearly labeled manual
  source with start/end dates and audit rows.
- Any future provider migration must preserve provider references, entitlement
  effective dates, refunds, and canceled states before enabling access.
- If auth or server SRS sync is incomplete, do not start real billing migration.

## Recommendation

Treat this model as a proposal. A future implementation PR should add migrations
only after auth/account persistence, server SRS sync, provider decision,
support/refund/legal copy, and deployment readiness are approved.
