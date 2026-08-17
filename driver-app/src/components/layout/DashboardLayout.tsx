import { Outlet } from 'react-router-dom';
import { useThemeStore } from '../../stores';
import Sidebar from './Sidebar';
import Header from './Header';
import DriverRecordingOverlay from '../driver/DriverRecordingOverlay';
import DriverSafetyAlert from '../driver/DriverSafetyAlert';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { sidebarCollapsed, theme } = useThemeStore();

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  return (
    <div className="min-h-screen flex relative">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'}`}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Camera & Mic Recording Overlay & Safety Alert Modal */}
      <DriverRecordingOverlay />
      <DriverSafetyAlert />
    </div>
  );
}
