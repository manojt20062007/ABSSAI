import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Route as RouteIcon, Plus, Search, Edit, Trash2, MapPin, Clock, IndianRupee, X, Loader2, ListOrdered, Sparkles, Navigation } from 'lucide-react';
import { routeApi } from '../../services/api';
import LocationAutocomplete, { LocationResult, calculateRoadRoute } from '../../components/common/LocationAutocomplete';

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
            <RouteIcon size={24} className="text-cyan-400" /> Route & Bus Stop Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Smart route builder with auto place-suggest & distance calculation</p>
        </div>
        <button onClick={() => { setEditRoute(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add New Route & Stops
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
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-64 rounded-xl" />)}
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
              className="glass-card p-5 group flex flex-col justify-between"
            >
              <div>
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
                    <button onClick={() => { if (confirm('Delete route?')) deleteMutation.mutate(route.id); }}
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={14} className="text-green-400 flex-shrink-0" />
                    <span className="truncate"><strong>Source:</strong> {route.source}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={14} className="text-red-400 flex-shrink-0" />
                    <span className="truncate"><strong>Destination:</strong> {route.destination}</span>
                  </div>
                </div>

                {/* Inline Stops Sequence Preview */}
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                  <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <ListOrdered size={14} /> Route Stops ({route.stops?.length || 0}):
                  </p>
                  {route.stops && route.stops.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {route.stops.map((s: any, sIdx: number) => (
                        <div key={s.id || sIdx} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-800/60 border border-white/5">
                          <span className="text-slate-300 font-medium truncate flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] flex items-center justify-center font-bold">
                              {s.sequence}
                            </span>
                            {s.stop?.name || s.name || `Stop ${s.sequence}`}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {s.distanceFromStart ? `${s.distanceFromStart}km` : ''} {s.timeFromStart ? `(${s.timeFromStart}m)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No bus stops added to this route yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="grid grid-cols-3 gap-2">
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

  const [sourceCoords, setSourceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);

  const initialStops = route?.stops?.map((s: any) => ({
    stopId: s.stopId || s.stop?.id,
    name: s.stop?.name || s.name || '',
    sequence: s.sequence,
    distanceFromStart: s.distanceFromStart || 0,
    timeFromStart: s.timeFromStart || 0,
    lat: s.stop?.latitude || undefined,
    lng: s.stop?.longitude || undefined,
  })) || [];

  const [stops, setStops] = useState<Array<{ stopId?: string; name: string; sequence: number; distanceFromStart: number; timeFromStart: number; lat?: number; lng?: number }>>(initialStops);
  const [saving, setSaving] = useState(false);

  // Auto Recalculate Distances & Estimated Time using OSRM Real Road Routing
  const recalculateDistances = async (
    src: { lat: number; lng: number } | null = sourceCoords,
    dst: { lat: number; lng: number } | null = destCoords,
    currentStops = stops
  ) => {
    const waypoints: Array<{ lat: number; lng: number }> = [];
    if (src) waypoints.push(src);

    currentStops.forEach((s) => {
      if (s.lat && s.lng) waypoints.push({ lat: s.lat, lng: s.lng });
    });

    if (dst) waypoints.push(dst);

    if (waypoints.length >= 2) {
      const { totalDistanceKm, totalDurationMin, legDistancesKm } = await calculateRoadRoute(waypoints);

      let cumulativeKm = 0;
      const updatedStops = [...currentStops];
      let stopLegIdx = 0;

      if (src) {
        for (let i = 0; i < updatedStops.length; i++) {
          if (updatedStops[i].lat && updatedStops[i].lng) {
            const legDist = legDistancesKm[stopLegIdx] || 0;
            cumulativeKm += legDist;
            stopLegIdx++;
            updatedStops[i].distanceFromStart = Math.round(cumulativeKm * 10) / 10;
            updatedStops[i].timeFromStart = Math.round((cumulativeKm / 25) * 60);
          }
        }
      }

      setFormData((prev) => ({
        ...prev,
        distance: totalDistanceKm > 0 ? totalDistanceKm : prev.distance,
        estimatedTime: totalDurationMin > 0 ? totalDurationMin + currentStops.length * 2 : prev.estimatedTime,
      }));

      setStops(updatedStops);
    }
  };

  const handleSourceSelect = (val: string, loc?: LocationResult) => {
    const coords = loc ? { lat: loc.lat, lng: loc.lng } : null;
    setSourceCoords(coords);
    setFormData((prev) => ({ ...prev, source: val }));
    if (coords) recalculateDistances(coords, destCoords, stops);
  };

  const handleDestSelect = (val: string, loc?: LocationResult) => {
    const coords = loc ? { lat: loc.lat, lng: loc.lng } : null;
    setDestCoords(coords);
    setFormData((prev) => ({ ...prev, destination: val }));
    if (coords) recalculateDistances(sourceCoords, coords, stops);
  };

  const addStopField = () => {
    setStops([
      ...stops,
      {
        name: '',
        sequence: stops.length + 1,
        distanceFromStart: 0,
        timeFromStart: 0,
      },
    ]);
  };

  const removeStopField = (index: number) => {
    const updated = stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, sequence: i + 1 }));
    setStops(updated);
    recalculateDistances(sourceCoords, destCoords, updated);
  };

  const updateStopField = (index: number, val: string, loc?: LocationResult) => {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      name: val,
      lat: loc?.lat,
      lng: loc?.lng,
    };
    setStops(updated);
    if (loc) {
      recalculateDistances(sourceCoords, destCoords, updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        stops: stops.filter((s) => s.name.trim() !== '').map(({ lat, lng, ...rest }) => ({
          ...rest,
          latitude: lat,
          longitude: lng,
        })),
      };
      if (route) {
        await routeApi.update(route.id, payload);
      } else {
        await routeApi.create(payload);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-slate-900 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {route ? 'Edit Route & Bus Stops' : 'Add New Route & Bus Stops'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-normal flex items-center gap-1 border border-cyan-500/30">
                <Sparkles size={12} /> Auto Road Maps Enabled
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Search colleges, buildings, bus stands, or places to calculate exact road distance & time.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Route Number</label>
              <input value={formData.routeNumber} onChange={(e) => setFormData({...formData, routeNumber: e.target.value})}
                className="input-field" placeholder="e.g. 101A" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Route Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field" placeholder="e.g. Navalur to College" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Source Point (Search Place/College)</label>
              <LocationAutocomplete
                value={formData.source}
                onChange={handleSourceSelect}
                placeholder="Type college or location (e.g. Navalur)..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Destination Point (Search Place/College)</label>
              <LocationAutocomplete
                value={formData.destination}
                onChange={handleDestSelect}
                placeholder="Type college or location (e.g. Sathyabama)..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Distance (km)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-normal">Exact Road</span>
              </label>
              <input type="number" step="0.1" value={formData.distance} onChange={(e) => setFormData({...formData, distance: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Est. Time (min)</span>
                <span className="text-[10px] text-cyan-400 font-mono font-normal">Exact Road</span>
              </label>
              <input type="number" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fare (₹)</label>
              <input type="number" step="0.5" value={formData.fare} onChange={(e) => setFormData({...formData, fare: Number(e.target.value)})}
                className="input-field" required />
            </div>
          </div>

          {/* DYNAMIC BUS STOPS SECTION */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <ListOrdered size={16} /> Bus Stops in this Route ({stops.length})
                </h3>
                <p className="text-[11px] text-slate-400">Search colleges, bus stands & stops. Road distance & time auto-calculate.</p>
              </div>
              <button type="button" onClick={addStopField} className="btn-secondary text-xs py-1.5 px-3 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20">
                <Plus size={14} /> Add Bus Stop
              </button>
            </div>

            {stops.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-800/40 border border-dashed border-slate-700 text-center">
                <p className="text-xs text-slate-400">No stops added yet. Click "+ Add Bus Stop" above to search & add stops for this route.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <LocationAutocomplete
                        value={stop.name}
                        onChange={(val, loc) => updateStopField(index, val, loc)}
                        placeholder="Search college, bus stop or building..."
                        required
                      />
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <input
                        type="number"
                        step="0.1"
                        value={stop.distanceFromStart}
                        onChange={(e) => {
                          const updated = [...stops];
                          updated[index].distanceFromStart = Number(e.target.value);
                          setStops(updated);
                        }}
                        placeholder="Dist (km)"
                        className="input-field text-xs py-1.5 w-full"
                        title="Distance from start (km)"
                      />
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <input
                        type="number"
                        value={stop.timeFromStart}
                        onChange={(e) => {
                          const updated = [...stops];
                          updated[index].timeFromStart = Number(e.target.value);
                          setStops(updated);
                        }}
                        placeholder="Time (m)"
                        className="input-field text-xs py-1.5 w-full"
                        title="Time from start (minutes)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStopField(index)}
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500" />
            <label htmlFor="isActive" className="text-sm text-slate-300">Route is Active</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center bg-cyan-600 hover:bg-cyan-500">
              {saving ? <Loader2 size={16} className="animate-spin" /> : route ? 'Save Route & Stops' : 'Create Route & Stops'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
