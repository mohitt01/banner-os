import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function Validator() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const runValidation = async () => {
    setLoading(true);
    try {
      const data = await api.validate({ tenant_id: 'default' });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runValidation(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Validator</h1>
          <p className="text-sm text-gray-500 mt-1">Checks all banners for misconfigurations and issues.</p>
        </div>
        <button
          onClick={runValidation}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[13px] font-medium text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Re-run
        </button>
      </div>

      {/* Summary */}
      {result && (
        <>
          <div className="grid grid-cols-3 gap-5 mb-6">
            <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{result.total_banners}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Banners</p>
            </div>
            <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{result.errors}</p>
              <p className="text-xs text-gray-500 mt-0.5">Errors</p>
            </div>
            <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{result.warnings}</p>
              <p className="text-xs text-gray-500 mt-0.5">Warnings</p>
            </div>
          </div>

          {/* Issues list */}
          {result.issues_count === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold">All banners look good!</p>
              <p className="text-sm text-gray-400 mt-1">No configuration issues found</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Issues ({result.issues_count})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 px-6 py-4">
                    {issue.severity === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Banner: {issue.banner_title} <span className="text-gray-300 mx-1">|</span>
                        <span className="font-mono text-gray-400">{issue.banner_id}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                      issue.severity === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
