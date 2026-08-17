import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Route as RouteIcon, AlertCircle, Loader2, Video, Mic, AlertOctagon, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../services/api';
import api from '../../services/api';
import { SafetyEngine } from '../../services/safety/SafetyEngine';
import { useSafetyStore } from '../../stores/safetyStore';

export default function DriverHome() {
  const [isTripActive, setIsTripActive] = useState(false);
  const [isTripPaused, setIsTripPaused] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  const user = profileData?.data;
  const driver = user?.driver;
  const bus = driver?.bus;
  const route = bus?.route;

  const safetyState = useSafetyStore((state) => state.safetyState);
  const stationarySeconds = useSafetyStore((state) => state.stationarySeconds);

  const stopMins = Math.floor(stationarySeconds / 60);
  const stopSecs = stationarySeconds % 60;
  const formattedStopTimer = `${String(stopMins).padStart(2, '0')}:${String(stopSecs).padStart(2, '0')}`;
  const stopProgressPercent = Math.min(100, Math.round((stationarySeconds / 300) * 100));

  // Check active trip on load
  useEffect(() => {
    if (bus && driver) {
      api.get(`/trips/active?busId=${bus.id}`)
        .then(res => {
          const tripData = res.data.data;
          if (tripData) {
            setIsTripActive(true);
            if (tripData.status === 'PAUSED') {
              setIsTripPaused(true);
              SafetyEngine.pause();
            } else {
              setIsTripPaused(false);
              if (route) {
                SafetyEngine.start(tripData.id, bus.id, driver.id, route.id, route.stops || []);
              }
            }
          } else {
            setIsTripActive(false);
            setIsTripPaused(false);
            SafetyEngine.stop();
          }
        })
        .catch(() => {
          setIsTripActive(false);
          setIsTripPaused(false);
          SafetyEngine.stop();
        })
        .finally(() => setIsLoadingTrip(false));
    } else {
      setIsLoadingTrip(false);
    }
  }, [bus, driver, route]);

  const toggleTrip = async () => {
    if (!bus || !driver || !route) return;

    if (!isTripActive) {
      try {
        await api.post('/trips/start-active', { busId: bus.id, driverId: driver.id, routeId: route.id });
        setIsTripActive(true);
        setIsTripPaused(false);
        toast.success('Trip started! Safety Watch Active');

        // Start Safety Engine
        SafetyEngine.start('active-trip', bus.id, driver.id, route.id, route.stops || []);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
            const destination = route.destination; 
            
            let waypoints = '';
            if (route.stops && route.stops.length > 0) {
              const stops = route.stops
                .sort((a: any, b: any) => a.sequence - b.sequence)
                .slice(0, 9)
                .map((s: any) => `${s.stop?.latitude || s.latitude},${s.stop?.longitude || s.longitude}`)
                .filter((s: string) => !s.includes('undefined'))
                .join('|');
              
              if (stops) waypoints = `&waypoints=${stops}`;
            }

            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodeURIComponent(destination)}${waypoints}&travelmode=driving`;
            window.open(gmapsUrl, '_blank');
          });
        }
      } catch (err) {
        toast.error('Failed to start trip.');
      }
    } else {
      try {
        await api.post('/trips/end-active', { busId: bus.id });
        setIsTripActive(false);
        setIsTripPaused(false);
        SafetyEngine.stop();
        toast.success('Trip ended successfully.');
      } catch (err) {
        toast.error('Failed to end trip.');
      }
    }
  };

  const handlePauseTrip = async () => {
    if (!bus) return;
    try {
      await api.post('/trips/pause-active', { busId: bus.id });
      setIsTripPaused(true);
      SafetyEngine.pause();
      toast.info('Trip Paused (Rest / Bathroom break). 5-min stop alert suspended.');
    } catch (err) {
      toast.error('Failed to pause trip.');
    }
  };

  const handleResumeTrip = async () => {
    if (!bus) return;
    try {
      await api.post('/trips/resume-active', { busId: bus.id });
      setIsTripPaused(false);
      SafetyEngine.resume();
      toast.success('Trip Resumed. Safety Watch Active.');
    } catch (err) {
      toast.error('Failed to resume trip.');
    }
  };

  const triggerCameraRecordingTest = () => {
    toast.info('Initiating Camera & Mic Safety Recording...');
    SafetyEngine.start('test-trip', bus?.id || 'BUS-1001', driver?.id || 'DRV-1001', route?.id || 'R-1', route?.stops || []);
    useSafetyStore.getState().setSafetyState('AWAITING_RESPONSE');
    SafetyEngine.respond('EMERGENCY');
  };

  const triggerStopAlertSimulation = () => {
    toast.info('Simulating 5-minute abnormal bus stop...');
    SafetyEngine.start('test-stop-trip', bus?.id || 'BUS-1001', driver?.id || 'DRV-1001', route?.id || 'R-1', route?.stops || []);
    
    // Set state to AWAITING_RESPONSE with 60s countdown
    const store = useSafetyStore.getState();
    store.setSafetyState('DRIVER_ALERTED');
    store.setAlertTimer(60);
    store.setSafetyState('AWAITING_RESPONSE');
  };

  const addCurrentLocationAsStop = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.info('Detecting your current GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await api.post(`/routes/${route.id}/stops`, {
            name: `My Live GPS Stop (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            latitude,
            longitude,
            sequence: (route.stops?.length || 0) + 1,
          });
          toast.success(`Added your live GPS position (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) as a bus stop on Route ${route.routeNumber}!`);
        } catch (err) {
          toast.error('Failed to save current location as bus stop.');
        }
      },
      (err) => {
        toast.error(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  if (isProfileLoading || isLoadingTrip) {
    return (
      <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto p-4 h-full">
      <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5">
        <h2 className="text-2xl font-bold text-slate-100">Welcome back, {user?.firstName || 'Driver'}!</h2>
        <p className="text-xs text-slate-400">Driver Shift & Safety Control Center</p>
      </div>

      {/* NEW FEATURE CARD: Camera & Mic Recording Test & 5-Min Stop Alert */}
      <div className="glass-card p-4 rounded-2xl border-red-500/30 bg-red-500/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <Video size={20} />
            <Mic size={20} />
            <h3 className="font-bold text-sm text-slate-100">Automatic Safety Escalation</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
            {isTripPaused ? 'TRIP PAUSED' : isTripActive ? 'SAFETY WATCH ACTIVE' : 'TRIP IDLE'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          5-minute stop alert runs ONLY while a trip is active. Pause trip anytime for bathroom/rest breaks to suspend safety watch.
        </p>

        {/* Live Developer Stationary Stop Timer */}
        {isTripActive && !isTripPaused && (
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1.5 mt-1 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Clock size={14} className="animate-spin text-amber-400" />
                Live Stationary Timer:
              </span>
              <span className="font-mono font-extrabold text-amber-300 text-sm">
                {formattedStopTimer} / 05:00 ({stationarySeconds}s)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-500" 
                style={{ width: `${stopProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={triggerStopAlertSimulation}
            disabled={safetyState === 'AWAITING_RESPONSE' || safetyState === 'EVIDENCE_CAPTURE'}
            className="py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Clock size={14} className="text-amber-400" />
            Simulate 5-Min Stop
          </button>

          <button
            onClick={triggerCameraRecordingTest}
            disabled={safetyState === 'EVIDENCE_CAPTURE'}
            className="py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs rounded-xl border border-red-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <AlertOctagon size={14} className="text-red-400 animate-pulse" />
            Direct Panic Test
          </button>
        </div>
      </div>

      {!route ? (
        <div className="glass-card p-6 rounded-2xl border-amber-500/20 bg-amber-500/5 flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle size={48} className="text-amber-400" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">No Route Assigned</h3>
            <p className="text-slate-400 text-sm">You are currently not assigned to a bus or route. Please contact the transport admin.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl border-indigo-500/20 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <RouteIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Route {route.routeNumber}</h3>
                  <p className="text-sm text-slate-400">{route.source} to {route.destination}</p>
                </div>
              </div>

              {isTripActive && (
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                  isTripPaused 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isTripPaused ? 'PAUSED' : 'IN PROGRESS'}
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={16} />
                <span>Bus Assigned:</span>
              </div>
              <span className="font-bold text-slate-200">{bus?.busNumber} ({bus?.registrationNumber})</span>
            </div>

            <button
              onClick={addCurrentLocationAsStop}
              className="w-full py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 font-bold text-xs rounded-xl border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all mt-1"
            >
              📍 Add My Current GPS Location as Bus Stop
            </button>
          </div>

          <div className="mt-auto pb-6 flex flex-col gap-3">
            {/* PAUSE / RESUME TRIP BUTTON (When Trip Active) */}
            {isTripActive && (
              <button
                onClick={isTripPaused ? handleResumeTrip : handlePauseTrip}
                className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all touch-manipulation active:scale-95 ${
                  isTripPaused
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isTripPaused ? <Play fill="currentColor" size={18} /> : <Coffee size={18} />}
                {isTripPaused ? 'RESUME TRIP' : 'PAUSE TRIP (Rest / Restroom Break)'}
              </button>
            )}

            {/* START / END TRIP BUTTON */}
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
