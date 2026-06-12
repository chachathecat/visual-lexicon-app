# Account Sync API Handler Harness

This directory contains a disabled, mock-only handler harness for the planned
account sync preview, apply, digest, and audit boundaries.

It is not a framework route implementation. The functions are plain TypeScript
helpers for tests. They validate mock method/path/request shapes, require a
mock authenticated context, run the existing server persistence integration
harness where appropriate, and return structured mock responses.

The harness keeps real backend work out of scope:

- no route files
- no middleware
- no runtime component wiring
- no real auth implementation
- no database persistence
- no payment or entitlement grant path
- no production data access

Use `handler-contracts.ts` for request/context/response types,
`mock-handlers.ts` for the pure handlers, and `fixtures.ts` for deterministic
test inputs.
