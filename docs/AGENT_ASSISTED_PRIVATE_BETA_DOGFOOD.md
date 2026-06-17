# Agent-Assisted Private Beta Dogfood Report

Report date: 2026-06-17 KST  
Repository: `chachathecat/visual-lexicon-app`  
Branch: `release/agent-assisted-private-beta-dogfood`  
PR: `#92 Agent-assisted private beta dogfood report`  
Scope: Track B zero-user agent-assisted private beta dogfood.

## Executive Summary

Agent-assisted dogfood completed a zero-user simulation of the Track B learning
journey. The review covered public entry expectations, save-to-review behavior,
dashboard review priority, due/weak routes, Saved, Packs, academic pack detail,
and Pricing.

This supports proceeding to a tightly controlled owner-run Batch 1 invite, with
fresh owner smoke before the first invitation. Public paid beta remains **No-Go**.

## Current Verdicts

- Owner-controlled private beta: **Proceed / Conditional Manual Launch**
- Public paid beta: **No-Go**
- Real participant validation: **Not Started**
- Agent-assisted dogfood: **Completed**

## Warning

Agent dogfood does not replace real user beta validation. It must not be counted
as invitations, acceptances, retention, payment intent, real user comprehension,
or private beta execution evidence.

## Tested Personas

- Korean academic vocabulary learner
- IELTS/GRE vocabulary learner
- casual user from public word page
- returning saved-word learner

## Journey Checks

| Journey | Dogfood expectation | Result |
| --- | --- | --- |
| public entry expectation | Entry points toward saving and reviewing words without implying public beta access. | agent pass |
| `/dashboard` | Today Memory Mission prioritizes review, weak words, and deck continuation from real state. | agent pass |
| `/save?slug=dissonance&source=word_page` | Save creates or preserves review state and points to active recall. | agent pass |
| `/review` | Review feels like active recall and writes review events plus memory state. | agent pass |
| `/review/due` | Due derives from `nextDueAt`, not a fake queue. | agent pass |
| `/review/weak` | Weak derives from weakScore, mistakes, and review state. | agent pass |
| `/review/weak-sprint` | Weak sprint shares the same review state and event contracts. | agent pass |
| `/saved` | Saved supports the review loop and does not fabricate mastery. | agent pass |
| `/packs` | Packs feel like guided learning plans that feed save and review behavior. | agent pass |
| `/packs/academic-vocabulary` | Academic pack detail frames a coherent guided plan without fake progress. | agent pass |
| `/pricing` | Pricing sells learning outcomes while staying honest that no fake checkout or paid access exists. | agent pass |

## Comprehension Checks

- Does the primary CTA make sense? Agent read: yes, with real user validation
  still required.
- Does the user understand saved words become review cards? Agent read: yes,
  but Batch 1 must verify.
- Does review feel like active recall? Agent read: yes, with no claim of real
  answer behavior.
- Does feedback explain memory-state consequences? Agent read: watch item for
  real participant confusion.
- Does Saved feel like a review queue? Agent read: yes, but real comprehension
  remains unvalidated.
- Do Packs feel like guided learning plans? Agent read: yes, with no claim of
  pack completion.
- Does Pricing sell outcomes rather than quotas? Agent read: watch item for
  Batch 1.

## Monetization Checks

- Free value clarity: pass for local save/review value without fake paid access.
- Lite habit value clarity: pass for habit and Weekly Reviewed Words framing.
- Pro exam/weak-word value clarity: pass for exam and weak-word recovery value.
- no-watermark/export as supporting value: watch; keep it secondary to learning
  outcomes.
- no fake checkout: pass. No checkout, billing portal, invoice, subscription, or
  payment SDK is introduced.
- no fake paid access: pass. No automatic entitlement or paid state is granted.

## Zero-User Honesty Rules

| Field | Current value |
| --- | --- |
| invitedParticipantCount | `0` |
| acceptedParticipantCount | `0` |
| paymentConfirmedCount | `0` |
| manualEntitlementRecordedCount | `0` |
| realInvitationsSent | `false` |
| realParticipantValidationStarted | `false` |
| retentionClaimed | `false` |
| paymentIntentClaimed | `false` |
| realUserComprehensionClaimed | `false` |
| privateBetaExecutionStarted | `false` |

Do not claim retention, payment intent, real user comprehension, or private beta
execution from this report.

## localStorage Probe Checklist

All storage checks are redacted key-shape checks only. Do not commit raw storage
dumps.

| Key | Expected use | Probe question |
| --- | --- | --- |
| `vlx_saved_words_v1` | Saved word records by slug for the local MVP. | Does saving dissonance create or preserve a saved word without raw storage dumps? |
| `vlx_review_state_v1` | SRS memory state for saved and reviewed words. | Do Due, Weak, and Mastered derive from review state instead of fake UI labels? |
| `vlx_review_events_v1` | Review answer event records. | Does answering review create a redacted event shape without payment or identity data? |
| `vlx_daily_stats_v1` | Local daily review activity counters. | Do daily stats represent real review actions rather than fabricated streaks? |
| `vlx_pending_home_quiz` | Optional transition key only. | Does the transition key avoid replacing SRS state or granting paid access? |

## Console / Hydration Smoke Checklist

- Status: **Ready to Run**
- Expected console error count: `0`
- Expected hydration warning count: `0`
- Actual counts recorded by this report: `false`
- Routes to smoke before first real invite: `/dashboard`, `/review`, `/saved`,
  `/packs`, `/pricing`
- Owner requirement: run fresh browser smoke on a clean local port immediately
  before real Batch 1 invitations.

## Issue Log Entries

- P0: Public paid beta remains No-Go. Accepted for manual private beta, blocks
  public paid beta.
- P0: Real participant validation is Not Started. Accepted for manual private
  beta, blocks public paid beta.
- P1: Fresh console/hydration smoke should run immediately before the first
  invite. Watch item.
- P1: Comprehension checks still require real people. Watch item.
- P2: Pricing outcome language should be watched in Batch 1. Watch item.

## P0 / P1 / P2 Findings

### P0

- Public paid beta remains No-Go because dogfood does not add real checkout,
  automatic entitlement, account sync, deployment readiness, or real user
  validation.
- Real participant validation is Not Started and all participant/payment/
  entitlement counts remain zero.

### P1

- Fresh browser console/hydration smoke is ready to run before first invite.
- Real user comprehension, retention, and payment intent remain unvalidated.

### P2

- Watch whether pricing outcome copy maps clearly to habit, exam, and weak-word
  value during Batch 1.

## Recommendation

Recommendation: **Proceed to real Batch 1 invite** through the owner-run manual
private beta path.

Required before the first invite:

- Keep invitedParticipantCount, acceptedParticipantCount,
  paymentConfirmedCount, and manualEntitlementRecordedCount at zero until real
  evidence exists.
- Run fresh owner browser smoke before the first real invite.
- Use redacted issue notes only and keep raw participant, payment, support, and
  provider data out of repo docs.

## Next PR Sequence

- #93 Owner-run invite batch 1 execution log
- #94 24-hour private beta review
- #95 7-day private beta review
- #96 Private beta P0/P1 stabilization, if needed

## Validation Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test -- --workers=1
git diff --check
```

## Safety Confirmation

This PR is docs/contracts/tests only. It does not implement runtime UI changes,
send invitations, send emails, add email provider integrations, add API routes,
add route handlers, add middleware, change auth, add DB/provider SDKs, add
payment, billing, checkout, subscription, entitlement mutation, real account
sync, monitoring SDKs, analytics SDKs, AI calls, env vars, deployment changes,
or production data mutation.

Webflow, Cloudflare Workers, Vercel, DNS, deployment settings, secrets,
production data, payment settings, and billing settings were not touched.
