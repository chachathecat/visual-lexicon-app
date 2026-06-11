# Visual Lexicon Paid Open Beta v0 Operations

## Payment link setup checklist

- Confirm external payment page is stable and restricted to the current beta offer.
- Confirm the displayed price is **$19 USD one-time** or **₩29,000 one-time**.
- Confirm currency label is clear and not subscription language.
- Confirm query parameters capture at least source/campaign and cohort code when supported.
- Confirm purchase success page is linked to Founding Beta instructions.
- Confirm manual receipt/confirmation collection policy is documented for each payment provider.
- Verify no production checkout code path exists in this repository.

## Manual buyer access workflow

1. Receive payment confirmation from payment provider export/export alert.
2. Verify buyer details against tracking sheet.
3. Send access message from template:
   - app link
   - required beta disclosure
   - first review setup guidance
   - support channel and expected response time
4. Set `access_sent_at` timestamp in tracking sheet.
5. Confirm buyer acknowledges first access within 24 hours.
6. If acknowledgement fails, retry once by email and once by alternate contact method.

## Buyer tracking sheet columns

Required columns:

- `buyer_id`
- `name`
- `email`
- `country`
- `payment_provider`
- `payment_id`
- `plan_name`
- `amount`
- `currency`
- `purchase_date`
- `access_sent_at`
- `refund_requested`
- `refund_status`
- `feedback_status`
- `cohort`
- `notes`

Recommended optional columns:

- `utm_source`
- `utm_campaign`
- `first_login_at`
- `first_review_completed_at`
- `support_ticket_id`
- `issue_category`

## Support inbox process

- Dedicated email alias: create a single alias for all beta questions.
- Auto-acknowledgment within minutes:
  - receipt received / access pending / expected next step
- Triage labels:
  - Access
  - Bug/Crash
  - Billing/Payment confirmation
  - Feedback
- SLA expectation:
  - first response within one business day
  - urgent access blockers within 4 business hours
- Escalation:
  - technical blocker to product owner
  - refund/dispute to owner approval

## Refund handling process

1. Mark `refund_requested` as true and capture reason.
2. Verify access status, purchase evidence, and date.
3. Determine eligibility under this beta policy:
   - no access delivered yet, or
   - duplicate payment with no distinct access path, or
   - blocking access defect >24h at time of purchase window.
4. Update `refund_status` (`pending`, `approved`, `denied`, `processed`).
5. Process with payment provider manually and timestamp notes.
6. Notify buyer with clear wording that beta access is closed or maintained depending on status.
7. Close ticket with post-resolution timestamp.

## Bug triage process

- Intake: all bug reports logged with severity and environment (device/browser).
- Classification:
  - Critical: Review flow blocked for >24h for multiple users
  - High: Incorrect Due/Weak/Mastered state update or missing review state update
  - Medium: Incorrect copy/disclosure inconsistencies
  - Low: UI polish and minor textual issues
- Response by priority:
  - Critical: same-day owner review
- Fix path:
  - log issue in sprint tracker
  - patch and re-test locally
  - optionally pause new sales if critical unresolved
- Close criteria:
  - issue reproduced fixed
  - owner verifies behavior and safety boundaries remain unchanged

## Daily launch monitoring checklist

- Sales count by cohort and total cap (10/30/50).
- Access latency: payment confirmation to access message time.
- Support backlog count and response SLA.
- Critical bug count and unresolved blockers.
- Buyer sentiment snapshot from feedback_status.
- Beta disclosures compliance check on outbound messages.

## Stop-sales steps

1. Pause payment links in provider dashboard or remove links from copy page.
2. Update landing notices to “Founding beta temporarily closed.”
3. Mark cohort status as `paused` in internal sheet.
4. Notify waiting-list users that access is temporarily full.
5. Log operational reason and owner sign-off.

## Buyer cohort cap: 10 → 30 → 50

Progression rules:

- Start with a hard cap of 10 buyers.
- Move to 30 only after:
  - no unresolved critical bugs for 48 hours,
  - support < 1.5 tickets per 10 buyers/week,
  - required disclosures remain compliant in all outbound content.
- Move to 50 only after:
  - week-one usage remains stable,
  - no repeated access incidents,
- and owner review sign-off is complete.

Post cap:

- Manual hold if stop conditions are reached.
- Restart only with explicit owner authorization and revised disclosure wording.

## Required owner approvals

- Pricing text updates
- Payment link and channel updates
- Any refund exceptions
- Cohort cap increases
- Rollback of sales pause
- Major copy rewrite affecting disclosures

