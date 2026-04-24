[![Alwaysdata](https://img.shields.io/badge/Alwaysdata-%23E9568E.svg?style=for-the-badge&logo=alwaysdata&logoColor=white)](https://banner-os.alwaysdata.net/docs)
[![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=black)](https://banner-os.onrender.com/docs)

# BannerOS

A mini banner management platform with a REST API, dashboard UI, documentation site and MCP server.

## Test Drive
> If you're here for checking out the platform context layer with your Agent,
>   - Click on the badges above (AlwaysData or Render)
>   - Navigate to 'AI Agent Guide'
>   - Follow the instructions in the guide

## Architecture

```
banner-ops/
|-- api/          # Express REST API (SQLite/Valkey)
|-- dashboard/    # React dashboard UI (static build)
|-- docs/         # React documentation site (static build)
|-- mcp-server/   # MCP server (mounted in unified server)
|-- server.js      # Unified server (API + Dashboard + Docs + MCP)
```

- **API**: Node.js + Express + SQLite (default) or Valkey/Redis (production)
- **Dashboard**: React + Vite + TailwindCSS + Lucide icons (static build)
- **Docs**: React + Vite + TailwindCSS (static build)
- **MCP Server**: Model Context Protocol server with 23 tools (mounted in unified server)
- **Unified Server**: Single Express process serving everything on port 3001

## Database Options

BannerOS supports two database backends:

### SQLite (Default)
- **Best for**: Local development, small deployments
- **No external dependencies**
- **File-based storage** at `./api/banneros.db`

### Valkey/Redis (Production)
- **Best for**: Production, high concurrency, distributed deployments
- **In-memory with persistence**
- **Cluster support**
- **Use Valkey** (open-source Redis fork) or Redis

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database (choose ONE)
# Option 1: SQLite (default)
DATABASE_PATH=./api/banneros.db

# Option 2: Valkey/Redis (production)
BANNEROS_DB_URL=redis://localhost:6379
# Or with TLS:
BANNEROS_DB_URL=rediss://user:pass@valkey.example.com:6380
# Or cluster:
BANNEROS_DB_URL=redis://valkey-cluster:6379/0

# API Configuration
PORT=3001
BANNEROS_API_BASE_URL=http://localhost:3001/api
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Build dashboard and docs
npm run build

# Start unified server (API + Dashboard + Docs + MCP)
npm start
```

| Service    | URL                         |
|------------|-----------------------------|
| API        | http://localhost:3001/api    |
| Dashboard  | http://localhost:3001/       |
| MCP Server | http://localhost:3001/mcp    |
| Docs       | http://localhost:3001/docs   |

## Docker

```bash
# Build and run unified server (API + Dashboard + Docs + MCP)
# Uses SQLite by default. Set BANNEROS_DB_URL to use Valkey/Redis.
docker build -t banneros .
docker run -p 3001:3001 -e DATABASE_PATH=/data/banneros.db banneros
```

## API Endpoints

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | /api/banners                  | List banners                   |
| POST   | /api/banners                  | Create a banner                |
| GET    | /api/banners/:id              | Get a banner                   |
| PUT    | /api/banners/:id              | Update a banner                |
| DELETE | /api/banners/:id              | Delete a banner                |
| POST   | /api/evaluate                 | Evaluate banners for user      |
| POST   | /api/impressions              | Record an impression           |
| POST   | /api/impressions/dismiss      | Dismiss a banner               |
| GET    | /api/impressions/stats/:id    | Banner stats                   |
| GET    | /api/impressions/stats        | All stats                      |
| GET    | /api/tenants/:id              | Get tenant config              |
| PUT    | /api/tenants/:id              | Update tenant config           |
| POST   | /api/tenants                  | Create a tenant                |
| GET    | /api/validate                 | Validate banner configs        |
| GET    | /api/health                   | Health check                   |

## Banner Types

- **promotional** — Marketing campaigns, sales, launches
- **support** — Maintenance notices, outage alerts
- **informational** — Tips, onboarding, general announcements

## Targeting Rules

Banners can target users by: platforms, countries, user segments, page paths, specific user IDs, minimum app version, and authentication status. All rules use AND logic.
