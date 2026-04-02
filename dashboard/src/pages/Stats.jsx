import { useState, useEffect, useMemo } from 'react';
import { Eye, MousePointerClick, XCircle, Users, TrendingUp, Activity } from 'lucide-react';
import { api } from '../api';

export default function Stats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerStats, setBannerStats] = useState(null);

  useEffect(() => {
    api.getAllStats({ tenant_id: 'default' })
      .then(data => setStats(data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadBannerStats = async (bannerId) => {
    setSelectedBanner(bannerId);
    try {
      const data = await api.getBannerStats(bannerId);
      setBannerStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const totals = stats.reduce((acc, s) => ({
    views: acc.views + s.views,
    clicks: acc.clicks + s.clicks,
    dismissals: acc.dismissals + s.dismissals,
  }), { views: 0, clicks: 0, dismissals: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track impressions, clicks, and engagement across all banners.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard icon={Eye} label="Total Views" value={totals.views} color="bg-blue-500" lightColor="bg-blue-50 text-blue-600" />
        <StatCard icon={MousePointerClick} label="Total Clicks" value={totals.clicks} color="bg-emerald-500" lightColor="bg-emerald-50 text-emerald-600" />
        <StatCard icon={XCircle} label="Dismissals" value={totals.dismissals} color="bg-rose-500" lightColor="bg-rose-50 text-rose-600" />
        <StatCard
          icon={TrendingUp}
          label="Overall CTR"
          value={totals.views > 0 ? (totals.clicks / totals.views * 100).toFixed(1) + '%' : '0%'}
          color="bg-violet-500"
          lightColor="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Per-banner table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Per-Banner Breakdown</h2>
          </div>
          <p className="text-xs text-gray-400">{stats.length} banner{stats.length !== 1 ? 's' : ''}</p>
        </div>
        {stats.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No banners yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left px-6 py-3">Banner</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Views</th>
                <th className="text-right px-6 py-3">Clicks</th>
                <th className="text-right px-6 py-3">Dismissals</th>
                <th className="text-right px-6 py-3">CTR</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr
                  key={s.id}
                  onClick={() => loadBannerStats(s.id)}
                  className={`border-b border-gray-50 hover:bg-indigo-50/40 cursor-pointer transition-all duration-150 ${selectedBanner === s.id ? 'bg-indigo-50/60' : ''}`}
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{s.title}</td>
                  <td className="px-6 py-3.5">
                    <TypeBadge type={s.type} />
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : s.status === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-rose-50 text-rose-600'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-right tabular-nums text-gray-600">{s.views.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-sm text-right tabular-nums text-gray-600">{s.clicks.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-sm text-right tabular-nums text-gray-600">{s.dismissals.toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-semibold text-gray-900">{s.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Timeline chart for selected banner */}
      {bannerStats && (
        <div className="mt-6 bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {stats.find(s => s.id === selectedBanner)?.title || 'Unknown'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily activity over the last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Views</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Clicks</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Dismissals</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <MiniStat icon={Eye} label="Views" value={bannerStats.stats.views} color="text-blue-600 bg-blue-50" />
            <MiniStat icon={MousePointerClick} label="Clicks" value={bannerStats.stats.clicks} color="text-emerald-600 bg-emerald-50" />
            <MiniStat icon={XCircle} label="Dismissals" value={bannerStats.stats.dismissals} color="text-rose-600 bg-rose-50" />
            <MiniStat icon={Users} label="Unique Users" value={bannerStats.stats.unique_users} color="text-violet-600 bg-violet-50" />
          </div>

          <TimelineChart daily={bannerStats.daily} />
        </div>
      )}
    </div>
  );
}

function TimelineChart({ daily }) {
  const chartData = useMemo(() => {
    if (!daily || daily.length === 0) return [];

    // Build a map: date -> { view, click, dismiss }
    const map = {};
    for (const d of daily) {
      if (!map[d.date]) map[d.date] = { date: d.date, view: 0, click: 0, dismiss: 0 };
      map[d.date][d.action] = d.count;
    }

    // Fill in last 14 days
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push(map[key] || { date: key, view: 0, click: 0, dismiss: 0 });
    }
    return days;
  }, [daily]);

  if (chartData.length === 0) {
    return <div className="p-10 text-center text-gray-400 text-sm">No daily data available</div>;
  }

  const maxVal = Math.max(1, ...chartData.map(d => Math.max(d.view, d.click, d.dismiss)));
  const chartH = 160;

  return (
    <div className="px-6 py-6">
      <div className="flex items-end gap-[6px]" style={{ height: chartH + 32 }}>
        {chartData.map((d, i) => {
          const vH = (d.view / maxVal) * chartH;
          const cH = (d.click / maxVal) * chartH;
          const dH = (d.dismiss / maxVal) * chartH;
          const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const isToday = d.date === new Date().toISOString().slice(0, 10);

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-slate-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                <p className="font-semibold mb-0.5">{dayLabel}</p>
                <p>Views: {d.view} &middot; Clicks: {d.click} &middot; Dismiss: {d.dismiss}</p>
              </div>

              {/* Bars */}
              <div className="flex items-end gap-[2px] w-full" style={{ height: chartH }}>
                <div className="flex-1 rounded-t-sm bg-blue-400/80 hover:bg-blue-500 transition-all duration-200" style={{ height: Math.max(vH, d.view > 0 ? 3 : 0) }} />
                <div className="flex-1 rounded-t-sm bg-emerald-400/80 hover:bg-emerald-500 transition-all duration-200" style={{ height: Math.max(cH, d.click > 0 ? 3 : 0) }} />
                <div className="flex-1 rounded-t-sm bg-rose-300/80 hover:bg-rose-400 transition-all duration-200" style={{ height: Math.max(dH, d.dismiss > 0 ? 3 : 0) }} />
              </div>

              {/* Date label */}
              <p className={`text-[9px] mt-2 ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'} ${i % 2 === 0 ? '' : 'opacity-0'}`}>
                {dayLabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const cfg = {
    promotional: 'bg-amber-50 text-amber-600',
    support: 'bg-blue-50 text-blue-600',
    informational: 'bg-emerald-50 text-emerald-600',
  };
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg[type] || cfg.informational}`}>{type}</span>;
}

function StatCard({ icon: Icon, label, value, color, lightColor }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl ${lightColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`p-1.5 rounded-lg ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}
