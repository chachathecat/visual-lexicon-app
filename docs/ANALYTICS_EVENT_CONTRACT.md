# Analytics Event Contract

Contract date: 2026-06-11

Scope: Visual Lexicon Track B production v1 analytics contract planning only.
This document does not add analytics SDKs, tracking scripts, vendor
integrations, network calls, environment variables, secrets, auth runtime,
billing runtime, deployment changes, or current runtime behavior changes.

## Contract Principles

- Weekly Reviewed Words is the primary metric.
- Client events are useful for UX funnels, but they are not authoritative for
  mastery, entitlement, billing, or server review state.
- Server-trusted events must be idempotent and append-only where practical.
- Derived reports must name their source events and refresh expectations.
- Every event field must be privacy-reviewed before production emission.
- No event may include secrets, payment credentials, private browsing history,
  full page text, or full unredacted URLs.

## Common Envelope

Every future analytics event should fit this envelope before vendor selection:

```ts
type AnalyticsEventEnvelope<TPayload> = {
  eventName: string;
  eventId: string;
  occurredAt: string;
  receivedAt?: string;
  sourceOfTruth: "client" | "server" | "derived";
  environment: "local" | "staging" | "production";
  schemaVersion: 1;
  anonymousId?: string;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  payload: TPayload;
};
```

`eventId` should be unique per event. Server writes also need an idempotency key
or a durable event ID tied to the accepted write.

## Shared Field Rules

| Field | Rule |
| --- | --- |
| `route` | Use app route names or pathnames without query strings or hashes. |
| `slug` | Use canonical word slug when known. |
| `word` | Allowed for core learning reporting, but prefer slug where possible. |
| `packId` | Allowed when it identifies static/product content, not user secrets. |
| `plan` | Product label only; never proof of paid entitlement. |
| `source` | Use an approved enum such as `dashboard`, `saved`, `review_due`, `extension`, `pack`, or `alias_search`. |
| `aliasQuery` | Avoid raw query storage. Prefer language bucket, normalized match status, hash, or drop. |
| `url` | Do not collect full page URLs by default. |
| `responseMs` | Must be finite, non-negative, and bounded by validation policy. |

## Event Contracts

### `app_page_view`

| Requirement | Contract |
| --- | --- |
| Purpose | Understand app route reach, navigation, and funnel entry points. |
| Required fields | `eventId`, `occurredAt`, `route`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `referrerCategory`, `sessionId`, `deviceId`, `userState`, `plan`, `source`. |
| Source of truth | Client. |
| Privacy notes | Do not send query strings, hashes, full referrers, private URLs, or page text. |
| Idempotency/dedupe notes | Dedupe by `eventId`; reporting may sessionize repeated route views. |
| Can affect mastery or entitlement | No. |

### `save_word`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure words entering the learning loop and Save -> Review conversion. |
| Required fields | `eventId`, `occurredAt`, `slug`, `word`, `result`, `source`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `hub`, `packId`, `route`, `duplicate`, `hasReviewState`, `idempotencyKey`. |
| Source of truth | Client before server sync; server after accepted save writes exist. |
| Privacy notes | Do not include page text, private source URLs, notes, or extension page content. |
| Idempotency/dedupe notes | Future server source dedupes by `userId + slug + idempotencyKey`; duplicate saves must not reset SRS. |
| Can affect mastery or entitlement | Can create/preserve review state only after accepted save logic; cannot affect entitlement. |

### `review_start`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure intent to begin active recall and queue usage. |
| Required fields | `eventId`, `occurredAt`, `mode`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `sessionId`, `source`, `route`, `queueSize`, `dueCount`, `weakCount`, `packId`. |
| Source of truth | Client. |
| Privacy notes | Counts only; no answers or page text. |
| Idempotency/dedupe notes | Dedupe by `eventId`; repeated starts in one session may be collapsed for funnel reporting. |
| Can affect mastery or entitlement | No. |

### `review_answer`

| Requirement | Contract |
| --- | --- |
| Purpose | Record active recall outcome and power Weekly Reviewed Words, SRS quality, and weak recovery. |
| Required fields | `eventId`, `sessionId`, `occurredAt`, `slug`, `word`, `questionType`, `answer`, `result`, `responseMs`, `boxAfter`, `weakScoreAfter`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `selected`, `hub`, `packId`, `source`, `boxBefore`, `weakScoreBefore`, `masteryBefore`, `masteryAfter`, `usedHint`, `confidence`, `idempotencyKey`. |
| Source of truth | Server after server SRS sync exists; client only for local/private beta diagnostics. |
| Privacy notes | Keep answer fields to quiz choices or canonical answer; do not collect free-form private notes. |
| Idempotency/dedupe notes | Server must dedupe by accepted review event ID or idempotency key; retries must not advance SRS twice. |
| Can affect mastery or entitlement | Can affect mastery only through the trusted SRS reducer; cannot affect entitlement. |

### `review_complete`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure completed review sessions and session outcomes. |
| Required fields | `eventId`, `sessionId`, `occurredAt`, `mode`, `reviewedCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `correctCount`, `wrongCount`, `dueCount`, `weakCount`, `packId`, `durationMs`, `source`. |
| Source of truth | Derived from accepted review answers when available; client until server review reporting exists. |
| Privacy notes | Aggregate counts only. |
| Idempotency/dedupe notes | Prefer derived session completion from unique accepted answers; client complete events can be dropped or used as UX diagnostics. |
| Can affect mastery or entitlement | No. |

### `due_queue_view`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure whether learners see due work and whether due work becomes completed review. |
| Required fields | `eventId`, `occurredAt`, `dueCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `oldestDueAt`, `source`, `userState`, `plan`. |
| Source of truth | Client for view; server/derived for due count after sync exists. |
| Privacy notes | Counts and timestamps only; no private content beyond approved slugs if drilldown is needed. |
| Idempotency/dedupe notes | Dedupe by `eventId`; dashboard can report unique viewers per day. |
| Can affect mastery or entitlement | No. |

### `weak_queue_view`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure weak-word practice entry and recovery opportunities. |
| Required fields | `eventId`, `occurredAt`, `weakCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `averageWeakScore`, `source`, `userState`, `plan`. |
| Source of truth | Client for view; server/derived for weak count after sync exists. |
| Privacy notes | Counts and scores only unless approved drilldown requires slugs. |
| Idempotency/dedupe notes | Dedupe by `eventId`; dashboard can report unique viewers per day. |
| Can affect mastery or entitlement | No. |

### `mastered_view`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure confidence surfaces and verify Mastered is backed by delayed recall. |
| Required fields | `eventId`, `occurredAt`, `masteredCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `source`, `plan`, `hasDelayedRecallEvidence`. |
| Source of truth | Client for view; server/derived for mastered count after sync exists. |
| Privacy notes | Aggregate counts preferred; slug-level exports need separate approval. |
| Idempotency/dedupe notes | Dedupe by `eventId`; mastered counts should be recomputed from SRS state. |
| Can affect mastery or entitlement | No. |

### `pack_preview_start`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure interest in a pack before learning activity. |
| Required fields | `eventId`, `occurredAt`, `packId`, `source`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `packSource`, `wordCount`, `plan`, `locked`. |
| Source of truth | Client. |
| Privacy notes | Pack metadata only; no payment data or private content. |
| Idempotency/dedupe notes | Dedupe by `eventId`; repeated starts can be sessionized. |
| Can affect mastery or entitlement | No. |

### `pack_preview_complete`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure whether pack previews are understood enough to continue. |
| Required fields | `eventId`, `occurredAt`, `packId`, `previewedCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `source`, `durationMs`, `saveCount`, `reviewIntent`, `plan`, `locked`. |
| Source of truth | Client. |
| Privacy notes | Counts only; no hidden paid content leakage. |
| Idempotency/dedupe notes | Dedupe by `eventId`; one completion per session can be used for funnel reports. |
| Can affect mastery or entitlement | No. |

### `pack_review_start`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure transition from pack interest to active recall. |
| Required fields | `eventId`, `occurredAt`, `packId`, `mode`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `sessionId`, `queueSize`, `dueCount`, `weakCount`, `source`, `plan`. |
| Source of truth | Client. |
| Privacy notes | Pack and queue metadata only. |
| Idempotency/dedupe notes | Dedupe by `eventId`; sessionize repeated starts. |
| Can affect mastery or entitlement | No. |

### `pack_review_complete`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure pack learning progress and completion quality. |
| Required fields | `eventId`, `sessionId`, `occurredAt`, `packId`, `reviewedCount`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `correctCount`, `wrongCount`, `masteredCount`, `weakCount`, `durationMs`, `completionPercent`. |
| Source of truth | Derived from accepted review answers and pack progress when available. |
| Privacy notes | Aggregate counts preferred. |
| Idempotency/dedupe notes | Prefer derived reporting from unique review answers; client completion is advisory. |
| Can affect mastery or entitlement | No; pack progress can update only through accepted review/progress writes, not this aggregate event. |

### `pricing_interest`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure plan interest without implying billing readiness. |
| Required fields | `eventId`, `occurredAt`, `plan`, `source`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `trigger`, `paywallReason`, `userState`. |
| Source of truth | Client. |
| Privacy notes | No payment data, no checkout state, no billing credentials. |
| Idempotency/dedupe notes | Dedupe by `eventId`; dashboard may count unique users per plan per day. |
| Can affect mastery or entitlement | No. |

### `paywall_view`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure where access limits create upgrade interest or friction. |
| Required fields | `eventId`, `occurredAt`, `surface`, `reason`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `plan`, `route`, `packId`, `source`, `userState`. |
| Source of truth | Client. |
| Privacy notes | Do not include billing account data or payment details. |
| Idempotency/dedupe notes | Dedupe by `eventId`; reporting may collapse repeated views in one session. |
| Can affect mastery or entitlement | No. |

### `upgrade_interest`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure explicit learner intent to upgrade while billing is not connected. |
| Required fields | `eventId`, `occurredAt`, `plan`, `source`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `route`, `trigger`, `paywallReason`, `externalUrlConfigured`, `localOnlyRecorded`. |
| Source of truth | Client until server lead capture exists. |
| Privacy notes | No payment credentials, checkout IDs, or subscription claims. |
| Idempotency/dedupe notes | Dedupe by `eventId`; never convert duplicate interest into entitlement. |
| Can affect mastery or entitlement | No. |

### `alias_search`

| Requirement | Contract |
| --- | --- |
| Purpose | Measure whether multilingual aliases help learners find canonical word cards. |
| Required fields | `eventId`, `occurredAt`, `queryLanguage`, `result`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `matchedSlug`, `source`, `route`, `queryHash`, `queryLengthBucket`. |
| Source of truth | Client. |
| Privacy notes | Avoid raw query storage. Prefer language, match status, matched slug, and approved hash/bucket fields. |
| Idempotency/dedupe notes | Dedupe by `eventId`; aggregate repeated identical hashes only if approved. |
| Can affect mastery or entitlement | No. |

### `extension_save_source`

| Requirement | Contract |
| --- | --- |
| Purpose | Attribute saved words that originated from the browser extension. |
| Required fields | `eventId`, `occurredAt`, `slug`, `source`, `extensionSurface`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `word`, `hub`, `result`, `handoffId`, `sourceCategory`. |
| Source of truth | Client initially; server after accepted save writes can include source. |
| Privacy notes | No private browsing history, raw page URL, full page text, DOM, screenshots, or article content. |
| Idempotency/dedupe notes | Dedupe by `eventId`; future server save source should dedupe by save idempotency key. |
| Can affect mastery or entitlement | Can feed save/review attribution only; cannot affect mastery or entitlement. |

### `extension_review_source`

| Requirement | Contract |
| --- | --- |
| Purpose | Attribute review sessions that began from extension-sourced flows. |
| Required fields | `eventId`, `occurredAt`, `source`, `mode`, `environment`, `anonymousId` or `userId`. |
| Optional fields | `sessionId`, `slug`, `packId`, `handoffId`, `queueSize`. |
| Source of truth | Client for source attribution; server review answers for reviewed-word counts. |
| Privacy notes | No raw page context or private browsing history. |
| Idempotency/dedupe notes | Dedupe by `eventId`; reviewed-word impact must come from accepted review answers. |
| Can affect mastery or entitlement | No. |

### `auth_future` events planned only

| Requirement | Contract |
| --- | --- |
| Purpose | Future account funnel, session health, migration, export/delete, and recovery reporting. |
| Required fields | Planned: `eventId`, `occurredAt`, `authEventType`, `environment`, `userId` or `anonymousId`. |
| Optional fields | Planned: `providerCategory`, `migrationBatchId`, `result`, `errorCode`, `deviceId`. |
| Source of truth | Server for account state; client only for UI attempts. |
| Privacy notes | Never collect passwords, magic links, one-time codes, recovery tokens, cookies, or auth headers. |
| Idempotency/dedupe notes | Server account events need durable IDs; migration events need batch IDs. |
| Can affect mastery or entitlement | Auth can change account ownership, but cannot directly alter mastery or entitlement. Planned only. |

### `billing_future` events planned only

| Requirement | Contract |
| --- | --- |
| Purpose | Future billing funnel, subscription lifecycle, refund, cancellation, failed-payment, and entitlement reporting. |
| Required fields | Planned: `eventId`, `occurredAt`, `billingEventType`, `userId`, `environment`, `providerEventId` or `manualAuditId`. |
| Optional fields | Planned: `plan`, `entitlementState`, `periodEnd`, `packId`, `result`, `reasonCode`. |
| Source of truth | Server verified provider/manual events and entitlement snapshots. |
| Privacy notes | Never collect full card numbers, bank data, CVV, billing credentials, provider secrets, or raw webhook secrets. |
| Idempotency/dedupe notes | Dedupe by provider event ID, idempotency key, or manual audit ID. |
| Can affect mastery or entitlement | Can affect entitlement only through server entitlement snapshot recomputation; cannot affect mastery. Planned only. |

### `sync_future` events planned only

| Requirement | Contract |
| --- | --- |
| Purpose | Future server SRS sync health, hydration, retry, stale-client, and conflict reporting. |
| Required fields | Planned: `eventId`, `occurredAt`, `syncEventType`, `environment`, `userId`, `result`. |
| Optional fields | Planned: `batchId`, `syncCursor`, `acceptedCount`, `rejectedCount`, `retryableCount`, `errorCode`. |
| Source of truth | Server. |
| Privacy notes | Do not include full localStorage snapshots, secrets, private notes, or raw browser data. |
| Idempotency/dedupe notes | Dedupe by batch ID, mutation ID, and idempotency key. |
| Can affect mastery or entitlement | Sync can persist accepted SRS changes but cannot invent mastery; cannot affect entitlement. Planned only. |

### Error/incident events

| Requirement | Contract |
| --- | --- |
| Purpose | Report failures that threaten learning state, access, billing, privacy, or launch safety. |
| Required fields | `eventId`, `occurredAt`, `severity`, `surface`, `errorCode`, `environment`, `sourceOfTruth`. |
| Optional fields | `route`, `operation`, `slug`, `packId`, `userId`, `anonymousId`, `sessionId`, `retryable`, `incidentId`, `affectedCount`. |
| Source of truth | Client for UI/runtime errors; server for trusted write, sync, billing, auth, and entitlement failures; derived for incidents. |
| Privacy notes | Scrub messages and stack traces. Do not include secrets, tokens, payment data, page text, or full request/response bodies. |
| Idempotency/dedupe notes | Dedupe repeated identical errors by incident key, surface, code, and time bucket while preserving severity escalation. |
| Can affect mastery or entitlement | No direct effect; incidents may trigger rollback, stop-sales, or support repair workflows. |

## Derived Metrics

Derived metrics should be computed from documented events:

- Weekly Reviewed Words: unique accepted `review_answer` events by week.
- Activation: `save_word` followed by first accepted `review_answer`.
- Review retention: first accepted `review_answer` followed by later accepted
  `review_answer` in a defined window.
- Due completion: `due_queue_view` followed by due-mode accepted
  `review_answer` events.
- Weak recovery: weak-state words that receive accepted review answers and
  reduce weak score over time.
- Mastery quality: Mastered words with delayed recall evidence.
- Pack progress: accepted pack review answers and approved pack progress
  writes.
- Pricing interest: pricing/paywall/upgrade events, not paid conversion.

## Production Readiness Note

This contract is a planning artifact. It does not make analytics production
ready and does not add collection, transport, storage, dashboards, vendor
configuration, or runtime behavior.
