---
title: Targeting Rules
description: Control which users see each banner by specifying targeting rules.
---

# Targeting Rules Reference

Control which users see each banner by specifying targeting rules. All rules must match (AND logic) for a banner to be shown.

## How Targeting Works

- Rules are stored as a JSON object in the `targeting_rules` field of a banner
- All specified rules must match (AND logic) — if any rule fails, the banner is excluded
- Rules that are **not specified** are treated as "match all" — an empty rules object shows to everyone
- The evaluate endpoint compares rules against the provided `context` object

## Rules

### platforms

**Type:** `string[]`

Target specific platforms. Banner only shows if the user's platform matches one of the listed values.

**Accepted values:** `web`, `mobile`, `desktop`, `ios`, `android`

```json
{ "targeting_rules": { "platforms": ["web", "mobile"] } }
```

### countries

**Type:** `string[]`

Target by country code (ISO 3166-1 alpha-2). Banner shows only to users in the listed countries.

**Accepted values:** `US`, `GB`, `IN`, `DE`, `FR`, etc.

```json
{ "targeting_rules": { "countries": ["US", "GB", "DE"] } }
```

### user_segments

**Type:** `string[]`

Target users by segment. The user's segment must match one of the listed values.

**Accepted values:** `free`, `pro`, `enterprise`, `new`, `churned`, etc.

```json
{ "targeting_rules": { "user_segments": ["free", "new"] } }
```

### page_paths

**Type:** `string[]`

Target specific page paths. Supports exact match and wildcard suffix (`*`). Banner shows only when the user is on a matching page.

**Accepted values:** `/dashboard`, `/settings/*`, `/pricing`

```json
{ "targeting_rules": { "page_paths": ["/dashboard", "/settings/*"] } }
```

### user_ids

**Type:** `string[]`

Target specific users by ID. Useful for beta features or individual support banners.

**Accepted values:** Any user ID strings

```json
{ "targeting_rules": { "user_ids": ["user-123", "user-456"] } }
```

### min_app_version

**Type:** `string`

Target users on a minimum app version. Uses semantic version comparison (e.g., 2.1.0 > 1.9.9).

**Accepted values:** Semver string, e.g., `2.1.0`

```json
{ "targeting_rules": { "min_app_version": "3.0.0" } }
```

### is_authenticated

**Type:** `boolean`

Target authenticated or unauthenticated users only.

**Accepted values:** `true` or `false`

```json
{ "targeting_rules": { "is_authenticated": true } }
```

## Full Example

A banner targeting authenticated web users in the US and GB, on the dashboard page, running app version 2.0.0 or later:

```json
{
  "title": "New analytics dashboard available",
  "type": "informational",
  "targeting_rules": {
    "platforms": ["web"],
    "countries": ["US", "GB"],
    "page_paths": ["/dashboard", "/dashboard/*"],
    "is_authenticated": true,
    "min_app_version": "2.0.0"
  }
}
```

## Evaluate Context

When calling the evaluate endpoint, pass the user's context for rule matching:

```json
{
  "tenant_id": "default",
  "user_id": "user-123",
  "context": {
    "platform": "web",
    "country": "US",
    "segment": "pro",
    "page_path": "/dashboard",
    "app_version": "2.5.0",
    "is_authenticated": true
  }
}
```
