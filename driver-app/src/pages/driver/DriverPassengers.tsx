import { useState, useEffect } from 'react';
import { Users, UserCheck, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../stores';

interface BoardingLog {
  id: string;
  studentId: string;
  name: string;
  boardingPoint?: string;
  destination?: string;
  timestamp: string;
}

export default function DriverPassengers() {
  const [passengers, setPassengers] = useState(0);
  const [recentLogs, setRecentLogs] = useState<BoardingLog[]>([]);
  const { user } = useAuthStore();
  const maxSeats = 50;

  useEffect(() => {
    // Connect to Socket.IO Server
    const socket: Socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      path: '/socket.io', // If you have proxy setup, or we connect to backend directly if on 3000
    });
    // In our vite setup, /socket.io is proxied to the backend.

    socket.on('connect', () => {
      console.log('Connected to real-time sync');
    });

    // Listen for ALL boarding events (global broadcast) for the MVP 
    // since we don't have a rigid trip-selection flow yet.
    socket.on('passenger_boarded', (data: BoardingLog) => {
      setRecentLogs(prev => [data, ...prev]);
      setPassengers(prev => Math.min(prev + 1, maxSeats));
      
      // Play a success sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handlePassengerChange = (amount: number) => {
    setPassengers(prev => {
      const newCount = prev + amount;
      if (newCount < 0) return 0;
      if (newCount > maxSeats) return maxSeats;
      return newCount;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-2xl mx-auto p-4 gap-6">
      <div className="text-center space-y-2 mt-2">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
          <Users className="text-indigo-400" />
          Live Student Roster
        </h2>
        <p className="text-slate-400">Waiting for students to scan...</p>
      </div>

      {/* Main Counter HUD */}
      <div className="glass-card p-6 rounded-3xl flex justify-between items-center border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-1">On Board</span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-white leading-none">{passengers}</span>
            <span className="text-xl text-slate-500 font-bold">/ {maxSeats}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => handlePassengerChange(1)}
            disabled={passengers >= maxSeats}
            className="w-16 h-16 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 text-emerald-400 rounded-2xl text-3xl font-light transition-all border border-emerald-500/20 active:scale-95 flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => handlePassengerChange(-1)}
            disabled={passengers === 0}
            className="w-16 h-16 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 rounded-2xl text-3xl font-light transition-all border border-red-500/20 active:scale-95 flex items-center justify-center"
          >
            -
          </button>
        </div>
      </div>

      {/* Live Roster List */}
      <div className="flex-1 glass-card rounded-3xl border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-200">Recent Boardings</h3>
          <span className="text-xs text-emerald-400 font-bold animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 block" /> LIVE
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {recentLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-50">
              <UserCheck size={48} />
              <p>No scans yet.</p>
            </div>
          ) : (
            recentLogs.map((log, i) => (
              <div 
                key={log.id || i} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-white/5 animate-in slide-in-from-left-4 fade-in duration-300"
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={24} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-slate-100 font-bold truncate">{log.name}</h4>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{log.studentId}</span>
                    {log.boardingPoint && <span className="text-slate-400 hidden sm:inline">{log.boardingPoint}</span>}
                    <span className="text-slate-500 ml-auto">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
