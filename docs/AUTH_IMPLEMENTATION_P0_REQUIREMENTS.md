# Auth Implementation P0 Requirements

Requirements date: 2026-06-11

Scope: P0 readiness requirements for future Visual Lexicon Track B auth/account
implementation. This document does not implement auth, add provider SDKs, add
routes, add environment variables, add secrets, create migrations, add billing,
touch Webflow, touch Cloudflare Workers, touch Vercel settings, touch DNS,
mutate production data, deploy, or change runtime behavior.

## P0 Readiness Standard

Real auth is not ready for production unless every P0 below is implemented,
tested, and documented. A provider login screen alone is not account
persistence. Account persistence is ready only when saved words, review state,
review events, hydration, merge, export/delete, and server-side SRS sync work
from real account state.

## Sign Up

- Users can create an account with the approved provider and approved initial
  login methods.
- New accounts receive a stable provider user ID and internal Visual Lexicon
  profile ID.
- Account creation does not create fake saved words, review state, progress,
  mastery, streaks, or paid access.
- Sign-up errors are safe, understandable, and do not lose local guest progress.

## Sign In

- Existing users can sign in with the approved login methods.
- Server routes can resolve the authenticated account without trusting
  localStorage.
- Sign-in on a browser with guest state offers a safe merge path.
- Sign-in on a new device hydrates account-owned learning state before claiming
  cross-device progress.

## Sign Out

- Users can sign out clearly.
- Signed-out clients stop writing to account server state.
- Pending local queue items remain local and retryable after a future sign-in.
- Signing out does not delete guest/local state unless the user explicitly
  chooses a separate delete/reset action.

## Session Persistence

- Sessions persist across browser refresh according to provider policy.
- Server-side session validation works for protected write routes.
- Session expiration is handled without corrupting local or server SRS state.
- Session refresh does not cache one user's response for another user.
- Tests cover signed-in, signed-out, expired-session, and refresh behavior.

## Account Recovery

- Approved recovery flow works for the chosen login method.
- Recovery does not create duplicate accounts for the same learner.
- Recovery preserves account-bound saved words, review state, review events,
  daily stats, and pack progress.
- Support has a documented path for account access problems before paid launch.

## Guest State Merge

- Guest merge is explicit, idempotent, and reversible by support repair where
  practical.
- Local keys are snapshotted before merge:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

- Additional local keys are considered when present:

```txt
vlx_pack_progress_v1
vlx_upgrade_interest_v1
vlx_pending_home_quiz
```

- Review events import before materialized review state.
- Duplicate saves merge by slug.
- Duplicate review events dedupe by event ID or idempotency key.
- Imported state cannot mark a word Mastered without delayed recall evidence.
- Failed merge keeps local data and retry status.

## Account-Bound Saved Words

- Every account saved word belongs to a stable `userId` or internal `profileId`.
- Saved words are unique by account and slug.
- Saving creates or preserves the matching review state item.
- Duplicate saves do not reset box, mastery, weak score, or recall counts.
- Extension and alias-search saves preserve safe source history.
- Unsave/archive does not delete review history.

## Account-Bound Review State

- Every account review state item belongs to a stable account ID.
- Required fields are supported:

```ts
{
  slug: string;
  word: string;
  image?: string;
  hub?: string;
  box: number;
  mastery: "New" | "Learning" | "Weak" | "Strong" | "Mastered";
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: string;
}
```

- Due, Weak, and Mastered derive from this state.
- Mastered requires delayed recall evidence.
- Server state cannot be overwritten by stale local materialized state.

## Account-Bound Review Events

- Every accepted account review answer creates an append-only event.
- Required event fields are supported:

```ts
{
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: string;
  selected?: string;
  answer: string;
  result: "correct" | "wrong";
  responseMs: number;
  createdAt: string;
  boxAfter: number;
  weakScoreAfter: number;
}
```

- Events are unique by account and event ID or idempotency key.
- Retried events return the original accepted result.
- Rejected events do not advance SRS state.
- Event history is the repair source for review state and daily stats.

## Cross-Device Hydration

- A new device can hydrate saved words, review state, daily stats, pack
  progress, and relevant event history from account state.
- Hydration happens before the dashboard claims account-owned due, weak,
  mastered, weekly reviewed words, or pack progress.
- Hydration failure falls back to local state without claiming cross-device
  freshness.
- Pending local queue replay happens after hydration and uses idempotency keys.

## Delete/Export Support Path

- Export includes account profile, provider mapping, saved words, review state,
  review events, daily stats, pack progress, sync metadata, migration batches,
  upgrade interest, account-linked extension events, account-linked alias
  events, and future entitlement snapshots after billing is approved.
- Delete removes or anonymizes account-linked learning data according to policy.
- Provider account deletion and app-owned data deletion are coordinated.
- Delete/export procedures are tested before public paid launch.
- Billing/legal retention is handled separately only after billing is approved.

## No Fake Cross-Device Progress

- The UI must not claim cross-device saved words, due queues, weak words,
  mastered words, streaks, pack progress, or Weekly Reviewed Words until account
  hydration and server sync are real.
- Pending local state may be shown as pending, not as confirmed server state.
- Local-only state remains clearly local when the user is signed out or sync is
  unavailable.

## No Paid Access Tied Only To localStorage

- `vlx_plan_state_v1` is not paid access proof.
- `vlx_upgrade_interest_v1` is not paid access proof.
- Auth provider metadata is not paid access proof.
- Future paid access must come from server-owned entitlement snapshots.
- Payment remains blocked until account persistence and server-side SRS sync are
  implemented and validated.

## P0 Test Evidence Required

- Automated tests for sign up, sign in, sign out, recovery, session
  persistence, signed-out behavior, and expired-session behavior.
- Automated tests for guest merge, duplicate saves, duplicate review events,
  stale local state, delayed-recall Mastered, and hydration.
- Automated tests for due, weak, and mastered selectors from account review
  state.
- Automated or documented dry-run tests for export/delete coverage.
- Manual golden-flow QA across guest, new account, returning account, new
  device, extension save source, alias-search source, and account deletion.

## Release Gate

Do not mark auth/account persistence ready for production until:

- All P0 requirements above pass.
- Validation commands pass or failures are documented.
- Manual QA notes identify the golden flows checked.
- Safety notes confirm Webflow, Cloudflare Workers, Vercel settings, DNS,
  billing, payment, secrets, production data, and deployment settings were not
  touched unless separately authorized.
- The next billing/entitlement work remains blocked until server SRS sync is
  validated.

