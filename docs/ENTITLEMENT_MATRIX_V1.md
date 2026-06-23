# Entitlement Matrix V1

Source of truth: `docs/monetization/v1/vlx-plan-entitlements.v1.json`.

This document compares the canonical entitlement model with the current runtime
repo. Numeric prices, limits, plan capabilities, promotions, and lifecycle
values come from the canonical JSON.

## Resolution Rules

Canonical entitlement resolution is:

```txt
base_plan + active_one_time_purchases + active_promotions + audited_manual_grants
```

The canonical JSON marks resolution as `server_authoritative:true` and
`client_plan_state_trusted:false`.

Current repo status:

- No server-authoritative entitlement resolver exists.
- No server account principal exists.
- `vlx_plan_state_v1` is a localStorage diagnostic/mock value and must not be
  used as authorization.
- `vlx_upgrade_interest_v1` records interest only and is not a purchase, grant,
  or subscription.

## Account State Matrix

| Account state | Canonical public plan | Canonical price | Current runtime status | Current conflict/risk |
| --- | --- | --- | --- | --- |
| `guest` | No | $0 / KRW 0 | Default unauthenticated/local state. Local plan definition exists. | Local saved limit is 5, but canonical guest saved limit is 10. No real guest/account distinction beyond local browser state. |
| `free` | Yes | $0 / KRW 0 | Local plan value and pricing placeholder only. | Canonical Free requires account sync; current Free remains local-only. Pricing page says save 30 words, canonical says 50. |
| `lite` | Yes | KRW 7,900 monthly, KRW 59,000 annual; USD 7.99 monthly, USD 59.99 annual | Local plan value can suppress some Lite paywalls. Pricing page says beta pricing TBD. | Local client state can simulate Lite UI access. No server entitlement, downloads, asset policy, account sync, or billing lifecycle. |
| `pro` | Yes | KRW 14,900 monthly, KRW 119,000 annual; USD 14.99 monthly, USD 119.99 annual | Local plan value can suppress Pro prompts; weak sprint route exists. Pricing page says beta pricing TBD. | No server entitlement, advanced review priority, AI usage ledger, clean HD delivery, downloads, or all-pack active access. |
| `educator` | No | KRW 399,000 annual; USD 249 annual | Absent from runtime. Existing planning type mentions `teacher_school_future`. | Must align future planning/runtime naming with canonical `educator`. |

## Capability Matrix

| Capability area | Guest canonical | Free canonical | Lite canonical | Pro canonical | Current repo status |
| --- | --- | --- | --- | --- | --- |
| Saved words | 10 | 50 | Unlimited | Unlimited | Local storage only. Local guest limit is 5; pricing page says Free 30; local Free definition has 50. |
| Storage scope | `local_only` | `account_sync` | `account_sync` | `account_sync` | All current learning state is localStorage. Account sync is design/test-only. |
| Daily review | 5 | 10 | Unlimited | Unlimited | Review sessions are local and typically size 5. Daily quota is not server-enforced. |
| Due queue | Sample | Top 10 | Full | Full advanced priority | Local selectors derive due queue, but not plan-aware server policy. |
| Review history | 0 days | 7 days | 90 days | Unlimited | Local events remain in browser. No retention/account policy is enforced. |
| SRS | Sample | Basic 5-box | Full 5-box | Full 5-box advanced priority | 5-box SRS exists locally. Advanced priority is not server-backed. |
| Weak words | None | Top 3 preview | Full basic | Full advanced | Local weak list exists. Plan-aware server gating absent. |
| Weak sprint | No | No | No | Yes | Route exists at `/review/weak-sprint`, but Pro entitlement is not server-enforced. |
| Mastery test | No | No | No | Yes | Placeholder/paywall logic only; no server entitlement. |
| Question types | Demo image/definition to word | image_to_word, definition_to_word | Adds word_to_image and cloze | Adds confusable_pair, weak_sprint, mastery_test | Runtime review uses local question generation; plan-specific question access is not server-owned. |
| Ads | Public max 2, app native 0 | Public max 1, app native 1, no review ads | No ads | No ads | No ad policy runtime found. |
| Assets | Watermarked public | Watermarked public | Clean standard, no clean URL exposed | Clean HD, no clean URL exposed | Direct public/static/mock URLs are rendered. No watermarked/clean variant enforcement. |
| Downloads | Disabled | Disabled | 100/month, JPG/WebP, max 1600px, batch 1 | 500/month standard and HD, JPG/PNG/PDF, max 3000px, batch 20 | No download runtime found. |
| Packs | Public preview | Starter plus purchased exam packs | All standard hubs plus purchased exam packs | All while active | Static/mock preview data only. No server pack ownership. |
| AI | Static approved feedback only | Static approved feedback only | No monthly credits | 200 mistake explanations, 100 confusion, 50 hooks, 1 daily coach/day | AI tutor/generation is absent by design. Promotion is not runtime-backed. |
| Support | Self service | Self service | Standard | Priority | Support routing is not a runtime feature. |
| License | View only | View only | Personal noncommercial | Personal/internal noncommercial asset policy | No per-asset rights metadata runtime. |

## Additive Products

| Product | Canonical price | Entitlement | Current repo status |
| --- | --- | --- | --- |
| Academic Vocabulary Pack | KRW 39,000 / USD 29 | `pack:academic` | Mock/static preview only. No purchase ownership. |
| IELTS Writing Vocabulary Pack | KRW 59,000 / USD 49 | `pack:ielts-writing` | Placeholder/static preview only. No purchase ownership. |
| GRE Verbal Pack | KRW 79,000 / USD 69 | `pack:gre-verbal` | Placeholder/static preview only. No purchase ownership. |
| Exam Pack Bundle | KRW 149,000 / USD 119 | `pack:academic`, `pack:ielts-writing`, `pack:gre-verbal` | Absent as runtime purchase. |

## Promotion

Canonical promotion:

- `welcome_ai_demo`
- Applies to Free and Lite.
- Grants three lifetime personalized mistake explanation credits.
- Once per account.
- Not visible on pricing table.
- Not a plan capability.

Current repo status:

- No runtime promotion ledger exists.
- No account identity exists to enforce lifetime once.
- No AI credit ledger exists.

## Lifecycle Requirements

| Lifecycle state | Canonical behavior | Current status |
| --- | --- | --- |
| Active | Paid access active. | Absent; no subscription runtime. |
| Canceled at period end | Access until paid-through date. | Absent. |
| Past due grace | 7-day grace; learning/history preserved; new clean downloads and AI calls disabled. | Absent. |
| Expired | Fall back to Free; preserve learning data. | Absent. |
| Refunded/chargeback | Revoke paid grants; preserve learning data; flag support review. | Absent. |
| Manual grant | Requires reason, issuer, issued_at, optional expiry, audit log. | Planning-only policy, no grant runtime. |

## Current Files That Must Not Authorize Paid Access

| File | Current role | Monetization rule |
| --- | --- | --- |
| `src/lib/entitlements/local-entitlements.ts` | Reads/writes local plan diagnostics. | Must stay mock/diagnostic until replaced by server resolver. |
| `src/lib/paywall/triggers.ts` | Evaluates local paywall prompts. | May guide UI, but cannot authorize paid access. |
| `src/components/settings/LocalPlanStatePanel.tsx` | Developer/local diagnostic panel. | Must not ship as proof of paid state. |
| `src/lib/upgrade/upgrade-interest.ts` | Stores upgrade interest. | Interest only, not entitlement. |
| `src/lib/billing-entitlements/types.ts` | Planning types. | Must be reconciled to canonical JSON before runtime use. |

## Likely Future PR Files

| Future area | Likely files |
| --- | --- |
| Auth principal | New server auth helper files, middleware, tests, and auth docs. |
| Server entitlement resolver | New server-only entitlement module, canonical JSON adapter, route handler, tests. |
| Paywall migration | `src/lib/paywall/triggers.ts`, paywall components, pricing UI, settings diagnostics. |
| Pricing alignment | `src/app/pricing/page.tsx`, new pricing constants derived from canonical JSON. |
| Plan UI state | Dashboard, packs, saved, review, word detail, and settings components. |
| Account sync | `src/lib/account-persistence/*`, future route handlers, sync tests. |

## Migration Risks

- Do not migrate `vlx_plan_state_v1` as paid proof.
- Do not treat upgrade interest as consent, payment, or entitlement.
- Do not overwrite local review state until an idempotent account sync and
  rollback path exist.
- Do not expose server entitlement internals or payment provider secrets to
  client code.
- Do not add checkout before account identity and entitlement storage exist.

## Rollback Boundaries

- If entitlement resolver rollout fails, preserve the existing local SRS path and
  hide paid gates.
- If auth session rollout fails, disable account-only surfaces and keep local
  no-payment dogfood available.
- If pricing rollout conflicts with canonical JSON, revert the pricing UI only;
  do not touch SRS storage.

