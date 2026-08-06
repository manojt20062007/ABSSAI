import { useState } from 'react';
import { Play, Square, Clock, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DriverHome() {
  const [isTripActive, setIsTripActive] = useState(false);

  const toggleTrip = () => {
    if (!isTripActive) {
      toast.success('Trip started! Telemetry is now active.');
      setIsTripActive(true);
    } else {
      toast.success('Trip ended successfully.');
      setIsTripActive(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full">
      <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
        <h2 className="text-2xl font-bold text-slate-100">Welcome back, Driver!</h2>
        <p className="text-slate-400">Your next scheduled route is ready.</p>
      </div>

      <div className="glass-card p-5 rounded-2xl border-indigo-500/20 flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <RouteIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Route 423</h3>
            <p className="text-sm text-slate-400">ISBT to Nehru Place</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={16} />
            <span>Scheduled Start:</span>
          </div>
          <span className="font-bold text-slate-200">08:00 AM</span>
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
    </div>
  );
}
