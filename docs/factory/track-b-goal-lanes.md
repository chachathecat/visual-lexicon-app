# Track B Goal Lanes

## Purpose

These lanes give Codex `/goal` a deterministic way to choose small Track B
draft PRs without drifting into launch, billing, infrastructure, or production
data work.

This lane contract does not launch private/manual beta, launch public paid
beta, charge users, grant real entitlements, or enable auto-merge.

The lanes are ordered by control surface, not by product importance. A task may
reference other lanes, but each PR should have one primary lane and one
reviewable outcome.

## Lane A: Factory / Owner Command Center

Mission: keep the factory safe, deterministic, and owner-reviewable.

Allowed task shapes:

- owner command center packets;
- next-task, queue, handoff, readiness, and stop-condition docs;
- deterministic docs/tests that prove blocked surfaces stay blocked;
- README links to new factory or goal docs.

Expected files:

- `docs/factory/**`;
- `docs/goals/**`;
- `tests/factory-*.spec.ts`;
- `README.md` links when useful.

Required evidence:

- docs describe non-actions and blocked surfaces;
- tests assert lane, gate, validation, and safety contracts;
- PR body says no runtime behavior changed.

Stop if the task needs runtime UI, account sync, auth, payment, billing,
deployment, secrets, Webflow, Cloudflare production Workers, production data,
live GitHub mutations from implementation code, or auto-merge.

## Lane B: Core Learning UX

Mission: improve Weekly Reviewed Words by strengthening Save -> Review -> SRS.

Allowed task shapes:

- dashboard memory mission improvements;
- review session reliability;
- saved-library behavior that creates or preserves review state;
- Due, Weak, and Mastered derivation from real review state;
- pack progress that is grounded in real local review state.

Expected files:

- `src/app/dashboard/**`;
- `src/app/saved/**`;
- `src/app/review/**`;
- `src/app/packs/**`;
- `src/app/word/**`;
- `src/components/**`;
- `src/lib/srs/**`;
- `src/lib/review/**`;
- focused tests under `tests/*.spec.ts`.

Required evidence:

- save creates or preserves review state;
- review answers create events and update memory state;
- no fake mastery, fake dashboard metrics, or fake pack progress;
- localStorage key contracts are preserved.

Stop if the task needs account sync, production persistence, auth behavior
changes, DB schema, RLS, migrations, production data, AI Tutor, or fake mastery.

## Lane C: Revenue Surface

Mission: make upgrade interest and plan messaging clear without adding real
payment.

Allowed task shapes:

- pricing/paywall placeholder copy;
- local upgrade-interest capture;
- entitlement read-model docs or tests;
- manual payment/entitlement policy docs;
- plan catalog consistency with monetization canonical sources.

Expected files:

- `src/app/pricing/**`;
- `src/components/paywall-prompt.tsx`;
- `src/components/local-paywall-trigger-panel.tsx`;
- `src/lib/paywall/**`;
- `src/lib/entitlements/**`;
- `docs/monetization/**`;
- focused paywall, entitlement, and docs tests.

Required evidence:

- copy does not claim checkout, subscription, billing, or paid access is live;
- billing remains disconnected unless a future owner-approved payment project
  exists;
- no real entitlement grants are created.

Stop if the task needs real payment, checkout, subscription, invoice, billing
portal, payment SDK, Stripe, Paddle, provider API work, paid-access grant,
production billing settings, or public paid beta launch.

## Lane D: QA / Extension / Analytics

Mission: collect beta-readiness evidence and safe operational signals.

Allowed task shapes:

- manual QA plans, smoke reports, golden-flow evidence, issue logs, and rollback
  criteria;
- extension bridge contracts and manual extension QA notes;
- privacy-safe analytics event and retention contracts;
- accessibility, mobile, and browser QA checks.

Expected files:

- `docs/*QA*.md`;
- `docs/*BETA*.md`;
- `docs/*ANALYTICS*.md`;
- `src/lib/extension/**`;
- `src/lib/analytics/**`;
- focused QA, extension, analytics, and accessibility tests.

Required evidence:

- QA notes identify the exact flows checked;
- analytics avoids secrets, production data, and real user data;
- rollback and pause criteria are clear for beta operations.

Stop if the task needs production analytics data mutation, real user data,
account data, deployment settings, secrets, public launch dashboards, Webflow,
Cloudflare production Workers, payment, billing, or auto-merge.

## Lane Selection Rules

1. Select Lane A for factory planning, owner control, safety, or routing work.
2. Select Lane B for learning-loop product behavior.
3. Select Lane C for no-payment pricing, upgrade interest, paywall placeholder,
   or entitlement read-model work.
4. Select Lane D for QA, extension bridge, analytics, accessibility, and
   release evidence.
5. Split work when a task crosses lane boundaries.
6. Use owner approval gates before high-risk, account, auth, persistence,
   production, or launch-adjacent work.

## Merge Order

1. Lane A docs/tests contracts that define the runway, goal lanes, owner
   approval gates, validation, and stop rules.
2. Lane B core learning PRs that prove Save -> Review -> SRS state/events
   using real review state and focused tests.
3. Lane D QA evidence for golden flows, accessibility, mobile, extension, issue
   logging, support, pause, and rollback.
4. Lane C no-payment revenue surface updates that stay reconciled with
   monetization canonical sources.
5. Owner signoff packet for private/manual beta only after P0 gates pass.

Do not merge later lanes to imply launch readiness when earlier gates are
missing. Do not merge payment, billing, deployment, DNS, Webflow, Cloudflare, or
production-data work from this lane contract.

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

Approval evidence must name the approved action, approver, date, lane, risk
level, validation evidence, manual QA notes when runtime work is involved, risk
notes, rollback notes, and safety confirmation.

## Gate Summary

- P0 blocks private/manual beta access until core review state, manual QA,
  participant disclosure, support/privacy/refund/cancellation, issue log,
  rollback, pause criteria, safety, and owner approval are complete.
- P1 blocks expansion until accessibility, mobile, analytics, extension, and
  account/auth/server-sync boundaries are resolved.
- P2 tracks hardening work that improves quality but never overrides P0 or P1.

## Allowed Vs Blocked Surfaces

Allowed surfaces:

- Track B docs, tests, approved local app code, safe mock/static data, and
  localStorage MVP contracts.

Blocked surfaces:

- Webflow, Cloudflare production Workers, R2 production objects, DNS,
  deployment settings, secrets, production data, real user data, billing,
  payment, checkout, subscriptions, invoices, payment SDKs, provider settings,
  account schema, RLS, migrations, public paid beta launch, private/manual beta
  launch, participant invites, real entitlement grants, live GitHub mutations
  from app code, and auto-merge.

## Stop Conditions

Stop and ask for owner approval when:

- a blocked surface is required;
- validation fails or is missing;
- the branch contains unrelated changes;
- the task is too large for a small draft PR;
- runtime behavior changes without focused tests;
- mastery, metrics, streaks, due state, weak state, or pack progress would be
  faked;
- the task would launch beta, charge users, invite participants, or grant real
  access.

## Validation Commands

Run these before finishing lane PRs:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

For this lane contract, also run:

```powershell
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```
