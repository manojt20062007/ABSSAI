import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore, useThemeStore } from './stores';
import { useEffect } from 'react';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Driver Pages
import DriverHome from './pages/driver/DriverHome';
import DriverMap from './pages/driver/DriverMap';
import DriverPassengers from './pages/driver/DriverPassengers';
import DriverAttendance from './pages/driver/DriverAttendance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Auth Guard - Strictly DRIVER only
function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'DRIVER') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.role === 'DRIVER') return <Navigate to="/driver/home" replace />;
    return <Navigate to="/login" replace />; // If they are not driver, force them out
  }
  return <Outlet />;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'DRIVER') return <Navigate to="/driver/home" replace />;
  return <Navigate to="/login" replace />;
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
              <Route path="/driver/home" element={<DriverHome />} />
              <Route path="/driver/map" element={<DriverMap />} />
              <Route path="/driver/passengers" element={<DriverPassengers />} />
              <Route path="/driver/attendance" element={<DriverAttendance />} />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<RootRedirect />} />
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
