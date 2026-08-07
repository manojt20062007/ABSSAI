import { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, Scan, Bus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export default function StudentScanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isScanning) return;

    // Use a unique ID for the scanner container
    const scannerId = 'qr-reader';
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning once we have a result
        scanner.clear();
        setIsScanning(false);
        setScanResult(decodedText);
        processScan(decodedText);
      },
      (errorMessage) => {
        // Ignore continuous stream of errors when no QR code is in frame
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isScanning]);

  const processScan = async (busIdOrPayload: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Parse payload
      let parsedBusId = busIdOrPayload;
      try {
        const payload = JSON.parse(busIdOrPayload);
        if (payload.busId) parsedBusId = payload.busId;
      } catch (e) {}

      // Get user location
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser.');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }).catch(err => {
        throw new Error('Please enable Location Services to board the bus.');
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const response = await api.post('/boarding/scan', { 
        busId: parsedBusId,
        lat,
        lng
      });
      
      toast.success('Boarding successful!');
      // Keep showing the success screen
    } catch (err: any) {
      console.error('Scan Error:', err);
      setError(err.message || err.response?.data?.message || 'Failed to record boarding. Please try again.');
      setScanResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto p-4">
      <div className="text-center space-y-2 mt-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
          <Scan size={24} className="text-emerald-400" />
          Scan to Board
        </h2>
        <p className="text-slate-400">Point your camera at the QR code inside the bus.</p>
      </div>

      <div className="flex-1 flex flex-col items-center">
        {/* Scanner View */}
        {isScanning && (
          <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative p-4">
            <div id="qr-reader" className="w-full rounded-2xl overflow-hidden bg-black aspect-square"></div>
            
            <div className="absolute inset-0 pointer-events-none border-[12px] border-emerald-500/20 rounded-3xl mix-blend-screen" />
          </div>
        )}

        {/* Processing State */}
        {isProcessing && !scanResult && (
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center max-w-md w-full border-emerald-500/30">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-200">Verifying Digital Pass...</h3>
          </div>
        )}

        {/* Success State */}
        {scanResult && !error && !isProcessing && (
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center max-w-md w-full border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-emerald-400" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2">Verified!</h3>
            <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm mb-6">Attendance Recorded</p>
            
            <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <Bus size={24} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Bus ID</span>
                <span className="text-sm text-slate-300 font-mono">{scanResult.substring(0, 15)}...</span>
              </div>
            </div>

            <button 
              onClick={resetScanner}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/30"
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !isProcessing && (
          <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center max-w-md w-full border-red-500/30">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={48} className="text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Scan Failed</h3>
            <p className="text-red-400/80 text-sm mb-8">{error}</p>

            <button 
              onClick={resetScanner}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition-all border border-white/5"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
