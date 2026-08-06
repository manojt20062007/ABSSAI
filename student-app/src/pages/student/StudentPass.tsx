import { QrCode, User, Calendar, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores';

export default function StudentPass() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">My Boarding Pass</h2>
        
        {/* Ticket Container */}
        <div className="relative w-full rounded-[2rem] bg-gradient-to-b from-indigo-500 to-purple-600 shadow-2xl overflow-hidden p-1">
          {/* Inner Card */}
          <div className="bg-slate-900 rounded-[1.8rem] h-full w-full flex flex-col">
            
            {/* Header / User Info */}
            <div className="p-6 pb-8 border-b border-white/10 relative">
              {/* Notches for ticket effect */}
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#0a0a0f] rounded-full" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#0a0a0f] rounded-full" />
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center overflow-hidden">
                  <User size={32} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-indigo-400 text-sm font-medium">Student • ID: {user?.studentProfile?.studentId || 'N/A'}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {user?.studentProfile?.department || 'Dept'} • {user?.studentProfile?.year || 'Year'} • Sec {user?.studentProfile?.section || 'X'}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section (Route) */}
            <div className="px-8 py-6 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center max-w-[80px]">
                  <span className="text-2xl font-black text-slate-200 truncate block">
                    {user?.studentProfile?.boardingPoint?.substring(0, 4)?.toUpperCase() || 'ISBT'}
                  </span>
                  <span className="text-xs text-slate-500 block mt-1 uppercase tracking-wider truncate" title={user?.studentProfile?.boardingPoint}>
                    {user?.studentProfile?.boardingPoint || 'Depot'}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center px-4 relative">
                  <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500 to-indigo-500/0"></div>
                  <BusIcon className="absolute text-indigo-400 bg-slate-900 px-2" />
                </div>
                <div className="text-center max-w-[80px]">
                  <span className="text-2xl font-black text-emerald-400 truncate block">
                    {user?.studentProfile?.destination?.substring(0, 6)?.toUpperCase() || 'SEC-14'}
                  </span>
                  <span className="text-xs text-emerald-500/70 block mt-1 uppercase tracking-wider truncate" title={user?.studentProfile?.destination}>
                    {user?.studentProfile?.destination || 'Dest'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Route No.</span>
                  <span className="text-slate-200 font-bold">Assigned</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block mb-1">Valid Thru</span>
                  <span className="text-slate-200 font-bold flex items-center gap-1 justify-end">
                    <Calendar size={14} className="text-indigo-400" />
                    {user?.studentProfile?.validUntil ? new Date(user.studentProfile.validUntil).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Dec 2026'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section (QR Code) */}
            <div className="bg-white p-8 rounded-b-[1.7rem] flex flex-col items-center justify-center gap-4 border-t-2 border-dashed border-slate-300">
              <div className="p-2 border-4 border-slate-900 rounded-2xl bg-white shadow-lg">
                {/* Mock QR Code using Lucide Icon for aesthetic */}
                <QrCode size={160} strokeWidth={1} className="text-slate-900" />
              </div>
              <div className="flex items-center gap-2 text-slate-500 mt-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-xs font-bold tracking-widest uppercase">Verified Pass</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function BusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 6v6" />
      <path d="M15 6v6" />
      <path d="M2 12h19.6" />
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
      <circle cx="7" cy="18" r="2" />
      <path d="M9 18h5" />
      <circle cx="16" cy="18" r="2" />
    </svg>
  );
}
