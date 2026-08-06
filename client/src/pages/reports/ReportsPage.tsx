import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, FileSpreadsheet, FileCode, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

const reportCategories = [
  { id: 'ops', title: 'Daily Operational Summary', desc: 'Trip completion rates, total mileage, active fleet count, and overall efficiency' },
  { id: 'fuel', title: 'Fuel & Mileage Audit', desc: 'Consolidated fuel expenditures, station transactions, and bus-wise mileage' },
  { id: 'driver', title: 'Driver Duty & Attendance Log', desc: 'Shift timings, OT hours, duty completions, and performance score breakdowns' },
  { id: 'punctuality', title: 'On-Time Performance (OTP)', desc: 'Route-wise delay statistics, scheduled vs actual arrival times, and bottleneck stops' },
  { id: 'maint', title: 'Vehicle Maintenance History', desc: 'Inspection status, pending work orders, component health checkup history' },
];

const reportHistory = [
  { name: 'Daily_Operations_Report_2026-08-05.pdf', date: '2026-08-05 23:59', type: 'PDF', size: '2.4 MB', status: 'Ready' },
  { name: 'Fuel_Consumption_Weekly_W31.xlsx', date: '2026-08-04 18:30', type: 'XLSX', size: '1.1 MB', status: 'Ready' },
  { name: 'Driver_Performance_July_2026.csv', date: '2026-08-01 09:00', type: 'CSV', size: '640 KB', status: 'Ready' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('ops');
  const [format, setFormat] = useState('pdf');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Report generated successfully in ${format.toUpperCase()} format!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText size={24} className="text-indigo-400" /> Automated Reports & Data Exports
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate comprehensive compliance, operational, and financial reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Controls */}
        <div className="lg:col-span-2 glass-card p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Filter size={16} className="text-indigo-400" /> Configure Report Parameters
          </h3>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">Select Report Type</label>
            <div className="grid grid-cols-1 gap-3">
              {reportCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedReport(cat.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedReport === cat.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{cat.title}</h4>
                    {selectedReport === cat.id && <CheckCircle2 size={16} className="text-indigo-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date Range</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Export Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="input-field">
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="excel">Excel Spreadsheet (.xlsx)</option>
                <option value="csv">Comma Separated (.csv)</option>
              </select>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary w-full justify-center py-3">
            {isGenerating ? (
              <><RefreshCw size={16} className="animate-spin" /> Compiling Report Data...</>
            ) : (
              <><Download size={16} /> Generate & Download Report</>
            )}
          </button>
        </div>

        {/* Generated Reports Log */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Recent Exports
            </h3>
            <div className="space-y-3">
              {reportHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.date} • {item.size}</p>
                  </div>
                  <button className="btn-secondary text-xs p-2">
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300">
            <p className="font-semibold text-indigo-400 mb-1">💡 Automated Email Delivery</p>
            <p>You can configure automatic daily PDF export delivery to depot superintendents in System Settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
