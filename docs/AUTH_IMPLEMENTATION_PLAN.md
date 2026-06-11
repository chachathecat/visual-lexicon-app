# Auth Implementation Plan

Plan date: 2026-06-11

Scope: Visual Lexicon Track B account implementation planning only. This plan
does not implement auth, add an auth provider SDK, add login/signup routes,
create database credentials, add migrations requiring secrets, add environment
variables, add secrets, add billing, touch Webflow, touch Cloudflare Workers,
touch Vercel settings, touch DNS, mutate production data, deploy, or change
runtime behavior.

## Goals

- Introduce durable account ownership for saved words, review state, review
  events, daily stats, pack progress, extension-origin saves, alias-search
  saves, and future entitlement snapshots.
- Preserve the local Save -> Review -> SRS loop while moving production truth
  to account-bound server state.
- Ensure Due, Weak, and Mastered remain derived from real review state.
- Keep billing blocked until account persistence and server-side SRS sync are
  implemented and validated.

## Explicit Non-Goals

- No auth provider SDK in this planning PR.
- No login, signup, recovery, account settings, or route guard runtime behavior
  in this planning PR.
- No database credentials, migrations requiring secrets, provider project keys,
  or environment variables.
- No checkout, billing portal, subscription, invoice, payment SDK, payment link,
  or real entitlement behavior.
- No Webflow, Cloudflare Worker, Vercel settings, DNS, production data, or
  deployment changes.
- No paid access tied only to localStorage.
- No fake cross-device progress, fake mastery, fake streaks, fake pack
  progress, or fake dashboard metrics.

## Implementation Phases

### Phase 0: Read-Only Existing Backend Audit

Purpose:

- Confirm whether any Visual Lexicon account backend already exists outside
  this Track B repo.
- Inventory current auth providers, user IDs, domains, sessions, recovery,
  staging/production split, support process, export/delete process, and data
  ownership if a backend exists.

Exit criteria:

- Provider choice is confirmed or revised.
- No secrets are requested or exposed.
- No runtime behavior changes.

### Phase 1: Account Persistence Typed Contracts And Mocks

Purpose:

- Define app-owned account types before provider code.
- Add mock adapters for profiles, saved words, review state, review events,
  daily stats, pack progress, extension events, alias events, sync queue, and
  entitlement snapshots.
- Keep mocks disconnected from production runtime.

Likely outputs:

- TypeScript contracts.
- Pure merge/idempotency helpers if needed.
- Contract tests for localStorage snapshot import, duplicate saves, duplicate
  review events, delayed-recall mastery, and export/delete shapes.

### Phase 2: Provider-Specific Auth Spike Behind Non-Production Controls

Purpose:

- Add the selected provider SDK only after explicit approval.
- Implement minimal sign up, sign in, sign out, recovery, and session
  persistence in a staging/internal path.
- Create an internal `profiles` mapping from provider user ID to Visual Lexicon
  account ID.

Exit criteria:

- Sessions are validated server-side.
- Account routes do not rely on localStorage for identity.
- No billing or paid access is introduced.

### Phase 3: Server SRS Persistence And Sync

Purpose:

- Add account-bound server writes for saved words and review events.
- Materialize review state, daily stats, and pack progress from accepted events.
- Add idempotency keys, local queue handling, stale-client behavior, and
  hydration payloads.

Exit criteria:

- Save creates or preserves account review state.
- Review answers create account review events and update account review state.
- Due, Weak, and Mastered derive from account review state.
- Duplicate retries do not duplicate events or over-advance SRS boxes.

### Phase 4: Guest-To-Account Migration And Cross-Device QA

Purpose:

- Merge existing localStorage progress into an account safely.
- Hydrate new devices from server state.
- Validate conflict handling when local and server state differ.

Exit criteria:

- Guest merge is idempotent.
- Imported local state cannot create Mastered without delayed recall evidence.
- Cross-device dashboard, saved library, due queue, weak queue, and word detail
  views show account-owned state.
- Failed migration keeps local data and retry metadata.

### Phase 5: Export/Delete, Support, And Auth Readiness Sign-Off

Purpose:

- Implement export/delete support path for account and learning data.
- Document support repair and rollback workflows.
- Produce auth/account go/no-go for the next production v1 gate.

Exit criteria:

- Account export includes profile, saved words, review state, review events,
  daily stats, pack progress, account-linked extension/alias events, sync
  metadata, upgrade interest, and future entitlement snapshots.
- Account deletion removes or anonymizes account-linked learning data according
  to policy.
- Billing remains blocked until server SRS sync is validated.

## Files Likely Touched In Future Implementation

Likely app files:

- `src/app/layout.tsx` for provider/session context only after SDK approval.
- `src/app/settings/page.tsx` for account status, export/delete entry points,
  and sign-out controls after auth exists.
- `src/app/dashboard/page.tsx`, `src/app/saved/page.tsx`,
  `src/app/review/page.tsx`, `src/app/review/due/page.tsx`,
  `src/app/review/weak/page.tsx`, and `src/app/word/[slug]/page.tsx` for
  hydrated account reads after sync exists.
- Future route handlers under existing approved route scope for save, review,
  hydration, export, delete, and migration endpoints.

Likely library files:

- Existing SRS/local storage helpers that read or write
  `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and
  `vlx_daily_stats_v1`.
- Future account contracts and mock adapters under `src/lib`.
- Future provider integration helpers under `src/lib` only after explicit
  implementation approval.
- Analytics/source helpers for extension and alias attribution after privacy
  review.

Likely tests:

- Existing Playwright tests for local MVP regression.
- New contract tests for account snapshots, merge, idempotency, hydration,
  export/delete, and signed-out behavior.
- Future browser QA for sign up, sign in, sign out, recovery, guest merge, and
  cross-device SRS.

## Account Session Model

- Guest: no durable account ID; localStorage remains local-only trial state.
- Authenticated account: has a stable provider user ID and an internal Visual
  Lexicon `profileId`.
- Server routes validate the session and resolve the internal account before
  accepting saved-word or review-event writes.
- Client cache can show pending local state, but account-owned claims require
  successful hydration or accepted server writes.
- Session expiration stops server writes, preserves pending local queue items,
  and prompts the future sign-in flow.
- Auth metadata should not store SRS truth, paid access proof, review events, or
  sensitive extension/page data.

## Route Access Model

Public/guest-readable routes:

- `/`
- `/packs`
- `/packs/[packId]`
- `/word/[slug]`
- `/pricing`

Guest-usable but account-enhanced routes:

- `/dashboard`
- `/saved`
- `/review`
- `/review/due`
- `/review/weak`

Account-required future surfaces:

- Account export.
- Account deletion.
- Cross-device hydration status.
- Server-synced full saved library.
- Server-synced review history and mastery history.
- Future paid entitlement management after billing is separately approved.

Route rules:

- Guests can keep using the local learning loop.
- Account-only actions must require a server-validated session.
- Signed-out clients must not write to account server state.
- Route guards must not hide local data in a way that prevents safe guest merge
  or recovery from failed sync.

## Guest-To-Account Migration Entry Points

Entry points after real auth exists:

- First successful sign-up from a guest browser.
- First sign-in on a browser with local learning state.
- Settings/account prompt to merge local guest progress.
- Extension save flow that opens the app and detects local pending state.
- Alias-search save flow after a guest chooses to create or sign into an
  account.

Migration requirements:

- Show a clear merge choice before account import.
- Create a migration batch ID for account, device, and timestamp.
- Import review events before trusting materialized review state.
- Deduplicate saved words by `userId + slug`.
- Deduplicate review events by `userId + eventId` or idempotency key.
- Preserve weak-word and wrong-answer history.
- Never promote a word to Mastered without delayed recall evidence.
- Keep local data until server acceptance is confirmed.

## localStorage Merge Plan

Required local keys:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Additional current/planned local keys to account for:

```txt
vlx_pack_progress_v1
vlx_upgrade_interest_v1
vlx_pending_home_quiz
```

Merge order:

1. Snapshot local keys and assign a migration batch ID.
2. Validate shape and reject unsafe fields.
3. Import review events with idempotency keys.
4. Upsert saved words by slug and preserve source history.
5. Import review state only as audited materialized evidence.
6. Recompute or repair daily stats from accepted events where possible.
7. Merge pack progress from accepted review and pack events.
8. Import upgrade interest as interest only, never entitlement.
9. Mark local migration records synced only after server acceptance.

Conflict rules:

- Accepted review events beat newer-looking client timestamps.
- Newer wrong answers can move a word back toward Weak or Learning.
- Duplicate saves update safe metadata but never reset SRS state.
- Archived/unsaved state needs timestamp and mutation sequence comparison.
- Failed import keeps local data and retryable status.

## Server SRS Sync Dependency

Auth is not complete until server SRS sync works. Account identity only creates
an owner; it does not make memory state durable by itself.

Required sync capabilities:

- Account-bound saved words.
- Account-bound append-only review events.
- Account-bound materialized review state.
- Server-side SRS reducer for box, mastery, weak score, and next due.
- Idempotent retries for save, review event, queue batch, and pack progress.
- Hydration for saved words, review state, review events, daily stats, and pack
  progress.
- Stale-client and conflict responses.
- Export/delete coverage for account-linked SRS data.

## Extension Save Source Implications

- Extension-origin saves must preserve `source: "extension"` in saved-word
  source history.
- Extension events must not collect full browsing history, private page text,
  credentials, secrets, payment data, or tab contents.
- Extension saves use the same `userId + slug` dedupe path as app saves.
- If the user is signed out, extension saves remain local pending state until
  account merge is explicitly accepted.
- Extension review starts and quiz-later actions are source events, not mastery
  evidence unless they create accepted review events.

## Alias Search Source Implications

- Alias search must resolve to canonical slugs before saving.
- Alias-origin saves must preserve `source: "alias_search"` and sanitized alias
  metadata only after privacy review.
- Unknown aliases must not create saved words, review state, pack progress, or
  mastery state.
- Alias search events can support product diagnostics, but they are not review
  evidence.
- Account-linked alias events must be included in export/delete support.

## Data Export/Delete Support

Export should include:

- Account profile and provider mapping.
- Saved words and save-source history.
- Review state / word mastery.
- Review events.
- Daily stats.
- Pack progress.
- Sync queue metadata and migration batches.
- Upgrade interest records.
- Account-linked extension and alias events.
- Future entitlement snapshots after billing is separately approved.

Delete should:

- Delete or anonymize account-linked learning data according to the retention
  policy.
- Revoke or remove provider auth access according to provider rules.
- Preserve required billing/legal records only after billing exists and only
  according to a separate billing retention policy.
- Avoid deleting unrelated production pack data.
- Avoid touching Webflow, Cloudflare Workers, DNS, or deployment settings.

## Testing Strategy

Planning PR validation:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test -- --workers=1`

Future contract tests:

- Local storage snapshot validation.
- Guest merge idempotency.
- Duplicate saved-word upsert.
- Duplicate review-event retry.
- Delayed-recall requirement for Mastered.
- Due/Weak/Mastered selectors from real review state.
- Export/delete payload coverage.

Future integration and browser QA:

- Sign up, sign in, sign out, recovery, and session persistence.
- Signed-out local review remains usable.
- Session expiration preserves pending queue.
- New-device hydration shows account-owned saved/review state.
- Cross-device review conflict resolves from accepted events.
- Extension-origin save merges into account state.
- Alias-origin save resolves to canonical slug and source history.
- No paid access relies on localStorage.

## Rollback Plan

Planning-only rollback:

- Revert these docs and README links.
- No data migration or runtime rollback is required.

Future implementation rollback:

- Disable auth/sync feature flags.
- Stop accepting new server writes while preserving local review behavior.
- Keep pending local queue items and migration snapshots for retry or support.
- Rehydrate account state after fix.
- Do not delete account learning data as part of rollback unless the user
  explicitly requests account deletion.

## Recommended Next PR

Recommended next PR: #49 Account persistence typed contracts and mocks.

If the short read-only existing-backend audit finds a real Visual Lexicon
account backend outside this repository, pause provider implementation and use
the evaluation checklist before committing to Supabase Auth.

