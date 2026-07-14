# Account-owned learning persistence PR B

Date: 2026-07-14  
Owner gate: issue #187 approved authenticated, read-only `preview` and
`digest`; mutating `apply` still requires a separate owner decision.

## Outcome

PR B adds reviewable Next.js route files for:

- `POST /api/account/sync/preview`
- `GET /api/account/sync/digest`

Both actual exports are hard default-disabled and return `503 ROUTE_DISABLED`
without creating a Supabase client. This keeps PR A's `runtimeConnected:
false` statement accurate. A tested, non-wired future staging policy requires
`VLX_ACCOUNT_LEARNING_READ_MODE=staging_read_only`, an exact expected project
ref match against the configured Supabase URL, and exact
`VERCEL_ENV=preview`. A later reviewed code change is required to wire that
policy.

## Authentication and account selection

The enabled injectable handler path reuses the existing cookie-bound Supabase
server client. It calls authoritative `auth.getUser()`, requires an exact
permanent-user signal (`is_anonymous === false`) and UUID subject, and then
passes the same client to the RLS read adapter.

The request cannot select an account. Zod strict validation rejects
`accountId`, `targetAccountId`, and unknown body/query keys. Provider responses
must contain only the authenticated owner or the request fails as an integrity
error. Anonymous, expired, revoked, missing, malformed, and false-like
anonymous sessions all return the same external `401 AUTH_REQUIRED` response.
Provider transport and 5xx failures return the generic
`503 AUTH_UNAVAILABLE` response instead of asking the user to reauthenticate.

The shared account-principal normalization was tightened at the same time:
only the exact JWT boolean `is_anonymous: false` becomes a verified principal.
Missing, string, numeric, or null claims fail closed. The PR A adapter now also
requires exact `user.is_anonymous === false` from `getUser()`.

## Validation and request limits

Zod 4.4.3 is pinned as a direct dependency and imported only by the validator
edge. Sync planning core remains validator-neutral.

Preview accepts version 1, `previewOnly: true`, and unique marker lists only:

- at most 200 saved-word slugs;
- at most 100 review-event IDs;
- no blank, padded, overlong, or control-character-bearing marker;
- at most 98,304 raw UTF-8 bytes, counted from the stream before parsing;
- same-origin `application/json` only.

Digest accepts no query parameters. Malformed input returns 400, cross-origin
preview returns 403, oversized input returns 413, and unsupported media type
returns 415 before auth or provider reads.

## Bounded provider reads and redaction

Provider queries select only owner ID, slug/event marker, and timestamp. Saved
words use a 501-row page and review events a 1,001-row page. The extra sentinel
row establishes completeness; responses expose at most 500 and 1,000 observed
records respectively. No unbounded exact count is performed.

Preview returns only local, observed-account, overlap,
`localNotSeenInAccountPage`, and account-only-observed counts. The field names
describe the bounded page and do not claim an item is absent from a truncated
account data set. Digest returns observed counts. Both return completeness
booleans. Complete collections may return owner-bound HMAC-SHA-256 cursors only
when a server-only secret of at least 32 UTF-8 bytes is supplied; incomplete
collections and missing or weak secrets return a null cursor. Responses never
expose account IDs, raw markers, words, answers, timestamps, raw provider
payloads, auth material, or the HMAC secret.

Every success includes:

- `readOnly: true`
- `bounded: true`
- `applyEnabled: false`
- `mutatesServer: false`
- `mutatesBrowser: false`
- `grantsPaidEntitlement: false`
- an ISO `evaluatedAt`

Every success and error response includes `Cache-Control: private, no-store`,
`Vary: Cookie`, and `X-Content-Type-Options: nosniff`.

## Explicit non-goals

- No route activation or live database access.
- No SQL apply to staging or production.
- No `apply` or `audit` route file.
- No insert/upsert/update/delete/RPC operation.
- No browser hydration or browser storage mutation.
- No review-state or mastery import.
- No billing, checkout, payment, subscription, plan, or paid entitlement.
- No public paid beta authorization.

## Activation and next gate

Activation is not an environment-only operation in this PR. It requires a new
reviewed change to wire the dual staging guard into the actual route exports,
plus a dedicated cursor HMAC secret, synthetic accounts, and isolated-staging
evidence, plus distributed account/IP read throttling. Mutating PR C remains
unauthorized until a separate owner approval, kill switch,
idempotency, rollback, monitoring, and manual QA gates are complete.
