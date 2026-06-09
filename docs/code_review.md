# Code Review Standards

These standards apply to Visual Lexicon Track B work. Documentation-only PRs can
use the same structure with validation appropriate to their scope.

## PR Size Expectations

- Prefer small PRs with one product or infrastructure purpose.
- Keep documentation, runtime behavior, tests, and visual redesigns separated
  unless a single acceptance criterion requires them together.
- Do not combine beta hardening with Webflow, Cloudflare, auth, billing, DNS,
  or production data changes.
- Avoid broad route additions without explicit approval.
- Leave unrelated cleanup for a follow-up PR.

## Required Validation

Run available checks before requesting review:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

If a command does not exist or cannot run, say that directly in the PR and
explain the blocker.

For narrow changes, include focused Playwright suites when relevant:

```powershell
npm.cmd run test -- tests/mvp-smoke.spec.ts --workers=1
npm.cmd run test -- tests/review-state-regression.spec.ts tests/review-mode-routes.spec.ts --workers=1
npm.cmd run test -- tests/exam-pack-preview.spec.ts --workers=1
npm.cmd run test -- tests/paywall-triggers.spec.ts tests/paywall-surfaces.spec.ts tests/entitlements.spec.ts --workers=1
npm.cmd run test -- tests/multilingual-alias-contract.spec.ts --workers=1
```

## Required Manual QA Notes

Every PR that changes user-visible behavior must include:

- Browser and URL used.
- Local storage keys cleared or seeded.
- Golden flow tested.
- Expected result.
- Actual result.
- Screenshots if UI changed.
- Any gap between Playwright coverage and manual coverage.

Use `docs/PAID_BETA_MANUAL_QA.md` as the default manual QA script.

## Risk And Rollback Notes

Each PR description must include:

- Primary risk.
- What user flow could regress.
- Storage keys or routes affected.
- Whether runtime behavior changed.
- Rollback note, usually reverting the PR.

Documentation-only PRs should explicitly say that no runtime behavior changed.

## Code Review Checklist

- Save creates or preserves review state.
- Review answer writes an event and updates state.
- SRS state follows the VLX 5-box rules.
- Due, Weak, and Mastered are derived from real state.
- Pack progress is based on preview/review events.
- Paywall copy does not imply real payment unless real payment is in scope.
- Alias/search does not create fake content or unsafe saves.
- Dashboard keeps review as the primary action.
- UI remains calm, premium, minimal, warm, credible, and learning-focused.
- Tests cover the changed contract.
- Docs reflect any changed route, storage key, or safety boundary.

## When Not To Merge

Do not merge if:

- A P0 from `docs/world_class_bar.md` is present.
- Required validation failed and the failure is not understood.
- Manual QA contradicts automated tests.
- The PR touches Webflow, Cloudflare production Workers, DNS, billing, payment
  settings, secrets, auth, or production data without explicit approval.
- The PR adds real payment, AI Tutor functionality, multilingual page
  generation, or new product features outside the approved scope.
- Mastery, pack progress, or dashboard metrics are fake.
- The rollback path is unclear.
