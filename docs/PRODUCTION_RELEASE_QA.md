# Production Release QA

QA package date: 2026-06-11

Branch: `release/production-release-qa`

Scope: Visual Lexicon Track B production v1 release QA planning only. This
document does not deploy, change runtime behavior, add auth, add billing, add
analytics SDKs, change environment variables, touch Webflow, touch Cloudflare
Workers, change DNS, mutate production data, or launch a paid SaaS product.

## Goal

Consolidate the production v1 planning work completed through #45 into one
release QA decision for Visual Lexicon Track B.

The QA goal is to answer whether the current app can launch as a public
production paid SaaS at `app.visuallexicon.org`.

## Non-Goals

- Do not launch production.
- Do not deploy or change Vercel settings.
- Do not change DNS or domain routing.
- Do not touch Track A, Webflow, Webflow CMS, or Cloudflare production Workers.
- Do not add secrets, environment variables, auth runtime, billing runtime,
  checkout, payment SDKs, analytics SDKs, tracking scripts, or network calls.
- Do not mutate production user data or production pack data.
- Do not claim production paid SaaS readiness.

## Release QA Scope

This QA package covers:

- Current local/private beta learning loop readiness.
- Route, storage, review, pack, pricing, extension, and alias-search QA
  inventory.
- Production readiness status for account persistence, server SRS sync,
  billing/entitlements, deployment/domain, analytics/reporting, and
  support/refund/legal readiness.
- P0/P1/P2 blockers for public paid launch.
- Final go/no-go recommendation for the next launch decision PR.

This QA package does not execute a staging or production smoke test. That still
requires a real deployment target and launch owner sign-off.

## Completed Through #45

| PR | Area | Completed planning output |
| --- | --- | --- |
| #40 | Production v1 gap audit | Defined why the current local/private beta app is not enough for paid SaaS and listed production gaps. |
| #41 | Auth/account persistence | Documented account lifecycle, local-to-account migration requirements, and account-owned learning state. |
| #42 | Server-side saved/review SRS sync | Documented server source-of-truth contracts for saved words, review events, materialized review state, stats, pack progress, idempotency, and conflict handling. |
| #43 | Billing/entitlement architecture | Documented provider-neutral billing, subscription, purchase, refund, cancellation, and entitlement requirements without adding runtime billing. |
| #44 | Production deployment/domain readiness | Documented `app.visuallexicon.org` deployment, environment, DNS, rollback, monitoring, and smoke-test readiness requirements. |
| #45 | Production analytics/reporting | Documented trusted-event analytics requirements for Weekly Reviewed Words, review quality, funnels, entitlement reporting, and incident reporting. |

The result is a strong production planning baseline, not a production
implementation.

## Missing For True Production v1

Production v1 still requires:

- Real auth/account creation, sign-in, recovery, sessions, and account IDs.
- Durable server-side saved words, review state, review events, daily stats,
  pack progress, and account migration.
- Cross-device SRS sync with idempotent writes, conflict handling, retries, and
  delayed-recall mastery protection.
- Billing provider integration, plans/prices, webhook processing, entitlement
  snapshots, refund/cancellation states, and failed-payment states.
- Server-side entitlement enforcement that cannot be granted by local storage.
- Verified staging and production deployment/domain posture for
  `app.visuallexicon.org`.
- Trusted analytics/reporting that can report Weekly Reviewed Words and launch
  funnels from accepted events.
- Support, refund, cancellation, legal, privacy, and billing disclosure copy.
- Production smoke QA on staging and production.
- Final launch owner sign-off.

## Local/Private Beta Readiness Summary

Current status: Go for continued local/private no-payment beta planning.

The app remains a strong local/private beta learning MVP because:

- Save creates or preserves local saved words and local review state.
- Review answers create local review events and update local SRS state.
- Due, Weak, and Mastered are derived from real local review state.
- Pack previews and local pack progress exist without fake paid-pack
  completion.
- Pricing and upgrade-interest surfaces remain placeholders and do not create
  checkout, subscriptions, invoices, billing portals, or payment SDK behavior.
- Extension and multilingual alias save sources normalize into the same local
  save/review contracts.

The beta caveat remains important: progress is browser-local until auth and
server sync are implemented.

## Production Paid SaaS Readiness Summary

Current status: No-Go for public production paid SaaS launch.

The current app cannot safely sell public paid access because users cannot yet
own account-bound progress, keep progress across devices, receive server-owned
entitlements, recover billing/support issues, or be measured by trusted
production events.

Production paid launch must remain blocked until P0 systems are implemented and
verified.

## Route QA Inventory

| Route | Current QA status | Production v1 status |
| --- | --- | --- |
| `/` | Local dashboard entry loads the learning app shell and must reflect local SRS state only. | Needs production copy review after auth/sync/billing exist. |
| `/dashboard` | Local memory mission, counts, and CTAs derive from local storage state. | Must hydrate from server account state and trusted SRS selectors. |
| `/saved` | Saved library reads local saved/review/event state and must show honest empty states. | Must read account-bound saved words and review state. |
| `/save?slug=...&source=...` | Existing save helper creates or preserves local saved words and review state. | Must become account/sync aware before production persistence claims. |
| `/review` | Mixed local review can update review state, events, and daily stats. | Review writes must be accepted by trusted server SRS sync. |
| `/review/due` | Due route derives from local `nextDueAt` and review state. | Due queue must derive from server materialized review state. |
| `/review/weak` | Weak route derives from local `Weak` mastery or positive weak score. | Weak queue must derive from trusted account SRS state. |
| `/review/weak-sprint` | Existing beta helper uses local weak state and records answer events. | Must enforce entitlement and server writes when paid-only. |
| `/packs` | Pack catalog and preview states are local/mock or public static data. | Needs production content QA, entitlement, and pack progress sync. |
| `/packs/[packId]` | Pack detail can start preview review and write local pack progress. | Needs account-bound pack progress and entitlement enforcement. |
| `/word/[slug]` | Word page content may be static/mock, but memory state panel reads local SRS state. | Needs production content readiness and account-owned memory state. |
| `/pricing` | No-payment placeholder/interest surface; no real checkout. | Needs approved billing provider, support/legal copy, and entitlement flow. |
| `/settings` | Local plan/settings placeholders only; no auth or billing management. | Needs real account, support, cancellation, and billing state surfaces. |

## LocalStorage/SRS QA Inventory

| Area | Current QA status | Production risk |
| --- | --- | --- |
| `vlx_saved_words_v1` | Save flow creates/preserves local saved records keyed by slug. | Local storage is not durable account persistence. |
| `vlx_review_state_v1` | Save creates initial review state; review answers update box, mastery, counts, weak score, and due dates. | Server reducer and account-bound state are missing. |
| `vlx_review_events_v1` | Review answers append local events with answer/result/response/state-after fields. | Trusted append-only server events are missing. |
| `vlx_daily_stats_v1` | Review updates local daily reviewed/correct/wrong/mastered/weak/session counters. | Weekly Reviewed Words cannot be trusted until server events exist. |
| Mastered state | Must derive from SRS state and delayed recall; must not be faked by one save or static content. | Server-side mastery audit is missing. |
| Due/Weak selectors | Current selectors use local review state. | Cross-device selectors require server materialized state. |

## Pack QA Inventory

| Area | Current QA status | Production v1 requirement |
| --- | --- | --- |
| Pack catalog | Local/static pack catalog is usable for preview. | Content source, pack versions, and production pack claims must be reviewed. |
| Pack detail | Existing detail route can start preview review. | Pack access must respect account entitlements. |
| Pack progress | Local progress records preview start/completion and reviewed/correct counts from actual answers. | Progress must be account-bound and derived from trusted events. |
| Paid packs | Current placeholders must not pretend IELTS/GRE or paid packs are complete. | Paid pack access requires content QA and entitlement enforcement. |

## Pricing/Paywall QA Inventory

| Area | Current QA status | Production v1 requirement |
| --- | --- | --- |
| Pricing page | Interest capture only when no external beta URL is configured. | Real pricing requires legal, support, billing, refund, and cancellation copy. |
| Upgrade CTAs | Must not create checkout, subscription, invoice, billing portal, or payment SDK behavior. | Checkout requires explicit authorization and account identity. |
| Local plan state | `vlx_plan_state_v1` can preview local gating only. | Entitlements must be server-owned and provider-backed. |
| Upgrade interest | `vlx_upgrade_interest_v1` is a lead signal only. | Interest must never grant paid access. |

## Extension Bridge QA Inventory

| Area | Current QA status | Production v1 requirement |
| --- | --- | --- |
| Save source | `source=extension` normalizes into local save/review contracts. | Extension saves must sync to account state when signed in. |
| Privacy boundary | App route must not store extension tokens, browsing history, or raw page content. | Production extension events need privacy-filtered client/server contracts. |
| Review handoff | Extension-origin words can enter review through the same local SRS flow. | Cross-device and account continuity require server sync. |

## Multilingual Alias QA Inventory

| Area | Current QA status | Production v1 requirement |
| --- | --- | --- |
| Known aliases | Alias search resolves known aliases to canonical English slugs. | Server-side alias/content contracts are needed for production scale. |
| Unknown aliases | Unknown aliases must not expose fake save actions or fake word cards. | Production search should keep the same no-fake-card rule. |
| Save source | `source=alias_search` preserves the canonical slug and local SRS state. | Account sync must preserve source metadata without creating duplicate cards. |
| Multilingual pages | Not implemented and not authorized in this release QA package. | Requires separate content and product approval. |

## Auth/Account Readiness QA Status

Status: Planned only, not implemented.

The architecture is documented, but there is no runtime account creation,
sign-in, sign-out, recovery, session handling, account ID, local-to-account
migration, or account-owned persistence.

Production impact: P0 blocker.

## Server SRS Sync Readiness QA Status

Status: Planned only, not implemented.

Server-side saved/review contracts are documented, but the app still uses
browser local storage for the active MVP source of truth. There are no trusted
server review event writes, idempotency keys, sync cursors, conflict handling,
or server materialized SRS selectors in runtime.

Production impact: P0 blocker.

## Billing/Entitlement Readiness QA Status

Status: Planned only, not implemented.

Billing and entitlement architecture is documented, but no provider SDK,
checkout route, subscription, invoice, billing portal, webhook handler,
entitlement snapshot, or server enforcement exists in runtime.

Production impact: P0 blocker.

## Deployment/Domain Readiness QA Status

Status: Planned only, not verified.

The intended domain is `app.visuallexicon.org`, but this QA package does not
change DNS, Vercel settings, environment variables, deployment protection,
monitoring, or rollback configuration. No staging or production smoke test has
been executed by this PR.

Production impact: P0 blocker.

## Analytics/Reporting Readiness QA Status

Status: Planned only for production, local client events only in current app.

Production analytics architecture is documented, but trusted server event
collection, dashboards, cohort reporting, incident reporting, and production
Weekly Reviewed Words reporting are not implemented.

Production impact: P0 blocker.

## Support/Refund/Legal Readiness QA Status

Status: Incomplete for production paid SaaS.

The product still needs final support owner, refund/cancellation policy, terms,
privacy, billing disclosure, data retention/deletion/export policy, and support
macros before charging users.

Production impact: P0 blocker.

## P0 Blockers

| Blocker | Impact |
| --- | --- |
| Real auth/account persistence not implemented | Users cannot reliably own paid progress. |
| Server-side saved/review SRS sync not implemented | Progress and memory state remain browser-local. |
| Cross-device progress not implemented | Paid users could lose or split review history. |
| Billing/provider integration not implemented | The app cannot safely create or manage paid access. |
| Server-side entitlement enforcement not implemented | Paid access could not be audited or revoked safely. |
| Production deployment/domain not verified | `app.visuallexicon.org` is not proven in launch posture. |
| Trusted analytics/reporting not implemented | Weekly Reviewed Words cannot be measured for production. |
| Support/refund/legal copy not finalized | Users cannot be charged without clear operating terms. |
| Production smoke test not executed on staging/production | Launch behavior is not validated in target environments. |
| Final launch owner sign-off missing | No accountable production go decision exists. |

## P1 Blockers

- Production content QA and paid-pack readiness.
- Error reporting and alerting for review, sync, billing, entitlement, and pack
  loading failures.
- Support macros for account, sync, access, refund, cancellation, and content
  issues.
- Staging seeded accounts and repeatable launch QA data.
- Dashboard/report definitions for activation, retention, weak-word recovery,
  and paid conversion.

## P2 Blockers

- Broader UI polish beyond launch-critical states.
- Full Chrome extension integration beyond app-side bridge contracts.
- Full multilingual page generation.
- AI Tutor or wrong-answer explanations after the SRS loop is production safe.
- Admin tooling for content operations.

## Final QA Recommendation

No-Go for public production paid SaaS launch.

Continue as a local/private no-payment beta candidate only. Proceed to #47
Public paid launch decision as a documented No-Go / Not Yet decision unless the
P0 systems are later implemented and verified.

Do not launch production paid SaaS yet. Production paid launch remains blocked
until auth/account persistence, server-side SRS sync, billing/entitlement
enforcement, deployment/domain readiness, trusted analytics/reporting,
support/refund/legal copy, and staging/production smoke QA are complete.
