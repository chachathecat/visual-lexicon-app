# Track B Entitlement Domain Core

Date: 2026-06-23

## Scope

This module implements the pure, provider-independent entitlement domain core in
`src/lib/entitlements/`.

It does not implement authentication, Supabase access, API routes, middleware,
database persistence, billing, payment, account sync, UI gating, React providers,
or usage mutation.

## Canonical Source

Numeric prices, limits, plan capabilities, additive products, promotions, and
lifecycle values come from:

```txt
docs/monetization/v1/vlx-plan-entitlements.v1.json
```

`src/lib/entitlements/catalog.ts` imports that JSON directly and normalizes it
into `PLAN_CATALOG`. The imported JSON object is also exported as
`CANONICAL_ENTITLEMENT_CATALOG` for contract tests.

## Types

The canonical domain types are exported from `src/lib/entitlements/types.ts`:

```txt
PlanId
AccountState
Capability
LimitKey
EffectiveEntitlements
OneTimePurchaseGrant
PromotionGrant
ManualGrant
EntitlementLifecycleState
EntitlementLifecycleInput
EntitlementLifecycleDecision
UsageSnapshot
```

`guest`, `free`, `lite`, `pro`, and `educator` are account states. Pricing
cards are limited to `free`, `lite`, and `pro`.

## Formula

The resolver applies the canonical formula:

```txt
effective_entitlements =
  base_plan
  + active_one_time_purchases
  + active_promotions
  + audited_manual_grants
```

Callers must pass `evaluatedAt` so expiry handling is deterministic and pure.

## Unlimited Limits

Canonical JSON uses `null` for unlimited allowances. The domain normalizes those
values to the internal string literal:

```ts
"unlimited"
```

This keeps unlimited values serializable and prevents accidental arithmetic with
`Infinity`. `remaining()` preserves `"unlimited"` exactly.

## Helpers

```ts
resolveEffectiveEntitlements(input)
can(entitlements, capability)
limit(entitlements, limitKey)
remaining(entitlements, limitKey, usage)
```

`remaining()` never returns a negative finite number, returns zero when a finite
allowance is exhausted, preserves unlimited limits, and does not mutate the
supplied usage snapshot.

## Grant Rules

One-time purchases grant canonical Exam Pack entitlements additively. They do
not change the subscription/account state.

`welcome_ai_demo` is modeled as a promotion. It applies only where the canonical
JSON says it applies and grants exactly three lifetime mistake explanation
credits. It does not turn Free or Lite into plans with monthly AI allowance.

Manual grants must include `reason`, `issuedBy`, `issuedAt`, `expiresAt`, and
`auditId`. Missing audit metadata is rejected. Expired grants are ignored.

Malformed trusted-domain input fails closed by throwing before access is granted.
The resolver validates account state, lifecycle state, grant IDs, product IDs,
promotion IDs, timestamps, manual capabilities, manual limit keys, manual limit
values, and pack entitlement names at runtime. Unknown plans, unknown products,
unknown promotions, unknown capabilities, unknown limit keys, invalid timestamps,
negative additive limits, non-array grant lists, and incomplete manual audit
metadata do not produce entitlement access.

## Lifecycle Policy

The resolver accepts an optional `lifecycle` object. If omitted, the lifecycle is
`active`.

Canonical lifecycle values are exported as `LIFECYCLE_STATES` and
`ENTITLEMENT_LIFECYCLE_POLICIES`, sourced from the canonical JSON:

```txt
active
canceled_at_period_end
past_due_grace
expired
refunded_or_chargeback
```

Lifecycle decisions are represented only in the entitlement shape. They do not
delete, upload, rewrite, or mutate saved words, review events, mastery state,
pack progress, or any other learning data. The policy field is:

```ts
learningDataPolicy: {
  preserve: true,
  mutation: "none_policy_only"
}
```

Lifecycle behavior:

- `active`: resolves the requested base plan with full entitlements.
- `canceled_at_period_end`: keeps full plan entitlements until
  `currentPeriodEnd`; after that timestamp, it falls back to Free.
- `past_due_grace`: keeps the requested learning/history shape during the
  canonical grace window while blocking new clean downloads and new AI calls.
- `expired`: falls back to Free while preserving learning data policy and still
  allowing separately active additive grants.
- `refunded_or_chargeback`: falls back to Free, ignores paid provider grants,
  preserves learning data policy, and marks support review as required.

## Authority Boundaries

The pure resolver does not read local storage, session storage, cookies, request
headers, query strings, environment variables, Supabase clients, auth/session
modules, payment SDKs, billing SDKs, React, API routes, or middleware.

Paid access is never inferred from browser storage, query strings, cookies, page
arrival, client plan labels, or frontend feature flags. Downgrade behavior must
preserve learning data in later integration work; this module only calculates
entitlement shape and never deletes or mutates learning data.

Watermark removal does not imply commercial rights. The resolver preserves the
canonical asset policy flag that commercial rights are separate from clean asset
access.

## Legacy Local Diagnostic

The repository still contains the pre-existing local plan diagnostic skeleton in
`src/lib/entitlements/local-entitlements.ts` for current UI imports. It remains a
client/local placeholder and is not used by `resolveEffectiveEntitlements()`.
Future integration work should migrate UI gating to a server-authoritative
entitlement source after the auth/session branch lands.
