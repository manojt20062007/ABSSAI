import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, Users, Route, Clock, Fuel, Wrench, TrendingUp,
  AlertTriangle, CheckCircle2, XCircle, Activity, MapPin,
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { io } from 'socket.io-client';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface DashStats {
  totalBuses: number; availableBuses: number; runningBuses: number; inactiveBuses: number;
  driversAvailable: number; driversOnDuty: number; todaysTrips: number; completedTrips: number;
  cancelledTrips: number; fuelConsumption: number; maintenanceDue: number;
  averageDelay: number; occupancyPercentage: number;
}

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) { setDisplay(value); clearInterval(timer); return; }
      setDisplay(Math.round((elapsed / duration) * value));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsSummary, setGpsSummary] = useState<any>(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Connect to Socket.IO for live updates
    const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });
    socket.emit('join:dashboard');
    socket.on('gps:summary', (data) => setGpsSummary(data));
    return () => { socket.disconnect(); };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="shimmer h-80 rounded-xl" />
          <div className="shimmer h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats || {} as DashStats;

  const kpis = [
    { label: 'Total Buses', value: s.totalBuses, icon: Bus, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Available Buses', value: s.availableBuses, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Running Buses', value: gpsSummary?.moving || s.runningBuses, icon: Activity, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Inactive / Maintenance', value: s.inactiveBuses, icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Drivers Available', value: s.driversAvailable, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Drivers on Duty', value: s.driversOnDuty, icon: Users, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { label: "Today's Trips", value: s.todaysTrips, icon: Route, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Completed Trips', value: s.completedTrips, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Cancelled Trips', value: s.cancelledTrips, icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Avg Delay (min)', value: s.averageDelay, icon: Clock, color: '#f97316', bg: 'rgba(249,115,22,0.1)', suffix: ' min' },
    { label: 'Fuel Used (L)', value: Math.round(s.fuelConsumption), icon: Fuel, color: '#eab308', bg: 'rgba(234,179,8,0.1)', suffix: ' L' },
    { label: 'Maintenance Due', value: s.maintenanceDue, icon: Wrench, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  // Chart data
  const tripDistribution = [
    { name: 'Completed', value: s.completedTrips || 18 },
    { name: 'Scheduled', value: Math.max(0, (s.todaysTrips || 30) - (s.completedTrips || 18) - (s.cancelledTrips || 2)) },
    { name: 'Cancelled', value: s.cancelledTrips || 2 },
  ];

  const hourlyData = Array.from({ length: 18 }, (_, i) => ({
    hour: `${(i + 5).toString().padStart(2, '0')}:00`,
    passengers: Math.round(100 + Math.sin((i - 2) * 0.5) * 200 + Math.sin((i - 12) * 0.5) * 180 + Math.random() * 50),
    trips: Math.round(3 + Math.sin((i - 2) * 0.5) * 5 + Math.random() * 2),
  }));

  const weeklyFuel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    day, fuel: Math.round(800 + Math.random() * 400), cost: Math.round(70000 + Math.random() * 30000),
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time overview of transit operations</p>
        </div>
        <div className="flex items-center gap-2">
          {gpsSummary && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
              <div className="pulse-dot bg-green-400" />
              {gpsSummary.totalBuses} buses live
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              <AnimatedNumber value={kpi.value} suffix={kpi.suffix} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Passengers */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Hourly Passenger Demand</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="passengerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="passengers" stroke="#6366f1" fill="url(#passengerGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Trip Distribution */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Trip Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={tripDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={5}>
                {tripDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend iconType="circle" formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Fuel */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Weekly Fuel Consumption</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyFuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey="fuel" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Occupancy & Live Stats */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Live Fleet Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Avg Occupancy', value: `${gpsSummary?.avgOccupancy || s.occupancyPercentage || 72}%`, color: '#6366f1' },
              { label: 'On-Time Rate', value: `${Math.max(0, 100 - (s.averageDelay || 0) * 5)}%`, color: '#22c55e' },
              { label: 'Delayed Buses', value: `${gpsSummary?.delayed || 3}`, color: '#f59e0b' },
              { label: 'Active Routes', value: '5', color: '#0ea5e9' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-slate-400 mb-2">{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Activity</h4>
            {[
              { text: 'Bus DL1PC-1003 departed from ISBT', time: '2 min ago', icon: Bus },
              { text: 'Driver Vikram checked in for afternoon shift', time: '5 min ago', icon: Users },
              { text: 'Route 534 schedule updated', time: '12 min ago', icon: Route },
              { text: 'Maintenance completed for DL1PC-1008', time: '25 min ago', icon: Wrench },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-3 py-2 text-sm">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <act.icon size={14} className="text-indigo-400" />
                </div>
                <span className="text-slate-300 flex-1 truncate">{act.text}</span>
                <span className="text-xs text-slate-500 flex-shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
