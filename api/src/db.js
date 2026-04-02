const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'banneros.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
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
  const count = db.prepare('SELECT COUNT(*) as c FROM tenants').get();
  if (count.c === 0) {
    db.prepare(`
      INSERT INTO tenants (id, name, config)
      VALUES ('default', 'Default Tenant', '{"maxBannersPerPage": 3, "defaultDismissDuration": 86400, "allowPromotional": true, "allowSupport": true, "allowInformational": true}')
    `).run();
  }
}

module.exports = { getDb };
