# Visual Lexicon Plans

## Current Phase

**Revenue source lock + autonomous factory activation.**

The repository already has a real local Save -> Review -> SRS loop, a minimal
Supabase session boundary, a pure entitlement domain, and a read-only server
entitlement snapshot. It does not yet have account-owned learning persistence,
a paid grant store, usage ledger, protected clean asset delivery, billing, or a
write-capable autonomous factory.

The immediate goal is therefore:

```txt
make the factory truthful and executable
-> finish account / asset / usage / billing foundations
-> launch one-time clean-download credits
-> launch Lite
-> launch Pro AI
-> satisfy Track B Production v1 finish line
```

## Required Sources

Before planning or implementing roadmap work, read:

1. `AGENTS.md`
2. `docs/HUMAN_DECISION_BOUNDARIES.md`
3. `docs/AUTONOMOUS_DELIVERY_POLICY.md`
4. `docs/TRACK_B_FINISH_LINE.md`
5. `docs/VLX_REVENUE_AUTONOMOUS_FACTORY_MASTER_PLAN_V1.md`
6. `docs/roadmap/vlx-autonomous-factory-roadmap.v1.json`

The master plan defines the target product and release sequence. The roadmap
JSON defines task IDs, statuses, risk, dependencies, acceptance criteria, and
validation. The current runtime plan numbers remain authoritative in
`docs/monetization/v1/vlx-plan-entitlements.v1.json` until roadmap task
`COM-010` migrates the canonical catalog.

## Commercial Sequence

```txt
Free watermarked preview
-> Clean Download 10: KRW 3,900 / USD 2.99 one-time
-> Clean Download 30: KRW 6,900 / USD 5.99 one-time
-> Lite: KRW 7,900 / USD 7.99 monthly
-> Pro: KRW 14,900 / USD 14.99 monthly
```

The one-time products are additive download credits, not subscription plans.
They do not grant clean browsing, HD, batch, AI, exam packs, or commercial
rights.

Advertising is not part of the Track B completion roadmap.

## Factory Truth

The existing Codex agent roles and policies are present. The current
`ci-repair`, `risk-gate`, `codex-quality-gate`, and `limited-auto-merge`
workflows are safe manual no-ops. They are not release evidence.

The factory becomes operational only after:

1. `FCT-010` deterministic risk contract
2. `FCT-020` truthful quality gate
3. `FCT-030` roadmap-to-issue materializer
4. `FCT-040` bounded draft-PR orchestrator
5. `FCT-050` bounded CI repair
6. `FCT-060` release guard and evidence sync

`FCT-010` is not schedulable until `FCT-000` is merged and verified. The roadmap
must keep dependency-blocked tasks blocked; agents may not start implementation
work by treating an `in_review` dependency as complete.

Auto-merge remains deferred and is not required to finish the product.

## Immediate PR Queue

1. Merge the owner-reviewed master source and roadmap, then record `FCT-000` as
   verified only after the owner accepts that source lock.
2. After `FCT-000` is verified, implement `FCT-010`.
3. Implement `FCT-020`.
4. Implement `FCT-030`.
5. Implement `FCT-040`.
6. Implement `FCT-050`.
7. Implement `FCT-060`.
8. Record `BIL-010` payment-provider and catalog-migration decision with owner
   approval.
9. Implement `COM-010` canonical catalog migration only after explicit owner
   approval unblocks that high-risk `blocked_human` task.
10. Prepare `ACC-010` schema/RLS and `AST-010` asset-rights contracts as
    separate high-risk draft PRs.
11. Continue strictly from the dependency-ready tasks in the roadmap JSON.

## Merge Guidance

- One roadmap task per PR.
- At most two runtime PRs concurrently.
- At most one high-risk runtime PR concurrently.
- Tasks touching the same source surface run serially.
- High-risk changes require owner approval.
- A merged task is not `verified` until required runtime evidence exists.
- No agent may move a blocked task to ready by ignoring dependencies.
- No workflow success may substitute for missing product tests.

## Deferred

- Track B advertising
- Free-form AI Tutor
- Commercial stock-image marketplace
- Educator / School implementation
- Multilingual mass generation
- High-risk auto-merge
- Production deployment without owner sign-off
