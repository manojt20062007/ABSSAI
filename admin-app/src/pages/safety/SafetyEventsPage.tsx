import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  User,
  Bus as BusIcon,
  Play,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Video,
  Volume2,
  X,
  RefreshCw,
  ExternalLink,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { safetyApi } from '../../services/api';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Custom incident pulse icon for Map
const incidentIcon = L.divIcon({
  className: 'incident-marker',
  html: `<div class="relative flex h-8 w-8 items-center justify-center">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <div class="relative rounded-full h-5 w-5 bg-red-600 border-2 border-white shadow-lg flex items-center justify-center">
      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
    </div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function SafetyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Selected Event Details Modal State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Edit Status Form State
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await safetyApi.getEvents(params);
      setEvents(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load safety events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [severityFilter, statusFilter]);

  // Live Socket.IO Alerts (Requirements 41-45 & 50)
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join:dashboard');
    });

    socket.on('safety_event_alert', (newEvent: any) => {
      // Play danger sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.8;
        audio.play().catch(() => {});
      } catch (e) {}

      // Display warning toast
      toast.error(
        `CRITICAL SAFETY ALERT: Bus ${newEvent.bus?.busNumber || 'Unknown'} reported a ${newEvent.severity} severity event (${newEvent.driverResponse})!`,
        { duration: 8000 }
      );

      // Prepend to top of events state
      setEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch Event Details
  const handleViewDetails = async (id: string) => {
    try {
      setSelectedEventId(id);
      setLoadingDetails(true);
      const res = await safetyApi.getEventById(id);
      setSelectedEvent(res.data?.data || null);
      setUpdateStatus(res.data?.data?.status || '');
      setUpdateNotes(res.data?.data?.notes || '');
    } catch (err) {
      toast.error('Failed to load safety event details.');
      setSelectedEventId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Update Safety Event Status
  const handleSaveStatus = async () => {
    if (!selectedEvent) return;
    try {
      setSavingStatus(true);
      const res = await safetyApi.updateStatus(selectedEvent.id, {
        status: updateStatus,
        notes: updateNotes,
      });
      toast.success('Incident status updated successfully');
      setSelectedEvent(res.data?.data);
      // Update in main list
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: updateStatus } : e))
      );
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  // Delete Media File (Hardened audit requirement - FIX 4 & 6)
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to permanently delete this media file? This action is irreversible.')) return;
    try {
      await safetyApi.deleteMedia(mediaId);
      toast.success('Media file deleted successfully');
      // Update detail screen
      if (selectedEvent) {
        setSelectedEvent((prev: any) => ({
          ...prev,
          media: prev.media.filter((m: any) => m.id !== mediaId),
        }));
      }
    } catch (err) {
      toast.error('Failed to delete media asset');
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getStatusColor = (stat: string) => {
    switch (stat) {
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'FALSE_ALARM':
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      case 'INVESTIGATING':
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      case 'ESCALATED':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Safety Alerts & Emergency Evidence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time abnormal stop monitoring, driver check-in verification alerts, and media capture evidence logs.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Reload
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Filter size={16} />
          Filter:
        </div>

        {/* Severity filter */}
        <div className="flex gap-2">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                severityFilter === sev
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-inner'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 ml-auto">
          {['ALL', 'OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'FALSE_ALARM'].map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                statusFilter === stat
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-900'
              }`}
            >
              {stat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-slate-800/50 rounded-3xl flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="text-slate-600" size={48} />
          <h3 className="text-lg font-bold text-slate-400">No safety events found</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Everything is quiet. No abnormal stops or panic emergencies currently active or logged in selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <motion.div
              layout
              key={event.id}
              onClick={() => handleViewDetails(event.id)}
              className="bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 rounded-3xl p-5 cursor-pointer flex flex-col gap-4 transition-all relative overflow-hidden group shadow-lg"
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

              {/* Badges */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${getSeverityColor(event.severity)}`}>
                  {event.severity} SEVERITY
                </span>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(event.status)}`}>
                  {event.status.replace('_', ' ')}
                </span>
              </div>

              {/* Title & Stoppage Details */}
              <div className="space-y-1">
                <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle size={16} className={event.severity === 'HIGH' ? 'text-red-400 animate-pulse' : 'text-amber-400'} />
                  {event.driverResponse === 'EMERGENCY' ? 'Emergency Panic Button Pressed' : event.driverResponse === 'NO_RESPONSE' ? 'Unresponsive Driver Timeout' : 'Stationary Bus Problem Reported'}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(event.detectedAt).toLocaleString()}
                </p>
              </div>

              {/* Bus / Driver Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/40 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <BusIcon size={14} className="text-indigo-400" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block">Bus</span>
                    {event.bus?.busNumber || 'N/A'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <User size={14} className="text-indigo-400" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 block">Driver</span>
                    {event.driver?.user ? `${event.driver.user.firstName} ${event.driver.user.lastName}` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Bottom details */}
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {event.latitude ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` : 'No GPS'}
                </span>

                <span className="font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View Evidence
                  <ExternalLink size={12} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Side-drawer / Modal Overlay */}
      <AnimatePresence>
        {selectedEventId && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col gap-6 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-red-500" size={24} />
                  <div>
                    <h2 className="text-lg font-bold text-white">Incident Evidence Logs</h2>
                    <p className="text-xs text-slate-400">ID: {selectedEventId}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEventId(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-500" size={36} />
                </div>
              ) : selectedEvent ? (
                <div className="space-y-6 flex-1">
                  
                  {/* Quick summary grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Severity</span>
                      <span className={`text-xs font-semibold inline-block mt-1 px-2 py-0.5 rounded-full ${getSeverityColor(selectedEvent.severity)}`}>
                        {selectedEvent.severity}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Driver Response</span>
                      <span className="text-xs text-white font-semibold block mt-1 truncate">
                        {selectedEvent.driverResponse}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Bus Number</span>
                      <span className="text-xs text-white font-semibold block mt-1">
                        {selectedEvent.bus?.busNumber || 'N/A'}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Stoppage Duration</span>
                      <span className="text-xs text-white font-semibold block mt-1">
                        {selectedEvent.stopDuration ? `${selectedEvent.stopDuration} seconds` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Leaflet GPS Mapping (Requirement 41 & 51) */}
                  {selectedEvent.latitude && selectedEvent.longitude && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <MapPin size={16} className="text-red-400" />
                        Incident Location Map
                      </h3>
                      <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 shadow-inner z-10 relative">
                        <MapContainer
                          center={[selectedEvent.latitude, selectedEvent.longitude]}
                          zoom={15}
                          scrollWheelZoom={true}
                          className="h-full w-full"
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[selectedEvent.latitude, selectedEvent.longitude]}
                            icon={incidentIcon}
                          >
                            <Popup>
                              <div className="text-xs font-bold p-1">
                                Stoppage: {selectedEvent.bus?.busNumber}<br/>
                                Accurately to {selectedEvent.gpsAccuracy?.toFixed(1)}m
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  )}

                  {/* AI Risk Assessment Card (Requirement 39, 46 - clean stubs) */}
                  <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/40 rounded-2xl p-4 border border-indigo-500/10 space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Brain className="text-indigo-400" size={16} />
                      AI Incident Risk Assessment Boundary
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block">Identified Category</span>
                        <span className="text-xs text-indigo-300 font-bold block mt-0.5">{selectedEvent.riskCategory || 'NOT_ANALYZED'}</span>
                      </div>
                      <div className="bg-slate-950/30 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block">AI Confidence Score</span>
                        <span className="text-xs text-indigo-300 font-bold block mt-0.5">{selectedEvent.riskScore !== null ? `${(selectedEvent.riskScore * 100).toFixed(0)}%` : '0%'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Recommendation</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">
                        {selectedEvent.aiRecommendation || 'Monitoring baseline indicators. Waiting for status updates.'}
                      </p>
                    </div>
                  </div>

                  {/* Media Players (Requirement 41 & 51) */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <Video size={16} className="text-indigo-400" />
                      Captured Media Clips ({selectedEvent.media?.length || 0})
                    </h3>

                    {selectedEvent.media && selectedEvent.media.length > 0 ? (
                      <div className="space-y-4">
                        {selectedEvent.media.map((med: any) => {
                          const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3001';
                          const mediaUrl = med.fileUrl?.startsWith('http://') || med.fileUrl?.startsWith('https://')
                            ? med.fileUrl
                            : `${base}${med.fileUrl}`;
                          
                          return (
                            <div key={med.id} className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
                                  {med.type === 'VIDEO' ? <Video size={14} className="text-indigo-400" /> : <Volume2 size={14} className="text-indigo-400" />}
                                  {med.type} File — {med.cameraFacing ? `${med.cameraFacing} camera` : ''} ({Math.round(med.fileSize / 1024 / 1024 * 10) / 10}MB)
                                </span>

                                <button
                                  onClick={() => handleDeleteMedia(med.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="Delete Media"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {med.type === 'VIDEO' ? (
                                <video
                                  key={mediaUrl}
                                  src={mediaUrl}
                                  controls
                                  playsInline
                                  crossOrigin="anonymous"
                                  className="w-full rounded-xl aspect-video bg-black border border-white/5 shadow-inner"
                                  preload="auto"
                                  onLoadedMetadata={(e) => {
                                    const videoEl = e.currentTarget;
                                    if (videoEl.duration === Infinity || isNaN(videoEl.duration)) {
                                      videoEl.currentTime = 1e101;
                                      videoEl.ontimeupdate = () => {
                                        videoEl.ontimeupdate = null;
                                        videoEl.currentTime = 0;
                                      };
                                    }
                                  }}
                                />
                              ) : (
                                <audio
                                  key={mediaUrl}
                                  src={mediaUrl}
                                  controls
                                  crossOrigin="anonymous"
                                  className="w-full bg-slate-900 rounded-xl"
                                  preload="metadata"
                                />
                              )}

                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Duration: {med.duration?.toFixed(1)}s</span>
                                {med.interrupted && <span className="text-red-400 font-bold">Interrupted: {med.interruptionReason}</span>}
                                <span>Checksum: {med.checksum?.substring(0, 15)}...</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">
                        No audio/video uploads linked to this incident. Events without panic checks do not record media.
                      </p>
                    )}
                  </div>

                  {/* Actions & Notes Status Manager (Requirement 39, 41) */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-400" />
                      Manage Incident Status
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">Incident Status</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="OPEN">Open</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="ESCALATED">Escalated</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="FALSE_ALARM">False Alarm</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-medium">Investigation / Resolution Notes</label>
                      <textarea
                        value={updateNotes}
                        onChange={(e) => setUpdateNotes(e.target.value)}
                        placeholder="Log incident resolution steps, notes, or details here..."
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
                      />
                    </div>

                    <button
                      onClick={handleSaveStatus}
                      disabled={savingStatus}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {savingStatus ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Saving changes...
                        </>
                      ) : (
                        'Save Update'
                      )}
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple loader helper in local scope
function Loader2({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      className={`animate-spin text-current ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
