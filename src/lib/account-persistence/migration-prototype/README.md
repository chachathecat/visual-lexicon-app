# Guest-to-Account Migration Prototype

This directory is a prototype layer for planned guest-to-account migration only.
It is intentionally in-memory and preview-first:

- It reads typed snapshot inputs (already-resolved guest stores), not `localStorage`.
- It builds deterministic operation plans for migration review only.
- It applies those plans through the existing in-memory server SRS spike API surface.
- It does not implement real auth.
- It does not import provider SDKs.
- It does not use fetch, databases, payment APIs, or production persistence.
- It does not integrate into runtime routes or components.
- It does not grant paid entitlement.

Files:

- `migration-plan.ts` builds ordered migration operations and conflict snapshots.
- `migration-runner.ts` applies those operations through the spike service in-memory.
- `conflicts.ts` defines migration conflict categories and a pure classifier.
- `fixtures.ts` stores small, non-user fixtures for prototype plan and runner tests.
- `README.md` describes this prototype scope and limits.

Relationship to existing contracts:

- Uses `#49` account persistence contracts and snapshot primitives for types.
- Uses `#50` server SRS spike service interfaces to validate save and event behavior.

Scope notes:

- Preview-only. No runtime behavior is changed.
- No side effects beyond the passed in spike service store.
- Conflicts and skipped operations are always explicit.
