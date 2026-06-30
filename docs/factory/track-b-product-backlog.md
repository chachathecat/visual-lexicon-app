# Track B Product Backlog Seed

`docs/factory/track-b-product-backlog.v1.json` is the deterministic Track B
product backlog seed for the factory next-task router.

This is a factory/backlog contract, not runtime UI implementation. It records
the next safe Track B task order after PR #137 and PR #138:

Status reconciliation for already merged Track B work lives in
`docs/factory/track-b-product-backlog-status.v1.json` and
`docs/factory/track-b-product-backlog-status.md`. Routers should apply that
overlay before selection so merged tasks such as `TB-020` App Shell v2,
`TB-030` Dashboard v2, and the rest of the already shipped Track B sequence are
not selected again from this seed.

1. `TB-010` Track B Product/UI Readiness Audit - verified.
2. `TB-020` Track B Design Tokens / App Shell v2 - first product
   implementation task after this seed.
3. `TB-030` Dashboard v2.
4. `TB-040` Review Session v2.
5. `TB-050` Saved Library v2.
6. `TB-060` Packs v2.
7. `TB-070` Pricing / Paywall v2.
8. `TB-080` Manual QA Execution Report.
9. `TB-090` Disabled Account Sync Route Skeleton.
10. `TB-100` Account Sync Preview / Digest Mock.
11. `TB-110` Private Beta Gate.

## Router Contract

The seed sorts tasks by `next_recommended_task_order`, then `id`. The same
input must produce the same backlog order.

Factory routers can map task fields as follows:

| Seed field | Router candidate field |
| --- | --- |
| `id` | `id` |
| `title` | `title` |
| `status` | `status` |
| `lane` | `phase` |
| `risk` | `risk` |
| `task_surface` | `taskSurface` |
| `expected_files` | `expectedChangedFiles` |
| `validation_commands` | `validation` |
| `owner_decision_required` | `requiresOwnerApproval` |
| `next_recommended_task_order` | `priority` |

The seed is dry-run planning data. It does not create branches, PRs, issues,
comments, labels, merges, status checks, or GitHub API calls from
implementation code. Auto-merge remains disabled.

## Safety Boundaries

This backlog seed does not implement Dashboard v2, Review v2, Saved Library v2,
Packs v2, Pricing/Paywall v2, runtime UI changes, account sync, payments, or
billing.

Payment, billing, checkout, subscriptions, invoices, DNS, deployment settings,
secrets, Webflow production, Cloudflare production Workers, R2 production
objects, account schema, RLS, migrations, production account data, production
user data, production pack data, production data, live GitHub mutations,
auto-merge, and roadmap status changes remain blocked surfaces.

PR #121 remains represented only as stale/open/not-mergeable risk. It must not
be auto-selected or auto-merged.

Public paid beta remains blocked until account persistence,
server-authoritative entitlements, payment/provider policy, support, privacy,
refund/cancellation, monitoring, rollback, accessibility, production analytics,
content, and owner launch sign-off gates pass.

Private/manual beta remains blocked until current manual QA evidence and owner
approval are recorded, and participants receive browser-local learning state,
support, privacy, refund/cancellation, and local-storage disclosures.
