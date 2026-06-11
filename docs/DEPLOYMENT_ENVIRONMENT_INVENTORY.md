# Deployment Environment Inventory

Inventory date: 2026-06-11

Scope: Visual Lexicon Track B production v1 planning only. This document
proposes the inventory structure for deployment environments and runtime
configuration. It does not add environment variables, add secrets, deploy,
change Vercel settings, change DNS, touch Webflow, touch Cloudflare Workers,
change auth runtime, change billing runtime, or change current app behavior.

Do not place real secret values in this document. Do not add real secret names
unless a later implementation PR approves the provider and naming contract.

## Inventory Rules

Each configuration item must be reviewed with:

- Purpose.
- Expected owner.
- Expected sensitivity.
- Whether it can be public.
- Whether it can be `NEXT_PUBLIC`.
- Risk if missing.
- Risk if exposed.
- Implementation status: planned only, existing, or must verify.

## App Runtime

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Node/runtime version | Keep local, preview, and production builds consistent. | Engineering | Low | Yes | No | Build or runtime drift across environments. | Low risk; may reveal stack details. | Must verify |
| Install command | Install locked dependencies consistently. | Engineering | Low | Yes | No | Build cannot install dependencies. | Low risk. | Must verify |
| Build command | Produce the production Next.js build. | Engineering | Low | Yes | No | Deployment cannot produce an app build. | Low risk. | Must verify |
| Start/runtime command | Serve the built app in the deployment platform. | Engineering/operations | Low | Yes | No | Production app cannot start. | Low risk. | Must verify |
| Production app URL | Canonical URL for Track B. | Engineering/operations | Low | Yes | Yes only if needed for browser routing or analytics tags | Links, redirects, and smoke tests may target the wrong host. | Low risk if it is only the public URL. | Planned only |

## Local Development

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local dev URL | Developer route and browser QA target. | Engineering | Low | Yes | Yes if required by local-only browser code | Manual QA may target the wrong app. | Low risk. | Existing |
| `NEXT_PUBLIC_VLX_PACK_BASE_URL` | Optional public static pack source for local or deployed reads. | Engineering/content operations | Low when it points to public pack JSON only | Yes, if pack files are intended public | Yes | App falls back to local mock pack data. | Public pack URL is visible; must not contain tokens or private data. | Existing |
| Local payment placeholder URLs | Optional public placeholders for no-payment beta CTAs. | Product/engineering | Low if they point only to safe public placeholders | Yes | Yes | App records local interest instead of linking externally. | Could mislead users if pointed to real checkout without approval. | Existing |
| Browser local storage keys | Preserve local Save -> Review -> SRS continuity. | Engineering | Medium user-data sensitivity in browser | No as user data, yes as documented key names | No | Local MVP state may reset or fail to migrate later. | Exposes learner progress if browser/storage is inspected. | Existing |

## Staging/Preview

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Staging/preview URL | Validate production-like builds before launch. | Engineering/operations | Low to medium depending on access protection | Prefer restricted until launch readiness | Yes only if browser code must know it | Production behavior is rehearsed only locally. | Could expose unfinished product surfaces or test copy. | Planned only |
| Deployment protection setting | Keep internal staging isolated from public traffic. | Engineering/operations | Medium | No | No | Test environments may be publicly accessible. | Could expose internal test state or unfinished copy. | Planned only |
| Staging pack source | Validate public pack loading in a production-like app. | Content operations/engineering | Low if public static data only | Yes if packs are intended public | Yes only if browser reads directly | Pack smoke tests cannot validate deployment behavior. | Could expose unreleased pack content if not reviewed. | Planned only |
| Staging analytics tag/project | Separate staging events from production reporting. | Analytics/engineering | Medium | No, except safe public browser tag when approved | Only for safe public browser tag | QA pollutes production analytics or cannot be measured. | Could leak project identifiers or enable noisy data. | Planned only |

## Production

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Production domain | Serve Track B at `app.visuallexicon.org`. | Operations/domain owner | Low | Yes | Yes only if needed by browser code | Users cannot reach the production app. | Low risk because the domain is public. | Planned only |
| Production deployment target | Identify the Vercel project/environment that serves production. | Engineering/operations | Medium | No | No | Deployments may target the wrong project. | Could aid unauthorized targeting or operational confusion. | Must verify |
| Production environment inventory | Confirm every required runtime setting is known and owned. | Engineering/operations | Medium to high | No | No | Production build may fail or behave differently than staging. | Could expose sensitive topology or secret references. | Planned only |
| Production monitoring destination | Receive health, error, and incident signals. | Engineering/operations | Medium | No, except public status page if approved | Only for safe public browser reporting keys | Failures may be invisible after launch. | Could expose internal alert routing or project IDs. | Planned only |

## Public R2/Pack URLs

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public static pack base URL | Load approved public JSON pack data. | Content operations/engineering | Low if public-only content | Yes | Yes | App falls back to mock pack data or fails pack smoke tests. | Public URL is visible; risk is unreleased or private content exposure. | Existing as optional local/deploy setting |
| Pack version metadata | Validate content compatibility and rollback. | Content operations | Low to medium | Yes for public pack versions | Yes only if browser validation needs it | Users may see mismatched or stale pack content. | Could expose unreleased content schedule. | Planned only |
| Pack availability policy | Define which packs are public, beta, paid, or unreleased. | Product/content operations | Medium | Public only after copy approval | No | App may imply paid pack access incorrectly. | Could reveal unreleased commercial plans. | Planned only |

## Future Auth Provider Variables

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public auth client/app identifier | Let browser auth UI identify the approved auth application. | Auth owner/engineering | Low if provider documents it as public | Yes when provider-approved | Yes only when provider-approved | Login/signup cannot initialize later. | Low to medium; can expose provider/project metadata. | Planned only |
| Server-only auth secret/signing material | Verify sessions, callbacks, or tokens server-side. | Auth owner/engineering | High | No | No | Auth cannot safely validate sessions. | Account takeover or session forgery risk. | Planned only |
| Auth callback/base URL | Route auth callbacks to the correct environment. | Auth owner/engineering | Low to medium | Usually public as URL | Yes only if browser needs it | Users may be redirected to the wrong environment. | Could expose staging URLs. | Planned only |
| Auth webhook verification material | Verify account lifecycle events server-side. | Auth owner/engineering | High | No | No | Account sync events may be rejected or unsafe. | Forged account events. | Planned only |

## Future Server SRS Sync Variables

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server persistence endpoint | Route saved/review sync writes to the approved backend. | Sync owner/engineering | Medium | No for internal endpoints; public API route paths may be visible | No for secrets or internal hosts | Review events cannot persist server-side. | Could expose internal topology. | Planned only |
| Server persistence credential | Authorize server-side writes and reads. | Sync owner/engineering | High | No | No | Server sync cannot operate safely. | Unauthorized learning data access or mutation. | Planned only |
| Sync queue or idempotency settings | Keep retries from duplicating review events. | Sync owner/engineering | Medium | No | No | SRS state can diverge or duplicate events. | Could aid abuse or data corruption attempts. | Planned only |
| Data region or retention setting | Keep learning data in approved storage posture. | Sync owner/engineering/legal | Medium | No unless policy is public | No | Data may be stored or retained incorrectly. | Could expose operational details. | Planned only |

## Future Billing Provider Variables

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public billing client or price display identifier | Let approved browser billing UI reference public plan metadata. | Billing owner/engineering | Low only if provider-approved public identifier | Yes when provider-approved | Yes only when provider-approved | Checkout UI cannot initialize later. | Could reveal product or price metadata. | Planned only |
| Server-only billing credential | Create sessions, verify customers, and read billing state server-side. | Billing owner/engineering | High | No | No | Billing integration cannot operate. | Unauthorized billing operations or customer data exposure. | Planned only |
| Webhook verification material | Verify subscription, refund, cancellation, and dispute events. | Billing owner/engineering | High | No | No | Entitlements cannot safely update from provider events. | Forged billing events and incorrect paid access. | Planned only |
| Stop-sales feature flag | Disable new paid checkout during incidents. | Billing owner/operations | Medium | No | No | Incidents may continue accepting sales. | Could reveal or allow manipulation of payment posture. | Planned only |

## Analytics/Reporting Variables

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public analytics browser tag | Attribute route and funnel events when privacy-approved. | Analytics owner/engineering | Low if vendor marks it public | Yes when approved | Yes when approved | Weekly Reviewed Words funnel may not be measurable client-side. | Could allow noisy or spoofed browser events. | Planned only |
| Server analytics write credential | Send trusted server events such as accepted review writes. | Analytics owner/engineering | High | No | No | Server-side reporting may be incomplete. | Data pollution or unauthorized event writes. | Planned only |
| Reporting workspace/project ID | Separate local, staging, and production reporting. | Analytics owner/engineering | Medium | No unless public dashboard is approved | No | Staging may pollute production reports. | Could expose internal analytics structure. | Planned only |
| Error reporting DSN/key | Capture client and server runtime errors. | Engineering/operations | Low to high depending on provider | Only if provider documents browser DSN as public | Yes only for browser-safe DSN | Errors may be invisible. | Could allow noisy events or reveal project metadata. | Planned only |

## Support/Incident Variables

| Item | Purpose | Expected owner | Expected sensitivity | Can be public | Can be `NEXT_PUBLIC` | Risk if missing | Risk if exposed | Implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public support contact URL/email | Give users a support path for access, billing, and data issues. | Support/product | Low when intentionally public | Yes | Yes if rendered by browser | Users have no clear help path. | Spam risk. | Planned only |
| Internal incident webhook or alert route | Notify the release/support owner during incidents. | Operations/support | High | No | No | Incidents may not reach owners. | Alert spam, operational disruption, or internal URL exposure. | Planned only |
| Status page URL | Communicate known incidents if approved. | Operations/support | Low | Yes | Yes if rendered by browser | Users cannot distinguish local issues from incidents. | Low if intentionally public. | Planned only |
| Support case system credential | Create or inspect support records server-side. | Support/engineering | High | No | No | Support workflow cannot integrate safely. | Customer data exposure or unauthorized case access. | Planned only |

## Required Follow-Up

Before production launch, each planned-only or must-verify item must be assigned
to an owner and reviewed in staging and production. Any provider-specific secret
names, values, dashboard screenshots, or credentials must stay out of docs and
repository files.
