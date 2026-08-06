import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Route as RouteIcon, Plus, Search, Edit, Trash2, MapPin, Clock, IndianRupee, X, Loader2 } from 'lucide-react';
import { routeApi } from '../../services/api';

export default function RouteListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRoute, setEditRoute] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['routes', page, search],
    queryFn: () => routeApi.getAll({ page, limit: 10, search }),
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routeApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  });

  const routes = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <RouteIcon size={24} className="text-cyan-400" /> Route Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total} routes configured</p>
        </div>
        <button onClick={() => { setEditRoute(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Route
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by route number, name, source, destination..." className="input-field pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-48 rounded-xl" />)}
        </div>
      ) : routes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <RouteIcon size={48} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">No routes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route: any, idx: number) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                    <span className="text-cyan-400 font-bold text-sm">{route.routeNumber}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{route.name}</p>
                    <span className={`badge ${route.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditRoute(route); setShowModal(true); }}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(route.id); }}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} className="text-green-400 flex-shrink-0" />
                  <span className="truncate">{route.source}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} className="text-red-400 flex-shrink-0" />
                  <span className="truncate">{route.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Distance</p>
                  <p className="text-sm font-semibold text-slate-200">{route.distance} km</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-semibold text-slate-200">{route.estimatedTime} min</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Fare</p>
                  <p className="text-sm font-semibold text-slate-200">₹{route.fare}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Peak: {route.peakFrequency}min</span>
                <span>Normal: {route.normalFrequency}min</span>
                <span>Stops: {route.stops?.length || 0}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs py-1.5 px-3">Previous</button>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-xs py-1.5 px-3">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
