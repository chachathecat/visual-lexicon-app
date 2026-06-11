# Production Analytics Planning Contracts

This folder contains TypeScript-only planning contracts for future production
analytics and reporting.

It is not production analytics.

Current boundaries:

- No analytics SDKs.
- No tracking scripts.
- No network calls.
- No vendor integration.
- No auth, database, payment, billing, or error-reporting imports.
- No runtime app integration.
- No environment variables or secrets.
- No mastery or entitlement side effects.

The contracts model event names, event sources, metric names, dashboard names,
privacy classifications, and event payload shapes for the architecture described
in:

- `docs/PRODUCTION_ANALYTICS_REPORTING.md`
- `docs/ANALYTICS_EVENT_CONTRACT.md`
- `docs/ANALYTICS_DASHBOARD_REQUIREMENTS.md`
- `docs/ANALYTICS_PRIVACY_AND_DATA_SAFETY.md`
- `docs/ANALYTICS_ROLLOUT_PLAN.md`

Future implementation work must still choose a collection path, trusted server
events, privacy controls, retention policy, staging validation, vendor strategy,
and production dashboard QA before claiming analytics readiness.
