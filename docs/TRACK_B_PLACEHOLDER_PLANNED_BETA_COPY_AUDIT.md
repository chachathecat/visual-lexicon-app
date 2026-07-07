# Track B Placeholder / Planned Beta Copy Audit

Date: 2026-07-07 KST

## Executive Summary

This audit clarifies Track B placeholder, planned feature, private/manual beta,
and public paid beta language after the v3 readiness and manual QA reports.

Current result:

- P0 unsafe paid-access copy found in current runtime surfaces: `0`
- Private/manual beta: conditional owner-gated candidate only
- Public paid beta: No-Go
- Billing is not connected yet.
- No checkout is live.
- This records beta interest only.
- This does not grant paid access.
- No real paid entitlement is active.

This is a copy, docs, and tests safety pass. It does not add product features,
payment SDKs, checkout routes, billing routes, subscription behavior, real paid
entitlement behavior, analytics SDKs, tracking pixels, or public paid beta
unblock.

## Search Inventory

Searched code, tests, docs, and README for:

```txt
placeholder
planned
beta
private beta
public paid beta
paid beta
billing
checkout
payment
subscription
entitlement
unlock
Pro unlocks
Exam Pack unlocks
AI mistake explanation
export
no-watermark
IELTS
GRE
launched
live
active
```

Inventory and classification:

| Surface | Files | Classification | Disposition |
| --- | --- | --- | --- |
| Pricing page | `src/app/pricing/page.tsx` | Needs clearer interest-only copy; needs clearer no-real-entitlement copy | Updated paywall reason copy away from active "unlocks" language and toward planned / interest-only language. |
| Paywall evaluator and prompt | `src/lib/paywall/triggers.ts`, `src/components/paywall-prompt.tsx` | Needs clearer interest-only copy; needs clearer no-real-entitlement copy | Updated prompt bodies to include billing not connected, no checkout live, beta interest only, no paid access, and no real paid entitlement active. |
| Upgrade interest button | `src/components/upgrade-placeholder-button.tsx` | Needs clearer interest-only copy | Updated clicked status to state interest does not grant paid access. |
| Packs catalog and details | `src/components/views/packs-v2-view.tsx`, `src/lib/packs/preview.ts` | Needs clearer planned-content copy | Updated IELTS/GRE placeholder language to say preview plan is being prepared, private/manual beta requires owner approval, planned pack data is unavailable, and full IELTS/GRE content is not implied until real word data exists. |
| Settings and local plan state | `src/app/settings/page.tsx`, `src/components/local-plan-state-panel.tsx`, `src/lib/entitlements/local-entitlements.ts` | OK as-is with small clarity improvement | Local plan labels remain local skeletons; availability notes now state no checkout live or no real paid entitlement active where relevant. |
| Runtime entitlement read model | `src/app/api/me/entitlements/route.ts`, `src/lib/entitlements/server-read-model.ts`, `docs/TRACK_B_ENTITLEMENT_RUNTIME_READ_MODEL.md` | OK as-is | Existing route is read-only and returns guest/free only. It does not grant Lite, Pro, purchases, promotions, or manual grants. |
| v3 readiness and #176 manual QA docs | `docs/TRACK_B_V3_BETA_READINESS_AUDIT.md`, `docs/TRACK_B_V3_MANUAL_QA_SCRIPT.md`, `docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md` | OK as-is | They preserve P0 count `0`, conditional owner-gated private/manual beta, and public paid beta No-Go. |
| README | `README.md` | Needs clearer docs copy | Updated optional paid beta placeholder language and linked this audit. |
| Monetization canonical docs | `docs/monetization/v1/*` | OK as planning-only | Canonical sources describe future entitlement and billing architecture. They are not current launched behavior. |
| Billing, auth, production, and paid open beta planning docs | `docs/BILLING_*`, `docs/AUTH_*`, `docs/PRODUCTION_*`, `docs/PAID_OPEN_BETA_*`, `docs/PAID_BETA_*` | OK as planning-only with context | These docs contain future-state terms such as checkout, payment, subscription, active lifecycle, and launch planning. They remain documents, not runtime launch claims. |
| Tests | `tests/*` | Needs updated guard coverage | Updated old "unlocks" expectations and added a dedicated placeholder/planned beta copy regression spec. |
| Routes and dependencies | `src/app`, `package.json`, `package-lock.json` | OK as-is | No checkout/payment/billing route directories, no payment SDK, and no analytics SDK/tracking pixel dependency were added. |

## Copy Risk Classes

OK as-is:

- "Public paid beta remains No-Go."
- "Private/manual beta requires owner approval."
- "No checkout is live."
- "No real paid entitlement is active."
- Planning docs that clearly describe future implementation work.
- Read-only entitlement surfaces that return only guest/free and grant no paid
  access.

Needs clearer owner-gated/private beta copy:

- Any private/manual beta copy that sounds launched, broadly available, or
  self-serve without owner approval.

Needs clearer interest-only copy:

- Pricing and paywall CTAs that record `vlx_upgrade_interest_v1`.
- Upgrade placeholder status messages after click.

Needs clearer planned-content copy:

- IELTS and GRE packs with no real pack word data.
- AI mistake explanation, export, and no-watermark language that references
  future value.

Needs clearer no-real-entitlement copy:

- Any copy around Lite, Pro, Exam Pack, or local plan state that could be read
  as active paid access.

P0 unsafe claim:

- A runtime or user-facing claim that checkout, billing, payment, subscription,
  public paid beta, private beta, paid access, or paid entitlement is active or
  launched without the corresponding approved implementation.

## Approved Copy Patterns

- "Billing is not connected yet."
- "No checkout is live."
- "This records beta interest only."
- "This does not grant paid access."
- "No real paid entitlement is active."
- "Private/manual beta requires owner approval."
- "Public paid beta remains No-Go."
- "Preview plan is being prepared."
- "Planned pack data is not available yet."
- "Full IELTS/GRE content is not implied until real word data exists."
- "AI mistake explanations are planned for a future approved implementation."

## Forbidden Copy Patterns

- "Checkout enabled"
- "Billing connected"
- "Payment active"
- "Subscription active"
- "Paid access granted"
- "Paid entitlement granted"
- "Public beta launched"
- "Public paid beta is live"
- "Private beta launched"
- "IELTS/GRE full pack available" unless real word data exists
- "AI mistake explanations included now" unless actually implemented

## Route/Surface Inventory

| Route or surface | Current copy posture | Risk class |
| --- | --- | --- |
| `/pricing` | Paid options record interest only; billing is not connected; no checkout is live; no real paid entitlement is active; public paid beta remains No-Go; private/manual beta requires owner approval. | P1 ambiguity resolved |
| Pricing CTA buttons | Buttons record local interest and do not navigate to checkout when no approved placeholder URL is configured. | OK |
| Paywall prompt | Prompt bodies state interest-only and no paid access. Clicked state says the action does not grant paid access. | P1 ambiguity resolved |
| `/packs` | Pack progress is local/read-only on load. Planned IELTS/GRE packs are marked as prepared and unavailable until real word data exists. | P1 ambiguity resolved |
| `/packs/academic-vocabulary` | Academic preview uses existing real mock/static pack data and remains owner-gated for longer plan access. | OK |
| `/packs/ielts-writing-vocabulary` | Planned pack data unavailable; no review CTA; full IELTS content is not implied. | P1 ambiguity resolved |
| `/packs/gre-visual-verbal` | Planned pack data unavailable; no review CTA; full GRE content is not implied. | P1 ambiguity resolved |
| `/settings` | Account Sync and billing remain not connected/configured; local plan state is a skeleton, not paid subscription proof. | OK |
| `/api/me/entitlements` | Read-only guest/free response only. No paid grant store or paid entitlement source. | OK |
| README | Placeholder upgrade URLs are documented as interest-only and non-entitlement. | P2 docs clarity resolved |
| #176 manual QA report | P0 count remains `0`; public paid beta remains No-Go. | OK |

## P0/P1/P2 Copy Risk Summary

P0:

- Count: `0`
- No current runtime surface claims checkout enabled, billing connected, payment
  active, subscription active, paid access granted, paid entitlement granted,
  public beta launched, public paid beta live, or private beta launched.

P1:

- Pricing and paywall copy had "unlocks" phrasing that could read like active
  entitlement. It has been replaced with planned / owner-gated / interest-only
  copy.
- IELTS/GRE placeholder copy needed the explicit "full content is not implied"
  caveat. It has been added.

P2:

- README placeholder environment variable guidance needed the same exact safety
  language used in the app. It has been tightened and linked to this audit.

## Owner-Gated Private/Manual Beta Language

Use this posture for private/manual beta:

```txt
Private/manual beta requires owner approval.
Private/manual beta is a conditional owner-gated candidate only.
This is not a private beta launch claim.
```

Do not describe private/manual beta as launched, live, self-serve, broadly open,
or paid access granted.

## Public Paid Beta No-Go Language

Use this posture for public paid beta:

```txt
Public paid beta remains No-Go.
This audit must not be interpreted as a public paid beta unblock.
Public paid beta remains blocked until account sync, monitoring, privacy,
accessibility, support, refund, rollback, billing/payment/checkout,
entitlement enforcement, and production operations gates are separately
completed and approved.
```

## Explicit Safety Boundaries

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, or public
paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake pack progress, fake paid access, private beta launch claim, or public paid
beta launch claim were added.

`npm audit fix` was not run.
