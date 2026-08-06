import { MapPin, Clock, AlertCircle, Bus } from 'lucide-react';

export default function StudentHome() {
  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full">
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl font-bold text-slate-100">Good Morning, Amit!</h2>
        <p className="text-slate-400">Here is your bus status for today.</p>
      </div>

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
            <span className="text-lg font-bold text-slate-200">Sector 14</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">Bus ETA</span>
            <span className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-emerald-400" />
              12 mins
            </span>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="glass-card p-5 rounded-2xl border-white/5 flex flex-col gap-4">
        <h4 className="font-bold text-slate-200 flex items-center gap-2">
          <MapPin size={18} className="text-indigo-400" />
          Route 423
        </h4>
        <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6 py-2 ml-3">
          <div className="relative">
            <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900" />
            <h5 className="text-sm font-bold text-slate-300">ISBT Depot</h5>
            <p className="text-xs text-slate-500">Started 07:00 AM</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h5 className="text-sm font-bold text-emerald-400">Sector 14 (Your Stop)</h5>
            <p className="text-xs text-slate-500">Expected 07:45 AM</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-slate-600 border-4 border-slate-900" />
            <h5 className="text-sm font-bold text-slate-500">University Campus</h5>
            <p className="text-xs text-slate-600">Expected 08:30 AM</p>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="glass-card p-4 rounded-2xl border-amber-500/20 bg-amber-500/5 flex items-start gap-3 mt-auto">
        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-100">Traffic Delay Notice</h4>
          <p className="text-xs text-amber-200/70 mt-1">
            Heavy traffic reported near Sector 10. Your ETA has been adjusted.
          </p>
        </div>
      </div>
    </div>
  );
}
