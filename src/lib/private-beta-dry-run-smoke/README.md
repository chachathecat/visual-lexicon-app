# Private Beta Dry-Run Smoke Evidence

This folder contains the static TypeScript contract for PR #89,
`Private beta dry-run smoke evidence`.

The contract records owner/manual pre-invite smoke evidence for Track B routes and
state without executing the app at runtime. It keeps owner-controlled private beta
`Conditional / Manual-only`, public paid beta `No-Go`, and blocks invitations until
the PR #90 launch decision.

The exported data is pure static TypeScript. It does not send invitations, run the
app, call runtime storage providers, create API routes, mutate data, call the
network, integrate monitoring or AI services, or change deployment, payment,
billing, or production infrastructure behavior.

Use `getPrivateBetaDryRunSmokeEvidence()` for the full deterministic object, and the
helper functions for route checks, storage probes, console/hydration evidence,
findings, decision, and the next PR sequence.
