# Account Sync Conflict Resolution

This directory defines a pure planning layer for future account sync conflict
resolution. It compares local guest/device learning state with account/server
state and returns a deterministic resolution plan.

Scope:

- Typed contracts, fixtures, and pure resolver only.
- No runtime route or component integration.
- No `localStorage` reads or writes.
- No `fetch`, network, auth provider SDK, database SDK, payment SDK, secrets, or
  environment-variable access.
- No paid entitlement creation.

Files:

- `conflict-types.ts` defines conflict categories, resolution actions, server
  state inputs, and plan outputs.
- `conflict-resolver.ts` builds deterministic resolution plans and preview
  review-state recomputation from review-event evidence.
- `fixtures.ts` stores small non-user fixtures for conflict policy tests.

Source-of-truth hierarchy:

1. Review events are the strongest learning evidence.
2. Review state should be recomputed from event evidence when possible.
3. Server state is preserved when local evidence is missing, stale, or only a
   copied review-state label.
4. Weak local evidence must remain visible in the plan and must not be replaced
   by stronger-looking stale state.
5. Upgrade interest is attribution-only and never grants paid entitlement.

Fake mastery policy:

- `Mastered` is not imported from local `review_state` alone.
- Mastery requires sufficient review-event evidence and delayed recall through
  the SRS reducer path.
- Unsupported or fake-mastery inputs become blocked/audit resolutions, not
  account state writes.
