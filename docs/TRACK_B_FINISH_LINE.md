# Track B Finish Line

This document defines the strict completion bar for Visual Lexicon Track B Production v1. The autonomous agent system must use this file as the definitive stop‑condition for the project. Track B continues to operate as a separate learning app at `app.visuallexicon.org` and may not change Track A or Webflow behaviour.

## Completion criteria

All of the following must be true to reach the finish line:

- **Account ownership:** Account creation, sign‑in, sign‑out and recovery exist and have been tested. Local guest data can migrate into an account without loss.
- **Server persistence:** Saved words, review state, review events, daily stats and pack progress persist server‑side by account. Local writes sync to the server and retries are idempotent.
- **Cross‑device coherence:** A learner’s Due, Weak and Mastered queues match across devices. Local progress does not overwrite newer server state.
- **Billing and entitlement:** Plans, prices, purchase flow, webhook handling, entitlement snapshots, refunds, cancellations and downgrade states are implemented and tested. Entitlements are enforced server‑side and cannot be granted by local storage alone.
- **Support and legal:** Terms of service, privacy policy, billing disclosure, refund and cancellation policy and support contact copy are published and approved.
- **Analytics and monitoring:** Weekly reviewed words and launch funnels are reported from trusted server events. Error monitoring covers account, sync, review, billing, entitlement, content and deployment failures.
- **Deployment readiness:** Staging and production environments are configured and separable. Domain ownership, DNS, TLS, environment variables and rollback procedures are verified. Smoke tests pass on staging and production.
- **Owner sign‑off:** The final launch decision is recorded by the owner, listing validation results, manual QA results, open P0 gaps, accepted P1 gaps, stop‑sales triggers and rollback procedures.
- **Required checks:** All validation commands pass: `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test -- --workers=1`.

## Non‑go items

If any of the following conditions are true, the finish line is not met:

- Users can pay before account persistence exists.
- Progress remains browser‑local without server persistence.
- Review answers do not write durable events or state.
- Entitlement is local‑only or front‑end only.
- Billing webhooks, refunds, cancellations or expired state handling are missing.
- Support, refund or legal copy is missing.
- Production monitoring or rollback ownership is missing.
- Webflow, Cloudflare Workers, DNS, payment settings, secrets, production data or deployment settings were modified without explicit approval.
