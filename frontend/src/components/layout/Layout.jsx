import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';

const icons = {
  dashboard: '⚡',
  webhooks: '🔗',
  billing: '💳',
  settings: '⚙️',
  logout: '🚪',
};

export default function Layout({ children }) {
  const { signOut, user } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: icons.dashboard },
    { path: '/webhooks', label: t('webhooks'), icon: icons.webhooks },
    { path: '/billing', label: t('billing'), icon: icons.billing },
    { path: '/settings', label: t('settings'), icon: icons.settings },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-lg">🔐</div>
          <span className="text-xl font-bold text-white">DecryptHub</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith(item.path)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={toggleLang}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🌐</span>
          {lang === 'pt' ? 'English' : 'Português'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>{icons.logout}</span>
          {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔐</span>
            <span className="font-bold text-white">DecryptHub</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white">
            ☰
          </button>
        </div>

        <main className="flex-1 overflow-auto bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
