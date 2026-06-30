# PR Readiness Owner Queue

The PR readiness owner queue summarizer is a pure deterministic factory
control-plane contract. It helps the owner decide whether a draft/open PR is
ready for owner review, needs fixes, is blocked, is stale, or is unsafe.

It accepts explicit input objects only:

- PR metadata;
- changed files;
- CI/check summaries;
- validation evidence extracted from the PR body;
- risk policy;
- blocked surfaces;
- task/backlog mapping;
- owner approval policy;
- stale/open PR context;
- dry-run, live-mutation, and auto-merge options.

It returns one owner queue item with stable ordering for summaries, blockers,
warnings, evidence, comments, and stop reasons. The same input produces the same
output.

## Fail-Closed Rules

The summarizer fails closed when:

- CI is missing, failing, pending, unknown, ambiguous, or no-op-only;
- required validation evidence is missing or rejected;
- `liveGitHubMutations` is `true`;
- `autoMerge` is `true`;
- `dryRun` is explicitly `false`;
- a high-risk PR lacks owner approval evidence;
- hard-blocked surfaces are touched;
- PR #121 is the current stale/not-mergeable PR.

Docs/tests-only PRs with complete validation and successful CI can become
`ready_for_owner_review`, but they are never auto-merged. Runtime UI PRs require
stronger validation evidence: validation results, manual QA, browser QA,
accessibility notes, and runtime UI scope.

## High-Risk And Blocked Surfaces

High-risk surfaces include payment, billing, checkout, subscriptions, invoices,
DNS, deployment, secrets, production data, Webflow production, Cloudflare
production Workers, R2 production objects, provider settings, account schema,
RLS, migrations, production account data, GitHub workflows, CODEOWNERS, and
public paid beta launch claims.

Payment, billing, checkout, subscriptions, invoices, DNS, deployment, secrets,
production data, Webflow production, Cloudflare production Workers, R2
production objects, provider settings, account schema, RLS, migrations, and
production account data are hard-blocked in v1. Public paid beta launch remains
blocked unless explicit owner-approved gate evidence is supplied.

PR #121 remains stale/open/not-mergeable risk. The queue surfaces it as a stale
warning for other PRs and marks it stale when PR #121 itself is summarized
without refreshed mergeability evidence.

## Safety Boundary

Implementation code does not create branches, PRs, issues, comments, labels,
merges, status checks, auto-merge actions, GitHub API calls, or `gh` calls. It
does not mutate roadmap or backlog inputs.

This PR readiness queue does not implement Dashboard v2, Review v2, Saved
Library v2, Packs v2, Pricing/Paywall v2, runtime UI changes, account sync,
payment, billing, public beta launch, or auto-merge.
