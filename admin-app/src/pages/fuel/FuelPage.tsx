import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Fuel, Plus, TrendingDown, TrendingUp, DollarSign, Gauge } from 'lucide-react';
import { fuelApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FuelPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['fuel', page],
    queryFn: () => fuelApi.getAll({ page, limit: 15 }),
    select: (res) => res.data,
  });

  const { data: analytics } = useQuery({
    queryKey: ['fuel-analytics'],
    queryFn: () => fuelApi.getAnalytics(),
    select: (res) => res.data.data,
  });

  const records = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Fuel size={24} className="text-yellow-400" /> Fuel Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Track consumption, costs, and mileage</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Add Entry</button>
      </div>

      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Fuel', value: `${Math.round(analytics?._sum?.quantity || 0).toLocaleString()} L`, icon: Fuel, color: '#eab308' },
          { label: 'Total Cost', value: `₹${Math.round(analytics?._sum?.totalCost || 0).toLocaleString()}`, icon: DollarSign, color: '#ef4444' },
          { label: 'Avg Mileage', value: `${(analytics?._avg?.mileage || 0).toFixed(1)} km/L`, icon: Gauge, color: '#22c55e' },
          { label: 'Avg Rate', value: `₹${(analytics?._avg?.costPerUnit || 0).toFixed(1)}/L`, icon: TrendingUp, color: '#0ea5e9' },
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

      {/* Chart */}
      {records.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Fuel Consumption History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={records.slice(0, 15).reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={(v: any) => [`${Math.round(v)} L`, 'Quantity']} />
              <Bar dataKey="quantity" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-lg" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Bus</th><th>Quantity</th><th>Rate</th><th>Total Cost</th><th>Mileage</th><th>Station</th></tr></thead>
              <tbody>
                {records.map((rec: any, idx: number) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                    <td className="text-slate-300">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="font-medium text-slate-200">{rec.bus?.busNumber}</td>
                    <td>{Math.round(rec.quantity)} L</td>
                    <td className="text-slate-400">₹{rec.costPerUnit?.toFixed(1)}/L</td>
                    <td className="font-medium text-slate-200">₹{Math.round(rec.totalCost).toLocaleString()}</td>
                    <td><span className={`font-medium ${rec.mileage >= 5 ? 'text-green-400' : rec.mileage >= 3.5 ? 'text-yellow-400' : 'text-red-400'}`}>{rec.mileage?.toFixed(1)} km/L</span></td>
                    <td className="text-slate-400">{rec.fuelStation || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
