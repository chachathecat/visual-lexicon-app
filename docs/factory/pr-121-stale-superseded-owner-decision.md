# PR #121 Stale/Superseded Owner Decision Packet

## Goal

Record the owner-manual decision path for PR #121 after the merged owner minimal-intervention queue from PR #145.

This packet does not close PR #121. It records why PR #121 is stale/superseded and keeps the actual lifecycle action manual-only.

## Current state

- PR #145 is merged.
- The owner minimal-intervention queue identifies PR #121 as stale/open/not auto-selectable.
- PR #121 remains open until an owner manually closes it.
- PR #121 must not be auto-merged.
- PR #121 must not be treated as implementation-ready.
- Public paid beta remains blocked.
- Private/manual beta remains gated.

## Superseding evidence

PR #121 was based on older Track B product/UI readiness evidence. Later merged work now supersedes the need to merge it:

- PR #137: Track B product/UI readiness audit.
- PR #138: next-task run packet generator.
- PR #139: Track B product backlog seed.
- PR #140: PR readiness owner queue summarizer.
- PR #141: Track B backlog status reconciliation.
- PR #142: TB-090 account sync skeleton verification artifact.
- PR #143: TB-090 verification outcome applied to status overlay.
- PR #144: TB-090 owner decision packet outcome and evidence.
- PR #145: owner minimal-intervention queue packet.

## Owner decision

Recommended owner action:

```txt
Manually close PR #121 as stale/superseded.
```

The recommended close action is manual-only. This packet does not perform any GitHub mutation.

## Non-actions

This packet does not:

- close PR #121
- auto-merge PR #121
- create GitHub comments or labels
- perform live GitHub mutations from implementation code
- change runtime UI
- implement account sync
- add API route handlers
- change auth/session behavior
- change middleware
- change DB/schema/RLS/migrations/account data
- mutate entitlements
- change payment, billing, checkout, subscriptions, invoices, webhooks, or provider settings
- change workflows, CODEOWNERS, AGENTS.md, DNS, deployment, secrets, Webflow, Cloudflare Workers, R2 production objects, production data, or roadmap status

## Invariants

- TB-090 remains `partial_verified` / `blocked_human` / not auto-selectable.
- TB-090 owner decision packet remains existing evidence only.
- TB-090 does not approve account sync implementation.
- TB-090 does not approve disabled route skeleton runtime files.
- TB-100 remains verified via PR #82.
- TB-110 remains `blocked_human` / owner-action-required.
- Public paid beta remains blocked.
- Private/manual beta remains gated.
- Auto-merge remains disabled.
- Live mutations remain disabled from implementation code.

## Post-merge next action

After this packet merges, the next safe sequence is:

1. Owner may manually close PR #121 as stale/superseded.
2. Prepare the TB-110 private beta owner action packet.
3. Prepare the post-merge handoff generator.

## Validation

Expected validation:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/factory-pr-121-stale-superseded-owner-decision.spec.ts --workers=1
npm.cmd run test -- --workers=1
```

## Merge recommendation

Human approval required. Do not auto-merge.
