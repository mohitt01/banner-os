const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Evaluate which banners to show for a user/context
router.post('/', (req, res) => {
  const db = getDb();
  const { tenant_id = 'default', user_id, context = {} } = req.body;

  const now = new Date().toISOString();

  // Get all active banners for this tenant
  let banners = db.prepare(`
    SELECT * FROM banners
    WHERE tenant_id = ? AND status = 'active'
    ORDER BY priority DESC, created_at DESC
  `).all(tenant_id);

  // Filter by date range
  banners = banners.filter(b => {
    if (b.start_date && b.start_date > now) return false;
    if (b.end_date && b.end_date < now) return false;
    return true;
  });

  // Filter by targeting rules
  banners = banners.filter(b => {
    const rules = JSON.parse(b.targeting_rules);
    return matchesTargetingRules(rules, { user_id, ...context });
  });

  // Check dismissed banners for this user
  if (user_id) {
    const dismissed = db.prepare(`
      SELECT DISTINCT banner_id FROM impressions
      WHERE tenant_id = ? AND user_id = ? AND action = 'dismiss'
    `).all(tenant_id, user_id).map(r => r.banner_id);

    banners = banners.filter(b => !dismissed.includes(b.id));
  }

  // Apply tenant config limits
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenant_id);
  const config = tenant ? JSON.parse(tenant.config) : {};
  const maxBanners = config.maxBannersPerPage || 3;

  banners = banners.slice(0, maxBanners);

  const parsed = banners.map(b => ({
    ...b,
    targeting_rules: JSON.parse(b.targeting_rules),
    style: JSON.parse(b.style),
  }));

  res.json({ banners: parsed, count: parsed.length });
});

function matchesTargetingRules(rules, context) {
  if (!rules || Object.keys(rules).length === 0) return true;

  // rules.platforms — array of platforms, e.g. ["web", "mobile"]
  if (rules.platforms && rules.platforms.length > 0) {
    if (!context.platform || !rules.platforms.includes(context.platform)) return false;
  }

  // rules.countries — array of country codes
  if (rules.countries && rules.countries.length > 0) {
    if (!context.country || !rules.countries.includes(context.country)) return false;
  }

  // rules.user_segments — array of segments
  if (rules.user_segments && rules.user_segments.length > 0) {
    if (!context.segment || !rules.user_segments.includes(context.segment)) return false;
  }

  // rules.min_app_version — minimum version string
  if (rules.min_app_version) {
    if (!context.app_version) return false;
    if (compareVersions(context.app_version, rules.min_app_version) < 0) return false;
  }

  // rules.user_ids — specific user IDs to target
  if (rules.user_ids && rules.user_ids.length > 0) {
    if (!context.user_id || !rules.user_ids.includes(context.user_id)) return false;
  }

  // rules.is_authenticated — boolean
  if (rules.is_authenticated !== undefined) {
    if (context.is_authenticated !== rules.is_authenticated) return false;
  }

  // rules.page_paths — array of URL path patterns
  if (rules.page_paths && rules.page_paths.length > 0) {
    if (!context.page_path) return false;
    const matched = rules.page_paths.some(pattern => {
      if (pattern.endsWith('*')) {
        return context.page_path.startsWith(pattern.slice(0, -1));
      }
      return context.page_path === pattern;
    });
    if (!matched) return false;
  }

  return true;
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

module.exports = router;
