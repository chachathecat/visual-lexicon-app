# Paid Beta Rollback Plan

Use this plan if a P0 issue is found before or during the private no-payment
paid beta. This plan assumes Visual Lexicon Track B remains local-browser-state
only and that billing, Webflow, Cloudflare Workers, auth, DNS, production data,
and deployment settings were not touched.

## Rollback Scope

Rollback should be scoped to the smallest surface that introduced the issue:

- Documentation-only issue: revert or amend the documentation PR.
- Runtime issue: revert the last runtime PR that introduced the behavior.
- Local tester data issue: ask testers to clear local browser storage.
- Invite issue: stop sending invites and replace the copy with corrected
  no-payment, local-state language.

Do not broaden rollback into Webflow, Cloudflare, billing, DNS, auth,
production data, secrets, deployment settings, or real payment systems unless
those systems were explicitly touched in an approved change.

## Documentation-Only Rollback

Use this path when the issue is incorrect release wording, invite copy, support
copy, QA instructions, or checklist language.

1. Stop using the incorrect doc or invite copy.
2. Revert the documentation commit or submit a follow-up documentation fix.
3. Confirm the corrected docs still say:
   - Billing is not connected.
   - No real subscription is created.
   - State is local to the browser.
   - Progress may reset during beta.
   - Feedback should focus on Save -> Review -> Due/Weak/Mastered.
4. Re-run documentation review. Runtime validation is not required unless a
   runtime file changed.

## App-Runtime Rollback

Use this path when a runtime PR creates a P0 issue in Save, Review, SRS state,
pack progress, pricing safety, local analytics privacy, or no-payment behavior.

1. Identify the last runtime PR that changed the failing surface.
2. Revert that runtime PR on a new branch or apply a focused fix if safer.
3. Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

4. Re-run the affected manual QA flow in `docs/PAID_BETA_MANUAL_QA.md`.
5. Update the release checklist decision to No-Go until the fix is validated.

Do not revert unrelated documentation, user changes, or safe completed work
unless the rollback owner explicitly approves the broader scope.

## LocalStorage Reset Instructions

Because the paid beta candidate stores learning state locally in the browser,
testers can reset beta data from the browser console.

Use this reset when a tester has corrupted beta state, wants to restart QA, or
needs to confirm clean first-run behavior:

```js
[
  "vlx_saved_words_v1",
  "vlx_review_state_v1",
  "vlx_review_events_v1",
  "vlx_daily_stats_v1",
  "vlx_pack_progress_v1",
  "vlx_plan_state_v1",
  "vlx_upgrade_interest_v1",
  "vlx_pending_home_quiz"
].forEach((key) => localStorage.removeItem(key));

location.reload();
```

Expected result:

- Saved words are cleared in that browser.
- Review state and events are cleared in that browser.
- Local pack progress is cleared in that browser.
- Local pricing/upgrade interest records are cleared in that browser.
- No account, subscription, or server-side data is affected.

## What Not To Touch

Do not touch these systems as part of this rollback unless a future approved
change explicitly modified them:

- Webflow publishing, embeds, or CMS.
- Cloudflare production Workers.
- R2 object deletion or production pack mutation.
- Auth, login, account, or user identity systems.
- Billing, checkout, payment SDK, subscription, invoice, or billing portal.
- DNS or deployment settings.
- Secrets, tokens, API keys, or payment credentials.
- Production user data.
- External analytics SDKs or production analytics pipelines.

## How To Stop A Beta Invite If P0 Is Found

1. Stop sending all invite messages immediately.
2. Mark the release decision as No-Go in
   `docs/PAID_BETA_V0_RELEASE_CHECKLIST.md` or the current release record.
3. Tell internal testers that the beta candidate is paused.
4. If any external early users already received the invite, send a short pause
   note:

```txt
We found an issue in the Visual Lexicon beta candidate and are pausing access
while we fix it. Billing is not connected and no subscription was created. If
you tested the beta, your progress was local to your browser and may be reset.
Please stop testing until we send an updated invite.
```

5. File the P0 with route, reproduction steps, expected result, actual result,
   severity, owner, and target fix.
6. Apply documentation-only rollback or runtime rollback based on the issue
   source.
7. Re-run required validation and manual QA before resuming invites.

## No External-System Rollback By Default

No Webflow, Cloudflare, billing, DNS, auth, production data, or deployment
rollback is needed for this release-candidate documentation PR because those
systems are outside the scope and must remain untouched.

If a future approved change touches one of those systems, create a separate
system-specific rollback plan before rollout.
