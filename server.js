/**
 * BannerOS Unified Server
 *
 * Single Express process serving:
 *   /api/*      → REST API (banners, evaluate, impressions, tenants, validate, health)
 *   /mcp        → MCP server (StreamableHTTP, POST only)
 *   /docs/*     → Docs site (static Vite build)
 *   /*          → Dashboard (static Vite build, SPA fallback)
 *
 * Environment variables:
 *   PORT                 — HTTP port (default 3001)
 *   DATABASE_PATH        — SQLite DB file path (default ./api/banneros.db)
 *   BASE_URL             — Public base URL (default http://localhost:$PORT)
 *   NODE_ENV             — "production" to serve static builds, otherwise dev proxy info
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { existsSync } from "node:fs";
import express from "express";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const BASE_URL = process.env.BASE_URL || `http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`;

// ─── Set BANNEROS_API_BASE_URL for MCP server's api.js (self-referencing in monolith)
process.env.BANNEROS_API_BASE_URL = `${BASE_URL}/api`;

// ─── Set DATABASE_PATH for API db.js
if (process.env.DATABASE_PATH) {
  process.env.BANNEROS_DB_PATH = process.env.DATABASE_PATH;
}

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// CORS — allow all in dev, restrict in production if needed
const cors = require("cors");
app.use(cors());

// ═════════════════════════════════════════════════════════════════════════════
// 1. API Routes (CJS — imported via createRequire)
// ═════════════════════════════════════════════════════════════════════════════

const bannersRouter = require("./api/src/routes/banners");
const evaluateRouter = require("./api/src/routes/evaluate");
const impressionsRouter = require("./api/src/routes/impressions");
const tenantsRouter = require("./api/src/routes/tenants");
const validateRouter = require("./api/src/routes/validate");

app.use("/api/banners", bannersRouter);
app.use("/api/evaluate", evaluateRouter);
app.use("/api/impressions", impressionsRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/validate", validateRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "BannerOS",
    version: "1.0.0",
    base_url: BASE_URL,
    api_base_url: BANNEROS_API_BASE_URL,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. MCP Server (ESM — mounted from mcp-server/src/index.js)
// ═════════════════════════════════════════════════════════════════════════════

try {
  const { mountMcp } = await import("./mcp-server/src/index.js");
  mountMcp(app);
  console.log("  ✓ MCP server mounted at POST /mcp");
} catch (err) {
  console.warn("  ⚠ MCP server failed to mount:", err.message);
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Static file serving (production builds of Dashboard + Docs)
// ═════════════════════════════════════════════════════════════════════════════

const dashboardDist = resolve(__dirname, "dashboard/dist");
const docsDist = resolve(__dirname, "docs/dist");

if (existsSync(docsDist)) {
  app.use("/docs", express.static(docsDist));
  // SPA fallback for docs
  app.get("/docs/*", (req, res) => {
    res.sendFile(join(docsDist, "index.html"));
  });
  console.log("  ✓ Docs site served at /docs");
} else {
  console.warn("  ⚠ docs/dist not found — run: cd docs && npm run build");
}

if (existsSync(dashboardDist)) {
  app.use(express.static(dashboardDist));
  // SPA fallback for dashboard (must be last — catches all unmatched routes)
  app.get("*", (req, res) => {
    // Don't catch API/MCP/docs routes
    if (req.path.startsWith("/api") || req.path.startsWith("/mcp") || req.path.startsWith("/docs")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(join(dashboardDist, "index.html"));
  });
  console.log("  ✓ Dashboard served at /");
} else {
  console.warn("  ⚠ dashboard/dist not found — run: cd dashboard && npm run build");
}

// ═════════════════════════════════════════════════════════════════════════════
// Start
// ═════════════════════════════════════════════════════════════════════════════

app.listen(PORT, HOST, () => {
  console.log(`\nBannerOS running on ${BASE_URL}`);
  console.log(`  Dashboard: ${BASE_URL}/`);
  console.log(`  API:       ${BASE_URL}/api`);
  console.log(`  Docs:      ${BASE_URL}/docs`);
  console.log(`  MCP:       ${BASE_URL}/mcp`);
});
