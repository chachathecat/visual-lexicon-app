# Track B Pricing / Paywall v2

Pricing / Paywall v2 rebuilds `/pricing` and local paywall prompt copy as the
monetization surface for the Track B learning app.

Header copy:

```txt
Pricing
Build a visual memory habit before words fade.
```

## Product Role

Pricing supports the Track B loop:

```txt
Today -> Review -> Weak -> Packs -> Saved -> Progress
```

The page sells outcomes, not quotas:

- Free: Start remembering your first words.
- Lite: Build a daily visual memory habit.
- Pro: Fix weak words and prepare for exams.

The north-star behavior remains Weekly Reviewed Words. Saved words, pack
previews, downloads, exports, and upgrade interest matter only when they support
repeat review behavior.

## Surface Structure

Pricing v2 uses the Track B app shell and includes:

- outcome-based Free / Lite / Pro plan cards
- Exam Pack links for Academic Vocabulary, IELTS Writing, and GRE Visual Verbal
- paywall trigger explanations for save limit, review limit, pack preview end,
  Weak Sprint tools, no-watermark download, and AI mistake explanation later
- safety and progress copy tied to review history
- FAQ for Weekly Reviewed Words, plan differences, downloads, AI timing, and
  saved-word behavior

## Paywall Behavior

Paywall prompts remain visual/local only:

- primary prompt actions record local upgrade interest or use an existing
  configured paid beta placeholder URL
- prompts include a safe `/pricing` comparison link
- no entitlement state is mutated
- no paid plan is created
- no checkout or provider route is created

The existing `vlx_upgrade_interest_v1` attribution key is preserved.

## Data And State Rules

Pricing v2 may read static plan definitions and render existing safe links.
Paywall prompts may continue to write local upgrade interest through the existing
helper.

Pricing v2 does not write review state, review events, daily stats, pack
progress, entitlement state, account state, billing state, or production data.

## Safety

This PR stays local to Track B app code, tests, and docs. It does not touch
Webflow, Cloudflare Workers, auth, billing, DNS, payment settings, secrets,
production data, deployment settings, route handlers, API routes, middleware,
database providers, payment SDKs, provider integrations, or AI calls.

No real payment, checkout, subscription, invoice, billing portal, entitlement
grant, account sync, or paid plan enforcement is added.

## Real Paid Beta Blockers

Before real monetization can ship, the product still needs:

- account sync for saved words, review state, review events, and pack progress
- server-side SRS source of truth and entitlement enforcement
- approved payment provider integration, checkout, subscription lifecycle,
  invoice, billing portal, webhook, cancellation, and refund handling
- support, privacy, and data portability copy with owner sign-off
- accessibility, keyboard, screen-reader, mobile, and golden-flow manual QA
- monitoring, rollback, analytics reporting, and production launch approval

## Validation Scope

Tests cover:

- `/pricing` renders Pricing v2 in the Track B shell
- Free / Lite / Pro outcome cards exist
- outcome copy for Free, Lite, and Pro exists
- Exam Pack links point to existing safe `/packs` routes
- payment provider SDKs and checkout/billing routes are not introduced
- route handlers are not introduced under `src/app`
- paywall prompts expose safe pricing comparison links
- local upgrade-interest capture remains on-page when no placeholder URL exists

Recommended next PR: **#79 Manual QA execution report**.
