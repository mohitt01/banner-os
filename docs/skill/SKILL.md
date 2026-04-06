---
name: banneros-integration
description: Integrate BannerOS banner management into client applications. Use when adding banners, promotions, or announcements to a web app. Covers API integration, placement, caching, fallback, telemetry, and testing.
metadata:
  author: banneros
  version: "1.0"
compatibility: Requires Node.js 18+ and a running BannerOS API instance.
---

# BannerOS Integration Skill

You are integrating BannerOS — a banner management platform — into a client application. BannerOS serves targeted banners (promotions, support notices, informational tips) via a REST API. There is no SDK. You call the API directly.

## When to use this skill

- User asks to add banners, announcements, or promotions to their app
- User mentions BannerOS by name
- User wants to display targeted content based on user context (segment, platform, country, page)

## When NOT to use this skill

- The user is building the BannerOS platform itself (dashboard, API)
- The user needs a CMS or full content management system
- The user needs A/B testing (BannerOS does targeting, not experiments)

## Required context — ASK the user

Before writing any integration code, you MUST ask the user for:

1. **Tenant ID** — Do not assume. Ask: "What is your BannerOS tenant ID?" Default is `default` for local dev.
2. **API base URL** — Ask: "Where is your BannerOS API running?" Default is `http://localhost:3001/api`.
3. **Which pages need banners** — Ask: "Which pages should show banners?" (e.g., home, cart, checkout, product, account)
4. **Framework** — Detect from the codebase if possible. If ambiguous, ask.

Do NOT hardcode tenant IDs or API URLs. Always resolve from environment variables or app config.

## Integration workflow

Follow these steps in order:

### Step 1: Create a banner fetch function

Build a function that calls `POST /api/evaluate` with the user's context.

```
POST {API_BASE}/evaluate
Content-Type: application/json

{
  "tenant_id": "{TENANT_ID}",
  "user_id": "{USER_ID}",
  "context": {
    "platform": "web",
    "page_path": "/current-page",
    "segment": "{USER_SEGMENT}",
    "country": "{COUNTRY_CODE}",
    "is_authenticated": true
  }
}
```

Response: `{ "banners": [...], "count": number }`

### Step 2: Render banners

- Reserve layout space with `min-height` to prevent CLS
- Style by banner type: promotional (amber/warm), support (blue), informational (green)
- Include a dismiss button on every banner
- Include CTA button if `cta_text` and `cta_url` are present

### Step 3: Add telemetry

Three impression types — all use `POST {API_BASE}/impressions`:

- **view** — fire once per banner per page load (deduplicate with a Set)
- **click** — fire when user clicks CTA
- **dismiss** — fire when user closes banner (requires user_id)

All telemetry calls must be fire-and-forget. Never await. Never let telemetry errors break the page.

### Step 4: Add error handling and fallback

- Wrap all fetch calls in try/catch
- On failure: show nothing or a static fallback — never a broken UI
- See [references/decision-rules.md](references/decision-rules.md) for page-specific fallback rules

### Step 5: Verify

Run through the [references/validation-checklist.md](references/validation-checklist.md) before considering the integration complete.

## Decision rules — quick reference

For the full set, see [references/decision-rules.md](references/decision-rules.md).

- **Checkout page:** server-side fetch preferred, max 1 banner, no cache, no personalization in demo, no stale-on-error
- **Cart page:** max 2 banners, cache 2 min, invalidate on cart change, show free-shipping fallback if API down
- **Home page:** max 3 banners, cache 5 min, stale-on-error OK
- **All pages:** always reserve layout space, always emit view+click impressions, never hardcode tenant ID

## Anti-patterns — do NOT do these

See [references/anti-patterns.md](references/anti-patterns.md) for the full list with examples.

- Do not hardcode tenant IDs or API URLs
- Do not cache on checkout
- Do not await telemetry calls
- Do not show stale banners on checkout
- Do not skip layout reservation (causes CLS)
- Do not fire view impressions on every re-render
- Do not use personalized targeting on checkout in demo mode

## Framework patterns

Detect the user's framework from the codebase. Then apply:

- **React** — custom hook (`useEffect` + `fetch`), store in state, render conditionally
- **Next.js** — server-side fetch in route handler or server component, hydrate to avoid flicker
- **Vue 3** — composable with `ref` + `onMounted`
- **Vanilla JS** — `fetch` + inject HTML into container element

See [references/examples.md](references/examples.md) for complete code per framework.

## Client script — operate BannerOS without MCP

This skill includes a self-contained Node.js CLI at [scripts/banneros-client.js](scripts/banneros-client.js) that lets you call all BannerOS APIs directly. Zero dependencies — requires only Node.js 18+.

Use it to inspect, configure, test, and manage the platform:

```bash
# Health & validation
node scripts/banneros-client.js health                    # check API status
node scripts/banneros-client.js validate                  # validate all banner configs

# Banner management
node scripts/banneros-client.js list-banners              # see what's configured
node scripts/banneros-client.js get-banner '{"id":"uuid"}'
node scripts/banneros-client.js create-banner '{"title":"Test","type":"promotional","priority":100}'
node scripts/banneros-client.js update-banner '{"id":"uuid","title":"Updated"}'
node scripts/banneros-client.js delete-banner '{"id":"uuid"}'

# Evaluate & impressions
node scripts/banneros-client.js evaluate '{"user_id":"u1","context":{"platform":"web","page_path":"/home"}}'
node scripts/banneros-client.js impression '{"banner_id":"uuid","action":"view","user_id":"u1"}'
node scripts/banneros-client.js dismiss '{"banner_id":"uuid","user_id":"u1"}'

# Statistics
node scripts/banneros-client.js tenant-stats              # aggregate stats for all banners
node scripts/banneros-client.js banner-stats '{"banner_id":"uuid"}'  # detailed stats for one banner

# Configuration & setup
node scripts/banneros-client.js get-tenant                # view tenant config
node scripts/banneros-client.js update-tenant '{"config":{"maxBannersPerPage":5}}'
```

Set `BANNEROS_API_URL` and `BANNEROS_TENANT` environment variables if not using defaults.

See [references/client-script.md](references/client-script.md) for the full command reference.

### When to use the client script

- **Before writing integration code** — run `health` and `list-banners` to verify the platform is up and has content
- **After writing integration code** — run `evaluate` with test contexts to verify targeting, run `tenant-stats` or `banner-stats` to confirm impressions are tracked
- **To validate configurations** — run `validate` to check for missing fields, bad dates, targeting issues, and policy violations
- **To configure the tenant** — run `update-tenant` to adjust settings like max banners per page
- **To manage banners** — run `create-banner`, `update-banner`, `delete-banner` to manage banner content directly

## API reference — quick lookup

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/evaluate` | POST | Get banners for a user context |
| `/api/impressions` | POST | Record view, click, or dismiss |
| `/api/impressions/dismiss` | POST | Dismiss a banner for a user |
| `/api/banners` | GET/POST | List or create banners |
| `/api/banners/:id` | PUT/DELETE | Update or delete a banner |
| `/api/tenants/:id` | GET/PUT | Get or update tenant config |
| `/api/impressions/stats` | GET | Aggregate impression stats |
| `/api/validate` | GET | Validate banner configurations |
| `/api/health` | GET | Health check |

## Testing

After integration, verify using [references/validation-checklist.md](references/validation-checklist.md).

Minimum tests:
1. Banners render on the target pages
2. View impressions fire once per banner (check Network tab or API logs)
3. Click tracking fires when CTA is clicked
4. Dismiss removes banner and records impression
5. API-down scenario: page renders without errors, no broken layout
6. No console errors related to banner fetching
