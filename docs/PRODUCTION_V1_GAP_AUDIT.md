# Production v1 Gap Audit

Audit date: 2026-06-11

Repository branch audited: `release/production-v1-gap-audit`

Scope: Track B learning app planning only. This audit does not change runtime
behavior and does not include Webflow, Cloudflare production Workers, auth,
billing, DNS, payment settings, secrets, production data, deployment settings,
real payment, AI Tutor functionality, or multilingual page generation.

## Strategic Recommendation

Do not launch Visual Lexicon Track B as a full paid SaaS yet.

The current app is approximately 8.5/10 as a local learning MVP and private beta
candidate because the core memory loop is represented and testable: Save ->
Review -> SRS state/events -> Due/Weak/Mastered. It is only approximately
4.5-5/10 as a full production paid SaaS because the app lacks real auth,
server-side persistence, billing/entitlement enforcement, production sync,
production analytics/reporting, support systems, refund/legal copy, and
deployment readiness.

If open beta is skipped, the next work must be production system foundations,
not launch copy or payment shortcuts:

1. #41 Auth/account persistence architecture
2. #42 Server-side saved/review SRS sync
3. #43 Billing/entitlement architecture
4. #44 Production deployment/domain readiness
5. #45 Production analytics/reporting
6. #46 Production release QA
7. #47 Public paid launch decision

## Current Completed Product State

The app has passed local paid beta validation in the current product line:

- Save creates or preserves local saved words and review state.
- Review answers create local events and update SRS state.
- Due, Weak, and Mastered are derived from real local review state.
- Pack previews and local pack progress exist without fake paid-pack completion.
- Pricing interest capture exists without real checkout or subscription logic.
- Extension bridge contracts normalize app-side save/review URLs.
- Multilingual alias search resolves known aliases to canonical English slugs
  and avoids creating fake actions for unknown aliases.
- Local paid beta validation previously passed with 78 passing tests and 1
  skipped test on `main`.

This is strong evidence for a private/local beta learning loop. It is not
evidence that Visual Lexicon can safely charge recurring subscriptions.

## What Qualifies As Production v1

Production v1 is a real paid SaaS launch. It is not a local beta with better
copy and it is not a payment link bolted onto browser local storage.

Production v1 requires:

- Users can create accounts, sign in, recover access, and keep progress across
  devices.
- Saved words, review state, review events, daily stats, pack progress, and
  entitlement state persist server-side.
- The SRS system remains truthful after sync conflicts, device changes, retries,
  stale browser state, and account migration.
- Billing and entitlements are explicit, auditable, and revocable.
- The app can distinguish free, trial, paid, expired, refunded, and canceled
  states without trusting local storage.
- Production analytics report the North Star, Weekly Reviewed Words, and key
  activation/retention funnels.
- Support, refund, legal, privacy, and cancellation copy are published before
  users are charged.
- Content and packs are production-quality and do not rely on mock/fallback
  claims.
- The deployed app has known domains, rollback, monitoring, error reporting,
  and release ownership.

## Missing Production Requirements

The following requirements are missing or incomplete for full paid SaaS launch:

- Account authentication and account recovery.
- Account-bound persistence for saved words and SRS state.
- Server-side review event writes and idempotent sync behavior.
- Conflict rules for local/offline state versus account state.
- Billing provider integration, plan records, webhook handling, and entitlement
  checks.
- Refund, cancellation, subscription, invoice, and failed-payment handling.
- Production deployment plan for `app.visuallexicon.org`.
- Observability for review failures, storage failures, billing failures, and
  activation drop-off.
- Product analytics that can report weekly reviewed words by cohort.
- Support inbox, incident path, refund policy, terms/privacy copy, and billing
  disclosures.
- Production content readiness for paid packs and word detail quality.
- Launch QA across auth, sync, billing, entitlement, content, and deployment.

## P0 Gap List

P0 gaps block full production paid launch.

| Gap | Why it blocks launch | Required before launch |
| --- | --- | --- |
| No real auth/account system | Users cannot reliably own paid progress. | Account creation, sign-in, recovery, sessions, and account IDs. |
| No server-side saved/review state | Local storage can be lost, reset, or isolated per device. | Durable account-bound saved words, review state, and events. |
| No production SRS sync contract | Memory state can diverge across devices or retries. | Idempotent sync, conflict rules, migration, and recovery paths. |
| No billing/entitlement architecture | Paid access cannot be granted, revoked, audited, or refunded safely. | Provider selection, plan model, webhooks, entitlement checks, and billing states. |
| No production deployment readiness | App is not proven in the intended domain/runtime posture. | Domain, environment, monitoring, rollback, and release owner sign-off. |
| No legal/support/refund system | Charging users without published support and refund terms is unsafe. | Terms, privacy, refund/cancellation policy, support workflow, and incident owner. |
| No launch QA across paid flows | Existing tests validate local MVP behavior, not a paid SaaS system. | End-to-end QA covering account, sync, billing, entitlement, analytics, and rollback. |

## P1 Gap List

P1 gaps do not necessarily block architecture work, but they block a confident
public production launch.

- Production analytics dashboards for Weekly Reviewed Words, activation,
  retention, review completion, weak-word recovery, pack progress, and paid
  conversion.
- Error reporting and alerting for save, review, sync, entitlement, payment, and
  pack loading failures.
- Real paid pack content review, content QA, and content versioning policy.
- Production copy review for pricing, plan claims, trial/paid states, and beta
  versus production claims.
- Account data export/deletion support path.
- Support macros for access issues, refund requests, sync loss, payment failure,
  and cancellation questions.
- Pack and word content provenance/review records.
- Staging environment and seeded test accounts for launch QA.

## P2 Gap List

P2 gaps can follow production v1 if the P0/P1 launch bar is satisfied.

- Broader UI polish beyond launch-critical states.
- More advanced pack merchandising and preview analytics.
- Full Chrome extension integration beyond app-side bridge contracts.
- Full multilingual pages and generated multilingual content.
- AI Tutor or wrong-answer explanation features after SRS sync is production
  safe.
- Admin tooling for content operations beyond minimum production support.

## Auth And Account Persistence Requirements

Production v1 needs an account model before real subscriptions are sold.

Required behavior:

- Stable user/account ID for all saved words, review state, events, daily stats,
  pack progress, and entitlements.
- Sign-up, sign-in, sign-out, session refresh, password or magic-link recovery,
  and account recovery support.
- Clear guest-to-account migration for existing local progress.
- Safe handling for multiple browsers and devices.
- Explicit behavior when a user is signed out, subscription is expired, or
  account access is revoked.
- Data deletion/export support path or policy.

Likely artifacts:

- Auth architecture decision record.
- Account data model.
- Local-to-account migration plan.
- Session and route access policy.
- Manual QA script for account persistence.

## Server-Side Saved And Review State Requirements

The existing local storage keys are useful MVP contracts, but production v1
needs server-side ownership of the same learning state.

Required persisted records:

- Saved words.
- Review state with box, mastery, correct/wrong counts, weak score, response
  metadata, last reviewed time, and next due time.
- Review answer events.
- Daily/weekly stats.
- Pack progress.
- Migration metadata from local storage to account state.

Required sync behavior:

- Idempotent writes for review answers.
- Conflict handling when local and server state disagree.
- Retry behavior that does not duplicate events or over-advance SRS boxes.
- Device-to-device consistency for due, weak, and mastered selectors.
- Delayed recall rules preserved for Mastered status.
- Auditability for mistakes, weak-score changes, and box changes.

## Billing And Entitlement Requirements

Production v1 cannot rely on local plan state or frontend-only checks.

Required billing architecture:

- Provider decision and documented integration boundaries.
- Product/price/plan model.
- Checkout initiation only after explicit authorization.
- Webhook processing for paid, failed, canceled, refunded, disputed, trialing,
  and expired states.
- Server-side entitlement records tied to account IDs.
- Frontend entitlement reads that do not expose secrets.
- Billing portal or support path for cancellation, invoice access, and plan
  changes.
- Refund workflow and entitlement revocation behavior.

Prohibited until explicitly authorized:

- Checkout route.
- Payment SDK.
- Subscription creation.
- Billing portal integration.
- Real payment link behavior inside the app.
- Any claim that a plan is active because local storage says so.

## Deployment And Domain Requirements

Production v1 needs a verified deployment plan before public launch.

Required readiness:

- Target domain and environment ownership for `app.visuallexicon.org`.
- Staging environment for auth, sync, billing, and pack validation.
- Environment variable inventory and secret handling plan.
- Rollback procedure with owner and timing.
- Monitoring for app health, error rate, review writes, sync writes, billing
  webhooks, and pack loading.
- Release checklist with go/no-go sign-off.
- No accidental coupling to Track A Webflow publishing or Cloudflare production
  Workers.

## Analytics And Reporting Requirements

The North Star is Weekly Reviewed Words, so production analytics must measure
actual review behavior, not only page visits or saved words.

Minimum reporting:

- Weekly Reviewed Words by active account and cohort.
- Save -> first review conversion.
- First review -> second review conversion.
- Due review completion rate.
- Weak Words Sprint usage and weak-score recovery.
- Mastered count based on real delayed recall.
- Pack preview start, completion, and paid conversion.
- Pricing interest, checkout start, paid conversion, cancellation, refund, and
  failed payment once billing is authorized.
- Error and support rates by cohort.

Data safety:

- Do not collect private browsing history, full page text, secrets, payment
  credentials, or unnecessary personal data.
- Keep analytics schemas documented and reviewed before adding external SDKs.
- Make server-side analytics resilient to retries and duplicate client events.

## Legal, Support, And Refund Requirements

Before charging subscriptions, Visual Lexicon needs published operational copy
and a support path.

Minimum requirements:

- Terms of service.
- Privacy policy.
- Refund policy.
- Cancellation policy.
- Billing and subscription disclosure.
- Support contact and response-time expectation.
- Data retention and deletion policy.
- Beta versus production wording review if any cohort remains beta-labeled.
- Incident escalation path for payment, access, data loss, and safety issues.

The app must not imply permanent progress, account sync, full paid pack
availability, or production support until those systems are real.

## Content And Pack Readiness Requirements

Production v1 needs paid content that is reviewable, stable, and accurately
described.

Required readiness:

- Production pack inventory and ownership.
- Word content QA for definitions, examples, visual metaphors, memory hooks,
  distractors, and review prompts.
- Versioning policy for pack updates.
- Policy for changing or removing words after users have progress.
- No fake IELTS/GRE or paid pack completion claims.
- Static/R2 pack source validation in staging before launch.
- Content support path for corrections and takedowns.

## QA Requirements

Existing local tests are necessary but not sufficient for production v1.

Required QA layers:

- Existing static checks: `npm.cmd run typecheck`, `npm.cmd run lint`,
  `npm.cmd run build`, and `npm.cmd run test -- --workers=1`.
- Account creation/sign-in/sign-out/recovery QA.
- Guest-to-account migration QA.
- Cross-device SRS sync QA.
- Review answer retry/idempotency QA.
- Due/Weak/Mastered selector QA against server state.
- Billing webhook and entitlement QA once payment work is authorized.
- Refund/cancellation/expired-plan QA.
- Analytics event and reporting QA.
- Deployment smoke test on staging and production domain.
- Rollback rehearsal before launch.
- Manual golden-flow QA recorded in release notes.

## Recommended PR Roadmap From #41 Onward

The next PRs should establish production foundations before any public paid
launch claim.

| PR | Title | Purpose | Launch gate |
| --- | --- | --- | --- |
| #41 | Auth/account persistence architecture | Decide account model, session model, guest migration, and data ownership. | Blocks production launch. |
| #42 | Server-side saved/review SRS sync | Persist saved words, review state, events, daily stats, and pack progress server-side. | Blocks production launch. |
| #43 | Billing/entitlement architecture | Define billing provider, plan records, webhooks, entitlements, refunds, and cancellation handling. | Blocks paid launch. |
| #44 | Production deployment/domain readiness | Prepare environment, domain, monitoring, rollback, and release ownership. | Blocks public launch. |
| #45 | Production analytics/reporting | Report Weekly Reviewed Words and production funnel/retention metrics safely. | Blocks confident launch. |
| #46 | Production release QA | Execute cross-system QA for auth, sync, billing, deployment, content, support, and analytics. | Blocks public launch. |
| #47 | Public paid launch decision | Record final go/no-go with risks, accepted gaps, rollback, and support owner. | Final launch gate. |

## Final Assessment

Visual Lexicon Track B should move from private/local paid beta readiness into
production foundation work. Skipping open beta is possible only if the next
phase builds the missing production systems before asking the public to pay for
a recurring SaaS product.

Safety confirmation for this audit scope: Webflow, Cloudflare Workers, auth,
billing, DNS, payment settings, secrets, production data, deployment settings,
real payment, AI Tutor functionality, and multilingual page generation were not
required for this documentation plan and must not be touched by this PR.
