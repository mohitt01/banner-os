/**
 * MCP App UI Views — loads widget HTML files from widgets/ and inlines the
 * ext-apps browser bundle so widgets work inside the host's sandboxed iframe
 * (CSP blocks CDN script fetches — bundle inlining is mandatory).
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const WIDGETS_DIR = resolve(__dirname, "../widgets");

// ─── Inline the ext-apps browser bundle ──────────────────────────────────────
// Reads the self-contained browser build (~300KB minified ESM) and rewrites
// the trailing `export{…}` into a `globalThis.ExtApps = {…}` assignment so it
// can be used from an inline <script type="module"> block.
const bundle = readFileSync(
  require.resolve("@modelcontextprotocol/ext-apps/app-with-deps"),
  "utf8",
).replace(/export\{([^}]+)\};?\s*$/, (_, body) =>
  "globalThis.ExtApps={" +
  body.split(",").map((pair) => {
    const [local, exported] = pair.split(" as ").map((s) => s.trim());
    return `${exported ?? local}:${local}`;
  }).join(",") + "};",
);

// ─── Widget loader — reads HTML file and replaces the bundle placeholder ─────
function loadWidget(filename) {
  const raw = readFileSync(resolve(WIDGETS_DIR, filename), "utf8");
  return raw.replace("/*__EXT_APPS_BUNDLE__*/", () => bundle);
}

// ─── Exported views (bundle-inlined HTML strings, ready to serve) ────────────
export const listBannersView = loadWidget("list-banners.html");
export const evaluateBannersView = loadWidget("evaluate.html");
export const statsView = loadWidget("stats.html");
export const validateView = loadWidget("validate.html");
export const healthView = loadWidget("health.html");
