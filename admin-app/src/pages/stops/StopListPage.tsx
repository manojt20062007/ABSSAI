import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Search, Edit, Trash2, CheckCircle2, XCircle, Bus, X, Loader2 } from 'lucide-react';
import { stopApi } from '../../services/api';

export default function StopListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStop, setEditStop] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stops', page, search],
    queryFn: () => stopApi.getAll({ page, limit: 12, search }),
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stopApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stops'] }),
  });

  const stops = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MapPin size={24} className="text-orange-400" /> Bus Stops Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total || stops.length} bus stops in system</p>
        </div>
        <button onClick={() => { setEditStop(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add New Stop
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search stops by name, location, code..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-xl" />)}
        </div>
      ) : stops.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          <MapPin size={48} className="mx-auto mb-4 text-slate-600" />
          <p>No bus stops found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stops.map((stop: any, idx: number) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-card p-5 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-400">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">{stop.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{stop.code || `STP-${stop.id.slice(0, 5)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditStop(stop); setShowModal(true); }} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10">
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this stop?')) deleteMutation.mutate(stop.id); }}
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <p><span className="text-slate-500">Coordinates:</span> {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}</p>
                  <p><span className="text-slate-500">Zone:</span> {stop.zone || 'Central Delhi'}</p>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    {stop.shelter ? <CheckCircle2 size={12} className="text-green-400" /> : <XCircle size={12} className="text-slate-600" />} Shelter
                  </span>
                  <span className="flex items-center gap-1">
                    {stop.displayBoard ? <CheckCircle2 size={12} className="text-green-400" /> : <XCircle size={12} className="text-slate-600" />} Digital Display
                  </span>
                </div>
                <span className="badge badge-neutral text-[10px]"><Bus size={10} className="mr-1 inline" /> {stop._count?.routeStops || 3} Routes</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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
          <StopFormModal stop={editStop} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StopFormModal({ stop, onClose }: { stop: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: stop?.name || '',
    code: stop?.code || '',
    latitude: stop?.latitude || 0,
    longitude: stop?.longitude || 0,
    zone: stop?.zone || '',
    shelter: stop ? stop.shelter : false,
    displayBoard: stop ? stop.displayBoard : false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (stop) {
        await stopApi.update(stop.id, formData);
      } else {
        await stopApi.create(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['stops'] });
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
          <h2 className="text-xl font-bold text-white">{stop ? 'Edit Bus Stop' : 'Add New Bus Stop'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stop Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field" placeholder="e.g. Central Station" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stop Code</label>
              <input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="input-field" placeholder="e.g. CST-01" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Latitude</label>
              <input type="number" step="0.000001" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Longitude</label>
              <input type="number" step="0.000001" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})}
                className="input-field" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Zone</label>
            <input value={formData.zone} onChange={(e) => setFormData({...formData, zone: e.target.value})}
              className="input-field" placeholder="e.g. North Zone" />
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="shelter" checked={formData.shelter} onChange={(e) => setFormData({...formData, shelter: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-orange-500 focus:ring-orange-500" />
              <label htmlFor="shelter" className="text-sm text-slate-300">Has Shelter</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="displayBoard" checked={formData.displayBoard} onChange={(e) => setFormData({...formData, displayBoard: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-orange-500 focus:ring-orange-500" />
              <label htmlFor="displayBoard" className="text-sm text-slate-300">Digital Display Board</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center bg-orange-600 hover:bg-orange-500">
              {saving ? <Loader2 size={16} className="animate-spin" /> : stop ? 'Update Stop' : 'Add Stop'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
