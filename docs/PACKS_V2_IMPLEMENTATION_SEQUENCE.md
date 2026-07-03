# Packs v2 Implementation Sequence

Status: planning sequence after the contract PR.

This sequence keeps Packs v2 implementation small, reviewable, and aligned with
Track B safety rules. The current PR is docs/tests only and must not implement
runtime UI.

## Preflight

Before runtime work starts:

1. Read `docs/PACKS_V2_CONTRACT.md`.
2. Confirm the work stays inside Track B app code, docs, tests, and safe static
   pack data.
3. Confirm no Webflow, Cloudflare Workers, auth, billing, payment, DNS,
   deployment settings, secrets, production data, real user data, route handler,
   middleware, AI Tutor, provider SDK, or real payment surface is required.
4. Confirm public paid beta remains blocked.
5. Confirm pack progress is read from `vlx_pack_progress_v1`.

## Sequence

1. Contract guard PR
   - Add `docs/PACKS_V2_CONTRACT.md`.
   - Add `docs/PACKS_V2_IMPLEMENTATION_SEQUENCE.md`.
   - Add file-based tests that verify required terms, storage keys, CTAs,
     placeholder copy, validation commands, and safety boundaries.
   - Link the docs from `README.md` because they define a Track B paid beta
     contract.
   - Do not change runtime behavior.

2. Pack inventory and naming pass
   - Map existing pack reader data to the canonical Packs v2 plans: Academic
     Vocabulary, IELTS Writing, GRE Verbal, and Home/Core demo.
   - Preserve approved routes under `/packs` and `/packs/[packId]`.
   - Decide whether existing IDs remain as transition IDs or need a scoped
     migration.
   - Do not add large route groups.

3. Availability and placeholder model
   - For each pack, classify availability as available, demo, placeholder, or
     locked-full-pack.
   - Show `Word count pending`, `Free preview pending`, and honest unavailable
     copy when word data is missing.
   - Do not display planned word totals as real totals.
   - Do not render preview review or continue CTAs for unavailable pack data.

4. Free preview and lock model
   - Wire free preview count from resolved pack data or a reviewed implementation
     constant tied to real preview cards.
   - Ensure the preview queue never exceeds real preview words.
   - Render Pro/full-pack locked state as visual-only copy.
   - Link to `/pricing` or existing local interest capture only.
   - Do not add checkout, payment SDKs, billing routes, account sync, or paid
     access grants.

5. Progress read model
   - Read pack progress from `vlx_pack_progress_v1`.
   - Treat missing, malformed, or unavailable progress as no visible progress.
   - Show continue state only from `previewStartedAt`, `previewCompletedAt`,
     `lastReviewedAt`, `reviewedCount`, or `correctCount`.
   - Keep review state and event writes inside the existing review flow.

6. CTA routing pass
   - Preview review CTA includes `packId` and `source=pack_preview`.
   - Continue pack CTA routes to the safest existing review entry point for the
     pack.
   - Weak review from pack mistakes is filtered to known pack word slugs.
   - If pack-filtered weak review is not implemented, show honest unavailable
     copy instead of implying the queue exists.

7. Progress and memory-state derivation
   - Compute Due, Weak, Strong, and Mastered only from `vlx_review_state_v1` for
     known pack word slugs.
   - Compute event counts only from `vlx_review_events_v1` for known pack word
     slugs.
   - Never derive mastery, weak state, or completion percentage from saved words,
     route visits, preview opens, or marketing totals.
   - Never fake pack progress.

8. Tests and manual QA
   - Add or update runtime tests for preview, continue, placeholder, locked
     state, no fake counts, no real payment, and pack-scoped weak review.
   - Run browser QA for `/packs`, Academic Vocabulary detail, IELTS placeholder,
     GRE placeholder, Home/Core demo, preview review, continue pack, and weak
     review from pack mistakes.
   - Document manual QA notes, risk, rollback, and safety confirmation.

## Required Validation

Run these commands before finishing a Packs v2 contract or runtime PR:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- tests/packs-v2-contract.spec.ts --workers=1
```

Runtime implementation PRs should also run the broader gates required by
`AGENTS.md` when behavior changes.

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
- Deployment setting changes.

If approval is not explicit, keep the work local to Track B app code, docs,
tests, and safe static data.
