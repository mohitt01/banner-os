# BannerOS

A mini banner management platform with a REST API, dashboard UI, documentation site, MCP server, and demo app.

## Architecture

```
banner-ops/
├── api/          # Express + SQLite REST API (port 3001)
├── dashboard/    # React + Vite dashboard UI (port 3000)
├── docs/         # React + Vite documentation site (port 3003)
└── mcp-server/   # MCP server — guidance + live API ops (port 3002 HTTP / stdio)
```

- **API**: Node.js + Express + better-sqlite3 (embedded SQLite DB)
- **Dashboard**: React + Vite + TailwindCSS + Lucide icons
- **Docs**: React + Vite + TailwindCSS
- **MCP Server**: Model Context Protocol server with 23 tools (stdio for IDEs, HTTP for Docker)

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev
```

| Service    | URL                         |
|------------|-----------------------------|
| API        | http://localhost:3001        |
| Dashboard  | http://localhost:3000        |
| MCP Server | http://localhost:3002 (HTTP) |
| Docs       | http://localhost:3003        |

## Docker

```bash
# Core platform (API + Dashboard + Docs + MCP Server)
docker compose up
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
