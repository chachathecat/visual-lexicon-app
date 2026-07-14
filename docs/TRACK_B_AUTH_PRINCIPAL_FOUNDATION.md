# Track B Auth Principal Foundation

## Purpose

This foundation identifies an already authenticated Supabase session on the
server and normalizes it to a minimal Track B account principal.

The follow-up Minimal Auth Session Flow adds existing-user Magic Link login,
confirmation, logout, and session refresh while preserving this foundation's
principal boundary.

## Runtime Boundary

The server reader lives in:

```txt
src/lib/account-runtime/session.ts
src/lib/account-runtime/types.ts
src/lib/supabase/server.ts
```

The Supabase server client is created with `@supabase/ssr` and reads cookies
through Next.js `next/headers` `cookies()`. Missing configuration fails closed
with `unconfigured`; it does not create a fake user and does not make a provider
request.

Only these public environment variable names are referenced:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

No provider secret, service-role credential, or production secret is used.

## Principal Contract

The normalized result is:

```ts
type AccountPrincipalResult =
  | {
      status: "authenticated";
      principal: {
        accountId: string;
        provider: "supabase";
      };
    }
  | {
      status:
        | "anonymous"
        | "invalid"
        | "expired"
        | "revoked"
        | "ambiguous"
        | "unsupported"
        | "unconfigured";
      principal: null;
    };
```

Authenticated ownership is derived only from the verified Supabase JWT `sub`
claim returned by `supabase.auth.getClaims()`. `getSession()` is not used as
authorization proof.

The reader never accepts ownership proof from request body IDs, query IDs,
browser storage, client-supplied email, plan state, entitlement state,
arbitrary headers, hidden inputs, or label cookies.

Returned values must not include access tokens, refresh tokens, raw JWTs,
cookies, full claims, email, provider response bodies, publishable keys, or
secret keys.

## Minimal Auth Session Flow Follow-Up

The follow-up flow is documented in:

```txt
docs/TRACK_B_MINIMAL_AUTH_SESSION_FLOW.md
```

It adds:

- `/login`
- `/auth/confirm`
- `src/middleware.ts`
- `/settings` account status and logout

It still does not add public signup, Account Sync, learning-data upload,
database tables, migrations, RLS policies, entitlements, paid access, checkout,
billing, payment SDKs, or production-data mutation.

## Non-Goals

- No learning data is uploaded.
- No Account Sync route exists.
- No Account Sync API route, database schema, migration, RLS policy, table, or
  storage bucket is added.
- No paid entitlement is granted.
- No billing, checkout, subscription, invoice, payment SDK, or billing portal
  behavior is added.
- No SRS algorithm, analytics contract, or local storage key contract changes.

These bullets describe the scope of the historical auth-principal PR. The
current repository also contains the later issue #187-approved Account Sync
`preview` and `digest` route files. Those exports are hard default-disabled and
read-only; no `apply` or `audit` route exists and no learning data is uploaded.

## Beta Status

Public paid beta remains **No-Go**. This PR creates only the smallest
runtime-capable authenticated-principal reader needed before future auth and
sync work.

The Minimal Auth Session Flow follow-up is:

```txt
feat/minimal-auth-session-flow-v1
```
