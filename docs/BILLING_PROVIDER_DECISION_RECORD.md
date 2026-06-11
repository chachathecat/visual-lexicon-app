# Billing Provider Decision Record

Decision date: 2026-06-11

Status: No provider selected as implemented.

Scope: planning only. This decision record compares provider options for future
Visual Lexicon Track B billing. It does not add provider SDKs, checkout,
webhooks, payment links, subscriptions, billing portal behavior, secrets,
provider IDs, price IDs, product IDs, production data writes, or deployment
changes.

## Decision Context

Visual Lexicon should not implement real payment until account persistence and
server-side SRS sync are validated. Paid access must attach to an account and
must gate real review surfaces without corrupting memory state.

The provider decision needs to account for:

- Korea/operator fit.
- Merchant of Record (MoR) implications.
- Subscription support for Lite/Pro.
- One-time pack purchase support.
- Tax/VAT burden.
- Support/refund/chargeback complexity.
- Implementation and operational complexity.

## Source Notes

Official docs reviewed for this planning record:

- Stripe Tax and Billing docs:
  `https://docs.stripe.com/tax`,
  `https://docs.stripe.com/billing/subscriptions/overview`,
  `https://docs.stripe.com/payments/checkout`
- Paddle developer docs:
  `https://developer.paddle.com/get-started/how-paddle-works/`
- Lemon Squeezy docs:
  `https://docs.lemonsqueezy.com/help/payments/merchant-of-record`,
  `https://docs.lemonsqueezy.com/help/products/subscriptions`,
  `https://docs.lemonsqueezy.com/help/products/single-payment`
- PortOne developer docs:
  `https://developers.portone.io/api/rest-v2`,
  `https://developers.portone.io/api/rest-v2/payment.billingKey`

Provider terms, country support, tax scope, and MoR availability can change.
Re-check official docs and contracts before implementation.

## Stripe

Pros:

- Mature APIs, Checkout, Billing, subscription lifecycles, invoices, customer
  portal, webhooks, and strong developer ecosystem.
- Supports subscriptions and one-time payments with a wide range of payment
  methods.
- Stripe Tax can help calculate and manage tax obligations when configured.
- Good fit for a custom entitlement snapshot architecture.

Cons:

- Stripe is not a simple MoR answer by default. The operator generally remains
  responsible for merchant, tax, refund, support, and compliance decisions
  unless using specific services that shift some responsibilities.
- More operational ownership for tax/VAT, disputes, support, and legal copy.
- Korea/operator availability, settlement, and preferred local payment methods
  need separate verification.

Korea/operator fit:

- Strong if the operator wants control and can handle merchant/tax operations.
- Weaker if the operator wants MoR-style global tax and buyer support handled
  by the provider.

MoR implications:

- Treat as non-MoR unless a specific Stripe program and contract says
  otherwise.

Subscription support:

- Strong.

One-time pack support:

- Strong.

Tax/VAT burden:

- Medium to high for the operator. Stripe Tax can help, but the business must
  still validate registration, filing, and support responsibilities.

Implementation complexity:

- Medium. Good docs and SDKs, but entitlement correctness depends on webhook
  verification, idempotency, and server-side state.

Support/refund complexity:

- Medium to high because the operator owns more customer support and policy.

## Paddle

Pros:

- Positions itself as a developer-first Merchant of Record for SaaS, apps, AI,
  and digital products.
- Handles global payments, tax, subscriptions, refunds/chargebacks, and buyer
  support in the MoR model.
- Supports subscription lifecycle concepts and one-time products.
- Good fit when the operator wants reduced tax/VAT and chargeback operations.

Cons:

- MoR model means provider checkout, terms, buyer support, refund process, and
  payout constraints must fit the product.
- Product approval, country support, payout support, and Korean operator
  onboarding need verification.
- Entitlement implementation still requires robust webhooks and internal
  snapshots.

Korea/operator fit:

- Potentially strong for global SaaS if onboarding and payouts fit a
  Korea-based operator. Must be verified before commitment.

MoR implications:

- Strong MoR candidate. Provider takes on many payment/tax/refund obligations,
  but the app still owns product access and learning support.

Subscription support:

- Strong.

One-time pack support:

- Supported for one-time products/charges, subject to product modeling.

Tax/VAT burden:

- Lower for the operator than a non-MoR path, subject to contract.

Implementation complexity:

- Medium. Checkout and billing are provider-led, but entitlement state,
  idempotency, webhook handling, and support mapping remain app work.

Support/refund complexity:

- Medium. Buyer billing support may be partly provider-handled, but app access
  support and entitlement repair remain internal.

## Lemon Squeezy

Pros:

- Acts as Merchant of Record for digital products.
- Provides subscriptions, single payments, checkout, orders, refunds, customer
  portal, and webhooks.
- Simpler creator/digital-product posture may fit early paid experiments.

Cons:

- Need to verify country support, payout support, product approval, Korean
  operator fit, and SaaS subscription needs.
- May be less flexible than a fully custom Stripe integration for complex
  account, pack, organization, and support workflows.
- Entitlement snapshots and server-side access repair still need internal
  implementation.

Korea/operator fit:

- Possible fit for lightweight digital-product billing if onboarding and payout
  requirements work for the operator. Must be verified.

MoR implications:

- Strong MoR candidate based on official docs, subject to current terms.

Subscription support:

- Supported.

One-time pack support:

- Supported through single-payment products/orders.

Tax/VAT burden:

- Lower for the operator than a non-MoR path, subject to contract.

Implementation complexity:

- Low to medium for simple products; medium for robust entitlement, refund,
  support, and pack ownership architecture.

Support/refund complexity:

- Medium. Provider can handle payment pieces, but app-side access and support
  workflows remain required.

## PortOne

Pros:

- Strong Korea payment infrastructure orientation and local PG aggregation.
- Supports payment APIs, billing key APIs, payment cancellation, cash receipt
  areas, tax invoice APIs, and idempotency headers.
- Potentially good fit for KRW, Korean payment methods, and local operator
  workflows.

Cons:

- Not a default global MoR path based on the developer API posture. The operator
  should assume more responsibility for merchant, tax, refund, and support
  operations unless a separate contract says otherwise.
- Subscription SaaS behavior may require more custom billing-key scheduling and
  state management than provider-native SaaS billing tools.
- Global tax/VAT, non-Korea payment methods, and buyer support need separate
  operating design.

Korea/operator fit:

- Strong for Korean payment methods and local merchant operations.
- Needs careful review if the primary launch is global English-learning SaaS.

MoR implications:

- Treat as payment infrastructure, not MoR, unless contractually confirmed.

Subscription support:

- Possible through billing keys and scheduled payments, but likely more custom
  app responsibility than Stripe/Paddle/Lemon Squeezy.

One-time pack support:

- Strong for payment collection and cancellation flows.

Tax/VAT burden:

- Likely higher for the operator than MoR providers. Korean tax invoice/cash
  receipt requirements need specific review.

Implementation complexity:

- Medium to high for SaaS subscriptions because the app may own more lifecycle
  and entitlement logic.

Support/refund complexity:

- Medium to high. The operator likely owns more support, refunds, receipts, and
  local compliance workflow.

## Manual / Private Beta Access Codes

Pros:

- No real in-app payment, no provider SDK, no checkout, no webhooks, and minimal
  production billing risk.
- Fits private beta where the goal is learning-loop validation.
- Can use manual invite/access records with clear start/end dates.
- Keeps focus on auth, server SRS sync, entitlement contracts, and support
  workflow before charging.

Cons:

- Not scalable production billing.
- Manual access can drift without audit logs and expiration rules.
- Does not validate real payment failure, refund, cancellation, tax, or receipt
  flows.

Korea/operator fit:

- Strong for private beta operations, especially when the operator wants to
  validate learning retention before payment complexity.

MoR implications:

- No provider MoR. If money is collected externally, the operator owns all tax,
  receipt, refund, and support obligations.

Subscription support:

- No real subscription support.

One-time pack support:

- Manual access only. Do not claim account-bound pack purchase ownership unless
  an entitlement record exists.

Tax/VAT burden:

- None if no money is collected. High/manual if external payment is collected.

Implementation complexity:

- Low for no-payment access codes; medium if audit and expiration are modeled
  properly.

Support/refund complexity:

- Low with no payment. High/manual if external paid access is allowed.

## Recommended Staged Approach

### Private Beta

- Use no real in-app payment.
- Use manual invite/access only.
- Keep pricing and paywall copy framed as placeholders or interest capture.
- Do not add provider SDKs, checkout, payment links, webhooks, or subscription
  behavior.

### Paid Open Beta If Explicitly Approved

- Prefer an external/manual payment path only with written caveats, support
  process, refund policy, and account-bound entitlement records.
- Cap user count and access duration.
- Do not claim production subscription support.
- Treat this as an operational experiment, not a production SaaS launch.

### Production v1

- Choose a real provider only after account persistence and server-side SRS sync
  are validated.
- For lowest tax/support burden, re-evaluate Paddle and Lemon Squeezy as MoR
  candidates.
- For maximum customization, re-evaluate Stripe with explicit tax/support
  ownership.
- For Korea-first local payment strategy, re-evaluate PortOne with explicit
  operator tax and subscription lifecycle ownership.
- Implement provider integration behind feature flags, with test-mode checkout,
  webhook verification, idempotency, entitlement snapshots, support/refund QA,
  and stop-sales rollback.

## Decision

Do not select or implement a provider in this PR. The next safe step is
Production deployment/domain readiness, while billing remains architecture-only
until account persistence, server SRS sync, support/refund/legal copy, and
deployment readiness are validated.
