import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Edit, MapPin, Route as RouteIcon, Bus as BusIcon, X, Loader2 } from 'lucide-react';
import { studentApi, routeApi } from '../../services/api';

export default function StudentListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search],
    queryFn: () => studentApi.getAll({ page, limit: 10, search }),
    select: (res) => res.data,
  });

  const students = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={24} className="text-cyan-400" /> Student Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{meta.total} students registered</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ID, name, department..." 
            className="input-field pl-10" 
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700/50">
                <th className="p-4 text-sm font-semibold text-slate-300">Student Info</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Department</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Assigned Route</th>
                <th className="p-4 text-sm font-semibold text-slate-300">Boarding Point</th>
                <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-200">
                        {student.user.firstName} {student.user.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{student.studentId} • {student.user.email}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {student.department} ({student.year} - {student.section})
                    </td>
                    <td className="p-4">
                      {student.route ? (
                        <span className="badge badge-primary flex items-center gap-1 w-fit">
                          <RouteIcon size={12} /> {student.route.routeNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      {student.boardingPoint ? (
                        <div className="flex items-center gap-1 text-sm text-slate-300">
                          <MapPin size={14} className="text-green-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{student.boardingPoint}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500 italic">Not selected</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setEditStudent(student); setShowModal(true); }}
                        className="btn-secondary py-1.5 px-3 text-sm"
                      >
                        <Edit size={14} /> Assign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <AssignModal 
            student={editStudent} 
            onClose={() => { setShowModal(false); setEditStudent(null); }} 
            onSuccess={() => {
              setShowModal(false);
              setEditStudent(null);
              queryClient.invalidateQueries({ queryKey: ['students'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignModal({ student, onClose, onSuccess }: any) {
  const [routeId, setRouteId] = useState(student?.routeId || '');
  const [boardingPoint, setBoardingPoint] = useState(student?.boardingPoint || '');

  // Fetch all routes
  const { data: routeData, isLoading: routesLoading } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: () => routeApi.getAll({ limit: 100 }),
    select: (res) => res.data?.data || [],
  });

  const selectedRouteObj = routeData?.find((r: any) => r.id === routeId);

  const mutation = useMutation({
    mutationFn: (data: any) => studentApi.updateAssignment(student.id, data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      routeId: routeId || null,
      boardingPoint: boardingPoint || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RouteIcon size={18} className="text-cyan-400" />
            Assign Route & Stop
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <p className="text-sm text-slate-300 mb-4">
              Updating assignment for <strong className="text-white">{student.user.firstName} {student.user.lastName}</strong>
            </p>

            <label className="block text-sm font-medium text-slate-300 mb-1">Select Route</label>
            <select 
              className="input-field"
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                setBoardingPoint(''); // Reset boarding point when route changes
              }}
              disabled={routesLoading}
            >
              <option value="">-- No Route Assigned --</option>
              {routeData?.map((r: any) => (
                <option key={r.id} value={r.id}>{r.routeNumber} - {r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Boarding Point</label>
            <select 
              className="input-field"
              value={boardingPoint}
              onChange={(e) => setBoardingPoint(e.target.value)}
              disabled={!routeId || !selectedRouteObj?.stops?.length}
            >
              <option value="">-- Select Stop --</option>
              {selectedRouteObj?.stops?.map((s: any) => (
                <option key={s.stop.id} value={s.stop.name}>{s.stop.name}</option>
              ))}
            </select>
            {routeId && !selectedRouteObj?.stops?.length && (
              <p className="text-xs text-amber-400 mt-1">This route currently has no configured stops.</p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" /> : 'Save Assignment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
