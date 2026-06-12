# Account Sync Auth Ownership Boundary

This folder contains a pure, mock-only ownership contract for future account
sync routes. It does not implement auth, sessions, middleware, route handlers,
database persistence, provider clients, billing, or runtime integration.

The boundary models one rule: future account sync routes derive ownership from
an authenticated server session, not from a browser-supplied account id.

## Files

- `auth-ownership-boundary.ts` defines the ownership context, target account,
  route policy, failure reasons, and deterministic ownership decision.
- `fixtures.ts` provides contract fixtures for accepted and rejected ownership
  states.

## Route Policy

The planned preview, apply, digest, and audit routes all require an
authenticated owner. Apply requires the strictest policy because it is mutating.
Digest and audit require privacy-safe bounded responses and cannot expose raw
guest snapshots or sensitive payloads.

## Safety

- Client account ids are never ownership proof.
- Cross-account access is rejected.
- Anonymous, missing, expired, revoked, unsupported, ambiguous, deleted,
  blocked, and unverified contexts are rejected.
- The decision never grants paid entitlement.
- Billing and payment state remain outside account sync.
- Fake local `Mastered` state is rejected unless delayed review event evidence
  exists, and even then the decision does not create server mastery.

This folder is docs/contracts/tests only. It creates no actual API route files
and changes no production app behavior.
