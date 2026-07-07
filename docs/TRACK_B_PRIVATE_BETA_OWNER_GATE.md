# Track B Private Beta Candidate Owner Gate

Date: 2026-07-07 KST

## Executive Summary

This owner gate consolidates the current Track B evidence after #180. It records
that Track B is a private/manual beta candidate for owner review only.

Verdict:

- P0 blocker count: `0` based on the current docs and regression evidence.
- Private/manual beta is a conditional owner-gated candidate only.
- Public paid beta remains No-Go.

This document does not launch private/manual beta, invite users, collect
payment, grant paid access, add entitlement behavior, or unblock public paid
beta.

## Why This Follows #180

#180 aligned the app-side extension save entry point with the existing
Save -> Review loop. That closed the most recent edge in the local learning
loop: words found outside the app can land in saved words and New review state
without creating fake events, fake daily stats, fake Weak state, fake Mastered
state, checkout, billing, payment, or entitlement behavior.

The correct next step is not launch. The correct next step is an owner gate that
summarizes what is real, what remains planned, what risk level remains, and
what the owner must explicitly approve before any controlled private/manual
beta use.

## Current Track B Capability Inventory

| Capability | Evidence | Current status |
| --- | --- | --- |
| Dashboard Today Memory Mission | `docs/DASHBOARD_V3_TODAY_MEMORY_MISSION.md` | Real local dashboard priority: Due, Weak, New saved, then save/start actions from real state. |
| Review Session Focus Mode | `docs/TRACK_B_REVIEW_SESSION_V2.md`, review v3 tests | Real one-card active recall flow; review answers write SRS state, events, and daily stats. |
| Saved Library Memory Queue | `docs/SAVED_LIBRARY_V3_MEMORY_QUEUE.md` | Real local queue; Due, Weak, New, Learning, and Mastered derive from saved/review evidence. |
| Packs 30-Day Plan Surface | `docs/PACKS_V3_30_DAY_PLAN_SURFACE.md` | Real Academic preview path; pack progress comes only from explicit action or real review evidence. |
| Pricing / Paywall Outcome Copy | `docs/TRACK_B_PRICING_PAYWALL_V2.md`, v3 copy tests | Interest-only surface; no checkout, billing, payment, subscription, or paid entitlement. |
| Accessibility / Performance Release Gate | `docs/TRACK_B_ACCESSIBILITY_PERFORMANCE_RELEASE_GATE.md` | Route smoke, named controls, performance, and safety guard evidence; not a launch gate. |
| Analytics Learning Funnel Dashboard | `docs/TRACK_B_ANALYTICS_LEARNING_FUNNEL_DASHBOARD.md` | Local read-only readiness snapshot; no analytics SDK, tracking pixel, or network reporting. |
| Beta Readiness Audit | `docs/TRACK_B_V3_BETA_READINESS_AUDIT.md` | Private/manual beta candidate for owner review only; public paid beta No-Go. |
| Manual QA Execution Report | `docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md` | P0 count `0`; manual QA passed with notes and did not launch beta. |
| Placeholder / Planned Beta Copy | `docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md` | P0 unsafe paid-access copy count `0`; owner-gated and public No-Go wording preserved. |
| Keyboard QA Follow-up | `docs/TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md` | P0 count `0`; focused keyboard checks passed; full sequential Tab remains owner manual signoff. |
| Exam Pack Content v1 | `docs/TRACK_B_EXAM_PACK_CONTENT_V1.md` | Academic active starter preview; IELTS/GRE preview-only planned paths from current static words. |
| Extension Save -> Review Loop Alignment | `docs/TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md` | `/save?slug=dissonance&source=extension` creates or preserves saved word and New review state. |

## Evidence From #175 Through #180

| PR | Evidence document | Owner-gate interpretation |
| --- | --- | --- |
| #175 | `docs/TRACK_B_V3_BETA_READINESS_AUDIT.md` | Track B had enough local evidence for owner-run manual QA, not public paid beta. |
| #176 | `docs/TRACK_B_V3_MANUAL_QA_EXECUTION_REPORT.md` | Save, review, events, daily stats, packs, pricing, mobile, keyboard smoke, and safety checks found P0 count `0`. |
| #177 | `docs/TRACK_B_PLACEHOLDER_PLANNED_BETA_COPY_AUDIT.md` | Runtime copy keeps pricing, planned packs, and paywall prompts interest-only and owner-gated. |
| #178 | `docs/TRACK_B_V3_KEYBOARD_QA_FOLLOW_UP_REPORT.md` | Keyboard follow-up found P0 count `0`, with owner human sequential Tab signoff still required. |
| #179 | `docs/TRACK_B_EXAM_PACK_CONTENT_V1.md` | Exam packs have honest real-vs-planned status; IELTS/GRE do not claim full pack readiness. |
| #180 | `docs/TRACK_B_EXTENSION_SAVE_REVIEW_LOOP_ALIGNMENT.md` | Extension-source saves can enter the app-side local review loop without extension rewrite or fake progress. |

## Route Inventory

| Route | Current owner-gate status |
| --- | --- |
| `/dashboard` | Present. Today Memory Mission reads local state and does not create fake review progress on load. |
| `/saved` | Present. Saved Library reads saved/review evidence and supports memory queue tabs. |
| `/save?slug=dissonance&source=word_page` | Present. Word-page source save creates or preserves saved word and New review state. |
| `/save?slug=dissonance&source=extension` | Present. Extension source save creates or preserves saved word and New review state. |
| `/review` | Present. Default focused review route. |
| `/review?mode=saved` | Supported by the review page. Reviews saved words from local state. |
| `/review?mode=due` | Supported by the review page. Due queue comes from `nextDueAt` evidence. |
| `/review?mode=weak` | Supported by the review page. Weak queue comes from real Weak, wrong, or `weakScore` evidence. |
| `/review?mode=word&slug=dissonance` | Supported by the review page. Focused word review for current static word data. |
| `/packs` | Present. Pack catalog and 30-day plan surface. |
| `/packs/academic-vocabulary` | Present. Active Academic starter preview. |
| `/packs/ielts-writing-vocabulary` | Present. Preview-only planned IELTS path. |
| `/packs/gre-visual-verbal` | Present. Preview-only planned GRE path. |
| `/pricing` | Present. Interest-only pricing/paywall outcome surface. |
| `/settings` | Present. Local diagnostics/settings surface; no billing or paid entitlement. |

Forbidden checkout, billing, payment, and payments route directories remain out
of scope and must stay absent.

## LocalStorage Inventory

| Key | Current role | Owner-gate rule |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records. | Save creates or preserves records and matching review state. |
| `vlx_review_state_v1` | Local SRS memory state. | Due, Weak, Mastered, box, next due, and weak score must come from real state. |
| `vlx_review_events_v1` | Review answer events. | Written by committed review answers only, not by page load or save alone. |
| `vlx_daily_stats_v1` | Daily review rollup. | Updated by review answers, not fake dashboard or pack views. |
| `vlx_pack_progress_v1` | Pack preview/review progress. | Written only by explicit preview action or real pack review evidence. |
| `vlx_plan_state_v1` | Local plan/read-model skeleton. | Not paid access, not subscription proof, and not an entitlement source. |
| `vlx_upgrade_interest_v1` | Local upgrade-interest records. | Interest-only attribution; does not grant paid access. |
| `vlx_pending_home_quiz` | Optional transition key. | May exist only as an MVP transition helper, not an SRS or mastery replacement. |

## Pack Content Status

Academic Vocabulary is the active starter preview backed by current static
Academic word data and the existing safe review route:

```txt
/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview
```

IELTS Writing and GRE Visual Verbal show preview-only content v1 from current
static words. They do not expose full-pack access, pack-specific review CTAs,
full 30-day schedules, checkout, billing, payment, entitlement, or public paid
beta behavior.

## Extension Save -> Review Status

The app-side extension path is real:

```txt
/save?slug=dissonance&source=extension
```

It resolves the current static word, writes `vlx_saved_words_v1`, creates or
preserves a New review item in `vlx_review_state_v1`, and preserves extension
source metadata when first saved from that source.

It does not rewrite the Chrome extension, package an extension, publish an
extension, create review events on save, create daily stats on save, create Weak
or Mastered state on save, create upgrade interest, create plan state, or add
production data behavior.

## Accessibility/Performance/Keyboard/Manual QA Status

- Accessibility/performance: scoped route smoke, named controls, no heavy new
  runtime dependency, and public paid beta safety copy are guarded.
- Keyboard: focused primary CTA, review answer, confidence, saved, packs,
  pricing, and settings/paywall controls are covered. Full sequential Tab
  traversal remains a human owner signoff item.
- Manual QA: #176 recorded P0 count `0` and passed the Save -> Review -> Events
  -> Daily Stats -> Packs -> Pricing path with notes.
- Visual parity: screenshot parity remains required release evidence; baselines
  must not be rewritten without explicit review.

## Real Vs Planned Summary

Real now:

- Local Save -> Review -> Events -> Daily Stats loop.
- Due, Weak, New, Learning, Strong, and Mastered derivation from local SRS
  state and review evidence.
- Dashboard Today Memory Mission from real local state.
- Saved Library memory queue from real saved/review evidence.
- Academic pack preview and explicit pack progress.
- IELTS/GRE preview-only static content.
- Pricing/paywall local upgrade-interest capture.
- Local analytics readiness snapshot.
- App-side extension source save path.

Planned, not live:

- Private/manual beta launch.
- Public paid beta.
- Account sync and server-side SRS source of truth.
- Production analytics/monitoring.
- Billing, checkout, payment, subscription, invoice, billing portal, real paid
  entitlement, or entitlement enforcement.
- Full IELTS/GRE pack content and pack-specific review routes.
- Chrome extension rewrite or distribution.
- AI mistake explanations, no-watermark export, and multilingual page
  expansion.

## P0/P1/P2 Risk Summary

P0:

- Count: `0` based on current evidence.
- No current evidence shows broken save-to-review creation, broken review event
  creation, broken daily stats updates, fake Mastered state, fake pack progress,
  checkout/payment/billing routes, payment SDKs, analytics SDKs, tracking
  pixels, real paid entitlement, private/manual beta launch, or public paid beta
  unblock.

P1:

- Owner human keyboard signoff remains required for full sequential Tab
  traversal.
- Support, refund, privacy, manual entitlement policy, invite language,
  rollback/pause rules, and owner signoff remain required before any controlled
  private/manual beta use.
- Account sync, server-side SRS, production analytics/monitoring, billing,
  entitlement, and production operations remain blockers for public paid beta.
- IELTS/GRE content depth remains preview-only and must not be represented as
  full exam-pack content.
- Real extension E2E remains required before extension distribution readiness.

P2:

- Continue visual polish and screenshot parity checks.
- Expand exam pack content only with vetted real content.
- Add AI mistake explanations only after the SRS loop and safety gates remain
  stable.
- Plan future account sync/server SRS migration without breaking local storage
  contracts.

## Owner Approval Checklist

Owner must explicitly confirm all of the following before any private/manual
beta invite or payment request:

- [ ] Current branch evidence and validation results are acceptable.
- [ ] P0 blocker count remains `0`.
- [ ] Human sequential keyboard traversal is acceptable.
- [ ] Support, refund, privacy, local-state limitation, and rollback/pause
      language are approved.
- [ ] Manual entitlement policy is approved for any non-public beta handling.
- [ ] Invite language clearly says owner-gated and does not promise public paid
      access.
- [ ] No checkout, billing, payment, subscription, invoice, billing portal, real
      paid entitlement, analytics SDK, tracking pixel, production data behavior,
      Webflow, Cloudflare Worker, DNS, deployment, or auth change is included.

## Private/Manual Beta Recommendation

Recommendation: **conditional private/manual beta candidate, owner-gated only**.

Current evidence supports owner review of a controlled private/manual beta
candidate if validation remains green and the owner checklist is explicitly
approved. This is not a launch decision, not a self-serve beta, not a public
offer, and not a paid-access grant.

## Public Paid Beta Recommendation

Recommendation: **Public paid beta remains No-Go**.

Public paid beta remains blocked until account sync, server-side SRS,
production analytics/monitoring, privacy/legal, accessibility, support, refund,
rollback, billing/payment/checkout, entitlement enforcement, production
operations, content readiness, and owner launch gates are separately completed
and approved.

This document must not be interpreted as a public paid beta unblock.

## Safety Boundaries

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, Chrome
extension rewrite, private/manual beta launch, or public paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake pack progress, fake paid access, real paid entitlement, or public paid beta
launch behavior are part of this owner gate.

`npm audit fix` was not run.

## Next Expansion Plan

1. Keep this PR documentation-and-tests only.
2. Re-run required validation and record failures honestly.
3. If owner approval is granted later, create a separate owner decision record
   with invite, support, privacy, refund, manual entitlement, rollback, and
   pause rules.
4. Before any public paid beta work, complete account sync, server-side SRS,
   production analytics/monitoring, billing/entitlement architecture, privacy,
   support, refund, rollback, accessibility, production operations, and content
   readiness gates in separate explicitly approved PRs.
5. Preserve local storage key contracts during any future migration.
