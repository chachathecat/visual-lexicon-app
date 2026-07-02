# Track B Owner Command Center

## Purpose

The Track B Owner Command Center is the owner-facing control document for Codex
goal runs. It turns product goals, PR lanes, risk levels, merge gates, and stop
conditions into a small-reviewable draft PR process.

This command center is docs/tests-only. It does not change runtime UI, does not
touch Webflow, does not touch Cloudflare production Workers, does not touch
auth, billing, payment, DNS, deployment, secrets, production data, R2 production
objects, or real user data, does not add real payment, does not unblock public
paid beta, and does not enable auto-merge.

## North Star

Weekly Reviewed Words.

The owner should approve work when it increases the odds that learners review
more words each week, not merely save more words or view more pricing copy.

## Product Formula

```txt
Save -> Review -> SRS state/events -> Due/Weak/Mastered -> Packs/Paywall -> Private beta
```

The owner command center keeps Codex focused on the formula in order. Revenue
surface work must not get ahead of real review state. Private beta must not get
ahead of P0 evidence.

## Command Center Inputs

Every Track B goal run should identify:

- primary lane: Lane A, Lane B, Lane C, or Lane D;
- risk level: P0, P1, or P2;
- intended files;
- blocked surfaces confirmed out of scope;
- validation commands to run;
- manual QA plan for runtime work;
- rollback plan;
- owner approval status.

If any input is missing, ambiguous, or points to a blocked surface, the command
center fails closed and the goal should stop.

## Lane A: Factory / Owner Command Center

Lane A is the default lane for this PR.

Allowed Lane A work:

- owner command center docs;
- PR lane docs;
- merge gate docs;
- runway docs;
- deterministic docs/tests;
- README links to the new operating docs.

Lane A cannot change runtime behavior. Lane A cannot approve launch, payment,
billing, deployment, Webflow, Cloudflare, secrets, production data, real user
data, R2 production objects, or auto-merge.

## Lane B: Core Learning UX

Lane B is for user-facing learning behavior after Lane A gates are in place.

Allowed Lane B work must prove:

- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due, Weak, and Mastered are derived from real review state.
- No fake mastery, fake streaks, fake dashboard metrics, or fake pack progress
  is introduced.

Owner approval is required before Lane B touches auth, account sync, server
persistence, DB schema, RLS, migrations, production data, or real user data.

## Lane C: Revenue Surface

Lane C is for no-payment monetization surfaces only.

Allowed Lane C work:

- pricing/paywall placeholder copy;
- local upgrade-interest capture that states billing is not connected;
- entitlement read-model docs/tests;
- manual entitlement policy docs;
- monetization canonical-source reconciliation.

Lane C blocks real payment, checkout, subscriptions, invoices, billing portal,
payment SDKs, provider API work, paid-access grants, and production billing
settings unless a separate owner-approved payment project exists.

## Lane D: QA / Extension / Analytics

Lane D is for evidence and safe operations.

Allowed Lane D work:

- manual QA checklists and execution reports;
- golden-flow evidence;
- issue logs, pause criteria, support notes, and rollback criteria;
- extension bridge contracts and local extension QA notes;
- privacy-safe analytics event contracts and retention checks;
- accessibility, mobile, and browser QA.

Lane D blocks production analytics data mutation, production account data,
secrets, public launch dashboards that imply paid beta is live, Webflow,
Cloudflare production Workers, billing, payment, DNS, deployment settings, and
auto-merge.

## Risk Levels

### P0 Risk

P0 is a blocker for private/manual beta access or product safety. P0 includes
learning-state correctness, owner signoff, participant access, support/privacy
readiness, refund/cancellation handling, pause/rollback criteria, and any
blocked surface.

P0 requires explicit owner approval when the task implies beta access, launch,
auth/account/server persistence, payment, production data, or infrastructure.

### P1 Risk

P1 is a blocker for beta expansion. P1 includes accessibility, mobile,
analytics retention, extension checks, support readiness, pricing clarity, and
account/auth/server-sync boundaries that must be resolved before expansion.

P1 may proceed as docs/tests-only work without launch authority.

### P2 Risk

P2 is product hardening. P2 includes pack quality, prompt clarity, weak-word
practice, mistake-record inspection, and visual polish.

P2 cannot override P0 or P1. P2 cannot authorize fake mastery, real payment,
launch, or auto-merge.

## Allowed Vs Blocked Surfaces

Allowed in this command-center PR:

- Track B docs;
- Track B tests;
- README links to the command center docs;
- safe mock/static data only when required by tests.

Blocked in this command-center PR:

- runtime UI;
- Webflow;
- Cloudflare production Workers;
- auth behavior changes;
- billing, payment, checkout, subscription, invoice, billing portal, payment
  SDK, Stripe, Paddle, or provider API work;
- DNS or deployment settings;
- secrets or tokens;
- production data, real user data, production account data, or R2 production
  objects;
- public paid beta;
- private/manual beta launch;
- participant invites;
- real entitlement grants;
- auto-merge.

## Merge Order

1. Merge Lane A command-center, PR-lane, merge-gate, and runway contracts.
2. Merge only the smallest next Lane B learning-loop PR that has focused tests.
3. Merge Lane D evidence that proves the changed runtime path is safe.
4. Merge Lane C no-payment revenue surface work only after learning-loop claims
   are true.
5. Prepare owner signoff only after all P0 gates have current evidence.

When two PRs compete, choose the one that protects Weekly Reviewed Words and
reduces owner ambiguity first.

## Owner Approval Requirements

Explicit owner approval is required before:

- any P0 launch, participant, auth/account, server persistence, production
  data, infrastructure, billing, or payment decision;
- any change to workflow automation, protected safety docs, release criteria,
  or auto-merge behavior;
- any PR that crosses lanes instead of staying small;
- any runtime change that lacks a focused test or manual QA path.

Approval evidence must name the exact decision. A vague comment is not enough
to launch beta, charge users, grant access, or touch blocked surfaces.

## Stop Conditions

Stop when:

- validation fails or has not run;
- the task needs Webflow, Cloudflare production Workers, auth, billing,
  payment, DNS, deployment, secrets, production data, R2 production objects, or
  real user data;
- the task would add real payment, charge users, grant real entitlements,
  invite participants, launch beta, or enable auto-merge;
- fake mastery or fake progress would be introduced;
- due, weak, or mastered state is not derived from real review state;
- owner approval is required and missing;
- the PR is too broad for one small draft.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```

Report failures honestly. Do not claim validation passed unless the command ran.
