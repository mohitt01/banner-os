const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Record an impression (view, click, or dismiss)
router.post('/', (req, res) => {
  const db = getDb();
  const { banner_id, tenant_id = 'default', user_id, context = {}, action = 'view' } = req.body;

  if (!banner_id) return res.status(400).json({ error: 'banner_id is required' });
  if (!['view', 'click', 'dismiss'].includes(action)) {
    return res.status(400).json({ error: 'action must be view, click, or dismiss' });
  }

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(banner_id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });

  db.prepare(`
    INSERT INTO impressions (banner_id, tenant_id, user_id, context, action)
    VALUES (?, ?, ?, ?, ?)
  `).run(banner_id, tenant_id, user_id || null, JSON.stringify(context), action);

  res.status(201).json({ success: true });
});

// Dismiss a banner for a user
router.post('/dismiss', (req, res) => {
  const db = getDb();
  const { banner_id, tenant_id = 'default', user_id } = req.body;

  if (!banner_id) return res.status(400).json({ error: 'banner_id is required' });
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(banner_id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });

  db.prepare(`
    INSERT INTO impressions (banner_id, tenant_id, user_id, context, action)
    VALUES (?, ?, ?, '{}', 'dismiss')
  `).run(banner_id, tenant_id, user_id);

  res.json({ success: true, message: `Banner ${banner_id} dismissed for user ${user_id}` });
});

// Get impression stats for a banner
router.get('/stats/:banner_id', (req, res) => {
  const db = getDb();
  const { banner_id } = req.params;

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(banner_id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });

  const views = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'view'").get(banner_id).c;
  const clicks = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'click'").get(banner_id).c;
  const dismissals = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'dismiss'").get(banner_id).c;
  const unique_users = db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM impressions WHERE banner_id = ? AND user_id IS NOT NULL").get(banner_id).c;

  // Daily breakdown for last 30 days
  const daily = db.prepare(`
    SELECT date(created_at) as date, action, COUNT(*) as count
    FROM impressions
    WHERE banner_id = ? AND created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at), action
    ORDER BY date(created_at) DESC
  `).all(banner_id);

  res.json({
    banner_id,
    stats: { views, clicks, dismissals, unique_users, ctr: views > 0 ? (clicks / views * 100).toFixed(2) + '%' : '0%' },
    daily,
  });
});

// Get aggregate stats for a tenant
router.get('/stats', (req, res) => {
  const db = getDb();
  const { tenant_id = 'default' } = req.query;

  const banners = db.prepare('SELECT id, title, type, status FROM banners WHERE tenant_id = ?').all(tenant_id);

  const stats = banners.map(b => {
    const views = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'view'").get(b.id).c;
    const clicks = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'click'").get(b.id).c;
    const dismissals = db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'dismiss'").get(b.id).c;
    return { ...b, views, clicks, dismissals, ctr: views > 0 ? (clicks / views * 100).toFixed(2) + '%' : '0%' };
  });

  res.json({ tenant_id, stats });
});

module.exports = router;
