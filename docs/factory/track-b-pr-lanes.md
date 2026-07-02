# Track B PR Lanes

## Purpose

Track B PR lanes keep Codex work small, reviewable, and aligned with the owner
command center. Each draft PR should select one primary lane, one risk level,
and one merge gate.

This lanes document is docs/tests-only. It does not change runtime UI, does not
touch Webflow, does not touch Cloudflare production Workers, does not touch
auth, billing, payment, DNS, deployment, secrets, production data, R2 production
objects, or real user data, does not add real payment, does not unblock public
paid beta, and does not enable auto-merge.

## North Star

Weekly Reviewed Words.

The lane system exists to protect the learning loop from drifting into passive
save counts, fake progress, or premature revenue work.

## Product Formula

```txt
Save -> Review -> SRS state/events -> Due/Weak/Mastered -> Packs/Paywall -> Private beta
```

The formula is also the product merge sequence. Revenue and beta work must not
outrun saved-word review state, review events, SRS state, and honest mastery.

## Lane A: Factory / Owner Command Center

Use Lane A for control-plane and owner-review work.

Typical files:

- `docs/goals/**`
- `docs/factory/**`
- `tests/factory-*.spec.ts`
- `README.md` operating-doc links

Allowed outcomes:

- owner command center packet;
- next-task or queue rules;
- merge gates;
- PR lane definitions;
- validation and rollback expectations;
- stop-condition tests.

Blocked outcomes:

- runtime UI changes;
- product behavior changes;
- launch approval;
- live GitHub automation from app code;
- auto-merge.

## Lane B: Core Learning UX

Use Lane B for learning-loop behavior.

Typical files:

- `src/app/dashboard/**`
- `src/app/saved/**`
- `src/app/review/**`
- `src/app/packs/**`
- `src/app/word/**`
- `src/components/**`
- `src/lib/srs/**`
- `src/lib/review/**`
- focused tests under `tests/*.spec.ts`

Allowed outcomes:

- save creates or preserves review state;
- review answers create events and update memory state;
- Due, Weak, and Mastered are derived from real review state;
- weak-word practice and mistake records become clearer;
- dashboard prioritizes Today Memory Mission and Start Review.

Blocked outcomes:

- fake mastery;
- fake streaks, fake dashboard metrics, or fake pack progress;
- random easy distractors as the main quiz method;
- AI Tutor before the SRS loop works;
- auth/account/server persistence changes without owner approval.

## Lane C: Revenue Surface

Use Lane C for no-payment revenue messaging.

Typical files:

- `src/app/pricing/**`
- `src/components/paywall-prompt.tsx`
- `src/components/local-paywall-trigger-panel.tsx`
- `src/lib/paywall/**`
- `src/lib/entitlements/**`
- `docs/monetization/**`
- focused paywall, entitlement, and docs tests

Allowed outcomes:

- pricing and paywall placeholder clarity;
- local upgrade-interest capture that says billing is not connected;
- entitlement read-model docs/tests;
- manual entitlement policy docs;
- canonical monetization-source consistency.

Blocked outcomes:

- real payment;
- checkout, subscription, invoice, billing portal, payment SDK, Stripe, Paddle,
  or provider API integration;
- real entitlement grants;
- production billing settings;
- public paid beta launch claims.

## Lane D: QA / Extension / Analytics

Use Lane D for evidence and operational safety.

Typical files:

- `docs/*QA*.md`
- `docs/*BETA*.md`
- `docs/*ANALYTICS*.md`
- `src/lib/extension/**`
- `src/lib/analytics/**`
- focused QA, extension, analytics, and accessibility tests

Allowed outcomes:

- manual QA notes for golden flows;
- issue-log, pause, rollback, support, and privacy evidence;
- extension bridge contract checks;
- privacy-safe analytics event and retention checks;
- accessibility, mobile, and browser QA.

Blocked outcomes:

- production analytics data mutation;
- production user data mutation;
- secrets or provider keys;
- public launch dashboards that imply beta is live;
- Webflow, Cloudflare production Workers, billing, payment, DNS, deployment, or
  auto-merge.

## Risk Levels

### P0 Risk

P0 means launch/safety blocker. It includes learning-state correctness,
private/manual beta access, owner signoff, participant invites, support,
privacy, refund, cancellation, rollback, blocked surfaces, and anything that
could charge users or grant access.

### P1 Risk

P1 means expansion/reliability blocker. It includes accessibility, mobile,
analytics retention, extension checks, account/auth/server-sync boundaries,
pricing clarity, and support operations.

### P2 Risk

P2 means hardening. It includes UX polish, pack quality, prompt clarity,
mistake-record visibility, and weak-word practice improvements. P2 never
authorizes launch, fake mastery, payment, or auto-merge.

## Allowed Vs Blocked Surfaces

Allowed surfaces:

- Track B docs;
- Track B tests;
- safe mock/static data;
- local Track B app code only for approved Lane B, C, or D runtime PRs.

Blocked surfaces:

- Webflow;
- Cloudflare production Workers;
- R2 production objects;
- DNS;
- deployment settings;
- secrets;
- production data;
- real user data;
- production account data;
- billing;
- payment;
- checkout;
- subscriptions;
- invoices;
- payment SDKs;
- provider settings;
- public paid beta launch;
- private/manual beta launch without owner approval;
- participant invites;
- real entitlement grants;
- auto-merge.

## Merge Order

1. Lane A defines the command center, lanes, merge gates, stop rules, and
   validation contracts.
2. Lane B proves the learning loop with real review state and focused tests.
3. Lane D gathers QA, support, privacy, rollback, accessibility, mobile,
   extension, and analytics evidence.
4. Lane C improves no-payment revenue surfaces after learning claims are true.
5. Owner signoff happens only after P0 evidence is complete and current.

Split the PR when a task tries to do two lanes at once.

## Owner Approval Requirements

Explicit owner approval is required when a PR:

- is P0;
- launches or expands beta;
- invites participants;
- charges users;
- grants real entitlements;
- touches auth, account sync, server persistence, DB schema, RLS, migrations,
  production data, real user data, billing, payment, DNS, deployment, Webflow,
  Cloudflare production Workers, secrets, or R2 production objects;
- changes automation, release criteria, workflow behavior, or auto-merge;
- cannot be validated with the required commands.

## Stop Conditions

Stop when:

- no primary lane is selected;
- the task crosses lanes and cannot be split;
- validation fails or is missing;
- unrelated user changes would be staged;
- a blocked surface is required;
- owner approval evidence is missing;
- fake mastery, fake progress, fake streaks, fake metrics, fake due state, fake
  weak state, or fake pack progress would be added;
- the task would charge users, grant access, invite participants, launch beta,
  add real payment, or enable auto-merge.

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
npm.cmd run test -- tests/factory-track-b-goal-runway.spec.ts --workers=1
```
