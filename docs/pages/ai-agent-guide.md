---
title: AI Agent Guide
slug: /ai-agent-guide
icon: Bot
order: 99
---

# AI Agent Guide

Integrate BannerOS faster by giving your AI coding assistant structured integration guidance.

The docs on this site explain **what** BannerOS is and **how** it works. The AI skill is different — it's an **operating manual for decisions** that tells your AI agent:

- What to do in each situation (page-specific decision rules)
- What never to do (anti-patterns with bad/good code examples)
- When to stop and ask the developer for input
- How to verify the integration is correct before PR
- Complete, copy-pasteable code for React, Next.js, Vue 3, and Vanilla JS

## Three ways to use the AI skill

Pick the option that fits your setup.

---

## Option 1: Install the Agent Skill

**For IDEs that support [Agent Skills](https://agentskills.io)** (Claude Code, GitHub Copilot, compatible agents).

<a href="/docs/banneros-skill.zip"><strong>Download Skill ZIP →</strong></a>

Extract into one of these locations:

**Project-specific** (recommended — shared via version control):
- `.github/skills/banneros-integration/`
- `.agents/skills/banneros-integration/`

**Global** (available across all projects):
- `~/.copilot/skills/banneros-integration/`
- `~/.agents/skills/banneros-integration/`

Your IDE will detect and load the skill automatically. See [agentskills.io/clients](https://agentskills.io/clients) for IDE-specific setup.

<details>
<summary><strong>What's inside the ZIP?</strong></summary>

- **SKILL.md** — Main skill file the agent reads first
- **references/decision-rules.md** — Page-specific caching, fallback, and limit rules
- **references/anti-patterns.md** — Bad/good code examples for common mistakes
- **references/examples.md** — Full integration code for React, Next.js, Vue 3, Vanilla JS
- **references/validation-checklist.md** — Pre-PR checklist and testing instructions
- **references/client-script.md** — Full command reference for the client script
- **scripts/banneros-client.js** — CLI to operate BannerOS APIs directly (no MCP needed)

</details>

---

## Option 2: Copy the Prompt Guide

Copy the full integration guide below and paste it into your AI's context — system prompt, project instructions, or directly in chat.

<details>
<summary><strong>Full Prompt Guide</strong> (also available as <a href="/docs/prompt-guide.txt" target="_blank">plain text</a>)</summary>

<!-- PROMPT_GUIDE_START -->
<pre><code>
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

1. **BannerOS setup** — Ask: "Are you using the hosted BannerOS platform or running it locally?"
   - **Hosted**: Use the URL provided by your team or deployment
   - **Local**: `http://localhost:3001/api`
2. **Tenant ID** — Do not assume. Ask: "What is your BannerOS tenant ID?" Default is `default`.
3. **Which pages need banners** — Ask: "Which pages should show banners?" (e.g., home, cart, checkout, product, account)
4. **Framework** — Detect from the codebase if possible. If ambiguous, ask.

**Environment variable**: Always use `BANNEROS_API_BASE_URL` in your integration code. Do NOT hardcode URLs.

Examples:
```bash
# Hosted version
export BANNEROS_API_BASE_URL=https://your-domain.com/api

# Local development
export BANNEROS_API_BASE_URL=http://localhost:3001/api
```

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
- See the decision rules section below for page-specific fallback rules

### Step 5: Verify

Run through the validation checklist section below before considering the integration complete.

## Decision rules — quick reference

For the full set, see the decision rules section below.

- **Checkout page:** server-side fetch preferred, max 1 banner, no cache, no personalization in demo, no stale-on-error
- **Cart page:** max 2 banners, cache 2 min, invalidate on cart change, show free-shipping fallback if API down
- **Home page:** max 3 banners, cache 5 min, stale-on-error OK
- **All pages:** always reserve layout space, always emit view+click impressions, never hardcode tenant ID

## Anti-patterns — do NOT do these

See the anti patterns section below for the full list with examples.

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

See the examples section below for complete code per framework.

## Client script — operate BannerOS without MCP

This skill includes a self-contained Node.js CLI at the banneros client section below that lets you call all BannerOS APIs directly. Zero dependencies — requires only Node.js 18+.

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

See the client script section below for the full command reference.

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

After integration, verify using the validation checklist section below.

Minimum tests:
1. Banners render on the target pages
2. View impressions fire once per banner (check Network tab or API logs)
3. Click tracking fires when CTA is clicked
4. Dismiss removes banner and records impression
5. API-down scenario: page renders without errors, no broken layout
6. No console errors related to banner fetching

---

# Decision Rules

Use these rules when making integration decisions. Rules are ordered by priority.

## Universal rules (apply to every page)

1. Never hardcode `tenant_id` or API base URL. Use `BANNEROS_API_BASE_URL` environment variable.
2. Always include `tenant_id` in every evaluate and impression call.
3. Always reserve layout space (`min-height`) for banner containers to prevent CLS.
4. Always emit `view` impression on first render. Deduplicate — never re-fire on re-render.
5. Always emit `click` impression when user clicks CTA.
6. All telemetry calls are fire-and-forget. Never `await`. Never block UI.
7. Wrap all fetch calls in try/catch. A banner error must never break the page.
8. If API returns empty banners array, collapse the reserved space after 2 seconds.
9. Include `user_id` in context when available — required for dismiss persistence.
10. Pass `page_path` in context so targeting rules can match by page.

## Page: home

- Max banners: 3
- Cache TTL: 5 minutes
- Stale on error: yes (serve cached for up to 10 minutes)
- Fallback if API down: show nothing, or static welcome message
- Fetch strategy: client-side on mount
- All banner types allowed

## Page: cart

- Max banners: 2
- Cache TTL: 2 minutes
- Invalidate cache when cart contents change
- Stale on error: yes (5 minutes)
- Fallback if API down: static "Free shipping on orders over $75!" banner
- Fetch strategy: client-side on mount
- Prefer promotional banners (upsells, shipping thresholds)

## Page: checkout

- Max banners: 1
- Cache TTL: 0 — always fetch fresh
- Stale on error: NO — never show stale banners on checkout
- Fallback if API down: show nothing — do not interrupt checkout
- Retry: disabled
- Fetch strategy: server-side preferred (avoid flicker)
- Do not use personalized targeting in demo mode
- Prefer support banners only (maintenance, payment issues)

## Page: product

- Max banners: 2
- Cache TTL: 5 minutes
- Stale on error: yes
- Fetch strategy: client-side on mount
- Prefer promotional and informational banners

## Page: account

- Max banners: 2
- Cache TTL: 5 minutes
- Stale on error: yes
- Fetch strategy: client-side on mount
- Prefer informational and support banners

## Placement decisions

When the user asks where to place banners on a page:

- **Top of page** — z-index 10, reserve 70-90px, stack multiple banners vertically with 8px gap
- **Sidebar** — z-index 1, auto height, single banner only, low-intrusion
- **Inline** — z-index 1, reserve 60px, single banner between content sections
- **Mobile** — reduce to max 1-2 banners, full-width, min 44x44px touch targets for dismiss

## Cache invalidation triggers

Invalidate cached banners when:
- User logs in or out
- User segment changes
- Cart contents change (cart page)
- User navigates to a new page with different `page_path`
- User explicitly refreshes
- Dismiss action occurs (remove from local state immediately, do not wait for cache expiry)

## Retry policy

- Default: 2 attempts, 3000ms delay, linear backoff
- Cart: 1 attempt, 2000ms delay
- Checkout: no retry

---

# Anti-Patterns

Do NOT generate code that does any of the following.

## Hardcoded configuration

**Bad:**
```js
const res = await fetch('http://localhost:3001/api/evaluate', {
  body: JSON.stringify({ tenant_id: 'default', ... }),
});
```

**Good:**
```js
const API_BASE = process.env.BANNEROS_API_URL || '/api';
const TENANT_ID = process.env.BANNEROS_TENANT_ID;

const res = await fetch(`${API_BASE}/evaluate`, {
  body: JSON.stringify({ tenant_id: TENANT_ID, ... }),
});
```

Why: tenant IDs and URLs change per environment. Hardcoding makes the integration non-portable.

## Awaiting telemetry calls

**Bad:**
```js
await fetch(`${API_BASE}/impressions`, {
  method: 'POST',
  body: JSON.stringify({ banner_id: id, action: 'view', ... }),
});
// user sees delay
```

**Good:**
```js
fetch(`${API_BASE}/impressions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ banner_id: id, action: 'view', ... }),
}).catch(() => {});
```

Why: telemetry must never block rendering or user interaction. Fire-and-forget only.

## Duplicate view impressions

**Bad:**
```jsx
function Banner({ banner }) {
  // fires on every re-render
  fetch(`${API_BASE}/impressions`, { ... });
  return <div>{banner.title}</div>;
}
```

**Good:**
```jsx
const trackedRef = useRef(new Set());

useEffect(() => {
  for (const b of banners) {
    if (!trackedRef.current.has(b.id)) {
      trackedRef.current.add(b.id);
      fetch(`${API_BASE}/impressions`, { ... }).catch(() => {});
    }
  }
}, [banners]);
```

Why: duplicate impressions corrupt analytics. Track with a Set and fire once per banner per page load.

## No layout reservation

**Bad:**
```jsx
{banners.length > 0 && <BannerContainer>{...}</BannerContainer>}
```

**Good:**
```jsx
<div style={{ minHeight: '80px' }}>
  {banners.map(b => <Banner key={b.id} banner={b} />)}
</div>
```

Why: banners load asynchronously. Without reserved space, content jumps when banners appear (CLS).

## Caching on checkout

**Bad:**
```js
// checkout page
const cached = sessionStorage.getItem('banneros_checkout');
if (cached) return JSON.parse(cached);
```

**Good:**
```js
// checkout page — always fetch fresh
const res = await fetch(`${API_BASE}/evaluate`, { ... });
```

Why: checkout context changes rapidly (address, payment method). Stale banners can mislead users.

## No error handling

**Bad:**
```js
const res = await fetch(`${API_BASE}/evaluate`, { ... });
const { banners } = await res.json();
// if API is down, this throws and breaks the page
```

**Good:**
```js
let banners = [];
try {
  const res = await fetch(`${API_BASE}/evaluate`, { ... });
  const data = await res.json();
  banners = data.banners || [];
} catch {
  banners = []; // silent degradation
}
```

Why: banner loading is non-critical. A fetch failure must never break the page.

## Missing Content-Type header

**Bad:**
```js
fetch(`${API_BASE}/evaluate`, {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

**Good:**
```js
fetch(`${API_BASE}/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

Why: the BannerOS API requires `Content-Type: application/json`. Without it, the request will fail.

## Personalized targeting on checkout (demo mode)

**Bad:**
```js
// checkout page
context: { segment: user.segment, country: user.country, ... }
```

**Good:**
```js
// checkout page — minimal context only
context: { platform: 'web', page_path: '/checkout' }
```

Why: in demo mode, personalized targeting on checkout creates unpredictable behavior. Keep checkout context minimal.

---

# Integration Examples

Complete, copy-pasteable integration patterns per framework.

## React — minimal integration

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_BANNEROS_API_URL || '/api';
const TENANT_ID = import.meta.env.VITE_BANNEROS_TENANT_ID;

export function useBanners(userId, context) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: TENANT_ID, user_id: userId, context }),
      });
      const data = await res.json();
      setBanners(data.banners || []);
      for (const b of data.banners || []) {
        if (!trackedRef.current.has(b.id)) {
          trackedRef.current.add(b.id);
          fetch(`${API_BASE}/impressions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banner_id: b.id, tenant_id: TENANT_ID, user_id: userId, action: 'view' }),
          }).catch(() => {});
        }
      }
    } catch {
      setBanners([]);
    }
    setLoading(false);
  }, [userId, JSON.stringify(context)]);

  useEffect(() => { load(); }, [load]);

  const dismiss = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    fetch(`${API_BASE}/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: id, tenant_id: TENANT_ID, user_id: userId, action: 'dismiss' }),
    }).catch(() => {});
  };

  const trackClick = (id) => {
    fetch(`${API_BASE}/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: id, tenant_id: TENANT_ID, user_id: userId, action: 'click' }),
    }).catch(() => {});
  };

  return { banners, loading, dismiss, trackClick, refresh: load };
}
```

Usage:
```jsx
function HomePage() {
  const { banners, dismiss, trackClick } = useBanners(userId, {
    platform: 'web',
    page_path: '/',
    segment: userSegment,
  });

  return (
    <div style={{ minHeight: '80px' }}>
      {banners.map(b => (
        <div key={b.id} className={`banner banner-${b.type}`}>
          <strong>{b.title}</strong>
          <p>{b.body}</p>
          {b.cta_text && (
            <a href={b.cta_url} onClick={() => trackClick(b.id)}>{b.cta_text}</a>
          )}
          <button onClick={() => dismiss(b.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

## Next.js — server component integration

```tsx
// lib/banneros.ts
const API_URL = process.env.BANNEROS_API_BASE_URL || 'http://localhost:3001/api';
const TENANT_ID = process.env.BANNEROS_TENANT || 'default';

export async function getBanners(userId: string, context: Record<string, any>) {
  try {
    const res = await fetch(`${API_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: TENANT_ID, user_id: userId, context }),
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data.banners || [];
  } catch {
    return [];
  }
}
```

```tsx
// app/page.tsx
import { getBanners } from '@/lib/banneros';

export default async function HomePage() {
  const banners = await getBanners('user-123', { platform: 'web', page_path: '/' });
  return (
    <div style={{ minHeight: '80px' }}>
      {banners.map(b => (
        <div key={b.id}>{b.title}</div>
      ))}
    </div>
  );
}
```

Note: for checkout, do NOT use `revalidate`. Always fetch fresh:
```tsx
const res = await fetch(`${API_URL}/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
  cache: 'no-store',
});
```

## Vue 3 — composable

```js
// composables/useBanners.js
import { ref, onMounted } from 'vue';

const API_BASE = import.meta.env.VITE_BANNEROS_API_URL || '/api';
const TENANT_ID = import.meta.env.VITE_BANNEROS_TENANT_ID;

export function useBanners(userId, context) {
  const banners = ref([]);
  const loading = ref(true);
  const tracked = new Set();

  onMounted(async () => {
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: TENANT_ID, user_id: userId, context }),
      });
      const data = await res.json();
      banners.value = data.banners || [];
      for (const b of banners.value) {
        if (!tracked.has(b.id)) {
          tracked.add(b.id);
          fetch(`${API_BASE}/impressions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banner_id: b.id, tenant_id: TENANT_ID, user_id: userId, action: 'view' }),
          }).catch(() => {});
        }
      }
    } catch {
      banners.value = [];
    }
    loading.value = false;
  });

  const dismiss = (id) => {
    banners.value = banners.value.filter(b => b.id !== id);
    fetch(`${API_BASE}/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: id, tenant_id: TENANT_ID, user_id: userId, action: 'dismiss' }),
    }).catch(() => {});
  };

  return { banners, loading, dismiss };
}
```

## Vanilla JS — minimal

```js
const API_BASE = window.BANNEROS_API_URL || '/api';
const TENANT_ID = window.BANNEROS_TENANT_ID;

async function loadBanners(containerId, userId, context) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.style.minHeight = '80px';

  try {
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: TENANT_ID, user_id: userId, context }),
    });
    const { banners } = await res.json();

    container.innerHTML = banners.map(b => `
      <div class="banneros-banner banneros-${b.type}" data-id="${b.id}">
        <strong>${b.title}</strong>
        <p>${b.body || ''}</p>
        ${b.cta_text ? `<a href="${b.cta_url}">${b.cta_text}</a>` : ''}
        <button onclick="dismissBanner('${b.id}', '${userId}')">×</button>
      </div>
    `).join('');

    // Track views
    for (const b of banners) {
      fetch(`${API_BASE}/impressions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_id: b.id, tenant_id: TENANT_ID, user_id: userId, action: 'view' }),
      }).catch(() => {});
    }
  } catch {
    container.style.minHeight = '0';
  }
}

function dismissBanner(bannerId, userId) {
  const el = document.querySelector(`[data-id="${bannerId}"]`);
  if (el) el.remove();
  fetch(`${API_BASE}/impressions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ banner_id: bannerId, tenant_id: TENANT_ID, user_id: userId, action: 'dismiss' }),
  }).catch(() => {});
}
```

---

# Validation Checklist

Run through every item before considering the integration complete.

## Must be true before PR

- [ ] `tenant_id` is resolved from environment variable or app config, not hardcoded
- [ ] `BANNEROS_API_BASE_URL` is resolved from environment variable or app config, not hardcoded
- [ ] `Content-Type: application/json` header is set on all API calls
- [ ] Banner container has `min-height` set to prevent CLS
- [ ] `POST /api/evaluate` is called with `tenant_id` and `context` on page mount
- [ ] `page_path` is included in the evaluate context
- [ ] View impressions fire once per banner per page load (deduplicated)
- [ ] Click impressions fire when CTA is clicked
- [ ] Dismiss removes banner from DOM and records dismiss impression
- [ ] All telemetry calls are fire-and-forget (no `await`, `.catch(() => {})`)
- [ ] All fetch calls wrapped in try/catch — banner errors never break the page
- [ ] No console errors related to banner loading on any page
- [ ] Banners render with type-specific styling (promotional/support/informational)
- [ ] Checkout page: max 1 banner, no cache, no stale-on-error, no personalization in demo

## How to test locally

### 1. Start BannerOS

```bash
cd banner-ops
npm run dev
```

This starts the API on `http://localhost:3001`, dashboard on `http://localhost:3000`, docs on `http://localhost:3003`, and demo app on `http://localhost:5000`.

### 2. Seed demo banners

```bash
cd banner-ops/api && node src/seed.js
```

Creates 6 demo banners across 3 types with varied targeting rules.

### 3. Verify banner rendering

Open your app. Banners should appear on the pages you integrated. Check:
- Do banners appear?
- Are they styled by type?
- Does the dismiss button work?
- Does the CTA link work?

### 4. Verify telemetry

Open browser DevTools > Network tab. Filter by `/api/impressions`. Check:
- One `view` request per banner on page load
- One `click` request when CTA is clicked
- One `dismiss` request when banner is dismissed
- No duplicate `view` requests on re-render

### 5. Verify evaluate context

Open browser DevTools > Network tab. Filter by `/api/evaluate`. Check the request body:
- `tenant_id` is present and correct
- `user_id` is present (if available)
- `platform` is set
- `page_path` matches the current page

## Failure scenarios to simulate

### API is down

1. Stop the BannerOS API (`Ctrl+C` the dev server or kill port 3001)
2. Load your app
3. Verify: no errors visible, no broken layout, banner area collapses gracefully
4. Restart the API
5. Verify: banners appear on next page load or interaction

### Empty banner response

1. Create a user context that matches no banners:
```json
{
  "tenant_id": "default",
  "user_id": "no-match-user",
  "context": { "platform": "mobile", "segment": "enterprise", "country": "JP" }
}
```
2. Verify: no banners shown, reserved space collapses, no errors

### Dismiss persistence

1. Load banners for a user
2. Dismiss one banner
3. Reload the page
4. Verify: dismissed banner does not reappear

### Slow API response

1. Add artificial delay to the API (or use browser DevTools throttling)
2. Verify: page loads normally, banner area shows reserved space, banners appear when response arrives
3. Verify: no layout shift when banners load

---

# BannerOS Client Script

A self-contained Node.js CLI that lets you operate BannerOS directly — no MCP required. Requires Node.js 18+ (uses built-in `fetch`). Zero dependencies.

## Location

```
scripts/banneros-client.js
```

## Running the script

```bash
node scripts/banneros-client.js <command> [options-as-json]
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BANNEROS_API_BASE_URL` | `http://localhost:3001/api` | BannerOS API base URL |
| `BANNEROS_TENANT` | `default` | Tenant ID for all operations |

## Commands

### Health & validation

```bash
# Check if the API is running
node scripts/banneros-client.js health

# Validate all banner configurations
node scripts/banneros-client.js validate
```

### Banner management

```bash
# List all banners
node scripts/banneros-client.js list-banners

# Filter by status or type
node scripts/banneros-client.js list-banners '{"status":"active","type":"promotional"}'

# Get a specific banner
node scripts/banneros-client.js get-banner '{"id":"banner-uuid"}'

# Create a banner
node scripts/banneros-client.js create-banner '{"title":"Summer Sale","body":"30% off all plans","type":"promotional","priority":100,"targeting_rules":{"platforms":["web"],"countries":["US"]}}'

# Update a banner
node scripts/banneros-client.js update-banner '{"id":"banner-uuid","title":"Updated Title","priority":150}'

# Delete a banner
node scripts/banneros-client.js delete-banner '{"id":"banner-uuid"}'
```

### Evaluate banners for a user

```bash
# Basic evaluation
node scripts/banneros-client.js evaluate

# With full user context
node scripts/banneros-client.js evaluate '{"user_id":"user-123","context":{"platform":"web","page_path":"/home","segment":"free","country":"US","is_authenticated":true}}'
```

### Impression tracking

```bash
# Record a view
node scripts/banneros-client.js impression '{"banner_id":"banner-uuid","action":"view","user_id":"user-123"}'

# Record a click
node scripts/banneros-client.js impression '{"banner_id":"banner-uuid","action":"click","user_id":"user-123"}'

# Dismiss a banner for a user
node scripts/banneros-client.js dismiss '{"banner_id":"banner-uuid","user_id":"user-123"}'
```

### Statistics

```bash
# Get aggregate stats for all banners in the tenant
node scripts/banneros-client.js tenant-stats

# Get detailed stats for a specific banner (views, clicks, CTR, daily breakdown)
node scripts/banneros-client.js banner-stats '{"banner_id":"banner-uuid"}'

# Legacy: get stats (all banners or specific)
node scripts/banneros-client.js stats
node scripts/banneros-client.js stats '{"banner_id":"banner-uuid"}'
```

### Tenant configuration

```bash
# Get current tenant config
node scripts/banneros-client.js get-tenant

# Update tenant config
node scripts/banneros-client.js update-tenant '{"config":{"maxBannersPerPage":5,"allowPromotional":true,"allowSupport":true,"allowInformational":true}}'
```

## Agent usage

When an agent has this skill installed, it can run the client script directly to:

1. **Check platform health** before writing integration code
2. **List existing banners** to understand what content is configured
3. **Create test banners** for development and verification
4. **Evaluate banners** with specific user contexts to test targeting rules
5. **View stats** to verify impression tracking is working
6. **Configure the tenant** to adjust platform settings

The agent does NOT need MCP support to use these capabilities — it just runs the script with `node`.

## Output format

All commands output JSON to stdout. Errors output JSON with an `error` field to stderr with exit code 1.

```json
// Success
{ "banners": [...], "count": 3 }

// Error
{ "error": "Required: banner_id, action (view|click|dismiss)" }
```
</code></pre>
<!-- PROMPT_GUIDE_END -->

</details>

---

## Option 3: Use the MCP Server

**For IDEs that support MCP** (Windsurf, Claude Code, Cursor).

The MCP server gives your AI everything from the Skill, **plus** live tools to manage banners, evaluate targeting, view stats, and validate configs — all from chat.

<details>
<summary><strong>Setup</strong></summary>

**Windsurf / Cursor** — add to your MCP config:

```json
{
  "mcpServers": {
    "banneros": {
      "serverUrl": "http://localhost:3001/mcp"
    }
  }
}
```

**Claude Code:**

```bash
claude mcp add --transport http banneros http://localhost:3001/mcp
```

Replace with your deployed URL in production (e.g. `https://your-domain.com/mcp`).

</details>

<details>
<summary><strong>Available tools (20+)</strong></summary>

| Tool | Description |
|------|-------------|
| `health_check` | Check API status and version info 🖼 |
| `list_banners` | Browse all banners with type/status badges 🖼 |
| `get_banner` | Get full banner config by ID |
| `create_banner` | Create a banner with targeting rules and CTA |
| `update_banner` | Update banner fields |
| `delete_banner` | Delete a banner and its impressions |
| `evaluate_banners` | Preview which banners match a user context 🖼 |
| `record_impression` | Record view, click, or dismiss |
| `dismiss_banner` | Dismiss a banner for a user |
| `get_banner_stats` | Stats dashboard: views, clicks, CTR, daily breakdown 🖼 |
| `get_tenant_stats` | Aggregate stats across all banners 🖼 |
| `validate_banners` | Validation report with severity badges 🖼 |
| `get_tenant_config` | Get tenant settings |
| `update_tenant_config` | Update tenant settings |
| `get_docs` | Browse docs index or read a specific page |
| `get_skill` | Full merged integration skill |
| `get_placement_schema` | Layout and rendering strategy for a page |
| `recommend_banner_integration` | Full integration recommendation |
| `list_banner_types` | All types with styling and use cases |
| `get_fallback_policy` | What to show when API is down |
| `testing_scenarios` | Test scenarios for verification |

Tools marked 🖼 return rich UI responses inline in your IDE if it supports [MCP Apps](https://apps.extensions.modelcontextprotocol.io/api/). Otherwise they return structured JSON.

</details>

---

## Choosing the right option

| | Skill | Prompt | MCP |
|--|-------|--------|-----|
| **Integration guidance** | Full | Full | Full |
| **Decision rules & anti-patterns** | Full | Full | Full |
| **Framework code examples** | Full | Full | Full |
| **Validation checklist** | Full | Full | Full |
| **Live API operations** | via client script | — | Built-in tools |
| **Rich UI (MCP Apps)** | — | — | 🖼 Built-in |
| **Supported by** | Most AI coding agents | Any AI | Most AI coding agents |

**MCP** is the most capable — everything from the Skill plus live API tools and rich UI.
**Skill** is next — full integration guidance plus a CLI client script for API operations.
**Prompt** is the simplest — paste the guide into any AI for integration guidance only.