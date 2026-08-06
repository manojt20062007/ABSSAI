import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore, useThemeStore } from './stores';
import { useEffect } from 'react';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Main Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import BusListPage from './pages/buses/BusListPage';
import DriverListPage from './pages/drivers/DriverListPage';
import RouteListPage from './pages/routes/RouteListPage';
import DepotListPage from './pages/depots/DepotListPage';
import SchedulingPage from './pages/scheduling/SchedulingPage';
import TrackingPage from './pages/tracking/TrackingPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import FuelPage from './pages/fuel/FuelPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Icons
import {
  MapPin, Brain, FileText, Settings,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Auth Guard
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light' : '';
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/forgot-password" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/buses" element={<BusListPage />} />
              <Route path="/drivers" element={<DriverListPage />} />
              <Route path="/routes" element={<RouteListPage />} />
              <Route path="/stops" element={<PlaceholderPage title="Bus Stops" description="Manage bus stop locations, amenities, and accessibility" icon={MapPin} color="#f97316" />} />
              <Route path="/depots" element={<DepotListPage />} />
              <Route path="/scheduling" element={<SchedulingPage />} />
              <Route path="/predictions" element={<PlaceholderPage title="AI Predictions" description="AI-powered demand forecasting and optimization" icon={Brain} color="#a855f7" />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/fuel" element={<FuelPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<PlaceholderPage title="Reports" description="Generate and export daily, weekly, and monthly reports" icon={FileText} color="#6366f1" />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" description="System configuration and preferences" icon={Settings} color="#64748b" />} />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1a1a24' : '#ffffff',
            color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: '12px',
          },
        }}
      />
    </QueryClientProvider>
  );
}
