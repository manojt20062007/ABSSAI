import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore, useAuthStore, useNotificationStore } from '../../stores';
import {
  Bell, Search, Sun, Moon, ChevronRight, Menu, LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationApi } from '../../services/api';

const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  buses: 'Bus Management',
  drivers: 'Driver Management',
  routes: 'Route Management',
  stops: 'Bus Stops',
  depots: 'Depot Management',
  scheduling: 'Schedule Management',
  predictions: 'AI Predictions',
  tracking: 'Live Tracking',
  maintenance: 'Maintenance',
  fuel: 'Fuel Management',
  attendance: 'Attendance',
  analytics: 'Analytics',
  reports: 'Reports',
  notifications: 'Notifications',
  settings: 'Settings',
  passenger: 'Passenger Portal',
};

export default function Header() {
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { user } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const segments = location.pathname.split('/').filter(Boolean);
  const pageTitle = pathLabels[segments[0]] || 'Dashboard';

  useEffect(() => {
    if (user) {
      notificationApi.getUnreadCount().then((res) => setUnreadCount(res.data.data.count)).catch(() => {});
    }
  }, [user, setUnreadCount]);

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b backdrop-blur-xl"
      style={{
        background: theme === 'dark' ? 'rgba(10,10,15,0.8)' : 'rgba(248,250,252,0.8)',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      }}
    >
      {/* Left: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-slate-200">
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">Home</Link>
          {segments.map((seg, idx) => (
            <span key={seg} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-slate-600" />
              <span className={idx === segments.length - 1 ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                {pathLabels[seg] || seg}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          title="Search (⌘K)"
        >
          <Search size={16} />
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        {/* Notifications */}
        <Link to="/notifications">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors relative"
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

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-3 ml-2 pl-3 border-l" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500">{user?.role?.replace('_', ' ')}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-default">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useAuthStore.getState().logout()}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
            title="Logout"
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 p-4"
          style={{ background: theme === 'dark' ? 'rgba(10,10,15,0.95)' : 'rgba(248,250,252,0.95)' }}
        >
          <input
            type="text"
            placeholder="Search buses, routes, drivers..."
            className="input-field w-full max-w-2xl mx-auto block"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        </motion.div>
      )}
    </header>
  );
}
