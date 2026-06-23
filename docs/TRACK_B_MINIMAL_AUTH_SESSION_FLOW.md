# Track B Minimal Auth Session Flow

## Purpose

This PR adds the smallest learner-facing Supabase Auth session flow needed for
private unpaid dogfood.

It does not add Account Sync, database persistence, paid entitlements, checkout,
billing, learning-data upload, migrations, RLS policies, or public signup.

Public paid beta remains **No-Go**. The next planned implementation PR is:

```txt
feat/entitlement-domain-v1
```

## Routes

```txt
/login
/auth/confirm
```

`/login` renders a calm email Magic Link form for existing approved learners.
The form submits through a server action and never creates a browser Supabase
client.

`/auth/confirm` is the minimal route handler that verifies the Supabase
`token_hash` and creates the cookie session through the existing server client.

## Supabase Auth Behavior

Magic Link requests use:

```txt
supabase.auth.signInWithOtp
```

with:

```txt
shouldCreateUser: false
```

This PR must not enable public signup or silently create arbitrary accounts.
Known-user and unknown-user outcomes return the same generic UI response:

```txt
If this address can receive a Visual Lexicon Magic Link, the next step is in
that inbox.
```

Confirmation uses:

```txt
supabase.auth.verifyOtp
```

with only supported email Magic Link token types. Missing, malformed, expired,
reused, or provider-rejected token hashes fail safely back to `/login` with a
generic error. Token query values are never echoed into the UI, logs, analytics,
or redirect query strings.

Logout uses:

```txt
supabase.auth.signOut
```

from a server action on `/settings`. After a successful sign-out, the server
action expires Supabase Auth token and code-verifier cookies, revalidates
`/settings`, and redirects to the relative path `/settings?account=signed-out`.
If Supabase sign-out fails, the action redirects to
`/settings?account=logout-error` and does not claim success.

## Redirect Rules

Post-auth redirects are constrained by
`src/lib/auth/redirects.ts`.

Allowed:

```txt
/dashboard
/saved
/review/due?limit=5#start
```

Rejected:

```txt
https://external.example/path
//external.example/path
javascript:alert(1)
/%2f%2fexternal.example
paths with leading/trailing whitespace
paths containing backslashes or control characters
```

Rejected or missing redirect targets fall back to:

```txt
/dashboard
```

## Middleware

Track B uses Next.js 14.2.35, so this PR adds:

```txt
src/middleware.ts
```

It does not add `proxy.ts`.

The matcher is:

```txt
/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webp|woff|woff2)$).*)
```

The middleware creates a Supabase SSR server client with request cookies and
response cookie writes, then calls:

```txt
supabase.auth.getUser()
```

This refreshes Supabase Auth cookies when possible. It does not redirect guests,
does not require auth for `/dashboard`, `/save`, `/review`, `/saved`, `/packs`,
or `/pricing`, and must not become the sole authorization boundary.

Authorization proof remains the existing server-side principal reader:

```txt
supabase.auth.getClaims()
```

`getSession()` is not used as authorization proof.

## Settings UI

`/settings` is the only status surface changed in this PR. It shows one of:

```txt
Signed out
Signed in
Auth unavailable
```

It does not display email addresses, tokens, raw claims, cookies, or provider
payloads.

When signed in, `/settings` shows a server-action logout button. Learning data
remains local-only after logout because Account Sync is not implemented.

Logout must not clear these learning keys:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

## Missing Environment

Missing Supabase URL or publishable-key configuration fails closed:

- build must not crash
- `/login` renders an unavailable state
- `/settings` renders `Auth unavailable`
- no provider request is made by the login helper without configuration
- no fake login claim is shown

## Non-Goals

- No public signup.
- No Account Sync.
- No learning-data upload.
- No database tables.
- No migrations.
- No RLS policies.
- No entitlement resolver.
- No paid access.
- No checkout, billing portal, subscription, invoice, payment SDK, or webhook.
- No new localStorage or sessionStorage keys.
- No AI Tutor behavior.
- No multilingual page generation.

## Manual Supabase Dashboard Configuration

The owner still needs to configure Supabase Auth for the deployed environment:

- approved learner accounts must already exist
- Email Magic Link must be enabled
- public signup must remain disabled
- the email template must send users to `/auth/confirm` with `token_hash`,
  `type=email`, and the safe `next` parameter
- the deployed app origin must be allowed in Supabase redirect URL settings
