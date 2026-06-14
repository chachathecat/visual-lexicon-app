# Account Sync Route Skeleton Decision

This package contains PR #69 design-only contracts for deciding when account
sync route skeleton files may be proposed in a future PR.

It names the future planned preview, apply, digest, and audit route file paths
as static data only. It does not create route files, route handlers, middleware,
runtime route wiring, real auth, database persistence, provider integrations,
validation packages, logging packages, remote service calls, browser storage
access, environment configuration, billing behavior, paid entitlement changes,
production data access, migrations, Webflow changes, Cloudflare Worker changes,
Vercel changes, deployment changes, DNS changes, or production behavior.

Future route skeleton work must be separate, explicitly owner-approved in the
PR body, disabled by default, mock-gated, and covered by tests proving disabled
routes, hard-disabled apply, read-only preview, bounded redacted digest/audit,
and preservation of the account sync No-Go gate until approval changes it.
