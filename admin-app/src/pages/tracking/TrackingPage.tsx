import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Users, Gauge, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

// Custom bus icon
const createBusIcon = (color: string, rotation: number) => {
  return L.divIcon({
    className: 'bus-marker',
    html: `<div style="transform:rotate(${rotation}deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <div style="background:${color};width:28px;height:28px;border-radius:8px;border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H6C4.9 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3M7 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0M13 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/></svg>
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface BusData {
  busId: string;
  busNumber: string;
  routeName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  occupancy: number;
  maxCapacity: number;
  currentStop: string;
  nextStop: string;
  eta: number;
  delay: number;
  status: string;
  timestamp: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function TrackingPage() {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:tracking');
    });

    socket.on('gps:update', (data: BusData[]) => {
      setBuses(data);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, []);

  const getStatusColor = (bus: BusData) => {
    if (bus.delay > 5) return '#ef4444';
    if (bus.status === 'stopped') return '#f59e0b';
    return '#22c55e';
  };

  const delhiCenter: [number, number] = [28.6139, 77.2090];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Navigation size={24} className="text-cyan-400" /> Live GPS Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time bus positions updated every 3 seconds</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`pulse-dot ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-slate-400">{connected ? `${buses.length} buses live` : 'Connecting...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 glass-card overflow-hidden" style={{ height: '600px' }}>
          <MapContainer center={delhiCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {buses.map((bus) => (
              <Marker
                key={bus.busId}
                position={[bus.latitude, bus.longitude]}
                icon={createBusIcon(getStatusColor(bus), bus.heading)}
                eventHandlers={{ click: () => setSelectedBus(bus) }}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <p className="font-bold text-lg">{bus.busNumber}</p>
                    <p className="text-gray-600 text-xs mb-2">{bus.routeName}</p>
                    <div className="space-y-1">
                      <p>📍 {bus.currentStop}</p>
                      <p>➡️ Next: {bus.nextStop}</p>
                      <p>🚀 Speed: {bus.speed} km/h</p>
                      <p>👥 Occupancy: {bus.occupancy}/{bus.maxCapacity}</p>
                      <p>⏱️ ETA: {bus.eta} min</p>
                      {bus.delay > 0 && <p className="text-red-600">⚠️ Delay: {bus.delay} min</p>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Bus List Sidebar */}
        <div className="glass-card overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-slate-200">Fleet Status</h3>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Moving ({buses.filter(b => b.status === 'moving').length})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Stopped ({buses.filter(b => b.status === 'stopped').length})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Delayed ({buses.filter(b => b.delay > 5).length})</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {buses.map((bus) => (
              <motion.div
                key={bus.busId}
                className={`p-3 border-b cursor-pointer transition-colors ${selectedBus?.busId === bus.busId ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                onClick={() => setSelectedBus(bus)}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200">{bus.busNumber}</span>
                  <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(bus) }} />
                </div>
                <p className="text-xs text-slate-500 truncate">{bus.currentStop}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Gauge size={10} /> {bus.speed} km/h</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {bus.occupancy}/{bus.maxCapacity}</span>
                  {bus.delay > 0 && <span className="text-red-400 flex items-center gap-1"><Clock size={10} /> +{bus.delay}m</span>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
