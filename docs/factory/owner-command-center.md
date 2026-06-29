# Owner Command Center Planner

The Owner Command Center planner is a pure, deterministic review-packet
contract for the Visual Lexicon autonomous factory.

It accepts explicit roadmap, PR, CI, validation, release-evidence, changed-file,
risk, owner-approval, and option inputs. It returns a structured owner command
packet that helps the owner decide what to do next.

The planner does not:

- create branches, issues, PRs, comments, labels, status checks, or merges;
- call GitHub, `gh`, Webflow, Cloudflare, DNS, payment, billing, deployment, or
  provider APIs;
- update roadmap task statuses;
- implement FCT-070 or ACC-010;
- enable auto-merge or live mutations.

`dryRun` is always forced to `true`, `liveGitHubMutations` is always forced to
`false`, and `autoMergeEnabled` is always forced to `false`.

Current factory boundary:

- `G0_FACTORY_READY` is complete only when FCT-010 through FCT-060 are verified
  with explicit merge evidence.
- FCT-070 remains deferred.
- ACC-010 remains `blocked_human` and is surfaced as an owner decision item.
- If no safe ready task exists, the packet recommends owner-directed next-track
  selection instead of guessing.

Unknown, missing, ambiguous, stale, unsafe, unsupported, or no-op-only evidence
fails closed.
