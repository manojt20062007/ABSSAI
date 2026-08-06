import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useAuthStore } from '../../stores';
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

export default function DriverMap() {
  const defaultLocation: [number, number] = [28.6139, 77.2090]; // Fallback to New Delhi
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(defaultLocation);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Hook into device GPS
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('GPS is not supported by your device.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null);
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        
        // Broadcast to backend (Geofencing relies on this!)
        // Fallback to testing BUS-1001 if no active trip is selected in the UI
        api.post('/telemetry/location', {
          busId: 'BUS-1001', 
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        }).catch(err => console.error("Telemetry failed:", err));
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsError('Waiting for GPS signal...');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto relative">
      {/* Top Overlay HUD */}
      <div className="absolute top-4 left-4 right-4 z-[400] glass-card px-5 py-4 rounded-xl border-emerald-500/30 flex items-center gap-4 shadow-xl pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Navigation size={24} className="text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Next Stop</span>
          <span className="text-xl font-bold text-slate-100">Connaught Place</span>
          <span className="text-sm text-slate-400">1.2 km • 3 mins away</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-2xl overflow-hidden shadow-inner mt-2 z-0 border border-white/5 relative">
        {gpsError && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-slate-900/90 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {gpsError}
          </div>
        )}
        <MapContainer center={currentLocation} zoom={15} className="w-full h-full" zoomControl={false}>
          {/* Light Mode Standard Map Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <RecenterAutomatically lat={currentLocation[0]} lng={currentLocation[1]} />
          
          <Marker position={currentLocation} icon={busIcon}>
            <Popup>
              <div className="text-slate-800 font-bold text-center">
                Your Bus<br />
                <span className="text-xs font-normal text-slate-500">Live GPS</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
