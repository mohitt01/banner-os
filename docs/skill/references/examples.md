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
