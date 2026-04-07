---
title: Getting Started
slug: /
icon: Rocket
order: 1
---

# Getting Started with BannerOS

BannerOS is a lightweight banner management platform that lets you create, target, and measure banners across your application.

## Choose Your Setup

You can use BannerOS in three ways:

1. **Hosted Version** — Use a deployed instance (no local installation needed)
2. **Local Development** — Run the platform locally on your machine
3. **Docker** — Containerized deployment for development or production

---

## Using the Hosted Version

The hosted BannerOS platform is ready to use immediately. No installation required.

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

## Running Locally

For development, testing, or self-hosting, run BannerOS on your local machine.

### Installation

Clone the repository and install dependencies:

```bash
git clone <repo-url> banner-ops
cd banner-ops
npm run install:all
```

### Start the Platform

Run all services with a single command:

```bash
npm run dev
```

This starts:

- **API** at `http://localhost:3001/api`
- **Dashboard** at `http://localhost:3000`
- **Docs** at `http://localhost:3003`

Or run them individually:

```bash
npm run api        # API only
npm run dashboard  # Dashboard only
npm run docs       # Docs only
```

### Seed Demo Data

Populate the database with sample banners:

```bash
npm run seed
```

This creates 6 demo banners across 3 types (promotional, support, informational) with varied targeting rules.

### API Base URL (Local)

```
http://localhost:3001/api
```

Use this in your local development:

```bash
export BANNEROS_API_BASE_URL=http://localhost:3001/api
```

### Create Your First Banner (Local)

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

### Evaluate Banners for a User (Local)

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

### Record an Impression (Local)

```bash
curl -X POST http://localhost:3001/api/impressions \
  -H "Content-Type: application/json" \
  -d '{
    "banner_id": "<BANNER_ID>",
    "user_id": "user-123",
    "action": "view"
  }'
```

---

## Docker Deployment

For containerized development or production deployment, use Docker.

### Quick Start

```bash
# Build and run the unified BannerOS server
docker build -t banneros .
docker run -p 3001:3001 -v $(pwd)/data:/app/data banneros

# Run in background with data persistence
docker run -d -p 3001:3001 -v $(pwd)/data:/app/data --name banneros banneros

# Stop the container
docker stop banneros
```

This starts the unified BannerOS server at:

- **Dashboard** at `http://localhost:3001`
- **API** at `http://localhost:3001/api`
- **Docs** at `http://localhost:3001/docs`
- **MCP Server** at `POST http://localhost:3001/mcp`

### API Base URL (Docker)

```
http://localhost:3001/api
```

Use this in your Docker-based development:

```bash
export BANNEROS_API_BASE_URL=http://localhost:3001/api
```

### Seed Demo Data (Docker)

```bash
# Execute seed command in running container
docker exec banneros npm run seed

# Or seed during build (add to Dockerfile if needed)
```

### Environment Variables (Docker)

You can configure the container with environment variables:

```bash
docker run -p 3001:3001 \
  -e BANNEROS_API_BASE_URL=http://localhost:3001/api \
  -e DATABASE_PATH=/app/data/banneros.db \
  -v $(pwd)/data:/app/data \
  banneros
```

### Production Deployment

For production deployment:

```bash
# Build production image
docker build -t banneros:latest .

# Run with proper environment variables
docker run -d \
  -p 3001:3001 \
  -e BANNEROS_API_BASE_URL=https://your-domain.com/api \
  -e DATABASE_PATH=/app/data/banneros.db \
  -v banneros-data:/app/data \
  --name banneros-prod \
  banneros:latest
```

---

## Default Configuration

- **Tenant ID:** `default` (pre-seeded when the API starts)
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
