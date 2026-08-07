import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, FileSpreadsheet, ChevronDown, ChevronUp, Users, Bus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [startDate]);

  const fetchTrips = async () => {
    try {
      const res = await api.get(`/trips/daily-report?date=${startDate}`);
      setTrips(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch daily report data');
    }
  };

  const toggleTrip = (id: string) => {
    setExpandedTripId(expandedTripId === id ? null : id);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Daily Operations Report - ${startDate}`, 14, 15);

    const tableData: any[] = [];

    trips.forEach(trip => {
      // Add Trip Header Row
      tableData.push([
        { content: `TRIP: ${trip.bus?.busNumber} | Route ${trip.route?.routeNumber} | Driver: ${trip.driver?.user?.firstName} ${trip.driver?.user?.lastName}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
      ]);
      tableData.push(['Student ID', 'Student Name', 'Boarding Status', 'Time']);

      // Add Students
      if (trip.boardingLogs && trip.boardingLogs.length > 0) {
        trip.boardingLogs.forEach((log: any) => {
          tableData.push([
            log.student?.studentId || 'N/A',
            `${log.student?.user?.firstName} ${log.student?.user?.lastName}`,
            log.status,
            new Date(log.timestamp).toLocaleTimeString()
          ]);
        });
      } else {
        tableData.push([{ content: 'No students boarded on this trip', colSpan: 4, styles: { halign: 'center', fontStyle: 'italic' } }]);
      }
    });

    (doc as any).autoTable({
      startY: 25,
      head: [],
      body: tableData,
      theme: 'grid',
    });

    doc.save(`Operations_Report_${startDate}.pdf`);
    toast.success('PDF Exported Successfully');
  };

  const exportExcel = () => {
    const exportData: any[] = [];

    trips.forEach(trip => {
      if (trip.boardingLogs && trip.boardingLogs.length > 0) {
        trip.boardingLogs.forEach((log: any) => {
          exportData.push({
            'Date': startDate,
            'Bus Number': trip.bus?.busNumber,
            'Route': trip.route?.routeNumber,
            'Driver Name': `${trip.driver?.user?.firstName} ${trip.driver?.user?.lastName}`,
            'Trip Start Time': new Date(trip.actualDeparture).toLocaleTimeString(),
            'Student ID': log.student?.studentId,
            'Student Name': `${log.student?.user?.firstName} ${log.student?.user?.lastName}`,
            'Boarding Status': log.status,
            'Boarding Time': new Date(log.timestamp).toLocaleTimeString()
          });
        });
      } else {
        exportData.push({
          'Date': startDate,
          'Bus Number': trip.bus?.busNumber,
          'Route': trip.route?.routeNumber,
          'Driver Name': `${trip.driver?.user?.firstName} ${trip.driver?.user?.lastName}`,
          'Trip Start Time': trip.actualDeparture ? new Date(trip.actualDeparture).toLocaleTimeString() : 'N/A',
          'Student ID': 'NO STUDENTS',
          'Student Name': 'NO STUDENTS',
          'Boarding Status': 'N/A',
          'Boarding Time': 'N/A'
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Report");
    XLSX.writeFile(workbook, `Operations_Report_${startDate}.xlsx`);
    toast.success('Excel Exported Successfully');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText size={24} className="text-indigo-400" /> Daily Operations & Boarding Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">View detailed trip history, driver assignments, and student boarding logs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button onClick={exportPDF} className="btn-primary flex items-center gap-2">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Date</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                className="input-field pl-10" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {trips.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Bus size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-300">No Trips Found</h3>
              <p className="text-slate-500 text-sm">There are no recorded trips for the selected date.</p>
            </div>
          ) : (
            trips.map(trip => (
              <div key={trip.id} className="border border-white/10 rounded-xl overflow-hidden bg-slate-800/50">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleTrip(trip.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Bus size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-200">{trip.bus?.busNumber}</h4>
                        <p className="text-xs text-slate-400">Route {trip.route?.routeNumber}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-xs text-slate-400">Driver</p>
                      <p className="text-sm font-medium text-slate-200">{trip.driver?.user?.firstName} {trip.driver?.user?.lastName}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-400">Start Time</p>
                      <p className="text-sm font-medium text-slate-200">
                        {trip.actualDeparture ? new Date(trip.actualDeparture).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-400">Students Boarded</p>
                      <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                        <Users size={14} /> {trip.boardingLogs?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div>
                    {expandedTripId === trip.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                  </div>
                </div>

                {expandedTripId === trip.id && (
                  <div className="p-4 border-t border-white/5 bg-slate-900/50">
                    <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-indigo-400" /> Boarding Logs
                    </h5>
                    
                    {trip.boardingLogs && trip.boardingLogs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-black/20">
                              <th className="p-3">Student ID</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Time</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {trip.boardingLogs.map((log: any) => (
                              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-3 font-medium text-slate-300">{log.student?.studentId || 'N/A'}</td>
                                <td className="p-3">{log.student?.user?.firstName} {log.student?.user?.lastName}</td>
                                <td className="p-3 flex items-center gap-2 text-slate-400">
                                  <Clock size={14} /> {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    log.status === 'BOARDED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic py-2">No students recorded boarding on this trip.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
