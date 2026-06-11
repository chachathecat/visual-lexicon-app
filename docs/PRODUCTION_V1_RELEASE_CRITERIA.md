# Production v1 Release Criteria

Criteria date: 2026-06-11

Scope: strict go/no-go criteria for a real paid SaaS launch of Visual Lexicon
Track B. These criteria do not authorize checkout, payment SDKs, billing routes,
subscription behavior, Webflow publishing, Cloudflare production Worker changes,
DNS changes, deployment changes, secrets, production data mutation, AI Tutor
functionality, or multilingual page generation.

## Launch Recommendation

Current recommendation: No-Go for full production paid SaaS launch.

The current product is strong enough to continue as a local learning MVP and
private beta candidate. It is not ready to charge public subscriptions until
account persistence, server-side SRS sync, billing/entitlement, deployment
readiness, analytics/reporting, support/refund/legal systems, production
content readiness, and launch QA are complete.

## Release Type Definitions

| Release type | What it means | Payment posture | Required framing |
| --- | --- | --- | --- |
| Private beta | Limited invited users test the local learning loop. | No real in-app payment. External/manual access only if explicitly approved. | Beta, local storage caveats, no permanent sync promise. |
| Paid open beta | Limited public beta access with explicit caveats and caps. | External/manual or controlled payment only after explicit approval. No full subscription claim. | Beta access, limited support, refund policy, no full SaaS claims. |
| Production v1 | Real public paid SaaS launch. | Paid plans or subscriptions are live, account-bound, and operationally supported. | Production service, account persistence, billing, support, refund, legal, and uptime expectations. |

Production v1 is the only release type that can claim recurring paid SaaS
readiness.

## Strict Go Criteria

All criteria below must be true before production v1 launch.

- Account creation, sign-in, sign-out, recovery, and session handling are live
  and tested.
- Saved words, review state, review events, daily stats, and pack progress are
  persisted server-side by account.
- Local progress migration into an account is documented, tested, and
  reversible or supportable.
- Due, Weak, and Mastered are derived from real server-side SRS state.
- Review answer writes are idempotent and do not duplicate events or over-advance
  SRS boxes on retry.
- Billing provider, plans, prices, webhooks, entitlement states, refund states,
  cancellation states, and failed-payment states are implemented and tested.
- Entitlements are enforced server-side and cannot be granted by local storage
  alone.
- Pricing, plan, refund, cancellation, support, privacy, and terms copy is
  published and reviewed.
- Production pack/content claims are backed by reviewed content.
- Analytics can report Weekly Reviewed Words and launch funnels by cohort.
- Error reporting and monitoring cover account, sync, review, billing,
  entitlement, pack loading, and deployment failures.
- Staging and production environments are known, configured, and separable.
- Rollback and stop-sales procedures are written and rehearsed.
- Required validation commands pass:
  `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, and
  `npm.cmd run test -- --workers=1`.
- Manual launch QA is recorded for account, sync, review, billing, entitlement,
  analytics, content, support, refund, deployment, and rollback.
- Owner records a final public paid launch go decision.

## Strict No-Go Criteria

Any item below blocks production v1 launch.

- Users can pay before account persistence exists.
- Progress remains browser-local without account-bound server persistence.
- Review answers do not reliably create durable events and SRS state updates.
- Due, Weak, or Mastered can be faked, guessed, or derived from static/mock
  content rather than real review state.
- Entitlement state is local-only or frontend-only.
- Billing webhooks are missing or untested.
- Refund, cancellation, failed-payment, or expired-plan behavior is undefined.
- Pricing copy implies a feature, pack, sync behavior, AI feature, or support
  level that does not exist.
- Terms, privacy, refund, cancellation, or support copy is missing.
- Production monitoring, rollback, or stop-sales ownership is missing.
- Webflow, Cloudflare production Workers, DNS, payment settings, secrets,
  production data, or deployment settings were changed without explicit
  approval.
- Required validation commands fail without a documented owner acceptance.
- Manual production QA has not been recorded.

## Minimum Operational Systems Before Charging Subscriptions

Before recurring subscriptions or full paid plans are charged, these systems
must exist:

- Account system with recovery.
- Server-side learning data persistence.
- Server-side SRS sync with retry/idempotency behavior.
- Server-side entitlement store.
- Billing provider integration with webhook handling.
- Refund and cancellation workflow.
- Support inbox and escalation path.
- Legal copy: terms, privacy, refund, cancellation, billing disclosure.
- Production analytics and reporting.
- Error monitoring and incident response.
- Deployment rollback and stop-sales process.
- Content QA and pack readiness process.

## Support, Refund, And Legal Copy Requirements

Required support copy:

- Support contact method.
- Expected first-response time.
- What users should include for access, sync, payment, or content issues.
- Escalation path for data loss, billing errors, and blocked review.

Required refund/cancellation copy:

- Refund eligibility window.
- Refund exclusions.
- Cancellation path.
- Subscription renewal timing.
- Access behavior after cancellation, refund, failed payment, or dispute.
- Handling for duplicate payments and accidental purchases.

Required legal/privacy copy:

- Terms of service.
- Privacy policy.
- Billing disclosure.
- Data retention policy.
- Data deletion/export support path.
- Explanation of learning data stored for saved words, review state, events,
  pack progress, and analytics.

## Allowed Claims

Allowed only when accurate for the current release:

- "Save words and review them with a visual memory loop."
- "Due, Weak, and Mastered come from your review history."
- "Private beta" or "paid open beta" when the release is explicitly beta and
  caveats are visible.
- "Progress is stored locally in this beta" when account sync is not live.
- "Billing is not connected" when no real payment exists in-app.
- "Production v1" only after all production go criteria are met.

## Prohibited Claims

Do not claim or imply:

- Full paid SaaS is ready before auth, sync, billing, entitlement, support, and
  deployment systems exist.
- Subscription, active paid plan, invoice, billing portal, or checkout support
  exists before it is implemented and approved.
- Cross-device sync exists before account-bound server state is live.
- Mastery, streaks, pack progress, or due counts are real unless derived from
  review state.
- IELTS/GRE or paid packs are complete before content QA is done.
- AI Tutor or multilingual generated pages are available before those features
  are actually shipped.
- Permanent progress, lifetime access, or guaranteed data retention without the
  matching operational system.

## Launch Decision Template

Use this template for the final #47 launch decision.

```txt
Decision: Go / No-Go / Conditional Go
Release type: Private beta / Paid open beta / Production v1
Launch owner:
Support owner:
Rollback owner:
Billing owner:
Validation results:
Manual QA results:
Open P0 gaps:
Accepted P1 gaps:
Stop-sales triggers:
Rollback procedure:
Safety confirmation:
```

Safety confirmation must state whether Webflow, Cloudflare Workers, auth,
billing, DNS, payment settings, secrets, production data, deployment settings,
real payment, AI Tutor functionality, and multilingual page generation were
touched. For documentation-only planning PRs, the answer should be no.
