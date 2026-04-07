import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import express from "express";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DOCS_TREE, PLACEMENT_SCHEMAS, FALLBACK_POLICIES, CACHING_GUIDANCE,
  TELEMETRY_EXPECTATIONS, INTEGRATION_PATTERNS, loadContent,
} from "./knowledge.js";
import * as api from "./api.js";
import {
  listBannersView, evaluateBannersView, statsView,
  validateView, healthView,
} from "./views.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Helper: wrap API calls with error handling ──────────────────────────────

function safeApiCall(fn) {
  return (async () => {
    try {
      const data = await fn();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }, null, 2) }],
        isError: true,
      };
    }
  })();
}

// ═════════════════════════════════════════════════════════════════════════════
// Server factory — creates a fully configured McpServer instance.
// HTTP mode creates a single shared server; stdio mode uses one too.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Mount MCP server routes on an existing Express app.
 * Used by the unified server.js to avoid duplicating MCP SDK imports.
 */
export function mountMcp(app) {
  app.post("/mcp", async (req, res) => {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: null });
      }
    }
  });

  app.get("/mcp/health", (req, res) => {
    res.json({ status: "ok", service: "BannerOS MCP Server", version: "2.0.0" });
  });
}

export function createServer() {
  const server = new McpServer({
    name: "banneros",
    version: "2.0.0",
  }, {
    instructions: "BannerOS integration & operations server. Configure BANNEROS_API_BASE_URL (e.g., http://localhost:3001/api). Use list_banners or health_check to verify connectivity before other operations. For integration guidance, call get_skill for the full guide or get_docs for specific topics.",
  });

  // ─── Helper: register a tool + its MCP App UI view ─────────────────────────

  function registerToolWithUI(name, opts, handler, viewHtml) {
    const resourceUri = `ui://${name}/view.html`;

    registerAppTool(server, name, {
      ...opts,
      _meta: { ui: { resourceUri } },
    }, handler);

    registerAppResource(server, name, resourceUri, {},
      async () => ({
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: viewHtml }],
      }),
    );
  }

// ═════════════════════════════════════════════════════════════════════════════
// PART 1: API OPERATION TOOLS (live calls to BannerOS API)
// ═════════════════════════════════════════════════════════════════════════════

// ─── Health Check (with UI) ──────────────────────────────────────────────────

registerToolWithUI(
  "health_check",
  {
    title: "Health Check",
    description: "Check if the BannerOS API server is running and healthy",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => safeApiCall(() => api.healthCheck()),
  healthView,
);

// ─── List Banners (with UI) ──────────────────────────────────────────────────

registerToolWithUI(
  "list_banners",
  {
    title: "List Banners",
    description: "List all banners for a tenant, optionally filtered by status or type. Returns a rich table view.",
    inputSchema: {
      tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
      status: z.enum(["active", "inactive", "draft"]).optional().describe("Filter by banner status"),
      type: z.enum(["promotional", "support", "informational"]).optional().describe("Filter by banner type"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ tenant_id, status, type }) =>
    safeApiCall(() => api.listBanners(tenant_id, { status, type })),
  listBannersView,
);

// ─── Get Banner ──────────────────────────────────────────────────────────────

server.tool(
  "get_banner",
  "Get a single banner by its ID, including its full configuration and targeting rules",
  {
    banner_id: z.string().describe("The banner UUID"),
  },
  async ({ banner_id }) => safeApiCall(() => api.getBanner(banner_id)),
);

// ─── Create Banner ───────────────────────────────────────────────────────────

server.tool(
  "create_banner",
  "Create a new banner with title, body, type, targeting rules, and optional CTA. Returns the created banner.",
  {
    tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    title: z.string().describe("Banner title (required)"),
    body: z.string().optional().describe("Banner body text"),
    type: z.enum(["promotional", "support", "informational"]).optional().describe("Banner type. Defaults to 'informational'"),
    status: z.enum(["active", "inactive", "draft"]).optional().describe("Banner status. Defaults to 'active'"),
    priority: z.number().optional().describe("Priority (higher = shown first). Defaults to 0"),
    targeting_rules: z.object({
      platforms: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      user_segments: z.array(z.string()).optional(),
      is_authenticated: z.boolean().optional(),
      page_paths: z.array(z.string()).optional(),
      user_ids: z.array(z.string()).optional(),
      min_app_version: z.string().optional(),
    }).optional().describe("Targeting rules object"),
    style: z.object({}).passthrough().optional().describe("Custom style overrides as key-value pairs"),
    cta_text: z.string().optional().describe("Call-to-action button text"),
    cta_url: z.string().optional().describe("Call-to-action URL"),
    start_date: z.string().optional().describe("ISO 8601 start date"),
    end_date: z.string().optional().describe("ISO 8601 end date"),
  },
  async (params) => safeApiCall(() => api.createBanner(params)),
);

// ─── Update Banner ───────────────────────────────────────────────────────────

server.tool(
  "update_banner",
  "Update an existing banner's fields. Only provided fields are changed.",
  {
    banner_id: z.string().describe("The banner UUID to update"),
    title: z.string().optional().describe("New title"),
    body: z.string().optional().describe("New body text"),
    type: z.enum(["promotional", "support", "informational"]).optional(),
    status: z.enum(["active", "inactive", "draft"]).optional(),
    priority: z.number().optional(),
    targeting_rules: z.object({
      platforms: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      user_segments: z.array(z.string()).optional(),
      is_authenticated: z.boolean().optional(),
      page_paths: z.array(z.string()).optional(),
      user_ids: z.array(z.string()).optional(),
      min_app_version: z.string().optional(),
    }).optional(),
    style: z.object({}).passthrough().optional(),
    cta_text: z.string().optional(),
    cta_url: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  },
  async ({ banner_id, ...updates }) => safeApiCall(() => api.updateBanner(banner_id, updates)),
);

// ─── Delete Banner ───────────────────────────────────────────────────────────

server.tool(
  "delete_banner",
  "Permanently delete a banner and all its impression data",
  {
    banner_id: z.string().describe("The banner UUID to delete"),
  },
  async ({ banner_id }) => safeApiCall(() => api.deleteBanner(banner_id)),
);

// ─── Evaluate Banners (with UI) ──────────────────────────────────────────────

registerToolWithUI(
  "evaluate_banners",
  {
    title: "Evaluate Banners",
    description: "Evaluate which banners should be shown for a given user and context. This is the primary integration endpoint — returns matched banners with a visual preview.",
    inputSchema: {
      tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
      user_id: z.string().optional().describe("User ID for personalization and dismiss tracking"),
      context: z.object({
        platform: z.string().optional().describe("'web', 'mobile', 'desktop'"),
        page_path: z.string().optional().describe("Current page path, e.g. '/home', '/checkout'"),
        segment: z.string().optional().describe("User segment, e.g. 'free', 'pro', 'enterprise'"),
        country: z.string().optional().describe("ISO country code, e.g. 'US', 'GB'"),
        is_authenticated: z.boolean().optional(),
        app_version: z.string().optional(),
      }).optional().describe("User/session context for targeting"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ tenant_id, user_id, context }) =>
    safeApiCall(() => api.evaluateBanners({ tenant_id, user_id, context })),
  evaluateBannersView,
);

// ─── Record Impression ───────────────────────────────────────────────────────

server.tool(
  "record_impression",
  "Record a banner impression event (view, click, or dismiss)",
  {
    banner_id: z.string().describe("The banner UUID"),
    tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    user_id: z.string().optional().describe("User ID"),
    action: z.enum(["view", "click", "dismiss"]).optional().describe("Impression action. Defaults to 'view'"),
    context: z.object({}).passthrough().optional().describe("Additional context metadata"),
  },
  async (params) => safeApiCall(() => api.recordImpression(params)),
);

// ─── Dismiss Banner ──────────────────────────────────────────────────────────

server.tool(
  "dismiss_banner",
  "Dismiss a banner for a specific user so it won't be shown again",
  {
    banner_id: z.string().describe("The banner UUID"),
    tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    user_id: z.string().describe("User ID (required for dismiss tracking)"),
  },
  async (params) => safeApiCall(() => api.dismissBanner(params)),
);

// ─── Banner Stats (with UI) ─────────────────────────────────────────────────

registerToolWithUI(
  "get_banner_stats",
  {
    title: "Banner Stats",
    description: "Get detailed impression stats for a specific banner, including views, clicks, CTR, and daily breakdown. Renders a visual dashboard.",
    inputSchema: {
      banner_id: z.string().describe("The banner UUID"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ banner_id }) => safeApiCall(() => api.getBannerStats(banner_id)),
  statsView,
);

// ─── Tenant Stats (with UI) ─────────────────────────────────────────────────

registerToolWithUI(
  "get_tenant_stats",
  {
    title: "Tenant Stats",
    description: "Get aggregate impression stats for all banners in a tenant. Renders a visual comparison dashboard.",
    inputSchema: {
      tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ tenant_id }) => safeApiCall(() => api.getTenantStats(tenant_id)),
  statsView,
);

// ─── Validate Banners (with UI) ──────────────────────────────────────────────

registerToolWithUI(
  "validate_banners",
  {
    title: "Validate Banners",
    description: "Run validation checks on all banners for a tenant — flags missing fields, bad dates, CTA issues, targeting problems, and policy violations. Renders a visual report.",
    inputSchema: {
      tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ tenant_id }) => safeApiCall(() => api.validateBanners(tenant_id)),
  validateView,
);

// ─── Get Tenant Config ───────────────────────────────────────────────────────

server.tool(
  "get_tenant_config",
  "Get the live tenant configuration from the API, including maxBannersPerPage, allowed types, and dismiss duration",
  {
    tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
  },
  async ({ tenant_id = "default" }) => safeApiCall(() => api.getTenant(tenant_id)),
);

// ─── Update Tenant Config ────────────────────────────────────────────────────

server.tool(
  "update_tenant_config",
  "Update a tenant's configuration (name, maxBannersPerPage, allowed banner types, dismiss duration, etc.)",
  {
    tenant_id: z.string().optional().describe("Tenant ID. Defaults to 'default'"),
    name: z.string().optional().describe("Tenant display name"),
    config: z.object({
      maxBannersPerPage: z.number().optional(),
      defaultDismissDuration: z.number().optional(),
      allowPromotional: z.boolean().optional(),
      allowSupport: z.boolean().optional(),
      allowInformational: z.boolean().optional(),
    }).optional().describe("Tenant configuration overrides"),
  },
  async ({ tenant_id = "default", name, config }) =>
    safeApiCall(() => api.updateTenant(tenant_id, { name, config })),
);

// ═════════════════════════════════════════════════════════════════════════════
// PART 2: GUIDANCE TOOLS (knowledge base — no API calls)
// ═════════════════════════════════════════════════════════════════════════════

// ─── Resources (served from content/ markdown files) ─────────────────────────

for (const section of DOCS_TREE.sections) {
  server.resource(
    section.id,
    `banneros://docs/${section.id}`,
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "text/markdown",
        text: loadContent(section.file),
      }],
    })
  );
}

// ─── Guidance Tools ──────────────────────────────────────────────────────────

server.tool(
  "get_docs",
  "Returns the full documentation tree index, or the content of a specific doc by ID",
  {
    doc_id: z.string().optional().describe("Document ID, e.g. 'api-reference', 'banner-types', 'integration-guide'. Omit to get the full index."),
  },
  async ({ doc_id }) => {
    if (!doc_id) {
      return { content: [{ type: "text", text: JSON.stringify(DOCS_TREE, null, 2) }] };
    }
    const section = DOCS_TREE.sections.find(s => s.id === doc_id);
    if (!section) {
      const ids = DOCS_TREE.sections.map(s => s.id).join(", ");
      return { content: [{ type: "text", text: `Unknown doc_id "${doc_id}". Available: ${ids}` }] };
    }
    return { content: [{ type: "text", text: loadContent(section.file) }] };
  }
);

server.tool(
  "get_tenant_context",
  "Returns the default tenant configuration, approved defaults, and connection details for BannerOS integration",
  { tenant_id: z.string().optional().describe("Tenant ID to look up. Defaults to 'default'") },
  async ({ tenant_id = "default" }) => {
    const defaults = loadContent("approved-defaults.md");
    return {
      content: [{
        type: "text",
        text: `# Tenant: ${tenant_id}\n\n${defaults}`,
      }],
    };
  }
);

server.tool(
  "get_placement_schema",
  "Returns the recommended placement schema for a specific page location, including layout reservation, z-index, and rendering strategy",
  {
    page: z.string().describe("Page name, e.g. 'home', 'checkout', 'cart', 'product', 'account'"),
    placement: z.string().optional().describe("Placement ID within the page, e.g. 'top', 'sidebar', 'inline', 'modal'"),
  },
  async ({ page, placement = "top" }) => {
    const key = `${page}_${placement}`;
    const schema = PLACEMENT_SCHEMAS[key] || PLACEMENT_SCHEMAS[page] || generatePlacementSchema(page, placement);
    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
  }
);

server.tool(
  "recommend_banner_integration",
  "Returns a complete integration recommendation for a specific page and placement, including fetch strategy, caching, fallback, layout, telemetry, and code patterns",
  {
    page: z.string().describe("Page name, e.g. 'home', 'checkout', 'cart', 'product'"),
    placement: z.string().optional().describe("Placement within the page, e.g. 'top', 'sidebar', 'checkout_top'"),
    framework: z.string().optional().describe("Frontend framework, e.g. 'react', 'nextjs', 'vue', 'vanilla'"),
  },
  async ({ page, placement = "top", framework = "react" }) => {
    const placementKey = `${page}_${placement}`;
    const schema = PLACEMENT_SCHEMAS[placementKey] || PLACEMENT_SCHEMAS[page] || generatePlacementSchema(page, placement);
    const pattern = INTEGRATION_PATTERNS[framework] || INTEGRATION_PATTERNS.react;
    const caching = CACHING_GUIDANCE[page] || CACHING_GUIDANCE.default;
    const fallback = FALLBACK_POLICIES[page] || FALLBACK_POLICIES.default;
    const telemetry = TELEMETRY_EXPECTATIONS;

    const recommendations = [];

    if (["checkout", "cart"].includes(page)) {
      recommendations.push(`Use server-side fetch or early client fetch to avoid visual flicker on ${page}`);
    } else {
      recommendations.push(`Use client-side fetch on mount for ${page} page banners`);
    }

    recommendations.push(`Use ${pattern.description}`);
    recommendations.push(`Tenant ID should come from app config or environment variable`);
    recommendations.push(`Cache banner response for ${caching.ttl} — ${caching.strategy}`);
    if (caching.stale_on_error) {
      recommendations.push("Use stale-on-error fallback: serve cached banners if API is unreachable");
    }
    recommendations.push(`Reserve ${schema.reserved_height} layout space to prevent CLS`);
    recommendations.push(`z-index: ${schema.z_index}`);
    recommendations.push(`Fallback: ${fallback.behavior}`);
    if (fallback.default_banner) {
      recommendations.push(`Use default ${fallback.default_banner} banner if no match`);
    }
    recommendations.push(`Emit ${telemetry.required_events.join(" and ")} events`);
    if (telemetry.optional_events.length) {
      recommendations.push(`Optionally emit ${telemetry.optional_events.join(", ")} events`);
    }
    if (page === "checkout") {
      recommendations.push("Do not use personalized targeting on checkout in demo mode");
      recommendations.push("Prefer promotional or support banner types only");
    }
    if (page === "cart") {
      recommendations.push("Show promotional banners (upsells, free shipping thresholds)");
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          page,
          placement,
          framework,
          recommendations,
          placement_schema: schema,
          api_endpoints: {
            evaluate: "POST /api/evaluate",
            record_impression: "POST /api/impressions",
            dismiss: "POST /api/impressions/dismiss",
          },
          evaluate_payload_example: {
            tenant_id: "default",
            user_id: "<user_id>",
            context: {
              platform: "web",
              page_path: `/${page}`,
              segment: "<user_segment>",
              country: "<country_code>",
              is_authenticated: true,
            },
          },
          integration_guide_ref: `See full code examples in integration-guide.md (section: ${framework})`,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  "list_banner_types",
  "Returns all supported banner types with their descriptions, use cases, and styling guidance",
  {},
  async () => {
    return { content: [{ type: "text", text: loadContent("banner-types.md") }] };
  }
);

server.tool(
  "get_fallback_policy",
  "Returns the fallback policy for a specific page or the global default. Describes what to show when no banners match or the API is unavailable",
  { page: z.string().optional().describe("Page name, e.g. 'checkout', 'home'. Omit for global default") },
  async ({ page }) => {
    if (!page) {
      return { content: [{ type: "text", text: loadContent("fallback-policies.md") }] };
    }
    const policy = FALLBACK_POLICIES[page] || FALLBACK_POLICIES.default;
    return { content: [{ type: "text", text: JSON.stringify({ page, ...policy }, null, 2) }] };
  }
);


server.tool(
  "testing_scenarios",
  "Returns a set of test scenarios for verifying BannerOS integration, including user contexts, expected banner matches, and edge cases",
  {
    page: z.string().optional().describe("Filter scenarios for a specific page"),
  },
  async ({ page }) => {
    return { content: [{ type: "text", text: loadContent("testing-scenarios.md") }] };
  }
);

server.tool(
  "get_skill",
  "Returns the full BannerOS integration skill — a merged document of SKILL.md + all references (decision rules, anti-patterns, examples, validation checklist). Use this to get comprehensive integration guidance in one call.",
  {},
  async () => {
    const skillDir = resolve(__dirname, "../../docs/skill");
    const parts = [
      readFileSync(resolve(skillDir, "SKILL.md"), "utf-8").replace(/^---[\s\S]*?---\s*/, ""),
      readFileSync(resolve(skillDir, "references/decision-rules.md"), "utf-8"),
      readFileSync(resolve(skillDir, "references/anti-patterns.md"), "utf-8"),
      readFileSync(resolve(skillDir, "references/examples.md"), "utf-8"),
      readFileSync(resolve(skillDir, "references/validation-checklist.md"), "utf-8"),
    ];
    return { content: [{ type: "text", text: parts.join("\n\n---\n\n") }] };
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

  function generatePlacementSchema(page, placement) {
    const defaults = {
      top: { reserved_height: "80px", z_index: 10, position: "relative", display: "block" },
      sidebar: { reserved_height: "auto", z_index: 1, position: "relative", display: "block" },
      inline: { reserved_height: "60px", z_index: 1, position: "relative", display: "block" },
      modal: { reserved_height: "auto", z_index: 1000, position: "fixed", display: "flex" },
    };
    const base = defaults[placement] || defaults.top;
    return {
      page,
      placement,
      ...base,
      max_banners: placement === "modal" ? 1 : 3,
      render_strategy: placement === "modal" ? "overlay" : "stack",
      animation: placement === "modal" ? "fade-in" : "slide-down",
      dismiss_behavior: "remove from DOM, record dismiss impression",
    };
  }

  return server;
}

// ═════════════════════════════════════════════════════════════════════════════
// Start — only when run directly (not when imported by unified server.js)
// ═════════════════════════════════════════════════════════════════════════════

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule && process.env.MCP_PORT) {
  // Streamable HTTP mode — used by Windsurf serverUrl, Docker, network deployments.
  // POST /mcp → JSON-RPC over streamable HTTP (stateless — fresh server+transport per request)
  // GET /health → simple health check
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: null });
      }
    }
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "BannerOS MCP Server", version: "2.0.0" });
  });

  app.listen(parseInt(MCP_PORT, 10), "0.0.0.0", () => {
    console.log(`BannerOS MCP Server (HTTP) running on http://0.0.0.0:${MCP_PORT}/mcp`);
  });
} else if (isMainModule) {
  // Stdio mode — used by IDEs (Windsurf, Cursor, Claude Code)
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
