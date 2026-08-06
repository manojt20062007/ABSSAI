import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Plus, Search, Filter, Edit, Trash2, Eye, X, Loader2, QrCode, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { busApi } from '../../services/api';

const statusColors: Record<string, string> = {
  ACTIVE: 'badge-success', INACTIVE: 'badge-neutral', MAINTENANCE: 'badge-warning', BREAKDOWN: 'badge-danger',
};

const fuelTypeColors: Record<string, string> = {
  DIESEL: 'badge-neutral', CNG: 'badge-info', ELECTRIC: 'badge-success', HYBRID: 'badge-warning',
};

export default function BusListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editBus, setEditBus] = useState<any>(null);
  const [qrBus, setQrBus] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['buses', page, search, statusFilter],
    queryFn: () => busApi.getAll({ page, limit: 10, search, status: statusFilter || undefined }),
    select: (res) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => busApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  });

  const buses = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bus size={24} className="text-indigo-400" /> Bus Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total} buses in fleet</p>
        </div>
        <button onClick={() => { setEditBus(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Bus
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by bus number, model..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-auto min-w-[150px]">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="BREAKDOWN">Breakdown</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-lg" />)}
          </div>
        ) : buses.length === 0 ? (
          <div className="p-12 text-center">
            <Bus size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">No buses found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4"><Plus size={16} /> Add First Bus</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bus Number</th>
                  <th>Registration</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Fuel</th>
                  <th>Depot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus: any, idx: number) => (
                  <motion.tr key={bus.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}>
                    <td className="font-medium text-slate-200">{bus.busNumber}</td>
                    <td className="text-slate-400">{bus.registrationNumber}</td>
                    <td>{bus.model}</td>
                    <td>{bus.capacity}</td>
                    <td><span className={`badge ${fuelTypeColors[bus.fuelType]}`}>{bus.fuelType}</span></td>
                    <td className="text-slate-400">{bus.depot?.name || '—'}</td>
                    <td><span className={`badge ${statusColors[bus.status]}`}>{bus.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setQrBus(bus); setShowQRModal(true); }} title="View QR Code"
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <QrCode size={14} />
                        </button>
                        <button onClick={() => { setEditBus(bus); setShowModal(true); }} title="Edit Bus"
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { if (confirm('Delete this bus?')) deleteMutation.mutate(bus.id); }}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="text-sm text-slate-400">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-xs py-1.5 px-3">Previous</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <BusFormModal bus={editBus} onClose={() => setShowModal(false)} />
        )}
        {showQRModal && qrBus && (
          <BusQRModal bus={qrBus} onClose={() => { setShowQRModal(false); setQrBus(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BusFormModal({ bus, onClose }: { bus: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    busNumber: bus?.busNumber || '',
    registrationNumber: bus?.registrationNumber || '',
    capacity: bus?.capacity || 55,
    model: bus?.model || '',
    manufacturer: bus?.manufacturer || '',
    fuelType: bus?.fuelType || 'DIESEL',
    mileage: bus?.mileage || 0,
    status: bus?.status || 'ACTIVE',
    gpsDeviceId: bus?.gpsDeviceId || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (bus) {
        await busApi.update(bus.id, formData);
      } else {
        await busApi.create(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        style={{ background: 'rgba(17,17,24,0.95)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{bus ? 'Edit Bus' : 'Add New Bus'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Bus Number</label>
              <input value={formData.busNumber} onChange={(e) => setFormData({...formData, busNumber: e.target.value})}
                className="input-field" placeholder="DL1PC-1001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Registration Number</label>
              <input value={formData.registrationNumber} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                className="input-field" placeholder="DL-1P-C-1001" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
              <input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="input-field" placeholder="Tata Starbus" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Manufacturer</label>
              <input value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="input-field" placeholder="Tata Motors" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Capacity</label>
              <input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fuel Type</label>
              <select value={formData.fuelType} onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                className="input-field">
                <option value="DIESEL">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="input-field">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mileage (km/l)</label>
              <input type="number" step="0.1" value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: Number(e.target.value)})}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">GPS Device ID</label>
              <input value={formData.gpsDeviceId} onChange={(e) => setFormData({...formData, gpsDeviceId: e.target.value})}
                className="input-field" placeholder="GPS-0001" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : bus ? 'Update Bus' : 'Add Bus'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function BusQRModal({ bus, onClose }: { bus: any; onClose: () => void }) {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-code-${bus.id}`);
    if (!svg) return;
    
    // Simple way to download SVG as PNG using a canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Add white background padding for the printed code
    const padding = 40;
    const qrSize = 256;
    canvas.width = qrSize + (padding * 2);
    canvas.height = qrSize + (padding * 2) + 60; // Extra height for text

    img.onload = () => {
      if (!ctx) return;
      
      // Draw white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR Code
      ctx.drawImage(img, padding, padding);
      
      // Draw Text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`BUS: ${bus.registrationNumber}`, canvas.width / 2, canvas.height - 30);
      
      // Trigger download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `bus-qr-${bus.registrationNumber}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-sm overflow-hidden"
        style={{ background: 'rgba(17,17,24,0.95)' }}>
        
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode size={18} className="text-emerald-400" /> 
            Bus QR Code
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center bg-slate-900/50">
          <div className="bg-white p-4 rounded-2xl shadow-xl shadow-emerald-500/10">
            <QRCodeSVG 
              id={`qr-code-${bus.id}`}
              value={bus.id} 
              size={256}
              level={"H"}
              includeMargin={false}
              fgColor={"#0f172a"}
            />
          </div>
          
          <div className="mt-6 text-center">
            <h3 className="text-2xl font-black text-white">{bus.registrationNumber}</h3>
            <p className="text-emerald-400 font-mono mt-1 bg-emerald-500/10 px-3 py-1 rounded-full text-sm inline-block">
              {bus.busNumber}
            </p>
          </div>
          
          <p className="text-xs text-slate-500 text-center mt-4 max-w-xs">
            Print and place this QR code inside the bus. Students will scan it to board.
          </p>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3 bg-slate-900/80">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
          <button onClick={downloadQR} className="btn-primary flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white border-none">
            <Download size={16} /> Download
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
