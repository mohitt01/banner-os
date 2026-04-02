# Validation Checklist

Run through every item before considering the integration complete.

## Must be true before PR

- [ ] `tenant_id` is resolved from environment variable or app config, not hardcoded
- [ ] API base URL is resolved from environment variable or app config, not hardcoded
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
