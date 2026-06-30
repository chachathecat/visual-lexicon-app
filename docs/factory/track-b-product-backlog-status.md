# Track B Product Backlog Status Overlay

`docs/factory/track-b-product-backlog-status.v1.json` is the deterministic
status overlay for the Track B factory backlog seed.

The original seed still records the planned task order. This overlay records
what merged Track B evidence has already satisfied, then maps completed or
unsafe items to non-selectable router statuses before the next-task router
chooses work.

## Router Contract

Factory routers should apply the overlay before selection:

1. Load `docs/factory/track-b-product-backlog.v1.json`.
2. Load `docs/factory/track-b-product-backlog-status.v1.json`.
3. For each matching task, use `router_candidate_status` from the overlay.
4. Sort by `task_order`, then `task_id`.
5. Select only candidates whose router status is `ready` or `proposed`.

`verified`, `partial_verified`, `blocked_dependency`, `blocked_human`,
`needs_verification`, and
`stale_not_selectable` are not selectable. `needs_verification` maps to
`blocked_dependency` for the current router because the router status enum does
not include `needs_verification`.

The same input must produce the same ordering and the same status summary.

## Evidence Mapping

| Task | Result | Evidence |
| --- | --- | --- |
| `TB-020` App Shell v2 | `verified` | PR #73, merge `998426fa99856d0122d5ba6bd25fff09e05cee8a` |
| `TB-030` Dashboard v2 | `verified` | PR #74, merge `086b78af43eb273ffeaf1c3494558e0e5f3a1ea7` |
| `TB-040` Review Session v2 | `verified` | PR #75, merge `c0b538e1f49ba8598f031776db094fbd4cbf857d` |
| `TB-050` Saved Library v2 | `verified` | PR #76, merge `3a49691b5be3e10b14aa592bb93e4a573bd7a220` |
| `TB-060` Packs v2 | `verified` | PR #77, merge `98ac47e6fb662917bd6148c3c41e56299f4eeef4` |
| `TB-070` Pricing / Paywall v2 | `verified` | PR #78, merge `c05379ddfa492523d136a747a9084547a6c525fb` |
| `TB-080` Manual QA Execution Report | `verified` | PR #79, merge `e08a4513ae9b8901f1fa2b8686a610e2786bd380` |
| `TB-090` Disabled Account Sync Route Skeleton | `partial_verified` | PR #142 verification artifact records PR #69 decision-only evidence, PR #82 as `TB-100` only, no actual route skeleton, and owner decision required before route files |
| `TB-100` Account Sync Preview / Digest Mock | `verified` | PR #82, commit `49c85451e68d9c67047667b6b92573c6c70be1c9` |
| `TB-110` Private Beta Gate | `blocked_human` | PRs #80, #81, and #83 provide gate evidence, but private beta remains owner-approved and gated |

PR #121 remains `stale_not_selectable`.

## Resulting Next Gap

After applying the overlay, duplicate completed tasks from `TB-020` through
`TB-080` and `TB-100` are not selectable. `TB-090` is no longer a stale
verification task: PR #142 applies the deterministic verification outcome as
`partial_verified`, routes it as `blocked_human`, and keeps it non-selectable
for automatic implementation.

The next safe output is owner action required for `TB-090`: produce an owner
decision packet before any disabled account sync route skeleton files are added.
The router must not turn `TB-090` into runtime account sync implementation.

## Safety Boundaries

This status reconciliation does not implement Dashboard v2, Review v2, Saved
Library v2, Packs v2, Pricing/Paywall v2, runtime UI changes, account sync,
payments, billing, checkout, subscriptions, invoices, billing portal, payment
SDKs, webhooks, entitlement behavior, SRS changes, or local storage contract
changes.

Public paid beta remains blocked.

Private/manual beta remains manual-only, owner-approved, and gated.

Workflows, CODEOWNERS, AGENTS.md, DNS, deployment settings, secrets, Webflow,
Cloudflare Workers, R2 production objects, account schema, RLS, migrations,
production data, production account data, and roadmap statuses remain untouched.
