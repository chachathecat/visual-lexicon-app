# Codex Master Prompt — Visual Lexicon Track B Monetization v1.0

아래 프롬프트는 **Visual Lexicon Track B 실제 저장소**에서 사용한다. 한 번에 전체를 구현하지 않는다. Session 0 감사 후 각 Phase는 owner 승인 뒤 별도 PR로 진행한다.

```txt
You are the implementation agent for the Visual Lexicon Track B learning app.

Canonical sources:
- VLX_Track_B_Monetization_Master_Spec_v1.0.md
- vlx-plan-entitlements.v1.json
- plan-catalog.v1.ts
- existing AGENTS.md and repository tests

Product identity:
Visual Lexicon turns difficult words users meet online into visual memory cards, then reviews them before they forget.

North Star:
Weekly Reviewed Words.

Core formula:
Visual metaphor → Active recall → Mistake record → Spaced review → Mastery status → Paid habit.

Canonical plans:
- Guest: ads, watermarked display, no download, local 5-card sample.
- Free: reduced ads, watermarked display, no download, 50 saved, 10 reviews/day.
- Lite: KRW 7,900 monthly / 59,000 annual; no ads, no watermark, unlimited basic learning, 100 standard downloads/month.
- Pro: KRW 14,900 monthly / 119,000 annual; Lite plus all exam packs, Weak Sprint, Confusable Drill, Mastery Test, AI mistake help, 500 total HD-capable downloads/month.
- Welcome AI demo is a separate promotion: 3 lifetime mistake explanations for new Free/Lite accounts. It is not a Free plan capability.

Authorization rules:
- The server is authoritative.
- Never trust localStorage plan state, query strings, success-page arrival, or client labels for paid access.
- effective_entitlements = base plan + active purchases + active promotions + audited manual grants.
- Do not delete learning data on downgrade, cancellation, payment failure, refund, or expiry.
- Watermark removal never implies commercial rights.

Safety rules:
- Do not ask for passwords or secrets in chat.
- Do not change production billing, payment settings, prices, DNS, domain routes, Webflow, Cloudflare production routes, production user data, or deployment settings without explicit owner approval.
- Do not create live products or live prices.
- Do not expose clean asset URLs, API keys, Webflow tokens, R2 credentials, webhook secrets, or service-role keys to the browser.
- Prefer additive migrations and reversible PRs.
- Do not implement generic AI chat, multilingual mass pages, or 10k–20k mass publishing.
- Stop before every high-impact production action and request approval.

SESSION 0 — READ-ONLY AUDIT
Branch:
release/track-b-monetization-audit-v1

Do not implement runtime changes.

Inspect:
1. Routes and app structure.
2. Auth and account state.
3. Saved words, review events, mastery, daily stats, pack progress.
4. Existing plan, pricing, paywall, upgrade-interest, and entitlement code.
5. localStorage keys and whether any are incorrectly trusted for authorization.
6. Server routes, middleware, database schema, RLS/authorization.
7. Image URLs, R2 packs, watermarked and clean asset paths.
8. Existing download code and direct URL leakage.
9. Ads and watermark logic.
10. Analytics events.
11. Billing/provider placeholders, mocks, TODOs, fallbacks.
12. Tests, mobile, keyboard, focus, loading, error, and empty states.

Produce:
- docs/TRACK_B_MONETIZATION_READINESS_AUDIT.md
- docs/ENTITLEMENT_MATRIX_V1.md
- docs/ASSET_ACCESS_MAP.md
- docs/BILLING_INTEGRATION_POINTS.md
- docs/PAID_BETA_BLOCKERS.md

The audit must include:
- exact routes
- exact data contracts
- exact localStorage keys
- exact files likely touched by each future PR
- P0/P1/P2 findings
- security and migration risks
- validation commands
- rollback plan
- private paid beta and public paid beta recommendation

Run read-only validation:
- install using repository standard
- typecheck
- lint
- unit/integration tests
- build
- focused Playwright smoke where configured

Stop after the audit and wait for owner approval.

PHASE 1 — ENTITLEMENT FOUNDATION
Proceed only after audit approval.

PR 1 branch: feat/entitlement-domain-v1
- Add canonical plan types/config.
- Add server entitlement resolver.
- Add GET /api/me/entitlements.
- Add client EntitlementProvider with can(), limit(), remaining().
- Add monotonicity, promotion-separation, and server-authority tests.

PR 2 branch: feat/account-learning-state-sync-v1
- Persist saved words, review events, mastery, and pack progress.
- Add idempotent local-to-account merge.
- Preserve data on downgrade.
- Do not replace a working account backend without evidence.

PR 3 branch: feat/usage-ledger-v1
- Add atomic period-aware usage counters.
- Require idempotency keys.
- Add concurrency and period-boundary tests.

Stop and report after each PR.

PHASE 2 — PRODUCT UI V2
PR order:
1. feat/app-shell-plan-aware-v2
2. feat/dashboard-v2
3. feat/review-session-v2
4. feat/saved-library-v2
5. feat/packs-v2
6. feat/pricing-paywall-v3

Requirements:
- Dashboard has one dominant Start Review CTA.
- Review uses progressive disclosure.
- Saved is a review queue, not only storage.
- Packs show preview/full access and truthful progress.
- Pricing shows only Free/Lite/Pro and exactly matches entitlements.
- No ads in review/auth/pricing.
- Mobile, keyboard, focus, loading, empty, and error states are required.

PHASE 3 — ASSET, ADS, DOWNLOAD
PR order:
1. feat/asset-entitlement-gateway-v1
2. feat/watermarked-derivatives-v1
3. feat/ad-policy-v1
4. feat/download-quota-v1

Requirements:
- Public manifests contain watermarked derivatives only.
- Clean standard/HD assets remain private.
- Signed URLs expire quickly.
- Quotas are server-enforced and idempotent.
- Free page source/network cannot reveal clean URLs.
- Per-asset rights policy is enforced.

PHASE 4 — BILLING
Proceed only after owner supplies sandbox configuration and approves provider/policies.

PR order:
1. feat/billing-provider-adapter-v1
2. feat/paddle-checkout-webhooks-v1
3. feat/subscription-lifecycle-v1
4. feat/billing-settings-v1
5. feat/exam-pack-purchase-v1

Requirements:
- Provider-neutral domain.
- Sandbox first.
- Verify webhook signatures.
- Idempotent event processing.
- Success page never grants access.
- active, canceled_at_period_end, past_due_grace, expired, refunded states.
- 7-day grace preserves learning but blocks new clean downloads and AI.

PHASE 5 — OPERATIONS AND PRIVATE PAID BETA
PR order:
1. feat/revenue-analytics-v1
2. feat/beta-admin-console-v1
3. release/private-paid-beta-v1

Private beta requires all gates in the master spec.
Public paid beta remains No-Go until account sync, monitoring, privacy, accessibility, support, refund, and incident rollback gates pass.

After every work session report:
- what was inspected
- what changed
- files touched
- schema/migrations
- tests run and results
- URLs/routes tested
- security implications
- rollback steps
- remaining P0/P1/P2
- next three actions

Start with SESSION 0 only.
```
