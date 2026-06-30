# Next-Task Run Packet Router

The next-task run packet router is a pure deterministic planner for the Visual
Lexicon factory control plane.

It accepts explicit roadmap, Owner Command Center, backlog, PR, CI, blocked
surface, risk-policy, owner-decision, and option inputs. It returns a structured
owner/Codex run packet that can propose one safe next task or explain why no
safe implementation task should be selected.

The router does not:

- create branches, issues, PRs, comments, labels, status checks, or merges;
- call GitHub, `gh`, Webflow, Cloudflare, DNS, payment, billing, deployment, or
  provider APIs;
- update roadmap task statuses;
- implement FCT-070 or ACC-010;
- enable auto-merge or live mutations;
- touch Track B runtime UI.

`dryRun` is always forced to `true`, `liveGitHubMutations` is always forced to
`false`, and `autoMergeEnabled` is always forced to `false`.

Current routing boundary:

- `G0_FACTORY_READY` is treated as complete only when FCT-010 through FCT-060
  are verified and the Owner Command Center packet reports a complete factory
  gate.
- FCT-070 remains deferred and is rejected if supplied as a candidate.
- ACC-010 remains `blocked_human` and is surfaced as an owner decision item.
- PR #121 is surfaced as blocked/stale/not-mergeable unless refreshed evidence
  says otherwise.
- PR #137 merged product/UI readiness evidence can unlock safe Track B
  docs/product planning.
- If no safe implementation task exists, the packet recommends an
  owner-directed docs/audit/readiness task instead of guessing.

Unknown, missing, ambiguous, stale, unsafe, unsupported, or no-op-only evidence
fails closed.
