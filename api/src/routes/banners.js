const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// List all banners for a tenant
router.get('/', async (req, res) => {
  try {
    const { tenant_id = 'default', status, type } = req.query;
    const db = getDb();

    const filters = { tenant_id };
    if (status) filters.status = status;
    if (type) filters.type = type;

    const banners = await db.getBanners(tenant_id, filters);
    res.json({ banners });
  } catch (error) {
    console.error('Error listing banners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single banner
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const banner = await db.getBanner(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json({ banner });
  } catch (error) {
    console.error('Error getting banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a banner
router.post('/', async (req, res) => {
  try {
    const {
      tenant_id = 'default',
      title,
      body = '',
      type = 'informational',
      status = 'active',
      priority = 0,
      targeting_rules = {},
      style = {},
      cta_text,
      cta_url,
      start_date,
      end_date,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!['promotional', 'support', 'informational'].includes(type)) {
      return res.status(400).json({ error: 'type must be promotional, support, or informational' });
    }

    const db = getDb();
    const banner = await db.createBanner({
      tenant_id,
      title,
      body,
      type,
      status,
      priority,
      targeting_rules,
      style,
      cta_text,
      cta_url,
      start_date,
      end_date
    });

    res.status(201).json({ banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a banner
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.getBanner(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Banner not found' });

    const {
      title = existing.title,
      body = existing.body,
      type = existing.type,
      status = existing.status,
      priority = existing.priority,
      targeting_rules,
      style,
      cta_text = existing.cta_text,
      cta_url = existing.cta_url,
      start_date = existing.start_date,
      end_date = existing.end_date,
    } = req.body;

    const banner = await db.updateBanner(req.params.id, {
      title,
      body,
      type,
      status,
      priority,
      targeting_rules,
      style,
      cta_text,
      cta_url,
      start_date,
      end_date
    });

    res.json({ banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a banner
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const success = await db.deleteBanner(req.params.id);
    if (!success) return res.status(404).json({ error: 'Banner not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
