const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

class ValkeyAdapter {
  constructor(url) {
    this.client = new Redis(url, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    await this.client.connect();
    await this.initSchema();
    this.initialized = true;
  }

  async initSchema() {
    // Valkey doesn't need explicit schema like SQL, but we need to ensure default tenant exists
    const tenantKey = 'tenant:default';
    const exists = await this.client.exists(tenantKey);
    
    if (!exists) {
      const defaultTenant = {
        id: 'default',
        name: 'Default Tenant',
        config: JSON.stringify({
          maxBannersPerPage: 3,
          defaultDismissDuration: 86400,
          allowPromotional: true,
          allowSupport: true,
          allowInformational: true
        }),
        created_at: new Date().toISOString()
      };
      
      await this.client.hmset(tenantKey, defaultTenant);
    }
  }

  // Helper to parse JSON fields from Valkey hashes
  parseHash(hash) {
    const parsed = { ...hash };
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
    
    const pattern = `banner:${tenantId}:*`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length === 0) return [];
    
    const banners = await Promise.all(
      keys.map(key => this.client.hgetall(key))
    );
    
    let filtered = banners.filter(b => {
      if (filters.status && b.status !== filters.status) return false;
      if (filters.type && b.type !== filters.type) return false;
      return true;
    });
    
    // Sort by priority DESC, created_at DESC
    filtered.sort((a, b) => {
      if (b.priority !== a.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    
    return filtered.map(b => this.parseHash(b));
  }

  async getBanner(id) {
    await this.init();
    
    // Find the banner by scanning all tenant banner keys
    const pattern = 'banner:*:*';
    const keys = await this.client.keys(pattern);
    
    for (const key of keys) {
      const banner = await this.client.hgetall(key);
      if (banner.id === id) {
        return this.parseHash(banner);
      }
    }
    
    return null;
  }

  async createBanner(data) {
    await this.init();
    
    const banner = {
      id: data.id || uuidv4(),
      tenant_id: data.tenant_id || 'default',
      title: data.title,
      body: data.body || '',
      type: data.type || 'informational',
      status: data.status || 'active',
      priority: data.priority || 0,
      targeting_rules: JSON.stringify(data.targeting_rules || {}),
      style: JSON.stringify(data.style || {}),
      cta_text: data.cta_text || '',
      cta_url: data.cta_url || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
    
    const key = `banner:${banner.tenant_id}:${banner.id}`;
    await this.client.hmset(key, banner);
    
    return this.parseHash(banner);
  }

  async updateBanner(id, updates) {
    await this.init();
    
    const existing = await this.getBanner(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...updates,
      targeting_rules: JSON.stringify(updates.targeting_rules !== undefined ? updates.targeting_rules : existing.targeting_rules),
      style: JSON.stringify(updates.style !== undefined ? updates.style : existing.style),
      updated_at: new Date().toISOString()
    };
    
    const key = `banner:${updated.tenant_id}:${updated.id}`;
    await this.client.hmset(key, updated);
    
    return this.parseHash(updated);
  }

  async deleteBanner(id) {
    await this.init();
    
    const banner = await this.getBanner(id);
    if (!banner) return false;
    
    const bannerKey = `banner:${banner.tenant_id}:${banner.id}`;
    await this.client.del(bannerKey);
    
    // Delete related impressions
    const impressionPattern = `impression:${banner.id}:*`;
    const impressionKeys = await this.client.keys(impressionPattern);
    if (impressionKeys.length > 0) {
      await this.client.del(...impressionKeys);
    }
    
    return true;
  }

  // Tenant operations
  async getTenant(id) {
    await this.init();
    
    const key = `tenant:${id}`;
    const exists = await this.client.exists(key);
    if (!exists) return null;
    
    const tenant = await this.client.hgetall(key);
    return this.parseHash(tenant);
  }

  async updateTenant(id, updates) {
    await this.init();
    
    const existing = await this.getTenant(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...updates,
      config: JSON.stringify(updates.config !== undefined ? updates.config : existing.config)
    };
    
    const key = `tenant:${id}`;
    await this.client.hmset(key, updated);
    
    return this.parseHash(updated);
  }

  async createTenant(data) {
    await this.init();
    
    const tenant = {
      id: data.id || uuidv4(),
      name: data.name,
      config: JSON.stringify(data.config || {}),
      created_at: new Date().toISOString()
    };
    
    const key = `tenant:${tenant.id}`;
    await this.client.hmset(key, tenant);
    
    return this.parseHash(tenant);
  }

  // Impression operations
  async createImpression(data) {
    await this.init();
    
    const impression = {
      id: uuidv4(),
      banner_id: data.banner_id,
      tenant_id: data.tenant_id || 'default',
      user_id: data.user_id || '',
      context: JSON.stringify(data.context || {}),
      action: data.action || 'view',
      created_at: new Date().toISOString()
    };
    
    const key = `impression:${impression.banner_id}:${impression.id}`;
    await this.client.hmset(key, impression);
    
    return impression;
  }

  async getBannerStats(bannerId) {
    await this.init();
    
    const pattern = `impression:${bannerId}:*`;
    const keys = await this.client.keys(pattern);
    
    if (keys.length === 0) {
      return { views: 0, clicks: 0, dismissals: 0, unique_users: 0, daily: [] };
    }
    
    const impressions = await Promise.all(
      keys.map(key => this.client.hgetall(key))
    );
    
    const views = impressions.filter(i => i.action === 'view').length;
    const clicks = impressions.filter(i => i.action === 'click').length;
    const dismissals = impressions.filter(i => i.action === 'dismiss').length;
    const unique_users = new Set(impressions.filter(i => i.user_id).map(i => i.user_id)).size;
    
    // Daily breakdown for last 30 days
    const dailyMap = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    impressions.forEach(i => {
      const date = new Date(i.created_at).toISOString().split('T')[0];
      if (new Date(i.created_at) >= thirtyDaysAgo) {
        if (!dailyMap[date]) dailyMap[date] = { view: 0, click: 0, dismiss: 0 };
        dailyMap[date][i.action]++;
      }
    });
    
    const daily = Object.entries(dailyMap)
      .map(([date, actions]) => ({
        date,
        ...Object.entries(actions).map(([action, count]) => ({ action, count })).flat()
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return { views, clicks, dismissals, unique_users, daily };
  }

  async getTenantStats(tenantId) {
    await this.init();
    
    const pattern = `banner:${tenantId}:*`;
    const bannerKeys = await this.client.keys(pattern);
    
    if (bannerKeys.length === 0) return [];
    
    const stats = await Promise.all(
      bannerKeys.map(async (key) => {
        const banner = await this.client.hgetall(key);
        const bannerStats = await this.getBannerStats(banner.id);
        return {
          id: banner.id,
          title: banner.title,
          type: banner.type,
          status: banner.status,
          ...bannerStats,
          ctr: bannerStats.views > 0 ? (bannerStats.clicks / bannerStats.views * 100).toFixed(2) + '%' : '0%'
        };
      })
    );
    
    return stats;
  }

  async getDismissedBanners(tenantId, userId) {
    await this.init();
    
    const pattern = `banner:${tenantId}:*`;
    const bannerKeys = await this.client.keys(pattern);
    
    if (bannerKeys.length === 0) return [];
    
    const dismissedIds = new Set();
    
    // Check all impressions for dismissals by this user
    for (const bannerKey of bannerKeys) {
      const banner = await this.client.hgetall(bannerKey);
      const impressionPattern = `impression:${banner.id}:*`;
      const impressionKeys = await this.client.keys(impressionPattern);
      
      for (const impKey of impressionKeys) {
        const impression = await this.client.hgetall(impKey);
        if (impression.user_id === userId && impression.action === 'dismiss') {
          dismissedIds.add(banner.id);
          break;
        }
      }
    }
    
    return Array.from(dismissedIds);
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = ValkeyAdapter;
