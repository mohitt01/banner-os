/**
 * BannerOS API client — wraps HTTP calls to the BannerOS API server.
 * Uses native fetch (Node 18+). Base URL configurable via BANNEROS_API_BASE_URL env var.
 * Expected format: http://localhost:3001/api or https://your-domain.com/api
 */

const BANNEROS_API_BASE_URL = process.env.BANNEROS_API_BASE_URL || "http://localhost:3001/api";

async function request(method, path, body) {
  const url = `${BANNEROS_API_BASE_URL}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body && method !== "GET") {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function healthCheck() {
  return request("GET", "/api/health");
}

export async function listBanners(tenant_id = "default", { status, type } = {}) {
  const params = new URLSearchParams({ tenant_id });
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  return request("GET", `/api/banners?${params}`);
}

export async function getBanner(id) {
  return request("GET", `/api/banners/${id}`);
}

export async function createBanner(banner) {
  return request("POST", "/api/banners", banner);
}

export async function updateBanner(id, updates) {
  return request("PUT", `/api/banners/${id}`, updates);
}

export async function deleteBanner(id) {
  return request("DELETE", `/api/banners/${id}`);
}

export async function evaluateBanners({ tenant_id = "default", user_id, context = {} }) {
  return request("POST", "/api/evaluate", { tenant_id, user_id, context });
}

export async function recordImpression({ banner_id, tenant_id = "default", user_id, context = {}, action = "view" }) {
  return request("POST", "/api/impressions", { banner_id, tenant_id, user_id, context, action });
}

export async function dismissBanner({ banner_id, tenant_id = "default", user_id }) {
  return request("POST", "/api/impressions/dismiss", { banner_id, tenant_id, user_id });
}

export async function getBannerStats(banner_id) {
  return request("GET", `/api/impressions/stats/${banner_id}`);
}

export async function getTenantStats(tenant_id = "default") {
  return request("GET", `/api/impressions/stats?tenant_id=${encodeURIComponent(tenant_id)}`);
}

export async function validateBanners(tenant_id = "default") {
  return request("GET", `/api/validate?tenant_id=${encodeURIComponent(tenant_id)}`);
}

export async function getTenant(id) {
  return request("GET", `/api/tenants/${id}`);
}

export async function updateTenant(id, updates) {
  return request("PUT", `/api/tenants/${id}`, updates);
}
