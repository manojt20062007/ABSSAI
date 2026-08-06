import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Edit, Trash2, X, Loader2, Shield, Star } from 'lucide-react';
import { driverApi } from '../../services/api';

const shiftColors: Record<string, string> = {
  MORNING: 'badge-info', AFTERNOON: 'badge-warning', NIGHT: 'badge-neutral', SPLIT: 'badge-success',
};

export default function DriverListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search, shiftFilter],
    queryFn: () => driverApi.getAll({ page, limit: 10, search, shift: shiftFilter || undefined }),
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driverApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  const drivers = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={24} className="text-purple-400" /> Driver Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total} drivers registered</p>
        </div>
        <button onClick={() => { setEditDriver(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, employee ID, license..." className="input-field pl-10" />
        </div>
        <select value={shiftFilter} onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }} className="input-field w-auto min-w-[150px]">
          <option value="">All Shifts</option>
          <option value="MORNING">Morning</option>
          <option value="AFTERNOON">Afternoon</option>
          <option value="NIGHT">Night</option>
          <option value="SPLIT">Split</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-14 rounded-lg" />)}</div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No drivers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Employee ID</th>
                  <th>License</th>
                  <th>Shift</th>
                  <th>Experience</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Depot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver: any, idx: number) => (
                  <motion.tr key={driver.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {driver.user?.firstName?.[0]}{driver.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{driver.user?.firstName} {driver.user?.lastName}</p>
                          <p className="text-xs text-slate-500">{driver.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-slate-300">{driver.employeeId}</td>
                    <td className="text-slate-400 text-xs">{driver.licenseNumber}</td>
                    <td><span className={`badge ${shiftColors[driver.shift]}`}>{driver.shift}</span></td>
                    <td>{driver.experience} yrs</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400" fill="currentColor" />
                        <span className="text-sm font-medium" style={{ color: driver.performanceScore >= 4.5 ? '#22c55e' : driver.performanceScore >= 3.5 ? '#f59e0b' : '#ef4444' }}>
                          {driver.performanceScore?.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td><span className={`badge ${driver.isAvailable ? 'badge-success' : 'badge-warning'}`}>{driver.isAvailable ? 'Available' : 'On Duty'}</span></td>
                    <td className="text-slate-400">{driver.depot?.name || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditDriver(driver); setShowModal(true); }}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { if (confirm('Delete this driver?')) deleteMutation.mutate(driver.id); }}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-sm text-slate-400">Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs py-1.5 px-3">Previous</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
