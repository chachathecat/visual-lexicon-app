# Manual Payment / Entitlement Policy

Policy date: 2026-06-15  
Scope: Visual Lexicon Track B private-paid-beta transition planning.  
Branch: `release/manual-payment-entitlement-policy`  
Verdict source PR: #81

## Executive Summary

Visual Lexicon may accept private beta payment proof manually. In this PR, the app
does **not** create checkout, subscription, recurring billing, or automatic paid
access.

- Private paid beta: **conditional / manual-only**
- Public paid beta: **No-Go**
- Real checkout: **blocked**
- Automatic entitlement: **blocked**
- Payment provider SDK: **blocked**

## Private Beta Payment Mode

### Allowed

- Manual owner approval workflow only.
- Manual proof collection and optional payment-link evidence.
- Offline/manual record checks before access.

### Not Allowed

- Public checkout.
- Any auto-assign of paid access in app logic.
- Recurring billing inside the app.
- Payment provider SDK integration.

### Policy language

`private_beta_payment_mode = manual_only` and `payment_link_only_allowed = true`

## Owner Approval Workflow

Manual access requires owner approval before any beta access claim.

1. Verify participant identity.
2. Verify invite source.
3. Verify allowed evidence reference.
4. Set approved plan (`beta_lite` or `beta_pro`).
5. Record approval timestamp and owner identity.
6. Set review / expiration date.
7. Log a note and support contact path.
8. Emit an audit event.

No app code can automatically grant paid access from these fields.

## Allowed Payment Evidence

Allowed evidence references:

- `manual_payment_link_confirmation`
- `manual_bank_transfer_receipt`
- `manual_invoice_reference`
- `manual_ticket_reference`
- `manual_support_note`

Evidence must be reference IDs or redacted metadata only.

## Manual Entitlement Record Requirements

Each manual entitlement record requires:

- `participantIdentifier`
- `inviteSource`
- `paymentStatus`
- `paymentEvidenceReference`
- `approvedPlanLabel`
- `approvalTimestamp`
- `approvedByOwner`
- `expirationOrReviewDate`
- `refundOrCancelStatus`
- `notes`

The following must not be stored in entitlement records:

- raw card number
- CVV
- provider token / secret
- card expiry
- full payment payload
- bank account number
- webhook signature
- raw card last four is disallowed in this PR

## Entitlement Grant Rules

- Automatic entitlement by app code: **blocked**
- Local `vlx_plan_state_v1` is not proof of paid entitlement.
- Upgrade interest or analytics events cannot grant access.
- Entitlement is valid only when a manual owner record exists and is active.

## Refund / Cancellation / Dispute

- Refunds and cancellations must be recorded.
- Learning data should not be deleted on refund, dispute, or cancellation.
- Access may be revoked immediately or kept to period-end depending on decision.
- Disputes require support escalation and owner review before reactivation.
- Re-activation requires explicit owner action and evidence.

## Support Contact Requirement

- `support@visuallexicon.org`
- Discord or support channel: `https://discord.gg/visuallexicon`
- Payment-related incidents and disputes must be handled through support before
  reactivating paid access.

## Access Revocation

- Immediate revocation is allowed.
- Period-end revocation is allowed where policy permits.
- Participants must be informed before pause where possible.
- Local learning progress remains preserved.

## Beta Pause / Rollback Criteria

Pause or rollback private beta invites when:

- Owner approval missing
- Manual record required fields missing
- Evidence/proof integrity missing
- Support/dispute workflows not satisfied
- Unsupported payment integration appears

Rollback scope in this PR is docs/contracts-only and no external system changes.

## Audit Trail Requirements

Required audit events:

- `manual_entitlement_requested`
- `manual_entitlement_approved`
- `manual_entitlement_revoked`
- `refund_requested`
- `refund_completed`
- `cancellation_requested`
- `dispute_opened`
- `access_paused`

The policy requires immutable audit entries and explicit exclusion of sensitive
payment payloads, provider tokens, and raw card details.

## Privacy Boundary

- No production user data mutation.
- No account sync, auth, or DB writes in this PR.
- No browser secret storage introduced.
- No app-side cross-device paid entitlement claim.
- Progress remains local to the browser for current Track B behavior.

## Forbidden Integrations

- Payment SDKs and checkout infrastructure are forbidden in this PR.
- Runtime entitlement grants are forbidden.
- Billing webhooks are forbidden.
- Production account sync/billing routes are forbidden.

## Next Recommended Manual-Policy PR Sequence

1. #82 Account sync preview/digest mock
2. #83 Monitoring, support, privacy beta gate
3. #84 Private beta readiness rerun
4. #85 Owner-run private beta launch checklist

## Safety Confirmation

This PR stays in docs/contracts/tests scope. It does not add runtime UI,
API routes, middleware, DB writes, auth, provider SDKs, webflow changes,
cloudflare changes, DNS/deployment settings, secrets, production data, or any
automatic paid access logic.
