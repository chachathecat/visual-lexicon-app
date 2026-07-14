# Read-only preview and digest

This directory implements the owner-approved PR B boundary from issue #187.
It contains Zod validation, authoritative Supabase session verification, a
bounded marker-only Supabase adapter, redacted response assembly, and an
injectable route handler for `preview` and `digest`.

The actual Next.js route exports are hard default-disabled. Environment values
cannot enable them: the factory defaults to a constant disabled access policy.
`readAccountLearningStagingReadAccess()` documents and tests a future
activation gate that requires both `staging_read_only` mode and an expected
Supabase project ref matching `NEXT_PUBLIC_SUPABASE_URL`, plus exact
`VERCEL_ENV=preview`; wiring that policy to the route exports requires another
reviewed code change.

## Request boundary

`POST /api/account/sync/preview` accepts only:

```json
{
  "schemaVersion": 1,
  "previewOnly": true,
  "localEvidence": {
    "savedWordSlugs": [],
    "reviewEventIds": []
  }
}
```

The body is stream-counted before JSON parsing and limited to 98,304 bytes.
Saved-word slugs are unique and limited to 200. Review-event IDs are unique
and limited to 100. Both lists reject blank, padded, overlong, or control-
character-bearing values. Zod strict objects reject `accountId`,
`targetAccountId`, raw snapshots, tokens, billing fields, and every unknown
field. Preview also requires same-origin JSON.

`GET /api/account/sync/digest` accepts no query parameters. In particular,
account IDs, cursors, and limits cannot select a different account.

## Ownership and evidence reads

The handler calls authoritative `auth.getUser()` on the cookie-bound Supabase
server client, requires a UUID owner and exact `user.is_anonymous === false`,
then passes that same client and server-derived owner to the RLS-backed read
adapter. Anonymous, expired, revoked, missing, malformed, and false-like
anonymous evidence all fail closed. Invalid session evidence uses generic
`AUTH_REQUIRED`; transport and 5xx
provider outages use generic `AUTH_UNAVAILABLE`.

The provider edge selects only owner ID, slug/event marker, and timestamp. It
reads at most 501 saved-word markers and 1,001 review-event markers: one extra
row proves whether the returned 500/1,000 observed rows are complete. It never
uses unbounded exact counts and rejects cross-owner or malformed provider rows.

## Response boundary

Responses expose counts, per-table completeness, and opaque cursors only.
Complete collections may return domain-separated HMAC-SHA-256 cursors when a
server-only secret of at least 32 UTF-8 bytes is supplied. Incomplete
collections and missing or weak secrets return `null` cursors. Raw account IDs,
slugs, event IDs, words, answers, timestamps, provider payloads, auth material,
and the HMAC secret are not returned.
Success and error responses are `private, no-store`, vary on `Cookie`, use
`nosniff`, and are bounded. Every success states that server/browser mutation
and paid-entitlement grants are false.

## Hard stops

- `apply` is hard-disabled and has no route file.
- `audit` has no route file.
- There are no insert, upsert, update, delete, or RPC adapter methods.
- There is no browser storage read or write.
- There is no billing, checkout, subscription, payment, or entitlement path.
- No staging or production database was contacted or changed by this work.
