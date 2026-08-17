import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Loader2, Bus as BusIcon, Clock, MapPin, Radio } from 'lucide-react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import api from '../../services/api';

// Fix Leaflet default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Live Bus Icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3200/3200833.png',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Helper: Haversine distance in km
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

export default function StudentMap() {
  const defaultLocation: [number, number] = [12.8717, 80.2263]; // Semmancheri, Chennai
  const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
  const [busSpeed, setBusSpeed] = useState<number>(0);
  const [isTripActive, setIsTripActive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch Student Profile to get assigned bus and route
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then((res) => res.data),
  });

  const profile = profileData?.data?.studentProfile;
  const assignedBus = profile?.assignedBus;
  const route = profile?.route;

  // 1. Initial REST Fetch for Latest Location & Active Trip Status
  useEffect(() => {
    if (!assignedBus) return;

    // Check if trip is active
    api.get(`/trips/active?busId=${assignedBus.id}`)
      .then((res) => {
        setIsTripActive(!!res.data.data);
      })
      .catch(() => setIsTripActive(false));

    // Fetch latest recorded GPS location
    api.get(`/telemetry/latest/${assignedBus.id}`)
      .then((res) => {
        const gps = res.data.data;
        if (gps && gps.latitude && gps.longitude) {
          setBusLocation([Number(gps.latitude), Number(gps.longitude)]);
          setBusSpeed(Number(gps.speed || 0));
          setLastUpdated(new Date(gps.timestamp).toLocaleTimeString());
        }
      })
      .catch((err) => console.error('Failed to fetch initial telemetry:', err));
  }, [assignedBus]);

  // 2. Connect to Live Socket Telemetry for Assigned Bus
  useEffect(() => {
    if (!assignedBus) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const socketUrl = apiUrl.replace('/api', '');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Student Live Telemetry Stream');
      socket.emit('join:tracking');
    });

    socket.on('bus_location_update', (data: any) => {
      // Filter updates to match assigned bus (id or busNumber)
      if (
        data &&
        data.lat &&
        data.lng &&
        (data.busId === assignedBus.id || data.busId === assignedBus.busNumber)
      ) {
        setBusLocation([Number(data.lat), Number(data.lng)]);
        setBusSpeed(Number(data.speed || 0));
        setIsTripActive(true);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [assignedBus]);

  // Sort route stops by sequence
  const routeStops = useMemo(() => {
    if (!route?.stops) return [];
    return [...route.stops].sort((a, b) => a.sequence - b.sequence);
  }, [route]);

  // Polyline coordinates for the route
  const polylineCoords = useMemo(() => {
    const coords: [number, number][] = [];
    if (busLocation) coords.push(busLocation);
    routeStops.forEach((rs: any) => {
      const lat = Number(rs.stop?.latitude || rs.latitude);
      const lng = Number(rs.stop?.longitude || rs.longitude);
      if (lat && lng) coords.push([lat, lng]);
    });
    return coords;
  }, [busLocation, routeStops]);

  // Dynamic ETA & Distance to student's boarding point or next stop
  const etaInfo = useMemo(() => {
    const targetLoc = busLocation || defaultLocation;
    if (!routeStops.length) return { name: route?.destination || 'Campus', dist: '0 km', eta: 0 };

    let nearestStop = routeStops[0];
    let minDistance = Infinity;

    routeStops.forEach((rs: any) => {
      const lat = Number(rs.stop?.latitude || rs.latitude);
      const lng = Number(rs.stop?.longitude || rs.longitude);
      if (lat && lng) {
        const dist = calculateHaversineDistance(targetLoc[0], targetLoc[1], lat, lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStop = rs;
        }
      }
    });

    const name = nearestStop.stop?.name || nearestStop.name || 'Next Stop';
    const distFormatted = minDistance < 1 ? `${Math.round(minDistance * 1000)} m` : `${minDistance.toFixed(1)} km`;
    const etaMins = Math.max(1, Math.round((minDistance / 25) * 60));

    return {
      name,
      dist: distFormatted,
      eta: etaMins,
    };
  }, [busLocation, routeStops, route]);

  if (isProfileLoading) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center h-full text-slate-400">
        <Loader2 className="animate-spin text-emerald-400" size={36} />
        <span className="text-sm font-medium">Connecting to Live Bus Satellite Track...</span>
      </div>
    );
  }

  if (!assignedBus || !route) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Navigation size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Bus Assigned</h3>
        <p className="text-slate-400 text-sm">You are currently not assigned to a bus or route. Please contact the campus transport desk.</p>
      </div>
    );
  }

  const mapCenter = busLocation || defaultLocation;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto relative px-2 py-2">
      {/* Top HUD Header Card */}
      <div className="absolute top-4 left-4 right-4 z-[400] glass-card px-5 py-4 rounded-2xl border-emerald-500/30 bg-slate-950/85 backdrop-blur-md flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
            isTripActive 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Navigation size={24} className={isTripActive ? 'animate-pulse' : ''} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                isTripActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isTripActive ? 'LIVE TRACKING ACTIVE' : 'TRIP IDLE'}
              </span>
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                {assignedBus.busNumber} ({assignedBus.registrationNumber})
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5 line-clamp-1">
              Route {route.routeNumber}: {route.name || `${route.source} to ${route.destination}`}
            </h2>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <Clock size={12} className="text-emerald-400" />
              <span>Next: <strong className="text-slate-200">{etaInfo.name}</strong> ({etaInfo.dist} • ~{etaInfo.eta} mins away)</span>
            </p>
          </div>
        </div>

        {/* Live Indicator Pulse Badge */}
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
            <Radio size={14} className="animate-pulse text-emerald-400" />
            {busSpeed ? `${busSpeed.toFixed(0)} km/h` : '0 km/h'}
          </span>
          {lastUpdated && <span className="text-[10px] text-slate-400">Updated {lastUpdated}</span>}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl z-0 border border-white/10 relative mt-1">
        <MapContainer center={mapCenter} zoom={13} className="w-full h-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <RecenterAutomatically lat={mapCenter[0]} lng={mapCenter[1]} />

          {/* Live Moving Bus Marker */}
          {busLocation && (
            <Marker position={busLocation} icon={busIcon}>
              <Popup>
                <div className="text-slate-900 font-bold text-center">
                  🚌 Bus {assignedBus.busNumber}<br />
                  <span className="text-xs text-emerald-600 font-semibold">Live GPS Satellite Signal</span>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">Speed: {busSpeed.toFixed(0)} km/h</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Stops */}
          {routeStops.map((rs: any, idx: number) => {
            const stopLat = Number(rs.stop?.latitude || rs.latitude);
            const stopLng = Number(rs.stop?.longitude || rs.longitude);
            if (!stopLat || !stopLng) return null;

            const stopName = rs.stop?.name || rs.name || `Stop ${idx + 1}`;
            const isLastStop = idx === routeStops.length - 1;

            const customPinIcon = L.divIcon({
              className: 'custom-stop-pin',
              html: `<div class="w-8 h-8 rounded-full ${
                isLastStop ? 'bg-red-500' : 'bg-indigo-600'
              } text-white font-extrabold flex items-center justify-center border-2 border-white shadow-xl text-xs">${
                isLastStop ? '🏁' : idx + 1
              }</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            return (
              <Marker key={rs.id || idx} position={[stopLat, stopLng]} icon={customPinIcon}>
                <Popup>
                  <div className="text-slate-900 font-bold">
                    Stop #{idx + 1}: {stopName}
                    {rs.stop?.code && <div className="text-xs font-mono text-slate-500">Code: {rs.stop.code}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Polyline Path */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              color="#10b981"
              weight={5}
              opacity={0.85}
              dashArray="8, 8"
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
