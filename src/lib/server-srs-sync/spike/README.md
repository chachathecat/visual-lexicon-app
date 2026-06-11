# Server SRS Sync Spike

This directory contains a disabled-by-default implementation spike for future
server-side SRS sync behavior.

It is in-memory only. It does not implement auth, import an auth provider, use a
database, read or write `localStorage`, call `fetch`, expose production routes,
or integrate with app routes/components. It is not production persistence.

The purpose is to validate server-side SRS reducer and idempotency behavior
before real backend work:

- saved words create or preserve review state
- review events append once
- duplicate idempotency keys do not apply writes twice
- duplicate review events do not advance SRS twice
- archive preserves review state and events
- due, weak, and mastered queues derive from real review state

The feature flag in `feature-flag.ts` is hard-coded off and does not read
environment variables. The code in this directory is for contract tests and
planning only.
