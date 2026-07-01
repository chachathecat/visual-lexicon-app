# CI Failure Triage Seed

`docs/factory/ci-failure-triage-seed.v1.json` records the resolved PR #148
Visual Screenshot Parity incident and the deterministic PR #149 stabilization.

## Incident

- PR #148 was blocked by CI / Visual Screenshot Parity.
- The failing step was `Run Figma parity screenshots`.
- The observed failure was not classified as setup, install, network install, or
  timeout failure.
- Local parity and local CI-mode parity tests passed.
- No screenshot baseline update was justified.
- No runtime UI change was justified.

## Resolution

PR #149 stabilized the parity test by deterministic test-context changes only
and merged at `fcdd91f7b5cec444d25d35be3a6bdcc38519bcf6`.

PR #148 checks were rerun and passed before PR #148 merged at
`4560e556ff682f3813983f4bc4f07c7868255ad9`.

## Future Policy

Future visual parity failures must require artifact, trace, and visual diff
triage before any screenshot update is considered. Blind screenshot updates are
forbidden.

The triage order is:

1. Collect CI artifacts.
2. Inspect the trace.
3. Inspect the visual diff.
4. Compare local and CI-mode results.
5. Classify the root cause.
6. Only then consider whether a snapshot update is justified.

## Guardrails

This seed is docs/tests-only. It does not change runtime UI, routes, assets,
fonts, auth, billing, DB, API, middleware, workflows, CODEOWNERS, AGENTS.md,
DNS, deployment, secrets, Webflow, Cloudflare Workers, R2 production objects,
production data, roadmap status, screenshot baselines, live GitHub mutation
policy, or auto-merge policy.
