import { useEffect, useRef } from 'react';
import { useSafetyStore } from '../../stores/safetyStore';
import { SafetyEngine } from '../../services/safety/SafetyEngine';
import { ShieldAlert, Video, Loader2, StopCircle } from 'lucide-react';

export default function DriverRecordingOverlay() {
  const safetyState = useSafetyStore((state) => state.safetyState);
  const recordingTimer = useSafetyStore((state) => state.recordingTimer);
  const activeStream = useSafetyStore((state) => state.activeStream);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Bind live camera feed to video element
  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
    }
  }, [activeStream]);

  if (safetyState !== 'EVIDENCE_CAPTURE' && safetyState !== 'UPLOADING') return null;

  const minutes = Math.floor(recordingTimer / 60);
  const seconds = recordingTimer % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9998] glass-card p-4 rounded-2xl border border-red-500/25 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
      
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {safetyState === 'EVIDENCE_CAPTURE' ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Safety Recording Active</span>
            </>
          ) : (
            <>
              <Loader2 className="animate-spin text-indigo-400" size={14} />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Uploading Evidence...</span>
            </>
          )}
        </div>
        <div className="text-lg font-mono font-bold text-white tracking-widest">{formattedTime}</div>
      </div>

      {/* Live Camera Preview Container (FIX 5) */}
      {safetyState === 'EVIDENCE_CAPTURE' && activeStream && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100" // flip horizontal for front camera
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1">
            <Video size={10} className="text-red-400" />
            FRONT_CAM
          </div>
        </div>
      )}

      {/* Safety Alert Context / Action */}
      <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10 flex items-start gap-3">
        <ShieldAlert className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-200">Incident Event Logged</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
            Emergency audio/video and GPS data are being saved locally and synced to the cloud dashboard.
          </p>
        </div>
      </div>

      {/* Stop Button */}
      {safetyState === 'EVIDENCE_CAPTURE' && (
        <button
          onClick={() => SafetyEngine.stopRecording()}
          className="w-full py-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <StopCircle size={16} />
          Stop & Save Capture
        </button>
      )}
    </div>
  );
}
