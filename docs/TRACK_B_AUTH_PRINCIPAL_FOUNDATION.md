# Track B Auth Principal Foundation

## Purpose

This foundation can identify an already authenticated Supabase session on the
server and normalize it to a minimal Track B account principal.

It does not create a learner-facing sign-in flow. Track B still has no login,
signup, callback, logout, password reset, or account-management UI in this PR.

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

No provider secret key, service-role key, or production secret is used.

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

## Non-Goals

- No learning data is uploaded.
- No Account Sync route exists.
- No API route, route handler, middleware, proxy, database schema, migration,
  RLS policy, table, or storage bucket is added.
- No paid entitlement is granted.
- No billing, checkout, subscription, invoice, payment SDK, or billing portal
  behavior is added.
- No SRS algorithm, analytics contract, or local storage key contract changes.

## Beta Status

Public paid beta remains **No-Go**. This PR creates only the smallest
runtime-capable authenticated-principal reader needed before future auth and
sync work.

The next PR is:

```txt
feat/minimal-auth-session-flow-v1
```
