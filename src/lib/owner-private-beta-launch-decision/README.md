# Owner-Run Private Beta Launch Decision

This folder contains the static TypeScript contract for PR #90,
`Owner-run private beta launch decision`.

The contract records the final owner decision required before sending owner-only
private beta invitations after PRs #79 through #89 complete.

It captures:

- Current verdicts:
  - Owner-controlled private beta: `Proceed / Conditional Manual Launch`
  - Public paid beta: `No-Go`
- Required prior gate evidence from #79 through #89
- Owner-invited-only and manual-payment boundaries
- No automatic entitlement
- Local-state/account-sync limitation disclosure
- Support/refund/privacy readiness and issue log readiness
- Dry-run smoke evidence and owner final signoff confirmation
- First 24-hour and first 7-day review plans
- Success and failure criteria for private beta
- Pause/rollback criteria
- Recommended post-launch PR sequence

The exported data is pure static TypeScript. It does not implement runtime UI,
send invitations, add email integrations, call external APIs, create route
handlers, mutate storage, read browser state, run network calls, add DB/provider
SDKs, adjust deployment settings, or touch billing, auth, or production data.

Use `getOwnerRunPrivateBetaLaunchDecision()` for the full deterministic object or
the focused helper functions for verdicts, prior gates, launch conditions,
limitations, blockers, metrics, criteria, review plan, and next PR sequence.
