import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardCheck, Clock, UserCheck, UserX, CalendarDays } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const statusColors: Record<string, string> = { PRESENT: 'badge-success', ABSENT: 'badge-danger', LATE: 'badge-warning', ON_LEAVE: 'badge-info', HALF_DAY: 'badge-neutral' };

export default function AttendancePage() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, dateFilter],
    queryFn: () => attendanceApi.getAll({ page, limit: 20, date: dateFilter }),
    select: (res) => res.data,
  });

  const records = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r: any) => r.status === 'LATE').length;
  const absentCount = records.filter((r: any) => r.status === 'ABSENT' || r.status === 'ON_LEAVE').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck size={24} className="text-teal-400" /> Attendance
          </h1>
          <p className="text-sm text-slate-400 mt-1">Driver check-in/out and shift management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: presentCount, icon: UserCheck, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Late', value: lateCount, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Absent / Leave', value: absentCount, icon: UserX, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Total Records', value: meta.total, icon: CalendarDays, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Date filter */}
      <div className="glass-card p-4 flex items-center gap-3">
        <label className="text-sm text-slate-400">Date:</label>
        <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} className="input-field w-auto" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-lg" />)}</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No attendance records for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Driver</th><th>Employee ID</th><th>Shift</th><th>Check In</th><th>Check Out</th><th>Late</th><th>Status</th></tr></thead>
              <tbody>
                {records.map((rec: any, idx: number) => (
                  <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                    <td className="font-medium text-slate-200">{rec.driver?.user?.firstName} {rec.driver?.user?.lastName}</td>
                    <td className="text-slate-400 font-mono">{rec.driver?.employeeId}</td>
                    <td><span className="badge badge-info">{rec.shift}</span></td>
                    <td className="text-slate-300">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="text-slate-300">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{rec.lateMinutes > 0 ? <span className="text-amber-400">{rec.lateMinutes} min</span> : '—'}</td>
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
