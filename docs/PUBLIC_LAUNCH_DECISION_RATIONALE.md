# Public Launch Decision Rationale

This document explains why the 2026-06-11 public paid launch decision is
No-Go / Not Yet for production paid SaaS while still recognizing Visual
Lexicon Track B as a strong local/private beta candidate.

Scope: documentation-only rationale for Track B. This does not deploy, change
runtime behavior, add auth, add billing, add analytics SDKs, touch Webflow,
touch Cloudflare Workers, change DNS, change Vercel settings, add environment
variables, add secrets, mutate production data, or change payment behavior.

## Why The Current App Is Strong As A Local/Private Beta Candidate

The current app has the most important local learning loop represented in code:

- Save creates or preserves saved words and review state.
- Review answers create events and update SRS state.
- Due, Weak, and Mastered are derived from review state rather than static
  marketing copy.
- Pack previews and local pack progress avoid fake paid-pack completion.
- Pricing interest capture exists without pretending real checkout exists.
- Extension bridge contracts and multilingual alias search contracts preserve
  important future acquisition paths.
- Validation has repeatedly passed, most recently reported as 81 passed and
  1 skipped.

That is a strong foundation because it protects the product's central behavior:
turn words into reviewable memory items, ask users to recall them, record
mistakes, schedule the next review, and update mastery only from real state.

For a local/private no-payment beta, this is enough to keep learning from
users, improve the SRS loop, polish dashboard priorities, test pack previews,
and validate whether Weekly Reviewed Words increases.

## Why The Current App Is Not Ready For Production Paid SaaS

Production paid SaaS means users can pay, expect durable access, recover their
account, keep progress across devices, receive support, cancel or refund, and
trust that memory state will not disappear.

The current app does not yet have the P0 systems required for that promise:

- Real auth/account persistence is not implemented.
- Server-side saved/review SRS sync is not implemented.
- Cross-device progress is not implemented.
- Billing provider integration is not implemented.
- Server-side entitlement enforcement is not implemented.
- Production deployment/domain verification is not complete.
- Trusted production analytics/reporting is not implemented.
- Support/refund/legal operational copy and owner coverage are not finalized.
- Production staging/smoke QA is not complete.
- Final launch owner, support owner, rollback owner, and billing owner sign-off
  are missing.

Local storage can support an MVP learning loop. It cannot safely carry a public
paid SaaS promise by itself.

## Why Payment Should Not Be Added Before Account Persistence And Server SRS Sync

Payment should come after account persistence and server SRS sync because the
thing users are paying for is not simply access to pages. They are paying for a
habit and a durable memory record.

Adding checkout first would create product and support risk:

- A paying user could lose progress by clearing browser storage, changing
  devices, or using another browser.
- Entitlement could become disconnected from saved words, review events,
  mastery, and pack progress.
- Support could not reliably answer account, access, refund, or data-loss
  issues.
- Billing state could be real while learning state remains local and fragile.
- The product might collect money before it can honor cross-device memory and
  recovery expectations.

The safer order is:

1. Implement account identity and persistence.
2. Implement server-owned saved words, review state, review events, daily stats,
   and pack progress.
3. Validate idempotent review writes, conflict handling, migration, and
   cross-device behavior.
4. Add entitlement snapshots in test mode.
5. Add real billing only after the memory system and account ownership are
   reliable.

## Why Weekly Reviewed Words Remains The North Star

Weekly Reviewed Words is the right North Star because it measures the habit the
product exists to create.

Saved words, traffic, pack previews, pricing interest, and upgrades matter only
when they lead to repeated review. A user who saves many words but never reviews
them is not building durable vocabulary. A user who reviews weekly is engaging
with the core learning loop and creating memory state that can compound.

Production analytics should therefore prioritize:

- Weekly Reviewed Words by active account and cohort.
- Save -> first review conversion.
- First review -> second review conversion.
- Due review completion rate.
- Weak-word recovery.
- Mastered words based on delayed recall.
- Paid conversion and retention only in relation to review behavior.

## Why Memory State Must Remain Truthful

Memory state is the moat. It is also the user's trust record.

Due, Weak, and Mastered must come from real review state. Mastery cannot be a
static badge, a saved-word count, a pack page visit, or a marketing claim. It
must reflect delayed recall and the actual history of correct and wrong answers.

Truthful memory state matters because:

- It decides what the user should review next.
- It records mistakes and weak words instead of hiding them.
- It prevents fake progress from replacing learning.
- It makes support, analytics, and product decisions credible.
- It gives paid users a reason to return each week.

If memory state becomes fakeable or disposable, the app loses the reason users
would trust it with a recurring learning habit.

## Why No-Go Is A Product-Quality Decision, Not A Failure

No-Go is the correct product-quality decision because the current app is doing
the right thing for its stage. It validates the local learning loop without
pretending production systems exist.

The decision protects users from paying before progress is durable, protects the
team from avoidable billing/support incidents, and protects the product promise
that Visual Lexicon is about remembered words rather than checkout conversion.

This is not a rejection of the product. It is a refusal to launch the wrong
product boundary. The next phase should build production foundations in the
right order.

## What Would Change The Decision To Conditional Go

A future Conditional Go could be considered when the core P0 systems are
implemented but a small, explicitly limited beta risk remains.

Minimum conditions:

- Account creation, sign-in, recovery, sessions, and account IDs work in the
  target environment.
- Saved words, review state, review events, daily stats, and pack progress are
  persisted server-side.
- Guest-to-account migration is validated.
- Cross-device SRS behavior is tested.
- Review event writes are idempotent and do not over-advance SRS.
- Entitlement snapshots are account-bound and server-owned.
- Support/refund/legal copy is published with beta caveats.
- Production/staging smoke QA has passed for the limited cohort.
- Stop-sales triggers and rollback owner are named.
- The launch owner explicitly accepts the remaining risk.

Conditional Go should still avoid broad public paid SaaS claims unless the
remaining gaps are narrow, disclosed, owned, and reversible.

## What Would Change The Decision To Go

A future Go would require all P0 systems to be implemented, verified, and owned:

- Real auth/account persistence.
- Server-side saved/review SRS sync.
- Cross-device progress.
- Billing provider integration.
- Server-side entitlement enforcement.
- Production deployment/domain verification.
- Trusted analytics/reporting for Weekly Reviewed Words and launch funnels.
- Support/refund/legal operations.
- Staging and production smoke QA.
- Rollback rehearsal.
- Final launch, support, rollback, billing, auth, SRS sync, analytics, and
  legal/privacy owner sign-off.

The Go decision should be based on verified production behavior, not planning
documents, local-only validation, or pricing interest.
