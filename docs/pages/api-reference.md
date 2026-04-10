---
title: API Reference
description: Complete reference for the BannerOS REST API.
---

# API Reference

Complete reference for the BannerOS REST API.

## Base URL

Set `BANNEROS_API_BASE_URL` to one of:

- **If running BannerOS locally:** `http://localhost:3001/api`
- **If using hosted version:** `https://your-domain.com/api`

All endpoints below are relative to your `BANNEROS_API_BASE_URL`.

## Banners

### GET /api/banners

List all banners for a tenant.

- **Parameters:** Query: `tenant_id`, `status`, `type`
- **Response:** `{ banners: Banner[] }`

### GET /api/banners/:id

Get a single banner by ID.

- **Parameters:** Path: `id`
- **Response:** `{ banner: Banner }`

### POST /api/banners

Create a new banner.

- **Parameters:** Body: `title`\*, `body`, `type`, `status`, `priority`, `targeting_rules`, `style`, `cta_text`, `cta_url`, `start_date`, `end_date`, `tenant_id`
- **Response:** `{ banner: Banner }`

### PUT /api/banners/:id

Update an existing banner.

- **Parameters:** Path: `id`. Body: any banner fields
- **Response:** `{ banner: Banner }`

### DELETE /api/banners/:id

Delete a banner and its impressions.

- **Parameters:** Path: `id`
- **Response:** `{ success: true }`

## Evaluate

### POST /api/evaluate

Evaluate which banners to show for a user/context. Filters by targeting rules, date range, dismissed banners, and tenant limits.

- **Parameters:** Body: `tenant_id`, `user_id`, `context` (`platform`, `country`, `segment`, `page_path`, `app_version`, `is_authenticated`)
- **Response:** `{ banners: Banner[], count: number }`

**Example request:**

```json
{
  "tenant_id": "default",
  "user_id": "user-123",
  "context": {
    "platform": "web",
    "country": "US",
    "segment": "pro",
    "page_path": "/dashboard",
    "is_authenticated": true
  }
}
```

## Impressions

### POST /api/impressions

Record an impression (view, click, or dismiss).

- **Parameters:** Body: `banner_id`\*, `tenant_id`, `user_id`, `context`, `action` (`view`|`click`|`dismiss`)
- **Response:** `{ success: true }`

### POST /api/impressions/dismiss

Dismiss a banner for a specific user.

- **Parameters:** Body: `banner_id`\*, `user_id`\*, `tenant_id`
- **Response:** `{ success: true, message: string }`

### GET /api/impressions/stats/:banner_id

Get impression stats for a specific banner.

- **Parameters:** Path: `banner_id`
- **Response:** `{ banner_id, stats: { views, clicks, dismissals, unique_users, ctr }, daily: [...] }`

### GET /api/impressions/stats

Get aggregate stats for all banners in a tenant.

- **Parameters:** Query: `tenant_id`
- **Response:** `{ tenant_id, stats: [...] }`

## Tenants

### GET /api/tenants/:id

Get tenant configuration.

- **Parameters:** Path: `id`
- **Response:** `{ tenant: Tenant }`

### PUT /api/tenants/:id

Update tenant configuration.

- **Parameters:** Path: `id`. Body: `name`, `config`
- **Response:** `{ tenant: Tenant }`

### POST /api/tenants

Create a new tenant.

- **Parameters:** Body: `name`\*, `id`, `config`
- **Response:** `{ tenant: Tenant }`

## Validation

### GET /api/validate

Validate all banners for configuration issues.

- **Parameters:** Query: `tenant_id`
- **Response:** `{ total_banners, issues_count, errors, warnings, issues: [...] }`

## Health

### GET /api/health

Health check endpoint.

- **Parameters:** None
- **Response:** `{ status: "ok", service: "BannerOS API", version: "1.0.0" }`

## Data Models

### Banner

```typescript
interface Banner {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  type: 'promotional' | 'support' | 'informational';
  status: 'active' | 'inactive' | 'archived';
  priority: number;
  targeting_rules: TargetingRules;
  style: Record<string, any>;
  cta_text: string | null;
  cta_url: string | null;
  start_date: string | null;  // ISO date
  end_date: string | null;    // ISO date
  created_at: string;
  updated_at: string;
}
```

### TargetingRules

```typescript
interface TargetingRules {
  platforms?: string[];       // ['web', 'mobile', 'desktop']
  countries?: string[];       // ['US', 'GB', 'IN']
  user_segments?: string[];   // ['free', 'pro', 'enterprise']
  page_paths?: string[];      // ['/dashboard', '/settings/*']
  user_ids?: string[];        // ['user-123']
  min_app_version?: string;   // '2.1.0'
  is_authenticated?: boolean; // true
}
```

### Tenant

```typescript
interface Tenant {
  id: string;
  name: string;
  config: {
    maxBannersPerPage: number;
    defaultDismissDuration: number;
    allowPromotional: boolean;
    allowSupport: boolean;
    allowInformational: boolean;
  };
  created_at: string;
}
```
