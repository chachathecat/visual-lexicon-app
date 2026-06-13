# Account Sync DB Persistence Decision

Design-only contract for the future account sync database persistence provider
boundary and table groups.

This module selects the existing app/account backend first if available, keeps
account sync core database-provider-neutral, and records a Postgres-compatible
relational table shape as the preferred long-term design.

This module does not add real database persistence, routes, handlers,
middleware, migrations, executable schema files, provider packages, logging
packages, validation packages, browser storage access, environment reads,
billing, payment, checkout, subscriptions, paid entitlement grants, production
configuration, or production data changes.

Final verdict: `design_only`, not implementation-ready.
