# Private Beta Issue Log

This folder contains the static TypeScript contract for PR #87,
`Private beta issue log template`.

The contract defines how the owner records, classifies, redacts, triages, and
resolves issues reported during the small owner-controlled Visual Lexicon Track
B private beta. It covers required issue fields, P0/P1/P2 severity, issue
status lifecycle, approved route taxonomy, reproduction steps, browser/device
fields, redacted localStorage probes, screenshot/video evidence handling,
participant privacy rules, feature-area classifications, owner decisions,
rollback/pause triggers, duplicate handling, unresolved issue escalation,
first-day and first-week review usage, closeout criteria, and the next PR
sequence.

The exported data is pure static TypeScript data. It does not create GitHub issues,
call the GitHub API, integrate with an issue tracker, send messages, call
monitoring or analytics SDKs, read or write browser storage, call the network,
read environment variables, add route handlers, mutate entitlement, perform
account sync, or change deployment behavior.

Use `getPrivateBetaIssueLogTemplate()` for the full deterministic object, or
the focused helpers for issue intake fields, severity levels, status lifecycle,
redaction rules, owner triage checklist, rollback/pause trigger mapping, and
the next PR sequence.
