---
title: Banner Types
description: BannerOS supports three banner types, each suited for different use cases.
---

# Banner Types

BannerOS supports three banner types, each suited for different use cases.

## Promotional

**Type value:** `promotional`

Used for marketing campaigns, sales announcements, new feature launches, and other promotional content.

### Best Practices

- Always set targeting rules to avoid showing irrelevant promotions
- Set an end date to auto-expire time-sensitive offers
- Use a clear CTA (call-to-action) with a link
- Keep priority high for important campaigns

### Styling Guidance

- **Color scheme:** Warm (amber/yellow/orange)
- **Background:** `bg-amber-50` or gradient
- **Border:** `border-amber-200`
- **Text:** `text-amber-900`
- **CTA:** Always include a CTA button

### Priority Range

80–200

### Typical Placements

`home_top`, `cart_top`, `product_top`, `home_inline`

### Example

```json
{
  "title": "Black Friday Sale — 40% off all plans!",
  "body": "Upgrade now and save big. Offer ends Nov 30.",
  "type": "promotional",
  "priority": 100,
  "cta_text": "Upgrade Now",
  "cta_url": "/pricing",
  "targeting_rules": { "platforms": ["web"], "countries": ["US", "GB"] },
  "start_date": "2025-11-25",
  "end_date": "2025-11-30"
}
```

## Support

**Type value:** `support`

Used for support-related messages like maintenance notices, outage alerts, known issues, and migration guides.

### Best Practices

- Use high priority for critical outage notices
- Set a short end date for maintenance windows
- Target affected user segments specifically
- Avoid a sales-style CTA — keep it neutral and helpful

### Styling Guidance

- **Color scheme:** Cool (blue)
- **Background:** `bg-blue-50` or gradient
- **Border:** `border-blue-200`
- **Text:** `text-blue-900`
- **CTA:** Optional — link to status page or details

### Priority Range

150–250

### Typical Placements

`home_top`, `checkout_top`, `account_top`

### Example

```json
{
  "title": "Scheduled Maintenance — Dec 15",
  "body": "Our platform will be briefly unavailable from 2–4 AM UTC.",
  "type": "support",
  "priority": 200,
  "targeting_rules": {},
  "start_date": "2025-12-14",
  "end_date": "2025-12-16"
}
```

## Informational

**Type value:** `informational`

Used for general announcements, tips, onboarding guidance, and non-urgent information.

### Best Practices

- Good for onboarding users with helpful tips
- Can run without targeting for broad announcements
- Lower priority than support and promotional banners
- Great for feature discovery and education

### Styling Guidance

- **Color scheme:** Green (emerald)
- **Background:** `bg-emerald-50` or gradient
- **Border:** `border-emerald-200`
- **Text:** `text-emerald-900`
- **CTA:** Optional — link to docs or feature page

### Priority Range

10–100

### Typical Placements

`home_top`, `account_top`

### Example

```json
{
  "title": "Did you know? You can set up keyboard shortcuts",
  "body": "Go to Settings > Shortcuts to configure your custom keybindings.",
  "type": "informational",
  "priority": 10,
  "targeting_rules": { "user_segments": ["new"] }
}
```

## Type Restrictions

Tenant configuration can disable specific banner types. If a type is disabled, banners of that type will still be stored but won't appear in evaluation results.

Configure allowed types in the **Dashboard > Config** page or via the tenant API:

```json
{
  "allowPromotional": true,
  "allowSupport": true,
  "allowInformational": true
}
```
