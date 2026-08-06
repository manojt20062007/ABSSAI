import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, AlertTriangle, Wrench, Clock, Radio, Info, Megaphone } from 'lucide-react';
import { notificationApi } from '../../services/api';
import { useNotificationStore } from '../../stores';

const typeIcons: Record<string, any> = {
  BUS_DELAY: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  MAINTENANCE: { icon: Wrench, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  SHIFT_CHANGE: { icon: Radio, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  EMERGENCY: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ROUTE_CHANGE: { icon: Info, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  BROADCAST: { icon: Megaphone, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  SYSTEM: { icon: Bell, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ limit: 50 }),
    select: (res) => res.data,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); setUnreadCount(0); },
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell size={24} className="text-amber-400" /> Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-sm">
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16 rounded-lg" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell size={48} className="mx-auto mb-4 text-slate-600" />
            <p>No notifications</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif: any, idx: number) => {
              const typeInfo = typeIcons[notif.type] || typeIcons.SYSTEM;
              const Icon = typeInfo.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-start gap-4 p-4 border-b cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-500/5' : 'hover:bg-white/5'}`}
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => { if (!notif.isRead) markReadMutation.mutate(notif.id); }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: typeInfo.bg }}>
                    <Icon size={18} style={{ color: typeInfo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>{notif.title}</p>
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                  </div>
                  <span className="text-xs text-slate-600 flex-shrink-0 whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
