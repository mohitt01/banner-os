import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Megaphone, HelpCircle, Info, Target, Calendar, Zap, Flag } from 'lucide-react';
import { api } from '../api';

const typeConfig = {
  promotional: { icon: Megaphone, color: 'text-amber-600 bg-amber-50', gradient: 'from-amber-500 to-orange-500' },
  support: { icon: HelpCircle, color: 'text-blue-600 bg-blue-50', gradient: 'from-blue-500 to-cyan-500' },
  informational: { icon: Info, color: 'text-emerald-600 bg-emerald-50', gradient: 'from-emerald-500 to-teal-500' },
};

const statusConfig = {
  active: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  inactive: { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
  archived: { dot: 'bg-rose-400', text: 'text-rose-600', bg: 'bg-rose-50' },
};

export default function BannerList() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '' });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const params = { tenant_id: 'default' };
      if (filter.status) params.status = filter.status;
      if (filter.type) params.type = filter.type;
      const data = await api.getBanners(params);
      setBanners(data.banners);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, [filter]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    try {
      await api.deleteBanner(id);
      fetchBanners();
    } catch (e) {
      alert(e.message);
    }
  };

  const counts = {
    all: banners.length,
    active: banners.filter(b => b.status === 'active').length,
    inactive: banners.filter(b => b.status !== 'active').length,
  };

  const selectCls = "px-3 py-2 border border-gray-200 rounded-xl text-[13px] bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none shadow-sm transition-all";

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.all} total &middot; <span className="text-emerald-600">{counts.active} active</span>
            {counts.inactive > 0 && <> &middot; <span className="text-gray-400">{counts.inactive} inactive</span></>}
          </p>
        </div>
        <Link
          to="/banners/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          Create Banner
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} className={selectCls}>
          <option value="">All Types</option>
          <option value="promotional">Promotional</option>
          <option value="support">Support</option>
          <option value="informational">Informational</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Flag className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-600 font-semibold">No banners yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first banner to get started</p>
          <Link to="/banners/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Banner
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => {
            const tc = typeConfig[banner.type] || typeConfig.informational;
            const sc = statusConfig[banner.status] || statusConfig.inactive;
            const TypeIcon = tc.icon;
            const ruleCount = Object.keys(banner.targeting_rules).length;

            return (
              <div key={banner.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 hover:shadow-md hover:border-gray-300/80 transition-all duration-200 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Type icon with gradient accent */}
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-xl ${tc.color} flex items-center justify-center`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${sc.dot}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sc.text} ${sc.bg}`}>
                          {banner.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2.5">{banner.body || 'No description'}</p>

                      {/* Metadata chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-[11px] text-gray-500 font-medium">
                          <Zap className="w-3 h-3" /> Priority {banner.priority}
                        </span>
                        {(banner.start_date || banner.end_date) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-[11px] text-gray-500 font-medium">
                            <Calendar className="w-3 h-3" />
                            {banner.start_date ? new Date(banner.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                            {' \u2013 '}
                            {banner.end_date ? new Date(banner.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                          </span>
                        )}
                        {ruleCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-[11px] text-indigo-600 font-medium">
                            <Target className="w-3 h-3" /> {ruleCount} rule{ruleCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {banner.cta_text && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-[11px] text-gray-500 font-medium">
                            CTA: {banner.cta_text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/banners/${banner.id}/edit`}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(banner.id, banner.title)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
