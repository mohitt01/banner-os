const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class SQLiteAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this._initPromise = null;
  }

  async init() {
    if (this.db) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = initSqlJs().then(SQL => {
      let buffer = null;
      try {
        if (fs.existsSync(this.dbPath)) {
          buffer = fs.readFileSync(this.dbPath);
        }
      } catch (e) {
        // No existing DB file — will create fresh
      }
      this.db = buffer ? new SQL.Database(buffer) : new SQL.Database();
      this.db.run('PRAGMA foreign_keys = ON');
      this.initSchema();
      this._initPromise = null;
    });

    return this._initPromise;
  }

  // Persist in-memory DB to disk
  _save() {
    if (!this.db) return;
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  // Run a query and return all result rows as an array of objects
  _all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  // Run a query and return the first row as an object, or null
  _get(sql, params = []) {
    const rows = this._all(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // Execute a statement (INSERT/UPDATE/DELETE) and return metadata
  _run(sql, params = []) {
    this.db.run(sql, params);
    const lastId = this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] ?? null;
    const changes = this.db.getRowsModified();
    this._save();
    return { lastInsertRowid: lastId, changes };
  }

  initSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS banners (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL CHECK(type IN ('promotional', 'support', 'informational')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
        priority INTEGER NOT NULL DEFAULT 0,
        targeting_rules TEXT NOT NULL DEFAULT '{}',
        style TEXT NOT NULL DEFAULT '{}',
        cta_text TEXT,
        cta_url TEXT,
        start_date TEXT,
        end_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS impressions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        banner_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        user_id TEXT,
        context TEXT NOT NULL DEFAULT '{}',
        action TEXT NOT NULL DEFAULT 'view' CHECK(action IN ('view', 'click', 'dismiss')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (banner_id) REFERENCES banners(id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    this.db.run('CREATE INDEX IF NOT EXISTS idx_banners_tenant ON banners(tenant_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_impressions_banner ON impressions(banner_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_impressions_tenant ON impressions(tenant_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_impressions_user ON impressions(user_id)');

    // Seed a default tenant if none exists
    const count = this._get('SELECT COUNT(*) as c FROM tenants');
    if (count.c === 0) {
      this._run(`
        INSERT INTO tenants (id, name, config)
        VALUES (?, ?, ?)
      `, ['default', 'Default Tenant', '{"maxBannersPerPage": 3, "defaultDismissDuration": 86400, "allowPromotional": true, "allowSupport": true, "allowInformational": true}']);
    }
  }

  // Helper to parse JSON fields from SQLite results
  parseRow(row) {
    const parsed = { ...row };
    ['config', 'targeting_rules', 'style', 'context'].forEach(field => {
      if (parsed[field]) {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (e) {
          // Field might already be parsed or invalid JSON
        }
      }
    });
    return parsed;
  }

  // Banner operations
  async getBanners(tenantId, filters = {}) {
    await this.init();
    
    let sql = 'SELECT * FROM banners WHERE tenant_id = ?';
    const params = [tenantId];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    sql += ' ORDER BY priority DESC, created_at DESC';

    const banners = this._all(sql, params);
    return banners.map(b => this.parseRow(b));
  }

  async getBanner(id) {
    await this.init();
    
    const banner = this._get('SELECT * FROM banners WHERE id = ?', [id]);
    return banner ? this.parseRow(banner) : null;
  }

  async createBanner(data) {
    await this.init();
    
    const banner = {
      id: data.id || require('uuid').v4(),
      tenant_id: data.tenant_id || 'default',
      title: data.title,
      body: data.body || '',
      type: data.type || 'informational',
      status: data.status || 'active',
      priority: data.priority || 0,
      targeting_rules: JSON.stringify(data.targeting_rules || {}),
      style: JSON.stringify(data.style || {}),
      cta_text: data.cta_text || null,
      cta_url: data.cta_url || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };

    this._run(`
      INSERT INTO banners (id, tenant_id, title, body, type, status, priority, targeting_rules, style, cta_text, cta_url, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      banner.id, banner.tenant_id, banner.title, banner.body, banner.type, banner.status,
      banner.priority, banner.targeting_rules, banner.style, banner.cta_text, banner.cta_url,
      banner.start_date, banner.end_date, banner.created_at, banner.updated_at
    ]);

    return this.parseRow(banner);
  }

  async updateBanner(id, updates) {
    await this.init();
    
    const existing = await this.getBanner(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      targeting_rules: updates.targeting_rules !== undefined ? JSON.stringify(updates.targeting_rules) : existing.targeting_rules,
      style: updates.style !== undefined ? JSON.stringify(updates.style) : existing.style,
      updated_at: new Date().toISOString()
    };

    this._run(`
      UPDATE banners SET title=?, body=?, type=?, status=?, priority=?, targeting_rules=?, style=?, cta_text=?, cta_url=?, start_date=?, end_date=?, updated_at=?
      WHERE id=?
    `, [
      updated.title, updated.body, updated.type, updated.status, updated.priority,
      updated.targeting_rules, updated.style, updated.cta_text, updated.cta_url,
      updated.start_date, updated.end_date, updated.updated_at, id
    ]);

    return this.parseRow(updated);
  }

  async deleteBanner(id) {
    await this.init();
    
    const existing = await this.getBanner(id);
    if (!existing) return false;

    this._run('DELETE FROM impressions WHERE banner_id = ?', [id]);
    this._run('DELETE FROM banners WHERE id = ?', [id]);
    
    return true;
  }

  // Tenant operations
  async getTenant(id) {
    await this.init();
    
    const tenant = this._get('SELECT * FROM tenants WHERE id = ?', [id]);
    return tenant ? this.parseRow(tenant) : null;
  }

  async updateTenant(id, updates) {
    await this.init();
    
    const existing = await this.getTenant(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      config: updates.config !== undefined ? JSON.stringify(updates.config) : existing.config
    };

    this._run('UPDATE tenants SET name = ?, config = ? WHERE id = ?',
      [updated.name, updated.config, id]);

    return this.parseRow(updated);
  }

  async createTenant(data) {
    await this.init();
    
    const tenant = {
      id: data.id || require('uuid').v4(),
      name: data.name,
      config: JSON.stringify(data.config || {}),
      created_at: new Date().toISOString()
    };

    this._run('INSERT INTO tenants (id, name, config) VALUES (?, ?, ?)',
      [tenant.id, tenant.name, tenant.config]);

    return this.parseRow(tenant);
  }

  // Impression operations
  async createImpression(data) {
    await this.init();
    
    const impression = {
      banner_id: data.banner_id,
      tenant_id: data.tenant_id || 'default',
      user_id: data.user_id || null,
      context: JSON.stringify(data.context || {}),
      action: data.action || 'view',
      created_at: data.created_at || new Date().toISOString()
    };

    const result = this._run(`
      INSERT INTO impressions (banner_id, tenant_id, user_id, context, action, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      impression.banner_id, impression.tenant_id, impression.user_id,
      impression.context, impression.action, impression.created_at
    ]);

    return { id: result.lastInsertRowid, ...impression };
  }

  async getBannerStats(bannerId) {
    await this.init();
    
    const views = this._get("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'view'", [bannerId]).c;
    const clicks = this._get("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'click'", [bannerId]).c;
    const dismissals = this._get("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'dismiss'", [bannerId]).c;
    const unique_users = this._get("SELECT COUNT(DISTINCT user_id) as c FROM impressions WHERE banner_id = ? AND user_id IS NOT NULL", [bannerId]).c;

    // Daily breakdown for last 30 days
    const daily = this._all(`
      SELECT date(created_at) as date, action, COUNT(*) as count
      FROM impressions
      WHERE banner_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at), action
      ORDER BY date(created_at) DESC
    `, [bannerId]);

    return { views, clicks, dismissals, unique_users, daily };
  }

  async getTenantStats(tenantId) {
    await this.init();
    
    const banners = this._all('SELECT id, title, type, status FROM banners WHERE tenant_id = ?', [tenantId]);

    const stats = [];
    for (const b of banners) {
      const bannerStats = await this.getBannerStats(b.id);
      stats.push({
        ...b,
        ...bannerStats,
        ctr: bannerStats.views > 0 ? (bannerStats.clicks / bannerStats.views * 100).toFixed(2) + '%' : '0%'
      });
    }

    return stats;
  }

  async getDismissedBanners(tenantId, userId) {
    await this.init();
    
    const dismissed = this._all(`
      SELECT DISTINCT banner_id FROM impressions
      WHERE tenant_id = ? AND user_id = ? AND action = 'dismiss'
    `, [tenantId, userId]).map(r => r.banner_id);

    return dismissed;
  }

  close() {
    if (this.db) {
      this._save();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = SQLiteAdapter;
