import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import { api } from '../api';

export default function TenantConfig() {
  const [tenant, setTenant] = useState(null);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getTenant('default')
      .then(({ tenant }) => {
        setTenant(tenant);
        setConfig(tenant.config);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.updateTenant('default', { config });
      setMessage('Configuration saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key, value) => setConfig(c => ({ ...c, [key]: value }));

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none shadow-sm transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Tenant Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Configure display limits, dismiss behavior, and allowed banner types.</p>

      {message && (
        <div className={`mb-4 p-3.5 rounded-xl text-sm font-medium ${message.startsWith('Error') ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{tenant?.name}</p>
            <p className="text-[11px] text-gray-400 font-mono">ID: {tenant?.id}</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Max Banners Per Page</label>
          <input
            className={inputClass}
            type="number"
            min="1"
            max="20"
            value={config.maxBannersPerPage || 3}
            onChange={e => updateConfig('maxBannersPerPage', parseInt(e.target.value) || 3)}
          />
          <p className="text-xs text-gray-400 mt-1">Maximum number of banners shown per page evaluation</p>
        </div>

        <div>
          <label className={labelClass}>Default Dismiss Duration (seconds)</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={config.defaultDismissDuration || 86400}
            onChange={e => updateConfig('defaultDismissDuration', parseInt(e.target.value) || 86400)}
          />
          <p className="text-xs text-gray-400 mt-1">How long a dismissed banner stays hidden (86400 = 24 hours)</p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-gray-700">Allowed Banner Types</p>
          {[
            { key: 'allowPromotional', label: 'Promotional Banners' },
            { key: 'allowSupport', label: 'Support Banners' },
            { key: 'allowInformational', label: 'Informational Banners' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config[key] !== false}
                onChange={e => updateConfig(key, e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
