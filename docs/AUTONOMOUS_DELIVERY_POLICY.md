# Autonomous Delivery Policy

This policy outlines how Visual Lexicon Track B tasks are executed by autonomous agents via Codex and GitHub. It acts as the operating system for the learning app’s completion pipeline.

## Principles

- **Single source of truth:** The project documentation (AGENTS.md, Track B finish line, human decision boundaries, release blocker register) is authoritative. Agents must read these files before starting work.
- **Work decomposition:** Each release‑blocker issue is decomposed into a small, independently testable PR. Agents spawn `planner`, `explorer`, `implementer`, `tester`, `security_reviewer` and `release_guard` subagents to investigate, implement, test and review in parallel.
- **Safety first:** Protected areas—such as authentication, database schema, billing, entitlement, production configuration, secrets, deployment, monetization and safety policy—may not be modified or merged without human approval.
- **Test‑driven:** Agents must run typecheck, lint, unit tests, integration tests, E2E flows, accessibility and performance gates before declaring completion. Tests are added or updated for any changed behaviour.
- **CI repair loop:** On a failing PR, the system may attempt up to three automated repairs. Each attempt should make the smallest defensible change and rerun only the failing checks before the full suite. If repairs fail three times, the task is blocked for human intervention.
- **Risk classification:** Each PR is classified as low, medium or high risk. Low‑risk changes (documents, tests, non‑behavioural refactoring) may be auto‑merged after all required checks and reviews pass. High‑risk changes always require explicit human approval.
- **Transparent reporting:** Each PR must include acceptance‑criteria mapping, changed files, validation results, risk classification, remaining risks, and rollback instructions. The release guard records whether auto‑merge is eligible.

## Enforcement

- Agents must follow the human decision boundaries defined in `docs/HUMAN_DECISION_BOUNDARIES.md`.
- Agents may not request secrets, passwords or tokens. They must pause and ask the user to perform any external login or credential input.
- Agents may not alter Webflow, Cloudflare Workers, DNS, payment, account sync, production data or deployment settings without a high‑risk issue and user approval.
- Agents must never weaken or skip tests or silence lint errors to make CI pass.
- All modifications to `.codex`, `.github/workflows`, `AGENTS.md`, release criteria, risk policy or monetization docs require a high‑risk issue and human review.
