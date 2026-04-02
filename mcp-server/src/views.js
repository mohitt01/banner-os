/**
 * MCP App UI Views — self-contained HTML templates for BannerOS tools.
 * Each view is a complete single-file HTML page that uses the MCP Apps
 * App bridge to receive tool results and render interactive UIs inline
 * in the developer's IDE / chat client.
 */

// ─── Shared CSS reset + design tokens ────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px; line-height: 1.5; color: #1a1a2e;
  background: #ffffff; padding: 14px;
}
h1 { font-size: 15px; font-weight: 600; margin-bottom: 10px; color: #1a1a2e; }
h2 { font-size: 13px; font-weight: 600; margin: 14px 0 6px; color: #374151; }
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 9999px;
  font-size: 11px; font-weight: 500; line-height: 1.4;
}
.badge-promotional { background: #dbeafe; color: #1d4ed8; }
.badge-support { background: #fef3c7; color: #92400e; }
.badge-informational { background: #d1fae5; color: #065f46; }
.badge-active { background: #d1fae5; color: #065f46; }
.badge-inactive { background: #f3f4f6; color: #6b7280; }
.badge-draft { background: #e0e7ff; color: #4338ca; }
.badge-error { background: #fee2e2; color: #dc2626; }
.badge-warning { background: #fef3c7; color: #d97706; }
.card {
  border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;
  margin-bottom: 8px; background: #fafafa;
}
.stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px; margin-bottom: 12px;
}
.stat-box {
  text-align: center; padding: 10px 8px; border-radius: 8px;
  background: #f9fafb; border: 1px solid #e5e7eb;
}
.stat-box .value { font-size: 20px; font-weight: 700; color: #1a1a2e; }
.stat-box .label { font-size: 11px; color: #6b7280; margin-top: 2px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th {
  text-align: left; padding: 6px 8px; background: #f3f4f6;
  color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;
}
td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
tr:hover td { background: #f9fafb; }
.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; }
.text-muted { color: #6b7280; }
.text-sm { font-size: 11px; }
.mt-2 { margin-top: 8px; }
.flex { display: flex; align-items: center; gap: 6px; }
.empty { text-align: center; padding: 24px; color: #9ca3af; }
.progress-bar { width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
.bar-views { background: #3b82f6; }
.bar-clicks { background: #10b981; }
.bar-dismissals { background: #f59e0b; }
.issue-list { list-style: none; }
.issue-item {
  padding: 8px 10px; border-left: 3px solid; margin-bottom: 4px;
  background: #fafafa; border-radius: 0 6px 6px 0; font-size: 12px;
}
.issue-item.error { border-color: #ef4444; }
.issue-item.warning { border-color: #f59e0b; }
.check-ok { color: #10b981; font-weight: 600; }
.check-fail { color: #ef4444; font-weight: 600; }
`;

function wrapHtml(title, bodyScript) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <div id="root"><p class="text-muted">Loading…</p></div>
  <script type="module">
import { App } from "https://esm.sh/@modelcontextprotocol/ext-apps@latest";
const app = new App({ name: "BannerOS", version: "1.0.0" });
const root = document.getElementById("root");

app.ontoolresult = (result) => {
  try {
    const textContent = result.content?.find(c => c.type === "text")?.text;
    const data = textContent ? JSON.parse(textContent) : {};
    render(data);
  } catch (e) {
    root.innerHTML = '<p class="check-fail">Failed to parse tool result</p>';
  }
};

app.connect();

${bodyScript}
  </script>
</body>
</html>`;
}

// ─── List Banners View ───────────────────────────────────────────────────────
export const listBannersView = wrapHtml("BannerOS — Banners", `
function render(data) {
  const banners = data.banners || [];
  if (!banners.length) {
    root.innerHTML = '<div class="empty">No banners found</div>';
    return;
  }
  let html = '<h1>Banners (' + banners.length + ')</h1>';
  html += '<table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>Targeting</th></tr></thead><tbody>';
  for (const b of banners) {
    const rules = b.targeting_rules || {};
    const targeting = [];
    if (rules.platforms?.length) targeting.push(rules.platforms.join(', '));
    if (rules.countries?.length) targeting.push(rules.countries.join(', '));
    if (rules.user_segments?.length) targeting.push(rules.user_segments.join(', '));
    if (rules.is_authenticated !== undefined) targeting.push(rules.is_authenticated ? 'auth' : 'anon');
    html += '<tr>'
      + '<td><strong>' + esc(b.title) + '</strong><br><span class="text-muted text-sm mono">' + esc(b.id.slice(0, 8)) + '…</span></td>'
      + '<td><span class="badge badge-' + esc(b.type) + '">' + esc(b.type) + '</span></td>'
      + '<td><span class="badge badge-' + esc(b.status) + '">' + esc(b.status) + '</span></td>'
      + '<td>' + b.priority + '</td>'
      + '<td class="text-sm">' + (targeting.length ? esc(targeting.join(' · ')) : '<span class="text-muted">all users</span>') + '</td>'
      + '</tr>';
  }
  html += '</tbody></table>';
  root.innerHTML = html;
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
`);

// ─── Evaluate Banners View ───────────────────────────────────────────────────
export const evaluateBannersView = wrapHtml("BannerOS — Evaluate", `
function render(data) {
  const banners = data.banners || [];
  const count = data.count || 0;
  let html = '<h1>Evaluation Result</h1>';
  html += '<div class="stat-grid">'
    + '<div class="stat-box"><div class="value">' + count + '</div><div class="label">Matched Banners</div></div>'
    + '</div>';
  if (!banners.length) {
    html += '<div class="empty">No banners matched the given context</div>';
  } else {
    for (const b of banners) {
      html += '<div class="card">'
        + '<div class="flex"><strong>' + esc(b.title) + '</strong>'
        + '<span class="badge badge-' + esc(b.type) + '">' + esc(b.type) + '</span>'
        + '</div>';
      if (b.body) html += '<p class="text-sm mt-2">' + esc(b.body) + '</p>';
      if (b.cta_text) html += '<p class="text-sm mt-2" style="color:#2563eb">' + esc(b.cta_text) + (b.cta_url ? ' → ' + esc(b.cta_url) : '') + '</p>';
      html += '<p class="text-sm text-muted mt-2 mono">' + esc(b.id) + '</p>';
      html += '</div>';
    }
  }
  root.innerHTML = html;
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
`);

// ─── Stats View ──────────────────────────────────────────────────────────────
export const statsView = wrapHtml("BannerOS — Stats", `
function render(data) {
  // Handles both single-banner stats and tenant-wide stats
  if (data.stats && Array.isArray(data.stats)) {
    renderTenantStats(data);
  } else if (data.stats) {
    renderBannerStats(data);
  } else {
    root.innerHTML = '<div class="empty">No stats data</div>';
  }
}

function renderTenantStats(data) {
  const stats = data.stats;
  const totals = stats.reduce((acc, s) => {
    acc.views += s.views; acc.clicks += s.clicks; acc.dismissals += s.dismissals;
    return acc;
  }, { views: 0, clicks: 0, dismissals: 0 });
  const ctr = totals.views > 0 ? (totals.clicks / totals.views * 100).toFixed(1) : '0.0';

  let html = '<h1>Tenant Stats: ' + esc(data.tenant_id) + '</h1>';
  html += '<div class="stat-grid">'
    + statBox(stats.length, 'Banners')
    + statBox(totals.views.toLocaleString(), 'Views')
    + statBox(totals.clicks.toLocaleString(), 'Clicks')
    + statBox(ctr + '%', 'CTR')
    + '</div>';
  html += '<table><thead><tr><th>Banner</th><th>Type</th><th>Views</th><th>Clicks</th><th>Dismiss</th><th>CTR</th></tr></thead><tbody>';
  const maxViews = Math.max(...stats.map(s => s.views), 1);
  for (const s of stats) {
    html += '<tr>'
      + '<td><strong>' + esc(s.title) + '</strong></td>'
      + '<td><span class="badge badge-' + esc(s.type) + '">' + esc(s.type) + '</span></td>'
      + '<td>' + s.views + '</td>'
      + '<td>' + s.clicks + '</td>'
      + '<td>' + s.dismissals + '</td>'
      + '<td>' + esc(s.ctr) + '</td>'
      + '</tr>';
  }
  html += '</tbody></table>';
  root.innerHTML = html;
}

function renderBannerStats(data) {
  const s = data.stats;
  let html = '<h1>Banner Stats</h1>';
  html += '<p class="text-sm text-muted mono mb-2">' + esc(data.banner_id) + '</p>';
  html += '<div class="stat-grid">'
    + statBox(s.views.toLocaleString(), 'Views')
    + statBox(s.clicks.toLocaleString(), 'Clicks')
    + statBox(s.dismissals.toLocaleString(), 'Dismissals')
    + statBox(s.unique_users.toLocaleString(), 'Unique Users')
    + statBox(s.ctr, 'CTR')
    + '</div>';
  if (data.daily?.length) {
    html += '<h2>Daily Breakdown (last 30 days)</h2><table><thead><tr><th>Date</th><th>Action</th><th>Count</th></tr></thead><tbody>';
    for (const d of data.daily) {
      html += '<tr><td>' + esc(d.date) + '</td><td>' + esc(d.action) + '</td><td>' + d.count + '</td></tr>';
    }
    html += '</tbody></table>';
  }
  root.innerHTML = html;
}

function statBox(val, label) {
  return '<div class="stat-box"><div class="value">' + val + '</div><div class="label">' + label + '</div></div>';
}
function esc(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
`);

// ─── Validate View ───────────────────────────────────────────────────────────
export const validateView = wrapHtml("BannerOS — Validate", `
function render(data) {
  let html = '<h1>Validation Report</h1>';
  html += '<div class="stat-grid">'
    + '<div class="stat-box"><div class="value">' + (data.total_banners || 0) + '</div><div class="label">Total Banners</div></div>'
    + '<div class="stat-box"><div class="value ' + (data.errors ? 'check-fail' : 'check-ok') + '">' + (data.errors || 0) + '</div><div class="label">Errors</div></div>'
    + '<div class="stat-box"><div class="value" style="color:#d97706">' + (data.warnings || 0) + '</div><div class="label">Warnings</div></div>'
    + '</div>';
  if (!data.issues?.length) {
    html += '<p class="check-ok" style="text-align:center;padding:16px">✓ All banners look good!</p>';
  } else {
    html += '<ul class="issue-list">';
    for (const i of data.issues) {
      html += '<li class="issue-item ' + esc(i.severity) + '">'
        + '<strong>' + esc(i.banner_title || i.banner_id) + '</strong>'
        + ' <span class="badge badge-' + esc(i.severity) + '">' + esc(i.severity) + '</span>'
        + '<br><span class="text-sm">' + esc(i.message) + '</span>'
        + '</li>';
    }
    html += '</ul>';
  }
  root.innerHTML = html;
}
function esc(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
`);

// ─── Health Check View ───────────────────────────────────────────────────────
export const healthView = wrapHtml("BannerOS — Health", `
function render(data) {
  const ok = data.status === 'ok';
  let html = '<h1>API Health</h1>';
  html += '<div class="stat-grid">'
    + '<div class="stat-box"><div class="value ' + (ok ? 'check-ok' : 'check-fail') + '">' + (ok ? '●' : '✕') + '</div><div class="label">Status: ' + (data.status || 'unknown') + '</div></div>'
    + '<div class="stat-box"><div class="value">' + esc(data.version || '-') + '</div><div class="label">Version</div></div>'
    + '</div>';
  root.innerHTML = html;
}
function esc(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
`);
