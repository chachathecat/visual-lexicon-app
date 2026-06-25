# Autonomous Delivery Policy

This policy defines how Visual Lexicon Track B work is executed by autonomous
agents through Codex and GitHub. It is the operating policy for the product
completion factory.

## Current Truth

The repository currently has agent role definitions, CODEOWNERS, issue and PR
contracts, and safe workflow placeholders.

The following workflows are manual no-ops and must not be treated as evidence of
quality, risk classification, repair, or merge readiness:

- `.github/workflows/ci-repair.yml`
- `.github/workflows/codex-quality-gate.yml`
- `.github/workflows/risk-gate.yml`
- `.github/workflows/limited-auto-merge.yml`

Current mode:

```txt
control_plane_safe_no_op
```

Target mode:

```txt
human_gated_autonomous_pr_factory
```

## Sources Of Truth

Agents must read these sources before starting roadmap work:

- `AGENTS.md`
- `docs/HUMAN_DECISION_BOUNDARIES.md`
- `docs/TRACK_B_FINISH_LINE.md`
- `docs/VLX_REVENUE_AUTONOMOUS_FACTORY_MASTER_PLAN_V1.md`
- `docs/roadmap/vlx-autonomous-factory-roadmap.v1.json`
- the applicable canonical monetization and entitlement sources

The master plan defines product strategy and release sequence. The roadmap JSON
defines task status, dependencies, risk, acceptance criteria, and validation.
Existing runtime canonical data remains authoritative until a versioned
migration task changes it.

## Principles

- **Single task, single PR:** Each roadmap task becomes one independently
  reviewable PR unless the owner approves a split or reconciliation.
- **Dependency first:** A task may start only when every listed dependency is
  `verified`, not merely merged.
- **Work decomposition:** The factory may use `planner`, `explorer`,
  `implementer`, `tester`, `security_reviewer`, and `release_guard`.
- **Safety first:** Authentication, database, RLS, account sync, billing,
  entitlements, usage, private assets, AI providers, secrets, deployment,
  production configuration, monetization contracts, and control-plane changes
  are high-risk.
- **Test-driven:** Changed behavior requires tests. No agent may weaken, skip,
  delete, or silence checks to create a passing result.
- **Bounded repair:** A failing PR may receive at most three minimal automated
  repair attempts. The fourth action is escalation, not another mutation.
- **Truthful evidence:** A no-op workflow, mocked success page, local plan label,
  or green placeholder is never production evidence.
- **Transparent reporting:** Every PR records acceptance mapping, changed files,
  validation results, risk, security findings, rollback, remaining risks, and
  human decisions.
- **Runtime verification:** `merged` and `verified` are separate states. Tasks
  requiring deployment, provider, migration, or production evidence remain
  unverified until that evidence exists.
- **Limited concurrency:** At most two runtime PRs and at most one high-risk
  runtime PR may be active at once. Overlapping source surfaces run serially.

## Factory Activation Stages

1. Deterministic risk-classification contract.
2. Truthful quality-gate contract.
3. Roadmap-to-issue materializer.
4. Bounded draft-PR orchestrator.
5. Bounded CI repair loop.
6. Release guard and roadmap evidence synchronization.
7. Optional low-risk auto-merge only after separate owner approval.

Auto-merge is not required for product completion.

## Human Approval

Agents may prepare high-risk code, tests, migrations, and rollback plans in a
draft PR. They may not independently:

- enter or request secrets, passwords, tokens, or billing credentials;
- apply production database migrations;
- create or modify production payment settings;
- publish Webflow changes;
- modify Cloudflare production Workers, DNS, or deployment settings;
- delete or mutate production data or R2 objects;
- approve legal, refund, cancellation, or license policy;
- merge high-risk PRs;
- enable public checkout, clean delivery, subscriptions, or AI rollout;
- mark the final release as complete.

Human approval must identify the exact PR, action, environment, and rollback
boundary.

## Enforcement

- Unknown risk fails closed as high-risk.
- Client-provided account IDs, plan labels, entitlement snapshots, success-page
  arrival, or localStorage values are never authorization.
- Protected paths remain owner-reviewed through CODEOWNERS.
- Agents may not create work for blocked roadmap tasks.
- Repeated automation runs must be idempotent.
- The factory must have a kill switch that removes all write permissions and
  leaves read-only reporting.
- All changes to `.codex`, `.github/workflows`, `.github/CODEOWNERS`,
  `AGENTS.md`, release criteria, risk policy, monetization sources, or the
  machine roadmap require owner review.
