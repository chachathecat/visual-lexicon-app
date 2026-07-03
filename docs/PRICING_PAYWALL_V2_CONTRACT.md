# Pricing / Paywall v2 Contract

Status: contract before runtime implementation.

Scope: Track B pricing, plan positioning, paywall trigger rules, and safe beta
interest capture for the existing app routes. This contract does not authorize
runtime UI implementation in this PR, checkout, billing, subscription logic,
payment SDKs, entitlement grants, account sync, new route groups, Webflow,
Cloudflare Workers, auth changes, DNS changes, deployment setting changes,
secrets, production data, or real user data changes.

North Star: Weekly Reviewed Words.

Pricing / Paywall v2 exists to make the paid habit legible without pretending
payment is connected:

```txt
Visual metaphor -> Active recall -> Mistake record -> Spaced review -> Mastery status -> Paid habit
```

## Product Contract

Pricing / Paywall v2 sells memory outcomes, not raw feature volume. The page and
paywall prompts must explain how each plan supports repeat review behavior.

Required positioning:

| Offer | Required positioning |
| --- | --- |
| Free | Start remembering your first words. |
| Lite | Build a daily visual memory habit. |
| Pro | Fix weak words and prepare for exams. |
| Exam Pack | Guided 30-day visual vocabulary plan. |

The pricing page may describe Free, Lite, Pro, and Exam Pack, but it must not
imply that billing is connected. Exam Pack is an add-on learning plan concept,
not a live purchase flow.

## Billing And Payment Truth

No real payment is connected yet.

Required copy meaning:

- Upgrade actions are beta interest only.
- Upgrade interest capture is allowed only as beta interest / local evidence.
- Local interest capture may preserve the existing safe placeholder behavior,
  such as `vlx_upgrade_interest_v1`, but must not grant access.
- Placeholder external interest URLs may be used only when already configured as
  safe beta interest destinations.
- No checkout, payment link, subscription, invoice, billing portal, payment SDK,
  webhook, paid plan grant, paid entitlement grant, or real payment provider
  integration is part of this contract.

Blocked copy meaning:

- Do not say that a learner has paid access.
- Do not say that billing is connected.
- Do not say that a subscription is active.
- Do not say that a plan was purchased.
- Do not imply that Exam Pack can be bought inside the app.

## Plan Contracts

### Free

Positioning: Start remembering your first words.

Free is the starter memory loop. It should let a learner save the first words,
start active recall, see real review state, and understand what repeats next.

Free must not fake:

- unlimited saved words
- unlimited daily review
- weak-word repair tools
- no-watermark downloads
- mastery export
- AI mistake explanation
- paid plan state

### Lite

Positioning: Build a daily visual memory habit.

Lite is the daily habit plan. It should be framed around expanded saving,
ongoing review, due queues, and sustained recall practice.

Lite must not be framed as exam coaching, AI tutoring, or full Pro diagnostics.
If payment is not connected, Lite CTAs are beta interest only.

### Pro

Positioning: Fix weak words and prepare for exams.

Pro is the repair and exam-prep plan. It should be framed around Weak Sprint,
mastery evidence, Exam Pack access planning, no-watermark download planning,
mastery export planning, and later mistake explanation.

Pro must not claim live AI, live billing, live paid access, or guaranteed exam
outcomes.

### Exam Pack

Positioning: guided 30-day visual vocabulary plan.

Exam Pack is a guided 30-day visual vocabulary plan tied to preview, review,
mistakes, weak repair, and progress from real learning evidence.

Exam Pack may be described as planned paid value, but it must not be treated as
a live purchase. Pack previews must remain honest:

- Pack preview end may trigger Pro or Exam Pack interest.
- Full-pack access remains locked unless a future approved entitlement system
  exists.
- No fake pack progress, fake word counts, fake mastery, or fake full-pack
  unlock is allowed.

## Paywall Trigger Contract

Paywall triggers are product moments where the learner has shown learning
intent. They must be named consistently and tied to real local evidence.

Required trigger IDs:

| Trigger ID | Trigger moment | Recommended framing |
| --- | --- | --- |
| `save_limit` | Free learner reaches the saved-word limit. | Lite helps keep new saved words moving into review. |
| `review_limit` | Free learner reaches the daily review limit. | Lite supports a daily visual memory habit. |
| `pack_preview_end` | Learner finishes a real pack preview. | Pro or Exam Pack interest continues the guided plan. |
| `weak_words_sprint_locked` | Learner has weak words but Weak Sprint is locked. | Pro helps repair words missed in review. |
| `mastery_export_locked` | Learner tries to export mastery evidence. | Pro supports using review history outside the app. |
| `no_watermark_download` | Learner asks for a clean visual download. | Lite/Pro may remove app watermark in a future approved implementation. |
| `mistake_explanation_locked` | Learner wants a wrong-answer explanation. | Pro may add mistake explanations later after the SRS loop works. |

Trigger requirements:

- Every trigger must include a safe `/pricing` comparison path or safe local
  beta interest capture.
- Every trigger must state or preserve the meaning that billing is not
  connected when no safe placeholder URL is configured.
- Triggers must not mutate plan, billing, entitlement, account, review, daily
  stats, pack progress, production, or real user data.
- Triggers must not write review events unless the learner answered in the
  review flow.
- Triggers must not invent Due, Weak, Mastered, progress, streak, or paid state.

## Evidence Rules

Pricing / Paywall v2 may read or reference these existing Track B contracts:

```txt
vlx_saved_words_v1
vlx_review_state_v1
vlx_review_events_v1
vlx_daily_stats_v1
vlx_pack_progress_v1
vlx_upgrade_interest_v1
```

Rules:

- Saved-word limits come from saved-word count evidence.
- Review limits come from real daily review evidence.
- Weak-word prompts come from review state, `weakScore`, or wrong-answer
  history.
- Mastery export prompts come from real delayed-recall mastery evidence.
- Pack preview prompts come from real preview completion evidence.
- No-watermark download prompts come from explicit learner download intent.
- Mistake explanation prompts come from real wrong-answer events.

If evidence is missing, malformed, stale, or unavailable, the implementation
must fail safe with honest copy and no paid-state mutation.

## Beta Gate Contract

Public paid beta remains blocked.

Private/manual beta remains gated.

The blockers remain:

- account sync for saved words, review state, review events, and pack progress
- server-side SRS source of truth and entitlement enforcement
- approved payment provider decision and implementation
- checkout, subscription lifecycle, invoice, billing portal, webhook,
  cancellation, and refund handling
- monitoring, analytics reporting, support, privacy, data portability, rollback,
  accessibility, manual QA, and owner release approval

This contract may support owner review of pricing and paywall scope, but it does
not unblock public paid beta or private/manual beta.

## Safety Boundaries

Required safety:

- Docs/tests only for this contract PR.
- No runtime UI implementation.
- No real payment.
- No checkout route.
- No payment SDK.
- No billing route.
- No subscription, invoice, billing portal, webhook, entitlement grant, paid
  access grant, or payment provider integration.
- No Webflow, Cloudflare Workers, auth, billing, payment, DNS, deployment
  settings, secrets, production data, or real user data changes.
- No AI Tutor functionality.
- No fake mastery, fake weak state, fake due state, fake progress, fake streak,
  fake paid state, or fake Exam Pack access.

## Definition Of Done For Future Implementation PR

A future runtime implementation PR is complete only when:

- Free, Lite, Pro, and Exam Pack copy use the required positioning.
- All trigger IDs are represented consistently.
- Paywall prompts are tied to real local evidence.
- Upgrade interest remains beta interest / local evidence unless a separate
  approved payment PR exists.
- No real payment or billing connection is implied.
- Public paid beta remains blocked.
- Private/manual beta remains gated.
- Tests cover changed runtime contracts.
- Manual QA notes identify pricing, save limit, review limit, pack preview end,
  weak sprint locked, mastery export locked, no-watermark download, and mistake
  explanation locked flows.
- Risk, rollback, and safety notes confirm forbidden surfaces were not touched.
