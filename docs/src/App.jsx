import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import * as icons from 'lucide-react';
import pages from './content';
import MarkdownPage from './components/MarkdownPage';

function BannerOSLogo({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8 L26 6 L28 12 L6 16 Z" fill="currentColor" opacity="0.9"/>
      <path d="M6 16 L28 12 L26 20 L4 22 Z" fill="currentColor" opacity="0.8"/>
      <path d="M4 22 L26 20 L24 26 L6 28 Z" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

function getIcon(name) {
  return icons[name] || icons.FileText;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL || ''}>
      <div className="min-h-screen bg-white flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 flex flex-col fixed h-full bg-gray-50">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <BannerOSLogo className="w-6 h-6 text-indigo-600" />
              <span className="text-lg font-bold text-gray-900">BannerOS</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Documentation</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {pages.map((page) => {
              const Icon = getIcon(page.icon);
              return (
                <NavLink
                  key={page.slug}
                  to={page.slug}
                  end={page.slug === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {page.title}
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <a href="/" className="text-xs text-indigo-600 hover:text-indigo-800">Open Dashboard &rarr;</a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64">
          <div className="max-w-4xl mx-auto px-8 py-10">
            <Routes>
              {pages.map((page) => (
                <Route
                  key={page.slug}
                  path={page.slug}
                  element={<MarkdownPage content={page.body} />}
                />
              ))}
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
