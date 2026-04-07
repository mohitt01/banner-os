const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Record an impression (view, click, or dismiss)
router.post('/', async (req, res) => {
  try {
    const { banner_id, tenant_id = 'default', user_id, context = {}, action = 'view' } = req.body;

    if (!banner_id) return res.status(400).json({ error: 'banner_id is required' });
    if (!['view', 'click', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'action must be view, click, or dismiss' });
    }

    const db = getDb();
    const banner = await db.getBanner(banner_id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    await db.createImpression({
      banner_id,
      tenant_id,
      user_id,
      context,
      action
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dismiss a banner for a user
router.post('/dismiss', async (req, res) => {
  try {
    const { banner_id, tenant_id = 'default', user_id } = req.body;

    if (!banner_id) return res.status(400).json({ error: 'banner_id is required' });
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const db = getDb();
    const banner = await db.getBanner(banner_id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    await db.createImpression({
      banner_id,
      tenant_id,
      user_id,
      context: {},
      action: 'dismiss'
    });

    res.json({ success: true, message: `Banner ${banner_id} dismissed for user ${user_id}` });
  } catch (error) {
    console.error('Error dismissing banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get impression stats for a banner
router.get('/stats/:banner_id', async (req, res) => {
  try {
    const { banner_id } = req.params;
    const db = getDb();

    const banner = await db.getBanner(banner_id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    const stats = await db.getBannerStats(banner_id);
    const ctr = stats.views > 0 ? (stats.clicks / stats.views * 100).toFixed(2) + '%' : '0%';

    res.json({
      banner_id,
      stats: { ...stats, ctr },
      daily: stats.daily,
    });
  } catch (error) {
    console.error('Error getting banner stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get aggregate stats for a tenant
router.get('/stats', async (req, res) => {
  try {
    const { tenant_id = 'default' } = req.query;
    const db = getDb();

    const stats = await db.getTenantStats(tenant_id);
    res.json({ tenant_id, stats });
  } catch (error) {
    console.error('Error getting tenant stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
