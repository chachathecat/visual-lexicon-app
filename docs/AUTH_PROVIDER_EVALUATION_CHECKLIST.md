# Auth Provider Evaluation Checklist

Checklist date: 2026-06-11

Scope: planning checklist only. This checklist does not implement auth, add
provider SDKs, add routes, add environment variables, add secrets, create
migrations, add billing, touch Webflow, touch Cloudflare Workers, touch Vercel
settings, touch DNS, mutate production data, deploy, or change runtime behavior.

Use this checklist before choosing or implementing an auth provider for Visual
Lexicon Track B.

## Provider Candidate

- [ ] Provider name:
- [ ] Provider docs reviewed:
- [ ] Pricing/quotas reviewed:
- [ ] Country/operator support reviewed:
- [ ] Data processing terms reviewed:
- [ ] Staging and production separation reviewed:
- [ ] Decision owner:
- [ ] Review date:

## Account Ownership

- [ ] Provides a stable user ID suitable for account-owned learning records.
- [ ] Supports an internal `profiles` mapping from provider ID to Visual
  Lexicon account ID.
- [ ] Does not require storing SRS state in auth metadata.
- [ ] Supports account linking without duplicating saved/review state.
- [ ] Supports account disable/delete states that the app can observe.
- [ ] Does not make localStorage the durable account source of truth.

## Email, Magic Link, And Social Login

- [ ] Supports email/password or approved passwordless email flow.
- [ ] Supports account recovery appropriate for paying learners.
- [ ] Supports sign out and session revocation.
- [ ] Supports social login providers needed for the target audience.
- [ ] Korea-relevant providers such as Kakao, Naver, or LINE are supported or
  have a clear custom OAuth/OIDC path if needed.
- [ ] Email deliverability and custom sender/domain setup are documented.
- [ ] The chosen initial login methods are minimal and supportable.

## Session Security

- [ ] Server routes can validate sessions without trusting client-local state.
- [ ] Session refresh behavior works with Next.js App Router.
- [ ] Session cookies/tokens are protected with appropriate secure flags and
  same-site posture.
- [ ] Server code verifies tokens/claims with the recommended provider method.
- [ ] Session expiration preserves local pending queue items without writing to
  account state.
- [ ] CSRF, redirect, replay, and account-linking risks are documented.
- [ ] MFA or step-up options are available if later needed.

## Next.js Compatibility

- [ ] Supports Next.js App Router.
- [ ] Supports Server Components where needed.
- [ ] Supports Route Handlers and Server Actions where needed.
- [ ] Supports middleware/proxy checks without caching user-specific responses
  incorrectly.
- [ ] Works in local development, staging, and production.
- [ ] Does not require new route groups beyond approved scope without explicit
  approval.

## Server-Side Route Compatibility

- [ ] Save-word routes can resolve `userId` server-side.
- [ ] Review-event routes can resolve `userId` server-side.
- [ ] Hydration routes can fetch only the current account's data.
- [ ] Export/delete routes require a current authenticated account.
- [ ] Future entitlement routes can resolve account identity server-side.
- [ ] Signed-out requests fail safely and keep client queue state local.

## User ID Stability

- [ ] Provider user IDs are stable for the account lifetime.
- [ ] Email changes do not change the primary user ID.
- [ ] Social account linking does not create duplicate learning accounts.
- [ ] Account deletion/recreation behavior is understood.
- [ ] Internal `profileId` remains the app's join key for learning data.
- [ ] Migration from provider IDs to internal IDs is documented.

## Webhooks

- [ ] User create/update/delete events are available if needed.
- [ ] Webhook signatures can be verified.
- [ ] Webhook retry/replay behavior is documented.
- [ ] Webhooks are treated as asynchronous and not required for synchronous
  sign-up success.
- [ ] Webhook events are idempotent.
- [ ] Staging and production webhooks are isolated.
- [ ] Webhook secrets are server-only and never exposed to the frontend.

## Metadata Support

- [ ] Supports minimal profile metadata needed for onboarding.
- [ ] Public/client-visible metadata is not used for authorization.
- [ ] Private/server metadata is not used as the SRS source of truth.
- [ ] Future entitlement state is stored in app-owned snapshots, not auth
  metadata.
- [ ] Metadata size and update limits are understood.
- [ ] Metadata export/delete behavior is documented.

## Data Export/Delete

- [ ] Provider user data can be exported or inspected for support.
- [ ] Provider user deletion is supported.
- [ ] App-owned saved words are included in export/delete.
- [ ] App-owned review state is included in export/delete.
- [ ] App-owned review events are included in export/delete.
- [ ] Daily stats and pack progress are included in export/delete.
- [ ] Account-linked extension and alias events are included in export/delete.
- [ ] Future entitlement snapshots are included after billing is approved.
- [ ] Delete does not mutate production pack data, Webflow, Cloudflare Workers,
  DNS, or deployment settings.

## Pricing

- [ ] Free tier and paid tier limits are understood.
- [ ] MAU, social-login, MFA, SMS, email, webhook, and database costs are
  reviewed.
- [ ] Staging cost is acceptable.
- [ ] Growth cost for Weekly Reviewed Words cohorts is modeled.
- [ ] Cost does not incentivize unsafe local-only account shortcuts.
- [ ] Pricing terms are re-checked before implementation.

## Korea/Operator Fit

- [ ] Provider account can be operated by the Korea-based owner or entity.
- [ ] Payment/billing features, if any, are ignored until separately approved.
- [ ] Data region and data processing terms are acceptable.
- [ ] Email/SMS deliverability and sender requirements are acceptable.
- [ ] Korean social-login requirements are known.
- [ ] Support timezone and escalation expectations are acceptable.
- [ ] Export/delete process is practical for the operator.
- [ ] Contract, DPA, and privacy terms are reviewed before launch.

## Future Billing Integration

- [ ] Provider exposes stable account IDs for future billing customer mapping.
- [ ] Billing entitlements can live in app-owned server snapshots.
- [ ] Auth metadata is not used as paid access proof.
- [ ] Local plan state is not used as paid access proof.
- [ ] Refund/cancel/failed-payment states can downgrade account access later.
- [ ] Provider billing features, if present, do not get enabled accidentally.
- [ ] Payment remains blocked until account persistence and server SRS sync are
  validated.

## Server SRS Sync Integration

- [ ] `userId + slug` uniqueness can be enforced for saved words.
- [ ] `userId + eventId` or `userId + idempotencyKey` uniqueness can be
  enforced for review events.
- [ ] Review events are append-only.
- [ ] Server reducer owns box, mastery, weak score, and next due.
- [ ] Due, Weak, and Mastered selectors read real account review state.
- [ ] New devices hydrate from account state before claiming cross-device
  freshness.
- [ ] Offline queue replay is idempotent.
- [ ] Guest merge imports review events before materialized state.

## Staging/Production Separation

- [ ] Separate provider projects/instances exist for staging and production.
- [ ] Separate callback URLs are configured.
- [ ] Separate secrets are stored only in approved server-side secret stores.
- [ ] Staging data cannot grant production account access.
- [ ] Production data is not mutated by local or staging tests.
- [ ] Rollback can disable staging/internal auth without affecting local MVP
  behavior.

## Secret Handling

- [ ] No secrets are committed to the repo.
- [ ] No secrets are exposed in frontend code.
- [ ] Public keys are clearly distinguished from server-only secrets.
- [ ] Webhook signing secrets are server-only.
- [ ] Service-role/admin keys are never used in client bundles.
- [ ] Local development uses documented placeholder setup only after
  implementation approval.
- [ ] Logs scrub tokens, cookies, passwords, recovery links, and auth headers.

## Rollback Risk

- [ ] Auth rollout can be disabled without deleting local guest progress.
- [ ] Server sync can be paused without losing pending local review events.
- [ ] Guest migration can be stopped and retried by migration batch ID.
- [ ] Provider account deletion is not used as the only rollback mechanism.
- [ ] Existing local MVP tests still pass when auth is disabled.
- [ ] Support can explain account-sync status clearly.
- [ ] Rollback does not touch billing, Webflow, Cloudflare Workers, DNS,
  Vercel settings, or production data outside Track B account records.

## Decision Gate

- [ ] Provider meets P0 account requirements.
- [ ] Provider does not require payment implementation.
- [ ] Provider does not require unsafe route expansion.
- [ ] Server SRS sync design remains account-owned and idempotent.
- [ ] Export/delete path is credible.
- [ ] Korea/operator concerns have owner sign-off.
- [ ] Next PR scope is limited and reversible.

