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
/auth/continue
```

`/login` renders a calm email Magic Link form for existing approved learners.
The form submits through a server action and never creates a browser Supabase
client.

`/auth/confirm` is a scanner-safe GET/HEAD boundary. It validates a
custom-template `token_hash` only after a constant-time match against the
256-bit request state cookie created by `/login`. Validation is
non-destructive: GET and HEAD do not consume the request state. The route binds
the validated state to the pending token, stores both for at most ten minutes
in HttpOnly, Secure, SameSite=Lax cookies, and redirects to the clean
`/auth/continue` URL. It does not call Supabase verification or create a
session on GET or HEAD. A link opened in a different browser fails closed,
which also prevents login CSRF and account-session swapping.

`/auth/continue` renders a no-JavaScript-compatible confirmation form. Only the
explicit server-action POST consumes the bound request state and pending token,
then uses `verifyOtp` to create the cookie session through the existing server
client. The local cookies are expired before the provider call, so a later
sequential submission fails closed. These cookies are not an atomic
server-side replay lock for concurrent requests; Supabase's one-time token
verification remains the final authority if duplicate POSTs arrive
concurrently.

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

The dedicated Track B staging project must use a custom token-hash Magic Link
template. The explicit confirmation POST uses:

```txt
supabase.auth.verifyOtp
```

with only supported email Magic Link token types. Missing, malformed, expired,
reused, ambiguous, or provider-rejected token hashes fail safely back
to `/login` with a generic confirmation error distinct from client-side email
syntax validation. Neither state reveals whether an account exists. Credential
query values are never echoed into the UI, application console logs, analytics
payloads, or subsequent redirect query strings. The initial provider link
necessarily carries a one-time token hash in its query, so platform ingress
query logging and retention must be reviewed separately; the application does
not console-log it and immediately redirects to a query-free URL with
`no-store` and `no-referrer` headers.

This two-step boundary is required because enterprise email security scanners
can prefetch a one-time `ConfirmationURL` before the learner clicks it. Scanner
GET and HEAD requests may reach the Visual Lexicon landing URL and stage the
short-lived bound cookies, but they do not consume either the browser request
state or the Supabase token. A scanner without the originating browser's state
cookie fails closed. Only the deliberate confirmation POST consumes the state
and calls Supabase verification.

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

The login request and email callback must also use the same origin. Auth request
state cookies are intentionally host-only and cannot be shared across Vercel
deployment hostnames. When `NEXT_PUBLIC_APP_URL` is configured, `/login`
canonicalizes any other deployment URL to that origin before rendering the
form. The server action repeats the check before creating state or sending an
email, so a stale page cannot create a cross-host Magic Link. If the action
detects a mismatch, it redirects to the canonical login form without carrying
the email address. A present but invalid `NEXT_PUBLIC_APP_URL` fails closed:
the login UI is unavailable and the request helper does not fall back to an
arbitrary forwarded host.

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
- the default `{{ .ConfirmationURL }}` template must not be used for this
  staging lane because automated email prefetch can consume it
- the **Magic Link** template must use the existing request-specific
  `{{ .RedirectTo }}` and append the token hash exactly as follows:

```html
<h2>Sign in to Visual Lexicon</h2>
<p>Open the secure confirmation page:</p>
<p>
  <a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">
    Continue to Visual Lexicon
  </a>
</p>
```

- `{{ .RedirectTo }}` is generated by the app as
  `/auth/confirm?next=<safe-relative-path>&state=<browser-bound-random-state>`;
  the route accepts only `type=email`, token hashes up to 512 characters, and
  normalized relative redirects up to 1,024 UTF-8 bytes; the final encoded
  pending redirect cookie is also capped at 1,024 bytes, with oversized values
  falling back to `/dashboard`
- the deployed app origin must be allowed in Supabase redirect URL settings
- email-provider link tracking must remain disabled

This template change is authorized only for the dedicated Track B Supabase
project and dedicated staging Preview. It must not be copied to production as
part of this acceptance pass.
