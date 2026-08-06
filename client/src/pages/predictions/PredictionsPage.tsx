import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, AlertCircle, RefreshCw, Calendar, CloudSun, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';

const hourlyDemandData = [
  { hour: '06:00', passengers: 450, recommendedBuses: 12, currentBuses: 10 },
  { hour: '07:00', passengers: 1200, recommendedBuses: 24, currentBuses: 18 },
  { hour: '08:00', passengers: 2400, recommendedBuses: 38, currentBuses: 30 },
  { hour: '09:00', passengers: 2100, recommendedBuses: 35, currentBuses: 30 },
  { hour: '10:00', passengers: 1400, recommendedBuses: 25, currentBuses: 22 },
  { hour: '11:00', passengers: 950, recommendedBuses: 18, currentBuses: 18 },
  { hour: '12:00', passengers: 850, recommendedBuses: 16, currentBuses: 18 },
  { hour: '13:00', passengers: 900, recommendedBuses: 16, currentBuses: 16 },
  { hour: '14:00', passengers: 1100, recommendedBuses: 20, currentBuses: 18 },
  { hour: '15:00', passengers: 1350, recommendedBuses: 22, currentBuses: 20 },
  { hour: '16:00', passengers: 1800, recommendedBuses: 30, currentBuses: 26 },
  { hour: '17:00', passengers: 2600, recommendedBuses: 42, currentBuses: 32 },
  { hour: '18:00', passengers: 2500, recommendedBuses: 40, currentBuses: 32 },
  { hour: '19:00', passengers: 1900, recommendedBuses: 30, currentBuses: 28 },
  { hour: '20:00', passengers: 1200, recommendedBuses: 20, currentBuses: 20 },
  { hour: '21:00', passengers: 700, recommendedBuses: 12, currentBuses: 14 },
];

const routeInsights = [
  { route: 'Route 101 (ISBT to Connaught Place)', surge: '+34%', factor: 'Peak Office Rush', action: 'Add 4 Express Buses (8:00 - 9:30 AM)' },
  { route: 'Route 204 (Anand Vihar to Dhaula Kuan)', surge: '+18%', factor: 'Metro Inter-change Peak', action: 'Decrease Frequency Interval to 6 mins' },
  { route: 'Route 305 (Janakpuri to ITO)', surge: '-12%', factor: 'Road Maintenance Bypass', action: 'Re-route via Ring Road' },
  { route: 'Route 412 (Kashmere Gate to Nehru Place)', surge: '+25%', factor: 'Festival Shoppers Surge', action: 'Deploy Electric Double Deckers' },
];

export default function PredictionsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Tomorrow');

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain size={24} className="text-purple-400" /> AI Demand Forecasting & Insights
          </h1>
          <p className="text-sm text-slate-400 mt-1">Predictive analytics engine using machine learning for passenger load & fleet optimization</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="input-field w-auto">
            <option value="Today">Today (Real-time Model)</option>
            <option value="Tomorrow">Tomorrow Forecast</option>
            <option value="Next 7 Days">Next 7 Days Trend</option>
          </select>
          <button onClick={triggerRefresh} disabled={isRefreshing} className="btn-secondary">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Recalculate AI Model
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Predicted Peak Demand</span>
            <Users size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">2,600 / hr</div>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> Expected at 17:00 PM
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Recommended Extra Fleet</span>
            <Sparkles size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">+10 Buses</div>
          <p className="text-xs text-slate-400 mt-1">To maintain &lt; 5 min wait time</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Model Accuracy Score</span>
            <Brain size={16} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">96.4%</div>
          <p className="text-xs text-green-400 mt-1">+1.2% higher vs historical avg</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="kpi-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Weather & External Factor</span>
            <CloudSun size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">Mild Rain (15%)</div>
          <p className="text-xs text-amber-400 mt-1">+5% surge expected on Ring Road</p>
        </motion.div>
      </div>

      {/* Demand Chart */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400" /> Hourly Passenger Demand & Recommended vs Active Bus Count
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyDemandData}>
            <defs>
              <linearGradient id="passengerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }} />
            <Legend iconType="circle" />
            <Area yAxisId="left" type="monotone" dataKey="passengers" stroke="#a855f7" fill="url(#passengerGrad)" strokeWidth={2} name="Predicted Passengers" />
            <Bar yAxisId="right" dataKey="recommendedBuses" fill="#0ea5e9" opacity={0.8} name="Recommended Buses" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="currentBuses" fill="#64748b" opacity={0.5} name="Currently Scheduled" radius={[4, 4, 0, 0]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AI Recommendations Cards */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" /> Automated Route Optimization Prescriptions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routeInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl flex items-start gap-4 border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 shrink-0 font-bold text-sm">
                {insight.surge}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-slate-200">{insight.route}</h4>
                <p className="text-xs text-slate-400"><span className="text-slate-500">Reason:</span> {insight.factor}</p>
                <div className="pt-1 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <AlertCircle size={14} /> AI Recommendation: {insight.action}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
