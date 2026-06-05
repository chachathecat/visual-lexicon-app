# ROADMAP.md — Visual Lexicon Two-Track Build Roadmap

## Strategic Direction

Visual Lexicon now follows a two-track architecture.

## Track A — Public Visual Dictionary

URL:

```txt
visuallexicon.org
```

Role:

- public SEO surface
- Webflow word pages
- vocabulary hub pages
- image-based discovery
- Google Search / Image Search acquisition
- guest advertising
- app conversion CTAs

Track A should stay stable.

Do not overload Webflow with app logic.

Do not keep adding large SRS, dashboard, payment, or account logic to Webflow footer code.

## Track B — Learning App

URL:

```txt
app.visuallexicon.org
```

Role:

- saved words
- review sessions
- SRS
- Due / Weak / Mastered dashboard
- Exam Packs
- language-pair packs
- Lite / Pro monetization
- future AI mistake explanation

This repository is for Track B.

## North Star

Weekly Reviewed Words.

A word only matters when the learner reviews it.

## Product Loop

```txt
Public word page / hub page
→ Save this word / Start review
→ app.visuallexicon.org
→ saved word becomes review item
→ 5-card review
→ review event
→ review state update
→ Due / Weak / Mastered dashboard
→ Lite / Pro conversion
```

## Phase 0 — Repo Foundation

Goal:

Create a clean app repo that can be safely worked on by multiple agents.

Deliverables:

- Next.js / TypeScript project
- AGENTS.md
- ROADMAP.md
- DATA_CONTRACT.md
- base routes
- shared layout
- local dev README

Do not implement:

- auth
- payment
- production Webflow connection
- production Cloudflare changes

## Phase 1 — App Scaffold

Branch:

```txt
feat/app-scaffold
```

Deliverables:

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

Acceptance criteria:

- app runs locally
- route shell exists
- shared visual style exists
- mock cards exist
- empty states exist
- no production dependency required

## Phase 2 — Data Contract / Pack Contract

Branch:

```txt
feat/pack-contract
```

Deliverables:

- `src/lib/packs/types.ts`
- `src/lib/packs/mock-data.ts`
- `src/lib/packs/validators.ts`
- future R2 path contract

Supported pack paths:

```txt
/quiz-pack/manifest.json
/quiz-pack/core-v1.json
/quiz-pack/home-v1.json
/quiz-pack/hubs/{hub}.json
/quiz-pack/words/{slug}.json
/exam-packs/manifest.json
/exam-packs/{packId}.json
/search/search-lite-v1.json
```

Acceptance criteria:

- quiz word type exists
- exam pack type exists
- manifest type exists
- mock data validates
- no browser-side Webflow CMS calls

## Phase 3 — SRS Engine

Branch:

```txt
feat/srs-engine
```

Deliverables:

- `src/lib/srs/types.ts`
- `src/lib/srs/storage.ts`
- `src/lib/srs/engine.ts`
- `src/lib/srs/selectors.ts`
- unit tests

Required selectors:

```txt
getDueToday
getWeakWords
getNewSaved
getMastered
getWeeklyReviewedWords
```

Acceptance criteria:

- saved item can become review state
- review event updates state
- box changes according to rules
- nextDueAt is calculated
- weakScore updates
- mastery is not fake

## Phase 4 — Review UI

Branch:

```txt
feat/review-ui
```

Deliverables:

- `/review`
- `/review/due`
- `/review/weak`
- 5-card session UI
- answer buttons
- response time tracking
- session summary
- localStorage persistence

Initial question types:

```txt
Image → Word
Definition → Word
Saved Review
Due Review
```

Acceptance criteria:

- user can complete a review session
- `vlx_review_events_v1` updates
- `vlx_review_state_v1` updates
- `vlx_daily_stats_v1` updates
- session summary is honest
- mobile layout works

## Phase 5 — Dashboard Memory Mission

Branch:

```txt
feat/dashboard-memory-mission
```

Deliverables:

- dashboard based on real SRS selectors
- Due Today module
- Weak Words module
- New Saved module
- Mastered module
- Streak / weekly reviewed words
- Saved Library below learning modules

Dashboard copy:

```txt
Today’s Memory Mission
{dueCount} words due · {weakCount} weak · 3 minutes
```

Acceptance criteria:

- counts are derived from state
- no fake mastery
- empty state helps user start
- review CTAs go to correct review modes

## Phase 6 — R2 Pack Reader

Branch:

```txt
feat/r2-pack-reader
```

Deliverables:

- `src/lib/packs/pack-reader.ts`
- fetch helpers
- validation
- mock fallback
- error states

Acceptance criteria:

- app can read a remote pack URL
- app falls back to mock data if remote fails
- validation errors are clear
- no secrets in frontend

## Phase 7 — Save Landing Endpoint

Branch:

```txt
feat/save-landing
```

Target route:

```txt
/save?slug={slug}&source=word_page
```

Deliverables:

- save landing route
- add word to saved list
- create review state item if missing
- show saved confirmation
- CTA to start 5-card review

Acceptance criteria:

- saved word becomes New review item
- duplicate saves are handled
- user can proceed to review immediately

## Phase 8 — Analytics Events

Branch:

```txt
feat/analytics-events
```

Core events:

```txt
vlx_save_word_click
vlx_quiz_start
vlx_quiz_answer
vlx_quiz_complete
vlx_review_state_update
vlx_due_review_start
vlx_weak_review_start
vlx_paywall_view
vlx_upgrade_click
```

Acceptance criteria:

- event emitter exists
- important app actions emit events
- no third-party analytics hard dependency required for MVP
- payload shape is documented

## Phase 9 — Free / Lite / Pro UI Gating

Branch:

```txt
feat/ui-gating
```

Initial plan:

Guest:

- sample review
- local-only state
- ads allowed on public Track A only

Free:

- limited saved words
- limited daily review
- basic SRS

Lite:

- unlimited saved words
- unlimited review
- weak words
- due queue
- streak/calendar
- no ads

Pro:

- Exam Packs
- Confusable Drill
- Weak Words Sprint
- Mastery Test
- AI mistake explanation later
- advanced progress

Acceptance criteria:

- UI gating only at first
- no payment provider changes
- paywall copy focuses on memory management
- no false entitlement claims

## Phase 10 — Exam Pack Preview

Branch:

```txt
feat/exam-pack-preview
```

Initial packs:

```txt
Academic Vocabulary Pack
IELTS Writing Vocabulary Pack
GRE Visual Verbal Pack
```

Future language packs:

```txt
ko→en
ja→en
ko→ja
en→ja
ja→ko
en→es
```

Acceptance criteria:

- pack list page exists
- pack detail page exists
- preview words show
- locked state exists
- review can start from preview cards

## Phase 11 — Webflow CTA Bridge

Branch:

```txt
feat/webflow-bridge-spec
```

This phase should produce snippets and instructions first.

Do not publish automatically.

Word page CTAs:

```txt
Save this word
→ https://app.visuallexicon.org/save?slug={slug}&source=word_page

Can you recall it?
→ https://app.visuallexicon.org/review?mode=word&slug={slug}

Start 5-card quiz
→ https://app.visuallexicon.org/review?mode=word&slug={slug}&limit=5
```

Hub page CTAs:

```txt
Train this hub
→ https://app.visuallexicon.org/review?mode=hub&hub={hubSlug}&limit=10

Save this path
→ https://app.visuallexicon.org/packs/{hubSlug}
```

Acceptance criteria:

- app review flow works before Webflow CTA changes
- rollback instructions exist
- SEO text remains intact
- no mass CMS changes
- no production Worker changes

## Recommended Merge Order

```txt
1. feat/app-scaffold
2. feat/pack-contract
3. feat/srs-engine
4. feat/review-ui
5. feat/dashboard-memory-mission
6. feat/r2-pack-reader
7. feat/save-landing
8. feat/analytics-events
9. feat/ui-gating
10. feat/exam-pack-preview
11. feat/webflow-bridge-spec
```

## Do Not Start Yet

Do not start these before the SRS loop works:

- full public AI Tutor
- multilingual Webflow page generation
- 10k–20k word mass publishing
- production payment changes
- domain/DNS changes
- school dashboard
- API/white-label
- complex Supabase migration
- public compare page mass generation

## Definition of P0 Complete

P0 is complete when:

```txt
Saved word becomes review item.
Review session creates events.
Review event updates memory state.
Due / Weak / Mastered are real.
Dashboard shows today’s learning mission.
App can read mock or R2 pack data.
Webflow can safely send a user into the app.
```
