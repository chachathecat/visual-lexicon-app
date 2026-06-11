# Account Persistence Contracts

## Purpose

This document covers PR #49: typed account persistence contracts and disconnected
mocks for Visual Lexicon Track B. The goal is to make the future account
persistence boundary explicit without changing runtime behavior.

This is planning code only. It does not implement auth, import a provider SDK,
create login/signup routes, add environment variables, connect a database, write
production data, or deploy anything.

## Relationship To #41 And #48

#41 established that production paid SaaS needs account-bound saved words,
review state, review events, daily stats, pack progress, and server-side SRS
sync before launch.

#48 selected Supabase Auth as the primary planned path if a short read-only audit
confirms there is no existing Visual Lexicon account backend that already owns
accounts. These contracts keep that decision as a planned provider kind only;
they do not add Supabase or any other auth provider.

## Current Local Storage Keys

The local/private beta source of truth remains:

- `vlx_saved_words_v1`
- `vlx_review_state_v1`
- `vlx_review_events_v1`
- `vlx_daily_stats_v1`
- `vlx_pack_progress_v1`
- `vlx_upgrade_interest_v1`

Upgrade interest is an attribution signal only. It is not checkout, payment,
subscription, invoice, billing portal, or paid entitlement state.

## Contract Files

- `src/lib/account-persistence/types.ts`: account profile, session snapshot,
  guest snapshot, local storage key, merge batch, export/delete, error, and
  result types.
- `src/lib/account-persistence/local-snapshot.ts`: pure snapshot helpers that
  operate on caller-provided in-memory stores. They do not read `localStorage`.
- `src/lib/account-persistence/merge-contracts.ts`: preview-only merge operation
  types, conflict categories, and `createAccountMergePlan`.
- `src/lib/account-persistence/mock-adapter.ts`: non-production in-memory mock
  adapter for contract tests.

## Mock Adapter Limitations

The mock adapter is disconnected from app routes and components. It is not auth,
not persistence, not a sync engine, and not an entitlement system. It imports no
provider SDK, database SDK, or payment SDK and does not call `fetch`.

Applying a mock merge plan changes only returned in-memory objects inside tests.
It does not write browser storage, server data, billing state, production data,
or local files.

## Future Implementation Path

1. Complete a short read-only audit for any existing Visual Lexicon account
   backend if provider ownership still needs confirmation.
2. Add real auth behind explicit feature flags after provider approval.
3. Add server-side saved word and review event persistence.
4. Import review events before materialized review state.
5. Add server-side SRS reducers and cross-device hydration.
6. Enforce paid entitlements server-side only.
7. Add trusted analytics/reporting and production smoke QA.

## P0 Requirements Before Real Auth

- Account provider decision confirmed after backend ownership audit.
- Server schema and migration plan reviewed.
- Server SRS event reducer specified and tested.
- Local-to-account merge policy approved for duplicate saved words, review
  state conflicts, event idempotency, pack progress, and upgrade attribution.
- Auth, sync, and entitlement work feature-flagged and rollbackable.
- No secrets exposed to frontend code.
- Production smoke QA plan ready.

## No-Go Conditions

Do not ship real account persistence if any of these remain true:

- No confirmed auth provider or existing account backend ownership answer.
- No server-side saved/review SRS sync.
- No cross-device hydration and conflict policy.
- No server-side entitlement enforcement.
- Any payment, billing, DNS, Webflow, Cloudflare Worker, Vercel, secret, or
  production data change is required without explicit approval.
- Any flow claims mastery, due/weak state, paid access, or account persistence
  without real backing state.
