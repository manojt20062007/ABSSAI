import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.34:3001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage'); // This fixes the infinite loop
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ============================================================================
// API SERVICE FUNCTIONS
// ============================================================================

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  verifyOTP: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => api.post('/auth/reset-password', data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getActivities: (limit?: number) => api.get('/dashboard/activities', { params: { limit } }),
  getCharts: () => api.get('/dashboard/charts'),
};

// Buses
export const busApi = {
  getAll: (params?: any) => api.get('/buses', { params }),
  getById: (id: string) => api.get(`/buses/${id}`),
  create: (data: any) => api.post('/buses', data),
  update: (id: string, data: any) => api.put(`/buses/${id}`, data),
  delete: (id: string) => api.delete(`/buses/${id}`),
  getStats: () => api.get('/buses/stats'),
};

// Drivers
export const driverApi = {
  getAll: (params?: any) => api.get('/drivers', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getStats: () => api.get('/drivers/stats'),
};

// Routes
export const routeApi = {
  getAll: (params?: any) => api.get('/routes', { params }),
  getById: (id: string) => api.get(`/routes/${id}`),
  create: (data: any) => api.post('/routes', data),
  update: (id: string, data: any) => api.put(`/routes/${id}`, data),
  delete: (id: string) => api.delete(`/routes/${id}`),
};

// Students
export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  updateAssignment: (id: string, data: any) => api.put(`/students/${id}/assignment`, data),
};

// Stops
export const stopApi = {
  getAll: (params?: any) => api.get('/stops', { params }),
  getById: (id: string) => api.get(`/stops/${id}`),
  create: (data: any) => api.post('/stops', data),
  update: (id: string, data: any) => api.put(`/stops/${id}`, data),
  delete: (id: string) => api.delete(`/stops/${id}`),
  getNearby: (lat: number, lng: number, radius?: number) => api.get('/stops/nearby', { params: { lat, lng, radius } }),
};

// Depots
export const depotApi = {
  getAll: (params?: any) => api.get('/depots', { params }),
  getById: (id: string) => api.get(`/depots/${id}`),
  create: (data: any) => api.post('/depots', data),
  update: (id: string, data: any) => api.put(`/depots/${id}`, data),
  delete: (id: string) => api.delete(`/depots/${id}`),
};

// Schedules
export const scheduleApi = {
  getAll: (params?: any) => api.get('/schedules', { params }),
  getById: (id: string) => api.get(`/schedules/${id}`),
  generate: (data: any) => api.post('/schedules/generate', data),
  publish: (id: string) => api.patch(`/schedules/${id}/publish`),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  predictDemand: (data: any) => api.post('/schedules/predict-demand', data),
};

// Trips
export const tripApi = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getById: (id: string) => api.get(`/trips/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/trips/${id}/status`, { status }),
};

// Maintenance
export const maintenanceApi = {
  getAll: (params?: any) => api.get('/maintenance', { params }),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: string, data: any) => api.put(`/maintenance/${id}`, data),
  getUpcoming: (days?: number) => api.get('/maintenance/upcoming', { params: { days } }),
};

// Fuel
export const fuelApi = {
  getAll: (params?: any) => api.get('/fuel', { params }),
  create: (data: any) => api.post('/fuel', data),
  getAnalytics: (busId?: string) => api.get('/fuel/analytics', { params: { busId } }),
};

// Attendance
export const attendanceApi = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  checkIn: (data: { driverId: string; shift: string }) => api.post('/attendance/check-in', data),
  checkOut: (data: { driverId: string }) => api.post('/attendance/check-out', data),
};

// Notifications
export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Reports
export const reportApi = {
  getAll: (params?: any) => api.get('/reports', { params }),
  generate: (data: any) => api.post('/reports/generate', data),
};

// Analytics
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getTrends: () => api.get('/analytics/trends'),
  getRoutePerformance: () => api.get('/analytics/route-performance'),
  getDriverPerformance: () => api.get('/analytics/driver-performance'),
};

// Passenger
export const passengerApi = {
  searchRoutes: (q: string) => api.get('/passenger/routes/search', { params: { q } }),
  getNearbyStops: (lat: number, lng: number, radius?: number) => api.get('/passenger/stops/nearby', { params: { lat, lng, radius } }),
  getLiveBuses: () => api.get('/passenger/buses/live'),
  getRouteSchedule: (routeId: string) => api.get(`/passenger/routes/${routeId}/schedule`),
};
