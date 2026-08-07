import { MapPin, Clock, AlertCircle, Bus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';

export default function StudentHome() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  const user = profileData?.data;
  const profile = user?.studentProfile;
  const route = profile?.route;
  const boardingPoint = profile?.boardingPoint;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full">
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl font-bold text-slate-100">Good Morning, {user?.firstName}!</h2>
        <p className="text-slate-400">Here is your bus status for today.</p>
      </div>

      {!route ? (
        <div className="glass-card p-6 rounded-3xl mt-4 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle size={48} className="text-amber-400" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">No Route Assigned</h3>
            <p className="text-slate-400 text-sm">Please contact the transport administrator to get assigned to a bus route.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Status Card */}
          <div className="glass-card p-6 rounded-3xl mt-4 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase mb-1 block">Live Status</span>
                <h3 className="text-3xl font-black text-white">ON TIME</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Bus size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Your Stop</span>
                <span className="text-lg font-bold text-slate-200 truncate block max-w-full">{boardingPoint || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Bus ETA</span>
                <span className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock size={16} className="text-emerald-400" />
                  -- mins
                </span>
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="glass-card p-5 rounded-2xl border-white/5 flex flex-col gap-4">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-400" />
              Route {route.routeNumber}
            </h4>
            <p className="text-xs text-slate-400 -mt-2 ml-7">{route.name}</p>
            
            <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6 py-2 ml-3 mt-2">
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900" />
                <h5 className="text-sm font-bold text-slate-300">{route.source}</h5>
                <p className="text-xs text-slate-500">Source</p>
              </div>
              {boardingPoint && (
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <h5 className="text-sm font-bold text-emerald-400">{boardingPoint}</h5>
                  <p className="text-xs text-slate-500">Your Boarding Point</p>
                </div>
              )}
              <div className="relative">
                <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-slate-600 border-4 border-slate-900" />
                <h5 className="text-sm font-bold text-slate-500">{route.destination}</h5>
                <p className="text-xs text-slate-600">Destination</p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
