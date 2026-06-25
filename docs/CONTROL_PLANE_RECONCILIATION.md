# Control Plane Reconciliation

Date: 2026-06-25

Base commit SHA: `4dd12d0299ca9ab84f1a309afaf908e47ddcba00`

This PR supersedes PR #117 and PR #118. It reconciles the safe parts of both
branches while keeping the Visual Lexicon Track B runtime untouched.

## Why PR #117 must not be merged as-is

PR #117 correctly replaces placeholder CODEOWNERS entries and moves placeholder
workflows toward manual dispatch, but it leaves `ci-repair.yml` with a stale
`github.event.workflow_run.conclusion` job condition. A manual
`workflow_dispatch` run has no `workflow_run` payload, so the job is skipped and
the workflow is not a clear, runnable no-op.

PR #117 also leaves placeholder workflows that do not explicitly state the
safety boundary: no production quality decision, no automated risk decision,
and no implemented auto-merge or repair behavior.

## Why PR #118 must not be merged as-is

PR #118 correctly identifies absent paths in CODEOWNERS, including `/.agents/`
and `docs/RISK_POLICY.md`, but it also removes
`docs/TRACK_B_FINISH_LINE.md`. That file exists and is an operating document, so
removing its only CODEOWNERS entry weakens the owner-review gate.

PR #118 also does not reconcile the placeholder workflows, leaving pull-request
triggered control-plane automation in place.

## Exact CODEOWNERS reconciliation

- Replaced every placeholder `@OWNER` entry with `@chachathecat`.
- Removed `/.agents/` because the path does not exist in this repository.
- Removed `/docs/RISK_POLICY.md` because the file does not exist in this
  repository.
- Kept `/docs/TRACK_B_FINISH_LINE.md` because the file exists and remains a
  release-readiness operating document.
- Kept protection for `AGENTS.md`, `.codex/`, `.github/workflows/`,
  `.github/CODEOWNERS`, `docs/HUMAN_DECISION_BOUNDARIES.md`,
  `docs/AUTONOMOUS_DELIVERY_POLICY.md`, and
  `docs/TRACK_B_RELEASE_BLOCKERS.md`.
- Kept existing source protection for auth and entitlements:
  `/src/app/auth/`, `/src/app/api/me/entitlements/`, `/src/lib/auth/`, and
  `/src/lib/entitlements/`.
- Kept billing protection for the existing `/src/lib/billing-entitlements/`
  surface.
- Retained `/db/migrations/`, `/src/auth/`, and `/src/lib/billing/` as
  intentional future protected directories because database migrations, auth,
  and billing are explicitly high-risk control-plane boundaries.

## Exact workflow safety changes

- `ci-repair.yml` is now `workflow_dispatch` only, has `permissions: {}`, does
  not depend on `github.event.workflow_run`, does not check out code, and exits
  successfully while stating: `CI repair automation is disabled and not yet implemented.`
- `codex-quality-gate.yml` is now `workflow_dispatch` only, has
  `permissions: {}`, does not modify repository content, and states that no
  production quality decision is being made.
- `risk-gate.yml` is now `workflow_dispatch` only, has `permissions: {}`, does
  not label PRs, and states that automated risk classification is not
  implemented.
- `limited-auto-merge.yml` is now `workflow_dispatch` only, has
  `permissions: {}`, never calls a merge API, never enables auto-merge, and
  states: `Auto-merge is disabled and not yet implemented.`

## Safe no-op workflows

These workflows remain safe manual no-ops:

- `.github/workflows/ci-repair.yml`
- `.github/workflows/codex-quality-gate.yml`
- `.github/workflows/risk-gate.yml`
- `.github/workflows/limited-auto-merge.yml`

## Auto-merge status

Auto-merge remains disabled. No workflow in this reconciliation enables
auto-merge, calls a merge API, pushes commits, creates pull requests, mutates
labels, or edits repository content.

## Required before one-click autonomous execution

Before any autonomous execution can be considered, the repository still needs:

- A reviewed risk-classification contract with deterministic inputs and human
  override rules.
- A verified quality-gate contract that cannot be mistaken for production
  approval.
- Explicit owner approval for any workflow that writes repository content,
  mutates PR state, labels PRs, reruns jobs, creates branches, commits, pushes,
  or opens PRs.
- Branch protection and required-check policy review so manual no-op workflows
  cannot become required passing gates by accident.
- Audit logging and rollback procedures for any future write-capable automation.
- Separate approval for any future auto-merge design.

## Human approval boundaries

Human approval remains required for Webflow publishing, Cloudflare production
Worker changes, DNS changes, auth behavior changes, billing or payment changes,
checkout, subscription, invoice, or billing portal changes, production user
data modification, R2 deletion, CMS deletion, secrets or environment variable
changes, and deployment setting changes.

## Rollback instructions

To roll back this reconciliation before merge, close the draft PR and delete the
branch `fix/control-plane-reconciliation-v1`.

To roll back after merge, revert the reconciliation commit with:

```powershell
git revert <reconciliation-commit-sha>
```

Then open a draft PR containing only that revert.

## Confirmed untouched systems

This reconciliation does not touch product runtime code, authentication
implementation, billing implementation, payment implementation, entitlement
implementation, API route implementation, database or migrations, secrets,
environment variables, deployment settings, DNS, Webflow, Cloudflare Workers,
R2, or production data.
