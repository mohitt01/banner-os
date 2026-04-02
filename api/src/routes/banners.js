const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// List all banners for a tenant
router.get('/', (req, res) => {
  const { tenant_id = 'default', status, type } = req.query;
  const db = getDb();

  let sql = 'SELECT * FROM banners WHERE tenant_id = ?';
  const params = [tenant_id];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY priority DESC, created_at DESC';

  const banners = db.prepare(sql).all(...params);
  const parsed = banners.map(b => ({
    ...b,
    targeting_rules: JSON.parse(b.targeting_rules),
    style: JSON.parse(b.style),
  }));

  res.json({ banners: parsed });
});

// Get a single banner
router.get('/:id', (req, res) => {
  const db = getDb();
  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });

  banner.targeting_rules = JSON.parse(banner.targeting_rules);
  banner.style = JSON.parse(banner.style);
  res.json({ banner });
});

// Create a banner
router.post('/', (req, res) => {
  const db = getDb();
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

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO banners (id, tenant_id, title, body, type, status, priority, targeting_rules, style, cta_text, cta_url, start_date, end_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, tenant_id, title, body, type, status, priority, JSON.stringify(targeting_rules), JSON.stringify(style), cta_text || null, cta_url || null, start_date || null, end_date || null, now, now);

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
  banner.targeting_rules = JSON.parse(banner.targeting_rules);
  banner.style = JSON.parse(banner.style);

  res.status(201).json({ banner });
});

// Update a banner
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
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

  const rules = targeting_rules !== undefined ? JSON.stringify(targeting_rules) : existing.targeting_rules;
  const styleStr = style !== undefined ? JSON.stringify(style) : existing.style;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE banners SET title=?, body=?, type=?, status=?, priority=?, targeting_rules=?, style=?, cta_text=?, cta_url=?, start_date=?, end_date=?, updated_at=?
    WHERE id=?
  `).run(title, body, type, status, priority, rules, styleStr, cta_text, cta_url, start_date, end_date, now, req.params.id);

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  banner.targeting_rules = JSON.parse(banner.targeting_rules);
  banner.style = JSON.parse(banner.style);

  res.json({ banner });
});

// Delete a banner
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Banner not found' });

  db.prepare('DELETE FROM impressions WHERE banner_id = ?').run(req.params.id);
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
