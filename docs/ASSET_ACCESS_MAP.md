# Asset Access Map

Session 0 status: current asset delivery is public/static/mock-oriented and not
ready for paid clean asset access.

## Canonical Asset Policy

The canonical entitlement JSON requires:

- Guest and Free: watermarked public assets.
- Lite: clean standard assets, but clean asset URLs are not exposed.
- Pro: clean HD assets, but clean asset URLs are not exposed.
- Download quotas by plan.
- Per-asset rights fields:
  - `rights_status`
  - `license_scope`
  - `commercial_eligible`
  - `source_type`
  - `attribution_required`
- Watermark removal does not imply commercial rights.

## Current Asset Sources

| Source | Current files | URL shape | Access status | Risk |
| --- | --- | --- | --- | --- |
| Local public word visuals | `public/vlx-word-visuals/*.png`, `src/lib/word-visuals.ts` | `/vlx-word-visuals/{slug}.png` | Public static files | No watermarked/clean distinction or rights metadata. |
| Mock pack images | `src/lib/packs/mock-data.ts` | `https://cdn.visuallexicon.org/images/*.webp` | Direct remote URLs in mock data | Page source/network exposes whatever URL is in pack data. |
| Remote pack JSON base | `src/lib/packs/config.ts`, `src/lib/packs/pack-reader.ts` | `NEXT_PUBLIC_VLX_PACK_BASE_URL` or `VLX_PACK_BASE_URL` plus pack paths | Optional fetch source; falls back to mock data | No auth, signed URLs, or asset variant resolver. |
| Pack manifest paths | `src/lib/packs/types.ts` | `/quiz-pack/*`, `/exam-packs/*`, `/search/*` | Static manifest contract | Pack data has a single `image` field, not public/standard/HD variants. |
| Review/dashboard/saved surfaces | Dashboard, Saved, Review, Packs, Save components | Inline CSS background image or image URL from item data | Client-rendered direct URL | Clean URL leakage if clean URLs enter data. |

## Current Rendering Surfaces

| Surface | Current behavior | Paid-beta concern |
| --- | --- | --- |
| DashboardV2 | Renders word/pack visuals from local or pack item image URLs. | No plan-aware asset variant selection. |
| SavedV2 | Renders saved word images. | Saved clean URLs could persist in localStorage if ever introduced. |
| ReviewV2 | Renders review prompt visuals. | Review source/network can reveal raw image URLs. |
| PacksV2 | Renders preview images and pack cards. | Preview count/access is not server-enforced. |
| Save flow | Saves incoming image URL when provided. | External clean/source URLs could be stored locally without policy checks. |
| Word detail | Uses mock/static visuals. | No asset rights or plan-aware delivery. |

## Public, Watermarked, And Clean URL Status

| Asset class | Current status | Canonical target |
| --- | --- | --- |
| Public assets | Public local/static and mock CDN URLs exist. | Public assets should be watermarked derivatives where required. |
| Watermarked assets | No runtime watermark field or delivery rule found. | Guest/Free public views should use watermarked variants. |
| Clean standard assets | No protected standard-clean delivery. | Lite access through server gateway; direct clean URL not exposed. |
| Clean HD assets | No protected HD delivery. | Pro access through server gateway; direct clean URL not exposed. |
| Source/original assets | No explicit source/original runtime type found. | Source URLs must never leak through client data or network paths. |

## Download UI And Direct Asset URLs

No runtime download UI, download API, quota ledger, file transformation route, or
asset export route was found.

Canonical Lite and Pro download promises must not be shown as available until the
following exist:

- Server-authenticated principal.
- Server entitlement resolver.
- Per-plan monthly quota ledger.
- Asset rights metadata.
- Standard and HD derivative storage.
- Signed delivery or proxy route that does not expose clean permanent URLs.
- Audit events for requested/completed/denied downloads.

## R2 And Pack References

The current app has optional pack-base configuration and pack manifest path
contracts, but this Session 0 audit did not call R2 or any production storage
service.

| Area | Current evidence | Readiness |
| --- | --- | --- |
| Pack base URL | `NEXT_PUBLIC_VLX_PACK_BASE_URL` or `VLX_PACK_BASE_URL` can point to a static pack base. | Safe as public/static pack source only. |
| Webflow CMS guard | Pack config rejects `api.webflow.com` hosts. | Preserve. |
| R2 mutation | None performed. | Correct for Session 0. |
| Private asset delivery | Absent. | Required before paid clean assets. |

## Ads And Watermarks

| Behavior | Current status | Canonical requirement |
| --- | --- | --- |
| Guest public ads | No ad policy/runtime found. | Public max 2. |
| Free ads | No ad policy/runtime found. | Public max 1, app native 1, no review ads. |
| Lite/Pro ads | No ad policy/runtime found. | No ads. |
| Review ads | No ad policy/runtime found. | No review ads. |
| Watermark rendering | No runtime watermark policy found. | Guest/Free watermarked public derivatives. |

## P0 Asset Blockers

1. The app renders direct image URLs from public/static/mock data.
2. Pack word data has one `image` field instead of plan-aware asset variants.
3. No asset rights metadata exists in runtime contracts.
4. No clean asset gateway or signed delivery exists.
5. No download quota or audit ledger exists.
6. No protection prevents a future clean URL from being exposed in page source,
   localStorage, or network requests.

## Must Be Migrated

- `image` fields in pack/word data to asset records with public watermarked,
  standard clean, HD clean, rights metadata, and delivery policy.
- Client rendering to request a plan-appropriate public derivative or a server
  mediated clean view.
- Download/export claims to a server-authenticated, quota-checked flow.
- Saved word image persistence to avoid storing protected clean/source URLs.

## Should Be Preserved

- The existing mock/static visual fallback for unpaid local dogfood.
- The Webflow CMS host rejection in pack base configuration.
- The simple visual-first review UX.

## Likely Future Files

| Area | Likely files |
| --- | --- |
| Asset contracts | `src/lib/packs/types.ts`, new asset metadata module. |
| Pack reader | `src/lib/packs/pack-reader.ts`, `src/lib/packs/config.ts`. |
| Rendering surfaces | Dashboard, Saved, Review, Packs, Save, Word detail components. |
| Download API | New server route handlers after auth and entitlement foundation. |
| Usage ledger | New server usage/quota module and tests. |

## Rollback Boundary

If paid asset access fails, disable clean/download surfaces and continue serving
watermarked public preview images. Do not change SRS storage or review behavior
as part of asset rollback.

