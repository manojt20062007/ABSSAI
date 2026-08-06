import { useState, useEffect } from 'react';
import { UserCheck, Clock, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../../stores';
import api from '../../services/api';
import { toast } from 'sonner';

export default function DriverAttendance() {
  const { user } = useAuthStore();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/attendance?date=${today}`);
        const records = res.data.data;
        if (records && records.length > 0) {
          const todaysRecord = records[0];
          // If checkOut is null, they are still on duty
          if (!todaysRecord.checkOut) {
            setIsOnDuty(true);
            setLastCheckIn(new Date(todaysRecord.checkIn));
          } else {
            setIsOnDuty(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch attendance status', error);
      }
    };
    fetchStatus();
  }, []);

  const toggleDuty = async () => {
    try {
      if (!isOnDuty) {
        await api.post('/attendance/check-in', { shift: 'MORNING' });
        setLastCheckIn(new Date());
        toast.success('Checked in successfully. Have a safe shift!');
      } else {
        await api.post('/attendance/check-out', {});
        toast.success('Checked out successfully. Shift ended.');
      }
      setIsOnDuty(!isOnDuty);
    } catch (error) {
      toast.error('Failed to update duty status');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto p-4 h-full">
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl font-bold text-slate-100">My Attendance</h2>
        <p className="text-slate-400">Manage your daily shift status</p>
      </div>

      <div className="glass-card p-8 rounded-3xl mt-8 border-indigo-500/20 shadow-xl flex flex-col items-center gap-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
          isOnDuty 
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
            : 'border-slate-700 bg-slate-800 text-slate-500'
        }`}>
          <UserCheck size={64} />
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </h3>
          <p className="text-slate-400 font-medium">
            {isOnDuty && lastCheckIn 
              ? `Since ${lastCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
              : 'You are currently not on a shift.'}
          </p>
        </div>

        <button
          onClick={toggleDuty}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all touch-manipulation active:scale-95 mt-4 ${
            isOnDuty 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
          }`}
        >
          {isOnDuty ? 'CHECK OUT' : 'CHECK IN NOW'}
        </button>
      </div>

      <div className="glass-card p-5 rounded-2xl border-white/5 mt-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
          <CalendarCheck size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-200">Today's Schedule</h4>
          <p className="text-sm text-slate-400">Morning Shift (06:00 - 14:00)</p>
        </div>
      </div>
    </div>
  );
}
