# Production Analytics Reporting

Planning date: 2026-06-11

Scope: Visual Lexicon Track B production v1 analytics/reporting architecture
only. This document does not add analytics SDKs, tracking scripts, network
calls, environment variables, secrets, vendor integrations, auth runtime,
billing runtime, deployment changes, Webflow changes, Cloudflare Workers,
production data mutation, or current runtime behavior changes.

## Goal

Define the production analytics and reporting architecture needed to decide
whether Visual Lexicon is creating a durable learning habit.

The analytics system must protect the core loop:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> Weekly Reviewed Words
```

Production reporting should answer whether learners repeatedly review words,
recover weak words, build truthful mastery, and continue into paid learning
without hiding product risk behind traffic metrics.

## Non-Goals

- Do not implement analytics collection in this PR.
- Do not add GA4, PostHog, Segment, Amplitude, Sentry, Datadog, or any other
  vendor.
- Do not add browser tracking scripts, beacons, pixels, external requests, or
  server write endpoints.
- Do not add auth, server SRS sync, billing, checkout, payment, or deployment
  behavior.
- Do not treat client-only analytics as a trusted source for mastery,
  entitlement, or paid conversion.
- Do not claim production analytics is ready.

## North Star Metric: Weekly Reviewed Words

The North Star is Weekly Reviewed Words: the count of distinct accepted review
answers for real words during a calendar week, grouped by learner/account and
cohort.

For production reporting, a reviewed word should count only when:

- A review answer was accepted by the trusted review event pipeline.
- The event has a stable word identity, such as `slug`.
- Retries and duplicate client submissions are deduped.
- The event is tied to the correct anonymous learner or account.
- The answer updated or intentionally preserved SRS state through the approved
  reducer.

Weekly Reviewed Words should be segmented by new versus returning learner,
cohort, plan/entitlement state, review source, pack, language/source path, and
platform when available. It should not be inflated by page views, saved-word
clicks, quiz previews, or duplicate retry events.

## Why Page Views, Saved Words, And Pricing Clicks Are Insufficient

Page views can show discovery or curiosity, but they do not prove that a learner
did memory work.

Saved words are useful only when they become review items. A growing saved
library can be a vanity metric if learners never return for active recall.

Pricing clicks and upgrade interest can show demand, but they do not prove that
the product can create a paid habit. Charging before measuring repeat review
behavior risks optimizing for checkout rather than learning.

Production analytics must therefore rank metrics in this order:

1. Accepted review answers and weekly review recurrence.
2. Due review completion and weak-word recovery.
3. Truthful mastery based on delayed recall.
4. Save, activation, pack, extension, and pricing funnels that feed review.

## Required Production Reporting Layers

Production reporting needs separate layers because not every event has the same
trust level.

| Layer | Purpose | Source of truth | Launch requirement |
| --- | --- | --- | --- |
| Client event layer | Capture UX intent, route views, CTA clicks, preview starts, and local-only pre-auth behavior. | Browser event queue after privacy filtering. | Useful for funnel diagnosis, never authoritative for mastery or entitlement. |
| Server trusted event layer | Record accepted saves, review answers, sync writes, entitlement changes, and billing events after validation. | Server append-only logs and materialized read models. | Required before production launch decisions. |
| Derived reporting layer | Aggregate Weekly Reviewed Words, activation, retention, review quality, pack progress, billing, and error health. | Warehouse/reporting jobs from trusted events and approved client events. | Required for go/no-go dashboards. |
| Incident/error layer | Surface failures that threaten learning state, access, billing, or trust. | Client error reports, server logs, sync/billing failures, support signals. | Required before public paid launch. |

## Client Event Layer

The client layer should measure learner intent and UI flow:

- App route/page views using route names, not full URLs with query strings.
- Save intent and local save outcome before server sync exists.
- Review start/completion UI flow.
- Queue views for Due, Weak, and Mastered surfaces.
- Pack preview starts and completes.
- Pricing/paywall interest and upgrade CTA clicks.
- Extension handoff source and app landing path.
- Alias search attempts after query minimization.
- Non-sensitive client errors and recoverable UI failures.

Client events must be privacy-filtered before emission. They must not include
private browsing history, full page text, secrets, payment credentials,
unredacted query strings, or raw extension page contents.

Client events can diagnose funnels, but they cannot grant mastery, update SRS,
or prove entitlement.

## Server Trusted Event Layer

The server trusted layer should record events only after validation:

- Accepted save-word writes.
- Accepted review answer writes.
- SRS reducer output after each accepted review answer.
- Server-side due/weak/mastered queue reads when account sync exists.
- Pack progress writes and derived pack completion state.
- Auth/account lifecycle events when auth is implemented.
- Billing and entitlement lifecycle events when billing is authorized.
- Sync hydration, retry, stale-client, and conflict outcomes.
- Error and incident events that affect user state, access, or billing.

Server events require idempotency keys or durable event IDs. Retry must return
the original result rather than double-counting review answers, pack progress,
or entitlement changes.

## Review Event Reporting

Review event reporting is the foundation for Weekly Reviewed Words.

Required review fields:

- `eventId` or idempotency key.
- `sessionId`.
- `userId` when account exists, or privacy-safe anonymous ID.
- `slug` and `word`.
- `questionType`.
- `result`.
- `responseMs`.
- `usedHint` and `confidence` when supported.
- `boxBefore`, `boxAfter`, `weakScoreBefore`, `weakScoreAfter`.
- `masteryBefore`, `masteryAfter`.
- `packId` when the review came from a pack.
- `source`, such as due queue, weak queue, word page, extension, or pack.
- `createdAt` and accepted server time.

Review reporting must support:

- Weekly Reviewed Words by cohort.
- First review and second review conversion.
- Due review completion.
- Weak-word recovery.
- Delayed recall and mastery quality.
- Review latency and wrong-answer patterns.

## SRS State Reporting

SRS state reporting must be derived from real review state, not static content or
client claims.

Minimum reports:

- Current review state counts by mastery: New, Learning, Weak, Strong,
  Mastered.
- Box distribution from 0 through 5.
- Due count by due date and cohort.
- Weak count and weak score distribution.
- Mastered count with delayed recall evidence.
- State transitions by result, speed, hint, and confidence.
- Stale state and sync conflict rates when server sync exists.

SRS state reporting should identify impossible or suspicious states, such as
Mastered without delayed recall, box values outside 0-5, negative response
times, or due queues that suddenly become empty without review events.

## Pack Progress Reporting

Pack progress must be based on accepted pack events and accepted review events,
not page views alone.

Required pack reports:

- Pack preview starts and completes.
- Save from pack preview.
- Pack review starts and completes.
- Unique reviewed words by pack.
- Weak and mastered counts inside each pack.
- Pack completion criteria and evidence.
- Paid pack access after entitlement exists.

Pack reporting should separate content interest from learning progress. A pack
preview completion can show intent, but only accepted review events can prove
learning progress.

## Billing/Entitlement Reporting

Billing and entitlement reporting is planned only until real billing is
explicitly approved.

Future billing reports should cover:

- Pricing interest, paywall views, and upgrade interest.
- Checkout start, checkout complete, checkout abandoned.
- Trial start, active paid, past due, canceled, expired, refunded, disputed,
  and revoked entitlement states.
- Entitlement snapshot changes by account.
- Refund and cancellation rates.
- Paid learner Weekly Reviewed Words versus free/guest cohorts.

Billing events must come from server-verified provider/manual evidence. Browser
events and local plan labels must never grant paid access.

## Extension Source Reporting

Extension source reporting should answer whether the extension creates review
habit rather than only saves.

Required reporting:

- Extension save source by approved source category.
- App open from extension.
- Save -> first review conversion for extension-sourced words.
- Extension review start and completion.
- Weekly Reviewed Words from extension-sourced words.
- Error rates for extension handoff.

The extension must not send private browsing history, full page text, raw
article content, page screenshots, or page URLs unless a later privacy review
explicitly approves a minimized URL policy.

## Multilingual Alias Search Reporting

Alias search reporting should show whether Korean, Japanese, or English aliases
help learners find canonical English word cards.

Required reporting:

- Alias search attempt.
- Query language bucket when confidently detected.
- Matched versus no-match result.
- Matched canonical slug when a match exists.
- Save or review after alias match.
- No-result patterns after query minimization.

Raw alias queries should be minimized, hashed, sampled, or dropped according to
the privacy plan. Reports should prefer language, result, and canonical slug
over raw search text.

## Error/Incident Reporting

Production analytics must include reporting for failures that can break trust:

- Save failure.
- Review answer failure.
- SRS reducer failure.
- Due/Weak/Mastered selector anomaly.
- Pack loading failure.
- Extension handoff failure.
- Alias search failure.
- Future auth session, migration, and account recovery failure.
- Future server sync hydration, retry, stale-client, and conflict failure.
- Future billing webhook, entitlement, checkout, refund, cancellation, and
  failed-payment failure.
- Analytics ingestion gaps or dashboard freshness failures.

Incident reports need severity, affected surface, account/user count when
available, start time, end time, owner, mitigation, and rollback decision.

## Privacy And Data Minimization Rules

Analytics should collect the least data needed to answer learning and launch
safety questions.

Do not collect:

- Private browsing history.
- Full page text from extension context.
- Raw article content, screenshots, or page DOM.
- Payment credentials or full card/bank details.
- Secrets, tokens, cookies, or authorization headers.
- Passwords, recovery links, magic links, or one-time codes.
- Full unredacted URLs with sensitive query strings.
- Raw alias search queries unless explicitly approved by privacy review.

Prefer:

- Stable event IDs and idempotency keys.
- Account IDs or anonymous IDs that can be rotated or deleted.
- Route names instead of full URLs.
- Canonical word slugs instead of page text.
- Privacy classifications on every field.
- Environment separation for local, staging, and production events.
- Retention periods that match product needs.

## P0 Analytics Gaps

P0 gaps block production paid SaaS launch.

| Gap | Why it blocks launch | Required action |
| --- | --- | --- |
| Weekly Reviewed Words is not measured from trusted events | The product cannot prove repeat review behavior. | Add accepted review event reporting and deduped weekly aggregation after server SRS sync. |
| No server-trusted review analytics | Client events can be spoofed, duplicated, or lost. | Use server accepted review writes as reporting source of truth. |
| No dashboard for Save -> First Review and retention | Saved words may not become memory work. | Build activation and repeat-review funnels. |
| No SRS quality reporting | Mastery, due, and weak states could be wrong without visibility. | Report box/mastery transitions, delayed recall evidence, and anomalies. |
| No analytics privacy plan implemented | Collection could overreach or leak sensitive data. | Approve privacy rules, field classifications, and retention before vendor work. |
| No error/incident reporting plan tied to launch gates | Failures could silently corrupt learning or paid access. | Define incident events, owners, severity, and rollback criteria. |

## P1 Analytics Gaps

P1 gaps block a confident public launch unless explicitly accepted with owner
and mitigation:

- Pack preview -> pack review -> pack progress dashboards.
- Weak-word recovery dashboard.
- Extension source funnel from save to weekly review.
- Alias search funnel from search to matched word to review.
- Pricing/paywall interest dashboard that stays separate from real billing.
- Future auth/sync health dashboards after those systems exist.
- Future billing/entitlement dashboards after billing is authorized.
- Dashboard freshness and data quality checks.

## P2 Analytics Gaps

P2 gaps can follow after the production launch bar is satisfied:

- Cohort retention by acquisition source and pack.
- Review quality segmentation by question type, speed, hint, and confidence.
- Content quality dashboards for high-wrong words and weak metaphor cards.
- Support correlation with billing, sync, and review failures.
- Experiment reporting after core analytics are trusted.
- Public/internal KPI summary views.

## Go/No-Go Recommendation

No-go for production paid SaaS launch today.

Do not launch production paid SaaS until Weekly Reviewed Words, activation,
retention, review quality, sync health, billing readiness,
support/refund/legal readiness, deployment readiness, and production release QA
can be measured or verified safely.

This PR should be treated as Phase 0 analytics architecture. It does not make
production analytics ready, does not add a vendor, and does not change runtime
app behavior. The recommended next PR is `#46 Production release QA`.
