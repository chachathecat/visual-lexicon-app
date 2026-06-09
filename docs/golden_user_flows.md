# Golden User Flows

These flows define the product promises that must stay true during paid beta
hardening. Run them manually with `docs/PAID_BETA_MANUAL_QA.md` when UI or
storage behavior changes.

## Word Page Save Flow

Entry:

```txt
/save?slug=dissonance&source=word_page
```

Expected:

- The word is saved once under `vlx_saved_words_v1`.
- The saved record source is `word_page`.
- A matching `vlx_review_state_v1.dissonance` item exists.
- Initial mastery is `New` and box is `0`.
- The page offers a review action.

## Alias Search Save Flow

Entry:

```txt
/save?slug=dissonance&source=alias_search
```

Expected:

- The alias path saves the canonical slug, not an invented alias card.
- Source is recorded as `alias_search` on first save.
- Existing progress is preserved on duplicate save.
- Unknown alias search states do not expose fake save actions.

## Extension Save Flow

Entry:

```txt
/save?slug=dissonance&source=extension
```

Expected:

- Source is normalized to `extension`.
- The same saved word and review state contracts are used.
- No extension token, browsing history, page content, or private user data is
  stored by the app route.
- The next action points to review.

## Due Review Flow

Entry:

```txt
/review?mode=due
/review/due
```

Expected:

- Due candidates are selected from real `nextDueAt` and review state.
- Answer submission appends a `vlx_review_events_v1` event.
- Answer submission updates `vlx_review_state_v1`.
- Correct answers can move the word forward only according to SRS rules.
- Wrong answers come back sooner and increase weakness.

## Weak Sprint Flow

Entry:

```txt
/review/weak-sprint
```

Expected:

- The sprint uses real words with `Weak` mastery or positive weak score.
- Empty state appears when no weak words exist.
- Each answer writes a review event and updates weak score.
- Completion does not claim mastery unless delayed recall rules are met.

## Academic Pack Preview Flow

Entry:

```txt
/packs/academic-vocabulary
```

Expected:

- Starting preview records pack preview start.
- Preview review routes into the review flow with pack context.
- Completion writes reviewed and correct counts from actual answers.
- IELTS/GRE or other planned packs do not pretend to be unlocked if they are
  placeholders.

## Pricing Upgrade Interest Flow

Entry:

```txt
/pricing
```

Expected:

- Lite CTA communicates beta/payment status honestly.
- Pro CTA communicates beta/payment status honestly.
- With no configured payment URL, clicks write local upgrade interest only.
- With configured external beta URLs, CTAs remain external interest links and
  append safe plan/source context.

## No-Real-Payment Safety Flow

Entry:

```txt
/checkout
/billing
/api/checkout
```

Expected:

- No checkout, billing, payment SDK, or subscription write is present in this
  app unless a future task explicitly authorizes real payment work.
- Unknown payment routes must not complete a purchase.
- No payment secret appears in frontend code or local storage.
