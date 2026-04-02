# Decision Rules

Use these rules when making integration decisions. Rules are ordered by priority.

## Universal rules (apply to every page)

1. Never hardcode `tenant_id` or API base URL. Resolve from environment variable or app config.
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
