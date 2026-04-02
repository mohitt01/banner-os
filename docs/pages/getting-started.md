---
title: Getting Started
slug: /
icon: Rocket
order: 1
---

# Getting Started with BannerOS

Set up BannerOS in your application in under 5 minutes.

## Overview

BannerOS is a lightweight banner management platform that lets you create, target, and measure banners across your application. It consists of:

- **REST API** — Create and manage banners, evaluate targeting, track impressions
- **Dashboard** — Visual interface to manage banners, view stats, and validate configs
- **Direct API Integration** — Use fetch/HTTP calls from any language or framework

## Installation

Clone the repository and install dependencies:

```bash
git clone <repo-url> banner-ops
cd banner-ops
npm run install:all
```

## Start the Platform

Run all services (API, Dashboard, Docs, Demo App) with a single command:

```bash
npm run dev
```

This starts:

- **API** at `http://localhost:3001`
- **Dashboard** at `http://localhost:3000`
- **Docs** at `http://localhost:3003`
- **Demo App** at `http://localhost:5000`

Or run them individually:

```bash
npm run api        # API only
npm run dashboard  # Dashboard only
npm run docs       # Docs only
npm run demo-app   # Demo app only
```

## Seed Demo Data

Populate the database with sample banners:

```bash
npm run seed
```

This creates 6 demo banners across 3 types (promotional, support, informational) with varied targeting rules.

## Create Your First Banner

Using the REST API:

```bash
curl -X POST http://localhost:3001/api/banners \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome to our platform!",
    "body": "Check out our new features.",
    "type": "informational",
    "status": "active",
    "priority": 10
  }'
```

Or use the Dashboard at `http://localhost:3000` and click **Create Banner**.

## Evaluate Banners for a User

Call the evaluate endpoint to get banners for a specific user/context:

```bash
curl -X POST http://localhost:3001/api/evaluate \
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

## Record an Impression

```bash
curl -X POST http://localhost:3001/api/impressions \
  -H "Content-Type: application/json" \
  -d '{
    "banner_id": "<BANNER_ID>",
    "user_id": "user-123",
    "action": "view"
  }'
```

Supported actions: `view`, `click`, `dismiss`

## Default Configuration

- **Tenant ID:** `default` (pre-seeded when the API starts)
- **API Base URL:** `http://localhost:3001/api`
- **Max banners per page:** 3
- **Default dismiss duration:** 24 hours
- **Allowed banner types:** promotional, support, informational
- All API calls require `Content-Type: application/json`
- `tenant_id` is required in every evaluate and impression call

## Next Steps

- Learn about [banner types](/banner-types) and when to use each
- Configure [targeting rules](/targeting-rules) to reach the right users
- See the full [API reference](/api-reference)
- Read the [Integration Guide](/integration-guide) for framework-specific examples
