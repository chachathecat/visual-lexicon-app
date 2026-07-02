# Review Session v2 Implementation Sequence

Status: planning sequence after the contract PR.

This sequence exists to keep Review Session v2 implementation small, testable,
and aligned with the Track B safety rules. The current PR is docs/tests only and
must not rewrite the runtime review UI.

## Preflight

Before runtime work starts:

1. Read `docs/REVIEW_SESSION_V2_CONTRACT.md`.
2. Confirm the work stays inside Track B app code, docs, and tests.
3. Confirm no Webflow, Cloudflare Workers, auth, billing, payment, DNS,
   deployment, secrets, production data, real user data, AI Tutor, route
   handler, middleware, or provider SDK surface is required.
4. Confirm public paid beta remains blocked.

## Sequence

1. Contract guard PR
   - Add the Review Session v2 contract docs.
   - Add file-based tests that verify required terms, storage keys, blocked fake
     mastery, blocked random easy distractors, fail-safe state rules, and
     validation commands.
   - Do not change runtime behavior.

2. Queue source audit
   - Map saved review, due review, and weak review to the existing local SRS
     selectors and storage helpers.
   - Verify saved review can preserve or create `New` review state.
   - Verify due and weak queues are derived from `vlx_review_state_v1`.
   - Identify malformed, missing, stale, unknown, duplicate, and unavailable
     storage cases before UI edits.

3. Event and SRS contract lock
   - Keep answer commits centered on `vlx_review_state_v1`,
     `vlx_review_events_v1`, and `vlx_daily_stats_v1`.
   - Preserve responseMs tracking and correct/wrong event recording.
   - Require confidence values `knew`, `guessed`, and `forgot` on committed
     Review Session v2 events.
   - Confirm box update rules, weakScore update rules, and nextDueAt
     explanation match the contract.

4. One-card focus mode implementation
   - Update the existing review session surface only.
   - Render one active card, one prompt, one answer step, one confidence step,
     feedback, and then next or summary.
   - Support `image_to_word` and `definition_to_word`.
   - Keep answer choices deterministic and credible; no random easy
     distractors.
   - Keep failed commits on the same card with retry.

5. Route mode wiring
   - Wire saved review, due review, and weak review to the one-card surface.
   - Preserve approved routes and avoid adding large new route groups.
   - Keep empty states honest when no saved, due, or weak candidates exist.
   - Do not fake review work to make a route look populated.

6. Feedback and session summary
   - Show box, mastery, weakScore, and nextDueAt consequences from committed
     state only.
   - Build session summary from committed events only.
   - Exclude failed commits and duplicate replays from reviewed, correct, wrong,
     improved, weak remaining, and next due summary values.
   - Never mark a word Mastered without delayed recall evidence.

7. Mobile and accessibility pass
   - Verify mobile one-card ergonomics, safe-area spacing, and stable controls.
   - Verify keyboard operation, focus order, live regions, image alt text,
     reduced motion, error alerts, and non-color-only status communication.
   - Run browser QA for one-card saved, due, weak, failed-save retry, and
     summary flows.

8. Release evidence
   - Document manual QA notes, risk, rollback, and safety confirmation.
   - Confirm public paid beta remains blocked.
   - Confirm Webflow, Cloudflare Workers, auth, billing, payment, DNS,
     deployment, secrets, production data, and real user data were not touched.

## Required Validation

Run these commands before finishing a Review Session v2 contract or runtime PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/review-session-v2-contract.spec.ts --workers=1
```

Runtime implementation PRs should also run the broader review and full test
gates required by `AGENTS.md` when behavior changes.

## Stop And Ask

Stop for explicit approval if the implementation requires any of these:

- Webflow publishing.
- Cloudflare production Worker changes.
- DNS changes.
- Payment, Paddle, Stripe, billing, invoice, checkout, or subscription changes.
- Auth or login behavior changes.
- Production user data modification.
- Deleting R2 objects or CMS items.
- Exposing, moving, or requesting secrets.

If approval is not explicit, keep the work local to Track B app code, docs,
tests, and safe static data.
