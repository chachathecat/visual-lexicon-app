# Analytics Privacy And Data Safety

Review date: 2026-06-11

Scope: Visual Lexicon Track B production v1 analytics privacy planning only.
This document does not add analytics SDKs, tracking scripts, network calls,
vendor integrations, environment variables, secrets, auth runtime, billing
runtime, deployment changes, or current runtime behavior changes.

## Data Minimization Principles

Collect the least analytics data needed to answer product and launch-safety
questions:

- Does the learner review words each week?
- Do saved words become review items?
- Do due and weak queues lead to active recall?
- Is mastery backed by delayed recall?
- Do packs and extension sources create reviewed words?
- Are future auth, sync, billing, and entitlement systems healthy?
- Are errors and incidents visible before they damage learner trust?

Prefer aggregated, canonical, and enumerated fields over raw user content. Every
field should have a purpose, owner, privacy classification, retention period,
and source-of-truth label before production collection.

## What Not To Collect

Do not collect:

- Private browsing history.
- Full page text, full article text, page DOM, screenshots, or copied content
  from extension context.
- Full unredacted URLs, query strings, hashes, or referrer URLs.
- Payment credentials, full card numbers, CVV, bank details, provider secrets,
  checkout secrets, webhook signing secrets, or billing portal tokens.
- Auth secrets, passwords, password reset links, magic links, one-time codes,
  session cookies, authorization headers, or recovery tokens.
- API keys, database credentials, deployment tokens, or environment variable
  values.
- Personal notes or free-form learner text unless a later privacy review
  explicitly approves a narrow field and retention policy.
- Raw alias search queries by default.
- Production user data in local, preview, staging, or documentation examples.

## No Private Browsing History

Extension analytics must not become browsing-history collection.

Allowed extension fields should be limited to approved product events, such as:

- `extensionSurface`
- `sourceCategory`
- `handoffId`
- canonical `slug` when known
- save/review result
- app route after handoff

Do not send raw page URLs, titles, article text, selected page text, screenshots,
DOM content, or browser history lists unless a later explicit privacy review
approves a minimized alternative. Even then, production should prefer source
categories over raw URLs.

## No Full Page Text

Visual Lexicon may help users remember words they find online, but analytics
does not need the surrounding page text.

Do not store:

- Article paragraphs.
- Surrounding sentence context.
- Full copied selection.
- Page title plus URL pairs that reconstruct browsing activity.
- DOM snippets.

Use canonical word identity, source category, and approved extension handoff
metadata instead.

## No Payment Credentials

Analytics must never collect payment credentials or sensitive billing data.

Forbidden fields include:

- Card number or partial card beyond provider-safe brand/last-four fields in a
  future support-only system.
- CVV.
- Bank account or routing details.
- Checkout session secrets.
- Provider API keys or webhook signing secrets.
- Invoice PDFs or raw billing portal URLs.

Future billing analytics should use server-verified lifecycle event IDs,
entitlement state, plan labels, and safe reason codes only.

## No Secrets

Analytics payloads, logs, screenshots, documentation, tests, and support notes
must not contain:

- API keys.
- Auth tokens.
- Session cookies.
- Database URLs.
- Provider secrets.
- Webhook signing material.
- Deployment tokens.
- Environment variable values.

Error reporting must scrub request headers, response bodies, stack traces, and
messages that could include secrets before storage or vendor transmission.

## Alias Search Query Handling

Alias search can reveal language, intent, or private study context. Production
analytics should avoid raw query collection.

Preferred fields:

- `queryLanguage`: approved enum such as `ko`, `ja`, `en`, or `unknown`.
- `result`: `matched` or `no_match`.
- `matchedSlug` when a canonical word is found.
- `queryLengthBucket` such as `1-2`, `3-5`, `6-10`, `11+`.
- `queryHash` only if a privacy review approves hashing, salt policy,
  retention, and deletion behavior.

Avoid:

- Raw query text.
- Full query history per user.
- Queries combined with raw referrer/page context.
- Permanent storage of no-result text.

If raw query sampling is ever considered for product improvement, it needs a
separate approval covering consent, sampling rate, redaction, retention, access,
and deletion.

## Extension Event Handling

Extension events should answer whether extension-sourced words become reviewed
words.

Allowed reporting goals:

- Extension save -> first review conversion.
- Extension review start/completion.
- Weekly Reviewed Words from extension-sourced saves.
- Handoff errors.

Do not use extension analytics to reconstruct what a learner read online. Any
future extension event schema must be reviewed for:

- Field minimization.
- URL/referrer removal.
- Page-text exclusion.
- Handoff ID rotation.
- Anonymous/account ID treatment.
- Retention and deletion behavior.

## User/Account Identifiers

When auth exists, account identifiers should be stable enough to compute
retention and export/delete requests, but not more revealing than necessary.

Rules:

- Use internal user/account IDs, not email addresses, as analytics join keys.
- Do not send emails, names, phone numbers, or billing addresses to analytics
  unless a later support/legal review explicitly approves a narrow use.
- Keep production, staging, and local identifiers separated.
- Support account deletion/export by knowing where analytics identifiers are
  stored.
- Avoid storing auth provider raw IDs in client-visible analytics payloads.

## Anonymous Identifiers

Anonymous identifiers are useful before sign-in, but they are still user data.

Rules:

- Generate IDs without embedding personal data.
- Rotate or reset IDs when policy requires.
- Link anonymous IDs to account IDs only through an approved migration event.
- Do not use anonymous IDs to bypass deletion/export expectations.
- Avoid fingerprinting based on device, browser, fonts, IP, or behavior.

## Retention Recommendations

Retention should be long enough to measure learning and launch safety, but not
indefinite by default.

Recommended starting point:

- Raw client events: 90 days.
- Raw trusted review and sync events: retain according to learning-state audit
  needs, with export/delete policy defined before production.
- Aggregated Weekly Reviewed Words and cohort metrics: 24 months or product
  planning horizon.
- Error events: 90-180 days unless linked to an incident that needs longer
  audit retention.
- Billing lifecycle events: follow legal, tax, refund, and provider record
  requirements after billing is authorized.
- Alias raw query samples, if ever approved: shortest practical retention,
  ideally days not months.

Retention rules must be revisited before vendor selection and production
launch.

## Export/Delete Implications

Production analytics must be designed with account export and deletion in mind.

Before production launch, define:

- Which analytics records are account-linked.
- Which records are anonymous and not reasonably linkable.
- Which derived aggregates remain after deletion.
- How account deletion affects review events used for product aggregates.
- How billing/legal retention interacts with deletion requests.
- How extension and alias search events are exported or deleted.
- Who owns manual repair if a vendor cannot delete a record by internal ID.

Do not choose a vendor or schema that makes reasonable export/delete support
impossible.

## Vendor Selection Cautions

Do not choose an analytics, product analytics, error reporting, or data
warehouse vendor until the event contract and privacy classifications are
approved.

Before vendor selection, verify:

- Data residency and subprocessors.
- Deletion/export capabilities by user/account ID and anonymous ID.
- Environment separation.
- PII controls and field-level blocking.
- Server-side ingestion with idempotency support.
- Client-side collection controls and consent posture.
- Dashboard access controls.
- Retention configuration.
- Incident response and breach notification terms.
- Pricing model and event volume limits.

No vendor should receive secrets, payment credentials, private browsing history,
or full page text.

## Production Review Checklist

Before production analytics collection is enabled:

- [ ] Event contract approved.
- [ ] Field privacy classifications approved.
- [ ] Client events separated from server-trusted events.
- [ ] Weekly Reviewed Words defined from accepted review events.
- [ ] Alias search raw query policy approved.
- [ ] Extension event minimization approved.
- [ ] Auth/account identifier policy approved.
- [ ] Billing event policy approved before billing exists.
- [ ] Retention, export, and deletion behavior documented.
- [ ] Vendor data processing terms reviewed, if a vendor is selected.
- [ ] Staging and production reporting environments separated.
- [ ] Dashboard freshness and incident owner defined.
- [ ] Secret/payment/auth scrubbing tested for error events.
- [ ] Launch go/no-go dashboards validated against test data.

## Safety Position

Do not launch production paid SaaS until analytics can measure Weekly Reviewed
Words and launch-critical funnels without overcollecting private data. Privacy
and data minimization are part of launch readiness, not a cleanup task after
collection begins.
