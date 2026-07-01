# Owner Minimal-Intervention Queue

`docs/factory/owner-minimal-intervention-queue.v1.json` is the deterministic
owner queue after merged factory/status work. It assumes the current expected
state after PR #144:

- PR #144 is merged.
- The TB-090 verification outcome is applied.
- The TB-090 owner decision packet exists as actual evidence.
- TB-090 remains `partial_verified` / `blocked_human` / not auto-selectable.
- TB-090 does not implement account sync.
- TB-090 does not approve disabled route skeleton runtime files.
- TB-100 remains verified via PR #82.
- TB-110 remains `blocked_human` / owner-action-required.
- PR #121 remains stale, open, and not auto-selectable.
- Public paid beta remains blocked.
- Private/manual beta remains gated.

## Queue Contract

The queue is docs/tests-only and fail-closed:

- stale PRs are not auto-mergeable;
- protected surfaces block implementation;
- public paid beta remains blocked;
- private/manual beta remains gated;
- owner approval is required for blocked-human tasks;
- auto-merge remains disabled;
- live GitHub mutations remain disabled;
- unknown or stale evidence is not treated as ready.

The same input must produce the same owner queue output. Queue entries are
ordered by `rank`, then `id`.

## Latest Merged Factory State

PR #144 is treated as the latest merged factory/status state. The merged state
records the TB-090 owner decision packet as actual evidence, but only as
packet-production evidence. It does not authorize account sync, disabled route
skeleton runtime files, API routes, auth/session changes, middleware, database
changes, entitlement changes, payment, billing, or production mutations.

TB-100 is already verified through PR #82 and is not reselected. TB-110 remains
blocked-human because private/manual beta launch requires owner action.

## Open Stale PRs

PR #121 is the only open stale PR in this packet. It remains:

- open;
- stale;
- `stale_not_selectable`;
- not auto-selectable;
- not auto-mergeable;
- owner-action-required.

Implementation code must not close, merge, label, comment on, or otherwise
mutate PR #121.

## Next Safe Outputs

After PR #144, the next safe owner outputs are:

1. PR #121 close as stale/superseded owner decision.
2. TB-110 private beta owner action packet.
3. Post-merge handoff generator.

These are owner packets and handoff work only. They are not runtime
implementation tasks and they do not permit live GitHub mutations.

## Blocked-Human Decisions

The blocked-human queue contains PR #121, TB-090, TB-110, public paid beta, and
private/manual beta. Every blocked-human item requires owner approval and is not
auto-selectable.

## Release Gates

Public paid beta remains blocked on account-owned persistence,
server-authoritative entitlements, payment/provider policy, support/privacy and
refund operations, production monitoring and rollback, accessibility and mobile
manual QA, trusted analytics, production pack entitlement evidence, and owner
public launch signoff.

Private/manual beta remains gated, manual-only, and owner-approved only. This
packet does not invite participants, charge anyone, grant entitlement, or launch
beta access.

## Protected Surfaces

The queue blocks implementation touching runtime UI, account sync, disabled
route skeleton runtime files, API routes, auth/session behavior, middleware,
database/schema/RLS/migrations/account data, entitlement mutation, payment,
billing, checkout, subscriptions, invoices, webhooks, provider settings,
workflows, CODEOWNERS, AGENTS.md, DNS, deployment, secrets, Webflow, Cloudflare
Workers, R2 production objects, production data, and roadmap status.

## Required Validation

Run the targeted packet spec:

```powershell
npm.cmd run test -- tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1
```

Before finishing, run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

## Codex Prompt Draft

```txt
You are working in C:\Users\jmg91\Desktop\visual-lexicon-app-owner-queue on chachathecat/visual-lexicon-app.
Goal: create a docs/tests-only owner decision packet for PR #121 as stale/superseded.
Use the post-PR #144 owner minimal-intervention queue as input evidence.
Do not close, merge, label, comment on, or otherwise mutate GitHub from implementation code.
Do not implement account sync, route skeletons, API routes, auth/session behavior, middleware, DB/schema/RLS/migrations/account data, entitlements, payments, billing, runtime UI, workflows, CODEOWNERS, AGENTS.md, DNS, deployment, secrets, Webflow, Cloudflare Workers, R2 production objects, production data, or roadmap status changes.
Public paid beta remains blocked. Private/manual beta remains gated. Owner approval is required for blocked-human tasks.
Add targeted tests proving PR #121 is stale/open/not auto-selectable and no live mutation or auto-merge is enabled.
```

## Merge Recommendation

Merge this docs/tests packet only after required validation passes. Do not
auto-merge it. Do not merge PR #121 automatically. Do not merge any packet that
touches protected surfaces or treats missing, stale, unknown, failed, or
no-op-only validation as ready.

## Post-Merge Next Action

After this packet merges, prepare the PR #121 close-as-stale/superseded owner
decision packet, then the TB-110 private beta owner action packet, then the
post-merge handoff generator.

Do not reselect TB-090, do not reselect TB-090 owner-decision-packet work, do
not implement account sync, do not add API routes, do not enable public paid
beta, do not launch private/manual beta, do not enable auto-merge, and do not
perform live GitHub mutations from implementation code.
