# Track B Monetization Readiness Audit

Session: 0 read-only monetization readiness audit
Date: 2026-06-23
Repository branch: `release/track-b-monetization-audit-v1`

## Scope And Safety

This audit reconciles the current Track B app with the canonical monetization
sources:

- `docs/monetization/v1/VLX_Track_B_Monetization_Master_Spec_v1.0.md`
- `docs/monetization/v1/vlx-plan-entitlements.v1.json`
- `docs/monetization/v1/plan-catalog.v1.ts`
- `docs/monetization/v1/VLX_Codex_Track_B_Master_Prompt_v1.0.md`
- `AGENTS.md`

No runtime code was intentionally changed for this Session 0 audit. The audit did
not call Supabase, Webflow, Cloudflare Workers, R2, Vercel settings, DNS, payment
providers, or production services. Environment values were not read or printed.

## Executive Verdict

Public paid beta is No-Go.

The local Save -> Review -> SRS loop is real and should be preserved. DashboardV2
is the canonical dashboard entry, `/` redirects to `/dashboard`, and saved words,
review state, review events, daily stats, pack progress, and Weekly Reviewed
Words are runtime-backed locally. However, the app has no verified real auth
principal, no account-owned persistence, no server-authoritative entitlement
resolver, no usage ledger, no billing provider runtime, no payment runtime, no
asset access gateway, no download quota enforcement, and no RLS-backed account
ownership.

Because the preflight found no real auth principal, a small Auth Principal
Foundation PR and a Minimal Auth Session Flow PR are required before
`feat/entitlement-domain-v1`.

## Launch Recommendations

| Launch mode | Recommendation | Reason |
| --- | --- | --- |
| Private unpaid dogfood | Conditional Go | Safe for owner-controlled, no-payment, no-public-claims testing of the local learning loop. Must keep caveats that storage is local-only and plan controls are not authorization. |
| Private paid beta | No-Go | Paid access cannot be verified without a real auth principal, account persistence, server entitlements, server usage records, support/refund handling, and asset access controls. |
| Public paid beta | No-Go | Canonical entitlement, asset, account sync, billing, monitoring, privacy, accessibility, support, refund, and rollback gates are not all runtime-backed. |

## Current Runtime Truth

### Already Implemented And Runtime-Backed

| Area | Runtime truth | Key files |
| --- | --- | --- |
| Dashboard entry | `/` redirects to `/dashboard`; DashboardV2 is the canonical dashboard view. | `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/components/dashboard/DashboardV2View.tsx` |
| Save to review state | Saving a word writes saved word data and creates or preserves review state. | `src/components/save/SaveLandingView.tsx`, `src/lib/srs/storage.ts`, `src/lib/srs/types.ts` |
| Local SRS | Review answers create events, update review state, update daily stats, and apply the 5-box SRS rules locally. | `src/lib/srs/engine.ts`, `src/lib/srs/storage.ts`, `src/components/review/ReviewSessionView.tsx` |
| Due, Weak, Mastered | Derived from local review state and events, not hard-coded dashboard counters. | `src/lib/srs/selectors.ts`, `src/components/saved/SavedLibraryView.tsx`, `src/components/dashboard/DashboardV2View.tsx` |
| Weekly Reviewed Words | Derived from local review events. | `src/lib/srs/selectors.ts`, `src/lib/analytics/retention.ts` |
| Pack preview/progress | Pack previews and local pack progress are runtime-backed in local storage. | `src/lib/packs/preview.ts`, `src/lib/packs/progress.ts`, `src/components/packs/PacksV2View.tsx` |
| Upgrade interest | Upgrade interest is captured locally only. | `src/lib/upgrade/upgrade-interest.ts`, `src/components/paywall/PaywallPrompt.tsx` |
| Client analytics | Sanitized client events are pushed to `window.dataLayer` when available. | `src/lib/analytics/events.ts` |

### Implemented But Client/Local-Only

| Area | Current source of truth | Canonical issue |
| --- | --- | --- |
| Saved words | `vlx_saved_words_v1` in browser localStorage | Canonical Free and paid plans require account sync, not browser-only state. |
| Review state | `vlx_review_state_v1` in localStorage | Must migrate to account-owned persistence before paid beta. |
| Review events | `vlx_review_events_v1` in localStorage | Weekly Reviewed Words cannot be paid-beta source of truth until server-backed. |
| Daily stats | `vlx_daily_stats_v1` in localStorage | Daily review limits and usage quotas must be server-authoritative. |
| Pack progress | `vlx_pack_progress_v1` in localStorage | Pack ownership/progress must be account-owned for paid access. |
| Plan state | `vlx_plan_state_v1` in localStorage | Canonical JSON says `client_plan_state_trusted:false`; this key must never authorize access. |
| Upgrade interest | `vlx_upgrade_interest_v1` in localStorage | Interest signal only; not a purchase, grant, or entitlement. |
| Paywall suppression | Local plan value suppresses some paywall prompts | Fake-access risk if mistaken for authorization. |

### Mock, Design, Or Test-Only

| Area | Current status | Key files |
| --- | --- | --- |
| Account persistence | Planning/contracts only; no provider-backed account runtime. | `src/lib/account-persistence/README.md`, `src/lib/account-persistence/types.ts` |
| Server SRS sync | Planning/contracts only; no live server route. | `src/lib/server-srs-sync/README.md`, `tests/server-srs-sync-contract.spec.ts` |
| Account sync routes | Design/readiness docs and tests only; no `route.ts` implementation. | `docs/ACCOUNT_SYNC_API_ROUTE_DESIGN.md`, `docs/ACCOUNT_SYNC_ROUTE_READINESS_AUDIT.md` |
| Billing entitlements | Planning contracts only; no provider, checkout, webhook, or server resolver. | `src/lib/billing-entitlements/README.md`, `src/lib/billing-entitlements/types.ts` |
| Manual payment entitlements | Private-beta policy/tests only; no production grant runtime. | `src/lib/manual-payment-entitlement/README.md`, `tests/manual-payment-entitlement-policy.spec.ts` |
| Supabase readiness | Decision docs only; no dependency or middleware runtime verified. | `docs/AUTH_PROVIDER_DECISION_RECORD.md`, `docs/AUTH_IMPLEMENTATION_PLAN.md` |

### Absent

- Real auth/session runtime.
- Server principal resolver.
- Account-owned learning persistence.
- Server SRS sync route handlers.
- Middleware for authenticated session refresh or ownership checks.
- Database schemas, migrations, and RLS policies.
- Server-authoritative entitlement resolver.
- Usage ledger for review/download/AI quotas.
- Billing customer, subscription, invoice, refund, chargeback, or webhook runtime.
- Payment provider SDK/runtime.
- Clean asset access gateway.
- Signed URL issuance.
- Watermarked-versus-clean asset variant enforcement.
- Download UI/API/quota enforcement.
- Ad policy runtime.
- Server analytics/monitoring for paid-beta Weekly Reviewed Words.

## Route Map

| Route | Current implementation | Source-of-truth status | Future PR files likely touched | Migration risk | Rollback boundary |
| --- | --- | --- | --- | --- | --- |
| `/` | Redirects to `/dashboard`. | Runtime-backed route. | `src/app/page.tsx` if route policy changes. | Low; preserve redirect. | Revert redirect change only. |
| `/dashboard` | DashboardV2 local memory mission. | Local storage source of truth. | `src/components/dashboard/DashboardV2View.tsx`, future account summary API/client. | Medium; avoid replacing local SRS before sync path exists. | Fall back to local selectors. |
| `/saved` | SavedV2 library grouped by Due/Weak/New/Mastered. | Local storage source of truth. | `src/components/saved/SavedLibraryView.tsx`, future sync client. | High; saved words must preserve review state. | Keep local storage read path as fallback. |
| `/review` | ReviewSessionView with query-mode routing. | Local storage and static pack source of truth. | `src/components/review/ReviewSessionView.tsx`, future review session API. | High; answer event idempotency must survive migration. | Preserve local `applyReviewAnswer`. |
| `/review/due` | Due review session. | Local due selector. | Same as `/review`. | High; due must remain state-derived. | Preserve local due selector fallback. |
| `/review/weak` | Weak review session. | Local weak selector. | Same as `/review`. | High; weakScore migration must be lossless. | Preserve local weak selector fallback. |
| `/review/weak-sprint` | Weak sprint review route exists. | Local-only route; canonical Pro feature. | `src/app/review/weak-sprint/page.tsx`, `src/components/review/ReviewSessionView.tsx`, entitlement checks. | High; route is outside approved initial route list and must become server-entitled or gated. | Disable route/link without touching base review. |
| `/save` | Save landing flow from extension/deep link. | Local save and review state source of truth. | `src/components/save/SaveLandingView.tsx`, future account sync. | High; save must continue creating review state. | Preserve local save path. |
| `/packs` | PacksV2 catalog and local progress. | Static/mock pack source and local progress. | `src/components/packs/PacksV2View.tsx`, `src/lib/packs/*`, future pack entitlement API. | High; paid pack access must not rely on client state. | Revert to public preview catalog. |
| `/packs/[packId]` | Pack detail/preview/review entry. | Static/mock pack source and local progress. | `src/app/packs/[packId]/page.tsx`, `src/lib/packs/*`. | High; preview counts conflict with canonical JSON. | Keep mock preview only. |
| `/word/[slug]` | Static mock word detail and local memory state panel. | Mock word data plus local review state. | `src/app/word/[slug]/page.tsx`, future word data reader. | Medium; avoid exposing clean image URLs. | Keep static mock fallback. |
| `/pricing` | Early access placeholder; no real pricing. | Client copy only. | `src/app/pricing/page.tsx`, future canonical pricing component. | High; copy conflicts with canonical JSON. | Revert to no-checkout waitlist page. |
| `/settings` | Local plan and paywall trigger diagnostics. | Local-only diagnostics. | `src/app/settings/page.tsx`, `src/components/settings/*`. | High; local plan state must not appear as account entitlement. | Remove diagnostics from public beta builds. |

## Storage Key Map

| Key | Storage | Current writer/reader | Source-of-truth status | Migration requirement |
| --- | --- | --- | --- | --- |
| `vlx_saved_words_v1` | localStorage | `src/lib/srs/storage.ts`, `SaveLandingView` | Runtime-backed local source | Migrate to account-owned saved words without losing review linkage. |
| `vlx_review_state_v1` | localStorage | `src/lib/srs/storage.ts`, review/dashboard/saved views | Runtime-backed local source | Migrate to server/account review state. |
| `vlx_review_events_v1` | localStorage | `src/lib/srs/storage.ts` | Runtime-backed local source | Migrate or sync events with idempotency and audit trail. |
| `vlx_daily_stats_v1` | localStorage | `src/lib/srs/storage.ts` | Runtime-backed local source | Replace quota decisions with server usage ledger. |
| `vlx_pack_progress_v1` | localStorage | `src/lib/packs/progress.ts` | Runtime-backed local source | Migrate to account pack progress. |
| `vlx_plan_state_v1` | localStorage | `src/lib/entitlements/local-entitlements.ts` | Client-only mock/diagnostic | Must not be migrated as proof of paid access. |
| `vlx_upgrade_interest_v1` | localStorage | `src/lib/upgrade/upgrade-interest.ts` | Client-only interest signal | May be migrated only as marketing/intent metadata, not entitlement. |
| `vlx_pending_home_quiz` | localStorage transition key | Docs/tests reference; no active runtime writer found | Optional transition key | Preserve contract if reintroduced; do not create competing SRS keys. |

No runtime `sessionStorage` source of truth was found. Test code clears/probes
session storage, but the app's learning state is localStorage-backed.

## Canonical-Spec Conflicts

| Conflict | Current repo | Canonical requirement | Severity |
| --- | --- | --- | --- |
| Client plan as access signal | `vlx_plan_state_v1` can suppress Lite/Pro paywall prompts. | Server-authoritative entitlements; `client_plan_state_trusted:false`. | P0 |
| No auth principal | No verified real auth/session/provider runtime. | Paid entitlement resolution requires account principal. | P0 |
| No account sync | Free/Lite/Pro learning data remains local-only. | Free and paid plans use `account_sync`. | P0 |
| Pricing copy | `/pricing` says beta pricing TBD and Free saves 30 words. | JSON has exact KRW/USD prices and Free saved limit 50. | P0 |
| Guest saved limit | Local guest definition uses saved limit 5. | JSON guest saved limit is 10. | P1 |
| Pack preview counts | Academic pack preview count is 3 in mock data. | JSON guest exam preview 5; Free/Lite 10; Pro all while active. | P1 |
| Weak sprint access | `/review/weak-sprint` exists as local route. | Weak sprint is Pro capability. | P1 |
| Assets | App renders direct image URLs from public/static/mock pack data. | Public views must use watermarked derivatives and not expose clean URLs. | P0 |
| Downloads | No runtime download UI/API/quota. | Lite/Pro include monthly download quotas and max sizes/formats. | P0 for paid beta feature claims |
| Ads | No ad policy/runtime found. | Guest/Free have limited ads; Lite/Pro no ads; no review ads. | P1 |
| Billing plan IDs | Existing planning type uses `teacher_school_future`. | Canonical account state is `educator`. | P2 until used in runtime |

## Supabase Readiness

| Check | Result |
| --- | --- |
| Dependency status | No `@supabase/supabase-js`, `@supabase/ssr`, or Supabase auth helper dependency is installed. |
| Environment names | No Supabase environment variable names were found in committed runtime code. Local environment values were not inspected. |
| Next.js compatibility | App uses Next.js 14 App Router. No middleware currently exists to validate Supabase session refresh behavior. |
| Server principal | Absent. Future server routes must resolve account identity from the server session, not localStorage or client-submitted user IDs. |
| RLS/schema/migrations | Absent. No DB ownership boundary exists in this repo. |
| Secret handling | No secret values were read or printed during this audit. Future service-role/server credentials must never be exposed to browser code. |

## P0 Findings

1. No real auth principal/session runtime exists, so paid account ownership cannot
   be established.
2. No server-authoritative entitlement resolver exists, and canonical JSON says
   client plan state is not trusted.
3. `vlx_plan_state_v1` is client-controlled and currently suppresses some
   paywall prompts, making it unsafe if mistaken for authorization.
4. Account persistence and review events are browser-local, so Free/Paid
   account sync and Weekly Reviewed Words are not paid-beta source of truth.
5. Pricing UI conflicts with canonical prices, limits, and public plan names.
6. Asset access does not enforce watermarked public derivatives, clean/private
   variants, signed URLs, rights metadata, or download quotas.
7. Billing, checkout, subscription lifecycle, refunds, chargebacks, and provider
   webhooks are absent.
8. Supabase dependency, middleware, RLS, migrations, and server principal
   requirements are not implemented.

## P1 Findings

1. Guest, Free, pack preview, and feature limit assumptions diverge from the
   canonical JSON.
2. Weak sprint exists as a route before a Pro-only server entitlement gate.
3. Ads are not represented in runtime policy despite canonical Guest/Free ad
   behavior.
4. Plan-aware loading, error, empty, privacy, and upgrade states are incomplete
   because account and entitlement state are absent.
5. Pack access is static/mock and cannot enforce one-time purchases or active
   subscription access.

## P2 Findings

1. Billing planning types should rename or map `teacher_school_future` to the
   canonical `educator` state before any runtime use.
2. Existing local diagnostic surfaces in `/settings` should be hidden or clearly
   marked before public beta.
3. Existing analytics events are useful locally but need server/account
   attribution for revenue and retention reporting.

## Must Be Migrated

- Local saved words, review state, review events, daily stats, and pack progress
  to account-owned storage.
- Client plan diagnostics to server-authoritative entitlement snapshots.
- Static/mock pack preview access to canonical plan and purchase rules.
- Direct image rendering to asset records with watermarked/clean variants,
  rights metadata, and signed clean delivery.
- Client-only Weekly Reviewed Words to server/account reporting.

## Should Be Preserved

- The Save -> Review -> SRS loop and the required local storage keys.
- Idempotent review event handling and rollback behavior in local storage.
- Due, Weak, and Mastered being derived from real review state.
- DashboardV2 as the canonical `/dashboard` entry.
- Short, active-recall review sessions.
- Existing release gates for accessibility, performance, review reliability,
  analytics retention, and Figma parity.

## Exact Next Three PRs

1. `feat/auth-principal-foundation-v1`
   - Define the minimal Track B auth principal contract, account identifier,
     server-only principal resolver interface, session states, ownership rules,
     and tests proving localStorage/client-submitted IDs cannot establish
     identity.
   - No billing, checkout, or payment provider code.

2. `feat/minimal-auth-session-flow-v1`
   - Add the selected auth provider runtime for sign-in, sign-out, session
     refresh, and server session reads in the Next.js 14 App Router.
   - If Supabase remains the selected provider, add only the approved Supabase
     dependencies, middleware, server client helpers, and tests needed for a
     minimal private-beta session.
   - No entitlement grants, account sync, or billing yet.

3. `feat/entitlement-domain-v1`
   - Implement a server-authoritative entitlement resolver using the canonical
     JSON, with `guest`, `free`, `lite`, `pro`, and `educator` account states.
   - Treat `vlx_plan_state_v1` as diagnostic/mock only.
   - Expose read-only entitlement status for UI gating, without checkout or
     billing provider runtime.

After those, the next likely PRs are `feat/account-learning-state-sync-v1`,
`feat/usage-ledger-v1`, and `feat/asset-access-gateway-v1`.

