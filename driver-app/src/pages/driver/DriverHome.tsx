import { useState } from 'react';
import { Play, Square, Clock, Route as RouteIcon, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';

export default function DriverHome() {
  const [isTripActive, setIsTripActive] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  const toggleTrip = () => {
    if (!isTripActive) {
      toast.success('Trip started! Telemetry is now active.');
      setIsTripActive(true);
    } else {
      toast.success('Trip ended successfully.');
      setIsTripActive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  const user = profileData?.data;
  const driver = user?.driver;
  const bus = driver?.bus;
  const route = bus?.route;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full">
      <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
        <h2 className="text-2xl font-bold text-slate-100">Welcome back, {user?.firstName || 'Driver'}!</h2>
        <p className="text-slate-400">Your current shift status.</p>
      </div>

      {!route ? (
        <div className="glass-card p-6 rounded-2xl border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center gap-4 mt-10">
          <AlertCircle size={48} className="text-amber-400" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">No Route Assigned</h3>
            <p className="text-slate-400 text-sm">You are currently not assigned to a bus or route. Please contact the transport admin.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl border-indigo-500/20 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <RouteIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Route {route.routeNumber}</h3>
                <p className="text-sm text-slate-400">{route.source} to {route.destination}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span>Bus Assigned:</span>
              </div>
              <span className="font-bold text-slate-200">{bus.busNumber}</span>
            </div>
          </div>

          <div className="mt-auto pb-6">
            <button
              onClick={toggleTrip}
              className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all touch-manipulation active:scale-95 ${
                isTripActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isTripActive ? <Square fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
              {isTripActive ? 'END TRIP' : 'START TRIP'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
