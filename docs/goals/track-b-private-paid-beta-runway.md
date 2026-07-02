# Track B Private Paid Beta Goal Runway

## Purpose

This runway defines how Codex may drive Visual Lexicon Track B through small
draft PRs while the owner keeps control of launch, payment, infrastructure, and
production-data decisions.

This is a docs/tests-only operating contract. It does not change runtime UI,
does not launch private/manual beta, does not launch public paid beta, does not
invite participants, does not charge users, does not grant real entitlements,
does not add real payment, does not touch Webflow, does not touch Cloudflare
production Workers, and does not enable auto-merge.

This runway does not unblock public paid beta.

## North Star

Weekly Reviewed Words.

Saved words, pack previews, pricing interest, and traffic matter only when they
increase the number of words learners actually review each week.

## Product Formula

```txt
Save -> Review -> SRS state/events -> Due/Weak/Mastered -> Packs/Paywall -> Private beta
```

Implementation work must respect the deeper learning loop:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

Save is not enough. Review answers must write real review events and update real
memory state. Due, Weak, and Mastered surfaces must be derived from real review
state, not fake metrics or placeholder progress.

## Goal Lanes

### Lane A: Factory / Owner Command Center

Lane A owns the operating system for safe Codex work.

Allowed:

- docs/factory owner packets, queue rules, merge gates, handoff packets, and
  lane contracts;
- docs/goals runway updates;
- deterministic factory tests under `tests/factory-*.spec.ts`;
- README links to operating docs;
- PR templates, validation expectations, risk notes, rollback notes, and safety
  confirmations.

Blocked:

- runtime UI changes;
- app code that mutates GitHub, Webflow, Cloudflare, DNS, billing, payment,
  deployment, secrets, production data, or real user data;
- auto-merge;
- launch approval.

### Lane B: Core Learning UX

Lane B owns the user-facing learning loop.

Allowed:

- small changes to approved Track B routes and existing components;
- save behavior that creates or preserves review state;
- review answers that create events and update memory state;
- Due, Weak, and Mastered derivation from real review state;
- focused runtime tests and manual QA notes for changed behavior.

Blocked:

- fake mastery, fake streaks, fake dashboard metrics, or fake pack progress;
- random easy distractors as the main quiz method;
- AI Tutor functionality before the SRS loop works;
- auth, account sync, server persistence, DB schema, migrations, or production
  data work without explicit owner approval.

### Lane C: Revenue Surface

Lane C owns no-payment revenue intent and plan messaging.

Allowed:

- pricing and paywall placeholder copy;
- local upgrade-interest capture that clearly says billing is not connected;
- entitlement read-model docs and tests;
- manual entitlement policy docs;
- reconciliation with the canonical monetization JSON and spec.

Blocked:

- real payment, checkout, subscription, invoice, billing portal, payment SDK,
  Stripe, Paddle, or provider API integration;
- granting real paid access;
- production billing settings;
- public paid beta claims.

### Lane D: QA / Extension / Analytics

Lane D owns beta-readiness evidence and safe operational signals.

Allowed:

- golden-flow QA plans and execution reports;
- issue logs, pause criteria, rollback criteria, and support evidence;
- extension bridge contracts and local extension QA notes;
- privacy-safe analytics event contracts and retention checks;
- accessibility, mobile, and browser QA test updates.

Blocked:

- production analytics data mutation;
- production user data or account data mutation;
- public launch dashboards that imply paid beta is live;
- secrets, tokens, provider keys, billing, payment, Webflow, Cloudflare
  production Workers, DNS, deployment settings, or auto-merge.

## Risk Levels

### P0 Risk: Launch, Learning-State, Payment, Production, Or Safety Blocker

P0 work can block private/manual beta. It requires explicit owner approval when
it touches launch readiness, owner signoff, participant access, auth/account
boundaries, server persistence, production data, payment, billing, or any
blocked surface.

P0 must stop if:

- save does not create or preserve review state;
- review answers do not create events and update memory state;
- Due, Weak, or Mastered can be faked;
- owner approval is required but missing;
- any blocked surface is needed.

### P1 Risk: Expansion, Reliability, Or Evidence Gap

P1 work can delay beta expansion. It covers accessibility evidence, mobile QA,
analytics safety, extension checks, pricing clarity, support readiness, and
account/auth/server-sync boundaries that are not yet implementation-approved.

P1 work may proceed only when it stays docs/tests-only or has lane-specific
runtime approval and focused tests.

### P2 Risk: Product Hardening

P2 work improves quality after P0/P1 gates are respected. It includes pack
quality, prompt clarity, weak-word practice polish, mistake-record visibility,
and calm premium UI refinement.

P2 never overrides P0 or P1. A polish task cannot authorize launch, payment,
auto-merge, or fake-learning shortcuts.

## Allowed Vs Blocked Surfaces

| Surface | Status | Notes |
| --- | --- | --- |
| Track B docs | Allowed | This PR type may update docs and README links. |
| Track B tests | Allowed | Focused Playwright and contract tests are allowed. |
| Safe mock/static data | Allowed | Must not be production data or imply real paid access. |
| Track B local app code | Lane-gated | Not allowed in this docs/tests-only runway PR. |
| Webflow | Blocked | No publishing, CMS mutation, or Track A changes. |
| Cloudflare production Workers | Blocked | No production Worker mutation. |
| Auth/account sync | Owner-gated | No behavior change without explicit owner approval. |
| Billing/payment/DNS/deployment | Blocked | Includes checkout, subscriptions, invoices, payment SDKs, and provider settings. |
| Secrets/tokens | Blocked | Do not request, move, expose, or commit secrets. |
| Production data or real user data | Blocked | No mutation, deletion, migration, or export. |
| R2 production objects | Blocked | No delete or mutation. |
| Public paid beta | Blocked | This runway does not unblock launch. |
| Private/manual beta launch | Blocked | Requires separate owner approval and P0 evidence. |
| Auto-merge | Blocked | Do not auto-merge. Draft PRs only unless the owner explicitly says otherwise. |

## Merge Order

1. Lane A docs/tests contracts that define the owner command center, PR lanes,
   merge gates, validation, and stop rules.
2. Lane B core learning fixes that prove Save -> Review -> SRS state/events
   using real review state and focused tests.
3. Lane D QA evidence for golden flows, accessibility, mobile, extension, issue
   logging, support, pause, and rollback.
4. Lane C no-payment revenue surface updates that stay reconciled with
   monetization canonical sources.
5. Owner signoff packet for private/manual beta only after P0 gates pass.

Do not merge later lanes to imply launch readiness when earlier gates are
missing. Do not merge payment, billing, deployment, DNS, Webflow, Cloudflare, or
production-data work from this runway.

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

Owner approval evidence must be written in the PR or owner packet with the
specific approved action, approver, date, lane, risk level, validation evidence,
manual QA notes when runtime work is involved, risk notes, rollback notes, and
safety confirmation.

## Stop Conditions

Stop and ask for owner approval when:

- the task needs a blocked surface;
- the task would unblock public paid beta or private/manual beta;
- the task would invite participants, charge users, or grant real entitlements;
- the task would add real payment;
- the task would enable auto-merge;
- validation fails, is missing, or is not understood;
- changed files include unrelated user work;
- runtime behavior changes without focused tests;
- review state, review events, mastery, dashboard metrics, streaks, due state,
  weak state, or pack progress would be faked;
- owner approval evidence is required but absent or ambiguous.

## Validation Commands

Run the full repository validation required by Track B operating rules:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

Run the focused runway contract test for this PR:

```powershell
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```

If a command is missing or fails, report it. Do not claim a check passed unless
it actually ran.

## Draft PR Rule

Open small draft PRs. Include lane, risk level, validation, manual QA notes when
applicable, safety confirmation, rollback notes, and owner approval status.
This runway does not authorize beta launch and does not authorize auto-merge.
