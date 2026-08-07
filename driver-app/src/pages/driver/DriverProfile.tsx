import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores';
import { authApi } from '../../services/api';
import { toast } from 'sonner';
import {
  UserCircle, Mail, Phone, Truck, IdCard,
  LogOut, Save, Loader2, Camera
} from 'lucide-react';

export default function DriverProfile() {
  const { user, logout, updateUser } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const profile = res.data.data;
        if (profile.phone) setPhone(profile.phone);
        updateUser(profile);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ phone });
      updateUser({ phone } as any);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-xl shadow-indigo-500/20">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg hover:bg-indigo-600 transition-colors">
            <Camera size={14} />
          </button>
        </div>

        <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
        <p className="text-sm text-indigo-400 font-medium mt-1">Driver</p>
      </motion.div>

      {/* Read-Only Driver Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Driver Information</h3>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <IdCard size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-sm font-medium text-slate-200">{user?.firstName} {user?.lastName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Truck size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Role</p>
            <p className="text-sm font-medium text-slate-200">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </motion.div>

      {/* Editable Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5 space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Mail size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-200">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Phone size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Phone Number</p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="input-field text-sm py-2"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors active:scale-[0.98]"
        >
          <LogOut size={18} /> Logout
        </button>
      </motion.div>
    </div>
  );
}
