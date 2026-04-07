#!/usr/bin/env node

/**
 * BannerOS Client Script — self-contained, zero dependencies.
 * 
 * Lets an AI agent (or developer) operate BannerOS directly from the command line.
 * Requires Node.js 18+ (for built-in fetch).
 *
 * Usage:
 *   node banneros-client.js <command> [options as JSON]
 *
 * Examples:
 *   node banneros-client.js health
 *   node banneros-client.js list-banners
 *   node banneros-client.js evaluate '{"user_id":"user-1","context":{"platform":"web","page_path":"/home"}}'
 *   node banneros-client.js create-banner '{"title":"Sale!","type":"promotional","priority":100}'
 *   node banneros-client.js get-tenant
 *   node banneros-client.js update-tenant '{"config":{"maxBannersPerPage":5}}'
 *
 * Environment:
 *   BANNEROS_API_BASE_URL  — API base URL (default: http://localhost:3001)
 *   BANNEROS_TENANT   — Tenant ID (default: default)
 */

const API = process.env.BANNEROS_API_BASE_URL || 'http://localhost:3001';
const TENANT = process.env.BANNEROS_TENANT || 'default';

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function put(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function del(path) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE' });
  return res.json();
}

// ─── Commands ────────────────────────────────────────────────────────────────

const commands = {

  // --- Health & status ---

  async health() {
    return get('/api/health');
  },

  async validate() {
    return get(`/api/validate?tenant_id=${TENANT}`);
  },

  // --- Banners ---

  async 'list-banners'(opts = {}) {
    const params = new URLSearchParams({ tenant_id: TENANT, ...opts });
    return get(`/api/banners?${params}`);
  },

  async 'get-banner'(opts) {
    if (!opts.id) throw new Error('Required: id');
    return get(`/api/banners/${opts.id}`);
  },

  async 'create-banner'(opts) {
    if (!opts.title) throw new Error('Required: title');
    return post('/api/banners', { tenant_id: TENANT, status: 'active', ...opts });
  },

  async 'update-banner'(opts) {
    if (!opts.id) throw new Error('Required: id');
    const { id, ...body } = opts;
    return put(`/api/banners/${id}`, body);
  },

  async 'delete-banner'(opts) {
    if (!opts.id) throw new Error('Required: id');
    return del(`/api/banners/${opts.id}`);
  },

  // --- Evaluate ---

  async evaluate(opts = {}) {
    return post('/api/evaluate', {
      tenant_id: TENANT,
      user_id: opts.user_id || 'anonymous',
      context: opts.context || { platform: 'web' },
    });
  },

  // --- Impressions ---

  async impression(opts) {
    if (!opts.banner_id || !opts.action) throw new Error('Required: banner_id, action (view|click|dismiss)');
    return post('/api/impressions', {
      tenant_id: TENANT,
      ...opts,
    });
  },

  async dismiss(opts) {
    if (!opts.banner_id || !opts.user_id) throw new Error('Required: banner_id, user_id');
    return post('/api/impressions/dismiss', {
      tenant_id: TENANT,
      ...opts,
    });
  },

  async stats(opts = {}) {
    if (opts.banner_id) {
      return get(`/api/impressions/stats/${opts.banner_id}`);
    }
    return get(`/api/impressions/stats?tenant_id=${TENANT}`);
  },

  async 'banner-stats'(opts) {
    if (!opts.banner_id) throw new Error('Required: banner_id');
    return get(`/api/impressions/stats/${opts.banner_id}`);
  },

  async 'tenant-stats'(opts = {}) {
    return get(`/api/impressions/stats?tenant_id=${TENANT}`);
  },

  // --- Tenant ---

  async 'get-tenant'() {
    return get(`/api/tenants/${TENANT}`);
  },

  async 'update-tenant'(opts = {}) {
    return put(`/api/tenants/${TENANT}`, opts);
  },

};

// ─── CLI runner ──────────────────────────────────────────────────────────────

async function main() {
  const [,, command, jsonArg] = process.argv;

  if (!command || command === 'help' || command === '--help') {
    console.log(`
BannerOS Client — operate BannerOS from the command line.

Commands:
  health                              Check API health
  validate                            Validate all banners for config issues
  list-banners [opts]                 List banners (opts: status, type)
  get-banner '{"id":"..."}'           Get a single banner
  create-banner '{"title":"...","type":"promotional","priority":100}'
  update-banner '{"id":"...","title":"New Title"}'
  delete-banner '{"id":"..."}'        Delete a banner
  evaluate [opts]                     Evaluate banners for a user context
  impression '{"banner_id":"...","action":"view","user_id":"..."}'
  dismiss '{"banner_id":"...","user_id":"..."}'
  stats [opts]                        Get impression stats (opts: banner_id)
  banner-stats '{"banner_id":"..."}'  Get detailed stats for a single banner
  tenant-stats                        Get aggregate stats for all banners
  get-tenant                          Get tenant configuration
  update-tenant '{"config":{...}}'    Update tenant configuration

Environment:
  BANNEROS_API_URL   API base (default: http://localhost:3001)
  BANNEROS_TENANT    Tenant ID (default: default)
`.trim());
    process.exit(0);
  }

  const fn = commands[command];
  if (!fn) {
    console.error(`Unknown command: ${command}`);
    console.error(`Run with --help to see available commands.`);
    process.exit(1);
  }

  let opts = {};
  if (jsonArg) {
    try {
      opts = JSON.parse(jsonArg);
    } catch {
      console.error(`Invalid JSON argument: ${jsonArg}`);
      process.exit(1);
    }
  }

  try {
    const result = await fn(opts);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }, null, 2));
    process.exit(1);
  }
}

main();
