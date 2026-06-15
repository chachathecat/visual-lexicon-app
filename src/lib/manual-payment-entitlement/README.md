# Manual Payment / Entitlement Policy Contracts

This folder defines docs-only and test-only contracts for owner-controlled manual
private-beta payment access in Visual Lexicon Track B.

Scope:

- Define private beta payment policy as manual only.
- Define allowed manual payment evidence types.
- Define manual entitlement record requirements for owner review.
- Define blocked payment integrations and blocked automatic entitlement behavior.
- Define refund/cancellation/dispute handling for manual access records.
- Define support contact requirement and support evidence expectations.
- Define access revocation, privacy boundary, and audit trail requirements.

This module does not add:

- Real checkout
- Recurring billing
- Provider SDKs
- Automatic entitlement logic
- Auth/database/network routes
- API routes or middleware
- Production user-data mutation

Final verdict:

- Private paid beta: `conditional_manual_only`
- Public paid beta: `no_go`
- Real checkout: blocked
- Automatic entitlement: blocked
- Payment provider SDK: blocked

## Files

- `manual-payment-entitlement.ts` contains all policy types, deterministic contract
  values, required helper exports, and typed helper functions:
  - `getManualPaymentEntitlementPolicy()`
  - `getPrivateBetaPaymentPolicy()`
  - `getManualEntitlementRequirements()`
  - `getBlockedPaymentIntegrations()`
  - `getRefundCancellationPolicy()`
  - `getOwnerApprovalChecklist()`
  - `getNextManualPaymentPRSequence()`
- `fixtures.ts` defines deterministic fixture records and test constants.
- `MANUAL_PAYMENT_ENTITLEMENT_POLICY.md` in `docs/` is the policy rationale
  artifact.

Safety reminders:

- Records store no payment secrets or provider tokens.
- Upgrade interest remains non-authoritative and cannot imply paid access.
- Manual grants are owner-approved and auditable.
- No production user data mutation is defined in this PR.
