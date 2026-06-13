# Account Sync Auth Provider Decision

Design-only contract for the future account sync auth provider boundary.

This module selects the existing app/account session boundary first, keeps the
sync core provider-neutral, and defines the adapter shape that would normalize a
future server session into an account sync principal.

This module does not add real auth, routes, handlers, middleware, database
persistence, provider packages, logging packages, validation packages, browser
storage access, environment reads, billing, payment, checkout, subscriptions,
paid entitlement grants, production configuration, or production data changes.

Final verdict: `design_only`, not implementation-ready.
