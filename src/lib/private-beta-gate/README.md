# Private Beta Gate Module

This module is pure static TypeScript data for the Visual Lexicon Track B
owner-controlled private beta gate.

It records:

- private and public beta verdicts
- the 5 to 20 participant cap recommendation
- allowed and excluded participant profiles
- owner-invited manual invite policy
- manual/payment-link-only payment policy
- manual entitlement policy with no app entitlement mutation
- account sync and single-browser local-state disclosures
- support, refund, cancellation, privacy, monitoring, issue reporting, and
  rollback requirements
- public beta P0 blockers and the next PR sequence
- safety boundaries proving this is docs/contracts/tests only

The module exports deterministic fixtures and helper functions for tests. It
does not execute browser probes, read or write browser storage, call network
helpers, import app routes, connect to auth/payment/database providers, add
route handlers, or mutate production state.

The canonical human-readable report is:

```txt
docs/PRIVATE_BETA_GATE_PREP.md
```
