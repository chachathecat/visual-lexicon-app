# Track B Owner Approval Gates

## Purpose

These gates define when Codex `/goal` must stop and wait for explicit owner
approval while moving Track B toward a private/manual paid beta.

This gate contract does not authorize beta launch, public launch, participant
invites, charging, real entitlement grants, payment, billing, production data
mutation, or auto-merge.

## P0 Gates: Required Before Private/Manual Paid Beta Access

P0 gates are hard blockers. If any P0 gate is missing, the goal must stop before
private/manual paid beta access.

- Learning loop works locally: save creates or preserves review state.
- Review answers create required events and update memory state.
- Due, Weak, and Mastered are derived from real review state.
- No fake mastery, fake streaks, fake dashboard metrics, or fake pack progress.
- Current manual QA execution report exists.
- Owner-approved participant list exists.
- Participant disclosure covers browser-local learning state, localStorage
  limits, support path, privacy expectations, refund/cancellation handling, and
  beta limits.
- Monitoring issue log, pause criteria, and rollback criteria exist.
- Safety confirmation says Webflow, Cloudflare production Workers, auth,
  billing, payment, DNS, deployment settings, secrets, production data, and real
  user data were not touched.
- Explicit owner approval is recorded in the PR or owner packet.

## P1 Gates: Required Before Private Beta Expansion

P1 gates are required before broadening beyond a narrow owner-run/manual beta.

- Accessibility and mobile QA evidence is current.
- Golden flows cover save, review due, review weak, dashboard mission, packs,
  pricing placeholder, and settings.
- Privacy-safe analytics event contracts and retention boundaries are verified.
- Extension bridge behavior is tested when extension work is in scope.
- Account sync, auth behavior, server persistence, DB schema, RLS, migrations,
  and production account data remain blocked unless separately owner-approved.
- Revenue surfaces continue to state that billing is not connected unless a
  future owner-approved payment project exists.

## P2 Gates: Product Hardening After P0/P1

P2 gates improve product quality but do not permit launch when P0 or P1 is
missing.

- Review prompts and mistake records are clearer.
- Weak-word practice is easier to find and complete.
- Dashboard keeps Today Memory Mission, Start Review, Practice Weak Words, and
  Continue Deck ahead of passive saved-library browsing.
- Pack quality and visual metaphor coverage improve.
- UX polish remains calm, premium, minimal, warm, credible, and
  learning-focused.
- AI explanation work remains deferred until the SRS loop is reliable.

## Merge Order

1. Merge Lane A runway, lane, gate, validation, and stop-condition contracts.
2. Merge Lane B learning-loop changes only when Save -> Review -> SRS
   state/events are covered by focused tests.
3. Merge Lane D QA, accessibility, mobile, extension, issue-log, support,
   pause, and rollback evidence before beta expansion.
4. Merge Lane C no-payment revenue-surface updates only when they keep billing
   disconnected and avoid paid-access claims.
5. Merge an owner signoff packet only after P0 gates pass.

Do not merge a gate packet as launch approval. Do not merge payment, billing,
deployment, DNS, Webflow, Cloudflare, production-data, real-user-data, or
auto-merge work from this gate contract.

## Approval Record Requirements

Any PR that claims an owner gate must include:

- primary lane: A, B, C, or D;
- gate tier: P0, P1, or P2;
- owner approval evidence when required;
- validation commands and results;
- manual QA notes for runtime work;
- risk and rollback notes;
- safety confirmation for blocked surfaces;
- statement that auto-merge remains disabled.

## Owner Approval Requirements

Explicit owner approval is required before:

- launching public paid beta or private/manual beta;
- inviting participants;
- charging users;
- granting real entitlements;
- touching auth behavior, account sync, server persistence, DB schema, RLS, or
  migrations;
- touching Webflow, Cloudflare production Workers, DNS, deployment settings,
  billing, payment, secrets, production data, real user data, or R2 production
  objects;
- changing workflow automation, release gates, or auto-merge behavior;
- expanding a PR beyond its selected lane.

Approval evidence must be recorded in the PR or owner packet with the specific
approved action, approver, date, lane, risk level, validation evidence, manual
QA notes when runtime work is involved, risk notes, rollback notes, and safety
confirmation.

## Allowed Vs Blocked Surfaces

Allowed with normal review:

- Track B docs and tests;
- approved local Track B app code for a lane-scoped task;
- safe mock/static data;
- README links to operating docs.

Owner approval required before work starts:

- auth behavior changes;
- account sync;
- server persistence;
- DB schema, RLS, or migrations;
- production analytics wiring;
- participant invite operations;
- entitlement-grant processes.

Blocked without explicit new authorization:

- Webflow publishing or CMS mutation;
- Cloudflare production Worker mutation;
- billing, payment, checkout, subscription, invoice, billing portal, payment
  SDK, Stripe, Paddle, or provider API work;
- DNS, deployment settings, secrets, production data, real user data, production
  account data, or R2 production object mutation;
- public paid beta launch;
- private/manual beta launch;
- auto-merge.

## Stop Conditions

Stop and ask the owner when:

- a P0 gate is missing but the task implies beta access;
- a P1 gate is missing but the task expands beta scope;
- a blocked surface is required;
- owner approval evidence is absent or ambiguous;
- validation is missing, failing, stale, or no-op-only;
- runtime behavior changes lack focused tests and manual QA notes;
- the PR would be too large to review safely;
- the task would charge users, grant access, invite participants, launch public
  paid beta, or enable auto-merge.

## Validation Commands

Run these before finishing gate PRs:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

For this gate contract, also run:

```powershell
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```
