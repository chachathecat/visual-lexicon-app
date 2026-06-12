# Server Persistence Integration Harness

This directory contains a disabled, mock-only integration harness for the
planned account sync pipeline.

Scope:

- Pure TypeScript orchestration over existing contracts.
- Used by tests only.
- No runtime route or component integration.
- No `localStorage`, `fetch`, network, `process.env`, auth provider SDK,
  database SDK, payment SDK, Webflow, Cloudflare, Vercel, DNS, deployment
  settings, billing, secrets, or production data access.
- No paid entitlement writes.

Pipeline:

1. Accept a typed guest snapshot and optional typed in-memory server state.
2. Load account sync server state from the disabled mock adapter.
3. Build an account sync conflict-resolution plan.
4. Preview the plan through the server persistence adapter.
5. Apply the plan only when the preview and safety flags allow it.
6. Return before/after digests, apply counts, audit counts, and safety flags.

Files:

- `harness.ts` exposes `runServerPersistenceIntegrationHarness`.
- `fixtures.ts` provides deterministic snapshots and initial server states for
  integration contract tests.

This remains one step before API routes and real backend persistence. It proves
the local contracts compose without changing production app behavior.
