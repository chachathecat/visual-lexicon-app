# Track B Simplicity Reset Module

This module contains pure static TypeScript data for PR #93, the Track B
simplicity reset.

It records:

- the simplified Track B mental model
- the approved v0 routes
- de-emphasized and deferred routes/features
- Dashboard, Save, Review, Saved, and Pricing v0 rules
- no-go public paid beta and manual-only private beta boundaries
- forbidden touchpoints for this docs/contracts/tests-only reset
- the next implementation PR sequence from #94 through #99

The canonical human-readable decision record is:

```txt
docs/TRACK_B_SIMPLICITY_RESET.md
```

This module does not wire into routes or components. It does not add runtime UI,
API routes, route handlers, middleware, auth, billing, payment, checkout,
subscription, provider SDKs, production data access, platform changes, network
calls, browser probes, or `npm audit fix` behavior.
