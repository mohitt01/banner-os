---
title: Getting Started
description: BannerOS is a banner management platform that lets you create, target, and measure banners across your application.
---

# Getting Started with BannerOS

BannerOS is a banner management platform that lets you create, target, and measure banners across your application.

---

### API Base URL

```
https://your-domain.com/api
```

Use this URL in your integrations, client scripts, and environment variables:

```bash
export BANNEROS_API_BASE_URL=https://your-domain.com/api
```

### Access the Dashboard

Open the dashboard to manage banners visually:

```
https://your-domain.com
```

### Create Your First Banner

Using the REST API:

```bash
curl -X POST $BANNEROS_API_BASE_URL/banners \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome to our platform!",
    "body": "Check out our new features.",
    "type": "informational",
    "status": "active",
    "priority": 10
  }'
```

Or use the Dashboard and click **Create Banner**.

### Evaluate Banners for a User

```bash
curl -X POST $BANNEROS_API_BASE_URL/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "context": {
      "platform": "web",
      "country": "US",
      "page_path": "/dashboard"
    }
  }'
```

### Record an Impression

```bash
curl -X POST $BANNEROS_API_BASE_URL/impressions \
  -H "Content-Type: application/json" \
  -d '{
    "banner_id": "<BANNER_ID>",
    "user_id": "user-123",
    "action": "view"
  }'
```

Supported actions: `view`, `click`, `dismiss`

---

## Default Configuration

- **Tenant ID:** `default` (pre-seeded when the API starts)
- **Max banners per page:** 3
- **Default dismiss duration:** 24 hours
- **Allowed banner types:** promotional, support, informational
- All API calls require `Content-Type: application/json`
- `tenant_id` is required in every evaluate and impression call

## Next Steps

- Learn about [banner types](./banner-types) and when to use each
- Configure [targeting rules](./targeting-rules) to reach the right users
- See the full [API reference](./api-reference)
- Read the [Integration Guide](./integration-guide) for framework-specific examples
