const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Banners
  getBanners: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/banners${qs ? '?' + qs : ''}`);
  },
  getBanner: (id) => request(`/banners/${id}`),
  createBanner: (data) => request('/banners', { method: 'POST', body: data }),
  updateBanner: (id, data) => request(`/banners/${id}`, { method: 'PUT', body: data }),
  deleteBanner: (id) => request(`/banners/${id}`, { method: 'DELETE' }),

  // Evaluate
  evaluate: (data) => request('/evaluate', { method: 'POST', body: data }),

  // Impressions
  recordImpression: (data) => request('/impressions', { method: 'POST', body: data }),
  dismissBanner: (data) => request('/impressions/dismiss', { method: 'POST', body: data }),
  getBannerStats: (bannerId) => request(`/impressions/stats/${bannerId}`),
  getAllStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/impressions/stats${qs ? '?' + qs : ''}`);
  },

  // Tenants
  getTenant: (id = 'default') => request(`/tenants/${id}`),
  updateTenant: (id, data) => request(`/tenants/${id}`, { method: 'PUT', body: data }),

  // Validate
  validate: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/validate${qs ? '?' + qs : ''}`);
  },
};
