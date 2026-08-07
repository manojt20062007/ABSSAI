import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore, useAuthStore } from '../../stores';
import {
  LayoutDashboard, Bus, Users, Route, MapPin, Building2, Calendar,
  Wrench, Fuel, ClipboardCheck, BarChart3, Map, Bell, FileText,
  Settings, ChevronLeft, ChevronRight, Brain, UserCircle, QrCode, Scan,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER', 'TRANSPORT_ADMIN'] },
  

  { label: 'Buses', icon: Bus, path: '/buses', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Drivers', icon: Users, path: '/drivers', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Students', icon: UserCircle, path: '/students', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Routes', icon: Route, path: '/routes', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER'] },
  { label: 'Bus Stops', icon: MapPin, path: '/stops', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER'] },
  { label: 'Campuses', icon: Building2, path: '/depots', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Scheduling', icon: Calendar, path: '/scheduling', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER'] },
  { label: 'AI Predictions', icon: Brain, path: '/predictions', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER'] },
  { label: 'Live Tracking', icon: Map, path: '/tracking', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER', 'TRANSPORT_ADMIN'] },
  { label: 'Maintenance', icon: Wrench, path: '/maintenance', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Fuel', icon: Fuel, path: '/fuel', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Attendance', icon: ClipboardCheck, path: '/attendance', roles: ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'] },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER'] },
  { label: 'Reports', icon: FileText, path: '/reports', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER', 'TRANSPORT_ADMIN'] },
  { label: 'Notifications', icon: Bell, path: '/notifications', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHEDULER', 'TRANSPORT_ADMIN', 'DRIVER'] },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const filteredMenu = menuItems.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => toggleSidebar()}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r transition-transform duration-300 md:translate-x-0 ${
          sidebarCollapsed ? '-translate-x-full md:w-[72px]' : 'translate-x-0 w-[260px]'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(17,17,24,0.98) 0%, rgba(10,10,15,0.99) 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)' }}>
            <Bus size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  ABSSAI
                </span>
                <p className="text-[10px] text-slate-500 leading-none">College Transit</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle (Hidden on mobile) */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center z-50 hover:scale-110 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          border: '2px solid rgba(10,10,15,0.9)',
        }}
      >
        {sidebarCollapsed ? <ChevronRight size={12} className="text-white" /> : <ChevronLeft size={12} className="text-white" />}
      </button>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={{
                color: isActive ? '#e2e8f0' : '#64748b',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #6366f1, #0ea5e9)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon size={20} className="flex-shrink-0" style={{ color: isActive ? '#818cf8' : undefined }} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                  style={{ background: '#1e1b4b', color: '#e2e8f0' }}>
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors mb-1">
          <Settings size={18} />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <UserCircle size={18} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
    </>
  );
}
