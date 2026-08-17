import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2, Navigation, Building2, School } from 'lucide-react';
import axios from 'axios';

export interface LocationResult {
  placeId: string;
  name: string;
  displayName: string;
  type?: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, location?: LocationResult) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Type college, building, or place name...',
  className = '',
  required = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const photonReq = axios.get('https://photon.komoot.io/api/', {
          params: { q: query, limit: 6 },
        });

        const nominatimReq = axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: query, format: 'json', addressdetails: 1, limit: 5 },
        });

        const [photonRes, nominatimRes] = await Promise.allSettled([photonReq, nominatimReq]);

        const combined: LocationResult[] = [];
        const seen = new Set<string>();

        if (photonRes.status === 'fulfilled' && photonRes.value.data?.features) {
          photonRes.value.data.features.forEach((feat: any) => {
            const props = feat.properties;
            const name = props.name || props.street || props.city;
            if (!name) return;

            const details = [props.street, props.district || props.locality, props.city, props.state]
              .filter(Boolean)
              .filter((v, i, self) => self.indexOf(v) === i)
              .join(', ');

            const key = `${name.toLowerCase()}-${feat.geometry.coordinates[1].toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push({
                placeId: `photon-${props.osm_id || Math.random()}`,
                name: name,
                displayName: details ? `${name}, ${details}` : name,
                type: props.osm_value || props.type,
                lat: feat.geometry.coordinates[1],
                lng: feat.geometry.coordinates[0],
              });
            }
          });
        }

        if (nominatimRes.status === 'fulfilled' && Array.isArray(nominatimRes.value.data)) {
          nominatimRes.value.data.forEach((item: any) => {
            const name = item.display_name.split(',')[0];
            const key = `${name.toLowerCase()}-${parseFloat(item.lat).toFixed(3)}`;
            if (!seen.has(key)) {
              seen.add(key);
              combined.push({
                placeId: `nom-${item.place_id}`,
                name: name,
                displayName: item.display_name,
                type: item.type,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              });
            }
          });
        }

        setResults(combined.slice(0, 7));
        if (combined.length > 0) {
          updatePosition();
          setOpen(true);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: LocationResult) => {
    setQuery(item.name);
    onChange(item.name, item);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) {
              updatePosition();
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className={`input-field pr-9 ${className}`}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {loading ? <Loader2 size={14} className="animate-spin text-cyan-400" /> : <MapPin size={14} className="text-slate-400" />}
        </div>
      </div>

      {/* REACT PORTAL DROPDOWN: Floats above all scrollable modals & overflow containers */}
      {open && results.length > 0 && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999,
          }}
          className="bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          {results.map((item) => (
            <button
              key={item.placeId}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-cyan-500/20 border-b border-white/5 last:border-0 transition-colors flex items-start gap-2.5 group"
            >
              {item.type === 'university' || item.type === 'college' || item.type === 'school' ? (
                <School size={15} className="text-amber-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
              ) : item.type === 'bus_stop' || item.type === 'station' ? (
                <Navigation size={15} className="text-cyan-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
              ) : (
                <Building2 size={15} className="text-indigo-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300">{item.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.displayName}</p>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// Real OSRM Road Distance & Duration Calculator
export async function calculateRoadRoute(
  waypoints: Array<{ lat: number; lng: number }>
): Promise<{ totalDistanceKm: number; totalDurationMin: number; legDistancesKm: number[] }> {
  const validWaypoints = waypoints.filter((w) => w && w.lat && w.lng);

  if (validWaypoints.length < 2) {
    return { totalDistanceKm: 0, totalDurationMin: 0, legDistancesKm: [] };
  }

  try {
    const coordsString = validWaypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`);

    if (res.data?.code === 'Ok' && res.data.routes?.[0]) {
      const route = res.data.routes[0];
      const totalDistanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const totalDurationMin = Math.round(route.duration / 60);

      const legDistancesKm = (route.legs || []).map((leg: any) => Math.round((leg.distance / 1000) * 10) / 10);

      return { totalDistanceKm, totalDurationMin, legDistancesKm };
    }
  } catch (err) {
    console.warn('OSRM Routing API failed, falling back to Haversine calculation:', err);
  }

  let totalKm = 0;
  const legKm: number[] = [];

  for (let i = 0; i < validWaypoints.length - 1; i++) {
    const d = calculateHaversineDistanceKm(
      validWaypoints[i].lat,
      validWaypoints[i].lng,
      validWaypoints[i + 1].lat,
      validWaypoints[i + 1].lng
    );
    legKm.push(d);
    totalKm += d;
  }

  totalKm = Math.round(totalKm * 10) / 10;
  const totalMin = Math.round((totalKm / 25) * 60);

  return { totalDistanceKm: totalKm, totalDurationMin: totalMin, legDistancesKm: legKm };
}

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.25 * 10) / 10;
}

export const calculateDistanceKm = calculateHaversineDistanceKm;
