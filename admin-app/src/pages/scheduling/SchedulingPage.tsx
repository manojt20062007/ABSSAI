import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Play, Loader2, Brain, Clock, Bus, Users, TrendingUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { scheduleApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function SchedulingPage() {
  const queryClient = useQueryClient();
  const [generateDate, setGenerateDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => scheduleApi.getAll({ limit: 20 }),
    select: (res) => res.data,
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => scheduleApi.generate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const predictMutation = useMutation({
    mutationFn: (data: any) => scheduleApi.predictDemand(data),
    onSuccess: (res) => { setPredictions(res.data.data); setShowPredictions(true); },
  });

  const schedules = schedulesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar size={24} className="text-indigo-400" /> AI Schedule Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate optimized bus schedules using genetic algorithms</p>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Brain size={16} className="text-purple-400" /> Generate Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Schedule Date</label>
              <input type="date" value={generateDate} onChange={(e) => setGenerateDate(e.target.value)}
                className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Driver Hours</label>
                <input type="number" defaultValue={8} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Trips/Bus</label>
                <input type="number" defaultValue={12} className="input-field" />
              </div>
            </div>
            <button
              onClick={() => generateMutation.mutate({ date: generateDate })}
              disabled={generateMutation.isPending}
              className="btn-primary w-full justify-center py-3"
            >
              {generateMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Optimizing (GA running)...</>
              ) : (
                <><Play size={16} /> Generate Optimized Schedule</>
              )}
            </button>
          </div>

          {generateMutation.isSuccess && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                <CheckCircle2 size={16} /> Schedule Generated!
              </div>
              {generateMutation.data?.data?.data?.metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Trips: {generateMutation.data.data.data.metrics.totalTrips}</span>
                  <span>Buses: {generateMutation.data.data.data.metrics.busesUsed}</span>
                  <span>Drivers: {generateMutation.data.data.data.metrics.driversUsed}</span>
                  <span>Fitness: {generateMutation.data.data.data.metrics.fitness?.toFixed(1)}</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" /> Demand Prediction
          </h3>
          <p className="text-xs text-slate-400 mb-4">AI-powered passenger demand forecasting to optimize frequency allocation.</p>
          <button
            onClick={() => predictMutation.mutate({ date: generateDate })}
            disabled={predictMutation.isPending}
            className="btn-secondary w-full justify-center"
          >
            {predictMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <><Brain size={16} /> Run Demand Prediction</>}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Optimization Rules</h3>
          <div className="space-y-2 text-xs text-slate-400">
            {[
              'Max 8 driving hours per driver',
              'Max 12 trips per bus per day',
              'Extra buses during peak hours (7-10 AM, 5-8 PM)',
              'Balanced workload among drivers',
              'Skip buses under maintenance',
              '30-min breaks between shifts',
              'Minimize fuel consumption',
              'Cover all active routes',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Predictions Chart */}
      {showPredictions && predictions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Predicted Passenger Demand</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={predictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey="predictedPassengers" fill="#6366f1" radius={[4, 4, 0, 0]} name="Predicted Passengers" />
              <Bar dataKey="requiredBuses" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Required Buses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Schedules List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-sm font-semibold text-slate-200">Generated Schedules</h3>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-16 rounded-lg" />)}</div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No schedules generated yet</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {schedules.map((sched: any) => (
              <div key={sched.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <Calendar size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{sched.name}</p>
                    <p className="text-xs text-slate-500">{new Date(sched.date).toLocaleDateString()} • {sched.totalTrips} trips</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Bus size={12} /> {sched.busesUsed}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {sched.driversUsed}</span>
                  </div>
                  <span className={`badge ${sched.status === 'ACTIVE' ? 'badge-success' : sched.status === 'PUBLISHED' ? 'badge-info' : 'badge-neutral'}`}>
                    {sched.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
