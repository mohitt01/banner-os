/**
 * MCP Server Knowledge Base
 *
 * Structured data that tools need for programmatic access (placement schemas,
 * code-generation templates, etc.). Prose documentation lives in the shared
 * docs/pages/ markdown files — see loadContent() and buildDocsTree() in this file.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, "../../docs/pages");

// ─── Content loader — reads markdown files from docs/pages/ ─────────────────────
export function loadContent(filename) {
  try {
    return readFileSync(resolve(CONTENT_DIR, filename), "utf-8");
  } catch (e) {
    return `# Error\n\nCould not load ${filename}: ${e.message}`;
  }
}

export function loadAllContent() {
  const files = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
  const result = {};
  for (const key of files) {
    result[key] = loadContent(`${key}.md`);
  }
  return result;
}

// ─── Dynamic docs tree builder — parses frontmatter from all docs/pages/*.md ────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (/^\d+$/.test(val)) val = parseInt(val, 10);
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

export function buildDocsTree() {
  const files = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const raw = readFileSync(resolve(CONTENT_DIR, filename), 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      const id = filename.replace('.md', '');
      return {
        id,
        file: filename,
        title: meta.title || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        slug: meta.slug || `/${id}`,
        icon: meta.icon || 'FileText',
        order: meta.order ?? 50,
        special: meta.special || false,
        description: body.split('\n')[0].replace(/^#+\s*/, '') || `Documentation for ${id}`,
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    title: "BannerOS Documentation",
    source: "docs/pages/ directory (markdown)",
    docs_site: (process.env.BASE_URL || "http://localhost:3001") + "/docs",
    sections: files,
  };
}

// ─── Cached docs tree (built once on import) ────────────────────────────────────
export const DOCS_TREE = buildDocsTree();

// ─── Placement Schemas (structured — tools need these as JSON) ───────────────
export const PLACEMENT_SCHEMAS = {
  home_top:           { page: "home",     placement: "top",     reserved_height: "80px", z_index: 10,   max_banners: 3, render_strategy: "stack",  animation: "slide-down", recommended_types: ["promotional", "informational"], notes: "Primary placement — highest priority banners" },
  home_inline:        { page: "home",     placement: "inline",  reserved_height: "60px", z_index: 1,    max_banners: 1, render_strategy: "single", animation: "fade-in",    recommended_types: ["promotional"],                  notes: "Between product rows for contextual promotions" },
  cart_top:           { page: "cart",     placement: "top",     reserved_height: "70px", z_index: 10,   max_banners: 2, render_strategy: "stack",  animation: "slide-down", recommended_types: ["promotional", "support"],       notes: "Shipping thresholds, upsells, maintenance warnings" },
  checkout_top:       { page: "checkout", placement: "top",     reserved_height: "90px", z_index: 10,   max_banners: 1, render_strategy: "single", animation: "fade-in",    recommended_types: ["support", "promotional"],       notes: "Minimal disruption — prefer support. No personalized targeting in demo." },
  checkout_sidebar:   { page: "checkout", placement: "sidebar", reserved_height: "auto", z_index: 1,    max_banners: 1, render_strategy: "single", animation: "fade-in",    recommended_types: ["promotional"],                  notes: "Trust badges, low-intrusion promotions only" },
  product_top:        { page: "product",  placement: "top",     reserved_height: "70px", z_index: 10,   max_banners: 2, render_strategy: "stack",  animation: "slide-down", recommended_types: ["promotional", "informational"], notes: "Product-level promotions, sale callouts" },
  account_top:        { page: "account",  placement: "top",     reserved_height: "70px", z_index: 10,   max_banners: 2, render_strategy: "stack",  animation: "slide-down", recommended_types: ["informational", "support"],     notes: "Account alerts, verification, plan nudges" },
};

// ─── Fallback Policies (structured) ──────────────────────────────────────────
export const FALLBACK_POLICIES = {
  default:  { behavior: "Show nothing — collapse after 2s", default_banner: null, retry: { enabled: true, max_attempts: 2, delay_ms: 3000 }, stale_on_error: true,  stale_ttl: "10 minutes" },
  home:     { behavior: "Static welcome message if API unreachable", default_banner: "Welcome to the store! Free shipping on orders over $75.", retry: { enabled: true, max_attempts: 2, delay_ms: 3000 }, stale_on_error: true,  stale_ttl: "10 minutes" },
  checkout: { behavior: "Show nothing — never interrupt checkout", default_banner: null, retry: { enabled: false, max_attempts: 0, delay_ms: 0 }, stale_on_error: false, stale_ttl: "0" },
  cart:     { behavior: "Static free-shipping banner if API unreachable", default_banner: "Free shipping on orders over $75!", retry: { enabled: true, max_attempts: 1, delay_ms: 2000 }, stale_on_error: true,  stale_ttl: "5 minutes" },
};

// ─── Caching (structured) ────────────────────────────────────────────────────
export const CACHING_GUIDANCE = {
  default:  { ttl: "5 minutes",     strategy: "in-memory cache keyed by tenant_id + user_id + context hash", stale_on_error: true },
  home:     { ttl: "5 minutes",     strategy: "in-memory cache, refresh on focus/visibility change",         stale_on_error: true },
  checkout: { ttl: "0 (no cache)",  strategy: "always fetch fresh",                                          stale_on_error: false },
  cart:     { ttl: "2 minutes",     strategy: "in-memory cache, invalidate when cart changes",               stale_on_error: true },
};

// ─── Telemetry (structured) ──────────────────────────────────────────────────
export const TELEMETRY_EXPECTATIONS = {
  required_events: ["banner_impression", "banner_click"],
  optional_events: ["banner_dismiss", "banner_cta_hover", "banner_visible_time"],
};

// ─── Integration code generators (framework-specific) ────────────────────────
export const INTEGRATION_PATTERNS = {
  react:   { id: "react",   description: "React: custom hook (useEffect + fetch) to call POST /api/evaluate on mount" },
  nextjs:  { id: "nextjs",  description: "Next.js: server-side fetch in route handler, hydrate client to avoid flicker" },
  vue:     { id: "vue",     description: "Vue 3: composable with ref + onMounted" },
  vanilla: { id: "vanilla", description: "Vanilla JS: fetch + inject HTML into container" },
};
