# Owner Minimal-Intervention Queue

`docs/factory/owner-minimal-intervention-queue.v1.json` is the deterministic
owner queue after merged factory/status work. It assumes the current expected
state after PR #150:

- PR #147 is merged at `b4dd352f8ece4a660d983365ae60169b4c83566d`.
- PR #149 is merged at `fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6`.
- PR #148 is merged at `4560e556ff682f3813983f4bc4f07c7868255ad9`.
- PR #150 is merged at `96d53a7bd3f054aaa9b2af43f04feab43b97304c`.
- The TB-090 verification outcome is applied.
- The TB-090 owner decision packet exists as actual evidence.
- TB-090 remains `partial_verified` / `blocked_human` / not auto-selectable.
- TB-090 does not implement account sync.
- TB-090 does not approve disabled route skeleton runtime files.
- TB-100 remains verified via PR #82.
- TB-110 remains `blocked_human` / owner-action-required.
- The TB-110 owner action packet exists as actual evidence at
  `docs/factory/tb-110-private-beta-owner-action-packet.v1.json`.
- The TB-110 owner action packet markdown exists as actual evidence at
  `docs/factory/tb-110-private-beta-owner-action-packet.md`.
- TB-110 owner action packet work is not reselectable.
- The post-merge handoff generator exists as actual evidence at
  `docs/factory/post-merge-handoff-generator.v1.json`.
- The post-merge handoff generator markdown exists as actual evidence at
  `docs/factory/post-merge-handoff-generator.md`.
- The CI failure triage seed exists as actual evidence at
  `docs/factory/ci-failure-triage-seed.v1.json`.
- The CI failure triage seed markdown exists as actual evidence at
  `docs/factory/ci-failure-triage-seed.md`.
- `POST-MERGE-HANDOFF-GENERATOR` is not reselected.
- PR #121 remains closed/stale/superseded and not auto-selectable.
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

PR #150 is treated as the latest merged factory/status state. The merged state
records the post-merge handoff generator and the CI failure triage seed as
actual evidence, but only as docs/tests packet evidence. It does not authorize
account sync, disabled route skeleton runtime files, private/manual beta launch,
public paid beta launch, invites, entitlement grants, API routes, auth/session
changes, middleware, database changes, entitlement changes, payment, billing, or
production mutations.

TB-100 is already verified through PR #82 and is not reselected. TB-110 remains
blocked-human because private/manual beta launch requires owner action. The
already-merged TB-110 owner action packet is not selected again. The
already-merged `POST-MERGE-HANDOFF-GENERATOR` output is not selected again.

## Closed Stale PRs

PR #121 is the closed stale PR in this packet. It remains:

- closed;
- stale;
- superseded;
- `stale_not_selectable`;
- not auto-selectable;
- not auto-mergeable;
- not owner-action-required.

Implementation code must not reopen, close, merge, label, comment on, or
otherwise mutate PR #121.

## Next Safe Outputs

After PR #150, the next safe owner output is:

1. Owner queue post-handoff audit packet.

The post-merge handoff generator was already merged in PR #150 and must not be
selected again. The remaining output is owner-only audit work. It is not a
runtime implementation task and it does not permit live GitHub mutations.

## Blocked-Human Decisions

The blocked-human queue contains TB-090, TB-110, public paid beta, and
private/manual beta. Every blocked-human item requires owner approval and is not
auto-selectable. PR #121 is closed/stale/superseded, not a blocked-human queue
candidate.

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

Run the targeted packet specs:

```powershell
npm.cmd run test -- tests/factory-post-merge-handoff-generator-outcome.spec.ts tests/factory-owner-minimal-intervention-queue.spec.ts --workers=1
npm.cmd run test -- tests/factory-post-merge-handoff-generator.spec.ts tests/factory-ci-failure-triage-seed.spec.ts tests/factory-post-merge-handoff-generator-outcome.spec.ts --workers=1
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
You are working in C:\Users\jmg91\Desktop\visual-lexicon-app-post-merge-handoff-outcome on chachathecat/visual-lexicon-app.
Goal: create a docs/tests-only owner queue post-handoff audit packet.
Use the post-PR #150 owner minimal-intervention queue, post-merge handoff generator, CI failure triage seed, and generator outcome packet as input evidence.
PR #150 is merged at 96d53a7bd3f054aaa9b2af43f04feab43b97304c, so POST-MERGE-HANDOFF-GENERATOR must not be selected again.
PR #147 is merged at b4dd352f8ece4a660d983365ae60169b4c83566d, so the TB-110 owner action packet must not be selected again.
Do not reopen, close, merge, label, comment on, or otherwise mutate GitHub from implementation code.
Do not implement account sync, route skeletons, API routes, auth/session behavior, middleware, DB/schema/RLS/migrations/account data, entitlements, payments, billing, runtime UI, workflows, CODEOWNERS, AGENTS.md, DNS, deployment, secrets, Webflow, Cloudflare Workers, R2 production objects, production data, or roadmap status changes.
Public paid beta remains blocked. Private/manual beta remains gated. Owner approval is required for blocked-human tasks.
Add targeted tests proving PR #150 merged evidence is represented, POST-MERGE-HANDOFF-GENERATOR is not selected again, protected surfaces remain untouched, and no live mutation or auto-merge is enabled.
```

## Merge Recommendation

Merge this docs/tests packet only after required validation passes. Do not
auto-merge it. Do not merge PR #121 automatically. Do not reselect
`POST-MERGE-HANDOFF-GENERATOR`. Do not merge any packet that touches protected
surfaces or treats missing, stale, unknown, failed, or no-op-only validation as
ready.

## Post-Merge Next Action

After this packet merges, prepare the owner queue post-handoff audit packet.

Do not reselect TB-090, do not reselect TB-090 owner-decision-packet work, do
not reselect the TB-110 owner action packet, do not reselect
`POST-MERGE-HANDOFF-GENERATOR`, do not implement account sync, do not add API
routes, do not enable public paid beta, do not launch private/manual beta, do
not enable auto-merge, and do not perform live GitHub mutations from
implementation code.
