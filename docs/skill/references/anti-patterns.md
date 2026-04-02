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
