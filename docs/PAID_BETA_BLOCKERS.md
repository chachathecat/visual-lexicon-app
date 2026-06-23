# Paid Beta Blockers

This document lists blockers for Track B monetization readiness against the
canonical v1 monetization sources.

## Verdicts

| Mode | Verdict | Conditions |
| --- | --- | --- |
| Private unpaid dogfood | Conditional Go | Owner-controlled, no payment, no public paid claims, local-storage caveats visible to operators. |
| Private paid beta | No-Go | Requires auth principal, minimal auth session, server entitlements, account sync, usage ledger, asset gateway, support/refund flow, and manual/provider grant audit. |
| Public paid beta | No-Go | Requires all private paid beta requirements plus monitoring, privacy, accessibility, support, refund, rollback, billing lifecycle, and asset leakage gates. |

## P0 Blockers

| ID | Blocker | Current evidence | Required resolution |
| --- | --- | --- | --- |
| P0-1 | No real auth principal | No auth dependency/runtime, no middleware, no server principal resolver. | Ship Auth Principal Foundation and Minimal Auth Session Flow before entitlements. |
| P0-2 | No account-owned learning data | Saved words, review state, review events, daily stats, and pack progress are localStorage. | Ship account learning state sync with idempotent migration and rollback. |
| P0-3 | No server entitlement resolver | Entitlements are local diagnostics/planning only. | Implement server-authoritative resolver from canonical JSON. |
| P0-4 | Client plan state can suppress paywalls | `vlx_plan_state_v1` influences Lite/Pro prompt suppression. | Treat as mock/diagnostic only; never authorize from it. |
| P0-5 | Pricing conflicts with canonical JSON | `/pricing` has beta TBD prices and incorrect Free save copy. | Replace pricing display with canonical JSON-derived copy after entitlement domain is ready. |
| P0-6 | No billing runtime | No provider, checkout, customer, subscription, webhook, invoice, refund, or chargeback runtime. | Add provider only after auth, entitlements, account sync, and usage ledger. |
| P0-7 | Asset access unsafe for paid clean assets | Direct image URLs are rendered; no watermarked/clean/private variant resolver. | Build asset access gateway, signed delivery, rights metadata, and download quota enforcement. |
| P0-8 | No Supabase runtime readiness | Supabase packages, middleware, schema, migrations, and RLS are absent. | Add selected provider runtime and server ownership boundary in a scoped PR. |
| P0-9 | No paid-beta monitoring source of truth | Weekly Reviewed Words is local-only. | Add account/server analytics and retention reporting. |
| P0-10 | No support/refund/rollback ops | Billing lifecycle and support handling are absent. | Define and test support, refund, chargeback, and rollback procedures before paid access. |

## P1 Blockers

| ID | Blocker | Current evidence | Required resolution |
| --- | --- | --- | --- |
| P1-1 | Guest/Free limits diverge | Guest local saved limit is 5; pricing says Free saves 30; canonical says guest 10, Free 50. | Align all copy and local preview behavior to canonical JSON. |
| P1-2 | Pack preview rules diverge | Mock academic preview count is 3; canonical exam previews are 5 guest and 10 Free/Lite. | Move preview counts to canonical entitlement policy. |
| P1-3 | Weak sprint route exists before Pro gate | `/review/weak-sprint` is a runtime route. | Gate by server Pro entitlement or remove/hide until ready. |
| P1-4 | Ads policy absent | No runtime ad policy for Guest/Free/Lite/Pro. | Add explicit no-review-ads and plan ad policy before public claims. |
| P1-5 | Plan-aware UI states incomplete | Loading/error/empty/privacy states cannot reflect account/entitlement because those systems are absent. | Add states after auth/entitlement APIs exist. |
| P1-6 | One-time pack ownership absent | Exam packs are static/mock previews. | Add account-owned one-time purchase grants. |

## P2 Blockers

| ID | Blocker | Current evidence | Required resolution |
| --- | --- | --- | --- |
| P2-1 | Educator naming mismatch | Planning type mentions `teacher_school_future`; canonical state is `educator`. | Rename/map before runtime use. |
| P2-2 | Settings diagnostics are not public-beta safe | `/settings` exposes local plan controls. | Hide or restrict diagnostics before public beta. |
| P2-3 | Analytics taxonomy is incomplete for monetization | Existing runtime events are local learning/paywall interest events. | Add canonical checkout, subscription, download, quota, and account events when corresponding runtime exists. |
| P2-4 | Mobile/focus/privacy states need monetization pass | Existing gates cover broad UX, but plan-specific states are absent. | Re-run UX gates after auth and entitlement UI land. |

## Required Next Three PRs

1. `feat/auth-principal-foundation-v1`
   - Create the minimal server principal contract.
   - Define account identity, session states, ownership checks, and tests.
   - Prove browser localStorage and client-submitted IDs are not identity.

2. `feat/minimal-auth-session-flow-v1`
   - Add the selected auth runtime and Next.js 14 compatible session handling.
   - Include sign-in, sign-out, server session read, middleware/session refresh,
     and private-beta tests.
   - Do not add billing, checkout, account sync, or paid grants.

3. `feat/entitlement-domain-v1`
   - Implement server-authoritative entitlement resolution from the canonical
     JSON.
   - Resolve `guest`, `free`, `lite`, `pro`, `educator`, one-time purchases,
     promotions, and audited manual grants as data contracts.
   - Keep `vlx_plan_state_v1` diagnostic only.

## Later PRs Before Paid Beta

- `feat/account-learning-state-sync-v1`
- `feat/usage-ledger-v1`
- `feat/asset-access-gateway-v1`
- `feat/canonical-pricing-ui-v1`
- `feat/billing-provider-adapter-v1`
- `feat/billing-webhooks-v1`
- `feat/support-refund-rollback-v1`
- `feat/server-retention-analytics-v1`

## Migration Risks

- Migrating local SRS data without event idempotency could corrupt mastery and
  Weekly Reviewed Words.
- Treating `vlx_plan_state_v1` as paid proof would create fake access.
- Introducing checkout before account identity would create orphan purchases.
- Introducing clean asset URLs before an asset gateway would leak paid/source
  assets through page source, localStorage, or browser network logs.
- Replacing local review flow too early could break the currently working
  learning loop.

## Rollback Boundaries

| Area | Rollback boundary |
| --- | --- |
| Auth | Disable account-only flows and preserve local dogfood mode. |
| Entitlements | Fall back to Free/no-paid-access UI while preserving learning data. |
| Account sync | Stop sync writes, keep localStorage backup, replay after fix. |
| Billing | Disable checkout and paid grants; preserve learning data. |
| Assets | Disable clean/download routes; serve public watermarked previews only. |
| Analytics | Keep client events while server analytics is repaired; do not block review. |

## Public Paid Beta Exit Criteria

Public paid beta remains blocked until all of the following are true:

- Real auth principal and session runtime are verified.
- Account-owned saved words, review state, review events, daily stats, and pack
  progress are verified.
- Server entitlements are canonical JSON-aligned.
- Local client plan state cannot authorize paid features.
- Pricing UI exactly matches canonical public pricing and limits.
- Asset access prevents clean/source URL leakage.
- Download quotas and rights metadata are enforced.
- Billing lifecycle, refunds, chargebacks, and support operations are tested.
- Weekly Reviewed Words and paid funnel analytics are server/account-backed.
- Accessibility, performance, review reliability, analytics retention, Figma
  parity, privacy, monitoring, and rollback gates pass.

