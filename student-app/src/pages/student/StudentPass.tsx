import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, CheckCircle2, Shield, Calendar, MapPin, Route as RouteIcon, Bus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';

export default function StudentPass() {
  const [flipped, setFlipped] = useState(false);

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

  // Format valid until date
  const validUntilStr = profile?.validUntil 
    ? new Date(profile.validUntil).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'N/A';

  const passData = JSON.stringify({
    studentId: profile?.studentId || 'N/A',
    name: `${user?.firstName} ${user?.lastName}`,
    route: route?.routeNumber || 'N/A',
    valid: profile?.validUntil || new Date().toISOString(),
  });

  return (
    <div className="flex flex-col max-w-lg mx-auto p-4 h-full pb-20 overflow-y-auto">
      <div className="text-center space-y-2 mt-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Digital Pass</h2>
        <p className="text-slate-400 text-sm">Scan this QR code when boarding</p>
      </div>

      {!route ? (
        <div className="glass-card p-8 rounded-3xl border-amber-500/30 flex flex-col items-center justify-center text-center gap-4">
          <Bus size={48} className="text-amber-400 opacity-50" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Pass</h3>
            <p className="text-slate-400 text-sm">You have not been assigned to a bus route yet. Your digital pass will appear here once assigned.</p>
          </div>
        </div>
      ) : (
        <div className="perspective-1000 flex-shrink-0 mb-6">
          <div 
            className={`relative w-full h-[520px] transition-transform duration-700 preserve-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            {/* Front of Pass */}
            <div className="absolute inset-0 backface-hidden rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl flex flex-col">
              {/* Header Pattern */}
              <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-400 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                  <div>
                    <h3 className="text-white font-black tracking-wider text-xl drop-shadow-md">ABSSAI TRANSIT</h3>
                    <p className="text-emerald-100 text-xs font-medium tracking-widest mt-1">STUDENT PASS</p>
                  </div>
                  <Shield className="text-white/80 w-10 h-10 drop-shadow-md" />
                </div>
              </div>

              {/* Profile Photo - Negative Margin to overlap header */}
              <div className="relative px-6 pt-0 flex justify-between items-start -mt-12 z-10 flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 border-slate-800 overflow-hidden bg-slate-700 shadow-xl">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400 font-bold text-3xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div className="mt-14 text-right">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> ACTIVE
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="px-6 mt-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
                <p className="text-slate-400 text-sm font-medium">{profile?.studentId}</p>
                <p className="text-slate-500 text-xs mt-1">{profile?.department} • {profile?.year}</p>
              </div>

              {/* Divider */}
              <div className="mx-6 my-5 border-t border-dashed border-slate-700 flex-shrink-0 relative">
                <div className="absolute -left-8 -top-3 w-6 h-6 bg-slate-950 rounded-full border border-slate-700/50" />
                <div className="absolute -right-8 -top-3 w-6 h-6 bg-slate-950 rounded-full border border-slate-700/50" />
              </div>

              {/* Route Details & QR */}
              <div className="px-6 flex-1 flex flex-col justify-between pb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                        <RouteIcon size={12} /> Assigned Route
                      </p>
                      <p className="text-lg font-bold text-emerald-400">Route {route.routeNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                        <MapPin size={12} /> Boarding Point
                      </p>
                      <p className="text-sm font-bold text-slate-200">{profile?.boardingPoint}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded-xl shadow-inner">
                    <QRCodeSVG 
                      value={passData}
                      size={100}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>
                
                <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-2 mt-auto">
                  Tap to view backside details
                </p>
              </div>
            </div>

            {/* Back of Pass */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] bg-slate-800 border border-slate-700 flex flex-col items-center justify-center p-8 text-center shadow-2xl">
              <Shield className="w-16 h-16 text-emerald-500/50 mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Terms & Conditions</h3>
              <ul className="text-sm text-slate-400 space-y-3 text-left list-disc pl-4 mb-8">
                <li>This pass is non-transferable and valid only for the assigned student.</li>
                <li>Must be presented upon request by transport staff.</li>
                <li>Valid only for the academic year specified.</li>
                <li>Report lost pass immediately to the transport office.</li>
              </ul>
              
              <div className="bg-slate-900/50 p-4 rounded-xl w-full border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                  <Calendar size={12} /> Valid Until
                </p>
                <p className="text-lg font-bold text-emerald-400">{validUntilStr}</p>
              </div>
              
              <p className="text-center text-xs text-slate-500 mt-auto pt-6">Tap to view QR code</p>
            </div>
          </div>
        </div>
      )}

      {route && (
        <div className="flex gap-4 mt-auto">
          <button className="flex-1 glass-card bg-slate-800/80 hover:bg-slate-700/80 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors border border-slate-700/50">
            <Download size={20} className="text-slate-300" />
            <span className="text-xs font-medium text-slate-300">Save Pass</span>
          </button>
          <button className="flex-1 glass-card bg-indigo-500/10 hover:bg-indigo-500/20 py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors border border-indigo-500/20">
            <Share2 size={20} className="text-indigo-400" />
            <span className="text-xs font-medium text-indigo-400">Share Pass</span>
          </button>
        </div>
      )}
    </div>
  );
}
