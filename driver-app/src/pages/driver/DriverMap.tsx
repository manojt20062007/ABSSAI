import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, ExternalLink, RefreshCw, Bus as BusIcon, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { useSafetyStore } from '../../stores/safetyStore';
import api from '../../services/api';

// Fix Leaflet default marker icons
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

// Helper: Haversine distance in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
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

// Auto-recenter map component
const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

export default function DriverMap() {
  const fallbackLocation: [number, number] = [12.8717, 80.2263]; // Semmancheri, Chennai
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(fallbackLocation);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<any | null>(null);
  const [assignedBus, setAssignedBus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isTripActive = useSafetyStore((state) => state.isTripActive);

  // 1. Fetch assigned driver profile, bus, and route stops
  useEffect(() => {
    const fetchDriverProfile = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/auth/profile');
        const user = res.data.data;
        const bus = user?.driver?.bus;
        const route = bus?.route;

        if (bus) setAssignedBus(bus);
        if (route) setAssignedRoute(route);
      } catch (err) {
        console.error('Failed to load assigned route for navigation:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDriverProfile();
  }, []);

  // 2. Watch Device GPS
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not supported by your device.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentLocation([lat, lng]);

        const busId = assignedBus?.id || 'BUS-1001';
        api.post('/telemetry/location', {
          busId,
          lat,
          lng,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
        }).catch((err) => console.error('Telemetry failed:', err));
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsError('Waiting for live GPS fix...');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [assignedBus]);

  // 3. Extract and sort route stops
  const routeStops = useMemo(() => {
    if (!assignedRoute?.stops) return [];
    return [...assignedRoute.stops].sort((a, b) => a.sequence - b.sequence);
  }, [assignedRoute]);

  // 4. Calculate Polyline Coordinates
  const polylineCoords = useMemo(() => {
    const coords: [number, number][] = [currentLocation];
    routeStops.forEach((rs: any) => {
      const lat = Number(rs.stop?.latitude || rs.latitude);
      const lng = Number(rs.stop?.longitude || rs.longitude);
      if (lat && lng) coords.push([lat, lng]);
    });
    return coords;
  }, [currentLocation, routeStops]);

  // 5. Dynamically calculate Nearest "NEXT STOP"
  const nextStopInfo = useMemo(() => {
    if (!routeStops.length) {
      return {
        name: assignedRoute?.destination || 'Destination',
        distanceKm: 0,
        etaMins: 0,
      };
    }

    let nearestStop = routeStops[0];
    let minDistance = Infinity;

    routeStops.forEach((rs: any) => {
      const lat = Number(rs.stop?.latitude || rs.latitude);
      const lng = Number(rs.stop?.longitude || rs.longitude);
      if (lat && lng) {
        const dist = calculateHaversineDistance(currentLocation[0], currentLocation[1], lat, lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStop = rs;
        }
      }
    });

    const stopName = nearestStop.stop?.name || nearestStop.name || 'Next Station';
    const distFormatted = minDistance < 1 ? `${Math.round(minDistance * 1000)} m` : `${minDistance.toFixed(1)} km`;
    const etaMins = Math.max(1, Math.round((minDistance / 25) * 60)); // Avg 25 km/h urban speed

    return {
      name: stopName,
      distanceFormatted: distFormatted,
      etaMins,
    };
  }, [currentLocation, routeStops, assignedRoute]);

  // Open Google Maps turn-by-turn navigation link
  const openGoogleMapsNav = () => {
    const dest = assignedRoute?.destination || 'Vel Tech High Tech College, Avadi, Chennai';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation[0]},${currentLocation[1]}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto relative px-2 py-2">
      {/* Top Dynamic HUD Header */}
      <div className="absolute top-4 left-4 right-4 z-[400] glass-card px-5 py-4 rounded-2xl border-indigo-500/30 bg-slate-950/85 backdrop-blur-md flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-indigo-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Navigation size={24} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                NEXT STOP
              </span>
              {assignedRoute?.routeNumber && (
                <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Route {assignedRoute.routeNumber}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-0.5 line-clamp-1">
              {nextStopInfo.name}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {nextStopInfo.distanceFormatted || '0 km'} • approx {nextStopInfo.etaMins} mins away
            </p>
          </div>
        </div>

        {/* Turn-by-Turn Button */}
        <button
          onClick={openGoogleMapsNav}
          className="hidden sm:flex px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
        >
          <ExternalLink size={14} />
          Google Maps
        </button>
      </div>

      {/* Map Display Container */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl z-0 border border-white/10 relative mt-1">
        {gpsError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-red-950/90 border border-red-500/40 text-red-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl">
            <ShieldAlert size={16} />
            {gpsError}
          </div>
        )}

        <MapContainer center={currentLocation} zoom={13} className="w-full h-full" zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <RecenterAutomatically lat={currentLocation[0]} lng={currentLocation[1]} />

          {/* Live Bus Position Marker */}
          <Marker position={currentLocation} icon={busIcon}>
            <Popup>
              <div className="text-slate-900 font-bold text-center">
                🚌 {assignedBus?.busNumber || 'Your Bus'} ({assignedBus?.registrationNumber || 'Live GPS'})
                <br />
                <span className="text-xs text-indigo-600">Active Live Track</span>
              </div>
            </Popup>
          </Marker>

          {/* Dynamic Route Bus Stop Markers */}
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

          {/* Dynamic Polyline Path Connecting Live Bus & Route Stops */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              color="#6366f1"
              weight={5}
              opacity={0.8}
              dashArray="8, 8"
            />
          )}
        </MapContainer>

        {/* Bottom Floating Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-[400] flex items-center justify-between gap-3">
          <div className="glass-card px-4 py-2.5 rounded-xl border-white/10 bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-slate-200 flex items-center gap-2">
            <BusIcon size={16} className="text-indigo-400" />
            <span>Route: <strong className="text-white">{assignedRoute?.name || 'Semmancheri to Vel Tech High Tech'}</strong></span>
          </div>

          <button
            onClick={openGoogleMapsNav}
            className="sm:hidden px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xl flex items-center gap-1.5"
          >
            <ExternalLink size={16} />
            Google Maps
          </button>
        </div>
      </div>
    </div>
  );
}
