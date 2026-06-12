# Account Sync Route Readiness

This directory defines the implementation gate checklist for the planned account
sync preview, apply, digest, and audit routes.

Scope:

- Pure TypeScript readiness metadata and deterministic fixtures.
- Contract tests only.
- No framework route files, handler entry points, middleware, runtime component
  wiring, real auth, database persistence, provider SDK, payment or billing
  path, production data access, deployment change, network helper, browser
  storage read, or environment read.

Files:

- `readiness-gates.ts` exports gate groups, route-by-route required gates,
  blockers, safety policies, implementation scope, and the final No-Go verdict.
- `fixtures.ts` provides deterministic route, gate, blocker, and forbidden-path
  fixtures for tests.

This module intentionally keeps real API implementation blocked. The next work
should be a separate auth/provider decision refresh or persistence storage
design, not production route implementation.
