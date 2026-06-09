# Visual Lexicon Plans

## Current Phase

Paid beta hardening.

The current work should make the Track B learning loop safer, clearer, and more
reviewable without adding unrelated product scope. The operating principle is:
turn saved visual words into remembered words.

## Next PR Queue

Recommended order:

1. `docs/world-class-operating-system` - agent operating docs, quality rubric,
   golden flows, safety boundaries, release checklist, and eval cases.
2. `fix/saved-library-live-state` - make `/saved` read live local saved/review
   state or clearly label any remaining mock sections.
3. `fix/word-detail-memory-state` - make `/word/[slug]` memory state honest or
   remove mock memory claims.
4. `test/manual-qa-golden-flows` - strengthen Playwright coverage around the
   golden flows that remain manual.
5. `feat/beta-analytics-events` - add safe, non-secret beta analytics events
   only after local SRS truth is stable.
6. `feat/webflow-cta-bridge` - app-safe bridge only after review flow is
   validated and approved.

## Blocked Or Deferred Items

- Real payment, checkout, subscriptions, invoices, or billing portal.
- Production authentication and account sync.
- Production user data persistence.
- Webflow publishing or CMS mutation.
- Cloudflare production Worker changes.
- R2 object deletion or production pack mutation.
- AI Tutor functionality.
- Multilingual page generation.
- Full Chrome extension data collection beyond minimal save-route contracts.

## Merge Order Guidance

Use the roadmap order unless the control room explicitly changes it:

1. App Scaffold
2. Pack Data Contract
3. SRS Engine
4. Review UI
5. Dashboard Memory Mission
6. R2 Pack Reader
7. Save Landing Endpoint
8. Analytics Events
9. Free / Lite / Pro UI Gating
10. Exam Pack Preview
11. Webflow CTA Bridge

For paid beta hardening, merge documentation and safety PRs before new feature
work. Do not merge Webflow CTA Bridge before the app review flow works.
