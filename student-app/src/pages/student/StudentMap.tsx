import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import api from '../../services/api';

// Fix for default marker icon in Leaflet with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3200/3200833.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

export default function StudentMap() {
  const startLocation: [number, number] = [28.6139, 77.2090]; // New Delhi
  const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
  const [isTripActive, setIsTripActive] = useState(false);

  // Fetch profile to get assigned bus
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  const profile = profileData?.data?.studentProfile;
  const assignedBus = profile?.assignedBus;
  const route = profile?.route;

  // Connect to live socket telemetry ONLY for the assigned bus
  useEffect(() => {
    if (!assignedBus) return;

    // Check if trip is active first
    api.get(`/trips/active?busId=${assignedBus.id}`)
      .then(res => {
        setIsTripActive(!!res.data.data);
      })
      .catch(() => setIsTripActive(false));

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const socketUrl = apiUrl.replace('/api', '');
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to Live Tracking Socket');
      socket.emit('join:tracking'); 
    });

    socket.on('bus_location_update', (data: any) => {
      // Filter updates to ONLY their assigned bus
      if (data && data.lat && data.lng && data.busId === assignedBus.id) {
        setBusLocation([data.lat, data.lng]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [assignedBus]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (!assignedBus || !route) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Navigation size={32} className="text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Route Assigned</h3>
        <p className="text-slate-400">You must be assigned to a route and bus to view live tracking.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto relative p-4">
      {/* Top Overlay HUD */}
      <div className={`absolute top-8 left-8 right-8 z-[400] glass-card px-5 py-4 rounded-xl border-emerald-500/30 flex items-center gap-4 shadow-xl pointer-events-none ${
        !isTripActive ? 'border-slate-500/30 opacity-80' : ''
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isTripActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
        }`}>
          <Navigation size={24} />
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-bold tracking-wider uppercase ${isTripActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {assignedBus.busNumber}
          </span>
          <span className="text-xl font-bold text-slate-100">Route {route.routeNumber}</span>
          <span className="text-sm text-slate-400">
            {isTripActive ? 'Live tracking active' : 'Trip not started yet'}
          </span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl mt-4 z-0 border border-white/5 relative">
        <MapContainer center={busLocation || startLocation} zoom={15} className="w-full h-full" zoomControl={false}>
          {/* Light Mode Standard Map Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {busLocation && (
            <>
              <RecenterAutomatically lat={busLocation[0]} lng={busLocation[1]} />
              <Marker position={busLocation} icon={busIcon}>
                <Popup>
                  <div className="text-slate-800 font-bold text-center">
                    Bus {assignedBus.busNumber}<br />
                    <span className="text-xs font-normal text-slate-500">Live Location</span>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
