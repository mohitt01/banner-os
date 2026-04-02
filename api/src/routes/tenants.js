const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get tenant config
router.get('/:id', (req, res) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  tenant.config = JSON.parse(tenant.config);
  res.json({ tenant });
});

// Update tenant config
router.put('/:id', (req, res) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const { name, config } = req.body;
  const newName = name || tenant.name;
  const newConfig = config ? JSON.stringify(config) : tenant.config;

  db.prepare('UPDATE tenants SET name = ?, config = ? WHERE id = ?').run(newName, newConfig, req.params.id);

  const updated = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  updated.config = JSON.parse(updated.config);
  res.json({ tenant: updated });
});

// Create a new tenant
router.post('/', (req, res) => {
  const db = getDb();
  const { id, name, config = {} } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const tenantId = id || uuidv4();
  const existing = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
  if (existing) return res.status(409).json({ error: 'Tenant already exists' });

  const defaultConfig = {
    maxBannersPerPage: 3,
    defaultDismissDuration: 86400,
    allowPromotional: true,
    allowSupport: true,
    allowInformational: true,
    ...config,
  };

  db.prepare('INSERT INTO tenants (id, name, config) VALUES (?, ?, ?)').run(tenantId, name, JSON.stringify(defaultConfig));

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
  tenant.config = JSON.parse(tenant.config);
  res.status(201).json({ tenant });
});

module.exports = router;
