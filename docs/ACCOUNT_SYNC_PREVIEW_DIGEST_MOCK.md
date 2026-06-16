# Account Sync Preview Digest Mock

Date: 2026-06-15  
Scope: PR #82 docs/contracts/tests-only account sync preview and digest mock.

## Verdicts

- Real account sync: **Blocked**
- Preview/digest mock: **Allowed**
- Apply/write operation: **Blocked**
- Public paid beta: **No-Go**
- Private paid beta: **Conditional / Manual-only**

This PR defines how existing Track B local learning state could be previewed,
summarized, redacted, and validated before any future account sync work. It does
not implement real account sync, auth, API routes, route handlers, middleware,
database persistence, provider SDKs, payment, entitlement mutation, AI calls, or
production data writes.

## Allowed Local State Categories

The preview payload may only include these already documented local state keys:

| Key | Category | Future use | Digest mode |
| --- | --- | --- | --- |
| `vlx_saved_words_v1` | Saved words | Candidate saved-word import without resetting review state. | Count, byte length, fingerprint only. |
| `vlx_review_state_v1` | Review state | Client claim only; server mastery requires review-event evidence. | Count, byte length, fingerprint only. |
| `vlx_review_events_v1` | Review events | Primary evidence for future SRS recomputation. | Count, byte length, fingerprint only. |
| `vlx_daily_stats_v1` | Daily stats | Future stats should derive from accepted review events. | Count, byte length, fingerprint only. |
| `vlx_pack_progress_v1` | Pack progress | Event-derived or audit-only when event evidence is missing. | Count, byte length, fingerprint only. |
| `vlx_upgrade_interest_v1` | Upgrade interest | Attribution-only; never entitlement. | Count, byte length, fingerprint only. |

`vlx_plan_state_v1` is intentionally excluded because it is not proof of paid
entitlement. Unknown keys are rejected.

## Preview Payload Shape

The typed mock exports `buildAccountSyncPreviewPayload()`. Accepted preview
payloads have:

- `shape: "account_sync_preview_payload"`
- `previewOnly: true`
- `requestedAt`
- `previewId`
- `localState[]` entries for the allowed keys
- per-key `present`, `itemCount`, `byteLength`, and `valueFingerprint`
- future request fingerprint and idempotency strategy metadata
- `mutatesRuntimeStorage: false`
- `appliesAccountSync: false`
- `grantsPaidEntitlement: false`

Rejected preview payloads contain only rejection metadata and no local state
entries.

## Redacted Digest Shape

The typed mock exports `buildAccountSyncDigest()` and
`redactAccountSyncPreviewPayload()`. Digests have:

- `shape: "account_sync_redacted_digest"`
- source preview status
- per-key storage summaries
- aggregate counts for saved words, review state, review events, daily stats,
  pack progress, and upgrade interest
- request fingerprint metadata
- idempotency strategy metadata
- audit redaction rules
- launch verdicts and implementation scope
- `containsRawLocalState: false`
- `containsRawReviewEvents: false`
- `containsRawPaymentData: false`
- `containsProviderTokens: false`
- `containsSecrets: false`
- `grantsPaidEntitlement: false`

## Blocked Sensitive Fields

Preview and digest inputs reject provider tokens, auth session material,
credentials, production data, raw payment payloads, billing state, checkout
state, subscription state, invoice state, and entitlement grants.

Examples:

- `providerToken`
- `accessToken`
- `refreshToken`
- `sessionToken`
- `apiKey`
- `secret`
- `credential`
- `env`
- `paymentMethod`
- `checkoutSession`
- `subscription`
- `invoice`
- `billingState`
- `rawPaymentPayload`
- `entitlementGrant`
- `paidEntitlement`
- `rawProductionUserData`
- `rawLocalStorageDump`

## Payload Limits

The mock uses explicit bounded limits:

- Preview payload max: `98,304` bytes
- Redacted digest max: `32,768` bytes
- Review events per preview: `100`
- Saved words per preview: `200`
- Pack progress entries per preview: `50`
- Upgrade interest records per preview: `10`
- Unlimited payloads: **not allowed**

Oversized payloads are rejected before conflict detection or future apply.

## Malformed Payload Handling

Malformed inputs are rejected before conflict detection. Rejected payloads:

- cannot apply account sync
- cannot mutate learning state
- cannot create idempotency records
- cannot grant paid entitlement
- cannot store raw rejected local state in a digest

Expected JSON shapes are records for saved words, review state, daily stats, and
pack progress; arrays for review events and upgrade interest.

## Owner / Account Boundary

Future real sync must derive owner/account identity from authenticated server
state. Client-provided account IDs are display-only and are never ownership
proof. Cross-account apply is blocked until real auth, owner checks, server
storage, audit redaction, and rollback gates exist.

## Idempotency And Fingerprint Strategy

Preview does not require an idempotency key because it is non-mutating. Future
apply must require a client-generated opaque idempotency key scoped by
authenticated account owner plus apply route.

Future behavior:

- Same account, same key, same fingerprint: replay original redacted outcome
  without mutation.
- Same account, same key, different fingerprint: reject as conflict before
  writes.
- Cross-account replay: blocked.

The mock uses a deterministic design fingerprint over payload version,
`previewOnly`, allowed-key order, per-key value fingerprints, and `requestedAt`.
The strategy documents future canonical JSON SHA-256 behavior without adding a
runtime crypto, network, auth, or storage dependency.

## Conflict Detection Assumptions

Real conflict detection is not implemented. Future conflict detection must have
server state and must identify:

- local-only saved words
- local review events absent from server
- duplicate review events
- stale review state
- pack progress without review-event evidence
- upgrade interest as attribution-only
- local Mastered labels as client claims only

Server Mastered status must require delayed review-event evidence.

## Audit Redaction Rules

Digests and future audit summaries must store counts and fingerprints only.
They must not store raw local snapshots, raw review events, provider tokens,
production secrets, billing/payment payloads, paid entitlement state, or full
account state. Unknown fields default to redacted marker-only treatment.

## Rollback / Discard Behavior

The preview and digest objects can be discarded without any rollback migration
because they do not mutate runtime state. Discarding a preview deletes no saved
words, review state, review events, daily stats, pack progress, or upgrade
interest.

## P0 Blockers

- Real account sync is not implemented.
- Apply/write operation is blocked.
- Auth ownership, server storage, idempotency, conflict resolution, audit
  redaction, rollback, and monitoring gates are not complete as a real system.
- Automatic entitlement remains blocked.
- Public paid beta remains No-Go.

## Recommended Next PR Sequence

Recommended next PR: **#83 Monitoring, support, privacy beta gate**

Then:

- **#84 Private beta readiness rerun**
- **#85 Owner-run private beta launch checklist**

## Safety Confirmation

- Docs/contracts/tests only.
- No runtime UI changes.
- No API routes.
- No route handlers.
- No middleware.
- No auth integrations.
- No database/provider SDKs.
- No payment, billing, checkout, subscription, invoice, billing portal, or
  entitlement mutation.
- No account sync implementation.
- No browser storage mutation.
- No production data mutation.
- No AI calls.
- No env var changes.
- No deployment, Webflow, Cloudflare, Vercel, DNS, secrets, or production data
  changes.
- `npm audit fix` was not run.
