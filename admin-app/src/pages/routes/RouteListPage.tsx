import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RouteFormModal route={editRoute} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function RouteFormModal({ route, onClose }: { route: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    routeNumber: route?.routeNumber || '',
    name: route?.name || '',
    source: route?.source || '',
    destination: route?.destination || '',
    distance: route?.distance || 0,
    estimatedTime: route?.estimatedTime || 0,
    fare: route?.fare || 0,
    peakFrequency: route?.peakFrequency || 15,
    normalFrequency: route?.normalFrequency || 30,
    isActive: route ? route.isActive : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (route) {
        await routeApi.update(route.id, formData);
      } else {
        await routeApi.create(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-slate-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{route ? 'Edit Route' : 'Add New Route'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Route Number</label>
              <input value={formData.routeNumber} onChange={(e) => setFormData({...formData, routeNumber: e.target.value})}
                className="input-field" placeholder="e.g. 423" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Route Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field" placeholder="e.g. ISBT to SEC-14" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
              <input value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Destination</label>
              <input value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})}
                className="input-field" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Distance (km)</label>
              <input type="number" step="0.1" value={formData.distance} onChange={(e) => setFormData({...formData, distance: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Est. Time (min)</label>
              <input type="number" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fare (₹)</label>
              <input type="number" step="0.5" value={formData.fare} onChange={(e) => setFormData({...formData, fare: Number(e.target.value)})}
                className="input-field" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Peak Frequency (min)</label>
              <input type="number" value={formData.peakFrequency} onChange={(e) => setFormData({...formData, peakFrequency: Number(e.target.value)})}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Normal Freq (min)</label>
              <input type="number" value={formData.normalFrequency} onChange={(e) => setFormData({...formData, normalFrequency: Number(e.target.value)})}
                className="input-field" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500" />
            <label htmlFor="isActive" className="text-sm text-slate-300">Route is Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center bg-cyan-600 hover:bg-cyan-500">
              {saving ? <Loader2 size={16} className="animate-spin" /> : route ? 'Update Route' : 'Add Route'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
