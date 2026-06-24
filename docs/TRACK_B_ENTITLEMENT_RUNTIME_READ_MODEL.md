# Track B Entitlement Runtime Read Model

Date: 2026-06-24

## Scope

This PR adds one read-only App Router endpoint:

```txt
GET /api/me/entitlements
src/app/api/me/entitlements/route.ts
```

The endpoint connects the verified Supabase account principal boundary to the
pure entitlement-domain resolver. It returns a bounded entitlement snapshot for
truthful client display only.

It is not a general authorization system, grant store, usage ledger, billing
system, Account Sync runtime, asset gateway, download authorizer, or client
entitlement provider.

## Principal To Plan Mapping

Current runtime mapping is deliberately minimal:

| Principal state | Public status | Auth state | Account state | Plan |
| --- | ---: | --- | --- | --- |
| Verified Supabase principal | 200 | `authenticated` | `free` | `free` |
| Genuinely anonymous | 200 | `anonymous` | `guest` | `guest` |
| Invalid, expired, revoked, ambiguous, or unsupported | 401 | none | none | none |
| Missing Supabase configuration | 503 | none | none | none |

Authenticated currently means **Free**, not paid. Anonymous currently means
**Guest**. No authenticated account can receive Lite, Pro, Educator, purchase,
promotion, or manual-grant access from this endpoint.

## Resolver Call

The endpoint resolves the snapshot through:

```ts
resolveEffectiveEntitlements({
  accountState,
  evaluatedAt,
  oneTimePurchases: [],
  promotions: [],
  manualGrants: [],
})
```

No server grant store exists yet, so purchases and promotions are empty. No
Lite, Pro, or Educator access can yet be granted.

## Successful Response Boundary

Successful responses contain only:

```txt
schemaVersion
authState
accountState
plan
capabilities
limits
purchasedPackIds
activePromotionIds
lifecycleStatus
evaluatedAt
```

They do not return account IDs, email addresses, access tokens, refresh tokens,
raw JWTs, cookies, full claims, Supabase response objects, publishable keys,
secret keys, billing IDs, provider customer IDs, or raw request values.

## Public Error Boundary

Rejected sessions return generic public errors:

```txt
401 AUTH_INVALID
503 AUTH_UNAVAILABLE
```

Provider-specific reasons are not exposed. Error responses do not return
entitlements.

## Usage Boundary

There is no server usage ledger yet. The endpoint exposes canonical limits only.
It does not return authoritative `remaining` usage, create usage counters, mutate
usage, or infer usage from browser localStorage.

## Non-Authoritative Local State

`vlx_plan_state_v1` and `src/lib/entitlements/local-entitlements.ts` remain
browser-controlled preview compatibility only. They are not server
authorization, not paid proof, and not an input to this read model.

The endpoint also ignores query strings, account or plan headers, plan-label
cookies, hidden inputs, success-page arrival, frontend feature flags, and any
client-provided account identity.

## Caching

The route is configured as:

```ts
export const dynamic = "force-dynamic";
```

Every response includes:

```txt
Cache-Control: private, no-store
Vary: Cookie
```

No public CORS headers are added, and entitlement responses are not cached.

## Future Authorization

Future server actions and paid endpoints must independently re-resolve
entitlements on the server. A future download, AI, pack, billing, or usage
endpoint must never trust entitlement data sent back by the browser from this
read model.

The next PR should be client entitlement consumption and local-plan authority
removal, not billing.

Public paid beta remains **No-Go** until account sync, monitoring, privacy,
accessibility, support, refund, rollback, grant-store, usage-ledger, asset, and
billing gates pass.
