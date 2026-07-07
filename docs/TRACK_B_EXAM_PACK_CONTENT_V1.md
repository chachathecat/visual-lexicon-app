# Track B Exam Pack Content v1

Date: 2026-07-07 KST

## Executive Summary

Exam Pack Content v1 deepens the Track B pack surface without changing beta
readiness. Academic Vocabulary remains the strongest active starter pack because
it has current static Academic word data and an existing pack-specific review
route. IELTS Writing and GRE Visual Verbal now show preview-only word content
from existing local static fixtures, but they do not expose full-pack access,
pack-specific review, checkout, billing, payment, real entitlement, or public
paid beta launch behavior.

Public paid beta remains No-Go. Private/manual beta remains owner-gated.

## Why This Follows #178

#178 closed the keyboard QA follow-up as `PASS WITH NOTE` for full sequential
Tab traversal and kept public paid beta No-Go. This content pass follows that
state by improving exam pack substance while preserving the same keyboard and
safety boundaries:

- Academic preview CTAs remain the only active exam-pack review entry point.
- IELTS/GRE preview-only pages have real preview words, but no Start/Continue
  review CTA until pack-specific review paths exist.
- Pack page loads remain read-only for `vlx_pack_progress_v1`.
- This PR does not claim private/manual beta launch or public paid beta unblock.

## Pack Content Inventory

| Pack | Route | Runtime status | Preview words | Plan framing |
| --- | --- | --- | --- | --- |
| Academic Vocabulary | `/packs/academic-vocabulary` | Active starter preview | `dissonance`, `obfuscate`, `lucid` | 30-day plan surface with current Academic hub review route |
| IELTS Writing | `/packs/ielts-writing-vocabulary` | Preview-only planned path | `lucid`, `abundance`, `dissonance`, `resilient` | Preview of a planned 30-day IELTS Writing path |
| GRE Visual Verbal | `/packs/gre-visual-verbal` | Preview-only planned path | `obfuscate`, `lucid`, `dissonance`, `resilient` | Preview of a planned 30-day GRE Visual Verbal path |

The preview words are existing static fixture entries with `slug`, `word`,
`definition`, `hub`, `image`, `example`, and `memoryHook` fields. The UI does
not invent day-by-day full schedules beyond the small preview schedules in the
local exam-pack fixture.

## Academic Content Status

Academic Vocabulary stays strongest because it is backed by the current
Academic Vocabulary static hub and the existing safe review route:

```txt
/review?mode=hub&hub=academic-vocabulary&limit=10&packId=academic-vocabulary&source=pack_preview
```

The UI may show Start/Continue preview for Academic. Continue appears only when
real `vlx_pack_progress_v1` evidence exists. Academic word count and preview
count reflect the current static data; no larger full pack is claimed.

## IELTS Preview Content Status

IELTS Writing has preview-only content v1 for argument, evidence, contrast, and
policy/society vocabulary themes. It uses only current static words:

- `lucid`
- `abundance`
- `dissonance`
- `resilient`

Full IELTS Writing pack content is planned, not live. The page does not expose a
Start/Continue review CTA because no pack-specific IELTS review route exists in
this PR.

## GRE Preview Content Status

GRE Visual Verbal has preview-only content v1 for nuance, logic, contrast, and
confusable advanced word themes. It uses only current static words:

- `obfuscate`
- `lucid`
- `dissonance`
- `resilient`

Full GRE Visual Verbal pack content is planned, not live. The page does not
expose a Start/Continue review CTA because no pack-specific GRE review route
exists in this PR.

## What Is Real Vs Planned

Real in this PR:

- Local static exam-pack preview fixtures for IELTS Writing and GRE Visual
  Verbal.
- Preview word cards with definitions, examples, memory cues, images, hub, CEFR,
  difficulty, and part of speech from existing word entries.
- Academic active preview/start/continue behavior from existing pack progress
  and review routing.
- Read-only page load behavior for `/packs` and `/packs/[packId]`.

Planned, not live:

- Full IELTS Writing pack content.
- Full GRE Visual Verbal pack content.
- Pack-specific IELTS/GRE review routes.
- Full 30-day day-by-day schedules for IELTS/GRE.
- Paid entitlements, checkout, billing, subscription, invoice, or billing portal
  behavior.
- Public paid beta.

## P0/P1/P2 Content Risk Summary

P0:

- Count: `0`
- No fake mastery, fake pack progress, fake full IELTS/GRE content, checkout,
  billing, payment, real entitlement, analytics SDK, tracking pixel, private beta
  launch claim, or public paid beta unblock was added.

P1:

- IELTS/GRE preview-only content uses shared static words, so owner review
  should confirm whether the first preview set is the right pedagogical seed
  before broader beta use.
- Full sequential keyboard traversal still needs owner manual signoff from #178
  before private/manual beta signoff.

P2:

- Future content expansion should add richer exam-specific words and clearer
  module/day metadata once the content inventory is real enough to support it.

## Safety Boundaries

No Webflow, Cloudflare Workers, auth, billing, payment, checkout, DNS,
deployment settings, secrets, production data, R2 production objects, real user
data, payment SDK, real entitlement, analytics SDK, tracking pixel, or public
paid beta unblock.

No checkout routes, billing routes, payment routes, subscription behavior,
invoice behavior, billing portal, analytics SDK, tracking pixel, fake mastery,
fake pack progress, fake paid access, private beta launch claim, or public paid
beta launch claim were added.

`npm audit fix` was not run.

## Future Content Expansion Plan

1. Expand IELTS and GRE with vetted exam-specific words from approved static
   content, not generated filler.
2. Add pack-specific review hubs only after the preview words are real and the
   review route can filter honestly.
3. Add fuller 30-day schedules only when day/module assignments are backed by
   actual pack data.
4. Keep progress derived from `vlx_pack_progress_v1`, review state, and review
   events. Do not compute progress from catalog views.
5. Re-run keyboard, visual parity, accessibility/performance, and safety copy
   guards before any owner private/manual beta decision.
