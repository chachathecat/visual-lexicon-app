# Track B Product/UI Readiness Module

This module is the static TypeScript contract for Track B product/UI readiness version 2.

The source of truth is the rendered-application evidence audit merged in source PR #119:

- Report type: rendered-application evidence audit
- Report version: 2
- Audit date: 2026-06-24
- Audited commit: `13141144a18e7192435b035478f2b0e7f469300f`

The canonical human-readable audit is:

```txt
docs/TRACK_B_PRODUCT_UI_READINESS_AUDIT.md
```

## Verdicts

- Private paid beta: Conditional / Manual-only
- Public paid beta: No-Go

The private audience has zero confirmed product/UI P0 blockers in the rendered
audit. The public audience has one confirmed public-beta P0 blocker:
`VLX-AUDIT-P0-001`.

## P0 Helper Semantics

P0 release-gate reads must be audience-specific:

```ts
const privateBlockers = getP0Blockers("private");
// []

const publicBlockers = getP0Blockers("public");
// [{ id: "VLX-AUDIT-P0-001", ... }]

const publicBlockerIds = publicBlockers.map((finding) => finding.id);
// ["VLX-AUDIT-P0-001"]
```

Do not use an ambiguous no-argument P0 helper as a release gate. The helper
requires `"private"` or `"public"` so private manual-beta risk acceptance cannot
be mistaken for public paid-beta readiness.

## Finding Model

Confirmed findings and suspected risks remain distinct:

- Confirmed P0 findings: `VLX-AUDIT-P0-001`
- Confirmed P1 findings: `VLX-AUDIT-P1-001`, `VLX-AUDIT-P1-002`
- Confirmed P2 findings: `VLX-AUDIT-P2-001`, `VLX-AUDIT-P2-002`
- Suspected P1 risks: `VLX-AUDIT-RISK-002`
- Suspected P2 risks: `VLX-AUDIT-RISK-001`

Do not promote suspected risks to confirmed blockers without new evidence.
Screen-reader behavior remains suspected until tested with assistive technology.

## Remaining Work

Remaining product/UI work should be tracked by issue ID or capability, not by a
stale PR-number roadmap:

- `VLX-AUDIT-P1-001`: fix `/word/[slug]` mobile horizontal overflow.
- `VLX-AUDIT-P1-002`: make `/word/[slug]` primary action focused on that word.
- `VLX-AUDIT-P2-001`: reduce local font/favicon console noise.
- `VLX-AUDIT-P2-002`: move Settings diagnostics out of the learner-facing UI.
- `VLX-AUDIT-RISK-001`: run assistive-technology QA for the review flow.
- `VLX-AUDIT-RISK-002`: keep unavailable IELTS/GRE pack placeholders out of
  paid claims until content is ready.

## Boundaries

This module is a pure static read. It does not wire into routes or components.
It does not add account sync, payment, entitlement, provider packages, route
handlers, middleware, production data access, platform changes, network calls,
browser storage reads, or browser storage writes.

The rendered product/UI audit and this typed contract do not supersede canonical non-UI blockers. Public paid beta remains blocked until approved
billing, account sync, support, refund, privacy, operations, and deployment
gates pass.
