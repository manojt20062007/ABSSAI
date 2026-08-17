import { useSafetyStore } from '../../stores/safetyStore';
import { SafetyEngine } from '../../services/safety/SafetyEngine';
import { AlertTriangle, ShieldCheck, Wrench, AlertOctagon } from 'lucide-react';

export default function DriverSafetyAlert() {
  const safetyState = useSafetyStore((state) => state.safetyState);
  const alertTimer = useSafetyStore((state) => state.alertTimer);

  if (safetyState !== 'AWAITING_RESPONSE') return null;

  const minutes = Math.floor(alertTimer / 60);
  const seconds = alertTimer % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-red-500/30 shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-red-500/15 rounded-full blur-3xl animate-pulse" />
        
        {/* Warning Icon */}
        <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_25px_rgba(239,68,68,0.3)] border border-red-500/40">
          <AlertTriangle size={40} />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">5-Minute Stop Alert</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            Your bus has been stationary for over 5 minutes. Please respond within <strong className="text-red-400">60 seconds</strong> to confirm your safety.
          </p>
          <p className="text-[11px] text-slate-400 italic">
            If you do not respond, camera & mic will automatically record evidence and alert Transport Admin.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-3 flex flex-col items-center w-full">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Auto Camera Recording in</span>
          <span className="text-4xl font-black text-red-500 font-mono tracking-wider mt-1">{formattedTime}</span>
        </div>

        {/* Actions Button Grid */}
        <div className="flex flex-col w-full gap-2.5 mt-1">
          {/* I'm OK */}
          <button
            onClick={() => SafetyEngine.respond('IM_OK')}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm rounded-2xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            I'M OK (Dismiss Alert)
          </button>

          {/* Heavy Traffic Jam */}
          <button
            onClick={() => SafetyEngine.respond('IM_OK')}
            className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 active:scale-95 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 flex items-center justify-center gap-2 transition-all"
          >
            🚗 STUCK IN HEAVY TRAFFIC (Snooze Alert)
          </button>

          {/* Vehicle Problem */}
          <button
            onClick={() => SafetyEngine.respond('VEHICLE_PROBLEM')}
            className="w-full py-3.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 font-bold text-sm rounded-2xl transition-all border border-amber-500/30 flex items-center justify-center gap-2"
          >
            <Wrench size={18} />
            VEHICLE PROBLEM
          </button>

          {/* Emergency Panic */}
          <button
            onClick={() => SafetyEngine.respond('EMERGENCY')}
            className="w-full py-3.5 bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-400 font-bold text-sm rounded-2xl transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <AlertOctagon size={18} className="animate-pulse" />
            EMERGENCY / PANIC
          </button>
        </div>
      </div>
    </div>
  );
}
