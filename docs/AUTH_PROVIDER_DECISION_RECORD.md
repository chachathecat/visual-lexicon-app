# Auth Provider Decision Record

Decision date: 2026-06-11

Status: Primary provider path recommended for planning; no provider implemented.

Scope: Visual Lexicon Track B production v1 planning only. This decision record
does not implement auth, add an auth provider SDK, add login/signup routes,
create database credentials, add migrations requiring secrets, add environment
variables, add secrets, add billing, touch Webflow, touch Cloudflare Workers,
touch Vercel settings, touch DNS, mutate production data, deploy, or change
runtime behavior.

## Decision Context

#40-#47 completed the production v1 planning pass and the #47 public paid launch
decision is No-Go / Not Yet for public production paid SaaS. The next safe phase
is account persistence and server-side SRS sync. Payment must not be added before
account persistence and server-side SRS sync are implemented and validated.

Track B currently has a local browser SRS loop. The production account system
must preserve this chain:

```txt
Save -> Review -> review_state/events -> Due/Weak/Mastered -> Weekly Reviewed Words
```

Current repo evidence:

- `package.json` has no Supabase, Clerk, Auth.js / NextAuth, Firebase, database,
  or auth provider SDK dependencies.
- The app docs already define account-owned saved words, review state, review
  events, daily stats, pack progress, extension source, alias search source, and
  future entitlement snapshot contracts.
- No runtime Track B account backend is visible in this repository.

Because an external Visual Lexicon account backend may exist outside this repo,
the first implementation step should include a short read-only audit before any
SDK, secret, environment variable, route, or migration is added.

## Source Notes

Official docs reviewed for this planning record:

- Supabase Auth overview:
  `https://supabase.com/docs/guides/auth`
- Supabase Next.js SSR setup:
  `https://supabase.com/docs/guides/auth/server-side/nextjs`
- Supabase user management:
  `https://supabase.com/docs/guides/auth/managing-user-data`
- Supabase Row Level Security:
  `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Clerk Next.js SDK:
  `https://clerk.com/docs/reference/nextjs/overview`
- Clerk user management:
  `https://clerk.com/docs/guides/users/managing`
- Clerk webhooks:
  `https://clerk.com/docs/guides/development/webhooks/overview`
- Auth.js database adapters and providers:
  `https://authjs.dev/getting-started/database`,
  `https://authjs.dev/getting-started/authentication/oauth`
- Firebase Authentication:
  `https://firebase.google.com/docs/auth`
- Firebase Admin user management:
  `https://firebase.google.com/docs/auth/admin/manage-users`

Provider features, pricing, country support, data residency, quotas, and terms
can change. Re-check official docs and account contracts before implementation.

## Decision Criteria

The provider must support:

- Stable user IDs for account-owned SRS state.
- Sign up, sign in, sign out, recovery, and session persistence.
- Next.js App Router and server-side route compatibility.
- Guest-to-account merge without faking cross-device progress.
- Server-side SRS sync with idempotent saved-word and review-event writes.
- Future billing entitlements tied to account IDs, not localStorage.
- Export/delete support for auth profile data and app-owned learning data.
- Safe Korea/operator posture, including email deliverability, support, and
  data residency review.
- Reasonable implementation, security, maintenance, and rollback risk.

## Supabase Auth

### Pros

- Auth and Postgres are designed to work together, which fits account-owned SRS
  tables for saved words, review state, review events, daily stats, pack
  progress, extension source, alias source, and future entitlement snapshots.
- Stable user IDs can be referenced from app-owned `profiles` and learning
  tables.
- Supports email/password, passwordless email/OTP, OAuth, SAML, phone, MFA, and
  anonymous-user concepts.
- Next.js SSR docs cover cookie-based clients and server route usage.
- Row Level Security gives a strong defense-in-depth model for per-user data
  access when real tables are later added.
- User export/delete paths are visible through Postgres and the auth management
  surface.
- Open Postgres data model reduces learning-data lock-in compared with a pure
  identity-only SaaS.

### Cons

- Real implementation requires provider SDKs, environment variables, project
  keys, RLS policies, migrations, and production operational ownership in a
  later PR.
- RLS and direct browser data access must be designed carefully; server SRS
  reducers should still own review-event acceptance and mastery transitions.
- Email deliverability, SMTP configuration, rate limits, project region, backup,
  and support processes need explicit operator review.
- Auth metadata is not a substitute for app-owned learning tables.

### Fit For Visual Lexicon Track B

Strong. Track B needs durable account-owned learning records, not just login UI.
Supabase Auth plus app-owned Postgres tables matches the existing architecture
docs and keeps the memory-state model close to the persistence layer.

### Fit For Server-Side SRS Sync

Strong. The `userId + slug`, `userId + eventId`, and `userId + idempotencyKey`
contracts map naturally to relational constraints and indexes. The server must
still run the trusted SRS reducer and reject stale or duplicate mutations.

### Fit For Future Billing Entitlements

Strong. Future `entitlement_snapshots` can be keyed by internal profile IDs and
provider user IDs. Billing must remain separate from local plan state and from
auth metadata.

### Data Export/Delete Implications

Good fit if app-owned tables are designed with account export/delete in mind
from the first migration. Deleting auth users is not enough; saved words, review
events, review state, daily stats, pack progress, extension/alias events, and
future entitlement snapshots need explicit export/delete handling.

### Korea/Operator Considerations

Potentially good, but must be verified before implementation. Check project
region options, Korean operator onboarding, email deliverability from Korea,
Kakao/Naver/social-login needs, support expectations, data processing terms,
and whether the operator is comfortable running Postgres/RLS policies.

### Implementation Complexity

Medium. The provider setup is straightforward, but the hard work is correct
server SRS sync, RLS policy design, guest merge, conflict handling, and
export/delete coverage.

### Lock-In Risk

Medium-low for learning data if app tables stay in Postgres with documented
schema and export paths. Auth user IDs still create provider coupling, so keep
an internal `profiles.id` and `authProviderUserId` mapping.

### Security/Maintenance Risk

Medium. Security depends on cookie/session handling, token validation, RLS,
server route checks, secret handling, and migration discipline. This is
manageable but must be tested before paid launch.

### Estimated Development Risk

Medium. The provider aligns with the SRS data model, but incorrect RLS,
idempotency, or migration logic could corrupt user learning state.

### Recommendation

Recommended primary path, assuming a short read-only audit confirms no existing
Visual Lexicon backend already owns accounts: use Supabase Auth with app-owned
Postgres learning tables and server-side SRS reducers.

## Clerk

### Pros

- Strong Next.js App Router support with prebuilt components, hooks,
  middleware, and server helpers.
- Mature user/session management with stable user IDs, user metadata, backend
  APIs, and account management surfaces.
- Webhooks can keep an app database in sync with user create/update/delete
  events, as long as webhook delivery is treated as asynchronous.
- Fastest path to polished login/account UX.

### Cons

- Identity and account UX live primarily in Clerk, while Visual Lexicon still
  needs a separate app database for SRS state, review events, pack progress,
  export/delete, and future entitlement snapshots.
- Webhooks are asynchronous and cannot be the only synchronous source for
  account creation flows.
- Provider-specific components and metadata increase lock-in.
- Clerk has billing-related surfaces; Track B must avoid coupling auth rollout
  to billing until account persistence and server SRS sync are validated.

### Fit For Visual Lexicon Track B

Good for authentication UX. Weaker than Supabase for this specific next phase
because the central problem is durable account-owned SRS persistence, not only
login UI.

### Fit For Server-Side SRS Sync

Good if paired with a separate Postgres database and internal profiles table.
Clerk should provide identity; Visual Lexicon must own the server SRS reducer,
event idempotency, and data model.

### Fit For Future Billing Entitlements

Good if entitlements remain internal snapshots. Do not use auth metadata or
Clerk billing UI as the app's source of truth without a separate billing
decision and explicit approval.

### Data Export/Delete Implications

Moderate. Clerk user export/delete must be coordinated with app-owned learning
data export/delete. The app cannot rely on provider user deletion to remove or
export SRS records stored elsewhere.

### Korea/Operator Considerations

Verify country support, data residency, email/SMS deliverability, social login
coverage for Korea-relevant providers, and support terms. This is likely
operationally easy for auth UX but still needs a separate database operator
choice.

### Implementation Complexity

Low for auth UI; medium overall once the app database, sync routes, webhook
verification, guest merge, and export/delete are included.

### Lock-In Risk

Medium-high for auth UX and user management. Learning data lock-in can remain
low only if it is kept in app-owned tables with internal IDs.

### Security/Maintenance Risk

Medium-low for core auth; medium overall because webhooks, server SRS routes,
and app database authorization still need careful implementation.

### Estimated Development Risk

Medium. Faster sign-in implementation, but more moving parts across identity
provider, database, and app sync.

### Recommendation

Viable fallback if the team prioritizes fastest polished auth UX and is willing
to operate a separate database for all SRS state. Not the primary recommendation
for Track B's account-persistence-first phase.

## Auth.js / NextAuth

### Pros

- Open-source and flexible with many OAuth providers and adapters.
- Can work with a self-owned database and internal user/profile tables.
- Lower vendor lock-in for auth logic than hosted identity providers.
- Good fit when the team wants to fully own sessions, adapter schema, email
  provider, and account UI.

### Cons

- The project has shifted toward Better Auth, so long-term direction and
  migration posture need review before commitment.
- More app responsibility for secure auth flows, recovery, email delivery,
  adapter configuration, CSRF/session behavior, and account UI.
- Magic links require a database adapter and email provider configuration.
- More custom work before Track B reaches reliable account persistence.

### Fit For Visual Lexicon Track B

Moderate. It can fit a custom app-owned stack, but it is not the shortest safe
path to production account persistence unless the operator already has strong
Next.js auth operations experience.

### Fit For Server-Side SRS Sync

Good if backed by Postgres and internal profiles. Auth.js itself does not solve
SRS persistence; it only provides the session/user boundary.

### Fit For Future Billing Entitlements

Good if entitlements are app-owned and keyed to internal user IDs. Billing
remains separate and should not be implemented in this PR.

### Data Export/Delete Implications

Good if all user and learning data lives in app-owned tables with documented
export/delete jobs. The team owns the full lifecycle.

### Korea/Operator Considerations

Flexible for Kakao/Naver/LINE and custom provider needs, but the operator owns
provider setup, email deliverability, support, and compliance decisions.

### Implementation Complexity

Medium-high. More control, but more security and support surface.

### Lock-In Risk

Low to medium if built on a portable database. The risk shifts from vendor
lock-in to maintenance ownership.

### Security/Maintenance Risk

Medium-high. The team must keep auth dependencies, adapter schema, session
security, and account recovery flows correct.

### Estimated Development Risk

Medium-high. The custom work can delay the critical server SRS sync phase.

### Recommendation

Do not choose as the first implementation path unless the read-only audit finds
an existing app-owned backend that already uses Auth.js/NextAuth safely.

## Firebase Auth

### Pros

- Mature managed auth with email/password, email link, phone, social/federated
  providers, anonymous auth, MFA options, and admin user management.
- Stable Firebase `uid` can key app data.
- Strong client SDK ecosystem and account recovery support.
- Works well if the product later chooses Firebase/Firestore as the broader
  backend stack.

### Cons

- Track B's SRS model is relational and event-heavy; Firebase Auth alone still
  requires a separate persistence choice.
- Firestore/Realtime Database data modeling would be a larger departure from
  the existing Postgres-shaped account/SRS docs.
- Export/delete across Firebase Auth plus app-owned SRS data requires careful
  coordination.
- Next.js server route integration is possible but less aligned with the
  current app-owned relational sync plan than Supabase Auth plus Postgres.

### Fit For Visual Lexicon Track B

Moderate. Good managed identity, but less direct fit for the planned relational
saved/review/event/rollup model unless the team deliberately chooses a Firebase
backend architecture.

### Fit For Server-Side SRS Sync

Moderate. Stable UIDs are useful, but the trusted SRS reducer, idempotent event
ingestion, conflict rules, and rollups still need app-owned server persistence.

### Fit For Future Billing Entitlements

Moderate. Entitlements can be keyed to Firebase UIDs, but billing snapshots and
support records still need a durable app-owned database.

### Data Export/Delete Implications

Moderate. Firebase Admin can manage users by UID, but export/delete for Visual
Lexicon learning data must be separately designed and tested.

### Korea/Operator Considerations

Verify Google Cloud/Firebase project operations, data location, Korean operator
account setup, email/SMS pricing, and local social-login needs. Strong if the
operator is already committed to Firebase; otherwise it adds a new platform
axis.

### Implementation Complexity

Medium if auth only; medium-high if choosing Firebase as the broader persistence
stack.

### Lock-In Risk

Medium-high if learning data moves into Firebase-native stores. Medium if only
auth is used and learning data remains in portable app-owned tables.

### Security/Maintenance Risk

Medium. Managed auth lowers some risk, but app database authorization and
server SRS sync still carry the core production risk.

### Estimated Development Risk

Medium-high for this repo because it does not match the already documented
Postgres-shaped SRS persistence plan as cleanly as Supabase.

### Recommendation

Do not choose as the primary path unless the operator already has Firebase
infrastructure, billing, support, and data export/delete operations in place.

## Existing Visual Lexicon Account Backend, If Any

### Pros

- If a safe existing backend exists, it may preserve current domain, support,
  user IDs, operational habits, and future integration points.
- Could reduce provider sprawl if it already supports sessions, recovery,
  account IDs, audit logs, and export/delete.
- May be best if Track A or another internal service already owns accounts.

### Cons

- No such backend is visible in this Track B repository.
- Unknown security posture, session model, data model, recovery support,
  provider dependencies, export/delete process, staging separation, and
  operational ownership.
- Reusing a weak or incomplete backend could put SRS state, future paid access,
  and account recovery at risk.

### Fit For Visual Lexicon Track B

Unknown. It should be considered only after a read-only audit confirms it exists
and can meet Track B's account-owned SRS requirements.

### Fit For Server-Side SRS Sync

Unknown. It must support stable user IDs, server route auth checks, idempotent
write ownership, account hydration, guest merge, and export/delete.

### Fit For Future Billing Entitlements

Unknown. It must support account-bound entitlement snapshots and billing
provider mapping without using localStorage as proof of paid access.

### Data Export/Delete Implications

Unknown. Export/delete must cover both provider profile data and Track B
learning data.

### Korea/Operator Considerations

Potentially strong if already operated by the Korea-based owner and already
supports local compliance, email deliverability, and support. Potentially weak
if undocumented or unmaintained.

### Implementation Complexity

Unknown until audited.

### Lock-In Risk

Unknown. Could be low if app-owned and well documented; high if tightly coupled
to an opaque legacy service.

### Security/Maintenance Risk

Unknown and potentially high until session security, recovery, logging, secret
handling, and ownership are reviewed.

### Estimated Development Risk

Unknown. Treat as high until proven otherwise.

### Recommendation

Run a short read-only audit before implementation. Do not add provider code or
migrate local data until the audit confirms whether this backend exists and can
meet P0 auth/account requirements.

## Custom Auth

### Pros

- Maximum control over UX, user IDs, session model, data residency, and vendor
  independence.
- Can be tailored to Korean social-login providers and app-specific recovery
  policy.
- Learning data and identity can be modeled in one app-owned system.

### Cons

- High security burden: password handling, session rotation, recovery, MFA,
  abuse prevention, email deliverability, account linking, bot protection,
  logging, support, and incident response.
- Slowest route to reliable production account persistence.
- Expands maintenance surface before the SRS sync loop is proven.
- Hard to justify for an early paid learning app unless there is a strong
  existing security team and compliance reason.

### Fit For Visual Lexicon Track B

Weak for this phase. The product risk is already high around SRS sync, guest
merge, and export/delete; adding custom auth security work would delay the core
learning foundation.

### Fit For Server-Side SRS Sync

Technically strong if built correctly, but correctness and security burden are
too high for the next phase.

### Fit For Future Billing Entitlements

Technically strong if built correctly, but paid access would inherit every auth
security and recovery failure.

### Data Export/Delete Implications

Good only if built carefully. The team would own every export/delete edge case.

### Korea/Operator Considerations

Potentially flexible for local providers and data residency, but the operator
would own all compliance, support, and security operations.

### Implementation Complexity

High.

### Lock-In Risk

Low vendor lock-in, high maintenance lock-in.

### Security/Maintenance Risk

High.

### Estimated Development Risk

High.

### Recommendation

Not recommended unless a future audit produces a strong, specific reason that
hosted or standard auth options cannot satisfy Track B's P0 requirements.

## Final Recommendation

Use Supabase Auth as the primary recommended provider path for Track B account
persistence, paired with app-owned Postgres learning tables and server-side SRS
reducers.

Implementation should not start in this PR. Before adding an SDK, route, env
var, secret, or migration, run a short read-only audit to confirm whether any
existing Visual Lexicon account backend exists outside this repository. If no
adequate existing backend exists, proceed with:

```txt
#49 Account persistence typed contracts and mocks
-> provider-specific implementation planning
-> server-side SRS sync implementation behind a safe flag
```

Billing, checkout, subscriptions, invoices, billing portals, payment SDKs, and
payment links remain out of scope until account persistence and server-side SRS
sync are implemented and validated.

