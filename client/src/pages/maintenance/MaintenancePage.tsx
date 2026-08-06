import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, Filter } from 'lucide-react';
import { maintenanceApi } from '../../services/api';

const statusColors: Record<string, string> = { PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', COMPLETED: 'badge-success' };
const typeColors: Record<string, string> = { ROUTINE: 'badge-info', EMERGENCY: 'badge-danger', INSPECTION: 'badge-warning', OVERHAUL: 'badge-neutral' };

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', page, statusFilter],
    queryFn: () => maintenanceApi.getAll({ page, limit: 10, status: statusFilter || undefined }),
    select: (res) => res.data,
  });

  const { data: upcoming } = useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: () => maintenanceApi.getUpcoming(7),
    select: (res) => res.data.data,
  });

  const records = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wrench size={24} className="text-red-400" /> Maintenance Module
          </h1>
          <p className="text-sm text-slate-400 mt-1">Vehicle inspections, service history, and alerts</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> New Record</button>
      </div>

      {/* Upcoming alerts */}
      {upcoming && upcoming.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} /> Upcoming Maintenance ({upcoming.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.slice(0, 6).map((item: any) => (
              <div key={item.id} className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <Clock size={16} className="text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-200">{item.bus?.busNumber}</p>
                  <p className="text-xs text-slate-500">{item.description} — {new Date(item.scheduledDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4 flex gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-lg" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Bus</th><th>Type</th><th>Description</th><th>Scheduled</th><th>Checks</th><th>Cost</th><th>Status</th></tr></thead>
              <tbody>
                {records.map((rec: any, idx: number) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                    <td className="font-medium text-slate-200">{rec.bus?.busNumber}</td>
                    <td><span className={`badge ${typeColors[rec.type]}`}>{rec.type}</span></td>
                    <td className="text-slate-400 max-w-[200px] truncate">{rec.description}</td>
                    <td className="text-slate-400">{new Date(rec.scheduledDate).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-1">
                        {rec.oilChange && <span className="badge badge-info text-[10px]">Oil</span>}
                        {rec.brakeCheck && <span className="badge badge-warning text-[10px]">Brake</span>}
                        {rec.tyreHealth && <span className="badge badge-neutral text-[10px]">Tyre</span>}
                        {rec.batteryCheck && <span className="badge badge-success text-[10px]">Battery</span>}
                        {rec.engineCheck && <span className="badge badge-danger text-[10px]">Engine</span>}
                      </div>
                    </td>
                    <td className="text-slate-300">{rec.cost ? `₹${rec.cost.toLocaleString()}` : '—'}</td>
                    <td><span className={`badge ${statusColors[rec.status]}`}>{rec.status}</span></td>
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
