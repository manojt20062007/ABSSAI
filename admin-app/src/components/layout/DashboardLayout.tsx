import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../../stores';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { sidebarCollapsed, theme } = useThemeStore();

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
