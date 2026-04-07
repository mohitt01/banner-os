# BannerOS MCP Server

An MCP (Model Context Protocol) server for BannerOS — combines **live API operations** with **integration guidance** and **rich visual dashboards** via [MCP Apps](https://apps.extensions.modelcontextprotocol.io/api/).

Manage banners, evaluate targeting, view stats, and validate configurations directly from your IDE's AI chat — with interactive visual widgets rendered inline.

## Why MCP?

The MCP server is the **most powerful** way to use BannerOS with an AI agent. It includes everything from the Agent Skill, **plus**:

- **Live API tools** — create, update, delete banners, evaluate targeting, record impressions, view stats — all from chat
- **Rich UI (MCP Apps)** — tools render interactive HTML dashboards inline in your IDE. Banner lists, stats, validation reports appear as styled cards — not raw JSON.
- **Documentation as resources** — your AI can browse all BannerOS docs without leaving the conversation

## Architecture

- **API operation tools** — live HTTP calls to the BannerOS API (`BANNEROS_API_BASE_URL`, default `http://localhost:3001/api`)
- **Guidance tools** — serve documentation, placement schemas, integration patterns from `docs/pages/` markdown files
- **MCP App UI widgets** — tools marked with 🖼 render interactive HTML views inline in MCP Apps-capable clients (Windsurf, Claude, etc.). On other clients, they return structured JSON.
- **HTTP transport** — streamable HTTP server (`MCP_PORT` env var, for IDEs and Docker/network)
- **ext-apps bundle inlining** — widget HTML files in `widgets/` have the `@modelcontextprotocol/ext-apps` browser bundle inlined at startup (iframe CSP blocks CDN imports)

## Setup

### Windsurf / Cascade (HTTP)

Start the server in HTTP mode, then configure Windsurf to connect:

```bash
cd mcp-server && MCP_PORT=3002 node src/index.js
```

```json
{
  "mcpServers": {
    "banneros": {
      "serverUrl": "http://localhost:3002/mcp"
    }
  }
}
```

### Claude Code (HTTP)

```bash
claude mcp add --transport http banneros http://localhost:3002/mcp
```

### Cursor (HTTP)

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "banneros": {
      "serverUrl": "http://localhost:3002/mcp"
    }
  }
}
```

## API Operation Tools

These tools make live calls to the BannerOS API. The API server must be running.

| Tool | UI | Description |
|------|----|-------------|
| `health_check` | 🖼 | Check if the BannerOS API is running and healthy |
| `list_banners` | 🖼 | List all banners for a tenant with filtering (status, type) |
| `get_banner` | | Get a single banner by ID with full config |
| `create_banner` | | Create a new banner with targeting rules and CTA |
| `update_banner` | | Update an existing banner's fields |
| `delete_banner` | | Permanently delete a banner and its impressions |
| `evaluate_banners` | 🖼 | Evaluate which banners match a user/context — primary integration endpoint |
| `record_impression` | | Record a view, click, or dismiss event |
| `dismiss_banner` | | Dismiss a banner for a specific user |
| `get_banner_stats` | 🖼 | Detailed stats for a single banner (views, clicks, CTR, daily breakdown) |
| `get_tenant_stats` | 🖼 | Aggregate stats across all banners in a tenant |
| `validate_banners` | 🖼 | Run validation checks — flags bad configs, dates, targeting issues |
| `get_tenant_config` | | Get live tenant configuration |
| `update_tenant_config` | | Update tenant settings (max banners, allowed types, etc.) |

## Guidance Tools

These tools serve documentation and structured knowledge — no API connection required.

| Tool | Description |
|------|-------------|
| `get_docs` | Browse the docs index or read a specific doc by ID |
| `get_tenant_context` | Returns tenant config, API URLs, and connection details |
| `get_placement_schema` | Returns layout, z-index, and rendering strategy for a page/placement |
| `recommend_banner_integration` | Full integration recommendation: fetch, cache, fallback, layout, telemetry |
| `list_banner_types` | All banner types with descriptions, styling, and use cases |
| `get_fallback_policy` | What to show when no banners match or API is down |
| `testing_scenarios` | Test scenarios for verifying integration correctness |
| `get_skill` | Full merged BannerOS integration skill (SKILL.md + all references) |

## Available Resources

Each resource serves the corresponding markdown file from `docs/pages/`:

| Resource | URI | Source File |
|----------|-----|-------------|
| Getting Started | `banneros://docs/getting-started` | `docs/pages/getting-started.md` |
| Integration Guide | `banneros://docs/integration-guide` | `docs/pages/integration-guide.md` |
| Banner Types | `banneros://docs/banner-types` | `docs/pages/banner-types.md` |
| Targeting Rules | `banneros://docs/targeting-rules` | `docs/pages/targeting-rules.md` |
| API Reference | `banneros://docs/api-reference` | `docs/pages/api-reference.md` |
| AI Agent Guide | `banneros://docs/ai-agent-guide` | `docs/pages/ai-agent-guide.md` |

## MCP App UI Views — Rich Visual Dashboards

This is what makes the MCP server special. Tools with 🖼 render **interactive HTML dashboards** inline in the chat using the [MCP Apps extension](https://apps.extensions.modelcontextprotocol.io/api/). Your AI sees the same styled UI you do — no terminal output to parse.

On clients that don't support MCP Apps, tools still return structured JSON.

**Available views:**
- **List Banners** — sortable table with type/status badges, targeting summary, priority indicators
- **Evaluate Banners** — visual preview of matched banners with full context breakdown
- **Banner Stats / Tenant Stats** — dashboard with stat boxes, CTR metrics, and daily breakdown charts
- **Validate Banners** — error/warning report with severity badges and fix recommendations
- **Health Check** — status indicator with version info and connection details

Widget HTML files live in `widgets/` and use the `@modelcontextprotocol/ext-apps` browser bundle (inlined at startup to avoid CSP issues in sandboxed iframes).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BANNEROS_API_BASE_URL` | `http://localhost:3001/api` | BannerOS API base URL (must include `/api` suffix) |
| `MCP_PORT` | `3002` | Port for the HTTP MCP server (listens on `POST /mcp`) |

## Example Usage

```
# Check API is up
health_check()

# Create a banner
create_banner(title="Flash Sale", type="promotional", targeting_rules={platforms: ["web"], countries: ["US"]})

# Evaluate for a user
evaluate_banners(user_id="user-123", context={platform: "web", page_path: "/home", segment: "free", country: "US"})

# View stats dashboard
get_tenant_stats()

# Validate all banners
validate_banners()

# Get integration guidance
recommend_banner_integration(page="checkout", placement="checkout_top", framework="react")
```

## Content Files

Documentation files in `docs/pages/`:

- **getting-started.md** — Setup, installation, defaults, first banner
- **integration-guide.md** — React, Next.js, Vue, Vanilla JS examples, telemetry, caching, fallback
- **banner-types.md** — Promotional, support, informational
- **targeting-rules.md** — Platforms, countries, segments, etc.
- **api-reference.md** — All REST endpoints + data models
- **ai-agent-guide.md** — Agent Skill, prompt guide, MCP server setup

Agent Skill files in `docs/skill/`:

- **SKILL.md** — Main skill file for AI coding agents
- **references/** — Decision rules, anti-patterns, examples, validation checklist
