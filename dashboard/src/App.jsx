import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Flag, BarChart3, ShieldCheck, Settings, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import BannerList from './pages/BannerList';
import BannerForm from './pages/BannerForm';
import Stats from './pages/Stats';
import Validator from './pages/Validator';
import TenantConfig from './pages/TenantConfig';

function BannerOSLogo({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8 L26 6 L28 12 L6 16 Z" fill="currentColor" opacity="0.9"/>
      <path d="M6 16 L28 12 L26 20 L4 22 Z" fill="currentColor" opacity="0.8"/>
      <path d="M4 22 L26 20 L24 26 L6 28 Z" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

const navItems = [
  { to: '/', icon: Flag, label: 'Banners', desc: 'Manage all banners' },
  { to: '/stats', icon: BarChart3, label: 'Analytics', desc: 'Impression stats' },
  { to: '/validator', icon: ShieldCheck, label: 'Validator', desc: 'Config health' },
  { to: '/config', icon: Settings, label: 'Settings', desc: 'Tenant config' },
];

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex">
        {/* Sidebar */}
        <aside className="w-[272px] bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col fixed h-full shadow-2xl">
          {/* Logo */}
          <div className="p-6 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BannerOSLogo className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">BannerOS</span>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Platform</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            <p className="px-3 pt-2 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Menu</p>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-black/10'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Docs link */}
          <div className="px-3 pb-2">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200"
            >
              <BookOpen className="w-[18px] h-[18px]" />
              Documentation
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
          </div>

          {/* Footer */}
          <div className="p-4 mx-3 mb-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <BannerOSLogo className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Default Tenant</p>
                <p className="text-[10px] text-slate-500">v1.0.0</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-[272px] min-h-screen">
          <div className="max-w-6xl mx-auto px-10 py-8">
            <Routes>
              <Route path="/" element={<BannerList />} />
              <Route path="/banners/new" element={<BannerForm />} />
              <Route path="/banners/:id/edit" element={<BannerForm />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/validator" element={<Validator />} />
              <Route path="/config" element={<TenantConfig />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
