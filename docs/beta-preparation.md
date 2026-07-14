# Private No-Payment Pilot Preparation for Visual Lexicon

This runbook records the remaining owner-controlled work required before a small private, no-payment pilot of the Visual Lexicon learning app. It does **not** authorize a public paid beta, payment collection, entitlement grants, or a production launch announcement.

## 1. Current scope and launch boundary

The only launch state covered by this document is:

- owner-controlled;
- private/manual;
- no payment;
- local-browser learning state disclosed to participants;
- reversible without changing auth, billing, payment, production data, or public paid-beta gates.

Public paid beta remains **No-Go** until the repository's production blockers are separately completed and accepted, including account-owned persistence, server-side SRS sync, entitlement enforcement, billing/payment lifecycle, support/privacy/refund operations, production monitoring and rollback, accessibility/manual QA, trusted analytics, and final owner sign-off.

## 2. SRS loop verification

| Check | Current evidence | Pilot requirement |
| --- | --- | --- |
| Local storage contract | `src/lib/srs/types.ts` defines `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1`, and `vlx_daily_stats_v1`. Existing automated route and regression suites exercise the local Save -> Review loop. | Run one final browser smoke test on the target preview/domain and retain timestamped evidence. |
| Save behavior | `/save?slug=dissonance&source=word_page` is expected to create or preserve the saved-word and review-state entries without creating fake review events or daily stats on page load. | Clear local storage, save `dissonance`, and verify the two state keys contain the slug. |
| Review behavior | Review answers are expected to append review events and update review state and daily stats. | Complete at least one correct and one wrong-answer path, then verify Due/Weak/Mastered remain evidence-derived. |
| Persistence limitation | Current learning state is browser-local unless a separately approved account-persistence implementation exists. | Disclose this limitation to every pilot participant; do not represent the pilot as cross-device or durable account sync. |

## 3. Custom domain owner action

`app.visuallexicon.org` and its DNS status must be verified in the current Vercel and Cloudflare dashboards by the owner. A previously recorded Vercel candidate target was:

| Record type | Name | Candidate value | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `app` | `610f9ad7bff00c30.vercel-dns-o17.com.` | Disabled |

Do **not** apply this value solely because it appears in this repository. Confirm that Vercel still displays the same current target immediately before changing DNS.

Required owner evidence:

- Vercel project and environment name;
- current domain configuration status;
- current Vercel-provided DNS target;
- Cloudflare record before/after screenshot;
- TLS/domain verification result;
- rollback record or previous value;
- QA timestamp and reviewer identity.

DNS, deployment settings, and production-domain changes remain owner actions and are not performed by this PR.

## 4. Webflow CTA pilot

When changing an existing Webflow Save or Review CTA, replace only the host when necessary and **preserve the route path and query parameters**. Pointing a word CTA to the bare `https://app.visuallexicon.org` host loses the selected word context.

Approved route templates:

```txt
https://app.visuallexicon.org/save?slug={slug}&source=word_page
https://app.visuallexicon.org/review?mode=word&slug={slug}&source=word_page
https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&source=hub_page
https://app.visuallexicon.org/packs/{packId}?source=hub_page
```

Initial pilot scope should stay limited to:

- word page: `dissonance`;
- hub page: `academic-vocabulary`;
- existing supported pack IDs only.

Owner workflow:

1. Record each CTA's current href and capture a before screenshot.
2. Apply the exact route-specific href in Webflow preview only.
3. Verify the slug or hub ID matches the Track B app data.
4. Click through Save, focused Review, hub Review, and pack routes.
5. Capture the preview URL, after screenshot, timestamp, and reviewer identity.
6. Record the rollback href before any owner publish decision.
7. Publish only if the owner separately chooses to run the private no-payment pilot.

A broad CMS-wide CTA update is out of scope until the pilot evidence passes.

## 5. Readiness checklist

- [x] App-side local Save -> Review route contract exists.
- [x] Route-specific Webflow CTA templates are documented.
- [x] Public paid beta remains explicitly No-Go.
- [ ] Owner confirms the current Vercel DNS target.
- [ ] Owner applies and verifies the Cloudflare DNS record.
- [ ] Vercel reports valid domain/TLS configuration.
- [ ] Owner records before/after Webflow CTA evidence.
- [ ] App-side browser smoke QA passes on the target domain.
- [ ] Local-browser-only persistence is disclosed to pilot participants.
- [ ] Support, privacy, pause/rollback, and participant invitation wording are approved.
- [ ] Owner records an explicit private no-payment pilot Go/No-Go decision.

## 6. Go/No-Go language

Passing this checklist may support only the following statement:

> Visual Lexicon is ready for an owner-controlled private, no-payment pilot with browser-local learning state and documented rollback.

It must not be used to claim:

- public paid beta availability;
- durable account or cross-device sync;
- active billing, payment, subscription, or paid entitlement;
- production analytics or monitoring readiness;
- a broad public Webflow CTA rollout;
- a public launch announcement.

## 7. Next implementation priority

After the private pilot runbook is accurate, the next product-critical vertical slice is account-owned learning persistence: authenticated ownership, safe local-to-account migration, server-backed saved/review evidence, cross-browser hydration, idempotency, and rollback. That work requires a separate, explicitly approved implementation PR and must not be inferred from this documentation change.
