# AGENTS.md - Visual Lexicon Learning App

## Project Goal

You are working on Visual Lexicon Track B, the paid learning app for
`app.visuallexicon.org`.

Visual Lexicon turns difficult words users meet online into visual memory cards,
then reviews them before they forget.

Track A is the public discovery layer on `visuallexicon.org` and Webflow. Track
B is the Next.js learning app. Build Track B without breaking Track A.

## North Star

Weekly Reviewed Words.

The product succeeds when learners actually review words each week. Saved words,
traffic, pack previews, and upgrade interest matter only when they support
repeat review behavior.

## Core Formula

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Commands

Use these validation commands before finishing work:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
```

If a script is missing or a command fails, report it honestly. Do not claim a
check passed unless it actually ran.

For local development:

```powershell
npm.cmd run dev
```

For browser QA, the docs and tests commonly use:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3006
```

## Product Principles

- Save is not enough; saved words must become review items.
- Review is not enough; answers must write events and update memory state.
- Memory state is the moat.
- Due, Weak, and Mastered must come from real review state.
- Do not fake mastery, pack progress, dashboard metrics, or streaks.
- Do not use random easy distractors as the main quiz method.
- Keep review short, focused, and built around active recall.
- AI comes later, first as wrong-answer mistake explanation after the SRS loop
  works.
- The UI should feel calm, premium, minimal, warm, credible, and
  learning-focused.
- Dashboard priority is Today Memory Mission, then Start Review, Practice Weak
  Words, and Continue Deck. Saved Library should support the learning loop, not
  dominate it.

## Engineering Principles

- Prefer existing app patterns over new abstractions.
- Keep PRs small and scoped to the requested behavior.
- Do not add large route groups without approval.
- Keep Track B separate from Webflow and production infrastructure.
- Use structured pack, review, and SRS contracts instead of ad hoc state.
- Preserve local storage key contracts.
- Add or update tests when runtime behavior changes.
- Update docs when routes, storage keys, safety boundaries, or product contracts
  change.

## Approved Initial App Routes

Create or maintain these routes:

```txt
/
/dashboard
/saved
/review
/review/due
/review/weak
/packs
/packs/[packId]
/word/[slug]
/pricing
/settings
```

Do not add large new route groups without approval.

## Approved Local Storage Keys

Use these exact keys for the localStorage MVP:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
```

Optional transition key:

```txt
vlx_pending_home_quiz
```

Do not invent competing SRS or mastery storage keys.

## Required Review State Fields

Each reviewed or saved word must be representable as:

```ts
{
  slug: string;
  word: string;
  image?: string;
  hub?: string;
  box: number;
  mastery: "New" | "Learning" | "Weak" | "Strong" | "Mastered";
  correct: number;
  wrong: number;
  streakCorrect: number;
  lastReviewedAt?: string;
  nextDueAt?: string;
  weakScore: number;
  avgResponseMs?: number;
  lastQuestionType?: string;
}
```

## Required Review Event Fields

Each review answer must create an event shaped like:

```ts
{
  sessionId: string;
  slug: string;
  word: string;
  hub?: string;
  questionType: string;
  selected?: string;
  answer: string;
  result: "correct" | "wrong";
  responseMs: number;
  createdAt: string;
  boxAfter: number;
  weakScoreAfter: number;
}
```

## VLX 5-Box SRS Rules

- Box 0: New or failed. Due soon or again in-session.
- Box 1: First recall. Due in 1 day.
- Box 2: Stable. Due in 3 days.
- Box 3: Strong. Due in 7 days.
- Box 4: Mastering. Due in 14 days.
- Box 5: Mastered. Due in 30 days.

Update rules:

- Correct plus fast plus no hint: box +1.
- Correct but slow: keep box or apply only small improvement.
- Correct but guessed: keep box.
- Wrong: box -1 or box 0.
- Wrong answers come back sooner.
- Repeated mistakes increase weakScore.
- Do not mark a word as Mastered unless it has passed delayed recall.

## Forbidden Actions

Do not:

- Touch Webflow or publish Webflow changes.
- Touch Cloudflare production Workers.
- Change billing, DNS, payment settings, auth, deployment settings, secrets, or
  production user data.
- Delete or mass-edit Webflow CMS items.
- Delete R2 objects or mutate production pack data.
- Add real payment, checkout, subscription, invoice, billing portal, or payment
  SDK unless explicitly authorized.
- Ask for secrets, API keys, passwords, tokens, or billing credentials.
- Expose API tokens in frontend code.
- Call Webflow CMS directly from the browser.
- Add AI Tutor functionality before the SRS loop works.
- Add multilingual page generation during paid beta hardening.
- Run `npm audit fix` unless explicitly requested and scoped.

## Definition Of Done

For runtime PRs:

- Save creates or preserves review state.
- Review answers create events and update state.
- Due, Weak, and Mastered are derived from real state.
- Tests cover changed contracts.
- Manual QA notes identify the golden flows checked.
- Risk, rollback, and safety notes are included.

For documentation-only or agent-ops PRs:

- No runtime behavior changes.
- New docs are linked from README when useful.
- Validation commands are run or failures are reported.
- Safety confirmation states that Webflow, Cloudflare Workers, auth, billing,
  DNS, payment, secrets, production data, and deployment settings were not
  touched.

## Safe Approval Rules

Stop and ask for explicit approval if a task requires:

- Webflow publishing.
- Cloudflare production Worker changes.
- DNS changes.
- Payment, Paddle, Stripe, billing, invoice, checkout, or subscription changes.
- Production user data modification.
- Deleting R2 objects.
- Deleting CMS items.
- Exposing, moving, or requesting secrets.
- Changing login or authentication behavior.

If approval is not explicit, keep the work local to Track B app code, docs,
tests, and safe mock/static data.

## Operating Docs

Use these docs when planning, reviewing, or releasing work:

```txt
docs/world_class_bar.md
docs/product_quality_rubric.md
docs/golden_user_flows.md
docs/code_review.md
docs/security_and_permissions.md
docs/release_checklist.md
docs/BETA_READINESS_AUDIT.md
docs/PAID_BETA_MANUAL_QA.md
PLANS.md
```
## Track B Monetization Canonical Sources v1

Canonical sources:

- `docs/monetization/v1/VLX_Track_B_Monetization_Master_Spec_v1.0.md`
- `docs/monetization/v1/vlx-plan-entitlements.v1.json`
- `docs/monetization/v1/plan-catalog.v1.ts`
- `docs/monetization/v1/VLX_Codex_Track_B_Master_Prompt_v1.0.md`

Precedence:

1. `vlx-plan-entitlements.v1.json` is authoritative for numeric prices,
   limits, plan capabilities, promotions, and lifecycle values.
2. `VLX_Track_B_Monetization_Master_Spec_v1.0.md` is authoritative for
   product principles, implementation order, security, and safety boundaries.
3. Existing repository safety rules remain binding.
4. Any mismatch between UI, server authorization, and the canonical JSON
   blocks release until reconciled.

Public paid beta remains No-Go until all required account sync, monitoring,
privacy, accessibility, support, refund, and rollback gates pass.