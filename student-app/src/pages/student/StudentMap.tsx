import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

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

export default function StudentMap() {
  const startLocation: [number, number] = [28.6139, 77.2090]; // New Delhi
  const [busLocation, setBusLocation] = useState<[number, number]>(startLocation);

  // Mock a moving bus for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation((prev) => [
        prev[0] + (Math.random() - 0.5) * 0.001,
        prev[1] + (Math.random() - 0.5) * 0.001,
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto relative p-4">
      {/* Top Overlay HUD */}
      <div className="absolute top-8 left-8 right-8 z-[400] glass-card px-5 py-4 rounded-xl border-emerald-500/30 flex items-center gap-4 shadow-xl pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Navigation size={24} className="text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Your Bus</span>
          <span className="text-xl font-bold text-slate-100">Route 423</span>
          <span className="text-sm text-slate-400">Arriving in 12 mins</span>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl mt-4 z-0 border border-white/5 relative">
        <MapContainer center={startLocation} zoom={15} className="w-full h-full" zoomControl={false}>
          {/* Light Mode Standard Map Tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Marker position={busLocation} icon={busIcon}>
            <Popup>
              <div className="text-slate-800 font-bold text-center">
                Bus 423<br />
                <span className="text-xs font-normal text-slate-500">Live Location</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
