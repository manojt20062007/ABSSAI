import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, Edit, Trash2, Bus, Users } from 'lucide-react';
import { depotApi } from '../../services/api';

export default function DepotListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['depots', page, search],
    queryFn: () => depotApi.getAll({ page, limit: 10, search }),
    select: (res) => res.data,
  });

  const depots = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 size={24} className="text-emerald-400" /> Depot Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total} depots</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Add Depot</button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search depots..." className="input-field pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depots.map((depot: any, idx: number) => (
            <motion.div key={depot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="glass-card p-5 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))' }}>
                    <Building2 size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-200">{depot.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{depot.code}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{depot.address}</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <Bus size={14} className="mx-auto mb-1 text-indigo-400" />
                  <p className="text-lg font-bold text-white">{depot._count?.buses || 0}</p>
                  <p className="text-[10px] text-slate-500">Buses</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)' }}>
                  <Users size={14} className="mx-auto mb-1 text-purple-400" />
                  <p className="text-lg font-bold text-white">{depot._count?.drivers || 0}</p>
                  <p className="text-[10px] text-slate-500">Drivers</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(14,165,233,0.08)' }}>
                  <p className="text-lg font-bold text-white">{depot.capacity}</p>
                  <p className="text-[10px] text-slate-500">Capacity</p>
                </div>
              </div>

              {depot.managerName && (
                <div className="mt-3 pt-3 border-t text-xs text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  Manager: <span className="text-slate-300">{depot.managerName}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
