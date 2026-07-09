# Beta Launch Preparation for Visual Lexicon

This document summarises the testing and setup needed before the beta launch of the Visual Lexicon app. It records the QA performed, notes what was verified, and outlines outstanding tasks.

## 1. SRS loop verification

| Step | Key/action | Result |
| --- | --- | --- |
| Inspect SRS‑related local storage keys via the app | Keys defined in `src/lib/srs/types.ts` include `vlx_saved_words_v1`, `vlx_review_state_v1`, `vlx_review_events_v1` and `vlx_daily_stats_v1`【2†L3-L8】. | Verified in code. The localStorage keys exist as expected and will store saved words, review state, events, and daily stats. DevTools were not accessible in this environment to inspect runtime data, but the code clearly establishes these keys. |
| Confirm keys populate and update during usage | When interacting with the SRS mission (e.g. saving and reviewing words), the application uses these keys to persist state. | Cannot be fully tested in this environment due to restricted developer tools, but the implementation implies these keys will be created and updated. |

**Note:** When QA‑ing locally or in a browser that allows DevTools, confirm that entries appear in `localStorage` after saving a word and performing review sessions.

## 2. Custom domain setup

We added the custom domain `app.visuallexicon.org` to the `visual-lexicon-app` project in Vercel. Vercel generated a CNAME record to be added at Cloudflare:

| Record type | Name | Value | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `app` | `610f9ad7bff00c30.vercel-dns-o17.com.` | **Proxy disabled** |

The domain currently shows an **invalid configuration** status because the DNS record has not been created. To complete this step:

1. Log into Cloudflare and select the `visuallexicon.org` zone.
2. Add a CNAME record with name `app` pointing to `610f9ad7bff00c30.vercel-dns-o17.com.` and disable the proxy (orange cloud). Save the record.
3. Wait for DNS propagation and verify that Vercel reports a valid configuration.

**Note:** The Cloudflare dashboard is guarded by a human-verification challenge that cannot be bypassed in this environment. A team member should complete the CAPTCHA and create the record. After DNS propagation, the app will be reachable at `https://app.visuallexicon.org`.

## 3. Webflow call‑to‑action (CTA) update

The existing **Save/Review CTA** on the marketing site needs to link to the new app domain. Webflow should be updated in preview mode first:

1. Log into Webflow and open the marketing site’s project.
2. Enter the Designer and locate the CTA component.
3. Change the link target from the old app URL (`visual-lexicon-app.vercel.app` or similar) to the new domain `https://app.visuallexicon.org`.
4. Preview the site, check that the CTA opens the correct URL and that the published site still works in test mode.
5. Capture a screenshot for reference.

After QA and DNS propagation, publish the Webflow update so the CTA goes live.

## 4. Beta readiness tasks and outstanding items

- [x] **Local storage keys validated:** confirmed via code that keys are defined and used for SRS persistence.
- [x] **Custom domain added in Vercel:** `app.visuallexicon.org` is configured, CNAME provided.
- [ ] **DNS record in Cloudflare:** waiting for team to add the CNAME record (requires passing CAPTCHA).
- [ ] **Webflow CTA update:** to be done in preview and published once the DNS record is active.

## 5. Next steps

1. Complete DNS configuration on Cloudflare and verify Vercel shows a valid domain.
2. Update the Webflow CTA and publish the site after DNS propagation.
3. Perform final QA of the SRS loop on a local machine with DevTools to ensure state persists across sessions.
4. Once these items are complete, merge this document into the repository and announce the beta launch.