import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, X } from 'lucide-react';
import { api } from '../api';

const EMPTY_BANNER = {
  title: '',
  body: '',
  type: 'informational',
  status: 'active',
  priority: 0,
  cta_text: '',
  cta_url: '',
  start_date: '',
  end_date: '',
  targeting_rules: {},
};

const RULE_TYPES = [
  { key: 'platforms', label: 'Platforms', placeholder: 'web, mobile, desktop' },
  { key: 'countries', label: 'Countries', placeholder: 'US, IN, GB' },
  { key: 'user_segments', label: 'User Segments', placeholder: 'free, pro, enterprise' },
  { key: 'page_paths', label: 'Page Paths', placeholder: '/dashboard/*, /settings' },
  { key: 'user_ids', label: 'Specific User IDs', placeholder: 'user-123, user-456' },
  { key: 'min_app_version', label: 'Min App Version', placeholder: '2.1.0' },
];

export default function BannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_BANNER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeRules, setActiveRules] = useState([]);

  useEffect(() => {
    if (isEdit) {
      api.getBanner(id).then(({ banner }) => {
        setForm({
          ...banner,
          cta_text: banner.cta_text || '',
          cta_url: banner.cta_url || '',
          start_date: banner.start_date ? banner.start_date.slice(0, 10) : '',
          end_date: banner.end_date ? banner.end_date.slice(0, 10) : '',
        });
        const rules = banner.targeting_rules || {};
        setActiveRules(Object.keys(rules).filter(k => rules[k] !== undefined));
      }).catch(e => setError(e.message));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        tenant_id: 'default',
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        cta_text: form.cta_text || null,
        cta_url: form.cta_url || null,
      };
      if (isEdit) {
        await api.updateBanner(id, data);
      } else {
        await api.createBanner(data);
      }
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const updateRule = (key, value) => {
    setForm(f => ({
      ...f,
      targeting_rules: { ...f.targeting_rules, [key]: value },
    }));
  };

  const addRule = (key) => {
    if (!activeRules.includes(key)) {
      setActiveRules([...activeRules, key]);
      if (key === 'min_app_version' || key === 'is_authenticated') {
        updateRule(key, key === 'is_authenticated' ? true : '');
      } else {
        updateRule(key, []);
      }
    }
  };

  const removeRule = (key) => {
    setActiveRules(activeRules.filter(k => k !== key));
    const rules = { ...form.targeting_rules };
    delete rules[key];
    setForm(f => ({ ...f, targeting_rules: rules }));
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none shadow-sm transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-900 mb-5 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Banners
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{isEdit ? 'Edit Banner' : 'Create Banner'}</h1>
      <p className="text-sm text-gray-500 mb-6">{isEdit ? 'Update this banner\'s configuration.' : 'Set up a new banner with targeting and scheduling.'}</p>

      {error && <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={e => updateField('title', e.target.value)} required placeholder="Enter banner title" />
          </div>

          <div>
            <label className={labelClass}>Body</label>
            <textarea className={`${inputClass} min-h-[80px]`} value={form.body} onChange={e => updateField('body', e.target.value)} rows={3} placeholder="Banner description or message" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.type} onChange={e => updateField('type', e.target.value)}>
                <option value="promotional">Promotional</option>
                <option value="support">Support</option>
                <option value="informational">Informational</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={e => updateField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <input className={inputClass} type="number" value={form.priority} onChange={e => updateField('priority', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Call to Action</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CTA Text</label>
              <input className={inputClass} value={form.cta_text} onChange={e => updateField('cta_text', e.target.value)} placeholder="Learn More" />
            </div>
            <div>
              <label className={labelClass}>CTA URL</label>
              <input className={inputClass} value={form.cta_url} onChange={e => updateField('cta_url', e.target.value)} placeholder="https://example.com" />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input className={inputClass} type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input className={inputClass} type="date" value={form.end_date} onChange={e => updateField('end_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Targeting Rules */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Targeting Rules</h2>
          </div>

          {activeRules.map(key => {
            const ruleDef = RULE_TYPES.find(r => r.key === key);
            if (!ruleDef) return null;
            const isArray = key !== 'min_app_version' && key !== 'is_authenticated';
            const value = form.targeting_rules[key];

            return (
              <div key={key} className="flex items-start gap-3 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <label className={labelClass}>{ruleDef.label}</label>
                  {key === 'is_authenticated' ? (
                    <select className={inputClass} value={value ? 'true' : 'false'} onChange={e => updateRule(key, e.target.value === 'true')}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      value={isArray ? (value || []).join(', ') : (value || '')}
                      onChange={e => {
                        if (isArray) {
                          updateRule(key, e.target.value.split(',').map(s => s.trim()).filter(Boolean));
                        } else {
                          updateRule(key, e.target.value);
                        }
                      }}
                      placeholder={ruleDef.placeholder}
                    />
                  )}
                </div>
                <button type="button" onClick={() => removeRule(key)} className="mt-6 p-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            {RULE_TYPES.filter(r => !activeRules.includes(r.key)).map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => addRule(r.key)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {r.label}
              </button>
            ))}
            {!activeRules.includes('is_authenticated') && (
              <button
                type="button"
                onClick={() => addRule('is_authenticated')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Is Authenticated
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Banner' : 'Create Banner'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="px-5 py-2.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
