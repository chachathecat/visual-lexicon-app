# Account-owned learning staging read activation

Date: 2026-07-14  
Owner approval: dedicated staging only; read-only only; no production change;
no learning-data mutation.

## Approved outcome

The `preview` and `digest` route exports are wired to a fail-closed staging
policy. They remain disabled by default and cannot read Supabase unless every
condition below is true on the same request:

- `VLX_ACCOUNT_LEARNING_READ_MODE=staging_read_only`;
- `VERCEL_ENV=preview` exactly;
- the platform-provided `VERCEL=1` marker is present, preventing local
  development from bypassing distributed Firewall checks;
- `VERCEL_GIT_COMMIT_REF` exactly matches
  `VLX_ACCOUNT_LEARNING_EXPECTED_GIT_BRANCH` and is not `main`;
- `NEXT_PUBLIC_SUPABASE_URL` resolves to the exact project ref in
  `VLX_ACCOUNT_LEARNING_EXPECTED_SUPABASE_PROJECT_REF`;
- that ref differs from the required
  `VLX_ACCOUNT_LEARNING_PRODUCTION_SUPABASE_PROJECT_REF` deny guard;
- `VLX_ACCOUNT_LEARNING_CURSOR_HMAC_SECRET` is server-only and at least 32
  UTF-8 bytes;
- both Vercel Firewall rate-limit IDs exist and answer successfully.

Missing, malformed, mismatched, unavailable, or unconfigured controls fail
closed before evidence reads. Production has `VERCEL_ENV=production`, so the
route policy cannot enable there even if another variable is copied by mistake.

## Distributed abuse boundary

The official `@vercel/firewall` SDK enforces two distributed controls:

| Rate-limit ID | Recommended staging rule | Key |
| --- | --- | --- |
| `vlx-account-learning-read-ip-v1` | 30 requests per 60 seconds | HMAC-derived client IP |
| `vlx-account-learning-read-owner-v1` | 15 requests per 60 seconds | HMAC-derived authenticated owner |

Vercel overwrites `x-forwarded-for` at its edge. The handler requires one
well-formed value, HMACs it before supplying a custom key, and never returns or
logs the raw IP or owner ID. A missing rule, Firewall outage, missing IP, or SDK
failure returns generic `503 RATE_LIMIT_UNAVAILABLE`. A reached limit returns
generic `429 RATE_LIMITED` with `Retry-After: 60`.

Firewall counters are infrastructure abuse controls only. They do not insert,
update, or delete Visual Lexicon learning data.

## Isolated staging apply checklist

1. Verify a dedicated Supabase staging project that contains no production
   users or learning data.
2. Apply `001_account_learning_evidence_up.sql` only after setting the database
   session marker `vlx.account_persistence_target=staging`.
3. Scope the Supabase URL and publishable key to the approved staging Git
   branch only.
4. Scope the activation variables above to the same branch only; store the
   HMAC value as a sensitive server variable.
5. Configure both Firewall rate-limit IDs before enabling read mode.
6. Protect the preview deployment and use only synthetic permanent-user
   accounts and synthetic learning evidence.
7. Prove anonymous, revoked, and expired sessions are denied; prove account A
   cannot observe account B; prove both routes expose only redacted counts.
8. Reconfirm `apply` and `audit` routes are absent and authenticated database
   grants contain no insert, update, delete, or RPC path.

## Kill switch and rollback

The first kill switch is removal of
`VLX_ACCOUNT_LEARNING_READ_MODE=staging_read_only`, which returns both routes to
`503 ROUTE_DISABLED` without a deployment. The guarded down migration may then
remove only the three migration-owned staging objects after exact ownership
comments are verified.

Do not run either SQL file against production. Do not promote this branch to
production. Do not add an `apply` or `audit` route under this approval.

## External execution status

The source wiring and automated contract are reviewable in the staging
activation branch. Live migration, Vercel branch variables, Firewall rules,
synthetic accounts, and manual two-account evidence must be recorded only after
the connected operator has verified the dedicated staging project identifiers.
