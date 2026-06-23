# Billing Integration Points

Session 0 status: billing and payment runtime are absent. Existing files are
planning, contracts, tests, or local upgrade-interest capture only.

## Current Runtime Truth

| Area | Status | Evidence |
| --- | --- | --- |
| Checkout | Absent | No checkout route, SDK, or provider client found. |
| Subscription billing | Absent | No billing provider runtime or webhook route found. |
| One-time purchases | Absent | Pack purchases are static/mock only. |
| Customer portal | Absent | No billing portal route or provider integration. |
| Webhooks | Absent | No API route handlers or `route.ts` files found. |
| Entitlement server | Absent | Local entitlement diagnostics only. |
| Usage ledger | Absent | Daily stats are localStorage only. |
| Upgrade interest | Local-only | `src/lib/upgrade/upgrade-interest.ts` writes `vlx_upgrade_interest_v1`. |
| Payment links | Placeholder-capable | `NEXT_PUBLIC_LITE_PAYMENT_URL`, `NEXT_PUBLIC_PRO_PAYMENT_URL`, and `NEXT_PUBLIC_PAID_BETA_FORM_URL` are optional public URL names in code. |

## Existing Planning And Contract Files

| File/doc | Current role | Runtime risk |
| --- | --- | --- |
| `docs/BILLING_ENTITLEMENT_ARCHITECTURE.md` | Architecture plan and safety boundaries. | Low if kept as docs. |
| `docs/BILLING_PROVIDER_DECISION_RECORD.md` | Provider decision record; no provider committed as implemented. | Low if re-audited before implementation. |
| `docs/BILLING_RELEASE_CRITERIA.md` | Payment readiness criteria. | Low; useful gate. |
| `src/lib/billing-entitlements/README.md` | Planning-only contract. | Must not be mistaken for implementation. |
| `src/lib/billing-entitlements/types.ts` | Draft types. | Must reconcile plan IDs/statuses with canonical JSON before runtime use. |
| `src/lib/manual-payment-entitlement/README.md` | Manual private-beta policy. | Needs audited grant runtime before use. |
| `tests/manual-payment-entitlement-policy.spec.ts` | Policy test. | Test-only; no grant implementation. |

## Canonical Integration Sequence

Billing must not precede account identity and server entitlements.

1. Auth principal foundation.
2. Minimal auth session flow.
3. Server-authoritative entitlement domain.
4. Account learning state sync.
5. Usage ledger.
6. Asset access gateway and download enforcement.
7. Billing provider adapter and webhook ingestion.
8. Pricing and checkout UI.
9. Support/refund/rollback operations.

## Required Server Integration Points

| Integration point | Required purpose | Current status |
| --- | --- | --- |
| Auth principal resolver | Bind requests to a server-authenticated account. | Absent. |
| Entitlement resolver | Resolve base plan, one-time purchases, promotions, and manual grants. | Absent. |
| Entitlement snapshot/read API | Let UI render current plan without trusting localStorage. | Absent. |
| Usage ledger | Count daily reviews, downloads, AI credits, and quota warnings. | Absent. |
| Billing customer mapping | Map provider customer IDs to Track B accounts. | Absent. |
| Subscription table | Store plan, status, period, grace, cancellation, renewal. | Absent. |
| Webhook inbox | Idempotently ingest provider events. | Absent. |
| Pack purchase table | Store one-time exam pack grants. | Absent. |
| Manual grant audit log | Record reason, issuer, issued_at, expiry, and revocation. | Absent. |
| Refund/chargeback handler | Revoke paid grants while preserving learning data. | Absent. |
| Support view/export | Allow support to resolve paid access and refund questions. | Absent. |

## Provider Placeholder Handling

The current runtime has optional public URL names for waitlist/payment-link style
targets:

- `NEXT_PUBLIC_LITE_PAYMENT_URL`
- `NEXT_PUBLIC_PRO_PAYMENT_URL`
- `NEXT_PUBLIC_PAID_BETA_FORM_URL`

These names can drive outbound links only. They are not proof of payment and
must not create entitlements. No environment values were read or printed during
this audit.

## Plan And Lifecycle Mapping

| Canonical item | Required billing behavior | Current status |
| --- | --- | --- |
| Lite monthly/annual | Activate `lite` while subscription is active. | Absent. |
| Pro monthly/annual | Activate `pro` while subscription is active. | Absent. |
| Educator annual | Not public; audited sales/admin flow. | Absent. |
| Academic/IELTS/GRE packs | One-time purchase entitlements. | Absent. |
| Welcome AI demo | Once-per-account promotion ledger. | Absent. |
| Past due grace | 7-day grace, no new clean downloads or AI calls. | Absent. |
| Expired | Fall back to Free, preserve learning data. | Absent. |
| Refunded/chargeback | Revoke paid grants, preserve learning data, flag support. | Absent. |

## Files Likely Touched By Future PRs

| PR area | Likely files |
| --- | --- |
| Auth principal | New auth server helpers, middleware, tests, auth docs. |
| Entitlements | New server-only entitlement resolver, canonical JSON adapter, read API, tests. |
| Usage ledger | New server usage/quota module, storage schema, tests. |
| Billing provider | New provider adapter, webhook route, customer/subscription schema, tests. |
| Pricing | `src/app/pricing/page.tsx`, paywall components, plan display components. |
| Pack purchases | `src/lib/packs/*`, pack detail UI, entitlement checks. |
| Downloads | Asset gateway route, download UI, usage ledger. |
| Support/refunds | Admin/support docs, audit logs, refund handlers. |

## Required Safety Rules For Future Billing PRs

- Do not expose provider secrets in frontend code.
- Do not use localStorage, query params, or cookies as paid proof.
- Do not issue entitlements directly from a successful client redirect.
- Do not add checkout before auth principal and account ownership are live.
- Do not mutate learning data during billing state transitions except through
  audited entitlement/usage changes.
- Do not enable public paid beta without refund, support, monitoring, and
  rollback procedures.

## Rollback Boundaries

| Failure mode | Rollback |
| --- | --- |
| Provider checkout failure | Disable checkout links and keep waitlist/no-payment mode. |
| Webhook ingestion failure | Stop granting new paid entitlements; preserve existing learning data; replay idempotent webhook inbox after fix. |
| Entitlement resolver failure | Fall back to Free/no-paid-access display; preserve local SRS and account learning data. |
| Download abuse/leak | Disable clean/download endpoints; keep watermarked preview assets. |
| Refund/chargeback bug | Freeze paid grants, run support review, preserve learning data. |

