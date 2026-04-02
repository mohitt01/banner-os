const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Validate all banners for a tenant — flags bad configurations
router.get('/', (req, res) => {
  const db = getDb();
  const { tenant_id = 'default' } = req.query;

  const banners = db.prepare('SELECT * FROM banners WHERE tenant_id = ?').all(tenant_id);
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenant_id);
  const config = tenant ? JSON.parse(tenant.config) : {};
  const issues = [];

  for (const banner of banners) {
    const rules = JSON.parse(banner.targeting_rules);
    const bannerId = banner.id;
    const bannerTitle = banner.title;

    // Check for missing title/body
    if (!banner.title || banner.title.trim() === '') {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'Banner has no title' });
    }
    if (!banner.body || banner.body.trim() === '') {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'warning', message: 'Banner has no body text' });
    }

    // Check date validity
    if (banner.start_date && banner.end_date && banner.start_date > banner.end_date) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'start_date is after end_date' });
    }
    if (banner.end_date && banner.end_date < new Date().toISOString() && banner.status === 'active') {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'warning', message: 'Banner is active but end_date has passed' });
    }

    // Check CTA consistency
    if (banner.cta_text && !banner.cta_url) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'warning', message: 'Banner has CTA text but no CTA URL' });
    }
    if (banner.cta_url && !banner.cta_text) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'warning', message: 'Banner has CTA URL but no CTA text' });
    }

    // Check type allowed by tenant config
    if (banner.type === 'promotional' && config.allowPromotional === false) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'Promotional banners are disabled for this tenant' });
    }
    if (banner.type === 'support' && config.allowSupport === false) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'Support banners are disabled for this tenant' });
    }

    // Check targeting rules
    if (rules.platforms && !Array.isArray(rules.platforms)) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'targeting_rules.platforms must be an array' });
    }
    if (rules.countries && !Array.isArray(rules.countries)) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'targeting_rules.countries must be an array' });
    }
    if (rules.user_segments && !Array.isArray(rules.user_segments)) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'error', message: 'targeting_rules.user_segments must be an array' });
    }

    // Check for empty targeting on promotional banners
    if (banner.type === 'promotional' && Object.keys(rules).length === 0) {
      issues.push({ banner_id: bannerId, banner_title: bannerTitle, severity: 'warning', message: 'Promotional banner has no targeting rules — will show to all users' });
    }
  }

  res.json({
    tenant_id,
    total_banners: banners.length,
    issues_count: issues.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    issues,
  });
});

module.exports = router;
