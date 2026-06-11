# Production Golden Flows

Flow package date: 2026-06-11

Scope: Golden flows for Visual Lexicon Track B production v1 readiness. These
flows describe expected behavior for the current local/private beta and for a
future production v1. They do not implement runtime behavior.

## Guest First Visit

Purpose: Confirm a new learner sees the learning app without fake progress or
production claims.

Steps:

1. Open `/` or `/dashboard` in a fresh browser.
2. Inspect memory mission, review CTAs, saved counts, due counts, weak counts,
   mastered counts, pricing prompts, and account/billing copy.

Expected local/private beta behavior:

- App loads with honest local empty state.
- No saved, due, weak, mastered, streak, or pack progress is faked.
- Copy does not claim account persistence, cross-device sync, or production
  billing.

Expected production v1 behavior:

- Guest state is clear and limited.
- Account creation/sign-in is available.
- Any guest progress caveat is explicit.
- No paid entitlement is implied before account/billing state exists.

Current readiness: Ready for local/private beta; not production ready.

Blockers: Auth/account persistence, server sync, production copy, entitlement
handling.

## Save Word

Purpose: Confirm saving a word creates a review item, not just a bookmark.

Steps:

1. Open `/save?slug=dissonance&source=word_page`.
2. Open `/saved`.
3. Open `/word/dissonance`.
4. Inspect local storage for `vlx_saved_words_v1` and
   `vlx_review_state_v1`.

Expected local/private beta behavior:

- `dissonance` is saved once.
- A matching review state exists with mastery `New`, box `0`, and weak score
  `0`.
- Duplicate saves preserve existing progress.

Expected production v1 behavior:

- Save writes to account-bound saved words.
- First save creates or preserves server review state.
- Duplicate saves are idempotent.
- Offline/local save queues sync safely after sign-in.

Current readiness: Ready for local/private beta.

Blockers: Server-side saved words, account migration, idempotent sync.

## Save To Review

Purpose: Confirm saved words enter active recall.

Steps:

1. Save `dissonance`.
2. Open `/review`.
3. Answer at least one review prompt.
4. Inspect `vlx_review_events_v1`, `vlx_review_state_v1`, and
   `vlx_daily_stats_v1`.

Expected local/private beta behavior:

- Review starts from real local candidates.
- Each answer appends an event.
- Review state and daily stats update from the answer.

Expected production v1 behavior:

- Review answer is accepted by a trusted server event pipeline.
- Server SRS reducer updates materialized review state.
- Retries are idempotent and cannot duplicate events or over-advance boxes.

Current readiness: Ready for local/private beta.

Blockers: Trusted server review events, server SRS reducer, retry/conflict
handling.

## Due Review

Purpose: Confirm due review is driven by SRS timing.

Steps:

1. Seed or create a saved/reviewed word with `nextDueAt` at or before now.
2. Open `/review/due`.
3. Answer a prompt.
4. Confirm the next due date updates according to SRS rules.

Expected local/private beta behavior:

- Due queue derives from local review state and `nextDueAt`.
- Wrong answers come back sooner.
- Correct answers move forward only under the SRS rules.

Expected production v1 behavior:

- Due queue derives from server materialized review state.
- The server reducer owns due-date updates.
- Cross-device due queues are consistent after sync.

Current readiness: Ready for local/private beta.

Blockers: Server selectors, account sync, cross-device consistency.

## Weak Review

Purpose: Confirm weak words come from real mistakes or weak score.

Steps:

1. Answer a saved word incorrectly.
2. Open `/review/weak`.
3. Confirm the word appears because of weak state.
4. Answer the weak review prompt.

Expected local/private beta behavior:

- Weak queue derives from local `Weak` mastery, wrong history, or weak score.
- Answering updates weak score and review state.

Expected production v1 behavior:

- Weak queue derives from trusted account SRS state.
- Weak recovery metrics are reported from accepted review events.

Current readiness: Ready for local/private beta.

Blockers: Server SRS sync, trusted weak selectors, analytics/reporting.

## Weak Sprint

Purpose: Confirm short weak-word practice reinforces real weak state.

Steps:

1. Create multiple weak local words.
2. Open `/review/weak-sprint`.
3. Complete available prompts.
4. Inspect review events and weak-score changes.

Expected local/private beta behavior:

- Sprint uses real weak local items.
- Empty state appears when no weak items exist.
- Answers create events and update weak score.

Expected production v1 behavior:

- Sprint respects server entitlements if gated.
- Events sync to account state.
- Weak-word recovery reports in production analytics.

Current readiness: Ready for local/private beta.

Blockers: Entitlement enforcement, server sync, production analytics.

## Pack Preview

Purpose: Confirm pack previews do not fake progress or paid access.

Steps:

1. Open `/packs`.
2. Open `/packs/academic-vocabulary`.
3. Start preview review.
4. Confirm preview context carries into review.

Expected local/private beta behavior:

- Available packs are previewable.
- Planned packs stay honest placeholders.
- Preview start is recorded locally.

Expected production v1 behavior:

- Pack content source and version are production reviewed.
- Pack access respects account entitlements.
- Preview events are account-bound and reportable.

Current readiness: Ready for local/private beta with content caveats.

Blockers: Production content QA, pack entitlement, server pack progress.

## Pack Progress

Purpose: Confirm pack progress reflects real action.

Steps:

1. Start a pack preview.
2. Complete pack-context review prompts.
3. Inspect `vlx_pack_progress_v1`.
4. Reopen the pack detail page.

Expected local/private beta behavior:

- Progress records preview start/completion and reviewed/correct counts from
  actual answers.
- Opening a page alone does not complete a pack.

Expected production v1 behavior:

- Progress is account-bound.
- Counters derive from accepted pack/review events.
- Pack version changes do not corrupt review history.

Current readiness: Ready for local/private beta.

Blockers: Server pack progress, trusted pack events, content versioning.

## Pricing Interest

Purpose: Confirm pricing captures interest without accidental payment.

Steps:

1. Open `/pricing`.
2. Click available Lite/Pro CTAs in no-payment mode.
3. Inspect `vlx_upgrade_interest_v1`.
4. Confirm no checkout or payment screen appears.

Expected local/private beta behavior:

- Interest is recorded locally when no external beta URL is configured.
- No checkout, subscription, invoice, billing portal, payment SDK, or payment
  credential request appears.

Expected production v1 behavior:

- Pricing is backed by approved plans, legal/support/refund copy, and account
  identity.
- Checkout starts only through an authorized server flow.
- Entitlements are server-owned and auditable.

Current readiness: Ready for no-payment beta interest only.

Blockers: Billing provider, entitlement enforcement, legal/support copy.

## Extension Save Source

Purpose: Confirm extension-origin saves enter the same learning loop safely.

Steps:

1. Open `/save?slug=lucid&source=extension`.
2. Inspect saved word source and review state.
3. Start review from the saved word.

Expected local/private beta behavior:

- Source is recorded as `extension`.
- The same saved/review state contracts are used.
- No extension tokens, browsing history, raw page text, or private user data is
  stored by the app route.

Expected production v1 behavior:

- Extension saves sync to account state after sign-in.
- Privacy-filtered extension events support analytics without storing private
  page content.

Current readiness: Ready for app-side local bridge contract.

Blockers: Full extension integration, account sync, privacy-reviewed event
pipeline.

## Multilingual Alias Save Source

Purpose: Confirm alias search saves canonical words without fake cards.

Steps:

1. Use a known alias search path or open
   `/save?slug=obfuscate&source=alias_search`.
2. Confirm saved source is `alias_search`.
3. Search for an unknown alias and confirm no fake save action appears.

Expected local/private beta behavior:

- Known aliases resolve to canonical English slugs.
- Unknown aliases do not create fake cards or save actions.
- Existing progress is preserved on duplicate saves.

Expected production v1 behavior:

- Alias resolution is server/content backed.
- Source metadata is preserved in account state.
- Multilingual content claims are not made until content is production ready.

Current readiness: Ready for local/private beta alias contract.

Blockers: Production alias/content system, account sync, multilingual content
approval.

## Future Account Sign-In And Sync

Purpose: Confirm future account launch preserves local learning state.

Steps:

1. Save and review words as a guest.
2. Sign up or sign in.
3. Migrate local state into the account.
4. Open the account from another browser/device.
5. Continue review.

Expected local/private beta behavior:

- Not implemented. UI must not claim this is live.

Expected production v1 behavior:

- Account identity owns saved words, review state, review events, stats, pack
  progress, and entitlements.
- Migration is idempotent and supportable.
- Cross-device state is consistent.

Current readiness: Planned only.

Blockers: Auth, account data model, migration, server SRS sync, cross-device
QA.

## Future Billing Entitlement

Purpose: Confirm future paid access is account-bound and revocable.

Steps:

1. Sign in.
2. Start approved checkout.
3. Complete payment in a test environment.
4. Confirm server entitlement unlocks the correct surfaces.
5. Test cancellation/refund/expired states.

Expected local/private beta behavior:

- Not implemented. No real checkout or billing should appear.

Expected production v1 behavior:

- Provider events update internal entitlement snapshots.
- Entitlements are enforced server-side.
- Refund, cancellation, failed-payment, expired, and revoked states downgrade
  access without deleting learning history.

Current readiness: Planned only.

Blockers: Billing provider, webhooks, entitlement model, support/refund/legal
copy, test payment QA.

## Future Production Deployment Smoke

Purpose: Confirm the app works safely on the intended production domain.

Steps:

1. Deploy to an approved staging environment.
2. Run production smoke plan against staging.
3. Promote only after owner sign-off.
4. Run smoke plan against `app.visuallexicon.org`.
5. Confirm rollback and stop-sales paths.

Expected local/private beta behavior:

- Local validation can pass, but no deployment is performed by this docs PR.

Expected production v1 behavior:

- Domain, DNS, TLS, environment variables, monitoring, rollback, and smoke
  tests are verified.
- Track A remains unaffected.
- No production data, secrets, Webflow, Cloudflare Workers, or DNS changes
  occur without explicit approval.

Current readiness: Planned only.

Blockers: Staging/production deployment readiness, domain verification,
monitoring, rollback rehearsal, owner sign-off.
