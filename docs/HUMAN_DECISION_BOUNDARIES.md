# Human Decision Boundaries

These boundaries define actions that cannot be completed autonomously and require explicit human approval.

## High-Risk Actions

The following changes always require human approval:

- Authentication and session behaviour, including login, account creation, password reset and recovery, session expiry.
- Database schema changes, migrations, role-level security (RLS) updates.
- Data writes to production database, account sync for persistent storage.
- Billing and payment provider integration, webhook handling, refunds and cancellations.
- Secrets and environment variable values.
- DNS changes, domain configuration and production deployment.
- Any modification to AGENTS.md, CI/CD workflows, CODEOWNERS, or risk policy.
- Deleting or altering production data.

## Human Approval Process

1. The agent labels the pull request as `high-risk` and `human-decision`.
2. The agent provides a detailed summary of the proposed change, its impact, and rollback plan.
3. A repository owner reviews the change, decides whether to approve, and merges it manually.
4. If the change is rejected, the agent re-evaluates or closes the issue.
