# Private Beta Invite Packet

This folder contains the static TypeScript contract for PR #86,
`Private beta invite packet / participant instructions`.

The contract is the participant-facing communication packet for a 5 to 20
person owner-controlled private beta. It covers invitation email copy, short DM
copy, consent, onboarding, first-session steps, what to test, what not to
expect, known limitations, local-state/account-sync limitations, manual
payment/no automatic entitlement disclosure, support/refund/privacy placeholder
requirements, issue reporting, screenshot/video guidance, follow-up templates,
no-public-sharing wording, owner approval, and the next PR sequence.

The exported data is pure static TypeScript data. It does not send emails, call
an email provider, read or write local storage, call the network, read
environment variables, add route handlers, add SDK integrations, mutate
entitlement, apply account sync, or change deployment behavior.

Use `getPrivateBetaInvitePacket()` for the full deterministic object, or the
focused helpers for verdicts, invitation templates, consent, onboarding,
limitations, issue reporting, follow-up templates, and the next PR sequence.
