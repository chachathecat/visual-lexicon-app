# Release Checklist

Use this checklist before merging paid beta hardening work.

## Pre-Merge Checklist

- Branch is not `main`.
- Working tree changes match the PR scope.
- No Webflow, Cloudflare production Worker, DNS, billing, payment, auth,
  secrets, production data, or deployment settings were touched unless
  explicitly approved.
- No real payment, AI Tutor functionality, multilingual page generation, or
  unrelated product feature was added.
- Required docs were updated for changed routes, storage keys, or contracts.
- PR includes summary, changed files, validation, risks, rollback, and safety
  confirmation.

## Validation Commands

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

Report exact failures. Do not claim a check passed unless it actually ran.

## Manual QA Checklist Reference

Use:

```txt
docs/PAID_BETA_MANUAL_QA.md
docs/golden_user_flows.md
```

Manual QA is required when a PR changes runtime behavior, routes, local storage,
review state, paywall surfaces, pack progress, or visible UI.

Documentation-only PRs may state that manual runtime QA was not required because
no runtime behavior changed.

## Pre-Beta Checklist

- Save from word page creates saved word and review state.
- Save from alias search creates canonical review state and has safe unknown
  alias behavior.
- Save from extension source creates review state without storing private
  browsing data.
- Due review writes events and updates SRS state.
- Weak review and weak sprint use real weak state.
- Dashboard Today Memory Mission shows real due, weak, and mastered counts.
- Academic pack preview records real preview progress.
- Pricing Lite and Pro CTAs are honest no-payment beta flows.
- No checkout, payment SDK, billing write, or subscription claim exists.
- Manual QA and Playwright coverage agree.

## Launch Criteria

Launch or merge when:

- No P0 issues remain.
- P1 issues are accepted, documented, and not core-loop blockers.
- Validation commands pass or failures are explicitly understood and accepted.
- Safety boundaries are confirmed in the PR.
- Rollback is clear.

## No-Launch Criteria

Do not launch or merge when:

- Save does not produce review state.
- Review does not produce events and state updates.
- Due, Weak, or Mastered metrics are fake.
- Pack progress or mastery is overstated.
- Pricing implies real payment that does not exist.
- A forbidden production surface was touched without approval.
- Tests or manual QA reveal an unresolved P0.
