# Track B Merge Gates

## Purpose

Track B merge gates define what must be true before a Codex draft PR can move
from local work to owner review and, later, merge. They keep the paid learning
app from drifting into unsafe launch, payment, infrastructure, or fake-learning
work.

This merge-gate contract is docs/tests-only. It does not change runtime UI,
does not touch Webflow, does not touch Cloudflare production Workers, does not
touch auth, billing, payment, DNS, deployment, secrets, production data, R2
production objects, or real user data, does not add real payment, does not
unblock public paid beta, and does not enable auto-merge.

## North Star

Weekly Reviewed Words.

Merge decisions should favor the PR that most directly protects or improves
repeat review behavior.

## Product Formula

```txt
Save -> Review -> SRS state/events -> Due/Weak/Mastered -> Packs/Paywall -> Private beta
```

The merge gate blocks any PR that jumps to Packs/Paywall or Private beta while
Save, Review, SRS state/events, or Due/Weak/Mastered evidence is missing.

## Lane A: Factory / Owner Command Center

Lane A merge gate:

- docs/tests only;
- no runtime UI behavior changed;
- owner command center, PR lanes, merge order, validation, and stop conditions
  are explicit;
- blocked surfaces are named;
- README links point to canonical operating docs when useful.

Lane A fails if it authorizes launch, payment, production data, infrastructure,
or auto-merge.

## Lane B: Core Learning UX

Lane B merge gate:

- Save creates or preserves review state.
- Review answers create events and update memory state.
- Due, Weak, and Mastered are derived from real review state.
- Local storage key contracts are preserved.
- Focused tests cover changed runtime behavior.
- Manual QA notes identify the golden flows checked.

Lane B fails if mastery, weak state, due state, streaks, dashboard metrics, or
pack progress are faked.

## Lane C: Revenue Surface

Lane C merge gate:

- Billing is clearly not connected unless a separately approved payment project
  exists.
- Pricing and paywall copy do not imply active checkout or subscription.
- Entitlement read-model changes are docs/tests-safe or separately approved.
- Monetization canonical sources remain reconciled.

Lane C fails if it adds real payment, checkout, subscription, invoice, billing
portal, payment SDK, provider API integration, real entitlement grants, or
production billing settings.

## Lane D: QA / Extension / Analytics

Lane D merge gate:

- QA notes name exact flows, devices, browsers, and evidence status when
  runtime work is involved.
- Analytics events avoid secrets, production data, and real user data.
- Extension work has local extension QA notes when in scope.
- Issue log, pause criteria, rollback criteria, support, privacy, and
  accessibility evidence are current for beta claims.

Lane D fails if it mutates production analytics data, production account data,
secrets, Webflow, Cloudflare production Workers, payment, billing, DNS,
deployment settings, or auto-merge.

## Risk Levels

### P0 Risk

P0 blocks merge until resolved or explicitly owner-approved. P0 includes:

- missing review-state correctness;
- missing review events;
- fake mastery or fake progress;
- beta launch, participant invite, charging, or real entitlement grant;
- auth/account/server persistence without approval;
- Webflow, Cloudflare production Workers, DNS, deployment, billing, payment,
  secrets, production data, real user data, or R2 production object changes;
- validation failure.

### P1 Risk

P1 blocks expansion and can block merge when evidence is stale or absent. P1
includes accessibility, mobile, extension, privacy-safe analytics, support,
issue logging, pause/rollback, and account/auth/server-sync boundary gaps.

### P2 Risk

P2 can merge after P0/P1 safety is intact. P2 includes product polish, prompt
quality, pack quality, weak practice clarity, and mistake-record visibility.
P2 cannot override blocked surfaces or fake-learning rules.

## Allowed Vs Blocked Surfaces

Allowed for this merge-gate PR:

- Track B docs;
- Track B tests;
- README operating-doc links;
- safe mock/static data if a test needs it.

Blocked for this merge-gate PR:

- runtime UI;
- Webflow;
- Cloudflare production Workers;
- auth behavior;
- billing;
- payment;
- checkout;
- subscription;
- invoice;
- billing portal;
- payment SDK;
- Stripe, Paddle, or provider API integration;
- DNS;
- deployment settings;
- secrets;
- production data;
- real user data;
- production account data;
- R2 production objects;
- public paid beta;
- private/manual beta launch;
- participant invites;
- real entitlement grants;
- auto-merge.

## Merge Order

1. Lane A safety and owner command center docs/tests.
2. Lane B core learning-loop proof.
3. Lane D QA and operational evidence for the learning loop.
4. Lane C no-payment revenue surface alignment.
5. Owner signoff packet for private/manual beta access only after all P0 gates
   have current evidence.

Do not merge out of order when a later PR depends on evidence from an earlier
lane. Do not use a merge to imply launch readiness.

## Owner Approval Requirements

Explicit owner approval is required before merge when:

- the PR is P0;
- the PR touches protected or blocked surfaces;
- validation is incomplete but the owner still wants to accept risk;
- runtime behavior changed and manual QA evidence is missing;
- the PR changes workflow automation, release criteria, safety boundaries, or
  auto-merge settings;
- the PR would launch beta, invite participants, charge users, grant access, or
  add real payment.

Approval must be explicit and specific. It must not be inferred from silence or
from approval of a different lane.

## Stop Conditions

Stop the merge when:

- validation fails;
- the changed file list includes unrelated work;
- required owner approval is missing;
- the PR includes runtime behavior without focused tests;
- the PR touches blocked surfaces;
- the PR would unblock public paid beta;
- the PR would launch private/manual beta without P0 evidence;
- the PR would add real payment, charge users, grant real entitlements, invite
  participants, or enable auto-merge;
- mastery, progress, streaks, due state, weak state, dashboard metrics, or pack
  progress are faked.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```

The PR body must report these results honestly. A missing or failed command is a
merge blocker unless the owner explicitly accepts the documented risk.
