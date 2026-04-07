---
title: Integration Guide
slug: /integration-guide
icon: Code2
order: 2
---

# Integration Guide

Integrate BannerOS into your application using direct REST API calls. No SDK required.

## Quick Start (REST API)

### Evaluate Banners

```bash
POST /api/evaluate
Content-Type: application/json

{
  "tenant_id": "default",
  "user_id": "user-123",
  "context": {
    "platform": "web",
    "country": "US",
    "page_path": "/dashboard"
  }
}
```

### Record Impression

```bash
POST /api/impressions
Content-Type: application/json

{
  "banner_id": "banner-uuid",
  "user_id": "user-123",
  "action": "view"
}
```

Actions: `view`, `click`, `dismiss`

### Dismiss Banner

```bash
POST /api/impressions/dismiss
Content-Type: application/json

{
  "banner_id": "banner-uuid",
  "user_id": "user-123"
}
```

## Environment Setup

Before integrating, set your API base URL:

```bash
# If running BannerOS locally
export BANNEROS_API_BASE_URL=http://localhost:3001/api

# If using hosted version
export BANNEROS_API_BASE_URL=https://your-domain.com/api
```

## React Integration

Use a custom hook with `useEffect` + `fetch` to call `POST /api/evaluate` on mount, store banners in state, render conditionally.

Best for: Single-page React apps, Vite, Create React App.

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

// Read from environment variable (Vite: import.meta.env.VITE_BANNEROS_API_BASE_URL)
// or from your app config
const API_BASE = import.meta.env.VITE_BANNEROS_API_BASE_URL;

export function useBanners(tenantId, userId, context) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, user_id: userId, context }),
      });
      const data = await res.json();
      setBanners(data.banners || []);
      // Auto-track views
      for (const b of data.banners || []) {
        if (!trackedRef.current.has(b.id)) {
          trackedRef.current.add(b.id);
          fetch(`${API_BASE}/impressions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ banner_id: b.id, tenant_id: tenantId, user_id: userId, action: 'view' }),
          }).catch(() => {});
        }
      }
    } catch { setBanners([]); }
    setLoading(false);
  }, [tenantId, userId, JSON.stringify(context)]);

  useEffect(() => { load(); }, [load]);

  const dismiss = (id) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    fetch(`${API_BASE}/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: id, tenant_id: tenantId, user_id: userId, action: 'dismiss' }),
    }).catch(() => {});
  };

  const trackClick = (id) => {
    fetch(`${API_BASE}/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banner_id: id, tenant_id: tenantId, user_id: userId, action: 'click' }),
    }).catch(() => {});
  };

  return { banners, loading, dismiss, trackClick, refresh: load };
}
```

## Next.js Integration

Use server-side fetch in `getServerSideProps` or route handler, hydrate client with banner data to avoid flicker.

Best for: Next.js apps that need SSR banner rendering.

```tsx
// app/home/page.tsx — Server Component banner fetch
const API_BASE = process.env.BANNEROS_API_BASE_URL;

async function getBanners(userId, context) {
  const res = await fetch(`${API_BASE}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: 'default', user_id: userId, context }),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  return res.json();
}

export default async function HomePage() {
  const { banners } = await getBanners('user-123', { platform: 'web', page_path: '/home' });
  return (
    <div>
      <BannerSlot banners={banners} placement="top" />
      {/* rest of page */}
    </div>
  );
}
```

## Vue 3 Integration

Use a composable with `ref` + `onMounted` to fetch banners from `POST /api/evaluate`.

Best for: Vue 3 apps with Composition API.

```js
import { ref, onMounted } from 'vue';

export function useBanners(tenantId, userId, context) {
  const banners = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, user_id: userId, context }),
    });
    const data = await res.json();
    banners.value = data.banners || [];
    loading.value = false;
  });

  return { banners, loading };
}
```

## Vanilla JavaScript Integration

Use `fetch` directly, inject banner HTML into a container element.

Best for: Static sites, WordPress, non-framework apps.

```js
async function loadBanners(containerId, tenantId, userId, context) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId, user_id: userId, context }),
  });
  const { banners } = await res.json();

  container.innerHTML = banners.map(b => `
    <div class="banneros-banner banneros-${b.type}" data-id="${b.id}">
      <strong>${b.title}</strong>
      <p>${b.body || ''}</p>
      ${b.cta_text ? `<a href="${b.cta_url}">${b.cta_text}</a>` : ''}
      <button onclick="dismissBanner('${b.id}')">x</button>
    </div>
  `).join('');
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiUrl` | string | Required | Base URL of the BannerOS API |
| `tenantId` | string | `"default"` | Tenant identifier |
| `userId` | string | undefined | User ID for dismiss tracking and personalization |

## Context Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenant_id` | string | Yes | Tenant identifier |
| `user_id` | string | Recommended | User ID for personalization and dismiss persistence |
| `platform` | string | Recommended | `web`, `mobile`, `desktop`, `ios`, `android` |
| `page_path` | string | Recommended | Current page path, e.g. `/dashboard` |
| `country` | string | Optional | ISO 3166-1 alpha-2 country code |
| `segment` | string | Optional | User segment, e.g. `free`, `pro`, `enterprise` |
| `app_version` | string | Optional | Semver app version for version targeting |
| `is_authenticated` | boolean | Optional | Whether the user is authenticated |

## Telemetry

Track banner impressions, clicks, and dismissals. All telemetry calls should be **fire-and-forget** — never `await` them or let failures break the page.

### Required events

- **view** — Fire once per banner per page load. Deduplicate with a `Set` or `ref` — do not re-fire on re-renders.
- **click** — Fire when the user clicks the CTA button.

### Optional events

- **dismiss** — Fire when the user closes a banner. Requires `user_id` for persistence.

### Impression payload

```bash
POST /api/impressions
Content-Type: application/json

{
  "banner_id": "string (required)",
  "tenant_id": "string (required)",
  "user_id": "string (optional, required for dismiss)",
  "action": "view" | "click" | "dismiss"
}
```

## Caching

- **Default TTL:** 5 minutes, in-memory cache keyed by `tenant_id` + `user_id` + context hash
- **Stale on error:** Yes — serve cached banners if the API is unreachable
- **Home page:** 5 min TTL, refresh on focus/visibility change, stale-on-error OK
- **Cart page:** 2 min TTL, invalidate when cart contents change, stale-on-error OK
- **Checkout page:** No cache — always fetch fresh. No stale-on-error.
- Invalidate on user segment change, page navigation, or explicit refresh
- Do not cache dismiss actions — always send to API immediately

## Fallback Behavior

What to show when the API is unavailable or no banners match:

- **Default:** Show nothing — render empty container with reserved height, collapse after 2s
- **Home:** Static welcome message ("Free shipping on orders over $75.")
- **Cart:** Static free-shipping banner
- **Checkout:** Show nothing — never interrupt checkout with fallback banners
- Always use `try/catch` around fetch calls. Never let a banner error break the page.
- **Retry:** Default 2 attempts / 3000ms. Cart: 1 attempt / 2000ms. Checkout: no retry.
