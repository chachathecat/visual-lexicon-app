# Track B Salmon Brand Tokens

Branch: `release/track-b-salmon-brand-token-foundation`

## Purpose

This foundation aligns Track B with the warm salmon/coral, calm, premium visual
learning feel of `visuallexicon.org` without adding features, changing routes,
or redesigning individual pages.

The token layer supports shared surfaces only: app shell background, buttons,
cards, badges, pills, links, primary accents, and focus-visible states. Future
route PRs should use these tokens before adding page-specific color values.

## Token Names

Color tokens in `src/app/globals.css`:

- `--vlx-track-b-canvas`: warm ivory app background.
- `--vlx-track-b-surface`: white/warm card and panel surface.
- `--vlx-track-b-surface-muted`: warm muted surface for inset panels.
- `--vlx-track-b-salmon`: light salmon for decorative accents only.
- `--vlx-track-b-coral`: salmon/coral brand color for large accents.
- `--vlx-track-b-coral-deep`: deeper coral for accessible text, links, CTA
  fills, active navigation, and focus outline.
- `--vlx-track-b-salmon-mist`: soft salmon background for badges and gentle
  emphasis.
- `--vlx-track-b-warm-border`: warm beige border reference.
- `--vlx-track-b-accent`: shared primary accent alias; currently maps to
  `--vlx-track-b-coral-deep`.
- `--vlx-track-b-accent-soft`: shared soft accent alias; currently maps to
  `--vlx-track-b-salmon-mist`.
- `--vlx-track-b-ink`: warm ink primary text.
- `--vlx-track-b-ink-soft`: readable secondary text.
- `--vlx-track-b-ink-muted`: muted warm gray supporting text.
- `--vlx-track-b-border-subtle`: shared warm beige border.
- `--vlx-track-b-border-strong`: shared stronger coral border.
- `--vlx-track-b-shadow-panel`: premium card shadow.
- `--vlx-track-b-shadow-raised`: raised shell/bottom-nav shadow.
- `--vlx-track-b-focus-outline`: visible focus outline.
- `--vlx-track-b-focus-shadow`: visible focus halo.

Existing secondary colors remain for state semantics:

- `--vlx-track-b-blue`: due/review utility tone.
- `--vlx-track-b-clay`: weak/mistake tone.
- `--vlx-track-b-gold`: learning/progress tone.
- Strong and Mastered status tokens remain green because they represent memory
  state, not the primary brand accent.

## Intended Usage

- Use `--vlx-track-b-canvas` for the app shell background.
- Use `--vlx-track-b-surface` for cards, panels, and nav surfaces.
- Use `--vlx-track-b-surface-muted` for inset rows and quiet grouped areas.
- Use `--vlx-track-b-accent` for primary buttons, shared links, active nav, and
  small accent text.
- Use `--vlx-track-b-accent-soft` or `--vlx-track-b-salmon-mist` for soft badge
  backgrounds and calm emphasis.
- Use `--vlx-track-b-border-subtle`, `--vlx-track-b-radius-md`, and
  `--vlx-track-b-shadow-panel` for premium shared cards and surfaces.
- Use `--vlx-track-b-focus-outline` and `--vlx-track-b-focus-shadow` for
  interactive focus states.

## What Not To Use Salmon For

- Do not use light salmon (`--vlx-track-b-salmon`) for small text on white.
- Do not replace error, weak, due, strong, or mastered meaning with salmon-only
  color cues.
- Do not use salmon to imply paid access, payment intent, mastery, streaks, or
  validation that the product has not earned.
- Do not add page-specific salmon gradients or decorative redesigns in this
  foundation PR.
- Do not hide labels, skip links, mobile bottom navigation text, or semantic
  status copy to make the palette feel cleaner.

## Accessibility Notes

- Small text, links, and CTA text use the deeper coral token
  `--vlx-track-b-coral-deep`, not light salmon.
- Primary CTA fills use deeper coral with warm white text for readable contrast.
- Salmon mist is a background treatment only; it needs warm ink or deep coral
  foreground text.
- Focus rings remain visible through a deep coral outline and halo.
- Status badges keep text labels and ARIA labels; color is supporting
  information only.
- Mobile bottom navigation keeps its structure and visible labels.

## Follow-Up PRs

1. Shell/navigation cleanup.
2. Core surface visual polish.
3. Accessibility/contrast pass.

## Safety Boundary

This PR does not touch Webflow, Cloudflare Workers, Vercel/DNS/deployment
settings, auth, billing, payment, checkout, subscription, provider SDKs,
secrets, environment variables, production data, API routes, route handlers,
middleware, AI features, pricing behavior, or app routes.

Public paid beta remains **No-Go**. Private beta remains
**owner-controlled/manual-only/conditional**. External participant validation
remains **Not Started**.
