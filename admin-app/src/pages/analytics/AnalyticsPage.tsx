import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Bus, Fuel, Route as RouteIcon, Clock, DollarSign } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AnalyticsPage() {
  const { data: overview } = useQuery({ queryKey: ['analytics-overview'], queryFn: () => analyticsApi.getOverview(), select: r => r.data.data });
  const { data: trends } = useQuery({ queryKey: ['analytics-trends'], queryFn: () => analyticsApi.getTrends(), select: r => r.data.data });
  const { data: routePerf } = useQuery({ queryKey: ['analytics-routes'], queryFn: () => analyticsApi.getRoutePerformance(), select: r => r.data.data });
  const { data: driverPerf } = useQuery({ queryKey: ['analytics-drivers'], queryFn: () => analyticsApi.getDriverPerformance(), select: r => r.data.data });

  const o = overview || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 size={24} className="text-purple-400" /> Analytics Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Comprehensive insights from the last 30 days</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Trips', value: o.totalTrips || 0, icon: RouteIcon, color: '#6366f1' },
          { label: 'Est. Revenue', value: `₹${((o.estimatedRevenue || 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: '#22c55e' },
          { label: 'Fuel Cost', value: `₹${((o.fuelCost || 0) / 1000).toFixed(0)}K`, icon: Fuel, color: '#f59e0b' },
          { label: 'Completion Rate', value: `${o.completionRate || 0}%`, icon: TrendingUp, color: '#0ea5e9' },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Trend Charts */}
      {trends && trends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Daily Trips (30 Days)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="trips" stroke="#6366f1" fill="url(#tripsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Revenue vs Fuel Cost</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Legend iconType="circle" formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="fuelCost" stroke="#f59e0b" strokeWidth={2} dot={false} name="Fuel Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Route & Driver Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Route Performance</h3>
          {routePerf && routePerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={routePerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis type="category" dataKey="routeNumber" tick={{ fill: '#64748b', fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Bar dataKey="efficiency" fill="#6366f1" radius={[0, 4, 4, 0]} name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-slate-500 py-12">No route data available</div>}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Top Drivers</h3>
          <div className="space-y-3">
            {(driverPerf || []).slice(0, 8).map((d: any, i: number) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-bold text-slate-500">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {d.user?.firstName?.[0]}{d.user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{d.user?.firstName} {d.user?.lastName}</p>
                  <p className="text-xs text-slate-500">{d._count?.trips || d.totalTrips} trips</p>
                </div>
                <div className="text-sm font-semibold" style={{ color: d.performanceScore >= 4.5 ? '#22c55e' : d.performanceScore >= 3.5 ? '#f59e0b' : '#ef4444' }}>
                  {d.performanceScore?.toFixed(1)} ★
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
