# Paid Beta Manual QA Module

This module is design-only static TypeScript data for the Visual Lexicon Track B
paid beta manual QA checklist runner.

It records:

- owner-run QA scenarios
- route targets
- localStorage probes
- console probe snippets to paste manually in DevTools
- expected results and evidence requirements
- P0/P1/P2 stop conditions
- private/public beta verdict rules
- the next recommended PR

The console probes are strings only. This module does not execute them, read
browser storage, call network helpers, or connect to app routes.

It does not add product features, API routes, route handlers, middleware,
runtime route/component integration, auth, database persistence, provider SDKs,
validation dependencies, logging dependencies, environment variables, payment,
billing, checkout, subscriptions, paid entitlements, migrations, production
data access, Webflow changes, Cloudflare Worker changes, Vercel settings, DNS
changes, or deployment changes.

The canonical human-readable checklist is:

```txt
docs/PAID_BETA_MANUAL_QA_CHECKLIST.md
```
