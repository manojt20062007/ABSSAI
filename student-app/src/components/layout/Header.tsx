import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore, useAuthStore, useNotificationStore } from '../../stores';
import {
  Bell, Sun, Moon, Menu
} from 'lucide-react';
import { useEffect } from 'react';
import { notificationApi } from '../../services/api';

const pathLabels: Record<string, string> = {
  home: 'My Bus',
  map: 'Track Bus',
  pass: 'Digital Pass',
  scan: 'Scan to Board',
  profile: 'My Profile',
};

export default function Header() {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { user } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const location = useLocation();

  const segments = location.pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'home';
  const pageTitle = pathLabels[lastSegment] || 'Dashboard';

  useEffect(() => {
    if (user) {
      notificationApi.getUnreadCount().then((res) => setUnreadCount(res.data.data.count)).catch(() => {});
    }
  }, [user, setUnreadCount]);

  return (
    <header
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b backdrop-blur-xl"
      style={{
        background: theme === 'dark' ? 'rgba(10,10,15,0.8)' : 'rgba(248,250,252,0.8)',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      }}
    >
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-slate-200">
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-slate-200">{pageTitle}</h1>
      </div>

      {/* Right: Compact Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        {/* Notifications */}
        <Link to="/notifications">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors relative"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        </Link>

        {/* User Avatar */}
        <Link to="/student/profile">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </Link>
      </div>
    </header>
  );
}
