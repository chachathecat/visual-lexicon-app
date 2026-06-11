# Auth Data Model Proposal

Proposal date: 2026-06-11

Scope: planning only. This document proposes production v1 account persistence
entities for Visual Lexicon Track B. It does not create migrations, database
credentials, auth runtime behavior, billing runtime behavior, production data,
or deployment changes.

## Model Principles

- Account-bound learning state belongs to a stable `userId`.
- Review events are the audit trail; review state is materialized state derived
  from accepted events plus safe migrations.
- Local storage keys remain migration/cache contracts, not the production source
  of truth.
- Entitlement snapshots are read models for future billing architecture; they
  must not be inferred from local plan state or upgrade interest.
- Tables should use server-issued timestamps plus client timestamps so sync can
  handle retries and device clock drift.

## `users` Or `profiles`

| Field | Proposal |
| --- | --- |
| Purpose | Stable account profile for learning ownership. If the auth provider owns `users`, Track B should keep a `profiles` table keyed to provider user IDs. |
| Key fields | `id`, `authProviderUserId`, `emailHash` or provider reference, `displayName`, `locale`, `createdAt`, `updatedAt`, `deletedAt`, `exportRequestedAt`, `deleteRequestedAt`. |
| Unique constraints | `authProviderUserId`; optionally normalized email/provider identity if stored server-side. |
| Indexes | `authProviderUserId`, `createdAt`, `deletedAt`. |
| Retention/privacy notes | Avoid storing passwords or auth secrets. Account deletion must remove or anonymize learning records according to policy. |
| Migration risk | Provider lock-in and account merge mistakes can orphan learning state. |
| Relationship to localStorage | No direct local key today; guest local state migrates into this account boundary after sign-in. |

## `saved_words`

| Field | Proposal |
| --- | --- |
| Purpose | Account-owned saved library membership and save-source history. |
| Key fields | `id`, `userId`, `slug`, `word`, `image`, `definition`, `hub`, `source`, `sourceHistory`, `savedAt`, `lastSavedAt`, `archivedAt`, `createdAt`, `updatedAt`, `clientMutationId`. |
| Unique constraints | Active logical uniqueness on `userId + slug`; idempotent mutation uniqueness on `userId + clientMutationId` when provided. |
| Indexes | `userId + savedAt`, `userId + slug`, `userId + archivedAt`, `source + savedAt`. |
| Retention/privacy notes | Archive rather than hard-delete on unsave so review history stays explainable. Hard-delete or anonymize on account deletion. |
| Migration risk | Duplicate saves from guest merge or retries can create conflicting source metadata if not deduped. |
| Relationship to localStorage | Server form of `vlx_saved_words_v1`. |

## `review_state` Or `word_mastery`

| Field | Proposal |
| --- | --- |
| Purpose | Materialized SRS state per user and word for due, weak, mastered, dashboard, and word-detail reads. |
| Key fields | `id`, `userId`, `slug`, `word`, `image`, `definition`, `hub`, `box`, `mastery`, `correct`, `wrong`, `streakCorrect`, `lastReviewedAt`, `nextDueAt`, `weakScore`, `avgResponseMs`, `lastQuestionType`, `lastEventId`, `masteredAt`, `createdAt`, `updatedAt`, `migrationSource`. |
| Unique constraints | `userId + slug`. |
| Indexes | `userId + nextDueAt`, `userId + weakScore`, `userId + mastery`, `userId + updatedAt`, `userId + slug`. |
| Retention/privacy notes | This is learning history and must be included in export/delete. Avoid storing unnecessary prompt text. |
| Migration risk | Directly importing stale local state can fake mastery or overwrite newer wrong answers. Prefer recomputing from events after migration when possible. |
| Relationship to localStorage | Server form of `vlx_review_state_v1`. |

## `review_events`

| Field | Proposal |
| --- | --- |
| Purpose | Append-only audit trail for every accepted review answer and SRS transition. |
| Key fields | `id`, `userId`, `eventId`, `idempotencyKey`, `sessionId`, `slug`, `word`, `hub`, `packId`, `questionType`, `selected`, `answer`, `result`, `responseMs`, `usedHint`, `confidence`, `clientCreatedAt`, `serverReceivedAt`, `boxBefore`, `boxAfter`, `weakScoreBefore`, `weakScoreAfter`, `deviceId`, `createdAt`. |
| Unique constraints | `userId + eventId`; `userId + idempotencyKey` when present. |
| Indexes | `userId + createdAt`, `userId + slug + createdAt`, `userId + sessionId`, `userId + packId + createdAt`, `serverReceivedAt`. |
| Retention/privacy notes | Exportable learning record. Deletion should remove or anonymize account linkage. Do not store secrets or private extension page content. |
| Migration risk | Duplicate ingestion can overcount daily stats and over-advance review state. |
| Relationship to localStorage | Server form of `vlx_review_events_v1`. |

## `daily_stats`

| Field | Proposal |
| --- | --- |
| Purpose | Account-level daily rollup for dashboard, streak-like summaries, weekly reviewed words, and support diagnostics. |
| Key fields | `id`, `userId`, `date`, `timezone`, `reviewed`, `correct`, `wrong`, `mastered`, `weakAdded`, `minutes`, `sessions`, `sourceEventMaxCreatedAt`, `createdAt`, `updatedAt`. |
| Unique constraints | `userId + date + timezone` or a documented canonical account timezone. |
| Indexes | `userId + date`, `date`, `userId + updatedAt`. |
| Retention/privacy notes | Prefer deriving from review events when possible. Include in export/delete. |
| Migration risk | Client date boundaries and device clock drift can split or duplicate daily totals. |
| Relationship to localStorage | Server form of `vlx_daily_stats_v1`. |

## `pack_progress`

| Field | Proposal |
| --- | --- |
| Purpose | Account-owned progress for pack previews and pack review completion. |
| Key fields | `id`, `userId`, `packId`, `packVersion`, `startedAt`, `lastOpenedAt`, `previewStartedAt`, `previewCompletedAt`, `lastReviewedAt`, `reviewedCount`, `correctCount`, `source`, `lastEventId`, `createdAt`, `updatedAt`. |
| Unique constraints | `userId + packId`; optionally `userId + packId + packVersion` if pack versions are preserved separately. |
| Indexes | `userId + lastOpenedAt`, `userId + lastReviewedAt`, `userId + packId`. |
| Retention/privacy notes | Exportable learning record. Pack progress should not imply paid entitlement. |
| Migration risk | Page-view-only progress or stale counters can fake completion. Prefer event-derived counters. |
| Relationship to localStorage | Server form of `vlx_pack_progress_v1`. |

## `upgrade_interest`

| Field | Proposal |
| --- | --- |
| Purpose | Captures pricing/paywall interest without creating entitlement or payment state. |
| Key fields | `id`, `userId`, `anonymousId`, `plan`, `source`, `trigger`, `pagePath`, `clientCreatedAt`, `serverReceivedAt`, `idempotencyKey`, `createdAt`. |
| Unique constraints | `userId + idempotencyKey` or `anonymousId + idempotencyKey` when provided. |
| Indexes | `userId + createdAt`, `anonymousId + createdAt`, `plan + createdAt`, `source + createdAt`. |
| Retention/privacy notes | Treat as marketing/product interest data. Include account-linked records in export/delete. Do not use as paid access proof. |
| Migration risk | Anonymous-to-account attribution can overcount interest if guest records sync again after login. |
| Relationship to localStorage | Server form of `vlx_upgrade_interest_v1`. |

## `alias_search_events`

| Field | Proposal |
| --- | --- |
| Purpose | Sanitized event stream for multilingual alias search behavior and save-source attribution. |
| Key fields | `id`, `userId`, `anonymousId`, `queryNormalized`, `inputLanguage`, `matchedSlug`, `matchedAlias`, `aliasVersion`, `result`, `source`, `clientCreatedAt`, `serverReceivedAt`, `idempotencyKey`. |
| Unique constraints | Optional `userId + idempotencyKey` or `anonymousId + idempotencyKey`. |
| Indexes | `userId + createdAt`, `matchedSlug + createdAt`, `inputLanguage + createdAt`, `result + createdAt`. |
| Retention/privacy notes | Minimize raw query retention. Avoid storing sensitive free text beyond the normalized alias string needed for product diagnostics. |
| Migration risk | Unknown alias events must not create fake saves or review state. |
| Relationship to localStorage | No dedicated storage key today; related to `vlx_alias_search` analytics and saved words with `source: "alias_search"`. |

## `extension_events`

| Field | Proposal |
| --- | --- |
| Purpose | Sanitized app-side extension bridge events and source attribution for extension-origin saves/reviews. |
| Key fields | `id`, `userId`, `anonymousId`, `eventType`, `slug`, `word`, `source`, `clientCreatedAt`, `serverReceivedAt`, `idempotencyKey`, `extensionVersion`, `appRoute`. |
| Unique constraints | Optional `userId + idempotencyKey` or `anonymousId + idempotencyKey`. |
| Indexes | `userId + createdAt`, `eventType + createdAt`, `slug + createdAt`. |
| Retention/privacy notes | Do not store full page text, browsing history, secrets, tab URLs, or payment data unless a future privacy-reviewed feature explicitly requires it. |
| Migration risk | Extension retries can duplicate saves or events if they bypass normal save/review idempotency. |
| Relationship to localStorage | No dedicated storage key today; related to `vlx_extension_*` analytics and saved words with `source: "extension"`. |

## `entitlement_snapshots`

| Field | Proposal |
| --- | --- |
| Purpose | Account-bound read model of future billing entitlement state for app gating and support diagnostics. |
| Key fields | `id`, `userId`, `plan`, `status`, `source`, `provider`, `providerCustomerRef`, `providerSubscriptionRef`, `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`, `canceledAt`, `refundedAt`, `snapshotReason`, `createdAt`, `updatedAt`. |
| Unique constraints | At most one current entitlement snapshot per `userId`; provider references unique when present. |
| Indexes | `userId + updatedAt`, `status + updatedAt`, `plan + updatedAt`, `provider + providerSubscriptionRef`. |
| Retention/privacy notes | Future billing architecture must define legal retention and provider references. Do not store card details or payment credentials. |
| Migration risk | Mapping local preview plans to real entitlements would grant fake paid access. Never migrate `vlx_plan_state_v1` as paid proof. |
| Relationship to localStorage | Replaces local-only `vlx_plan_state_v1` as a server read model after billing work is approved. |

## Cross-Entity Relationships

- `profiles.id` owns all learning, event, interest, and entitlement rows.
- `saved_words.userId + slug` should have a matching `word_mastery` row once a
  word enters the learning loop.
- `review_events.lastEventId` or `eventId` advances `word_mastery.lastEventId`
  and may update `pack_progress.lastEventId`.
- `daily_stats` should be derivable from `review_events` for audit and repair.
- `entitlement_snapshots` gate access but do not alter SRS truth.

## Migration Notes

- Initial migration should import local `saved_words`, `review_state`,
  `review_events`, `daily_stats`, `pack_progress`, and `upgrade_interest` into
  account-owned rows with migration metadata.
- Migration should be idempotent per account/device/key snapshot.
- Review events should be imported before trusting materialized review state.
- If imported review state claims `Mastered` without delayed recall evidence,
  downgrade or mark for repair rather than preserve a fake mastered state.
- `vlx_plan_state_v1` should not be migrated into paid entitlement.
