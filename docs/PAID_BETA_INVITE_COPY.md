# Paid Beta Invite Copy

Use this copy only after the release checklist, validation commands, manual QA,
and owner sign-off are complete. These templates are for a private no-payment
beta and must not imply that Visual Lexicon has launched paid billing.

## Required Disclosures

Every invite must clearly state:

- Billing is not connected.
- No real subscription is created.
- The beta uses local browser-state behavior.
- Progress may be reset during beta.
- Feedback should focus on Save -> Review -> Due/Weak/Mastered.

## Private No-Payment Beta

Subject:

```txt
Private Visual Lexicon beta invite
```

Body:

```txt
You are invited to try a private no-payment beta of Visual Lexicon.

This beta is focused on one learning loop: Save a word, review it, and see
whether Due, Weak, and Mastered states help you remember it later.

Important beta notes:

- Billing is not connected.
- No real subscription is created.
- Progress is stored in your local browser state, not in an account.
- Your progress may be reset during beta as we improve the product.
- Please do not enter sensitive personal information into feedback.

The most useful feedback is where the loop feels unclear or untrustworthy:
Save -> Review -> Due/Weak/Mastered.
```

## Internal Tester Invite

Subject:

```txt
Internal QA: Visual Lexicon no-payment beta candidate
```

Body:

```txt
Please test the Visual Lexicon Track B no-payment beta candidate.

Focus on the core memory loop:

1. Save a word.
2. Confirm it becomes a review item.
3. Answer review cards.
4. Confirm Due, Weak, and Mastered states reflect real review behavior.
5. Check that pricing and upgrade prompts do not create a real subscription.

Safety boundaries:

- Billing is not connected.
- No real subscription is created.
- State is local to the browser.
- Progress may be reset during beta.
- Do not test Webflow, Cloudflare Workers, auth, billing, DNS, payment settings,
  secrets, production data, or deployment settings.

Please report exact route, steps, expected result, actual result, and any
console output or screenshots that help reproduce the issue.
```

## Friendly Early User Invite

Subject:

```txt
Help test Visual Lexicon before paid beta
```

Body:

```txt
I am inviting a small group to try Visual Lexicon before any paid beta launch.

The goal is simple: when you find a hard word, can Visual Lexicon turn it into
a memory card and bring it back for review before you forget it?

This is not a paid subscription yet:

- Billing is not connected.
- No real subscription is created.
- Your progress is saved only in your browser.
- Your progress may be reset during beta.

Please try saving a few words, reviewing them, and checking whether the Due,
Weak, and Mastered labels feel honest. The most helpful feedback is anything
that makes Save -> Review -> Due/Weak/Mastered confusing, broken, or less
trustworthy.
```

## Owner-Facing Short Note

Use this when sending a personal message before a more polished invite:

```txt
This is a private no-payment Visual Lexicon beta candidate. Billing is not
connected, no subscription is created, and progress is stored only in the
browser. Progress may reset during beta. Please focus feedback on whether
Save -> Review -> Due/Weak/Mastered feels clear and trustworthy.
```

## Do Not Say

Avoid these claims until the relevant systems exist and have been approved:

- "Start your paid subscription."
- "Your account progress is saved."
- "Your plan is active."
- "Your subscription has started."
- "Your payment method will be charged."
- "Progress is permanent."
- "IELTS/GRE paid packs are complete."
- "AI Tutor is available."
- "Analytics are connected to production reporting."

## Feedback Prompt

Add this to any invite when you want structured feedback:

```txt
When you report feedback, please include:

- What route or screen you were on.
- What word or review mode you used.
- What you expected to happen.
- What actually happened.
- Whether the issue affected Save, Review, Due, Weak, Mastered, pricing, or
  local progress.
```
