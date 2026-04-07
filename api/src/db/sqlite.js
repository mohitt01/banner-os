const Database = require('better-sqlite3');
const path = require('path');

class SQLiteAdapter {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  init() {
    if (this.db) return;
    
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        config TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

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
      );

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
      );

      CREATE INDEX IF NOT EXISTS idx_banners_tenant ON banners(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_banners_status ON banners(status);
      CREATE INDEX IF NOT EXISTS idx_impressions_banner ON impressions(banner_id);
      CREATE INDEX IF NOT EXISTS idx_impressions_tenant ON impressions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_impressions_user ON impressions(user_id);
    `);

    // Seed a default tenant if none exists
    const count = this.db.prepare('SELECT COUNT(*) as c FROM tenants').get();
    if (count.c === 0) {
      this.db.prepare(`
        INSERT INTO tenants (id, name, config)
        VALUES ('default', 'Default Tenant', '{"maxBannersPerPage": 3, "defaultDismissDuration": 86400, "allowPromotional": true, "allowSupport": true, "allowInformational": true}')
      `).run();
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
  getBanners(tenantId, filters = {}) {
    this.init();
    
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

    const banners = this.db.prepare(sql).all(...params);
    return banners.map(b => this.parseRow(b));
  }

  getBanner(id) {
    this.init();
    
    const banner = this.db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    return banner ? this.parseRow(banner) : null;
  }

  createBanner(data) {
    this.init();
    
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

    this.db.prepare(`
      INSERT INTO banners (id, tenant_id, title, body, type, status, priority, targeting_rules, style, cta_text, cta_url, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      banner.id, banner.tenant_id, banner.title, banner.body, banner.type, banner.status,
      banner.priority, banner.targeting_rules, banner.style, banner.cta_text, banner.cta_url,
      banner.start_date, banner.end_date, banner.created_at, banner.updated_at
    );

    return this.parseRow(banner);
  }

  updateBanner(id, updates) {
    this.init();
    
    const existing = this.getBanner(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      targeting_rules: updates.targeting_rules !== undefined ? JSON.stringify(updates.targeting_rules) : existing.targeting_rules,
      style: updates.style !== undefined ? JSON.stringify(updates.style) : existing.style,
      updated_at: new Date().toISOString()
    };

    this.db.prepare(`
      UPDATE banners SET title=?, body=?, type=?, status=?, priority=?, targeting_rules=?, style=?, cta_text=?, cta_url=?, start_date=?, end_date=?, updated_at=?
      WHERE id=?
    `).run(
      updated.title, updated.body, updated.type, updated.status, updated.priority,
      updated.targeting_rules, updated.style, updated.cta_text, updated.cta_url,
      updated.start_date, updated.end_date, updated.updated_at, id
    );

    return this.parseRow(updated);
  }

  deleteBanner(id) {
    this.init();
    
    const existing = this.getBanner(id);
    if (!existing) return false;

    this.db.prepare('DELETE FROM impressions WHERE banner_id = ?').run(id);
    this.db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    
    return true;
  }

  // Tenant operations
  getTenant(id) {
    this.init();
    
    const tenant = this.db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
    return tenant ? this.parseRow(tenant) : null;
  }

  updateTenant(id, updates) {
    this.init();
    
    const existing = this.getTenant(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      config: updates.config !== undefined ? JSON.stringify(updates.config) : existing.config
    };

    this.db.prepare('UPDATE tenants SET name = ?, config = ? WHERE id = ?')
      .run(updated.name, updated.config, id);

    return this.parseRow(updated);
  }

  createTenant(data) {
    this.init();
    
    const tenant = {
      id: data.id || require('uuid').v4(),
      name: data.name,
      config: JSON.stringify(data.config || {}),
      created_at: new Date().toISOString()
    };

    this.db.prepare('INSERT INTO tenants (id, name, config) VALUES (?, ?, ?)')
      .run(tenant.id, tenant.name, tenant.config);

    return this.parseRow(tenant);
  }

  // Impression operations
  createImpression(data) {
    this.init();
    
    const impression = {
      banner_id: data.banner_id,
      tenant_id: data.tenant_id || 'default',
      user_id: data.user_id || null,
      context: JSON.stringify(data.context || {}),
      action: data.action || 'view',
      created_at: data.created_at || new Date().toISOString()
    };

    const result = this.db.prepare(`
      INSERT INTO impressions (banner_id, tenant_id, user_id, context, action, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      impression.banner_id, impression.tenant_id, impression.user_id,
      impression.context, impression.action, impression.created_at
    );

    return { id: result.lastInsertRowid, ...impression };
  }

  getBannerStats(bannerId) {
    this.init();
    
    const views = this.db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'view'").get(bannerId).c;
    const clicks = this.db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'click'").get(bannerId).c;
    const dismissals = this.db.prepare("SELECT COUNT(*) as c FROM impressions WHERE banner_id = ? AND action = 'dismiss'").get(bannerId).c;
    const unique_users = this.db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM impressions WHERE banner_id = ? AND user_id IS NOT NULL").get(bannerId).c;

    // Daily breakdown for last 30 days
    const daily = this.db.prepare(`
      SELECT date(created_at) as date, action, COUNT(*) as count
      FROM impressions
      WHERE banner_id = ? AND created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at), action
      ORDER BY date(created_at) DESC
    `).all(bannerId);

    return { views, clicks, dismissals, unique_users, daily };
  }

  getTenantStats(tenantId) {
    this.init();
    
    const banners = this.db.prepare('SELECT id, title, type, status FROM banners WHERE tenant_id = ?').all(tenantId);

    const stats = banners.map(b => {
      const bannerStats = this.getBannerStats(b.id);
      return {
        ...b,
        ...bannerStats,
        ctr: bannerStats.views > 0 ? (bannerStats.clicks / bannerStats.views * 100).toFixed(2) + '%' : '0%'
      };
    });

    return stats;
  }

  getDismissedBanners(tenantId, userId) {
    this.init();
    
    const dismissed = this.db.prepare(`
      SELECT DISTINCT banner_id FROM impressions
      WHERE tenant_id = ? AND user_id = ? AND action = 'dismiss'
    `).all(tenantId, userId).map(r => r.banner_id);

    return dismissed;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = SQLiteAdapter;
