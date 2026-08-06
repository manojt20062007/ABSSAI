import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Database, Sliders, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Form State
  const [systemName, setSystemName] = useState('ABSSAI Intelligent Transit Management System');
  const [maxDriverHours, setMaxDriverHours] = useState('8');
  const [minBreakTime, setMinBreakTime] = useState('30');
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [gpsInterval, setGpsInterval] = useState('5');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings size={24} className="text-slate-400" /> System Settings & Configuration
          </h1>
          <p className="text-sm text-slate-400 mt-1">Configure system parameters, optimization engine rules, and alerts</p>
        </div>
      </div>

      <div className="flex border-b border-white/10 gap-4 overflow-x-auto">
        {[
          { id: 'general', label: 'General & Organization', icon: Settings },
          { id: 'optimization', label: 'AI Optimization Parameters', icon: Sliders },
          { id: 'notifications', label: 'Alerts & Telemetry', icon: Bell },
          { id: 'security', label: 'Security & Access Control', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Organization Settings</h3>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs text-slate-400 mb-1">System Display Name</label>
                <input type="text" value={systemName} onChange={(e) => setSystemName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Operating Transit Authority</label>
                <input type="text" defaultValue="Delhi Transport Corporation (DTC)" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Default Currency</label>
                <select className="input-field">
                  <option value="INR">Indian Rupee (₹ INR)</option>
                  <option value="USD">US Dollar ($ USD)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'optimization' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Genetic Algorithm & Constraints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Consecutive Driver Hours</label>
                <input type="number" value={maxDriverHours} onChange={(e) => setMaxDriverHours(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mandatory Rest Period (minutes)</label>
                <input type="number" value={minBreakTime} onChange={(e) => setMinBreakTime(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={autoSchedule} onChange={(e) => setAutoSchedule(e.target.checked)} className="rounded text-indigo-500" />
                Enable Automated Daily Schedule Generation (at 01:00 AM)
              </label>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Telemetry & Alerts Configuration</h3>
            <div className="space-y-3 max-w-xl">
              <div>
                <label className="block text-xs text-slate-400 mb-1">GPS Telemetry Ping Frequency (Seconds)</label>
                <input type="number" value={gpsInterval} onChange={(e) => setGpsInterval(e.target.value)} className="input-field" />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="rounded text-indigo-500" />
                  Email Notifications for Critical Maintenance Alerts
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="rounded text-indigo-500" />
                  SMS Alerts to Drivers for Schedule Changes
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200">Security Policies</h3>
            <div className="space-y-3 max-w-xl">
              <div>
                <label className="block text-xs text-slate-400 mb-1">JWT Session Timeout</label>
                <select className="input-field">
                  <option value="15m">15 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="8h">8 Hours</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="button" className="btn-secondary text-xs text-red-400 border-red-500/20 hover:bg-red-500/10">
                  Revoke All Active User Sessions
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary">
            <Save size={16} /> Save Configurations
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-green-400 flex items-center gap-1 font-medium">
              <CheckCircle2 size={16} /> Settings Saved Successfully!
            </motion.span>
          )}
        </div>
      </form>
    </div>
  );
}
