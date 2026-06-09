# Security And Permissions

Visual Lexicon Track B must harden the learning loop without expanding
production risk.

## Webflow Safety

- Do not publish Webflow changes from this repository.
- Do not delete, import, export, or mass-edit Webflow CMS items.
- Do not call Webflow CMS directly from browser code.
- Do not move app-only state or SRS logic into Webflow embeds.
- Webflow CTA bridge work must wait until the app review flow works and the
  bridge scope is explicitly approved.

## Cloudflare Worker Safety

- Do not edit or deploy production Cloudflare Workers in app hardening PRs.
- Do not change R2 object storage, delete R2 objects, or mutate production pack
  data without explicit approval.
- Static pack readers may consume public JSON contracts only.
- Worker secrets must never be copied into frontend code, docs examples, or
  local storage.

## Billing And Payment Safety

- Do not add real checkout, subscription, invoice, billing portal, payment SDK,
  or Paddle/Stripe configuration unless a task explicitly authorizes payment
  work.
- Pricing CTAs in the beta app are interest capture or configured external beta
  links only.
- The app must not claim that a user has paid unless a future approved billing
  integration exists.
- Do not change DNS, billing settings, payment settings, tax settings, or
  deployment protection settings.

## Secrets And API Token Safety

- Do not ask users for secrets, API keys, passwords, tokens, or billing
  credentials.
- Do not commit secrets to the repository.
- Do not expose API tokens in `NEXT_PUBLIC_*` variables or browser code.
- Do not log secrets in tests, docs, screenshots, or terminal output.
- Use public mock data or public static pack URLs for local MVP work.

## LocalStorage And Privacy Boundaries

Current local MVP storage is browser-local and not an account system.

Approved learning keys:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Additional local beta keys may exist for pack progress, plan preview, and
upgrade interest. They are not production subscriptions or account records.

Do not store:

- Secrets or API tokens.
- Payment credentials.
- Full browsing history.
- Sensitive page contents.
- Production user data exports.

## Extension Privacy Boundaries

Extension save sources should send only the minimum needed word context, such as
canonical slug, source, and optional safe metadata.

Do not store:

- Full page HTML.
- Unrelated page text.
- Browser history.
- Private account content.
- Extension secrets or tokens.

Extension saves must use the same app-side save and review-state contracts as
word page and alias search saves.

## Production Data Safety

- Do not mutate production user data from local development or beta hardening
  PRs.
- Do not run migrations against production without explicit approval.
- Do not delete production data, CMS items, R2 objects, logs, subscriptions, or
  customer records.
- Do not use real user data in tests or eval fixtures.
- Documentation and eval cases should use safe sample words such as
  `dissonance`.
