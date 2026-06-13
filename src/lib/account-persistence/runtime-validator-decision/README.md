# Account Sync Runtime Validator Decision

Design-only contract for the future account sync runtime validator strategy and
dependency boundary.

This module keeps account sync core validator-neutral, records a
Zod-compatible future adapter as the preferred strategy, and requires any real
validator package to be approved in a later dependency PR.

This module does not add a real validator implementation, validator package,
routes, handlers, middleware, runtime integration, real auth, database
persistence, provider SDKs, logging packages, network helpers, browser storage
access, environment reads, billing, payment, checkout, subscriptions, paid
entitlement grants, production configuration, or production data changes.

Final verdict: `design_only`, not implementation-ready.
