# Analytics Dashboard Requirements

Requirements date: 2026-06-11

Scope: Visual Lexicon Track B production v1 dashboard planning only. This
document does not add analytics SDKs, tracking scripts, vendor integrations,
network calls, dashboards, environment variables, secrets, deployment changes,
or current runtime behavior changes.

## Dashboard Principles

- The top dashboard is Weekly Reviewed Words.
- Dashboards must distinguish client intent from server-trusted learning state.
- Due, Weak, and Mastered must come from real review state.
- Billing dashboards are planned only until real billing is explicitly
  authorized.
- Every dashboard must support a launch go/no-go decision, not only reporting
  curiosity.
- Every chart must have a known source event, freshness expectation, and owner
  before production launch.

## North Star / Weekly Reviewed Words

Questions answered:

- How many words are learners actively reviewing each week?
- Which cohorts create repeat review behavior?
- Are paid-intent learners reviewing more or only clicking upgrade CTAs?
- Did Weekly Reviewed Words rise because more users reviewed or because a few
  users reviewed more?

Required events:

- `review_answer` from accepted trusted review events.
- `review_complete` derived from accepted review events.
- Future `sync_future` health events to qualify reporting completeness.

Required dimensions:

- Week, cohort, user/account state, plan/entitlement state, review mode,
  source, pack ID, language/source path, new versus returning learner.

Minimum useful charts:

- Weekly Reviewed Words trend.
- Weekly active reviewing learners.
- Reviewed words per active reviewing learner.
- New versus returning reviewed words.
- Review source mix.

Red flags:

- Reviewed words grow while active reviewing learners fall.
- Client review counts exceed trusted server counts.
- Review spikes come from duplicate events or retries.
- Mastered counts increase without delayed recall evidence.

Launch go/no-go use:

- No-go if Weekly Reviewed Words cannot be computed from deduped accepted review
  answers.
- No-go if dashboard freshness or event completeness is unknown.

## Activation Funnel

Questions answered:

- Do new learners reach the first real review quickly?
- Where do users drop between landing, saving, queueing, and answering?
- Which sources activate into review instead of passive browsing?

Required events:

- `app_page_view`
- `save_word`
- `review_start`
- `review_answer`
- `review_complete`
- `error/incident`

Required dimensions:

- Acquisition/source category, route, session, cohort, anonymous/account state,
  device class, plan state, extension versus app source.

Minimum useful charts:

- Funnel from first app view to first save to first review answer.
- Time to first save.
- Time to first accepted review answer.
- Drop-off by route/source.

Red flags:

- High page views with low saves.
- High saves with low first review.
- First review depends mainly on static quizzes rather than saved/review state.
- Errors cluster before first review.

Launch go/no-go use:

- No-go if activation cannot prove a learner completed active recall.
- Go only when activation reports are tied to real review answers.

## Save -> First Review Funnel

Questions answered:

- Do saved words become review items?
- Which save sources produce the first review?
- Are duplicate saves preserving review state?

Required events:

- `save_word`
- `review_start`
- `review_answer`
- `extension_save_source`
- `alias_search`
- `error/incident`

Required dimensions:

- Save source, slug, hub, pack ID, extension source, alias language, cohort,
  account state, save result, duplicate flag.

Minimum useful charts:

- Saved words to first accepted review conversion.
- Median time from save to first review.
- Conversion by source.
- Duplicate save rate and duplicate review-state preservation.

Red flags:

- Saved words grow while first-review conversion falls.
- Extension saves do not become review answers.
- Alias-matched saves do not become review answers.
- Duplicate saves reset SRS state.

Launch go/no-go use:

- No-go if saved words cannot be linked to first accepted review safely.

## First Review -> Second Review Funnel

Questions answered:

- Do learners return for spaced review after initial recall?
- Are due dates creating actual repeat behavior?
- Which cohorts fail after the novelty of first review?

Required events:

- `review_answer`
- `review_complete`
- `due_queue_view`
- Future `sync_future` due-state events.

Required dimensions:

- Cohort, first review date, source, review mode, next due bucket, mastery after
  first review, weak score, plan state.

Minimum useful charts:

- First review to second review conversion by window.
- Time between first and second review.
- Second review result distribution.
- Cohort retention curve.

Red flags:

- High first review but weak second review conversion.
- Second reviews happen only in the same session and not after delay.
- Due queues are not viewed after first review.

Launch go/no-go use:

- No-go if repeat review cannot be measured or if it shows the product is not
  creating a review habit.

## Due Review Completion

Questions answered:

- Are due words visible, started, and completed?
- Are due queues correctly populated from SRS state?
- Are learners clearing due work before it piles up?

Required events:

- `due_queue_view`
- `review_start`
- `review_answer`
- `review_complete`
- Future `sync_future` state and queue events.
- `error/incident`

Required dimensions:

- Due date bucket, queue size, review mode, cohort, plan state, account state,
  route, source.

Minimum useful charts:

- Due queue views by day.
- Due words completed versus due words shown.
- Due completion rate by queue size.
- Overdue backlog trend.

Red flags:

- Due count drops without review answers.
- Due queue is empty for users with recently saved words and no review history.
- Large overdue backlog grows without recovery.
- Server and client due counts diverge.

Launch go/no-go use:

- No-go if due review completion cannot be measured from real SRS state.

## Weak Word Recovery

Questions answered:

- Are weak words being practiced and recovered?
- Which words, packs, or sources produce persistent weakness?
- Does weak practice reduce weak score without fake mastery?

Required events:

- `weak_queue_view`
- `review_start`
- `review_answer`
- `review_complete`
- `error/incident`

Required dimensions:

- Weak score bucket, mastery state, box, review mode, question type, slug, pack,
  cohort, source, response speed, hint/confidence when available.

Minimum useful charts:

- Weak words count trend.
- Weak practice starts and completions.
- Weak score reduction after review.
- High-wrong words and packs.

Red flags:

- Weak queue usage is low while weak counts grow.
- Weak score falls without accepted review answers.
- Wrong answers do not increase weak score.
- Mastered includes recently weak words without delayed recall.

Launch go/no-go use:

- No-go if weak recovery cannot be linked to accepted review answers and SRS
  transitions.

## Mastery Quality

Questions answered:

- Is Mastered based on delayed recall rather than session repetition?
- Which sources produce durable mastery?
- Are mastery rates believable against wrong answers and weak scores?

Required events:

- `review_answer`
- `mastered_view`
- `review_complete`
- Future trusted SRS state snapshots.
- `error/incident`

Required dimensions:

- Mastery state, box, delayed recall evidence, days since first review, days
  since previous review, slug, pack, source, cohort.

Minimum useful charts:

- Mastered count trend.
- Box distribution.
- Mastery transition rate.
- Mastered words with delayed recall evidence.
- Regressions from Mastered after wrong answers.

Red flags:

- Mastered increases during same-session repetition only.
- Mastered words lack prior delayed recall.
- Box values fall outside 0-5.
- Wrong answers do not regress mastery or weak score.

Launch go/no-go use:

- No-go if mastery quality cannot be audited from review state and event
  history.

## Pack Preview And Pack Progress

Questions answered:

- Which packs attract interest?
- Which previews lead to review and retention?
- Is pack progress based on review work rather than page views?

Required events:

- `pack_preview_start`
- `pack_preview_complete`
- `pack_review_start`
- `pack_review_complete`
- `review_answer`
- `pricing_interest`
- `paywall_view`
- `error/incident`

Required dimensions:

- Pack ID, pack source, preview status, locked/unlocked state, plan state,
  source, cohort, word count, review mode.

Minimum useful charts:

- Preview start to preview complete funnel.
- Preview complete to pack review start funnel.
- Pack reviewed words and completion percent.
- Weak and mastered counts by pack.
- Pack paywall interest.

Red flags:

- Pack completion rises from preview events only.
- Paid-pack interest is high but review completion is low.
- Pack load failures cluster by pack source.
- Mock/fallback packs are mixed into production reports.

Launch go/no-go use:

- No-go if paid pack progress cannot be derived from accepted review/progress
  events.

## Pricing/Paywall Interest

Questions answered:

- Where do learners show paid intent?
- Which paywalls create upgrade interest or excessive friction?
- Are pricing clicks connected to review habit?

Required events:

- `pricing_interest`
- `paywall_view`
- `upgrade_interest`
- `review_answer`
- Future `billing_future` events after authorization.

Required dimensions:

- Plan, source, trigger, paywall reason, route, pack ID, cohort, account state,
  review activity segment.

Minimum useful charts:

- Pricing interest by plan/source.
- Paywall views by surface and reason.
- Upgrade interest after review activity.
- Weekly Reviewed Words before and after paywall exposure.

Red flags:

- Pricing interest comes from users with no review behavior.
- Paywall views block core review loops before entitlement is ready.
- Local upgrade interest is mistaken for paid conversion.

Launch go/no-go use:

- No-go if the product cannot distinguish paid interest from paid entitlement.

## Extension Source Funnel

Questions answered:

- Does the extension create saved words that become reviewed words?
- Which extension handoffs fail?
- Are extension-sourced words retained in weekly review?

Required events:

- `extension_save_source`
- `extension_review_source`
- `save_word`
- `review_answer`
- `review_complete`
- `error/incident`

Required dimensions:

- Extension surface, source category, handoff ID, save result, review mode,
  slug, cohort, account state.

Minimum useful charts:

- Extension save to first review conversion.
- Extension review starts and completions.
- Weekly Reviewed Words from extension-sourced saves.
- Extension handoff error rate.

Red flags:

- Extension saves do not reach first review.
- Handoff failures spike by browser/version.
- Reports contain raw URLs or page text.

Launch go/no-go use:

- No-go for extension-led acquisition claims if extension saves cannot be tied
  to safe review reporting.

## Multilingual Alias Search Funnel

Questions answered:

- Do alias searches help learners find canonical word cards?
- Which languages or aliases produce no-result friction?
- Do alias matches lead to saves or reviews?

Required events:

- `alias_search`
- `save_word`
- `review_answer`
- `review_complete`
- `error/incident`

Required dimensions:

- Query language, match result, matched slug, query length bucket or approved
  hash, source, cohort, account state.

Minimum useful charts:

- Alias search match rate by language.
- Alias match to save conversion.
- Alias match to first review conversion.
- No-result rate trend.

Red flags:

- Raw search queries are stored without approval.
- Match rate falls after alias updates.
- Searches produce saves but not reviews.

Launch go/no-go use:

- No-go for multilingual acquisition claims if alias search cannot be measured
  without overcollecting query data.

## Future Billing Funnel

Questions answered:

- When billing is authorized, do checkout, payment, entitlement, refund, and
  cancellation events reconcile?
- Are paid learners getting the access they paid for?
- Does paid access increase Weekly Reviewed Words?

Required events:

- Future `billing_future` events.
- `pricing_interest`
- `paywall_view`
- `upgrade_interest`
- `review_answer`
- `error/incident`

Required dimensions:

- Plan, entitlement state, provider event type, account, billing cohort, pack
  purchase, cancellation/refund reason, environment.

Minimum useful charts:

- Pricing interest to checkout to active entitlement funnel.
- Active, past due, canceled, expired, refunded, and revoked states.
- Paid Weekly Reviewed Words by plan.
- Refund/cancellation rate.
- Billing incident rate.

Red flags:

- Provider events and entitlement snapshots do not reconcile.
- Browser events grant entitlement.
- Refunds or chargebacks do not revoke access when policy requires.
- Paid users cannot preserve learning progress.

Launch go/no-go use:

- No-go for paid SaaS if billing and entitlement reporting is not server
  trusted, reconciled, and support-ready.

## Future Auth/Sync Health

Questions answered:

- Are accounts, migration, hydration, and sync reliable?
- Do review writes survive retries and device changes?
- Are stale clients or conflicts corrupting memory state?

Required events:

- Future `auth_future` events.
- Future `sync_future` events.
- `save_word`
- `review_answer`
- `error/incident`

Required dimensions:

- Account state, migration batch, device, sync cursor, result, retryable state,
  stale-client reason, conflict type, cohort.

Minimum useful charts:

- Sign-up/sign-in/session health.
- Guest-to-account migration success and failure.
- Sync hydration success and failure.
- Retry, duplicate, rejected, and stale-client rates.
- Client/server review state divergence.

Red flags:

- Duplicate review answers advance SRS more than once.
- Hydration drops local progress.
- Stale clients overwrite newer server state.
- Account events include secrets or auth tokens.

Launch go/no-go use:

- No-go if account-owned SRS state cannot be trusted across devices and retries.

## Error And Incident Reporting

Questions answered:

- What failures are affecting learning, access, billing, privacy, or trust?
- Which failures require rollback or stop-sales?
- Are dashboards fresh and complete?

Required events:

- Error/incident events.
- Future auth, sync, and billing failure events.
- Client runtime error summaries.
- Server accepted/rejected write events.

Required dimensions:

- Severity, surface, route, operation, environment, source of truth, error code,
  incident ID, account/cohort where safe, retryable flag.

Minimum useful charts:

- Incident count by severity.
- Error rate by surface and operation.
- Save/review/sync/billing failure trend.
- Dashboard freshness and ingestion lag.
- Affected learners/accounts.

Red flags:

- Review answer failures are not visible.
- Billing or entitlement errors lack severity and owner.
- Analytics ingestion silently stops.
- Error payloads contain secrets, payment data, or private text.

Launch go/no-go use:

- No-go if P0 learning, sync, billing, privacy, or deployment failures cannot be
  detected and owned quickly.

## Production Readiness Note

These dashboards are requirements, not implemented dashboards. Production paid
SaaS launch should wait until the required dashboards are connected to trusted
events, privacy-reviewed, fresh, and used in release QA.
