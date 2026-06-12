# Account Sync Conflict Resolution

## Purpose

This document defines the pure conflict-resolution contract for comparing local
guest/device learning state with future account/server state before real backend
persistence exists.

The resolver in `src/lib/account-persistence/sync-conflicts/` returns a
deterministic resolution plan only. It does not apply writes, read browser
storage, call a network, import auth/database/payment SDKs, or change production
app behavior.

## Non-Goals

- No real auth.
- No database persistence.
- No provider SDKs.
- No `fetch` or network calls.
- No runtime route/component integration.
- No `localStorage` reads or writes.
- No billing, checkout, subscription, invoice, payment, or paid entitlement
  behavior.
- No Webflow, Cloudflare Worker, DNS, Vercel, deployment, secret, environment,
  or production data changes.

## Conflict Categories

- `local_only_saved_word`: local saved word is absent on the server.
- `server_only_saved_word`: server saved word is absent locally.
- `duplicate_saved_word`: same saved word exists in both places.
- `local_review_event_not_on_server`: local event evidence is missing server-side.
- `duplicate_review_event`: same review event already exists or appears twice.
- `idempotency_key_payload_conflict`: same idempotency key has different payloads.
- `local_stronger_than_server`: local state appears stronger than server state.
- `server_stronger_than_local`: server state appears stronger than local state.
- `local_weaker_than_server`: local evidence regresses stronger server state.
- `server_weaker_than_local`: local event evidence improves weaker server state.
- `fake_mastery_risk`: `Mastered` is claimed without sufficient event evidence.
- `stale_review_state`: review state exists without usable event evidence.
- `pack_progress_without_event_evidence`: pack progress lacks review events.
- `upgrade_interest_attribution_only`: upgrade intent is attribution only.
- `unsupported_payload`: payload shape is invalid or outside this contract.

## Resolution Actions

- `import_to_server`: safe future import candidate.
- `keep_server`: preserve account/server state.
- `merge_event_evidence`: add local review event evidence before recomputation.
- `recompute_from_events`: derive review state or progress from event evidence.
- `skip_audit_only`: keep as audit evidence only.
- `reject_blocked`: block the plan until a human/backend policy resolves it.
- `attribution_only`: retain marketing/product attribution only.
- `no_op_duplicate`: duplicate input must not mutate state twice.

## Source-of-Truth Hierarchy

1. Review events are source-of-truth learning evidence.
2. Review state should be recomputed from review events when possible.
3. Server state is preserved when local evidence is missing, stale, or only a
   copied state label.
4. Local weak evidence must not be lost under stronger-looking stale state.
5. Pack progress without review-event evidence stays audit-only.
6. Upgrade interest and billing/payment placeholders never create entitlement.

## Fake Mastery Policy

`Mastered` cannot be imported from local `review_state` alone. A future backend
adapter must prove mastery from sufficient delayed review-event evidence through
the SRS reducer path. If local state claims mastery without evidence, the plan
uses `fake_mastery_risk` with `reject_blocked` or audit-only behavior, and
`importsLocalMasteryLabel` remains `false`.

## Idempotency Policy

Duplicate review events are `no_op_duplicate` and must not advance SRS twice.
If an idempotency key is reused with a different payload, the resolver returns
`idempotency_key_payload_conflict` with `reject_blocked`. The server-side
adapter must preserve the same behavior before any real persistence launch.

## Paid Entitlement Safety Policy

Upgrade interest is always `attribution_only`. Billing/payment placeholders,
pricing clicks, and upgrade-interest records never create paid entitlement.
The resolver plan always reports `grantsPaidEntitlement: false` and
`paidEntitlementPolicy: "never_grant_from_conflict_resolution"`.

## Future Backend Adapter Path

The next adapter should consume this plan and remain disabled/mock-only until
account persistence is approved. It should:

- Accept only typed plan operations.
- Merge review events idempotently.
- Recompute review state and pack progress from event evidence.
- Preserve server state when local evidence is stale or missing.
- Reject idempotency payload conflicts.
- Keep entitlement decisions outside sync conflict resolution.

## Next Recommended PR

#54 Server persistence adapter contract, still disabled and in-memory/mock only.
