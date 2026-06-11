# Analytics Rollout Plan

Plan date: 2026-06-11

Scope: Visual Lexicon Track B production v1 analytics rollout planning only.
This plan does not add analytics SDKs, tracking scripts, vendor integrations,
network calls, environment variables, secrets, auth runtime, billing runtime,
deployment changes, production data mutation, or current runtime behavior
changes.

## Phase 0: Architecture Only

Goal:

Define the analytics/reporting architecture, event contract, dashboards,
privacy boundaries, and launch recommendation before implementation.

Scope:

- Add production analytics architecture docs.
- Add event contract documentation.
- Add dashboard requirements.
- Add privacy and data-safety rules.
- Add rollout plan.
- Link docs from README Production v1 Planning.
- Optionally add disconnected TypeScript-only planning contracts.
- Do not add SDKs, vendors, scripts, network calls, environment variables, or
  runtime behavior.

Risks:

- Docs can imply analytics is production-ready if scope language is weak.
- Event names can drift from existing local analytics vocabulary.
- Dashboards can over-prioritize traffic instead of Weekly Reviewed Words.

Tests:

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test -- --workers=1`

Exit criteria:

- Docs are reviewed and linked from README.
- Scope explicitly says no production analytics exists yet.
- North Star and go/no-go recommendation are clear.
- No runtime app behavior changes.

Rollback plan:

- Revert docs, README links, and disconnected type-only planning contracts.
- No data rollback is required.

## Phase 1: Typed Contracts And Local Event Vocabulary

Goal:

Create compile-time contracts for future production analytics without connecting
any external vendor or changing runtime behavior.

Scope:

- Maintain event names, dashboard names, metric names, sources, privacy classes,
  and payload shapes as TypeScript types/constants.
- Keep contracts in a clearly labeled planning-only module.
- Map existing local/private beta analytics vocabulary to future production
  concepts where useful.
- Add tests only for pure helper functions if helpers are introduced.

Risks:

- Type constants can be mistaken for implemented analytics.
- Future developers may import planning contracts into runtime paths without a
  rollout decision.
- Contracts can omit privacy classifications or source-of-truth labels.

Tests:

- Typecheck and lint.
- No browser or vendor tests.
- No network tests.

Exit criteria:

- TypeScript contracts compile.
- README or module docs state this is not production analytics.
- No SDKs, network calls, environment variables, or runtime integration exist.

Rollback plan:

- Remove the planning-only module and any docs references to it.
- Keep architecture docs if still accurate.

## Phase 2: Client-Side Event QA Without External Vendor

Goal:

Validate event vocabulary, privacy filtering, and funnel semantics locally or in
staging without sending data to an external vendor.

Scope:

- Use local/dev-only inspection or test fixtures to verify event shapes.
- Confirm client events exclude query strings, private URLs, page text,
  secrets, auth tokens, and payment data.
- Validate Save -> First Review, review start, review answer, queue view, pack,
  alias, extension, pricing, and error vocabulary.
- Keep all collection disabled from external transport.

Risks:

- Local event QA can drift from production transport requirements.
- Client-only events can be overinterpreted as trusted review state.
- Debug logging can leak sensitive fields if not scrubbed.

Tests:

- Typecheck and lint.
- Unit tests for pure sanitizers only if sanitizers are changed.
- Manual local QA notes for event field inspection.
- No flaky browser tests unless a stable existing test path is extended.

Exit criteria:

- Client event fields are privacy-filtered.
- No event can affect mastery or entitlement.
- No external analytics vendor receives events.
- QA notes identify inspected golden flows.

Rollback plan:

- Disable or remove local/dev-only event QA paths.
- Revert sanitizer changes if they affect runtime unexpectedly.

## Phase 3: Server Trusted Event Design After Server SRS Sync

Goal:

Design server-trusted analytics around accepted save, review, SRS, pack, sync,
auth, and entitlement writes after server SRS sync architecture is implemented.

Scope:

- Define server event tables or append-only logs.
- Use accepted review answers as the source for Weekly Reviewed Words.
- Add idempotency and retry behavior for analytics writes.
- Define dedupe rules for save, review, sync, pack progress, auth, and future
  billing events.
- Separate server trusted events from client intent events.

Risks:

- Duplicate retries can overcount Weekly Reviewed Words.
- Analytics can accidentally become part of the SRS write transaction and break
  reviews if reporting fails.
- Server analytics can collect too much raw payload data.

Tests:

- Unit tests for idempotency and dedupe shape.
- Integration tests for accepted review writes after server sync exists.
- Failure tests showing analytics failure does not corrupt SRS.
- Privacy tests for rejected sensitive fields if validators exist.

Exit criteria:

- Accepted review events can produce deduped Weekly Reviewed Words.
- Analytics failure cannot block or double-apply SRS state.
- Server events carry privacy classifications and retention expectations.
- No production vendor is required for design validation.

Rollback plan:

- Disable analytics write side effects behind a server feature flag.
- Keep accepted review writes intact.
- Recompute derived reporting after fix from trusted event logs.

## Phase 4: Vendor Decision And Staging Integration

Goal:

Select and validate an analytics/reporting vendor or internal warehouse in
staging after event contracts, privacy rules, and server trusted events are
approved.

Scope:

- Compare vendors against privacy, export/delete, idempotency, server ingestion,
  dashboard, retention, and access-control requirements.
- Configure staging-only project/workspace.
- Use staging keys/secrets stored only in approved secret management.
- Send approved staging events only.
- Confirm production events are not polluted by staging/test data.

Risks:

- Vendor SDKs may collect extra fields by default.
- Browser tags can send data before privacy filters run.
- Staging can accidentally send to production analytics.
- Event volume pricing can distort collection design.

Tests:

- Staging smoke tests for approved event ingestion.
- Privacy field-blocking tests.
- Dashboard freshness checks.
- Export/delete dry run where vendor supports it.
- No production data tests.

Exit criteria:

- Vendor selection is documented.
- Staging event ingestion matches the approved contract.
- No secrets or payment/auth data are emitted.
- Dashboard access controls and retention are configured.
- Production integration remains disabled until sign-off.

Rollback plan:

- Disable staging analytics transport.
- Rotate staging credentials if exposed.
- Delete staging test data if required.
- Revert vendor SDK/configuration PRs if behavior is unsafe.

## Phase 5: Production Dashboard Validation

Goal:

Validate launch-critical dashboards against trusted staging or production-like
data before production paid SaaS launch.

Scope:

- Validate Weekly Reviewed Words.
- Validate activation, Save -> First Review, First Review -> Second Review,
  due completion, weak recovery, mastery quality, pack progress,
  pricing/paywall interest, extension source, alias search, auth/sync health,
  billing health, and incident dashboards.
- Confirm dashboard freshness and data quality checks.
- Compare client and server counts where both exist.

Risks:

- Dashboards can look correct on happy-path data but fail on retries,
  duplicates, stale clients, refunds, or sync conflicts.
- Aggregates can hide missing events by source or cohort.
- Billing and entitlement dashboards can be premature if billing is not
  authorized.

Tests:

- Seeded staging scenarios for save, review, due, weak, mastery, pack,
  extension, alias, auth/sync, billing planned states, and incidents.
- Dedupe tests for retries.
- Dashboard freshness tests.
- Manual QA notes tied to golden flows.

Exit criteria:

- Weekly Reviewed Words matches accepted review event counts.
- Launch dashboards answer their stated go/no-go questions.
- P0 data gaps have owners and fixes.
- Billing dashboards are clearly planned-only unless billing exists.

Rollback plan:

- Keep production launch blocked.
- Disable faulty dashboards or mark them untrusted.
- Recompute aggregates from trusted source events after fixes.

## Phase 6: Analytics Readiness Sign-Off

Goal:

Make a final analytics go/no-go recommendation for production paid SaaS launch.

Scope:

- Review event contract, privacy rules, dashboard validation, incident
  reporting, data retention, export/delete, vendor readiness, and launch QA.
- Confirm analytics reports Weekly Reviewed Words safely.
- Confirm analytics does not grant mastery or entitlement.
- Confirm billing, auth, sync, deployment, support/refund/legal, and production
  release QA are separately ready or explicitly blocked.

Risks:

- Analytics readiness can be mistaken for full launch readiness.
- A vendor dashboard can pass while server trust or privacy gaps remain.
- Launch pressure can accept unowned P0 gaps.

Tests:

- Full validation commands.
- Staging dashboard QA.
- Privacy and field-scrubbing review.
- Incident drill for analytics outage or dashboard freshness failure.
- Cross-check with production release QA evidence.

Exit criteria:

- No open P0 analytics gaps.
- Weekly Reviewed Words, activation, retention, review quality, sync health,
  billing readiness, support/refund/legal readiness, deployment readiness, and
  production release QA can be measured or verified safely.
- Owner signs off on analytics readiness only.
- Final launch decision remains separate.

Rollback plan:

- Keep analytics disabled or staging-only.
- Block production launch until P0 gaps are fixed.
- Revert unsafe analytics runtime changes if needed.
- Preserve trusted review data for recomputation.

## Recommendation

Do not launch production paid SaaS until Weekly Reviewed Words, activation,
retention, review quality, sync health, billing readiness,
support/refund/legal readiness, deployment readiness, and production release QA
can be measured or verified safely.

The recommended next PR after this architecture work is `#46 Production release
QA`.
