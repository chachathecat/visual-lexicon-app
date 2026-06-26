# Track B Release Blockers Register

This register is the human-readable P0 summary for Visual Lexicon Track B
Production v1.

The machine-readable task source is:

- `docs/roadmap/vlx-autonomous-factory-roadmap.v1.json`

The product and release sequence source is:

- `docs/VLX_REVENUE_AUTONOMOUS_FACTORY_MASTER_PLAN_V1.md`

A blocker is closed only when every required roadmap task is `verified`.
`merged`, placeholder workflow success, local mock state, or documentation alone
does not close a runtime blocker.

## Current Baseline

| Area | Current truth | Evidence |
| --- | --- | --- |
| Auth principal | Done | PR #112 |
| Minimal Magic Link session | Done | PR #113 |
| Entitlement domain core | Done | PR #114 |
| Entitlement read model | Done, read-only | PR #115 |
| Agent/control-plane skeleton | Done | PR #116 |
| Safe no-op reconciliation | Done | PR #120 |
| Write-capable AI factory | Not implemented | `FCT-010` through `FCT-060` |
| Account-owned learning data | Not implemented | `ACC-*` |
| Usage ledger | Not implemented | `USG-010` |
| Protected clean asset delivery | Not implemented | `AST-*` |
| Billing runtime | Not implemented | `BIL-*` |
| Public paid product | No-Go | `G1` and later gates |

## Production P0 Blockers

| Blocker ID | Description | Required roadmap area | Status |
| --- | --- | --- | --- |
| TB-P0-01 | Activate a truthful, human-gated autonomous PR factory | `FCT-010`–`FCT-060` | Open |
| TB-P0-02 | Persistent learning schema, migrations, indexes, and RLS | `ACC-010` | Open |
| TB-P0-03 | Server persistence and account sync | `ACC-020`–`ACC-040` | Open |
| TB-P0-04 | Cross-device conflict resolution and trusted retention events | `ACC-050`–`ACC-060` | Open |
| TB-P0-05 | Canonical clean-download credit products and grant resolution | `COM-010`–`COM-020` | Open |
| TB-P0-06 | Server-authoritative usage ledger | `USG-010` | Open |
| TB-P0-07 | Asset rights, derivatives, private gateway, and leak protection | `AST-010`–`AST-050` | Open |
| TB-P0-08 | Payment-provider decision and test-mode adapter | `BIL-010`–`BIL-020` | Open |
| TB-P0-09 | Idempotent webhooks and one-time purchase lifecycle | `BIL-030`–`BIL-045` | Open |
| TB-P0-10 | Subscription lifecycle, portal, cancellation, and downgrade | `BIL-050`–`BIL-060` | Open |
| TB-P0-11 | Truthful pricing, credit meter, upgrade flow, and paid analytics | `COM-030`, `REV-*` | Open |
| TB-P0-12 | Account-backed Lite and Pro feature enforcement | `LRN-*` | Open |
| TB-P0-13 | Grounded, metered, evaluated Pro AI mistake explanation | `AI-*` | Open |
| TB-P0-14 | Monitoring, legal, support, privacy, QA, and rollback | `OPS-010`, `LEG-010`, `QA-010` | Open |
| TB-P0-15 | Owner-approved staged launch and Production v1 sign-off | `REL-*` | Open |

## Release Gates

| Gate | Meaning | Status |
| --- | --- | --- |
| `G0_FACTORY_READY` | Factory can produce and validate bounded draft PRs truthfully | No-Go |
| `G1_PAID_BETA_READY` | Account, assets, usage, billing, support, monitoring, QA pass | No-Go |
| `G2_DOWNLOAD_CREDITS_PUBLIC` | KRW 3,900 / USD 2.99 and KRW 6,900 / USD 5.99 credit packs may launch | No-Go |
| `G3_LITE_PUBLIC` | Lite subscription and cross-device learning may launch | No-Go |
| `G4_PRO_AI_PUBLIC` | Pro HD/batch/AI may launch | No-Go |
| `G5_TRACK_B_PRODUCTION_V1` | Finish line and owner sign-off pass | No-Go |

## Update Rules

- The release guard proposes status changes in the same PR that adds evidence.
- High-risk blocker closure requires owner approval.
- A task is not `verified` until required runtime, migration, provider, or
  production evidence exists.
- No agent may mark a blocked task ready by deleting dependencies.
- If the roadmap and this summary disagree, the roadmap task state is used and
  this table must be reconciled immediately.
- Public checkout remains disabled while `G1_PAID_BETA_READY` is No-Go.
