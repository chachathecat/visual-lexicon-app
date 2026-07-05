# Track B Private Beta Gate

## 1. Executive Summary

Track B is allowed to move from #165 QA execution to Private Beta Gate review.

- P0 = 0 is required.
- Public paid beta remains No-Go.
- Private/manual paid beta is not launched by this document.
- Owner approval is required before any private/manual paid beta action.

This document defines the review gate only. It does not add checkout, billing,
payment, payment SDK, real paid entitlement, public launch copy, or public paid
beta unblock.

## 2. Evidence Source

The evidence source is #165, the paid beta manual QA execution report.

- #165 merge commit:
  `79b2c50214a69c530a875556667b06c1c8f629e0`
- Expected source file:
  `docs/PAID_BETA_MANUAL_QA_EXECUTION_REPORT.md`

#165 concluded that the local QA scope had zero P0 findings and should move
only to Private Beta Gate. It did not add checkout, payment, billing, payment
SDK, real entitlement, or public paid beta unblock.

## 3. Gate Decision

- Private/manual paid beta: Gate review required
- Public paid beta: No-Go

This document does not say beta is launched. It does not say checkout enabled,
real payment enabled, production entitlement enabled, or public paid beta
enabled. The app remains no checkout, no payment SDK, and no real payment.

## 4. Required Conditions for Private/Manual Beta

- #165 P0 finding count is zero.
- Owner approval is recorded.
- Invite list is manually controlled.
- Access is manual-only.
- Payment, if any, is handled outside the app by the owner.
- No in-app checkout.
- No in-app billing portal.
- No payment SDK.
- No fake paid entitlement.
- No public launch copy.
- Support/refund/privacy checklist is reviewed.
- Manual QA evidence is complete.
- Known P1/P2 limitations are documented.
- Analytics readiness is checked.
- Stop conditions are clear.

## 5. P0 Requirements

P0 blockers include anything that breaks:

- Save creates review item.
- Review updates state/events.
- Due/Weak/Mastered remain honest.
- Weak sprint uses real weak evidence.
- Pack preview/progress remains honest.
- Pricing upgrade interest records local beta interest only.
- No checkout/payment/billing route exists.
- Public paid beta remains No-Go.
- Private/manual paid beta remains gated until owner approval.

## 6. P1 Handling Policy

P1 issues do not automatically block private/manual beta if:

- They are disclosed.
- They have an owner-accepted mitigation.
- They do not create fake payment, fake entitlement, fake mastery, or public
  launch confusion.

P1 examples:

- Extension source needs real extension E2E.
- Public beta account sync/server SRS is missing.
- Public beta payment/monitoring/support/privacy gates remain open.
- Owner sign-off still needed.

## 7. P2 Handling Policy

P2 issues can remain backlog.

Examples:

- IELTS/GRE content depth.
- Mobile/accessibility polish.
- Future AI mistake explanation.
- Future export/download improvements.
- Future full multilingual pages.

## 8. Manual Payment / Manual Access Policy Placeholder

The app does not process payment. The app does not grant production paid
entitlement.

Any private beta payment/access process is owner-run and manual. No automated
billing, subscription, invoice, or checkout is included in this PR. This PR
adds no real payment behavior, no checkout route, no billing portal, no payment
SDK, and no fake paid entitlement.

## 9. Support / Refund / Privacy Checklist

- Support email or support channel defined.
- Refund wording defined.
- Privacy copy reviewed.
- Data deletion wording reviewed.
- Known limitations disclosed.
- LocalStorage-only limitations disclosed where relevant.
- No production data mutation.
- No secrets in frontend code.

## 10. Analytics Readiness Checklist

Analytics readiness is for observation only and does not unblock public paid
beta.

- `vlx_save_word_click`
- `vlx_quiz_start`
- `vlx_quiz_answer`
- `vlx_quiz_complete`
- `vlx_review_state_update`
- `vlx_due_review_start`
- `vlx_weak_review_start`
- `vlx_pack_preview_start`
- `vlx_pack_preview_complete`
- `vlx_paywall_view`
- `vlx_upgrade_click`

## 11. Stop Conditions

- Any P0 appears.
- Save stops creating review item.
- Review stops updating state/events.
- Due/Weak/Mastered become fake or misleading.
- Pack progress becomes fake.
- Payment/checkout/billing route appears without owner approval.
- Public paid beta copy appears.
- Private beta is represented as launched without owner approval.
- Support/refund/privacy checklist is incomplete.

## 12. Rollback / Pause Notes

Private/manual beta can be paused by owner decision. Public paid beta remains
blocked.

No production payment rollback is needed because no payment code is added.

## 13. Final Recommendation

If P0 remains zero and owner approves, proceed to private/manual paid beta
candidate review.

If P0 appears, open a targeted P0 hotfix PR first.

Do not proceed to public paid beta.
