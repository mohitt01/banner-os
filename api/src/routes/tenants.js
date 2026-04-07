const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const router = express.Router();

// Get tenant config
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const tenant = await db.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ tenant });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tenant config
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.getTenant(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Tenant not found' });

    const { name, config } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = config;

    const updated = await db.updateTenant(req.params.id, updates);
    res.json({ tenant: updated });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new tenant
router.post('/', async (req, res) => {
  try {
    const { id, name, config = {} } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });

    const db = getDb();
    const existing = await db.getTenant(id || uuidv4());
    if (existing) return res.status(409).json({ error: 'Tenant already exists' });

    const defaultConfig = {
      maxBannersPerPage: 3,
      defaultDismissDuration: 86400,
      allowPromotional: true,
      allowSupport: true,
      allowInformational: true,
      ...config,
    };

    const tenant = await db.createTenant({ id, name, config: defaultConfig });
    res.status(201).json({ tenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
